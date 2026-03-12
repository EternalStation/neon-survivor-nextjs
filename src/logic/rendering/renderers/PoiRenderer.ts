import type { GameState, MapPOI } from '../../core/Types';
import { getInfernalBossHp } from '../../enemies/EnemySpawnLogic';
import type { Language } from '../../../lib/LanguageContext';
import { getUiTranslation } from '../../../lib/UiTranslations';
import { calcStat, getDefenseReduction } from '../../utils/MathUtils';
import { calculateLegendaryBonus } from '../../upgrades/LegendaryLogic';
import { getKeyDisplay } from '../../utils/Keybinds';
import { formatLargeNumber } from '../../../utils/Format';

export function renderPOIs(ctx: CanvasRenderingContext2D, state: GameState, language: Language = 'en') {
    const t = getUiTranslation(language).render;
    state.pois.forEach(poi => {
        if (poi.arenaId !== state.currentArena) return;
        if (poi.respawnTimer > 0) return;

        ctx.save();
        ctx.translate(poi.x, poi.y);

        if (poi.type === 'overclock') {
            renderOverclock(ctx, state, poi, t);
        } else if (poi.type === 'anomaly') {
            renderAnomaly(ctx, state, poi, t);
        } else if (poi.type === 'turret') {
            renderTurret(ctx, state, poi, t);
        }

        ctx.restore();
    });
}

function renderOverclock(ctx: CanvasRenderingContext2D, state: GameState, poi: MapPOI, t: any) {
    const time = state.gameTime;
    const color = poi.cooldown > 0 ? '#475569' : '#22d3ee';

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, poi.radius, 0, Math.PI * 2);
    ctx.stroke();

    const pulseR = poi.radius * (0.95 + Math.sin(time * 2) * 0.05);
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (poi.activationProgress > 0 && !poi.active) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = color;
        const currentRadius = poi.radius * (poi.activationProgress / 100);
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.syncing}...`, 0, -80);
    }

    if (poi.active) {
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.sin(time * 3) * 0.05;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, poi.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.save();

    const beamWidth = 40 + Math.sin(time * 10) * 5;
    const beamHeight = 400;
    const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamHeight);
    beamGrad.addColorStop(0, color);
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = 0.6 + Math.sin(time * 5) * 0.2;
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-beamWidth / 2, 0);
    ctx.lineTo(beamWidth / 2, 0);
    ctx.lineTo(beamWidth * 1.5, -beamHeight);
    ctx.lineTo(-beamWidth * 1.5, -beamHeight);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.translate(0, -120);

    const spinSpeed = 2;
    const spinVal = Math.cos(time * spinSpeed);
    ctx.scale(spinVal, 1);

    ctx.font = '900 32px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillStyle = '#fff';
    ctx.fillText("X2 XP", 0, 0);
    ctx.fillStyle = color;
    ctx.fillText("X2 XP", 0, 0);

    ctx.restore();

    if (poi.cooldown > 0) {
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.recharging}: ${Math.ceil(poi.cooldown)}${t.sec}`, 0, 60);
    } else if (poi.active) {
        const timeLeft = Math.ceil(30 - poi.activeDuration);
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#22d3ee';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.active}: ${timeLeft}${t.sec}`, 0, 80);
    }
}

function renderAnomaly(ctx: CanvasRenderingContext2D, state: GameState, poi: MapPOI, t: any) {
    const time = state.gameTime;
    const color = poi.cooldown > 0 ? '#475569' : '#ef4444';
    const hellColor = '#b91c1c';

    ctx.save();

    const pulseR = poi.radius + Math.sin(time * 3) * 10;

    const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, pulseR);
    grad.addColorStop(0, 'rgba(185, 28, 28, 0.4)');
    grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();

    const spikes = 32;
    for (let i = 0; i <= spikes; i++) {
        const angle = (i / spikes) * Math.PI * 2;
        const rNoise = Math.sin(i * 10 + time * 5) * 10;
        const r = pulseR + rNoise;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fca5a5';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    const corePulse = 1 + Math.sin(time * 10) * 0.1;

    for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i + time * 0.8);
        ctx.translate(25 + Math.sin(time * 2 + i) * 5, 0);

        ctx.fillStyle = '#0a0a0a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 25);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    ctx.scale(corePulse, corePulse);
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(-5, -5, 2, 0, Math.PI * 2);
    ctx.arc(5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#fbbf24';
    for (let i = 0; i < 5; i++) {
        const tOffset = i * 1.5;
        const cycle = (time + tOffset) % 2;
        const yPos = 20 - cycle * 80;
        const xPos = Math.sin(time * 2 + i) * 20;
        const scale = 1 - (cycle / 2);

        if (cycle < 2) {
            ctx.globalAlpha = scale;
            ctx.beginPath();
            ctx.arc(xPos, yPos, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    if (poi.progress > 0) {
        const barWidth = 120;
        const barHeight = 6;
        const yOffset = 60;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth, barHeight, 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth * (poi.progress / 100), barHeight, 2);
        ctx.fill();

        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#fca5a5';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#dc2626';
        ctx.textAlign = 'center';
        ctx.fillText(t.ritual, 0, yOffset - 10);
    } else {
        const d = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
        const gen = state.anomalyBossCount || 0;
        const projectedHp = getInfernalBossHp(state);

        const activeBoss = state.enemies.find(e => e.isAnomaly && !e.dead);
        const curHPValue = activeBoss ? activeBoss.hp : projectedHp;
        const maxHPValue = activeBoss ? activeBoss.maxHp : projectedHp;

        const player = state.player;
        const armorValue = calcStat(player.arm);
        const armorReduction = getDefenseReduction(armorValue);
        const colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill', false, player);
        const colRedReduction = Math.min(0.80, colRedRaw / 100);

        const rawColDmg = maxHPValue * 0.075;
        const finalColDmg = rawColDmg * (1 - armorReduction) * (1 - colRedReduction);

        const burnDmgPct = 0.05 + (gen * 0.01) + (activeBoss?.bonusBurnPct || 0);
        const rawBurnDmgPerSec = calcStat(player.hp) * burnDmgPct;
        const finalBurnDmgPerSec = rawBurnDmgPerSec * (1 - armorReduction);

        if (d < poi.radius + 300 && poi.cooldown === 0) {
            ctx.save();
            const boxY = -120;
            const padding = 12;
            const lineH = 16;
            const rectW = 200;
            const rectH = 92;

            ctx.translate(0, boxY);

            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            renderRoundRect(ctx, -rectW / 2, -rectH / 2, rectW, rectH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#ff0000';
            for (let i = 0; i < rectH; i += 4) {
                ctx.fillRect(-rectW / 2, -rectH / 2 + i, rectW, 1);
            }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = '#fff';
            ctx.font = '900 12px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`OVERLORD DATA - GEN ${gen + 1}`, 0, -rectH / 2 + 20);

            ctx.textAlign = 'left';
            ctx.font = '700 11px Orbitron, sans-serif';
            ctx.fillStyle = '#cbd5e1';

            const statsX = -rectW / 2 + padding;
            let statsY = -rectH / 2 + 38;

            ctx.fillText(`HP:`, statsX, statsY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`${formatLargeNumber(Math.round(curHPValue))} / ${formatLargeNumber(Math.round(maxHPValue))}`, rectW / 2 - padding, statsY);

            statsY += lineH;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(`BURN:`, statsX, statsY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#f59e0b';
            ctx.fillText(`${formatLargeNumber(Math.round(finalBurnDmgPerSec))} / SEC`, rectW / 2 - padding, statsY);

            statsY += lineH;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(`COLLISION:`, statsX, statsY);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`${formatLargeNumber(Math.round(finalColDmg))} IMPACT`, rectW / 2 - padding, statsY);

            if (poi.progress === 0 && d < poi.radius + 50) {
                statsY += lineH;
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Orbitron';
                ctx.fillText(`PRESS [${getKeyDisplay(state.keybinds.interact)}] TO SUMMON`, 0, rectH / 2 - 8);
            }

            ctx.restore();
        }
    }

    if (poi.cooldown > 0) {
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.dormant}: ${Math.ceil(poi.cooldown)}${t.sec}`, 0, 80);
    }
}

function renderTurret(ctx: CanvasRenderingContext2D, state: GameState, poi: MapPOI, t: any) {
    const time = state.gameTime;
    const isOverheated = poi.cooldown > 0;
    const isActive = poi.active;
    const variant = poi.turretVariant || 'fire';

    let baseColor = '#F59E0B';
    if (variant === 'ice') baseColor = '#22d3ee';
    if (variant === 'heal') baseColor = '#4ade80';

    const color = isActive ? baseColor : (isOverheated ? '#EF4444' : '#64748B');

    const dToPlayer = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
    if (dToPlayer < poi.radius + 200 || poi.activationProgress > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = color;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, poi.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    const level = poi.turretUses || 1;
    const sizeMult = 1 + (level - 1) * 0.1;
    const baseSize = 25 * sizeMult;

    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, baseSize * 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(angle) * (baseSize + 5);
        const y = Math.sin(angle) * (baseSize + 5);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = level >= 6 ? '#fbbf24' : color;
    ctx.lineWidth = level >= 6 ? 4 : 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * baseSize;
        const y = Math.sin(angle) * baseSize;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * (baseSize - 4);
        const y = Math.sin(angle) * (baseSize - 4);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    if (level >= 3) {
        ctx.save();
        ctx.rotate(time * 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(baseSize, -5);
            ctx.lineTo(baseSize + 15, -8);
            ctx.lineTo(baseSize + 15, 8);
            ctx.lineTo(baseSize, 5);
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.fill();
        }
        ctx.restore();
    }

    if (level >= 6) {
        ctx.save();
        ctx.rotate(-time * 1.2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.arc(baseSize + 20, 0, 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.3;
            ctx.fill();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.scale(sizeMult, sizeMult);
    let headRotation = poi.rotation || 0;
    if (variant === 'heal') {
        headRotation = Math.atan2(state.player.y - poi.y, state.player.x - poi.x);
    } else if (isActive && !poi.rotation) {
        headRotation = Math.sin(time) * 0.5;
    }
    ctx.rotate(headRotation);

    if (variant === 'heal') {
        ctx.save();
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.rotate(time * 2);
        ctx.fillStyle = '#4ade80';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ade80';
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(10, -2, 8, 4);
        }
        ctx.restore();
    } else if (variant === 'ice') {
        ctx.save();
        const grad = ctx.createLinearGradient(0, 0, 25, 0);
        grad.addColorStop(0, '#0c4a6e');
        grad.addColorStop(1, '#7dd3fc');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(28, -6);
        ctx.lineTo(28, 6);
        ctx.lineTo(0, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (level >= 3) {
            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.moveTo(15, -12); ctx.lineTo(22, -20); ctx.lineTo(25, -12);
            ctx.moveTo(15, 12); ctx.lineTo(22, 20); ctx.lineTo(25, 12);
            ctx.fill();
        }
        ctx.restore();
    } else {
        ctx.save();
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-10, -12, 30, 8);
        ctx.fillRect(-10, 4, 30, 8);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(15, -11, 12, 6);
        ctx.fillRect(15, 5, 12, 6);

        if (level >= 3) {
            ctx.fillStyle = '#ef4444';
            ctx.globalAlpha = 0.6 + Math.sin(time * 15) * 0.4;
            ctx.fillRect(27, -11, 4, 6);
            ctx.fillRect(27, 5, 4, 6);
        }
        ctx.restore();
    }

    ctx.save();
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    coreGrad.addColorStop(0, '#fff');
    coreGrad.addColorStop(0.5, color);
    coreGrad.addColorStop(1, '#000');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    ctx.save();
    ctx.translate(0, -50);
    ctx.shadowBlur = 15;
    ctx.shadowColor = baseColor;
    ctx.fillStyle = baseColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 24px Orbitron';

    let icon = '🔥';
    if (variant === 'ice') icon = '❄️';
    if (variant === 'heal') icon = '✚';

    ctx.fillText(icon, 0, 0);
    ctx.restore();

    if (variant === 'heal' && isActive) {
        const dToPlayer = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
        if (dToPlayer <= poi.radius) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4ade80';

            ctx.beginPath();
            ctx.moveTo(0, 0);

            const relX = state.player.x - poi.x;
            const relY = state.player.y - poi.y;

            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const tx = relX * t;
                const ty = relY * t;
                const noise = (Math.random() - 0.5) * 10;
                ctx.lineTo(tx + noise, ty + noise);
            }
            ctx.stroke();

            ctx.fillStyle = '#4ade80';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(relX, relY, 20 + Math.sin(time * 10) * 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    if (poi.activationProgress > 0 && !isActive && !isOverheated) {
        const barWidth = 60;
        const barHeight = 6;
        const yOffset = -40;

        ctx.fillStyle = '#000';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth, barHeight, 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth * (poi.activationProgress / 100), barHeight, 2);
        ctx.fill();

        const cost = poi.turretCost || 10;
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.repair}: ${cost} ${t.dust}`, 0, yOffset - 10);
    }

    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1.0;
    ctx.fillText(`${t.level} ${level}`, 0, 52);

    if (isActive) {
        const timeLeft = Math.ceil(30 - poi.activeDuration);
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = '#F59E0B';
        ctx.textAlign = 'center';
        ctx.fillText(`${timeLeft}${t.sec}`, 0, 68);
    } else if (isOverheated) {
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = '#EF4444';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.overheat}: ${Math.ceil(poi.cooldown)}${t.sec}`, 0, 68);
    } else if (dToPlayer < poi.radius + 200) {
        const cost = poi.turretCost || (10 * Math.pow(2, poi.turretUses || 0));

        ctx.save();
        ctx.translate(0, 85);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        renderRoundRect(ctx, -15, -15, 30, 30, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 18px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(getKeyDisplay(state.keybinds.interact), 0, 0);
        ctx.restore();

        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.repair} [${cost} ${t.dust}]`, 0, 115);
    }
}

function renderRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
