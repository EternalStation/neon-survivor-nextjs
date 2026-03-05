# Fusion Menu Redesign

## Overview
The Legendary Fusion Menu has been completely redesigned with a premium, immersive visual experience. The new design features animated backgrounds, expandable card details, and dramatic visual feedback for fusion readiness.

## Visual Features

### Backdrop
- **Animated scanlines** - subtle CRT-style scanlines that scroll vertically
- **Dot-grid pattern** - a faint cyberpunk grid across the entire background  
- **Central glow** - soft radial gradient emanating from center
- **Radial gradient** - dark premium background with depth

### Header
- **Gradient text** - "FUSION FORGE" rendered with a cyan gradient (WebkitBackgroundClip)
- **Protocol label** - "PROTOCOL // LEGENDARY" subtitle for tactical atmosphere
- **SVG divider** - custom arrow/diamond ornament separator
- **Live status counters** - "READY" and "PARTIAL" counts with pulsing indicator dots

### Fusion Cards
- **Staggered entrance** - cards animate in with 80ms delay per card (translateY + scale + opacity)
- **Category-colored accents** - top bar gradient matches fusion category colors (Economic=gold, Combat=red, Defensive=blue)
- **Status badges** - READY (green), PARTIAL (amber), LOCKED (gray), CONSUMED (red)
- **Square icon frames** - rounded-corner frames for each hex icon with active bottom-glow indicators
- **SVG energy connectors** - animated arrow connectors between base hexes → result hex
- **Expandable details** - clicking a card reveals description text, category badges, and the FUSE button
- **Result hex glow** - ready-to-fuse result icons pulse with cyan inner shadow

### Sorting
- Ready fusions appear first
- Consumed fusions are pushed to the bottom with grayscale filter
- Partial fusions fill the middle

### Interactions
- Cards scale up slightly on selection (1.03x)
- Fuse button has hover lift + glow intensification
- Close button has hover border/glow transition

## File
- `src/components/modules/FusionMenu.tsx` (543 lines)
