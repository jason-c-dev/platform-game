// ============================================================
// player.js — Player entity with full state machine
// States: idle, walk, run, jump, fall, wallSlide, crouch,
//         crouchSlide, attack, chargeAttack, jumpAttack, hurt, dead
// ============================================================

const Player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    onGround: false,
    onIce: false,
    icePhysics: false,
    facing: 1, // 1 = right, -1 = left
    invincible: false,
    invincibleTimer: 0,
    respawnX: 0,
    respawnY: 0,

    // State machine
    state: 'idle',
    prevState: 'idle',

    // Health / lives
    hp: PLAYER_MAX_HP,
    lives: PLAYER_START_LIVES,
    gameOver: false,

    // Animation
    animFrame: 0,
    animTimer: 0,
    stateTimer: 0,

    // Jump assist
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    _prevVy: 0,
    _wasOnGround: false,

    // Combat
    attackTimer: 0,
    chargeTimer: 0,
    isCharging: false,

    // Variable jump
    _jumpCut: false,

    // Wall slide
    wallDir: 0, // -1 = wall on left, 1 = wall on right

    // Crouch slide
    slideVx: 0,

    // Death/respawn
    deathTimer: 0,

    // Desert mechanics
    inQuicksand: false,
    inWater: false,

    init() {
        this.x = Level.spawnX;
        this.y = Level.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.onGround = false;
        this.onIce = false;
        this.icePhysics = false;
        this.facing = 1;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.respawnX = Level.spawnX;
        this.respawnY = Level.spawnY;
        this.state = 'idle';
        this.prevState = 'idle';
        this.hp = PLAYER_MAX_HP;
        this.lives = PLAYER_START_LIVES;
        this.gameOver = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.stateTimer = 0;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this._prevVy = 0;
        this._wasOnGround = false;
        this.attackTimer = 0;
        this.chargeTimer = 0;
        this.isCharging = false;
        this._jumpCut = false;
        this.wallDir = 0;
        this.slideVx = 0;
        this.deathTimer = 0;
        this.inQuicksand = false;
        this.inWater = false;
    },

    // =============================================
    // MAIN UPDATE
    // =============================================
    update() {
        // Terminal states block all other logic
        if (this.state === 'dead') {
            this._updateDead();
            return;
        }

        if (this.gameOver) return;

        // Gather input
        let inputDir = 0;
        if (Input.isLeft()) inputDir = -1;
        if (Input.isRight()) inputDir = 1;

        // Track previous values for landing detection
        this._prevVy = this.vy;
        this._wasOnGround = this.onGround;

        // ---- Hurt state has limited control ----
        if (this.state === 'hurt') {
            this._updateHurt();
            return;
        }

        // ---- Jump buffer ----
        if (Input.isJump()) {
            this.jumpBufferTimer = JUMP_BUFFER_FRAMES;
        }
        if (this.jumpBufferTimer > 0) {
            this.jumpBufferTimer--;
        }

        // ---- Coyote time ----
        if (this.onGround) {
            this.coyoteTimer = COYOTE_FRAMES;
        } else {
            if (this.coyoteTimer > 0) {
                this.coyoteTimer--;
            }
        }

        // ---- Handle crouch input ----
        if (Input.isCrouch() && this.onGround && this.state !== 'attack' && this.state !== 'chargeAttack') {
            if (this.state === 'run' && Math.abs(this.vx) >= CROUCH_SLIDE_MIN_SPEED) {
                // Initiate crouch slide from run
                this._enterCrouchSlide();
            } else if (this.state !== 'crouch' && this.state !== 'crouchSlide') {
                this._enterCrouch();
            }
        }

        // ---- State-specific updates ----
        switch (this.state) {
            case 'idle':
            case 'walk':
            case 'run':
                this._updateGroundMovement(inputDir);
                break;
            case 'jump':
            case 'fall':
                this._updateAirborne(inputDir);
                break;
            case 'wallSlide':
                this._updateWallSlide(inputDir);
                break;
            case 'crouch':
                this._updateCrouch(inputDir);
                break;
            case 'crouchSlide':
                this._updateCrouchSlide(inputDir);
                break;
            case 'attack':
                this._updateAttack(inputDir);
                break;
            case 'chargeAttack':
                this._updateChargeAttack(inputDir);
                break;
            case 'jumpAttack':
                this._updateJumpAttack(inputDir);
                break;
        }

        // ---- Invincibility timer ----
        if (this.invincible) {
            this.invincibleTimer -= 1 / 60;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.invincibleTimer = 0;
            }
        }

        // ---- Fall off bottom of level ----
        if (this.y > Level.height * TILE_SIZE + 100) {
            this._die();
        }

        // ---- Update animation frame ----
        this._updateAnimFrame();
    },

    // =============================================
    // GROUND MOVEMENT (idle / walk / run)
    // =============================================
    _updateGroundMovement(inputDir) {
        const isRunning = Input.isRun() && inputDir !== 0;
        const maxSpeed = isRunning ? RUN_MAX_SPEED : WALK_MAX_SPEED;

        // Update facing
        if (inputDir !== 0) {
            this.facing = inputDir;
        }

        // Attack input
        if (Input.isAttack()) {
            this._startAttack();
            return;
        }

        // Check for charge attack (hold X)
        if (Input.isAttackHeld() && this.isCharging) {
            this.chargeTimer++;
            if (this.chargeTimer >= CHARGE_TIME) {
                this._releaseChargeAttack();
                return;
            }
        } else if (Input.isAttackReleased() && this.isCharging) {
            // Released X before full charge — just do normal attack if timer > 0
            this.isCharging = false;
            this.chargeTimer = 0;
        }

        // Apply physics
        Physics.applyGravity(this);
        Physics.applyMovement(this, inputDir, maxSpeed);
        const collisions = Physics.resolveCollisions(this);

        // Handle hazard
        if (collisions.hazard && !this.invincible) {
            this.takeDamage();
            return;
        }

        // Handle moving platform carry
        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        // Handle bounce
        if (collisions.bounce) {
            this._changeState('jump');
            return;
        }

        // ---- Jump ----
        const canJump = this.onGround || this.coyoteTimer > 0;
        if (this.jumpBufferTimer > 0 && canJump) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            this._changeState('jump');
            return;
        }

        // ---- Detect landing (for dust particles) ----
        if (this.onGround && !this._wasOnGround && this._prevVy > 2) {
            Particles.spawnLandingDust(
                this.x + this.width / 2,
                this.y + this.height
            );
        }

        // ---- State transitions ----
        if (!this.onGround) {
            // Walked off a ledge
            if (this.vy > 0) {
                this._changeState('fall');
            } else {
                this._changeState('jump');
            }
        } else if (Math.abs(this.vx) > 0.5) {
            if (isRunning && Math.abs(this.vx) > WALK_MAX_SPEED * 0.8) {
                this._changeState('run');
                // Spawn run dust periodically
                this.stateTimer++;
                if (this.stateTimer % 6 === 0) {
                    Particles.spawnRunDust(
                        this.x + this.width / 2 - this.facing * 5,
                        this.y + this.height,
                        this.facing
                    );
                }
            } else {
                this._changeState('walk');
            }
        } else {
            this._changeState('idle');
        }
    },

    // =============================================
    // AIRBORNE (jump / fall)
    // =============================================
    _updateAirborne(inputDir) {
        // Update facing — but NOT immediately after a wall jump (preserve facing change)
        if (inputDir !== 0 && !(this.prevState === 'wallSlide' && this.stateTimer < 8)) {
            this.facing = inputDir;
        }

        // Variable jump — if Z not held while ascending, cut velocity (once)
        if (!Input.isJumpHeld() && this.vy < 0 && !this._jumpCut) {
            this.vy *= VARIABLE_JUMP_MULTIPLIER;
            this._jumpCut = true;
        }

        // ---- Coyote time jump — allows jumping briefly after walking off a ledge ----
        if (this.coyoteTimer > 0 && this.jumpBufferTimer > 0) {
            this.vy = JUMP_FORCE;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            this._changeState('jump');
            return;
        }

        // Attack in air triggers jump attack
        if (Input.isAttack()) {
            this._startJumpAttack();
            return;
        }

        // Apply physics
        Physics.applyGravity(this);
        Physics.applyMovement(this, inputDir, WALK_MAX_SPEED);
        const collisions = Physics.resolveCollisions(this);

        // Handle hazard
        if (collisions.hazard && !this.invincible) {
            this.takeDamage();
            return;
        }

        // Handle moving platform carry
        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        // Handle bounce
        if (collisions.bounce) {
            this._changeState('jump');
            return;
        }

        // ---- Wall slide detection ----
        if (!this.onGround && this.vy > 0 && inputDir !== 0) {
            if (inputDir > 0 && collisions.hitRight) {
                this.wallDir = 1;
                this._changeState('wallSlide');
                return;
            } else if (inputDir < 0 && collisions.hitLeft) {
                this.wallDir = -1;
                this._changeState('wallSlide');
                return;
            }
        }

        // ---- Jump buffer while airborne ----
        // (already handled in main update)

        // ---- Landing ----
        if (this.onGround) {
            // Landing dust
            if (this._prevVy > 2) {
                Particles.spawnLandingDust(
                    this.x + this.width / 2,
                    this.y + this.height
                );
            }
            // Check for buffered jump
            if (this.jumpBufferTimer > 0) {
                this.vy = JUMP_FORCE;
                this.onGround = false;
                this.jumpBufferTimer = 0;
                this._changeState('jump');
            } else if (Math.abs(this.vx) > 0.5) {
                this._changeState('walk');
            } else {
                this._changeState('idle');
            }
            return;
        }

        // ---- Air state transitions ----
        if (this.vy > 0) {
            this._changeState('fall');
        } else {
            this._changeState('jump');
        }
    },

    // =============================================
    // WALL SLIDE
    // =============================================
    _updateWallSlide(inputDir) {
        // Cap fall speed to wall slide speed
        this.vy = Math.min(this.vy + GRAVITY, WALL_SLIDE_SPEED);

        // Apply Y movement
        this.y += this.vy;

        // Resolve Y collisions
        const left = Math.floor(this.x / TILE_SIZE);
        const right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        if (this.vy > 0) {
            const bottomRow = Math.floor((this.y + this.height) / TILE_SIZE);
            for (let col = left; col <= right; col++) {
                const tile = Level.getTile(col, bottomRow);
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                    this.y = bottomRow * TILE_SIZE - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    break;
                }
            }
        }

        // Spawn sparks
        this.stateTimer++;
        if (this.stateTimer % 3 === 0) {
            const sparkX = this.wallDir === 1
                ? this.x + this.width
                : this.x;
            Particles.spawnWallSlideSparks(sparkX, this.y + this.height / 2, this.wallDir);
        }

        // ---- Wall jump ----
        if (Input.isJump()) {
            this.vx = -this.wallDir * WALL_JUMP_VX;
            this.vy = WALL_JUMP_VY;
            this.facing = -this.wallDir;
            this.coyoteTimer = 0;
            this.jumpBufferTimer = 0;
            this.onGround = false;
            this._changeState('jump');
            return;
        }

        // ---- Check if player releases wall or lands ----
        if (this.onGround) {
            this._changeState('idle');
            return;
        }

        // Check if still pressing into wall
        const stillTouchingWall = this._isTouchingWall(this.wallDir);
        if (inputDir !== this.wallDir || !stillTouchingWall) {
            this._changeState('fall');
            return;
        }

        // Check hazard overlap
        if (this._checkHazardOverlap() && !this.invincible) {
            this.takeDamage();
        }
    },

    // =============================================
    // CROUCH
    // =============================================
    _enterCrouch() {
        this.height = PLAYER_CROUCH_HEIGHT;
        this.y += (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT); // Adjust Y so feet stay in place
        this._changeState('crouch');
    },

    _exitCrouch() {
        // Check if there's space to stand up
        if (!this._canStandUp()) return false;
        this.y -= (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
        this.height = PLAYER_HEIGHT;
        return true;
    },

    _canStandUp() {
        // Check if the taller hitbox would overlap solid tiles
        const testY = this.y - (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
        return !Physics.checkRectOverlapsSolid(this.x, testY, PLAYER_WIDTH, PLAYER_HEIGHT);
    },

    _updateCrouch(inputDir) {
        // Stay crouched while Down is held
        if (!Input.isCrouch() || !this.onGround) {
            if (this._exitCrouch()) {
                this._changeState('idle');
            }
            return;
        }

        // No horizontal movement while crouching (just friction)
        Physics.applyGravity(this);
        Physics.applyMovement(this, 0, WALK_MAX_SPEED);
        const collisions = Physics.resolveCollisions(this);

        if (collisions.hazard && !this.invincible) {
            // Stand up first for consistent hitbox
            this.height = PLAYER_HEIGHT;
            this.y -= (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
            this.takeDamage();
            return;
        }

        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        if (!this.onGround) {
            this.height = PLAYER_HEIGHT;
            this.y -= (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
            this._changeState('fall');
        }
    },

    // =============================================
    // CROUCH SLIDE
    // =============================================
    _enterCrouchSlide() {
        this.slideVx = this.vx;
        this.height = PLAYER_CROUCH_HEIGHT;
        this.y += (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
        this._changeState('crouchSlide');
    },

    _updateCrouchSlide(inputDir) {
        // Decelerate the slide
        this.slideVx *= CROUCH_SLIDE_FRICTION;
        this.vx = this.slideVx;

        Physics.applyGravity(this);
        this.x += this.vx;
        this.y += this.vy;

        // Resolve collisions manually for crouch hitbox
        const colInfo = Physics._checkTileCollisionsX(this);
        const rowInfo = Physics._checkTileCollisionsY(this);

        // Check moving platforms
        const mpResult = Physics._checkMovingPlatforms(this);
        if (mpResult) {
            this.onGround = true;
            const mp = mpResult;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        } else {
            this.onGround = rowInfo.hitBottom;
        }

        if (rowInfo.hazard && !this.invincible) {
            this.height = PLAYER_HEIGHT;
            this.y -= (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
            this.takeDamage();
            return;
        }

        // Spawn slide dust
        this.stateTimer++;
        if (this.stateTimer % 4 === 0 && Math.abs(this.slideVx) > 1) {
            Particles.spawnSlideDust(
                this.x + this.width / 2 - this.facing * 8,
                this.y + this.height,
                this.facing
            );
        }

        // End slide when slow enough or released crouch
        if (Math.abs(this.slideVx) < 1.0) {
            if (Input.isCrouch()) {
                this.vx = 0;
                this._changeState('crouch');
            } else {
                if (this._exitCrouch()) {
                    this._changeState('idle');
                } else {
                    this.vx = 0;
                    this._changeState('crouch');
                }
            }
            return;
        }

        if (!Input.isCrouch()) {
            if (this._exitCrouch()) {
                this._changeState(Math.abs(this.vx) > 0.5 ? 'walk' : 'idle');
            }
            return;
        }

        if (!this.onGround) {
            this.height = PLAYER_HEIGHT;
            this.y -= (PLAYER_HEIGHT - PLAYER_CROUCH_HEIGHT);
            this._changeState('fall');
        }
    },

    // =============================================
    // ATTACK (ground melee)
    // =============================================
    _startAttack() {
        this.attackTimer = ATTACK_DURATION;
        this.isCharging = true;
        this.chargeTimer = 0;
        this._changeState('attack');
    },

    _updateAttack(inputDir) {
        this.stateTimer++;

        // Track charge time — if still holding X, keep charging (don't decrement attackTimer)
        if (Input.isAttackHeld() && this.isCharging) {
            this.chargeTimer++;
            if (this.chargeTimer >= CHARGE_TIME) {
                this._releaseChargeAttack();
                return;
            }
            // Don't decrement attack timer while charging
        } else {
            this.isCharging = false;
            this.attackTimer--;
        }

        // Apply physics (reduced movement during attack)
        Physics.applyGravity(this);
        Physics.applyMovement(this, 0, WALK_MAX_SPEED);
        const collisions = Physics.resolveCollisions(this);

        if (collisions.hazard && !this.invincible) {
            this.takeDamage();
            return;
        }

        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        // Check melee hitbox against breakable blocks (normal attack does NOT break)
        // Normal attacks only affect enemies (future sprint)

        if (this.attackTimer <= 0) {
            this.isCharging = false;
            this.chargeTimer = 0;
            this._changeState('idle');
        }

        if (!this.onGround) {
            this._changeState('fall');
        }
    },

    // =============================================
    // CHARGE ATTACK
    // =============================================
    _releaseChargeAttack() {
        this.isCharging = false;
        this.chargeTimer = 0;
        this.attackTimer = 12; // Charge attack has longer animation
        this._changeState('chargeAttack');
        // Check for breakable blocks in charge hitbox
        this._checkChargeAttackBlocks();
    },

    _updateChargeAttack(inputDir) {
        this.attackTimer--;
        this.stateTimer++;

        Physics.applyGravity(this);
        Physics.applyMovement(this, 0, WALK_MAX_SPEED);
        const collisions = Physics.resolveCollisions(this);

        if (collisions.hazard && !this.invincible) {
            this.takeDamage();
            return;
        }

        if (collisions.onMovingPlatform) {
            const mp = collisions.onMovingPlatform;
            this.x += mp.x - mp.prevX;
            this.y += mp.y - mp.prevY;
        }

        if (this.attackTimer <= 0) {
            this._changeState('idle');
        }

        if (!this.onGround) {
            this._changeState('fall');
        }
    },

    _checkChargeAttackBlocks() {
        const hb = this._getChargeHitbox();
        const left = Math.floor(hb.x / TILE_SIZE);
        const right = Math.floor((hb.x + hb.w - 1) / TILE_SIZE);
        const top = Math.floor(hb.y / TILE_SIZE);
        const bottom = Math.floor((hb.y + hb.h - 1) / TILE_SIZE);

        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                if (Level.getTile(c, r) === TILE_BREAKABLE) {
                    Level.setTile(c, r, TILE_EMPTY);
                    Particles.spawnBlockBreak(c, r);
                }
            }
        }
    },

    // =============================================
    // JUMP ATTACK (downward strike)
    // =============================================
    _startJumpAttack() {
        this.attackTimer = 30; // Long duration — ends on landing or timeout
        this._changeState('jumpAttack');
    },

    _updateJumpAttack(inputDir) {
        this.attackTimer--;
        this.stateTimer++;

        // Update facing
        if (inputDir !== 0) this.facing = inputDir;

        // Apply gravity (faster fall during jump attack)
        this.vy += GRAVITY * 1.2;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        // Save vy before collision to detect impact
        const preCollisionVy = this.vy;

        Physics.applyMovement(this, inputDir, WALK_MAX_SPEED);
        const collisions = Physics.resolveCollisions(this);

        if (collisions.hazard && !this.invincible) {
            this.takeDamage();
            return;
        }

        // Check for breakable blocks below (triggers bounce internally)
        if (this.state !== 'jumpAttack') return; // _checkJumpAttackBlocks may change state
        this._checkJumpAttackBlocks();
        if (this.state !== 'jumpAttack') return; // Bounced off breakable block

        // Landing — bounce off ground/solid tiles (jump attack bounces off everything)
        if (this.onGround && preCollisionVy > 1) {
            this.vy = JUMP_ATTACK_BOUNCE;
            this.onGround = false;
            Particles.spawnLandingDust(this.x + this.width / 2, this.y + this.height);
            Particles.spawnAttackSparks(this.x + this.width / 2, this.y + this.height);
            this._changeState('jump');
            return;
        } else if (this.onGround) {
            Particles.spawnLandingDust(this.x + this.width / 2, this.y + this.height);
            this._changeState('idle');
            return;
        }

        if (this.attackTimer <= 0) {
            this._changeState('fall');
        }
    },

    _checkJumpAttackBlocks() {
        const hb = this._getJumpAttackHitbox();
        const left = Math.floor(hb.x / TILE_SIZE);
        const right = Math.floor((hb.x + hb.w - 1) / TILE_SIZE);
        const top = Math.floor(hb.y / TILE_SIZE);
        const bottom = Math.floor((hb.y + hb.h - 1) / TILE_SIZE);

        let hitSomething = false;
        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                if (Level.getTile(c, r) === TILE_BREAKABLE) {
                    Level.setTile(c, r, TILE_EMPTY);
                    Particles.spawnBlockBreak(c, r);
                    hitSomething = true;
                }
            }
        }

        if (hitSomething) {
            // Bounce up after destroying block
            this.vy = JUMP_ATTACK_BOUNCE;
            Particles.spawnAttackSparks(this.x + this.width / 2, this.y + this.height);
            this._changeState('jump');
        }
    },

    // =============================================
    // HURT STATE
    // =============================================
    _updateHurt() {
        this.stateTimer++;

        // Apply physics (knockback + gravity)
        Physics.applyGravity(this);
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.92; // Slow down knockback

        // Basic collision resolution
        const colInfo = Physics._checkTileCollisionsX(this);
        const rowInfo = Physics._checkTileCollisionsY(this);
        const mpResult = Physics._checkMovingPlatforms(this);
        this.onGround = rowInfo.hitBottom || !!mpResult;

        // Hurt state ends after HURT_DURATION frames
        if (this.stateTimer >= HURT_DURATION) {
            if (this.onGround) {
                this._changeState('idle');
            } else {
                this._changeState('fall');
            }
        }
    },

    // =============================================
    // DEAD STATE
    // =============================================
    _updateDead() {
        this.deathTimer -= 1 / 60;
        if (this.deathTimer <= 0) {
            if (this.lives > 0) {
                this._respawn();
            } else {
                this.gameOver = true;
            }
        }
    },

    // =============================================
    // DAMAGE & DEATH
    // =============================================
    takeDamage() {
        if (this.invincible || this.state === 'dead' || this.state === 'hurt') return;

        this.hp--;
        if (this.hp <= 0) {
            this.hp = 0;
            this._die();
        } else {
            // Hurt with knockback
            this.invincible = true;
            this.invincibleTimer = INVINCIBILITY_TIME;
            this.vy = HURT_KNOCKBACK_VY;
            this.vx = -this.facing * HURT_KNOCKBACK_VX;

            // Restore standing hitbox if crouching
            if (this.height !== PLAYER_HEIGHT) {
                this.y -= (PLAYER_HEIGHT - this.height);
                this.height = PLAYER_HEIGHT;
            }

            this._changeState('hurt');
        }
    },

    _die() {
        // CRITICAL FIX: Guard against multiple death calls
        if (this.state === 'dead') return;

        this.lives--;
        this._changeState('dead');
        this.deathTimer = RESPAWN_DELAY;
        this.vx = 0;
        this.vy = 0;

        // Restore standing hitbox if crouching
        if (this.height !== PLAYER_HEIGHT) {
            this.y -= (PLAYER_HEIGHT - this.height);
            this.height = PLAYER_HEIGHT;
        }

        // Spawn death particles
        Particles.spawnDeathParticles(this.x, this.y, this.width, this.height);
    },

    _respawn() {
        this.x = this.respawnX;
        this.y = this.respawnY;
        this.vx = 0;
        this.vy = 0;
        this.hp = PLAYER_MAX_HP;
        this.invincible = true;
        this.invincibleTimer = INVINCIBILITY_TIME;
        this.onGround = false;
        this.height = PLAYER_HEIGHT;
        // Directly set state — bypass _changeState's dead-state guard
        this.state = 'idle';
        this.prevState = 'dead';
        this.animFrame = 0;
        this.animTimer = 0;
        this.stateTimer = 0;
    },

    // =============================================
    // STATE MACHINE
    // =============================================
    _changeState(newState) {
        if (this.state === newState) return;

        // CRITICAL: Never override dead state with anything
        if (this.state === 'dead') return;

        this.prevState = this.state;
        this.state = newState;
        this.animFrame = 0;
        this.animTimer = 0;
        this.stateTimer = 0;

        // Reset jump cut flag on new jump
        if (newState === 'jump') {
            this._jumpCut = false;
        }
    },

    // =============================================
    // ANIMATION
    // =============================================
    _updateAnimFrame() {
        this.animTimer += 1 / 60;

        switch (this.state) {
            case 'idle':
                // 2-frame breathing, 0.5s per frame
                if (this.animTimer >= 0.5) {
                    this.animTimer = 0;
                    this.animFrame = (this.animFrame + 1) % 2;
                }
                break;
            case 'walk':
                // 4-frame walk, 0.1s per frame
                if (this.animTimer >= 0.1) {
                    this.animTimer = 0;
                    this.animFrame = (this.animFrame + 1) % 4;
                }
                break;
            case 'run':
                // 6-frame run, 0.06s per frame
                if (this.animTimer >= 0.06) {
                    this.animTimer = 0;
                    this.animFrame = (this.animFrame + 1) % 6;
                }
                break;
            case 'attack':
            case 'chargeAttack':
                // 3-frame attack, mapped to attack timer
                {
                    const progress = 1 - (this.attackTimer / ATTACK_DURATION);
                    this.animFrame = Math.min(2, Math.floor(progress * 3));
                }
                break;
        }
    },

    // =============================================
    // HITBOX HELPERS
    // =============================================
    _getMeleeHitbox() {
        const hbX = this.facing === 1
            ? this.x + this.width
            : this.x - ATTACK_RANGE;
        return {
            x: hbX,
            y: this.y + (this.height - ATTACK_HEIGHT) / 2,
            w: ATTACK_RANGE,
            h: ATTACK_HEIGHT
        };
    },

    _getChargeHitbox() {
        const hbX = this.facing === 1
            ? this.x + this.width
            : this.x - CHARGE_ATTACK_RANGE;
        return {
            x: hbX,
            y: this.y + (this.height - CHARGE_ATTACK_HEIGHT) / 2,
            w: CHARGE_ATTACK_RANGE,
            h: CHARGE_ATTACK_HEIGHT
        };
    },

    _getJumpAttackHitbox() {
        return {
            x: this.x + (this.width - JUMP_ATTACK_WIDTH) / 2,
            y: this.y + this.height,
            w: JUMP_ATTACK_WIDTH,
            h: JUMP_ATTACK_HEIGHT
        };
    },

    // =============================================
    // HELPERS
    // =============================================
    _isTouchingWall(dir) {
        const checkCol = dir === 1
            ? Math.floor((this.x + this.width) / TILE_SIZE)
            : Math.floor((this.x - 1) / TILE_SIZE);
        const topRow = Math.floor(this.y / TILE_SIZE);
        const bottomRow = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        for (let r = topRow; r <= bottomRow; r++) {
            const t = Level.getTile(checkCol, r);
            if (t === TILE_SOLID || t === TILE_BREAKABLE) return true;
        }
        return false;
    },

    _checkHazardOverlap() {
        const left = Math.floor(this.x / TILE_SIZE);
        const right = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        const top = Math.floor(this.y / TILE_SIZE);
        const bottom = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                if (Level.getTile(c, r) === TILE_HAZARD) return true;
            }
        }
        return false;
    }
};
