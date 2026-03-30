// ============================================================
// renderer.js — Rendering: tiles, backgrounds, entities
// ============================================================

const Renderer = {
    canvas: null,
    ctx: null,
    frameTime: 0,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx.imageSmoothingEnabled = false;
        this.frameTime = 0;
    },

    // Dark mode rendering: spotlight for dark rooms
    darkMode: false,
    drawDarkOverlay(ctx) { this.renderDarkOverlay(ctx); },
    _heatShimmerTimer: 0,

    // Snow particles for tundra world
    _snowParticles: [],
    _snowInitialized: false,

    clear() {
        const world = this._getCurrentWorld();
        if (world === 2) {
            // Tundra background - deep night sky
            this.ctx.fillStyle = '#0A1520';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else if (world === 1) {
            // Desert background
            this.ctx.fillStyle = '#2A1A0A';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        } else {
            // Forest / default background
            this.ctx.fillStyle = '#0D1B0E';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    },

    _getCurrentWorld() {
        const stageId = Level.currentStageId || GameState.currentStageId || '1-1';
        return parseInt(stageId.charAt(0)) - 1; // 0=forest, 1=desert, etc.
    },

    // =======================
    // PARALLAX BACKGROUND
    // =======================
    renderParallax() {
        const ctx = this.ctx;
        const world = this._getCurrentWorld();

        // Advance animation timer
        this.frameTime += 1 / 60;

        if (world === 2) {
            // Tundra parallax
            this._renderTundraParallax();
        } else if (world === 1) {
            // Desert parallax
            this._renderDesertParallax();
        } else {
            // Forest parallax (default)
            this._renderMountainLayer(Camera.layers[0]);
            this._renderFarTreeLayer(Camera.layers[1]);
            this._renderMidTreeLayer(Camera.layers[2]);
            this._renderLeafLayer(Camera.layers[3]);
        }
    },

    // =======================
    // DESERT PARALLAX
    // =======================
    _renderDesertParallax() {
        const ctx = this.ctx;

        // Layer 0: Desert sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#E8B84A');
        grad.addColorStop(0.3, '#D49A3A');
        grad.addColorStop(0.7, '#C4943A');
        grad.addColorStop(1, '#8B6B2E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Layer 1: Distant dunes
        if (Camera.layers[0]) {
            const layer = Camera.layers[0];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 120;
            ctx.fillStyle = '#B8843A';
            for (const m of layer.elements) {
                const sx = m.x - offsetX;
                if (sx + m.width < -50 || sx > CANVAS_WIDTH + 50) continue;
                ctx.beginPath();
                ctx.moveTo(sx, baseY);
                ctx.quadraticCurveTo(sx + m.width / 2, baseY - m.height * 0.6, sx + m.width, baseY);
                ctx.fill();
            }
        }

        // Layer 2: Mid-distance ruins/cacti
        if (Camera.layers[1]) {
            const layer = Camera.layers[1];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 70;
            for (const t of layer.elements) {
                const sx = t.x - offsetX;
                if (sx + t.width < -20 || sx > CANVAS_WIDTH + 20) continue;

                // Alternate between cacti and ruins
                if (t.trunk > 12) {
                    // Ruin column
                    ctx.fillStyle = COLORS.desert.lightStone;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(sx + t.width / 2 - 6, baseY - t.height * 0.5, 12, t.height * 0.5);
                    ctx.fillRect(sx + t.width / 2 - 10, baseY - t.height * 0.5, 20, 4);
                    ctx.globalAlpha = 1.0;
                } else {
                    // Cactus silhouette
                    ctx.fillStyle = '#5A7A2E';
                    ctx.globalAlpha = 0.4;
                    ctx.fillRect(sx + t.width / 2 - 3, baseY - t.height * 0.4, 6, t.height * 0.4);
                    ctx.fillRect(sx + t.width / 2 - 12, baseY - t.height * 0.3, 8, 4);
                    ctx.fillRect(sx + t.width / 2 - 12, baseY - t.height * 0.3, 4, -12);
                    ctx.fillRect(sx + t.width / 2 + 6, baseY - t.height * 0.25, 8, 4);
                    ctx.fillRect(sx + t.width / 2 + 10, baseY - t.height * 0.25, 4, -10);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Layer 3: Near dunes
        if (Camera.layers[2]) {
            const layer = Camera.layers[2];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 20;
            ctx.fillStyle = COLORS.desert.sand;
            ctx.globalAlpha = 0.5;
            for (const t of layer.elements) {
                const sx = t.x - offsetX;
                if (sx + t.width < -30 || sx > CANVAS_WIDTH + 30) continue;
                ctx.beginPath();
                ctx.moveTo(sx, baseY);
                ctx.quadraticCurveTo(sx + t.width / 2, baseY - t.height * 0.3, sx + t.width, baseY);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }

        // Layer 4: Heat shimmer / sand particles
        this._heatShimmerTimer += 1 / 60;
        this._renderHeatShimmer(ctx);
    },

    _renderHeatShimmer(ctx) {
        // Animated heat shimmer lines
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < 8; i++) {
            const y = CANVAS_HEIGHT * 0.3 + i * 35 + Math.sin(this._heatShimmerTimer * 1.5 + i * 0.8) * 15;
            const waveOffset = Math.sin(this._heatShimmerTimer * 2 + i * 1.2) * 20;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
                const dy = Math.sin(this._heatShimmerTimer * 3 + x * 0.02 + i * 0.5) * 3;
                ctx.lineTo(x, y + dy + waveOffset);
            }
            ctx.lineTo(CANVAS_WIDTH, y + 4);
            ctx.lineTo(0, y + 4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    },

    // =======================
    // TUNDRA PARALLAX
    // =======================
    _renderTundraParallax() {
        const ctx = this.ctx;

        // Layer 0: Night sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#0A1520');
        grad.addColorStop(0.3, '#152535');
        grad.addColorStop(0.6, COLORS.tundra.shadow);
        grad.addColorStop(1, COLORS.tundra.deepIce);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Aurora borealis effect - animated glowing curtains
        this._renderAuroraBorealis(ctx);

        // Layer 1: Distant snow-capped mountains
        if (Camera.layers[0]) {
            const layer = Camera.layers[0];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 120;

            for (const m of layer.elements) {
                const sx = m.x - offsetX;
                if (sx + m.width < -50 || sx > CANVAS_WIDTH + 50) continue;

                // Mountain body
                ctx.fillStyle = COLORS.tundra.shadow;
                ctx.beginPath();
                ctx.moveTo(sx, baseY);
                ctx.lineTo(sx + m.width / 2, baseY - m.height);
                ctx.lineTo(sx + m.width, baseY);
                ctx.closePath();
                ctx.fill();

                // Snow cap
                ctx.fillStyle = COLORS.tundra.snowWhite;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.moveTo(sx + m.width / 2 - 15, baseY - m.height + 25);
                ctx.lineTo(sx + m.width / 2, baseY - m.height);
                ctx.lineTo(sx + m.width / 2 + 15, baseY - m.height + 25);
                ctx.closePath();
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Horizon fill
            ctx.fillStyle = COLORS.tundra.shadow;
            ctx.fillRect(0, baseY, CANVAS_WIDTH, CANVAS_HEIGHT - baseY);
        }

        // Layer 2: Mid-distance ice formations / frozen trees
        if (Camera.layers[1]) {
            const layer = Camera.layers[1];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 70;

            for (const t of layer.elements) {
                const sx = t.x - offsetX;
                if (sx + t.width < -20 || sx > CANVAS_WIDTH + 20) continue;

                if (t.trunk > 12) {
                    // Ice formation / pillar
                    ctx.fillStyle = COLORS.tundra.deepIce;
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(sx + t.width / 2 - 5, baseY - t.height * 0.4, 10, t.height * 0.4);
                    // Ice cap
                    ctx.fillStyle = COLORS.tundra.snowWhite;
                    ctx.fillRect(sx + t.width / 2 - 8, baseY - t.height * 0.4, 16, 4);
                    ctx.globalAlpha = 1.0;
                } else {
                    // Frozen pine tree
                    ctx.fillStyle = COLORS.tundra.deepIce;
                    ctx.globalAlpha = 0.4;
                    // Trunk
                    ctx.fillRect(sx + t.width / 2 - 2, baseY - t.height * 0.3, 4, t.height * 0.3);
                    // Triangular canopy
                    ctx.beginPath();
                    ctx.moveTo(sx + t.width / 2, baseY - t.height * 0.7);
                    ctx.lineTo(sx + t.width / 2 - 10, baseY - t.height * 0.2);
                    ctx.lineTo(sx + t.width / 2 + 10, baseY - t.height * 0.2);
                    ctx.closePath();
                    ctx.fill();
                    // Snow on branches
                    ctx.fillStyle = COLORS.tundra.snowWhite;
                    ctx.fillRect(sx + t.width / 2 - 8, baseY - t.height * 0.45, 16, 3);
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Layer 3: Near snow-covered ground
        if (Camera.layers[2]) {
            const layer = Camera.layers[2];
            const offsetX = Camera.x * layer.speed;
            const baseY = CANVAS_HEIGHT - 20;
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.globalAlpha = 0.4;
            for (const t of layer.elements) {
                const sx = t.x - offsetX;
                if (sx + t.width < -30 || sx > CANVAS_WIDTH + 30) continue;
                ctx.beginPath();
                ctx.moveTo(sx, baseY);
                ctx.quadraticCurveTo(sx + t.width / 2, baseY - t.height * 0.2, sx + t.width, baseY);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    },

    _renderAuroraBorealis(ctx) {
        ctx.save();
        const t = this.frameTime;

        // Draw 5 aurora curtain bands
        for (let i = 0; i < 5; i++) {
            const baseY = 30 + i * 25 + Math.sin(t * 0.3 + i * 1.5) * 20;
            const waveAmp = 15 + Math.sin(t * 0.5 + i * 0.8) * 8;
            const alpha = 0.08 + Math.sin(t * 0.7 + i * 1.2) * 0.04;

            // Alternate between green and teal aurora colors
            const isGreen = i % 2 === 0;
            ctx.fillStyle = isGreen ? COLORS.tundra.auroraGreen : COLORS.tundra.iceBlue;
            ctx.globalAlpha = alpha;

            ctx.beginPath();
            ctx.moveTo(0, baseY);
            for (let x = 0; x <= CANVAS_WIDTH; x += 15) {
                const dy = Math.sin(t * 0.8 + x * 0.008 + i * 2) * waveAmp;
                ctx.lineTo(x, baseY + dy);
            }
            ctx.lineTo(CANVAS_WIDTH, baseY + 40);
            ctx.lineTo(0, baseY + 40);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    _renderMountainLayer(layer) {
        const ctx = this.ctx;
        const offsetX = Camera.x * layer.speed;
        const baseY = CANVAS_HEIGHT - 100;

        for (const m of layer.elements) {
            const sx = m.x - offsetX;
            if (sx + m.width < -50 || sx > CANVAS_WIDTH + 50) continue;

            const shade = m.shade;
            const r = Math.floor(13 + shade * 15);
            const g = Math.floor(27 + shade * 30);
            const b = Math.floor(14 + shade * 20);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.moveTo(sx, baseY);
            ctx.lineTo(sx + m.width / 2, baseY - m.height);
            ctx.lineTo(sx + m.width, baseY);
            ctx.closePath();
            ctx.fill();

            // Snow cap hint
            ctx.fillStyle = 'rgba(200, 230, 160, 0.15)';
            ctx.beginPath();
            ctx.moveTo(sx + m.width / 2 - 10, baseY - m.height + 20);
            ctx.lineTo(sx + m.width / 2, baseY - m.height);
            ctx.lineTo(sx + m.width / 2 + 10, baseY - m.height + 20);
            ctx.closePath();
            ctx.fill();
        }

        ctx.fillStyle = '#0D1B0E';
        ctx.fillRect(0, baseY, CANVAS_WIDTH, CANVAS_HEIGHT - baseY);
    },

    _renderFarTreeLayer(layer) {
        const ctx = this.ctx;
        const offsetX = Camera.x * layer.speed;
        const baseY = CANVAS_HEIGHT - 60;

        for (const t of layer.elements) {
            const sx = t.x - offsetX;
            if (sx + t.width < -20 || sx > CANVAS_WIDTH + 20) continue;

            ctx.fillStyle = '#3A2A15';
            ctx.fillRect(sx + t.width / 2 - t.trunk / 2, baseY - t.height * 0.4, t.trunk, t.height * 0.4);

            ctx.fillStyle = layer.color1;
            ctx.beginPath();
            ctx.moveTo(sx, baseY - t.height * 0.3);
            ctx.lineTo(sx + t.width / 2, baseY - t.height);
            ctx.lineTo(sx + t.width, baseY - t.height * 0.3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = layer.color2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx + 4, baseY - t.height * 0.15);
            ctx.lineTo(sx + t.width / 2, baseY - t.height * 0.8);
            ctx.lineTo(sx + t.width - 4, baseY - t.height * 0.15);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderMidTreeLayer(layer) {
        const ctx = this.ctx;
        const offsetX = Camera.x * layer.speed;
        const baseY = CANVAS_HEIGHT - 20;

        for (const t of layer.elements) {
            const sx = t.x - offsetX;
            if (sx + t.width < -30 || sx > CANVAS_WIDTH + 30) continue;

            ctx.fillStyle = '#5A4025';
            ctx.fillRect(sx + t.width / 2 - t.trunk / 2, baseY - t.height * 0.45, t.trunk, t.height * 0.45);

            ctx.fillStyle = layer.color1;
            ctx.beginPath();
            ctx.arc(sx + t.width / 2, baseY - t.height * 0.6, t.width / 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = layer.color2;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(sx + t.width / 2 - 3, baseY - t.height * 0.65, t.width / 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderLeafLayer(layer) {
        const ctx = this.ctx;
        const offsetX = Camera.x * layer.speed;
        const offsetY = Camera.y * layer.speed * 0.3;

        for (const l of layer.elements) {
            const sx = l.x - offsetX;
            const sy = l.y - offsetY + Math.sin(this.frameTime * 1.5 + l.rotation) * 8;
            if (sx + l.size < -10 || sx > CANVAS_WIDTH + 10) continue;
            if (sy + l.size < -10 || sy > CANVAS_HEIGHT + 10) continue;

            ctx.fillStyle = COLORS.forest.highlight;
            ctx.globalAlpha = 0.15 + Math.sin(this.frameTime + l.rotation) * 0.05;

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(l.rotation + this.frameTime * l.drift * 10);

            ctx.beginPath();
            ctx.ellipse(0, 0, l.size / 2, l.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            ctx.globalAlpha = 1.0;
        }
    },

    // =======================
    // TILE RENDERING (with viewport culling)
    // =======================
    renderTiles() {
        const ctx = this.ctx;
        const camX = Camera.x;
        const camY = Camera.y;

        const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
        const endCol = Math.min(Level.width - 1, Math.floor((camX + CANVAS_WIDTH) / TILE_SIZE));
        const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
        const endRow = Math.min(Level.height - 1, Math.floor((camY + CANVAS_HEIGHT) / TILE_SIZE));

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const tile = Level.tiles[row][col];
                if (tile === TILE_EMPTY) continue;

                const x = col * TILE_SIZE - camX;
                const y = row * TILE_SIZE - camY;

                this._drawTile(ctx, tile, x, y, col, row);
            }
        }
    },

    _drawTile(ctx, type, x, y, col, row) {
        const s = TILE_SIZE;

        switch (type) {
            case TILE_SOLID:
                this._drawSolidTile(ctx, x, y, s, col, row);
                break;
            case TILE_ONE_WAY:
                this._drawOneWayTile(ctx, x, y, s);
                break;
            case TILE_HAZARD:
                this._drawHazardTile(ctx, x, y, s);
                break;
            case TILE_BREAKABLE:
                this._drawBreakableTile(ctx, x, y, s);
                break;
            case TILE_BOUNCE:
                this._drawBounceTile(ctx, x, y, s);
                break;
            case TILE_LADDER:
                this._drawLadderTile(ctx, x, y, s);
                break;
            case TILE_CRUMBLE:
                this._drawCrumbleTile(ctx, x, y, s, col, row);
                break;
            case TILE_QUICKSAND:
            case TILE_QUICKSAND_DEEP:
                this._drawQuicksandTile(ctx, x, y, s, type === TILE_QUICKSAND_DEEP);
                break;
            case TILE_WATER:
                this._drawWaterTile(ctx, x, y, s, false);
                break;
            case TILE_WATER_SURFACE:
                this._drawWaterTile(ctx, x, y, s, true);
                break;
            case TILE_PRESSURE_PLATE:
                this._drawPressurePlateTile(ctx, x, y, s, col, row);
                break;
            case TILE_GATE:
                this._drawGateTile(ctx, x, y, s);
                break;
            case TILE_ICE:
                this._drawIceTile(ctx, x, y, s, col, row);
                break;
        }
    },

    _drawSolidTile(ctx, x, y, s, col, row) {
        const world = this._getCurrentWorld();
        const tileAbove = Level.getTile(col, row - 1);
        const isSurface = (tileAbove === TILE_EMPTY || tileAbove === TILE_ONE_WAY ||
                           tileAbove === TILE_HAZARD || tileAbove === TILE_BOUNCE ||
                           tileAbove === TILE_WATER || tileAbove === TILE_WATER_SURFACE ||
                           tileAbove === TILE_QUICKSAND || tileAbove === TILE_QUICKSAND_DEEP ||
                           tileAbove === TILE_ICE);

        if (world === 2) {
            // TUNDRA TILES
            this._drawTundraSolidTile(ctx, x, y, s, col, row, isSurface);
        } else if (world === 1) {
            // DESERT TILES
            this._drawDesertSolidTile(ctx, x, y, s, col, row, isSurface);
        } else {
            // FOREST TILES (default)
            this._drawForestSolidTile(ctx, x, y, s, col, row, isSurface);
        }
    },

    _drawForestSolidTile(ctx, x, y, s, col, row, isSurface) {
        if (isSurface) {
            ctx.fillStyle = COLORS.forest.leaf;
            ctx.fillRect(x, y, s, s);
            ctx.fillStyle = COLORS.forest.highlight;
            ctx.fillRect(x, y, s, 4);
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y + 8, s, s - 8);

            ctx.strokeStyle = COLORS.forest.shadow;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const ly = y + 12 + i * 7;
                ctx.beginPath();
                ctx.moveTo(x + 2 + (col * 3 + i * 5) % 8, ly);
                ctx.lineTo(x + s - 2 - (col * 7 + i * 3) % 8, ly + 3);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = COLORS.forest.shadow;
            ctx.fillRect(x, y + s - 1, s, 1);
        } else {
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y, s, s);

            ctx.fillStyle = COLORS.forest.shadow;
            ctx.globalAlpha = 0.4;
            const seed = col * 17 + row * 31;
            for (let i = 0; i < 6; i++) {
                const px = x + ((seed + i * 13) % 28) + 2;
                const py = y + ((seed + i * 19) % 28) + 2;
                ctx.fillRect(px, py, 2, 2);
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = COLORS.forest.shadow;
            ctx.fillRect(x, y, 1, s);
            ctx.fillRect(x, y, s, 1);
        }
    },

    _drawDesertSolidTile(ctx, x, y, s, col, row, isSurface) {
        if (isSurface) {
            // Sandy surface
            ctx.fillStyle = COLORS.desert.sand;
            ctx.fillRect(x, y, s, s);
            // Light sand highlight on top
            ctx.fillStyle = COLORS.desert.bleachedBone;
            ctx.fillRect(x, y, s, 3);
            // Stone body
            ctx.fillStyle = COLORS.desert.darkSand;
            ctx.fillRect(x, y + 8, s, s - 8);

            // Sandy texture lines
            ctx.strokeStyle = COLORS.desert.shadow;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.25;
            for (let i = 0; i < 3; i++) {
                const ly = y + 12 + i * 7;
                ctx.beginPath();
                ctx.moveTo(x + 1 + (col * 5 + i * 3) % 8, ly);
                ctx.lineTo(x + s - 1 - (col * 3 + i * 7) % 8, ly + 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = COLORS.desert.shadow;
            ctx.fillRect(x, y + s - 1, s, 1);
        } else {
            // Underground stone
            ctx.fillStyle = COLORS.desert.darkSand;
            ctx.fillRect(x, y, s, s);

            // Stone texture (small rectangles)
            ctx.fillStyle = COLORS.desert.shadow;
            ctx.globalAlpha = 0.35;
            const seed = col * 17 + row * 31;
            for (let i = 0; i < 5; i++) {
                const px = x + ((seed + i * 13) % 26) + 3;
                const py = y + ((seed + i * 19) % 26) + 3;
                ctx.fillRect(px, py, 3, 2);
            }
            ctx.globalAlpha = 1.0;

            // Mortar lines
            ctx.fillStyle = COLORS.desert.lightStone;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, s, 1);
            ctx.fillRect(x, y, 1, s);
            ctx.globalAlpha = 1.0;
        }
    },

    _drawTundraSolidTile(ctx, x, y, s, col, row, isSurface) {
        if (isSurface) {
            // Snow-covered surface
            ctx.fillStyle = COLORS.tundra.deepIce;
            ctx.fillRect(x, y, s, s);
            // Snow cap on top
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.fillRect(x, y, s, 5);
            // Ice body
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.fillRect(x, y + 10, s, s - 10);

            // Frost texture lines
            ctx.strokeStyle = COLORS.tundra.shadow;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.25;
            for (let i = 0; i < 3; i++) {
                const ly = y + 14 + i * 6;
                ctx.beginPath();
                ctx.moveTo(x + 2 + (col * 3 + i * 7) % 8, ly);
                ctx.lineTo(x + s - 2 - (col * 5 + i * 3) % 8, ly + 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = COLORS.tundra.shadow;
            ctx.fillRect(x, y + s - 1, s, 1);
        } else {
            // Underground frozen stone
            ctx.fillStyle = COLORS.tundra.shadow;
            ctx.fillRect(x, y, s, s);

            // Ice crystal texture
            ctx.fillStyle = COLORS.tundra.deepIce;
            ctx.globalAlpha = 0.4;
            const seed = col * 17 + row * 31;
            for (let i = 0; i < 5; i++) {
                const px = x + ((seed + i * 13) % 26) + 3;
                const py = y + ((seed + i * 19) % 26) + 3;
                ctx.fillRect(px, py, 2, 2);
            }
            ctx.globalAlpha = 1.0;

            // Frost edge lines
            ctx.fillStyle = COLORS.tundra.deepIce;
            ctx.globalAlpha = 0.2;
            ctx.fillRect(x, y, s, 1);
            ctx.fillRect(x, y, 1, s);
            ctx.globalAlpha = 1.0;
        }
    },

    _drawIceTile(ctx, x, y, s, col, row) {
        // Translucent ice surface - light blue with shimmer
        ctx.fillStyle = COLORS.tundra.iceBlue;
        ctx.fillRect(x, y, s, s);

        // Glassy highlight on top
        ctx.fillStyle = COLORS.tundra.snowWhite;
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x, y, s, 3);
        ctx.globalAlpha = 1.0;

        // Ice crack pattern
        ctx.strokeStyle = COLORS.tundra.deepIce;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        const seed = col * 13 + row * 23;
        ctx.beginPath();
        ctx.moveTo(x + (seed % 12) + 4, y + 6);
        ctx.lineTo(x + (seed % 16) + 8, y + s / 2);
        ctx.lineTo(x + s - (seed % 10) - 4, y + s - 6);
        ctx.stroke();
        // Branch crack
        ctx.beginPath();
        ctx.moveTo(x + (seed % 16) + 8, y + s / 2);
        ctx.lineTo(x + s - (seed % 8) - 2, y + (seed % 10) + 8);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Shimmer effect (time-based)
        const shimmer = Math.sin(this.frameTime * 2 + col * 0.5) * 0.1 + 0.1;
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = shimmer;
        ctx.fillRect(x + 4, y + 4, 6, 3);
        ctx.fillRect(x + s - 12, y + s - 10, 5, 3);
        ctx.globalAlpha = 1.0;

        // Edge shadow
        ctx.fillStyle = COLORS.tundra.shadow;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y + s - 1, s, 1);
        ctx.fillRect(x + s - 1, y, 1, s);
        ctx.globalAlpha = 1.0;
    },

    _drawOneWayTile(ctx, x, y, s) {
        const world = this._getCurrentWorld();
        if (world === 2) {
            // Tundra one-way: ice shelf
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.fillRect(x, y, s, 10);
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.fillRect(x, y, s, 3);
            ctx.strokeStyle = COLORS.tundra.deepIce;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(x + 3, y + 5);
            ctx.lineTo(x + s - 3, y + 6);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            // Icicle drips
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x + 6, y + 10, 2, 5);
            ctx.fillRect(x + s - 8, y + 10, 2, 4);
            ctx.globalAlpha = 1.0;
        } else if (world === 1) {
            // Desert one-way: stone slab
            ctx.fillStyle = COLORS.desert.lightStone;
            ctx.fillRect(x, y, s, 10);
            ctx.fillStyle = COLORS.desert.bleachedBone;
            ctx.fillRect(x, y, s, 2);
            ctx.strokeStyle = COLORS.desert.shadow;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 4);
            ctx.lineTo(x + s - 2, y + 5);
            ctx.moveTo(x + 3, y + 7);
            ctx.lineTo(x + s - 3, y + 8);
            ctx.stroke();
            ctx.fillStyle = COLORS.desert.darkSand;
            ctx.fillRect(x + 4, y + 10, 4, 6);
            ctx.fillRect(x + s - 8, y + 10, 4, 6);
        } else {
            // Forest one-way
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y, s, 10);
            ctx.strokeStyle = '#6B5030';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 2, y + 3);
            ctx.lineTo(x + s - 2, y + 4);
            ctx.moveTo(x + 3, y + 7);
            ctx.lineTo(x + s - 3, y + 7);
            ctx.stroke();
            ctx.fillStyle = '#A8854A';
            ctx.fillRect(x, y, s, 2);
            ctx.fillStyle = COLORS.forest.shadow;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(x, y + 8, s, 2);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#5A4020';
            ctx.fillRect(x + 4, y + 10, 4, 6);
            ctx.fillRect(x + s - 8, y + 10, 4, 6);
        }
    },

    _drawHazardTile(ctx, x, y, s) {
        ctx.fillStyle = COLORS.hazardRed;
        const spikeCount = 4;
        const spikeWidth = s / spikeCount;

        for (let i = 0; i < spikeCount; i++) {
            const sx = x + i * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(sx, y + s);
            ctx.lineTo(sx + spikeWidth / 2, y + 4);
            ctx.lineTo(sx + spikeWidth, y + s);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = '#FF8888';
        ctx.lineWidth = 1;
        for (let i = 0; i < spikeCount; i++) {
            const sx = x + i * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(sx + spikeWidth / 2, y + 6);
            ctx.lineTo(sx + 2, y + s);
            ctx.stroke();
        }

        ctx.fillStyle = '#8B2222';
        ctx.fillRect(x, y + s - 4, s, 4);
    },

    _drawBreakableTile(ctx, x, y, s) {
        ctx.fillStyle = '#7A7A6A';
        ctx.fillRect(x, y, s, s);

        ctx.strokeStyle = '#4A4A3A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + s * 0.3, y);
        ctx.lineTo(x + s * 0.5, y + s * 0.4);
        ctx.lineTo(x + s * 0.7, y + s * 0.2);
        ctx.moveTo(x + s * 0.5, y + s * 0.4);
        ctx.lineTo(x + s * 0.4, y + s * 0.8);
        ctx.lineTo(x + s * 0.6, y + s);
        ctx.stroke();

        ctx.fillStyle = '#9A9A8A';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y, 2, s);

        ctx.fillStyle = '#5A5A4A';
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillRect(x, y + s - 2, s, 2);
    },

    _drawBounceTile(ctx, x, y, s) {
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(x, y, s, s);

        ctx.fillStyle = '#D4C4A0';
        ctx.fillRect(x + s * 0.3, y + s * 0.4, s * 0.4, s * 0.6);

        ctx.fillStyle = '#D94F4F';
        ctx.beginPath();
        ctx.ellipse(x + s / 2, y + s * 0.3, s * 0.55, s * 0.35, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#E55F5F';
        ctx.beginPath();
        ctx.ellipse(x + s / 2, y + s * 0.25, s * 0.45, s * 0.2, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(x + s * 0.3, y + s * 0.18, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.6, y + s * 0.12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s * 0.48, y + s * 0.24, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.4 + Math.sin(this.frameTime * 5) * 0.3;
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s * 0.2, s * 0.5, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    },

    _drawLadderTile(ctx, x, y, s) {
        // Ladder: brown rails with rungs
        ctx.fillStyle = '#6B4A25';
        // Rails
        ctx.fillRect(x + 4, y, 4, s);
        ctx.fillRect(x + s - 8, y, 4, s);
        // Rungs
        ctx.fillStyle = '#8B6B3D';
        for (let i = 0; i < 4; i++) {
            const ry = y + 4 + i * 8;
            ctx.fillRect(x + 6, ry, s - 14, 3);
        }
        // Highlight on rails
        ctx.fillStyle = '#A8854A';
        ctx.fillRect(x + 4, y, 1, s);
        ctx.fillRect(x + s - 8, y, 1, s);
    },

    _drawCrumbleTile(ctx, x, y, s, col, row) {
        // Check if this tile is currently shaking
        const crumbleState = Level.crumblingTiles.find(ct => ct.col === col && ct.row === row);
        let shakeX = 0, shakeY = 0;

        if (crumbleState && crumbleState.shaking) {
            shakeX = (Math.random() - 0.5) * 3;
            shakeY = (Math.random() - 0.5) * 2;
        }

        // Similar to solid tile but with cracks and less sturdy look
        ctx.fillStyle = '#8A7A5A';
        ctx.fillRect(x + shakeX, y + shakeY, s, s);

        // Crack lines
        ctx.strokeStyle = '#5A4A3A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + shakeX + s * 0.2, y + shakeY);
        ctx.lineTo(x + shakeX + s * 0.5, y + shakeY + s * 0.4);
        ctx.lineTo(x + shakeX + s * 0.3, y + shakeY + s * 0.8);
        ctx.moveTo(x + shakeX + s * 0.5, y + shakeY + s * 0.4);
        ctx.lineTo(x + shakeX + s * 0.8, y + shakeY + s * 0.6);
        ctx.stroke();

        // Border
        ctx.fillStyle = '#6A5A4A';
        ctx.fillRect(x + shakeX, y + shakeY, s, 2);
        ctx.fillRect(x + shakeX, y + shakeY, 2, s);
        ctx.fillStyle = '#4A3A2A';
        ctx.fillRect(x + shakeX + s - 2, y + shakeY, 2, s);
        ctx.fillRect(x + shakeX, y + shakeY + s - 2, s, 2);

        // Warning color when about to crumble
        if (crumbleState && crumbleState.timer < 15) {
            ctx.fillStyle = 'rgba(217, 79, 79, 0.3)';
            ctx.fillRect(x + shakeX, y + shakeY, s, s);
        }
    },

    // =======================
    // DESERT-SPECIFIC TILES
    // =======================

    _drawQuicksandTile(ctx, x, y, s, isDeep) {
        // Quicksand: animated shifting sand
        const shimmer = Math.sin(this.frameTime * 2 + x * 0.05) * 0.1;
        ctx.fillStyle = isDeep ? COLORS.desert.darkSand : COLORS.desert.sand;
        ctx.fillRect(x, y, s, s);

        // Animated sand particles
        ctx.fillStyle = COLORS.desert.bleachedBone;
        ctx.globalAlpha = 0.3 + shimmer;
        for (let i = 0; i < 4; i++) {
            const px = x + ((i * 11 + Math.floor(this.frameTime * 2)) % (s - 4)) + 2;
            const py = y + ((i * 7 + Math.floor(this.frameTime * 3)) % (s - 4)) + 2;
            ctx.fillRect(px, py, 3, 2);
        }
        ctx.globalAlpha = 1.0;

        // Warning stripes on surface
        if (!isDeep) {
            ctx.fillStyle = COLORS.desert.darkSand;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                const ly = y + 4 + i * 10 + Math.sin(this.frameTime * 1.5 + i) * 2;
                ctx.fillRect(x, ly, s, 2);
            }
            ctx.globalAlpha = 1.0;
        }
    },

    _drawWaterTile(ctx, x, y, s, isSurface) {
        // Water: translucent blue overlay
        if (isSurface) {
            // Water surface with waves
            ctx.fillStyle = 'rgba(60, 120, 200, 0.5)';
            ctx.fillRect(x, y, s, s);
            // Wave animation
            ctx.fillStyle = 'rgba(120, 180, 240, 0.4)';
            const waveY = Math.sin(this.frameTime * 3 + x * 0.1) * 3;
            ctx.fillRect(x, y + waveY, s, 4);
            ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
            ctx.fillRect(x, y + waveY + 1, s, 2);
        } else {
            // Underwater
            ctx.fillStyle = 'rgba(40, 100, 180, 0.45)';
            ctx.fillRect(x, y, s, s);
            // Subtle light caustics
            ctx.fillStyle = 'rgba(100, 160, 220, 0.15)';
            const cx = x + Math.sin(this.frameTime * 2 + y * 0.1) * 8;
            ctx.beginPath();
            ctx.ellipse(cx + s / 2, y + s / 2, 8, 6, this.frameTime * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    _drawPressurePlateTile(ctx, x, y, s, col, row) {
        // Check if this plate is activated
        const plate = Level.pressurePlates.find(p => p.x === col && p.y === row);
        const activated = plate ? plate.activated : false;

        // Base floor tile
        ctx.fillStyle = COLORS.desert.darkSand;
        ctx.fillRect(x, y, s, s);

        // Plate surface
        ctx.fillStyle = activated ? COLORS.mossGreen : COLORS.desert.lightStone;
        ctx.fillRect(x + 3, y + s - 8, s - 6, 6);
        // Plate border
        ctx.strokeStyle = activated ? '#3A7B4A' : COLORS.desert.sand;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + s - 8, s - 6, 6);

        // Indicator dot
        ctx.fillStyle = activated ? '#44FF44' : COLORS.mutedGold;
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    _drawGateTile(ctx, x, y, s) {
        // Metal gate bars
        ctx.fillStyle = '#5A5A6A';
        ctx.fillRect(x, y, s, s);
        // Vertical bars
        ctx.fillStyle = '#7A7A8A';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + 3 + i * 8, y, 3, s);
        }
        // Horizontal bands
        ctx.fillStyle = '#4A4A5A';
        ctx.fillRect(x, y + 4, s, 3);
        ctx.fillRect(x, y + s - 7, s, 3);
        // Rivets
        ctx.fillStyle = COLORS.mutedGold;
        ctx.beginPath();
        ctx.arc(x + 4, y + 5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + s - 4, y + 5, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    // =======================
    // DARK ROOM OVERLAY
    // =======================
    renderDarkOverlay(ctx) {
        if (!Level.isDark || Level.darkZones.length === 0) return;

        // Check if player is in a dark zone
        const playerCol = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
        const playerRow = Math.floor((Player.y + Player.height / 2) / TILE_SIZE);
        let inDarkZone = false;
        for (const zone of Level.darkZones) {
            if (playerCol >= zone.x1 && playerCol <= zone.x2 &&
                playerRow >= zone.y1 && playerRow <= zone.y2) {
                inDarkZone = true;
                break;
            }
        }

        if (!inDarkZone) return;

        // Draw dark overlay with spotlight around player
        const px = Player.x + Player.width / 2 - Camera.x;
        const py = Player.y + Player.height / 2 - Camera.y;
        const spotlightRadius = 100;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Cut out spotlight
        ctx.globalCompositeOperation = 'destination-out';
        const grad = ctx.createRadialGradient(px, py, 0, px, py, spotlightRadius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, spotlightRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    },

    // =======================
    // MIRROR RENDERING
    // =======================
    renderMirrors(ctx) {
        for (const m of Level.mirrors) {
            const sx = m.x * TILE_SIZE - Camera.x;
            const sy = m.y * TILE_SIZE - Camera.y;

            if (sx < -50 || sx > CANVAS_WIDTH + 50) continue;

            // Mirror base
            ctx.fillStyle = COLORS.desert.lightStone;
            ctx.fillRect(sx + 8, sy + TILE_SIZE - 8, TILE_SIZE - 16, 8);

            // Mirror surface
            ctx.save();
            ctx.translate(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2);
            ctx.rotate((m.angle || 0) * Math.PI / 180);

            // Mirror glass
            ctx.fillStyle = '#88BBDD';
            ctx.globalAlpha = 0.7;
            ctx.fillRect(-10, -12, 20, 24);
            ctx.globalAlpha = 1.0;

            // Frame
            ctx.strokeStyle = COLORS.mutedGold;
            ctx.lineWidth = 2;
            ctx.strokeRect(-10, -12, 20, 24);

            // Shine
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.4 + Math.sin(this.frameTime * 3) * 0.2;
            ctx.fillRect(-6, -8, 4, 16);
            ctx.globalAlpha = 1.0;

            ctx.restore();

            // Light beam (if visited)
            if (m.visited) {
                ctx.strokeStyle = '#FFD700';
                ctx.globalAlpha = 0.3 + Math.sin(this.frameTime * 4) * 0.1;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx + TILE_SIZE / 2, sy);
                ctx.lineTo(sx + TILE_SIZE / 2, sy - TILE_SIZE * 2);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }
    },

    // =======================
    // MOVING PLATFORMS
    // =======================
    renderMovingPlatforms() {
        const ctx = this.ctx;
        for (const mp of Level.movingPlatforms) {
            const x = mp.x - Camera.x;
            const y = mp.y - Camera.y;
            const w = mp.width;
            const h = mp.height;

            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x + 2, y + h, w - 4, 4);

            const world = this._getCurrentWorld();
            ctx.fillStyle = world === 1 ? COLORS.desert.darkSand : COLORS.forest.bark;
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = world === 1 ? COLORS.desert.lightStone : '#B8956A';
            ctx.fillRect(x, y, w, 3);

            ctx.strokeStyle = '#6B5030';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 3, y + 3 + i * 3);
                ctx.lineTo(x + w - 3, y + 4 + i * 3);
                ctx.stroke();
            }

            ctx.fillStyle = '#5A4020';
            ctx.fillRect(x, y, 2, h);
            ctx.fillRect(x + w - 2, y, 2, h);

            ctx.fillStyle = '#888';
            ctx.fillRect(x + 2, y + 1, 5, 3);
            ctx.fillRect(x + w - 7, y + 1, 5, 3);
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 3, y + h - 3, 4, 2);
            ctx.fillRect(x + w - 7, y + h - 3, 4, 2);

            ctx.fillStyle = COLORS.mutedGold;
            ctx.globalAlpha = 0.5;
            if (mp.axis === 'x') {
                const arrowY = y + h / 2;
                ctx.beginPath();
                ctx.moveTo(x + w / 2 - 12, arrowY);
                ctx.lineTo(x + w / 2 - 6, arrowY - 3);
                ctx.lineTo(x + w / 2 - 6, arrowY + 3);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x + w / 2 + 12, arrowY);
                ctx.lineTo(x + w / 2 + 6, arrowY - 3);
                ctx.lineTo(x + w / 2 + 6, arrowY + 3);
                ctx.closePath();
                ctx.fill();
            } else {
                const arrowX = x + w / 2;
                ctx.beginPath();
                ctx.moveTo(arrowX, y + 1);
                ctx.lineTo(arrowX - 4, y + 5);
                ctx.lineTo(arrowX + 4, y + 5);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(arrowX, y + h - 1);
                ctx.lineTo(arrowX - 4, y + h - 5);
                ctx.lineTo(arrowX + 4, y + h - 5);
                ctx.closePath();
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    },

    // =======================
    // PLAYER ENTITY — State-based rendering
    // =======================
    renderPlayer(player) {
        const ctx = this.ctx;
        const x = player.x - Camera.x;
        const y = player.y - Camera.y;

        // Dead state — only show particles (handled by particle system)
        if (player.state === 'dead') {
            return;
        }

        // Invincibility flash — alternate visible/invisible
        if (player.invincible && Math.floor(player.invincibleTimer * 8) % 2 === 0) {
            return;
        }

        ctx.save();

        // Flip based on facing direction
        if (player.facing === -1) {
            ctx.translate(x + player.width, y);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(x, y);
        }

        const w = player.width;
        const h = player.height;

        // Dispatch to state-specific drawing
        switch (player.state) {
            case 'idle':
                this._drawPlayerIdle(ctx, w, h, player);
                break;
            case 'walk':
                this._drawPlayerWalk(ctx, w, h, player);
                break;
            case 'run':
                this._drawPlayerRun(ctx, w, h, player);
                break;
            case 'jump':
                this._drawPlayerJump(ctx, w, h, player);
                break;
            case 'fall':
                this._drawPlayerFall(ctx, w, h, player);
                break;
            case 'wallSlide':
                this._drawPlayerWallSlide(ctx, w, h, player);
                break;
            case 'crouch':
                this._drawPlayerCrouch(ctx, w, h, player);
                break;
            case 'crouchSlide':
                this._drawPlayerCrouchSlide(ctx, w, h, player);
                break;
            case 'attack':
                this._drawPlayerAttack(ctx, w, h, player);
                break;
            case 'chargeAttack':
                this._drawPlayerChargeAttack(ctx, w, h, player);
                break;
            case 'jumpAttack':
                this._drawPlayerJumpAttack(ctx, w, h, player);
                break;
            case 'hurt':
                this._drawPlayerHurt(ctx, w, h, player);
                break;
            default:
                this._drawPlayerIdle(ctx, w, h, player);
        }

        ctx.restore();

        // Render charge indicator if charging
        if (player.isCharging && player.chargeTimer > 0) {
            this._renderChargeIndicator(ctx, x, y, w, h, player);
        }

        // Render attack effect
        if (player.state === 'attack' || player.state === 'chargeAttack' || player.state === 'jumpAttack') {
            this._renderAttackEffect(ctx, x, y, w, h, player);
        }
    },

    // =============================================
    // IDLE — breathing animation (2 frames)
    // =============================================
    _drawPlayerIdle(ctx, w, h, player) {
        const breathOffset = player.animFrame === 0 ? 0 : -1;

        // Body (blue tunic)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10 + breathOffset, w - 6, h - 16);

        // Body shading
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10 + breathOffset, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 7 + breathOffset, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 5 + breathOffset, 2.5, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 4 + breathOffset, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 4 + breathOffset, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14, 4, 3);

        // Legs
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11, 4, 8);
        ctx.fillRect(w - 9, h - 11, 4, 8);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4, 6, 4);
        ctx.fillRect(w - 10, h - 4, 6, 4);

        // Arms (slight sway for breathing)
        const armOffset = breathOffset * 0.5;
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(0, 12 + armOffset, 3, 10);
        ctx.fillRect(w - 3, 12 + armOffset, 3, 10);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(0, 21 + armOffset, 3, 3);
        ctx.fillRect(w - 3, 21 + armOffset, 3, 3);
    },

    // =============================================
    // WALK — 4-frame cycle
    // =============================================
    _drawPlayerWalk(ctx, w, h, player) {
        const frame = player.animFrame;
        const legOffsetsL = [0, -2, 0, 2];
        const legOffsetsR = [0, 2, 0, -2];
        const bodyBob = [0, -1, 0, -1];
        const armSwing = [2, -2, -2, 2];

        const bob = bodyBob[frame];

        // Body
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10 + bob, w - 6, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10 + bob, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 7 + bob, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 5 + bob, 2.5, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 4 + bob, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 4 + bob, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14 + bob, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14 + bob, 4, 3);

        // Legs with walk offset
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11 + legOffsetsL[frame], 4, 8 - legOffsetsL[frame]);
        ctx.fillRect(w - 9, h - 11 + legOffsetsR[frame], 4, 8 - legOffsetsR[frame]);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4 + legOffsetsL[frame], 6, 4);
        ctx.fillRect(w - 10, h - 4 + legOffsetsR[frame], 6, 4);

        // Arms with swing
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(0, 12 + armSwing[frame] + bob, 3, 10);
        ctx.fillRect(w - 3, 12 - armSwing[frame] + bob, 3, 10);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(0, 21 + armSwing[frame] + bob, 3, 3);
        ctx.fillRect(w - 3, 21 - armSwing[frame] + bob, 3, 3);
    },

    // =============================================
    // RUN — 6-frame cycle with forward lean and cape
    // =============================================
    _drawPlayerRun(ctx, w, h, player) {
        const frame = player.animFrame;
        const legOffsetsL = [0, -3, -1, 0, 3, 1];
        const legOffsetsR = [-1, 0, 3, 1, 0, -3];
        const bodyBob = [0, -1, -1, 0, -1, -1];
        const armSwingF = [4, -1, -4, -3, 1, 4];
        const armSwingB = [-3, 1, 4, 4, -1, -4];

        const bob = bodyBob[frame];
        const lean = 1; // Forward lean for run

        // Cape/scarf trail (red)
        ctx.fillStyle = COLORS.emberRed;
        ctx.globalAlpha = 0.7;
        const capeWave = Math.sin(frame * 1.2) * 2;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 4, 8 + bob);
        ctx.lineTo(-3 + capeWave, 12 + bob);
        ctx.lineTo(-5 + capeWave, 20 + bob);
        ctx.lineTo(w / 2 - 2, 16 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Body (leaning forward)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3 + lean, 10 + bob, w - 6, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3 + lean, 10 + bob, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2 + lean, 7 + bob, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (determined expression — slightly narrower)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2 + lean, 5 + bob, 3, 2.5);

        // Hair (windswept)
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2 + lean, 4 + bob, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7 + lean, 4 + bob, 3, 6);
        // Hair flowing back
        ctx.fillRect(w / 2 - 8, 3 + bob, 3, 4);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14 + bob, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14 + bob, 4, 3);

        // Legs — wider strides
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5 + lean, h - 11 + legOffsetsL[frame], 4, 8 - Math.abs(legOffsetsL[frame]) * 0.5);
        ctx.fillRect(w - 9, h - 11 + legOffsetsR[frame], 4, 8 - Math.abs(legOffsetsR[frame]) * 0.5);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4 + lean, h - 4 + legOffsetsL[frame], 6, 4);
        ctx.fillRect(w - 10, h - 4 + legOffsetsR[frame], 6, 4);

        // Arms — wider swings
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(0, 12 + armSwingF[frame] + bob, 3, 10);
        ctx.fillRect(w - 3, 12 + armSwingB[frame] + bob, 3, 10);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(0, 21 + armSwingF[frame] + bob, 3, 3);
        ctx.fillRect(w - 3, 21 + armSwingB[frame] + bob, 3, 3);
    },

    // =============================================
    // JUMP — arms up, legs tucked, eyes up
    // =============================================
    _drawPlayerJump(ctx, w, h, player) {
        // Body
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10, w - 6, h - 18);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10, 3, h - 18);

        // Head (looking up slightly)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 6, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (looking up)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 3, 2.5, 2.5);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 3, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 3, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 16, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 16, 4, 3);

        // Legs tucked up
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 12, 4, 5);
        ctx.fillRect(w - 9, h - 12, 4, 5);

        // Boots (closer together)
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(5, h - 7, 5, 3);
        ctx.fillRect(w - 10, h - 7, 5, 3);

        // Arms raised up
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(-1, 6, 3, 8);
        ctx.fillRect(w - 2, 6, 3, 8);

        // Hands (raised)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(-1, 4, 3, 3);
        ctx.fillRect(w - 2, 4, 3, 3);
    },

    // =============================================
    // FALL — arms spread, legs dangling, eyes down
    // =============================================
    _drawPlayerFall(ctx, w, h, player) {
        // Body
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10, w - 6, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10, 3, h - 16);

        // Head (looking down)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 8, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (looking down)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 7, 2.5, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 5, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 5, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14, 4, 3);

        // Legs dangling (spread)
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(3, h - 11, 4, 9);
        ctx.fillRect(w - 7, h - 11, 4, 9);

        // Boots (spread apart)
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(2, h - 3, 6, 3);
        ctx.fillRect(w - 8, h - 3, 6, 3);

        // Arms spread out
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(-3, 11, 4, 9);
        ctx.fillRect(w - 1, 11, 4, 9);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(-3, 19, 3, 3);
        ctx.fillRect(w, 19, 3, 3);
    },

    // =============================================
    // WALL SLIDE — body pressed against wall, asymmetric arms
    // =============================================
    _drawPlayerWallSlide(ctx, w, h, player) {
        // Body pressed flat against wall
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(4, 10, w - 7, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(4, 10, 3, h - 16);

        // Head (turned slightly toward wall)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2 + 1, 7, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (looking at wall)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 4, 5, 2, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2 + 1, 4, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 6, 4, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 14, w - 7, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 1, h - 14, 4, 3);

        // One leg bent, one straight (pressed against wall)
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11, 4, 8);
        ctx.fillRect(w - 8, h - 13, 4, 6); // Bent knee

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4, 6, 4);
        ctx.fillRect(w - 9, h - 7, 5, 3);

        // Front arm (pressed up against wall)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(w - 2, 8, 3, 7);
        // Back arm (hanging down)
        ctx.fillRect(-1, 14, 3, 10);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(w - 2, 6, 3, 3);
        ctx.fillRect(-1, 23, 3, 3);
    },

    // =============================================
    // CROUCH — compressed body, ducked head, wider stance
    // =============================================
    _drawPlayerCrouch(ctx, w, h, player) {
        // h = PLAYER_CROUCH_HEIGHT (20)

        // Body (compressed)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(2, 5, w - 4, h - 10);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(2, 5, 3, h - 10);

        // Head (ducked down, smaller arc)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 4, 6, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 2, 2, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 2, 6, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 6, 2, 3, 4);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(2, h - 9, w - 4, 2);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 9, 4, 2);

        // Legs bent/squatting (wider stance)
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(2, h - 7, 5, 5);
        ctx.fillRect(w - 7, h - 7, 5, 5);

        // Boots (wider apart)
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(1, h - 3, 6, 3);
        ctx.fillRect(w - 7, h - 3, 6, 3);

        // Arms (at sides, compressed)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(-1, 7, 3, 7);
        ctx.fillRect(w - 2, 7, 3, 7);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(-1, 13, 3, 2);
        ctx.fillRect(w - 2, 13, 3, 2);
    },

    // =============================================
    // CROUCH SLIDE — similar to crouch but with motion blur
    // =============================================
    _drawPlayerCrouchSlide(ctx, w, h, player) {
        // Motion blur trail
        ctx.fillStyle = COLORS.playerBlue;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(-4, 5, w + 4, h - 10);
        ctx.globalAlpha = 1.0;

        // Draw same as crouch
        this._drawPlayerCrouch(ctx, w, h, player);
    },

    // =============================================
    // ATTACK — 3-frame swing (wind-up, extend, retract)
    // =============================================
    _drawPlayerAttack(ctx, w, h, player) {
        const frame = player.animFrame; // 0=wind-up, 1=full extend, 2=retract
        const armExtensions = [4, 12, 8];
        const ext = armExtensions[frame];

        // Body
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10, w - 6, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 7, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (focused)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 5, 3, 2.5);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 4, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 4, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14, 4, 3);

        // Legs
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11, 4, 8);
        ctx.fillRect(w - 9, h - 11, 4, 8);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4, 6, 4);
        ctx.fillRect(w - 10, h - 4, 6, 4);

        // Front arm (attacking — extends forward)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(w - 3, 12, ext, 4);
        // Fist/weapon tip
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(w - 3 + ext, 11, 4, 6);

        // Weapon glow at full extension
        if (frame === 1) {
            ctx.fillStyle = COLORS.mutedGold;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(w + ext, 14, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Back arm
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(-1, 12, 3, 10);
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(-1, 21, 3, 3);
    },

    // =============================================
    // CHARGE ATTACK — rotating weapon with gold glow
    // =============================================
    _drawPlayerChargeAttack(ctx, w, h, player) {
        const progress = 1 - (player.attackTimer / 12);
        const angle = progress * Math.PI * 1.5;

        // Body
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10, w - 6, h - 16);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 10, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 7, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 5, 3, 2.5);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 4, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 4, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 14, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 14, 4, 3);

        // Legs
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11, 4, 8);
        ctx.fillRect(w - 9, h - 11, 4, 8);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4, 6, 4);
        ctx.fillRect(w - 10, h - 4, 6, 4);

        // Rotating weapon with gold glow
        ctx.save();
        ctx.translate(w + 5, 14);
        ctx.rotate(angle);

        // Weapon
        ctx.fillStyle = '#888';
        ctx.fillRect(-2, -8, 4, 16);

        // Gold glow
        ctx.fillStyle = COLORS.mutedGold;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.restore();

        // Arms
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(w - 3, 10, 8, 4);
        ctx.fillRect(-1, 12, 3, 10);

        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(w + 4, 10, 3, 4);
        ctx.fillRect(-1, 21, 3, 3);
    },

    // =============================================
    // JUMP ATTACK — downward strike
    // =============================================
    _drawPlayerJumpAttack(ctx, w, h, player) {
        // Body (angled down)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 8, w - 6, h - 14);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(3, 8, 3, h - 14);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 6, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye (looking down)
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(w / 2 + 2, 6, 2.5, 3);

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2, 3, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 7, 3, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 12, w - 6, 3);
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(w / 2 - 2, h - 12, 4, 3);

        // Legs together (diving down)
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(6, h - 9, 4, 6);
        ctx.fillRect(w - 10, h - 9, 4, 6);

        // Boots (pointed down)
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(6, h - 4, 5, 4);
        ctx.fillRect(w - 11, h - 4, 5, 4);

        // Weapon pointing down
        ctx.fillStyle = '#888';
        ctx.fillRect(w / 2 - 2, h - 2, 4, 12);
        // Weapon glow
        ctx.fillStyle = COLORS.mutedGold;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(w / 2, h + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Arms (holding weapon down)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(w / 2 - 5, h - 10, 3, 8);
        ctx.fillRect(w / 2 + 2, h - 10, 3, 8);

        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(w / 2 - 5, h - 3, 3, 3);
        ctx.fillRect(w / 2 + 2, h - 3, 3, 3);
    },

    // =============================================
    // HURT — leaning back, red tint, X-mark eyes, flailing
    // =============================================
    _drawPlayerHurt(ctx, w, h, player) {
        // Red tint overlay
        ctx.fillStyle = COLORS.emberRed;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1.0;

        // Body (leaning back)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(2, 11, w - 5, h - 17);
        ctx.fillStyle = COLORS.playerBlueDark;
        ctx.fillRect(2, 11, 3, h - 17);

        // Head (tilted back)
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2 - 1, 8, 7, 0, Math.PI * 2);
        ctx.fill();

        // X-mark eyes (pain)
        ctx.strokeStyle = COLORS.deepCharcoal;
        ctx.lineWidth = 1.5;
        // Left X
        ctx.beginPath();
        ctx.moveTo(w / 2 - 1, 5);
        ctx.lineTo(w / 2 + 3, 9);
        ctx.moveTo(w / 2 + 3, 5);
        ctx.lineTo(w / 2 - 1, 9);
        ctx.stroke();

        // Hair
        ctx.fillStyle = '#4A3020';
        ctx.beginPath();
        ctx.arc(w / 2 - 1, 5, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(w / 2 - 8, 5, 3, 5);

        // Belt
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(2, h - 14, w - 5, 3);

        // Legs
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(4, h - 11, 4, 8);
        ctx.fillRect(w - 8, h - 11, 4, 8);

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(3, h - 4, 6, 4);
        ctx.fillRect(w - 9, h - 4, 6, 4);

        // Arms flailing
        const flail = Math.sin(player.stateTimer * 0.5) * 4;
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(-3, 10 + flail, 4, 8);
        ctx.fillRect(w - 1, 10 - flail, 4, 8);

        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(-3, 17 + flail, 3, 3);
        ctx.fillRect(w, 17 - flail, 3, 3);
    },

    // =============================================
    // ATTACK EFFECTS (slash arc, hit sparks)
    // =============================================
    _renderAttackEffect(ctx, x, y, w, h, player) {
        ctx.save();

        if (player.state === 'attack') {
            const frame = player.animFrame;
            if (frame === 1) { // Full extension
                const slashX = player.facing === 1 ? x + w : x;
                const dir = player.facing;

                // Slash arc
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(slashX + dir * 8, y + h / 2, 14, -Math.PI * 0.4, Math.PI * 0.4);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        } else if (player.state === 'chargeAttack') {
            // Wide gold slash
            const cx = player.facing === 1 ? x + w + 10 : x - 10;
            ctx.strokeStyle = COLORS.mutedGold;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(cx, y + h / 2, 20, -Math.PI * 0.6, Math.PI * 0.6);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else if (player.state === 'jumpAttack') {
            // Downward glow
            ctx.fillStyle = COLORS.mutedGold;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h + 5, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    },

    // =============================================
    // CHARGE INDICATOR (progress bar above player)
    // =============================================
    _renderChargeIndicator(ctx, x, y, w, h, player) {
        const progress = player.chargeTimer / CHARGE_TIME;
        const barW = 24;
        const barH = 4;
        const barX = x + w / 2 - barW / 2;
        const barY = y - 10;

        // Background
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(barX, barY, barW, barH);

        // Fill
        const fillColor = progress >= 1.0 ? COLORS.mutedGold : COLORS.steelBlue;
        ctx.fillStyle = fillColor;
        ctx.fillRect(barX, barY, barW * Math.min(progress, 1.0), barH);

        // Pulsing glow when full
        if (progress >= 1.0) {
            ctx.strokeStyle = COLORS.mutedGold;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5 + Math.sin(this.frameTime * 8) * 0.3;
            ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.globalAlpha = 1.0;
        }
    },

    // =======================
    // PARTICLES
    // =======================
    renderParticles() {
        Particles.render(this.ctx);
    },

    // =======================
    // SNOW PARTICLES (Tundra foreground effect)
    // =======================
    _initSnowParticles() {
        this._snowParticles = [];
        for (let i = 0; i < 80; i++) {
            this._snowParticles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: 1.5 + Math.random() * 2.5,
                speedY: 0.3 + Math.random() * 0.8,
                speedX: -0.2 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.5 + Math.random() * 1.5,
                alpha: 0.3 + Math.random() * 0.5,
            });
        }
        this._snowInitialized = true;
    },

    updateAndRenderSnow() {
        const world = this._getCurrentWorld();
        if (world !== 2) {
            this._snowInitialized = false;
            return;
        }

        if (!this._snowInitialized) this._initSnowParticles();

        const ctx = this.ctx;
        for (const p of this._snowParticles) {
            // Update
            p.y += p.speedY;
            p.wobble += p.wobbleSpeed * (1 / 60);
            p.x += p.speedX + Math.sin(p.wobble) * 0.3;

            // Wrap around
            if (p.y > CANVAS_HEIGHT + 5) {
                p.y = -5;
                p.x = Math.random() * CANVAS_WIDTH;
            }
            if (p.x < -5) p.x = CANVAS_WIDTH + 5;
            if (p.x > CANVAS_WIDTH + 5) p.x = -5;

            // Render
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    // =======================
    // ICE BLOCKS, FIRE SOURCES, MELTABLE BLOCKS (Tundra)
    // =======================
    renderIceBlocks(ctx) {
        const camX = Camera.x;
        const camY = Camera.y;
        for (const block of Level.iceBlocks) {
            if (block.melted) continue;
            const x = block.x - camX;
            const y = block.y - camY;
            if (x + 32 < -10 || x > CANVAS_WIDTH + 10 || y + 32 < -10 || y > CANVAS_HEIGHT + 10) continue;

            // Ice block body
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(x + 1, y + 1, 30, 30);

            // Ice highlight
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x + 3, y + 3, 12, 4);
            ctx.fillRect(x + 3, y + 3, 4, 12);

            // Ice cracks
            ctx.strokeStyle = COLORS.tundra.deepIce;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 10);
            ctx.lineTo(x + 20, y + 18);
            ctx.lineTo(x + 16, y + 26);
            ctx.stroke();

            // Outline
            ctx.strokeStyle = COLORS.tundra.deepIce;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            ctx.strokeRect(x + 1, y + 1, 30, 30);
            ctx.globalAlpha = 1.0;
        }
    },

    renderFireSources(ctx) {
        const camX = Camera.x;
        const camY = Camera.y;
        for (const fire of Level.fireSources) {
            const x = fire.x - camX;
            const y = fire.y - camY;
            if (x + 32 < -20 || x > CANVAS_WIDTH + 20 || y + 32 < -20 || y > CANVAS_HEIGHT + 20) continue;

            // Torch base
            ctx.fillStyle = '#5A3A1A';
            ctx.fillRect(x + 12, y + 16, 8, 16);

            // Flame (animated)
            const t = this.frameTime;
            const flicker1 = Math.sin(t * 8 + fire.x * 0.1) * 3;
            const flicker2 = Math.cos(t * 6 + fire.x * 0.2) * 2;

            // Outer flame (orange)
            ctx.fillStyle = '#FF8800';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(x + 10 + flicker2, y + 18);
            ctx.quadraticCurveTo(x + 16 + flicker1, y + 2 + flicker2, x + 22 - flicker2, y + 18);
            ctx.fill();

            // Inner flame (yellow)
            ctx.fillStyle = '#FFD700';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(x + 13 + flicker1 * 0.5, y + 18);
            ctx.quadraticCurveTo(x + 16 + flicker2 * 0.5, y + 8 + flicker1, x + 19 - flicker1 * 0.5, y + 18);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Glow effect
            ctx.fillStyle = '#FF8800';
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(x + 16, y + 12, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    },

    renderMeltableBlocks(ctx) {
        const camX = Camera.x;
        const camY = Camera.y;
        for (const block of Level.meltableBlocks) {
            if (block.melted) continue;
            const x = block.x - camX;
            const y = block.y - camY;
            if (x + 32 < -10 || x > CANVAS_WIDTH + 10 || y + 32 < -10 || y > CANVAS_HEIGHT + 10) continue;

            // Thick ice wall
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.globalAlpha = block.health > 0 ? 0.9 : 0.5;
            ctx.fillRect(x, y, 32, 32);

            // Frost pattern
            ctx.fillStyle = COLORS.tundra.snowWhite;
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x + 2, y + 2, 28, 3);
            ctx.fillRect(x + 2, y + 2, 3, 28);

            // Cross-hatch ice pattern
            ctx.strokeStyle = COLORS.tundra.deepIce;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 4 + i * 10, y + 4);
                ctx.lineTo(x + 4 + i * 10 + 8, y + 28);
                ctx.stroke();
            }

            // Melt indicator (dripping when partially melted)
            if (block.health < 3) {
                ctx.fillStyle = COLORS.tundra.iceBlue;
                ctx.globalAlpha = 0.5;
                const drip = Math.sin(this.frameTime * 3 + block.x * 0.1) * 3;
                ctx.fillRect(x + 10, y + 32, 4, 4 + drip);
                ctx.fillRect(x + 20, y + 32, 3, 2 + drip * 0.5);
            }
            ctx.globalAlpha = 1.0;
        }
    },

    // =======================
    // TEXT with outline
    // =======================
    drawText(text, x, y, size, color, align, fontFamily) {
        const ctx = this.ctx;
        const family = fontFamily || 'bold sans-serif';
        ctx.font = `${size}px ${family}`;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'top';

        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        // Fill
        ctx.fillStyle = color || COLORS.softCream;
        ctx.fillText(text, x, y);
    }
};
