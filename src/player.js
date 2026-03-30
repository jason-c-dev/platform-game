// ============================================================
// player.js — Player entity (test entity for Sprint 1)
// ============================================================

const Player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    facing: 1, // 1 = right, -1 = left
    invincible: false,
    invincibleTimer: 0,
    respawnX: 0,
    respawnY: 0,

    init() {
        this.x = Level.spawnX;
        this.y = Level.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.respawnX = Level.spawnX;
        this.respawnY = Level.spawnY;
    },

    update() {
        // Gather input
        let inputDir = 0;
        if (Input.isLeft()) inputDir = -1;
        if (Input.isRight()) inputDir = 1;

        // Update facing direction
        if (inputDir !== 0) {
            this.facing = inputDir;
        }

        // Jump
        if (Input.isJump() && this.onGround) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }

        // Apply physics
        Physics.applyGravity(this);
        Physics.applyMovement(this, inputDir);

        // Resolve collisions
        const collisions = Physics.resolveCollisions(this);

        // Handle hazard contact
        if (collisions.hazard && !this.invincible) {
            this._takeDamage();
        }

        // Handle moving platform carry
        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        // Invincibility timer
        if (this.invincible) {
            this.invincibleTimer -= 1 / 60;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.invincibleTimer = 0;
            }
        }

        // Fall off bottom of level — respawn
        if (this.y > Level.height * TILE_SIZE + 100) {
            this._respawn();
        }
    },

    _takeDamage() {
        this.invincible = true;
        this.invincibleTimer = 1.5;
        // Knockback
        this.vy = -6;
        this.vx = -this.facing * 3;
    },

    _respawn() {
        this.x = this.respawnX;
        this.y = this.respawnY;
        this.vx = 0;
        this.vy = 0;
        this.invincible = true;
        this.invincibleTimer = 1.0;
    }
};
