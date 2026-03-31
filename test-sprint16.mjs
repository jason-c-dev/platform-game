// =============================================================
// test-sprint16.mjs — Node.js-based level data validation
// Stubs browser globals, loads constants.js + level.js directly,
// then validates enemy density, hazard percentage, and min
// platform width for all 13 stages.
// =============================================================

import { readFileSync } from 'fs';
import vm from 'vm';

// ── Browser environment stubs ──────────────────────────────────
const sandbox = {
    // Minimal stubs so the scripts can be evaluated
    console,
    document: {
        getElementById: () => ({
            getContext: () => ({
                fillRect: () => {},
                clearRect: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                moveTo: () => {},
                lineTo: () => {},
                closePath: () => {},
                save: () => {},
                restore: () => {},
                translate: () => {},
                rotate: () => {},
                scale: () => {},
                drawImage: () => {},
                createLinearGradient: () => ({ addColorStop: () => {} }),
                createRadialGradient: () => ({ addColorStop: () => {} }),
                measureText: () => ({ width: 0 }),
                fillText: () => {},
                strokeText: () => {},
                setTransform: () => {},
            }),
            width: 960,
            height: 540,
            style: {},
            addEventListener: () => {},
        }),
        addEventListener: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
    },
    window: {},
    navigator: { userAgent: 'node' },
    requestAnimationFrame: () => {},
    cancelAnimationFrame: () => {},
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
    },
    AudioContext: class { constructor() {} },
    webkitAudioContext: class { constructor() {} },
    Audio: class { constructor() { this.play = () => Promise.resolve(); this.pause = () => {}; this.addEventListener = () => {}; } },
    Image: class { constructor() { this.onload = null; this.src = ''; } },
    performance: { now: () => Date.now() },
    Math,
    Array,
    Object,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Number,
    String,
    Boolean,
    Date,
    RegExp,
    Error,
    TypeError,
    RangeError,
    Map,
    Set,
    Promise,
    Symbol,
    Proxy,
    Reflect,
    undefined,
    NaN,
    Infinity,
};

// Make window reference the sandbox itself (circular, like a real browser)
sandbox.window = sandbox;

// Create the VM context
const ctx = vm.createContext(sandbox);

// ── Stub GameState (Level.init() references it, but we call loadStage directly) ──
vm.runInContext('const GameState = { currentStageId: "1-1" };', ctx);

// ── Load constants.js ──
const constantsSrc = readFileSync('/Users/claude/dev/platform-game/src/constants.js', 'utf8');
vm.runInContext(constantsSrc, ctx, { filename: 'constants.js' });

// ── Load level.js ──
const levelSrc = readFileSync('/Users/claude/dev/platform-game/src/level.js', 'utf8');
vm.runInContext(levelSrc, ctx, { filename: 'level.js' });

// ── Extract references ──
const Level = vm.runInContext('Level', ctx);
const TILE_SIZE = vm.runInContext('TILE_SIZE', ctx);
const TILE_EMPTY = vm.runInContext('TILE_EMPTY', ctx);
const TILE_SOLID = vm.runInContext('TILE_SOLID', ctx);
const TILE_ONE_WAY = vm.runInContext('TILE_ONE_WAY', ctx);
const TILE_HAZARD = vm.runInContext('TILE_HAZARD', ctx);
const TILE_ICE = vm.runInContext('TILE_ICE', ctx);
const TILE_LAVA = vm.runInContext('TILE_LAVA', ctx);

// ── Stage definitions ──────────────────────────────────────────
const ALL_STAGES = [
    '1-1', '1-2', '1-3',
    '2-1', '2-2', '2-3',
    '3-1', '3-2', '3-3',
    '4-1', '4-2', '4-3',
    '5-1',
];

function getWorld(stageId) {
    return parseInt(stageId.split('-')[0], 10);
}

// ── Limits ─────────────────────────────────────────────────────
const ENEMY_DENSITY_LIMIT = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 };
const HAZARD_PCT_LIMIT    = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 20 };
const MIN_PLAT_WIDTH_MIN  = { 1: 3, 2: 2, 3: 2, 4: 1, 5: 1 };

// ── Analysis functions ─────────────────────────────────────────

/**
 * Enemy density: max enemies in any 30-tile-wide sliding window.
 * Enemy x is in pixels; convert to tile column.
 */
function computeMaxEnemyDensity(level) {
    const enemyCols = level.enemySpawns.map(e => Math.floor(e.x / TILE_SIZE));
    if (enemyCols.length === 0) return 0;

    const W = level.width;
    const WINDOW = 30;

    let maxCount = 0;
    for (let start = 0; start <= W - WINDOW; start++) {
        const end = start + WINDOW;
        let count = 0;
        for (const col of enemyCols) {
            if (col >= start && col < end) count++;
        }
        if (count > maxCount) maxCount = count;
    }
    return maxCount;
}

/**
 * Hazard percentage: (TILE_HAZARD + TILE_LAVA) / non-empty tiles * 100
 */
function computeHazardPercentage(level) {
    let hazardCount = 0;
    let nonEmptyCount = 0;

    for (let r = 0; r < level.height; r++) {
        for (let c = 0; c < level.width; c++) {
            const tile = level.tiles[r][c];
            if (tile !== TILE_EMPTY) {
                nonEmptyCount++;
                if (tile === TILE_HAZARD || tile === TILE_LAVA) {
                    hazardCount++;
                }
            }
        }
    }

    if (nonEmptyCount === 0) return 0;
    return (hazardCount / nonEmptyCount) * 100;
}

/**
 * Min platform width: find the narrowest contiguous run of standable tiles
 * (SOLID, ONE_WAY, ICE) in any row where the tile above is passable (EMPTY
 * or non-solid — i.e., a place the player could actually stand).
 * Returns the width of the narrowest such run across the entire stage.
 * A run must be at least 1 tile to count.
 */
function computeMinPlatformWidth(level) {
    const STANDABLE = new Set([TILE_SOLID, TILE_ONE_WAY, TILE_ICE]);

    // A tile is passable if it's empty or not solid (player can occupy it)
    function isPassableAbove(r, c) {
        if (r <= 0) return true; // Above the grid = open air
        const above = level.tiles[r - 1][c];
        return above === TILE_EMPTY || above === TILE_ONE_WAY ||
               above === TILE_HAZARD || above === TILE_LAVA ||
               above === 6 /* LADDER */ || above === 10 /* WATER */ ||
               above === 11 /* WATER_SURFACE */;
    }

    let minWidth = Infinity;

    for (let r = 0; r < level.height; r++) {
        let runLength = 0;
        for (let c = 0; c < level.width; c++) {
            const tile = level.tiles[r][c];
            if (STANDABLE.has(tile) && isPassableAbove(r, c)) {
                runLength++;
            } else {
                if (runLength > 0 && runLength < minWidth) {
                    minWidth = runLength;
                }
                runLength = 0;
            }
        }
        // End of row
        if (runLength > 0 && runLength < minWidth) {
            minWidth = runLength;
        }
    }

    return minWidth === Infinity ? 0 : minWidth;
}

// ── Test runner ────────────────────────────────────────────────
let totalPass = 0;
let totalFail = 0;
const results = [];

function check(stageId, category, passed, detail) {
    const status = passed ? 'PASS' : 'FAIL';
    if (passed) totalPass++; else totalFail++;
    results.push({ stageId, category, status, detail });
    console.log(`  [${status}] ${stageId} ${category} -- ${detail}`);
}

console.log('=== Sprint 16 — Level Data Validation ===\n');

// ── 1. Enemy Density ──────────────────────────────────────────
console.log('--- CHECK 1: Enemy Density (max enemies in 30-tile window) ---');
for (const stageId of ALL_STAGES) {
    Level.loadStage(stageId);
    const world = getWorld(stageId);
    const limit = ENEMY_DENSITY_LIMIT[world];
    const maxDensity = computeMaxEnemyDensity(Level);
    const passed = maxDensity <= limit;
    check(stageId, 'enemyDensity',  passed,
        `maxInWindow=${maxDensity}, limit=${limit}, totalEnemies=${Level.enemySpawns.length}`);
}

// ── 2. Hazard Percentage ──────────────────────────────────────
console.log('\n--- CHECK 2: Hazard Percentage (TILE_HAZARD + TILE_LAVA / non-empty) ---');
for (const stageId of ALL_STAGES) {
    Level.loadStage(stageId);
    const world = getWorld(stageId);
    const limit = HAZARD_PCT_LIMIT[world];
    const pct = computeHazardPercentage(Level);
    const passed = pct <= limit;
    check(stageId, 'hazardPercentage', passed,
        `actual=${pct.toFixed(2)}%, limit=${limit}%`);
}

// ── 3. Min Platform Width ─────────────────────────────────────
console.log('\n--- CHECK 3: Min Platform Width (narrowest standable run with clear above) ---');
for (const stageId of ALL_STAGES) {
    Level.loadStage(stageId);
    const world = getWorld(stageId);
    const minReq = MIN_PLAT_WIDTH_MIN[world];
    const narrowest = computeMinPlatformWidth(Level);
    const passed = narrowest >= minReq;
    check(stageId, 'minPlatformWidth', passed,
        `narrowest=${narrowest}, required>=${minReq}`);
}

// ── Summary ───────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

// Group by category
const categories = ['enemyDensity', 'hazardPercentage', 'minPlatformWidth'];
for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const passed = catResults.filter(r => r.status === 'PASS').length;
    const failed = catResults.filter(r => r.status === 'FAIL').length;
    const status = failed === 0 ? 'ALL PASS' : `${failed} FAIL`;
    console.log(`  ${cat}: ${passed}/${catResults.length} pass (${status})`);
    if (failed > 0) {
        for (const r of catResults.filter(r => r.status === 'FAIL')) {
            console.log(`    FAIL: ${r.stageId} -- ${r.detail}`);
        }
    }
}

console.log(`\nTOTAL: ${totalPass} PASS, ${totalFail} FAIL out of ${totalPass + totalFail} checks`);
console.log('='.repeat(60));

process.exit(totalFail > 0 ? 1 : 0);
