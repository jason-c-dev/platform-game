# Product Specification: Kingdoms of the Canvas

## Product Overview

Kingdoms of the Canvas is a fully browser-based 2D side-scrolling platformer built entirely with vanilla JavaScript and HTML5 Canvas — no game engine libraries, no external assets, no server component. Every sprite, tile, background, and sound is generated programmatically through Canvas drawing commands and the Web Audio API. The game delivers a complete, polished platforming experience across 4 themed worlds with 12 stages, 13 unique boss fights, puzzles, collectibles, and a climactic final confrontation — all running at 60fps in a single browser tab.

This project is for players who love tight, responsive platformers in the tradition of Super Mario and Celeste, and for developers who appreciate the technical feat of a zero-dependency game. The game proves that the modern browser is a legitimate game platform, capable of delivering real game feel — coyote time, jump buffering, wall slides, screen shake, particle effects — without a single external file.

The core design philosophy is "depth through constraint." By eliminating external assets, every visual and audio element must be deliberately crafted in code. This produces a distinctive aesthetic — geometric, bold, procedural — that sets the game apart from sprite-sheet platformers. Every boss has unique mechanics with exact hit counts and timing windows. Every stage introduces new gameplay elements. Every world has its own physics quirks, enemy behaviors, and visual identity.

## Target Users

### Player 1: The Casual Platformer Fan
**Goals**: Pick up and play a fun platformer without installing anything. Enjoy a complete game with progression, variety, and satisfying mechanics.
**Pain Points**: Most browser games feel incomplete or janky. Wants real game feel — not a tech demo.

### Player 2: The Completionist
**Goals**: Collect every coin, find every Power Star, beat every stage with the best time. Wants the world map to reflect their mastery.
**Pain Points**: Games that don't track or reward thorough exploration. Needs clear feedback on what's been found and what's missing.

### Player 3: The Developer/Tinkerer
**Goals**: Study how a complete game is built with zero dependencies. Understand game loop architecture, physics, procedural audio, and Canvas rendering.
**Pain Points**: Most game tutorials only cover basics. Wants to see a real, complete game with bosses, state machines, and polish.

---

## Feature Specification

### Priority 1: Core Engine (Must Have)

#### F1: Game Loop & Renderer
Fixed-timestep game loop running at 60 updates/second with delta-time interpolation for smooth rendering. HTML5 Canvas at 960x540 logical pixels, scaled to fit the browser window while preserving aspect ratio.
- **Why**: The foundation everything else depends on. Without a rock-solid loop, nothing works.
- **Interactions**: Drives all updates and renders. All game systems hook into this loop.
- **Dependencies**: None — this is the foundation.

#### F2: Tile System & Level Data
Levels defined as 2D arrays of tile IDs with 32x32 pixel tiles. Tile types include solid, one-way platform, hazard (spikes/lava), breakable block, bounce pad, and ladder. Each world theme has a distinct tile palette with different colors and patterns.
- **Why**: Platformers are built on tiles. The tile system defines the game world.
- **Interactions**: Collision system reads tile data. Renderer draws visible tiles. Level data is defined in code as JSON-like arrays.
- **Dependencies**: F1 (renderer).

#### F3: Physics & Collision
AABB collision detection against the tile map. Gravity with terminal velocity. Ground/air acceleration, friction, and drag. One-way platforms (jump through from below, land from above). Moving platforms (horizontal and vertical) that carry the player.
- **Why**: The feel of the game lives in the physics. Tight collision and responsive movement are non-negotiable.
- **Interactions**: Player, enemies, and projectiles all use this system.
- **Dependencies**: F2 (tile system).

#### F4: Camera System
Camera smoothly follows the player horizontally. Vertical tracking uses a dead zone — camera only moves when the player is near the top or bottom 25% of the screen. Parallax scrolling background with at least 3 layers per world theme.
- **Why**: A good camera is invisible. A bad camera makes the game unplayable.
- **Interactions**: All rendering is relative to camera position. Parallax layers scroll at different rates.
- **Dependencies**: F1 (renderer), F3 (player position).

### Priority 2: Player Character (Must Have)

#### F5: Player Movement
Walk and run (hold shift for 1.6x speed). Variable-height jump (hold for higher). Wall slide (slide slowly when pressing into wall in air). Wall jump (kick away at 45 degrees). Coyote time (6-frame grace period). Jump buffering (8 frames before landing). Crouch (reduced hitbox). Crouch-slide (slide with momentum while crouching at run speed).
- **Why**: The player's movement vocabulary is the core of the game. Every movement technique must feel precise and satisfying.
- **Interactions**: Physics system provides the foundation. Animation system responds to movement state.
- **Dependencies**: F3 (physics).

#### F6: Player Combat
Short-range melee attack. Charge attack (hold 1 second for powerful wide swing that breaks blocks). Jump attack (downward strike, bounces off enemies like pogo). 3-hit health system with 1.5-second invincibility frames (flashing sprite). Lives system (start with 5, game over at 0).
- **Why**: Combat gives the player agency against enemies and bosses. Charge attacks add depth and puzzle utility.
- **Interactions**: Collision detection against enemies. Breakable blocks respond to charge attacks. Boss health system.
- **Dependencies**: F5 (player movement), F3 (collision).

#### F7: Player Animation & Visuals
Player sprite drawn with Canvas commands (rectangles, arcs, lines). Animation states: idle (breathing), walk (4 frames), run (6 frames), jump, fall, wall slide, crouch, attack, hurt, death. Direction facing with sprite flipping. Dust particles on landing, running, and wall jumping.
- **Why**: Visual feedback makes movement feel real. Animations communicate state to the player.
- **Interactions**: Movement and combat state drive animation selection. Particle system for dust effects.
- **Dependencies**: F5, F6 (movement and combat states).

### Priority 3: Game Structure (Must Have)

#### F8: Game State Machine
State machine managing: TITLE → WORLD_MAP → STAGE → PAUSED → BOSS → STAGE_COMPLETE → GAME_OVER → VICTORY. Clean transitions between states with proper setup and teardown.
- **Why**: Without a state machine, the game is chaos. Every screen and mode needs clear boundaries.
- **Interactions**: All other systems check current state. Input handling changes per state.
- **Dependencies**: F1 (game loop).

#### F9: HUD
Top-left: health hearts (filled/empty). Top-center: coin counter with icon. Top-right: stage name. Bottom-center: boss health bar (visible during boss fights, shows boss name). Semi-transparent dark background on all elements for readability.
- **Why**: Players need constant awareness of health, coins, and boss progress.
- **Interactions**: Reads player health, coin count, boss health, and current stage data.
- **Dependencies**: F6 (health/lives), F8 (state machine).

#### F10: Menu System
Title screen with animated scrolling background, "Press Enter to Start," and Controls option. Controls screen showing keyboard bindings (Arrow keys, Z/jump, X/attack, Shift/run, Down/crouch). Pause menu (Escape): Resume, Restart Stage, Return to World Map, Quit to Title. Game Over screen with Continue/Quit. Stage Complete screen with time and coins. Victory screen with scrolling credits and stats.
- **Why**: Menus frame the experience. They set tone and provide essential navigation.
- **Interactions**: State machine drives menu transitions. Save system reads/writes on menu actions.
- **Dependencies**: F8 (state machine).

#### F11: World Map
Top-down world map with 4 world clusters arranged along a path. Each world is 3 stage nodes connected by paths. Player icon moves along paths (arrow keys to select, Enter to start). Completed stages show checkmarks; current stage pulses; locked stages are grayed out. Linear unlock progression. Distinct visual themes per world cluster. Path to next world unlocks with animation after completing a world. Final "Citadel" node after all 4 worlds. Info panel shows stage name, best time, coins collected/total, difficulty rating (1-3 stars).
- **Why**: The world map gives players a sense of journey and progress. It's the connective tissue of the game.
- **Interactions**: Reads save data for completion status. Launches stages. Shows collectible progress.
- **Dependencies**: F8 (state machine), F10 (menu system).

### Priority 4: World Content (Must Have)

#### F12: Enemy System Framework
Base enemy system supporting: patrol behaviors, player detection, health/damage, death animations, projectile spawning. Each enemy type has unique AI, sprite, and attack pattern. Enemies defined by configuration (health, speed, behavior type, visual style).
- **Why**: Enemies create challenge and variety. A solid framework makes 12+ enemy types manageable.
- **Interactions**: Physics and collision for movement. Player combat for damage dealing.
- **Dependencies**: F3 (physics), F6 (combat).

#### F13: Boss Fight Framework
Boss arena system with health bars, phase transitions, vulnerability windows, and attack patterns. Each boss has unique mechanics, arena layout, and visual design. Boss defeat triggers slow-motion effect and explosion particles.
- **Why**: Bosses are the climax of every stage. They test the player's mastery of the mechanics.
- **Interactions**: Enemy framework for base behavior. HUD for health bar. State machine for BOSS state.
- **Dependencies**: F12 (enemy system), F9 (HUD), F8 (state machine).

#### F14: Puzzle Mechanics
Interactive puzzle elements: breakable blocks, keys/gates, pressure plates, pushable blocks, crumbling platforms, rotatable mirrors, ice blocks on frictionless surfaces, valves/levers. Each stage has at least one puzzle.
- **Why**: Puzzles break up the action and add cognitive challenge. They make stages memorable.
- **Interactions**: Tile system for interactive tiles. Player actions trigger puzzle state changes.
- **Dependencies**: F2 (tile system), F6 (combat for breakable blocks).

#### F15: World 1 — Whispering Forest
Green canopy theme with wooden platforms, mushrooms, tree trunks. 3-layer parallax (mountains, trees, leaves). 3 enemy types: Shroomba (patrol), Thorn Vine (stationary shooter), Bark Beetle (ceiling walker). 3 stages: Canopy Trail (tutorial, 80 tiles), Hollow Depths (wall jumps/ladders, 120 tiles), Treetop Gauntlet (moving platforms, 150 tiles). 3 bosses: Elder Shroomba (shockwaves, 5 hits), Vine Mother (vine sweeps, 6 hits), Stag King (charges/ceiling rocks, 7 hits). Puzzles: breakable block stacking, bounce pad sequence, crumbling platforms.
- **Why**: World 1 is the player's introduction. It teaches mechanics progressively and sets expectations.
- **Interactions**: All core systems. Enemy framework. Boss framework. Puzzle mechanics.
- **Dependencies**: F1-F14 (all core systems).

#### F16: World 2 — Scorching Desert
Sand-colored theme with cacti, ruins. Heat shimmer background effect. 3 enemy types: Sand Skitter (charge), Dust Devil (sine-wave push, invincible), Mummy (revives once). 3 stages: Dune Sea (quicksand, 100 tiles), Buried Temple (dark rooms/mirrors, 130 tiles), Oasis Mirage (water physics/swimming, 140 tiles). 3 bosses: Sand Wyrm (emerges from ground, 6 hits), Pharaoh Specter (teleport/summons, 8 hits), Hydra Cactus (3 heads, 12 total hits). Puzzles: pressure plates, mirror reflection, tidal water.
- **Why**: Desert introduces new physics (quicksand, water) and more complex enemies (revival, invincibility).
- **Interactions**: Same as F15 plus water physics, dark room rendering, mirror puzzles.
- **Dependencies**: F15 (builds on World 1 patterns).

#### F17: World 3 — Frozen Tundra
Ice-blue/white theme. Aurora borealis background, falling snow. 3 enemy types: Frost Imp (snowball arcs, freezes platforms), Ice Golem (slides on ice, shatters on death), Snow Owl (figure-8 flight, swoops). 3 stages: Frozen Lake (ice physics, 110 tiles), Crystal Caverns (ice block sliding, 130 tiles), Avalanche Peak (auto-scrolling, 160 tiles). 3 bosses: Frost Bear (ice arena, frost beam, 7 hits), Crystal Witch (crystal shield, 5+20 hits), Yeti Monarch (tiered arena, boulder throw, 9 hits). Puzzles: fire-lure ice melt, ice block bridge, path forks during auto-scroll.
- **Why**: Ice world introduces friction mechanics and auto-scrolling — two major difficulty escalations.
- **Interactions**: Modified physics for ice. Auto-scroll camera mode. Crystal shield boss mechanic.
- **Dependencies**: F16 (builds on Desert patterns, assumes full enemy/boss framework maturity).

#### F18: World 4 — Molten Volcano
Dark stone with glowing lava, ember particles. 3 enemy types: Magma Slime (splits on death), Fire Bat (erratic flight, groups of 3), Obsidian Knight (frontal shield, back-attack only). 3 stages: Lava Fields (rising lava, 120 tiles), Forge of Chains (chain-swinging, 140 tiles), Caldera (all enemy types, 150 tiles). 3 bosses: Lava Serpent (lava jumps, platform destruction, 7 hits), Iron Warden (chain anchors + final phase, 7 hits), Dragon of the Caldera (2-phase, 11 total hits). Puzzles: valve sequences, lever-chain platforms, lava geyser timing maze.
- **Why**: Volcano is the hardest standard world. Enemy combinations and lava mechanics demand mastery.
- **Interactions**: Lava hazard system. Chain-swinging mechanic. Multi-phase boss system.
- **Dependencies**: F17 (builds on Tundra patterns).

#### F19: The Citadel & Final Boss
Single long stage (~200 tiles) remixing all 4 world themes. Forest section with advanced Bark Beetles, Desert with quicksand/Dust Devils, Tundra with ice/auto-scroll, Volcano with rising lava. Final boss "The Architect" with 5 phases (Forest/Desert/Tundra/Volcano/All), 19 total hits. Victory screen with total time, deaths, coins.
- **Why**: The finale that ties everything together. Tests mastery of all mechanics.
- **Interactions**: All world systems. Multi-phase boss with all world powers.
- **Dependencies**: F15-F18 (all worlds).

### Priority 5: Collectibles & Persistence

#### F20: Collectible System
Coins in every stage with per-stage totals (tracked on world map). Health pickups (restore 1 HP, only spawn if damaged). Extra lives (1 per stage, hidden/hard-to-reach). Power Stars (1 per world, hidden). Coin counter in HUD. Total coins persist across stages. Collecting all coins in a stage awards a star.
- **Why**: Collectibles drive exploration and replayability. They reward thorough players.
- **Interactions**: HUD displays coins/health. World map shows collection progress. Save system persists totals.
- **Dependencies**: F9 (HUD), F11 (world map).

#### F21: Save System
localStorage persistence. Saves after each stage: completed stages, coin totals, best times, lives. Loading restores to world map with completion state. "New Game" option with confirmation prompt clears save data.
- **Why**: Without saves, players lose all progress on page refresh. Essential for a game of this length.
- **Interactions**: World map reads save state. Stage completion triggers save. Title screen offers New Game.
- **Dependencies**: F11 (world map), F10 (menus).

### Priority 6: Audio & Polish

#### F22: Synthesized Audio System
All audio via Web Audio API (OscillatorNode, GainNode, BiquadFilterNode). Player sounds: jump, land, wall slide, attack, hurt, death. Enemy sounds: hit, defeat, projectile. Boss sounds: entrance, hit (with screen shake), defeat cascade, phase transition. UI sounds: coin collect, health pickup, extra life, menu select/confirm, stage clear, game over. Per-world ambient: Forest (wind+chirps), Desert (wind drone), Tundra (howling wind+shimmer), Volcano (rumble+crackle). Boss music: procedural percussion loop that increases tempo as boss health decreases. Master volume + mute toggle in pause menu.
- **Why**: Audio transforms a silent tech demo into an immersive game. Synthesized audio matches the zero-dependency philosophy.
- **Interactions**: All game events trigger sounds. Pause menu controls volume.
- **Dependencies**: F8 (state machine), F13 (boss fights for dynamic music).

#### F23: Visual Effects & Screen Polish
Screen shake on boss hits, damage, explosions. Hit flash (white for 2 frames). Particle systems: dust on landing, sparks on wall slide, embers in volcano, snow in tundra, leaves in forest. Death animation: sprite breaks into 4 pieces with gravity. Boss defeat: slow-motion (0.3x for 1 second) + particle explosion. Screen transitions: iris-wipe (circular mask shrinks to black, expands on new scene).
- **Why**: Visual effects are the difference between "functional" and "polished." They communicate impact and create juice.
- **Interactions**: Triggered by game events across all systems. Particle system runs independently.
- **Dependencies**: F1 (renderer), F7 (player animation), F13 (boss fights).

---

## Visual Design Language

### Aesthetic Direction: "Geometric Wilderness"
The game's visual identity is built on bold geometric shapes — rectangles, arcs, and clean lines — rendered in rich, saturated palettes. This isn't pixel art or vector art; it's "Canvas primitive art." Characters and enemies are constructed from overlapping shapes with deliberate construction lines visible, like an architect's sketch brought to life. The style is reminiscent of papercraft dioramas — layered, tactile, slightly abstract.

### Principles
- **Bold silhouettes**: Every character and enemy should be instantly recognizable by silhouette alone. No detail-dependent designs.
- **World-specific palettes**: Each world uses a tight 4-5 color palette. Colors bleed between layers (foreground tiles are saturated, backgrounds are desaturated versions of the same hues).
- **Contrast for readability**: Hazards use warning colors (bright red, orange). Collectibles glow. Interactive elements pulse. The player always reads clearly against any background.
- **Layered depth**: 3+ parallax layers create depth. Foreground elements have dark outlines; background elements are soft and muted.
- **Animated world**: Backgrounds are never static. Leaves drift, sand shimmers, snow falls, embers rise. The world breathes.

### Anti-Patterns (What This Game Is NOT)
- No pixel-art nostalgia — this is proudly Canvas-drawn with smooth shapes
- No flat/material design — tiles have texture (hatching, stippling, gradient fills)
- No generic platformer green — Forest world uses deep emerald and moss, not grass-green
- No white UI cards — HUD uses semi-transparent dark overlays that feel embedded in the game world

---

## Technical Architecture

### Stack
- **Pure vanilla JavaScript** — no frameworks, no bundler, no dependencies
- **HTML5 Canvas 2D** — all rendering
- **Web Audio API** — all sound synthesis
- **localStorage** — save persistence
- **Single HTML file** entry point with modular JS files loaded via script tags (or a small module system)

### Data Model (Entities)
- **GameState**: current state (title/map/stage/paused/boss/complete/gameover/victory), active world, active stage
- **Player**: position, velocity, health, lives, coins, state (idle/walk/run/jump/fall/slide/crouch/attack/hurt/dead), direction, animation frame, invincibility timer
- **Level**: tile grid (2D array of tile IDs), width, height, spawn point, exit point, collectible positions, enemy spawn data, puzzle state, boss arena bounds
- **Enemy**: type, position, velocity, health, state, AI behavior, animation frame
- **Boss**: extends Enemy with phases, attack patterns, vulnerability windows, arena definition
- **Collectible**: type (coin/heart/life/star), position, collected flag
- **Camera**: position, target, dead zone bounds, shake offset
- **Particle**: position, velocity, lifetime, color, size
- **SaveData**: completed stages (set), coin totals (map), best times (map), lives, power stars collected
- **WorldMap**: nodes (position, world, stage, locked/unlocked/complete), paths, selected node
- **AudioManager**: master volume, mute state, active sounds, ambient loop reference

### Architecture Pattern
- Entity-component style: game objects are plain data, systems operate on them
- Main game loop calls update() then render() on each active system
- State machine pattern for game flow and individual entity states
- Event-based communication for cross-system triggers (e.g., "enemy defeated" → particle burst + sound + score)

---

## Sprint Decomposition

### Sprint 1: Core Engine
**Theme**: Game loop, canvas rendering, tile system, physics, camera
**Features**: F1, F2, F3, F4
**Dependencies**: None
**Complexity**: High
**Deliverable**: A scrollable tile world with gravity, collision, and parallax backgrounds. A test entity falls, lands on tiles, and can be moved with arrow keys.

### Sprint 2: Player Character
**Theme**: Full player movement vocabulary and combat
**Features**: F5, F6, F7
**Dependencies**: Sprint 1
**Complexity**: High
**Deliverable**: A fully controllable player character with walk, run, jump (variable height), wall slide, wall jump, coyote time, jump buffering, crouch, crouch-slide, melee attack, charge attack, jump attack, health, lives, and all animation states. Playable in a test level.

### Sprint 3: Game Structure & UI
**Theme**: State machine, menus, HUD, screen transitions
**Features**: F8, F9, F10
**Dependencies**: Sprint 2
**Complexity**: Medium
**Deliverable**: Complete game flow from title screen through gameplay to game over. Pause menu works. HUD shows health/coins/stage. Iris-wipe transitions between screens.

### Sprint 4: World Map & Progression
**Theme**: World map navigation, stage selection, progression system
**Features**: F11, F20 (collectible tracking), F21 (save system)
**Dependencies**: Sprint 3
**Complexity**: Medium
**Deliverable**: Navigable world map with 4 world clusters and 13 stage nodes. Stage info panel. Linear unlock progression. Save/load via localStorage. Coins tracked and persisted.

### Sprint 5: Enemy & Boss Framework + World 1 Stages
**Theme**: Enemy AI framework, boss fight system, and all 3 Whispering Forest stages
**Features**: F12, F13, F14 (puzzle mechanics), F15
**Dependencies**: Sprint 4
**Complexity**: High
**Deliverable**: Enemy system with 3 Forest enemy types (Shroomba, Thorn Vine, Bark Beetle). Boss framework with health bars, phases, vulnerability windows. 3 complete Forest stages (Canopy Trail, Hollow Depths, Treetop Gauntlet) with level layouts, enemies, puzzles, and bosses (Elder Shroomba, Vine Mother, Stag King). Completing stages updates world map and save data.

### Sprint 6: World 2 — Scorching Desert
**Theme**: Desert world with all 3 stages, enemies, bosses, and unique mechanics
**Features**: F16
**Dependencies**: Sprint 5
**Complexity**: High
**Deliverable**: 3 Desert stages with distinct tile palette and backgrounds. 3 enemy types (Sand Skitter, Dust Devil, Mummy). Quicksand mechanic, dark rooms, water/swimming physics, mirror puzzles. 3 bosses (Sand Wyrm, Pharaoh Specter, Hydra Cactus).

### Sprint 7: World 3 — Frozen Tundra
**Theme**: Tundra world with ice physics, auto-scrolling, and all 3 stages
**Features**: F17
**Dependencies**: Sprint 6
**Complexity**: High
**Deliverable**: 3 Tundra stages with ice palette and aurora background. Ice physics (reduced friction). 3 enemy types (Frost Imp, Ice Golem, Snow Owl). Auto-scrolling in Stage 3-3. 3 bosses (Frost Bear, Crystal Witch, Yeti Monarch).

### Sprint 8: World 4 — Molten Volcano
**Theme**: Volcano world with lava mechanics, chain-swinging, and all 3 stages
**Features**: F18
**Dependencies**: Sprint 7
**Complexity**: High
**Deliverable**: 3 Volcano stages with dark stone/lava palette. Rising/falling lava, chain-swinging, steam vents. 3 enemy types (Magma Slime, Fire Bat, Obsidian Knight). 3 bosses (Lava Serpent, Iron Warden, Dragon of the Caldera with 2-phase fight).

### Sprint 9: The Citadel & Final Boss
**Theme**: Final stage remix and multi-phase final boss encounter
**Features**: F19
**Dependencies**: Sprint 8
**Complexity**: High
**Deliverable**: Citadel stage (~200 tiles) remixing all 4 world themes. Final boss "The Architect" with 5 phases (Forest/Desert/Tundra/Volcano/All, 19 total hits). Victory screen with stats (time, deaths, coins). Power Star cosmetic unlock check.

### Sprint 10: Audio System
**Theme**: Synthesized sound effects, ambient audio, and dynamic boss music
**Features**: F22
**Dependencies**: Sprint 5 (needs boss framework for dynamic music)
**Complexity**: Medium
**Deliverable**: All player/enemy/boss/UI sound effects via Web Audio API oscillators. Per-world ambient loops. Procedural boss percussion that speeds up with decreasing boss health. Volume control and mute toggle in pause menu.

### Sprint 11: Visual Effects & Polish
**Theme**: Particles, screen shake, transitions, and visual juice
**Features**: F23
**Dependencies**: Sprint 9 (needs all content for full polish pass)
**Complexity**: Medium
**Deliverable**: Screen shake on impacts. Hit flash on damage. Particle systems per world (dust, sparks, embers, snow, leaves). Death animation (sprite breaks apart). Boss defeat slow-motion + particle explosion. Iris-wipe screen transitions refined.

### Sprint 12: Integration, Balance & Performance
**Theme**: 60fps optimization, game feel tuning, full playthrough validation
**Features**: All features — integration pass
**Dependencies**: Sprint 11
**Complexity**: Medium
**Deliverable**: All 13 stages playable start to finish. 60fps maintained throughout. Coyote time, jump buffering, and all game-feel systems verified. Save/load works across full game. Collectible totals correct. Boss difficulty balanced. No softlocks or progression blockers.
