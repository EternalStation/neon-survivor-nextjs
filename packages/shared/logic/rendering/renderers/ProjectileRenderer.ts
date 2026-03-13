import type { GameState } from '../../core/Types';

export function renderProjectiles(ctx: CanvasRenderingContext2D, state: GameState) {
    const { bullets, enemyBullets, player } = state;
    const isMalware = player.playerClass === 'malware';

    
    
    
    bullets.forEach(b => {
        
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'transparent';
        ctx.lineWidth = 0;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';

        
        

        
        
        if (b.isShockwaveCircle) {
            ctx.restore();
            return;
        }

        
        if (b.isRing && b.ringRadius) {
            const baseIntensity = Math.min(1.5, Math.max(0.5, (b.ringAmmo || 200) / 200));
            const intensity = b.ringVisualIntensity ? baseIntensity * b.ringVisualIntensity : baseIntensity;

            
            ctx.shadowBlur = 15 * intensity;
            ctx.shadowColor = b.color || '#22d3ee';

            
            ctx.strokeStyle = b.color || '#22d3ee';
            ctx.lineWidth = 4 * intensity;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.ringRadius - 5, 0, Math.PI * 2);
            ctx.stroke();

            
            ctx.beginPath();
            ctx.setLineDash([20, 60]); 
            ctx.lineDashOffset = -state.gameTime * 5; 
            ctx.arc(b.x, b.y, b.ringRadius + 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;

            ctx.restore();
            return; 
        }

        if (b.isMist) {
            
            const alpha = 0.3 * (b.life / 40);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = b.color || '#bae6fd';
            ctx.shadowBlur = 10;
            ctx.shadowColor = b.color || '#bae6fd';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        if (isMalware || !b.isNanite) {
            
            
            
            const mainColor = b.color || '#22d3ee';

            
            if (b.trails && b.trails.length > 0) {
                b.trails.forEach((pos, idx) => {
                    
                    const alpha = 0.5 * (1 - idx / b.trails!.length);
                    const trailSize = b.size * (0.9 - (idx / b.trails!.length) * 0.4);

                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = mainColor; 
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                ctx.globalAlpha = 1.0;
            }

            
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();

        } else if (b.isNanite) {
            
            const naniteColor = b.color || '#4ade80'; 

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

            
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        }

        ctx.restore();
    });

    
    
    
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
