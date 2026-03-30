// ============================================================
// particles.js — Particle system for visual effects
// ============================================================

const Particles = {
    particles: [],
    MAX_PARTICLES: 300, // Hard cap to prevent unbounded growth

    init() {
        this.particles = [];
    },

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life -= 1 / 60;
            if (p.shrink) {
                p.size *= 0.96;
            }
            if (p.life <= 0 || p.size < 0.3) {
                this.particles.splice(i, 1);
            }
        }

        // Enforce hard cap — remove oldest particles if over limit
        while (this.particles.length > this.MAX_PARTICLES) {
            this.particles.shift();
        }
    },

    render(ctx) {
        for (const p of this.particles) {
            const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            const sx = p.x - Camera.x;
            const sy = p.y - Camera.y;

            if (p.shape === 'rect') {
                ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1.0;
    },

    // Landing dust — 5 tan particles spread outward and up
    spawnLandingDust(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 12,
                y: y,
                vx: (Math.random() - 0.5) * 2.5,
                vy: -Math.random() * 1.5 - 0.5,
                gravity: 0.05,
                size: 2.5 + Math.random() * 2,
                color: '#C4A87A',
                life: 0.3,
                maxLife: 0.3,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Run dust — 2 particles per footstep
    spawnRunDust(x, y, facing) {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 2,
                vx: -facing * (Math.random() * 1.0 + 0.3),
                vy: -Math.random() * 0.8,
                gravity: 0.02,
                size: 1.5 + Math.random() * 1.5,
                color: '#C4A87A',
                life: 0.2,
                maxLife: 0.2,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Wall slide sparks — 3 white/yellow particles spray downward
    spawnWallSlideSparks(x, y, wallDir) {
        for (let i = 0; i < 3; i++) {
            const isYellow = Math.random() > 0.5;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 4,
                y: y + (Math.random() - 0.5) * 6,
                vx: -wallDir * (Math.random() * 1.5 + 0.5),
                vy: Math.random() * 2.0 + 0.5,
                gravity: 0.08,
                size: 1.5 + Math.random() * 1.0,
                color: isYellow ? '#FFD700' : '#FFFFFF',
                life: 0.2,
                maxLife: 0.2,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Slide dust — 2 particles behind the player
    spawnSlideDust(x, y, facing) {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + Math.random() * 2,
                vx: -facing * (Math.random() * 0.8 + 0.2),
                vy: -Math.random() * 0.5,
                gravity: 0.01,
                size: 1.5 + Math.random() * 1.5,
                color: '#C4A87A',
                life: 0.25,
                maxLife: 0.25,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Death particles — 4 colored pieces that fall with gravity
    spawnDeathParticles(x, y, w, h) {
        const deathColors = [COLORS.playerBlue, COLORS.playerBlueDark, COLORS.playerSkin, '#3A3A4A'];
        const count = 9; // 9 particles per color type for dramatic effect
        for (let i = 0; i < count; i++) {
            const colorIdx = i % deathColors.length;
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.particles.push({
                x: x + w / 2 + (Math.random() - 0.5) * w,
                y: y + h / 2 + (Math.random() - 0.5) * h,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                gravity: 0.15,
                size: 3 + Math.random() * 3,
                color: deathColors[colorIdx],
                life: 1.0,
                maxLife: 1.0,
                shrink: false,
                shape: 'rect'
            });
        }
    },

    // Block break particles — fragments from destroyed breakable blocks
    spawnBlockBreak(tileX, tileY) {
        const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
        const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
        const colors = ['#7A7A6A', '#9A9A8A', '#5A5A4A', '#6A6A5A'];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
            const speed = 1.5 + Math.random() * 2.5;
            this.particles.push({
                x: cx + (Math.random() - 0.5) * TILE_SIZE * 0.6,
                y: cy + (Math.random() - 0.5) * TILE_SIZE * 0.6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.12,
                size: 2 + Math.random() * 3,
                color: colors[i % colors.length],
                life: 0.5,
                maxLife: 0.5,
                shrink: true,
                shape: 'rect'
            });
        }
    },

    // Attack hit sparks
    spawnAttackSparks(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 8,
                y: y + (Math.random() - 0.5) * 8,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0,
                size: 1.5 + Math.random() * 1.5,
                color: Math.random() > 0.5 ? COLORS.mutedGold : '#FFFFFF',
                life: 0.2,
                maxLife: 0.2,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Coin collection particles — gold sparkles
    spawnCoinCollect(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const speed = 1 + Math.random() * 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                gravity: 0.03,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.3 ? COLORS.coinGold : COLORS.coinGlint,
                life: 0.4,
                maxLife: 0.4,
                shrink: true,
                shape: 'circle'
            });
        }
    },

    // Health collection particles — green sparkles
    spawnHealthCollect(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const speed = 1 + Math.random() * 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                gravity: 0.03,
                size: 2 + Math.random() * 2,
                color: Math.random() > 0.5 ? COLORS.mossGreen : '#90EE90',
                life: 0.4,
                maxLife: 0.4,
                shrink: true,
                shape: 'circle'
            });
        }
    }
};
