# Enemy Visuals & Palette Update

## 5-Minute Era Palette Sweep
The enemy rendering system now correctly implements a "sweep" or "shift" in shell visibility every 5 minutes within each 15-minute era.

- **0-5 Minutes**: Core is bright (1.0 alpha), Inner shell is dim (0.25 alpha), Outer shell is missing.
- **5-10 Minutes**: Core is dim (0.3 alpha), Inner shell is bright (1.0 alpha), Outer shell is partially visible (0.6 alpha).
- **10-15 Minutes**: Core is bright (1.0 alpha), Inner shell is dim (0.35 alpha), Outer shell is bright (1.0 alpha).

This creates a dynamic visual progression that signals the game's internal difficulty stages.

## Premium Color Palettes
Updated the global color palettes to use curated, high-contrast hex codes for a more premium look:

- **Green**: Emerald tones (`#4ade80`, `#22c55e`, `#166534`)
- **Blue**: Sapphire tones (`#60a5fa`, `#3b82f6`, `#1e40af`)
- **Purple**: Amethyst tones (`#c084fc`, `#a855f7`, `#6b21a8`)
- **Orange**: Amber tones (`#fb923c`, `#f97316`, `#9a3412`)
- **Red**: Ruby/Crimson tones (`#f87171`, `#ef4444`, `#991b1b`)

## Elite Pentagon & Drone Visuals
Special attention was given to the Pentagon-based enemies (Elite Pentagons and Pentagon Boss Drones/Rockets).

- **Ghostly Blue Style**: Added a cyan/blue holographic glow to Elite Pentagons and their projectiles.
- **Blue Trails**: Pentagon drones/rockets now leave blue-cyan energy trails instead of orange/yellow ones, matching the ghostly tech aesthetic.
- **Fixed Era Colors**: Corrected the indexing of era-based colors to ensure enemies are not "dim gray-green" but use their intended vibrant colors at full intensity where appropriate.
