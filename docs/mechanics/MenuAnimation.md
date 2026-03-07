# Upgrade Menu: Initial Delay & Scanning Animation

## Overview
To prevent accidental clicks and enhance the "tactical hacker" aesthetic of Neon Survivor, a 1-second security protocol is active whenever the Upgrade Menu appears. During this window, the player cannot select an upgrade, and a "decryption" animation is displayed.

## Animation Mechanics

### 1. Initial State (Locked)
- **Duration**: 1000ms.
- **Visuals**:
    - Cards are slightly desaturated and dimmed.
    - Card content (icons, titles, values) is blurred using a CSS filter (`blur(8px)`).
    - A digital noise overlay (`scan-noise`) covers the cards.
    - A high-intensity cyan scanline (`scan-line`) moves vertically across the cards.
    - A "DECRYPTING..." status indicator with a glitch pulse effect is shown.

### 2. Decryption (Unlocked)
- After 1000ms, the `canSelect` state becomes `true`.
- The following transitions occur:
    - **Blur Removal**: Content becomes sharp instantly.
    - **Overlay Fade**: Scanning UI elements are removed.
    - **Color Bloom**: Cards return to their full rarity-specific colors and glow.
    - **Interactivity**: Mouse hover and keyboard selection are enabled.

## Code Implementation
- **Logic**: `src/components/hud/UpgradeMenu.tsx` manages the `canSelect` timer.
- **Presentation**: `src/styles/UpgradeMenu.css` defines the keyframes for `scanline`, `noiseAnimation`, `textGlitch`, and `decryptPulse`.
- **States**: The `.locked` class on `.upgrade-card-container` triggers the transition between the scanning and active states.
