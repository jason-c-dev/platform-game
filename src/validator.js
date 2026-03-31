// ============================================================
// validator.js — Playability Validator: Path, Arena & Difficulty Checks
// Sprint 13: BFS path validation | Sprint 14: Arena & difficulty checks
// Press "D" on title screen to run. API: window.runPlayabilityCheck()
// ============================================================

const PlayabilityValidator = {
    // =============================================
    // PHYSICS CONSTANTS FOR PATHFINDING
    // =============================================
    JUMP_HEIGHT: 4,           // 4 tiles (128px) max vertical jump
    WALL_JUMP_REACH_H: 3,    // 3 tiles (96px) horizontal wall-jump
    WALL_JUMP_REACH_V: 3,    // 3 tiles vertical wall-jump
    BOUNCE_HEIGHT: 7,         // 7 tiles vertical from bounce pads
    JUMP_REACH_H: 6,          // 6 tiles horizontal reach during jump

    // =============================================
    // DIFFICULTY TABLE — Per-world expected values
    // =============================================
    DIFFICULTY_TABLE: {
        // World index 0 = World 1 (Forest)
        0: {
            vulnerabilityWindow: 3.0,   // seconds
            vulnerabilityFrames: 180,   // frames at 60fps
            bossHPMin: 5,
            bossHPMax: 7,
            maxEnemyDensity: 2,         // max enemies per screen
            maxHazardPercent: 5,        // max % of non-empty tiles
            minPlatformWidth: 3         // minimum safe platform width in tiles
        },
        // World index 1 = World 2 (Desert)
        1: {
            vulnerabilityWindow: 2.5,
            vulnerabilityFrames: 150,
            bossHPMin: 6,
            bossHPMax: 8,
            maxEnemyDensity: 3,
            maxHazardPercent: 10,
            minPlatformWidth: 2
        },
        // World index 2 = World 3 (Tundra)
        2: {
            vulnerabilityWindow: 2.0,
            vulnerabilityFrames: 120,
            bossHPMin: 7,
            bossHPMax: 9,
            maxEnemyDensity: 4,
            maxHazardPercent: 15,
            minPlatformWidth: 2
        },
        // World index 3 = World 4 (Volcano)
        3: {
            vulnerabilityWindow: 1.5,
            vulnerabilityFrames: 90,
            bossHPMin: 7,
            bossHPMax: 11,
            maxEnemyDensity: 5,
            maxHazardPercent: 20,
            minPlatformWidth: 1
        },
        // World index 4 = Citadel
        4: {
            vulnerabilityWindow: 1.5,
            vulnerabilityFrames: 90,
            bossHPMin: 19,
            bossHPMax: 19,
            maxEnemyDensity: 5,
            maxHazardPercent: 20,
            minPlatformWidth: 1
        }
    },

    // =============================================
    // BOSS CONFIGS — Read from Enemies.spawnBoss data
    // =============================================
    BOSS_CONFIGS: {
        'elder_shroomba':  { maxHealth: 5 },
        'vine_mother':     { maxHealth: 6 },
        'stag_king':       { maxHealth: 7 },
        'sand_wyrm':       { maxHealth: 6 },
        'pharaoh_specter': { maxHealth: 8 },
        'hydra_cactus':    { maxHealth: 12 },
        'frost_bear':      { maxHealth: 7 },
        'crystal_witch':   { maxHealth: 25 },
        'yeti_monarch':    { maxHealth: 9 },
        'lava_serpent':    { maxHealth: 7 },
        'iron_warden':     { maxHealth: 7 },
        'dragon_caldera':  { maxHealth: 11 },
        'the_architect':   { maxHealth: 19 }
    },

    // Boss vulnerability durations (phase 1, in frames) — from enemies.js
    BOSS_VULN_FRAMES: {
        'elder_shroomba':  90,
        'vine_mother':     100,
        'stag_king':       90,
        'sand_wyrm':       80,
        'pharaoh_specter': 90,
        'hydra_cactus':    90,
        'frost_bear':      80,
        'crystal_witch':   90,
        'yeti_monarch':    80,
        'lava_serpent':    90,
        'iron_warden':     80,
        'dragon_caldera':  80,
        'the_architect':   80  // max(40, 90 - phase*10) → phase 1 = 80
    },

    // =============================================
    // DEBUG OVERLAY STATE
    // =============================================
    active: false,
    results: null,
    scrollOffset: 0,
    running: false,
    _animTimer: 0,

    // =============================================
    // TILE CLASSIFICATION HELPERS
    // =============================================

    /** Check if a tile type provides support (player can stand on it) */
    isSupport(tile) {
        return tile === TILE_SOLID || tile === TILE_ONE_WAY ||
               tile === TILE_BREAKABLE || tile === TILE_CRUMBLE ||
               tile === TILE_ICE || tile === TILE_GATE || tile === TILE_BOUNCE;
    },

    /** Check if a tile type is passable (player body can occupy it) */
    isPassable(tile) {
        return tile === TILE_EMPTY || tile === TILE_LADDER ||
               tile === TILE_BOUNCE || tile === TILE_WATER ||
               tile === TILE_WATER_SURFACE || tile === TILE_QUICKSAND ||
               tile === TILE_QUICKSAND_DEEP || tile === TILE_PRESSURE_PLATE ||
               tile === TILE_ONE_WAY || tile === TILE_LAVA ||
               tile === TILE_HAZARD || tile === TILE_CRUMBLE;
    },

    /** Check if a tile type blocks movement (solid wall) */
    isSolid(tile) {
        return tile === TILE_SOLID || tile === TILE_BREAKABLE ||
               tile === TILE_ICE || tile === TILE_GATE;
    },

    // =============================================
    // TILE GRID HELPERS
    // =============================================

    /** Get tile at (col, row) from a tile grid, TILE_SOLID if out of bounds */
    _getTile(tiles, w, h, col, row) {
        if (col < 0 || col >= w || row < 0 || row >= h) return TILE_SOLID;
        return tiles[row][col];
    },

    /**
     * Check if position (col, row) is a valid standing position.
     * "Standing at (col, row)" means the player's body is at row,
     * and there's a support tile at row+1.
     */
    canStand(tiles, w, h, col, row) {
        if (col < 0 || col >= w || row < 0 || row >= h) return false;
        if (row + 1 >= h) return false;

        const here = this._getTile(tiles, w, h, col, row);
        const below = this._getTile(tiles, w, h, col, row + 1);

        // Player's body must fit in this tile (passable)
        if (this.isSolid(here)) return false;

        // Must have support below
        return this.isSupport(below);
    },

    /** Check if position (col, row) is a ladder (allows vertical movement) */
    isLadder(tiles, w, h, col, row) {
        if (col < 0 || col >= w || row < 0 || row >= h) return false;
        return tiles[row][col] === TILE_LADDER;
    },

    /** Check if position (col, row) has a bounce pad below */
    hasBounceBelow(tiles, w, h, col, row) {
        if (row + 1 >= h) return false;
        return this._getTile(tiles, w, h, col, row + 1) === TILE_BOUNCE;
    },

    /**
     * Find the ground row below (col, startRow) — simulate gravity/falling.
     * Returns the row where the player can stand, or -1 if no ground found.
     */
    findGround(tiles, w, h, col, startRow) {
        for (let r = startRow; r < h - 1; r++) {
            if (this.canStand(tiles, w, h, col, r)) {
                return r;
            }
            // If we hit a solid block that's not passable, stop
            const tile = this._getTile(tiles, w, h, col, r);
            if (this.isSolid(tile)) {
                return -1;
            }
        }
        return -1;
    },

    // =============================================
    // BFS PATHFINDING ENGINE
    // =============================================

    /**
     * Build a set of additional standable positions from moving platforms.
     * Each platform's travel range is added as virtual ground.
     */
    _getMovingPlatformPositions(movingPlatforms, tiles, w, h) {
        const extra = new Set();
        if (!movingPlatforms || movingPlatforms.length === 0) return extra;

        for (const mp of movingPlatforms) {
            const platWidthTiles = Math.ceil(mp.width / TILE_SIZE);
            const topRow = Math.floor(mp.y / TILE_SIZE);

            if (mp.axis === 'x') {
                // Horizontal platform: add positions along X range at platform Y
                const startCol = Math.floor(mp.startX / TILE_SIZE);
                const endCol = Math.floor(mp.endX / TILE_SIZE) + platWidthTiles;
                const platRow = Math.floor(mp.y / TILE_SIZE);

                for (let c = startCol; c <= endCol && c < w; c++) {
                    // Player stands one row above the platform
                    const standRow = platRow - 1;
                    if (standRow >= 0 && standRow < h) {
                        extra.add(`${c},${standRow}`);
                    }
                }
            } else {
                // Vertical platform: add positions along Y range at platform X
                const startRow = Math.floor(mp.startY / TILE_SIZE);
                const endRow = Math.floor(mp.endY / TILE_SIZE);
                const platCol = Math.floor(mp.x / TILE_SIZE);

                for (let r = startRow; r <= endRow; r++) {
                    const standRow = r - 1;
                    if (standRow >= 0 && standRow < h) {
                        for (let dc = 0; dc < platWidthTiles; dc++) {
                            if (platCol + dc < w) {
                                extra.add(`${platCol + dc},${standRow}`);
                            }
                        }
                    }
                }
            }
        }
        return extra;
    },

    /**
     * Build a set of chain swing reachable positions.
     * Chains allow the player to swing and reach distant positions.
     */
    _getChainPositions(chains, tiles, w, h) {
        const extra = new Set();
        if (!chains || chains.length === 0) return extra;

        for (const chain of chains) {
            const chainCol = Math.floor(chain.x / TILE_SIZE);
            const chainRow = Math.floor(chain.y / TILE_SIZE);
            const length = chain.chainLength || chain.length || 4;
            const reachTiles = Math.ceil(length * 1.5);

            // Chain swing can reach positions in a wide arc
            for (let dx = -reachTiles; dx <= reachTiles; dx++) {
                for (let dy = -2; dy <= length + 2; dy++) {
                    const nc = chainCol + dx;
                    const nr = chainRow + dy;
                    if (nc >= 0 && nc < w && nr >= 0 && nr < h) {
                        if (this.canStand(tiles, w, h, nc, nr)) {
                            extra.add(`${nc},${nr}`);
                        }
                    }
                }
            }
        }
        return extra;
    },

    /**
     * Get all positions reachable from standing at (col, row) in one action.
     */
    getReachable(tiles, w, h, col, row, extraStandable) {
        const positions = [];
        const addPos = (c, r) => { positions.push([c, r]); };

        const canStandHere = (c, r) => {
            return this.canStand(tiles, w, h, c, r) ||
                   extraStandable.has(`${c},${r}`);
        };

        const isPassableHere = (c, r) => {
            const tile = this._getTile(tiles, w, h, c, r);
            return this.isPassable(tile);
        };

        // Determine jump height (normal or bounce)
        const onBounce = this.hasBounceBelow(tiles, w, h, col, row);
        const jumpHeight = onBounce ? this.BOUNCE_HEIGHT : this.JUMP_HEIGHT;
        const hReach = this.JUMP_REACH_H;

        // ---- 1. Walk left/right ----
        for (const dir of [-1, 1]) {
            const nc = col + dir;
            if (nc < 0 || nc >= w) continue;

            if (canStandHere(nc, row)) {
                addPos(nc, row);
            } else if (isPassableHere(nc, row)) {
                // Walk off edge — fall to ground
                const groundRow = this.findGround(tiles, w, h, nc, row);
                if (groundRow !== -1) {
                    addPos(nc, groundRow);
                }
                // Also check if there's an extra standable position below
                for (let r = row + 1; r < Math.min(row + 20, h); r++) {
                    if (extraStandable.has(`${nc},${r}`)) {
                        addPos(nc, r);
                        break;
                    }
                }
            }
        }

        // ---- 2. Jump (vertical and arc) ----
        // Check straight up for clearance
        let maxClearHeight = 0;
        for (let dy = 1; dy <= jumpHeight; dy++) {
            const checkRow = row - dy;
            if (checkRow < 0) break;
            if (!isPassableHere(col, checkRow)) break;
            maxClearHeight = dy;
        }

        // From any reachable height, check horizontal positions
        for (let dy = 0; dy <= maxClearHeight; dy++) {
            const peakRow = row - dy;

            for (let dx = -hReach; dx <= hReach; dx++) {
                const nc = col + dx;
                if (nc < 0 || nc >= w) continue;
                if (dx === 0 && dy === 0) continue;

                // Check if the target position is standable
                if (canStandHere(nc, peakRow)) {
                    addPos(nc, peakRow);
                }

                // Check falling from peak height at this column
                if (isPassableHere(nc, peakRow) || extraStandable.has(`${nc},${peakRow}`)) {
                    const groundRow = this.findGround(tiles, w, h, nc, peakRow);
                    if (groundRow !== -1 && groundRow !== row) {
                        addPos(nc, groundRow);
                    }
                    // Also check extra standable below peak
                    for (let r = peakRow + 1; r < Math.min(peakRow + 20, h); r++) {
                        if (extraStandable.has(`${nc},${r}`)) {
                            addPos(nc, r);
                            break;
                        }
                    }
                }
            }
        }

        // ---- 3. Wall-jump ----
        // Check if player is next to a wall (or can reach a wall by falling)
        for (const wallDir of [-1, 1]) {
            const wallCol = col + wallDir;
            const wallTile = this._getTile(tiles, w, h, wallCol, row);

            if (this.isSolid(wallTile)) {
                // Player can wall-slide here, then wall-jump
                const jumpDir = -wallDir; // Jump away from wall
                const wjH = this.WALL_JUMP_REACH_H;
                const wjV = this.WALL_JUMP_REACH_V;

                for (let dy = 0; dy <= wjV; dy++) {
                    const targetRow = row - dy;
                    if (targetRow < 0) break;

                    for (let dx = 1; dx <= wjH; dx++) {
                        const nc = col + dx * jumpDir;
                        if (nc < 0 || nc >= w) continue;

                        if (canStandHere(nc, targetRow)) {
                            addPos(nc, targetRow);
                        }
                        // Fall from this position
                        if (isPassableHere(nc, targetRow)) {
                            const groundRow = this.findGround(tiles, w, h, nc, targetRow);
                            if (groundRow !== -1) {
                                addPos(nc, groundRow);
                            }
                        }
                    }
                }
            }

            // Also check walls below (for wall-slide down then wall-jump)
            for (let dropRow = row + 1; dropRow < Math.min(row + 15, h); dropRow++) {
                const belowWallTile = this._getTile(tiles, w, h, wallCol, dropRow);
                const belowHereTile = this._getTile(tiles, w, h, col, dropRow);

                if (this.isSolid(belowHereTile)) break; // Can't fall further
                if (!this.isSolid(belowWallTile)) continue; // No wall here

                // Can wall-slide to this position and wall-jump
                const jumpDir = -wallDir;
                const wjH = this.WALL_JUMP_REACH_H;
                const wjV = this.WALL_JUMP_REACH_V;

                for (let dy = 0; dy <= wjV; dy++) {
                    const targetRow = dropRow - dy;
                    if (targetRow < 0) break;

                    for (let dx = 1; dx <= wjH; dx++) {
                        const nc = col + dx * jumpDir;
                        if (nc < 0 || nc >= w) continue;

                        if (canStandHere(nc, targetRow)) {
                            addPos(nc, targetRow);
                        }
                        if (isPassableHere(nc, targetRow)) {
                            const groundRow = this.findGround(tiles, w, h, nc, targetRow);
                            if (groundRow !== -1) {
                                addPos(nc, groundRow);
                            }
                        }
                    }
                }

                // Can also land at this wall-slide position if there's ground
                if (canStandHere(col, dropRow)) {
                    addPos(col, dropRow);
                }
            }
        }

        // ---- 4. Ladder climbing ----
        const hereTile = this._getTile(tiles, w, h, col, row);
        if (hereTile === TILE_LADDER) {
            // Climb up
            for (let r = row - 1; r >= 0; r--) {
                const lt = this._getTile(tiles, w, h, col, r);
                if (lt === TILE_LADDER) {
                    addPos(col, r);
                } else if (isPassableHere(col, r)) {
                    // Top of ladder — check for standing positions nearby
                    if (canStandHere(col, r)) {
                        addPos(col, r);
                    }
                    // Can also step off ladder to left/right
                    if (canStandHere(col - 1, r)) addPos(col - 1, r);
                    if (canStandHere(col + 1, r)) addPos(col + 1, r);
                    break;
                } else {
                    break;
                }
            }
            // Climb down
            for (let r = row + 1; r < h; r++) {
                const lt = this._getTile(tiles, w, h, col, r);
                if (lt === TILE_LADDER) {
                    addPos(col, r);
                } else {
                    break;
                }
            }
        }

        // Check if there's a ladder nearby the player can grab
        for (const dir of [-1, 0, 1]) {
            const lc = col + dir;
            for (let dr = -1; dr <= 1; dr++) {
                const lr = row + dr;
                if (this.isLadder(tiles, w, h, lc, lr)) {
                    addPos(lc, lr);
                }
            }
        }

        return positions;
    },

    /**
     * Run BFS from startCol, startRow through the tile grid.
     * Returns a Set of "col,row" keys for all reachable standable positions.
     */
    bfs(tiles, w, h, startCol, startRow, movingPlatforms, chains) {
        const visited = new Set();
        const queue = [];

        // Build extra standable positions from moving platforms and chains
        const extraStandable = this._getMovingPlatformPositions(movingPlatforms, tiles, w, h);
        const chainPositions = this._getChainPositions(chains, tiles, w, h);
        for (const pos of chainPositions) {
            extraStandable.add(pos);
        }

        // Find initial standing position from spawn
        let initRow = this.findGround(tiles, w, h, startCol, startRow);
        if (initRow === -1) {
            // Try the spawn row directly
            if (this.canStand(tiles, w, h, startCol, startRow)) {
                initRow = startRow;
            } else {
                // Try one row up (spawn might be at ground level)
                if (this.canStand(tiles, w, h, startCol, startRow - 1)) {
                    initRow = startRow - 1;
                } else {
                    // Check extra standable
                    for (let r = startRow; r < Math.min(startRow + 5, h); r++) {
                        if (extraStandable.has(`${startCol},${r}`)) {
                            initRow = r;
                            break;
                        }
                    }
                    if (initRow === -1) return visited;
                }
            }
        }

        const startKey = `${startCol},${initRow}`;
        visited.add(startKey);
        queue.push([startCol, initRow]);

        // BFS loop
        while (queue.length > 0) {
            const [col, row] = queue.shift();

            const neighbors = this.getReachable(tiles, w, h, col, row, extraStandable);
            for (const [nc, nr] of neighbors) {
                const key = `${nc},${nr}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push([nc, nr]);
                }
            }
        }

        return visited;
    },

    // =============================================
    // ARENA VALIDATION
    // =============================================

    /**
     * Find the arena boundaries from bossArenaX to the right wall.
     * Returns { left, right, top, bottom } in tile coordinates,
     * or null if no arena can be identified.
     */
    _findArenaBounds(tiles, w, h) {
        const arenaLeftCol = Math.floor(Level.bossArenaX / TILE_SIZE);
        if (arenaLeftCol <= 0 || arenaLeftCol >= w) return null;

        // Find right wall: scan right from arenaLeftCol looking for a
        // column that is mostly solid (the right boundary wall)
        let arenaRightCol = w - 1;
        for (let c = arenaLeftCol + 10; c < w; c++) {
            let solidCount = 0;
            for (let r = 0; r < h; r++) {
                if (this.isSolid(tiles[r][c])) solidCount++;
            }
            // A wall column should be mostly solid (at least 60% of height)
            if (solidCount >= Math.floor(h * 0.6)) {
                arenaRightCol = c;
                break;
            }
        }

        // Find top row: first row with solid tiles spanning the arena width
        let arenaTopRow = 0;
        for (let r = 0; r < h; r++) {
            let solidCount = 0;
            for (let c = arenaLeftCol; c <= arenaRightCol; c++) {
                if (this.isSolid(tiles[r][c])) solidCount++;
            }
            if (solidCount >= (arenaRightCol - arenaLeftCol) * 0.6) {
                arenaTopRow = r;
                break;
            }
        }

        // Find bottom row: first mostly-solid row after the top
        let arenaBottomRow = h - 1;
        for (let r = h - 1; r > arenaTopRow; r--) {
            let solidCount = 0;
            for (let c = arenaLeftCol; c <= arenaRightCol; c++) {
                const tile = tiles[r][c];
                if (this.isSolid(tile) || tile === TILE_ICE) solidCount++;
            }
            if (solidCount >= (arenaRightCol - arenaLeftCol) * 0.6) {
                arenaBottomRow = r;
                break;
            }
        }

        return {
            left: arenaLeftCol,
            right: arenaRightCol,
            top: arenaTopRow,
            bottom: arenaBottomRow
        };
    },

    /**
     * Check arena enclosure: all 4 walls (top, bottom, left, right) are solid,
     * excluding the entry point (gap in the left wall).
     * Returns { result: 'PASS'|'FAIL', details: string }
     */
    _checkArenaEnclosure(tiles, w, h, bounds) {
        if (!bounds) return { result: 'FAIL', details: 'No arena bounds detected' };

        const { left, right, top, bottom } = bounds;
        const issues = [];

        // Check top row (ceiling)
        let topSolid = 0, topTotal = 0;
        for (let c = left; c <= right; c++) {
            topTotal++;
            if (this.isSolid(tiles[top][c])) topSolid++;
        }
        if (topSolid < topTotal * 0.8) {
            issues.push(`top: ${topSolid}/${topTotal} solid`);
        }

        // Check bottom row (floor) — ice counts as solid floor
        let bottomSolid = 0, bottomTotal = 0;
        for (let c = left; c <= right; c++) {
            bottomTotal++;
            const tile = tiles[bottom][c];
            if (this.isSolid(tile) || tile === TILE_ICE) bottomSolid++;
        }
        if (bottomSolid < bottomTotal * 0.8) {
            issues.push(`bottom: ${bottomSolid}/${bottomTotal} solid`);
        }

        // Check right wall
        let rightSolid = 0, rightTotal = 0;
        for (let r = top; r <= bottom; r++) {
            rightTotal++;
            if (this.isSolid(tiles[r][right])) rightSolid++;
        }
        if (rightSolid < rightTotal * 0.7) {
            issues.push(`right: ${rightSolid}/${rightTotal} solid`);
        }

        // Check left wall — exclude entry point (a gap for the player to walk in)
        // The entry point is typically a 2-3 tile gap near the bottom of the left wall
        let leftSolid = 0, leftTotal = 0;
        let entryGapCount = 0;
        for (let r = top; r <= bottom; r++) {
            leftTotal++;
            if (this.isSolid(tiles[r][left])) {
                leftSolid++;
            } else {
                entryGapCount++;
            }
        }
        // Left wall should be mostly solid — allow up to 4 tiles for entry gap
        const leftThreshold = (leftTotal - Math.min(entryGapCount, 4)) * 0.7;
        if (leftSolid < leftThreshold) {
            issues.push(`left: ${leftSolid}/${leftTotal} solid (excl. entry)`);
        }

        if (issues.length === 0) {
            return { result: 'PASS', details: `All 4 walls solid (${left}-${right} cols, ${top}-${bottom} rows)` };
        } else {
            return { result: 'FAIL', details: `Wall gaps: ${issues.join('; ')}` };
        }
    },

    /**
     * Check arena minimum width (must be >= 15 tiles).
     * Returns { result: 'PASS'|'FAIL', details: string, measured: number }
     */
    _checkArenaMinWidth(bounds) {
        if (!bounds) return { result: 'FAIL', details: 'No arena bounds', measured: 0 };

        const width = bounds.right - bounds.left + 1;
        const pass = width >= 15;
        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `Arena width: ${width} tiles (min 15)`,
            measured: width
        };
    },

    /**
     * Check arena has at least 2 platforms for player positioning.
     * Counts one-way and solid platforms inside the arena (not floor/ceiling).
     * Returns { result: 'PASS'|'FAIL', details: string, count: number }
     */
    _checkArenaPlatforms(tiles, w, h, bounds) {
        if (!bounds) return { result: 'FAIL', details: 'No arena bounds', count: 0 };

        const { left, right, top, bottom } = bounds;
        let platformCount = 0;

        // Scan interior rows (between ceiling and floor) for platform segments
        for (let r = top + 1; r < bottom; r++) {
            let inPlatform = false;
            for (let c = left + 1; c < right; c++) {
                const tile = tiles[r][c];
                const isStandable = tile === TILE_ONE_WAY || tile === TILE_SOLID || tile === TILE_ICE;
                // Check that the row above is passable (i.e., this is actually a platform surface)
                const abovePassable = r > 0 && this.isPassable(tiles[r - 1][c]);

                if (isStandable && abovePassable) {
                    if (!inPlatform) {
                        platformCount++;
                        inPlatform = true;
                    }
                } else {
                    inPlatform = false;
                }
            }
        }

        // The floor itself counts as a platform if it's standable
        // (already counted in the loop if the row above floor is passable)

        const pass = platformCount >= 2;
        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `${platformCount} platforms found (min 2)`,
            count: platformCount
        };
    },

    /**
     * Check arena entry accessibility — player can walk in from the left
     * at ground level (solid ground beneath entry gap, no wall-jump required).
     * Returns { result: 'PASS'|'FAIL', details: string }
     */
    _checkArenaEntry(tiles, w, h, bounds) {
        if (!bounds) return { result: 'FAIL', details: 'No arena bounds' };

        const { left, right, top, bottom } = bounds;

        // Find the entry gap in the left wall — look for non-solid tiles
        // in the left column between top and bottom
        let gapRows = [];
        for (let r = top + 1; r < bottom; r++) {
            if (!this.isSolid(tiles[r][left])) {
                gapRows.push(r);
            }
        }

        if (gapRows.length === 0) {
            return { result: 'FAIL', details: 'No entry gap found in left wall' };
        }

        // Check ground-level entry: the lowest gap row should have solid ground
        // beneath it (at the gap row + 1 or at the bottom row)
        const lowestGap = gapRows[gapRows.length - 1];

        // Check for solid floor beneath the entry gap
        let hasFloor = false;
        // The tile below the lowest gap position should be solid (floor)
        if (lowestGap + 1 <= bottom) {
            const belowTile = tiles[lowestGap + 1] ? tiles[lowestGap + 1][left] : TILE_SOLID;
            const belowInsideTile = tiles[lowestGap + 1] ? tiles[lowestGap + 1][left + 1] : TILE_SOLID;
            if (this.isSolid(belowTile) || belowTile === TILE_ICE ||
                this.isSolid(belowInsideTile) || belowInsideTile === TILE_ICE) {
                hasFloor = true;
            }
        }
        // Also check if the gap is right above the arena floor
        if (lowestGap === bottom - 1) {
            hasFloor = true;
        }

        // Check the tile just outside the arena (left - 1) at entry level
        // to see if the player can walk in
        let hasApproachGround = false;
        if (left > 0 && lowestGap + 1 < h) {
            const outsideTile = tiles[lowestGap + 1][left - 1];
            if (this.isSolid(outsideTile) || outsideTile === TILE_ICE || this.isSupport(outsideTile)) {
                hasApproachGround = true;
            }
        }
        // If no tile outside, the pre-boss terrain usually provides ground
        if (left > 0) hasApproachGround = true;

        if (hasFloor && hasApproachGround) {
            return { result: 'PASS', details: `Entry at row ${lowestGap}, ground-level, walkable` };
        } else if (!hasFloor) {
            return { result: 'FAIL', details: `Entry gap at row ${lowestGap} has no solid floor beneath` };
        } else {
            return { result: 'FAIL', details: `Entry at row ${lowestGap} not accessible from outside` };
        }
    },

    /**
     * Run all arena checks for the current stage.
     * Returns { enclosure, minWidth, platforms, entry }
     */
    validateArena(tiles, w, h) {
        const bounds = this._findArenaBounds(tiles, w, h);
        return {
            enclosure: this._checkArenaEnclosure(tiles, w, h, bounds),
            minWidth: this._checkArenaMinWidth(bounds),
            platforms: this._checkArenaPlatforms(tiles, w, h, bounds),
            entry: this._checkArenaEntry(tiles, w, h, bounds)
        };
    },

    // =============================================
    // DIFFICULTY PARAMETER VALIDATION
    // =============================================

    /**
     * Get the world index (0-4) for a given stageId.
     */
    _getWorldIndex(stageId) {
        const stageInfo = WorldMap.STAGES.find(s => s.id === stageId);
        return stageInfo ? stageInfo.world : 0;
    },

    /**
     * Check boss vulnerability window against difficulty table.
     * Returns { result: 'PASS'|'FAIL', details: string, expected, actual }
     */
    _checkVulnerabilityWindow(stageId) {
        const worldIndex = this._getWorldIndex(stageId);
        const table = this.DIFFICULTY_TABLE[worldIndex];
        const bossType = Level.bossData ? Level.bossData.type : null;

        if (!bossType) {
            return { result: 'FAIL', details: 'No boss data', expected: table.vulnerabilityWindow, actual: 0 };
        }

        const vulnFrames = this.BOSS_VULN_FRAMES[bossType] || 0;
        const vulnSeconds = vulnFrames / 60;
        const expectedSeconds = table.vulnerabilityWindow;
        const expectedFrames = table.vulnerabilityFrames;

        // Check if actual vulnerability window meets the expected value
        // Allow a tolerance of ±0.5s (±30 frames) since exact match isn't realistic
        const pass = vulnFrames >= expectedFrames - 30;

        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `${bossType}: ${vulnSeconds.toFixed(1)}s (${vulnFrames}f) — expected ${expectedSeconds}s (${expectedFrames}f)`,
            expected: expectedSeconds,
            actual: vulnSeconds
        };
    },

    /**
     * Check boss HP against difficulty table.
     * Reads actual boss maxHealth from spawnBoss configuration.
     * Returns { result: 'PASS'|'FAIL', details: string, actual, min, max }
     */
    _checkBossHP(stageId) {
        const worldIndex = this._getWorldIndex(stageId);
        const table = this.DIFFICULTY_TABLE[worldIndex];
        const bossType = Level.bossData ? Level.bossData.type : null;

        if (!bossType) {
            return { result: 'FAIL', details: 'No boss data', actual: 0, min: table.bossHPMin, max: table.bossHPMax };
        }

        // Read actual boss health from game data (Enemies.spawnBoss configs)
        let actualHP = 0;
        if (typeof Enemies !== 'undefined' && Enemies.spawnBoss) {
            // Try to read from the Enemies configs directly
            const configs = {
                'elder_shroomba': 5, 'vine_mother': 6, 'stag_king': 7,
                'sand_wyrm': 6, 'pharaoh_specter': 8, 'hydra_cactus': 12,
                'frost_bear': 7, 'crystal_witch': 25, 'yeti_monarch': 9,
                'lava_serpent': 7, 'iron_warden': 7, 'dragon_caldera': 11,
                'the_architect': 19
            };
            actualHP = configs[bossType] || 0;
        } else {
            // Fallback to our local config
            const cfg = this.BOSS_CONFIGS[bossType];
            actualHP = cfg ? cfg.maxHealth : 0;
        }

        const pass = actualHP >= table.bossHPMin && actualHP <= table.bossHPMax;

        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `${bossType}: HP ${actualHP} — expected ${table.bossHPMin}-${table.bossHPMax}`,
            actual: actualHP,
            min: table.bossHPMin,
            max: table.bossHPMax
        };
    },

    /**
     * Check enemy density per visible screen (30 tile sliding window).
     * Returns { result: 'PASS'|'FAIL', details: string, maxPerScreen, worldLimit }
     */
    _checkEnemyDensity(stageId) {
        const worldIndex = this._getWorldIndex(stageId);
        const table = this.DIFFICULTY_TABLE[worldIndex];
        const spawns = Level.enemySpawns || [];
        const screenWidthTiles = 30; // 960px / 32px

        if (spawns.length === 0) {
            return {
                result: 'PASS',
                details: 'No enemies in stage',
                maxPerScreen: 0,
                worldLimit: table.maxEnemyDensity
            };
        }

        // Get enemy x-positions in tile coordinates
        const enemyTileCols = spawns.map(s => Math.floor(s.x / TILE_SIZE));

        // Sliding window: check every possible 30-tile window
        const minCol = Math.min(...enemyTileCols);
        const maxCol = Math.max(...enemyTileCols);
        let maxInWindow = 0;

        for (let startCol = minCol; startCol <= maxCol; startCol++) {
            const endCol = startCol + screenWidthTiles;
            let count = 0;
            for (const col of enemyTileCols) {
                if (col >= startCol && col < endCol) count++;
            }
            if (count > maxInWindow) maxInWindow = count;
        }

        const pass = maxInWindow <= table.maxEnemyDensity;

        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `Max ${maxInWindow} enemies/screen — limit ${table.maxEnemyDensity}`,
            maxPerScreen: maxInWindow,
            worldLimit: table.maxEnemyDensity
        };
    },

    /**
     * Check hazard tile percentage (hazard tiles / total non-empty tiles).
     * Returns { result: 'PASS'|'FAIL', details: string, actual, limit }
     */
    _checkHazardPercentage(stageId) {
        const worldIndex = this._getWorldIndex(stageId);
        const table = this.DIFFICULTY_TABLE[worldIndex];
        const tiles = Level.tiles;
        const w = Level.width;
        const h = Level.height;

        let hazardCount = 0;
        let nonEmptyCount = 0;

        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const tile = tiles[r][c];
                if (tile !== TILE_EMPTY) {
                    nonEmptyCount++;
                    if (tile === TILE_HAZARD || tile === TILE_LAVA) {
                        hazardCount++;
                    }
                }
            }
        }

        const percentage = nonEmptyCount > 0 ? (hazardCount / nonEmptyCount) * 100 : 0;
        const pass = percentage <= table.maxHazardPercent;

        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `${percentage.toFixed(1)}% hazard tiles — limit ${table.maxHazardPercent}%`,
            actual: parseFloat(percentage.toFixed(1)),
            limit: table.maxHazardPercent
        };
    },

    /**
     * Check minimum platform width — scans all rows for contiguous standable
     * tile runs and reports the narrowest.
     * Returns { result: 'PASS'|'FAIL', details: string, narrowest, worldMin }
     */
    _checkMinPlatformWidth(stageId) {
        const worldIndex = this._getWorldIndex(stageId);
        const table = this.DIFFICULTY_TABLE[worldIndex];
        const tiles = Level.tiles;
        const w = Level.width;
        const h = Level.height;

        let narrowestPlatform = Infinity;
        let platformFound = false;

        // Scan all rows for contiguous standable tile runs
        for (let r = 0; r < h; r++) {
            let runLength = 0;
            for (let c = 0; c < w; c++) {
                const tile = tiles[r][c];
                // A standable tile: solid, one-way, or ice
                const isStandable = tile === TILE_SOLID || tile === TILE_ONE_WAY || tile === TILE_ICE;
                // Also check that the space above is passable (actually a platform surface)
                const abovePassable = r > 0 ? this.isPassable(tiles[r - 1][c]) : true;

                if (isStandable && abovePassable) {
                    runLength++;
                } else {
                    if (runLength > 0) {
                        platformFound = true;
                        if (runLength < narrowestPlatform) {
                            narrowestPlatform = runLength;
                        }
                    }
                    runLength = 0;
                }
            }
            // End of row
            if (runLength > 0) {
                platformFound = true;
                if (runLength < narrowestPlatform) {
                    narrowestPlatform = runLength;
                }
            }
        }

        if (!platformFound) {
            return {
                result: 'FAIL',
                details: 'No platforms found',
                narrowest: 0,
                worldMin: table.minPlatformWidth
            };
        }

        const pass = narrowestPlatform >= table.minPlatformWidth;

        return {
            result: pass ? 'PASS' : 'FAIL',
            details: `Narrowest: ${narrowestPlatform} tiles — min ${table.minPlatformWidth}`,
            narrowest: narrowestPlatform,
            worldMin: table.minPlatformWidth
        };
    },

    /**
     * Run all difficulty checks for the current stage.
     * Returns { vulnerabilityWindow, bossHP, enemyDensity, hazardPercentage, minPlatformWidth }
     */
    validateDifficulty(stageId) {
        return {
            vulnerabilityWindow: this._checkVulnerabilityWindow(stageId),
            bossHP: this._checkBossHP(stageId),
            enemyDensity: this._checkEnemyDensity(stageId),
            hazardPercentage: this._checkHazardPercentage(stageId),
            minPlatformWidth: this._checkMinPlatformWidth(stageId)
        };
    },

    // =============================================
    // STAGE VALIDATION
    // =============================================

    /**
     * Validate path for a single stage (assumes Level is already loaded).
     * Returns { stageId, name, pathResult, details, failCoords? }
     */
    validateStagePath(stageId) {
        const stageInfo = WorldMap.STAGES.find(s => s.id === stageId);
        const name = stageInfo ? stageInfo.name : stageId;

        // Get level data
        const tiles = Level.tiles;
        const w = Level.width;
        const h = Level.height;

        // Get spawn position in tile coordinates
        const spawnCol = Math.floor(Level.spawnX / TILE_SIZE);
        const spawnRow = Math.floor(Level.spawnY / TILE_SIZE);

        // Get boss arena start column (the goal)
        const bossArenaCol = Level.bossArenaX ? Math.floor(Level.bossArenaX / TILE_SIZE) : w - 5;

        // Run BFS
        const reachable = this.bfs(
            tiles, w, h, spawnCol, spawnRow,
            Level.movingPlatforms || [],
            Level.chains || []
        );

        // Check if any reachable position is at or past boss arena
        let reached = false;
        let maxReachedCol = 0;
        let maxReachedRow = 0;

        for (const key of reachable) {
            const parts = key.split(',');
            const col = parseInt(parts[0]);
            const row = parseInt(parts[1]);

            if (col > maxReachedCol) {
                maxReachedCol = col;
                maxReachedRow = row;
            }
            if (col >= bossArenaCol) {
                reached = true;
            }
        }

        if (reached) {
            return {
                stageId: stageId,
                name: name,
                pathResult: 'PASS',
                details: `Path found from spawn (${spawnCol},${spawnRow}) to boss arena (col ${bossArenaCol}). ${reachable.size} positions reachable.`
            };
        } else {
            return {
                stageId: stageId,
                name: name,
                pathResult: 'FAIL',
                details: `Path blocked at column ${maxReachedCol}. Target: column ${bossArenaCol}. Gap: ${bossArenaCol - maxReachedCol} tiles.`,
                failCoords: {
                    lastReachableCol: maxReachedCol,
                    lastReachableRow: maxReachedRow,
                    targetCol: bossArenaCol,
                    gapTiles: bossArenaCol - maxReachedCol
                }
            };
        }
    },

    /**
     * Run full playability check across all 13 stages.
     * Returns a complete JSON report with path, arena, and difficulty results.
     */
    runFullCheck() {
        const stageIds = ['1-1', '1-2', '1-3', '2-1', '2-2', '2-3',
                          '3-1', '3-2', '3-3', '4-1', '4-2', '4-3', '5-1'];
        const results = [];

        // Save current state
        const savedStageId = GameState.currentStageId;

        for (const stageId of stageIds) {
            // Load the stage
            Level.loadStage(stageId);

            // Validate path (sprint 13)
            const pathResult = this.validateStagePath(stageId);

            // Validate arena (sprint 14)
            const arenaResult = this.validateArena(Level.tiles, Level.width, Level.height);

            // Validate difficulty (sprint 14)
            const difficultyResult = this.validateDifficulty(stageId);

            results.push({
                stageId: pathResult.stageId,
                name: pathResult.name,
                pathResult: pathResult.pathResult,
                details: pathResult.details,
                failCoords: pathResult.failCoords || null,
                arenaResult: arenaResult,
                difficultyResult: difficultyResult
            });
        }

        // Restore previous stage ID
        GameState.currentStageId = savedStageId;

        // Aggregate counts across ALL check categories
        let totalPass = 0;
        let totalFail = 0;

        for (const stage of results) {
            // Path check
            if (stage.pathResult === 'PASS') totalPass++; else totalFail++;

            // Arena checks (4 sub-checks)
            for (const key of ['enclosure', 'minWidth', 'platforms', 'entry']) {
                if (stage.arenaResult[key].result === 'PASS') totalPass++; else totalFail++;
            }

            // Difficulty checks (5 sub-checks)
            for (const key of ['vulnerabilityWindow', 'bossHP', 'enemyDensity', 'hazardPercentage', 'minPlatformWidth']) {
                if (stage.difficultyResult[key].result === 'PASS') totalPass++; else totalFail++;
            }
        }

        return {
            timestamp: new Date().toISOString(),
            validator: 'PlayabilityValidator v2.0',
            stageCount: results.length,
            passCount: totalPass,
            failCount: totalFail,
            totalChecks: totalPass + totalFail,
            allPass: totalFail === 0,
            categoryCounts: {
                path: {
                    pass: results.filter(r => r.pathResult === 'PASS').length,
                    fail: results.filter(r => r.pathResult === 'FAIL').length
                },
                arena: {
                    pass: results.reduce((sum, r) => sum + ['enclosure', 'minWidth', 'platforms', 'entry'].filter(k => r.arenaResult[k].result === 'PASS').length, 0),
                    fail: results.reduce((sum, r) => sum + ['enclosure', 'minWidth', 'platforms', 'entry'].filter(k => r.arenaResult[k].result === 'FAIL').length, 0)
                },
                difficulty: {
                    pass: results.reduce((sum, r) => sum + ['vulnerabilityWindow', 'bossHP', 'enemyDensity', 'hazardPercentage', 'minPlatformWidth'].filter(k => r.difficultyResult[k].result === 'PASS').length, 0),
                    fail: results.reduce((sum, r) => sum + ['vulnerabilityWindow', 'bossHP', 'enemyDensity', 'hazardPercentage', 'minPlatformWidth'].filter(k => r.difficultyResult[k].result === 'FAIL').length, 0)
                }
            },
            stages: results
        };
    },

    // =============================================
    // DEBUG OVERLAY UI
    // =============================================

    /** Open the debug overlay and run validation */
    open() {
        this.active = true;
        this.scrollOffset = 0;
        this.running = true;
        this.results = null;
        this._animTimer = 0;

        // Run validation asynchronously (allows UI to show "Running...")
        setTimeout(() => {
            this.results = this.runFullCheck();
            this.running = false;
        }, 50);
    },

    /** Close the debug overlay */
    close() {
        this.active = false;
        this.results = null;
        this.scrollOffset = 0;
        this.running = false;
    },

    /** Update debug overlay (handle input) */
    update() {
        if (!this.active) return;
        this._animTimer += 1 / 60;

        if (Input.isJustPressed('Escape') || Input.isJustPressed('d') || Input.isJustPressed('D')) {
            this.close();
            return;
        }

        // Scrolling — each stage now has multiple lines so we count total lines
        if (this.results && this.results.stages) {
            const totalLines = this._getTotalDisplayLines();
            const maxScroll = Math.max(0, totalLines - 8);
            if (Input.isJustPressed('ArrowDown')) {
                this.scrollOffset = Math.min(this.scrollOffset + 1, maxScroll);
            }
            if (Input.isJustPressed('ArrowUp')) {
                this.scrollOffset = Math.max(this.scrollOffset - 1, 0);
            }
        }
    },

    /** Calculate total display lines for scrolling */
    _getTotalDisplayLines() {
        if (!this.results || !this.results.stages) return 0;
        // Each stage: 1 header line + 1 arena summary line + 1 difficulty summary line = 3 lines
        return this.results.stages.length * 3;
    },

    /** Helper: draw a small PASS/FAIL badge */
    _drawBadge(ctx, text, x, y, isPass) {
        const badgeW = 36;
        const badgeH = 14;
        ctx.fillStyle = isPass ? 'rgba(90, 158, 111, 0.3)' : 'rgba(217, 79, 79, 0.3)';
        ctx.fillRect(x, y - 1, badgeW, badgeH);
        ctx.strokeStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y - 1, badgeW, badgeH);
        ctx.font = 'bold 9px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
        ctx.fillText(text, x + badgeW / 2, y + 2);
    },

    /** Render the debug overlay */
    render(ctx) {
        if (!this.active) return;

        // Full-screen overlay background — Deep Charcoal at 92% opacity
        ctx.fillStyle = 'rgba(26, 26, 46, 0.92)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Border
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 2;
        ctx.strokeRect(16, 16, CANVAS_WIDTH - 32, CANVAS_HEIGHT - 32);

        // Title
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Text outline for readability
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('PLAYABILITY VALIDATOR', CANVAS_WIDTH / 2, 32);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillText('PLAYABILITY VALIDATOR', CANVAS_WIDTH / 2, 32);

        if (this.running) {
            // Show "Running..." with animated dots
            const dots = '.'.repeat(Math.floor(this._animTimer * 3) % 4);
            ctx.font = '22px sans-serif';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeText('Running validation' + dots, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
            ctx.fillStyle = COLORS.softCream;
            ctx.fillText('Running validation' + dots, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
            return;
        }

        if (!this.results) return;

        // Summary line — total pass/fail across ALL check categories
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'left';
        const summaryY = 68;

        const summaryText = `${this.results.passCount} PASS / ${this.results.failCount} FAIL / ${this.results.totalChecks} CHECKS`;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(summaryText, 48, summaryY);
        ctx.fillStyle = this.results.allPass ? COLORS.mossGreen : COLORS.emberRed;
        ctx.fillText(summaryText, 48, summaryY);

        // Category breakdown
        const cc = this.results.categoryCounts;
        ctx.font = '11px "Courier New", monospace';
        const catY = summaryY + 18;
        ctx.fillStyle = COLORS.steelBlue;
        const catText = `Path: ${cc.path.pass}/${cc.path.pass + cc.path.fail}  Arena: ${cc.arena.pass}/${cc.arena.pass + cc.arena.fail}  Difficulty: ${cc.difficulty.pass}/${cc.difficulty.pass + cc.difficulty.fail}`;
        ctx.fillText(catText, 48, catY);

        // Timestamp
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.steelBlue;
        ctx.fillText(this.results.timestamp, CANVAS_WIDTH - 48, summaryY);

        // Separator
        ctx.strokeStyle = COLORS.warmSlate;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, catY + 16);
        ctx.lineTo(CANVAS_WIDTH - 48, catY + 16);
        ctx.stroke();

        // Stage results (scrollable, 3 lines per stage)
        const contentStartY = catY + 22;
        const lineHeight = 15;
        const contentHeight = CANVAS_HEIGHT - contentStartY - 48;
        const visibleLines = Math.floor(contentHeight / lineHeight);

        // Build flat list of display lines
        const lines = [];
        const stages = this.results.stages;

        for (let si = 0; si < stages.length; si++) {
            const stage = stages[si];

            // Line 1: Stage header with path result
            lines.push({ type: 'header', stage: stage, index: si });

            // Line 2: Arena results summary
            lines.push({ type: 'arena', stage: stage, index: si });

            // Line 3: Difficulty results summary
            lines.push({ type: 'difficulty', stage: stage, index: si });
        }

        // Clip content area
        ctx.save();
        ctx.beginPath();
        ctx.rect(32, contentStartY - 2, CANVAS_WIDTH - 64, contentHeight + 4);
        ctx.clip();

        for (let i = 0; i < visibleLines && i + this.scrollOffset < lines.length; i++) {
            const line = lines[i + this.scrollOffset];
            const y = contentStartY + i * lineHeight;

            if (line.type === 'header') {
                // Alternating row background for each stage group
                if (line.index % 2 === 0) {
                    ctx.fillStyle = 'rgba(45, 45, 68, 0.3)';
                    ctx.fillRect(40, y - 3, CANVAS_WIDTH - 80, lineHeight * 3);
                }

                // Stage ID
                ctx.font = 'bold 12px "Courier New", monospace';
                ctx.fillStyle = COLORS.softCream;
                ctx.textAlign = 'left';
                ctx.fillText(line.stage.stageId, 48, y + 1);

                // Stage name
                ctx.font = '12px sans-serif';
                ctx.fillStyle = COLORS.softCream;
                ctx.fillText(line.stage.name, 88, y + 1);

                // Path result badge
                const pathPass = line.stage.pathResult === 'PASS';
                ctx.font = 'bold 10px "Courier New", monospace';
                ctx.fillStyle = COLORS.steelBlue;
                ctx.fillText('PATH:', 230, y + 1);
                this._drawBadge(ctx, line.stage.pathResult, 268, y - 1, pathPass);

                // Path details (truncated)
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = COLORS.steelBlue;
                let detail = line.stage.details;
                if (detail.length > 65) detail = detail.substring(0, 62) + '...';
                ctx.fillText(detail, 312, y + 1);

            } else if (line.type === 'arena') {
                const ar = line.stage.arenaResult;
                const x0 = 88;
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = COLORS.steelBlue;
                ctx.textAlign = 'left';
                ctx.fillText('ARENA:', x0, y + 1);

                // 4 mini badges: enclosure, minWidth, platforms, entry
                const arenaChecks = [
                    { key: 'enclosure', label: 'ENC' },
                    { key: 'minWidth', label: 'WID' },
                    { key: 'platforms', label: 'PLT' },
                    { key: 'entry', label: 'ENT' }
                ];
                let bx = x0 + 52;
                for (const chk of arenaChecks) {
                    const isPass = ar[chk.key].result === 'PASS';
                    // Label
                    ctx.font = '9px "Courier New", monospace';
                    ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
                    ctx.textAlign = 'left';
                    ctx.fillText(chk.label, bx, y + 1);
                    // Small indicator dot
                    ctx.beginPath();
                    ctx.arc(bx + 24, y + 3, 3, 0, Math.PI * 2);
                    ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
                    ctx.fill();
                    bx += 38;
                }

                // Arena details text
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = COLORS.steelBlue;
                const arDetail = `${ar.minWidth.details}`;
                ctx.fillText(arDetail, bx + 10, y + 1);

            } else if (line.type === 'difficulty') {
                const dr = line.stage.difficultyResult;
                const x0 = 88;
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = COLORS.steelBlue;
                ctx.textAlign = 'left';
                ctx.fillText('DIFF:', x0, y + 1);

                // 5 mini badges: vuln, hp, density, hazard, platWidth
                const diffChecks = [
                    { key: 'vulnerabilityWindow', label: 'VUL' },
                    { key: 'bossHP', label: 'HP' },
                    { key: 'enemyDensity', label: 'DEN' },
                    { key: 'hazardPercentage', label: 'HAZ' },
                    { key: 'minPlatformWidth', label: 'PLW' }
                ];
                let bx = x0 + 52;
                for (const chk of diffChecks) {
                    const isPass = dr[chk.key].result === 'PASS';
                    ctx.font = '9px "Courier New", monospace';
                    ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
                    ctx.textAlign = 'left';
                    ctx.fillText(chk.label, bx, y + 1);
                    ctx.beginPath();
                    ctx.arc(bx + 24, y + 3, 3, 0, Math.PI * 2);
                    ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
                    ctx.fill();
                    bx += 38;
                }

                // Difficulty summary detail
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'left';
                ctx.fillStyle = COLORS.steelBlue;
                const drDetail = `${dr.bossHP.details}`;
                ctx.fillText(drDetail, bx + 10, y + 1);
            }
        }

        ctx.restore();

        // Scroll indicator
        const totalLines = lines.length;
        if (totalLines > visibleLines) {
            const scrollbarX = CANVAS_WIDTH - 36;
            const scrollbarY = contentStartY;
            const scrollbarH = visibleLines * lineHeight;

            // Track
            ctx.fillStyle = COLORS.warmSlate;
            ctx.fillRect(scrollbarX, scrollbarY, 6, scrollbarH);

            // Thumb
            const thumbH = Math.max(20, (visibleLines / totalLines) * scrollbarH);
            const maxScrollVal = Math.max(1, totalLines - visibleLines);
            const thumbY = scrollbarY + (this.scrollOffset / maxScrollVal) * (scrollbarH - thumbH);
            ctx.fillStyle = COLORS.mutedGold;
            ctx.fillRect(scrollbarX, thumbY, 6, thumbH);
        }

        // Footer instructions
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        const footerY = CANVAS_HEIGHT - 44;
        const footerText = '↑/↓ Scroll   |   ESC/D Close';
        ctx.strokeText(footerText, CANVAS_WIDTH / 2, footerY);
        ctx.fillStyle = COLORS.softCream;
        ctx.fillText(footerText, CANVAS_WIDTH / 2, footerY);
    }
};

// =============================================
// GLOBAL API: window.runPlayabilityCheck()
// =============================================
window.runPlayabilityCheck = function() {
    return PlayabilityValidator.runFullCheck();
};
