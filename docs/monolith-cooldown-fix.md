# Temporal Monolith Cooldown Recovery Speed Fix

- **Problem**: Previously, the Temporal Monolith buff (triggered by taking damage) increased "Cooldown Reduction" directly. Because the UI displays cooldowns as `Total - Elapsed`, changing the `Total` (Reduction) caused the remaining time numbers to "jump" instantly when hit, and jump back when the 1s buff expired.
- **Solution**: 
    - Removed the dynamic buff from the base `cdMod` calculation to keep the "Total Cooldown" duration stable in the UI.
    - Implemented a "Recovery Speed" mechanic in the game loop. While the Temporal Monolith buff is active, the game now "ages" skill timestamps (e.g., `lastUsed`) by an extra 20% every frame.
    - This results in the cooldown timer ticking down 1.2x faster during the buff without any visual jumps or flickering numbers.
- **Affected Skills**:
    - All manual active skills in the player's skill bar.
    - Class abilities (Black Hole, Hive Mother Spit, Orbital Vortex, Sandbox, Storm Strike).
    - Passive technical skills (Kinetic Shockwave/Zap, Dash, Death Mark).
