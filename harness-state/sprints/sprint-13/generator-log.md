# Sprint 13: Playability Validator — Path Validation Engine

## Summary
Implemented a BFS-based playability validator that tests all 13 stages for traversability from spawn to boss trigger zone. Added a debug overlay accessible via "D" on the title screen and a programmatic API via `window.runPlayabilityCheck()`.

## Implementation Details

### New File: `src/validator.js` (800 lines)
The `PlayabilityValidator` object provides:

1. **BFS Pathfinding Engine**: Grid-based BFS that simulates player movement capabilities:
   - Walk left/right with fall detection
   - Jump: 4 tiles vertical (128px), 6 tiles horizontal reach
   - Wall-jump: 3 tiles horizontal (96px), 3 tiles vertical
   - Bounce pads: 7 tiles vertical reach
   - Ladder climbing (up/down with exit at top)
   - Moving platform support (adds virtual standable positions)
   - Chain swing point support (adds reachable positions in arc)
   - Wall-slide to wall-jump transitions

2. **Tile Classification**: Correctly handles all tile types:
   - Support tiles (standable): SOLID, ONE_WAY, BREAKABLE, CRUMBLE, ICE, GATE, BOUNCE
   - Passable tiles (player body): EMPTY, LADDER, BOUNCE, WATER, ONE_WAY, etc.
   - Solid/blocking tiles: SOLID, BREAKABLE, ICE, GATE

3. **Debug Overlay UI**: Full-screen overlay following design spec:
   - Deep Charcoal background (rgba 26,26,46 at 92% opacity)
   - Muted Gold border and accents
   - Soft Cream text for labels
   - Moss Green badges for PASS, Ember Red for FAIL
   - Steel Blue for secondary text and details
   - Scrollable results list (arrow keys)
   - Summary line with pass/fail counts
   - Footer with key hints

4. **API**: `window.runPlayabilityCheck()` returns JSON report:
   ```json
   {
     "timestamp": "ISO-8601",
     "validator": "PlayabilityValidator v1.0",
     "stageCount": 13,
     "passCount": 13,
     "failCount": 0,
     "allPass": true,
     "stages": [
       {
         "stageId": "1-1",
         "name": "Canopy Trail",
         "pathResult": "PASS",
         "details": "Path found from spawn (2,15) to boss arena (col 65). 121 positions reachable."
       }
     ]
   }
   ```

### Modified Files
- **`index.html`**: Added `<script src="src/validator.js">` and `window.PlayabilityValidator` exposure
- **`src/states.js`**: Added DEBUG state constant, `_updateDebug()`, `_renderDebug()`, "D" key handler on title screen

## Test Results
- All 13 stages PASS path validation
- All 20 contract criteria verified
- All 36 existing regression tests pass (0 failures)
- FPS remains at 77-79fps during gameplay (well above 55fps threshold)
- No console errors

## Criteria Mapping
| Criterion | Status | Notes |
|-----------|--------|-------|
| C-01 | PASS | window.runPlayabilityCheck() is callable |
| C-02 | PASS | Returns report with 13 stage entries |
| C-03 | PASS | Each result has stageId, name, pathResult, details |
| C-04 | PASS | JUMP_HEIGHT = 4 tiles |
| C-05 | PASS | WALL_JUMP_REACH_H = 3 tiles |
| C-06 | PASS | Validates spawn-to-boss-trigger paths |
| C-07 | PASS | ONE_WAY platforms in isSupport() |
| C-08 | PASS | LADDER tiles with climb logic |
| C-09 | PASS | BOUNCE pads with increased jump height (7 tiles) |
| C-10 | PASS | CRUMBLE tiles in isSupport() |
| C-11 | PASS | "D" key opens DEBUG state + overlay |
| C-12 | PASS | 13 stages shown with results |
| C-13 | PASS | Arrow keys scroll results |
| C-14 | PASS | Design spec colors used throughout |
| C-15 | PASS | Moss Green (#5A9E6F) for PASS, Ember Red (#D94F4F) for FAIL |
| C-16 | PASS | Script tag in index.html before game.js |
| C-17 | PASS | failCoords with lastReachableCol/targetCol on FAIL |
| C-18 | PASS | Escape/D closes overlay, returns to TITLE |
| C-19 | PASS | Title screen navigation unaffected |
| C-20 | PASS | FPS >= 77 during gameplay |
