# Design Specification: Kingdoms of the Canvas

## Color Palette

This is a game, not an app — colors serve gameplay readability first, aesthetics second. The "chrome" (HUD, menus, world map) uses a dark, warm-neutral palette so it never competes with the vivid world palettes.

### UI Chrome Colors
| Role | Hex | Usage |
|------|-----|-------|
| **Deep Charcoal** | `#1A1A2E` | Primary background for menus, overlays, HUD backing |
| **Warm Slate** | `#2D2D44` | Secondary panels, info boxes, card backgrounds |
| **Muted Gold** | `#C4A35A` | Accent — selected items, active highlights, coin counter |
| **Soft Cream** | `#E8DCC8` | Primary text, labels, stage names |
| **Ember Red** | `#D94F4F` | Health hearts, damage indicators, warnings |
| **Moss Green** | `#5A9E6F` | Completion checkmarks, positive feedback, extra lives |
| **Steel Blue** | `#6B8CAE` | Locked/disabled states, secondary text, shadows |

### World Palettes (In-Game — Each Used Only In Its World)
**Forest**: `#2D5A27` (deep canopy), `#4A8C3F` (leaf), `#8B6B3D` (bark), `#1A3A15` (shadow), `#C8E6A0` (highlight)
**Desert**: `#C4943A` (sand), `#8B6B2E` (dark sand), `#D4B896` (light stone), `#3A2A1A` (shadow), `#E8D4A0` (bleached bone)
**Tundra**: `#A8D4E6` (ice blue), `#E8F0F8` (snow white), `#6B9CB8` (deep ice), `#2A4A5A` (shadow), `#C8FFE8` (aurora green)
**Volcano**: `#2A1A1A` (dark stone), `#8B2A1A` (dark red), `#FF6A2A` (lava orange), `#FFD43A` (molten yellow), `#4A2A2A` (shadow)

### Special Colors
- **Player character**: `#3A7BD5` (blue body), `#E8DCC8` (face/hands) — always readable against any world
- **Hazards**: `#FF4444` (spikes), `#FF8800` (lava) — universal warning colors
- **Collectible coins**: `#FFD700` (gold) with `#FFF8DC` (glint)
- **Power Stars**: `#FF69B4` (hot pink) — deliberately different from anything else in the game
- **Invincibility flash**: `#FFFFFF` alternating with sprite color

## Typography

The game renders all text via Canvas `fillText` — no web fonts, no CSS typography.

### Font Stack
- **Primary**: `"Courier New", monospace` — for HUD numbers (coins, time, health). Monospace ensures counters don't jump width.
- **Display**: `bold sans-serif` (Canvas default) — for titles, boss names, stage names. Canvas `font` property with `bold` weight.
- **Body**: `sans-serif` — for menu options, info panels, controls screen.

### Scale
| Usage | Size (logical px) | Weight | Case |
|-------|-------------------|--------|------|
| Game Title | 48px | Bold | UPPERCASE |
| World/Boss Names | 28px | Bold | Title Case |
| Stage Names (HUD) | 18px | Bold | Title Case |
| Menu Options | 22px | Normal | Title Case |
| HUD Numbers | 16px | Bold (mono) | N/A |
| Info Panel Text | 14px | Normal | Sentence case |
| Small Labels | 12px | Normal | UPPERCASE |

### Text Rendering Rules
- All game text drawn with 2px dark outline (stroke before fill) for readability over any background
- HUD text uses `textAlign = 'center'` or `'right'` as appropriate
- No text wrapping in HUD — keep labels short
- Menu text vertically centered in their hit areas with 8px padding

## Spacing Scale

Base unit: **4px**. All spacing is a multiple of this base.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight padding inside HUD elements |
| `sm` | 8px | Padding inside buttons/menu items |
| `md` | 16px | Gap between HUD clusters, menu item spacing |
| `lg` | 32px | Margin between major UI sections |
| `xl` | 48px | World map node spacing |
| `xxl` | 64px | Screen edge margins for menus |

### Grid (Canvas Logical Space)
- Canvas: 960×540 logical pixels
- Tile grid: 32×32px per tile (30 tiles wide × ~17 tiles tall visible)
- HUD: 16px inset from canvas edges
- Menu centering: items centered horizontally, stacked vertically with `md` gaps

## Component Patterns

### Health Hearts (HUD)
- 3 heart shapes drawn with Canvas `bezierCurveTo`
- Filled: Ember Red `#D94F4F` with darker `#A83A3A` outline
- Empty: Steel Blue `#6B8CAE` outline only, transparent fill
- Size: 24×24px each, `xs` gap between
- Position: 16px from top-left corner
- Subtle pulse animation (scale 1.0→1.05→1.0) when health changes

### Coin Counter (HUD)
- Small gold circle (12px diameter) as coin icon
- Muted Gold `#C4A35A` number in monospace
- Format: `× 047` (always 3 digits, zero-padded)
- Position: top-center of canvas
- Brief scale-up animation when coins increment

### Boss Health Bar
- Only visible during boss encounters
- Width: 320px, height: 12px, centered horizontally, 48px from bottom
- Background: Deep Charcoal `#1A1A2E` with 2px Warm Slate border
- Fill: gradient from Ember Red `#D94F4F` (low health) to Moss Green `#5A9E6F` (full health)
- Boss name in small label text above the bar
- Smooth interpolation when health decreases (fill width lerps over 0.3 seconds)

### Menu Buttons
- Not actual DOM buttons — Canvas-drawn rectangles
- Background: Warm Slate `#2D2D44` with 1px Muted Gold border
- Selected/hovered: Muted Gold `#C4A35A` border thickens to 2px, background lightens to `#3D3D54`
- Text: Soft Cream `#E8DCC8`, centered
- Size: 240×40px for main menu items
- Selection indicator: small triangle `▶` in Muted Gold, 8px left of text

### World Map Nodes
- Completed: filled circle with Moss Green checkmark overlay
- Current/selected: pulsing circle (scale oscillation) with Muted Gold glow
- Locked: circle with Steel Blue `#6B8CAE` fill, 50% opacity
- Node size: 28px diameter
- Paths between nodes: 3px dashed line in Warm Slate, solid when unlocked
- World clusters use their world palette as a subtle background wash

### Info Panel (World Map)
- Appears when a stage node is selected
- Position: bottom-right of canvas, 32px inset
- Background: Deep Charcoal with 60% opacity, 2px Muted Gold border
- Size: 260×160px
- Content: stage name (bold), best time, coin count (`47/52`), difficulty stars (filled/empty)

### Dialog/Confirmation Box
- Centered overlay, 320×180px
- Deep Charcoal background at 90% opacity
- Soft Cream text, two button options (Yes/No)
- Used for "New Game" confirmation, quit confirmation

## Theme: Dark

The game uses a dark theme exclusively. Rationale:
- Dark backgrounds make colorful game worlds pop with maximum contrast
- Reduces eye strain during extended play sessions
- Makes glowing effects (lava, aurora, coin glints) more visually impactful
- HUD elements over gameplay need dark backing — a light theme would clash with bright game worlds
- Consistent with the "adventure in dangerous lands" tone

There is no light theme. This is a deliberate design choice, not an oversight.

## Motion & Animation

### Timing
- All gameplay animations at 60fps, frame-counted (not time-based for gameplay, time-based for UI)
- UI transitions: 300ms ease-in-out for menus, 500ms for iris-wipe screen transitions
- World map: node pulse at 1.5Hz (0.67s period), path unlock animation over 800ms

### Player Animation Timing
| State | Frame Count | Duration |
|-------|-------------|----------|
| Idle (breathing) | 2 frames | 1.0s loop |
| Walk cycle | 4 frames | 0.4s loop |
| Run cycle | 6 frames | 0.36s loop |
| Attack swing | 3 frames | 0.15s (one-shot) |
| Charge release | 4 frames | 0.2s (one-shot) |
| Hurt flash | 8 flashes | 1.5s (invincibility) |
| Death break | 4 pieces | 1.0s (one-shot, gravity-affected) |

### Screen Shake
- Player hurt: 4px offset, 200ms duration, rapid random
- Boss hit: 6px offset, 300ms duration
- Explosion: 8px offset, 400ms duration
- Implementation: random x/y offset applied to canvas transform before rendering, decays linearly

### Particles
- Dust (landing): 5 particles, tan color, 0.3s lifetime, spread outward and up
- Dust (running): 2 particles per footstep, small, short-lived
- Wall slide sparks: 3 particles, white/yellow, 0.2s lifetime, spray downward
- World-specific ambient: 20-40 particles on screen at any time, slow drift, long lifetime (3-5s)
- Boss defeat explosion: 30+ particles, multi-color, 1.5s lifetime, radial burst

### Iris Wipe Transition
- Duration: 500ms total (250ms close + 250ms open)
- Close: circular mask shrinks from canvas diagonal to 0, centered on player position
- Hold black for 1 frame
- Open: circular mask expands from 0 to canvas diagonal, centered on new scene's player spawn
- Easing: ease-in for close, ease-out for open

## Empty States

### New Game — World Map
- All stage nodes beyond 1-1 are locked (grayed out with Steel Blue)
- A subtle animated arrow points to Stage 1-1 with text "Begin your journey"
- Info panel shows "???" for best time and coins until the stage is attempted

### No Save Data — Title Screen
- "Continue" option is absent (only "New Game" and "Controls" shown)
- If save data exists, "Continue" appears above "New Game"

### Boss Not Yet Reached
- Boss health bar is hidden during stage traversal
- Appears with a slide-up animation when the player enters the boss arena trigger zone

### Stage Locked
- World map node is visually muted
- Selecting it shows info panel with: stage name, "LOCKED" in Steel Blue, and "Complete [previous stage] to unlock"

### All Stages Complete
- After beating The Citadel, the world map plays a brief celebration: all nodes pulse gold simultaneously, then settle
- A "★ Complete ★" banner appears at the top of the world map
- All stages remain replayable for better times/coin collection
