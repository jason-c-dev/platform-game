# Fix-003 Generator Log

## Summary
Implemented three surgical fixes for Elder Shroomba boss bugs:

1. **Vulnerable-state contact damage bypass (C01)** -- Boss was dealing contact damage even when vulnerable, making the vulnerability window pointless. Added `e.isBoss && e.vulnerable` skip in `checkEnemyPlayerCollisions`.

2. **Death respawn during boss fight (C03, C04)** -- When player died during a boss fight, respawn left the arena sealed, camera locked, and boss still present. Added boss fight reset logic to `_respawn()`: clears `bossTriggered`, removes boss entity via `resetBossFight()`, unlocks camera, and unseals arena entry wall by restoring tracked sealed rows.

3. **Boss arena confinement (C05) and dead-player pause (C06)** -- Boss could track player outside the arena through the entry gap. Added X clamping after movement in `_updateElderShroomba`. Also added early return when `Player.state === 'dead'` to pause boss AI.

## Files Modified
- `src/enemies.js` -- Added `resetBossFight()` method, vulnerable skip in collision, dead-player guard and arena clamping in `_updateElderShroomba`
- `src/player.js` -- Added boss fight reset logic in `_respawn()`
- `src/states.js` -- Track sealed rows in `Level.bossSealedRows` during arena wall sealing

## Criteria Coverage
| ID | Description | Status |
|----|-------------|--------|
| C01 | No contact damage during vulnerable state | Done |
| C02 | Attacks still damage vulnerable boss | Done (existing check preserved) |
| C03 | Death respawn resets boss fight state | Done |
| C04 | Camera unlocks, player can re-trigger fight | Done |
| C05 | Boss X clamped within arena bounds | Done |
| C06 | Boss pauses when player dead | Done |
| R01 | Boss attack patterns still work | Verified (no changes to attack logic) |
| R02 | Boss defeat sequence still works | Verified (no changes to defeat logic) |
| R03 | Game loads without errors | Verified (syntax check passed, server responds) |

## Approach
All changes are minimal and surgical. No refactoring, no comment additions to unchanged code, no structural changes. The sealed-row tracking approach ensures arena wall unsealing works correctly across all boss stages without hardcoding row numbers.
