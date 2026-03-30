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
    VICTORY: 'VICTORY',

    // Current state
    current: 'TITLE',
    previous: null,

    // Stage info
    stageName: 'Test Stage',
    currentStageId: '1-1',   // Current stage ID for save system
    stageTime: 0,            // seconds elapsed in current stage
    coinsCollected: 0,

    // Death tracking (persists across stages for victory screen)
    totalDeaths: 0,
    deathCount: 0,

    // Accumulated stats for victory screen
    totalTime: 0,
    totalCoins: 0,

    // Transition lock — blocks input during iris-wipe
    transitioning: false,

    init() {
        this.current = this.TITLE;
        this.previous = null;
        this.stageName = 'Test Stage';
        this.currentStageId = '1-1';
        this.stageTime = 0;
        this.coinsCollected = 0;
        this.totalDeaths = 0;
        this.deathCount = 0;
        this.totalTime = 0;
        this.totalCoins = 0;
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
        AudioManager.stopAmbient();
        AudioManager.stopBossMusic();
    },

    setupWorldMap() {
        WorldMap.init();
        AudioManager.stopAmbient();
        AudioManager.stopBossMusic();
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

        // Start world-appropriate ambient audio
        const worldThemes = ['forest', 'desert', 'tundra', 'volcano', 'volcano'];
        const stageInfo = WorldMap.STAGES.find(s => s.id === this.currentStageId);
        const worldIndex = stageInfo ? stageInfo.world : 0;
        const worldTheme = worldThemes[worldIndex] || 'forest';
        AudioManager.stopBossMusic();
        AudioManager.startAmbient(worldTheme);
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

        // Restart ambient audio for this world
        const worldThemes = ['forest', 'desert', 'tundra', 'volcano', 'volcano'];
        const stageInfo = WorldMap.STAGES.find(s => s.id === this.currentStageId);
        const worldIndex = stageInfo ? stageInfo.world : 0;
        const worldTheme = worldThemes[worldIndex] || 'forest';
        AudioManager.stopBossMusic();
        AudioManager.startAmbient(worldTheme);
    },

    setupGameOver() {
        Menu.initGameOver();
        AudioManager.stopAmbient();
        AudioManager.stopBossMusic();
        AudioManager.playGameOver();
    },

    setupStageComplete() {
        // Get total coins for this stage
        const stageInfo = WorldMap.STAGES.find(s => s.id === this.currentStageId);
        const totalCoins = stageInfo ? stageInfo.totalCoins : Collectibles.totalCoins;
        Menu.initStageComplete(this.stageTime, this.coinsCollected, totalCoins);

        // Record completion in save system
        WorldMap.completeStage(this.currentStageId, this.stageTime, this.coinsCollected);

        // Audio: stage clear jingle + stop ambient
        AudioManager.stopAmbient();
        AudioManager.stopBossMusic();
        AudioManager.playStageClear();
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
            case this.VICTORY:
                this._updateVictory();
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
            case this.VICTORY:
                Menu.renderVictory(ctx);
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
        // Tundra mechanics
        if (Level.iceBlocks.length > 0) {
            Level.updateIceBlocks();
            // Check player-ice block push interaction
            for (const block of Level.iceBlocks) {
                if (block.melted || block.sliding) continue;
                const bx = block.x, by = block.y;
                if (Player.x + Player.width > bx && Player.x < bx + 32 &&
                    Player.y + Player.height > by && Player.y < by + 32) {
                    // Player is touching block — push it
                    const pushDir = Player.x + Player.width / 2 < bx + 16 ? 1 : -1;
                    Level.pushIceBlock(block, pushDir);
                }
            }
        }
        if (Level.meltableBlocks.length > 0) Level.updateMeltableBlocks();
        // Volcano mechanics
        if (Level.lavaLevel !== null || Level.chains.length > 0) {
            Level.update(1 / 60);
        }
        Player.update();
        Enemies.update();
        Enemies.checkPlayerAttackCollisions();
        Enemies.checkEnemyPlayerCollisions();
        Collectibles.update();
        Particles.update();
        Camera.update(Player);

        // Auto-scroll kill boundary (C-23: stage 3-3 Avalanche Peak)
        if (Camera.autoScroll && !Camera.locked) {
            const killBoundary = Camera.autoScrollX - TILE_SIZE;
            if (Player.x + Player.width < killBoundary) {
                // Player fell behind the auto-scroll — take damage
                if (!Player.invincible && Player.state !== 'dead' && Player.state !== 'hurt') {
                    Player.takeDamage();
                }
            }
        }

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

    setupVictory() {
        // Record stage completion in save system (same as stage complete)
        const stageInfo = WorldMap.STAGES.find(s => s.id === this.currentStageId);
        const totalCoins = stageInfo ? stageInfo.totalCoins : Collectibles.totalCoins;
        WorldMap.completeStage(this.currentStageId, this.stageTime, this.coinsCollected);

        // Calculate total stats from save data
        const saveData = SaveSystem.load();
        let accTime = 0;
        let accCoins = 0;
        for (const sid of saveData.completedStages) {
            if (saveData.bestTimes[sid]) accTime += saveData.bestTimes[sid];
            if (saveData.coinRecords[sid]) accCoins += saveData.coinRecords[sid];
        }
        this.totalTime = accTime;
        this.totalCoins = accCoins;

        // Audio: stop stage sounds, play victory jingle
        AudioManager.stopAmbient();
        AudioManager.stopBossMusic();
        AudioManager.playStageClear();

        // Initialize victory screen
        Menu.initVictory(this.totalTime, this.totalCoins, this.totalDeaths);
    },

    _updateVictory() {
        if (this.transitioning) return;
        Input.update();
        Menu.updateVictory();
    },

    // Public helper for player death callback
    _onPlayerDeath() {
        this.totalDeaths = (this.totalDeaths || 0) + 1;
        this.deathCount = (this.deathCount || 0) + 1;
    },

    // =============================================
    // STAGE RENDER (shared by STAGE, PAUSED, GAME_OVER, STAGE_COMPLETE)
    // =============================================
    _renderStage(ctx) {
        // Apply screen shake offset to all game rendering
        const shaking = Camera.shakeX !== 0 || Camera.shakeY !== 0;
        if (shaking) {
            ctx.save();
            ctx.translate(Camera.shakeX, Camera.shakeY);
        }

        Renderer.renderParallax();
        Renderer.renderTiles();
        // Tundra-specific renders
        if (Level.iceBlocks && Level.iceBlocks.length > 0) Renderer.renderIceBlocks(ctx);
        if (Level.fireSources && Level.fireSources.length > 0) Renderer.renderFireSources(ctx);
        if (Level.meltableBlocks && Level.meltableBlocks.length > 0) Renderer.renderMeltableBlocks(ctx);
        // Volcano-specific renders
        if (Level.chains && Level.chains.length > 0) Renderer.renderChains(ctx);
        if (Level.valves && Level.valves.length > 0) Renderer.renderValves(ctx);
        Renderer.renderRisingLava(ctx);
        Renderer.renderMovingPlatforms();
        // Desert-specific renders
        if (Level.mirrors.length > 0) Renderer.renderMirrors(ctx);
        Collectibles.render(ctx);
        Enemies.render(ctx);
        Renderer.renderPlayer(Player);
        Renderer.renderParticles();
        // Snow overlay for tundra (above everything except HUD)
        Renderer.updateAndRenderSnow();
        // Ember overlay for volcano (above everything except HUD)
        Renderer.updateAndRenderEmbers();
        // Forest leaf overlay
        Renderer.updateAndRenderLeaves();
        // Desert sand overlay
        Renderer.updateAndRenderSand();
        // Dark room overlay (after everything else, before HUD)
        if (Level.isDark) Renderer.renderDarkOverlay(ctx);

        // Restore canvas state before rendering HUD (HUD should not shake)
        if (shaking) {
            ctx.restore();
        }

        HUD.render(ctx);
    }
};
