import type { GameState, Enemy } from '../../core/types';
import { PALETTES } from '../../core/constants';

export function renderCircleSoulSuck(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape !== 'circle' || !e.boss) return;

    if (e.dashState === 1) {
        renderCircleDashWarning(ctx, e, state);
    }

    if (!e.soulSuckActive) return;

    const totalTime = 300;
    const progress = Math.min(1.0, (totalTime - (e.soulSuckTimer || 0)) / totalTime);
    const t = state.gameTime;
    const px = state.player.x;
    const py = state.player.y;
    const dx = e.x - px;
    const dy = e.y - py;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();

    const streamCount = 3;
    for (let s = 0; s < streamCount; s++) {
        const streamOffset = (s / streamCount) * Math.PI * 2;
        const wobbleAmp = 30 + s * 10;

        ctx.beginPath();
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const frac = i / segments;
            const baseX = px + dx * frac;
            const baseY = py + dy * frac;

            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const wobble = Math.sin(frac * 8 + t * 6 + streamOffset) * wobbleAmp * (1 - frac * 0.5) * Math.sin(frac * Math.PI);

            const ptX = baseX + perpX * wobble;
            const ptY = baseY + perpY * wobble;

            if (i === 0) ctx.moveTo(ptX, ptY);
            else ctx.lineTo(ptX, ptY);
        }

        const grad = ctx.createLinearGradient(px, py, e.x, e.y);
        grad.addColorStop(0, `rgba(234, 179, 8, ${0.6 * progress})`);
        grad.addColorStop(0.5, `rgba(251, 191, 36, ${0.4 * progress})`);
        grad.addColorStop(1, `rgba(161, 98, 7, ${0.2 * progress})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 + s * 0.5;
        ctx.globalAlpha = 0.5 + progress * 0.3;
        ctx.stroke();
    }

    const particleCount = 8 + Math.floor(progress * 8);
    for (let i = 0; i < particleCount; i++) {
        const baseFrac = ((t * 2 + i * 0.15) % 1);
        const frac = baseFrac;
        const baseX = px + dx * frac;
        const baseY = py + dy * frac;

        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const wobble = Math.sin(frac * 8 + t * 6 + i * 0.7) * 25 * Math.sin(frac * Math.PI);

        const ptX = baseX + perpX * wobble + (Math.sin(t * 10 + i * 3) * 5);
        const ptY = baseY + perpY * wobble + (Math.cos(t * 10 + i * 3) * 5);
        const pSize = 2 + Math.sin(t * 8 + i) * 1.5;

        ctx.fillStyle = i % 3 === 0 ? '#fbbf24' : (i % 3 === 1 ? '#f59e0b' : '#eab308');
        ctx.globalAlpha = 0.6 + Math.sin(t * 5 + i * 2) * 0.3;
        ctx.beginPath();
        ctx.arc(ptX, ptY, Math.max(1, pSize), 0, Math.PI * 2);
        ctx.fill();
    }

    const coreSize = e.soulSuckCoreSize || 5;
    const coreGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, coreSize);
    coreGrad.addColorStop(0, '#fbbf24');
    coreGrad.addColorStop(0.5, 'rgba(234,179,8,0.6)');
    coreGrad.addColorStop(1, 'rgba(161,98,7,0)');
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.7 + Math.sin(t * 8) * 0.3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, coreSize, 0, Math.PI * 2);
    ctx.fill();

    const drainGrad = ctx.createRadialGradient(px, py, 0, px, py, 40);
    drainGrad.addColorStop(0, 'rgba(234,179,8,0)');
    drainGrad.addColorStop(0.5, `rgba(234,179,8,${0.3 * progress})`);
    drainGrad.addColorStop(1, 'rgba(234,179,8,0)');
    ctx.fillStyle = drainGrad;
    ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.2;
    ctx.beginPath();
    ctx.arc(px, py, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function renderCircleDashWarning(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const t = state.gameTime;

    const chargeProgress = Math.min(1, (e.dashTimer || 0) / 30);
    const trackingAngle = Math.atan2((e.dashLockY || state.player.y) - e.y, (e.dashLockX || state.player.x) - e.x);

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(trackingAngle);

    ctx.strokeStyle = e.palette[1] || '#ef4444';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3 + chargeProgress * 0.5;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -t * 100;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(2000, 0);
    ctx.stroke();

    const rectWidth = 80;
    const rectHeight = e.size * 2 * (0.5 + chargeProgress * 0.5);
    const rectGrad = ctx.createLinearGradient(0, -rectHeight / 2, 0, rectHeight / 2);
    rectGrad.addColorStop(0, 'transparent');
    rectGrad.addColorStop(0.5, e.palette[1] || '#ef4444');
    rectGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = rectGrad;
    ctx.globalAlpha = 0.2 + chargeProgress * 0.2;
    ctx.fillRect(0, -rectHeight / 2, 2000, rectHeight);

    ctx.restore();
}

export function renderOrbitalShield(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if ((e.type as string) !== 'orbital_shield' || e.dead) return;

    const t = state.gameTime;
    const parent = state.enemies.find(p => p.id === e.parentId && !p.dead);
    if (!parent) return;

    const orbitAngle = e.rotationPhase || 0;

    ctx.save();
    ctx.rotate(-(e.rotationPhase || 0));

    const shieldLength = 75;
    const shieldWidth = 12;
    const faceAngle = orbitAngle + Math.PI;

    ctx.save();
    ctx.rotate(faceAngle);

    const pulse = 1 + Math.sin(t * 4 + orbitAngle * 3) * 0.1;

    const shieldGrad = ctx.createLinearGradient(0, -shieldLength * pulse / 2, 0, shieldLength * pulse / 2);
    shieldGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    shieldGrad.addColorStop(0.15, 'rgba(6, 182, 212, 0.7)');
    shieldGrad.addColorStop(0.5, 'rgba(103, 232, 249, 0.9)');
    shieldGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.7)');
    shieldGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.fillStyle = shieldGrad;
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(-shieldWidth * 0.3, -shieldLength * pulse / 2);
    ctx.quadraticCurveTo(shieldWidth, -shieldLength * pulse * 0.3, shieldWidth * 1.2, 0);
    ctx.quadraticCurveTo(shieldWidth, shieldLength * pulse * 0.3, -shieldWidth * 0.3, shieldLength * pulse / 2);
    ctx.quadraticCurveTo(-shieldWidth * 0.5, 0, -shieldWidth * 0.3, -shieldLength * pulse / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.4 + Math.sin(t * 8 + orbitAngle) * 0.2;
    ctx.beginPath();
    ctx.moveTo(shieldWidth * 0.5, -shieldLength * pulse * 0.35);
    ctx.quadraticCurveTo(shieldWidth * 0.8, 0, shieldWidth * 0.5, shieldLength * pulse * 0.35);
    ctx.stroke();

    ctx.restore();

    const energySparkCount = 3;
    for (let i = 0; i < energySparkCount; i++) {
        const sparkAngle = faceAngle + (Math.random() - 0.5) * 0.5;
        const sparkDist = shieldWidth * (0.5 + Math.random() * 0.7);
        const sparkY = (Math.random() - 0.5) * shieldLength * pulse * 0.8;
        const sx = Math.cos(sparkAngle) * sparkDist;
        const sy = Math.sin(sparkAngle) * sparkDist + sparkY * 0.3;
        const sparkSize = 1 + Math.random() * 2;

        ctx.fillStyle = '#67e8f9';
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

export function renderDiamondBeamChargeUp(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape !== 'diamond' || !e.boss || e.beamState !== 1) return;

    const t = state.gameTime;
    const isLvl4 = (e.bossTier || 0) >= 4 || (state.gameTime > 1800 && e.bossTier !== 1);

    ctx.save();
    ctx.translate(e.x, e.y);

    const chargeProgress = Math.min(1, (e.beamTimer || 0) / 60);
    const trackingAngle = e.beamAngle || Math.atan2((e.beamY || 0) - e.y, (e.beamX || 0) - e.x);

    if (isLvl4) {
        const startOff = (45 * Math.PI) / 180;
        const angles = [trackingAngle + startOff, trackingAngle - startOff];
        angles.forEach((ang, idx) => {
            ctx.save();
            ctx.rotate(ang);
            ctx.strokeStyle = e.palette[1];
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2 + chargeProgress * 0.3;
            ctx.setLineDash([8, 8]);
            ctx.lineDashOffset = -t * 60;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(3000, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        });
    } else {
        ctx.save();
        ctx.rotate(trackingAngle);
        ctx.strokeStyle = e.palette[1];
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.3 + chargeProgress * 0.4;
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = -t * 80;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3000, 0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    const orbCount = 4 + Math.floor(chargeProgress * 4);
    for (let i = 0; i < orbCount; i++) {
        const orbAngle = (i / orbCount) * Math.PI * 2 + t * 3;
        const orbDist = e.size * (1.5 - chargeProgress * 0.8);
        const orbSize = 2 + chargeProgress * 3;

        ctx.fillStyle = e.palette[0];
        ctx.globalAlpha = 0.4 + chargeProgress * 0.4;
        ctx.beginPath();
        ctx.arc(
            Math.cos(orbAngle) * orbDist,
            Math.sin(orbAngle) * orbDist,
            orbSize, 0, Math.PI * 2
        );
        ctx.fill();
    }

    const coreGlow = chargeProgress * 20 + 5;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreGlow);
    coreGrad.addColorStop(0, e.palette[0]);
    coreGrad.addColorStop(0.5, e.palette[1]);
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.globalAlpha = 0.3 + chargeProgress * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, coreGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function renderDiamondSatelliteStrike(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape !== 'diamond' || !e.boss) return;
    if (!e.satelliteTargets || e.satelliteState === 0) return;

    const t = state.gameTime;
    const minutes = (e.spawnedAt || state.gameTime) / 60;
    const eraIndex = Math.floor(minutes / 15) % 5;
    const eraColors = ['#4ade80', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];
    const strikeColor = eraColors[eraIndex];

    ctx.save();

    if (e.satelliteState === 1) {
        e.satelliteTargets.forEach(target => {
            const progress = Math.min(1, (e.satelliteTimer || 0) / 90);

            ctx.save();
            ctx.globalAlpha = 0.3 + progress * 0.4;
            ctx.strokeStyle = strikeColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 4]);
            ctx.lineDashOffset = -t * 40;
            ctx.beginPath();
            ctx.arc(target.x, target.y, 50 + (1 - progress) * 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(target.x, target.y, 30 * progress, 0, Math.PI * 2);
            ctx.stroke();

            const sparkCount = 5 + Math.floor(progress * 8);
            for (let s = 0; s < sparkCount; s++) {
                const sparkAngle = (s / sparkCount) * Math.PI * 2 + t * 4;
                const sparkDist = 30 + (1 - progress) * 50;
                const sx = target.x + Math.cos(sparkAngle) * sparkDist;
                const sy = target.y + Math.sin(sparkAngle) * sparkDist;
                const sparkSize = 1.5 + Math.sin(t * 8 + s * 2) * 1;

                ctx.fillStyle = strikeColor;
                ctx.globalAlpha = 0.5 + Math.sin(t * 6 + s * 3) * 0.3;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(0.5, sparkSize), 0, Math.PI * 2);
                ctx.fill();
            }

            const crossSize = 15 * progress;
            ctx.strokeStyle = strikeColor;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6 * progress;
            ctx.beginPath();
            ctx.moveTo(target.x - crossSize, target.y);
            ctx.lineTo(target.x + crossSize, target.y);
            ctx.moveTo(target.x, target.y - crossSize);
            ctx.lineTo(target.x, target.y + crossSize);
            ctx.stroke();

            ctx.restore();
        });
    }

    if (e.satelliteState === 2) {
        const fireProgress = Math.min(1, (e.satelliteTimer || 0) / 20);
        e.satelliteTargets.forEach(target => {
            const beamWidth = 20 * (1 - fireProgress * 0.5);
            const beamHeight = 800;
            const fadeOut = 1 - fireProgress;

            ctx.save();
            ctx.translate(target.x, target.y);

            const beamGrad = ctx.createLinearGradient(0, -beamHeight, 0, 50);
            beamGrad.addColorStop(0, 'transparent');
            beamGrad.addColorStop(0.1, strikeColor);
            beamGrad.addColorStop(0.8, strikeColor);
            beamGrad.addColorStop(1, '#ffffff');
            ctx.fillStyle = beamGrad;
            ctx.globalAlpha = 0.5 * fadeOut;
            ctx.fillRect(-beamWidth, -beamHeight, beamWidth * 2, beamHeight + 50);

            const coreGrad = ctx.createLinearGradient(0, -beamHeight, 0, 50);
            coreGrad.addColorStop(0, 'transparent');
            coreGrad.addColorStop(0.2, '#ffffff');
            coreGrad.addColorStop(0.8, '#ffffff');
            coreGrad.addColorStop(1, strikeColor);
            ctx.fillStyle = coreGrad;
            ctx.globalAlpha = 0.7 * fadeOut;
            ctx.fillRect(-beamWidth * 0.3, -beamHeight, beamWidth * 0.6, beamHeight + 50);

            ctx.shadowColor = strikeColor;
            ctx.shadowBlur = 30;

            const impactSize = 40 * (1 + Math.sin(t * 20) * 0.3);
            const impactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, impactSize);
            impactGrad.addColorStop(0, '#ffffff');
            impactGrad.addColorStop(0.3, strikeColor);
            impactGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = impactGrad;
            ctx.globalAlpha = 0.8 * fadeOut;
            ctx.beginPath();
            ctx.arc(0, 0, impactSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    ctx.restore();
}

export function renderPentagonSoulLinks(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape !== 'pentagon' || !e.boss || !e.soulLinkTargets || e.soulLinkTargets.length === 0) return;

    const t = state.gameTime;
    const minutes = (e.spawnedAt || state.gameTime) / 60;
    const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
    const linkColor = PALETTES[eraIndex].colors[0];

    ctx.save();

    e.soulLinkTargets.forEach((targetId, idx) => {
        const target = state.enemies.find(o => o.id === targetId && !o.dead);
        if (!target) return;

        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        const segments = 24;
        const wobbleAmp = 15 + Math.sin(t * 2 + idx) * 5;

        for (let layer = 0; layer < 2; layer++) {
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const frac = i / segments;
                const baseX = e.x + dx * frac;
                const baseY = e.y + dy * frac;

                const perpX = -Math.sin(angle);
                const perpY = Math.cos(angle);
                const edgeFade = Math.sin(frac * Math.PI);
                const wobble = Math.sin(frac * 12 + t * 5 + idx * 2 + layer * 1.5) * wobbleAmp * edgeFade;

                const ptX = baseX + perpX * wobble;
                const ptY = baseY + perpY * wobble;

                if (i === 0) ctx.moveTo(ptX, ptY);
                else ctx.lineTo(ptX, ptY);
            }

            if (layer === 0) {
                ctx.strokeStyle = linkColor;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.2;
                ctx.shadowColor = linkColor;
                ctx.shadowBlur = 10;
            } else {
                ctx.strokeStyle = linkColor;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.5 + Math.sin(t * 4 + idx * 1.3) * 0.2;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
        }

        const nodeGrad = ctx.createRadialGradient(target.x, target.y, 0, target.x, target.y, 10);
        nodeGrad.addColorStop(0, linkColor);
        nodeGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nodeGrad;
        ctx.globalAlpha = 0.5 + Math.sin(t * 6 + idx * 2) * 0.2;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 10, 0, Math.PI * 2);
        ctx.fill();

        const energyCount = 3;
        for (let p = 0; p < energyCount; p++) {
            const eFrac = ((t * 1.5 + p * 0.33 + idx * 0.2) % 1);
            const eX = e.x + dx * eFrac;
            const eY = e.y + dy * eFrac;
            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const eWobble = Math.sin(eFrac * 12 + t * 5 + idx * 2) * wobbleAmp * Math.sin(eFrac * Math.PI);

            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.4 + Math.sin(t * 8 + p * 3) * 0.2;
            ctx.beginPath();
            ctx.arc(eX + perpX * eWobble, eY + perpY * eWobble, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    ctx.restore();
}

export function renderPentagonParasiteLink(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    if (e.shape !== 'pentagon' || !e.boss || !e.parasiteLinkActive) return;

    const t = state.gameTime;
    const px = state.player.x;
    const py = state.player.y;
    const dx = px - e.x;
    const dy = py - e.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();

    for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        const segments = 30;
        const wobbleAmp = 20 + layer * 8;
        const phaseOffset = layer * 2.1;

        for (let i = 0; i <= segments; i++) {
            const frac = i / segments;
            const baseX = e.x + dx * frac;
            const baseY = e.y + dy * frac;

            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const edgeFade = Math.sin(frac * Math.PI);
            const wobble = Math.sin(frac * 10 + t * 7 + phaseOffset) * wobbleAmp * edgeFade;
            const chaos = Math.sin(frac * 20 + t * 12 + layer * 5) * 5 * edgeFade;

            const ptX = baseX + perpX * (wobble + chaos);
            const ptY = baseY + perpY * (wobble + chaos);

            if (i === 0) ctx.moveTo(ptX, ptY);
            else ctx.lineTo(ptX, ptY);
        }

        if (layer === 0) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.15;
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 15;
        } else if (layer === 1) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4 + Math.sin(t * 5) * 0.15;
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3 + Math.sin(t * 8) * 0.15;
        }
        ctx.stroke();
    }

    const drainParticles = 6;
    for (let i = 0; i < drainParticles; i++) {
        const frac = ((t * 1.2 + i * 0.17) % 1);
        const baseX = px - dx * frac;
        const baseY = py - dy * frac;
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        const wobble = Math.sin(frac * 10 + t * 7) * 20 * Math.sin(frac * Math.PI);

        ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fca5a5';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(baseX + perpX * wobble, baseY + perpY * wobble, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    const drainGlow = ctx.createRadialGradient(px, py, 0, px, py, 30);
    drainGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    drainGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = drainGlow;
    ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.2;
    ctx.beginPath();
    ctx.arc(px, py, 30, 0, Math.PI * 2);
    ctx.fill();

    const healGlow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 25);
    healGlow.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
    healGlow.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = healGlow;
    ctx.globalAlpha = 0.4 + Math.sin(t * 4) * 0.2;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

export function renderPhalanxDrone(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState, coreColor?: string, innerColor?: string, outerColor?: string) {
    if (!e.isPhalanxDrone || e.dead) return;

    const t = state.gameTime;
    const angle = e.rotationPhase || 0;
    const size = e.size;

    // Use passed era colors or fallback to defaults
    const coreC = coreColor || '#ffffff';
    const innerC = innerColor || '#334155';
    const outerC = outerColor || '#eab308';

    // The user wants them to be "kind of blue"
    // We'll overlay a slight blue-cyan glow/tint
    const blueTint = 'rgba(103, 232, 249, 0.4)'; // Cyan-300 with alpha

    ctx.save();
    ctx.rotate(-(e.rotationPhase || 0));
    ctx.rotate(angle);

    const bodyLength = size * 2.2;
    const bodyWidth = size * 0.6;

    ctx.beginPath();
    ctx.moveTo(bodyLength * 0.5, 0);
    ctx.lineTo(-bodyLength * 0.1, -bodyWidth);
    ctx.lineTo(-bodyLength * 0.5, -bodyWidth * 0.6);
    ctx.lineTo(-bodyLength * 0.5, bodyWidth * 0.6);
    ctx.lineTo(-bodyLength * 0.1, bodyWidth);
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(-bodyLength * 0.5, 0, bodyLength * 0.5, 0);
    bodyGrad.addColorStop(0, '#1e293b');
    bodyGrad.addColorStop(0.5, innerC);
    bodyGrad.addColorStop(1, '#475569');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.strokeStyle = outerC;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Secondary Blue Tint Stroke for that "ghostly/tech" blue look
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    for (let w = 0; w < 2; w++) {
        const wingY = w === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(bodyLength * 0.1, wingY * bodyWidth * 0.5);
        ctx.lineTo(-bodyLength * 0.2, wingY * bodyWidth * 2);
        ctx.lineTo(-bodyLength * 0.4, wingY * bodyWidth * 1.5);
        ctx.lineTo(-bodyLength * 0.3, wingY * bodyWidth * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#475569';
        ctx.fill();
        ctx.strokeStyle = outerC;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    for (let a = 0; a < 3; a++) {
        const arrowX = bodyLength * 0.3 - a * bodyLength * 0.25;
        const arrowSize = size * (0.3 - a * 0.05);
        ctx.beginPath();
        ctx.moveTo(arrowX + arrowSize, 0);
        ctx.lineTo(arrowX - arrowSize * 0.5, -arrowSize * 0.6);
        ctx.lineTo(arrowX - arrowSize * 0.3, 0);
        ctx.lineTo(arrowX - arrowSize * 0.5, arrowSize * 0.6);
        ctx.closePath();
        ctx.fillStyle = coreC;
        ctx.globalAlpha = 0.7 - a * 0.15;
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#22d3ee'; // Blue light instead of amber
    ctx.globalAlpha = 0.6 + Math.sin(t * 10) * 0.3;
    ctx.beginPath();
    ctx.arc(bodyLength * 0.35, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();

    const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
    const isMoving = Math.hypot(e.vx || 0, e.vy || 0) > 2 || (host && host.phalanxState === 3);
    if (isMoving) {
        renderDroneTrail(ctx, e, state);
    }
}

function renderDroneTrail(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const t = state.gameTime;
    const angle = e.rotationPhase || 0;

    ctx.save();
    ctx.rotate(-(e.rotationPhase || 0));
    ctx.rotate(angle);

    const tailX = -e.size * 1.1;
    const tailY = 0;

    const trailLength = 60;
    const trailSegments = 8;
    for (let i = 0; i < trailSegments; i++) {
        const frac = (i + 1) / trailSegments;
        const segX = tailX - trailLength * frac;
        const segY = tailY + Math.sin(t * 15 + i * 3) * 3;
        const spread = (1 - frac * 0.3) * 8 + Math.sin(t * 15 + i * 2) * 3;
        const flicker = Math.sin(t * 20 + i * 5) > -0.3 ? 1 : 0.5;

        ctx.globalAlpha = (1 - frac) * 0.6 * flicker;
        const segGrad = ctx.createRadialGradient(segX, segY, 0, segX, segY, spread);
        segGrad.addColorStop(0, i < 2 ? '#ffffff' : '#22d3ee'); // Cyan
        segGrad.addColorStop(0.4, '#06b6d4'); // Blue-darker
        segGrad.addColorStop(0.7, '#0891b2'); // Darker cyan
        segGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = segGrad;
        ctx.beginPath();
        ctx.arc(segX, segY, spread, 0, Math.PI * 2);
        ctx.fill();
    }

    const coreFlameLen = 25;
    ctx.globalAlpha = 0.8;
    const flameGrad = ctx.createLinearGradient(tailX, 0, tailX - coreFlameLen, 0);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, '#22d3ee');
    flameGrad.addColorStop(0.7, '#06b6d4');
    flameGrad.addColorStop(1, 'transparent');

    const flameW = 5 + Math.sin(t * 25) * 2;

    ctx.beginPath();
    ctx.moveTo(tailX, flameW);
    ctx.lineTo(tailX - coreFlameLen, 0);
    ctx.lineTo(tailX, -flameW);
    ctx.closePath();
    ctx.fillStyle = flameGrad;
    ctx.fill();

    ctx.restore();
}
