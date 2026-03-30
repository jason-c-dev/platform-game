// ============================================================
// input.js — Keyboard input handling
// ============================================================

const Input = {
    keys: {},
    _pressQueue: {},   // Keys pressed since last update (survives rapid press/release)
    _releaseQueue: {},
    justPressed: {},
    justReleased: {},
    _prevKeys: {},

    init() {
        this.keys = {};
        this._pressQueue = {};
        this._releaseQueue = {};
        this.justPressed = {};
        this.justReleased = {};
        this._prevKeys = {};

        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                 'z', 'Z', 'x', 'X', 'Shift', 'Escape', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
            }
            if (!this.keys[e.key]) {
                this._pressQueue[e.key] = true;
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this._releaseQueue[e.key] = true;
            this.keys[e.key] = false;
        });
    },

    update() {
        // justPressed = keys that were pressed since last update
        this.justPressed = Object.assign({}, this._pressQueue);
        this.justReleased = Object.assign({}, this._releaseQueue);

        // Clear queues
        this._pressQueue = {};
        this._releaseQueue = {};

        // Store previous state
        this._prevKeys = Object.assign({}, this.keys);
    },

    isDown(key) {
        return !!this.keys[key];
    },

    isJustPressed(key) {
        return !!this.justPressed[key];
    },

    isLeft() {
        return this.isDown('ArrowLeft');
    },

    isRight() {
        return this.isDown('ArrowRight');
    },

    isJump() {
        return this.isJustPressed('z') || this.isJustPressed('Z');
    },

    isJumpHeld() {
        return this.isDown('z') || this.isDown('Z');
    }
};
