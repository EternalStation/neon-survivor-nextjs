# Gravity Anchor Implementation

## Overview
The **Gravity Anchor** is a powerful fusion legendary upgrade that combines the defensive capabilities of **Aegis Protocol** with the crowd control of **Epicenter**. It has been implemented as an active skill that players can trigger to stabilize local space and crush enemies.

## Features Implemented

### 1. Active Skill Registration
- **Gravity Anchor** is now registered as an active skill.
- Upon selecting the Legendary upgrade, it is automatically added to the player's active skills bar (binding to keys 2-6 as available).
- The skill shares the standard Epicenter cooldown.

### 2. Combat Mechanics
- **Armor Scaling**: The Gravity Anchor's damage now scales with **2% of the player's total armor** per damage pulse.
- **Execution & Explosion**: Enemies within the Gravity Anchor that fall below the execution threshold (5% base, amplified by meteorites) are instantly executed.
- **MAX HP Explosion**: Executed enemies explode, dealing **10% of their MAX HP** (amplified by meteorites) as AOE damage in a **200px radius**.

### 3. Visual Enhancements
- Added a new visual design for the Gravity Anchor.
- **Yellow Cones/Spikes**: In addition to the standard cyan/blue crystalline spikes, the Gravity Anchor now features vibrant yellow/amber cones, creating a distinct "Defensive/Fusion" aesthetic.
- Particle effects for executions and explosions have been synchronized with the new damage types.

### 4. Code Quality & Formatting
- All comments have been removed from the modified files to adhere to project rules.
- Type safety has been improved by adding `isGravityAnchor` to the `AreaEffect` interface.
- Translations for name, description, and skill details have been updated in English.
