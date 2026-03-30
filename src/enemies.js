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

    resetBossFight() {
        if (this.boss) {
            const idx = this.enemies.indexOf(this.boss);
            if (idx !== -1) this.enemies.splice(idx, 1);
            this.boss = null;
        }
        this.projectiles = [];
        this._hitCooldowns = {};
        HUD.bossActive = false;
        AudioManager.stopBossMusic();
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
            // Sand Skitter specific
            chargeSpeed: defaults.speed * 2.5,
            detectRange: 200,
            charging: false,
            chargeTimer: 0,
            // Dust Devil specific
            invincible: (type === 'dust_devil' || type === 'dustdevil'),
            sineOffset: Math.random() * Math.PI * 2,
            baseY: y,
            // Mummy specific
            revived: false,
            canRevive: (type === 'mummy'),
            reviveCount: 0,
            reviveTimer: 0,
            // Frost Imp specific
            projectileType: (type === 'frost_imp' || type === 'frostimp') ? 'snowball' : undefined,
            freezesPlatforms: (type === 'frost_imp' || type === 'frostimp'),
            freezeOnHit: (type === 'frost_imp' || type === 'frostimp'),
            snowballFreeze: (type === 'frost_imp' || type === 'frostimp'),
            // Ice Golem specific
            shattersOnDeath: (type === 'ice_golem' || type === 'icegolem'),
            deathType: (type === 'ice_golem' || type === 'icegolem') ? 'shatter' : 'normal',
            fragments: null,
            // Snow Owl specific
            flightTimer: 0,
            swoopTimer: 0,
            swooping: false,
            flightPhase: 0,
            // Magma Slime specific
            splitOnDeath: (type === 'magma_slime' || type === 'magmaslime'),
            splits: (type === 'magma_slime' || type === 'magmaslime'),
            splitCount: (type === 'magma_slime' || type === 'magmaslime') ? 2 : 0,
            isSmallSlime: false,
            // Fire Bat specific (reuses flightTimer/swoopTimer from Snow Owl)
            // Obsidian Knight specific
            hasShield: (type === 'obsidian_knight' || type === 'obsidianknight'),
            shielded: (type === 'obsidian_knight' || type === 'obsidianknight'),
            frontalShield: (type === 'obsidian_knight' || type === 'obsidianknight'),
            shieldDirection: (type === 'obsidian_knight' || type === 'obsidianknight') ? -1 : undefined,
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
            // Desert bosses
            'sand_wyrm': {
                health: 6, maxHealth: 6, width: 48, height: 40, speed: 0,
                attackPattern: 'emerge', attackType: 'emerge',
                patterns: ['emerge']
            },
            'pharaoh_specter': {
                health: 8, maxHealth: 8, width: 36, height: 44, speed: 0,
                attackPattern: 'teleport', attackType: 'teleport',
                patterns: ['teleport', 'summon']
            },
            'hydra_cactus': {
                health: 12, maxHealth: 12, width: 52, height: 56, speed: 0,
                attackPattern: 'multi_head', attackType: 'multi_head',
                patterns: ['multi_head']
            },
            // Tundra bosses
            'frost_bear': {
                health: 7, maxHealth: 7, width: 44, height: 44, speed: 2,
                attackPattern: 'frost_beam', attackType: 'frost_beam',
                patterns: ['frost_beam']
            },
            'crystal_witch': {
                health: 25, maxHealth: 25, width: 36, height: 44, speed: 0,
                attackPattern: 'crystal_shield', attackType: 'crystal_shield',
                patterns: ['crystal_shield']
            },
            'yeti_monarch': {
                health: 9, maxHealth: 9, width: 48, height: 52, speed: 1.5,
                attackPattern: 'boulder', attackType: 'boulder',
                patterns: ['boulder']
            },
            // Volcano bosses
            'lava_serpent': {
                health: 7, maxHealth: 7, width: 48, height: 52, speed: 0,
                attackPattern: 'emerge', attackType: 'emerge',
                patterns: ['emerge', 'platform_destroy']
            },
            'iron_warden': {
                health: 7, maxHealth: 7, width: 44, height: 48, speed: 2,
                attackPattern: 'chain_anchor', attackType: 'chain_anchor',
                patterns: ['chain_anchor', 'slam']
            },
            'dragon_caldera': {
                health: 11, maxHealth: 11, width: 56, height: 52, speed: 1.5,
                attackPattern: 'fire_breath', attackType: 'fire_breath',
                patterns: ['fire_breath', 'dive_bomb']
            },
            // Final boss — The Architect
            'the_architect': {
                health: 19, maxHealth: 19, width: 48, height: 52, speed: 2,
                attackPattern: 'multi_phase', attackType: 'multi_phase',
                patterns: ['shockwave', 'teleport', 'frost_beam', 'fire_breath', 'combined']
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

        // Audio: boss entrance + start boss music
        AudioManager.playBossEntrance();
        AudioManager.startBossMusic();

        // Set HUD
        HUD.bossActive = true;
        HUD.bossHP = boss.health;
        HUD.bossMaxHP = boss.maxHealth;

        // Desert boss extras
        if (type === 'sand_wyrm') {
            boss.submerged = true;
            boss.emergeTimer = 0;
        }
        if (type === 'pharaoh_specter') {
            boss.teleportTimer = 0;
            boss.summonTimer = 0;
        }
        if (type === 'hydra_cactus') {
            boss.heads = [
                { health: 4, maxHealth: 4, active: true, y: 0 },
                { health: 4, maxHealth: 4, active: true, y: -16 },
                { health: 4, maxHealth: 4, active: true, y: -32 }
            ];
            boss.headCount = 3;
        }

        // Set boss name
        const names = {
            'elder_shroomba': 'Elder Shroomba',
            'vine_mother': 'Vine Mother',
            'stag_king': 'Stag King',
            'sand_wyrm': 'Sand Wyrm',
            'pharaoh_specter': 'Pharaoh Specter',
            'hydra_cactus': 'Hydra Cactus',
            'frost_bear': 'Frost Bear',
            'crystal_witch': 'Crystal Witch',
            'yeti_monarch': 'Yeti Monarch',
            'lava_serpent': 'Lava Serpent',
            'iron_warden': 'Iron Warden',
            'dragon_caldera': 'Dragon of the Caldera',
            'the_architect': 'The Architect',
        };
        HUD.bossName = names[type] || type;
        boss.name = names[type] || type;

        // Tundra boss extras
        if (type === 'frost_bear') {
            boss.beamTimer = 0;
            boss.beamActive = false;
            boss.boulderTimer = 0;
        }
        if (type === 'crystal_witch') {
            boss.shieldHP = 20;
            boss.shieldHealth = 20;
            boss.shieldMaxHP = 20;
            boss.shield = { active: true, hp: 20, maxHp: 20 };
            boss.teleportTimer = 0;
            boss.crystalTimer = 0;
        }
        if (type === 'yeti_monarch') {
            boss.boulderTimer = 0;
            boss.boulderCooldown = 90;
            boss.slamTimer = 0;
        }

        // Volcano boss extras
        if (type === 'lava_serpent') {
            boss.submerged = true;
            boss.emergeTimer = 0;
            boss.platformDestroyTimer = 0;
        }
        if (type === 'iron_warden') {
            boss.chainTimer = 0;
            boss.slamTimer = 0;
            boss.anchorActive = false;
        }
        if (type === 'dragon_caldera') {
            boss.phase = 1;
            boss.phases = [1, 2];
            boss.breathTimer = 0;
            boss.diveTimer = 0;
            boss.flying = true;
        }

        // The Architect — 5-phase final boss
        if (type === 'the_architect') {
            boss.phase = 1;
            boss.phases = [1, 2, 3, 4, 5];
            boss.architectAttackTimer = 0;
            boss.architectAttackCycle = 0;
            boss.teleportTimer = 0;
            boss.beamTimer = 0;
            boss.beamActive = false;
            boss.breathTimer = 0;
            boss.diveTimer = 0;
            boss.flying = false;
            boss.shockwaveActive = false;
            boss.architectArenaLeft = 0;
            boss.architectArenaRight = 0;
        }

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
            // Desert enemies
            case 'sand_skitter':
            case 'sandskitter':
                return { width: 26, height: 18, health: 1, speed: 1.2, behavior: 'charge' };
            case 'dust_devil':
            case 'dustdevil':
                return { width: 22, height: 30, health: Infinity, speed: 0.8, behavior: 'sine_wave' };
            case 'mummy':
                return { width: 22, height: 28, health: 2, speed: 0.6, behavior: 'patrol_revive' };
            // Tundra enemies
            case 'frost_imp':
            case 'frostimp':
                return { width: 20, height: 22, health: 1, speed: 0.7, behavior: 'projectile' };
            case 'ice_golem':
            case 'icegolem':
                return { width: 28, height: 32, health: 2, speed: 0.5, behavior: 'patrol_ice' };
            case 'snow_owl':
            case 'snowowl':
                return { width: 24, height: 20, health: 1, speed: 1.5, behavior: 'figure8' };
            // Volcano enemies
            case 'magma_slime':
            case 'magmaslime':
                return { width: 24, height: 20, health: 1, speed: 0.8, behavior: 'patrol' };
            case 'fire_bat':
            case 'firebat':
                return { width: 22, height: 18, health: 1, speed: 1.5, behavior: 'erratic' };
            case 'obsidian_knight':
            case 'obsidianknight':
                return { width: 26, height: 30, health: 2, speed: 0.6, behavior: 'patrol_shield' };
            default:
                return { width: 24, height: 24, health: 1, speed: 1, behavior: 'patrol' };
        }
    },

    // =============================================
    // UPDATE
    // =============================================

    // Public boss update for testing (called by evaluator)
    updateBoss(dt) {
        if (this.boss) {
            this.boss.animTimer += dt || (1 / 60);
            this._updateBoss(this.boss);
        }
    },

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

            if (e.state === 'dying' || e.state === 'shatter') {
                e.deathTimer -= 1 / 60;
                if (e.state === 'shatter' && e.fragments) {
                    // Update shatter fragments with gravity
                    for (const f of e.fragments) {
                        f.x += f.vx;
                        f.y += f.vy;
                        f.vy += 0.15;
                        f.rotation += 0.1;
                    }
                } else {
                    // Float up and fade
                    e.y -= 0.5;
                }
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

            // Handle reviving state for mummies
            if (e.state === 'reviving') {
                e.reviveTimer--;
                e.hitFlash = e.reviveTimer % 6 < 3 ? 1 : 0;
                if (e.reviveTimer <= 0) {
                    e.state = 'active';
                    e.health = e.maxHealth;
                    e.revived = true;
                    e.hitFlash = 12;
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
            case 'sand_skitter':
            case 'sandskitter': this._updateSandSkitter(e); break;
            case 'dust_devil':
            case 'dustdevil': this._updateDustDevil(e); break;
            case 'mummy': this._updateMummy(e); break;
            // Tundra enemies
            case 'frost_imp':
            case 'frostimp': this._updateFrostImp(e); break;
            case 'ice_golem':
            case 'icegolem': this._updateIceGolem(e); break;
            case 'snow_owl':
            case 'snowowl': this._updateSnowOwl(e); break;
            // Volcano enemies
            case 'magma_slime':
            case 'magmaslime': this._updateMagmaSlime(e); break;
            case 'fire_bat':
            case 'firebat': this._updateFireBat(e); break;
            case 'obsidian_knight':
            case 'obsidianknight': this._updateObsidianKnight(e); break;
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
    // DESERT ENEMY AI
    // =============================================

    _updateSandSkitter(e) {
        // Sand Skitter: charges toward player when in range
        const dx = Player.x - e.x;
        const dy = Player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < e.detectRange && !e.charging) {
            e.charging = true;
            e.chargeTimer = 60;
            e.facing = dx > 0 ? 1 : -1;
        }

        if (e.charging) {
            e.chargeTimer--;
            e.vx = e.chargeSpeed * e.facing;
            e.x += e.vx;

            if (e.chargeTimer <= 0) {
                e.charging = false;
            }
        } else {
            // Normal patrol
            e.vx = e.speed * e.facing;
            e.x += e.vx;
        }

        // Gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Floor collision
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        let onGround = false;
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, footRow);
            if (Level.isSolid(c, footRow)) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                onGround = true;
                break;
            }
        }

        // Wall collision
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
                e.charging = false;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
                e.charging = false;
            }
        }

        // Edge detection (no charge off cliffs)
        if (onGround && !e.charging) {
            const lookAheadCol = e.facing > 0
                ? Math.floor((e.x + e.width + 4) / TILE_SIZE)
                : Math.floor((e.x - 4) / TILE_SIZE);
            const floorBelow = Level.getTile(lookAheadCol, footRow);
            if (floorBelow === TILE_EMPTY || floorBelow === TILE_HAZARD) {
                e.facing *= -1;
            }
        }

        e.animFrame = Math.floor(e.animTimer * 6) % 4;
    },

    _updateDustDevil(e) {
        // Dust Devil: sine-wave movement, invincible, pushes player on contact
        e.x += e.speed * e.facing;
        e.y = e.baseY + Math.sin(e.animTimer * 2 + e.sineOffset) * 40;

        // Wall collision: reverse
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
            }
        }

        e.animFrame = Math.floor(e.animTimer * 8) % 4;
    },

    _updateMummy(e) {
        // Mummy: patrol, revives once after death
        if (e.state === 'reviving') {
            e.reviveTimer--;
            if (e.reviveTimer <= 0) {
                e.state = 'active';
                e.health = e.maxHealth;
                e.revived = true;
                e.hitFlash = 12;
            }
            return;
        }

        // Normal patrol (like shroomba but slower)
        e.vx = e.speed * e.facing;
        e.x += e.vx;

        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        let onGround = false;
        for (let c = leftCol; c <= rightCol; c++) {
            if (Level.isSolid(c, footRow)) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                onGround = true;
                break;
            }
        }

        // Wall collision
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.isSolid(wallCol, midRow)) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
            }
        }

        if (onGround) {
            const lookAheadCol = e.facing > 0
                ? Math.floor((e.x + e.width + 4) / TILE_SIZE)
                : Math.floor((e.x - 4) / TILE_SIZE);
            const floorBelow = Level.getTile(lookAheadCol, footRow);
            if (floorBelow === TILE_EMPTY || floorBelow === TILE_HAZARD) {
                e.facing *= -1;
            }
        }

        e.animFrame = Math.floor(e.animTimer * 3) % 2;
    },

    // =============================================
    // TUNDRA ENEMY AI
    // =============================================

    _updateFrostImp(e) {
        // Frost Imp: stationary-ish, throws snowball projectiles in arc
        e.shootTimer--;
        if (e.shootTimer <= 0) {
            e.shootTimer = 90 + Math.random() * 40;
            // Fire snowball in arc toward player
            const dx = Player.x - e.x;
            const dy = Player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 350 && dist > 0) {
                const speed = 2.5;
                const angle = Math.atan2(dy - 40, dx); // Aim above player for arc
                this.projectiles.push({
                    x: e.x + e.width / 2,
                    y: e.y + 4,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2, // Arc upward
                    width: 10,
                    height: 10,
                    life: 3,
                    hostile: true,
                    type: 'snowball',
                    gravity: 0.12,
                    animTimer: 0,
                    freezesPlatforms: true,
                });
                e.facing = dx > 0 ? 1 : -1;
            }
        }

        // Light patrol movement
        e.vx = e.speed * e.facing * 0.3;
        e.x += e.vx;

        // Gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Floor collision
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, footRow);
            if (tile === TILE_SOLID || tile === TILE_ICE || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                break;
            }
        }

        // Wall collision / edge detection
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.getTile(wallCol, midRow) === TILE_SOLID || Level.getTile(wallCol, midRow) === TILE_ICE) {
                e.facing = -1;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            if (Level.getTile(wallCol, midRow) === TILE_SOLID || Level.getTile(wallCol, midRow) === TILE_ICE) {
                e.facing = 1;
            }
        }

        // Edge check
        const lookAheadCol = e.facing > 0
            ? Math.floor((e.x + e.width + 4) / TILE_SIZE)
            : Math.floor((e.x - 4) / TILE_SIZE);
        const floorBelow = Level.getTile(lookAheadCol, footRow);
        if (floorBelow === TILE_EMPTY || floorBelow === TILE_HAZARD) {
            e.facing *= -1;
        }

        e.animFrame = Math.floor(e.animTimer * 4) % 2;
    },

    _updateIceGolem(e) {
        // Ice Golem: patrols on ground, slides on ice surfaces
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);

        // Check if on ice
        let onIce = false;
        for (let c = leftCol; c <= rightCol; c++) {
            if (Level.getTile(c, footRow) === TILE_ICE) {
                onIce = true;
                break;
            }
        }
        e.onIce = onIce;

        // Movement — faster on ice, less responsive
        if (onIce) {
            e.vx += e.facing * 0.03;
            e.vx *= 0.99; // Ice friction
            if (Math.abs(e.vx) > e.speed * 2) e.vx = e.speed * 2 * e.facing;
        } else {
            e.vx = e.speed * e.facing;
        }
        e.x += e.vx;

        // Gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Floor collision
        let onGround = false;
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, Math.floor((e.y + e.height) / TILE_SIZE));
            if (tile === TILE_SOLID || tile === TILE_ICE || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE) {
                e.y = Math.floor((e.y + e.height) / TILE_SIZE) * TILE_SIZE - e.height;
                e.vy = 0;
                onGround = true;
                break;
            }
        }

        // Wall collision
        if (e.facing > 0) {
            const wallCol = Math.floor((e.x + e.width) / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_ICE) {
                e.x = wallCol * TILE_SIZE - e.width;
                e.facing = -1;
                e.vx = 0;
            }
        } else {
            const wallCol = Math.floor(e.x / TILE_SIZE);
            const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
            const tile = Level.getTile(wallCol, midRow);
            if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_ICE) {
                e.x = (wallCol + 1) * TILE_SIZE;
                e.facing = 1;
                e.vx = 0;
            }
        }

        // Edge detection
        if (onGround && !onIce) {
            const lookCol = e.facing > 0
                ? Math.floor((e.x + e.width + 4) / TILE_SIZE)
                : Math.floor((e.x - 4) / TILE_SIZE);
            const floor = Level.getTile(lookCol, footRow);
            if (floor === TILE_EMPTY || floor === TILE_HAZARD) {
                e.facing *= -1;
            }
        }

        e.animFrame = Math.floor(e.animTimer * 3) % 2;
    },

    _updateSnowOwl(e) {
        // Snow Owl: figure-8 flight pattern + swoop at player
        e.flightTimer += 1 / 60;
        e.swoopTimer -= 1 / 60;

        if (!e.swooping) {
            // Figure-8 pattern
            const speed = e.speed;
            const phase = e.flightTimer * 1.5 + (e.flightPhase || 0);
            e.vx = Math.sin(phase) * speed;
            e.vy = Math.sin(phase * 2) * speed * 0.5;

            e.x += e.vx;
            e.y += e.vy;

            e.facing = e.vx > 0 ? 1 : -1;

            // Check if player is below and initiate swoop
            const dx = Player.x - e.x;
            const dy = Player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200 && dy > 30 && e.swoopTimer <= 0) {
                e.swooping = true;
                e.swoopTimer = 3; // cooldown after swoop
                e.vx = (dx / dist) * 4;
                e.vy = (dy / dist) * 4;
            }
        } else {
            // Swooping — dive toward player position
            e.x += e.vx;
            e.y += e.vy;

            // Pull out of swoop after a bit or near ground
            e.vy -= 0.04; // gradually pull up
            if (e.vy < -2 || e.y > (Level.height - 4) * TILE_SIZE) {
                e.swooping = false;
                e.vy = -2;
            }
        }

        // Keep within level bounds (vertical)
        if (e.y < 2 * TILE_SIZE) {
            e.y = 2 * TILE_SIZE;
            e.vy = Math.abs(e.vy);
        }
        if (e.y > (Level.height - 4) * TILE_SIZE) {
            e.y = (Level.height - 4) * TILE_SIZE;
            e.vy = -Math.abs(e.vy);
        }

        e.animFrame = Math.floor(e.animTimer * 6) % 4;
    },

    // =============================================
    // VOLCANO ENEMY AI
    // =============================================

    _updateMagmaSlime(e) {
        // Magma Slime: patrol like shroomba but bouncy movement
        e.vx = e.speed * e.facing;
        e.x += e.vx;

        // Gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Floor collision
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, footRow);
            if (tile === TILE_SOLID || tile === TILE_ONE_WAY) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                break;
            }
        }

        // Wall detection / patrol reversal
        const checkCol = e.facing > 0
            ? Math.floor((e.x + e.width) / TILE_SIZE)
            : Math.floor(e.x / TILE_SIZE);
        const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
        if (Level.getTile(checkCol, midRow) === TILE_SOLID) {
            e.facing *= -1;
        }

        // Edge detection: reverse at ledge
        const aheadCol = e.facing > 0
            ? Math.floor((e.x + e.width + 2) / TILE_SIZE)
            : Math.floor((e.x - 2) / TILE_SIZE);
        const belowRow = Math.floor((e.y + e.height + 4) / TILE_SIZE);
        const belowTile = Level.getTile(aheadCol, belowRow);
        if (belowTile === TILE_EMPTY || belowTile === TILE_LAVA) {
            e.facing *= -1;
        }

        e.animFrame = Math.floor(e.animTimer * 4) % 2;
    },

    _updateFireBat(e) {
        // Fire Bat: erratic/swooping flight pattern
        e.flightTimer += 1 / 60;
        e.swoopTimer -= 1 / 60;

        if (!e.swooping) {
            // Erratic flight: sine wave with random-ish changes
            const speed = e.speed;
            const t = e.flightTimer * 2 + e.sineOffset;
            e.vx = Math.sin(t * 1.3) * speed * 1.2;
            e.vy = Math.cos(t * 0.7) * speed * 0.8;

            e.x += e.vx;
            e.y += e.vy;
            e.facing = e.vx > 0 ? 1 : -1;

            // Swoop at player when close
            const dx = Player.x - e.x;
            const dy = Player.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180 && dy > 20 && e.swoopTimer <= 0) {
                e.swooping = true;
                e.swoopTimer = 2.5;
                e.vx = (dx / dist) * 4.5;
                e.vy = (dy / dist) * 4.5;
            }
        } else {
            e.x += e.vx;
            e.y += e.vy;
            e.vy -= 0.05;
            if (e.vy < -2 || e.y > (Level.height - 4) * TILE_SIZE) {
                e.swooping = false;
                e.vy = -2;
            }
        }

        // Keep within bounds
        if (e.y < 2 * TILE_SIZE) { e.y = 2 * TILE_SIZE; e.vy = Math.abs(e.vy); }
        if (e.y > (Level.height - 4) * TILE_SIZE) { e.y = (Level.height - 4) * TILE_SIZE; e.vy = -Math.abs(e.vy); }

        e.animFrame = Math.floor(e.animTimer * 8) % 4;
    },

    _updateObsidianKnight(e) {
        // Obsidian Knight: slow patrol with frontal shield
        e.vx = e.speed * e.facing;
        e.x += e.vx;

        // Gravity
        e.vy += GRAVITY;
        if (e.vy > TERMINAL_VELOCITY) e.vy = TERMINAL_VELOCITY;
        e.y += e.vy;

        // Floor collision
        const footRow = Math.floor((e.y + e.height) / TILE_SIZE);
        const leftCol = Math.floor(e.x / TILE_SIZE);
        const rightCol = Math.floor((e.x + e.width - 1) / TILE_SIZE);
        for (let c = leftCol; c <= rightCol; c++) {
            const tile = Level.getTile(c, footRow);
            if (tile === TILE_SOLID || tile === TILE_ONE_WAY) {
                e.y = footRow * TILE_SIZE - e.height;
                e.vy = 0;
                break;
            }
        }

        // Face toward player if close
        const dx = Player.x - (e.x + e.width / 2);
        if (Math.abs(dx) < 200) {
            e.facing = dx > 0 ? 1 : -1;
            e.shieldDirection = e.facing;
        }

        // Wall detection
        const checkCol = e.facing > 0
            ? Math.floor((e.x + e.width) / TILE_SIZE)
            : Math.floor(e.x / TILE_SIZE);
        const midRow = Math.floor((e.y + e.height / 2) / TILE_SIZE);
        if (Level.getTile(checkCol, midRow) === TILE_SOLID) {
            e.facing *= -1;
        }

        // Edge detection
        const aheadCol = e.facing > 0
            ? Math.floor((e.x + e.width + 2) / TILE_SIZE)
            : Math.floor((e.x - 2) / TILE_SIZE);
        const belowRow = Math.floor((e.y + e.height + 4) / TILE_SIZE);
        const belowTile = Level.getTile(aheadCol, belowRow);
        if (belowTile === TILE_EMPTY || belowTile === TILE_LAVA) {
            e.facing *= -1;
        }

        e.animFrame = Math.floor(e.animTimer * 3) % 2;
    },

    // =============================================
    // BOSS AI
    // =============================================

    _updateBoss(b) {
        b.stateTimer++;

        // Update HUD
        HUD.bossHP = b.health;

        // Update boss music tempo based on health ratio
        if (b.maxHealth > 0) {
            AudioManager.updateBossMusic(b.health / b.maxHealth);
        }

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

        // Phase check (skip for the_architect — has its own 5-phase system)
        if (b.type === 'the_architect') {
            // 5-phase transitions for The Architect
            if (b.health <= 3 && b.phase < 5) {
                b.phase = 5;
                b.hitFlash = 15;
                AudioManager.playBossPhaseTransition();
                for (let i = 0; i < 12; i++) {
                    Particles.spawnAttackSparks(
                        b.x + b.width / 2 + (Math.random() - 0.5) * b.width,
                        b.y + b.height / 2 + (Math.random() - 0.5) * b.height
                    );
                }
            } else if (b.health <= 7 && b.phase < 4) {
                b.phase = 4;
                b.hitFlash = 15;
                AudioManager.playBossPhaseTransition();
                for (let i = 0; i < 12; i++) {
                    Particles.spawnAttackSparks(
                        b.x + b.width / 2 + (Math.random() - 0.5) * b.width,
                        b.y + b.height / 2 + (Math.random() - 0.5) * b.height
                    );
                }
            } else if (b.health <= 11 && b.phase < 3) {
                b.phase = 3;
                b.hitFlash = 15;
                AudioManager.playBossPhaseTransition();
                for (let i = 0; i < 12; i++) {
                    Particles.spawnAttackSparks(
                        b.x + b.width / 2 + (Math.random() - 0.5) * b.width,
                        b.y + b.height / 2 + (Math.random() - 0.5) * b.height
                    );
                }
            } else if (b.health <= 15 && b.phase < 2) {
                b.phase = 2;
                b.hitFlash = 15;
                AudioManager.playBossPhaseTransition();
                for (let i = 0; i < 12; i++) {
                    Particles.spawnAttackSparks(
                        b.x + b.width / 2 + (Math.random() - 0.5) * b.width,
                        b.y + b.height / 2 + (Math.random() - 0.5) * b.height
                    );
                }
            }
        } else if (b.health <= Math.floor(b.maxHealth * 0.5) && b.phase === 1) {
            b.phase = 2;
            b.hitFlash = 15;
            AudioManager.playBossPhaseTransition();
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
            case 'sand_wyrm': this._updateSandWyrm(b); break;
            case 'pharaoh_specter': this._updatePharaohSpecter(b); break;
            case 'hydra_cactus': this._updateHydraCactus(b); break;
            // Tundra bosses
            case 'frost_bear': this._updateFrostBear(b); break;
            case 'crystal_witch': this._updateCrystalWitch(b); break;
            case 'yeti_monarch': this._updateYetiMonarch(b); break;
            // Volcano bosses
            case 'lava_serpent': this._updateLavaSerpent(b); break;
            case 'iron_warden': this._updateIronWarden(b); break;
            case 'dragon_caldera': this._updateDragonCaldera(b); break;
            case 'the_architect': this._updateArchitect(b); break;
        }

        // Apply gravity to bosses that use it
        if (b.type !== 'vine_mother' && b.type !== 'pharaoh_specter' && b.type !== 'hydra_cactus'
            && b.type !== 'crystal_witch' && b.type !== 'lava_serpent' && b.type !== 'dragon_caldera'
            && b.type !== 'the_architect') {
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
        // Pause AI when player is dead
        if (Player.state === 'dead') return;

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

                // Screen shake + dust on shockwave slam
                Camera.shake(8, 0.4);
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

        // Clamp boss within arena bounds
        const arenaLeft = (Level.bossArenaX || 0) + TILE_SIZE;
        const arenaRight = (Level.width - 1) * TILE_SIZE - b.width;
        if (b.x < arenaLeft) b.x = arenaLeft;
        if (b.x > arenaRight) b.x = arenaRight;
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
    // DESERT BOSS AI
    // =============================================

    _updateSandWyrm(b) {
        // Sand Wyrm: emerges from below, attacks, then submerges
        const vulnDuration = b.phase === 1 ? 80 : 55;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            if (b.attackTimer === 1) {
                b.submerged = true;
                // Move to player's X position
                b.targetX = Player.x;
            }

            // Submerged phase: move underground toward player
            if (b.attackTimer < 30) {
                if (b.submerged) {
                    const dx = b.targetX - b.x;
                    b.x += Math.sign(dx) * 3;
                }
            }

            // Emerge!
            if (b.attackTimer === 30) {
                b.submerged = false;
                b.vy = -12;
                // Spawn projectiles (sand spray)
                for (let i = -2; i <= 2; i++) {
                    this.projectiles.push({
                        x: b.x + b.width / 2 + i * 15,
                        y: b.y + b.height,
                        vx: i * 1.5,
                        vy: -3 - Math.random() * 2,
                        width: 12, height: 12,
                        life: 1.2, hostile: true,
                        type: 'sand_spray', ignoreWalls: true,
                        gravity: 0.15,
                        animTimer: 0,
                    });
                }
                Particles.spawnLandingDust(b.x + b.width / 2, b.y + b.height);
            }

            // Phase 2: additional sand burst
            if (b.phase === 2 && b.attackTimer === 50) {
                for (let i = -3; i <= 3; i++) {
                    this.projectiles.push({
                        x: b.x + b.width / 2 + i * 12,
                        y: b.y,
                        vx: i * 2,
                        vy: -4,
                        width: 10, height: 10,
                        life: 1.5, hostile: true,
                        type: 'sand_spray', ignoreWalls: true,
                        gravity: 0.12,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 65 : 75;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.submerged = false;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updatePharaohSpecter(b) {
        // Pharaoh Specter: teleports and summons minions/projectiles
        const vulnDuration = b.phase === 1 ? 90 : 60;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Teleport at start of attack
            if (b.attackTimer === 1) {
                b.teleportTimer = 0;
                // Teleport to random position in arena
                const arenaLeft = (Level.bossArenaX || 0) + TILE_SIZE * 2;
                const arenaRight = Level.width * TILE_SIZE - TILE_SIZE * 3;
                b.x = arenaLeft + Math.random() * (arenaRight - arenaLeft);
                b.y = (Level.height * 0.3 + Math.random() * Level.height * 0.3) * TILE_SIZE;
                b.facing = Player.x > b.x ? 1 : -1;
                // Teleport particles
                for (let i = 0; i < 8; i++) {
                    Particles.particles.push({
                        x: b.x + b.width / 2 + (Math.random() - 0.5) * 30,
                        y: b.y + b.height / 2 + (Math.random() - 0.5) * 30,
                        vx: (Math.random() - 0.5) * 3,
                        vy: -1 - Math.random() * 2,
                        gravity: 0,
                        size: 3 + Math.random() * 3,
                        color: COLORS.desert.bleachedBone,
                        life: 0.6,
                        maxLife: 0.6,
                        shrink: true,
                        shape: 'circle'
                    });
                }
            }

            // Fire projectiles
            if (b.attackTimer === 25) {
                const dx = Player.x - b.x;
                const dy = Player.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const count = b.phase === 1 ? 3 : 5;
                    for (let i = 0; i < count; i++) {
                        const angle = Math.atan2(dy, dx) + (i - Math.floor(count / 2)) * 0.3;
                        this.projectiles.push({
                            x: b.x + b.width / 2,
                            y: b.y + b.height / 2,
                            vx: Math.cos(angle) * 2.5,
                            vy: Math.sin(angle) * 2.5,
                            width: 10, height: 10,
                            life: 2.5, hostile: true,
                            type: 'spectre_orb', ignoreWalls: false,
                            animTimer: 0,
                        });
                    }
                }
            }

            // Phase 2: second teleport + attack
            if (b.phase === 2 && b.attackTimer === 45) {
                const arenaLeft = (Level.bossArenaX || 0) + TILE_SIZE * 2;
                const arenaRight = Level.width * TILE_SIZE - TILE_SIZE * 3;
                b.x = arenaLeft + Math.random() * (arenaRight - arenaLeft);
                b.y = (Level.height * 0.25) * TILE_SIZE;
                // Another volley
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    this.projectiles.push({
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2,
                        vx: Math.cos(angle) * 2,
                        vy: Math.sin(angle) * 2,
                        width: 10, height: 10,
                        life: 2.5, hostile: true,
                        type: 'spectre_orb', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 60 : 70;
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
            // Hover slightly
            b.y += Math.sin(b.stateTimer * 0.1) * 0.3;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updateHydraCactus(b) {
        // Hydra Cactus: 3 heads, each with 4 HP, total 12
        const vulnDuration = b.phase === 1 ? 90 : 65;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Each head attacks independently
            if (b.attackTimer === 20 && b.heads[0].active) {
                // Head 1: spray left
                this.projectiles.push({
                    x: b.x - 10, y: b.y + 10,
                    vx: -2.5, vy: -1,
                    width: 10, height: 10,
                    life: 2.0, hostile: true,
                    type: 'cactus_thorn', ignoreWalls: false,
                    gravity: 0.08, animTimer: 0,
                });
            }
            if (b.attackTimer === 30 && b.heads[1].active) {
                // Head 2: spray at player
                const dx = Player.x - b.x;
                const dy = Player.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                this.projectiles.push({
                    x: b.x + b.width / 2, y: b.y - 10,
                    vx: (dx / dist) * 3, vy: (dy / dist) * 3,
                    width: 10, height: 10,
                    life: 2.0, hostile: true,
                    type: 'cactus_thorn', ignoreWalls: false,
                    animTimer: 0,
                });
            }
            if (b.attackTimer === 40 && b.heads[2].active) {
                // Head 3: spray right
                this.projectiles.push({
                    x: b.x + b.width + 10, y: b.y + 10,
                    vx: 2.5, vy: -1,
                    width: 10, height: 10,
                    life: 2.0, hostile: true,
                    type: 'cactus_thorn', ignoreWalls: false,
                    gravity: 0.08, animTimer: 0,
                });
            }

            // Phase 2: additional thorns
            if (b.phase === 2 && b.attackTimer === 50) {
                for (let i = 0; i < 4; i++) {
                    const angle = (i / 4) * Math.PI * 2;
                    this.projectiles.push({
                        x: b.x + b.width / 2, y: b.y + b.height / 2,
                        vx: Math.cos(angle) * 2, vy: Math.sin(angle) * 2,
                        width: 8, height: 8,
                        life: 2.0, hostile: true,
                        type: 'cactus_thorn', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 65 : 75;
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
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }

        // Update head states based on health
        if (b.heads) {
            // Distribute damage across heads
            let totalDamage = b.maxHealth - b.health;
            for (let i = 0; i < b.heads.length; i++) {
                const headDamage = Math.min(totalDamage, b.heads[i].maxHealth);
                b.heads[i].health = b.heads[i].maxHealth - headDamage;
                totalDamage -= headDamage;
                if (totalDamage < 0) totalDamage = 0;
                b.heads[i].active = b.heads[i].health > 0;
            }
        }
    },

    // =============================================
    // TUNDRA BOSS AI
    // =============================================

    _updateFrostBear(b) {
        // Frost Bear: 7 HP, frost beam attack, charges
        const vulnDuration = b.phase === 1 ? 80 : 55;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Phase 1: Move toward player then fire frost beam
            const dx = Player.x - b.x;
            b.facing = dx > 0 ? 1 : -1;

            if (b.attackTimer < 30) {
                // Approach player
                b.vx = b.facing * b.speed * (b.phase === 2 ? 1.5 : 1);
            } else if (b.attackTimer === 30) {
                // Stop and telegraph beam
                b.vx = 0;
                b.beamActive = true;
            } else if (b.attackTimer === 40) {
                // Fire frost beam — horizontal beam of frost projectiles
                const beamDir = b.facing;
                for (let i = 0; i < 5; i++) {
                    this.projectiles.push({
                        x: b.x + (beamDir > 0 ? b.width : 0),
                        y: b.y + b.height / 2 - 4 + (i - 2) * 4,
                        vx: beamDir * (3 + i * 0.3),
                        vy: 0,
                        width: 12,
                        height: 6,
                        life: 2.0,
                        hostile: true,
                        type: 'frost_beam',
                        ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            // Phase 2 extra: slam attack
            if (b.phase === 2 && b.attackTimer === 55) {
                // Ground slam — creates shockwave
                this.projectiles.push({
                    x: b.x - 30, y: b.y + b.height - 8,
                    vx: -2.5, vy: 0,
                    width: 60, height: 12,
                    life: 1.0, hostile: true,
                    type: 'frost_beam', ignoreWalls: true,
                    animTimer: 0,
                });
                this.projectiles.push({
                    x: b.x + b.width - 30, y: b.y + b.height - 8,
                    vx: 2.5, vy: 0,
                    width: 60, height: 12,
                    life: 1.0, hostile: true,
                    type: 'frost_beam', ignoreWalls: true,
                    animTimer: 0,
                });
            }

            const attackDuration = b.phase === 1 ? 60 : 70;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
                b.beamActive = false;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.beamActive = false;
            b.vx = 0;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updateCrystalWitch(b) {
        // Crystal Witch: 25 HP total = 20 shield + 5 witch
        // Shield must be destroyed before witch can be damaged
        const vulnDuration = b.phase === 1 ? 90 : 60;

        // Update shield state
        if (b.shield && b.shield.active) {
            b.shieldHP = Math.max(0, b.maxHealth - 5 - (b.maxHealth - b.health - 5));
            if (b.shieldHP < 0) b.shieldHP = 0;
            b.shield.hp = b.health > 5 ? b.health - 5 : 0;
            b.shieldHealth = b.shield.hp;
            if (b.health <= 5) {
                b.shield.active = false;
                b.shieldHP = 0;
                b.shieldHealth = 0;
            }
        }

        // Float in place
        b.y += Math.sin(b.stateTimer * 0.05) * 0.3;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Teleport to random position
            if (b.attackTimer === 15) {
                const arenaLeft = Level.bossArenaX + 3 * TILE_SIZE;
                const arenaRight = Level.bossArenaX + 25 * TILE_SIZE;
                b.x = arenaLeft + Math.random() * (arenaRight - arenaLeft);
                b.y = 6 * TILE_SIZE + Math.random() * 4 * TILE_SIZE;
                // Spawn teleport particles
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    Particles.particles.push({
                        x: b.x + b.width / 2, y: b.y + b.height / 2,
                        vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                        gravity: 0, size: 3, color: COLORS.tundra.iceBlue,
                        life: 0.5, maxLife: 0.5, shrink: true, shape: 'circle'
                    });
                }
            }

            // Fire crystal shards
            if (b.attackTimer === 30) {
                const count = b.phase === 1 ? 4 : 6;
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    this.projectiles.push({
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2,
                        vx: Math.cos(angle) * 2.5,
                        vy: Math.sin(angle) * 2.5,
                        width: 8, height: 8,
                        life: 2.5, hostile: true,
                        type: 'crystal_shard', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            // Phase 2: second wave
            if (b.phase === 2 && b.attackTimer === 45) {
                const dx = Player.x - b.x;
                const dy = Player.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                for (let i = 0; i < 3; i++) {
                    const spread = (i - 1) * 0.3;
                    this.projectiles.push({
                        x: b.x + b.width / 2,
                        y: b.y + b.height / 2,
                        vx: (dx / dist) * 3 + spread,
                        vy: (dy / dist) * 3,
                        width: 10, height: 10,
                        life: 2.5, hostile: true,
                        type: 'crystal_shard', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 55 : 65;
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
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updateYetiMonarch(b) {
        // Yeti Monarch: 9 HP, boulder throw, ground slam, tiered arena
        const vulnDuration = b.phase === 1 ? 80 : 55;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Move toward player
            const dx = Player.x - b.x;
            b.facing = dx > 0 ? 1 : -1;

            if (b.attackTimer < 25) {
                b.vx = b.facing * b.speed * (b.phase === 2 ? 1.4 : 1);
            } else if (b.attackTimer === 25) {
                b.vx = 0;
            }

            // Boulder throw
            if (b.attackTimer === 35) {
                this.projectiles.push({
                    x: b.x + b.width / 2,
                    y: b.y - 10,
                    vx: b.facing * 3,
                    vy: -4,
                    width: 16, height: 16,
                    life: 3.0, hostile: true,
                    type: 'boulder', ignoreWalls: false,
                    gravity: 0.15, animTimer: 0,
                });
                b.boulderTimer = 0;
            }

            // Phase 2: second boulder
            if (b.phase === 2 && b.attackTimer === 50) {
                this.projectiles.push({
                    x: b.x + b.width / 2,
                    y: b.y - 10,
                    vx: b.facing * 2.5,
                    vy: -5,
                    width: 16, height: 16,
                    life: 3.0, hostile: true,
                    type: 'boulder', ignoreWalls: false,
                    gravity: 0.15, animTimer: 0,
                });
            }

            // Phase 2: ground slam shockwave
            if (b.phase === 2 && b.attackTimer === 60) {
                this.projectiles.push({
                    x: b.x - 20, y: b.y + b.height - 8,
                    vx: -3, vy: 0,
                    width: 40, height: 10,
                    life: 0.8, hostile: true,
                    type: 'shockwave', ignoreWalls: true,
                    animTimer: 0,
                });
                this.projectiles.push({
                    x: b.x + b.width - 20, y: b.y + b.height - 8,
                    vx: 3, vy: 0,
                    width: 40, height: 10,
                    life: 0.8, hostile: true,
                    type: 'shockwave', ignoreWalls: true,
                    animTimer: 0,
                });
            }

            const attackDuration = b.phase === 1 ? 55 : 75;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vx = 0;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    // =============================================
    // VOLCANO BOSS AI
    // =============================================

    _updateLavaSerpent(b) {
        // Lava Serpent: 7 HP, emerges from lava, destroys platforms
        const vulnDuration = b.phase === 1 ? 90 : 60;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            if (b.submerged) {
                // Move underwater toward player
                b.emergeTimer++;
                const targetX = Player.x - b.width / 2;
                b.x += (targetX - b.x) * 0.02;

                if (b.emergeTimer >= 60) {
                    b.submerged = false;
                    b.emergeTimer = 0;
                    b.vy = -8;
                    // Destroy nearby platforms
                    const col = Math.floor(b.x / TILE_SIZE);
                    for (let c = col - 1; c <= col + 2; c++) {
                        for (let r = 10; r <= 14; r++) {
                            if (Level.getTile(c, r) === TILE_ONE_WAY) {
                                Level.setTile(c, r, TILE_EMPTY);
                                Particles.spawnBlockBreak(c, r);
                            }
                        }
                    }
                }
            } else {
                // Emerged — fire projectiles then submerge
                b.y += b.vy;
                b.vy += 0.1;

                if (b.attackTimer === 30 || (b.phase === 2 && b.attackTimer === 45)) {
                    // Fire projectile
                    const dx = Player.x - b.x;
                    const dy = Player.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    this.projectiles.push({
                        x: b.x + b.width / 2, y: b.y,
                        vx: (dx / dist) * 3.5, vy: (dy / dist) * 3.5,
                        width: 12, height: 12,
                        life: 2.0, hostile: true,
                        type: 'fireball', ignoreWalls: false,
                        animTimer: 0,
                    });
                }

                const attackDuration = b.phase === 1 ? 60 : 55;
                if (b.attackTimer >= attackDuration) {
                    b.state = 'vulnerable';
                    b.vulnerable = true;
                    b.vulnerableTimer = vulnDuration;
                    b.stateTimer = 0;
                    b.attackTimer = 0;
                }
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.submerged = true;
                b.emergeTimer = 0;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }
    },

    _updateIronWarden(b) {
        // Iron Warden: 7 HP, chain anchor attacks, slam
        const vulnDuration = b.phase === 1 ? 80 : 55;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Move toward player
            const dx = Player.x - b.x;
            b.facing = dx > 0 ? 1 : -1;

            if (b.attackTimer < 25) {
                b.vx = b.facing * b.speed * (b.phase === 2 ? 1.5 : 1);
            } else if (b.attackTimer === 25) {
                b.vx = 0;
            }

            // Chain anchor attack
            if (b.attackTimer === 30) {
                b.anchorActive = true;
                this.projectiles.push({
                    x: b.x + (b.facing > 0 ? b.width : -16),
                    y: b.y + b.height / 2,
                    vx: b.facing * 5, vy: 0,
                    width: 16, height: 12,
                    life: 1.5, hostile: true,
                    type: 'chain_anchor', ignoreWalls: false,
                    animTimer: 0,
                });
            }

            // Phase 2: slam attack
            if (b.phase === 2 && b.attackTimer === 50) {
                b.vy = -10;
                b.slamTimer = 30;
            }

            if (b.slamTimer > 0) {
                b.slamTimer--;
                if (b.slamTimer === 0 && b.vy >= 0) {
                    // Ground slam shockwave
                    this.projectiles.push({
                        x: b.x - 20, y: b.y + b.height - 8,
                        vx: -3.5, vy: 0,
                        width: 30, height: 10,
                        life: 0.8, hostile: true,
                        type: 'shockwave', ignoreWalls: true,
                        animTimer: 0,
                    });
                    this.projectiles.push({
                        x: b.x + b.width - 10, y: b.y + b.height - 8,
                        vx: 3.5, vy: 0,
                        width: 30, height: 10,
                        life: 0.8, hostile: true,
                        type: 'shockwave', ignoreWalls: true,
                        animTimer: 0,
                    });
                }
            }

            const attackDuration = b.phase === 1 ? 55 : 70;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
                b.anchorActive = false;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vx = 0;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
            }
        }

        // Horizontal movement
        b.x += b.vx;
        b.facing = b.vx > 0 ? 1 : (b.vx < 0 ? -1 : b.facing);
    },

    _updateDragonCaldera(b) {
        // Dragon of the Caldera: 11 HP, 2-phase, fire breath + dive bomb
        const vulnDuration = b.phase === 1 ? 80 : 55;

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;

            // Hover movement
            const t = b.stateTimer * 0.02;
            b.x += Math.sin(t) * 1.5;
            b.y += Math.cos(t * 0.7) * 0.8;
            b.facing = Player.x > b.x ? 1 : -1;

            // Phase 1: fire breath
            if (b.attackTimer === 30) {
                for (let i = 0; i < 3; i++) {
                    this.projectiles.push({
                        x: b.x + (b.facing > 0 ? b.width : -10),
                        y: b.y + b.height * 0.3 + i * 8,
                        vx: b.facing * (3 + i * 0.5), vy: (i - 1) * 0.5,
                        width: 14, height: 10,
                        life: 1.5, hostile: true,
                        type: 'fireball', ignoreWalls: false,
                        animTimer: 0,
                    });
                }
            }

            // Phase 2: additional dive bomb
            if (b.phase === 2 && b.attackTimer === 50) {
                b.vy = 6;
                b.diveTimer = 20;
            }

            if (b.diveTimer > 0) {
                b.diveTimer--;
                b.y += b.vy;
                if (b.diveTimer === 0) {
                    b.vy = -3;
                    // Create fire trail on ground
                    for (let i = 0; i < 3; i++) {
                        this.projectiles.push({
                            x: b.x + (i - 1) * 30, y: b.y + b.height,
                            vx: 0, vy: -0.5,
                            width: 20, height: 20,
                            life: 1.5, hostile: true,
                            type: 'fire_trail', ignoreWalls: true,
                            animTimer: 0,
                        });
                    }
                }
            }

            const attackDuration = b.phase === 1 ? 65 : 80;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
                // Land for vulnerability
                b.y = (Level.height - 5) * TILE_SIZE;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.stateTimer = 0;
                b.attackTimer = 0;
                b.diveTimer = 0;
                // Fly back up
                b.y = (Level.height - 10) * TILE_SIZE;
            }
        }
    },

    // =============================================
    // BOSS DEFEAT
    // =============================================

    _onBossDefeated() {
        HUD.bossActive = false;
        AudioManager.stopBossMusic();

        // Determine world-specific colors for boss defeat particles (C-16)
        const stageId = GameState.currentStageId || '1-1';
        const worldNum = parseInt(stageId.charAt(0));
        let bossColors;
        if (worldNum === 1) {
            // Forest — greens/browns
            bossColors = [COLORS.forest.leaf, COLORS.forest.deepCanopy, COLORS.forest.highlight, COLORS.forest.bark, '#6BC060'];
        } else if (worldNum === 2) {
            // Desert — sands/golds
            bossColors = [COLORS.desert.sand, COLORS.desert.darkSand, COLORS.desert.lightStone, COLORS.desert.bleachedBone, COLORS.mutedGold];
        } else if (worldNum === 3) {
            // Tundra — blues/whites
            bossColors = [COLORS.tundra.iceBlue, COLORS.tundra.snowWhite, COLORS.tundra.deepIce, COLORS.tundra.auroraGreen, '#FFFFFF'];
        } else if (worldNum === 4) {
            // Volcano — reds/oranges
            bossColors = [COLORS.volcano.lavaOrange, COLORS.volcano.moltenYellow, COLORS.volcano.darkRed, '#FF4444', '#FFB030'];
        } else {
            // Citadel (5) — multi-colored celebration
            bossColors = [COLORS.mutedGold, COLORS.forest.leaf, COLORS.tundra.iceBlue, COLORS.volcano.lavaOrange, COLORS.desert.sand, '#FF69B4', '#FFFFFF'];
        }

        // Spawn celebration particles with world-appropriate colors
        const cx = Level.bossArenaX ? Level.bossArenaX + 8 * TILE_SIZE : CANVAS_WIDTH / 2 + Camera.x;
        const cy = Camera.y + CANVAS_HEIGHT / 2;
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            Particles.particles.push({
                x: cx + (Math.random() - 0.5) * 40,
                y: cy + (Math.random() - 0.5) * 40,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.08,
                size: 3 + Math.random() * 4,
                color: bossColors[i % bossColors.length],
                life: 1.5,
                maxLife: 1.5,
                shrink: false,
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }

        // Strong screen shake on boss defeat (C-17) — design spec: 8px explosion, 400ms (2x+ boss hit)
        Camera.shake(12, 0.5);

        // Slow-motion effect on boss defeat (C-14)
        Game.timeScale = 0.3;
        setTimeout(() => {
            Game.timeScale = 1.0;
        }, 1000);

        // Unlock camera
        Camera.locked = false;

        // Trigger stage complete or victory after delay
        setTimeout(() => {
            if (GameState.current === GameState.STAGE) {
                if (GameState.currentStageId === '5-1') {
                    // Final boss defeated — Victory!
                    GameState.transitionTo(GameState.VICTORY, () => {
                        GameState.setupVictory();
                    });
                } else {
                    GameState.transitionTo(GameState.STAGE_COMPLETE, () => {
                        GameState.setupStageComplete();
                    });
                }
            }
        }, 1500);
    },

    // =============================================
    // THE ARCHITECT — Final Boss (5 Phases, 19 HP)
    // Phase 1: Forest (Shockwave jumps)
    // Phase 2: Desert (Teleport + summon)
    // Phase 3: Tundra (Frost beams)
    // Phase 4: Volcano (Fire breath + dive)
    // Phase 5: All Combined
    // =============================================
    _updateArchitect(b) {
        const vulnDuration = Math.max(40, 90 - b.phase * 10); // Less vuln time as phases progress

        // Handle gravity manually for the Architect
        if (!b.flying) {
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

        if (b.state === 'attacking') {
            b.vulnerable = false;
            b.attackTimer++;
            b.facing = Player.x > b.x ? 1 : -1;

            // Dispatch to phase-specific attack
            switch (b.phase) {
                case 1: this._architectPhase1(b); break;
                case 2: this._architectPhase2(b); break;
                case 3: this._architectPhase3(b); break;
                case 4: this._architectPhase4(b); break;
                case 5: this._architectPhase5(b); break;
            }

            // After attack duration, become vulnerable
            const attackDuration = b.phase === 5 ? 100 : 70 + b.phase * 5;
            if (b.attackTimer >= attackDuration) {
                b.state = 'vulnerable';
                b.vulnerable = true;
                b.vulnerableTimer = vulnDuration;
                b.stateTimer = 0;
                b.attackTimer = 0;
                b.flying = false;
            }
        } else if (b.state === 'vulnerable') {
            b.vulnerable = true;
            b.vulnerableTimer--;
            // Pulse flash when vulnerable
            b.hitFlash = b.vulnerableTimer % 8 < 4 ? 1 : 0;
            if (b.vulnerableTimer <= 0) {
                b.state = 'attacking';
                b.vulnerable = false;
                b.hitFlash = 0;
                b.stateTimer = 0;
                b.attackTimer = 0;
                b.architectAttackCycle++;
            }
        }
    },

    // Phase 1: Forest — Jump + Shockwave (like Elder Shroomba)
    _architectPhase1(b) {
        if (b.attackTimer === 1) {
            b.vy = -11;
            b.vx = b.facing * 2;
        }
        if (b.attackTimer > 20 && b.vy === 0) {
            b.vx = 0;
            // Shockwave
            const waveSpeed = 3.5;
            this.projectiles.push({
                x: b.x - 10, y: b.y + b.height - 12,
                vx: -waveSpeed, vy: 0,
                width: 24, height: 12, life: 1.2, hostile: true,
                type: 'shockwave', ignoreWalls: false, animTimer: 0,
            });
            this.projectiles.push({
                x: b.x + b.width, y: b.y + b.height - 12,
                vx: waveSpeed, vy: 0,
                width: 24, height: 12, life: 1.2, hostile: true,
                type: 'shockwave', ignoreWalls: false, animTimer: 0,
            });
            // Force advance to end of attack
            b.attackTimer = 200;
        }
    },

    // Phase 2: Desert — Teleport + Projectile Burst (like Pharaoh Specter)
    _architectPhase2(b) {
        if (b.attackTimer === 1) {
            // Teleport near player
            const targetX = Player.x + (Math.random() > 0.5 ? 120 : -120);
            const clampedX = Math.max(Level.bossArenaX + TILE_SIZE, Math.min(targetX, (Level.width - 2) * TILE_SIZE));
            b.x = clampedX;
            b.y = (Level.height - 6) * TILE_SIZE;
            b.hitFlash = 8;
        }
        if (b.attackTimer === 20 || b.attackTimer === 40) {
            // Fire homing-ish projectiles
            const dx = Player.x - b.x;
            const dy = Player.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.projectiles.push({
                x: b.x + b.width / 2, y: b.y,
                vx: (dx / dist) * 3, vy: (dy / dist) * 3,
                width: 10, height: 10, life: 2, hostile: true,
                type: 'sand_bolt', ignoreWalls: false, animTimer: 0,
            });
        }
    },

    // Phase 3: Tundra — Frost Beam (like Frost Bear)
    _architectPhase3(b) {
        // Horizontal movement
        b.vx = b.facing * 1.5;
        b.x += b.vx;

        // Wall bounce
        const wallCol = b.facing > 0
            ? Math.floor((b.x + b.width) / TILE_SIZE)
            : Math.floor(b.x / TILE_SIZE);
        const midRow = Math.floor((b.y + b.height / 2) / TILE_SIZE);
        const tile = Level.getTile(wallCol, midRow);
        if (tile === TILE_SOLID) {
            b.facing *= -1;
            b.vx = 0;
        }

        // Fire frost beams periodically
        if (b.attackTimer % 25 === 0) {
            const dx = Player.x - b.x;
            const dy = Player.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.projectiles.push({
                x: b.x + b.width / 2, y: b.y + b.height / 2,
                vx: (dx / dist) * 4, vy: (dy / dist) * 4,
                width: 12, height: 8, life: 1.5, hostile: true,
                type: 'frost_beam', ignoreWalls: false, animTimer: 0,
            });
        }
    },

    // Phase 4: Volcano — Fire breath + Dive (like Dragon)
    _architectPhase4(b) {
        // Float above ground
        b.flying = true;
        const t = b.stateTimer * 0.03;
        b.x += Math.sin(t) * 1.8;
        b.y = (Level.height - 8) * TILE_SIZE + Math.cos(t * 0.7) * 20;

        // Fire breath
        if (b.attackTimer === 25) {
            for (let i = 0; i < 3; i++) {
                this.projectiles.push({
                    x: b.x + (b.facing > 0 ? b.width : -10),
                    y: b.y + b.height * 0.3 + i * 8,
                    vx: b.facing * (3 + i * 0.5), vy: (i - 1) * 0.5,
                    width: 14, height: 10, life: 1.5, hostile: true,
                    type: 'fireball', ignoreWalls: false, animTimer: 0,
                });
            }
        }

        // Dive bomb at player
        if (b.attackTimer === 50) {
            b.vy = 6;
            b.diveTimer = 15;
        }
        if (b.diveTimer > 0) {
            b.diveTimer--;
            b.y += b.vy;
            if (b.diveTimer === 0) {
                b.vy = -3;
                b.flying = false;
            }
        }
    },

    // Phase 5: All Combined — Rapid mix of all attack types
    _architectPhase5(b) {
        const cycle = b.attackTimer % 50;

        if (cycle < 12) {
            // Shockwave jump (Forest)
            if (cycle === 0) { b.vy = -10; b.vx = b.facing * 3; }
            if (cycle === 10 && b.vy === 0) {
                b.vx = 0;
                this.projectiles.push({
                    x: b.x - 10, y: b.y + b.height - 12,
                    vx: -4, vy: 0, width: 24, height: 12,
                    life: 1.2, hostile: true, type: 'shockwave',
                    ignoreWalls: false, animTimer: 0,
                });
                this.projectiles.push({
                    x: b.x + b.width, y: b.y + b.height - 12,
                    vx: 4, vy: 0, width: 24, height: 12,
                    life: 1.2, hostile: true, type: 'shockwave',
                    ignoreWalls: false, animTimer: 0,
                });
            }
        } else if (cycle === 20) {
            // Desert teleport + bolt
            const targetX = Player.x + (b.facing > 0 ? 100 : -100);
            const clampedX = Math.max(Level.bossArenaX + TILE_SIZE, Math.min(targetX, (Level.width - 2) * TILE_SIZE));
            b.x = clampedX;
            b.hitFlash = 5;
            const dx = Player.x - b.x;
            const dy = Player.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.projectiles.push({
                x: b.x + b.width / 2, y: b.y,
                vx: (dx / dist) * 3.5, vy: (dy / dist) * 3.5,
                width: 10, height: 10, life: 2, hostile: true,
                type: 'sand_bolt', ignoreWalls: false, animTimer: 0,
            });
        } else if (cycle === 35) {
            // Frost beam (Tundra)
            const dx = Player.x - b.x;
            const dy = Player.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            this.projectiles.push({
                x: b.x + b.width / 2, y: b.y + b.height / 2,
                vx: (dx / dist) * 4.5, vy: (dy / dist) * 4.5,
                width: 12, height: 8, life: 1.5, hostile: true,
                type: 'frost_beam', ignoreWalls: false, animTimer: 0,
            });
        } else if (cycle === 45) {
            // Fire breath (Volcano)
            for (let i = 0; i < 2; i++) {
                this.projectiles.push({
                    x: b.x + (b.facing > 0 ? b.width : -10),
                    y: b.y + b.height * 0.3 + i * 10,
                    vx: b.facing * (3.5 + i * 0.5), vy: (i - 0.5) * 0.5,
                    width: 14, height: 10, life: 1.5, hostile: true,
                    type: 'fireball', ignoreWalls: false, animTimer: 0,
                });
            }
        }

        // Move toward player
        b.vx = b.facing * 1.2;
        b.x += b.vx;
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

                // Obsidian Knight frontal shield check
                if (e.hasShield && e.shielded) {
                    // Shield blocks attacks from the front (enemy facing direction)
                    const attackFromFront = (e.facing === -1 && Player.x < e.x + e.width / 2) ||
                                           (e.facing === 1 && Player.x > e.x + e.width / 2);
                    if (attackFromFront) {
                        // Blocked! Knock player back, play shield hit effect
                        e.hitFlash = 4;
                        Particles.spawnAttackSparks(e.x + (e.facing === -1 ? 0 : e.width), e.y + e.height / 2);
                        this._hitCooldowns[cooldownKey] = 20;
                        continue;
                    }
                }

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
            if (e.isBoss && e.vulnerable) continue;

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
        // Dust Devil is invincible
        if (e.invincible || e.health === Infinity) return;

        e.health -= amount;
        e.hitFlash = 8;

        // Knockback
        if (!e.isBoss) {
            const dir = e.x > Player.x ? 1 : -1;
            e.x += dir * 8;
        }

        // Audio feedback
        if (e.isBoss) {
            AudioManager.playBossHit();
            // Screen shake on boss hit (C-03) — design spec: 6px, 300ms
            Camera.shake(6, 0.3);
        } else {
            AudioManager.playEnemyHit();
        }

        // Spawn hit particles
        Particles.spawnAttackSparks(e.x + e.width / 2, e.y + e.height / 2);

        if (e.health <= 0) {
            // Magma Slime split check
            if (e.splitOnDeath && !e.isSmallSlime) {
                // Spawn 2 smaller slimes
                for (let i = 0; i < 2; i++) {
                    const dir = i === 0 ? -1 : 1;
                    const child = this.spawn(e.type, e.x + dir * 12, e.y, {
                        isSmallSlime: true,
                        splitOnDeath: false,
                        splits: false,
                        splitCount: 0,
                    });
                    child.width = Math.floor(e.width * 0.6);
                    child.height = Math.floor(e.height * 0.6);
                    child.vx = dir * 2;
                    child.vy = -4;
                    child.health = 1;
                    child.maxHealth = 1;
                }
            }

            // Mummy revive check
            if (e.canRevive && !e.revived && e.reviveCount === 0) {
                e.health = 0;
                e.state = 'reviving';
                e.reviveTimer = 90; // 1.5 seconds
                e.reviveCount = 1;
                e.hitFlash = 15;
                return;
            }

            e.health = 0;

            // Audio: enemy/boss defeat
            if (e.isBoss) {
                AudioManager.playBossDefeat();
            } else {
                AudioManager.playEnemyDefeat();
            }

            // Ice Golem shatter effect
            if (e.shattersOnDeath || e.deathType === 'shatter') {
                e.state = 'shatter';
                e.deathTimer = 0.8;
                e.fragments = [];
                // Create 8 ice fragments
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    e.fragments.push({
                        x: e.x + e.width / 2,
                        y: e.y + e.height / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 3,
                        size: 4 + Math.random() * 6,
                        rotation: Math.random() * Math.PI * 2,
                    });
                    Particles.particles.push({
                        x: e.x + e.width / 2 + (Math.random() - 0.5) * e.width,
                        y: e.y + e.height / 2 + (Math.random() - 0.5) * e.height,
                        vx: Math.cos(angle) * speed * 0.7,
                        vy: Math.sin(angle) * speed * 0.7 - 2,
                        gravity: 0.12,
                        size: 3 + Math.random() * 4,
                        color: COLORS.tundra.iceBlue,
                        life: 0.8,
                        maxLife: 0.8,
                        shrink: true,
                        shape: 'rect'
                    });
                }
            } else {
                e.state = 'dying';
            }
            e.deathTimer = e.isBoss ? 1.5 : (e.shattersOnDeath ? 0.8 : 0.5);

            // Death particles — determine color by enemy type
            let deathColor;
            if (e.isBoss) {
                deathColor = COLORS.mutedGold;
            } else if (e.type === 'sand_skitter' || e.type === 'sandskitter' || e.type === 'mummy') {
                deathColor = COLORS.desert.sand;
            } else if (e.type === 'frost_imp' || e.type === 'frostimp' || e.type === 'ice_golem' || e.type === 'icegolem' || e.type === 'snow_owl' || e.type === 'snowowl') {
                deathColor = COLORS.tundra.iceBlue;
            } else if (e.type === 'magma_slime' || e.type === 'magmaslime' || e.type === 'fire_bat' || e.type === 'firebat' || e.type === 'obsidian_knight' || e.type === 'obsidianknight') {
                deathColor = COLORS.volcano.lavaOrange;
            } else {
                deathColor = COLORS.forest.leaf;
            }

            if (!e.shattersOnDeath) {
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
                        color: deathColor,
                        life: 0.6,
                        maxLife: 0.6,
                        shrink: true,
                        shape: 'rect'
                    });
                }
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
            if (e.state === 'dying' || e.state === 'shatter') {
                ctx.globalAlpha = Math.max(0, e.deathTimer / (e.isBoss ? 1.5 : 0.8));
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
            case 'sand_skitter':
            case 'sandskitter': this._renderSandSkitter(ctx, e, sx, sy); break;
            case 'dust_devil':
            case 'dustdevil': this._renderDustDevil(ctx, e, sx, sy); break;
            case 'mummy': this._renderMummy(ctx, e, sx, sy); break;
            // Tundra enemies
            case 'frost_imp':
            case 'frostimp': this._renderFrostImp(ctx, e, sx, sy); break;
            case 'ice_golem':
            case 'icegolem': this._renderIceGolem(ctx, e, sx, sy); break;
            case 'snow_owl':
            case 'snowowl': this._renderSnowOwl(ctx, e, sx, sy); break;
            // Volcano enemies
            case 'magma_slime':
            case 'magmaslime': this._renderMagmaSlime(ctx, e, sx, sy); break;
            case 'fire_bat':
            case 'firebat': this._renderFireBat(ctx, e, sx, sy); break;
            case 'obsidian_knight':
            case 'obsidianknight': this._renderObsidianKnight(ctx, e, sx, sy); break;
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
    // DESERT ENEMY RENDERING
    // =============================================

    _renderSandSkitter(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const isFlash = e.hitFlash > 0 && e.hitFlash % 2 === 0;
        const legAnim = Math.sin(e.animTimer * 10) * 3;

        // Body (low, wide scorpion-like)
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.darkSand;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.5, w * 0.48, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell segments
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.sand;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.45, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = isFlash ? '#FFFFFF' : '#5A4020';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            const lx = sx + w * 0.2 + i * w * 0.25;
            ctx.beginPath();
            ctx.moveTo(lx, sy + h * 0.6);
            ctx.lineTo(lx - 5, sy + h - 1 + legAnim * (i % 2 === 0 ? 1 : -1));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx + w - (lx - sx), sy + h * 0.6);
            ctx.lineTo(sx + w - (lx - sx) + 5, sy + h - 1 + legAnim * (i % 2 === 0 ? -1 : 1));
            ctx.stroke();
        }

        // Pincers
        ctx.strokeStyle = isFlash ? '#FFFFFF' : COLORS.desert.sand;
        ctx.lineWidth = 2;
        const pincerSide = e.facing > 0 ? w : 0;
        ctx.beginPath();
        ctx.moveTo(sx + pincerSide, sy + h * 0.4);
        ctx.lineTo(sx + pincerSide + e.facing * 8, sy + h * 0.2);
        ctx.lineTo(sx + pincerSide + e.facing * 5, sy + h * 0.4);
        ctx.stroke();

        // Eyes (red when charging)
        ctx.fillStyle = e.charging ? '#FF4444' : '#1A1A2E';
        const eyeX = e.facing > 0 ? w * 0.6 : w * 0.25;
        ctx.beginPath();
        ctx.arc(sx + eyeX, sy + h * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + eyeX + 6, sy + h * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
    },

    _renderDustDevil(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const spin = e.animTimer * 6;

        // Swirling vortex
        ctx.save();
        ctx.globalAlpha = 0.6;

        // Multiple swirling layers
        for (let i = 0; i < 5; i++) {
            const layerY = sy + h * (0.1 + i * 0.18);
            const layerW = w * (0.3 + i * 0.15);
            const offset = Math.sin(spin + i * 1.2) * (layerW * 0.3);

            ctx.fillStyle = i % 2 === 0 ? COLORS.desert.sand : COLORS.desert.lightStone;
            ctx.globalAlpha = 0.4 + Math.sin(spin + i) * 0.15;
            ctx.beginPath();
            ctx.ellipse(sx + w / 2 + offset, layerY, layerW / 2, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core funnel shape
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = COLORS.desert.darkSand;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.3, sy);
        ctx.quadraticCurveTo(sx + w / 2 + Math.sin(spin) * 6, sy + h * 0.5, sx + w * 0.15, sy + h);
        ctx.lineTo(sx + w * 0.85, sy + h);
        ctx.quadraticCurveTo(sx + w / 2 - Math.sin(spin) * 6, sy + h * 0.5, sx + w * 0.7, sy);
        ctx.closePath();
        ctx.fill();

        // Sand particles inside
        ctx.fillStyle = COLORS.desert.bleachedBone;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < 6; i++) {
            const px = sx + w / 2 + Math.sin(spin * 2 + i * 1.5) * (w * 0.3);
            const py = sy + h * (i / 6);
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;
        ctx.restore();
    },

    _renderMummy(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const isFlash = e.hitFlash > 0 && e.hitFlash % 2 === 0;
        const sway = Math.sin(e.animTimer * 2) * 1.5;

        ctx.save();

        // Bandage body
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.lightStone;
        ctx.fillRect(sx + w * 0.2 + sway, sy + h * 0.2, w * 0.6, h * 0.8);

        // Head
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.bleachedBone;
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.2, w * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Bandage wrapping lines
        ctx.strokeStyle = isFlash ? '#FFFFFF' : COLORS.desert.darkSand;
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const ly = sy + h * 0.25 + i * h * 0.14;
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.15, ly + sway * (i % 2 === 0 ? 1 : -1));
            ctx.lineTo(sx + w * 0.85, ly);
            ctx.stroke();
        }

        // Eyes (glowing)
        ctx.fillStyle = e.state === 'reviving' ? '#FFFFFF' : '#44FF44';
        ctx.globalAlpha = 0.7 + Math.sin(e.animTimer * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(sx + w * 0.35, sy + h * 0.18, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.18, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Arms (dangling)
        ctx.strokeStyle = isFlash ? '#FFFFFF' : COLORS.desert.lightStone;
        ctx.lineWidth = 3;
        // Left arm
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.15 + sway, sy + h * 0.35);
        ctx.lineTo(sx - 3 + sway, sy + h * 0.7 + Math.sin(e.animTimer * 1.5) * 3);
        ctx.stroke();
        // Right arm
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.85 + sway, sy + h * 0.35);
        ctx.lineTo(sx + w + 3 + sway, sy + h * 0.7 + Math.sin(e.animTimer * 1.5 + 1) * 3);
        ctx.stroke();

        // Reviving effect
        if (e.state === 'reviving') {
            ctx.strokeStyle = '#44FF44';
            ctx.globalAlpha = 0.4 + Math.sin(e.animTimer * 5) * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx + w / 2, sy + h / 2, w * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

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
            case 'sand_wyrm': this._renderSandWyrm(ctx, b, sx, sy); break;
            case 'pharaoh_specter': this._renderPharaohSpecter(ctx, b, sx, sy); break;
            case 'hydra_cactus': this._renderHydraCactus(ctx, b, sx, sy); break;
            // Tundra bosses
            case 'frost_bear': this._renderFrostBear(ctx, b, sx, sy); break;
            case 'crystal_witch': this._renderCrystalWitch(ctx, b, sx, sy); break;
            case 'yeti_monarch': this._renderYetiMonarch(ctx, b, sx, sy); break;
            // Volcano bosses
            case 'lava_serpent': this._renderLavaSerpent(ctx, b, sx, sy); break;
            case 'iron_warden': this._renderIronWarden(ctx, b, sx, sy); break;
            case 'dragon_caldera': this._renderDragonCaldera(ctx, b, sx, sy); break;
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
    // DESERT BOSS RENDERING
    // =============================================

    _renderSandWyrm(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        if (b.submerged) {
            // Show sand mound moving
            ctx.fillStyle = COLORS.desert.sand;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(sx + w / 2, sy + h, w * 0.8, h * 0.3, 0, Math.PI, 0);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            // Sand particles
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = COLORS.desert.lightStone;
                ctx.beginPath();
                ctx.arc(
                    sx + w / 2 + (Math.random() - 0.5) * w,
                    sy + h - Math.random() * 10,
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            }
            return;
        }

        // Segmented worm body
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.darkSand;
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const segY = sy + h * (i / segments);
            const segW = w * (1 - i * 0.1);
            ctx.beginPath();
            ctx.ellipse(sx + w / 2, segY + h / (segments * 2), segW / 2, h / (segments * 1.5), 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.sand;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.1, w * 0.45, h * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mandibles
        ctx.strokeStyle = isFlash ? '#FFFFFF' : '#3A2A1A';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy);
        ctx.lineTo(sx + w * 0.1, sy - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.8, sy);
        ctx.lineTo(sx + w * 0.9, sy - 10);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(sx + w * 0.35, sy + h * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.05, 3, 0, Math.PI * 2);
        ctx.fill();

        // Phase 2 glow
        if (b.phase === 2) {
            ctx.strokeStyle = COLORS.desert.sand;
            ctx.globalAlpha = 0.4 + Math.sin(b.animTimer * 4) * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx + w / 2, sy + h / 2, w * 0.6, h * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderPharaohSpecter(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;
        const hover = Math.sin(b.animTimer * 2) * 4;

        ctx.save();

        // Ghostly body (semi-transparent)
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.bleachedBone;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy + h * 0.3 + hover);
        ctx.lineTo(sx + w * 0.5, sy + hover);
        ctx.lineTo(sx + w * 0.8, sy + h * 0.3 + hover);
        ctx.lineTo(sx + w * 0.9, sy + h + hover);
        ctx.quadraticCurveTo(sx + w * 0.7, sy + h * 0.85 + hover, sx + w * 0.5, sy + h + hover);
        ctx.quadraticCurveTo(sx + w * 0.3, sy + h * 0.85 + hover, sx + w * 0.1, sy + h + hover);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.shadow;
        // Eyes
        ctx.beginPath();
        ctx.arc(sx + w * 0.35, sy + h * 0.35 + hover, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.35 + hover, 4, 0, Math.PI * 2);
        ctx.fill();
        // Eye glow
        ctx.fillStyle = '#44AAFF';
        ctx.beginPath();
        ctx.arc(sx + w * 0.35, sy + h * 0.35 + hover, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.35 + hover, 2, 0, Math.PI * 2);
        ctx.fill();

        // Crown/headdress
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.mutedGold;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.25, sy + h * 0.15 + hover);
        ctx.lineTo(sx + w * 0.5, sy - 8 + hover);
        ctx.lineTo(sx + w * 0.75, sy + h * 0.15 + hover);
        ctx.closePath();
        ctx.fill();
        // Crown jewel
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(sx + w * 0.5, sy + h * 0.08 + hover, 3, 0, Math.PI * 2);
        ctx.fill();

        // Staff
        ctx.strokeStyle = COLORS.mutedGold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.85, sy + h * 0.3 + hover);
        ctx.lineTo(sx + w + 5, sy + h * 0.8 + hover);
        ctx.stroke();
        // Staff orb
        ctx.fillStyle = '#44AAFF';
        ctx.globalAlpha = 0.6 + Math.sin(b.animTimer * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(sx + w * 0.85, sy + h * 0.25 + hover, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.restore();
    },

    _renderHydraCactus(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        // Main trunk
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#3A6B2E';
        ctx.fillRect(sx + w * 0.3, sy + h * 0.3, w * 0.4, h * 0.7);
        // Trunk texture
        ctx.strokeStyle = '#2A5A1E';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.3, sy + h * 0.35 + i * h * 0.15);
            ctx.lineTo(sx + w * 0.7, sy + h * 0.38 + i * h * 0.15);
            ctx.stroke();
        }

        // Three heads
        if (b.heads) {
            const headPositions = [
                { x: sx + w * 0.1, y: sy + h * 0.1 },
                { x: sx + w * 0.4, y: sy - h * 0.05 },
                { x: sx + w * 0.7, y: sy + h * 0.1 },
            ];

            for (let i = 0; i < 3; i++) {
                const head = b.heads[i];
                const hp = headPositions[i];
                const sway = Math.sin(b.animTimer * 2 + i * 2) * 3;

                // Neck/arm
                ctx.strokeStyle = isFlash ? '#FFFFFF' : '#3A6B2E';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(sx + w * 0.5, sy + h * 0.35);
                ctx.quadraticCurveTo(hp.x + sway, sy + h * 0.2, hp.x + sway, hp.y);
                ctx.stroke();

                if (head.active) {
                    // Head bulb
                    ctx.fillStyle = isFlash ? '#FFFFFF' : '#4A8C3F';
                    ctx.beginPath();
                    ctx.arc(hp.x + sway, hp.y, 10, 0, Math.PI * 2);
                    ctx.fill();

                    // Spines
                    ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.sand;
                    for (let j = 0; j < 3; j++) {
                        const angle = (j / 3) * Math.PI - Math.PI / 2;
                        ctx.beginPath();
                        ctx.moveTo(hp.x + sway + Math.cos(angle) * 8, hp.y + Math.sin(angle) * 8);
                        ctx.lineTo(hp.x + sway + Math.cos(angle) * 14, hp.y + Math.sin(angle) * 14);
                        ctx.lineTo(hp.x + sway + Math.cos(angle + 0.3) * 8, hp.y + Math.sin(angle + 0.3) * 8);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Eyes
                    ctx.fillStyle = '#FF4444';
                    ctx.beginPath();
                    ctx.arc(hp.x + sway - 3, hp.y - 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(hp.x + sway + 3, hp.y - 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    // Dead head (wilted)
                    ctx.fillStyle = '#6B5A3A';
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(hp.x + sway, hp.y + 5, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // Pot/base
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.desert.darkSand;
        ctx.fillRect(sx + w * 0.15, sy + h * 0.85, w * 0.7, h * 0.15);
        ctx.fillStyle = COLORS.desert.sand;
        ctx.fillRect(sx + w * 0.15, sy + h * 0.85, w * 0.7, 3);

        // Phase 2 indicator: thorns glow
        if (b.phase === 2) {
            ctx.strokeStyle = '#FF6B2A';
            ctx.globalAlpha = 0.3 + Math.sin(b.animTimer * 4) * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx + w / 2, sy + h * 0.4, w * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
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

            case 'sand_spray':
                ctx.fillStyle = COLORS.desert.sand;
                ctx.globalAlpha = Math.min(1, p.life);
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                break;

            case 'spectre_orb':
                ctx.fillStyle = '#44AAFF';
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2 + Math.sin((p.animTimer || 0) * 8) * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#88CCFF';
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                break;

            case 'cactus_thorn':
                ctx.fillStyle = '#3A6B2E';
                ctx.beginPath();
                ctx.moveTo(sx, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy);
                ctx.lineTo(sx + p.width, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy + p.height);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = COLORS.desert.sand;
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, 2, 0, Math.PI * 2);
                ctx.fill();
                break;

            // Tundra projectiles
            case 'snowball':
            case 'freeze_snowball':
                ctx.fillStyle = COLORS.tundra.snowWhite;
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2, 0, Math.PI * 2);
                ctx.fill();
                // Ice sparkle
                ctx.fillStyle = COLORS.tundra.iceBlue;
                ctx.globalAlpha = 0.6;
                ctx.fillRect(sx + 2, sy + 2, 3, 2);
                ctx.globalAlpha = 1.0;
                break;

            case 'frost_beam':
                ctx.fillStyle = COLORS.tundra.iceBlue;
                ctx.globalAlpha = 0.7;
                ctx.fillRect(sx, sy, p.width, p.height);
                ctx.fillStyle = COLORS.tundra.snowWhite;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(sx + 1, sy + 1, p.width - 2, p.height - 2);
                ctx.globalAlpha = 1.0;
                break;

            case 'crystal_shard':
                ctx.fillStyle = COLORS.tundra.iceBlue;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(sx, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy);
                ctx.lineTo(sx + p.width, sy + p.height / 2);
                ctx.lineTo(sx + p.width / 2, sy + p.height);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = COLORS.tundra.snowWhite;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
                break;

            case 'boulder':
                ctx.fillStyle = '#7A6A5A';
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#5A4A3A';
                ctx.beginPath();
                ctx.arc(sx + p.width / 2 - 2, sy + p.height / 2 - 2, p.width / 4, 0, Math.PI * 2);
                ctx.fill();
                // Rock texture
                ctx.fillStyle = '#8A7A6A';
                ctx.fillRect(sx + p.width / 2 + 2, sy + 3, 3, 3);
                break;

            default:
                ctx.fillStyle = '#FF4444';
                ctx.beginPath();
                ctx.arc(sx + p.width / 2, sy + p.height / 2, p.width / 2, 0, Math.PI * 2);
                ctx.fill();
        }
    },

    // =============================================
    // TUNDRA ENEMY RENDERERS
    // =============================================

    _renderFrostImp(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const flash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        // Body — small ice-blue creature
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.iceBlue;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.6, w * 0.45, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.3, w * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1A1A2E';
        const eyeX = e.facing > 0 ? 2 : -2;
        ctx.fillRect(sx + w / 2 - 4 + eyeX, sy + h * 0.25, 3, 3);
        ctx.fillRect(sx + w / 2 + 2 + eyeX, sy + h * 0.25, 3, 3);

        // Pointy frost crown
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.beginPath();
        ctx.moveTo(sx + w / 2 - 5, sy + h * 0.15);
        ctx.lineTo(sx + w / 2, sy - 2);
        ctx.lineTo(sx + w / 2 + 5, sy + h * 0.15);
        ctx.fill();

        // Arms
        ctx.strokeStyle = flash ? '#FFFFFF' : COLORS.tundra.iceBlue;
        ctx.lineWidth = 2;
        const armSway = Math.sin(e.animTimer * 3) * 3;
        ctx.beginPath();
        ctx.moveTo(sx + 2, sy + h * 0.5);
        ctx.lineTo(sx - 3, sy + h * 0.6 + armSway);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + w - 2, sy + h * 0.5);
        ctx.lineTo(sx + w + 3, sy + h * 0.6 - armSway);
        ctx.stroke();
    },

    _renderIceGolem(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const flash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        // Shatter state — draw fragments instead
        if (e.state === 'shatter' && e.fragments) {
            for (const f of e.fragments) {
                const fx = f.x - Camera.x;
                const fy = f.y - Camera.y;
                ctx.save();
                ctx.translate(fx, fy);
                ctx.rotate(f.rotation);
                ctx.fillStyle = COLORS.tundra.iceBlue;
                ctx.globalAlpha = Math.max(0, e.deathTimer / 0.8);
                ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size);
                ctx.fillStyle = COLORS.tundra.snowWhite;
                ctx.globalAlpha *= 0.5;
                ctx.fillRect(-f.size / 2, -f.size / 2, f.size * 0.4, f.size * 0.4);
                ctx.restore();
            }
            ctx.globalAlpha = 1.0;
            return;
        }

        // Body — large rectangular ice creature
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.fillRect(sx + 2, sy + h * 0.2, w - 4, h * 0.8);

        // Ice crystal surface
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.iceBlue;
        ctx.fillRect(sx + 4, sy + h * 0.25, w - 8, h * 0.15);
        ctx.fillRect(sx + 4, sy + h * 0.5, w - 8, h * 0.15);

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.fillRect(sx + w * 0.15, sy, w * 0.7, h * 0.25);

        // Eyes — glowing blue
        ctx.fillStyle = '#4488FF';
        const eyeOff = e.facing > 0 ? 2 : -2;
        ctx.fillRect(sx + w * 0.25 + eyeOff, sy + h * 0.08, 4, 4);
        ctx.fillRect(sx + w * 0.6 + eyeOff, sy + h * 0.08, 4, 4);

        // Arms (thick ice blocks)
        const armBob = Math.sin(e.animTimer * 2) * 2;
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.fillRect(sx - 4, sy + h * 0.3 + armBob, 6, h * 0.3);
        ctx.fillRect(sx + w - 2, sy + h * 0.3 - armBob, 6, h * 0.3);

        // Frost sparkle
        ctx.fillStyle = COLORS.tundra.snowWhite;
        ctx.globalAlpha = 0.5 + Math.sin(e.animTimer * 4) * 0.3;
        ctx.fillRect(sx + 6, sy + 4, 3, 2);
        ctx.fillRect(sx + w - 10, sy + h * 0.4, 2, 3);
        ctx.globalAlpha = 1.0;
    },

    _renderSnowOwl(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const flash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        // Wing flap animation
        const wingAngle = Math.sin(e.animTimer * 8) * 0.4;

        ctx.save();
        ctx.translate(sx + w / 2, sy + h / 2);
        if (e.facing < 0) ctx.scale(-1, 1);

        // Left wing
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.save();
        ctx.rotate(-wingAngle);
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-w * 0.6, -h * 0.2);
        ctx.lineTo(-w * 0.4, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Right wing
        ctx.save();
        ctx.rotate(wingAngle);
        ctx.beginPath();
        ctx.moveTo(4, 0);
        ctx.lineTo(w * 0.6, -h * 0.2);
        ctx.lineTo(w * 0.4, h * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Body
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.25, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : '#DDE8F0';
        ctx.beginPath();
        ctx.arc(0, -h * 0.25, w * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eyes — large owl eyes
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-3, -h * 0.28, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -h * 0.28, 3, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(-3.5, -h * 0.3, 2, 2);
        ctx.fillRect(2.5, -h * 0.3, 2, 2);

        // Beak
        ctx.fillStyle = '#C4A35A';
        ctx.beginPath();
        ctx.moveTo(-2, -h * 0.2);
        ctx.lineTo(0, -h * 0.14);
        ctx.lineTo(2, -h * 0.2);
        ctx.fill();

        // Ear tufts
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.iceBlue;
        ctx.beginPath();
        ctx.moveTo(-5, -h * 0.35);
        ctx.lineTo(-3, -h * 0.5);
        ctx.lineTo(-1, -h * 0.35);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(1, -h * 0.35);
        ctx.lineTo(3, -h * 0.5);
        ctx.lineTo(5, -h * 0.35);
        ctx.fill();

        ctx.restore();
    },

    // =============================================
    // TUNDRA BOSS RENDERERS
    // =============================================

    _renderFrostBear(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const flash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        ctx.save();
        if (b.facing < 0) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0; sy = 0;
        }

        // Body — large white bear
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.55, w * 0.45, h * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : '#DDE8F0';
        ctx.beginPath();
        ctx.arc(sx + w * 0.65, sy + h * 0.25, w * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.iceBlue;
        ctx.beginPath();
        ctx.arc(sx + w * 0.55, sy + h * 0.08, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + w * 0.75, sy + h * 0.08, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(sx + w * 0.6, sy + h * 0.2, 4, 4);
        ctx.fillRect(sx + w * 0.72, sy + h * 0.2, 4, 4);

        // Muzzle
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.beginPath();
        ctx.ellipse(sx + w * 0.75, sy + h * 0.3, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = flash ? '#FFFFFF' : '#DDE8F0';
        ctx.fillRect(sx + w * 0.15, sy + h * 0.8, 8, h * 0.2);
        ctx.fillRect(sx + w * 0.35, sy + h * 0.8, 8, h * 0.2);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.8, 8, h * 0.2);
        ctx.fillRect(sx + w * 0.7, sy + h * 0.8, 8, h * 0.2);

        // Frost aura (when beaming)
        if (b.beamActive) {
            ctx.strokeStyle = COLORS.tundra.iceBlue;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(b.stateTimer * 0.3) * 0.3;
            ctx.beginPath();
            ctx.arc(sx + w / 2, sy + h / 2, w * 0.6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Phase 2: ice crown
        if (b.phase === 2) {
            ctx.fillStyle = COLORS.tundra.iceBlue;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(sx + w * 0.5 + i * 8 - 8, sy + h * 0.05);
                ctx.lineTo(sx + w * 0.5 + i * 8 - 4, sy - 8);
                ctx.lineTo(sx + w * 0.5 + i * 8, sy + h * 0.05);
                ctx.fill();
            }
        }

        ctx.restore();
    },

    _renderCrystalWitch(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const flash = b.hitFlash > 0 && b.hitFlash % 2 === 0;
        const hover = Math.sin(b.animTimer * 2) * 4;

        // Crystal shield (when active)
        if (b.shield && b.shield.active) {
            ctx.strokeStyle = COLORS.tundra.iceBlue;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.4 + Math.sin(b.stateTimer * 0.15) * 0.2;
            // Diamond shield shape
            ctx.beginPath();
            ctx.moveTo(sx + w / 2, sy - 10 + hover);
            ctx.lineTo(sx + w + 15, sy + h / 2 + hover);
            ctx.lineTo(sx + w / 2, sy + h + 10 + hover);
            ctx.lineTo(sx - 15, sy + h / 2 + hover);
            ctx.closePath();
            ctx.stroke();
            // Inner glow
            ctx.fillStyle = COLORS.tundra.iceBlue;
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Robe body
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy + h * 0.3 + hover);
        ctx.lineTo(sx + w * 0.5, sy + h * 0.2 + hover);
        ctx.lineTo(sx + w * 0.8, sy + h * 0.3 + hover);
        ctx.lineTo(sx + w * 0.9, sy + h + hover);
        ctx.lineTo(sx + w * 0.1, sy + h + hover);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.2 + hover, w * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Witch hat (icy)
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.shadow;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy + h * 0.12 + hover);
        ctx.lineTo(sx + w * 0.5, sy - 15 + hover);
        ctx.lineTo(sx + w * 0.8, sy + h * 0.12 + hover);
        ctx.fill();
        // Hat brim
        ctx.fillRect(sx + w * 0.1, sy + h * 0.1 + hover, w * 0.8, 4);

        // Eyes — glowing purple
        ctx.fillStyle = '#AA44FF';
        ctx.fillRect(sx + w * 0.35, sy + h * 0.17 + hover, 4, 3);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.17 + hover, 4, 3);

        // Crystal staff
        ctx.strokeStyle = flash ? '#FFFFFF' : '#8B6B3D';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.8, sy + h * 0.35 + hover);
        ctx.lineTo(sx + w * 0.85, sy + h * 0.9 + hover);
        ctx.stroke();
        // Staff crystal
        ctx.fillStyle = COLORS.tundra.iceBlue;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.8, sy + h * 0.25 + hover);
        ctx.lineTo(sx + w * 0.75, sy + h * 0.35 + hover);
        ctx.lineTo(sx + w * 0.85, sy + h * 0.35 + hover);
        ctx.fill();

        // Phase 2: purple aura
        if (b.phase === 2) {
            ctx.strokeStyle = '#AA44FF';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3 + Math.sin(b.stateTimer * 0.2) * 0.2;
            ctx.beginPath();
            ctx.arc(sx + w / 2, sy + h / 2 + hover, w * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderYetiMonarch(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const flash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        ctx.save();
        if (b.facing < 0) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0; sy = 0;
        }

        // Large body — white fur
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.55, w * 0.48, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#FFFFFF' : '#DDE8F0';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.2, w * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#FF2222';
        ctx.fillRect(sx + w * 0.3, sy + h * 0.15, 5, 5);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.15, 5, 5);

        // Mouth
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.35, sy + h * 0.28);
        ctx.lineTo(sx + w * 0.65, sy + h * 0.28);
        ctx.stroke();

        // Crown
        ctx.fillStyle = COLORS.mutedGold;
        ctx.fillRect(sx + w * 0.2, sy + h * 0.02, w * 0.6, 5);
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.2 + i * w * 0.15, sy + h * 0.02);
            ctx.lineTo(sx + w * 0.2 + i * w * 0.15 + w * 0.07, sy - 8);
            ctx.lineTo(sx + w * 0.2 + (i + 1) * w * 0.15, sy + h * 0.02);
            ctx.fill();
        }

        // Arms
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.snowWhite;
        const armAnim = Math.sin(b.animTimer * 2) * 3;
        ctx.fillRect(sx - 6, sy + h * 0.3 + armAnim, 10, h * 0.35);
        ctx.fillRect(sx + w - 4, sy + h * 0.3 - armAnim, 10, h * 0.35);

        // Hands/fists
        ctx.fillStyle = flash ? '#FFFFFF' : COLORS.tundra.deepIce;
        ctx.fillRect(sx - 8, sy + h * 0.6 + armAnim, 12, 10);
        ctx.fillRect(sx + w - 4, sy + h * 0.6 - armAnim, 12, 10);

        // Legs
        ctx.fillStyle = flash ? '#FFFFFF' : '#DDE8F0';
        ctx.fillRect(sx + w * 0.2, sy + h * 0.85, 10, h * 0.15);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.85, 10, h * 0.15);

        // Phase 2: ice armor
        if (b.phase === 2) {
            ctx.strokeStyle = COLORS.tundra.iceBlue;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5;
            ctx.strokeRect(sx + 4, sy + h * 0.3, w - 8, h * 0.4);
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    },

    // =============================================
    // VOLCANO ENEMY RENDERING
    // =============================================

    _renderMagmaSlime(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const bounce = Math.sin(e.animTimer * 4) * 2;
        const isFlash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        ctx.save();

        // Slime body (blob shape)
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.lavaOrange;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.6 + bounce, w * 0.5, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.moltenYellow;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.55 + bounce, w * 0.3, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Eyes
        ctx.fillStyle = '#1A1A2E';
        const eyeOff = e.facing > 0 ? 2 : -2;
        ctx.beginPath(); ctx.arc(sx + w * 0.35 + eyeOff, sy + h * 0.45 + bounce, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.65 + eyeOff, sy + h * 0.45 + bounce, 2.5, 0, Math.PI * 2); ctx.fill();

        // Small = smaller marker
        if (e.isSmallSlime) {
            ctx.fillStyle = COLORS.volcano.darkRed;
            ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.arc(sx + w / 2, sy + h * 0.3 + bounce, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    },

    _renderFireBat(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const wingFlap = Math.sin(e.animTimer * 12) * 6;
        const isFlash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        ctx.save();

        // Body
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h / 2, w * 0.25, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.lavaOrange;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.35, sy + h * 0.4);
        ctx.lineTo(sx - 2, sy + h * 0.2 + wingFlap);
        ctx.lineTo(sx + 2, sy + h * 0.7);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.65, sy + h * 0.4);
        ctx.lineTo(sx + w + 2, sy + h * 0.2 - wingFlap);
        ctx.lineTo(sx + w - 2, sy + h * 0.7);
        ctx.closePath();
        ctx.fill();

        // Eyes (glowing)
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.moltenYellow;
        ctx.beginPath(); ctx.arc(sx + w * 0.4, sy + h * 0.4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.6, sy + h * 0.4, 2, 0, Math.PI * 2); ctx.fill();

        // Ears
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.3, sy + h * 0.3);
        ctx.lineTo(sx + w * 0.25, sy);
        ctx.lineTo(sx + w * 0.45, sy + h * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.7, sy + h * 0.3);
        ctx.lineTo(sx + w * 0.75, sy);
        ctx.lineTo(sx + w * 0.55, sy + h * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    },

    _renderObsidianKnight(ctx, e, sx, sy) {
        const w = e.width;
        const h = e.height;
        const isFlash = e.hitFlash > 0 && e.hitFlash % 2 === 0;

        ctx.save();
        if (e.facing === -1) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0; sy = 0;
        }

        // Armor body
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkStone;
        ctx.fillRect(sx + w * 0.2, sy + h * 0.2, w * 0.6, h * 0.6);

        // Helmet
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#3A2A2A';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.2, w * 0.3, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(sx + w * 0.2, sy + h * 0.1, w * 0.6, h * 0.15);

        // Visor slit (glowing red)
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.lavaOrange;
        ctx.fillRect(sx + w * 0.3, sy + h * 0.2, w * 0.4, 3);

        // Shield (on front side)
        if (e.shielded) {
            ctx.fillStyle = isFlash ? '#FFFFFF' : '#4A3A3A';
            ctx.fillRect(sx + w * 0.7, sy + h * 0.15, w * 0.25, h * 0.55);
            // Shield rivets
            ctx.fillStyle = COLORS.volcano.lavaOrange;
            ctx.beginPath(); ctx.arc(sx + w * 0.82, sy + h * 0.25, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + w * 0.82, sy + h * 0.55, 2, 0, Math.PI * 2); ctx.fill();
        }

        // Legs
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkStone;
        ctx.fillRect(sx + w * 0.25, sy + h * 0.75, 6, h * 0.25);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.75, 6, h * 0.25);

        // Boots
        ctx.fillStyle = '#2A1A1A';
        ctx.fillRect(sx + w * 0.2, sy + h - 4, 10, 4);
        ctx.fillRect(sx + w * 0.5, sy + h - 4, 10, 4);

        ctx.restore();
    },

    // =============================================
    // VOLCANO BOSS RENDERING
    // =============================================

    _renderLavaSerpent(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        if (b.submerged) {
            // Show lava bubbling at position
            ctx.fillStyle = COLORS.volcano.lavaOrange;
            ctx.globalAlpha = 0.6;
            const t = b.animTimer * 3;
            for (let i = 0; i < 5; i++) {
                const bx = sx + w / 2 + Math.sin(t + i * 1.3) * 20;
                const by = sy + h - 5 + Math.cos(t * 2 + i) * 5;
                ctx.beginPath();
                ctx.arc(bx, by, 3 + Math.sin(t + i) * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;
            return;
        }

        // Serpent body — segmented
        const segments = 6;
        for (let i = 0; i < segments; i++) {
            const segY = sy + (i / segments) * h;
            const segW = w * (1 - i * 0.08);
            const sway = Math.sin(b.animTimer * 3 + i * 0.8) * 4;
            ctx.fillStyle = isFlash ? '#FFFFFF' : (i % 2 === 0 ? COLORS.volcano.darkRed : COLORS.volcano.lavaOrange);
            ctx.beginPath();
            ctx.ellipse(sx + w / 2 + sway, segY + h / (segments * 2), segW / 2, h / (segments * 1.5), 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Head
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.08, w * 0.4, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing)
        ctx.fillStyle = COLORS.volcano.moltenYellow;
        ctx.beginPath(); ctx.arc(sx + w * 0.35, sy + h * 0.05, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.65, sy + h * 0.05, 4, 0, Math.PI * 2); ctx.fill();

        // Fangs
        ctx.fillStyle = '#E8DCC8';
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.3, sy + h * 0.12);
        ctx.lineTo(sx + w * 0.35, sy + h * 0.2);
        ctx.lineTo(sx + w * 0.4, sy + h * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.6, sy + h * 0.12);
        ctx.lineTo(sx + w * 0.65, sy + h * 0.2);
        ctx.lineTo(sx + w * 0.7, sy + h * 0.12);
        ctx.closePath();
        ctx.fill();

        // Phase 2 glow
        if (b.phase === 2) {
            ctx.strokeStyle = COLORS.volcano.moltenYellow;
            ctx.globalAlpha = 0.4 + Math.sin(b.animTimer * 4) * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(sx + w / 2, sy + h / 2, w * 0.6, h * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    },

    _renderIronWarden(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;

        ctx.save();
        if (b.facing === -1) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0; sy = 0;
        }

        // Heavy armor body
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#3A3A3A';
        ctx.fillRect(sx + w * 0.15, sy + h * 0.25, w * 0.7, h * 0.55);

        // Pauldrons
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkStone;
        ctx.beginPath();
        ctx.ellipse(sx + w * 0.2, sy + h * 0.3, w * 0.2, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx + w * 0.8, sy + h * 0.3, w * 0.2, h * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#2A2A2A';
        ctx.beginPath();
        ctx.arc(sx + w / 2, sy + h * 0.2, w * 0.3, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(sx + w * 0.2, sy + h * 0.1, w * 0.6, h * 0.15);

        // Visor (red glow)
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.lavaOrange;
        ctx.fillRect(sx + w * 0.3, sy + h * 0.18, w * 0.4, 4);

        // Chain weapon
        if (b.anchorActive) {
            ctx.strokeStyle = '#8A8A8A';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.8, sy + h * 0.4);
            ctx.lineTo(sx + w + 20, sy + h * 0.4);
            ctx.stroke();
        }

        // Legs
        ctx.fillStyle = isFlash ? '#FFFFFF' : '#3A3A3A';
        ctx.fillRect(sx + w * 0.2, sy + h * 0.75, 8, h * 0.25);
        ctx.fillRect(sx + w * 0.55, sy + h * 0.75, 8, h * 0.25);

        // Boots
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(sx + w * 0.15, sy + h - 6, 14, 6);
        ctx.fillRect(sx + w * 0.5, sy + h - 6, 14, 6);

        // Phase 2: glowing cracks
        if (b.phase === 2) {
            ctx.strokeStyle = COLORS.volcano.lavaOrange;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6 + Math.sin(b.animTimer * 5) * 0.3;
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.3, sy + h * 0.3);
            ctx.lineTo(sx + w * 0.5, sy + h * 0.5);
            ctx.lineTo(sx + w * 0.4, sy + h * 0.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.6, sy + h * 0.35);
            ctx.lineTo(sx + w * 0.7, sy + h * 0.55);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    },

    _renderDragonCaldera(ctx, b, sx, sy) {
        const w = b.width;
        const h = b.height;
        const isFlash = b.hitFlash > 0 && b.hitFlash % 2 === 0;
        const wingFlap = Math.sin(b.animTimer * 4) * 8;

        ctx.save();
        if (b.facing === -1) {
            ctx.translate(sx + w, sy);
            ctx.scale(-1, 1);
            sx = 0; sy = 0;
        }

        // Wings
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy + h * 0.3);
        ctx.lineTo(sx - 15, sy + h * 0.1 + wingFlap);
        ctx.lineTo(sx - 5, sy + h * 0.6);
        ctx.closePath();
        ctx.fill();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.8, sy + h * 0.3);
        ctx.lineTo(sx + w + 15, sy + h * 0.1 - wingFlap);
        ctx.lineTo(sx + w + 5, sy + h * 0.6);
        ctx.closePath();
        ctx.fill();

        // Dragon body
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.5, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.lavaOrange;
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h * 0.55, w * 0.2, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.beginPath();
        ctx.ellipse(sx + w * 0.75, sy + h * 0.25, w * 0.2, h * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkStone;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.7, sy + h * 0.15);
        ctx.lineTo(sx + w * 0.65, sy - 5);
        ctx.lineTo(sx + w * 0.75, sy + h * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.82, sy + h * 0.15);
        ctx.lineTo(sx + w * 0.88, sy - 5);
        ctx.lineTo(sx + w * 0.85, sy + h * 0.12);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = COLORS.volcano.moltenYellow;
        ctx.beginPath(); ctx.arc(sx + w * 0.72, sy + h * 0.22, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(sx + w * 0.82, sy + h * 0.22, 3, 0, Math.PI * 2); ctx.fill();

        // Tail
        ctx.strokeStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx + w * 0.2, sy + h * 0.5);
        ctx.quadraticCurveTo(sx - 10, sy + h * 0.7, sx - 5, sy + h * 0.9);
        ctx.stroke();

        // Legs
        ctx.fillStyle = isFlash ? '#FFFFFF' : COLORS.volcano.darkRed;
        ctx.fillRect(sx + w * 0.3, sy + h * 0.75, 6, h * 0.2);
        ctx.fillRect(sx + w * 0.6, sy + h * 0.75, 6, h * 0.2);

        // Fire from mouth when attacking
        if (b.state === 'attacking' && b.attackTimer >= 25 && b.attackTimer <= 35) {
            ctx.fillStyle = COLORS.volcano.lavaOrange;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.85, sy + h * 0.3);
            ctx.lineTo(sx + w + 20, sy + h * 0.2);
            ctx.lineTo(sx + w + 15, sy + h * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = COLORS.volcano.moltenYellow;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(sx + w * 0.85, sy + h * 0.3);
            ctx.lineTo(sx + w + 12, sy + h * 0.25);
            ctx.lineTo(sx + w + 10, sy + h * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Phase 2 aura
        if (b.phase === 2) {
            ctx.strokeStyle = COLORS.volcano.moltenYellow;
            ctx.globalAlpha = 0.3 + Math.sin(b.animTimer * 5) * 0.2;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(sx + w / 2, sy + h / 2, w * 0.7, h * 0.7, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
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
