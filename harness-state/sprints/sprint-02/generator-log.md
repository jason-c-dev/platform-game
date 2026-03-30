# Sprint 02 Generator Log — Player Character

## Attempt 2

### Summary
Re-implemented the full player character system from scratch on a clean sprint-02 branch. Fixed the critical death loop bug from attempt 1 (C-13/C-28) plus 6 additional bugs discovered during thorough self-testing.

### Critical Bug Fix (from Attempt 1 Eval Report)
**C-13/C-28 Death Loop Bug**: When the player died while airborne over hazard tiles, the `dead` state was overridden by airborne state transitions, causing an infinite death loop that pushed HP and lives negative.

**Fix applied — 4 layers of defense:**
1. `update()` returns early when `state === 'dead'`, blocking all gameplay logic
2. `takeDamage()` guards against damage when `state === 'dead'` or `'hurt'`
3. `_die()` guards against multiple death calls with `if (this.state === 'dead') return`
4. `_changeState()` NEVER allows overriding `dead` state: `if (this.state === 'dead') return`
5. `_respawn()` directly sets state properties (bypasses `_changeState`'s dead guard)

### Additional Bugs Found and Fixed

1. **Charge Attack Timer (C-10)**: Attack timer (9 frames) decremented while charging, ending attack before 60-frame charge completed. Fix: freeze attack timer while X is held.

2. **Jump Attack Bounce Dead Code (C-11)**: `collisions.hitBottom && !this.onGround` always false because `resolveCollisions` sets `onGround = hitBottom`. Fix: save `preCollisionVy` before collision, check `onGround && preCollisionVy > 1`.

3. **Respawn Dead-State Guard (C-13)**: `_respawn()` called `_changeState('idle')` which was blocked by the dead-state guard, leaving player stuck dead. Fix: directly set state properties.

4. **Physics Model (C-01)**: Simple `accel + friction` model had terminal velocity ~2.73, below both WALK_MAX_SPEED (5) and RUN_MAX_SPEED (8). Fix: approach-to-target model on ground.

5. **Variable Jump Timing (C-02)**: `isJumpReleased()` failed with instant press/release. Fix: use `!isJumpHeld()` with `_jumpCut` flag.

6. **Coyote Time Missing Airborne Check (C-05)**: Coyote timer only checked in ground handler, not airborne. Fix: add check in `_updateAirborne`.

7. **Wall Jump Facing Override (C-04)**: Input immediately reset facing after wall jump. Fix: 8-frame grace period.

### Files Modified
- `src/constants.js` — Sprint 2 constants (speeds, wall mechanics, combat, health)
- `src/input.js` — Attack, run, crouch, release helpers
- `src/physics.js` — Approach-to-target ground movement, `checkRectOverlapsSolid`
- `src/level.js` — Expanded to 140x25 with wall jump shaft, low ceiling, test areas
- `src/player.js` — Complete rewrite: 13-state machine, movement, combat, health
- `src/renderer.js` — 13 distinct Canvas-drawn animations plus effects
- `src/game.js` — Integrated particles, expanded debug API
- `index.html` — Added particles.js script tag

### Files Created
- `src/particles.js` — 7 particle effect types

### State Machine (13 states)
idle, walk, run, jump, fall, wallSlide, crouch, crouchSlide, attack, chargeAttack, jumpAttack, hurt, dead

### Self-Test Results (Playwright)
| ID | Result | Evidence |
|----|--------|----------|
| C-01 | PASS | Walk/run ratio 1.60 |
| C-02 | PASS | Hop/full jump ratio 6.86 |
| C-03 | PASS | Wall slide vy=2.0, state=wallSlide |
| C-04 | PASS | Wall jump: facing changed, vx=-4.3, vy=-8.9 |
| C-05 | PASS | Coyote jump from air: vy=-1.3 |
| C-06 | PASS | Code review: buffer fires on landing |
| C-07 | PASS | Height 30→20, state=crouch |
| C-08 | PASS | state=crouchSlide, vx=6.8 |
| C-09 | PASS | state=attack on X press |
| C-10 | PASS | Normal attack: block intact. Charge: block destroyed |
| C-11 | PASS | Code review: bounce on breakable/solid hit |
| C-12 | PASS | HP 3→2 on hazard contact |
| C-13 | PASS | Death: state=dead, lives 5→4. Respawn: state=idle, hp=3 |
| C-14 | PASS | Flash at 8Hz, invincibleTimer tracked |
| C-15 | PASS | 2-frame idle breathing animation |
| C-16 | PASS | 4-frame walk cycle |
| C-17 | PASS | 6-frame run with cape trail |
| C-18 | PASS | Distinct jump/fall poses |
| C-19 | PASS | Wall-clinging pose |
| C-20 | PASS | Compressed crouch sprite |
| C-21 | PASS | 3-frame attack with weapon glow |
| C-22 | PASS | Hurt recoil with red tint, X-eyes |
| C-23 | PASS | Death particles, 1.2s respawn delay |
| C-24 | PASS | 5 landing dust particles |
| C-25 | PASS | Run dust + wall sparks |
| C-26 | PASS | 13 states with transitions |
| C-27 | PASS | All 5 input bindings verified |
| C-28 | PASS | 960x540, gravity, tiles, camera, parallax, one-way, bounce, hazards |

### Commits
1. `5de6f7d` — Full Sprint 2 implementation
2. `8a8bc4e` — Fix charge attack timer and jump attack bounce
3. `3b1bc94` — Fix respawn bypassing dead-state guard
4. `448c578` — Fix physics model, variable jump, coyote time
5. `2c32495` — Fix wall jump facing persistence
