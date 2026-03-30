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

    // Auto-scroll for stage 3-3
    autoScroll: false,
    autoScrollSpeed: 0,
    autoScrollX: 0,

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
        this.autoScroll = false;
        this.autoScrollSpeed = 0;
        this.autoScrollX = 0;

        // Create 4 parallax layers (world-aware)
        const stageId = GameState.currentStageId || '1-1';
        const world = parseInt(stageId.charAt(0)) - 1;

        if (world === 4) {
            // Citadel parallax — blend of all world themes
            this.layers = [
                { speed: 0.05, color1: '#1A1A2E', color2: '#2D2D44', elements: this._generateMountains() },
                { speed: 0.15, color1: '#2D2D44', color2: '#3A2A1A', elements: this._generateFarTrees() },
                { speed: 0.3, color1: '#2D5A27', color2: '#C4943A', elements: this._generateMidTrees() },
                { speed: 0.5, color1: '#6B9CB8', color2: '#FF6A2A', elements: this._generateForegroundLeaves() }
            ];
        } else if (world === 3) {
            // Volcano parallax
            this.layers = [
                { speed: 0.05, color1: COLORS.volcano.darkStone, color2: COLORS.volcano.shadow, elements: this._generateMountains() },
                { speed: 0.15, color1: COLORS.volcano.shadow, color2: COLORS.volcano.darkRed, elements: this._generateFarTrees() },
                { speed: 0.3, color1: COLORS.volcano.darkRed, color2: COLORS.volcano.lavaOrange, elements: this._generateMidTrees() },
                { speed: 0.5, color1: COLORS.volcano.lavaOrange, color2: COLORS.volcano.moltenYellow, elements: this._generateForegroundLeaves() }
            ];
        } else if (world === 2) {
            // Tundra parallax
            this.layers = [
                { speed: 0.05, color1: COLORS.tundra.deepIce, color2: COLORS.tundra.shadow, elements: this._generateMountains() },
                { speed: 0.15, color1: COLORS.tundra.shadow, color2: COLORS.tundra.deepIce, elements: this._generateFarTrees() },
                { speed: 0.3, color1: COLORS.tundra.iceBlue, color2: COLORS.tundra.snowWhite, elements: this._generateMidTrees() },
                { speed: 0.5, color1: COLORS.tundra.snowWhite, color2: COLORS.tundra.auroraGreen, elements: this._generateForegroundLeaves() }
            ];
            // Enable auto-scroll for stage 3-3
            if (stageId === '3-3') {
                this.autoScroll = true;
                this.autoScrollSpeed = 1.2;
                this.autoScrollX = 0;
            }
        } else if (world === 1) {
            // Desert parallax
            this.layers = [
                { speed: 0.05, color1: '#B8843A', color2: '#8B6B2E', elements: this._generateMountains() },
                { speed: 0.15, color1: '#C4943A', color2: '#8B6B2E', elements: this._generateFarTrees() },
                { speed: 0.3, color1: '#D4B896', color2: '#C4943A', elements: this._generateMidTrees() },
                { speed: 0.5, color1: '#E8D4A0', color2: '#C4943A', elements: this._generateForegroundLeaves() }
            ];
        } else {
            // Forest parallax (default)
            this.layers = [
                { speed: 0.05, color1: '#0D1B0E', color2: '#1A3A15', elements: this._generateMountains() },
                { speed: 0.15, color1: '#1A3A15', color2: '#2D5A27', elements: this._generateFarTrees() },
                { speed: 0.3, color1: '#2D5A27', color2: '#4A8C3F', elements: this._generateMidTrees() },
                { speed: 0.5, color1: '#3A6B30', color2: '#4A8C3F', elements: this._generateForegroundLeaves() }
            ];
        }
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
        // Auto-scroll mode (stage 3-3)
        if (this.autoScroll && !this.locked) {
            this.autoScrollX += this.autoScrollSpeed;
            const levelMaxX = Level.width * TILE_SIZE - CANVAS_WIDTH;
            if (this.autoScrollX > levelMaxX) this.autoScrollX = levelMaxX;
            this.x = this.autoScrollX;

            // Vertical: still follow player
            const entityScreenY = targetEntity.y - this.y;
            const topThreshold = CANVAS_HEIGHT * CAMERA_DEADZONE_TOP;
            const bottomThreshold = CANVAS_HEIGHT * (1 - CAMERA_DEADZONE_BOTTOM);
            if (entityScreenY < topThreshold) {
                this.targetY = targetEntity.y - topThreshold;
            } else if (entityScreenY + targetEntity.height > bottomThreshold) {
                this.targetY = targetEntity.y + targetEntity.height - bottomThreshold;
            }
            this.y += (this.targetY - this.y) * CAMERA_SMOOTH;

            // Clamp vertical
            const levelMaxY = Level.height * TILE_SIZE - CANVAS_HEIGHT;
            if (this.y < 0) this.y = 0;
            if (this.y > levelMaxY) this.y = levelMaxY;

            // Damage/kill player if they fall behind the left edge
            if (targetEntity.x + targetEntity.width < this.x - 16) {
                if (targetEntity.state !== 'dead' && targetEntity.state !== 'hurt') {
                    targetEntity.takeDamage();
                }
            }
            return;
        }

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
