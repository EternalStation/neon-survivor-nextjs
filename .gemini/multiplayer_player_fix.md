# Multiplayer Synchronization Fixes

## 1. Player Model Visibility & Movement
**Problem:** The second player was often invisible or stuck at the spawn point for the host, even if they were moving on their own screen.

**Root Causes:**
1.  **Reference Desync:** `state.player` was a separate copy from `state.players[id]`, so updates to one weren't reflected in the other.
2.  **State Overwrites:** The host's state updates were completely overwriting the client's `state.players` map every 50ms, wiping out client-side movement predictions and local timers.
3.  **Spawn Timer Mismatch:** The `spawnTimer` (which controls visibility) was not synchronized, leading to players being "stuck" in an invisible/spawning state on remote screens.

**Solutions:**
*   Ensured `state.player` is a direct reference into the `state.players` map.
*   Implemented a "Merge" strategy in `onStateUpdate`:
    *   Preserves local player's `x`, `y`, and `spawnTimer` during updates to keep movement smooth.
    *   Only updates remote players' references.
*   Added `spawnTimer` synchronization to ensure all players become visible simultaneously.

## 2. The "Ghost" Player Issue (Targeting & Aggro)
**Problem:** The second player was behaving like a "ghost." Enemies would ignore them, loot wouldn't follow them, and they couldn't activate points of interest (POIs).

**Root Causes:**
*   **Hardcoded Host Target:** Most game logic (enemies, loot, POIs) was hardcoded to only check `state.player` (the host).

**Solutions:**
*   **Enemy Targeting:** Updated `EnemyLogic.ts` and `EliteEnemyLogic.ts` to calculate the nearest player. Enemies now target and pursue whichever player is closer.
*   **Hive Aggro:** Updated Hive-mother (Pentagon) logic to trigger its minion launch if *any* player enters its proximity radius.
*   **Loot Magnetism:** Updated `LootLogic.ts` to pull meteorites toward the nearest player who has available inventory space.
*   **POI Interactions:** Updated `Anomaly` and `Overclock` POIs to react to the proximity of any connected player.
*   **Inventory Isolation:** Moved the global inventory into the `Player` object to ensure players collect and manage their own loot.

## 3. Technical Improvements
*   **Multiplayer Input Buffer:** Host now correctly receives and processes input vectors from all clients, moving their characters in the authoritative state.
*   **Type Safety:** Added `inventory` to the `Player` interface and `targetPlayer` to `Meteorite` to support individual collection logic.
*   **Defensive Rendering:** Added safety checks to `PlayerRenderer.ts` to handle cases where remote player data might be partially stale.

## Status: Ready for Testing
The core "invisible ghost" issue should now be resolved. Secondary players should be visible, able to move, and fully recognized by the game's AI and loot systems.
