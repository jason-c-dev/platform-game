// ============================================================
// game.js — Main game loop (fixed timestep) with state machine
// ============================================================

const Game = {
    lastTime: 0,
    accumulator: 0,
    updateCount: 0,
    frameCount: 0,
    running: false,
    frameTimes: [],
    lastFrameTimestamp: 0,

    init() {
        Renderer.init();
        Input.init();
        HUD.init();
        GameState.init();
        Menu.initTitle();
        Transition.active = false;

        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.updateCount = 0;
        this.frameCount = 0;
        this.frameTimes = [];
        this.lastFrameTimestamp = performance.now();

        // Expose debug info globally for testing
        window.__gameDebug = {
            updateCount: 0,
            frameCount: 0,
            fps: 60,
            frameTimes: this.frameTimes,
            // Game state exposure (C-24)
            get gameState() { return GameState.current; },
            get currentState() { return GameState.current; },
            get state() { return GameState.current; },
            getPlayer: () => ({
                x: Player.x,
                y: Player.y,
                vx: Player.vx,
                vy: Player.vy,
                onGround: Player.onGround,
                facing: Player.facing,
                invincible: Player.invincible,
                invincibleTimer: Player.invincibleTimer,
                width: Player.width,
                height: Player.height,
                state: Player.state,
                prevState: Player.prevState,
                hp: Player.hp,
                lives: Player.lives,
                gameOver: Player.gameOver,
                animFrame: Player.animFrame,
                coyoteTimer: Player.coyoteTimer,
                jumpBufferTimer: Player.jumpBufferTimer,
                attackTimer: Player.attackTimer,
                chargeTimer: Player.chargeTimer,
                isCharging: Player.isCharging,
                wallDir: Player.wallDir,
                deathTimer: Player.deathTimer
            }),
            getCamera: () => ({
                x: Camera.x,
                y: Camera.y
            }),
            getLevelSize: () => ({
                width: Level.width,
                height: Level.height,
                pixelWidth: Level.width * TILE_SIZE,
                pixelHeight: Level.height * TILE_SIZE
            }),
            getParticleCount: () => Particles.particles.length,
            setPlayerPos: (x, y) => {
                Player.x = x;
                Player.y = y;
                Player.vx = 0;
                Player.vy = 0;
            },
            setPlayerState: (state) => {
                Player.state = state;
            },
            setPlayerHP: (hp) => {
                Player.hp = hp;
            },
            setPlayerLives: (lives) => {
                Player.lives = lives;
            },
            // State machine helpers for testing
            triggerGameOver: () => {
                Player.hp = 0;
                Player.lives = 0;
                Player.gameOver = true;
                GameState.transitionTo(GameState.GAME_OVER, () => {
                    GameState.setupGameOver();
                });
            },
            triggerStageComplete: () => {
                GameState.transitionTo(GameState.STAGE_COMPLETE, () => {
                    GameState.setupStageComplete();
                });
            },
            // World map utilities (Sprint 4)
            unlockAllStages: () => {
                WorldMap.unlockAllStages();
            },
            getSelectedNode: () => {
                const node = WorldMap.getSelectedNode();
                return node ? {
                    stageId: node.stageId,
                    name: node.name,
                    world: node.world,
                    unlocked: node.unlocked,
                    completed: node.completed,
                    x: node.x,
                    y: node.y
                } : null;
            },
            setSaveData: (data) => {
                SaveSystem.save(data);
            },
            getSaveData: () => {
                return SaveSystem.load();
            },
            clearSaveData: () => {
                SaveSystem.clearSave();
            },
            setSelectedNode: (index) => {
                if (index >= 0 && index < WorldMap.nodes.length) {
                    WorldMap.selectedNode = index;
                }
            },
            getWorldMapNodes: () => {
                return WorldMap.nodes.map(n => ({
                    stageId: n.stageId,
                    name: n.name,
                    unlocked: n.unlocked,
                    completed: n.completed,
                    x: n.x,
                    y: n.y
                }));
            },
            transitionTo: (state) => {
                GameState.transitionTo(state);
            },
            getTile: (col, row) => Level.getTile(col, row),
            setTile: (col, row, type) => Level.setTile(col, row, type),
            TILE_SIZE: TILE_SIZE,
            CANVAS_WIDTH: CANVAS_WIDTH,
            CANVAS_HEIGHT: CANVAS_HEIGHT,
            PLAYER_WIDTH: PLAYER_WIDTH,
            PLAYER_HEIGHT: PLAYER_HEIGHT,
            PLAYER_CROUCH_HEIGHT: PLAYER_CROUCH_HEIGHT,
            constants: {
                WALK_MAX_SPEED,
                RUN_MAX_SPEED,
                WALL_SLIDE_SPEED,
                WALL_JUMP_VX,
                WALL_JUMP_VY,
                JUMP_FORCE,
                BOUNCE_FORCE,
                COYOTE_FRAMES,
                JUMP_BUFFER_FRAMES,
                ATTACK_DURATION,
                CHARGE_TIME,
                PLAYER_MAX_HP,
                PLAYER_START_LIVES,
                INVINCIBILITY_TIME,
                RESPAWN_DELAY
            }
        };

        this._loop(performance.now());
    },

    _loop(timestamp) {
        if (!this.running) return;

        const now = timestamp;
        let dt = now - this.lastTime;
        this.lastTime = now;

        // Track frame times for perf monitoring
        const frameDelta = now - this.lastFrameTimestamp;
        this.lastFrameTimestamp = now;
        this.frameTimes.push(frameDelta);
        if (this.frameTimes.length > 300) {
            this.frameTimes.shift();
        }

        // Cap dt to prevent spiral of death
        if (dt > FIXED_TIMESTEP * MAX_FRAME_SKIP) {
            dt = FIXED_TIMESTEP * MAX_FRAME_SKIP;
        }

        this.accumulator += dt;

        // Fixed-timestep updates
        let updates = 0;
        while (this.accumulator >= FIXED_TIMESTEP && updates < MAX_FRAME_SKIP) {
            this._update();
            this.accumulator -= FIXED_TIMESTEP;
            this.updateCount++;
            updates++;
        }

        // Render
        this._render();
        this.frameCount++;

        // Update debug info
        window.__gameDebug.updateCount = this.updateCount;
        window.__gameDebug.frameCount = this.frameCount;
        if (this.frameTimes.length > 10) {
            const recentAvg = this.frameTimes.slice(-60).reduce((a, b) => a + b, 0) / Math.min(60, this.frameTimes.length);
            window.__gameDebug.fps = Math.round(1000 / recentAvg);
        }

        requestAnimationFrame((ts) => this._loop(ts));
    },

    _update() {
        // All update logic delegated to state machine
        GameState.update();
    },

    _render() {
        Renderer.clear();
        // All render logic delegated to state machine
        GameState.render(Renderer.ctx);
    }
};
