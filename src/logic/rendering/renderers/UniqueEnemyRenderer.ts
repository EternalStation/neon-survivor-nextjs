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
        const t = state.gameTime;
        const isUnderground = e.wormBurrowState === 'underground';
        const moveAngle = (e.vx && e.vy) ? Math.atan2(e.vy, e.vx) : 0;
        ctx.save();
        if (e.wormRole === 'head') {
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = innerColor;
            ctx.fill();
            ctx.strokeStyle = outerColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            const activeEyesColor = isUnderground ? '#000000' : '#ff0000';
            ctx.fillStyle = activeEyesColor;
            ctx.beginPath();
            ctx.arc(Math.cos(moveAngle + 0.3) * e.size * 0.8, Math.sin(moveAngle + 0.3) * e.size * 0.8, 4, 0, Math.PI * 2);
            ctx.arc(Math.cos(moveAngle - 0.3) * e.size * 0.8, Math.sin(moveAngle - 0.3) * e.size * 0.8, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = innerColor;
            ctx.fill();
            ctx.strokeStyle = outerColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
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
