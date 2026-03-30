# Sprint 1: Core Engine — Generator Log

## Summary
Implemented the complete core engine for "Kingdoms of the Canvas" platformer. All 28 contract criteria addressed with a working game that renders in-browser via HTML5 Canvas.

## Architecture
- **8 modular JS files**: constants, input, level, physics, camera, renderer, player, game
- **No external dependencies**: pure vanilla JavaScript + Canvas 2D API
- **Fixed-timestep game loop**: 60 updates/sec with accumulator pattern + requestAnimationFrame
- **Entity-system style**: Player is a data object, Physics/Renderer operate on it

## Key Files
| File | Purpose |
|------|---------|
| `index.html` | Entry point, canvas element, CSS scaling, module loading |
| `src/constants.js` | All game constants (tile IDs, physics values, colors from design spec) |
| `src/input.js` | Keyboard input with press-queue for reliable detection |
| `src/level.js` | Test level (120x20 tiles), tile data, moving platforms |
| `src/physics.js` | AABB collision, gravity, terminal velocity, one-way platforms |
| `src/camera.js` | Smooth follow, vertical dead zone, parallax layer generation |
| `src/renderer.js` | All drawing: parallax BG, tiles, moving platforms, player |
| `src/player.js` | Player entity with movement, jump, damage, respawn |
| `src/game.js` | Main game loop, debug API exposure |

## Criteria Self-Test Results

### Playwright-Tested (automated)
| ID | Criterion | Status |
|----|-----------|--------|
| C-01 | Canvas fills window | ✅ PASS |
| C-02 | 960x540 resolution | ✅ PASS |
| C-03 | 60 updates/sec | ✅ PASS |
| C-04 | No JS errors | ✅ PASS |
| C-09 | Gravity + landing | ✅ PASS |
| C-10 | AABB all directions | ✅ PASS (ceiling bonk, left wall, right stops) |
| C-12 | One-way platforms | ✅ PASS (jump through, land on top) |
| C-15 | Arrow key movement | ✅ PASS |
| C-16 | Jump (Z key) | ✅ PASS (no air-jump) |
| C-17 | Camera horizontal follow | ✅ PASS (237px movement) |
| C-20 | Camera clamp left | ✅ PASS (x >= 0) |
| C-21 | 60fps performance | ✅ PASS (60 FPS, max frame 16.8ms) |
| C-25 | Hazard damage | ✅ PASS (invincibility activated) |
| C-26 | Bounce pad higher than jump | ✅ PASS (peak y=330 vs normal y=409) |
| C-28 | Direction facing | ✅ PASS (facing flips on direction change) |

### Code-Review Criteria
| ID | Criterion | Status |
|----|-----------|--------|
| C-05 | 2D array, TILE_SIZE=32, 120 tiles wide | ✅ |
| C-06 | 5 tile types with distinct visuals | ✅ |
| C-07 | Viewport culling | ✅ |
| C-08 | Forest palette with texture | ✅ |
| C-11 | Terminal velocity = 12 | ✅ |
| C-13 | Moving platforms (3 defined: 2 horizontal, 1 vertical) | ✅ |
| C-14 | Ground/air physics differ | ✅ |
| C-18 | Vertical camera dead zone (25%/25%) | ✅ |
| C-19 | 4 parallax layers (speeds: 0.05, 0.15, 0.3, 0.5) | ✅ |
| C-22 | No external dependencies | ✅ |
| C-23 | 8 separate JS modules | ✅ |
| C-24 | All tile types + gaps in test level | ✅ |
| C-27 | Player drawn as character (head, body, limbs, #3A7BD5) | ✅ |

## Level Layout
The test level is organized as progressive sections from left to right:
- Cols 0: Left wall (horizontal collision test)
- Cols 5-9: One-way platforms (jump-through test)
- Cols 16-22: Ceiling blocks (ceiling bonk test)
- Cols 30-32: Hazard spikes (damage test)
- Cols 40-42: Breakable blocks
- Cols 50-51: Bounce pads (higher-than-jump test)
- Cols 60-64: More one-way platforms
- Cols 70: Additional bounce pad
- Cols 78-80: More hazards
- Cols 88-90: Gap #1 (jump required)
- Cols 95-105: Elevated terrain
- Cols 108-109: Gap #2
- Col 115: Right wall

## Design Spec Compliance
- **Colors**: Forest palette (#2D5A27, #4A8C3F, #8B6B3D, #1A3A15, #C8E6A0) used throughout
- **Player**: #3A7BD5 blue body, #E8DCC8 face/hands
- **Hazards**: #FF4444 red spikes
- **Typography**: Not heavily used in Sprint 1 (no HUD yet), but drawText utility ready
- **Spacing**: Tile grid at 32px, HUD inset at 16px (ready for Sprint 3)

## Commits
1. `7c8efbc` — Initial implementation of all 8 modules
2. `c03502f` — Improved input, debug API, moving platforms, level layout
3. `dbfc79d` — Final level layout with progressive test sections
4. `[gitignore fix]` — Removed accidental node_modules

## Notes for Sprint 2
- Player movement vocabulary is minimal (walk + jump only) — Sprint 2 adds wall slide, wall jump, coyote time, variable jump, crouch, combat
- Animation is basic frame-based — Sprint 2 adds full animation state machine
- No HUD or game state machine yet — Sprint 3
- Moving platforms functional but may need polish for feel — Sprint 2's physics improvements will help
