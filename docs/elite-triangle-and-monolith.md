# Elite Triangle Update

- **Charging Behavior**: Elite Triangles now charge for 2 seconds at 1.75x speed.
- **Visuals**: Removed the red particle trail ("red lines") during the charge phase to keep the model clean.
- **Animation**: Confirmed that the triangle "just spins" rapidly during the dash/charge phase as requested.

# Temporal Monolith Fusion Fix

- **Fusion Logic**: Fixed a bug where the Temporal Monolith skill was not appearing in the active skills bar after fusion. The skill is now correctly added to the `activeSkills` array and assigned a keybind.
- **Freeze Mechanic**: The skill now freezes ALL enemies, including bosses, for 4 seconds.
- **Cooldown**: Updated the cooldown to 18 seconds (down from 30s).
- **Shatter Effect**: Added the "Temporal Shatter" visual effect where frozen enemies explode on death, dealing 25% Max HP damage to nearby foes. This effect now also applies to bosses.
