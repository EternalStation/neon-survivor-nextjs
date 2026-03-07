import type { GameState } from '../../core/types';
import { GAME_CONFIG } from '../../core/GameConfig';

export function renderSandbox(ctx: CanvasRenderingContext2D, state: GameState) {
    const { player } = state;
    if (!player.sandboxActive || !player.sandboxUntil) return;

    const now = state.gameTime;
    const timeLeft = player.sandboxUntil - now;
    if (timeLeft <= 0) return;

    const cx = player.sandboxX ?? player.x;
    const cy = player.sandboxY ?? player.y;
    const R = GAME_CONFIG.SKILLS.SANDBOX_RADIUS;
    const duration = GAME_CONFIG.SKILLS.SANDBOX_DURATION;

    const fadeAlpha = timeLeft < 0.5 ? timeLeft / 0.5 : 1.0;
    const pulse = 0.8 + Math.sin(now * 8) * 0.2;
    const color = '#d946ef';
    const accent = '#f5d0fe';

    const renderBox = (radius: number, rotation: number, lineWidth: number, alpha: number, isAccent = false) => {
        const vertices: { x: number; y: number }[] = [];
        const sides = 6;
        for (let i = 0; i < sides; i++) {
            const angle = rotation + (Math.PI * 2 * i) / sides;
            vertices.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
        }

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let i = 1; i < sides; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
        ctx.closePath();

        ctx.globalAlpha = alpha * fadeAlpha;
        if (isAccent) {
            ctx.strokeStyle = accent;
            ctx.shadowColor = accent;
        } else {
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
        }
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        if (alpha > 0.1 && !isAccent) {
            ctx.globalAlpha = 0.05 * fadeAlpha;
            ctx.fillStyle = color;
            ctx.fill();
        }
    };

    ctx.save();
    ctx.shadowBlur = 20 * pulse;

    const stableRotation = -Math.PI / 2;
    renderBox(R, stableRotation, 4, 0.9 * pulse);
    renderBox(R * 0.7, -stableRotation, 2, 0.6);

    for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.2 * fadeAlpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const r = R + 4;
        const sides = 6;
        for (let j = 0; j < sides; j++) {
            const a = stableRotation + (Math.PI * 2 * j) / sides;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    const progress = timeLeft / duration;
    ctx.globalAlpha = 0.7 * fadeAlpha;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

