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
    },

    restartStage() {
        Level.init();
        Particles.init();
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
        Player.update();
        Collectibles.update();
        Particles.update();
        Camera.update(Player);

        // Check for game over
        if (Player.gameOver) {
            this.transitionTo(this.GAME_OVER, () => {
                this.setupGameOver();
            });
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
        Collectibles.render(ctx);
        Renderer.renderPlayer(Player);
        Renderer.renderParticles();
        HUD.render(ctx);
    }
};
