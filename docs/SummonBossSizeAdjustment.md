# Boss Size Adjustment

The physical collision size and visual size of the "summon boss" (The Omega) have been reduced by 30% to match user requirements.

## EnemySpawnLogic.ts
- Modified the base size calculation for the Boss instance of `pentagon`.
- `Math.floor(baseSizeRaw * 0.7)` is applied, ensuring both visual rendering and hitbox collision (`e.size + 18`) are updated seamlessly.

## Hive-Mother Active Skill Cast Range
Note: The Hive-Mother active skill has already been updated to cast its `nanite_cloud` directly at the user's cursor (`mousePos`), behaving identically to the Malware skill's distance aiming feature. Ensure you test the latest version to view this change.
