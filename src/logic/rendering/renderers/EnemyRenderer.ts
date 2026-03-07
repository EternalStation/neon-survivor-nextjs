import type { GameState, Enemy } from '../../core/types';
import { PALETTES } from '../../core/constants';
import { renderAnomalyAura, renderAnomalyStats, drawAbominationPath, renderBossSkills, renderLegionShield, renderBossBodyPre, renderBossBodyPost } from './BossRenderer';
import { renderEliteEffects } from './EliteRenderer';
import { renderUniqueEnemy } from './UniqueEnemyRenderer';
import { renderBossDistortion, drawDistortedBossShape, renderBossAfterglow } from './BossVisualFX';
import { renderCircleSoulSuck, renderOrbitalShield, renderDiamondBeamChargeUp, renderDiamondSatelliteStrike, renderPentagonSoulLinks, renderPentagonParasiteLink, renderPhalanxDrone } from './BossSkillRenderer';

export function renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    const { enemies, player } = state;
    const enemyMap = new Map<number, Enemy>();
    enemies.forEach(e => { if (!e.dead) enemyMap.set(e.id, e); });

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([]);

    enemies.forEach(e => {
        if (e.dead) return;
        if (e.isAnomaly) renderAnomalyAura(ctx, e, state);
        if (e.boss) {
            renderBossSkills(ctx, e, state);
            renderLegionShield(ctx, e, state);
            renderCircleSoulSuck(ctx, e, state);
            renderDiamondBeamChargeUp(ctx, e, state);
            renderDiamondSatelliteStrike(ctx, e, state);
            renderPentagonSoulLinks(ctx, e, state);
            renderPentagonParasiteLink(ctx, e, state);
        }
        renderEliteEffects(ctx, e, state);
    });

    enemies.forEach(e => {
        if (e.dead) return;
        ctx.save();
        ctx.translate(e.x, e.y);

        if (e.jitterX || e.jitterY) ctx.translate(e.jitterX || 0, e.jitterY || 0);

        const isSpinning = (player.orbitalVortexUntil && player.orbitalVortexUntil > state.gameTime && Math.hypot(e.x - player.x, e.y - player.y) < 800) ||
            (e.vortexRecoveryUntil && e.vortexRecoveryUntil > state.gameTime);
        const rotBase = isSpinning ? 0.25 : 0.01;
        e.rotationPhase = (e.rotationPhase || 0) + rotBase;

        if (e.rotationPhase) ctx.rotate(e.rotationPhase);

        const pulse = 1.0 + (Math.sin(e.pulsePhase || 0) * 0.05);
        ctx.scale(pulse, pulse);

        const p = e.palette || PALETTES[0].colors;
        const coreColor = e.eraPalette?.[2] || p[0];
        const innerColor = e.eraPalette?.[1] || p[1];
        const outerColor = e.eraPalette?.[0] || p[2];

        if (e.isPhalanxDrone) {
            renderPhalanxDrone(ctx, e, state);
            ctx.restore();
            return;
        }

        if ((e.type as string) === 'orbital_shield') {
            renderOrbitalShield(ctx, e, state);
            ctx.restore();
            return;
        }

        const isUnique = renderUniqueEnemy(ctx, e, state, meteoriteImages, innerColor, outerColor, coreColor);
        if (isUnique) {
            renderStatusOverlays(ctx, e, state);
            ctx.restore();
            return;
        }

        if (e.boss) {
            renderBossBodyPre(ctx, e, state, (s) => {
                ctx.beginPath();
                drawDistortedBossShape(ctx, e, s, state);
            });
        }

        ctx.beginPath();
        if (e.boss) {
            drawDistortedBossShape(ctx, e, e.size, state);
        } else {
            drawShapePath(ctx, e, e.size, state);
        }

        if (e.boss) {
            ctx.lineWidth = 6; ctx.strokeStyle = outerColor; ctx.globalAlpha = 0.4; ctx.stroke();
            ctx.lineWidth = 1.5; ctx.globalAlpha = 1.0;
        }
        ctx.strokeStyle = outerColor; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = innerColor; ctx.fill();

        if (e.boss) {
            renderBossBodyPost(ctx, e, state);
            renderBossDistortion(ctx, e, state);
            renderBossAfterglow(ctx, e, state);
        }

        ctx.fillStyle = coreColor;
        drawCore(ctx, e);
        ctx.fill();

        renderStatusOverlays(ctx, e, state);
        ctx.restore();

        if (e.isAnomaly) renderAnomalyStats(ctx, e, state);
    });
}

function drawShapePath(ctx: CanvasRenderingContext2D, e: Enemy, size: number, state: GameState) {
    if (e.shape === 'abomination') {
        drawAbominationPath(ctx, size, e, state);
        return;
    }

    switch (e.shape) {
        case 'circle': ctx.arc(0, 0, size, 0, Math.PI * 2); break;
        case 'triangle':
            ctx.moveTo(0, -size); ctx.lineTo(size * 0.866, size * 0.5); ctx.lineTo(-size * 0.866, size * 0.5);
            ctx.closePath(); break;
        case 'square': ctx.rect(-size, -size, size * 2, size * 2); break;
        case 'diamond':
            ctx.moveTo(0, -size * 1.3); ctx.lineTo(size, 0); ctx.lineTo(0, size * 1.3); ctx.lineTo(-size, 0);
            ctx.closePath(); break;
        case 'hexagon':
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI / 3) - Math.PI / 2;
                ctx.lineTo(Math.cos(ang) * size, Math.sin(ang) * size);
            }
            ctx.closePath(); break;
        case 'pentagon':
            for (let i = 0; i < 5; i++) {
                const ang = (i * 2 * Math.PI / 5) - Math.PI / 2;
                ctx.lineTo(Math.cos(ang) * size, Math.sin(ang) * size);
            }
            ctx.closePath(); break;
        case 'snitch': ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2); break;
        default: ctx.arc(0, 0, size, 0, Math.PI * 2);
    }
}

function drawCore(ctx: CanvasRenderingContext2D, e: Enemy) {
    const s = e.size * 0.5;
    ctx.beginPath();
    if (e.shape === 'circle') ctx.arc(0, 0, s, 0, Math.PI * 2);
    else if (e.shape === 'triangle') {
        ctx.moveTo(0, -s); ctx.lineTo(s * 0.866, s * 0.5); ctx.lineTo(-s * 0.866, s * 0.5); ctx.closePath();
    } else ctx.rect(-s / 2, -s / 2, s, s);
}

function renderStatusOverlays(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if ((e.isElite || e.shape === 'worm') && e.maxHp > 0 && e.hp < e.maxHp) {
        const barW = e.size * 2.5;
        const barH = 4;
        const y = -e.size * 1.8;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-barW / 2, y, barW, barH);
        ctx.fillStyle = e.palette[1] || '#ff0000'; ctx.fillRect(-barW / 2, y, barW * (e.hp / e.maxHp), barH);
    }

    if (e.frozen && e.frozen > 0) {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.beginPath(); ctx.arc(0, 0, e.size * 1.2, 0, Math.PI * 2); ctx.fill();
    }
}
