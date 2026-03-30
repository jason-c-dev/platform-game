# Sprint 03: Game Structure & UI — Generator Log

## Summary
Implemented the full game structure layer: state machine, title screen, controls screen, pause menu, HUD, game over screen, stage complete screen, and iris-wipe transitions. All 28 criteria addressed.

## Files Created
- `src/states.js` — Game state machine (TITLE, CONTROLS, STAGE, PAUSED, GAME_OVER, STAGE_COMPLETE)
- `src/transition.js` — Iris-wipe screen transition (250ms close + 250ms open, ease-in/ease-out)
- `src/hud.js` — HUD rendering (health hearts, coin counter, stage name, boss health bar)
- `src/menu.js` — Menu screens (title, controls, pause, game over, stage complete)

## Files Modified
- `src/game.js` — Refactored to delegate all update/render to state machine; added gameState to debug API
- `src/input.js` — Added 'c'/'C' to prevented keys list
- `index.html` — Added script tags for new modules in correct load order

## Design Spec Compliance
All UI follows the design specification exactly:
- **Colors**: Deep Charcoal (#1A1A2E) backgrounds, Warm Slate (#2D2D44) panels, Muted Gold (#C4A35A) accents, Soft Cream (#E8DCC8) text, Ember Red (#D94F4F) hearts, Steel Blue (#6B8CAE) empty hearts
- **Typography**: 48px bold sans-serif for titles, 22px for menu options, 18px bold for stage names, 16px mono for HUD numbers, 14px for info text
- **Spacing**: 4px base unit, 16px HUD inset, 8px padding inside elements, 4px heart gaps
- **Components**: Heart shapes via bezierCurveTo, gold coin circles, menu buttons with selection triangles, round-rect panels
- **Text rendering**: All text has 2px dark outline (stroke before fill)
- **Transitions**: 500ms iris-wipe with even-odd clipping

## Criteria Coverage

### State Machine (C-01, C-24)
- 6 states: TITLE, CONTROLS, STAGE, PAUSED, GAME_OVER, STAGE_COMPLETE
- Central `GameState.current` drives update/render dispatch
- Clean `transitionTo()` and `changeTo()` functions
- Debug API exposes `gameState`, `currentState`, `state` getters

### Title Screen (C-02, C-03, C-04, C-05, C-06)
- "KINGDOMS OF THE CANVAS" in 48px bold gold
- "Press Enter to Start" with pulsing opacity + scale animation
- Animated scrolling background with starfield, mountains, tree line, floating particles
- Enter starts gameplay with iris-wipe transition
- "Press C for Controls" hint visible

### Controls Screen (C-06, C-07)
- Shows all bindings: Arrow Keys, Arrow Up, Arrow Down, Z, X, Shift, Escape, Enter
- Dismissible with Escape or Enter, returns to fully functional title

### Pause Menu (C-08, C-09, C-10, C-11, C-12, C-13)
- Escape toggles pause; dark overlay freezes gameplay
- 3 options: Resume, Restart Stage, Quit to Title
- Arrow Up/Down navigation with gold selection triangle indicator
- Enter activates selected option
- Resume resumes gameplay; Restart resets level/player/HP; Quit returns to title

### HUD (C-14, C-15, C-16, C-17, C-25)
- Health hearts: 24x24 bezier-curve hearts, Ember Red filled, Steel Blue empty outlines, pulse on change
- Coin counter: gold circle icon + "× 000" in mono, top-center
- Stage name: "Test Stage" in bold 18px, top-right
- All elements on semi-transparent dark background panels (rgba deepCharcoal 0.75)
- Boss health bar: 320x12 at bottom-center, conditional on `bossActive`, gradient fill, smooth lerp, boss name label

### Game Over (C-18, C-19, C-20)
- Shows on player death with 0 lives (natural + debug API trigger)
- "GAME OVER" in 48px Ember Red
- Continue: restarts stage with full HP (3) and refreshed lives (5)
- Quit to Title: returns to fully functional title screen

### Stage Complete (C-21)
- Triggerable via debug API (`triggerStageComplete`)
- Shows elapsed time (MM:SS format) and coins collected
- "Well done, adventurer!" congratulatory message
- "Press Enter to Continue" proceeds to title

### Transitions (C-22, C-23)
- Iris-wipe: circular mask shrinks to black (ease-in), holds 1 frame, expands on new scene (ease-out)
- State change at midpoint when screen is fully black
- Input blocked during transition via `transitioning` flag
- Centered on player position in gameplay, canvas center otherwise

### Regression (C-27, C-28)
- All Sprint 1 & 2 mechanics work within STAGE state
- Walk, run, jump, wall slide, crouch, attack all confirmed
- Hazard damage, invincibility, parallax, camera follow all working
- 960x540 canvas, 60 FPS, zero JS errors

## Bug Fixed
- Camera.init() was missing from setupStage/restartStage, causing parallax layer access crash

## Testing
- Automated Playwright tests cover all state transitions, HUD updates, input handling
- Extended play test: 8+ seconds of gameplay at 60 FPS with zero errors
- Full flow verified: Title → Controls → Title → Stage → Pause → Resume → Pause → Restart → Pause → Quit → Title → Stage → Game Over → Continue → Game Over → Quit → Title → Stage → Stage Complete → Title
