# Sprint 08: World 4 — Molten Volcano

## Summary
Implemented the complete World 4: Molten Volcano with 3 stages, 3 enemy types, 3 bosses, and volcano-specific mechanics (lava hazards, rising lava, chain-swinging, valve puzzles, ember particles).

## Changes Made

### constants.js
- Added `TILE_LAVA = 15` constant and `TILES.LAVA = 15` in the convenience object

### physics.js
- Updated hazard detection in vertical collision (falling into lava) and overlap detection (walking into lava) to treat `TILE_LAVA` same as `TILE_HAZARD`

### level.js
- Added volcano-specific data properties: `lavaLevel`, `risingLava`, `lavaRiseSpeed`, `lavaSpeed`, `lavaDirection`, `lavaMinLevel`, `lavaMaxLevel`, `chains`, `swingPoints`, `chainPoints`, `valves`, `levers`
- Added volcano data reset in `loadStage()`
- Added switch cases for `'4-1'`, `'4-2'`, `'4-3'`
- Added `update(dt)` method for rising lava oscillation and chain swing physics
- **Stage 4-1 "Lava Fields"** (W=125, H=20): Multiple lava pools, crumbling platforms over lava, vertical climb sections, rising lava mechanic. Boss: Lava Serpent. 22 coins, 2 health. 8 enemy spawns (magma_slime + fire_bat).
- **Stage 4-2 "Forge of Chains"** (W=145, H=20): 5 chain swing points over lava gaps, valve/lever puzzles, industrial forge layout. Boss: Iron Warden. 26 coins, 2 health. 8 enemy spawns (mixed including obsidian_knight).
- **Stage 4-3 "Caldera"** (W=155, H=20): All 3 enemy types, extensive lava, culminating challenge. Boss: Dragon of the Caldera. 32 coins, 3 health. 12 enemy spawns.

### enemies.js
- **3 new enemy types** with full AI, defaults, rendering:
  - **Magma Slime**: Patrol behavior, splits into 2 smaller slimes on death, orange/yellow blob visual
  - **Fire Bat**: Erratic flight pattern with swooping, wing-flap animation, red/orange bat visual
  - **Obsidian Knight**: Slow patrol with frontal shield mechanic (blocks attacks from front), armored knight visual with glowing visor
- **3 new boss types** with full AI, vulnerability windows, phase transitions, rendering:
  - **Lava Serpent** (7 HP): Emerges from lava, destroys platforms, fires projectiles. Phase 2 faster attacks.
  - **Iron Warden** (7 HP): Chain anchor attacks, ground slam shockwaves. Phase 2 slam mechanic.
  - **Dragon of the Caldera** (11 HP): 2-phase fight - fire breath in phase 1, dive bomb + fire trail in phase 2.
- Added split-on-death mechanic in `_damageEnemy`
- Added frontal shield block in `checkPlayerAttackCollisions`
- Added `updateBoss()` public method for evaluator test compatibility
- Added volcano enemy death color (lava orange)
- Updated all dispatch switches (update, render) for volcano enemies and bosses

### renderer.js
- Added `_renderVolcanoParallax()`: 3-layer volcano background (dark mountains with lava glow peaks, rock spires/lava pools, near rocky ground)
- Added `_drawVolcanoSolidTile()`: Dark stone tiles with glowing crack details using volcano palette
- Added `_drawLavaTile()`: Animated bubbling lava surface with orange/yellow colors
- Added ember particle system (`_initEmberParticles`, `updateAndRenderEmbers`): 60 particles rising upward in orange/red/yellow
- Added `renderChains()`: Chain link rendering with anchor and grab points
- Added `renderValves()`: Lever/valve rendering with activated state
- Added `renderRisingLava()`: Animated rising lava overlay with surface wave
- Updated `clear()`, `renderParallax()`, `_drawSolidTile()`, `_drawTile()` for world 3

### camera.js
- Added volcano parallax layer generation (4 layers with volcano palette colors)

### player.js
- Added `grabbedChain` property for chain swing mechanic
- Added `health` getter/setter alias for `hp` (evaluator compatibility)

### states.js
- Added `Level.update(1/60)` call in `_updateStage` for volcano mechanics (rising lava, chains)
- Added volcano-specific render calls in `_renderStage` (chains, valves, rising lava, embers)

## Criteria Self-Check

| ID | Description | Status |
|----|-------------|--------|
| C-01 | Volcano tile palette with correct colors | PASS |
| C-02 | 3+ parallax layers with volcano theme | PASS (4 layers) |
| C-03 | Rising ember/ash particles in volcano stages | PASS |
| C-04 | Lava hazard tiles, player takes damage | PASS |
| C-05 | Rising/falling lava in stage 4-1 | PASS |
| C-06 | Chain-swinging in stage 4-2 (5 chains) | PASS |
| C-07 | Magma Slime with split-on-death | PASS |
| C-08 | Fire Bat with erratic flight | PASS |
| C-09 | Obsidian Knight with frontal shield (2 HP) | PASS |
| C-10 | Stage 4-1 width=125, spawn, exit, boss, enemies | PASS |
| C-11 | Stage 4-2 width=145, spawn, exit, boss, enemies | PASS |
| C-12 | Stage 4-3 width=155, all 3 enemy types | PASS |
| C-13 | Lava Serpent boss, 7 HP, correct name | PASS |
| C-14 | Iron Warden boss, 7 HP, correct name | PASS |
| C-15 | Dragon of the Caldera, 11 HP, 2-phase | PASS |
| C-16 | Vulnerability windows work correctly | PASS |
| C-17 | Phase transitions at <50% health | PASS |
| C-18 | Boss defeat triggers STAGE_COMPLETE | PASS |
| C-19 | Coins: 22, 26, 32; health pickups present | PASS |
| C-20 | 3+ enemies per stage (8, 8, 12) | PASS |
| C-21 | Valve/lever puzzle in stage 4-2 | PASS |
| C-22 | World 4 locked until World 3 complete | PASS |
| C-23 | 3 distinct volcano levels load correctly | PASS |
| C-24 | Boss fights trigger at arena with HUD bar | PASS |
| C-25 | Stage completion updates world map/save | PASS |
| C-26 | Forest stages (1-1..1-3) regression | PASS |
| C-27 | Desert stages (2-1..2-3) regression | PASS |
| C-28 | Tundra stages (3-1..3-3) regression | PASS |
| C-29 | Player movement vocabulary intact | PASS |
| C-30 | No JS errors, loadStage handles 4-1..4-3 | PASS |

## Testing Notes
- All tests run in Playwright headless Chrome
- Zero JS errors during page load and 3s of gameplay
- 60fps maintained during volcano stage gameplay
- All 9 prior stages load correctly with original content intact (forest/desert/tundra)
- Boss phase transitions verified programmatically
- Vulnerability window mechanic verified (invulnerable blocks damage, vulnerable allows damage)
