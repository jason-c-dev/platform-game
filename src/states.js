// ============================================================
// states.js — Game State Machine
// States: TITLE, CONTROLS, WORLD_MAP, STAGE, PAUSED, GAME_OVER, STAGE_COMPLETE
// ============================================================

const GameState = {
    // State constants
    TITLE: 'TITLE',
    CONTROLS: 'CONTROLS',
    WORLD_MAP: 'WORLD_MAP',
    STAGE: 'STAGE',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
    STAGE_COMPLETE: 'STAGE_COMPLETE',

    // Current state
    current: 'TITLE',
    previous: null,

    // Stage info
    stageName: 'Test Stage',
    currentStageId: '1-1',   // Current stage ID for save system
    stageTime: 0,            // seconds elapsed in current stage
    coinsCollected: 0,

    // Transition lock — blocks input during iris-wipe
    transitioning: false,

    init() {
        this.current = this.TITLE;
        this.previous = null;
        this.stageName = 'Test Stage';
        this.currentStageId = '1-1';
        this.stageTime = 0;
        this.coinsCollected = 0;
        this.transitioning = false;
    },

    /**
     * Transition to a new state with iris-wipe effect.
     * The callback (state setup) fires at the midpoint when screen is fully black.
     */
    transitionTo(newState, setupFn) {
        if (this.transitioning) return;
        this.transitioning = true;

        Transition.start(() => {
            // Midpoint — screen is fully black
            this.previous = this.current;
            this.current = newState;

            if (setupFn) setupFn();
        }, () => {
            // Complete — transition finished
            this.transitioning = false;
        });
    },

    /**
     * Instant state change (no transition) — used for pause/unpause.
     */
    changeTo(newState) {
        this.previous = this.current;
        this.current = newState;
    },

    // =============================================
    // STATE SETUP FUNCTIONS
    // =============================================

    setupTitle() {
        Menu.initTitle();
    },

    setupWorldMap() {
        WorldMap.init();
    },

    setupStage() {
        Level.init();
        Particles.init();
        Enemies.init();
        Player.init();
        Camera.init();
        Camera.x = Player.x - CANVAS_WIDTH / 2;
        Camera.y = Player.y - CANVAS_HEIGHT / 2;
        const maxX = Level.width * TILE_SIZE - CANVAS_WIDTH;
        const maxY = Level.height * TILE_SIZE - CANVAS_HEIGHT;
        Camera.x = Math.max(0, Math.min(Camera.x, maxX));
        Camera.y = Math.max(0, Math.min(Camera.y, maxY));
        this.stageTime = 0;
        this.coinsCollected = 0;

        // Initialize collectibles for this stage
        Collectibles.init(
            Level.coinPositions || [],
            Level.healthPositions || []
        );

        // Spawn enemies from level data
        if (Level.enemySpawns) {
            for (const spawn of Level.enemySpawns) {
                Enemies.spawn(spawn.type, spawn.x, spawn.y);
            }
        }
    },

    restartStage() {
        Level.init();
        Particles.init();
        Enemies.init();
        Player.init();
        Camera.init();
        Camera.x = Player.x - CANVAS_WIDTH / 2;
        Camera.y = Player.y - CANVAS_HEIGHT / 2;
        const maxX = Level.width * TILE_SIZE - CANVAS_WIDTH;
        const maxY = Level.height * TILE_SIZE - CANVAS_HEIGHT;
        Camera.x = Math.max(0, Math.min(Camera.x, maxX));
        Camera.y = Math.max(0, Math.min(Camera.y, maxY));
        this.stageTime = 0;
        this.coinsCollected = 0;
        // Re-initialize collectibles
        Collectibles.init(
            Level.coinPositions || [],
            Level.healthPositions || []
        );

        // Spawn enemies
        if (Level.enemySpawns) {
            for (const spawn of Level.enemySpawns) {
                Enemies.spawn(spawn.type, spawn.x, spawn.y);
            }
        }
    },

    setupGameOver() {
        Menu.initGameOver();
    },

    setupStageComplete() {
        // Get total coins for this stage
        const stageInfo = WorldMap.STAGES.find(s => s.id === this.currentStageId);
        const totalCoins = stageInfo ? stageInfo.totalCoins : Collectibles.totalCoins;
        Menu.initStageComplete(this.stageTime, this.coinsCollected, totalCoins);

        // Record completion in save system
        WorldMap.completeStage(this.currentStageId, this.stageTime, this.coinsCollected);
    },

    // =============================================
    // UPDATE DISPATCH
    // =============================================
    update() {
        // Always update transition if active
        if (Transition.active) {
            Transition.update();
        }

        switch (this.current) {
            case this.TITLE:
                this._updateTitle();
                break;
            case this.CONTROLS:
                this._updateControls();
                break;
            case this.WORLD_MAP:
                this._updateWorldMap();
                break;
            case this.STAGE:
                this._updateStage();
                break;
            case this.PAUSED:
                this._updatePaused();
                break;
            case this.GAME_OVER:
                this._updateGameOver();
                break;
            case this.STAGE_COMPLETE:
                this._updateStageComplete();
                break;
        }
    },

    // =============================================
    // RENDER DISPATCH
    // =============================================
    render(ctx) {
        switch (this.current) {
            case this.TITLE:
                Menu.renderTitle(ctx);
                break;
            case this.CONTROLS:
                Menu.renderControls(ctx);
                break;
            case this.WORLD_MAP:
                WorldMap.render(ctx);
                break;
            case this.STAGE:
                this._renderStage(ctx);
                break;
            case this.PAUSED:
                this._renderStage(ctx);
                Menu.renderPause(ctx);
                break;
            case this.GAME_OVER:
                this._renderStage(ctx);
                Menu.renderGameOver(ctx);
                break;
            case this.STAGE_COMPLETE:
                this._renderStage(ctx);
                Menu.renderStageComplete(ctx);
                break;
        }

        // Always render transition overlay on top
        if (Transition.active) {
            Transition.render(ctx);
        }
    },

    // =============================================
    // STATE UPDATE IMPLEMENTATIONS
    // =============================================

    _updateTitle() {
        if (this.transitioning) return;
        Input.update();
        Menu.updateTitle();
    },

    _updateControls() {
        if (this.transitioning) return;
        Input.update();
        Menu.updateControls();
    },

    _updateWorldMap() {
        if (this.transitioning) return;
        Input.update();
        WorldMap.update();
    },

    _updateStage() {
        if (this.transitioning) return;

        Input.update();

        // Pause
        if (Input.isJustPressed('Escape')) {
            this.changeTo(this.PAUSED);
            Menu.initPause();
            return;
        }

        // Stage timer
        this.stageTime += 1 / 60;

        // Normal gameplay update
        Level.updateMovingPlatforms();
        Level.updateCrumblingTiles();
        // Desert mechanics
        if (Level.quicksandTiles.length > 0) Level.updateQuicksand();
        if (Level.waterTiles.length > 0) Level.updateWater();
        if (Level.pressurePlates.length > 0) Level.updatePressurePlates();
        if (Level.mirrors.length > 0) Level.updateMirrors();
        Player.update();
        Enemies.update();
        Enemies.checkPlayerAttackCollisions();
        Enemies.checkEnemyPlayerCollisions();
        Collectibles.update();
        Particles.update();
        Camera.update(Player);

        // Check boss arena trigger
        this._checkBossArena();

        // Check exit zone (only if boss is defeated or no boss)
        this._checkExitZone();

        // Check for game over
        if (Player.gameOver) {
            this.transitionTo(this.GAME_OVER, () => {
                this.setupGameOver();
            });
        }
    },

    _checkBossArena() {
        if (Level.bossTriggered || !Level.bossData) return;

        if (Player.x + Player.width > Level.bossArenaX) {
            Level.bossTriggered = true;

            // Spawn boss
            const bd = Level.bossData;
            Enemies.spawnBoss(bd.type, bd.spawnX, bd.spawnY);

            // Lock camera to arena
            Camera.lockToArena(Level.bossArenaX, Level.width * TILE_SIZE);

            // Place a wall tile at arena entrance to prevent exit
            const wallCol = Math.floor(Level.bossArenaX / TILE_SIZE);
            for (let r = 0; r < Level.height - 3; r++) {
                if (Level.getTile(wallCol, r) === TILE_EMPTY) {
                    Level.setTile(wallCol, r, TILE_SOLID);
                }
            }

            // Push player into arena if needed
            if (Player.x < Level.bossArenaX + TILE_SIZE) {
                Player.x = Level.bossArenaX + TILE_SIZE;
            }
        }
    },

    _checkExitZone() {
        // Exit zone reached when near exitX/exitY
        if (!Level.exitX) return;

        // Don't check exit if boss is alive
        if (Enemies.boss) return;

        // Check if player is near exit
        const dx = Math.abs(Player.x - Level.exitX);
        const dy = Math.abs(Player.y - Level.exitY);

        if (dx < TILE_SIZE * 2 && dy < TILE_SIZE * 3) {
            // Only transition if not already transitioning
            if (!this.transitioning && this.current === this.STAGE) {
                this.transitionTo(this.STAGE_COMPLETE, () => {
                    this.setupStageComplete();
                });
            }
        }
    },

    _updatePaused() {
        if (this.transitioning) return;
        Input.update();
        Menu.updatePause();
    },

    _updateGameOver() {
        if (this.transitioning) return;
        Input.update();
        Menu.updateGameOver();
    },

    _updateStageComplete() {
        if (this.transitioning) return;
        Input.update();
        Menu.updateStageComplete();
    },

    // =============================================
    // STAGE RENDER (shared by STAGE, PAUSED, GAME_OVER, STAGE_COMPLETE)
    // =============================================
    _renderStage(ctx) {
        Renderer.renderParallax();
        Renderer.renderTiles();
        Renderer.renderMovingPlatforms();
        // Desert-specific renders
        if (Level.mirrors.length > 0) Renderer.renderMirrors(ctx);
        Collectibles.render(ctx);
        Enemies.render(ctx);
        Renderer.renderPlayer(Player);
        Renderer.renderParticles();
        // Dark room overlay (after everything else, before HUD)
        if (Level.isDark) Renderer.renderDarkOverlay(ctx);
        HUD.render(ctx);
    }
};
