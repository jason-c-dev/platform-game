# Sprint 04: World Map & Progression — Generator Log

## Summary
Implemented the world map hub, collectible system, and save/load system. The title screen now transitions to WORLD_MAP instead of directly to STAGE. 13 stage nodes across 4 world clusters (Forest, Desert, Tundra, Volcano) plus a final Citadel node are displayed on a navigable top-down map. Coins and health pickups were added to stages. Progress persists to localStorage.

## New Files Created
- **src/save.js** — localStorage save/load system (completed stages, best times, coin records, lives)
- **src/collectibles.js** — Coin and health pickup entities with animation, collision, and collection logic
- **src/worldmap.js** — World map rendering, node layout, path drawing, info panel, navigation, unlock progression

## Modified Files
- **index.html** — Added script tags for save.js, collectibles.js, worldmap.js
- **src/constants.js** — Added Desert, Tundra, Volcano, and Power Star color palettes
- **src/states.js** — Added WORLD_MAP state, integrated collectibles into STAGE update/render, updated setupStageComplete to record save data
- **src/menu.js** — Title screen now shows Continue/New Game/Controls with save-aware logic; New Game confirmation dialog; Pause menu adds "Return to World Map" option; Stage complete returns to WORLD_MAP
- **src/game.js** — Extended debug API with unlockAllStages, getSelectedNode, setSaveData, clearSaveData, setSelectedNode, getWorldMapNodes
- **src/level.js** — Added coinPositions and healthPositions arrays to test level
- **src/particles.js** — Added spawnCoinCollect and spawnHealthCollect particle effects

## Criteria Verification

| ID | Status | Notes |
|----|--------|-------|
| C-01 | PASS | WORLD_MAP state in state machine; Title Enter → WORLD_MAP |
| C-02 | PASS | 13 nodes in 4 clusters + Citadel with paths |
| C-03 | PASS | Forest (#2D5A27), Desert (#C4943A), Tundra (#6B9CB8), Volcano (#8B2A1A) palettes |
| C-04 | PASS | Selected node has double-ring pulsing glow at 1.5Hz; locked nodes Steel Blue 50% opacity |
| C-05 | PASS | Arrow keys navigate unlocked nodes; locked nodes cannot be selected |
| C-06 | PASS | Enter on unlocked node → STAGE with correct stage name in HUD |
| C-07 | PASS | Info panel 260x160, bottom-right, Deep Charcoal bg, Muted Gold border, shows name/time/coins/stars |
| C-08 | PASS | Locked nodes show "LOCKED" in Steel Blue + "Complete [prev] to unlock" (debug API to set selection) |
| C-09 | PASS | Fresh game: only 1-1 unlocked, all others locked |
| C-10 | PASS | triggerStageComplete marks stage complete + unlocks next; world map reflects changes |
| C-11 | PASS | Pause menu: Resume, Restart Stage, Return to World Map, Quit to Title |
| C-12 | PASS | 15 coins in test level; disappear on contact; HUD counter increments |
| C-13 | PASS | Golden circles (#FFD700) with glint (#FFF8DC), bobbing + spin animation |
| C-14 | PASS | Green heart pickups with white cross; only collectible when HP < 3; visually distinct |
| C-15 | PASS | Stage complete screen shows "X / Y" coin format |
| C-16 | PASS | localStorage save with completedStages, coinRecords, bestTimes, lives |
| C-17 | PASS | Page reload preserves all completion state, unlocks, times, coins |
| C-18 | PASS | recordStageCompletion compares: lower time wins, higher coins wins |
| C-19 | PASS | Title shows Continue above New Game when save exists; no Continue without save |
| C-20 | PASS | New Game confirmation dialog (320x180, Yes/No); confirming clears localStorage |
| C-21 | PASS | Stage complete Continue → WORLD_MAP (not TITLE) |
| C-22 | PASS | Radial gradient background, subtle grid lines, twinkling stars |
| C-23 | PASS | setLineDash([8,6]) for locked paths, [] for unlocked; Warm Slate color |
| C-24 | PASS | Animated arrow + "Begin your journey" text at first node on fresh game |
| C-25 | PASS | Debug API: unlockAllStages, getSelectedNode, setSaveData, clearSaveData, setSelectedNode |
| C-26 | PASS | 3 new modular files: worldmap.js, collectibles.js, save.js loaded in index.html |
| C-27 | PASS | All Sprint 1-3 features verified: movement, combat, HUD, pause, transitions |
| C-28 | PASS | 960x540 canvas, 60 FPS, zero JS errors across all 7 states |

## Testing Approach
- Automated Playwright tests covering all state transitions (TITLE → CONTROLS → WORLD_MAP → STAGE → PAUSED → GAME_OVER → STAGE_COMPLETE and back)
- Programmatic verification of save/load, coin collection, health pickup, navigation
- Visual screenshot comparison for animations (pulse, coin spin/bob)
- Full regression of Sprint 1-3 features (physics, movement, combat, HUD, menus)
