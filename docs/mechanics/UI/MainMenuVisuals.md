# Main Menu: Visual Layers & Atmospheric Effects

## Overview
The Main Menu uses a multi-layered, interactive canvas system to create a "tactical hacker" aesthetic combined with a subtle horror atmosphere. The animation consists of several distinct layers that react to user input and time.

## Visual Layers

### 1. The Starfield
- **Density**: 80 stars.
- **Behavior**: Stars have random positions, sizes, and pulse frequencies.
- **Opacity**: Ranges from 0.2 to 1.0, creating a twinkling depth effect.

### 2. Meteorites
- **Behavior**: Cyan streaks that move diagonally across the screen at high speeds.
- **Frequency**: Randomly triggered with a low probability (98% threshold for activation).
- **Appearance**: Fading tail gradients with a cyan neon glow.

### 3. The Lurker (Shadow Figure)
- **Position**: Centered horizontally, slightly above the vertical midpoint.
- **Morphology**: A shadowy face/figure with a faint red gradient silhouette.
- **Eyes**: Two glowing red points that look toward the mouse cursor.
- **Animation**: A slow, sinusoidal breathing pattern (sinusoidal pulse) and a subtle vertical drift.
- **Visibility**: Rendered with very low opacity (0.08) to create a "near-invisible" presence that only becomes apparent upon closer inspection.

### 4. Hexagonal Grid
- **Geometry**: A tiled hexagonal pattern (Hex Size: 60px).
- **Interactivity**: 
    - **Bulge Effect**: Hexes within 420px of the mouse cursor bulge outward.
    - **Distortion**: Hexes are displaced away from the mouse cursor to create a cohesive 3D perspective shift.
    - **Unified Surface**: The grid behaves like a contiguous mesh, ensuring stability at the center of each hex.

### 5. Tactical Drone (The Phantom Troll)
- **Design**: A persistent, autonomous "Phalanx" unit. It stays on-screen at all times, roaming between buttons and the mouse.
- **Visuals**:
    - **Live Fire Boosters**: High-intensity jittery plasma exhaust that reacts to velocity and push-force.
    - **Heavy Armor**: Armored engine housings and mechanical thruster pods.
    - **Tri-Node Core**: Pulsing cyan core synchronized with energy states.
- **Interactivity**: 
    - **Interruptible Actions**: If the player clicks on the drone while it is pushing a button, the action is **immediately cancelled**, and the drone picks a new random destination.
    - **Reactive Movement**: Clicking the drone while it is wandering or stalking causes it to instantly change direction and pick a new target coordinates.
    - **Chaotic Pushing**: Shoves buttons in **randomized diagonal directions** and for varying distances (up to 150px).
    - **Adaptive Docking**: Positions itself precisely at the contact point for high-fidelity physics.

### 6. Assistant Blackout Easter Egg
- **Trigger**: Clicking the Tactical Drone 5 times within 5 seconds.
- **Lore Integration**: Orbit (the in-game assistant) appears with randomized taunting dialogues in English or Russian.
- **Darkness Protocol**: The menu enters a 100% pitch-black state.
- **Button Collapse**: All UI buttons "explode" and land at the base of the screen in a rotated pile.
- **Vanguard Scanner**: The cursor is replaced by the **LOOSER SCNNER V2** tactical HUD searchlight.
- **Goal**: Players must use the scanner to find the hidden buttons in the dark.

### 7. Lurker Curiosity
- **Behavior**: The Lurker's eyes transition between tracking the mouse and tracking the drone.
- **Trigger**: The Lurker will watch the drone whenever it performs a "stunt" (Pushing, Hunting, or active Wandering).

## Transitions: The Eye Dive
- **Trigger**: Clicking the "ENTER VOID" button.
- **Animation**: 
    - **Cinematic Zoom**: The camera performs a precise, exponential zoom into the Lurker's right pupil.
    - **UI Fade**: All menu elements disappear instantly.
    - **Void Descent**: 1200ms duration with a predictive handover at 82% completion.

## Technical Implementation
- **Source**: `src/components/MainMenu.tsx`.
- **Styling**: `src/styles/menu_additions.css` (Contains the stable Title and button designs).
- **Rendering**: Vanilla HTML5 Canvas (2D Context) with GPU acceleration (`will-change`).
- **Performance**: Unified high-precision loop using `performance.now()`.
- **Color Palette**: 
    - **Background**: `#020617` (Deep Space Dark).
    - **Accents**: Cyan (`#22d3ee`) for tech elements.
    - **Threat**: Deep Red for the Lurker eyes and silhouette.
