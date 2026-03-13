import type { GameState, Enemy } from '../../core/Types';
import { getShellVisibility } from '../ColorPalettes';
import { PALETTES } from '../../core/Constants';
import { renderAnomalyAura, renderBossSkills, renderLegionShield, renderBossBodyPre, renderBossBodyPost } from './BossRenderer';
import { renderEliteEffects } from './EliteRenderer';
import { renderUniqueEnemy } from './UniqueEnemyRenderer';
import { renderBossDistortion, drawDistortedBossShape, renderBossAfterglow, drawAbominationPath } from './BossVisualFX';
import { renderCircleSoulSuck, renderOrbitalShield, renderDiamondBeamChargeUp, renderDiamondSatelliteStrike, renderDiamondCrystalFence, renderPentagonSoulLinks, renderPentagonParasiteLink, renderPhalanxDrone } from './BossSkillRenderer';
import { renderMergeConnections } from './MergeRenderer';

export function renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    const { enemies, player } = state;

    renderMergeConnections(ctx, state);

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
            renderDiamondCrystalFence(ctx, e, state);
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
        const eraPalette = e.eraPalette;

        let coreColor: string, innerColor: string, outerColor: string;
        if (eraPalette && Array.isArray(eraPalette)) {
            coreColor = eraPalette[0];
            innerColor = eraPalette[1];
            outerColor = eraPalette[2];
        } else {
            coreColor = p[0];
            innerColor = p[1];
            outerColor = p[2];
        }

        const visibility = getShellVisibility(state.gameTime);

        if (e.isPhalanxDrone) {
            renderPhalanxDrone(ctx, e, state, coreColor, innerColor, outerColor);
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

        const stage = Math.floor((state.gameTime % 900) / 300);


        ctx.beginPath();
        if (e.boss) {
            drawDistortedBossShape(ctx, e, e.size, state);
        } else {
            drawShapePath(ctx, e, e.size, state);
        }


        const mainStrokeAlpha = e.boss ? 1.0 : Math.max(0.35, visibility.outer);
        ctx.globalAlpha = mainStrokeAlpha;
        ctx.strokeStyle = outerColor;
        ctx.lineWidth = e.boss ? 3 : (stage === 2 ? 2.5 : 1.5);
        ctx.stroke();


        if (stage === 2 && !e.boss) {
            ctx.save();
            ctx.beginPath();
            drawShapePath(ctx, e, e.size + 2.5, state);
            ctx.globalAlpha = 0.3 * visibility.outer;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }


        ctx.fillStyle = innerColor;
        ctx.globalAlpha = visibility.inner * 0.15;
        ctx.fill();


        const isMinion = e.shape === 'minion' || e.shape === 'elite_minion';

        if (!isMinion) {
            ctx.beginPath();
            const pulseSpeed = stage === 1 ? 4 : 2;
            const pulseAmount = stage === 1 ? 0.08 : 0.03;
            const innerRingSize = e.size * (0.65 + Math.sin(state.gameTime * pulseSpeed + e.id) * pulseAmount);
            ctx.arc(0, 0, innerRingSize, 0, Math.PI * 2);

            ctx.strokeStyle = innerColor;
            ctx.lineWidth = stage === 1 ? 2 : 1.2;
            ctx.globalAlpha = visibility.inner * (stage === 1 ? 0.9 : 0.7);
            ctx.stroke();
        }

        if (e.boss) {
            ctx.globalAlpha = 1.0;
            renderBossBodyPost(ctx, e, state);
            renderBossDistortion(ctx, e, state);
            renderBossAfterglow(ctx, e, state);
        }




        ctx.beginPath();
        const coreSize = e.size * (isMinion ? 0.15 : (stage === 0 ? 0.45 : 0.35));
        drawShapePath(ctx, e, coreSize, state);


        if (stage === 0 && !isMinion) {

            ctx.shadowBlur = 10;
            ctx.shadowColor = coreColor;
            ctx.fillStyle = coreColor;
            ctx.globalAlpha = visibility.core;
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {

            ctx.fillStyle = isMinion ? coreColor : '#ffffff';
            ctx.globalAlpha = visibility.core * (isMinion ? 1.0 : 0.5);
            ctx.fill();

            if (!isMinion) {
                ctx.fillStyle = coreColor;
                ctx.globalAlpha = visibility.core;
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1.0;

        renderStatusOverlays(ctx, e, state);
        ctx.restore();
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
            ctx.closePath();
            break;
        case 'snitch': ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2); break;
        case 'minion':
            ctx.moveTo(size * 1.2, 0);
            ctx.lineTo(-size * 0.6, -size * 0.8);
            ctx.lineTo(-size * 0.3, 0);
            ctx.lineTo(-size * 0.6, size * 0.8);
            ctx.closePath();
            break;
        case 'elite_minion':
            ctx.moveTo(size * 1.2, 0);
            ctx.lineTo(-size * 0.6, -size * 0.8);
            ctx.lineTo(-size * 0.3, 0);
            ctx.lineTo(-size * 0.6, size * 0.8);
            ctx.closePath();
            break;
        case 'long_drone':

            ctx.moveTo(size * 1.5, 0);
            ctx.lineTo(-size * 0.5, -size * 0.7);
            ctx.lineTo(-size * 1.0, 0);
            ctx.lineTo(-size * 0.5, size * 0.7);
            ctx.closePath();
            break;
        default: ctx.arc(0, 0, size, 0, Math.PI * 2);
    }
}


function renderStatusOverlays(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const isUnique = e.isZombie || e.shape === 'worm' || e.shape === 'glitcher' || (e as any).meteoriteDrop;
    if ((e.isElite || isUnique) && e.maxHp > 0 && e.hp < e.maxHp) {
        ctx.save();
        if (e.rotationPhase) {
            ctx.rotate(-e.rotationPhase);
        }

        const barW = e.boss ? e.size * 3.5 : e.size * 2.5;
        const barH = e.boss ? 6 : 4;
        const y = e.boss ? -e.size * 2.2 : -e.size * 1.8;

        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-barW / 2, y, barW, barH);

        const hpColor = (e.palette && e.palette[1]) ? e.palette[1] : '#ff0000';
        ctx.fillStyle = hpColor;
        ctx.fillRect(-barW / 2, y, barW * (e.hp / e.maxHp), barH);

        if (e.boss) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-barW / 2 + barW * 0.33, y, 1.5, barH);
            ctx.fillRect(-barW / 2 + barW * 0.66, y, 1.5, barH);
        }

        ctx.restore();
    }

    if (e.frozen && e.frozen > 0) {
        ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
        ctx.beginPath(); ctx.arc(0, 0, e.size * 1.2, 0, Math.PI * 2); ctx.fill();
    }
}
