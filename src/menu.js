// ============================================================
// menu.js — Menu screens: Title, Controls, Pause, Game Over, Stage Complete
// Design spec: Deep Charcoal bg, Warm Slate panels, Muted Gold accents,
// Soft Cream text, canvas-drawn buttons with selection triangle
// ============================================================

const Menu = {
    // =============================================
    // SHARED STATE
    // =============================================
    selectedIndex: 0,
    animTimer: 0,

    // Title screen background scrolling
    _titleBgOffset: 0,
    _titleStars: [],
    _titleParticles: [],
    _titleOptions: [],
    _titleHasSave: false,

    // New Game confirmation dialog
    _showNewGameConfirm: false,
    _confirmSelectedIndex: 0,

    // =============================================
    // TITLE SCREEN
    // =============================================
    initTitle() {
        this.selectedIndex = 0;
        this.animTimer = 0;
        this._titleBgOffset = 0;
        this._showNewGameConfirm = false;
        this._confirmSelectedIndex = 0;

        // Build title menu options based on save data
        this._titleHasSave = SaveSystem.hasSaveData();
        if (this._titleHasSave) {
            this._titleOptions = ['Continue', 'New Game', 'Controls'];
        } else {
            this._titleOptions = ['New Game', 'Controls'];
        }

        // Generate decorative stars for title background
        this._titleStars = [];
        for (let i = 0; i < 80; i++) {
            this._titleStars.push({
                x: Math.random() * CANVAS_WIDTH * 2,
                y: Math.random() * CANVAS_HEIGHT,
                size: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                brightness: 0.3 + Math.random() * 0.7
            });
        }

        // Floating particles (leaves/motes)
        this._titleParticles = [];
        for (let i = 0; i < 30; i++) {
            this._titleParticles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: 2 + Math.random() * 4,
                vx: -0.3 - Math.random() * 0.5,
                vy: -0.1 + Math.random() * 0.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.03,
                color: Math.random() > 0.5 ? COLORS.mutedGold : COLORS.forest.highlight
            });
        }
    },

    updateTitle() {
        this.animTimer += 1 / 60;
        this._titleBgOffset += 0.5;

        // Update title particles
        for (const p of this._titleParticles) {
            p.x += p.vx;
            p.y += p.vy + Math.sin(p.wobble) * 0.3;
            p.wobble += p.wobbleSpeed;

            // Wrap around
            if (p.x < -10) p.x = CANVAS_WIDTH + 10;
            if (p.y < -10) p.y = CANVAS_HEIGHT + 10;
            if (p.y > CANVAS_HEIGHT + 10) p.y = -10;
        }

        // Handle New Game confirmation dialog
        if (this._showNewGameConfirm) {
            this._updateNewGameConfirm();
            return;
        }

        // Navigate menu
        if (Input.isJustPressed('ArrowDown')) {
            this.selectedIndex = (this.selectedIndex + 1) % this._titleOptions.length;
            AudioManager.playMenuSelect();
        }
        if (Input.isJustPressed('ArrowUp')) {
            this.selectedIndex = (this.selectedIndex - 1 + this._titleOptions.length) % this._titleOptions.length;
            AudioManager.playMenuSelect();
        }

        // Handle input
        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            const selected = this._titleOptions[this.selectedIndex];
            if (selected === 'Continue') {
                // Continue — load save and go to world map
                GameState.transitionTo(GameState.WORLD_MAP, () => {
                    GameState.setupWorldMap();
                });
            } else if (selected === 'New Game') {
                if (this._titleHasSave) {
                    // Show confirmation dialog
                    this._showNewGameConfirm = true;
                    this._confirmSelectedIndex = 1; // Default to "No"
                } else {
                    // No save data — just start new game
                    SaveSystem.clearSave();
                    GameState.transitionTo(GameState.WORLD_MAP, () => {
                        GameState.setupWorldMap();
                    });
                }
            } else if (selected === 'Controls') {
                GameState.changeTo(GameState.CONTROLS);
                this.initControls();
            }
        }
    },

    _updateNewGameConfirm() {
        if (Input.isJustPressed('ArrowLeft') || Input.isJustPressed('ArrowRight')) {
            this._confirmSelectedIndex = this._confirmSelectedIndex === 0 ? 1 : 0;
            AudioManager.playMenuSelect();
        }
        if (Input.isJustPressed('ArrowUp') || Input.isJustPressed('ArrowDown')) {
            this._confirmSelectedIndex = this._confirmSelectedIndex === 0 ? 1 : 0;
            AudioManager.playMenuSelect();
        }

        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            if (this._confirmSelectedIndex === 0) {
                // Yes — clear save and start new
                SaveSystem.clearSave();
                this._showNewGameConfirm = false;
                GameState.transitionTo(GameState.WORLD_MAP, () => {
                    GameState.setupWorldMap();
                });
            } else {
                // No — cancel
                this._showNewGameConfirm = false;
            }
        }

        if (Input.isJustPressed('Escape')) {
            this._showNewGameConfirm = false;
        }
    },

    renderTitle(ctx) {
        // Dark background
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Animated starfield background
        for (const star of this._titleStars) {
            const sx = (star.x - this._titleBgOffset * star.speed) % (CANVAS_WIDTH * 2);
            const adjustedX = sx < 0 ? sx + CANVAS_WIDTH * 2 : sx;
            if (adjustedX > CANVAS_WIDTH) continue;

            ctx.fillStyle = COLORS.softCream;
            ctx.globalAlpha = star.brightness * (0.5 + 0.5 * Math.sin(this.animTimer * 2 + star.x));
            ctx.beginPath();
            ctx.arc(adjustedX, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Scrolling mountain silhouettes
        this._renderTitleMountains(ctx);

        // Floating particles
        for (const p of this._titleParticles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.4 + 0.2 * Math.sin(this.animTimer + p.wobble);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Title text: "KINGDOMS OF THE CANVAS"
        const titleY = 160;
        ctx.save();

        // Title shadow
        this._drawTextWithOutline(ctx, 'KINGDOMS OF THE CANVAS',
            CANVAS_WIDTH / 2, titleY + 3,
            'bold 48px sans-serif',
            'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)', 'center');

        // Title main
        this._drawTextWithOutline(ctx, 'KINGDOMS OF THE CANVAS',
            CANVAS_WIDTH / 2, titleY,
            'bold 48px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');

        ctx.restore();

        // Subtitle
        this._drawTextWithOutline(ctx, 'A Browser Platformer Adventure',
            CANVAS_WIDTH / 2, titleY + 40,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'center');

        // Menu options
        const menuStartY = 290;
        const buttonW = 240;
        const buttonH = 40;
        const buttonGap = 8;

        for (let i = 0; i < this._titleOptions.length; i++) {
            const bx = (CANVAS_WIDTH - buttonW) / 2;
            const by = menuStartY + i * (buttonH + buttonGap);
            const selected = i === this.selectedIndex;

            // Button background
            if (selected) {
                ctx.fillStyle = '#3D3D54';
                this._roundRect(ctx, bx, by, buttonW, buttonH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = COLORS.warmSlate;
                this._roundRect(ctx, bx, by, buttonW, buttonH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            this._roundRectPath(ctx, bx, by, buttonW, buttonH, 4);
            ctx.stroke();

            // Selection triangle
            if (selected) {
                ctx.fillStyle = COLORS.mutedGold;
                const triX = bx + 16;
                const triY = by + buttonH / 2;
                ctx.beginPath();
                ctx.moveTo(triX, triY - 6);
                ctx.lineTo(triX + 8, triY);
                ctx.lineTo(triX, triY + 6);
                ctx.closePath();
                ctx.fill();
            }

            // Button text
            this._drawTextWithOutline(ctx, this._titleOptions[i],
                bx + buttonW / 2, by + buttonH / 2 + 7,
                '22px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');
        }

        // Version / credits at bottom
        ctx.globalAlpha = 0.5;
        this._drawTextWithOutline(ctx, 'Built with Canvas & JavaScript',
            CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20,
            '12px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'center');
        ctx.globalAlpha = 1.0;

        // New Game confirmation dialog
        if (this._showNewGameConfirm) {
            this._renderNewGameConfirm(ctx);
        }
    },

    _renderNewGameConfirm(ctx) {
        // Dark overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Dialog box (320x180, centered)
        const dw = 320;
        const dh = 180;
        const dx = (CANVAS_WIDTH - dw) / 2;
        const dy = (CANVAS_HEIGHT - dh) / 2;

        // Background
        ctx.fillStyle = 'rgba(26, 26, 46, 0.95)';
        ctx.beginPath();
        this._roundRectPath(ctx, dx, dy, dw, dh, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        this._roundRectPath(ctx, dx, dy, dw, dh, 8);
        ctx.stroke();

        // Title
        this._drawTextWithOutline(ctx, 'Start New Game?',
            CANVAS_WIDTH / 2, dy + 40,
            'bold 22px sans-serif',
            COLORS.softCream, COLORS.deepCharcoal, 'center');

        // Message
        this._drawTextWithOutline(ctx, 'This will erase your',
            CANVAS_WIDTH / 2, dy + 75,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'center');
        this._drawTextWithOutline(ctx, 'save data.',
            CANVAS_WIDTH / 2, dy + 95,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'center');

        // Yes/No buttons
        const btnW = 100;
        const btnH = 36;
        const btnGap = 32;
        const totalBtnW = btnW * 2 + btnGap;
        const btnStartX = dx + (dw - totalBtnW) / 2;
        const btnY = dy + dh - 50;

        const labels = ['Yes', 'No'];
        for (let i = 0; i < 2; i++) {
            const bx = btnStartX + i * (btnW + btnGap);
            const selected = i === this._confirmSelectedIndex;

            if (selected) {
                ctx.fillStyle = '#3D3D54';
                this._roundRect(ctx, bx, btnY, btnW, btnH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = COLORS.warmSlate;
                this._roundRect(ctx, bx, btnY, btnW, btnH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            this._roundRectPath(ctx, bx, btnY, btnW, btnH, 4);
            ctx.stroke();

            if (selected) {
                ctx.fillStyle = COLORS.mutedGold;
                const triX = bx + 10;
                const triY = btnY + btnH / 2;
                ctx.beginPath();
                ctx.moveTo(triX, triY - 5);
                ctx.lineTo(triX + 7, triY);
                ctx.lineTo(triX, triY + 5);
                ctx.closePath();
                ctx.fill();
            }

            this._drawTextWithOutline(ctx, labels[i],
                bx + btnW / 2, btnY + btnH / 2 + 6,
                '22px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');
        }
    },

    _renderTitleMountains(ctx) {
        const offset = this._titleBgOffset;

        // Far mountains (slow)
        ctx.fillStyle = COLORS.warmSlate;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 8; i++) {
            const mx = i * 200 - (offset * 0.15) % 1600;
            const adjustedX = mx < -200 ? mx + 1600 : mx;
            ctx.beginPath();
            ctx.moveTo(adjustedX, CANVAS_HEIGHT);
            ctx.lineTo(adjustedX + 100, CANVAS_HEIGHT - 120 - (i % 3) * 40);
            ctx.lineTo(adjustedX + 200, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }

        // Near mountains (faster)
        ctx.fillStyle = COLORS.forest.shadow;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 10; i++) {
            const mx = i * 160 - (offset * 0.3) % 1600;
            const adjustedX = mx < -160 ? mx + 1600 : mx;
            ctx.beginPath();
            ctx.moveTo(adjustedX, CANVAS_HEIGHT);
            ctx.lineTo(adjustedX + 80, CANVAS_HEIGHT - 80 - (i % 4) * 20);
            ctx.lineTo(adjustedX + 160, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }

        // Tree line silhouette (nearest, fastest)
        ctx.fillStyle = COLORS.forest.deepCanopy;
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 20; i++) {
            const tx = i * 80 - (offset * 0.6) % 1600;
            const adjustedX = tx < -80 ? tx + 1600 : tx;
            const h = 40 + (i % 5) * 15;
            ctx.beginPath();
            ctx.moveTo(adjustedX, CANVAS_HEIGHT);
            ctx.lineTo(adjustedX + 20, CANVAS_HEIGHT - h);
            ctx.lineTo(adjustedX + 40, CANVAS_HEIGHT - h * 0.6);
            ctx.lineTo(adjustedX + 60, CANVAS_HEIGHT - h * 0.8);
            ctx.lineTo(adjustedX + 80, CANVAS_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    },

    // =============================================
    // CONTROLS SCREEN
    // =============================================
    initControls() {
        this.animTimer = 0;
    },

    updateControls() {
        this.animTimer += 1 / 60;

        if (Input.isJustPressed('Escape') || Input.isJustPressed('Enter') ||
            Input.isJustPressed('c') || Input.isJustPressed('C')) {
            GameState.changeTo(GameState.TITLE);
            this.initTitle();
        }
    },

    renderControls(ctx) {
        // Dark background
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        this._drawTextWithOutline(ctx, 'Controls',
            CANVAS_WIDTH / 2, 60,
            'bold 28px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');

        // Controls panel
        const panelX = (CANVAS_WIDTH - 400) / 2;
        const panelY = 90;
        const panelW = 400;
        const panelH = 340;

        ctx.fillStyle = 'rgba(45, 45, 68, 0.8)'; // warmSlate with alpha
        this._roundRect(ctx, panelX, panelY, panelW, panelH, 8);

        // Border
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.stroke();

        // Control bindings
        const bindings = [
            ['Arrow Keys', 'Move Left / Right'],
            ['Arrow Up', 'Look Up'],
            ['Arrow Down', 'Crouch'],
            ['Z', 'Jump (hold for higher)'],
            ['X', 'Attack (hold to charge)'],
            ['Shift', 'Run (hold while moving)'],
            ['Escape', 'Pause Game'],
            ['Enter', 'Confirm / Start']
        ];

        const startY = panelY + 30;
        const lineHeight = 36;

        for (let i = 0; i < bindings.length; i++) {
            const [key, action] = bindings[i];
            const y = startY + i * lineHeight;

            // Key badge
            const badgeX = panelX + 30;
            const badgeW = 120;
            const badgeH = 26;

            ctx.fillStyle = COLORS.deepCharcoal;
            this._roundRect(ctx, badgeX, y, badgeW, badgeH, 4);
            ctx.strokeStyle = COLORS.steelBlue;
            ctx.lineWidth = 1;
            ctx.beginPath();
            this._roundRectPath(ctx, badgeX, y, badgeW, badgeH, 4);
            ctx.stroke();

            this._drawTextWithOutline(ctx, key,
                badgeX + badgeW / 2, y + 18,
                'bold 14px "Courier New", monospace',
                COLORS.softCream, COLORS.deepCharcoal, 'center');

            // Action description
            this._drawTextWithOutline(ctx, action,
                panelX + 170, y + 18,
                '14px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'left');
        }

        // Back hint
        const backAlpha = 0.5 + 0.3 * Math.sin(this.animTimer * 3);
        ctx.globalAlpha = backAlpha;
        this._drawTextWithOutline(ctx, 'Press Escape or Enter to return',
            CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'center');
        ctx.globalAlpha = 1.0;
    },

    // =============================================
    // PAUSE MENU
    // =============================================
    _pauseOptions: ['Resume', 'Volume', 'Mute: OFF', 'Restart Stage', 'Return to World Map', 'Quit to Title'],

    initPause() {
        this.selectedIndex = 0;
        // Update mute label to reflect current state
        this._pauseOptions[2] = AudioManager.muted ? 'Mute: ON' : 'Mute: OFF';
    },

    updatePause() {
        this.animTimer += 1 / 60;

        // Update dynamic labels
        const volPct = Math.round(AudioManager.masterVolume * 100);
        this._pauseOptions[1] = 'Volume: ' + volPct + '%';
        this._pauseOptions[2] = AudioManager.muted ? 'Mute: ON' : 'Mute: OFF';

        // Escape to resume
        if (Input.isJustPressed('Escape')) {
            GameState.changeTo(GameState.STAGE);
            return;
        }

        // Navigate
        if (Input.isJustPressed('ArrowDown')) {
            this.selectedIndex = (this.selectedIndex + 1) % this._pauseOptions.length;
            AudioManager.playMenuSelect();
        }
        if (Input.isJustPressed('ArrowUp')) {
            this.selectedIndex = (this.selectedIndex - 1 + this._pauseOptions.length) % this._pauseOptions.length;
            AudioManager.playMenuSelect();
        }

        // Volume adjustment (left/right on Volume option)
        if (this.selectedIndex === 1) {
            if (Input.isJustPressed('ArrowLeft')) {
                AudioManager.masterVolume = Math.max(0, AudioManager.masterVolume - 0.1);
                AudioManager.playMenuSelect();
            }
            if (Input.isJustPressed('ArrowRight')) {
                AudioManager.masterVolume = Math.min(1, AudioManager.masterVolume + 0.1);
                AudioManager.playMenuSelect();
            }
        }

        // Select
        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            switch (this.selectedIndex) {
                case 0: // Resume
                    GameState.changeTo(GameState.STAGE);
                    break;
                case 1: // Volume — Enter does nothing (use left/right)
                    break;
                case 2: // Mute toggle
                    AudioManager.muted = !AudioManager.muted;
                    break;
                case 3: // Restart Stage
                    AudioManager.stopAmbient();
                    AudioManager.stopBossMusic();
                    GameState.transitionTo(GameState.STAGE, () => {
                        GameState.restartStage();
                    });
                    break;
                case 4: // Return to World Map
                    AudioManager.stopAmbient();
                    AudioManager.stopBossMusic();
                    GameState.transitionTo(GameState.WORLD_MAP, () => {
                        GameState.setupWorldMap();
                    });
                    break;
                case 5: // Quit to Title
                    AudioManager.stopAmbient();
                    AudioManager.stopBossMusic();
                    GameState.transitionTo(GameState.TITLE, () => {
                        GameState.setupTitle();
                    });
                    break;
            }
        }
    },

    renderPause(ctx) {
        // Dark overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.75)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // "PAUSED" title
        this._drawTextWithOutline(ctx, 'PAUSED',
            CANVAS_WIDTH / 2, 140,
            'bold 28px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');

        // Menu panel
        const panelW = 280;
        const panelH = this._pauseOptions.length * 48 + 32;
        const panelX = (CANVAS_WIDTH - panelW) / 2;
        const panelY = 155;

        ctx.fillStyle = 'rgba(45, 45, 68, 0.9)';
        this._roundRect(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.stroke();

        // Menu options
        this._renderMenuOptions(ctx, this._pauseOptions, panelX, panelY + 16, panelW);
    },

    // =============================================
    // GAME OVER SCREEN
    // =============================================
    _gameOverOptions: ['Continue', 'Quit to Title'],

    initGameOver() {
        this.selectedIndex = 0;
    },

    updateGameOver() {
        this.animTimer += 1 / 60;

        if (Input.isJustPressed('ArrowDown')) {
            this.selectedIndex = (this.selectedIndex + 1) % this._gameOverOptions.length;
            AudioManager.playMenuSelect();
        }
        if (Input.isJustPressed('ArrowUp')) {
            this.selectedIndex = (this.selectedIndex - 1 + this._gameOverOptions.length) % this._gameOverOptions.length;
            AudioManager.playMenuSelect();
        }

        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            switch (this.selectedIndex) {
                case 0: // Continue — restart stage with refreshed lives/HP
                    AudioManager.stopAmbient();
                    AudioManager.stopBossMusic();
                    GameState.transitionTo(GameState.STAGE, () => {
                        GameState.restartStage();
                    });
                    break;
                case 1: // Quit to Title
                    AudioManager.stopAmbient();
                    AudioManager.stopBossMusic();
                    GameState.transitionTo(GameState.TITLE, () => {
                        GameState.setupTitle();
                    });
                    break;
            }
        }
    },

    renderGameOver(ctx) {
        // Dark overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // "GAME OVER" title
        this._drawTextWithOutline(ctx, 'GAME OVER',
            CANVAS_WIDTH / 2, 190,
            'bold 48px sans-serif',
            COLORS.emberRed, COLORS.deepCharcoal, 'center');

        // Menu panel
        const panelW = 260;
        const panelH = this._gameOverOptions.length * 48 + 32;
        const panelX = (CANVAS_WIDTH - panelW) / 2;
        const panelY = 230;

        ctx.fillStyle = 'rgba(45, 45, 68, 0.9)';
        this._roundRect(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.stroke();

        this._renderMenuOptions(ctx, this._gameOverOptions, panelX, panelY + 16, panelW);
    },

    // =============================================
    // STAGE COMPLETE SCREEN
    // =============================================
    _stageCompleteOptions: ['Continue'],
    _completionTime: 0,
    _completionCoins: 0,
    _completionTotalCoins: 0,

    initStageComplete(time, coins, totalCoins) {
        this.selectedIndex = 0;
        this._completionTime = time;
        this._completionCoins = coins;
        this._completionTotalCoins = totalCoins || 0;
    },

    updateStageComplete() {
        this.animTimer += 1 / 60;

        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            AudioManager.stopAmbient();
            // Return to world map (not title)
            GameState.transitionTo(GameState.WORLD_MAP, () => {
                GameState.setupWorldMap();
            });
        }
    },

    renderStageComplete(ctx) {
        // Dark overlay
        ctx.fillStyle = 'rgba(26, 26, 46, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // "STAGE COMPLETE!" title
        this._drawTextWithOutline(ctx, 'STAGE COMPLETE!',
            CANVAS_WIDTH / 2, 160,
            'bold 28px sans-serif',
            COLORS.mossGreen, COLORS.deepCharcoal, 'center');

        // Stats panel
        const panelW = 320;
        const panelH = 200;
        const panelX = (CANVAS_WIDTH - panelW) / 2;
        const panelY = 190;

        ctx.fillStyle = 'rgba(45, 45, 68, 0.9)';
        this._roundRect(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 1;
        ctx.beginPath();
        this._roundRectPath(ctx, panelX, panelY, panelW, panelH, 8);
        ctx.stroke();

        // Time
        const minutes = Math.floor(this._completionTime / 60);
        const seconds = Math.floor(this._completionTime % 60);
        const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

        this._drawTextWithOutline(ctx, 'Time',
            panelX + 40, panelY + 40,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'left');
        this._drawTextWithOutline(ctx, timeStr,
            panelX + panelW - 40, panelY + 40,
            'bold 22px "Courier New", monospace',
            COLORS.softCream, COLORS.deepCharcoal, 'right');

        // Coins — show collected / total
        const coinStr = this._completionCoins + ' / ' + this._completionTotalCoins;
        this._drawTextWithOutline(ctx, 'Coins',
            panelX + 40, panelY + 80,
            '14px sans-serif',
            COLORS.steelBlue, COLORS.deepCharcoal, 'left');
        this._drawTextWithOutline(ctx, coinStr,
            panelX + panelW - 40, panelY + 80,
            'bold 22px "Courier New", monospace',
            COLORS.mutedGold, COLORS.deepCharcoal, 'right');

        // Congratulatory message
        this._drawTextWithOutline(ctx, 'Well done, adventurer!',
            CANVAS_WIDTH / 2, panelY + 130,
            '18px sans-serif',
            COLORS.softCream, COLORS.deepCharcoal, 'center');

        // Continue option — goes to world map
        const continueY = panelY + panelH + 20;
        const pulseAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.animTimer * 2.5));
        ctx.globalAlpha = pulseAlpha;
        this._drawTextWithOutline(ctx, 'Press Enter to Continue',
            CANVAS_WIDTH / 2, continueY,
            '22px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');
        ctx.globalAlpha = 1.0;
    },

    // =============================================
    // VICTORY SCREEN
    // =============================================

    // Victory state
    victoryScrollY: 0,
    creditsY: 0,
    scrollOffset: 0,
    _victoryTime: 0,
    _victoryCoins: 0,
    _victoryDeaths: 0,
    _victoryStars: [],

    initVictory(totalTime, totalCoins, totalDeaths) {
        this.selectedIndex = 0;
        this.animTimer = 0;
        this.victoryScrollY = 0;
        this.creditsY = 0;
        this.scrollOffset = 0;
        this._victoryTime = totalTime || 0;
        this._victoryCoins = totalCoins || 0;
        this._victoryDeaths = totalDeaths || 0;

        // Generate decorative stars
        this._victoryStars = [];
        for (let i = 0; i < 100; i++) {
            this._victoryStars.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: 0.5 + Math.random() * 2,
                brightness: 0.2 + Math.random() * 0.6,
                twinkleSpeed: 1 + Math.random() * 3
            });
        }
    },

    updateVictory() {
        this.animTimer += 1 / 60;

        // Scroll credits upward
        this.victoryScrollY += 0.5;
        this.creditsY = this.victoryScrollY;
        this.scrollOffset = this.victoryScrollY;

        // Return to title on Enter
        if (Input.isJustPressed('Enter')) {
            AudioManager.playMenuConfirm();
            AudioManager.stopAmbient();
            GameState.transitionTo(GameState.TITLE, () => {
                GameState.setupTitle();
            });
        }
    },

    renderVictory(ctx) {
        // Dark background
        ctx.fillStyle = COLORS.deepCharcoal;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Twinkling stars background
        for (const star of this._victoryStars) {
            const alpha = star.brightness * (0.5 + 0.5 * Math.sin(this.animTimer * star.twinkleSpeed + star.x));
            ctx.fillStyle = COLORS.softCream;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // Scrolling credits content
        const scrollY = this.victoryScrollY;
        const baseY = CANVAS_HEIGHT - scrollY;

        // Victory title (fixed at top until scrolled past)
        const titleY = Math.max(80, baseY + 40);
        if (titleY < CANVAS_HEIGHT + 50) {
            // Golden glow behind title
            const glowAlpha = 0.3 + 0.1 * Math.sin(this.animTimer * 2);
            ctx.fillStyle = COLORS.mutedGold;
            ctx.globalAlpha = glowAlpha;
            ctx.beginPath();
            ctx.arc(CANVAS_WIDTH / 2, titleY - 10, 120, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            this._drawTextWithOutline(ctx, 'VICTORY!',
                CANVAS_WIDTH / 2, titleY,
                'bold 48px sans-serif',
                COLORS.mutedGold, COLORS.deepCharcoal, 'center');
        }

        // Subtitle
        const subY = baseY + 100;
        if (subY > -30 && subY < CANVAS_HEIGHT + 30) {
            this._drawTextWithOutline(ctx, 'The Architect Has Fallen',
                CANVAS_WIDTH / 2, subY,
                'bold 28px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');
        }

        // Congratulation text
        const congY = baseY + 160;
        if (congY > -30 && congY < CANVAS_HEIGHT + 30) {
            this._drawTextWithOutline(ctx, 'You have conquered all four kingdoms',
                CANVAS_WIDTH / 2, congY,
                '18px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'center');
        }
        const cong2Y = baseY + 190;
        if (cong2Y > -30 && cong2Y < CANVAS_HEIGHT + 30) {
            this._drawTextWithOutline(ctx, 'and restored peace to the Canvas!',
                CANVAS_WIDTH / 2, cong2Y,
                '18px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'center');
        }

        // Stats panel
        const statsY = baseY + 250;
        if (statsY > -200 && statsY < CANVAS_HEIGHT + 50) {
            const panelW = 320;
            const panelH = 160;
            const panelX = (CANVAS_WIDTH - panelW) / 2;

            ctx.fillStyle = 'rgba(45, 45, 68, 0.9)';
            this._roundRect(ctx, panelX, statsY, panelW, panelH, 8);
            ctx.strokeStyle = COLORS.mutedGold;
            ctx.lineWidth = 2;
            ctx.beginPath();
            this._roundRectPath(ctx, panelX, statsY, panelW, panelH, 8);
            ctx.stroke();

            // Total Time
            const minutes = Math.floor(this._victoryTime / 60);
            const seconds = Math.floor(this._victoryTime % 60);
            const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');

            this._drawTextWithOutline(ctx, 'Total Time',
                panelX + 40, statsY + 40,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._drawTextWithOutline(ctx, timeStr,
                panelX + panelW - 40, statsY + 40,
                'bold 22px "Courier New", monospace',
                COLORS.softCream, COLORS.deepCharcoal, 'right');

            // Total Coins
            this._drawTextWithOutline(ctx, 'Total Coins',
                panelX + 40, statsY + 80,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._drawTextWithOutline(ctx, String(this._victoryCoins),
                panelX + panelW - 40, statsY + 80,
                'bold 22px "Courier New", monospace',
                COLORS.mutedGold, COLORS.deepCharcoal, 'right');

            // Total Deaths
            this._drawTextWithOutline(ctx, 'Total Deaths',
                panelX + 40, statsY + 120,
                '14px sans-serif',
                COLORS.steelBlue, COLORS.deepCharcoal, 'left');
            this._drawTextWithOutline(ctx, String(this._victoryDeaths),
                panelX + panelW - 40, statsY + 120,
                'bold 22px "Courier New", monospace',
                COLORS.emberRed, COLORS.deepCharcoal, 'right');
        }

        // Credits section
        const creditsStartY = baseY + 460;
        const creditLines = [
            { text: 'CREDITS', font: 'bold 22px sans-serif', color: COLORS.mutedGold },
            { text: '', font: '14px sans-serif', color: COLORS.softCream },
            { text: 'Game Design & Programming', font: '18px sans-serif', color: COLORS.softCream },
            { text: 'Built with HTML5 Canvas & JavaScript', font: '14px sans-serif', color: COLORS.steelBlue },
            { text: '', font: '14px sans-serif', color: COLORS.softCream },
            { text: 'Worlds', font: 'bold 18px sans-serif', color: COLORS.mutedGold },
            { text: 'Whispering Forest', font: '14px sans-serif', color: COLORS.forest.leaf },
            { text: 'Scorching Desert', font: '14px sans-serif', color: COLORS.desert.sand },
            { text: 'Frozen Tundra', font: '14px sans-serif', color: COLORS.tundra.iceBlue },
            { text: 'Molten Volcano', font: '14px sans-serif', color: COLORS.volcano.lavaOrange },
            { text: 'The Citadel', font: '14px sans-serif', color: COLORS.mutedGold },
            { text: '', font: '14px sans-serif', color: COLORS.softCream },
            { text: 'Thank you for playing!', font: 'bold 22px sans-serif', color: COLORS.mossGreen },
            { text: '', font: '14px sans-serif', color: COLORS.softCream },
            { text: '', font: '14px sans-serif', color: COLORS.softCream },
        ];

        let lineY = creditsStartY;
        for (const line of creditLines) {
            if (lineY > -30 && lineY < CANVAS_HEIGHT + 30) {
                if (line.text) {
                    this._drawTextWithOutline(ctx, line.text,
                        CANVAS_WIDTH / 2, lineY,
                        line.font,
                        line.color, COLORS.deepCharcoal, 'center');
                }
            }
            lineY += 30;
        }

        // Fixed "Press Enter" prompt at bottom
        const pulseAlpha = 0.5 + 0.5 * Math.abs(Math.sin(this.animTimer * 2.5));
        ctx.globalAlpha = pulseAlpha;
        this._drawTextWithOutline(ctx, 'Press Enter to Return to Title',
            CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30,
            '18px sans-serif',
            COLORS.mutedGold, COLORS.deepCharcoal, 'center');
        ctx.globalAlpha = 1.0;
    },

    // =============================================
    // SHARED MENU RENDERING
    // =============================================

    /**
     * Render a list of selectable menu options.
     * Design spec: 240x40 buttons, Warm Slate bg, Muted Gold border when selected,
     * Soft Cream text, selection triangle indicator.
     */
    _renderMenuOptions(ctx, options, panelX, startY, panelW) {
        const buttonW = 240;
        const buttonH = 40;
        const buttonGap = 8; // md/2 gap

        for (let i = 0; i < options.length; i++) {
            const bx = panelX + (panelW - buttonW) / 2;
            const by = startY + i * (buttonH + buttonGap);
            const selected = i === this.selectedIndex;

            // Button background
            if (selected) {
                ctx.fillStyle = '#3D3D54'; // lightened warmSlate
                this._roundRect(ctx, bx, by, buttonW, buttonH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 2;
            } else {
                ctx.fillStyle = COLORS.warmSlate;
                this._roundRect(ctx, bx, by, buttonW, buttonH, 4);
                ctx.strokeStyle = COLORS.mutedGold;
                ctx.lineWidth = 1;
            }
            ctx.beginPath();
            this._roundRectPath(ctx, bx, by, buttonW, buttonH, 4);
            ctx.stroke();

            // Selection triangle
            if (selected) {
                ctx.fillStyle = COLORS.mutedGold;
                const triX = bx + 16;
                const triY = by + buttonH / 2;
                ctx.beginPath();
                ctx.moveTo(triX, triY - 6);
                ctx.lineTo(triX + 8, triY);
                ctx.lineTo(triX, triY + 6);
                ctx.closePath();
                ctx.fill();
            }

            // Button text — centered with 8px padding, vertically centered
            this._drawTextWithOutline(ctx, options[i],
                bx + buttonW / 2, by + buttonH / 2 + 7,
                '22px sans-serif',
                COLORS.softCream, COLORS.deepCharcoal, 'center');
        }
    },

    // =============================================
    // UTILITY
    // =============================================
    _drawTextWithOutline(ctx, text, x, y, font, fillColor, strokeColor, align) {
        ctx.font = font;
        ctx.textAlign = align || 'left';
        ctx.textBaseline = 'alphabetic';

        // 2px dark outline
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y);

        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);

        ctx.textAlign = 'left';
    },

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        this._roundRectPath(ctx, x, y, w, h, r);
        ctx.fill();
    },

    _roundRectPath(ctx, x, y, w, h, r) {
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
    }
};
