// ============================================================
// physics.js — Physics & Collision (AABB)
// ============================================================

const Physics = {

    /**
     * Apply gravity, acceleration, friction/drag, and resolve tile collisions.
     * Entity must have: x, y, vx, vy, width, height, onGround
     */
    applyGravity(entity) {
        entity.vy += GRAVITY;
        if (entity.vy > TERMINAL_VELOCITY) {
            entity.vy = TERMINAL_VELOCITY;
        }
    },

    applyMovement(entity, inputDir, maxSpeed) {
        const max = maxSpeed || WALK_MAX_SPEED;

        if (inputDir !== 0) {
            if (entity.onGround) {
                // Ground: approach-to-target model — player accelerates toward max speed
                const targetVx = inputDir * max;
                entity.vx += (targetVx - entity.vx) * GROUND_ACCELERATION * 0.2;
            } else {
                // Air: additive acceleration with drag — less control
                entity.vx += inputDir * AIR_ACCELERATION;
                entity.vx *= AIR_DRAG;
                // Clamp to max speed in air
                if (entity.vx > max) entity.vx = max;
                if (entity.vx < -max) entity.vx = -max;
            }
        } else {
            // No input: decelerate with friction
            entity.vx *= (entity.onGround ? GROUND_FRICTION : AIR_DRAG);
        }

        // Clamp small velocities to zero
        if (Math.abs(entity.vx) < 0.1) {
            entity.vx = 0;
        }
    },

    /**
     * Resolve collisions between entity and tile map.
     * Uses separate X and Y passes.
     * Returns collision info: { hitLeft, hitRight, hitTop, hitBottom, hazard, bounce }
     */
    resolveCollisions(entity) {
        const result = {
            hitLeft: false,
            hitRight: false,
            hitTop: false,
            hitBottom: false,
            hazard: false,
            bounce: false,
            onMovingPlatform: null
        };

        // --- X axis ---
        entity.x += entity.vx;
        const colInfo = this._checkTileCollisionsX(entity);
        if (colInfo.hitLeft) { result.hitLeft = true; }
        if (colInfo.hitRight) { result.hitRight = true; }

        // --- Y axis ---
        entity.y += entity.vy;
        const rowInfo = this._checkTileCollisionsY(entity);
        if (rowInfo.hitTop) { result.hitTop = true; }
        if (rowInfo.hitBottom) { result.hitBottom = true; }
        if (rowInfo.hazard) { result.hazard = true; }
        if (rowInfo.bounce) { result.bounce = true; }

        // Check moving platform collisions
        const mpResult = this._checkMovingPlatforms(entity);
        if (mpResult) {
            result.hitBottom = true;
            result.onMovingPlatform = mpResult;
        }

        entity.onGround = result.hitBottom;

        return result;
    },

    _checkTileCollisionsX(entity) {
        const result = { hitLeft: false, hitRight: false };
        const top = Math.floor(entity.y / TILE_SIZE);
        const bottom = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

        if (entity.vx > 0) {
            // Moving right — check right edge
            const rightCol = Math.floor((entity.x + entity.width) / TILE_SIZE);
            for (let row = top; row <= bottom; row++) {
                const tile = Level.getTile(rightCol, row);
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE || tile === TILE_GATE) {
                    entity.x = rightCol * TILE_SIZE - entity.width;
                    entity.vx = 0;
                    result.hitRight = true;
                    break;
                }
            }
        } else if (entity.vx < 0) {
            // Moving left — check left edge
            const leftCol = Math.floor(entity.x / TILE_SIZE);
            for (let row = top; row <= bottom; row++) {
                const tile = Level.getTile(leftCol, row);
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE || tile === TILE_GATE) {
                    entity.x = (leftCol + 1) * TILE_SIZE;
                    entity.vx = 0;
                    result.hitLeft = true;
                    break;
                }
            }
        }

        return result;
    },

    _checkTileCollisionsY(entity) {
        const result = { hitTop: false, hitBottom: false, hazard: false, bounce: false };
        const left = Math.floor(entity.x / TILE_SIZE);
        const right = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);

        if (entity.vy > 0) {
            // Falling — check bottom edge
            const bottomRow = Math.floor((entity.y + entity.height) / TILE_SIZE);
            for (let col = left; col <= right; col++) {
                const tile = Level.getTile(col, bottomRow);
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE || tile === TILE_GATE) {
                    entity.y = bottomRow * TILE_SIZE - entity.height;
                    entity.vy = 0;
                    result.hitBottom = true;
                    break;
                }
                if (tile === TILE_ONE_WAY) {
                    // One-way: only collide if entity's feet were above this tile last frame
                    const prevBottom = entity.y + entity.height - entity.vy;
                    if (prevBottom <= bottomRow * TILE_SIZE + 2) {
                        entity.y = bottomRow * TILE_SIZE - entity.height;
                        entity.vy = 0;
                        result.hitBottom = true;
                        break;
                    }
                }
                if (tile === TILE_HAZARD) {
                    result.hazard = true;
                }
                if (tile === TILE_BOUNCE) {
                    entity.y = bottomRow * TILE_SIZE - entity.height;
                    entity.vy = BOUNCE_FORCE;
                    result.bounce = true;
                    break;
                }
            }
        } else if (entity.vy < 0) {
            // Rising — check top edge
            const topRow = Math.floor(entity.y / TILE_SIZE);
            for (let col = left; col <= right; col++) {
                const tile = Level.getTile(col, topRow);
                // One-way platforms do NOT block from below
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE || tile === TILE_CRUMBLE || tile === TILE_GATE) {
                    entity.y = (topRow + 1) * TILE_SIZE;
                    entity.vy = 0;
                    result.hitTop = true;
                    break;
                }
            }
        }

        // Check hazards the entity might be overlapping (e.g. walked into spikes)
        for (let col = left; col <= right; col++) {
            const feetRow = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);
            const headRow = Math.floor(entity.y / TILE_SIZE);
            for (let row = headRow; row <= feetRow; row++) {
                if (Level.getTile(col, row) === TILE_HAZARD) {
                    result.hazard = true;
                }
            }
        }

        return result;
    },

    _checkMovingPlatforms(entity) {
        if (entity.vy < -1) return null; // Only land when falling or near-stationary

        for (const mp of Level.movingPlatforms) {
            const entityBottom = entity.y + entity.height;
            const entityRight = entity.x + entity.width;
            const mpRight = mp.x + mp.width;

            // Horizontal overlap check
            if (entityRight <= mp.x || entity.x >= mpRight) continue;

            // Check if entity bottom is near platform top
            // Allow tolerance for frame-to-frame landing
            const tolerance = Math.max(Math.abs(entity.vy), 4) + Math.abs(mp.y - mp.prevY) + 2;

            if (entityBottom >= mp.y - 2 && entityBottom <= mp.y + tolerance) {
                // Snap entity onto platform
                entity.y = mp.y - entity.height;
                entity.vy = 0;
                return mp;
            }
        }
        return null;
    },

    /**
     * Check if a rectangle overlaps any solid or breakable tile
     */
    checkRectOverlapsSolid(rx, ry, rw, rh) {
        const left = Math.floor(rx / TILE_SIZE);
        const right = Math.floor((rx + rw - 1) / TILE_SIZE);
        const top = Math.floor(ry / TILE_SIZE);
        const bottom = Math.floor((ry + rh - 1) / TILE_SIZE);
        for (let r = top; r <= bottom; r++) {
            for (let c = left; c <= right; c++) {
                const t = Level.getTile(c, r);
                if (t === TILE_SOLID || t === TILE_BREAKABLE) return true;
            }
        }
        return false;
    }
};
