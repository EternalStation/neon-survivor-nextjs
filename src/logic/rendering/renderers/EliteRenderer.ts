import type { GameState, Enemy } from '../../core/types';

export function renderEliteEffects(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (!e.isElite) return;

    if (e.shape === 'diamond') {
        if (e.eliteState === 1) {
            ctx.save();
            const ang = e.dashState || 0;
            const remaining = (e.timer || 0) - state.gameTime;
            const isLocked = remaining <= 0.8;

            ctx.strokeStyle = e.palette[1];
            ctx.globalAlpha = isLocked ? 0.8 : 0.3;
            ctx.lineWidth = isLocked ? 3 : 1;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(ang) * 3000, e.y + Math.sin(ang) * 3000);
            ctx.stroke();

            const totalDuration = 1.4;
            const chargeProgress = Math.min(1, Math.max(0, 1 - (remaining / totalDuration)));
            const chargeSize = chargeProgress * 30;
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = (0.5 + Math.random() * 0.5) * (isLocked ? 1.0 : 0.7);
            ctx.beginPath();
            ctx.arc(e.x, e.y, chargeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (e.eliteState === 2 && e.lockedTargetX !== undefined && e.lockedTargetY !== undefined) {
            ctx.save();
            const pulse = 0.8 + Math.sin(state.gameTime * 20) * 0.2;
            const baseWidth = 4 * pulse;
            ctx.strokeStyle = e.palette[1]; ctx.lineWidth = baseWidth * 5; ctx.globalAlpha = 0.15;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.lineWidth = baseWidth * 2.5; ctx.globalAlpha = 0.35;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.strokeStyle = e.palette[0]; ctx.lineWidth = baseWidth; ctx.globalAlpha = 0.8;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = baseWidth * 0.3; ctx.globalAlpha = 1.0;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.restore();
        }
    }

    if (e.shape === 'pentagon') {
        ctx.save();
        ctx.translate(e.x, e.y);
        if (e.rotationPhase) ctx.rotate(e.rotationPhase);

        const glowSize = e.size * 2.2;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
        grad.addColorStop(0.5, 'rgba(34, 211, 238, 0.05)');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();

        if (state.frameCount % 5 === 0) {
            const rx = (Math.random() - 0.5) * e.size * 2;
            const ry = (Math.random() - 0.5) * e.size * 2;
            ctx.fillStyle = '#22d3ee';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(rx, ry, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}
