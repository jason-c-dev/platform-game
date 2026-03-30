# Sprint 07: World 3 — Frozen Tundra

## Generator Log

### Overview
Implemented World 3: Frozen Tundra with 3 stages, 3 enemy types, 3 bosses, ice physics, ice block puzzles, auto-scrolling camera, fire-lure ice melt puzzles, and full integration with the world map and save system.

### Implementation Steps

#### 1. Constants & Ice Physics (C-04)
- Added `TILE_ICE = 14` constant and `TILES.ICE` for test access
- Added `ICE_FRICTION = 0.97` and `ICE_ACCELERATION = 0.04`
- Updated `Physics.applyMovement()` to check `entity.onIce` for reduced friction
- Updated `Physics._checkTileCollisionsY()` to detect ICE tiles and set `onIce` flag
- Added `Physics._isSolidTile()` helper to include ICE in solid tile checks
- Updated `Physics.resolveCollisions()` to propagate ice state to entity

#### 2. Camera — Tundra Parallax & Auto-Scroll (C-02, C-09)
- Added tundra parallax layers using `COLORS.tundra` palette
- Added `autoScroll`, `autoScrollSpeed`, `autoScrollX` properties
- Auto-scroll for stage 3-3: camera advances at 1.2px/frame
- Player takes damage if they fall behind the left edge during auto-scroll
- Boss arena lock disables auto-scroll (using existing `locked` flag)

#### 3. Renderer — Tundra Visuals (C-01, C-02, C-03)
- **Tundra parallax**: Night sky gradient, snow-capped mountains, frozen trees, ice formations, near snow mounds
- **Aurora borealis**: 5 animated curtain bands alternating green/teal with sine-wave motion
- **Tundra solid tiles**: Snow-covered surface with ice body, frost texture lines; underground frozen stone
- **Ice tiles**: Translucent ice with crack patterns, shimmer effect, glassy highlights
- **Snow particles**: 80 particles drifting downward with wobble animation, wrapping at screen edges
- **One-way tiles**: Ice shelf variant for tundra world
- **Ice block, fire source, meltable block renderers**: Custom canvas drawing for puzzle elements
- Updated `clear()` and `renderParallax()` for world 2 (tundra)

#### 4. Level Design — 3 Tundra Stages (C-11, C-12, C-13)
- **Stage 3-1 Frozen Lake (120 tiles)**: Ice physics sections, fire-lure puzzle with meltable ice walls, torch fire source, Frost Imp + Ice Golem enemies, Frost Bear boss arena with ice floor
- **Stage 3-2 Crystal Caverns (135 tiles)**: Ice block sliding puzzles (3 pushable blocks), crystal formations, cave ceiling, mixed enemy types including Snow Owls, Crystal Witch boss arena
- **Stage 3-3 Avalanche Peak (165 tiles)**: Auto-scroll with 3 path fork sections (upper/lower routes), all 3 tundra enemy types, Yeti Monarch tiered boss arena

#### 5. Ice Mechanics (C-04, C-05, C-26)
- Ice tiles act as solid with reduced friction for player
- Pushable ice blocks: slide on frictionless surfaces until hitting walls
- Fire-lure ice melt: torch fire sources melt nearby meltable ice blocks
- `Level._placeIce()` helper for easy ice tile placement
- All puzzle elements tracked in `Level.puzzleElements` array

#### 6. Enemies — 3 Tundra Types (C-06, C-07, C-08)
- **Frost Imp**: Snowball projectile with arc trajectory + gravity, `freezesPlatforms` flag, light patrol movement
- **Ice Golem**: Ice-aware patrol (slides on ice), 2 HP, shatters into 8 fragments on death with custom shatter animation
- **Snow Owl**: Figure-8 flight pattern, swoops toward player when close, pulls out of dive near ground

#### 7. Bosses — 3 Tundra Bosses (C-14, C-15, C-16, C-17, C-18, C-19)
- **Frost Bear (7 HP)**: Charges at player, fires horizontal frost beam (5 projectiles), phase 2 adds slam shockwave
- **Crystal Witch (25 HP = 20 shield + 5 witch)**: Crystal shield diamond visual, teleport + crystal shard spread, phase 2 adds aimed projectile burst
- **Yeti Monarch (9 HP)**: Boulder throw (arc projectile), phase 2 adds second boulder + ground slam shockwave
- All bosses follow vulnerability window pattern (invulnerable during attack, vulnerable after)
- Phase transition at 50% health with visual indicators

#### 8. Projectile & Death Rendering
- 5 new projectile types: snowball, frost_beam, crystal_shard, boulder (+ shockwave reuse)
- Ice golem shatter death: fragments fly outward with gravity and rotation
- Tundra-colored death particles for all ice enemies

#### 9. Integration (C-20, C-21, C-22, C-23, C-24, C-25)
- Coin counts: 20 (3-1), 24 (3-2), 30 (3-3) matching WorldMap.STAGES
- Health pickups: 2+ per stage
- Enemy counts: 6, 8, 9 per stage (all >= 3)
- World map progression: existing linear unlock system works for World 3
- Save system: generic, handles any stage ID including World 3
- Boss arena trigger, camera lock, boss spawn, defeat, and STAGE_COMPLETE flow all use existing generic framework

### Files Modified
- `src/constants.js` — TILE_ICE, ICE_FRICTION, ICE_ACCELERATION
- `src/physics.js` — Ice friction, _isSolidTile, onIce tracking
- `src/camera.js` — Tundra parallax, auto-scroll
- `src/renderer.js` — Tundra parallax, aurora, tiles, snow, ice/fire/melt renderers
- `src/level.js` — 3 tundra stages, ice blocks, fire sources, meltable blocks, fork sections
- `src/enemies.js` — 3 enemy types, 3 bosses, rendering, projectiles
- `src/player.js` — onIce property
- `src/states.js` — Tundra mechanics updates, ice block push, snow/tundra renders

### Regression Notes
- All Forest stages (1-1, 1-2, 1-3) untouched — same code paths
- All Desert stages (2-1, 2-2, 2-3) untouched — same code paths
- Physics changes are additive (ice detection), no changes to existing friction/collision
- Renderer changes are additive (world === 2 branches), existing forest/desert rendering unchanged
- Enemy changes are additive (new types in switch statements), existing enemy AI unchanged
- All JS files pass syntax checks
