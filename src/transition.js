// ============================================================
// transition.js — Iris-wipe screen transition
// Design spec: 500ms total (250ms close + 250ms open)
// Close: circle shrinks from diagonal to 0
// Open: circle expands from 0 to diagonal
// Easing: ease-in for close, ease-out for open
// ============================================================

const Transition = {
    active: false,
    phase: 'none',     // 'closing', 'hold', 'opening', 'none'
    timer: 0,
    duration: 0.25,    // seconds per phase (250ms)
    holdFrames: 0,     // 1 frame hold at black

    // Center point for the iris
    centerX: CANVAS_WIDTH / 2,
    centerY: CANVAS_HEIGHT / 2,

    // Max radius = canvas diagonal / 2
    maxRadius: Math.sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT) / 2,

    // Callbacks
    _onMidpoint: null,
    _onComplete: null,

    /**
     * Start an iris-wipe transition.
     * @param {Function} onMidpoint - Called when screen is fully black (state change here)
     * @param {Function} onComplete - Called when transition finishes
     */
    start(onMidpoint, onComplete) {
        this.active = true;
        this.phase = 'closing';
        this.timer = 0;
        this.holdFrames = 0;
        this._onMidpoint = onMidpoint || null;
        this._onComplete = onComplete || null;

        // Center on player if in gameplay, otherwise canvas center
        if (typeof Player !== 'undefined' && Player.x !== undefined &&
            GameState.current === GameState.STAGE) {
            this.centerX = Player.x + Player.width / 2 - Camera.x;
            this.centerY = Player.y + Player.height / 2 - Camera.y;
        } else {
            this.centerX = CANVAS_WIDTH / 2;
            this.centerY = CANVAS_HEIGHT / 2;
        }
    },

    update() {
        if (!this.active) return;

        const dt = 1 / 60;

        if (this.phase === 'closing') {
            this.timer += dt;
            if (this.timer >= this.duration) {
                this.timer = this.duration;
                this.phase = 'hold';
                this.holdFrames = 0;
                // Fire midpoint callback — state change happens here
                if (this._onMidpoint) {
                    this._onMidpoint();
                    this._onMidpoint = null;
                }
            }
        } else if (this.phase === 'hold') {
            this.holdFrames++;
            if (this.holdFrames >= 1) {
                this.phase = 'opening';
                this.timer = 0;
                // Re-center for new scene
                if (typeof Player !== 'undefined' && Player.x !== undefined &&
                    GameState.current === GameState.STAGE) {
                    this.centerX = Player.x + Player.width / 2 - Camera.x;
                    this.centerY = Player.y + Player.height / 2 - Camera.y;
                } else {
                    this.centerX = CANVAS_WIDTH / 2;
                    this.centerY = CANVAS_HEIGHT / 2;
                }
            }
        } else if (this.phase === 'opening') {
            this.timer += dt;
            if (this.timer >= this.duration) {
                this.timer = this.duration;
                this.phase = 'none';
                this.active = false;
                if (this._onComplete) {
                    this._onComplete();
                    this._onComplete = null;
                }
            }
        }
    },

    render(ctx) {
        if (!this.active) return;

        let radius;

        if (this.phase === 'closing') {
            // Ease-in: slow start, fast end
            const t = this.timer / this.duration;
            const eased = t * t; // quadratic ease-in
            radius = this.maxRadius * (1 - eased);
        } else if (this.phase === 'hold') {
            radius = 0;
        } else if (this.phase === 'opening') {
            // Ease-out: fast start, slow end
            const t = this.timer / this.duration;
            const eased = 1 - (1 - t) * (1 - t); // quadratic ease-out
            radius = this.maxRadius * eased;
        } else {
            return;
        }

        // Draw the iris wipe: fill everything OUTSIDE the circle with black
        ctx.save();
        ctx.fillStyle = '#000000';

        // Use a clipping path to create the iris effect
        ctx.beginPath();
        // Outer rect (full canvas)
        ctx.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        // Inner circle (counter-clockwise to cut out)
        if (radius > 0.5) {
            ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2, true);
        }
        ctx.fill('evenodd');

        ctx.restore();
    }
};
