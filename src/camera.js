// ============================================================
// camera.js — Camera with smooth follow, dead zone, clamping, parallax
// Supports arena lock for boss fights
// ============================================================

const Camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    shakeX: 0,
    shakeY: 0,

    // Arena lock for boss fights
    locked: false,
    arenaLeft: 0,
    arenaRight: 0,
    arenaLock: false,
    minX: null,
    maxX: null,

    // Parallax layers (Forest theme)
    layers: [],
    parallaxLayers: [], // Alias for test access

    init() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.locked = false;
        this.arenaLock = false;
        this.arenaLeft = 0;
        this.arenaRight = 0;
        this.minX = null;
        this.maxX = null;

        // Create 4 parallax layers for Forest
        this.layers = [
            { speed: 0.05, color1: '#0D1B0E', color2: '#1A3A15', elements: this._generateMountains() },
            { speed: 0.15, color1: '#1A3A15', color2: '#2D5A27', elements: this._generateFarTrees() },
            { speed: 0.3, color1: '#2D5A27', color2: '#4A8C3F', elements: this._generateMidTrees() },
            { speed: 0.5, color1: '#3A6B30', color2: '#4A8C3F', elements: this._generateForegroundLeaves() }
        ];
        this.parallaxLayers = this.layers;
    },

    lockToArena(left, right) {
        this.locked = true;
        this.arenaLock = true;
        this.arenaLeft = left;
        this.arenaRight = right;
        this.minX = left;
        this.maxX = right - CANVAS_WIDTH;
        if (this.maxX < this.minX) this.maxX = this.minX;
    },

    unlock() {
        this.locked = false;
        this.arenaLock = false;
        this.minX = null;
        this.maxX = null;
    },

    update(targetEntity) {
        // Horizontal: smooth follow
        this.targetX = targetEntity.x + targetEntity.width / 2 - CANVAS_WIDTH / 2;

        // Smooth interpolation
        this.x += (this.targetX - this.x) * CAMERA_SMOOTH;

        // Vertical: dead zone
        const entityScreenY = targetEntity.y - this.y;
        const topThreshold = CANVAS_HEIGHT * CAMERA_DEADZONE_TOP;
        const bottomThreshold = CANVAS_HEIGHT * (1 - CAMERA_DEADZONE_BOTTOM);

        if (entityScreenY < topThreshold) {
            this.targetY = targetEntity.y - topThreshold;
        } else if (entityScreenY + targetEntity.height > bottomThreshold) {
            this.targetY = targetEntity.y + targetEntity.height - bottomThreshold;
        }

        this.y += (this.targetY - this.y) * CAMERA_SMOOTH;

        // Arena lock bounds
        if (this.locked) {
            if (this.minX !== null && this.x < this.minX) this.x = this.minX;
            if (this.maxX !== null && this.x > this.maxX) this.x = this.maxX;
        }

        // Clamp to level bounds
        const levelMaxX = Level.width * TILE_SIZE - CANVAS_WIDTH;
        const levelMaxY = Level.height * TILE_SIZE - CANVAS_HEIGHT;

        if (this.x < 0) this.x = 0;
        if (this.x > levelMaxX) this.x = levelMaxX;
        if (this.y < 0) this.y = 0;
        if (this.y > levelMaxY) this.y = levelMaxY;
    },

    _generateMountains() {
        const mountains = [];
        for (let i = 0; i < 15; i++) {
            mountains.push({
                x: i * 200 - 100,
                width: 180 + Math.random() * 120,
                height: 100 + Math.random() * 120,
                shade: Math.random() * 0.3
            });
        }
        return mountains;
    },

    _generateFarTrees() {
        const trees = [];
        for (let i = 0; i < 60; i++) {
            trees.push({
                x: i * 80 + Math.random() * 30,
                height: 80 + Math.random() * 80,
                width: 30 + Math.random() * 25,
                trunk: 8 + Math.random() * 6
            });
        }
        return trees;
    },

    _generateMidTrees() {
        const trees = [];
        for (let i = 0; i < 50; i++) {
            trees.push({
                x: i * 100 + Math.random() * 40,
                height: 100 + Math.random() * 60,
                width: 40 + Math.random() * 30,
                trunk: 10 + Math.random() * 8
            });
        }
        return trees;
    },

    _generateForegroundLeaves() {
        const leaves = [];
        for (let i = 0; i < 80; i++) {
            leaves.push({
                x: i * 60 + Math.random() * 40,
                y: Math.random() * 200,
                size: 8 + Math.random() * 16,
                rotation: Math.random() * Math.PI * 2,
                drift: Math.random() * 0.01
            });
        }
        return leaves;
    }
};
