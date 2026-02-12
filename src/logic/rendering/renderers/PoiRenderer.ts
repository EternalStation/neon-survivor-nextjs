import type { GameState, MapPOI } from '../../core/types';

export function renderPOIs(ctx: CanvasRenderingContext2D, state: GameState) {
    state.pois.forEach(poi => {
        if (poi.respawnTimer > 0) return; // Skip if in the 30s relocation phase

        ctx.save();
        ctx.translate(poi.x, poi.y);

        if (poi.type === 'overclock') {
            renderOverclock(ctx, state, poi);
        } else if (poi.type === 'anomaly') {
            renderAnomaly(ctx, state, poi);
        }

        ctx.restore();
    });
}

function renderOverclock(ctx: CanvasRenderingContext2D, state: GameState, poi: MapPOI) {
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
        ctx.fillText("SYNCING...", 0, -80);
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
        ctx.fillText(`RECHARGING: ${Math.ceil(poi.cooldown)}s`, 0, 60);
    } else if (poi.active) {
        const timeLeft = Math.ceil(30 - poi.activeDuration);
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#22d3ee';
        ctx.textAlign = 'center';
        ctx.fillText(`ACTIVE: ${timeLeft}s`, 0, 80);
    }
}

function renderAnomaly(ctx: CanvasRenderingContext2D, state: GameState, poi: MapPOI) {
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
        ctx.fillText("RITUAL...", 0, yOffset - 10);
    }

    // 5. Cooldown Indicator
    if (poi.cooldown > 0) {
        ctx.font = 'bold 14px Orbitron';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(`DORMANT: ${Math.ceil(poi.cooldown)}s`, 0, 80);
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
