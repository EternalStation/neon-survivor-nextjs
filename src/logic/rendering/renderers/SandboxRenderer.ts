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
    const pulse = 0.7 + Math.sin(now * 6) * 0.3;

    const vertices: { x: number; y: number }[] = [];
    for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / 5;
        vertices.push({ x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) });
    }

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 5; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();

    ctx.globalAlpha = 0.08 * fadeAlpha;
    ctx.fillStyle = '#fb923c';
    ctx.fill();

    ctx.globalAlpha = 0.85 * fadeAlpha * pulse;
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 18;
    ctx.stroke();

    const progress = timeLeft / duration;
    ctx.globalAlpha = 0.5 * fadeAlpha;
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}
