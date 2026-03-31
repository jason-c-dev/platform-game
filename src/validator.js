// ============================================================
// validator.js — Playability Validator: BFS Path Validation Engine
// Sprint 13: Validates traversability from spawn to boss trigger zone
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
     * Returns a complete JSON report.
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

            // Validate path
            const result = this.validateStagePath(stageId);
            results.push(result);
        }

        // Restore previous stage ID (don't restore full level state since
        // this runs from debug mode, not during gameplay)
        GameState.currentStageId = savedStageId;

        const passCount = results.filter(r => r.pathResult === 'PASS').length;
        const failCount = results.filter(r => r.pathResult === 'FAIL').length;

        return {
            timestamp: new Date().toISOString(),
            validator: 'PlayabilityValidator v1.0',
            stageCount: results.length,
            passCount: passCount,
            failCount: failCount,
            allPass: failCount === 0,
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

        // Scrolling
        if (this.results && this.results.stages) {
            const maxScroll = Math.max(0, this.results.stages.length - 10);
            if (Input.isJustPressed('ArrowDown')) {
                this.scrollOffset = Math.min(this.scrollOffset + 1, maxScroll);
            }
            if (Input.isJustPressed('ArrowUp')) {
                this.scrollOffset = Math.max(this.scrollOffset - 1, 0);
            }
        }
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

        // Summary line
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'left';
        const summaryY = 72;
        const summaryText = `${this.results.passCount} PASS  /  ${this.results.failCount} FAIL  /  ${this.results.stageCount} TOTAL`;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeText(summaryText, 48, summaryY);
        ctx.fillStyle = this.results.allPass ? COLORS.mossGreen : COLORS.emberRed;
        ctx.fillText(summaryText, 48, summaryY);

        // Timestamp
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = COLORS.steelBlue;
        ctx.fillText(this.results.timestamp, CANVAS_WIDTH - 48, summaryY);

        // Column headers
        ctx.textAlign = 'left';
        ctx.font = 'bold 12px sans-serif';
        const headerY = summaryY + 28;
        ctx.fillStyle = COLORS.steelBlue;
        ctx.fillText('STAGE', 48, headerY);
        ctx.fillText('NAME', 130, headerY);
        ctx.fillText('RESULT', 370, headerY);
        ctx.fillText('DETAILS', 460, headerY);

        // Separator line
        ctx.strokeStyle = COLORS.warmSlate;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(48, headerY + 18);
        ctx.lineTo(CANVAS_WIDTH - 48, headerY + 18);
        ctx.stroke();

        // Stage results (scrollable)
        const startY = headerY + 26;
        const rowHeight = 36;
        const visibleRows = 10;
        const stages = this.results.stages;

        for (let i = 0; i < visibleRows && i + this.scrollOffset < stages.length; i++) {
            const stage = stages[i + this.scrollOffset];
            const y = startY + i * rowHeight;

            // Row background (alternating for readability)
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(45, 45, 68, 0.4)';
                ctx.fillRect(40, y - 4, CANVAS_WIDTH - 80, rowHeight - 2);
            }

            // Stage ID
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.fillStyle = COLORS.softCream;
            ctx.textAlign = 'left';
            ctx.fillText(stage.stageId, 48, y + 4);

            // Stage name
            ctx.font = '14px sans-serif';
            ctx.fillStyle = COLORS.softCream;
            ctx.fillText(stage.name, 130, y + 4);

            // Result badge
            const isPass = stage.pathResult === 'PASS';
            const badgeX = 370;
            const badgeW = 60;
            const badgeH = 20;

            // Badge background
            ctx.fillStyle = isPass ? 'rgba(90, 158, 111, 0.3)' : 'rgba(217, 79, 79, 0.3)';
            ctx.fillRect(badgeX, y - 1, badgeW, badgeH);
            ctx.strokeStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
            ctx.lineWidth = 1;
            ctx.strokeRect(badgeX, y - 1, badgeW, badgeH);

            // Badge text
            ctx.font = 'bold 12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = isPass ? COLORS.mossGreen : COLORS.emberRed;
            ctx.fillText(stage.pathResult, badgeX + badgeW / 2, y + 3);

            // Details text
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = COLORS.steelBlue;
            // Truncate details to fit
            const maxDetailWidth = CANVAS_WIDTH - 48 - 460;
            let detailText = stage.details;
            if (ctx.measureText(detailText).width > maxDetailWidth) {
                while (ctx.measureText(detailText + '...').width > maxDetailWidth && detailText.length > 0) {
                    detailText = detailText.slice(0, -1);
                }
                detailText += '...';
            }
            ctx.fillText(detailText, 460, y + 4);

            // Failure coordinates for FAIL results
            if (!isPass && stage.failCoords) {
                ctx.font = '10px "Courier New", monospace';
                ctx.fillStyle = COLORS.emberRed;
                ctx.fillText(
                    `[col ${stage.failCoords.lastReachableCol} → ${stage.failCoords.targetCol}]`,
                    460, y + 18
                );
            }
        }

        // Scroll indicator
        if (stages.length > visibleRows) {
            const scrollbarX = CANVAS_WIDTH - 36;
            const scrollbarY = startY;
            const scrollbarH = visibleRows * rowHeight;

            // Track
            ctx.fillStyle = COLORS.warmSlate;
            ctx.fillRect(scrollbarX, scrollbarY, 6, scrollbarH);

            // Thumb
            const thumbH = (visibleRows / stages.length) * scrollbarH;
            const thumbY = scrollbarY + (this.scrollOffset / Math.max(1, stages.length - visibleRows)) * (scrollbarH - thumbH);
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
