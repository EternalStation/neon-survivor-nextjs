# Leaderboard Damage Tab Integration

This update introduces a detailed damage attribution system to both the Death Screen and the global Leaderboard. This allows players to analyze their build performance post-mortem and compare it with top-ranking players.

## New Features

### 1. Detailed Damage Tracking
- Every run now captures a full `damageBreakdown` record (source -> damage amount).
- This data is submitted to the server upon player death.
- Supports all 12+ legendary fusions and standard damage sources (Projectiles, Collision, Wall Impact, etc).

### 2. Death Screen "Damage" Tab
- A new tabbed interface in the Death Screen: **Overview**, **Hardware Profile**, and **Damage**.
- The Damage tab displays a visual breakdown of damage sources with custom colors, gradients, and icons.
- Grouping logic consolidates related damage sources (e.g., Projectiles, Epicenter LVL 1 vs 4) into expandable rows.

### 3. Leaderboard "Damage Analysis"
- Expanded leaderboard rows now feature a toggle between **Mission Stats** and **Damage Analysis**.
- Damage Analysis shows the recorded breakdown from the server, allowing for tactical analysis of top players' builds.
- Consistent visual language with the in-game Stats Menu.

## Technical Implementation

### Shared Utility: `damageMapping.ts`
- Centralized the complex mapping of damage sources to colors, gradients, and fusion icons.
- Provides a consistent visual identity across `StatsMenu`, `DeathScreen`, and `Leaderboard`.
- Dynamically adjusts colors and icons based on the player's class.

### Component Updates
- **DeathScreen.tsx**: Refactored to use tabbed display and integrated the new damage mapping.
- **Leaderboard.tsx**: Added interface support for `damage_breakdown`, implemented the new expanded tab system, and added the damage analysis view.
- **RunSubmission**: Updated the API client and preparation logic to include the breakdown data.

### Translations
- Added internationalization keys for all new fusion damage sources in English.
- Fallback logic ensures consistency when specific translations are missing.
