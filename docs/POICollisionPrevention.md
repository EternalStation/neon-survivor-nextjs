# POI Collision Prevention

This document describes the implementation of a safety system to prevent Point of Interest (POI) overlaps, specifically between Turrets and the Overlord (Anomaly) portal.

## Problem
When a Turret and the Overlord summon portal spawned at the same location, their interaction ranges overlapped. Pressing the [E] key would simultaneously activate the Turret and summon the Overlord boss, leading to unintended gameplay behavior.

## Solution
Implemented a robust spatial check for all POI generation and relocation events:

1.  **Safety Gap**: A minimum distance of **1000 pixels** is now enforced between all POIs within the same arena.
2.  **Smart Relocation**: The `relocatePOI` and `relocateTurretsToArena` functions now use a best-fit search. They attempt to find 30 random valid positions and select the one that is furthest from all existing active POIs in the arena.
3.  **Utility Function**: Added `findSafePoiPosition` in `MapLogic.ts` to centralize the safe position finding logic.
4.  **Initial Generation**: Enhanced `generateMapPOIs` to use more attempts and enforce the same 1000px gap during the initial setup of a run.

## Logic Changes
- **MapLogic.ts**:
    - Extracted `findSafePoiPosition` helper.
    - Updated `relocatePOI` signature to accept the full POI list.
    - Updated `generateMapPOIs` to use a 1000px buffer for turrets and anomalies.
- **EnemySystemLogic.ts**:
    - Updated calls to `relocatePOI` to pass `state.pois`.
- **TurretLogic.ts**:
    - Updated `relocateTurretsToArena` to use `findSafePoiPosition`.
