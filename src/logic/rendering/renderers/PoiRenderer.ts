import type { GameState, MapPOI } from '../../core/types';
import { getInfernalBossHp } from '../../enemies/EnemySpawnLogic';
import type { Language } from '../../../lib/LanguageContext';
import { getUiTranslation } from '../../../lib/uiTranslations';

export function renderPOIs(ctx: CanvasRenderingContext2D, state: GameState, language: Language = 'en') {
    const t = getUiTranslation(language).render;
    state.pois.forEach(poi => {
        if (poi.arenaId !== state.currentArena) return; // Only render current arena POIs
        if (poi.respawnTimer > 0) return; // Skip if in the 30s relocation phase

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
    const color = poi.cooldown > 0 ? '#475569' : '#22d3ee'; // Grey if cooldown, Cyan if ready

    // 1. Zone Outline (Simple)
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, poi.radius, 0, Math.PI * 2);
    ctx.stroke();
    // Inner pulse ring
    const pulseR = poi.radius * (0.95 + Math.sin(time * 2) * 0.05);
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Loading Circle (Expanding from center)
    if (poi.activationProgress > 0 && !poi.active) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = color;
        const currentRadius = poi.radius * (poi.activationProgress / 100);
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Label for loading
        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.syncing}...`, 0, -80);
    }

    // 3. Active Zone Fill
    if (poi.active) {
        ctx.save();
        ctx.globalAlpha = 0.1 + Math.sin(time * 3) * 0.05;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, poi.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 4. BEACON (Vertical Light Beam)
    ctx.save();

    // Beam
    const beamWidth = 40 + Math.sin(time * 10) * 5;
    const beamHeight = 400; // Go high up
    const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamHeight);
    beamGrad.addColorStop(0, color);
    beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = 0.6 + Math.sin(time * 5) * 0.2;
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-beamWidth / 2, 0);
    ctx.lineTo(beamWidth / 2, 0);
    ctx.lineTo(beamWidth * 1.5, -beamHeight); // Fan out slightly or go straight? Let's go straightish
    ctx.lineTo(-beamWidth * 1.5, -beamHeight);
    ctx.closePath();
    ctx.fill();

    // Core Source
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Spinning "X2 XP" Text
    ctx.save();
    ctx.translate(0, -120); // Higher up in the beam

    // Spinning effect
    const spinSpeed = 2;
    const spinVal = Math.cos(time * spinSpeed);
    ctx.scale(spinVal, 1);

    ctx.font = '900 32px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add glow
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.fillStyle = '#fff';
    ctx.fillText("X2 XP", 0, 0);
    ctx.fillStyle = color;
    ctx.fillText("X2 XP", 0, 0);

    ctx.restore();

    // 6. Cooldown / Duration Indicator
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
    const hellColor = '#b91c1c'; // Dark red for ground

    // 1. "Melting Ground" Zone
    ctx.save();

    // Pulsating radius
    const pulseR = poi.radius + Math.sin(time * 3) * 10;

    // Create gradient for molten look
    const grad = ctx.createRadialGradient(0, 0, 50, 0, 0, pulseR);
    grad.addColorStop(0, 'rgba(185, 28, 28, 0.4)'); // Inner dark red
    grad.addColorStop(0.8, 'rgba(239, 68, 68, 0.1)'); // Outer red
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();

    // Jagged circle
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

    // Outline (Cracks)
    ctx.strokeStyle = '#fca5a5';
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.stroke();

    // No extra rotating rings per user request

    ctx.restore();

    // 2. Crystal Structure (Floating Shards)
    ctx.save();
    const corePulse = 1 + Math.sin(time * 10) * 0.1;

    // Floating dark shards
    for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((Math.PI * 2 / 5) * i + time * 0.8);
        ctx.translate(25 + Math.sin(time * 2 + i) * 5, 0); // Hover in/out

        ctx.fillStyle = '#0a0a0a'; // Black obsidian
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

    // Hell Core
    ctx.scale(corePulse, corePulse);
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#ef4444';
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright eyes effect
    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(-5, -5, 2, 0, Math.PI * 2);
    ctx.arc(5, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 3. Floating Embers (Simulated Particles)
    ctx.save();
    ctx.fillStyle = '#fbbf24'; // Amber/Fire
    for (let i = 0; i < 5; i++) {
        const tOffset = i * 1.5;
        const cycle = (time + tOffset) % 2; // 0 to 2s cycle
        const yPos = 20 - cycle * 80;
        const xPos = Math.sin(time * 2 + i) * 20;
        const scale = 1 - (cycle / 2); // Fade out as it goes up

        if (cycle < 2) {
            ctx.globalAlpha = scale;
            ctx.beginPath();
            ctx.arc(xPos, yPos, 2 * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    // 4. Progress / Summoning Text
    if (poi.progress > 0) {
        const barWidth = 120;
        const barHeight = 6;
        const yOffset = 60;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth, barHeight, 2);
        ctx.fill();

        // Progress (Blood Red)
        ctx.fillStyle = '#dc2626';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth * (poi.progress / 100), barHeight, 2);
        ctx.fill();

        // Text
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#fca5a5';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#dc2626';
        ctx.textAlign = 'center';
        ctx.fillText(t.ritual, 0, yOffset - 10);
    } else {
        // Show Interact Prompt and Boss HP if player is in range
        const d = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
        if (d < poi.radius && poi.cooldown === 0) {
            const yOffset = 70;
            const interactKey = state.player.currentInput?.keys ? (Object.keys(state.player.currentInput.keys).find(k => state.player.currentInput?.keys[k])) : 'E'; // Fallback
            // We know the keybind is 'interact'
            const keyText = 'E'; // Fixed as 'E' for default or we could get from Keybinds.ts but it's usually E

            // Draw [E] Key icon
            ctx.save();
            ctx.translate(0, yOffset);

            // Key box
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark background
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;
            renderRoundRect(ctx, -20, -20, 40, 40, 8);
            ctx.fill();
            ctx.stroke();

            // Key text
            ctx.font = 'bold 24px Orbitron';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(keyText, 0, 0);

            // "SUMMON" Text
            const bossT = getUiTranslation(state.language).hud;
            ctx.font = 'bold 16px Orbitron';
            ctx.fillStyle = '#fca5a5';
            ctx.fillText(bossT.bossWord, 0, 40);

            // Boss HP Preview
            const bossHp = getInfernalBossHp(state);
            ctx.font = 'bold 14px Orbitron';
            ctx.fillStyle = '#ef4444';
            ctx.fillText(`${bossHp.toLocaleString()} HP`, 0, 60);

            ctx.restore();
        }
    }

    // 5. Cooldown Indicator
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

    let baseColor = '#F59E0B'; // Fire (Amber)
    if (variant === 'ice') baseColor = '#22d3ee'; // Ice (Cyan)
    if (variant === 'heal') baseColor = '#4ade80'; // Heal (Green)

    const color = isActive ? baseColor : (isOverheated ? '#EF4444' : '#64748B'); // Active Color, Red Overheat, or Slate dormant

    // 1. Range Display (When Player Nearby or Helping)
    // Only show if player is close enough to care or repairing
    const dToPlayer = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
    if (dToPlayer < poi.radius + 100 || poi.activationProgress > 0) {
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = color;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, poi.radius, 0, Math.PI * 2); // Activation Radius
        ctx.stroke();
        ctx.restore();
    }

    // 2. Turret Base (Hexagon)
    const level = poi.turretUses || 1;
    const sizeMult = 1 + (level - 1) * 0.1;
    const baseSize = 25 * sizeMult;

    // --- LVL 3+: AURA OVERLAY ---
    if (level >= 3) {
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(time * 3) * 0.1;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Rotating outer ring
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.rotate(time);
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 1.8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // --- LVL 6+: ELITE TRIM & INTENSE PULSE ---
    if (level >= 6) {
        ctx.save();
        const pulse = 1 + Math.sin(time * 10) * 0.05;
        ctx.scale(pulse, pulse);
        // Golden glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        // Base plate elite trim
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, baseSize * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#1e293b'; // Dark slate base
    ctx.strokeStyle = level >= 6 ? '#fbbf24' : color; // Golden if elite
    ctx.lineWidth = level >= 6 ? 4 : 3;

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
    ctx.restore();

    // 3. Turret Head (Rotating)
    ctx.save();
    ctx.scale(sizeMult, sizeMult); // Scale head too

    // Rotation Logic:
    // Heal: Always faces player
    // Fire/Ice: Faces shot direction (or idle spin)
    let headRotation = poi.rotation || 0;
    if (variant === 'heal') {
        headRotation = Math.atan2(state.player.y - poi.y, state.player.x - poi.x);
    } else if (isActive && !poi.rotation) {
        // Idle spin if active but no target? Or just keep last rotation?
        // User liked "not spinning randomly".
        // Let's keep it static if no target, or slow scan.
        headRotation = Math.sin(time) * 0.5; // Slow scan
    }

    ctx.rotate(headRotation);

    // HEAD MODELS
    if (variant === 'heal') {
        // HEAL TURRET: Single energy emitter, no guns
        // Base plate
        ctx.fillStyle = '#14532d'; // Dark Green
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Emitter
        ctx.fillStyle = '#4ade80'; // Bright Green
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4ade80';
        ctx.beginPath();
        ctx.arc(8, 0, 6, 0, Math.PI * 2); // Offset towards player
        ctx.fill();

        // Connectors
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

    } else if (variant === 'ice') {
        // ICE THROWER: Wide nozzle + Frost Flanges
        ctx.fillStyle = color;
        // Tapered nozzle
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(24, -12);
        ctx.lineTo(24, 12);
        ctx.lineTo(0, 8);
        ctx.closePath();
        ctx.fill();

        // Flanges
        ctx.fillStyle = '#bae6fd'; // Light blue
        ctx.beginPath();
        ctx.moveTo(12, -10); ctx.lineTo(8, -18); ctx.lineTo(20, -10);
        ctx.moveTo(12, 10); ctx.lineTo(8, 18); ctx.lineTo(20, 10);
        ctx.fill();

    } else {
        // FIRE TURRET: Dual Guns (Existing)
        ctx.fillStyle = color;
        ctx.fillRect(-8, -8, 24, 6); // Barrel 1
        ctx.fillRect(-8, 2, 24, 6); // Barrel 2
    }

    // Central Hub (Common)
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 4. Icons Above Turret (New Requirement)
    ctx.save();
    ctx.translate(0, -50); // Float above
    ctx.shadowBlur = 15;
    ctx.shadowColor = baseColor;
    ctx.fillStyle = baseColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 24px Orbitron'; // Large Icon Font

    let icon = '🔥'; // Fire
    if (variant === 'ice') icon = '❄️';
    if (variant === 'heal') icon = '✚'; // Green Plus

    ctx.fillText(icon, 0, 0);
    ctx.restore();

    // 4. Heal Tether (Specific to Heal Variant)
    if (variant === 'heal' && isActive) {
        const dToPlayer = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
        if (dToPlayer <= 800) { // Turret Range
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4ade80';

            // Draw energy beam
            ctx.beginPath();
            ctx.moveTo(0, 0); // Turret center (relative)
            // Calculate player relative pos
            const relX = state.player.x - poi.x;
            const relY = state.player.y - poi.y;

            // Zigzag effect
            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const tx = relX * t;
                const ty = relY * t;
                const noise = (Math.random() - 0.5) * 10;
                ctx.lineTo(tx + noise, ty + noise);
            }
            ctx.stroke();

            // Pulse on player
            ctx.fillStyle = '#4ade80';
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(relX, relY, 20 + Math.sin(time * 10) * 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // 4. Overheat / Repair Progress
    if (poi.activationProgress > 0) {
        const barWidth = 60;
        const barHeight = 6;
        const yOffset = -40;

        ctx.fillStyle = '#000';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth, barHeight, 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        renderRoundRect(ctx, -barWidth / 2, yOffset, barWidth * (poi.activationProgress / 100), barHeight, 2);
        ctx.fill();

        // Cost Display
        const cost = poi.turretCost || 10;
        ctx.font = 'bold 12px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${t.repair}: ${cost} ${t.dust}`, 0, yOffset - 10);
    }

    // 5. Level Indicator (LVL X)
    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 1.0;
    ctx.fillText(`${t.level} ${level}`, 0, 52);

    // 6. Status Text
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
    } else if (dToPlayer < poi.radius) {
        const cost = poi.turretCost || (10 * Math.pow(2, poi.turretUses || 0));

        ctx.save();
        ctx.translate(0, 85);

        // Key box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark background
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        renderRoundRect(ctx, -15, -15, 30, 30, 4);
        ctx.fill();
        ctx.stroke();

        // Key text
        ctx.font = 'bold 18px Orbitron';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('E', 0, 0);
        ctx.restore();

        // Dust required
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
