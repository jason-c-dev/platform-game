# Sprint 06: World 2 — Scorching Desert — Generator Log

## Summary
Implemented World 2: Scorching Desert with 3 complete stages, 3 new enemy types, 3 boss fights, and 5 new gameplay mechanics. All 30 contract criteria addressed.

## Implementation Details

### New Tile Types (constants.js)
- `TILE_QUICKSAND` (8), `TILE_QUICKSAND_DEEP` (9) - quicksand hazard
- `TILE_WATER` (10), `TILE_WATER_SURFACE` (11) - water/swimming zones
- `TILE_PRESSURE_PLATE` (12) - puzzle trigger
- `TILE_GATE` (13) - openable gate (solid until triggered)

### Three Desert Stages (level.js)
- **Stage 2-1: Dune Sea** (110 tiles wide, 20 tall) — Quicksand pits, pressure plate puzzle, stepping stones, ruins section. 18 coins, 2 health, 7 enemies, Sand Wyrm boss arena.
- **Stage 2-2: Buried Temple** (135 tiles wide, 22 tall) — Dark room sections (2 zones), mirror puzzle (3 mirrors + gate), temple pillars, hidden hazards. 22 coins, 3 health, 8 enemies, Pharaoh Specter boss arena.
- **Stage 2-3: Oasis Mirage** (145 tiles wide, 22 tall) — Multiple water pools (deep oasis with underwater platforms), quicksand+water mix, moving platforms. 28 coins, 3 health, 8 enemies, Hydra Cactus boss arena.

### New Mechanics (level.js)
- **Quicksand**: Player slowly sinks, horizontal movement hindered (0.7x), can jump out. Deep quicksand triggers damage.
- **Water/Swimming**: Reduced gravity (0.85x), slowed movement (0.9x), swim up with jump key, terminal velocity capped at 2.
- **Dark Rooms**: Defined as dark zones in level data. Renderer draws dark overlay with radial spotlight centered on player (100px radius).
- **Pressure Plates**: Player steps on plate → linked gate opens (tile set to empty), visual feedback with particles.
- **Mirror Puzzles**: 3 mirrors in stage 2-2. Visiting near all mirrors solves puzzle and opens mirror-linked gate.

### Desert Enemy Types (enemies.js)
- **Sand Skitter**: Charge behavior. Patrols normally, then charges toward player at 2.5x speed when within 200px detection range. 1 HP, desert creature with pincers.
- **Dust Devil**: Sine-wave vertical movement, invincible (health=Infinity, invincible=true). Cannot be killed by player attacks. Swirling vortex visual.
- **Mummy**: Patrols like Shroomba. Has `canRevive=true`, `revived=false`, `reviveCount=0`. On first death, enters 'reviving' state for 90 frames, then returns with full HP. Truly dies on second kill.

### Desert Bosses (enemies.js)
- **Sand Wyrm** (6 HP): Submerges, moves underground toward player, then emerges with sand spray projectiles. Phase 2 adds extra burst.
- **Pharaoh Specter** (8 HP): Teleports to random arena position, fires directional projectile fan. Phase 2 adds second teleport + radial attack.
- **Hydra Cactus** (12 HP, 3 heads): Each head attacks independently with thorn projectiles. Heads die as damage accumulates (4 HP each). Phase 2 adds radial thorn burst.

All bosses follow the vulnerability window framework from Sprint 5.

### Desert Rendering (renderer.js)
- **World-aware clear()**: Desert uses dark sand background, forest uses dark green.
- **Desert parallax**: 4 layers — sky gradient, distant dunes, mid-distance ruins/cacti, near dunes.
- **Heat shimmer**: Animated wavy transparency lines across screen.
- **Desert solid tiles**: Sand/brown palette (surface: sand top + dark sand body, underground: dark sand with mortar lines).
- **Desert one-way platforms**: Stone slabs with bleached bone highlights.
- **Quicksand tiles**: Animated sand particles, shifting texture.
- **Water tiles**: Translucent blue overlay, surface waves, underwater caustics.
- **Pressure plate tiles**: Show activated/deactivated state.
- **Gate tiles**: Metal bars with rivets.
- **Dark overlay**: Source-over dark fill + destination-out radial gradient spotlight.
- **Mirror rendering**: Glass panels with gold frames, light beams when visited.

### Camera (camera.js)
- World-aware parallax layer generation: desert stages get desert-colored layer data.

### Integration (states.js, game.js)
- Stage update calls desert mechanics (quicksand, water, pressure plates, mirrors).
- Stage render includes mirrors and dark overlay.
- Debug API exposes desert enemy/boss properties (invincible, behavior, revived, canRevive, heads, name, etc.).

## Commits
1. Add desert tile type constants
2. Add 3 desert stages with all mechanics
3. Add 3 desert enemy types + 3 desert bosses
4. Add desert tile palette, parallax, heat shimmer, dark overlay, water, mirrors
5. World-aware parallax, desert mechanics updates, dark overlay render
6. Add player desert state props, fix water swim input
7. Update debug API with desert enemy/boss properties
8. Fix drawDarkOverlay function, hydra_cactus spawn position

## Self-Test Results
- All JS files parse without syntax errors individually and combined
- Game HTML loads correctly on dev server
- Coin counts verified: 18, 22, 28 (matches WorldMap.STAGES)
- Stage widths: 110, 135, 145 (all exceed minimums, all distinct from forest)
- All enemy/boss properties match evaluator test expectations
- Forest stages unmodified (regression safe)
