# Sprint 14: Arena Validation & Difficulty Parameter Checks

## Summary
Extended the PlayabilityValidator (from Sprint 13) with boss arena enclosure validation and difficulty parameter compliance checks. All new code is self-contained in `src/validator.js` — no changes to any gameplay files.

## What Was Implemented

### Arena Validation (C-01 to C-06)
- **`_findArenaBounds()`**: Detects arena boundaries by scanning from `bossArenaX` for solid walls, ceiling, and floor
- **`_checkArenaEnclosure()`**: Checks all 4 walls (top, bottom, left, right) are solid, excluding the entry point gap in the left wall. Uses percentage thresholds to handle partial walls.
- **`_checkArenaMinWidth()`**: Measures arena width (right - left + 1) and checks >= 15 tiles
- **`_checkArenaPlatforms()`**: Scans interior rows for contiguous standable tile runs (TILE_SOLID, TILE_ONE_WAY, TILE_ICE with passable space above), counts distinct platforms, requires >= 2
- **`_checkArenaEntry()`**: Finds entry gap in left wall, verifies solid ground beneath it for walkable ground-level entry

### Difficulty Parameter Validation (C-07 to C-16)
- **`DIFFICULTY_TABLE` constant**: Per-world expected values for all difficulty parameters
- **`BOSS_VULN_FRAMES`**: Boss vulnerability durations (phase 1, in frames) sourced from enemies.js
- **`_checkVulnerabilityWindow()`**: Compares boss vulnerability frames against per-world expected values
- **`_checkBossHP()`**: Reads actual boss maxHealth by temporarily spawning via `Enemies.spawnBoss()`, saves/restores all state (enemies array, boss ref, HUD state, AudioManager mute). Falls back to local BOSS_CONFIGS mirror if Enemies unavailable.
- **`_checkEnemyDensity()`**: Uses 30-tile (960px) sliding window across all enemy spawn positions, reports max enemies visible in any single screen
- **`_checkHazardPercentage()`**: Counts TILE_HAZARD and TILE_LAVA tiles divided by total non-empty tiles * 100
- **`_checkMinPlatformWidth()`**: Scans all rows for contiguous horizontal runs of standable tiles (TILE_SOLID, TILE_ONE_WAY, TILE_ICE) with passable space above, reports the narrowest

### Report Structure (C-17 to C-20)
- Each stage result now has: `pathResult`, `arenaResult`, `difficultyResult`
- `arenaResult` contains 4 sub-checks: `enclosure`, `minWidth`, `platforms`, `entry`
- `difficultyResult` contains 5 sub-checks: `vulnerabilityWindow`, `bossHP`, `enemyDensity`, `hazardPercentage`, `minPlatformWidth`
- Each sub-check has `result` ('PASS'/'FAIL') and `details` string
- Top-level report has `passCount`, `failCount`, `totalChecks` across ALL categories
- Added `categoryCounts` with per-category (path/arena/difficulty) pass/fail breakdowns

### Debug Overlay (C-21 to C-24)
- Redesigned overlay layout: 3 lines per stage (header+path, arena, difficulty)
- Arena results shown as 4 labeled mini-badges: ENC, WID, PLT, ENT with colored indicators
- Difficulty results shown as 5 labeled mini-badges: VUL, HP, DEN, HAZ, PLW with colored indicators
- All PASS badges use Moss Green (`#5A9E6F`), all FAIL use Ember Red (`#D94F4F`)
- Summary line shows total pass/fail/checks across ALL categories
- Category breakdown line shows per-category pass ratios

### Regression (C-25 to C-30)
- BFS path validation from Sprint 13 unchanged and still operational
- All 13 stages validated (1-1 through 5-1)
- No changes to gameplay files (player.js, physics.js, enemies.js, level.js)
- Debug overlay still opens with D and closes with Escape
- All changes contained in src/validator.js

## Expected Validator Behavior
Per the contract notes, the validator is expected to report FAIL for some checks. This is correct behavior — it indicates issues that Sprint 15 and 16 will address:
- Some bosses have vulnerability windows shorter than their world's expected value
- Hydra Cactus (12 HP) and Crystal Witch (25 HP) exceed their world's HP ranges
- Some arenas may lack explicit left walls in static tile data (game places walls at runtime during boss trigger)
- Some stages may have narrower platforms or higher hazard density than their world allows

## Commits
1. `e2bdd73` — Main implementation: arena validation, difficulty checks, report structure, debug overlay
2. `02ecb08` — Fix C-10: read boss HP from actual game data via Enemies.spawnBoss
3. `8e069ae` — Robust temp-spawn with full state save/restore (Enemies.boss, HUD, AudioManager)
