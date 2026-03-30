// ============================================================
// audio.js — Synthesized Audio System (Web Audio API)
// All sounds generated via OscillatorNode, GainNode, BiquadFilterNode
// No external audio files — zero dependencies
// ============================================================

const AudioManager = {
    ctx: null,
    _masterGain: null,
    masterVolume: 0.7,
    muted: false,
    _initialized: false,

    // Ambient state
    _ambientNodes: [],
    _ambientWorld: null,
    _ambientActive: false,

    // Boss music state
    _bossActive: false,
    _bossInterval: null,
    _bossTempo: 200,
    _bossNodes: [],

    // =============================================
    // INITIALIZATION
    // =============================================

    init() {
        if (this._initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this._masterGain = this.ctx.createGain();
            this._masterGain.gain.value = this.masterVolume;
            this._masterGain.connect(this.ctx.destination);
            this._initialized = true;
        } catch (e) {
            // Web Audio API not supported — silently degrade
            console.warn('Web Audio API not available:', e.message);
        }

        // Handle autoplay policy — resume context on user gesture
        const resumeContext = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        document.addEventListener('click', resumeContext, { once: false });
        document.addEventListener('keydown', resumeContext, { once: false });
    },

    // =============================================
    // VOLUME & MUTE (uses Object.defineProperty below)
    // =============================================

    _updateMasterGain() {
        if (!this._masterGain) return;
        if (this.muted) {
            this._masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else {
            this._masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        }
    },

    // =============================================
    // HELPER: Create a sound with envelope
    // =============================================

    _createOscillator(type, freq, startTime, duration, gainValue) {
        if (!this.ctx || !this._masterGain) return null;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this._masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);

        return { osc, gain };
    },

    _now() {
        return this.ctx ? this.ctx.currentTime : 0;
    },

    // =============================================
    // PLAYER SOUNDS
    // =============================================

    playJump() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Upward sweep — cheerful ascending tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Subtle harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, t);
        osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
        gain2.gain.setValueAtTime(0.06, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t);
        osc2.stop(t + 0.15);
    },

    playLand() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Low thud sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

        // Noise burst for impact
        this._playNoiseBurst(t, 0.06, 0.12);
    },

    playWallSlide() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Friction/scraping noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.setValueAtTime(90, t + 0.05);

        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.12);
    },

    playAttack() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Whoosh/swoosh — descending noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.1);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.15);

        // Impact layer
        this._playNoiseBurst(t, 0.08, 0.06);
    },

    playHurt() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Descending dissonant tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.3);

        // Dissonant second voice
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(380, t);
        osc2.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        gain2.gain.setValueAtTime(0.08, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t);
        osc2.stop(t + 0.25);
    },

    playDeath() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Dramatic descending cascade
        const notes = [400, 350, 280, 200, 140];
        notes.forEach((freq, i) => {
            const start = t + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12 - i * 0.02, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + 0.2);
        });

        // Low rumble underneath
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.8);
    },

    // =============================================
    // ENEMY SOUNDS
    // =============================================

    playEnemyHit() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Short impact tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.06);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.1);

        // Click layer
        this._playNoiseBurst(t, 0.1, 0.04);
    },

    playEnemyDefeat() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Pop/burst — ascending then cut
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.setValueAtTime(0.15, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // High pop
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, t + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(400, t + 0.1);
        gain2.gain.setValueAtTime(0.06, t + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t + 0.02);
        osc2.stop(t + 0.15);
    },

    // =============================================
    // BOSS SOUNDS
    // =============================================

    playBossEntrance() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Dramatic low drone + ascending power-up
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, t);
        osc.frequency.linearRampToValueAtTime(80, t + 0.8);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0.12, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.linearRampToValueAtTime(800, t + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 1.1);

        // Rising harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(120, t + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(400, t + 0.9);
        gain2.gain.setValueAtTime(0.08, t + 0.3);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t + 0.3);
        osc2.stop(t + 1.1);
    },

    playBossHit() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Heavy impact — lower and heavier than enemy hit
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Rumble
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(60, t);
        osc2.frequency.exponentialRampToValueAtTime(30, t + 0.15);
        gain2.gain.setValueAtTime(0.15, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t);
        osc2.stop(t + 0.2);

        this._playNoiseBurst(t, 0.12, 0.08);
    },

    playBossDefeat() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Triumphant ascending cascade
        const notes = [200, 300, 400, 500, 600, 800];
        notes.forEach((freq, i) => {
            const start = t + i * 0.12;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = i < 3 ? 'triangle' : 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, start);
            gain.gain.setValueAtTime(0.12, start + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + 0.25);
        });

        // Sustained chord at the end
        const chordStart = t + 0.6;
        [400, 500, 600].forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.08, chordStart);
            gain.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.8);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(chordStart);
            osc.stop(chordStart + 1.0);
        });
    },

    playBossPhaseTransition() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Power-up whoosh + rising tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.4);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.setValueAtTime(0.12, t + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.6);

        // Dissonant warning tone
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, t + 0.2);
        osc2.frequency.setValueAtTime(250, t + 0.3);
        osc2.frequency.setValueAtTime(200, t + 0.4);
        gain2.gain.setValueAtTime(0.06, t + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t + 0.2);
        osc2.stop(t + 0.55);
    },

    // =============================================
    // UI SOUNDS
    // =============================================

    playCoinCollect() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Cheerful two-note bling
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.06);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0.12, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Shimmery overtone
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1760, t);
        osc2.frequency.setValueAtTime(2200, t + 0.06);
        gain2.gain.setValueAtTime(0.04, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t);
        osc2.stop(t + 0.15);
    },

    playHealthPickup() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Warm ascending arpeggio (healing feel)
        const notes = [440, 554, 659];
        notes.forEach((freq, i) => {
            const start = t + i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + 0.25);
        });
    },

    playExtraLife() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Triumphant fanfare — 5-note ascending
        const notes = [523, 587, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const start = t + i * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + 0.25);
        });

        // Sustained final note
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1047;
        gain.gain.setValueAtTime(0.08, t + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t + 0.4);
        osc.stop(t + 1.0);
    },

    playMenuSelect() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Short tick/click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.06);
    },

    playMenuConfirm() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Two-note confirmation chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.setValueAtTime(659, t + 0.06);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1047, t + 0.06);
        gain2.gain.setValueAtTime(0.05, t + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc2.connect(gain2);
        gain2.connect(this._masterGain);
        osc2.start(t + 0.06);
        osc2.stop(t + 0.15);
    },

    playStageClear() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Victory jingle — ascending melody
        const melody = [
            { freq: 523, time: 0, dur: 0.12 },
            { freq: 587, time: 0.1, dur: 0.12 },
            { freq: 659, time: 0.2, dur: 0.12 },
            { freq: 784, time: 0.3, dur: 0.25 },
            { freq: 659, time: 0.5, dur: 0.12 },
            { freq: 784, time: 0.6, dur: 0.12 },
            { freq: 1047, time: 0.7, dur: 0.5 }
        ];

        melody.forEach(note => {
            const start = t + note.time;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.setValueAtTime(0.1, start + note.dur * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + note.dur + 0.05);
        });
    },

    playGameOver() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Sad descending melody
        const melody = [
            { freq: 440, time: 0, dur: 0.3 },
            { freq: 392, time: 0.25, dur: 0.3 },
            { freq: 330, time: 0.5, dur: 0.3 },
            { freq: 262, time: 0.75, dur: 0.6 }
        ];

        melody.forEach(note => {
            const start = t + note.time;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = note.freq;
            gain.gain.setValueAtTime(0.1, start);
            gain.gain.setValueAtTime(0.08, start + note.dur * 0.6);
            gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + note.dur + 0.05);
        });

        // Underlying minor drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 131;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 1.4);
    },

    // =============================================
    // WORLD AMBIENT SYSTEM
    // =============================================

    startAmbient(worldId) {
        if (!this.ctx || !this._masterGain) return;

        // Stop any existing ambient first
        this.stopAmbient();

        this._ambientWorld = worldId;
        this._ambientActive = true;

        switch (worldId) {
            case 'forest':
                this._startForestAmbient();
                break;
            case 'desert':
                this._startDesertAmbient();
                break;
            case 'tundra':
                this._startTundraAmbient();
                break;
            case 'volcano':
                this._startVolcanoAmbient();
                break;
            default:
                // Unknown world — use forest as fallback
                this._startForestAmbient();
                break;
        }
    },

    stopAmbient() {
        this._ambientActive = false;
        this._ambientWorld = null;

        // Stop and disconnect all ambient nodes
        for (const node of this._ambientNodes) {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {
                // Node may already be stopped
            }
        }
        this._ambientNodes = [];

        // Clear any ambient intervals
        if (this._ambientInterval) {
            clearInterval(this._ambientInterval);
            this._ambientInterval = null;
        }
    },

    _startForestAmbient() {
        // Wind + chirps
        // Low wind drone
        const windOsc = this.ctx.createOscillator();
        const windGain = this.ctx.createGain();
        const windFilter = this.ctx.createBiquadFilter();

        windOsc.type = 'sine';
        windOsc.frequency.value = 120;
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 250;
        windGain.gain.value = 0.03;

        windOsc.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this._masterGain);
        windOsc.start();

        this._ambientNodes.push(windOsc, windGain, windFilter);

        // Gentle LFO for wind modulation
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 0.015;

        lfo.connect(lfoGain);
        lfoGain.connect(windGain.gain);
        lfo.start();

        this._ambientNodes.push(lfo, lfoGain);

        // Periodic bird chirps
        this._ambientInterval = setInterval(() => {
            if (!this._ambientActive || this.muted) return;
            if (Math.random() < 0.4) {
                this._playChirp();
            }
        }, 2000);
    },

    _playChirp() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();
        const baseFreq = 1800 + Math.random() * 800;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.setValueAtTime(baseFreq * 1.2, t + 0.05);
        osc.frequency.setValueAtTime(baseFreq, t + 0.1);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
    },

    _startDesertAmbient() {
        // Hot wind drone
        const windOsc = this.ctx.createOscillator();
        const windGain = this.ctx.createGain();
        const windFilter = this.ctx.createBiquadFilter();

        windOsc.type = 'sawtooth';
        windOsc.frequency.value = 80;
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 180;
        windFilter.Q.value = 3;
        windGain.gain.value = 0.02;

        windOsc.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this._masterGain);
        windOsc.start();

        this._ambientNodes.push(windOsc, windGain, windFilter);

        // LFO for wind gusts
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.15;
        lfoGain.gain.value = 0.01;

        lfo.connect(lfoGain);
        lfoGain.connect(windGain.gain);
        lfo.start();

        this._ambientNodes.push(lfo, lfoGain);

        // Occasional sand whisper
        this._ambientInterval = setInterval(() => {
            if (!this._ambientActive || this.muted) return;
            if (Math.random() < 0.3) {
                this._playSandWhisper();
            }
        }, 3000);
    },

    _playSandWhisper() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.value = 200 + Math.random() * 100;
        filter.type = 'bandpass';
        filter.frequency.value = 400 + Math.random() * 200;
        filter.Q.value = 5;
        gain.gain.setValueAtTime(0.015, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.5);
    },

    _startTundraAmbient() {
        // Howling wind + shimmer
        const windOsc = this.ctx.createOscillator();
        const windGain = this.ctx.createGain();
        const windFilter = this.ctx.createBiquadFilter();

        windOsc.type = 'sawtooth';
        windOsc.frequency.value = 150;
        windFilter.type = 'bandpass';
        windFilter.frequency.value = 350;
        windFilter.Q.value = 4;
        windGain.gain.value = 0.025;

        windOsc.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this._masterGain);
        windOsc.start();

        this._ambientNodes.push(windOsc, windGain, windFilter);

        // Wind howl modulation
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.4;
        lfoGain.gain.value = 60;

        lfo.connect(lfoGain);
        lfoGain.connect(windFilter.frequency);
        lfo.start();

        this._ambientNodes.push(lfo, lfoGain);

        // Ice shimmer
        this._ambientInterval = setInterval(() => {
            if (!this._ambientActive || this.muted) return;
            if (Math.random() < 0.5) {
                this._playIceShimmer();
            }
        }, 2500);
    },

    _playIceShimmer() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, t);
        osc.frequency.exponentialRampToValueAtTime(3000 + Math.random() * 500, t + 0.15);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.3);
    },

    _startVolcanoAmbient() {
        // Deep rumble + crackle
        const rumbleOsc = this.ctx.createOscillator();
        const rumbleGain = this.ctx.createGain();
        const rumbleFilter = this.ctx.createBiquadFilter();

        rumbleOsc.type = 'sawtooth';
        rumbleOsc.frequency.value = 40;
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.value = 120;
        rumbleGain.gain.value = 0.04;

        rumbleOsc.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(this._masterGain);
        rumbleOsc.start();

        this._ambientNodes.push(rumbleOsc, rumbleGain, rumbleFilter);

        // Rumble modulation
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5;
        lfoGain.gain.value = 0.02;

        lfo.connect(lfoGain);
        lfoGain.connect(rumbleGain.gain);
        lfo.start();

        this._ambientNodes.push(lfo, lfoGain);

        // Periodic crackle
        this._ambientInterval = setInterval(() => {
            if (!this._ambientActive || this.muted) return;
            if (Math.random() < 0.5) {
                this._playLavaCrackle();
            }
        }, 1500);
    },

    _playLavaCrackle() {
        if (!this.ctx || !this._masterGain) return;
        const t = this._now();

        // Multiple short crackle bursts
        for (let i = 0; i < 3; i++) {
            const start = t + i * 0.04 + Math.random() * 0.02;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.value = 100 + Math.random() * 200;
            filter.type = 'highpass';
            filter.frequency.value = 300;
            gain.gain.setValueAtTime(0.04, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.03);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this._masterGain);
            osc.start(start);
            osc.stop(start + 0.05);
        }
    },

    // =============================================
    // BOSS MUSIC — Procedural Percussion Loop
    // =============================================

    startBossMusic() {
        if (!this.ctx || !this._masterGain) return;
        this.stopBossMusic();

        this._bossActive = true;
        this._bossTempo = 200; // ms per beat (default = healthRatio 1.0)

        this._scheduleBossBeats();
    },

    stopBossMusic() {
        this._bossActive = false;

        if (this._bossInterval) {
            clearInterval(this._bossInterval);
            this._bossInterval = null;
        }

        // Clean up any lingering boss nodes
        for (const node of this._bossNodes) {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {}
        }
        this._bossNodes = [];
    },

    updateBossMusic(healthRatio) {
        if (!this._bossActive) return;

        // Map health ratio to tempo: 1.0 = slow (200ms), 0.0 = fast (100ms)
        const newTempo = 100 + healthRatio * 100;

        // Only reschedule if tempo changed significantly
        if (Math.abs(newTempo - this._bossTempo) > 5) {
            this._bossTempo = newTempo;
            // Restart the beat loop with new tempo
            if (this._bossInterval) {
                clearInterval(this._bossInterval);
            }
            this._scheduleBossBeats();
        }
    },

    _scheduleBossBeats() {
        if (!this._bossActive) return;

        let beatIndex = 0;

        // Schedule repeating beats
        this._bossInterval = setInterval(() => {
            if (!this._bossActive || !this.ctx || !this._masterGain) return;

            const t = this._now();
            const beat = beatIndex % 8;

            // Kick on beats 0, 4
            if (beat === 0 || beat === 4) {
                this._playBossKick(t);
            }

            // Hi-hat on every beat
            this._playBossHihat(t);

            // Snare on beats 2, 6
            if (beat === 2 || beat === 6) {
                this._playBossSnare(t);
            }

            // Extra percussion on beats 3, 7 when tempo is fast (boss is low health)
            if ((beat === 3 || beat === 7) && this._bossTempo < 150) {
                this._playBossHihat(t);
            }

            beatIndex++;
        }, this._bossTempo);
    },

    _playBossKick(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    _playBossSnare(t) {
        // Noise-like snare via detuned oscillators
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.value = 200;
        filter.type = 'highpass';
        filter.frequency.value = 500;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.1);

        // Noise component
        this._playNoiseBurst(t, 0.07, 0.05);
    },

    _playBossHihat(t) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'square';
        osc.frequency.value = 6000 + Math.random() * 2000;
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this._masterGain);
        osc.start(t);
        osc.stop(t + 0.05);
    },

    // =============================================
    // NOISE BURST HELPER (used by many sounds)
    // =============================================

    _playNoiseBurst(startTime, gainValue, duration) {
        if (!this.ctx || !this._masterGain) return;

        // Simulate noise with multiple detuned oscillators
        const freqs = [1000, 2500, 4000, 5500];
        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'square';
            osc.frequency.value = freq + Math.random() * 500;
            filter.type = 'highpass';
            filter.frequency.value = 2000;
            gain.gain.setValueAtTime(gainValue * 0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this._masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.02);
        });
    }
};

// =============================================
// PROPERTY INTERCEPTORS for masterVolume and muted
// These ensure the master gain node updates when properties change
// =============================================

(function() {
    let _masterVolume = 0.7;
    let _muted = false;

    Object.defineProperty(AudioManager, 'masterVolume', {
        get() { return _masterVolume; },
        set(v) {
            _masterVolume = Math.max(0, Math.min(1, v));
            AudioManager._updateMasterGain();
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(AudioManager, 'muted', {
        get() { return _muted; },
        set(v) {
            _muted = !!v;
            AudioManager._updateMasterGain();
        },
        enumerable: true,
        configurable: true
    });
})();
