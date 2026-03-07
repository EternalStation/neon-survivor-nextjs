# Enemy Visuals Redesign

The enemy visuals have been overhauled to provide a more "Neon" and structured appearance, especially during later game stages (5-10 min, 20-25 min, etc.).

## Visual Structure

Each enemy now consists of four distinct visual layers:

1.  **Outline**: A crisp, high-contrast outer stroke that defines the enemy's shape. It scales with the enemy's size and "era" palette.
2.  **Body**: A semi-transparent fill of the main shape, providing volume without overshadowing the core.
3.  **Inner Ring**: A pulsing circular ring located between the core and the outer boundary. This represents the "containment field" or internal energy structure.
4.  **Power Core**: A glowing central part that matches the outer shape of the enemy. The core has a strong "neon glow" (shadow blur) effect.

## Era Palettes (Neon Overhaul)

The color palettes for each 15-minute era have been updated to use high-saturation neon colors:

| Era | Primary Color | Description |
| :--- | :--- | :--- |
| 0-15 Min | **Neon Green** | Vivid Green (#4ade80) core, Emerald body, Deep Forest outline. |
| 15-30 Min | **Cyber Blue** | Cyan core, Royal Blue body, Midnight Blue outline. |
| 30-45 Min | **Void Purple** | Lavender core, Vibrant Purple body, Deep Violet outline. |
| 45-60 Min | **Solar Orange** | Cream core, Bright Orange body, Burnt Sienna outline. |
| 60+ Min | **Crimson Red** | Soft Pink core, Vivid Red body, Maroon outline. |

## Dynamic Visibility & Shell Stages

The visual look of enemies evolves every 5 minutes within an era (Stage 0, 1, and 2). Each stage now has unique rendering logic:

*   **Stage 0 (0-5, 15-20 min...)**: **"Raw Core"**. Focuses on the central power core. The core is larger (45% of size) and has a stronger glow. The outer armor is very faint.
*   **Stage 1 (5-10, 20-25 min...)**: **"Energy Flux"**. Focuses on the **Inner Ring**. The ring pulses more aggressively and is thicker (2px). The core dims significantly as energy flows outward.
*   **Stage 2 (10-15, 25-30 min...)**: **"Hardened Shell"**. Focuses on structural integrity. Features a **Double Outline** (a secondary ghost border) and an increased line width (2.5px) for the main shell. The core remains stable.
