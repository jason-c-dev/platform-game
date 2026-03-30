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

            // Mountain shape
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

        // Fill below mountains
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

            // Trunk
            ctx.fillStyle = '#3A2A15';
            ctx.fillRect(sx + t.width / 2 - t.trunk / 2, baseY - t.height * 0.4, t.trunk, t.height * 0.4);

            // Canopy (triangle)
            ctx.fillStyle = layer.color1;
            ctx.beginPath();
            ctx.moveTo(sx, baseY - t.height * 0.3);
            ctx.lineTo(sx + t.width / 2, baseY - t.height);
            ctx.lineTo(sx + t.width, baseY - t.height * 0.3);
            ctx.closePath();
            ctx.fill();

            // Second canopy layer
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

            // Trunk
            ctx.fillStyle = '#5A4025';
            ctx.fillRect(sx + t.width / 2 - t.trunk / 2, baseY - t.height * 0.45, t.trunk, t.height * 0.45);

            // Canopy — rounded
            ctx.fillStyle = layer.color1;
            ctx.beginPath();
            ctx.arc(sx + t.width / 2, baseY - t.height * 0.6, t.width / 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Lighter patch
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

            // Leaf shape
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

        // Calculate visible tile bounds (culling)
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
        // Forest solid tile with texture
        // Check if this is a surface tile (tile above is empty/non-solid)
        const tileAbove = Level.getTile(col, row - 1);
        const isSurface = (tileAbove === TILE_EMPTY || tileAbove === TILE_ONE_WAY ||
                           tileAbove === TILE_HAZARD || tileAbove === TILE_BOUNCE);

        if (isSurface) {
            // Grass top
            ctx.fillStyle = COLORS.forest.leaf;
            ctx.fillRect(x, y, s, s);

            // Grass tuft top
            ctx.fillStyle = COLORS.forest.highlight;
            ctx.fillRect(x, y, s, 4);

            // Dirt body below grass
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y + 8, s, s - 8);

            // Texture lines (hatching)
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

            // Dark outline bottom
            ctx.fillStyle = COLORS.forest.shadow;
            ctx.fillRect(x, y + s - 1, s, 1);
        } else {
            // Underground / deep tile
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y, s, s);

            // Texture — stippling
            ctx.fillStyle = COLORS.forest.shadow;
            ctx.globalAlpha = 0.4;
            const seed = col * 17 + row * 31;
            for (let i = 0; i < 6; i++) {
                const px = x + ((seed + i * 13) % 28) + 2;
                const py = y + ((seed + i * 19) % 28) + 2;
                ctx.fillRect(px, py, 2, 2);
            }
            ctx.globalAlpha = 1.0;

            // Edge lines
            ctx.fillStyle = COLORS.forest.shadow;
            ctx.fillRect(x, y, 1, s);
            ctx.fillRect(x, y, s, 1);
        }
    },

    _drawOneWayTile(ctx, x, y, s) {
        // Wooden platform
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(x, y, s, 10);

        // Wood grain
        ctx.strokeStyle = '#6B5030';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + 3);
        ctx.lineTo(x + s - 2, y + 4);
        ctx.moveTo(x + 3, y + 7);
        ctx.lineTo(x + s - 3, y + 7);
        ctx.stroke();

        // Top highlight
        ctx.fillStyle = '#A8854A';
        ctx.fillRect(x, y, s, 2);

        // Shadow bottom
        ctx.fillStyle = COLORS.forest.shadow;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, y + 8, s, 2);
        ctx.globalAlpha = 1.0;

        // Support pegs
        ctx.fillStyle = '#5A4020';
        ctx.fillRect(x + 4, y + 10, 4, 6);
        ctx.fillRect(x + s - 8, y + 10, 4, 6);
    },

    _drawHazardTile(ctx, x, y, s) {
        // Spikes — red/crimson
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

        // Spike highlights
        ctx.strokeStyle = '#FF8888';
        ctx.lineWidth = 1;
        for (let i = 0; i < spikeCount; i++) {
            const sx = x + i * spikeWidth;
            ctx.beginPath();
            ctx.moveTo(sx + spikeWidth / 2, y + 6);
            ctx.lineTo(sx + 2, y + s);
            ctx.stroke();
        }

        // Base
        ctx.fillStyle = '#8B2222';
        ctx.fillRect(x, y + s - 4, s, 4);
    },

    _drawBreakableTile(ctx, x, y, s) {
        // Cracked stone block
        ctx.fillStyle = '#7A7A6A';
        ctx.fillRect(x, y, s, s);

        // Crack pattern
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

        // Highlight edges
        ctx.fillStyle = '#9A9A8A';
        ctx.fillRect(x, y, s, 2);
        ctx.fillRect(x, y, 2, s);

        // Shadow edges
        ctx.fillStyle = '#5A5A4A';
        ctx.fillRect(x + s - 2, y, 2, s);
        ctx.fillRect(x, y + s - 2, s, 2);
    },

    _drawBounceTile(ctx, x, y, s) {
        // Mushroom bounce pad — forest theme
        // Background fill (dirt)
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(x, y, s, s);

        // Stem
        ctx.fillStyle = '#D4C4A0';
        ctx.fillRect(x + s * 0.3, y + s * 0.4, s * 0.4, s * 0.6);

        // Cap — large red mushroom
        ctx.fillStyle = '#D94F4F';
        ctx.beginPath();
        ctx.ellipse(x + s / 2, y + s * 0.3, s * 0.55, s * 0.35, 0, Math.PI, 0);
        ctx.fill();

        // Cap top surface
        ctx.fillStyle = '#E55F5F';
        ctx.beginPath();
        ctx.ellipse(x + s / 2, y + s * 0.25, s * 0.45, s * 0.2, 0, Math.PI, 0);
        ctx.fill();

        // White spots on cap
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

        // Bounce indicator — animated gold glow
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

            // Drop shadow
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(x + 2, y + h, w - 4, 4);

            // Platform body — log/plank style
            ctx.fillStyle = COLORS.forest.bark;
            ctx.fillRect(x, y, w, h);

            // Top highlight
            ctx.fillStyle = '#B8956A';
            ctx.fillRect(x, y, w, 3);

            // Wood grain lines
            ctx.strokeStyle = '#6B5030';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x + 3, y + 3 + i * 3);
                ctx.lineTo(x + w - 3, y + 4 + i * 3);
                ctx.stroke();
            }

            // Side edges (bark color darker)
            ctx.fillStyle = '#5A4020';
            ctx.fillRect(x, y, 2, h);
            ctx.fillRect(x + w - 2, y, 2, h);

            // Metal brackets at corners
            ctx.fillStyle = '#888';
            ctx.fillRect(x + 2, y + 1, 5, 3);
            ctx.fillRect(x + w - 7, y + 1, 5, 3);
            ctx.fillStyle = '#666';
            ctx.fillRect(x + 3, y + h - 3, 4, 2);
            ctx.fillRect(x + w - 7, y + h - 3, 4, 2);

            // Arrow indicator showing movement direction
            ctx.fillStyle = COLORS.mutedGold;
            ctx.globalAlpha = 0.5;
            if (mp.axis === 'x') {
                // Horizontal arrows
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
                // Vertical arrows
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
    // PLAYER ENTITY
    // =======================
    renderPlayer(player) {
        const ctx = this.ctx;
        const x = player.x - Camera.x;
        const y = player.y - Camera.y;

        // Invincibility flash
        if (player.invincible && Math.floor(player.invincibleTimer * 10) % 2 === 0) {
            return; // Skip rendering for flash effect
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

        // --- Character Drawing ---
        // Body (blue tunic)
        ctx.fillStyle = COLORS.playerBlue;
        ctx.fillRect(3, 10, w - 6, h - 16);

        // Body shading
        ctx.fillStyle = '#2A5BA5';
        ctx.fillRect(3, 10, 3, h - 16);

        // Head
        ctx.fillStyle = COLORS.playerSkin;
        ctx.beginPath();
        ctx.arc(w / 2, 7, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(w / 2 + 2, 5, 2.5, 3);

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
        ctx.fillRect(w / 2 - 2, h - 14, 4, 3); // Belt buckle

        // Legs
        ctx.fillStyle = '#3A3A4A';
        ctx.fillRect(5, h - 11, 4, 8);
        ctx.fillRect(w - 9, h - 11, 4, 8);

        // Walking animation — offset legs
        if (Math.abs(player.vx) > 0.5 && player.onGround) {
            const walkFrame = Math.floor(Date.now() / 100) % 4;
            const legOffset = [0, -2, 0, 2][walkFrame];
            ctx.fillStyle = '#3A3A4A';
            ctx.fillRect(5, h - 11 + legOffset, 4, 8 - legOffset);
            ctx.fillRect(w - 9, h - 11 - legOffset, 4, 8 + legOffset);
        }

        // Boots
        ctx.fillStyle = COLORS.forest.bark;
        ctx.fillRect(4, h - 4, 6, 4);
        ctx.fillRect(w - 10, h - 4, 6, 4);

        // Arms
        ctx.fillStyle = COLORS.playerBlue;
        const armSwing = player.onGround && Math.abs(player.vx) > 0.5 ? Math.sin(Date.now() / 80) * 3 : 0;
        ctx.fillRect(0, 12 + armSwing, 3, 10);
        ctx.fillRect(w - 3, 12 - armSwing, 3, 10);

        // Hands
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(0, 21 + armSwing, 3, 3);
        ctx.fillRect(w - 3, 21 - armSwing, 3, 3);

        ctx.restore();
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
