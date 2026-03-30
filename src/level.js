// ============================================================
// level.js — Level data and tile definitions
// ============================================================

// Level is a 2D array
// Row-major: level[row][col]

const Level = {
    tiles: [],
    width: 0,
    height: 0,
    spawnX: 0,
    spawnY: 0,
    movingPlatforms: [],
    coinPositions: [],
    healthPositions: [],

    init() {
        this.buildTestLevel();
    },

    buildTestLevel() {
        // Level: 140 tiles wide x 25 tiles tall (expanded for Sprint 2 testing)
        const W = 140;
        const H = 25;
        this.width = W;
        this.height = H;

        // Initialize with empty
        this.tiles = [];
        for (let r = 0; r < H; r++) {
            this.tiles[r] = [];
            for (let c = 0; c < W; c++) {
                this.tiles[r][c] = TILE_EMPTY;
            }
        }

        // =============================================
        // GROUND FLOOR — rows 21, 22, 23, 24 (bottom 4 solid)
        // CONTINUOUS from col 0 to col 139
        // =============================================
        for (let c = 0; c < W; c++) {
            for (let r = 21; r < H; r++) {
                this.tiles[r][c] = TILE_SOLID;
            }
        }

        // =============================================
        // SECTION A: LEFT WALL (col 0) — collision testing
        // =============================================
        for (let r = 5; r < 21; r++) {
            this.tiles[r][0] = TILE_SOLID;
        }

        // =============================================
        // SECTION B: ONE-WAY PLATFORMS (cols 5-9)
        // =============================================
        for (let c = 5; c <= 9; c++) {
            this.tiles[18][c] = TILE_ONE_WAY;
        }
        for (let c = 6; c <= 10; c++) {
            this.tiles[15][c] = TILE_ONE_WAY;
        }

        // =============================================
        // SECTION C: CEILING (cols 16-22) — for jump testing
        // =============================================
        for (let c = 16; c <= 22; c++) {
            this.tiles[18][c] = TILE_SOLID;
        }
        for (let c = 16; c <= 22; c++) {
            this.tiles[13][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION D: HAZARD TILES (cols 30-32)
        // Spikes on row 20, just above ground
        // =============================================
        this.tiles[20][30] = TILE_HAZARD;
        this.tiles[20][31] = TILE_HAZARD;
        this.tiles[20][32] = TILE_HAZARD;

        // =============================================
        // SECTION E: BREAKABLE BLOCKS (cols 38-42)
        // Breakable blocks for charge attack testing
        // =============================================
        this.tiles[18][38] = TILE_BREAKABLE;
        this.tiles[18][39] = TILE_BREAKABLE;
        this.tiles[18][40] = TILE_BREAKABLE;
        this.tiles[18][41] = TILE_BREAKABLE;
        this.tiles[18][42] = TILE_BREAKABLE;
        // Additional breakable blocks at ground level for easy access
        this.tiles[20][40] = TILE_BREAKABLE;
        this.tiles[20][41] = TILE_BREAKABLE;
        this.tiles[20][42] = TILE_BREAKABLE;

        // =============================================
        // SECTION F: BOUNCE PADS (cols 50-51)
        // =============================================
        this.tiles[21][50] = TILE_BOUNCE;
        this.tiles[21][51] = TILE_BOUNCE;
        // High platform as bounce target
        for (let c = 48; c <= 53; c++) {
            this.tiles[10][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION G: WALL JUMP SHAFT (cols 55-58)
        // Two tall walls with a gap to wall jump up
        // =============================================
        for (let r = 5; r < 21; r++) {
            this.tiles[r][55] = TILE_SOLID;
            this.tiles[r][56] = TILE_SOLID;
        }
        for (let r = 5; r < 21; r++) {
            this.tiles[r][59] = TILE_SOLID;
            this.tiles[r][60] = TILE_SOLID;
        }
        // Top platform reward
        for (let c = 55; c <= 60; c++) {
            this.tiles[5][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION H: MORE ONE-WAY PLATFORMS (cols 64-68)
        // =============================================
        for (let c = 64; c <= 68; c++) {
            this.tiles[18][c] = TILE_ONE_WAY;
        }
        for (let c = 65; c <= 69; c++) {
            this.tiles[15][c] = TILE_ONE_WAY;
        }

        // =============================================
        // SECTION I: LOW CEILING CRAWL (cols 73-80)
        // Ceiling at row 19 forces crouching to pass under
        // =============================================
        for (let c = 73; c <= 80; c++) {
            this.tiles[19][c] = TILE_SOLID;
        }
        // Add walls on sides to make it clear this is a crawl space
        this.tiles[20][72] = TILE_SOLID;
        this.tiles[19][72] = TILE_SOLID;
        this.tiles[20][81] = TILE_SOLID;
        this.tiles[19][81] = TILE_SOLID;

        // =============================================
        // SECTION J: MORE HAZARDS (cols 85-87)
        // =============================================
        this.tiles[20][85] = TILE_HAZARD;
        this.tiles[20][86] = TILE_HAZARD;
        this.tiles[20][87] = TILE_HAZARD;

        // =============================================
        // SECTION K: BOUNCE (col 90)
        // =============================================
        this.tiles[21][90] = TILE_BOUNCE;
        for (let c = 88; c <= 92; c++) {
            this.tiles[10][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION L: GAP #1 (cols 95-97)
        // Ground removed for coyote time testing
        // =============================================
        for (let r = 21; r < H; r++) {
            this.tiles[r][95] = TILE_EMPTY;
            this.tiles[r][96] = TILE_EMPTY;
            this.tiles[r][97] = TILE_EMPTY;
        }

        // =============================================
        // SECTION M: ELEVATED TERRAIN (cols 102-110)
        // =============================================
        for (let c = 102; c <= 106; c++) {
            this.tiles[18][c] = TILE_SOLID;
        }
        for (let c = 107; c <= 110; c++) {
            this.tiles[15][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION N: WALL FOR WALL SLIDE TESTING (col 115)
        // Single tall wall to test wall slide and sparks
        // =============================================
        for (let r = 8; r < 21; r++) {
            this.tiles[r][115] = TILE_SOLID;
        }

        // =============================================
        // SECTION O: GAP #2 (cols 120-121)
        // =============================================
        for (let r = 21; r < H; r++) {
            this.tiles[r][120] = TILE_EMPTY;
            this.tiles[r][121] = TILE_EMPTY;
        }

        // =============================================
        // SECTION P: MORE BREAKABLE BLOCKS (cols 125-127)
        // For jump attack testing
        // =============================================
        this.tiles[19][125] = TILE_BREAKABLE;
        this.tiles[19][126] = TILE_BREAKABLE;
        this.tiles[19][127] = TILE_BREAKABLE;

        // =============================================
        // SECTION Q: RIGHT BOUNDARY (col 139)
        // =============================================
        for (let r = 5; r < 21; r++) {
            this.tiles[r][W - 1] = TILE_SOLID;
        }

        // =============================================
        // PLAYER SPAWN
        // Above ground for visible gravity drop
        // =============================================
        this.spawnX = 3 * TILE_SIZE;
        this.spawnY = 16 * TILE_SIZE;

        // =============================================
        // COLLECTIBLE POSITIONS
        // Coins — golden collectibles scattered throughout level
        // =============================================
        this.coinPositions = [
            // Near spawn — intro coins
            { x: 4 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            { x: 5 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            { x: 6 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            // Above one-way platforms
            { x: 7 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
            { x: 8 * TILE_SIZE + 8, y: 14 * TILE_SIZE },
            // Near ceiling section
            { x: 19 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
            { x: 20 * TILE_SIZE + 8, y: 16 * TILE_SIZE },
            // After hazards reward
            { x: 34 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            { x: 35 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            // High platform above bounce pads
            { x: 50 * TILE_SIZE + 8, y: 9 * TILE_SIZE },
            { x: 51 * TILE_SIZE + 8, y: 9 * TILE_SIZE },
            // Wall jump shaft reward
            { x: 57 * TILE_SIZE + 8, y: 4 * TILE_SIZE },
            { x: 58 * TILE_SIZE + 8, y: 4 * TILE_SIZE },
            // After crawl space
            { x: 82 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            { x: 83 * TILE_SIZE + 8, y: 19 * TILE_SIZE }
        ];

        // Health pickups — restore 1 HP when damaged
        this.healthPositions = [
            // After first hazard section
            { x: 36 * TILE_SIZE + 8, y: 19 * TILE_SIZE },
            // After second hazard section
            { x: 89 * TILE_SIZE + 8, y: 19 * TILE_SIZE }
        ];

        // =============================================
        // MOVING PLATFORMS
        // =============================================
        this.movingPlatforms = [
            // Horizontal mover
            {
                x: 35 * TILE_SIZE,
                y: 19.5 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 35 * TILE_SIZE,
                endX: 45 * TILE_SIZE,
                startY: 19.5 * TILE_SIZE,
                endY: 19.5 * TILE_SIZE,
                speed: 1.0,
                axis: 'x',
                direction: 1,
                prevX: 35 * TILE_SIZE,
                prevY: 19.5 * TILE_SIZE
            },
            // Vertical mover
            {
                x: 62 * TILE_SIZE,
                y: 17 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 62 * TILE_SIZE,
                endX: 62 * TILE_SIZE,
                startY: 10 * TILE_SIZE,
                endY: 20 * TILE_SIZE,
                speed: 1.0,
                axis: 'y',
                direction: 1,
                prevX: 62 * TILE_SIZE,
                prevY: 17 * TILE_SIZE
            },
            // Another horizontal mover
            {
                x: 99 * TILE_SIZE,
                y: 19 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 99 * TILE_SIZE,
                endX: 105 * TILE_SIZE,
                startY: 19 * TILE_SIZE,
                endY: 19 * TILE_SIZE,
                speed: 0.8,
                axis: 'x',
                direction: 1,
                prevX: 99 * TILE_SIZE,
                prevY: 19 * TILE_SIZE
            }
        ];
    },

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

    isSolid(col, row) {
        const t = this.getTile(col, row);
        return t === TILE_SOLID || t === TILE_BREAKABLE;
    },

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
