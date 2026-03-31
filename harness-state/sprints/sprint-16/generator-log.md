# Sprint 16: Generator Log

## Overview
Sprint 16 — "Enemy & Hazard Rebalancing + Full Validation Pass" — is the final sprint. The goal was to modify level data (enemy spawns, hazard tiles, platform widths) in `level.js` to bring all 13 stages into compliance with difficulty parameters, achieving 0 failures across ALL 130 checks when `window.runPlayabilityCheck()` runs.

## Work Completed

### Enemy Density Fixes (C-01 through C-06)
Reduced enemy spawn counts in stages that exceeded per-world density limits:
- **Stage 1-1**: 5 enemies -> 3 (removed cols 40, 80 shroombas)
- **Stage 1-2**: 7 enemies -> 5 (removed 2 barkbeetles)
- **Stage 1-3**: 8 enemies -> 4 (removed 4 enemies to stay under 2/screen)
- **Stage 2-1**: 7 enemies -> 6 (removed col 73 dust_devil)

### Hazard Percentage (C-07 through C-11)
All 13 stages were already within their per-world hazard percentage limits. No changes needed.

### Platform Width Fixes (C-12 through C-15)
This was the most complex category. The validator scans ALL rows for the narrowest contiguous run of standable tiles (SOLID/ONE_WAY/ICE with passable space above). Several stages had subsurface narrow platforms created by passable tiles (bounce pads, quicksand) embedded in multi-tile-thick solid ground.

**Stage 1-1** (need >= 3): Single bounce pads at row 17 (cols 26, 30, 34) created 1-tile passable gaps in solid ground, making row 18 below them have isolated 1-tile standable platforms.
- Fix: Widened bounce pads from 1-tile to 3-tile wide (cols 25-27, 31-33). Removed 3rd bounce pad. Row 18 now has 3-tile standable runs under each bounce area, and row 17's standable runs between bounces are still >= 3.

**Stage 1-3** (need >= 3): Same pattern — single bounce pads at row 18 in ground islands created 1-tile platforms on row 19.
- Fix: Widened ground islands (69-77 and 79-88) and bounce pads to 3-tile wide (72-74, 83-85). Each island now has >= 3 standable tiles on both sides of the bounce area.

**Stage 2-1** (need >= 2): Stepped quicksand pits created 1-tile solid edges at each depth level. Three pits affected (cols 13-17, 37-42, 69-78).
- Fix: Made all quicksand pits rectangular (same width at all depths) instead of stepped. Eliminates isolated edge tiles entirely.

**Stage 2-2** (need >= 2): Same stepped quicksand pattern at cols 93-97.
- Fix: Extended quicksand to same width at row 20, making pit rectangular.

**Other stages already passing**: 2-3 (oasis pool already made rectangular in earlier commit), 3-1, 3-2, 3-3 (wall caps widened in earlier commit).

### Mechanics Gating (C-16, C-17, C-18)
Verified by code review:
- C-16: World 1 uses only walk/jump/attack. No water or ice tiles. Wall-jump introduced in 1-2.
- C-17: Water tiles only appear in `_buildStage2_3()` (Oasis Mirage). No water before 2-3.
- C-18: Ice tiles only appear in `_buildStage3_1()` (Frozen Lake) and later. No ice before 3-1.

### Implementation Verification (C-24, C-25, C-26)
- `validator.js` was NOT modified in this sprint (git diff confirms zero changes).
- All fixes were done by modifying level data in `level.js` only.

### Regression (C-27, C-28, C-29, C-30)
- C-27: All 13 vulnerability window checks PASS
- C-28: All 13 boss HP checks PASS
- C-29: FPS measured at 80-82fps (threshold >= 55)
- C-30: Debug overlay code unchanged from Sprint 15

## Final Validation Result
```
Aggregate: 130 pass, 0 fail, 130 total, allPass=true
```
All 13 stages x 10 checks = 130/130 PASS.

## Commits
1. `89beda5` - Initial enemy density fixes and platform width changes
2. `b31d7a7` - Fix remaining platform widths in 1-1, 2-3, 3-1
3. `244120c` - Fix all 4 remaining minPlatformWidth failures (bounce pads + quicksand)

## Key Insight
The most subtle issue was that the validator checks platform widths on ALL rows, including subsurface rows. When a passable tile (bounce pad or quicksand) was embedded in thick solid ground, it created an isolated "passable gap" in the row above the subsurface tiles. This made the subsurface solid tiles below the gap register as 1-tile standable platforms — even though they're underground and not actual gameplay surfaces. The fix was to ensure any passable gaps in solid ground are at least as wide as the minimum platform width for that world.
