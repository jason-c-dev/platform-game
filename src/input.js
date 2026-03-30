// ============================================================
// input.js — Keyboard input handling
// ============================================================

const Input = {
    keys: {},
    justPressed: {},
    justReleased: {},
    _prevKeys: {},

    init() {
        this.keys = {};
        this.justPressed = {};
        this.justReleased = {};
        this._prevKeys = {};

        window.addEventListener('keydown', (e) => {
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'z', 'Z', 'x', 'X', 'Shift', 'Escape', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
            }
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    },

    update() {
        // Compute justPressed / justReleased
        this.justPressed = {};
        this.justReleased = {};
        for (const key in this.keys) {
            if (this.keys[key] && !this._prevKeys[key]) {
                this.justPressed[key] = true;
            }
            if (!this.keys[key] && this._prevKeys[key]) {
                this.justReleased[key] = true;
            }
        }
        for (const key in this._prevKeys) {
            if (!this.keys[key] && this._prevKeys[key]) {
                this.justReleased[key] = true;
            }
        }
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
