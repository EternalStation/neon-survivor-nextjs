import type { GameState, Enemy } from '../../core/types';
import { spawnParticles } from '../../effects/ParticleLogic';

export function renderUniqueEnemy(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState, meteoriteImages: Record<string, HTMLImageElement>, innerColor: string, outerColor: string, coreColor: string) {
    if (e.isZombie) {
        const zombieImg = (meteoriteImages as any).zombie;
        if (zombieImg && zombieImg.complete) {
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#4ade80';
            const zSize = e.size * 2;
            if (e.zombieState === 'rising') {
                const now = state.gameTime * 1000;
                const progress = 1 - Math.max(0, ((e.zombieTimer || 0) - now) / 1500);
                const shake = (1 - progress) * 12;
                ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
                if (progress > 0.3) {
                    const zProgress = (progress - 0.3) / 0.7;
                    ctx.globalAlpha = zProgress;
                    ctx.translate(0, (1 - zProgress) * 35);
                    ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                }
            } else if (e.zombieState !== 'dead') {
                const isMovingRight = (e.vx || 0) > 0.1;
                ctx.save();
                if (isMovingRight) ctx.scale(-1, 1);
                ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                ctx.restore();
            }
            ctx.restore();
        }
        return true;
    }

    if (e.shape === 'worm') {
        const isPromoDormant = e.wormPromotionTimer && state.gameTime < (e.wormPromotionTimer || 0);
        const isHead = e.wormRole === 'head' && !isPromoDormant;
        const t = state.gameTime;
        const isUnderground = e.wormBurrowState === 'underground';
        const alphaMult = isUnderground ? 0.35 : (isPromoDormant ? 0.5 : 1.0);

        const dim = (hex: string) => {
            if (isUnderground) return hex + '88';
            return hex;
        };

        const rawMoveAngle = (e.vx && e.vy) ? Math.atan2(e.vy, e.vx) : 0;
        const moveAngle = rawMoveAngle - (e.rotationPhase || 0);
        const headColor = dim(innerColor);
        const outlineColor = dim(outerColor);
        const eyesColor = dim(coreColor);

        ctx.save();
        if (isHead) {
            ctx.globalAlpha *= alphaMult;

            // 1. Mandibles / Jaws
            const drawMandible = (side: number) => {
                const open = Math.sin(t * 15) * 0.4 + 0.5;
                const ang = moveAngle + (0.7 + open) * side;

                ctx.beginPath();
                ctx.strokeStyle = headColor;
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';
                ctx.moveTo(Math.cos(moveAngle + 0.4 * side) * e.size * 0.8, Math.sin(moveAngle + 0.4 * side) * e.size * 0.8);

                const j1x = Math.cos(ang) * e.size * 1.5;
                const j1y = Math.sin(ang) * e.size * 1.5;
                ctx.lineTo(j1x, j1y);

                const tipAng = ang + 0.8 * side;
                const tX = j1x + Math.cos(tipAng) * e.size * 0.8;
                const tY = j1y + Math.sin(tipAng) * e.size * 0.8;
                ctx.lineTo(tX, tY);
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = eyesColor;
                for (let i = 0; i < 3; i++) {
                    const p = 0.3 + i * 0.3;
                    const sx = j1x * (1 - p) + (Math.cos(moveAngle + 0.4 * side) * e.size * 0.8) * p;
                    const sy = j1y * (1 - p) + (Math.sin(moveAngle + 0.4 * side) * e.size * 0.8) * p;
                    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                }
                ctx.fill();
            };
            drawMandible(1);
            drawMandible(-1);

            // 2. Skull Shape
            ctx.beginPath();
            const skullSteps = 8;
            for (let i = 0; i <= skullSteps; i++) {
                const ang = moveAngle + (i / skullSteps - 0.5) * Math.PI * 1.2;
                const r = e.size * (1.2 + Math.sin(t * 10 + i) * 0.1);
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.lineTo(Math.cos(moveAngle + Math.PI) * e.size * 0.5, Math.sin(moveAngle + Math.PI) * e.size * 0.5);
            ctx.closePath();
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = '#111827';
            ctx.fill();

            // 3. Multiple Eyes
            const eyePos = [
                { a: 0.2, d: 0.8, s: 4 }, { a: -0.2, d: 0.8, s: 4 },
                { a: 0.5, d: 0.6, s: 2 }, { a: -0.5, d: 0.6, s: 2 },
                { a: 0, d: 1.1, s: 3 }
            ];

            const isCharging = (e as any).wormAIState === 'charging' && !isUnderground;
            const activeEyesColor = isCharging ? '#ff0000' : eyesColor;
            const finalEyesColor = isUnderground ? activeEyesColor + '88' : activeEyesColor;

            ctx.shadowBlur = isUnderground ? 5 : 15;
            ctx.shadowColor = finalEyesColor;
            ctx.fillStyle = finalEyesColor;
            eyePos.forEach(p => {
                const ep = (isCharging ? 1.2 : 0.8) + Math.sin(t * 10 + p.a * 5) * 0.2;
                ctx.beginPath();
                ctx.arc(Math.cos(moveAngle + p.a) * e.size * p.d, Math.sin(moveAngle + p.a) * e.size * p.d, p.s * ep, 0, Math.PI * 2);
                ctx.fill();
            });
        } else {
            // --- ARMORED DIAMOND SEGMENTS ---
            ctx.globalAlpha *= alphaMult;
            const rot = t * 3 + (e.wormSegmentIndex || 0) * 0.4;
            ctx.rotate(rot);

            ctx.beginPath();
            ctx.moveTo(0, -e.size * 1.2);
            ctx.lineTo(e.size * 0.8, 0);
            ctx.lineTo(0, e.size * 1.2);
            ctx.lineTo(-e.size * 0.8, 0);
            ctx.closePath();

            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = isUnderground ? 1.5 : 4;
            ctx.stroke();
            ctx.fillStyle = isUnderground ? '#0f172a' : '#1e293b';
            ctx.fill();

            if (!isUnderground) {
                ctx.beginPath();
                ctx.strokeStyle = headColor;
                ctx.lineWidth = 1;
                ctx.moveTo(-e.size * 0.4, 0);
                ctx.lineTo(e.size * 0.4, 0);
                ctx.moveTo(0, -e.size * 0.6);
                ctx.lineTo(0, e.size * 0.6);
                ctx.stroke();
            }
        }

        if (isUnderground) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for ripple
            ctx.translate(e.x - state.player.x + (ctx.canvas.width / 2), e.y - state.player.y + (ctx.canvas.height / 2));
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = outlineColor;
            ctx.setLineDash([4, 12]);
            ctx.beginPath();
            ctx.arc(0, 0, e.size * (1.5 + Math.sin(t * 5) * 0.2), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
        return true;
    }

    if (e.shape === 'glitcher') {
        const t = state.gameTime;
        const lineCount = 2;
        for (let i = 0; i < lineCount; i++) {
            ctx.save();
            const angle = (i / lineCount) * Math.PI * 2 + t * 5;
            const length = e.size * (1.8 + Math.sin(t * 20 + i) * 0.7);
            ctx.strokeStyle = i === 0 ? '#ff00ff' : '#00ffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
            ctx.restore();
        }
        return true;
    }

    return false;
}
