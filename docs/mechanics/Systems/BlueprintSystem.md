# Blueprint System

The Blueprint System allows pilots to archive and deploy advanced tactical protocols. Blueprints are discovered in the world as encrypted datasets and can be researched in the Blueprint Bay to become ready for deployment.

## Core Mechanics

### Discovery and Research
- Blueprints are found as items in the world.
- Once collected, they appear in the inventory with a 'locked' status.
- Pilots must right-click a blueprint to begin the decryption process.
- Decryption takes a set amount of time (Research Duration).

### Activation Protocol
- A blueprint can be activated from the inventory once research is complete by paying its Dust cost.
- **Immediate Removal**: Upon activation, the blueprint is immediately removed from the pilot's inventory. No scrap bonus is granted for activated blueprints.
- **Mutual Exclusivity**: Pilots can only have one active blueprint buff at a time. Activating a new blueprint (except Quantum Scrapper) is prohibited if another protocol is currently running.
- **Quantum Scrapper Exception**: The Quantum Scrapper blueprint is the only protocol that can be active alongside others. It provides a bonus to recycling meteorites.

### Blueprint Stacking
- The **Quantum Scrapper** blueprint supports stacking.
- Activating a new Quantum Scrapper while one is already active adds its charges to the existing amount.
- Example: If a pilot has 30 recycles left and activates a new blueprint providing 50, they will have 80 recycles remaining.

## Blueprint Types

| Type | Name | Effect | Duration |
| :--- | :--- | :--- | :--- |
| METEOR_SHOWER | Meteor Shower | Triggers a localized meteorite storm. | 300s |
| NEURAL_OVERCLOCK | Neural Overclock | Enhances pilot reaction speed and fire rate. | 180s |
| STASIS_FIELD | Stasis Field | Creates a field that slows down time for enemies. | 120s |
| QUANTUM_SCRAPPER | Quantum Scrapper | Increases dust gained from recycling meteorites. | 50 Recycles (Stackable) |
| DIMENSIONAL_GATE | Dimensional Gate | Unlocks portal navigation between sectors permanently. | Permanent |
| SECTOR_UPGRADE | Sector Upgrades | Permanently upgrades sector attributes (Eco, Com, Def). | Permanent |
| TEMPORAL_GUARD | Temporal Guard | Provides a shield that absorbs damage over time. | 240s |

## Blueprint Bay
The Blueprint Bay is a specialized lab module where blueprints are managed. It includes:
- **Recalibration Scanner**: Used for analyzing and upgrading meteorites.
- **Forge Complex**: The industrial center where blueprints are processed.
- **Status Hub**: Monitores active protocols and energy levels.
