import type { GameState, Enemy } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { PALETTES } from '../../core/Constants';
import { formatLargeNumber } from '../../../utils/Format';

export function renderAnomalyAura(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (!e.isAnomaly || e.dead) return;

    ctx.save();
    const time = state.gameTime;
    const gen = e.anomalyGeneration || 0;
    const baseBurnRadius = 390 + (gen * 10);
    const stage3Bonus = (e.bonusBurnRadius || 0);
    const burnRadius = baseBurnRadius + stage3Bonus;

    const pulse = 1.0 + Math.sin(time * 4) * 0.05;

    const stage = e.stage || 1;
    let innerColor = 'rgba(245, 158, 11, 0.4)';
    let outerColor = 'rgba(239, 68, 68, 0.15)';
    let auraColor = '#ef4444';
    let shadowColor = '#dc2626';

    if (stage === 2) {
        innerColor = 'rgba(239, 68, 68, 0.5)';
        outerColor = 'rgba(220, 38, 38, 0.2)';
        auraColor = '#dc2626';
        shadowColor = '#b91c1c';
    } else if (stage === 3) {
        innerColor = 'rgba(220, 38, 38, 0.6)';
        outerColor = 'rgba(185, 28, 28, 0.3)';
        auraColor = '#b91c1c';
        shadowColor = '#991b1b';
    }

    const grad = ctx.createRadialGradient(e.x, e.y, 50, e.x, e.y, burnRadius * pulse);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(0.7, outerColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    const edgePoints = 32;
    for (let i = 0; i <= edgePoints; i++) {
        const ang = (i / edgePoints) * Math.PI * 2;
        const r = (burnRadius * pulse) + Math.sin(ang * 8 + time * 5) * 15;
        const px = e.x + Math.cos(ang) * r;
        const py = e.y + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.fill();

    ctx.shadowBlur = 40;
    ctx.shadowColor = shadowColor;
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + (stage - 1) * 0.1;

    ctx.beginPath();
    const auraPoints = 16;
    for (let i = 0; i <= auraPoints; i++) {
        const ang = (i / auraPoints) * Math.PI * 2;
        const r = e.size * (1.6 + Math.sin(ang * 5 + time * 8) * 0.2);
        const px = e.x + Math.cos(ang) * r;
        const py = e.y + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
}



export function renderBossBodyPre(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState, drawShape: (size: number) => void) {
    const tier = e.bossTier || 1;
    const t = state.gameTime;

    if (e.trails) {
        e.trails.forEach(trail => {
            ctx.save();
            ctx.translate(-e.x, -e.y);
            ctx.translate(trail.x, trail.y);
            ctx.rotate(trail.rotation);
            ctx.strokeStyle = e.eraPalette?.[0] || e.palette[2];
            ctx.lineWidth = 2;
            ctx.globalAlpha = trail.alpha * 0.6;
            drawShape(e.size);
            ctx.stroke();
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = trail.alpha * 0.15;
            ctx.fill();
            ctx.restore();
        });
    }

    const flickerSeed = Math.floor(t * 12);
    const flicker = Math.sin(flickerSeed * 7.3 + (e.id || 0) * 3.1) > -0.3 ? 1 : 0.4;

    const auraLayers = [
        { color: '#FF0000', size: 1.4 + tier * 0.1, width: 10, alpha: 0.15 * flicker },
        { color: '#8B0000', size: 1.3, width: 6, alpha: 0.25 * flicker },
        { color: '#FF4500', size: 1.2, width: 3, alpha: (0.5 + Math.sin(t * 10) * 0.3) * flicker },
        { color: '#FF0040', size: 1.15, width: 2, alpha: (0.4 + Math.sin(t * 15) * 0.3) * flicker }
    ];

    for (const layer of auraLayers) {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = layer.width;
        ctx.globalAlpha = layer.alpha;
        drawShape(e.size * layer.size);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

export function renderBossBodyPost(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const minutes = state.gameTime / 60;
    const chaosLevel = Math.min(1, Math.max(0, (minutes - 2) / 10));
    const tier = e.bossTier || 1;
    const t = state.gameTime;

    ctx.save();
    ctx.clip();

    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.8;
    const seed = Math.floor(t * 10);
    const blobCount = 3 + Math.floor(chaosLevel * 5) + tier;
    for (let k = 0; k < blobCount; k++) {
        ctx.beginPath();
        const rng = (n: number) => { const sin = Math.sin(n + (e.id || 0)); return sin - Math.floor(sin); };
        const cx = (rng(seed + k) - 0.5) * e.size * 1.2;
        const cy = (rng(seed + k + 100) - 0.5) * e.size * 1.2;
        for (let v = 0; v < 4; v++) {
            const ang = v * (Math.PI / 2) + rng(k + v);
            const dist = 5 + rng(k * v) * 15;
            if (v === 0) ctx.moveTo(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
            else ctx.lineTo(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
        }
        ctx.closePath();
        ctx.fill();
    }

    const veinCount = 3 + tier;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2 + chaosLevel * 0.15;
    for (let v = 0; v < veinCount; v++) {
        ctx.beginPath();
        const startAngle = (v / veinCount) * Math.PI * 2 + t * 0.5;
        const startDist = e.size * 0.1;
        ctx.moveTo(Math.cos(startAngle) * startDist, Math.sin(startAngle) * startDist);
        for (let seg = 1; seg <= 4; seg++) {
            const frac = seg / 4;
            const branchAngle = startAngle + Math.sin(t * 3 + v * 2 + seg) * 0.8;
            const segDist = e.size * frac * 0.8;
            ctx.lineTo(Math.cos(branchAngle) * segDist, Math.sin(branchAngle) * segDist);
        }
        ctx.stroke();
    }

    const corePulse = 0.3 + Math.sin(t * 6) * 0.15;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 0.5);
    coreGrad.addColorStop(0, `rgba(139, 0, 0, ${corePulse})`);
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, e.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function renderBossSkills(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape === 'triangle' && e.berserkState) {
        ctx.save();
        ctx.translate(e.x, e.y);
        const auraSize = e.size * 2.0;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#F59E0B';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6 + Math.sin(state.gameTime * 20) * 0.4;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const ang = i * (Math.PI * 2 / 3) - Math.PI / 2;
            const ax = Math.cos(ang) * auraSize;
            const ay = Math.sin(ang) * auraSize;
            if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    if (e.shape === 'diamond' && e.beamState === 2 && e.beamX && e.beamY) {
        const isLvl4 = (e.bossTier || 0) >= 4 || (state.gameTime > 1800 && e.bossTier !== 1);
        const centerAngle = e.beamAngle || Math.atan2(e.beamY - e.y, e.beamX - e.x);
        const duration = isLvl4 ? 240 : 30;
        const t = Math.min(1, (e.beamTimer || 0) / duration);

        const drawLaser = (angle: number) => {
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(angle);
            const dist = 3000;
            const beamWidth = (isLvl4 ? 30 : 40) + Math.sin(state.gameTime * 50) * 10;
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, -beamWidth / 2, dist, beamWidth);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = e.palette[1];
            ctx.shadowBlur = isLvl4 ? 30 : 40;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(0, -beamWidth / 6, dist, beamWidth / 3);
            ctx.restore();
        };

        if (isLvl4) {
            const startOff = (45 * Math.PI) / 180;
            const endOff = (4.5 * Math.PI) / 180;
            const currentOffset = startOff - (startOff - endOff) * t;
            drawLaser(centerAngle + currentOffset);
            drawLaser(centerAngle - currentOffset);
        } else {
            drawLaser(centerAngle);
        }
    }
}

export function renderLegionShield(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (!e.legionId || !e.maxLegionShield || !e.legionShield) return;
    const isLead = e.id === e.legionLeadId;
    if (!isLead) return;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(-(e.rotationPhase || 0));
    const spacing = e.size * 2.5;
    const gridWidth = 5 * spacing;
    const gridHeight = 4 * spacing;
    const centerX = -(e.legionSlot?.x || 0) * spacing;
    const centerY = -(e.legionSlot?.y || 0) * spacing;

    ctx.save();
    ctx.translate(centerX, centerY);
    const auraPulse = 0.5 + Math.sin(state.gameTime * 3) * 0.2;
    const auraGradient = ctx.createRadialGradient(0, 0, gridWidth * 0.3, 0, 0, gridWidth * 1.0);
    auraGradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
    auraGradient.addColorStop(0.5, `rgba(56, 189, 248, ${0.15 * auraPulse})`);
    auraGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(0, 0, gridWidth * 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const padding = 40;
    const barWidth = gridWidth + padding;
    const barHeight = 8;
    const barX = centerX - barWidth / 2;
    const barY = centerY - gridHeight / 2 - padding - 40;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const shieldPct = Math.max(0, e.legionShield / e.maxLegionShield);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillRect(barX, barY, barWidth * shieldPct, barHeight);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(`LEGION SHIELD: ${Math.round(e.legionShield)}`, barX + barWidth / 2, barY - 8);
    ctx.restore();
}
