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
        // GROUND FLOOR — rows 17, 18, 19 (bottom 3 solid)
        // CONTINUOUS from col 0 to col 119 — no gaps until after
        // all special tile sections to allow walk-through testing
        // =============================================
        for (let c = 0; c < W; c++) {
            this.tiles[17][c] = TILE_SOLID;
            this.tiles[18][c] = TILE_SOLID;
            this.tiles[19][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION A: LEFT WALL (col 0) — C-10 left collision
        // =============================================
        for (let r = 5; r < 17; r++) {
            this.tiles[r][0] = TILE_SOLID;
        }

        // =============================================
        // SECTION B: ONE-WAY PLATFORMS (cols 5-9) — C-12
        // Player jumps through from below, lands on top
        // =============================================
        for (let c = 5; c <= 9; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }
        // Higher one-way (row 11) for stacking test
        for (let c = 6; c <= 10; c++) {
            this.tiles[11][c] = TILE_ONE_WAY;
        }

        // =============================================
        // SECTION C: CEILING (cols 16-22, row 14) — C-10 ceiling bonk
        // =============================================
        for (let c = 16; c <= 22; c++) {
            this.tiles[14][c] = TILE_SOLID;
        }
        for (let c = 16; c <= 22; c++) {
            this.tiles[9][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION D: HAZARD TILES (cols 30-32) — C-25
        // Spikes on row 16, just above ground
        // =============================================
        this.tiles[16][30] = TILE_HAZARD;
        this.tiles[16][31] = TILE_HAZARD;
        this.tiles[16][32] = TILE_HAZARD;

        // =============================================
        // SECTION E: BREAKABLE BLOCKS (cols 40-42) — C-06
        // =============================================
        this.tiles[14][40] = TILE_BREAKABLE;
        this.tiles[14][41] = TILE_BREAKABLE;
        this.tiles[14][42] = TILE_BREAKABLE;

        // =============================================
        // SECTION F: BOUNCE PADS (cols 50-51) — C-26
        // Replace ground tiles so player falls onto bounce instead of solid
        // =============================================
        this.tiles[17][50] = TILE_BOUNCE;
        this.tiles[17][51] = TILE_BOUNCE;
        // High platform as bounce target (row 6)
        for (let c = 48; c <= 53; c++) {
            this.tiles[6][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION G: MORE ONE-WAY (cols 60-64) — additional platforms
        // =============================================
        for (let c = 60; c <= 64; c++) {
            this.tiles[14][c] = TILE_ONE_WAY;
        }
        for (let c = 61; c <= 65; c++) {
            this.tiles[11][c] = TILE_ONE_WAY;
        }

        // =============================================
        // SECTION H: MORE BOUNCE (col 70)
        // =============================================
        this.tiles[17][70] = TILE_BOUNCE;
        for (let c = 68; c <= 72; c++) {
            this.tiles[6][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION I: MORE HAZARDS (cols 78-80)
        // =============================================
        this.tiles[16][78] = TILE_HAZARD;
        this.tiles[16][79] = TILE_HAZARD;
        this.tiles[16][80] = TILE_HAZARD;

        // =============================================
        // SECTION J: GAP #1 (cols 88-90) — C-24 requires jumping
        // Ground removed here
        // =============================================
        for (let r = 17; r < H; r++) {
            this.tiles[r][88] = TILE_EMPTY;
            this.tiles[r][89] = TILE_EMPTY;
            this.tiles[r][90] = TILE_EMPTY;
        }

        // =============================================
        // SECTION K: ELEVATED TERRAIN (cols 95-105)
        // =============================================
        for (let c = 95; c <= 100; c++) {
            this.tiles[14][c] = TILE_SOLID;
        }
        for (let c = 101; c <= 105; c++) {
            this.tiles[11][c] = TILE_SOLID;
        }

        // =============================================
        // SECTION L: GAP #2 (cols 108-109)
        // =============================================
        for (let r = 17; r < H; r++) {
            this.tiles[r][108] = TILE_EMPTY;
            this.tiles[r][109] = TILE_EMPTY;
        }

        // =============================================
        // SECTION M: RIGHT WALL (col 115) — C-10 right collision
        // Player walking right hits this wall
        // =============================================
        for (let r = 10; r < 17; r++) {
            this.tiles[r][115] = TILE_SOLID;
        }

        // Right boundary wall (col 119)
        for (let r = 5; r < 17; r++) {
            this.tiles[r][W - 1] = TILE_SOLID;
        }

        // =============================================
        // PLAYER SPAWN
        // Above ground for visible gravity drop (C-09)
        // =============================================
        this.spawnX = 3 * TILE_SIZE;
        this.spawnY = 12 * TILE_SIZE;

        // =============================================
        // MOVING PLATFORMS (C-13)
        // =============================================
        this.movingPlatforms = [
            // Horizontal mover — travels between cols 35-45
            // Player on ground at y=514 can step onto it (platform at y=15.5*32=496)
            {
                x: 35 * TILE_SIZE,
                y: 15.5 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 35 * TILE_SIZE,
                endX: 45 * TILE_SIZE,
                startY: 15.5 * TILE_SIZE,
                endY: 15.5 * TILE_SIZE,
                speed: 1.0,
                axis: 'x',
                direction: 1,
                prevX: 35 * TILE_SIZE,
                prevY: 15.5 * TILE_SIZE
            },
            // Vertical mover — at col 55, moves between rows 8-16
            {
                x: 55 * TILE_SIZE,
                y: 13 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 55 * TILE_SIZE,
                endX: 55 * TILE_SIZE,
                startY: 8 * TILE_SIZE,
                endY: 16 * TILE_SIZE,
                speed: 1.0,
                axis: 'y',
                direction: 1,
                prevX: 55 * TILE_SIZE,
                prevY: 13 * TILE_SIZE
            },
            // Another horizontal mover — cols 73-80
            {
                x: 73 * TILE_SIZE,
                y: 15 * TILE_SIZE,
                width: TILE_SIZE * 3,
                height: 12,
                startX: 73 * TILE_SIZE,
                endX: 80 * TILE_SIZE,
                startY: 15 * TILE_SIZE,
                endY: 15 * TILE_SIZE,
                speed: 0.8,
                axis: 'x',
                direction: 1,
                prevX: 73 * TILE_SIZE,
                prevY: 15 * TILE_SIZE
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
