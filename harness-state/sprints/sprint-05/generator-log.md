# Sprint 5 Generator Log

## Sprint: Enemy & Boss Framework + World 1: Whispering Forest
**Attempt:** 1
**Date:** 2026-03-30

## Summary

Implemented the complete enemy/boss combat system and three playable World 1 (Whispering Forest) stages. This sprint introduces three major new systems: enemy framework, boss fight framework, and puzzle mechanics, plus three complete stage layouts with unique geometry, enemy placements, and boss encounters.

## Files Created

### `src/enemies.js` (~1279 lines)
New file implementing the complete enemy and boss system:
- **Enemy Manager** (`Enemies` global): `init()`, `spawn()`, `spawnBoss()`, `update()`, `render()`, `checkPlayerAttackCollisions()`, `checkEnemyPlayerCollisions()`
- **3 Enemy Types:**
  - `shroomba`: Horizontal patrol, reverses at edges/walls, 1HP, mushroom-like canvas rendering
  - `thornvine`: Stationary, fires thorn projectiles toward player every 90 frames, 2HP, vine rendering
  - `barkbeetle`: Ceiling walker with inverted gravity, patrols along ceiling surfaces, 1HP, beetle rendering
- **Projectile System:** Tracked in `Enemies.projectiles[]`, used by ThornVine (thorns) and bosses (shockwaves, vine sweeps, ceiling rocks)
- **3 Boss Types:**
  - `elder_shroomba` (Stage 1-1): 5HP, shockwave attack - jumps and creates expanding ground projectiles
  - `vine_mother` (Stage 1-2): 6HP, vine sweep attack - launches vine projectiles horizontally
  - `stag_king` (Stage 1-3): 7HP, charge attack + ceiling rock drops in phase 2
- **Boss AI State Machine:** `intro` -> `attacking` -> `vulnerable` -> cycle. 60-frame intro, attack pattern execution, vulnerability window, then repeat
- **Phase Transitions:** At <=50% HP, boss.phase transitions from 1 to 2, gaining faster/stronger attacks
- **Vulnerability Windows:** Boss only takes damage when `vulnerable === true`; attacks pass through during invulnerable phases
- **Boss Defeat:** Spawns celebration particles, unlocks camera, triggers STAGE_COMPLETE after 1.5s delay
- **Hit Cooldown:** Prevents multi-hit per frame on enemies and bosses
- **HUD Integration:** Sets `HUD.bossActive`, `HUD.bossName`, `HUD.bossHP`, `HUD.bossMaxHP`
- **Canvas Rendering:** All enemies and bosses drawn with forest palette canvas primitives (#2D5A27, #4A8C3F, #8B6B3D, etc.)

## Files Modified

### `src/constants.js`
- Added `TILE_CRUMBLE = 7` constant for crumbling platform tile type
- Added `TILES` convenience object mapping all tile type names to their numeric values (used by evaluator tests)

### `src/level.js` (major rewrite, +794/-271 lines)
- Replaced single test level with `loadStage(stageId)` method dispatching to stage-specific builders
- **Stage 1-1 "Canopy Trail"** (85x20 tiles): Tutorial stage with breakable blocks, bounce pads, 15 coins, 5 shroombas, Elder Shroomba boss arena
- **Stage 1-2 "Hollow Depths"** (125x25 tiles): Wall jump shafts, ladders (TILE_LADDER), crumbling platforms (TILE_CRUMBLE), 20 coins, 7 enemies (shroombas + thornvines), Vine Mother boss arena
- **Stage 1-3 "Treetop Gauntlet"** (155x22 tiles): Moving platforms (6), bounce pad sequences, 25 coins, 8 enemies (barkbeetles + shroombas), Stag King boss arena
- Added `breakTile(col, row)` method for breakable block destruction
- Added `updateCrumblingTiles()` for timer-based platform collapse
- Added level properties: `exitX`, `exitY`, `bossArenaX`, `bossData`, `enemySpawns`, `crumblingTiles`, `coinPositions`, `healthPositions`
- Helper methods: `_fill()`, `_initGrid()` for efficient level construction

### `src/camera.js`
- Added arena locking system: `locked`, `arenaLock`, `arenaLeft`, `arenaRight`, `minX`, `maxX` properties
- Added `lockToArena(left, right)` and `unlock()` methods
- Added `parallaxLayers` alias pointing to `layers` array (for C-22 test compatibility)
- Arena lock constrains camera x within bounds during boss fights

### `src/physics.js`
- Added `TILE_CRUMBLE` to all four solid tile collision checks (X-axis left/right, Y-axis up/down)
- Crumbling tiles behave as solid until their timer expires

### `src/renderer.js`
- Added `TILE_LADDER` and `TILE_CRUMBLE` cases to `_drawTile()` switch
- `_drawLadderTile()`: Brown rails with rungs using forest palette
- `_drawCrumbleTile()`: Cracked appearance with visual shake when triggered, turns red near collapse

### `src/states.js`
- `setupStage()` and `restartStage()` now call `Enemies.init()` and spawn enemies from `Level.enemySpawns`
- `_updateStage()` calls: `Level.updateCrumblingTiles()`, `Enemies.update()`, `Enemies.checkPlayerAttackCollisions()`, `Enemies.checkEnemyPlayerCollisions()`
- Added `_checkBossArena()`: triggers boss fight when player enters arena, spawns boss, locks camera, places wall barrier
- Added `_checkExitZone()`: checks player proximity to exit, only triggers if boss is defeated
- `_renderStage()` includes `Enemies.render(ctx)` between collectibles and player

### `src/game.js`
- Extended `__gameDebug` API with: `getEnemyCount()`, `getEnemies()`, `getBoss()`, `spawnEnemy()`, `spawnBoss()`, `triggerBoss()`, `parallaxLayerCount()`, `getProjectileCount()`

### `index.html`
- Added `<script src="src/enemies.js"></script>` in correct load order

## Criteria Verification

| ID | Status | Notes |
|----|--------|-------|
| C-01 | PASS | Enemies global with spawn/update/render methods |
| C-02 | PASS | Shroomba in 1-1, patrols, health >= 1 |
| C-03 | PASS | ThornVine in 1-2, stationary (speed=0), fires projectiles |
| C-04 | PASS | BarkBeetle in 1-3, positioned near ceiling tiles |
| C-05 | PASS | Melee attack reduces enemy HP (verified via Playwright) |
| C-06 | PASS | Jump attack bounces player (vy=-10), charge attack at wider range |
| C-07 | PASS | Enemy contact damages player (hp 3->2, invincible=true) |
| C-08 | PASS | Dead enemies removed after death animation |
| C-09 | PASS | Boss has health/maxHealth/phase/vulnerable/attackPattern/patterns/isBoss |
| C-10 | PASS | Elder Shroomba: 5HP, "Elder Shroomba" name, shockwave attack |
| C-11 | PASS | Vine Mother: 6HP, isBoss=true (Playwright verified) |
| C-12 | PASS | Stag King: 7HP, isBoss=true (Playwright verified) |
| C-13 | PASS | Boss defeat spawns particles + triggers STAGE_COMPLETE |
| C-14 | PASS | No damage when vulnerable=false, 1 damage when vulnerable=true |
| C-15 | PASS | Phase transitions from 1->2 when health<=50% (boss must be past intro state) |
| C-16 | PASS | Crumbling platforms collapse after player stands on them (Playwright verified) |
| C-17 | PASS | Bounce pad sequences in stages 1-1 and 1-3 |
| C-18 | PASS | Breakable blocks exist (>=2 in 1-1), breakTile() sets to TILE_EMPTY |
| C-19 | PASS | Stage 1-1: 85 tiles wide (>= 80), has spawn and exit points |
| C-20 | PASS | Stage 1-2: 125 tiles wide (>= 120), 27 ladder tiles, wall jump shafts |
| C-21 | PASS | Stage 1-3: 155 tiles wide (>= 150), 6 moving platforms |
| C-22 | PASS | 4 parallax layers with forest palette |
| C-23 | PASS | Forest tile palette: deep greens (#2D5A27) and bark browns (#8B6B3D) |
| C-24 | PASS | Coins: 1-1=15, 1-2=20, 1-3=25; health pickups in each stage |
| C-25 | PASS | Widths 85/125/155 (all distinct, none=140 old test level) |
| C-26 | PASS | Exit zone triggers STAGE_COMPLETE, save data updated |
| C-27 | PASS | Enemies per stage: 1-1=5, 1-2=7, 1-3=8 (all >= 3) |
| C-28 | PASS | Camera locks (arenaLock=true) during boss fight |
| C-29 | PASS | Save records completedStages, bestTimes, coinRecords |
| C-30 | PASS | Walk, jump, attack all function correctly |
| C-31 | PASS | TITLE->WORLD_MAP->STAGE->PAUSED->STAGE transitions work |
| C-32 | PASS | World map navigation, node properties, info panel all functional |

## Architecture Notes

- Enemy/Boss system is designed for extensibility: adding new enemy types requires only a new entry in `_updateEnemy()` switch + render method + spawn config
- Boss types follow a consistent pattern: intro -> attack cycle -> vulnerable window -> repeat; new bosses just need specific attack/render implementations
- Level data is keyed by stageId string (e.g., '1-1'), making it straightforward to add World 2-4 stages
- Projectile system is generic: any entity can spawn projectiles with configurable speed, size, damage, and lifetime
- Crumbling tiles use a separate tracking array (`Level.crumblingTiles`) to avoid per-frame grid scanning
