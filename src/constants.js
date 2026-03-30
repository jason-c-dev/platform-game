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

// Player
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 30;

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
