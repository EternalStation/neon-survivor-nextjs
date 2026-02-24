# Project Rules & Guidelines

This document contains the core rules that the AI assistant must follow for every change, suggestion, or implementation.

## 1. File Length & Modularization
- **Maximum Line Limit**: No file should exceed **800 lines**.
- **Post-Edit Verification**: After every edit, verify if the file length has exceeded this limit.
- **Rule**: If a file exceeds (or is approaching) 800 lines, it must be split into logical sub-modules or parts.
- **Goal**: Facilitate easier navigation, maintainability, and more efficient AI processing (matching the 800-line tool visibility limit).

## 2. Cheat Codes
The following cheat codes must always be functional in the game:
- **Level Up**: `lvl`
- **Die**: `k1`
- **Meteorites**: `m1` to `m6` (Rarities: Anomalous, Radiant, Abyss, Eternal, Divine, Singularity)
- **Spawn Snitch**: `sni`
- **Spawn Legion**: `z1`
- **Spawn Horde**: `z2`
- **Spawn Worm**: `z3`
- **Spawn Glitcher**: `gli`
- **Spawn Blueprints**: `o1` to `o12`
    - `o1`: Meteor Shower
    - `o2`: Neural Overclock
    - `o3`: Stasis Field
    - `o4`: Perk Resonance
    - `o5`: Arena Surge
    - `o6`: Quantum Scrapper
    - `o7`: Matrix Overdrive
    - `o8`: Temporal Guard
    - `o9`: Dimensional Gate
    - `o10`: Sector Override: ECO
    - `o11`: Sector Override: COM
    - `o12`: Sector Override: DEF
- **Spawn Bosses**: `b[Type][Level]` (e.g., `b11` for Circle Lvl 1)
    - `b11`-`b14`: Circle Boss (Lvl 1-4)
    - `b21`-`b24`: Triangle Boss (Lvl 1-4)
    - `b31`-`b34`: Square Boss (Lvl 1-4)
    - `b41`-`b45`: Diamond Boss (Lvl 1-5)
    - `b51`-`b54`: Pentagon Boss (Lvl 1-4)
- **Give 5100 Dust**: `ko`
- **Give 1000 Flux**: `kp`
- **Open Admin Console**: `bug`

---

*Note: These rules are checked before every implementation.*

