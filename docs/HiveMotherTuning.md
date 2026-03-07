# Hive Mother Nanite Tuning

## Nanite Damage Overhaul
- **Damage Logic**: Nanites now deal damage based on a percentage of the enemy's Maximum HP.
- **Scaling**: Each nanite applies 5% of Max HP per second.
- **Duration**: The slow effect and damage-over-time from nanites now last indefinitely (until enemy death).
- **Application**: Nanites from the cloud/spit skill are applied instantly to all enemies in the radius.
- **Instance Protection**: Each enemy can only be affected by one nanite per cloud instance (spit cast), ensuring balanced application and preventing unintentional stack multiplication from a single cast.

## Stat Changes
- **Aegis**: Base HP bonus increased to 30%, HP Regen bonus increased to 15%.
- **Hive Mother**: Initial nanite count from Cloud skill reduced to 3 (previously 4).

## Damage Attribution
- **Nanite Swarm Tracking**: Nanite damage-over-time is now accurately tracked and attributed to the "Nanite Swarm" source in the game's statistics menu.
- **UI Labeling**: Improved dynamic translation support for damage source groups in the statistics menu.
