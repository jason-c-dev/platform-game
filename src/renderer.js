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

    clear() {
        // Deep forest background
        this.ctx.fillStyle = '#0D1B0E';
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    },

    // =======================
    // PARALLAX BACKGROUND
    // =======================
    renderParallax() {
        const ctx = this.ctx;

        // Advance animation timer
        this.frameTime += 1 / 60;

        // Layer 0: Mountains (furthest)
        this._renderMountainLayer(Camera.layers[0]);

        // Layer 1: Far trees
        this._renderFarTreeLayer(Camera.layers[1]);

        // Layer 2: Mid trees
        this._renderMidTreeLayer(Camera.layers[2]);

        // Layer 3: Foreground leaves
        this._renderLeafLayer(Camera.layers[3]);
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
        }
    },

    _drawSolidTile(ctx, x, y, s, col, row) {
        const tileAbove = Level.getTile(col, row - 1);
        const isSurface = (tileAbove === TILE_EMPTY || tileAbove === TILE_ONE_WAY ||
                           tileAbove === TILE_HAZARD || tileAbove === TILE_BOUNCE);

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

    _drawOneWayTile(ctx, x, y, s) {
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

            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = '#B8956A';
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
