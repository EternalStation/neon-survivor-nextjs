# Infernal Breach & Interaction Update

## Overview
This update focuses on enhancing the thematic atmosphere of the "Anomaly" POI by renaming it to **Infernal Breach** and improving the interaction mechanics for both the Breach and defensive Turrets.

## New Features

### 1. Infernal Breach (formerly Anomaly)
- **Thematic Renaming**: All references to "Anomaly" have been replaced with "Infernal Breach" or "Overlord" related terms.
- **Interaction Prompt**: An "E" prompt now appears when the player is within the summoning circle.
- **HP Preview**: Players can now see the predicted HP of the Overlord that will be summoned before initiating the breach.
- **Summoning Delay**: Pressing "E" triggers a 5-second countdown ("OVERLORD RISING") before the boss spawns, allowing tactical positioning.

### 2. Instant Turret Activation
- **Instant Response**: Players no longer need to wait 1 second near a turret to activate it. 
- **Keybind Support**: Turrets are now activated by pressing the "E" key (default interact bind), which is now prominently displayed.

### 3. UI and Aesthetics
- **Interaction Icons**: Floating key prompts appear for interactive elements when in range.
- **Thematic Death Causes**: Death messages now reflect the hellish nature of the bosses (e.g., "OVERLORD STRIKE", "OVERLORD SIPHON").
- **Russian Localization**: Full Russian translation support for all new terms (e.g., "ВЛАДЫКА" for Overlord).

## Technical Changes
- Renamed internal logic functions for consistency (`getInfernalBossHp`).
- Updated `PoiRenderer.ts` to handle interactive UI elements.
- Refined `EnemySystemLogic.ts` for thematic floating text and boss spawning delays.
- Updated `uiTranslations.ts` with new thematic strings.
