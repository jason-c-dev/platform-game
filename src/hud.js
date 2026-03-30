// ============================================================
// hud.js — Heads-Up Display
// Design spec: Health hearts (top-left), coin counter (top-center),
// stage name (top-right), boss health bar (bottom-center, conditional)
// All with semi-transparent dark backgrounds
// ============================================================

const HUD = {
    // Animation state
    _prevHP: PLAYER_MAX_HP,
    _heartPulseTimer: 0,
    _prevCoins: 0,
    _coinPulseTimer: 0,

    // Boss state (populated externally when boss is active)
    bossActive: false,
    bossName: '',
    bossHP: 0,
    bossMaxHP: 1,
    _bossBarTarget: 1, // for smooth lerp
    _bossBarCurrent: 1,

    init() {
        this._prevHP = PLAYER_MAX_HP;
        this._heartPulseTimer = 0;
        this._prevCoins = 0;
        this._coinPulseTimer = 0;
        this.bossActive = false;
        this.bossName = '';
        this.bossHP = 0;
        this.bossMaxHP = 1;
        this._bossBarTarget = 1;
        this._bossBarCurrent = 1;
    },

    render(ctx) {
        // Update pulse timers
        if (this._heartPulseTimer > 0) this._heartPulseTimer -= 1 / 60;
        if (this._coinPulseTimer > 0) this._coinPulseTimer -= 1 / 60;

        // Check for HP change
        if (Player.hp !== this._prevHP) {
            this._heartPulseTimer = 0.3;
            this._prevHP = Player.hp;
        }

        // Check for coin change
        if (GameState.coinsCollected !== this._prevCoins) {
            this._coinPulseTimer = 0.3;
            this._prevCoins = GameState.coinsCollected;
        }

        this._renderHealthHearts(ctx);
        this._renderCoinCounter(ctx);
        this._renderStageName(ctx);

        if (this.bossActive) {
            this._renderBossHealthBar(ctx);
        }
    },

    // =============================================
    // HEALTH HEARTS — Top-Left
    // Design: 24x24 each, 4px gap, 16px from edges
    // Filled: Ember Red #D94F4F, outline #A83A3A
    // Empty: Steel Blue #6B8CAE outline, transparent fill
    // =============================================
    _renderHealthHearts(ctx) {
        const inset = 16;  // from canvas edge
        const heartSize = 24;
        const gap = 4;     // xs spacing
        const totalWidth = PLAYER_MAX_HP * heartSize + (PLAYER_MAX_HP - 1) * gap;
        const panelPadding = 8; // sm padding
        const panelWidth = totalWidth + panelPadding * 2;
        const panelHeight = heartSize + panelPadding * 2;

        // Semi-transparent dark background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.75)'; // deepCharcoal with alpha
        this._roundRect(ctx, inset - panelPadding, inset - panelPadding, panelWidth, panelHeight, 4);

        // Pulse scale when HP changes
        const pulseScale = this._heartPulseTimer > 0
            ? 1.0 + 0.05 * Math.sin(this._heartPulseTimer * Math.PI / 0.3)
            : 1.0;

        for (let i = 0; i < PLAYER_MAX_HP; i++) {
            const hx = inset + i * (heartSize + gap) + heartSize / 2;
            const hy = inset + heartSize / 2;
            const filled = i < Player.hp;

            ctx.save();
            if (this._heartPulseTimer > 0) {
                ctx.translate(hx, hy);
                ctx.scale(pulseScale, pulseScale);
                ctx.translate(-hx, -hy);
            }

            this._drawHeart(ctx, hx, hy, heartSize * 0.45, filled);
            ctx.restore();
        }
    },

    _drawHeart(ctx, cx, cy, size, filled) {
        ctx.save();
        ctx.translate(cx, cy);

        ctx.beginPath();
        // Heart shape using bezier curves
        const s = size;
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s * 0.05, s * 0.1, -s * 0.65, s * 0.1, -s * 0.65, -s * 0.2);
        ctx.bezierCurveTo(-s * 0.65, -s * 0.6, -s * 0.15, -s * 0.7, 0, -s * 0.35);
        ctx.bezierCurveTo(s * 0.15, -s * 0.7, s * 0.65, -s * 0.6, s * 0.65, -s * 0.2);
        ctx.bezierCurveTo(s * 0.65, s * 0.1, s * 0.05, s * 0.1, 0, s * 0.35);
        ctx.closePath();

        if (filled) {
            ctx.fillStyle = COLORS.emberRed;
            ctx.fill();
            // Darker outline
            ctx.strokeStyle = '#A83A3A';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(-s * 0.25, -s * 0.25, s * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Empty heart — just outline
            ctx.strokeStyle = COLORS.steelBlue;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    },

    // =============================================
    // COIN COUNTER — Top-Center
    // Design: gold circle icon, Muted Gold number in mono
    // Format: "x 047" (3 digits zero-padded)
    // =============================================
    _renderCoinCounter(ctx) {
        const coinIconRadius = 6; // 12px diameter
        const panelPadding = 8;
        const text = '\u00D7 ' + String(GameState.coinsCollected).padStart(3, '0');

        ctx.font = 'bold 16px "Courier New", monospace';
        const textWidth = ctx.measureText(text).width;
        const totalWidth = coinIconRadius * 2 + 6 + textWidth; // icon + gap + text
        const panelWidth = totalWidth + panelPadding * 2;
        const panelHeight = 24 + panelPadding * 2;
        const panelX = (CANVAS_WIDTH - panelWidth) / 2;
        const panelY = 16 - panelPadding;

        // Semi-transparent dark background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.75)';
        this._roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 4);

        // Pulse scale
        const pulseScale = this._coinPulseTimer > 0
            ? 1.0 + 0.1 * Math.sin(this._coinPulseTimer * Math.PI / 0.3)
            : 1.0;

        const contentX = panelX + panelPadding;
        const centerY = panelY + panelHeight / 2;

        ctx.save();
        if (this._coinPulseTimer > 0) {
            ctx.translate(CANVAS_WIDTH / 2, centerY);
            ctx.scale(pulseScale, pulseScale);
            ctx.translate(-CANVAS_WIDTH / 2, -centerY);
        }

        // Coin icon — gold circle
        ctx.fillStyle = COLORS.coinGold;
        ctx.beginPath();
        ctx.arc(contentX + coinIconRadius, centerY, coinIconRadius, 0, Math.PI * 2);
        ctx.fill();

        // Coin glint
        ctx.fillStyle = COLORS.coinGlint;
        ctx.beginPath();
        ctx.arc(contentX + coinIconRadius - 2, centerY - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Coin text
        this._drawTextWithOutline(ctx, text,
            contentX + coinIconRadius * 2 + 6,
            centerY + 5,
            'bold 16px "Courier New", monospace',
            COLORS.mutedGold, COLORS.deepCharcoal, 'left');

        ctx.restore();
    },

    // =============================================
    // STAGE NAME — Top-Right
    // Design: 18px bold sans-serif, Title Case
    // =============================================
    _renderStageName(ctx) {
        const inset = 16;
        const panelPadding = 8;
        const text = GameState.stageName;

        ctx.font = 'bold 18px sans-serif';
        const textWidth = ctx.measureText(text).width;
        const panelWidth = textWidth + panelPadding * 2;
        const panelHeight = 24 + panelPadding * 2;
        const panelX = CANVAS_WIDTH - inset - panelWidth;
        const panelY = inset - panelPadding;

        // Semi-transparent dark background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.75)';
        this._roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 4);

        // Stage name text
        this._drawTextWithOutline(ctx, text,
            panelX + panelPadding,
            inset + 18,
            'bold 18px sans-serif',
            COLORS.softCream, COLORS.deepCharcoal, 'left');
    },

    // =============================================
    // BOSS HEALTH BAR — Bottom-Center (conditional)
    // Design: 320x12, centered, 48px from bottom
    // Gradient: Ember Red (low) to Moss Green (full)
    // Boss name label above bar
    // Smooth lerp over 0.3s
    // =============================================
    _renderBossHealthBar(ctx) {
        const barWidth = 320;
        const barHeight = 12;
        const barX = (CANVAS_WIDTH - barWidth) / 2;
        const barY = CANVAS_HEIGHT - 48;
        const panelPadding = 8;

        // Lerp the bar fill
        this._bossBarTarget = this.bossHP / this.bossMaxHP;
        const lerpSpeed = 1 / (0.3 * 60); // 0.3 seconds at 60fps
        if (this._bossBarCurrent > this._bossBarTarget) {
            this._bossBarCurrent = Math.max(this._bossBarTarget,
                this._bossBarCurrent - lerpSpeed);
        } else {
            this._bossBarCurrent = Math.min(this._bossBarTarget,
                this._bossBarCurrent + lerpSpeed);
        }

        // Panel background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
        this._roundRect(ctx,
            barX - panelPadding,
            barY - 24 - panelPadding,
            barWidth + panelPadding * 2,
            barHeight + 24 + panelPadding * 2,
            4);

        // Boss name label
        this._drawTextWithOutline(ctx, this.bossName,
            CANVAS_WIDTH / 2,
            barY - 6,
            '12px sans-serif',
            COLORS.softCream, COLORS.deepCharcoal, 'center');

        // Bar background
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Bar border
        ctx.strokeStyle = COLORS.warmSlate;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Bar fill with gradient
        const fillWidth = barWidth * Math.max(0, this._bossBarCurrent);
        if (fillWidth > 0) {
            const grad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            grad.addColorStop(0, COLORS.emberRed);
            grad.addColorStop(1, COLORS.mossGreen);
            ctx.fillStyle = grad;
            ctx.fillRect(barX, barY, fillWidth, barHeight);
        }
    },

    // =============================================
    // UTILITY
    // =============================================
    _drawTextWithOutline(ctx, text, x, y, font, fillColor, strokeColor, align) {
        ctx.font = font;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';

        // 2px dark outline (stroke before fill, per design spec)
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        // Fill
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);

        // Reset
        ctx.textAlign = 'left';
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
        ctx.fill();
    }
};
