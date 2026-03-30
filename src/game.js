// ============================================================
// game.js — Main game loop (fixed timestep)
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
        Level.init();
        Player.init();
        Camera.init();

        // Position camera initially
        Camera.x = Player.x - CANVAS_WIDTH / 2;
        Camera.y = Player.y - CANVAS_HEIGHT / 2;
        // Clamp
        const maxX = Level.width * TILE_SIZE - CANVAS_WIDTH;
        const maxY = Level.height * TILE_SIZE - CANVAS_HEIGHT;
        Camera.x = Math.max(0, Math.min(Camera.x, maxX));
        Camera.y = Math.max(0, Math.min(Camera.y, maxY));

        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.updateCount = 0;
        this.frameCount = 0;
        this.frameTimes = [];
        this.lastFrameTimestamp = performance.now();

        // Expose debug info globally
        window.__gameDebug = {
            updateCount: 0,
            frameCount: 0,
            fps: 60,
            frameTimes: this.frameTimes
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
        Input.update();
        Level.updateMovingPlatforms();
        Player.update();
        Camera.update(Player);
    },

    _render() {
        Renderer.clear();
        Renderer.renderParallax();
        Renderer.renderTiles();
        Renderer.renderMovingPlatforms();
        Renderer.renderPlayer(Player);
    }
};
