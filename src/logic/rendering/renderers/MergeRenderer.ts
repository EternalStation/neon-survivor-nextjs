
import type { GameState, Enemy } from '../../core/Types';
import { GAME_CONFIG } from '../../core/GameConfig';

export function renderMergeConnections(ctx: CanvasRenderingContext2D, state: GameState) {
    const { enemies, gameTime } = state;

    // Group enemies by mergeId
    const mergeGroups = new Map<string, Enemy[]>();
    for (const e of enemies) {
        if (e.dead || !e.mergeId || e.mergeState !== 'warming_up') continue;
        if (!mergeGroups.has(e.mergeId)) mergeGroups.set(e.mergeId, []);
        mergeGroups.get(e.mergeId)!.push(e);
    }

    ctx.save();

    mergeGroups.forEach((group, mergeId) => {
        const host = group.find(e => e.mergeHost) || group[0];
        const remainingTime = (host.mergeTimer || 0) - gameTime;
        const totalTime = GAME_CONFIG.ENEMY.MERGE_TIMER;
        const progress = 1 - Math.max(0, Math.min(1, remainingTime / totalTime));

        const pulse = Math.sin(gameTime * 20) * 0.5 + 0.5;
        const linkColor = host.shape === 'pentagon' ? '#22d3ee' : '#a78bfa';

        // 1. Draw Connecting Beams with Flowing Energy
        group.forEach(m => {
            if (m === host) return;

            ctx.beginPath();
            ctx.moveTo(host.x, host.y);
            ctx.lineTo(m.x, m.y);

            // Background faint beam
            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 1 + pulse;
            ctx.globalAlpha = 0.1 * (progress + 0.5);
            ctx.stroke();

            // Flowing particles along the line
            const dx = m.x - host.x;
            const dy = m.y - host.y;
            const dist = Math.hypot(dx, dy);
            const particleCount = 2;
            for (let i = 0; i < particleCount; i++) {
                const shift = (gameTime * 2 + i * 0.5) % 1.0;
                // Move from member (1.0) to host (0.0)
                const t = 1.0 - shift;
                const px = host.x + dx * t;
                const py = host.y + dy * t;

                ctx.beginPath();
                ctx.arc(px, py, 2 + pulse, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.3 + pulse * 0.3;
                ctx.fill();
            }

            // Member anchor glow
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size * (0.5 + pulse * 0.2), 0, Math.PI * 2);
            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + pulse * 0.4;
            ctx.stroke();
        });

        // 2. Host "Singularity" Effect
        ctx.save();
        ctx.translate(host.x, host.y);
        ctx.rotate(gameTime * 5);

        // Swirling formation
        for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);
            ctx.beginPath();
            const ringR = host.size * (1.2 + progress * 0.8 + Math.sin(gameTime * 10 + i) * 0.1);
            ctx.arc(ringR, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = linkColor;
            ctx.globalAlpha = 0.6 + pulse * 0.4;
            ctx.fill();

            // Connection to host
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(ringR, 0);
            ctx.strokeStyle = linkColor;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.restore();

        // 3. Warning Circle and Pulse
        ctx.beginPath();
        const warnR = host.size * 2 * (1 - progress * 0.5);
        ctx.arc(host.x, host.y, warnR, 0, Math.PI * 2);
        ctx.strokeStyle = remainingTime < 1.0 ? '#ff0000' : linkColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = gameTime * 20;
        ctx.globalAlpha = 0.4 + pulse * 0.4;
        ctx.stroke();
        ctx.setLineDash([]);

        // Progress Text
        const pct = Math.floor(progress * 100);
        ctx.font = '800 14px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.8;
        ctx.fillText(`MERGING: ${pct}%`, host.x, host.y + host.size * 2.5);

        if (remainingTime < 1.0) {
            ctx.font = 'bold 16px Orbitron';
            ctx.fillStyle = '#ff4444';
            ctx.globalAlpha = pulse;
            ctx.fillText('WARNING', host.x, host.y - host.size * 3);
        }
    });

    ctx.restore();
}
