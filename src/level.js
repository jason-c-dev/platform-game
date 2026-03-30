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

        // Ground floor (row 17, 18, 19 — bottom 3 rows are solid)
        for (let c = 0; c < W; c++) {
            this.tiles[17][c] = TILE_SOLID;
            this.tiles[18][c] = TILE_SOLID;
            this.tiles[19][c] = TILE_SOLID;
        }

        // Gap in the ground at columns 18-20 (requires jumping)
        for (let r = 17; r < H; r++) {
            this.tiles[r][18] = TILE_EMPTY;
            this.tiles[r][19] = TILE_EMPTY;
            this.tiles[r][20] = TILE_EMPTY;
        }

        // Second gap at 55-57
        for (let r = 17; r < H; r++) {
            this.tiles[r][55] = TILE_EMPTY;
            this.tiles[r][56] = TILE_EMPTY;
        }

        // Left boundary wall (column 0, tall)
        for (let r = 5; r < 17; r++) {
            this.tiles[r][0] = TILE_SOLID;
        }

        // Right boundary wall
        for (let r = 5; r < 17; r++) {
            this.tiles[r][W - 1] = TILE_SOLID;
        }

        // Wall to block horizontal movement (columns 35-36, rows 13-16)
        for (let r = 13; r < 17; r++) {
            this.tiles[r][35] = TILE_SOLID;
        }

        // A ceiling section (row 9, columns 25-32)
        for (let c = 25; c <= 32; c++) {
            this.tiles[9][c] = TILE_SOLID;
        }

        // One-way platforms at various heights
        // Platform 1: row 14, columns 8-12
        for (let c = 8; c <= 12; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }

        // Platform 2: row 11, columns 10-14
        for (let c = 10; c <= 14; c++) {
            this.tiles[11][c] = TILE_ONE_WAY;
        }

        // Platform 3: row 14, columns 40-44
        for (let c = 40; c <= 44; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }

        // One-way platform over the gap area for testing jump-through
        for (let c = 15; c <= 17; c++) {
            this.tiles[13][c] = TILE_ONE_WAY;
        }

        // Hazard tiles (spikes on ground, columns 45-47)
        this.tiles[16][45] = TILE_HAZARD;
        this.tiles[16][46] = TILE_HAZARD;
        this.tiles[16][47] = TILE_HAZARD;

        // Breakable blocks (row 14, columns 60-62)
        this.tiles[14][60] = TILE_BREAKABLE;
        this.tiles[14][61] = TILE_BREAKABLE;
        this.tiles[14][62] = TILE_BREAKABLE;

        // Bounce pad (column 70, row 16 — on top of ground)
        this.tiles[16][70] = TILE_BOUNCE;
        this.tiles[16][71] = TILE_BOUNCE;

        // Another bounce pad area (col 85)
        this.tiles[16][85] = TILE_BOUNCE;

        // Some elevated platforms for bounce pad to send player to
        for (let c = 68; c <= 73; c++) {
            this.tiles[8][c] = TILE_SOLID;
        }

        // Higher platforms area (columns 90-100)
        for (let c = 90; c <= 95; c++) {
            this.tiles[14][c] = TILE_SOLID;
        }
        for (let c = 96; c <= 100; c++) {
            this.tiles[11][c] = TILE_SOLID;
        }

        // Walls for testing horizontal collision (column 105)
        for (let r = 10; r < 17; r++) {
            this.tiles[r][105] = TILE_SOLID;
        }

        // Additional one-way platforms for variety (row 13, cols 75-80)
        for (let c = 75; c <= 80; c++) {
            this.tiles[13][c] = TILE_ONE_WAY;
        }

        // More hazards near end
        this.tiles[16][110] = TILE_HAZARD;
        this.tiles[16][111] = TILE_HAZARD;

        // Player spawn
        this.spawnX = 3 * TILE_SIZE;
        this.spawnY = 14 * TILE_SIZE;

        // Moving platforms
        this.movingPlatforms = [
            {
                x: 22 * TILE_SIZE,
                y: 14 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: TILE_SIZE * 0.5,
                startX: 22 * TILE_SIZE,
                endX: 30 * TILE_SIZE,
                startY: 14 * TILE_SIZE,
                endY: 14 * TILE_SIZE,
                speed: 1.2,
                axis: 'x',
                direction: 1,
                prevX: 22 * TILE_SIZE,
                prevY: 14 * TILE_SIZE
            },
            {
                x: 50 * TILE_SIZE,
                y: 10 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: TILE_SIZE * 0.5,
                startX: 50 * TILE_SIZE,
                endX: 50 * TILE_SIZE,
                startY: 7 * TILE_SIZE,
                endY: 15 * TILE_SIZE,
                speed: 1.0,
                axis: 'y',
                direction: 1,
                prevX: 50 * TILE_SIZE,
                prevY: 10 * TILE_SIZE
            },
            {
                x: 58 * TILE_SIZE,
                y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: TILE_SIZE * 0.5,
                startX: 58 * TILE_SIZE,
                endX: 65 * TILE_SIZE,
                startY: 13 * TILE_SIZE,
                endY: 13 * TILE_SIZE,
                speed: 0.8,
                axis: 'x',
                direction: 1,
                prevX: 58 * TILE_SIZE,
                prevY: 13 * TILE_SIZE
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
