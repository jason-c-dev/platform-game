// ============================================================
// constants.js — Global constants for Kingdoms of the Canvas
// ============================================================

// Canvas
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Tiles
const TILE_SIZE = 32;

// Tile type IDs
const TILE_EMPTY = 0;
const TILE_SOLID = 1;
const TILE_ONE_WAY = 2;
const TILE_HAZARD = 3;
const TILE_BREAKABLE = 4;
const TILE_BOUNCE = 5;
const TILE_LADDER = 6;

// Physics
const GRAVITY = 0.55;
const TERMINAL_VELOCITY = 12;
const GROUND_ACCELERATION = 0.6;
const GROUND_FRICTION = 0.78;
const AIR_ACCELERATION = 0.35;
const AIR_DRAG = 0.92;
const JUMP_FORCE = -10.5;
const BOUNCE_FORCE = -15;

// Player dimensions
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;
const PLAYER_CROUCH_HEIGHT = 20;

// Player movement speeds
const WALK_MAX_SPEED = 5;
const RUN_MAX_SPEED = 8;

// Wall mechanics
const WALL_SLIDE_SPEED = 2;
const WALL_JUMP_VX = 7;
const WALL_JUMP_VY = -10;

// Crouch-slide
const CROUCH_SLIDE_FRICTION = 0.975;
const CROUCH_SLIDE_MIN_SPEED = 5;

// Variable jump & assist
const VARIABLE_JUMP_MULTIPLIER = 0.4;
const COYOTE_FRAMES = 6;       // ~100ms at 60fps
const JUMP_BUFFER_FRAMES = 8;  // ~133ms at 60fps

// Combat
const ATTACK_DURATION = 9;     // frames
const ATTACK_RANGE = 22;
const ATTACK_HEIGHT = 20;
const CHARGE_TIME = 60;        // frames (1 second)
const CHARGE_ATTACK_RANGE = 32;
const CHARGE_ATTACK_HEIGHT = 28;
const JUMP_ATTACK_WIDTH = 16;
const JUMP_ATTACK_HEIGHT = 20;
const JUMP_ATTACK_BOUNCE = -10;

// Health & combat feedback
const PLAYER_MAX_HP = 3;
const PLAYER_START_LIVES = 5;
const INVINCIBILITY_TIME = 1.5; // seconds
const HURT_KNOCKBACK_VX = 4;
const HURT_KNOCKBACK_VY = -7;
const HURT_DURATION = 20;       // frames
const RESPAWN_DELAY = 1.2;      // seconds

// Camera
const CAMERA_SMOOTH = 0.08;
const CAMERA_DEADZONE_TOP = 0.25;
const CAMERA_DEADZONE_BOTTOM = 0.25;

// Game loop
const FIXED_TIMESTEP = 1000 / 60; // ~16.67ms
const MAX_FRAME_SKIP = 5;

// Colors — Design Spec
const COLORS = {
    // UI Chrome
    deepCharcoal: '#1A1A2E',
    warmSlate: '#2D2D44',
    mutedGold: '#C4A35A',
    softCream: '#E8DCC8',
    emberRed: '#D94F4F',
    mossGreen: '#5A9E6F',
    steelBlue: '#6B8CAE',

    // Player
    playerBlue: '#3A7BD5',
    playerBlueDark: '#2A5BA5',
    playerSkin: '#E8DCC8',

    // Hazards
    hazardRed: '#FF4444',
    hazardLava: '#FF8800',

    // Collectibles
    coinGold: '#FFD700',
    coinGlint: '#FFF8DC',

    // Forest palette
    forest: {
        deepCanopy: '#2D5A27',
        leaf: '#4A8C3F',
        bark: '#8B6B3D',
        shadow: '#1A3A15',
        highlight: '#C8E6A0',
    }
};
