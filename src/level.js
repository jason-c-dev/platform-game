// ============================================================
// level.js — Level data, stage loading, and tile management
// Supports multiple stages keyed by stageId
// ============================================================

const Level = {
    tiles: [],
    width: 0,
    height: 0,
    spawnX: 0,
    spawnY: 0,
    exitX: 0,
    exitY: 0,
    movingPlatforms: [],
    coinPositions: [],
    healthPositions: [],
    enemySpawns: [],
    bossData: null,
    bossArenaX: 0,
    bossTriggered: false,
    crumblingTiles: [],  // {col, row, timer, shaking}
    currentStageId: null,

    init() {
        // Load stage based on current game state
        const stageId = GameState.currentStageId || '1-1';
        this.loadStage(stageId);
    },

    loadStage(stageId) {
        this.currentStageId = stageId;
        this.movingPlatforms = [];
        this.coinPositions = [];
        this.healthPositions = [];
        this.enemySpawns = [];
        this.bossData = null;
        this.bossArenaX = 0;
        this.bossTriggered = false;
        this.crumblingTiles = [];

        switch (stageId) {
            case '1-1': this._buildStage1_1(); break;
            case '1-2': this._buildStage1_2(); break;
            case '1-3': this._buildStage1_3(); break;
            default: this._buildStage1_1(); break;
        }
    },

    // =============================================
    // HELPER: Fill a rectangular region
    // =============================================
    _fill(c1, c2, r1, r2, type) {
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
                    this.tiles[r][c] = type;
                }
            }
        }
    },

    _initGrid(w, h) {
        this.width = w;
        this.height = h;
        this.tiles = [];
        for (let r = 0; r < h; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < w; c++) {
                this.tiles[r][c] = TILE_EMPTY;
            }
        }
    },

    // =============================================
    // STAGE 1-1: CANOPY TRAIL (Tutorial, 85 tiles wide)
    // =============================================
    _buildStage1_1() {
        const W = 85;
        const H = 20;
        this._initGrid(W, H);

        // Ground floor (rows 17-19)
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);

        // SECTION A: Starting area (cols 1-10)
        // Flat ground, easy intro

        // SECTION B: Small platforms (cols 11-16)
        this._fill(11, 13, 14, 14, TILE_ONE_WAY);
        this._fill(14, 16, 11, 11, TILE_ONE_WAY);

        // Gap in ground (cols 14-15)
        this._fill(14, 15, 17, H - 1, TILE_EMPTY);

        // SECTION C: Breakable block puzzle (cols 18-22)
        // Breakable blocks blocking a passage
        this._fill(18, 18, 14, 16, TILE_BREAKABLE);
        this._fill(19, 19, 14, 16, TILE_BREAKABLE);
        // Platform behind breakables
        this._fill(20, 23, 14, 14, TILE_SOLID);

        // SECTION D: Bounce pad sequence (cols 26-32)
        this.tiles[17][26] = TILE_BOUNCE;
        this.tiles[17][29] = TILE_BOUNCE;
        this.tiles[17][32] = TILE_BOUNCE;
        // Elevated platform to reach via bounce
        this._fill(30, 34, 10, 10, TILE_SOLID);

        // SECTION E: Platforming section (cols 35-45)
        this._fill(35, 38, 14, 14, TILE_SOLID);
        this._fill(40, 43, 12, 12, TILE_SOLID);
        // Gap
        this._fill(39, 39, 17, H - 1, TILE_EMPTY);

        // Hazards
        this.tiles[16][44] = TILE_HAZARD;
        this.tiles[16][45] = TILE_HAZARD;

        // SECTION F: More platforms (cols 46-55)
        this._fill(47, 50, 14, 14, TILE_ONE_WAY);
        this._fill(52, 55, 11, 11, TILE_ONE_WAY);

        // SECTION G: Pre-boss terrain (cols 56-64)
        this._fill(56, 60, 15, 15, TILE_SOLID);
        this._fill(62, 64, 13, 13, TILE_SOLID);

        // =====================
        // BOSS ARENA (cols 65-84)
        // =====================
        this.bossArenaX = 65 * TILE_SIZE;
        // Arena walls
        this._fill(65, 65, 5, 16, TILE_SOLID);
        this._fill(84, 84, 5, 16, TILE_SOLID);
        // Arena ceiling
        this._fill(65, 84, 5, 5, TILE_SOLID);
        // Arena floor
        this._fill(65, 84, 17, H - 1, TILE_SOLID);

        // Boss data
        this.bossData = {
            type: 'elder_shroomba',
            spawnX: 74 * TILE_SIZE,
            spawnY: 13 * TILE_SIZE,
        };

        // Exit after boss
        this.exitX = 82 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Player spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Enemy spawns
        this.enemySpawns = [
            { type: 'shroomba', x: 10 * TILE_SIZE, y: 15 * TILE_SIZE },
            { type: 'shroomba', x: 25 * TILE_SIZE, y: 15 * TILE_SIZE },
            { type: 'shroomba', x: 37 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'shroomba', x: 48 * TILE_SIZE, y: 15 * TILE_SIZE },
            { type: 'shroomba', x: 57 * TILE_SIZE, y: 13 * TILE_SIZE },
        ];

        // Coins (15 total)
        this.coinPositions = [
            // Starting area
            { x: 4 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
            { x: 5 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
            { x: 6 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
            // Above one-way platforms
            { x: 12 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 15 * TILE_SIZE + 8, y: 9 * TILE_SIZE },
            // Behind breakable blocks
            { x: 21 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 22 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            // Bounce pad reward
            { x: 31 * TILE_SIZE + 8, y: 8 * TILE_SIZE },
            { x: 32 * TILE_SIZE + 8, y: 8 * TILE_SIZE },
            // Mid-section
            { x: 41 * TILE_SIZE + 8, y: 10 * TILE_SIZE },
            { x: 42 * TILE_SIZE + 8, y: 10 * TILE_SIZE },
            // Higher platforms
            { x: 48 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 53 * TILE_SIZE + 8, y: 9 * TILE_SIZE },
            // Pre-boss
            { x: 58 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
            { x: 63 * TILE_SIZE + 8, y: 11 * TILE_SIZE },
        ];

        // Health pickups (2)
        this.healthPositions = [
            { x: 33 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
            { x: 55 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 1-2: HOLLOW DEPTHS (Wall jumps + Ladders, 125 tiles)
    // =============================================
    _buildStage1_2() {
        const W = 125;
        const H = 25;
        this._initGrid(W, H);

        // Base ground (rows 22-24)
        this._fill(0, W - 1, 22, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 21, TILE_SOLID);

        // SECTION A: Entry area (cols 1-10)
        // Normal ground

        // SECTION B: First wall jump shaft (cols 12-16)
        this._fill(12, 13, 8, 21, TILE_SOLID);   // Left wall
        this._fill(16, 17, 8, 21, TILE_SOLID);    // Right wall
        this._fill(12, 17, 8, 8, TILE_SOLID);     // Top platform
        // Reward platform above
        this._fill(12, 17, 6, 6, TILE_ONE_WAY);

        // SECTION C: Ladder section (cols 20-28)
        // Vertical ladder climb
        for (let r = 10; r <= 21; r++) {
            this.tiles[r][22] = TILE_LADDER;
            this.tiles[r][23] = TILE_LADDER;
        }
        // Platforms at ladder stops
        this._fill(20, 26, 16, 16, TILE_SOLID);
        this._fill(20, 26, 10, 10, TILE_SOLID);

        // SECTION D: Crumbling platforms (cols 28-35)
        this.tiles[18][29] = TILE_CRUMBLE;
        this.tiles[18][31] = TILE_CRUMBLE;
        this.tiles[18][33] = TILE_CRUMBLE;
        this.tiles[16][35] = TILE_CRUMBLE;
        // Safe platform
        this._fill(36, 39, 14, 14, TILE_SOLID);

        // SECTION E: Second wall jump shaft (cols 40-44)
        this._fill(40, 41, 6, 21, TILE_SOLID);
        this._fill(44, 45, 6, 21, TILE_SOLID);
        this._fill(40, 45, 6, 6, TILE_SOLID);

        // SECTION F: Extended platforming (cols 48-60)
        this._fill(48, 52, 18, 18, TILE_SOLID);
        this._fill(54, 57, 15, 15, TILE_SOLID);
        this._fill(59, 62, 12, 12, TILE_SOLID);
        // Wall for wall slide
        this._fill(63, 63, 6, 21, TILE_SOLID);

        // SECTION G: Large chamber (cols 64-80)
        this._fill(64, 80, 18, 18, TILE_ONE_WAY);
        this._fill(66, 68, 14, 14, TILE_SOLID);
        this._fill(72, 74, 11, 11, TILE_SOLID);
        this._fill(77, 79, 14, 14, TILE_SOLID);
        // Second ladder
        for (let r = 11; r <= 17; r++) {
            this.tiles[r][70] = TILE_LADDER;
        }

        // SECTION H: Hazard gauntlet (cols 82-95)
        this.tiles[21][83] = TILE_HAZARD;
        this.tiles[21][84] = TILE_HAZARD;
        this._fill(86, 89, 19, 19, TILE_SOLID);
        this.tiles[21][91] = TILE_HAZARD;
        this.tiles[21][92] = TILE_HAZARD;
        this._fill(94, 97, 17, 17, TILE_SOLID);

        // SECTION I: Pre-boss (cols 98-104)
        this._fill(98, 102, 19, 19, TILE_SOLID);
        this._fill(103, 104, 16, 16, TILE_ONE_WAY);

        // =====================
        // BOSS ARENA (cols 105-124)
        // =====================
        this.bossArenaX = 105 * TILE_SIZE;
        this._fill(105, 105, 5, 21, TILE_SOLID);
        this._fill(124, 124, 5, 21, TILE_SOLID);
        this._fill(105, 124, 5, 5, TILE_SOLID);
        this._fill(105, 124, 22, H - 1, TILE_SOLID);

        this.bossData = {
            type: 'vine_mother',
            spawnX: 114 * TILE_SIZE,
            spawnY: 12 * TILE_SIZE,
        };

        this.exitX = 122 * TILE_SIZE;
        this.exitY = 20 * TILE_SIZE;

        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 20 * TILE_SIZE;

        // Enemy spawns
        this.enemySpawns = [
            { type: 'shroomba', x: 8 * TILE_SIZE, y: 20 * TILE_SIZE },
            { type: 'thornvine', x: 25 * TILE_SIZE, y: 10 * TILE_SIZE - 32 },
            { type: 'thornvine', x: 50 * TILE_SIZE, y: 14 * TILE_SIZE - 32 },
            { type: 'shroomba', x: 56 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'thornvine', x: 73 * TILE_SIZE, y: 10 * TILE_SIZE - 32 },
            { type: 'shroomba', x: 87 * TILE_SIZE, y: 17 * TILE_SIZE },
            { type: 'thornvine', x: 95 * TILE_SIZE, y: 15 * TILE_SIZE },
        ];

        // Coins (20 total)
        this.coinPositions = [];
        const coinSpots = [
            [3, 20], [5, 20], [7, 20],
            [14, 7], [15, 7],
            [22, 12], [23, 12],
            [30, 16], [32, 16],
            [37, 12], [38, 12],
            [42, 8], [43, 8],
            [52, 16], [55, 13],
            [67, 12], [73, 9],
            [88, 17], [96, 15],
            [101, 17],
        ];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups
        this.healthPositions = [
            { x: 46 * TILE_SIZE + 8, y: 20 * TILE_SIZE },
            { x: 80 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 1-3: TREETOP GAUNTLET (Moving platforms, 155 tiles)
    // =============================================
    _buildStage1_3() {
        const W = 155;
        const H = 22;
        this._initGrid(W, H);

        // Sparse ground (not continuous - lots of gaps)
        // Starting area ground
        this._fill(0, 12, 18, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 17, TILE_SOLID);

        // SECTION A: Starting platforms (cols 1-15)
        this._fill(8, 11, 14, 14, TILE_SOLID);

        // SECTION B: First moving platform gap (cols 13-25)
        // Ground island
        this._fill(22, 28, 18, H - 1, TILE_SOLID);
        // Ceiling for bark beetles
        this._fill(13, 28, 8, 8, TILE_SOLID);

        // SECTION C: Elevated section (cols 29-40)
        this._fill(29, 33, 14, 14, TILE_SOLID);
        this._fill(36, 40, 12, 12, TILE_SOLID);
        // Ceiling
        this._fill(29, 40, 6, 6, TILE_SOLID);

        // SECTION D: Large gap with moving platforms (cols 41-55)
        this._fill(52, 56, 16, H - 1, TILE_SOLID);
        // Ceiling
        this._fill(41, 56, 6, 6, TILE_SOLID);

        // SECTION E: Hazard section (cols 57-70)
        this._fill(57, 70, 18, H - 1, TILE_SOLID);
        this.tiles[17][60] = TILE_HAZARD;
        this.tiles[17][61] = TILE_HAZARD;
        this.tiles[17][62] = TILE_HAZARD;
        this._fill(64, 67, 14, 14, TILE_ONE_WAY);
        this.tiles[17][68] = TILE_HAZARD;
        this.tiles[17][69] = TILE_HAZARD;

        // SECTION F: Vertical climb with moving platforms (cols 71-85)
        this._fill(71, 74, 18, H - 1, TILE_SOLID);
        this._fill(82, 85, 18, H - 1, TILE_SOLID);
        this._fill(78, 80, 14, 14, TILE_SOLID);
        this._fill(71, 85, 4, 4, TILE_SOLID); // High ceiling

        // Bounce pads
        this.tiles[18][73] = TILE_BOUNCE;
        this.tiles[18][83] = TILE_BOUNCE;

        // SECTION G: Treetop run (cols 86-105)
        this._fill(86, 90, 10, 10, TILE_SOLID);
        this._fill(93, 97, 12, 12, TILE_SOLID);
        this._fill(100, 105, 10, 10, TILE_SOLID);
        // Ceiling
        this._fill(86, 105, 4, 4, TILE_SOLID);
        // Hazards below
        this._fill(86, 105, 18, H - 1, TILE_SOLID);
        this.tiles[17][91] = TILE_HAZARD;
        this.tiles[17][92] = TILE_HAZARD;
        this.tiles[17][98] = TILE_HAZARD;
        this.tiles[17][99] = TILE_HAZARD;

        // SECTION H: Final platforming (cols 106-120)
        this._fill(106, 110, 14, 14, TILE_SOLID);
        this._fill(113, 117, 12, 12, TILE_SOLID);
        this._fill(120, 124, 16, H - 1, TILE_SOLID);

        // SECTION I: Pre-boss area (cols 125-134)
        this._fill(125, 134, 18, H - 1, TILE_SOLID);
        this._fill(128, 132, 14, 14, TILE_SOLID);

        // =====================
        // BOSS ARENA (cols 135-154)
        // =====================
        this.bossArenaX = 135 * TILE_SIZE;
        this._fill(135, 135, 5, 17, TILE_SOLID);
        this._fill(154, 154, 5, 17, TILE_SOLID);
        this._fill(135, 154, 5, 5, TILE_SOLID);
        this._fill(135, 154, 18, H - 1, TILE_SOLID);

        this.bossData = {
            type: 'stag_king',
            spawnX: 144 * TILE_SIZE,
            spawnY: 14 * TILE_SIZE,
        };

        this.exitX = 152 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 16 * TILE_SIZE;

        // MOVING PLATFORMS (at least 3, using many more for gameplay)
        this.movingPlatforms = [
            // Gap B: cols 13-22
            {
                x: 15 * TILE_SIZE, y: 14 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 14 * TILE_SIZE, endX: 20 * TILE_SIZE,
                startY: 14 * TILE_SIZE, endY: 14 * TILE_SIZE,
                speed: 1.0, axis: 'x', direction: 1,
                prevX: 15 * TILE_SIZE, prevY: 14 * TILE_SIZE
            },
            // Gap D: cols 41-52 (two platforms)
            {
                x: 42 * TILE_SIZE, y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 42 * TILE_SIZE, endX: 48 * TILE_SIZE,
                startY: 13 * TILE_SIZE, endY: 13 * TILE_SIZE,
                speed: 0.8, axis: 'x', direction: 1,
                prevX: 42 * TILE_SIZE, prevY: 13 * TILE_SIZE
            },
            {
                x: 48 * TILE_SIZE, y: 10 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 46 * TILE_SIZE, endX: 51 * TILE_SIZE,
                startY: 10 * TILE_SIZE, endY: 10 * TILE_SIZE,
                speed: 1.2, axis: 'x', direction: -1,
                prevX: 48 * TILE_SIZE, prevY: 10 * TILE_SIZE
            },
            // Vertical movers in section F
            {
                x: 75 * TILE_SIZE, y: 14 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 75 * TILE_SIZE, endX: 75 * TILE_SIZE,
                startY: 8 * TILE_SIZE, endY: 16 * TILE_SIZE,
                speed: 0.8, axis: 'y', direction: 1,
                prevX: 75 * TILE_SIZE, prevY: 14 * TILE_SIZE
            },
            // Section G: moving platforms between treetops
            {
                x: 91 * TILE_SIZE, y: 10 * TILE_SIZE,
                width: TILE_SIZE * 2, height: 12,
                startX: 91 * TILE_SIZE, endX: 91 * TILE_SIZE,
                startY: 8 * TILE_SIZE, endY: 12 * TILE_SIZE,
                speed: 0.6, axis: 'y', direction: 1,
                prevX: 91 * TILE_SIZE, prevY: 10 * TILE_SIZE
            },
            // Section H: moving platform
            {
                x: 111 * TILE_SIZE, y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 111 * TILE_SIZE, endX: 111 * TILE_SIZE,
                startY: 10 * TILE_SIZE, endY: 15 * TILE_SIZE,
                speed: 0.7, axis: 'y', direction: -1,
                prevX: 111 * TILE_SIZE, prevY: 13 * TILE_SIZE
            },
        ];

        // Enemy spawns
        this.enemySpawns = [
            { type: 'barkbeetle', x: 18 * TILE_SIZE, y: 9 * TILE_SIZE },
            { type: 'barkbeetle', x: 35 * TILE_SIZE, y: 7 * TILE_SIZE },
            { type: 'shroomba', x: 55 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'barkbeetle', x: 45 * TILE_SIZE, y: 7 * TILE_SIZE },
            { type: 'shroomba', x: 65 * TILE_SIZE, y: 16 * TILE_SIZE },
            { type: 'barkbeetle', x: 90 * TILE_SIZE, y: 5 * TILE_SIZE },
            { type: 'shroomba', x: 107 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'barkbeetle', x: 100 * TILE_SIZE, y: 5 * TILE_SIZE },
        ];

        // Coins (25 total)
        this.coinPositions = [];
        const coinSpots = [
            [3, 16], [5, 16], [7, 16],
            [10, 12], [16, 12], [19, 12],
            [24, 16], [26, 16],
            [31, 12], [38, 10],
            [44, 11], [49, 8],
            [54, 14], [58, 16],
            [65, 12], [66, 12],
            [73, 16], [79, 12],
            [84, 16], [88, 8],
            [95, 10], [102, 8],
            [108, 12], [115, 10],
            [130, 16],
        ];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups
        this.healthPositions = [
            { x: 27 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
            { x: 84 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
            { x: 126 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
        ];
    },

    // =============================================
    // TILE ACCESS
    // =============================================

    getTile(col, row) {
        if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
            return TILE_SOLID; // Out of bounds = solid
        }
        return this.tiles[row][col];
    },

    setTile(col, row, type) {
        if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
            this.tiles[row][col] = type;
        }
    },

    breakTile(col, row) {
        if (this.getTile(col, row) === TILE_BREAKABLE) {
            this.setTile(col, row, TILE_EMPTY);
            Particles.spawnBlockBreak(col, row);
        }
    },

    isSolid(col, row) {
        const t = this.getTile(col, row);
        return t === TILE_SOLID || t === TILE_BREAKABLE || t === TILE_CRUMBLE;
    },

    // =============================================
    // CRUMBLING PLATFORMS
    // =============================================

    updateCrumblingTiles() {
        // Check if player is standing on any crumble tile
        if (Player.onGround && Player.state !== 'dead') {
            const footRow = Math.floor((Player.y + Player.height) / TILE_SIZE);
            const leftCol = Math.floor(Player.x / TILE_SIZE);
            const rightCol = Math.floor((Player.x + Player.width - 1) / TILE_SIZE);

            for (let c = leftCol; c <= rightCol; c++) {
                if (this.getTile(c, footRow) === TILE_CRUMBLE) {
                    // Check if already tracked
                    const existing = this.crumblingTiles.find(ct => ct.col === c && ct.row === footRow);
                    if (!existing) {
                        this.crumblingTiles.push({
                            col: c, row: footRow,
                            timer: 45, // 0.75 seconds at 60fps
                            shaking: true
                        });
                    }
                }
            }
        }

        // Update crumbling tiles
        for (let i = this.crumblingTiles.length - 1; i >= 0; i--) {
            const ct = this.crumblingTiles[i];
            ct.timer--;
            if (ct.timer <= 0) {
                // Crumble! Remove the tile
                this.setTile(ct.col, ct.row, TILE_EMPTY);
                Particles.spawnBlockBreak(ct.col, ct.row);
                this.crumblingTiles.splice(i, 1);
            }
        }
    },

    // =============================================
    // MOVING PLATFORMS
    // =============================================

    updateMovingPlatforms() {
        for (const mp of this.movingPlatforms) {
            mp.prevX = mp.x;
            mp.prevY = mp.y;

            if (mp.axis === 'x') {
                mp.x += mp.speed * mp.direction;
                if (mp.x >= mp.endX) {
                    mp.x = mp.endX;
                    mp.direction = -1;
                } else if (mp.x <= mp.startX) {
                    mp.x = mp.startX;
                    mp.direction = 1;
                }
            } else {
                mp.y += mp.speed * mp.direction;
                if (mp.y >= mp.endY) {
                    mp.y = mp.endY;
                    mp.direction = -1;
                } else if (mp.y <= mp.startY) {
                    mp.y = mp.startY;
                    mp.direction = 1;
                }
            }
        }
    }
};
