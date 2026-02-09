import type { GameState } from '../../core/types';

export function renderProjectiles(ctx: CanvasRenderingContext2D, state: GameState) {
    const { bullets, enemyBullets, player } = state;
    const isMalware = player.playerClass === 'malware';

    // -------------------------------------------------------------------------
    // RENDER PLAYER BULLETS
    // -------------------------------------------------------------------------
    bullets.forEach(b => {
        // --- STRICT RESET (User Request: "Rewritin oclorung fir them from 0") ---
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';

        // --- SPECIFIC MALWARE LOGIC ---
        // Ensure Malware bullets NEVER look like Nanites (Green-400), even if flags get mixed up

        // --- AIGIS RING VISUALIZATION ---
        if (b.isRing && b.ringRadius) {
            const intensity = Math.min(1.5, Math.max(0.5, (b.ringAmmo || 200) / 200));

            // Glow
            ctx.shadowBlur = 15 * intensity;
            ctx.shadowColor = b.color || '#22d3ee';

            // Main Ring
            ctx.strokeStyle = b.color || '#22d3ee';
            ctx.lineWidth = 4 * intensity;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner faint ring
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.ringRadius - 5, 0, Math.PI * 2);
            ctx.stroke();

            // Rotating "Energy" effect
            ctx.beginPath();
            ctx.setLineDash([20, 60]); // Dash pattern
            ctx.lineDashOffset = -state.gameTime * 5; // Rotation speed
            ctx.arc(b.x, b.y, b.ringRadius + 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            ctx.restore();
            return; // Skip default bullet rendering
        }

        if (isMalware || !b.isNanite) {
            // Priority: Malware Bounce Color > Bullet Color > Default Cyan
            // Malware `projectileLogic` already sets b.color to Orange/Red on bounce.
            // Initial color is Player Theme (#d946ef - Pink/Purple).
            const mainColor = b.color || '#22d3ee';

            // 1. Draw Trails (if any, specifically for Malware mostly)
            if (b.trails && b.trails.length > 0) {
                b.trails.forEach((pos, idx) => {
                    // Fade out trail
                    const alpha = 0.5 * (1 - idx / b.trails!.length);
                    const trailSize = b.size * (0.9 - (idx / b.trails!.length) * 0.4);

                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = mainColor; // Matched to bullet state color
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                });
                // Reset Alpha
                ctx.globalAlpha = 1.0;
            }

            // 2. Draw Main Bullet
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();

        } else if (b.isNanite) {
            // --- HIVE MOTHER / NANITE LOGIC (Only if explicit and NOT Malware override) ---
            const naniteColor = b.color || '#4ade80'; // Green

            ctx.shadowColor = naniteColor;
            ctx.shadowBlur = 5;
            ctx.fillStyle = naniteColor;

            const count = 6;
            const swarmRadius = b.size * 2.5;

            for (let i = 0; i < count; i++) {
                const t = state.gameTime * 5 + b.id;
                const offsetPhase = i * ((Math.PI * 2) / count);
                const r = swarmRadius * (0.4 + 0.3 * Math.sin(t * 3 + offsetPhase));
                const theta = t * 2 + offsetPhase;
                const nx = b.x + Math.cos(theta) * r;
                const ny = b.y + Math.sin(theta) * r;

                ctx.beginPath();
                ctx.rect(nx - 1, ny - 1, 2, 2);
                ctx.fill();
            }

            // Tiny core
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();
    });

    // -------------------------------------------------------------------------
    // RENDER ENEMY BULLETS
    // -------------------------------------------------------------------------
    enemyBullets.forEach(b => {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 0;
        ctx.globalCompositeOperation = 'source-over';

        ctx.fillStyle = b.color || '#ef4444';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });
}
