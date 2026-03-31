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

    // Citadel section tracking
    citadelSections: null,
    worldSections: null,
    sections: null,

    init() {
        // Load stage based on current game state
        const stageId = GameState.currentStageId || '1-1';
        this.loadStage(stageId);
    },

    // Desert-specific data
    quicksandTiles: [],
    waterTiles: [],
    pressurePlates: [],
    gates: [],
    mirrors: [],
    darkZones: [],
    isDark: false,

    // Tundra-specific data
    iceBlocks: [],       // Pushable ice blocks for puzzles
    fireSources: [],     // Fire/torch elements for melt puzzles
    meltableBlocks: [],  // Ice walls that can be melted by fire
    iceZones: [],        // Areas with ice physics
    iceTiles: [],        // Track ice tile positions
    forkSections: [],    // Path fork data for auto-scroll stages
    pathForks: [],       // Alias for forkSections
    autoScroll: false,
    autoScrollSpeed: 0,
    puzzleElements: [],  // Generic puzzle element tracking

    // Volcano-specific data
    lavaLevel: null,         // Rising lava Y position (pixels from bottom)
    risingLava: null,        // Alias for lavaLevel
    lavaRiseSpeed: 0,        // Pixels per second the lava rises
    lavaSpeed: 0,            // Alias for lavaRiseSpeed
    lavaDirection: 1,        // 1 = rising, -1 = falling
    lavaMinLevel: 0,         // Minimum lava height (pixels)
    lavaMaxLevel: 0,         // Maximum lava height (pixels)
    chains: [],              // Chain swing points [{x, y, length, chainLength, canGrab, grabbed, angle, angularVel}]
    swingPoints: [],         // Alias for chains
    chainPoints: [],         // Alias for chains
    valves: [],              // Interactive valves/levers [{x, y, activated, target, type}]
    levers: [],              // Alias for valves

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
        this.quicksandTiles = [];
        this.waterTiles = [];
        this.pressurePlates = [];
        this.gates = [];
        this.mirrors = [];
        this.darkZones = [];
        this.isDark = false;
        // Tundra reset
        this.iceBlocks = [];
        this.fireSources = [];
        this.meltableBlocks = [];
        this.iceZones = [];
        this.iceTiles = [];
        this.forkSections = [];
        this.pathForks = [];
        this.autoScroll = false;
        this.autoScrollSpeed = 0;
        this.puzzleElements = [];
        // Volcano reset
        this.lavaLevel = null;
        this.risingLava = null;
        this.lavaRiseSpeed = 0;
        this.lavaSpeed = 0;
        this.lavaDirection = 1;
        this.lavaMinLevel = 0;
        this.lavaMaxLevel = 0;
        this.chains = [];
        this.swingPoints = [];
        this.chainPoints = [];
        this.valves = [];
        this.levers = [];
        // Citadel reset
        this.citadelSections = null;
        this.worldSections = null;
        this.sections = null;

        switch (stageId) {
            case '1-1': this._buildStage1_1(); break;
            case '1-2': this._buildStage1_2(); break;
            case '1-3': this._buildStage1_3(); break;
            case '2-1': this._buildStage2_1(); break;
            case '2-2': this._buildStage2_2(); break;
            case '2-3': this._buildStage2_3(); break;
            case '3-1': this._buildStage3_1(); break;
            case '3-2': this._buildStage3_2(); break;
            case '3-3': this._buildStage3_3(); break;
            case '4-1': this._buildStage4_1(); break;
            case '4-2': this._buildStage4_2(); break;
            case '4-3': this._buildStage4_3(); break;
            case '5-1': this._buildStage5_1(); break;
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
        this._fill(1, 2, 5, 5, TILE_SOLID); // Widen wall cap to 3 tiles

        // SECTION A: Starting area (cols 1-10)
        // Flat ground, easy intro

        // SECTION B: Small platforms (cols 11-16)
        this._fill(11, 13, 14, 14, TILE_ONE_WAY);
        this._fill(14, 16, 11, 11, TILE_ONE_WAY);

        // Gap in ground (col 14 only — narrowed for min 3-tile platform)
        this._fill(14, 14, 17, H - 1, TILE_EMPTY);

        // SECTION C: Breakable block puzzle (cols 18-22)
        // Breakable blocks blocking a passage
        this._fill(18, 18, 14, 16, TILE_BREAKABLE);
        this._fill(19, 19, 14, 16, TILE_BREAKABLE);
        // Platform behind breakables
        this._fill(20, 23, 14, 14, TILE_SOLID);

        // SECTION D: Bounce pad sequence (3-tile-wide pads for min platform width compliance)
        this._fill(25, 27, 17, 17, TILE_BOUNCE);
        this._fill(31, 33, 17, 17, TILE_BOUNCE);
        // Elevated platform to reach via bounce
        this._fill(29, 34, 10, 10, TILE_SOLID);

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
        // Arena walls (left wall has entry gap at rows 15-16)
        this._fill(65, 65, 5, 14, TILE_SOLID);
        this._fill(84, 84, 5, 16, TILE_SOLID);
        // Arena ceiling
        this._fill(65, 84, 5, 5, TILE_SOLID);
        // Arena floor
        this._fill(65, 84, 17, H - 1, TILE_SOLID);
        // Arena platforms
        this._fill(70, 73, 13, 13, TILE_ONE_WAY);
        this._fill(77, 80, 13, 13, TILE_ONE_WAY);

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
        this._fill(1, 2, 5, 5, TILE_SOLID); // Widen wall cap to 3 tiles

        // SECTION A: Entry area (cols 1-10)
        // Normal ground

        // SECTION B: First wall jump shaft (cols 11-19, widened for accessibility)
        this._fill(11, 12, 8, 19, TILE_SOLID);   // Left wall (gap at bottom for walk-through)
        this._fill(18, 19, 8, 19, TILE_SOLID);   // Right wall (gap at bottom for walk-through)
        this._fill(11, 19, 8, 8, TILE_SOLID);    // Top platform
        // Intermediate landing platforms (safe landings every few rows)
        this._fill(13, 15, 18, 18, TILE_ONE_WAY);
        this._fill(15, 17, 14, 14, TILE_ONE_WAY);
        this._fill(13, 15, 11, 11, TILE_ONE_WAY);
        // Reward platform above
        this._fill(11, 19, 6, 6, TILE_ONE_WAY);

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

        // SECTION E: Second wall jump shaft (cols 39-47, widened for accessibility)
        this._fill(39, 40, 6, 19, TILE_SOLID);   // Left wall (gap at bottom for walk-through)
        this._fill(46, 47, 6, 19, TILE_SOLID);   // Right wall (gap at bottom for walk-through)
        this._fill(39, 47, 6, 6, TILE_SOLID);    // Top platform
        // Intermediate landing platforms
        this._fill(41, 43, 18, 18, TILE_ONE_WAY);
        this._fill(43, 45, 14, 14, TILE_ONE_WAY);
        this._fill(41, 43, 10, 10, TILE_ONE_WAY);

        // SECTION F: Extended platforming (cols 48-62)
        this._fill(48, 52, 18, 18, TILE_SOLID);
        this._fill(54, 57, 15, 15, TILE_SOLID);
        this._fill(59, 62, 12, 12, TILE_SOLID);
        // Wall for wall slide (lowered top to allow jumping over)
        this._fill(63, 63, 9, 21, TILE_SOLID);
        this._fill(62, 64, 9, 9, TILE_SOLID); // Widen wall cap to 3 tiles

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
        this._fill(102, 104, 16, 16, TILE_ONE_WAY); // Widened to 3 tiles for min platform width

        // =====================
        // BOSS ARENA (cols 105-124)
        // =====================
        this.bossArenaX = 105 * TILE_SIZE;
        // Left wall with entry gap at rows 20-21
        this._fill(105, 105, 5, 19, TILE_SOLID);
        this._fill(124, 124, 5, 21, TILE_SOLID);
        this._fill(105, 124, 5, 5, TILE_SOLID);
        this._fill(105, 124, 22, H - 1, TILE_SOLID);
        // Arena platforms
        this._fill(110, 113, 16, 16, TILE_ONE_WAY);
        this._fill(117, 120, 12, 12, TILE_ONE_WAY);

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
            { type: 'shroomba', x: 56 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'thornvine', x: 73 * TILE_SIZE, y: 10 * TILE_SIZE - 32 },
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
        this._fill(1, 2, 5, 5, TILE_SOLID); // Widen wall cap to 3 tiles

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

        // SECTION F: Vertical climb with moving platforms (cols 69-88)
        this._fill(69, 77, 18, H - 1, TILE_SOLID);  // Island 1 (widened: 3-tile bounce + 3-tile sides)
        this._fill(79, 88, 18, H - 1, TILE_SOLID);  // Island 2 (widened: 3-tile bounce + 3-tile sides)
        this._fill(78, 80, 14, 14, TILE_SOLID);
        this._fill(71, 85, 4, 4, TILE_SOLID); // High ceiling

        // Bounce pads (3-wide for min platform width compliance)
        this._fill(72, 74, 18, 18, TILE_BOUNCE);
        this._fill(83, 85, 18, 18, TILE_BOUNCE);

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
        // Left wall with entry gap at rows 16-17
        this._fill(135, 135, 5, 15, TILE_SOLID);
        this._fill(154, 154, 5, 17, TILE_SOLID);
        this._fill(135, 154, 5, 5, TILE_SOLID);
        this._fill(135, 154, 18, H - 1, TILE_SOLID);
        // Arena platforms
        this._fill(140, 143, 14, 14, TILE_ONE_WAY);
        this._fill(147, 150, 14, 14, TILE_ONE_WAY);

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
            { type: 'shroomba', x: 55 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'barkbeetle', x: 90 * TILE_SIZE, y: 5 * TILE_SIZE },
            { type: 'shroomba', x: 107 * TILE_SIZE, y: 12 * TILE_SIZE },
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
    // STAGE 2-1: DUNE SEA (Quicksand, 110 tiles wide)
    // =============================================
    _buildStage2_1() {
        const W = 110;
        const H = 20;
        this._initGrid(W, H);

        // Ground floor (rows 17-19) - sandy terrain
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);
        this._fill(1, 1, 5, 5, TILE_SOLID); // Widen wall cap to 2 tiles

        // SECTION A: Starting area (cols 1-12)
        // Flat desert ground, intro

        // SECTION B: First quicksand pit (cols 13-17, rectangular for min platform width)
        this._fill(13, 17, 17, 19, TILE_QUICKSAND);
        this._fill(15, 15, 19, 19, TILE_QUICKSAND_DEEP);
        // Add to tracking
        for (let c = 13; c <= 17; c++) {
            this.quicksandTiles.push({ x: c, y: 17 });
            this.quicksandTiles.push({ x: c, y: 18 });
            this.quicksandTiles.push({ x: c, y: 19 });
        }

        // Platform over quicksand
        this._fill(14, 16, 14, 14, TILE_ONE_WAY);

        // SECTION C: Elevated terrain (cols 18-28)
        this._fill(18, 22, 15, 15, TILE_SOLID);
        this._fill(24, 28, 13, 13, TILE_SOLID);
        // Gap
        this._fill(23, 23, 17, H - 1, TILE_EMPTY);

        // Pressure plate puzzle area (cols 29-36)
        this.tiles[16][30] = TILE_PRESSURE_PLATE;
        this.pressurePlates.push({
            x: 30, y: 16, activated: false,
            targetGate: { x: 34, yStart: 14, yEnd: 16 }
        });
        // Gate blocks the path
        this._fill(34, 34, 14, 16, TILE_GATE);
        this.gates.push({ x: 34, yStart: 14, yEnd: 16, open: false });

        // Platform above gate
        this._fill(35, 39, 14, 14, TILE_SOLID);

        // SECTION D: More quicksand (cols 37-42, rectangular for min platform width)
        this._fill(37, 42, 17, 19, TILE_QUICKSAND);
        this._fill(39, 40, 19, 19, TILE_QUICKSAND_DEEP);
        for (let c = 37; c <= 42; c++) {
            this.quicksandTiles.push({ x: c, y: 17 });
            this.quicksandTiles.push({ x: c, y: 18 });
            this.quicksandTiles.push({ x: c, y: 19 });
        }

        // Stepping stones over quicksand (widened to 2 tiles each)
        this._fill(38, 39, 15, 15, TILE_ONE_WAY);
        this._fill(41, 42, 15, 15, TILE_ONE_WAY);

        // SECTION E: Ruins section (cols 43-55)
        this._fill(43, 47, 15, 15, TILE_SOLID);
        this._fill(49, 53, 12, 12, TILE_SOLID);
        this._fill(55, 58, 15, 15, TILE_SOLID);
        // Hazards
        this.tiles[16][48] = TILE_HAZARD;

        // SECTION F: Large plateau (cols 59-68)
        this._fill(59, 68, 14, 14, TILE_SOLID);
        this._fill(62, 65, 10, 10, TILE_ONE_WAY);

        // SECTION G: Quicksand gauntlet (cols 69-78, rectangular for min platform width)
        this._fill(69, 78, 17, 19, TILE_QUICKSAND);
        this._fill(71, 76, 19, 19, TILE_QUICKSAND_DEEP);
        for (let c = 69; c <= 78; c++) {
            this.quicksandTiles.push({ x: c, y: 17 });
            this.quicksandTiles.push({ x: c, y: 18 });
            this.quicksandTiles.push({ x: c, y: 19 });
        }
        // Platforms across (widened to 2 tiles each)
        this._fill(71, 72, 14, 14, TILE_ONE_WAY);
        this._fill(74, 75, 14, 14, TILE_ONE_WAY);
        this._fill(77, 78, 14, 14, TILE_ONE_WAY);

        // SECTION H: Pre-boss area (cols 79-89)
        this._fill(79, 89, 15, 15, TILE_SOLID);
        this._fill(82, 85, 11, 11, TILE_ONE_WAY);

        // =====================
        // BOSS ARENA (cols 90-109)
        // =====================
        this.bossArenaX = 90 * TILE_SIZE;
        // Left wall with entry gap at rows 15-16
        this._fill(90, 90, 5, 14, TILE_SOLID);
        this._fill(109, 109, 5, 16, TILE_SOLID);
        this._fill(90, 109, 5, 5, TILE_SOLID);
        this._fill(90, 109, 17, H - 1, TILE_SOLID);
        // Arena platforms
        this._fill(95, 98, 13, 13, TILE_ONE_WAY);
        this._fill(102, 105, 13, 13, TILE_ONE_WAY);

        this.bossData = {
            type: 'sand_wyrm',
            spawnX: 99 * TILE_SIZE,
            spawnY: 13 * TILE_SIZE,
        };

        this.exitX = 107 * TILE_SIZE;
        this.exitY = 15 * TILE_SIZE;

        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Enemy spawns
        this.enemySpawns = [
            { type: 'sand_skitter', x: 10 * TILE_SIZE, y: 15 * TILE_SIZE },
            { type: 'sand_skitter', x: 26 * TILE_SIZE, y: 11 * TILE_SIZE },
            { type: 'dust_devil', x: 45 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'sand_skitter', x: 55 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'sand_skitter', x: 63 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'sand_skitter', x: 83 * TILE_SIZE, y: 13 * TILE_SIZE },
        ];

        // Coins (18 total)
        this.coinPositions = [];
        const coinSpots = [
            [3, 15], [5, 15], [7, 15],
            [15, 12], [20, 13],
            [25, 11], [27, 11],
            [31, 14], [36, 12],
            [44, 13], [50, 10],
            [60, 12], [64, 8],
            [72, 12], [75, 12],
            [81, 13], [84, 9],
            [87, 13],
        ];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups
        this.healthPositions = [
            { x: 40 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
            { x: 68 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 2-2: BURIED TEMPLE (Dark rooms, mirrors, 135 tiles)
    // =============================================
    _buildStage2_2() {
        const W = 135;
        const H = 22;
        this._initGrid(W, H);

        // This is an interior temple level
        this.isDark = true;

        // Base ground (rows 19-21)
        this._fill(0, W - 1, 19, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 3, 18, TILE_SOLID);

        // Ceiling
        this._fill(0, W - 1, 3, 3, TILE_SOLID);

        // SECTION A: Temple entrance (cols 1-12)
        // Regular ground with some pillars
        this._fill(6, 7, 10, 18, TILE_SOLID);  // Pillar
        this._fill(10, 11, 12, 18, TILE_SOLID); // Pillar

        // SECTION B: First dark room (cols 13-25)
        this.darkZones.push({ x1: 13, y1: 4, x2: 25, y2: 18 });
        this._fill(13, 25, 16, 16, TILE_ONE_WAY);
        this._fill(16, 18, 12, 12, TILE_SOLID);
        this._fill(21, 23, 10, 10, TILE_SOLID);
        // Hazards hidden in dark
        this.tiles[18][17] = TILE_HAZARD;
        this.tiles[18][22] = TILE_HAZARD;

        // SECTION C: Mirror puzzle area (cols 26-40)
        this._fill(26, 27, 8, 18, TILE_SOLID); // Wall
        // Mirror puzzle elements
        this.mirrors.push(
            { x: 30, y: 14, angle: 45, active: true },
            { x: 34, y: 10, angle: 135, active: true },
            { x: 38, y: 14, angle: 45, active: true }
        );
        // Light beam source
        this._fill(29, 31, 16, 16, TILE_SOLID);
        this._fill(33, 35, 12, 12, TILE_SOLID);
        this._fill(37, 39, 16, 16, TILE_SOLID);
        // Gate locked by mirror puzzle
        this._fill(40, 40, 10, 18, TILE_GATE);
        this.gates.push({ x: 40, yStart: 10, yEnd: 18, open: false, mirrorPuzzle: true });

        // SECTION D: Temple chambers (cols 41-55)
        this._fill(43, 46, 15, 15, TILE_SOLID);
        this._fill(48, 51, 12, 12, TILE_SOLID);
        this._fill(53, 56, 16, 16, TILE_SOLID);
        // Pressure plate
        this.tiles[18][45] = TILE_PRESSURE_PLATE;
        this.pressurePlates.push({
            x: 45, y: 18, activated: false,
            targetGate: { x: 57, yStart: 10, yEnd: 18 }
        });
        this._fill(57, 57, 10, 18, TILE_GATE);
        this.gates.push({ x: 57, yStart: 10, yEnd: 18, open: false });

        // SECTION E: Large dark room (cols 58-75)
        this.darkZones.push({ x1: 58, y1: 4, x2: 75, y2: 18 });
        this._fill(60, 63, 15, 15, TILE_SOLID);
        this._fill(65, 68, 12, 12, TILE_SOLID);
        this._fill(70, 73, 15, 15, TILE_SOLID);
        // Breakable blocks
        this._fill(64, 64, 15, 17, TILE_BREAKABLE);
        // Hidden platforms
        this._fill(66, 67, 8, 8, TILE_ONE_WAY);
        // Hazards in dark
        this.tiles[18][62] = TILE_HAZARD;
        this.tiles[18][71] = TILE_HAZARD;

        // SECTION F: Elevated temple (cols 76-90)
        this._fill(76, 80, 14, 14, TILE_SOLID);
        this._fill(82, 86, 11, 11, TILE_SOLID);
        this._fill(88, 92, 14, 14, TILE_SOLID);
        // Pillar
        this._fill(84, 85, 12, 18, TILE_SOLID);

        // SECTION G: Quicksand trap (cols 91-100, rectangular for min platform width)
        this._fill(93, 97, 19, 20, TILE_QUICKSAND);
        this._fill(94, 96, 20, 20, TILE_QUICKSAND_DEEP);
        for (let c = 93; c <= 97; c++) {
            this.quicksandTiles.push({ x: c, y: 19 });
            this.quicksandTiles.push({ x: c, y: 20 });
        }
        this._fill(94, 96, 16, 16, TILE_ONE_WAY);
        this._fill(99, 102, 15, 15, TILE_SOLID);

        // SECTION H: Pre-boss (cols 103-114)
        this._fill(103, 114, 16, 16, TILE_SOLID);
        this._fill(106, 110, 12, 12, TILE_ONE_WAY);

        // =====================
        // BOSS ARENA (cols 115-134)
        // =====================
        this.bossArenaX = 115 * TILE_SIZE;
        // Left wall with entry gap at rows 17-18
        this._fill(115, 115, 4, 16, TILE_SOLID);
        this._fill(134, 134, 4, 18, TILE_SOLID);
        this._fill(115, 134, 4, 4, TILE_SOLID);
        this._fill(115, 134, 19, H - 1, TILE_SOLID);

        // Boss arena platforms
        this._fill(120, 122, 14, 14, TILE_ONE_WAY);
        this._fill(127, 129, 14, 14, TILE_ONE_WAY);

        this.bossData = {
            type: 'pharaoh_specter',
            spawnX: 124 * TILE_SIZE,
            spawnY: 10 * TILE_SIZE,
        };

        this.exitX = 132 * TILE_SIZE;
        this.exitY = 17 * TILE_SIZE;

        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 17 * TILE_SIZE;

        // Enemy spawns
        this.enemySpawns = [
            { type: 'mummy', x: 8 * TILE_SIZE, y: 17 * TILE_SIZE },
            { type: 'sand_skitter', x: 20 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'dust_devil', x: 35 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'mummy', x: 50 * TILE_SIZE, y: 17 * TILE_SIZE },
            { type: 'sand_skitter', x: 62 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'mummy', x: 78 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'dust_devil', x: 88 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'sand_skitter', x: 100 * TILE_SIZE, y: 13 * TILE_SIZE },
        ];

        // Coins (22 total)
        this.coinPositions = [];
        const coinSpots = [
            [3, 17], [5, 17],
            [9, 14], [14, 14],
            [17, 10], [22, 8],
            [30, 12], [34, 8],
            [44, 13], [49, 10],
            [54, 14], [61, 13],
            [66, 6], [67, 6],
            [72, 13], [77, 12],
            [83, 9], [89, 12],
            [95, 14], [101, 13],
            [107, 10], [112, 14],
        ];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups
        this.healthPositions = [
            { x: 38 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
            { x: 75 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
            { x: 110 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 2-3: OASIS MIRAGE (Water/swimming, 145 tiles)
    // =============================================
    _buildStage2_3() {
        const W = 145;
        const H = 22;
        this._initGrid(W, H);

        // Ground floor (rows 18-21) - desert/oasis
        this._fill(0, W - 1, 18, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 4, 17, TILE_SOLID);
        this._fill(1, 1, 4, 4, TILE_SOLID); // Widen wall cap to 2 tiles

        // SECTION A: Desert start (cols 1-12)
        // Dry desert terrain
        this._fill(8, 11, 14, 14, TILE_SOLID);

        // SECTION B: First oasis pool (cols 13-22)
        // Dig out pool (rectangular to avoid 1-tile edge platforms)
        this._fill(13, 22, 18, 20, TILE_EMPTY);
        // Fill with water
        this._fill(13, 22, 15, 15, TILE_WATER_SURFACE);
        this._fill(13, 22, 16, 17, TILE_WATER);
        this._fill(13, 22, 18, 20, TILE_WATER);
        // Track water tiles
        for (let c = 13; c <= 22; c++) {
            this.waterTiles.push({ x: c, y: 15 });
            this.waterTiles.push({ x: c, y: 16 });
            this.waterTiles.push({ x: c, y: 17 });
            this.waterTiles.push({ x: c, y: 18 });
            this.waterTiles.push({ x: c, y: 19 });
            this.waterTiles.push({ x: c, y: 20 });
        }

        // Underwater platforms
        this._fill(16, 18, 18, 18, TILE_ONE_WAY);

        // SECTION C: Desert bridge (cols 23-32)
        this._fill(23, 32, 16, 16, TILE_SOLID);
        this._fill(26, 29, 12, 12, TILE_ONE_WAY);

        // SECTION D: Deep oasis (cols 33-48)
        this._fill(33, 48, 18, H - 1, TILE_EMPTY);
        this._fill(34, 47, 19, H - 1, TILE_EMPTY);
        // Water fill
        this._fill(33, 48, 13, 17, TILE_WATER);
        this._fill(33, 48, 12, 12, TILE_WATER_SURFACE);
        this._fill(33, 48, 18, 18, TILE_WATER);
        this._fill(34, 47, 19, H - 1, TILE_WATER);
        for (let c = 33; c <= 48; c++) {
            for (let r = 12; r <= 18; r++) this.waterTiles.push({ x: c, y: r });
        }
        for (let c = 34; c <= 47; c++) {
            for (let r = 19; r <= H - 1; r++) this.waterTiles.push({ x: c, y: r });
        }

        // Underwater terrain
        this._fill(36, 38, 16, 16, TILE_SOLID);
        this._fill(42, 44, 14, 14, TILE_SOLID);
        this._fill(39, 41, 18, 18, TILE_SOLID);

        // SECTION E: Island section (cols 49-58)
        this._fill(51, 55, 14, 14, TILE_SOLID);
        this._fill(53, 56, 10, 10, TILE_ONE_WAY);

        // SECTION F: Quicksand + water mix (cols 59-72)
        this._fill(59, 64, 17, 17, TILE_QUICKSAND);
        for (let c = 59; c <= 64; c++) this.quicksandTiles.push({ x: c, y: 17 });
        this._fill(66, 72, 14, 17, TILE_WATER);
        this._fill(66, 72, 13, 13, TILE_WATER_SURFACE);
        for (let c = 66; c <= 72; c++) {
            for (let r = 13; r <= 17; r++) this.waterTiles.push({ x: c, y: r });
        }
        this._fill(68, 70, 16, 16, TILE_SOLID);

        // SECTION G: Desert platforms (cols 73-86)
        this._fill(73, 77, 15, 15, TILE_SOLID);
        this._fill(79, 83, 12, 12, TILE_SOLID);
        this._fill(85, 89, 15, 15, TILE_SOLID);
        this._fill(80, 82, 16, 17, TILE_SOLID);  // Pillar

        // SECTION H: Large water area (cols 87-102)
        this._fill(90, 102, 18, H - 1, TILE_EMPTY);
        this._fill(90, 102, 14, 17, TILE_WATER);
        this._fill(90, 102, 13, 13, TILE_WATER_SURFACE);
        this._fill(90, 102, 18, H - 1, TILE_WATER);
        for (let c = 90; c <= 102; c++) {
            for (let r = 13; r <= H - 1; r++) this.waterTiles.push({ x: c, y: r });
        }
        // Underwater platforms
        this._fill(93, 95, 17, 17, TILE_SOLID);
        this._fill(98, 100, 16, 16, TILE_SOLID);

        // SECTION I: Pre-boss dry land (cols 103-124)
        this._fill(103, 110, 15, 15, TILE_SOLID);
        this._fill(112, 118, 13, 13, TILE_SOLID);
        this._fill(120, 124, 15, 15, TILE_SOLID);

        // =====================
        // BOSS ARENA (cols 125-144)
        // =====================
        this.bossArenaX = 125 * TILE_SIZE;
        // Left wall with entry gap at rows 16-17
        this._fill(125, 125, 4, 15, TILE_SOLID);
        this._fill(144, 144, 4, 17, TILE_SOLID);
        this._fill(125, 144, 4, 4, TILE_SOLID);
        this._fill(125, 144, 18, H - 1, TILE_SOLID);
        // Arena platforms
        this._fill(130, 133, 13, 13, TILE_ONE_WAY);
        this._fill(137, 140, 13, 13, TILE_ONE_WAY);

        // Boss arena water pool
        this._fill(130, 139, 17, 17, TILE_WATER);
        this._fill(130, 139, 16, 16, TILE_WATER_SURFACE);
        for (let c = 130; c <= 139; c++) {
            this.waterTiles.push({ x: c, y: 16 });
            this.waterTiles.push({ x: c, y: 17 });
        }

        this.bossData = {
            type: 'hydra_cactus',
            spawnX: 134 * TILE_SIZE,
            spawnY: 16 * TILE_SIZE - 56,  // Position so bottom sits near ground
        };

        this.exitX = 142 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 16 * TILE_SIZE;

        // Moving platforms
        this.movingPlatforms = [
            {
                x: 60 * TILE_SIZE, y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3, height: 12,
                startX: 59 * TILE_SIZE, endX: 64 * TILE_SIZE,
                startY: 13 * TILE_SIZE, endY: 13 * TILE_SIZE,
                speed: 0.8, axis: 'x', direction: 1,
                prevX: 60 * TILE_SIZE, prevY: 13 * TILE_SIZE
            },
        ];

        // Enemy spawns
        this.enemySpawns = [
            { type: 'sand_skitter', x: 9 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'dust_devil', x: 28 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'mummy', x: 52 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'sand_skitter', x: 62 * TILE_SIZE, y: 15 * TILE_SIZE },
            { type: 'dust_devil', x: 75 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'mummy', x: 87 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'sand_skitter', x: 105 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'sand_skitter', x: 115 * TILE_SIZE, y: 11 * TILE_SIZE },
        ];

        // Coins (28 total)
        this.coinPositions = [];
        const coinSpots = [
            [3, 16], [5, 16], [9, 12],
            [16, 13], [18, 17], [20, 17],
            [25, 14], [27, 10],
            [36, 14], [40, 16], [43, 12],
            [52, 12], [54, 8],
            [61, 15], [68, 14], [71, 12],
            [74, 13], [80, 10], [86, 13],
            [93, 15], [96, 14], [100, 14],
            [105, 13], [109, 13],
            [113, 11], [117, 11],
            [121, 13], [123, 13],
        ];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups
        this.healthPositions = [
            { x: 30 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
            { x: 70 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
            { x: 110 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
        ];
    },

    // =============================================
    // DESERT MECHANICS UPDATE
    // =============================================

    updateQuicksand() {
        if (Player.state === 'dead') return;
        const footRow = Math.floor((Player.y + Player.height) / TILE_SIZE);
        const midRow = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);
        const leftCol = Math.floor(Player.x / TILE_SIZE);
        const rightCol = Math.floor((Player.x + Player.width - 1) / TILE_SIZE);

        let inQuicksand = false;
        for (let c = leftCol; c <= rightCol; c++) {
            const t = this.getTile(c, footRow);
            const tMid = this.getTile(c, midRow);
            if (t === TILE_QUICKSAND || t === TILE_QUICKSAND_DEEP ||
                tMid === TILE_QUICKSAND || tMid === TILE_QUICKSAND_DEEP) {
                inQuicksand = true;
                break;
            }
        }

        if (inQuicksand) {
            // Slowly sink
            Player.vy = Math.min(Player.vy + 0.02, 0.8);
            Player.y += 0.3;
            // Hinder horizontal movement
            Player.vx *= 0.7;
            // Allow jump to escape (but weakened)
            Player.inQuicksand = true;

            // Check if fully submerged in deep quicksand → damage
            const deepRow = Math.floor((Player.y + Player.height + 4) / TILE_SIZE);
            for (let c = leftCol; c <= rightCol; c++) {
                if (this.getTile(c, deepRow) === TILE_QUICKSAND_DEEP) {
                    if (!Player.invincible && Player.state !== 'hurt') {
                        Player.takeDamage();
                    }
                    break;
                }
            }
        } else {
            Player.inQuicksand = false;
        }
    },

    updateWater() {
        if (Player.state === 'dead') return;
        const headRow = Math.floor(Player.y / TILE_SIZE);
        const footRow = Math.floor((Player.y + Player.height) / TILE_SIZE);
        const leftCol = Math.floor(Player.x / TILE_SIZE);
        const rightCol = Math.floor((Player.x + Player.width - 1) / TILE_SIZE);

        let inWater = false;
        for (let c = leftCol; c <= rightCol; c++) {
            for (let r = headRow; r <= footRow; r++) {
                const t = this.getTile(c, r);
                if (t === TILE_WATER || t === TILE_WATER_SURFACE) {
                    inWater = true;
                    break;
                }
            }
            if (inWater) break;
        }

        if (inWater) {
            Player.inWater = true;
            // Reduced gravity
            Player.vy *= 0.85;
            if (Player.vy > 2) Player.vy = 2;
            // Slow horizontal movement
            Player.vx *= 0.9;
            // Allow swimming up with jump key
            if (Input.isDown('z') || Input.isDown('Z') || Input.isDown('ArrowUp')) {
                Player.vy -= 0.4;
                if (Player.vy < -3) Player.vy = -3;
            }
        } else {
            Player.inWater = false;
        }
    },

    updatePressurePlates() {
        if (Player.state === 'dead') return;
        const footRow = Math.floor((Player.y + Player.height) / TILE_SIZE);
        const leftCol = Math.floor(Player.x / TILE_SIZE);
        const rightCol = Math.floor((Player.x + Player.width - 1) / TILE_SIZE);

        for (const plate of this.pressurePlates) {
            if (plate.activated) continue;

            // Check if player stands on the plate
            let onPlate = false;
            for (let c = leftCol; c <= rightCol; c++) {
                if (c === plate.x && footRow === plate.y) {
                    onPlate = true;
                    break;
                }
            }

            if (onPlate) {
                plate.activated = true;
                // Open the linked gate
                const g = plate.targetGate;
                for (let r = g.yStart; r <= g.yEnd; r++) {
                    this.setTile(g.x, r, TILE_EMPTY);
                }
                // Update gate state
                for (const gate of this.gates) {
                    if (gate.x === g.x) {
                        gate.open = true;
                    }
                }
                // Visual feedback - particles
                Particles.spawnBlockBreak(plate.x, plate.y);
            }
        }
    },

    updateMirrors() {
        // Check if all mirrors are activated and open mirror-puzzle gates
        if (this.mirrors.length === 0) return;
        // For simplicity, all mirrors are always "active" and reflect light
        // The puzzle is solved when the player interacts with all mirror areas
        // Auto-solve: if player has visited near all mirrors, open the gate
        let allVisited = true;
        for (const m of this.mirrors) {
            const dx = Math.abs(Player.x - m.x * TILE_SIZE);
            const dy = Math.abs(Player.y - m.y * TILE_SIZE);
            if (dx < TILE_SIZE * 3 && dy < TILE_SIZE * 3) {
                m.visited = true;
            }
            if (!m.visited) allVisited = false;
        }

        if (allVisited) {
            for (const gate of this.gates) {
                if (gate.mirrorPuzzle && !gate.open) {
                    gate.open = true;
                    for (let r = gate.yStart; r <= gate.yEnd; r++) {
                        this.setTile(gate.x, r, TILE_EMPTY);
                    }
                    // Particles
                    for (let r = gate.yStart; r <= gate.yEnd; r++) {
                        Particles.spawnBlockBreak(gate.x, r);
                    }
                }
            }
        }
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
        return t === TILE_SOLID || t === TILE_BREAKABLE || t === TILE_CRUMBLE || t === TILE_GATE || t === TILE_ICE;
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
    },

    // =============================================
    // TUNDRA MECHANICS
    // =============================================

    updateIceBlocks() {
        for (const block of this.iceBlocks) {
            if (block.melted || !block.sliding) continue;

            // Slide until hitting wall or obstacle
            const nextX = block.x + block.vx;
            const col = block.vx > 0
                ? Math.floor((nextX + 31) / TILE_SIZE)
                : Math.floor(nextX / TILE_SIZE);
            const row = Math.floor(block.y / TILE_SIZE);

            const tile = this.getTile(col, row);
            if (tile === TILE_SOLID || tile === TILE_ICE || tile === TILE_BREAKABLE) {
                // Stop at wall
                block.vx = 0;
                block.sliding = false;
                block.x = block.vx > 0
                    ? col * TILE_SIZE - 32
                    : (col + 1) * TILE_SIZE;
            } else {
                block.x = nextX;
            }

            // Check if block collided with another ice block
            for (const other of this.iceBlocks) {
                if (other === block || other.melted) continue;
                if (Math.abs(block.x - other.x) < 30 && Math.abs(block.y - other.y) < 30) {
                    block.sliding = false;
                    block.vx = 0;
                    break;
                }
            }
        }
    },

    pushIceBlock(block, direction) {
        if (block.sliding || block.melted) return;
        block.sliding = true;
        block.vx = direction * 3; // slide speed
    },

    updateMeltableBlocks() {
        for (const block of this.meltableBlocks) {
            if (block.melted) continue;

            // Check proximity to fire sources
            for (const fire of this.fireSources) {
                const dx = block.x - fire.x;
                const dy = block.y - fire.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 80) {
                    block.health--;
                    if (block.health <= 0) {
                        block.melted = true;
                        // Clear the tile
                        const col = Math.floor(block.x / TILE_SIZE);
                        const row = Math.floor(block.y / TILE_SIZE);
                        this.setTile(col, row, TILE_EMPTY);
                        Particles.spawnBlockBreak(col, row);
                    }
                }
            }

            // Check proximity to lured fire enemies (fire sources can also be moved)
            for (const fire of this.fireSources) {
                if (fire.lured) {
                    const dx = block.x - fire.x;
                    const dy = block.y - fire.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 60) {
                        block.health -= 2;
                        if (block.health <= 0) {
                            block.melted = true;
                            const col = Math.floor(block.x / TILE_SIZE);
                            const row = Math.floor(block.y / TILE_SIZE);
                            this.setTile(col, row, TILE_EMPTY);
                            Particles.spawnBlockBreak(col, row);
                        }
                    }
                }
            }
        }
    },

    // Helper to place ICE tiles and track them
    _placeIce(c1, c2, r1, r2) {
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
                    this.tiles[r][c] = TILE_ICE;
                    this.iceTiles.push({ x: c, y: r });
                }
            }
        }
    },

    // =============================================
    // STAGE 3-1: FROZEN LAKE (Ice physics intro, 120 tiles)
    // =============================================
    _buildStage3_1() {
        const W = 120;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'Frozen Lake';
        this.id = '3-1';

        // Ground floor (rows 17-19) — mostly ice in this stage
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);
        this._fill(1, 1, 5, 5, TILE_SOLID); // Widen wall cap to 2 tiles

        // SECTION A: Starting area with normal ground (cols 1-12)
        // Flat solid ground, gentle intro

        // SECTION B: First ice lake (cols 13-25) — ice floor
        this._placeIce(13, 25, 17, 17);

        // Small gap (cols 18-19)
        this._fill(18, 19, 17, H - 1, TILE_EMPTY);

        // One-way platform over gap
        this._fill(17, 20, 14, 14, TILE_ONE_WAY);

        // Elevated platforms
        this._fill(22, 25, 13, 13, TILE_ONE_WAY);

        // SECTION C: Mixed terrain with enemies (cols 26-40)
        this._fill(28, 32, 14, 14, TILE_SOLID);
        this._placeIce(33, 38, 17, 17);

        // Hazard pit (cols 35-36)
        this._fill(35, 36, 17, H - 1, TILE_EMPTY);
        this.tiles[17][35] = TILE_HAZARD;
        this.tiles[17][36] = TILE_HAZARD;

        // Platforms over hazard
        this._fill(34, 37, 14, 14, TILE_ONE_WAY);

        // SECTION D: Ice physics challenge (cols 41-55) — large ice surface
        this._placeIce(41, 55, 17, 17);

        // Elevated ice platform
        this._placeIce(44, 48, 13, 13);

        // Breakable blocks
        this._fill(50, 51, 14, 16, TILE_BREAKABLE);

        // SECTION E: Fire-lure puzzle (cols 56-68)
        this._fill(56, 68, 17, H - 1, TILE_SOLID);

        // Meltable ice wall blocking path (2 tiles wide for min platform width)
        this.tiles[15][61] = TILE_ICE;
        this.tiles[16][61] = TILE_ICE;
        this.tiles[15][62] = TILE_ICE;
        this.tiles[16][62] = TILE_ICE;
        this.meltableBlocks.push(
            { x: 61 * TILE_SIZE, y: 15 * TILE_SIZE, health: 3, melted: false, type: 'meltable_ice' },
            { x: 61 * TILE_SIZE, y: 16 * TILE_SIZE, health: 3, melted: false, type: 'meltable_ice' },
            { x: 62 * TILE_SIZE, y: 15 * TILE_SIZE, health: 3, melted: false, type: 'meltable_ice' },
            { x: 62 * TILE_SIZE, y: 16 * TILE_SIZE, health: 3, melted: false, type: 'meltable_ice' }
        );
        this.puzzleElements.push(
            { type: 'meltable_ice', x: 61, y: 15 },
            { type: 'meltable_ice', x: 61, y: 16 },
            { type: 'meltable_ice', x: 62, y: 15 },
            { type: 'meltable_ice', x: 62, y: 16 }
        );

        // Fire source (torch)
        this.fireSources.push(
            { x: 58 * TILE_SIZE, y: 14 * TILE_SIZE, type: 'torch', lured: false }
        );
        this.puzzleElements.push(
            { type: 'torch', x: 58, y: 14 },
            { type: 'fire', x: 58, y: 14 },
            { type: 'fire_lure', x: 58, y: 14 }
        );

        // Platforms in puzzle area
        this._fill(57, 60, 14, 14, TILE_SOLID);
        this._fill(63, 68, 14, 14, TILE_SOLID);

        // SECTION F: Vertical climb (cols 69-78)
        this._fill(69, 72, 14, 14, TILE_SOLID);
        this._fill(74, 77, 11, 11, TILE_ONE_WAY);
        this._fill(69, 72, 8, 8, TILE_SOLID);
        this._placeIce(74, 78, 17, 17);

        // SECTION G: Pre-boss area (cols 79-90)
        this._fill(79, 85, 15, 15, TILE_SOLID);
        this._placeIce(86, 90, 17, 17);
        this._fill(87, 90, 13, 13, TILE_ONE_WAY);

        // =====================
        // BOSS ARENA (cols 91-119)
        // =====================
        this.bossArenaX = 91 * TILE_SIZE;
        // Arena walls (left wall with entry gap at rows 15-16)
        this._fill(91, 91, 5, 14, TILE_SOLID);
        this._fill(119, 119, 5, 16, TILE_SOLID);
        // Arena ceiling
        this._fill(91, 119, 5, 5, TILE_SOLID);
        // Arena floor — ice!
        this._placeIce(91, 119, 17, 17);
        this._fill(91, 119, 18, H - 1, TILE_SOLID);
        // Arena platforms (tiered for boss fight)
        this._fill(95, 99, 13, 13, TILE_ONE_WAY);
        this._fill(107, 111, 13, 13, TILE_ONE_WAY);
        this._fill(100, 105, 10, 10, TILE_ONE_WAY);

        // Boss data
        this.bossData = {
            type: 'frost_bear',
            spawnX: 108 * TILE_SIZE,
            spawnY: 13 * TILE_SIZE,
        };

        // Exit after boss
        this.exitX = 117 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Player spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Enemy spawns (Frost Imps and Ice Golems)
        this.enemySpawns = [
            { type: 'frost_imp', x: 15 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'ice_golem', x: 30 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'frost_imp', x: 42 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'ice_golem', x: 52 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'frost_imp', x: 65 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'ice_golem', x: 80 * TILE_SIZE, y: 13 * TILE_SIZE },
        ];

        // Coins (20 total)
        const coinSpots = [
            [3,15],[5,15],[7,15],        // Starting area
            [14,15],[16,15],             // First ice
            [18,12],[23,11],             // Above platforms
            [29,12],[31,12],             // Mid-section
            [37,12],[39,15],             // Mixed terrain
            [43,15],[45,11],[47,11],     // Ice challenge
            [53,15],[55,15],             // Before puzzle
            [60,12],[66,12],             // Puzzle area
            [76,9],[83,13],              // Pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (2)
        this.healthPositions = [
            { x: 40 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
            { x: 75 * TILE_SIZE + 8, y: 15 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 3-2: CRYSTAL CAVERNS (Ice block puzzles, 135 tiles)
    // =============================================
    _buildStage3_2() {
        const W = 135;
        const H = 22;
        this._initGrid(W, H);
        this.name = 'Crystal Caverns';
        this.id = '3-2';

        // Ground floor (rows 19-21)
        this._fill(0, W - 1, 19, H - 1, TILE_SOLID);

        // Ceiling (cavern roof, rows 0-2)
        this._fill(0, W - 1, 0, 2, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 3, 18, TILE_SOLID);

        // SECTION A: Cavern entrance (cols 1-12)
        // Crystal formations on ceiling
        this.tiles[3][5] = TILE_SOLID;
        this.tiles[3][6] = TILE_SOLID;
        this.tiles[4][5] = TILE_SOLID;
        this.tiles[3][10] = TILE_SOLID;
        this.tiles[4][10] = TILE_SOLID;

        // SECTION B: First ice block puzzle (cols 13-28)
        this._placeIce(13, 28, 19, 19);
        // Ice block that can be pushed
        this.iceBlocks.push(
            { x: 18 * TILE_SIZE, y: 17 * TILE_SIZE, width: 32, height: 32, vx: 0, sliding: false, melted: false, type: 'ice_block' }
        );
        // Wall the block needs to hit (widened cap to 2 tiles)
        this._fill(25, 25, 15, 18, TILE_SOLID);
        this._fill(24, 24, 15, 15, TILE_SOLID); // Cap adjacent tile for min platform width
        // Platform above that needs block as step
        this._fill(26, 30, 14, 14, TILE_SOLID);
        // Gap that block fills
        this._fill(23, 24, 19, H - 1, TILE_EMPTY);

        // SECTION C: Crystal chamber (cols 29-45)
        this._fill(29, 34, 16, 16, TILE_SOLID);
        this._fill(36, 40, 13, 13, TILE_ONE_WAY);
        this._fill(41, 45, 16, 16, TILE_SOLID);

        // Crystal stalactites
        this._fill(33, 33, 3, 6, TILE_SOLID);
        this._fill(38, 38, 3, 5, TILE_SOLID);
        this._fill(43, 43, 3, 7, TILE_SOLID);

        // SECTION D: Second ice block puzzle (cols 46-62)
        this._placeIce(46, 62, 19, 19);
        // Multiple ice blocks for puzzle
        this.iceBlocks.push(
            { x: 50 * TILE_SIZE, y: 17 * TILE_SIZE, width: 32, height: 32, vx: 0, sliding: false, melted: false, type: 'ice_block' },
            { x: 56 * TILE_SIZE, y: 17 * TILE_SIZE, width: 32, height: 32, vx: 0, sliding: false, melted: false, type: 'ice_block' }
        );
        // Walls and gaps (widened caps to 2 tiles)
        this._fill(54, 54, 14, 18, TILE_SOLID);
        this._fill(53, 53, 14, 14, TILE_SOLID); // Cap adjacent tile for min platform width
        this._fill(60, 60, 15, 18, TILE_SOLID);
        this._fill(59, 59, 15, 15, TILE_SOLID); // Cap adjacent tile for min platform width
        this._fill(48, 49, 19, H - 1, TILE_EMPTY);

        // SECTION E: Vertical crystal shaft (cols 63-72)
        this._fill(63, 66, 16, 16, TILE_SOLID);
        this._fill(68, 71, 12, 12, TILE_ONE_WAY);
        this._fill(63, 66, 8, 8, TILE_SOLID);
        this._fill(68, 72, 19, H - 1, TILE_SOLID);

        // Bouncing crystal
        this.tiles[19][65] = TILE_BOUNCE;
        this.tiles[19][66] = TILE_BOUNCE;

        // SECTION F: Deep cavern (cols 73-88)
        this._fill(73, 78, 15, 15, TILE_SOLID);
        this._placeIce(79, 85, 19, 19);
        this._fill(83, 88, 13, 13, TILE_ONE_WAY);

        // Crumbling platforms
        this.tiles[11][76] = TILE_CRUMBLE;
        this.tiles[11][77] = TILE_CRUMBLE;
        this.tiles[11][78] = TILE_CRUMBLE;

        // Hazards
        this.tiles[18][80] = TILE_HAZARD;
        this.tiles[18][81] = TILE_HAZARD;

        // SECTION G: Pre-boss crystal gallery (cols 89-104)
        this._fill(89, 95, 16, 16, TILE_SOLID);
        this._fill(96, 100, 13, 13, TILE_ONE_WAY);
        this._fill(101, 104, 16, 16, TILE_SOLID);
        this._placeIce(97, 104, 19, 19);

        // =====================
        // BOSS ARENA (cols 105-134)
        // =====================
        this.bossArenaX = 105 * TILE_SIZE;
        // Arena walls (left wall with entry gap at rows 17-18)
        this._fill(105, 105, 3, 16, TILE_SOLID);
        this._fill(134, 134, 3, 18, TILE_SOLID);
        // Arena ceiling
        this._fill(105, 134, 2, 3, TILE_SOLID);
        // Arena floor
        this._fill(105, 134, 19, H - 1, TILE_SOLID);
        // Boss platforms (crystal pillars)
        this._fill(110, 113, 14, 14, TILE_ONE_WAY);
        this._fill(118, 122, 11, 11, TILE_ONE_WAY);
        this._fill(125, 129, 14, 14, TILE_ONE_WAY);
        this._fill(115, 120, 7, 7, TILE_ONE_WAY);

        // Boss data
        this.bossData = {
            type: 'crystal_witch',
            spawnX: 120 * TILE_SIZE,
            spawnY: 8 * TILE_SIZE,
        };

        // Exit after boss
        this.exitX = 132 * TILE_SIZE;
        this.exitY = 18 * TILE_SIZE;

        // Player spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 17 * TILE_SIZE;

        // Enemy spawns (mixed types)
        this.enemySpawns = [
            { type: 'frost_imp', x: 10 * TILE_SIZE, y: 16 * TILE_SIZE },
            { type: 'ice_golem', x: 20 * TILE_SIZE, y: 16 * TILE_SIZE },
            { type: 'snow_owl', x: 35 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'frost_imp', x: 48 * TILE_SIZE, y: 16 * TILE_SIZE },
            { type: 'ice_golem', x: 58 * TILE_SIZE, y: 16 * TILE_SIZE },
            { type: 'snow_owl', x: 70 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'frost_imp', x: 82 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'ice_golem', x: 95 * TILE_SIZE, y: 14 * TILE_SIZE },
        ];

        // Coins (24 total)
        const coinSpots = [
            [3,17],[5,17],[8,17],         // Entrance
            [14,17],[16,17],[20,15],       // First puzzle
            [27,12],[30,14],[33,14],       // Crystal chamber
            [37,11],[40,11],[44,14],       // Chamber cont.
            [49,17],[52,15],[55,15],       // Second puzzle
            [59,17],[64,14],[69,10],       // Crystal shaft
            [72,10],[75,13],[80,17],       // Deep cavern
            [85,11],[90,14],[100,11],      // Pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (2)
        this.healthPositions = [
            { x: 42 * TILE_SIZE + 8, y: 17 * TILE_SIZE },
            { x: 88 * TILE_SIZE + 8, y: 17 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 3-3: AVALANCHE PEAK (Auto-scroll + path forks, 165 tiles)
    // =============================================
    _buildStage3_3() {
        const W = 165;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'Avalanche Peak';
        this.id = '3-3';
        this.autoScroll = true;
        this.autoScrollSpeed = 1.2;

        // Ground floor
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);
        this._fill(1, 1, 5, 5, TILE_SOLID); // Widen wall cap to 2 tiles

        // SECTION A: Starting area (cols 1-12) — safe zone before scroll starts
        this._placeIce(5, 12, 17, 17);

        // SECTION B: First platforming section (cols 13-30)
        this._fill(13, 16, 14, 14, TILE_SOLID);
        this._placeIce(17, 22, 17, 17);
        this._fill(23, 26, 12, 12, TILE_ONE_WAY);
        this._fill(27, 30, 15, 15, TILE_SOLID);

        // Gap
        this._fill(20, 21, 17, H - 1, TILE_EMPTY);

        // SECTION C: FORK 1 — Upper and lower path (cols 31-50)
        // Define fork section for tests
        this.forkSections.push({ startCol: 31, endCol: 50, type: 'split' });
        this.pathForks.push({ startCol: 31, endCol: 50, type: 'split' });

        // UPPER PATH (rows 6-10)
        this._fill(31, 35, 9, 9, TILE_ONE_WAY);
        this._fill(37, 41, 7, 7, TILE_ONE_WAY);
        this._fill(43, 47, 9, 9, TILE_ONE_WAY);

        // LOWER PATH (rows 14-17)
        this._placeIce(31, 36, 15, 15);
        this._fill(38, 42, 15, 15, TILE_SOLID);
        this._placeIce(44, 50, 15, 15);

        // Divider between paths
        this._fill(31, 50, 11, 11, TILE_SOLID);

        // Rejoin at col 50
        this._fill(48, 52, 14, 14, TILE_SOLID);

        // SECTION D: Hazard gauntlet (cols 51-65)
        this._fill(51, 55, 15, 15, TILE_SOLID);
        this._fill(57, 60, 13, 13, TILE_ONE_WAY);
        this._placeIce(61, 65, 17, 17);

        // Hazards
        this.tiles[16][53] = TILE_HAZARD;
        this.tiles[16][54] = TILE_HAZARD;
        this.tiles[16][63] = TILE_HAZARD;
        this.tiles[16][64] = TILE_HAZARD;

        // SECTION E: FORK 2 — Upper and lower path (cols 66-85)
        this.forkSections.push({ startCol: 66, endCol: 85, type: 'split' });
        this.pathForks.push({ startCol: 66, endCol: 85, type: 'split' });

        // UPPER PATH
        this._fill(66, 70, 8, 8, TILE_ONE_WAY);
        this._fill(72, 76, 6, 6, TILE_ONE_WAY);
        this._fill(78, 82, 8, 8, TILE_ONE_WAY);

        // LOWER PATH
        this._fill(66, 70, 15, 15, TILE_SOLID);
        this._placeIce(72, 76, 15, 15);
        this._fill(78, 85, 15, 15, TILE_SOLID);

        // Divider
        this._fill(66, 85, 11, 11, TILE_SOLID);

        // Rejoin
        this._fill(83, 88, 13, 13, TILE_SOLID);

        // SECTION F: Mountain ascent (cols 86-105)
        this._fill(86, 90, 15, 15, TILE_SOLID);
        this._fill(92, 95, 13, 13, TILE_ONE_WAY);
        this._fill(97, 100, 11, 11, TILE_ONE_WAY);
        this._fill(101, 105, 14, 14, TILE_SOLID);

        // Bouncy ice crystals
        this.tiles[17][94] = TILE_BOUNCE;
        this.tiles[17][95] = TILE_BOUNCE;

        // SECTION G: FORK 3 (cols 106-125)
        this.forkSections.push({ startCol: 106, endCol: 125, type: 'split' });
        this.pathForks.push({ startCol: 106, endCol: 125, type: 'split' });

        // UPPER PATH
        this._fill(106, 110, 8, 8, TILE_ONE_WAY);
        this._placeIce(112, 116, 7, 7);
        this._fill(118, 122, 8, 8, TILE_ONE_WAY);

        // LOWER PATH
        this._placeIce(106, 112, 15, 15);
        this._fill(114, 118, 15, 15, TILE_SOLID);
        this._placeIce(120, 125, 15, 15);

        // Divider
        this._fill(106, 125, 11, 11, TILE_SOLID);

        // Rejoin
        this._fill(123, 128, 13, 13, TILE_SOLID);

        // SECTION H: Pre-boss sprint (cols 126-134)
        this._fill(126, 130, 15, 15, TILE_SOLID);
        this._placeIce(131, 134, 17, 17);

        // =====================
        // BOSS ARENA (cols 135-164)
        // =====================
        this.bossArenaX = 135 * TILE_SIZE;
        // Arena walls (left wall with entry gap at rows 15-16)
        this._fill(135, 135, 3, 14, TILE_SOLID);
        this._fill(164, 164, 3, 16, TILE_SOLID);
        // Arena ceiling
        this._fill(135, 164, 3, 3, TILE_SOLID);
        // Arena floor
        this._fill(135, 164, 17, H - 1, TILE_SOLID);
        // Tiered platforms (multiple heights for Yeti Monarch fight)
        this._fill(139, 143, 14, 14, TILE_ONE_WAY);
        this._fill(147, 151, 11, 11, TILE_ONE_WAY);
        this._fill(153, 157, 14, 14, TILE_ONE_WAY);
        this._fill(143, 148, 8, 8, TILE_ONE_WAY);
        this._fill(155, 160, 8, 8, TILE_ONE_WAY);

        // Boss data
        this.bossData = {
            type: 'yeti_monarch',
            spawnX: 155 * TILE_SIZE,
            spawnY: 12 * TILE_SIZE,
        };

        // Exit after boss
        this.exitX = 162 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Player spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Enemy spawns (all 3 tundra enemy types)
        this.enemySpawns = [
            { type: 'frost_imp', x: 8 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'ice_golem', x: 25 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'snow_owl', x: 40 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'frost_imp', x: 55 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'ice_golem', x: 70 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'snow_owl', x: 80 * TILE_SIZE, y: 5 * TILE_SIZE },
            { type: 'frost_imp', x: 95 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'ice_golem', x: 110 * TILE_SIZE, y: 13 * TILE_SIZE },
            { type: 'snow_owl', x: 120 * TILE_SIZE, y: 6 * TILE_SIZE },
        ];

        // Coins (30 total)
        const coinSpots = [
            [3,15],[6,15],[9,15],          // Start
            [14,12],[17,15],[20,10],        // Section B
            [33,7],[37,5],[46,7],            // Fork 1 upper
            [32,13],[36,13],[45,13],        // Fork 1 lower
            [53,13],[57,11],[62,15],        // Gauntlet
            [68,6],[73,4],[79,6],           // Fork 2 upper
            [67,13],[74,13],[82,13],        // Fork 2 lower
            [88,13],[93,11],[99,9],         // Mountain ascent
            [108,6],[114,5],[120,6],        // Fork 3 upper
            [109,13],[118,13],[127,13],     // Fork 3 lower + pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (3)
        this.healthPositions = [
            { x: 35 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
            { x: 75 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
            { x: 115 * TILE_SIZE + 8, y: 13 * TILE_SIZE },
        ];
    },

    // =============================================
    // VOLCANO MECHANICS
    // =============================================

    update(dt) {
        // Rising/falling lava mechanic
        if (this.lavaLevel !== null && this.lavaRiseSpeed > 0) {
            this.lavaLevel += this.lavaDirection * this.lavaRiseSpeed * dt;
            // Oscillate between min and max
            if (this.lavaLevel >= this.lavaMaxLevel) {
                this.lavaLevel = this.lavaMaxLevel;
                this.lavaDirection = -1;
            } else if (this.lavaLevel <= this.lavaMinLevel) {
                this.lavaLevel = this.lavaMinLevel;
                this.lavaDirection = 1;
            }
            this.risingLava = this.lavaLevel;

            // Check if player is in lava
            const lavaWorldY = this.height * TILE_SIZE - this.lavaLevel;
            if (Player.y + Player.height > lavaWorldY && Player.state !== 'dead' && Player.state !== 'hurt') {
                if (!Player.invincible) {
                    Player.takeDamage();
                }
            }
        }

        // Update chain swing physics
        for (const chain of this.chains) {
            if (chain.grabbed && Player.grabbedChain === chain) {
                // Pendulum physics
                const gravity = 0.003;
                chain.angularVel += -gravity * Math.sin(chain.angle);
                chain.angularVel *= 0.995; // Damping
                chain.angle += chain.angularVel;
                // Update player position on chain
                Player.x = chain.x + Math.sin(chain.angle) * chain.length - Player.width / 2;
                Player.y = chain.y + Math.cos(chain.angle) * chain.length - Player.height / 2;
                Player.vy = 0;
                Player.vx = 0;
            }
        }
    },

    // =============================================
    // STAGE 4-1: LAVA FIELDS (120 tiles wide)
    // Rising lava mechanic, magma slimes, fire bats
    // =============================================
    _buildStage4_1() {
        const W = 125;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'Lava Fields';
        this.id = '4-1';

        // Ground floor (rows 17-19) — dark stone
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);

        // Lava pools at bottom (replacing some ground with lava)
        this._fill(12, 16, 17, 17, TILE_LAVA);
        this._fill(12, 16, 18, H - 1, TILE_SOLID);
        this._fill(25, 30, 17, 17, TILE_LAVA);
        this._fill(25, 30, 18, H - 1, TILE_SOLID);
        this._fill(42, 47, 17, 17, TILE_LAVA);
        this._fill(42, 47, 18, H - 1, TILE_SOLID);
        this._fill(55, 60, 17, 17, TILE_LAVA);
        this._fill(55, 60, 18, H - 1, TILE_SOLID);
        this._fill(68, 73, 17, 17, TILE_LAVA);
        this._fill(68, 73, 18, H - 1, TILE_SOLID);

        // SECTION A: Starting area (cols 1-10) — flat ground
        // Safe intro with solid ground

        // SECTION B: First lava pool (cols 11-20)
        // Platforms over lava
        this._fill(11, 11, 14, 16, TILE_SOLID);
        this._fill(17, 20, 14, 14, TILE_ONE_WAY);

        // SECTION C: Rising platforms (cols 21-35)
        this._fill(22, 24, 14, 14, TILE_SOLID);
        this._fill(31, 34, 12, 12, TILE_ONE_WAY);
        this._fill(31, 34, 15, 15, TILE_SOLID);

        // SECTION D: Crumbling over lava (cols 36-50)
        this._fill(36, 39, 14, 14, TILE_SOLID);
        this.tiles[14][40] = TILE_CRUMBLE;
        this.tiles[14][41] = TILE_CRUMBLE;
        this._fill(48, 52, 13, 13, TILE_SOLID);

        // Breakable blocks
        this._fill(49, 49, 14, 16, TILE_BREAKABLE);

        // SECTION E: Vertical climb with lava below (cols 51-65)
        this._fill(52, 54, 10, 10, TILE_ONE_WAY);
        this._fill(56, 58, 7, 7, TILE_ONE_WAY);
        this._fill(53, 55, 15, 15, TILE_SOLID);
        this._fill(61, 64, 13, 13, TILE_SOLID);
        this._fill(61, 64, 9, 9, TILE_ONE_WAY);

        // SECTION F: Lava gauntlet (cols 66-80)
        this._fill(66, 67, 14, 14, TILE_SOLID);
        this._fill(74, 77, 14, 14, TILE_ONE_WAY);
        this._fill(78, 80, 12, 12, TILE_SOLID);
        this._fill(80, 82, 15, 15, TILE_SOLID);

        // SECTION G: Pre-boss area (cols 83-94)
        this._fill(83, 88, 14, 14, TILE_SOLID);
        this._fill(90, 93, 12, 12, TILE_ONE_WAY);

        // =====================
        // BOSS ARENA (cols 95-124)
        // =====================
        this.bossArenaX = 95 * TILE_SIZE;
        // Arena walls (left wall with entry gap at rows 15-16)
        this._fill(95, 95, 3, 14, TILE_SOLID);
        this._fill(124, 124, 3, 16, TILE_SOLID);
        // Arena ceiling
        this._fill(95, 124, 3, 3, TILE_SOLID);
        // Arena floor
        this._fill(95, 124, 17, H - 1, TILE_SOLID);
        // Lava in arena floor
        this._fill(100, 108, 17, 17, TILE_LAVA);
        this._fill(112, 120, 17, 17, TILE_LAVA);
        // Arena platforms
        this._fill(99, 103, 13, 13, TILE_ONE_WAY);
        this._fill(109, 113, 13, 13, TILE_ONE_WAY);
        this._fill(104, 108, 9, 9, TILE_ONE_WAY);
        this._fill(115, 119, 13, 13, TILE_ONE_WAY);

        // Boss data
        this.bossData = {
            type: 'lava_serpent',
            spawnX: 112 * TILE_SIZE,
            spawnY: 10 * TILE_SIZE,
        };

        // Exit after boss
        this.exitX = 122 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Player spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Rising lava setup (oscillates between min and max)
        this.lavaLevel = 40;
        this.risingLava = 40;
        this.lavaRiseSpeed = 12;
        this.lavaSpeed = 12;
        this.lavaDirection = 1;
        this.lavaMinLevel = 40;
        this.lavaMaxLevel = 120;

        // Enemy spawns (Magma Slimes and Fire Bats)
        this.enemySpawns = [
            { type: 'magma_slime', x: 18 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 28 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'magma_slime', x: 37 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 45 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'magma_slime', x: 62 * TILE_SIZE, y: 11 * TILE_SIZE },
            { type: 'fire_bat', x: 70 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'magma_slime', x: 79 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 85 * TILE_SIZE, y: 8 * TILE_SIZE },
        ];

        // Coins (22 total)
        const coinSpots = [
            [3,15],[5,15],[7,15],            // Starting area
            [13,12],[15,12],                 // Over first lava
            [19,12],[23,12],                 // Platforms
            [32,10],[34,10],                 // High platforms
            [38,12],[41,12],                 // Crumble section
            [49,11],[51,8],                  // Vertical climb
            [57,5],[59,5],                   // High platforms
            [63,11],[65,7],                  // More climb
            [67,12],[70,12],                 // Gauntlet
            [75,12],[78,10],                 // Platforms
            [84,12],                         // Pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (2)
        this.healthPositions = [
            { x: 40 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 80 * TILE_SIZE + 8, y: 10 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 4-2: FORGE OF CHAINS (140 tiles wide)
    // Chain-swinging, Obsidian Knights, valve puzzles
    // =============================================
    _buildStage4_2() {
        const W = 145;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'Forge of Chains';
        this.id = '4-2';

        // Ground floor (rows 17-19)
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);

        // Large lava pits throughout
        this._fill(15, 22, 17, 17, TILE_LAVA);
        this._fill(15, 22, 18, H - 1, TILE_SOLID);
        this._fill(35, 45, 17, 17, TILE_LAVA);
        this._fill(35, 45, 18, H - 1, TILE_SOLID);
        this._fill(58, 68, 17, 17, TILE_LAVA);
        this._fill(58, 68, 18, H - 1, TILE_SOLID);
        this._fill(80, 88, 17, 17, TILE_LAVA);
        this._fill(80, 88, 18, H - 1, TILE_SOLID);
        this._fill(100, 108, 17, 17, TILE_LAVA);
        this._fill(100, 108, 18, H - 1, TILE_SOLID);

        // SECTION A: Starting area (cols 1-14)
        this._fill(1, 14, 17, H - 1, TILE_SOLID);

        // SECTION B: First chain crossing (cols 15-28)
        this._fill(14, 14, 10, 16, TILE_SOLID);
        this._fill(23, 28, 14, 14, TILE_SOLID);

        // SECTION C: Forge platforms (cols 29-45)
        this._fill(29, 34, 14, 14, TILE_SOLID);
        this._fill(46, 50, 13, 13, TILE_SOLID);
        this._fill(33, 34, 10, 10, TILE_ONE_WAY);

        // SECTION D: Second chain crossing (cols 46-70)
        this._fill(51, 57, 14, 14, TILE_SOLID);
        this._fill(69, 74, 14, 14, TILE_SOLID);
        this._fill(54, 57, 10, 10, TILE_ONE_WAY);

        // SECTION E: Obsidian Knight area (cols 75-95)
        this._fill(75, 79, 14, 14, TILE_SOLID);
        this._fill(89, 95, 14, 14, TILE_SOLID);
        this._fill(82, 87, 12, 12, TILE_ONE_WAY);
        this._fill(91, 94, 10, 10, TILE_ONE_WAY);

        // SECTION F: Valve puzzle area (cols 96-110)
        this._fill(96, 99, 14, 14, TILE_SOLID);
        this._fill(109, 114, 14, 14, TILE_SOLID);
        this._fill(112, 114, 10, 10, TILE_ONE_WAY);

        // SECTION G: Pre-boss (cols 115-120)
        this._fill(115, 120, 14, 14, TILE_SOLID);

        // =====================
        // BOSS ARENA (cols 121-144)
        // =====================
        this.bossArenaX = 121 * TILE_SIZE;
        // Left wall with entry gap at rows 15-16
        this._fill(121, 121, 3, 14, TILE_SOLID);
        this._fill(144, 144, 3, 16, TILE_SOLID);
        this._fill(121, 144, 3, 3, TILE_SOLID);
        this._fill(121, 144, 17, H - 1, TILE_SOLID);
        // Arena lava
        this._fill(126, 132, 17, 17, TILE_LAVA);
        this._fill(136, 142, 17, 17, TILE_LAVA);
        // Arena platforms
        this._fill(125, 129, 13, 13, TILE_ONE_WAY);
        this._fill(132, 136, 10, 10, TILE_ONE_WAY);
        this._fill(138, 142, 13, 13, TILE_ONE_WAY);

        // Boss data
        this.bossData = {
            type: 'iron_warden',
            spawnX: 135 * TILE_SIZE,
            spawnY: 10 * TILE_SIZE,
        };

        // Exit
        this.exitX = 142 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Chain swing points
        const chainData = [
            { x: 18 * TILE_SIZE, y: 3 * TILE_SIZE, length: 160, chainLength: 160 },
            { x: 40 * TILE_SIZE, y: 3 * TILE_SIZE, length: 160, chainLength: 160 },
            { x: 62 * TILE_SIZE, y: 3 * TILE_SIZE, length: 160, chainLength: 160 },
            { x: 84 * TILE_SIZE, y: 3 * TILE_SIZE, length: 160, chainLength: 160 },
            { x: 104 * TILE_SIZE, y: 3 * TILE_SIZE, length: 160, chainLength: 160 },
        ];
        this.chains = chainData.map(c => ({
            ...c, canGrab: true, grabbed: false, angle: 0, angularVel: 0
        }));
        this.swingPoints = this.chains;
        this.chainPoints = this.chains;

        // Valve/lever puzzle
        const valveData = [
            { x: 97 * TILE_SIZE, y: 13 * TILE_SIZE, activated: false, type: 'valve',
              target: { type: 'platform', startX: 100, endX: 108 } },
            { x: 110 * TILE_SIZE, y: 13 * TILE_SIZE, activated: false, type: 'lever',
              target: { type: 'gate', col: 112, rowStart: 11, rowEnd: 13 } },
        ];
        this.valves = valveData;
        this.levers = valveData;
        this.puzzleElements = valveData.map(v => ({
            type: v.type, x: Math.floor(v.x / TILE_SIZE), y: Math.floor(v.y / TILE_SIZE)
        }));

        // Enemy spawns
        this.enemySpawns = [
            { type: 'magma_slime', x: 10 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'fire_bat', x: 30 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'obsidian_knight', x: 52 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'magma_slime', x: 70 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'obsidian_knight', x: 78 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 90 * TILE_SIZE, y: 7 * TILE_SIZE },
            { type: 'obsidian_knight', x: 96 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'magma_slime', x: 115 * TILE_SIZE, y: 12 * TILE_SIZE },
        ];

        // Coins (26 total)
        const coinSpots = [
            [3,15],[6,15],[9,15],            // Start
            [16,8],[18,6],[20,8],            // Chain 1
            [26,12],[30,12],                 // After chain
            [33,8],[38,6],[40,8],            // Chain 2
            [47,11],[50,11],                 // Forge
            [55,8],[60,6],[65,8],            // Chain 3
            [70,12],[74,12],                 // Platforms
            [82,10],[85,6],[88,10],          // Chain 4
            [92,12],[95,8],                  // Knight area
            [102,6],[106,8],                 // Chain 5
            [116,12],                        // Pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (2)
        this.healthPositions = [
            { x: 48 * TILE_SIZE + 8, y: 11 * TILE_SIZE },
            { x: 95 * TILE_SIZE + 8, y: 8 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 4-3: CALDERA (155 tiles wide)
    // All 3 enemy types, Dragon boss (2-phase, 11 HP)
    // =============================================
    _buildStage4_3() {
        const W = 155;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'Caldera';
        this.id = '4-3';

        // Ground floor (rows 17-19)
        this._fill(0, W - 1, 17, H - 1, TILE_SOLID);

        // Left wall
        this._fill(0, 0, 5, 16, TILE_SOLID);

        // Extensive lava throughout
        this._fill(14, 20, 17, 17, TILE_LAVA);
        this._fill(14, 20, 18, H - 1, TILE_SOLID);
        this._fill(30, 38, 17, 17, TILE_LAVA);
        this._fill(30, 38, 18, H - 1, TILE_SOLID);
        this._fill(48, 55, 17, 17, TILE_LAVA);
        this._fill(48, 55, 18, H - 1, TILE_SOLID);
        this._fill(65, 72, 17, 17, TILE_LAVA);
        this._fill(65, 72, 18, H - 1, TILE_SOLID);
        this._fill(82, 90, 17, 17, TILE_LAVA);
        this._fill(82, 90, 18, H - 1, TILE_SOLID);
        this._fill(100, 108, 17, 17, TILE_LAVA);
        this._fill(100, 108, 18, H - 1, TILE_SOLID);
        this._fill(115, 120, 17, 17, TILE_LAVA);
        this._fill(115, 120, 18, H - 1, TILE_SOLID);

        // SECTION A: Starting area (cols 1-13)
        // Solid ground with some hazards

        // SECTION B: Slime gauntlet (cols 14-28)
        this._fill(13, 13, 10, 16, TILE_SOLID);
        this._fill(21, 25, 14, 14, TILE_SOLID);
        this._fill(26, 29, 12, 12, TILE_ONE_WAY);

        // SECTION C: Fire Bat crossing (cols 29-45)
        this._fill(39, 42, 14, 14, TILE_SOLID);
        this._fill(43, 47, 12, 12, TILE_ONE_WAY);

        // SECTION D: Knight fortress (cols 46-62)
        this._fill(46, 47, 14, 14, TILE_SOLID);
        this._fill(56, 60, 14, 14, TILE_SOLID);
        this._fill(50, 54, 11, 11, TILE_SOLID);
        this._fill(56, 60, 8, 8, TILE_ONE_WAY);
        this._fill(61, 64, 14, 14, TILE_SOLID);

        // SECTION E: Mixed enemy gauntlet (cols 63-80)
        this._fill(73, 76, 14, 14, TILE_SOLID);
        this._fill(77, 81, 12, 12, TILE_ONE_WAY);
        this._fill(73, 76, 9, 9, TILE_ONE_WAY);

        // SECTION F: Vertical challenge (cols 81-98)
        this._fill(91, 95, 14, 14, TILE_SOLID);
        this._fill(88, 90, 11, 11, TILE_ONE_WAY);
        this._fill(93, 96, 8, 8, TILE_ONE_WAY);
        this._fill(96, 99, 14, 14, TILE_SOLID);

        // SECTION G: Final gauntlet (cols 99-115)
        this._fill(109, 114, 14, 14, TILE_SOLID);
        this._fill(105, 108, 11, 11, TILE_ONE_WAY);
        this._fill(109, 114, 8, 8, TILE_ONE_WAY);

        // SECTION H: Pre-boss (cols 116-125)
        this._fill(121, 125, 14, 14, TILE_SOLID);

        // =====================
        // BOSS ARENA (cols 126-154)
        // =====================
        this.bossArenaX = 126 * TILE_SIZE;
        // Left wall with entry gap at rows 15-16
        this._fill(126, 126, 2, 14, TILE_SOLID);
        this._fill(154, 154, 2, 16, TILE_SOLID);
        this._fill(126, 154, 2, 2, TILE_SOLID);
        this._fill(126, 154, 17, H - 1, TILE_SOLID);
        // Arena lava
        this._fill(131, 138, 17, 17, TILE_LAVA);
        this._fill(143, 150, 17, 17, TILE_LAVA);
        // Arena platforms (tiered)
        this._fill(130, 134, 13, 13, TILE_ONE_WAY);
        this._fill(137, 141, 9, 9, TILE_ONE_WAY);
        this._fill(144, 148, 13, 13, TILE_ONE_WAY);
        this._fill(134, 137, 6, 6, TILE_ONE_WAY);
        this._fill(148, 152, 9, 9, TILE_ONE_WAY);

        // Boss data — Dragon of the Caldera
        this.bossData = {
            type: 'dragon_caldera',
            spawnX: 142 * TILE_SIZE,
            spawnY: 6 * TILE_SIZE,
        };

        // Exit
        this.exitX = 152 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // Spawn
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 15 * TILE_SIZE;

        // Enemy spawns (all 3 volcano types)
        this.enemySpawns = [
            { type: 'magma_slime', x: 8 * TILE_SIZE, y: 14 * TILE_SIZE },
            { type: 'magma_slime', x: 22 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 32 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'fire_bat', x: 38 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'fire_bat', x: 44 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'obsidian_knight', x: 51 * TILE_SIZE, y: 9 * TILE_SIZE },
            { type: 'obsidian_knight', x: 58 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'magma_slime', x: 74 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'fire_bat', x: 85 * TILE_SIZE, y: 6 * TILE_SIZE },
            { type: 'obsidian_knight', x: 92 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'magma_slime', x: 106 * TILE_SIZE, y: 9 * TILE_SIZE },
            { type: 'fire_bat', x: 118 * TILE_SIZE, y: 7 * TILE_SIZE },
        ];

        // Coins (32 total)
        const coinSpots = [
            [3,15],[5,15],[8,15],[10,15],     // Start
            [15,8],[17,8],[19,12],            // Section B
            [23,12],[25,10],[28,10],          // After slimes
            [32,6],[35,6],[38,12],            // Bat crossing
            [41,12],[44,10],                  // Platforms
            [47,12],[50,9],[53,9],            // Knight fortress
            [57,12],[60,6],                   // More fortress
            [67,6],[70,8],[74,12],            // Mixed gauntlet
            [78,10],[80,10],                  // Platforms
            [85,6],[89,9],[93,6],             // Vertical
            [97,12],[102,6],[106,9],          // Final gauntlet
            [122,12],                         // Pre-boss
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // Health pickups (3)
        this.healthPositions = [
            { x: 30 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 75 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
            { x: 110 * TILE_SIZE + 8, y: 12 * TILE_SIZE },
        ];
    },

    // =============================================
    // STAGE 5-1: THE CITADEL (Final Stage, 220 tiles wide)
    // 4 world-themed sections + boss arena
    // The longest stage in the game
    // =============================================
    _buildStage5_1() {
        const W = 220;
        const H = 20;
        this._initGrid(W, H);
        this.name = 'The Citadel';
        this.id = '5-1';

        // =============================================
        // CITADEL SECTION METADATA
        // =============================================
        this.citadelSections = [
            { theme: 'forest', world: 0, type: 'forest', startCol: 0, endCol: 49 },
            { theme: 'desert', world: 1, type: 'desert', startCol: 50, endCol: 99 },
            { theme: 'tundra', world: 2, type: 'tundra', startCol: 100, endCol: 149 },
            { theme: 'volcano', world: 3, type: 'volcano', startCol: 150, endCol: 189 }
        ];
        this.worldSections = this.citadelSections;
        this.sections = this.citadelSections;

        // =============================================
        // SECTION 1: FOREST (cols 0-49)
        // Green/brown palette, bark beetle, shroomba
        // =============================================

        // Ground floor (rows 18-19)
        this._fill(0, 49, 18, H - 1, TILE_SOLID);

        // Left wall boundary
        this._fill(0, 0, 0, 17, TILE_SOLID);

        // Canopy ceiling (bark beetle territory)
        this._fill(5, 20, 0, 1, TILE_SOLID);
        this._fill(25, 45, 0, 1, TILE_SOLID);

        // Forest platforms
        this._fill(5, 9, 14, 14, TILE_SOLID);      // Low platform
        this._fill(12, 16, 11, 11, TILE_SOLID);     // Mid platform
        this._fill(19, 23, 13, 13, TILE_SOLID);     // Stepping stone

        // Gap in ground
        this._fill(15, 17, 18, H - 1, TILE_EMPTY);
        this._fill(16, 16, 17, 17, TILE_HAZARD);    // Spikes at bottom of gap

        // More forest platforms
        this._fill(25, 30, 15, 15, TILE_SOLID);     // Wide platform
        this._fill(33, 36, 12, 12, TILE_SOLID);     // High platform
        this._fill(38, 42, 14, 14, TILE_SOLID);     // Medium platform
        this._fill(44, 48, 16, 16, TILE_SOLID);     // Low platform

        // Another gap
        this._fill(30, 32, 18, H - 1, TILE_EMPTY);
        this._fill(31, 31, 17, 17, TILE_HAZARD);

        // Breakable blocks hiding shortcut
        this._fill(27, 28, 12, 12, TILE_BREAKABLE);

        // =============================================
        // SECTION 2: DESERT (cols 50-99)
        // Sand palette, quicksand, dust devil
        // =============================================

        // Ground floor
        this._fill(50, 99, 18, H - 1, TILE_SOLID);

        // Transition wall (thin)
        this._fill(49, 49, 5, 17, TILE_SOLID);

        // Quicksand pit 1 (cols 55-59)
        this._fill(55, 59, 18, 18, TILE_QUICKSAND);
        this._fill(56, 58, 19, 19, TILE_QUICKSAND_DEEP);
        for (let c = 55; c <= 59; c++) this.quicksandTiles.push({ x: c, y: 18 });
        for (let c = 56; c <= 58; c++) this.quicksandTiles.push({ x: c, y: 19 });

        // Desert platforms
        this._fill(52, 54, 15, 15, TILE_SOLID);     // Entry platform
        this._fill(61, 65, 14, 14, TILE_SOLID);     // Over quicksand
        this._fill(67, 70, 11, 11, TILE_SOLID);     // High platform
        this._fill(73, 76, 13, 13, TILE_SOLID);     // Mid platform

        // Quicksand pit 2 (cols 78-83)
        this._fill(78, 83, 18, 18, TILE_QUICKSAND);
        this._fill(79, 82, 19, 19, TILE_QUICKSAND_DEEP);
        for (let c = 78; c <= 83; c++) this.quicksandTiles.push({ x: c, y: 18 });
        for (let c = 79; c <= 82; c++) this.quicksandTiles.push({ x: c, y: 19 });

        // More desert platforms
        this._fill(84, 87, 15, 15, TILE_SOLID);
        this._fill(89, 93, 12, 12, TILE_SOLID);     // High stretch
        this._fill(95, 98, 16, 16, TILE_SOLID);     // Low platform

        // Ground gaps
        this._fill(68, 70, 18, H - 1, TILE_EMPTY);
        this._fill(69, 69, 17, 17, TILE_HAZARD);

        // Crumbling blocks
        for (let c = 90; c <= 93; c++) {
            this.tiles[12][c] = TILE_CRUMBLE;
            this.crumblingTiles.push({ col: c, row: 12, timer: 0, shaking: false });
        }

        // =============================================
        // SECTION 3: TUNDRA (cols 100-149)
        // Ice palette, ice physics, frost imp, ice golem
        // =============================================

        // Ground floor
        this._fill(100, 149, 18, H - 1, TILE_SOLID);

        // Ice floor zones (ice physics)
        this._placeIce(103, 115, 17, 17);           // Ice surface layer 1
        this._placeIce(120, 135, 17, 17);           // Ice surface layer 2
        this._placeIce(140, 148, 17, 17);           // Ice surface layer 3

        // Track ice zones for evaluator test
        this.iceZones = [
            { startCol: 103, endCol: 115, row: 17 },
            { startCol: 120, endCol: 135, row: 17 },
            { startCol: 140, endCol: 148, row: 17 }
        ];

        // Tundra platforms (some icy)
        this._fill(105, 109, 14, 14, TILE_SOLID);
        this._placeIce(106, 108, 13, 13);           // Ice platform
        this._fill(112, 116, 11, 11, TILE_SOLID);
        this._placeIce(113, 115, 10, 10);           // Ice platform high

        this._fill(120, 124, 13, 13, TILE_SOLID);
        this._fill(128, 133, 15, 15, TILE_SOLID);
        this._placeIce(129, 132, 14, 14);           // Icy top
        this._fill(136, 140, 12, 12, TILE_SOLID);
        this._fill(143, 148, 14, 14, TILE_SOLID);

        // Gaps
        this._fill(117, 119, 18, H - 1, TILE_EMPTY);
        this._fill(118, 118, 17, 17, TILE_HAZARD);
        this._fill(134, 135, 18, H - 1, TILE_EMPTY);

        // Crumble blocks
        for (let c = 125; c <= 127; c++) {
            this.tiles[13][c] = TILE_CRUMBLE;
            this.crumblingTiles.push({ col: c, row: 13, timer: 0, shaking: false });
        }

        // =============================================
        // SECTION 4: VOLCANO (cols 150-189)
        // Dark stone/lava palette, rising lava, fire bat, magma slime
        // =============================================

        // Ground floor (limited — lava will rise!)
        this._fill(150, 189, 18, H - 1, TILE_SOLID);

        // Elevated platforms (escape from lava)
        this._fill(152, 156, 14, 14, TILE_SOLID);   // Starting platform
        this._fill(158, 161, 11, 11, TILE_SOLID);   // Mid-high
        this._fill(163, 167, 13, 13, TILE_SOLID);   // Medium
        this._fill(169, 172, 10, 10, TILE_SOLID);   // High
        this._fill(174, 178, 12, 12, TILE_SOLID);   // Medium-high
        this._fill(180, 184, 14, 14, TILE_SOLID);   // Lower
        this._fill(186, 189, 11, 11, TILE_SOLID);   // Exit ledge

        // Hazard tiles in lava section
        this._fill(160, 162, 17, 17, TILE_HAZARD);
        this._fill(170, 173, 17, 17, TILE_HAZARD);

        // Volcano gaps (lava pits)
        this._fill(157, 157, 18, H - 1, TILE_EMPTY);
        this._fill(168, 168, 18, H - 1, TILE_EMPTY);
        this._fill(179, 179, 18, H - 1, TILE_EMPTY);
        this._fill(185, 185, 18, H - 1, TILE_EMPTY);

        // Rising lava (starts low, rises slowly)
        this.lavaLevel = 30;
        this.risingLava = 30;
        this.lavaRiseSpeed = 8;
        this.lavaSpeed = 8;
        this.lavaDirection = 1;
        this.lavaMinLevel = 30;
        this.lavaMaxLevel = 100;

        // =============================================
        // BOSS ARENA (cols 190-219)
        // Flat arena for The Architect
        // =============================================

        // Arena ground
        this._fill(190, 219, 18, H - 1, TILE_SOLID);

        // Arena walls
        this._fill(190, 190, 2, 15, TILE_SOLID);    // Left wall (entry gap at rows 16-17)
        this._fill(219, 219, 0, 17, TILE_SOLID);    // Right wall

        // Arena ceiling
        this._fill(190, 219, 0, 1, TILE_SOLID);

        // Arena platforms for boss fight
        this._fill(195, 200, 14, 14, TILE_SOLID);   // Left platform
        this._fill(208, 213, 14, 14, TILE_SOLID);   // Right platform
        this._fill(200, 208, 10, 10, TILE_SOLID);   // Center high platform

        // =============================================
        // BOSS DATA
        // =============================================
        this.bossArenaX = 190 * TILE_SIZE;
        this.bossData = {
            type: 'the_architect',
            spawnX: 205 * TILE_SIZE,
            spawnY: 7 * TILE_SIZE
        };

        // =============================================
        // EXIT POINT (after boss)
        // =============================================
        this.exitX = 217 * TILE_SIZE;
        this.exitY = 16 * TILE_SIZE;

        // =============================================
        // PLAYER SPAWN
        // =============================================
        this.spawnX = 2 * TILE_SIZE;
        this.spawnY = 16 * TILE_SIZE;

        // =============================================
        // ENEMY SPAWNS (9 enemies from all 4 worlds)
        // =============================================
        this.enemySpawns = [
            // Forest enemies
            { type: 'barkbeetle', x: 10 * TILE_SIZE, y: 2 * TILE_SIZE },
            { type: 'barkbeetle', x: 30 * TILE_SIZE, y: 2 * TILE_SIZE },
            { type: 'shroomba', x: 40 * TILE_SIZE, y: 17 * TILE_SIZE },
            // Desert enemies
            { type: 'dust_devil', x: 63 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'sand_skitter', x: 88 * TILE_SIZE, y: 17 * TILE_SIZE },
            // Tundra enemies
            { type: 'frost_imp', x: 110 * TILE_SIZE, y: 12 * TILE_SIZE },
            { type: 'ice_golem', x: 130 * TILE_SIZE, y: 16 * TILE_SIZE },
            // Volcano enemies
            { type: 'fire_bat', x: 162 * TILE_SIZE, y: 8 * TILE_SIZE },
            { type: 'magma_slime', x: 175 * TILE_SIZE, y: 17 * TILE_SIZE },
        ];

        // =============================================
        // COINS (40 total — 10 per section)
        // =============================================
        const coinSpots = [
            // Forest section (10 coins)
            [3, 16], [7, 13], [14, 10], [20, 12], [26, 14],
            [34, 11], [39, 13], [42, 13], [46, 15], [48, 15],
            // Desert section (10 coins)
            [53, 14], [58, 16], [62, 13], [68, 10], [74, 12],
            [80, 16], [85, 14], [90, 11], [94, 11], [97, 15],
            // Tundra section (10 coins)
            [104, 13], [108, 13], [114, 10], [121, 12], [126, 12],
            [131, 14], [137, 11], [141, 13], [145, 13], [148, 13],
            // Volcano section (10 coins)
            [153, 13], [157, 10], [165, 12], [170, 9], [175, 11],
            [178, 11], [181, 13], [184, 13], [187, 10], [189, 10],
        ];
        this.coinPositions = [];
        for (const [c, r] of coinSpots) {
            this.coinPositions.push({ x: c * TILE_SIZE + 8, y: r * TILE_SIZE });
        }

        // =============================================
        // HEALTH PICKUPS (4 — one per section)
        // =============================================
        this.healthPositions = [
            { x: 22 * TILE_SIZE + 8, y: 12 * TILE_SIZE },   // Forest
            { x: 72 * TILE_SIZE + 8, y: 12 * TILE_SIZE },   // Desert
            { x: 122 * TILE_SIZE + 8, y: 12 * TILE_SIZE },  // Tundra
            { x: 176 * TILE_SIZE + 8, y: 11 * TILE_SIZE },  // Volcano
        ];
    }
};
