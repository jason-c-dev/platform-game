// ============================================================
// collectibles.js — Collectible system: coins, health pickups
// Design spec: Gold coins (#FFD700) with glint (#FFF8DC),
// bobbing animation, health pickups (red hearts, distinct from coins)
// ============================================================

const Collectibles = {
    items: [],        // Active collectible items in the current stage
    totalCoins: 0,    // Total coins defined for the current stage
    _animTimer: 0,

    /**
     * Initialize collectibles for a stage.
     * @param {Array} coinPositions - [{x, y}, ...] world positions for coins
     * @param {Array} healthPositions - [{x, y}, ...] world positions for health pickups
     */
    init(coinPositions, healthPositions) {
        this.items = [];
        this._animTimer = 0;

        // Add coins
        if (coinPositions) {
            for (const pos of coinPositions) {
                this.items.push({
                    type: 'coin',
                    x: pos.x,
                    y: pos.y,
                    baseY: pos.y,
                    collected: false,
                    width: 16,
                    height: 16,
                    animOffset: Math.random() * Math.PI * 2
                });
            }
        }

        // Add health pickups
        if (healthPositions) {
            for (const pos of healthPositions) {
                this.items.push({
                    type: 'health',
                    x: pos.x,
                    y: pos.y,
                    baseY: pos.y,
                    collected: false,
                    width: 16,
                    height: 16,
                    animOffset: Math.random() * Math.PI * 2
                });
            }
        }

        this.totalCoins = coinPositions ? coinPositions.length : 0;
    },

    /**
     * Update all collectibles (animation + collision with player).
     */
    update() {
        this._animTimer += 1 / 60;

        for (const item of this.items) {
            if (item.collected) continue;

            // Bobbing animation
            item.y = item.baseY + Math.sin(this._animTimer * 3 + item.animOffset) * 3;

            // Check collision with player
            if (this._checkPlayerCollision(item)) {
                this._collect(item);
            }
        }
    },

    /**
     * Check if player overlaps with an item.
     */
    _checkPlayerCollision(item) {
        const px = Player.x;
        const py = Player.y;
        const pw = Player.width;
        const ph = Player.height;

        return px < item.x + item.width &&
               px + pw > item.x &&
               py < item.y + item.height &&
               py + ph > item.y;
    },

    /**
     * Collect an item.
     */
    _collect(item) {
        if (item.collected) return;

        if (item.type === 'coin') {
            item.collected = true;
            GameState.coinsCollected++;
            // Spawn collection particles
            Particles.spawnCoinCollect(item.x + item.width / 2, item.y + item.height / 2);
        } else if (item.type === 'health') {
            // Only collect if player is damaged
            if (Player.hp < PLAYER_MAX_HP) {
                item.collected = true;
                Player.hp = Math.min(Player.hp + 1, PLAYER_MAX_HP);
                // Spawn health collect particles
                Particles.spawnHealthCollect(item.x + item.width / 2, item.y + item.height / 2);
            }
            // If at full HP, don't collect — item stays
        }
    },

    /**
     * Render all collectibles.
     */
    render(ctx) {
        for (const item of this.items) {
            if (item.collected) continue;

            const screenX = item.x - Camera.x;
            const screenY = item.y - Camera.y;

            // Skip if off-screen
            if (screenX < -32 || screenX > CANVAS_WIDTH + 32 ||
                screenY < -32 || screenY > CANVAS_HEIGHT + 32) {
                continue;
            }

            if (item.type === 'coin') {
                this._renderCoin(ctx, screenX, screenY, item);
            } else if (item.type === 'health') {
                this._renderHealthPickup(ctx, screenX, screenY, item);
            }
        }
    },

    /**
     * Render a coin — golden circle with glint and spin effect.
     */
    _renderCoin(ctx, sx, sy, item) {
        const cx = sx + item.width / 2;
        const cy = sy + item.height / 2;
        const radius = 7;

        // Coin spin effect: vary width to simulate 3D rotation
        const spinPhase = Math.sin(this._animTimer * 4 + item.animOffset);
        const scaleX = 0.4 + 0.6 * Math.abs(spinPhase);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scaleX, 1);

        // Gold circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.coinGold;
        ctx.fill();

        // Darker edge
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Glint/shine
        if (spinPhase > 0.2) {
            ctx.beginPath();
            ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.coinGlint;
            ctx.fill();
        }

        ctx.restore();
    },

    /**
     * Render a health pickup — red/green heart shape, distinct from coins.
     */
    _renderHealthPickup(ctx, sx, sy, item) {
        const cx = sx + item.width / 2;
        const cy = sy + item.height / 2;

        // Only render if player is damaged (or always show but with different opacity)
        const canCollect = Player.hp < PLAYER_MAX_HP;
        const alpha = canCollect ? 1.0 : 0.4;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Pulsing glow when collectible
        if (canCollect) {
            const glowSize = 12 + Math.sin(this._animTimer * 4) * 3;
            ctx.beginPath();
            ctx.arc(cx, cy, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(90, 158, 111, 0.2)';
            ctx.fill();
        }

        // Draw heart shape (similar to HUD but green for health pickup)
        ctx.translate(cx, cy);
        const s = 6;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s * 0.05, s * 0.1, -s * 0.65, s * 0.1, -s * 0.65, -s * 0.2);
        ctx.bezierCurveTo(-s * 0.65, -s * 0.6, -s * 0.15, -s * 0.7, 0, -s * 0.35);
        ctx.bezierCurveTo(s * 0.15, -s * 0.7, s * 0.65, -s * 0.6, s * 0.65, -s * 0.2);
        ctx.bezierCurveTo(s * 0.65, s * 0.1, s * 0.05, s * 0.1, 0, s * 0.35);
        ctx.closePath();

        // Green fill for health (distinct from red HUD hearts)
        ctx.fillStyle = COLORS.mossGreen;
        ctx.fill();
        ctx.strokeStyle = '#3A7A4F';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cross/plus symbol to further distinguish from coins
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2.5, 0);
        ctx.lineTo(2.5, 0);
        ctx.moveTo(0, -2.5);
        ctx.lineTo(0, 2.5);
        ctx.stroke();

        ctx.restore();
    },

    /**
     * Get count of collected coins.
     */
    getCollectedCoinCount() {
        let count = 0;
        for (const item of this.items) {
            if (item.type === 'coin' && item.collected) count++;
        }
        return count;
    }
};
