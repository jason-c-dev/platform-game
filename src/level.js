// ============================================================
// level.js — Level data and tile definitions
// ============================================================

// Level is a 2D array at least 80 tiles wide
// Row-major: level[row][col]

const Level = {
    tiles: [],
    width: 0,
    height: 0,
    spawnX: 0,
    spawnY: 0,
    movingPlatforms: [],

    init() {
        this.buildTestLevel();
    },

    buildTestLevel() {
        // Level: 120 tiles wide x 20 tiles tall
        const W = 120;
        const H = 20;
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
        // GROUND FLOOR — rows 17, 18, 19 (bottom 3 rows solid)
        // =============================================
        for (let c = 0; c < W; c++) {
            this.tiles[17][c] = TILE_SOLID;
            this.tiles[18][c] = TILE_SOLID;
            this.tiles[19][c] = TILE_SOLID;
        }

        // =============================================
        // GAP #1 at columns 18-20 (requires jumping to cross)
        // =============================================
        for (let r = 17; r < H; r++) {
            this.tiles[r][18] = TILE_EMPTY;
            this.tiles[r][19] = TILE_EMPTY;
            this.tiles[r][20] = TILE_EMPTY;
        }

        // GAP #2 at columns 55-56
        for (let r = 17; r < H; r++) {
            this.tiles[r][55] = TILE_EMPTY;
            this.tiles[r][56] = TILE_EMPTY;
        }

        // =============================================
        // WALLS (for C-10 horizontal collision testing)
        // =============================================
        // Left boundary wall (column 0, rows 5-16)
        for (let r = 5; r < 17; r++) {
            this.tiles[r][0] = TILE_SOLID;
        }

        // Right boundary wall (column W-1)
        for (let r = 5; r < 17; r++) {
            this.tiles[r][W - 1] = TILE_SOLID;
        }

        // Interior wall at column 35 (blocks horizontal movement, rows 13-16)
        for (let r = 13; r < 17; r++) {
            this.tiles[r][35] = TILE_SOLID;
        }

        // Wall for testing at column 105 (rows 10-16)
        for (let r = 10; r < 17; r++) {
            this.tiles[r][105] = TILE_SOLID;
        }

        // =============================================
        // CEILING (for C-10 ceiling bonk testing)
        // Low ceiling at row 14 over columns 25-30 (reachable from ground with jump)
        // Player on ground is at y=514 (top). Ceiling bottom at row14 bottom = 15*32=480.
        // Gap = 514-480=34px. Jump goes ~105px, so player will bonk head.
        // =============================================
        for (let c = 25; c <= 30; c++) {
            this.tiles[14][c] = TILE_SOLID;
        }
        // Also add a higher ceiling section (row 9) for variety
        for (let c = 25; c <= 30; c++) {
            this.tiles[9][c] = TILE_SOLID;
        }

        // =============================================
        // ONE-WAY PLATFORMS (for C-12 jump-through testing)
        // =============================================
        // Platform A: row 14, columns 8-12 (accessible from ground via jump)
        for (let c = 8; c <= 12; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }

        // Platform B: row 11, columns 10-14 (higher — reachable from Platform A)
        for (let c = 10; c <= 14; c++) {
            this.tiles[11][c] = TILE_ONE_WAY;
        }

        // Platform C: row 14, columns 40-44
        for (let c = 40; c <= 44; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }

        // Platform D: just above ground for easy jump-through test (row 14, cols 5-7)
        for (let c = 5; c <= 7; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }

        // One-way platforms at row 13, cols 75-80
        for (let c = 75; c <= 80; c++) {
            this.tiles[13][c] = TILE_ONE_WAY;
        }

        // =============================================
        // HAZARD TILES (spikes — for C-25 damage testing)
        // =============================================
        // Spike row at columns 45-47 (just above ground at row 16)
        this.tiles[16][45] = TILE_HAZARD;
        this.tiles[16][46] = TILE_HAZARD;
        this.tiles[16][47] = TILE_HAZARD;

        // More hazards near end
        this.tiles[16][110] = TILE_HAZARD;
        this.tiles[16][111] = TILE_HAZARD;

        // =============================================
        // BREAKABLE BLOCKS (row 14, columns 60-62)
        // =============================================
        this.tiles[14][60] = TILE_BREAKABLE;
        this.tiles[14][61] = TILE_BREAKABLE;
        this.tiles[14][62] = TILE_BREAKABLE;

        // =============================================
        // BOUNCE PADS (mushrooms — for C-26 testing)
        // =============================================
        // Bounce pad at columns 70-71 (on top of ground, row 16)
        this.tiles[16][70] = TILE_BOUNCE;
        this.tiles[16][71] = TILE_BOUNCE;

        // Another bounce pad at col 85
        this.tiles[16][85] = TILE_BOUNCE;

        // Elevated platform that bounce pad sends player to (row 8, cols 68-73)
        for (let c = 68; c <= 73; c++) {
            this.tiles[8][c] = TILE_SOLID;
        }

        // =============================================
        // HIGHER TERRAIN (testing vertical variety)
        // =============================================
        // Stepped platforms (columns 90-100)
        for (let c = 90; c <= 95; c++) {
            this.tiles[14][c] = TILE_SOLID;
        }
        for (let c = 96; c <= 100; c++) {
            this.tiles[11][c] = TILE_SOLID;
        }

        // =============================================
        // PLAYER SPAWN — on solid ground
        // =============================================
        this.spawnX = 3 * TILE_SIZE;
        this.spawnY = 12 * TILE_SIZE;  // Spawn well above ground so gravity is visible

        // =============================================
        // MOVING PLATFORMS (for C-13 carry testing)
        // =============================================
        this.movingPlatforms = [
            // Horizontal moving platform — moves between columns 22 and 30 at row ~15
            // Accessible by walking right and jumping on from the ground
            {
                x: 22 * TILE_SIZE,
                y: 15 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 22 * TILE_SIZE,
                endX: 30 * TILE_SIZE,
                startY: 15 * TILE_SIZE,
                endY: 15 * TILE_SIZE,
                speed: 1.2,
                axis: 'x',
                direction: 1,
                prevX: 22 * TILE_SIZE,
                prevY: 15 * TILE_SIZE
            },
            // Vertical moving platform — moves between rows 10 and 16 at column 50
            // Accessible when it reaches its lowest point near ground level
            {
                x: 50 * TILE_SIZE,
                y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 50 * TILE_SIZE,
                endX: 50 * TILE_SIZE,
                startY: 8 * TILE_SIZE,
                endY: 16 * TILE_SIZE,
                speed: 1.0,
                axis: 'y',
                direction: 1,
                prevX: 50 * TILE_SIZE,
                prevY: 13 * TILE_SIZE
            },
            // Another horizontal mover at column 58-65
            {
                x: 58 * TILE_SIZE,
                y: 14 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 58 * TILE_SIZE,
                endX: 65 * TILE_SIZE,
                startY: 14 * TILE_SIZE,
                endY: 14 * TILE_SIZE,
                speed: 0.8,
                axis: 'x',
                direction: 1,
                prevX: 58 * TILE_SIZE,
                prevY: 14 * TILE_SIZE
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
