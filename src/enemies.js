// ============================================================
// enemies.js — Enemy & Boss System Framework
// Enemy types: shroomba, thornvine, barkbeetle
// Boss types: elder_shroomba, vine_mother, stag_king
// ============================================================

const Enemies = {
    enemies: [],
    projectiles: [],
    boss: null,
    _hitCooldowns: {},

    init() {
        this.enemies = [];
        this.projectiles = [];
        this.boss = null;
        this._hitCooldowns = {};
    },

    // =============================================
    // SPAWN METHODS
    // =============================================

    spawn(type, x, y, config) {
        const defaults = this._getDefaults(type);
        const enemy = {
            type: type,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            width: defaults.width,
            height: defaults.height,
            health: defaults.health,
            maxHealth: defaults.health,
            speed: defaults.speed,
            facing: -1,
            state: 'active',
            deathTimer: 0,
            hitFlash: 0,
            animTimer: 0,
            animFrame: 0,
            behavior: defaults.behavior,
            isBoss: false,
            // Thorn vine specific
            shootTimer: 120 + Math.random() * 60,
            shootCooldown: 120,
            // Bark beetle specific
            ceilingY: y,
        };
        if (config) Object.assign(enemy, config);
        this.enemies.push(enemy);
        return enemy;
    },

    spawnBoss(type, x, y) {
        const configs = {
            'elder_shroomba': {
                health: 5, maxHealth: 5, width: 40, height: 40, speed: 1.5,
                attackPattern: 'shockwave', attackType: 'shockwave',
                patterns: ['shockwave']
            },
            'vine_mother': {
                health: 6, maxHealth: 6, width: 48, height: 56, speed: 0,
                attackPattern: 'vine_sweep', attackType: 'vine_sweep',
                patterns: ['vine_sweep']
            },
            'stag_king': {
                health: 7, maxHealth: 7, width: 44, height: 48, speed: 2.5,
                attackPattern: 'charge', attackType: 'charge',
                patterns: ['charge', 'ceiling_rocks']
            },
        };

        const cfg = configs[type] || configs['elder_shroomba'];
        const boss = {
            type: type,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            width: cfg.width,
            height: cfg.height,
            health: cfg.health,
            maxHealth: cfg.maxHealth,
            speed: cfg.speed,
            facing: -1,
            state: 'intro',
            isBoss: true,
            vulnerable: false,
            phase: 1,
            attackPattern: cfg.attackPattern,
            attackType: cfg.attackType,
            patterns: cfg.patterns,
            attackTimer: 0,
            vulnerableTimer: 0,
            stateTimer: 0,
            animTimer: 0,
            animFrame: 0,
            deathTimer: 0,
            hitFlash: 0,
            introTimer: 60,
            behavior: 'boss',
            // Attack-specific state
            shockwaveActive: false,
            chargeDir: 0,
            ceilingRockTimer: 0,
            vineSweepDir: 0,
            attackCycleCount: 0,
        };

        this.boss = boss;
        this.enemies.push(boss);

        // Set HUD
        HUD.bossActive = true;
        HUD.bossHP = boss.health;
        HUD.bossMaxHP = boss.maxHealth;

        // Set boss name
        const names = {
            'elder_shroomba': 'Elder Shroomba',
            'vine_mother': 'Vine Mother',
            'stag_king': 'Stag King',
        };
        HUD.bossName = names[type] || type;

        return boss;
    },

    _getDefaults(type) {
        switch (type) {
            case 'shroomba':
                return { width: 24, height: 20, health: 1, speed: 1, behavior: 'patrol' };
            case 'thornvine':
                return { width: 20, height: 32, health: 2, speed: 0, behavior: 'stationary_shooter' };
            case 'barkbeetle':
                return { width: 24, height: 16, health: 1, speed: 0.8, behavior: 'ceiling_patrol' };
            default:
                return { width: 24, height: 24, health: 1, speed: 1, behavior: 'patrol' };
        }
    },

    // =============================================
    // UPDATE
    // =============================================

    update() {
        // Decrement hit cooldowns
        for (const key in this._hitCooldowns) {
            this._hitCooldowns[key]--;
            if (this._hitCooldowns[key] <= 0) delete this._hitCooldowns[key];
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (e.hitFlash > 0) e.hitFlash--;
            e.animTimer += 1 / 60;

            if (e.state === 'dying') {
                e.deathTimer -= 1 / 60;
                // Float up and fade
                e.y -= 0.5;
                if (e.deathTimer <= 0) {
                    e.state = 'dead';
                    if (e === this.boss) {
                        this.enemies.splice(i, 1);
                        this.boss = null;
                        this._onBossDefeated();
                    } else {
                        this.enemies.splice(i, 1);
                    }
                }
                continue;
            }

            if (e.state === 'active' || e.state === 'intro' ||
                e.state === 'attacking' || e.state === 'vulnerable') {
                if (e.isBoss) {
                    this._updateBoss(e);
                } else {
                    this._updateEnemy(e);
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life -= 1 / 60;
            p.animTimer = (p.animTimer || 0) + 1 / 60;

            if (p.life <= 0 || p.x < Camera.x - 200 || p.x > Camera.x + CANVAS_WIDTH + 200 ||
                p.y > Camera.y + CANVAS_HEIGHT + 200) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Check projectile vs solid tiles (non-boss projectiles)
            if (!p.ignoreWalls) {
                const col = Math.floor(p.x / TILE_SIZE);
                const row = Math.floor(p.y / TILE_SIZE);
                const tile = Level.getTile(col, row);
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            // Check projectile-player collision (enemy projectiles only)
            if (p.hostile && !Player.invincible && Player.state !== 'dead' && Player.state !== 'hurt') {
                if (this._aabb(p, Player)) {
                    Player.takeDamage();
                    this.projectiles.splice(i, 1);
                }
            }
        }
    },

    // =============================================
    // ENEMY AI
    // =============================================

    _updateEnemy(e) {
        switch (e.type) {
            case 'shroomba': this._updateShroomba(e); break;
            case 'thornvine': this._updateThornVine(e); break;
            case 'barkbeetle': this._updateBarkBeetle(e); break;
            default: this._updateShroomba(e); break;
        }
    },

    _updateShroomba(e) {
        // Patrol horizontally, reverse at edges/walls
        e.vx = e.speed * e.facing;
        e.x += e.vx;

        // Apply gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Check floor collision
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        let onGround = false;

        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, footRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                onGround = true;
                break;
            }
        }

        // Check wall collision (reverse direction)
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
            }
        }

        // Check platform edge (look ahead for gaps)
        if (onGround) {
            const lookAheadCol = e.facing > 0
                ? Math.floor((e.x + e.width + 4) / TILE_SIZE)
                : Math.floor((e.x - 4) / TILE_SIZE);
            const floorBelow = Level.getTile(lookAheadCol, footRow);
            if (floorBelow === TILE_EMPTY || floorBelow === TILE_HAZARD) {
                e.facing *= -1;
            }
        }

        // Animation
        if (Math.floor(e.animTimer * 4) % 2 === 0) {
            e.animFrame = 0;
        } else {
            e.animFrame = 1;
        }
    },

    _updateThornVine(e) {
        // Stationary enemy that shoots projectiles
        e.shootTimer--;
        if (e.shootTimer <= 0) {
            e.shootTimer = e.shootCooldown;
            // Fire projectile toward player
            const dx = Player.x - e.x;
            const dy = Player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400 && dist > 0) {
                const speed = 2;
                this.projectiles.push({
                    x: e.x + e.width / 2,
                    y: e.y + 8,
                    vx: (dx / dist) * speed,
                    vy: (dy / dist) * speed,
                    width: 8,
                    height: 8,
                    life: 3,
                    hostile: true,
                    type: 'thorn',
                    animTimer: 0,
                });
            }
        }
    },

    _updateBarkBeetle(e) {
        // Ceiling-walking enemy: moves along ceiling tiles
        e.vx = e.speed * e.facing;
        e.x += e.vx;

        // Check ceiling collision (stays attached to ceiling)
        const headRow = Math.floor(e.y / TILE_SIZE) - 1;
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);

        // Check if still on ceiling
        let onCeiling = false;
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, headRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                onCeiling = true;
                break;
            }
        }

        // If lost ceiling, reverse
        if (!onCeiling) {
            e.facing *= -1;
            e.x -= e.vx * 2;
        }

        // Check wall collision
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
            }
        }

        // Animation
        e.animFrame = Math.floor(e.animTimer * 6) % 4;
    },

    // =============================================
    // BOSS AI
    // =============================================

    _updateBoss(b) {
        b.stateTimer++;

        // Update HUD
        HUD.bossHP = b.health;

        // Intro state
        if (b.state === 'intro') {
            b.introTimer--;
            if (b.introTimer <= 0) {
                b.state = 'attacking';
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
            return;
        }

        // Phase check
        if (b.health <= Math.floor(b.maxHealth * 0.5) && b.phase === 1) {
            b.phase = 2;
            b.hitFlash = 15;
            // Spawn phase transition particles
            for (let i = 0; i < 12; i++) {
                Particles.spawnAttackSparks(
                    b.x + b.width / 2 + (Math.random() - 0.5) * b.width,
                    b.y + b.height / 2 + (Math.random() - 0.5) * b.height
                );
            }
        }

        // Dispatch to boss-specific AI
        switch (b.type) {
            case 'elder_shroomba': this._updateElderShroomba(b); break;
            case 'vine_mother': this._updateVineMother(b); break;
            case 'stag_king': this._updateStagKing(b); break;
        }

        // Apply gravity to bosses that use it
        if (b.type !== 'vine_mother') {
            b.vy += GRAVITY;
            if (b.vy > TERMINAL_VELOCITY) b.vy = TERMINAL_VELOCITY;
            b.y += b.vy;

            // Floor collision
            const footRow = Math.floor((b.y + b.height) / TILE_SIZE);
            const leftCol = Math.floor(b.x / TILE_SIZE);
            const rightCol = Math.floor((b.x + b.width - 1) / TILE_SIZE);
            for (let c = leftCol; c <= rightCol; c++) {
                const tile = Level.getTile(c, footRow);
                if (tile === TILE_SOLID) {
                    b.y = footRow * TILE_SIZE - b.height;
                    b.vy = 0;
                    break;
                }
            }
        }
    },

    _updateElderShroomba(b) {
        // Elder Shroomba: jumps, lands → shockwave, then vulnerable
        const vulnDuration = b.phase === 1 ? 90 : 60;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Phase 1: single jump + shockwave
            // Phase 2: double jump + larger shockwave
            if (b.attackTimer === 1) {
                // Start jump
                b.vy = b.phase === 1 ? -10 : -12;
                b.facing = Player.x > b.x ? 1 : -1;
            }

            if (b.attackTimer === 30 && b.phase === 2) {
                // Second jump in phase 2
                b.vy = -10;
            }

            // Land and create shockwave
            const targetTime = b.phase === 1 ? 40 : 55;
            if (b.attackTimer >= targetTime && b.vy === 0) {
                // Shockwave!
                b.shockwaveActive = true;
                const waveSpeed = b.phase === 1 ? 3 : 4;
                const waveSize = b.phase === 1 ? 12 : 16;

                // Left shockwave
                this.projectiles.push({
                    x: b.x - 10, y: b.y + b.height - waveSize,
                    vx: -waveSpeed, vy: 0,
                    width: 20, height: waveSize,
                    life: 1.0, hostile: true,
                    type: 'shockwave', ignoreWalls: false,
                    animTimer: 0,
                });
                // Right shockwave
                this.projectiles.push({
                    x: b.x + b.width - 10, y: b.y + b.height - waveSize,
                    vx: waveSpeed, vy: 0,
                    width: 20, height: waveSize,
                    life: 1.0, hostile: true,
                    type: 'shockwave', ignoreWalls: false,
                    animTimer: 0,
                });

                // Screen shake
                Particles.spawnLandingDust(b.x + b.width / 2, b.y + b.height);

                // Transition to vulnerable
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }

        // Horizontal movement toward player during attack
        if (b.state === 'attacking' && b.attackTimer > 5 && b.attackTimer < 30) {
            const dir = Player.x > b.x + b.width / 2 ? 1 : -1;
            b.x += dir * b.speed * 0.5;
            b.facing = dir;
        }
    },

    _updateVineMother(b) {
        // Vine Mother: stationary, vine sweeps across arena
        const vulnDuration = b.phase === 1 ? 100 : 70;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            if (b.attackTimer === 1) {
                b.vineSweepDir = Player.x > b.x ? 1 : -1;
            }

            // Spawn vine sweep projectiles
            if (b.attackTimer === 30) {
                const sweepY = b.y + b.height - 20;
                const startX = b.vineSweepDir > 0 ? b.x - 100 : b.x + b.width + 100;
                for (let i = 0; i < 5; i++) {
                    this.projectiles.push({
                        x: startX + b.vineSweepDir * i * 25,
                        y: sweepY - i * 3,
                        vx: b.vineSweepDir * (2.5 + (b.phase === 2 ? 1 : 0)),
                        vy: 0,
                        width: 24, height: 16,
                        life: 2.0, hostile: true,
                        type: 'vine_sweep', ignoreWalls: true,
                        animTimer: 0,
                    });
                }
            }

            // Phase 2: shoot extra projectiles
            if (b.phase === 2 && b.attackTimer === 50) {
                const dx = Player.x - b.x;
                const dy = Player.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.projectiles.push({
                        x: b.x + b.width / 2,
                        y: b.y + 10,
                        vx: (dx / dist) * 3,
                        vy: (dy / dist) * 3,
                        width: 10, height: 10,
                        life: 2.0, hostile: true,
                        type: 'thorn', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 70 : 60;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            // Subtle bobbing
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updateStagKing(b) {
        // Stag King: charges across arena, drops ceiling rocks in phase 2
        const vulnDuration = b.phase === 1 ? 90 : 65;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Charge toward player
            if (b.attackTimer === 1) {
                b.chargeDir = Player.x > b.x + b.width / 2 ? 1 : -1;
                b.facing = b.chargeDir;
            }

            if (b.attackTimer >= 20 && b.attackTimer < 60) {
                // Charging
                b.x += b.chargeDir * b.speed * 1.8;

                // Wall collision reverses charge
                const wallCol = b.chargeDir > 0
                    ? Math.floor((b.x + b.width) / TILE_SIZE)
                    : Math.floor(b.x / TILE_SIZE);
                const midRow = Math.floor((b.y + b.height / 2) / TILE_SIZE);
                const tile = Level.getTile(wallCol, midRow);
                if (tile === TILE_SOLID) {
                    if (b.chargeDir > 0) b.x = wallCol * TILE_SIZE - b.width;
                    else b.x = (wallCol + 1) * TILE_SIZE;
                    b.attackTimer = 60; // End charge early
                    // Stun particles
                    Particles.spawnLandingDust(b.x + b.width / 2, b.y + b.height);
                }
            }

            // Phase 2: ceiling rocks
            if (b.phase === 2 && b.attackTimer === 65) {
                const arenaLeft = Level.bossArenaX || 0;
                const arenaRight = Level.width * TILE_SIZE;
                for (let i = 0; i < 3; i++) {
                    const rx = arenaLeft + Math.random() * (arenaRight - arenaLeft);
                    this.projectiles.push({
                        x: rx,
                        y: Camera.y - 20,
                        vx: 0,
                        vy: 3 + Math.random(),
                        width: 20, height: 20,
                        life: 3.0, hostile: true,
                        type: 'ceiling_rock', gravity: 0.1,
                        ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 70 : 85;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            // Face player
            b.facing = Player.x > b.x + b.width / 2 ? 1 : -1;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    // =============================================
    // BOSS DEFEAT
    // =============================================

    _onBossDefeated() {
        HUD.bossActive = false;

        // Spawn celebration particles
        const cx = Level.bossArenaX ? Level.bossArenaX + 8 * TILE_SIZE : CANVAS_WIDTH / 2 + Camera.x;
        const cy = Camera.y + CANVAS_HEIGHT / 2;
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const colors = [COLORS.mutedGold, COLORS.mossGreen, COLORS.softCream, '#FF6B6B', COLORS.forest.highlight];
            Particles.particles.push({
                x: cx + (Math.random() - 0.5) * 40,
                y: cy + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.08,
                size: 3 + Math.random() * 4,
                color: colors[i % colors.length],
                life: 1.5,
                maxLife: 1.5,
                shrink: false,
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }

        // Unlock camera
        Camera.locked = false;

        // Trigger stage complete after delay
        setTimeout(() => {
            if (GameState.current === GameState.STAGE) {
                GameState.transitionTo(GameState.STAGE_COMPLETE, () => {
                    GameState.setupStageComplete();
                });
            }
        }, 1500);
    },

    // =============================================
    // COLLISION DETECTION
    // =============================================

    checkPlayerAttackCollisions() {
        if (Player.state !== 'attack' && Player.state !== 'chargeAttack' && Player.state !== 'jumpAttack') return;

        let hitbox;
        if (Player.state === 'attack') {
            hitbox = Player._getMeleeHitbox();
        } else if (Player.state === 'chargeAttack') {
            hitbox = Player._getChargeHitbox();
        } else if (Player.state === 'jumpAttack') {
            hitbox = Player._getJumpAttackHitbox();
        }
        if (!hitbox) return;

        const hbEntity = { x: hitbox.x, y: hitbox.y, width: hitbox.w, height: hitbox.h };

        for (const e of this.enemies) {
            if (e.state === 'dying' || e.state === 'dead') continue;

            // Check cooldown
            const cooldownKey = 'atk_' + this.enemies.indexOf(e);
            if (this._hitCooldowns[cooldownKey]) continue;

            if (this._aabb(hbEntity, e)) {
                // Boss vulnerability check
                if (e.isBoss && !e.vulnerable) continue;

                this._damageEnemy(e, 1);
                this._hitCooldowns[cooldownKey] = 15; // 15 frame cooldown

                // Jump attack bounce
                if (Player.state === 'jumpAttack') {
                    Player.vy = JUMP_ATTACK_BOUNCE;
                    Player.onGround = false;
                    Particles.spawnAttackSparks(e.x + e.width / 2, e.y);
                }

                break; // Only hit one enemy per frame
            }
        }
    },

    checkEnemyPlayerCollisions() {
        if (Player.invincible || Player.state === 'dead' || Player.state === 'hurt') return;

        for (const e of this.enemies) {
            if (e.state === 'dying' || e.state === 'dead') continue;
            if (e.state === 'intro') continue;

            if (this._aabb(e, Player)) {
                Player.takeDamage();
                return; // Only one hit per frame
            }
        }
    },

    // =============================================
    // DAMAGE
    // =============================================

    _damageEnemy(e, amount) {
        e.health -= amount;
        e.hitFlash = 8;

        // Knockback
        if (!e.isBoss) {
            const dir = e.x > Player.x ? 1 : -1;
            e.x += dir * 8;
        }

        // Spawn hit particles
        Particles.spawnAttackSparks(e.x + e.width / 2, e.y + e.height / 2);

        if (e.health <= 0) {
            e.health = 0;
            e.state = 'dying';
            e.deathTimer = e.isBoss ? 1.5 : 0.5;

            // Death particles
            for (let i = 0; i < (e.isBoss ? 15 : 6); i++) {
                const angle = (i / (e.isBoss ? 15 : 6)) * Math.PI * 2;
                const speed = 1 + Math.random() * 2;
                Particles.particles.push({
                    x: e.x + e.width / 2 + (Math.random() - 0.5) * e.width,
                    y: e.y + e.height / 2 + (Math.random() - 0.5) * e.height,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 1,
                    gravity: 0.08,
                    size: 2 + Math.random() * 3,
                    color: e.isBoss ? COLORS.mutedGold : COLORS.forest.leaf,
                    life: 0.6,
                    maxLife: 0.6,
                    shrink: true,
                    shape: 'rect'
                });
            }
        }
    },

    // =============================================
    // RENDER
    // =============================================

    render(ctx) {
        // Render projectiles first (behind enemies)
        for (const p of this.projectiles) {
            this._renderProjectile(ctx, p);
        }

        // Render enemies
        for (const e of this.enemies) {
            if (e.state === 'dead') continue;

            const sx = e.x - Camera.x;
            const sy = e.y - Camera.y;

            // Culling
            if (sx < -64 || sx > CANVAS_WIDTH + 64 || sy < -64 || sy > CANVAS_HEIGHT + 64) continue;

            // Hit flash
            if (e.hitFlash > 0 && e.hitFlash % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }

            // Dying fade
            if (e.state === 'dying') {
                ctx.globalAlpha = Math.max(0, e.deathTimer / (e.isBoss ? 1.5 : 0.5));
            }

            if (e.isBoss) {
                this._renderBoss(ctx, e, sx, sy);
            } else {
                this._renderRegularEnemy(ctx, e, sx, sy);
            }

            ctx.globalAlpha = 1.0;
        }
    },

    _renderRegularEnemy(ctx, e, sx, sy) {
        switch (e.type) {
            case 'shroomba': this._renderShroomba(ctx, e, sx, sy); break;
            case 'thornvine': this._renderThornVine(ctx, e, sx, sy); break;
            case 'barkbeetle': this._renderBarkBeetle(ctx, e, sx, sy); break;
            default: this._renderShroomba(ctx, e, sx, sy); break;
        }
    },

    _renderShroomba(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const bounce = e.animFrame === 1 ? -2 : 0;

        ctx.save();
        if (e.hitFlash > 0 && e.hitFlash % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
        }

        // Stem/body
        ctx.fillStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : '#D4C4A0';
        ctx.fillRect(sx + w * 0.3, sy + h * 0.5 + bounce, w * 0.4, h * 0.5);

        // Mushroom cap
        ctx.fillStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : '#C44040';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.45 + bounce, w * 0.55, h * 0.35, 0, Math.PI, 0);
        ctx.fill();

        // Cap spots
        ctx.fillStyle = '#E8E0D0';
        ctx.beginPath();
        ctx.arc(sx + w * 0.35, sy + h * 0.25 + bounce, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.3 + bounce, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1A1A2E';
        const eyeX = e.facing > 0 ? w * 0.55 : w * 0.3;
        ctx.fillRect(sx + eyeX, sy + h * 0.55 + bounce, 3, 3);
        ctx.fillRect(sx + eyeX + 6, sy + h * 0.55 + bounce, 3, 3);

        // Feet
        ctx.fillStyle = '#8B6B3D';
        ctx.fillRect(sx + w * 0.2, sy + h - 4, 6, 4);
        ctx.fillRect(sx + w * 0.55, sy + h - 4, 6, 4);

        ctx.restore();
    },

    _renderThornVine(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const sway = Math.sin(e.animTimer * 2) * 2;

        // Vine stem
        ctx.strokeStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : COLORS.forest.deepCanopy;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx + w / 2, sy + h);
        ctx.quadraticCurveTo(sx + w / 2 + sway, sy + h * 0.5, sx + w / 2, sy);
        ctx.stroke();

        // Thorns
        ctx.fillStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : '#5A2A15';
        for (let i = 0; i < 4; i++) {
            const ty = sy + h * 0.2 + i * h * 0.2;
            const tx = sx + w / 2 + sway * (i / 4) + (i % 2 === 0 ? -5 : 5);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + (i % 2 === 0 ? -6 : 6), ty + 3);
            ctx.lineTo(tx, ty + 6);
            ctx.closePath();
            ctx.fill();
        }

        // Bulb at top
        ctx.fillStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : '#8B2A4A';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + 6, 8, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sx + w / 2 + 2, sy + 5, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    _renderBarkBeetle(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;

        ctx.save();
        // Flip for ceiling walking (upside down)
        ctx.translate(sx + w / 2, sy + h / 2);
        ctx.scale(e.facing, -1);
        ctx.translate(-w / 2, -h / 2);

        // Shell
        ctx.fillStyle = e.hitFlash > 0 && e.hitFlash % 2 === 0 ? '#FFFFFF' : '#5A4020';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.4, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell stripe
        ctx.strokeStyle = '#8B6B3D';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.5, 0);
        ctx.lineTo(w * 0.5, h * 0.7);
        ctx.stroke();

        // Legs
        ctx.strokeStyle = '#3A2A10';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const legX = w * 0.25 + i * w * 0.2;
            const legPhase = e.animFrame * 0.3 + i * 0.5;
            ctx.beginPath();
            ctx.moveTo(legX, h * 0.5);
            ctx.lineTo(legX - 4, h - 2 + Math.sin(legPhase) * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(w - legX, h * 0.5);
            ctx.lineTo(w - legX + 4, h - 2 + Math.sin(legPhase + 1) * 2);
            ctx.stroke();
        }

        // Eyes
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(w * 0.3, h * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.7, h * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    // =============================================
    // BOSS RENDERING
    // =============================================

    _renderBoss(ctx, b, sx, sy) {
        switch (b.type) {
            case 'elder_shroomba': this._renderElderShroomba(ctx, b, sx, sy); break;
            case 'vine_mother': this._renderVineMother(ctx, b, sx, sy); break;
            case 'stag_king': this._renderStagKing(ctx, b, sx, sy); break;
        }

        // Vulnerability indicator
        if (b.vulnerable) {
            ctx.strokeStyle = COLORS.mutedGold;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(b.stateTimer * 0.2);
            ctx.beginPath();
            ctx.arc(sx + b.width / 2, sy + b.height / 2, Math.max(b.width, b.height) * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderElderShroomba(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;

        // Stem
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : '#D4C4A0';
        ctx.fillRect(sx + w * 0.25, sy + h * 0.5, w * 0.5, h * 0.5);

        // Large mushroom cap
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : '#8B2020';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.4, w * 0.55, h * 0.4, 0, Math.PI, 0);
        ctx.fill();

        // Cap spots
        ctx.fillStyle = '#E8D0D0';
        ctx.beginPath(); ctx.arc(sx + w * 0.3, sy + h * 0.2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.6, sy + h * 0.15, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.75, sy + h * 0.25, 3, 0, Math.PI * 2); ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(sx + w * 0.3, sy + h * 0.5, 5, 4);
        ctx.fillRect(sx + w * 0.6, sy + h * 0.5, 5, 4);

        // Eyebrows (angry)
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.25, sy + h * 0.45);
        ctx.lineTo(sx + w * 0.4, sy + h * 0.48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.7, sy + h * 0.45);
        ctx.lineTo(sx + w * 0.55, sy + h * 0.48);
        ctx.stroke();

        // Crown (phase 2 indicator)
        if (b.phase === 2) {
            ctx.fillStyle = COLORS.mutedGold;
            for (let i = 0; i < 3; i++) {
                const crX = sx + w * 0.3 + i * w * 0.15;
                ctx.beginPath();
                ctx.moveTo(crX, sy + h * 0.05);
                ctx.lineTo(crX + 4, sy - 6);
                ctx.lineTo(crX + 8, sy + h * 0.05);
                ctx.closePath();
                ctx.fill();
            }
        }
    },

    _renderVineMother(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const sway = Math.sin(b.animTimer * 1.5) * 3;

        // Vine base/body
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : COLORS.forest.deepCanopy;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.3, sy + h);
        ctx.quadraticCurveTo(sx + sway, sy + h * 0.5, sx + w * 0.4, sy + h * 0.2);
        ctx.lineTo(sx + w * 0.6, sy + h * 0.2);
        ctx.quadraticCurveTo(sx + w - sway, sy + h * 0.5, sx + w * 0.7, sy + h);
        ctx.closePath();
        ctx.fill();

        // Vine tendrils
        ctx.strokeStyle = COLORS.forest.leaf;
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
            const tendrilX = sx + w * 0.2 + i * w * 0.2;
            const angle = Math.sin(b.animTimer * 2 + i) * 20;
            ctx.beginPath();
            ctx.moveTo(tendrilX, sy + h * 0.4);
            ctx.quadraticCurveTo(
                tendrilX + angle, sy + h * 0.1,
                tendrilX + angle * 0.5, sy - 10
            );
            ctx.stroke();
        }

        // Central eye/bulb
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : '#8B3A5A';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.35, 14, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#FFD700';
        const pupilX = Player.x > b.x + w / 2 ? 3 : -3;
        ctx.beginPath();
        ctx.arc(sx + w / 2 + pupilX, sy + h * 0.35, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1A1A2E';
        ctx.beginPath();
        ctx.arc(sx + w / 2 + pupilX, sy + h * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();

        // Thorns
        ctx.fillStyle = '#5A2A15';
        for (let i = 0; i < 6; i++) {
            const ty = sy + h * 0.3 + i * h * 0.1;
            const side = i % 2 === 0 ? -1 : 1;
            const tx = sx + w / 2 + side * (w * 0.3 + sway * 0.5);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx + side * 8, ty + 3);
            ctx.lineTo(tx, ty + 6);
            ctx.closePath();
            ctx.fill();
        }
    },

    _renderStagKing(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;

        ctx.save();
        if (b.facing === -1) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0;
            sy = 0;
        }

        // Body
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : '#6B4A25';
        ctx.fillRect(sx + w * 0.15, sy + h * 0.3, w * 0.7, h * 0.5);

        // Head
        ctx.fillStyle = b.hitFlash > 0 && b.hitFlash % 2 === 0 ? '#FFFFFF' : '#8B6B3D';
        ctx.beginPath();
        ctx.ellipse(sx + w * 0.7, sy + h * 0.25, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antlers
        ctx.strokeStyle = '#D4C4A0';
        ctx.lineWidth = 3;
        // Left antler
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.6, sy + h * 0.12);
        ctx.lineTo(sx + w * 0.5, sy - 5);
        ctx.lineTo(sx + w * 0.4, sy - 10);
        ctx.moveTo(sx + w * 0.5, sy - 5);
        ctx.lineTo(sx + w * 0.55, sy - 12);
        ctx.stroke();
        // Right antler
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.8, sy + h * 0.12);
        ctx.lineTo(sx + w * 0.9, sy - 5);
        ctx.lineTo(sx + w, sy - 10);
        ctx.moveTo(sx + w * 0.9, sy - 5);
        ctx.lineTo(sx + w * 0.85, sy - 12);
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(sx + w * 0.75, sy + h * 0.22, 3, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#5A3A15';
        ctx.fillRect(sx + w * 0.2, sy + h * 0.75, 6, h * 0.25);
        ctx.fillRect(sx + w * 0.35, sy + h * 0.75, 6, h * 0.25);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.75, 6, h * 0.25);
        ctx.fillRect(sx + w * 0.7, sy + h * 0.75, 6, h * 0.25);

        // Hooves
        ctx.fillStyle = '#3A2A10';
        ctx.fillRect(sx + w * 0.18, sy + h - 4, 10, 4);
        ctx.fillRect(sx + w * 0.33, sy + h - 4, 10, 4);
        ctx.fillRect(sx + w * 0.53, sy + h - 4, 10, 4);
        ctx.fillRect(sx + w * 0.68, sy + h - 4, 10, 4);

        // Crown/armor in phase 2
        if (b.phase === 2) {
            ctx.fillStyle = COLORS.mutedGold;
            ctx.fillRect(sx + w * 0.55, sy + h * 0.08, w * 0.3, 4);
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.6, sy + h * 0.08);
            ctx.lineTo(sx + w * 0.65, sy);
            ctx.lineTo(sx + w * 0.7, sy + h * 0.08);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.72, sy + h * 0.08);
            ctx.lineTo(sx + w * 0.77, sy);
            ctx.lineTo(sx + w * 0.82, sy + h * 0.08);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    // =============================================
    // PROJECTILE RENDERING
    // =============================================

    _renderProjectile(ctx, p) {
        const sx = p.x - Camera.x;
        const sy = p.y - Camera.y;

        if (sx < -50 || sx > CANVAS_WIDTH + 50 || sy < -50 || sy > CANVAS_HEIGHT + 50) return;

        switch (p.type) {
            case 'thorn':
                ctx.fillStyle = '#5A2A15';
                ctx.beginPath();
                ctx.moveTo(sx, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy);
                ctx.lineTo(sx + p.width, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy + p.height);
                ctx.closePath();
                ctx.fill();
                break;

            case 'shockwave':
                ctx.fillStyle = 'rgba(139, 107, 61, 0.7)';
                ctx.fillRect(sx, sy, p.width, p.height);
                ctx.fillStyle = 'rgba(196, 163, 90, 0.5)';
                ctx.fillRect(sx + 2, sy + 2, p.width - 4, p.height - 4);
                break;

            case 'vine_sweep':
                ctx.fillStyle = COLORS.forest.deepCanopy;
                ctx.beginPath();
                ctx.ellipse(sx + p.width / 2, sy + p.height / 2, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                // Thorns
                ctx.fillStyle = '#5A2A15';
                ctx.beginPath();
                ctx.moveTo(sx + p.width / 2, sy - 4);
                ctx.lineTo(sx + p.width / 2 + 3, sy + 4);
                ctx.lineTo(sx + p.width / 2 - 3, sy + 4);
                ctx.closePath();
                ctx.fill();
                break;

            case 'ceiling_rock':
                ctx.fillStyle = '#7A7A6A';
                ctx.fillRect(sx, sy, p.width, p.height);
                ctx.fillStyle = '#5A5A4A';
                ctx.fillRect(sx + 2, sy + 2, p.width - 4, 3);
                ctx.fillRect(sx, sy, 3, p.height);
                break;

            default:
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2, 0, Math.PI * 2);
                ctx.fill();
        }
    },

    // =============================================
    // HELPERS
    // =============================================

    _aabb(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
};
