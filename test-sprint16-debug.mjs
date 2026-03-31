// =============================================================
// test-sprint16-debug.mjs — Diagnostic: find exact locations of
// narrow platforms in stages 1-1, 2-3, 3-1
// =============================================================

import { readFileSync } from 'fs';
import vm from 'vm';

// ── Browser environment stubs (same as test-sprint16.mjs) ─────
const sandbox = {
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

sandbox.window = sandbox;
const ctx = vm.createContext(sandbox);

vm.runInContext('const GameState = { currentStageId: "1-1" };', ctx);

const constantsSrc = readFileSync('/Users/claude/dev/platform-game/src/constants.js', 'utf8');
vm.runInContext(constantsSrc, ctx, { filename: 'constants.js' });

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
const TILE_LADDER = vm.runInContext('TILE_LADDER', ctx);
const TILE_BOUNCE = vm.runInContext('TILE_BOUNCE', ctx);
const TILE_WATER = vm.runInContext('TILE_WATER', ctx);
const TILE_WATER_SURFACE = vm.runInContext('TILE_WATER_SURFACE', ctx);
const TILE_QUICKSAND = vm.runInContext('TILE_QUICKSAND', ctx);
const TILE_QUICKSAND_DEEP = vm.runInContext('TILE_QUICKSAND_DEEP', ctx);
const TILE_PRESSURE_PLATE = vm.runInContext('TILE_PRESSURE_PLATE', ctx);
const TILE_CRUMBLE = vm.runInContext('TILE_CRUMBLE', ctx);

// Tile name lookup for readable output
const TILE_NAMES = {};
TILE_NAMES[TILE_EMPTY] = 'EMPTY';
TILE_NAMES[TILE_SOLID] = 'SOLID';
TILE_NAMES[TILE_ONE_WAY] = 'ONE_WAY';
TILE_NAMES[TILE_HAZARD] = 'HAZARD';
TILE_NAMES[TILE_ICE] = 'ICE';
TILE_NAMES[TILE_LAVA] = 'LAVA';
TILE_NAMES[TILE_LADDER] = 'LADDER';
TILE_NAMES[TILE_BOUNCE] = 'BOUNCE';
TILE_NAMES[TILE_WATER] = 'WATER';
TILE_NAMES[TILE_WATER_SURFACE] = 'WATER_SURFACE';
TILE_NAMES[TILE_QUICKSAND] = 'QUICKSAND';
TILE_NAMES[TILE_QUICKSAND_DEEP] = 'QUICKSAND_DEEP';
TILE_NAMES[TILE_PRESSURE_PLATE] = 'PRESSURE_PLATE';
TILE_NAMES[TILE_CRUMBLE] = 'CRUMBLE';
// Fill in any remaining numeric values
for (let i = 0; i <= 20; i++) {
    if (!(i in TILE_NAMES)) TILE_NAMES[i] = `TILE_${i}`;
}

function tileName(val) {
    return TILE_NAMES[val] || `UNKNOWN(${val})`;
}

// ── Standable and passable sets (matching test-sprint16.mjs logic) ──
const STANDABLE = new Set([TILE_SOLID, TILE_ONE_WAY, TILE_ICE]);

// Passable-above tiles: tiles the player can occupy (not blocking)
const PASSABLE_ABOVE = new Set([
    TILE_EMPTY,
    TILE_LADDER,
    TILE_BOUNCE,
    TILE_WATER,
    TILE_WATER_SURFACE,
    TILE_QUICKSAND,
    TILE_QUICKSAND_DEEP,
    TILE_PRESSURE_PLATE,
    TILE_ONE_WAY,
    TILE_LAVA,
    TILE_HAZARD,
    TILE_CRUMBLE,
]);

function isPassableAbove(level, r, c) {
    if (r <= 0) return true; // above the grid = open air
    const above = level.tiles[r - 1][c];
    // Match the EXACT logic from test-sprint16.mjs
    return above === TILE_EMPTY || above === TILE_ONE_WAY ||
           above === TILE_HAZARD || above === TILE_LAVA ||
           above === TILE_LADDER || above === TILE_WATER ||
           above === TILE_WATER_SURFACE;
}

// ── World min-width requirements ──
const MIN_PLAT_WIDTH_MIN = { 1: 3, 2: 2, 3: 2, 4: 1, 5: 1 };

function getWorld(stageId) {
    return parseInt(stageId.split('-')[0], 10);
}

// ── Find all narrow platform runs in a stage ──
function findNarrowPlatforms(stageId) {
    Level.loadStage(stageId);
    const world = getWorld(stageId);
    const minReq = MIN_PLAT_WIDTH_MIN[world];
    const level = Level;
    const narrowRuns = [];
    let globalNarrowest = Infinity;

    for (let r = 0; r < level.height; r++) {
        let runStart = -1;
        let runLength = 0;
        let runTiles = [];

        for (let c = 0; c <= level.width; c++) {
            const inBounds = c < level.width;
            const tile = inBounds ? level.tiles[r][c] : -1;
            const isStandable = inBounds && STANDABLE.has(tile) && isPassableAbove(level, r, c);

            if (isStandable) {
                if (runLength === 0) runStart = c;
                runLength++;
                runTiles.push({ col: c, tileType: tile, tileName: tileName(tile) });
            } else {
                if (runLength > 0) {
                    if (runLength < globalNarrowest) globalNarrowest = runLength;
                    if (runLength < minReq) {
                        narrowRuns.push({
                            row: r,
                            colStart: runStart,
                            colEnd: runStart + runLength - 1,
                            length: runLength,
                            tiles: runTiles.map(t => t.tileName),
                        });
                    }
                    runLength = 0;
                    runStart = -1;
                    runTiles = [];
                }
            }
        }
    }

    return { stageId, world, minReq, globalNarrowest, narrowRuns, width: level.width, height: level.height };
}

// ── Run for the 3 failing stages ──
const FAILING_STAGES = ['1-1', '2-3', '3-1'];

console.log('=== Sprint 16 — Narrow Platform Location Diagnostic ===\n');
console.log(`Tile values: SOLID=${TILE_SOLID}, ONE_WAY=${TILE_ONE_WAY}, ICE=${TILE_ICE}`);
console.log(`Passable-above check mirrors test-sprint16.mjs exactly.\n`);

for (const stageId of FAILING_STAGES) {
    const result = findNarrowPlatforms(stageId);
    console.log('─'.repeat(60));
    console.log(`STAGE ${result.stageId} (world ${result.world})`);
    console.log(`  Grid: ${result.width} cols x ${result.height} rows`);
    console.log(`  Required min platform width: >= ${result.minReq} tiles`);
    console.log(`  Actual narrowest run found: ${result.globalNarrowest} tile(s)`);
    console.log(`  Narrow runs (below ${result.minReq} tiles):`);

    if (result.narrowRuns.length === 0) {
        console.log('    (none found -- stage passes)');
    } else {
        for (const run of result.narrowRuns) {
            console.log(`    row=${run.row}, cols=${run.colStart}..${run.colEnd}, length=${run.length}, tiles=[${run.tiles.join(', ')}]`);
        }
    }
    console.log();
}

console.log('=== Done ===');
