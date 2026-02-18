import type { GameState } from '../../core/types';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../../mission/MapLogic';
import { drawCurvedText } from './TextHelper';

export function renderBackground(ctx: CanvasRenderingContext2D, state: GameState, logicalWidth: number, logicalHeight: number) {
    const { camera } = state;

    const visibleArenas = state.portalsUnlocked
        ? ARENA_CENTERS
        : ARENA_CENTERS.filter(c => c.id === 0);

    // BACKGROUND GRID (Hexagons)
    const drawHexGrid = (r: number) => {
        const hDist = 1.5 * r;
        const vDist = Math.sqrt(3) * r;

        const scale = 0.58;
        const vW = logicalWidth / scale;
        const vH = logicalHeight / scale;
        const cX = camera.x;
        const cY = camera.y;

        const startX = Math.floor((cX - vW / 2) / hDist) - 1;
        const endX = Math.ceil((cX + vW / 2) / hDist) + 1;
        const startY = Math.floor((cY - vH / 2) / vDist) - 1;
        const endY = Math.ceil((cY + vH / 2) / vDist) + 2;

        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.3)';

        for (let i = startX; i <= endX; i++) {
            for (let j = startY; j <= endY; j++) {
                const x = i * hDist;
                const y = j * vDist + (i % 2 === 0 ? 0 : vDist / 2);

                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const ang = (Math.PI / 3) * k;
                    const px = x + r * Math.cos(ang);
                    const py = y + r * Math.sin(ang);
                    if (k === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    };

    // Clip the grid to only draw inside arenas
    ctx.save();
    ctx.beginPath();
    visibleArenas.forEach(c => buildHexPath(ctx, c, ARENA_RADIUS));
    ctx.clip();

    drawHexGrid(120);
    ctx.restore();
}

export function renderMapBoundaries(ctx: CanvasRenderingContext2D, state: GameState) {
    const visibleArenas = state.portalsUnlocked
        ? ARENA_CENTERS
        : ARENA_CENTERS.filter(c => c.id === 0);

    ctx.save();

    // Defensive Reset: Ensure no leaked shadows or styles cause "blinking"
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.filter = 'none';

    // Set Map Boundary Styles
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 30;
    ctx.globalAlpha = 0.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    visibleArenas.forEach(c => buildHexPath(ctx, c, ARENA_RADIUS));
    ctx.stroke();

    ctx.restore();
}



// Reusable path builder for performance
function buildHexPath(ctx: CanvasRenderingContext2D, center: { x: number, y: number }, r: number) {
    for (let i = 0; i < 6; i++) {
        const ang = Math.PI / 3 * i;
        const hx = center.x + r * Math.cos(ang);
        const hy = center.y + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
}

export function renderArenaVignette(ctx: CanvasRenderingContext2D, state: GameState) {
    const visibleArenas = state.portalsUnlocked
        ? ARENA_CENTERS
        : ARENA_CENTERS.filter(c => c.id === 0);

    ctx.save();

    // OPTIMIZATION: "Solid Void" removed.
    // The background grid is now clipped to the arenas, and the screen is cleared to black.
    // So the void is naturally black without needing this expensive "evenodd" fill.

    // Draw Arena Labels (Curved) - REMOVED PER USER REQUEST
    /*
    const r = 120;
    const hDist = 1.5 * r;
    const vDist = Math.sqrt(3) * r;

    // ECO
    drawCurvedText(ctx, 'ECONOMIC', -hDist * 6, 0, 400, Math.PI, '#fbbf24');

    // COM
    drawCurvedText(ctx, 'COMBAT', hDist * 6, 0, 400, 0, '#f87171');

    // DEF - Top Center
    drawCurvedText(ctx, 'DEFENSE', 0, -vDist * 7, 400, -Math.PI / 2, '#60a5fa', true);
    */
}

export function renderPortals(ctx: CanvasRenderingContext2D, state: GameState) {
    if (state.portalState === 'closed') return;

    PORTALS.forEach(p => {
        // Only render outgoing portals from the current arena.
        // Incoming portals are covered by their own definitions (e.g., 1->0 is separate from 0->1).
        if (p.from !== state.currentArena) return;

        const center = ARENA_CENTERS.find(c => c.id === p.from);
        if (!center) return;

        const wall = getHexWallLine(center.x, center.y, ARENA_RADIUS, p.wall);

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.strokeStyle = p.color;

        ctx.lineCap = 'round';

        if (state.portalState === 'warn') {
            // Subtle pulse instead of aggressive flashing
            ctx.globalAlpha = 0.7 + Math.sin(state.gameTime * 5) * 0.2;
            ctx.setLineDash([50, 50]);
            ctx.lineWidth = 10;
        } else {
            // Solid, thick line for open state
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 18;
        }

        ctx.beginPath();
        ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
        ctx.stroke();

        ctx.restore();
    });
}

export function renderCorruption(ctx: CanvasRenderingContext2D, state: GameState) {
    // Deprecated: Now handled directly by renderBackground via hex coloring.
    // Keeping function stub if called elsewhere, but empty.
}
