# Sprint 12: Integration, Balance & Performance — Generator Log

## Summary
Sprint 12 is the final integration and polish pass across all 11 prior sprints. The codebase was already in excellent shape from prior sprints. The main work involved verifying all 30 contract criteria, fixing two gaps (auto-scroll kill boundary and window globals), and adding a particle cap safety net.

## Changes Made

### 1. Auto-scroll kill boundary (C-23)
**File**: `src/states.js`
- Added auto-scroll kill boundary check in `_updateStage()`
- When `Camera.autoScroll` is active and not locked (boss arena), the player takes damage if they fall behind `Camera.autoScrollX - TILE_SIZE`
- Properly checks invincibility and death state before applying damage
- Affects stage 3-3 (Avalanche Peak) only

### 2. Particle count cap (C-19)
**File**: `src/particles.js`
- Added `MAX_PARTICLES = 300` hard cap constant
- After normal lifetime-based removal, enforce cap by removing oldest particles if count exceeds limit
- Prevents unbounded growth in edge cases (e.g., particle-heavy boss fights)

### 3. Window global exposure (C-27)
**File**: `index.html`
- Added explicit `window.X = X` assignments for all 17 game globals
- `const` declarations at script-tag top level are NOT properties of `window` in browsers
- All 17 globals now accessible via `window[name]` for test automation:
  Game, GameState, Renderer, Input, Level, Physics, Camera, Player, Particles, Enemies, Transition, HUD, Menu, SaveSystem, Collectibles, WorldMap, AudioManager

## Verification Results

All 30 criteria verified via Playwright automation and code inspection:

| Category | Criteria | Status |
|----------|----------|--------|
| loading | C-01 (Game loads, 18 scripts, zero errors) | PASS |
| loading | C-02 (All 13 stages loadable) | PASS |
| stage-structure | C-03 (All spawn/exit points valid) | PASS |
| stage-structure | C-04 (All boss data defined) | PASS |
| stage-structure | C-05 (Coin counts match WorldMap.STAGES) | PASS |
| stage-structure | C-06 (Enemy spawns valid for all stages) | PASS |
| progression | C-07 (World map unlock progression) | PASS |
| progression | C-08 (Boss-defeat-to-exit flow, no softlocks) | PASS |
| progression | C-09 (Victory state reachable from 5-1) | PASS |
| save-system | C-10 (Save system round-trip) | PASS |
| save-system | C-11 (Best records persistence) | PASS |
| save-system | C-12 (Clear save) | PASS |
| game-feel | C-13 (Coyote time, COYOTE_FRAMES=6) | PASS |
| game-feel | C-14 (Jump buffer, JUMP_BUFFER_FRAMES=8) | PASS |
| game-feel | C-15 (Variable jump, VARIABLE_JUMP_MULTIPLIER=0.4) | PASS |
| game-feel | C-16 (Wall slide, WALL_SLIDE_SPEED=2) | PASS |
| performance | C-17 (60fps on title screen) | PASS |
| performance | C-18 (60fps during gameplay) | PASS |
| performance | C-19 (Particle cap prevents unbounded growth) | PASS |
| boss-balance | C-20 (All 13 boss maxHealth values correct) | PASS |
| boss-balance | C-21 (All boss types spawn without errors) | PASS |
| world-mechanics | C-22 (Ice physics in Tundra stages) | PASS |
| world-mechanics | C-23 (Auto-scroll kill boundary in 3-3) | PASS |
| audio-integration | C-24 (All 11 AudioManager methods exist) | PASS |
| state-machine | C-25 (All 8 game states defined) | PASS |
| state-machine | C-26 (Pause/resume with stage behind overlay) | PASS |
| no-errors | C-27 (All 17 globals defined on window) | PASS |
| no-errors | C-28 (Zero errors in full game flow) | PASS |
| hud | C-29 (HUD renders hearts, coins, name, boss bar) | PASS |
| collectibles | C-30 (Coin collection: increment, remove, sound) | PASS |

## Commits
1. `cb0eddb` — Auto-scroll kill boundary and particle cap [C-23, C-19]
2. `0e0728c` — Expose all game globals on window [C-27]

## Notes
- The codebase was well-structured from previous sprints; most criteria passed without changes
- Boss health values all match spec exactly: Elder Shroomba 5, Vine Mother 6, Stag King 7, Sand Wyrm 6, Pharaoh Specter 8, Hydra Cactus 12, Frost Bear 7, Crystal Witch 25, Yeti Monarch 9, Lava Serpent 7, Iron Warden 7, Dragon of the Caldera 11, The Architect 19
- All 13 stages have valid level data: spawn points, exit points, boss data, coin positions, and enemy spawns
- Save system correctly tracks best times (lower is better) and best coin records (higher is better)
- FPS stable at 60fps on both title screen and during active gameplay
