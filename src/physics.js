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

    applyMovement(entity, inputDir) {
        const accel = entity.onGround ? GROUND_ACCELERATION : AIR_ACCELERATION;
        const friction = entity.onGround ? GROUND_FRICTION : AIR_DRAG;

        if (inputDir !== 0) {
            entity.vx += inputDir * accel;
        }

        entity.vx *= friction;

        // Clamp small velocities to zero
        if (Math.abs(entity.vx) < 0.1) {
            entity.vx = 0;
        }

        // Max horizontal speed
        const maxSpeed = 5;
        if (entity.vx > maxSpeed) entity.vx = maxSpeed;
        if (entity.vx < -maxSpeed) entity.vx = -maxSpeed;
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
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
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
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
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
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
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
                if (tile === TILE_SOLID || tile === TILE_BREAKABLE) {
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
        if (entity.vy < 0) return null; // Only land when falling

        for (const mp of Level.movingPlatforms) {
            // Check if entity's bottom is near the top of the platform
            const entityBottom = entity.y + entity.height;
            const entityRight = entity.x + entity.width;
            const mpRight = mp.x + mp.width;
            const mpBottom = mp.y + mp.height;

            // Horizontal overlap
            if (entityRight > mp.x && entity.x < mpRight) {
                // Vertical: entity bottom within platform top region
                if (entityBottom >= mp.y && entityBottom <= mpBottom + entity.vy + 2) {
                    // Was entity's previous bottom above platform top?
                    const prevBottom = entityBottom - entity.vy;
                    if (prevBottom <= mp.y + 4) {
                        entity.y = mp.y - entity.height;
                        entity.vy = 0;
                        return mp;
                    }
                }
            }
        }
        return null;
    }
};
