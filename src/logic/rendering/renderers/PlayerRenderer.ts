import { PLAYER_CLASSES } from '../../core/classes';
import { PALETTES } from '../../core/constants';
import type { GameState } from '../../core/types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { GAME_CONFIG } from '../../core/GameConfig';
import { getHexLevel } from '../../upgrades/LegendaryLogic';

export function renderPlayer(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    const { player } = state;
    ctx.save();

    // Ghost Mode (Temporal Guard)
    const now = state.gameTime;
    const ghostAlpha = (player.phaseShiftUntil && now < player.phaseShiftUntil)
        ? (0.5 + Math.sin(now * 20) * 0.3) // Rapid blink
        : 1.0;

    // Apply ghost alpha to context initially, but internal overrides must also respect it
    ctx.globalAlpha = ghostAlpha;

    ctx.translate(player.x, player.y);

    // Radiation Core Aura (Level 1+)
    const radLevel = getHexLevel(state, 'RadiationCore');
    if (radLevel >= 1) {
        ctx.save();
        const radius = 500;
        const t = state.gameTime;

        // Subtle pulsing base
        const pulse = 0.98 + Math.sin(t * 2) * 0.02;

        // Gradient for radioactive field
        const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
        grad.addColorStop(0, 'rgba(163, 230, 53, 0.16)');
        grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.09)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    const cellSize = 18.1;

    const drawHexagon = (x: number, y: number, r: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2; // Pointy-top to match UI
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    const themeColor = PLAYER_CLASSES.find(c => c.id === player.playerClass)?.themeColor || '#22d3ee';
    ctx.strokeStyle = themeColor;
    ctx.fillStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (state.spawnTimer > 0) {
        ctx.shadowBlur = 30 * (state.spawnTimer / GAME_CONFIG.PLAYER.SPAWN_DURATION);
        ctx.shadowColor = themeColor;

        // Progress reach 1.0 when spawnTimer hits 0
        // To remove "delay", we could scale progress to reach 1.0 when timer is at e.g. 0.1s
        const duration = GAME_CONFIG.PLAYER.SPAWN_DURATION;
        const progress = Math.min(1.0, Math.max(0, duration - state.spawnTimer) / (duration * 0.9)); // Reaches 1.0 at 90% of duration
        const ease = 1 - Math.pow(1 - progress, 3);
        const spin = (1.0 - ease) * Math.PI * 4;
        ctx.rotate(spin);

        const scale = Math.min(1, ease * 1.5);
        if (scale > 0) {
            ctx.save();
            ctx.scale(scale, scale);
            drawHexagon(0, 0, cellSize);

            // Draw Class Icon in center during spawn
            const pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
            if (pClass) {
                let imgKey = '';
                if (pClass.id === 'malware') imgKey = 'MalwarePrime';
                else if (pClass.id === 'eventhorizon') imgKey = 'EventHorizon';
                else if (pClass.id === 'stormstrike') imgKey = 'CosmicBeam';
                else if (pClass.id === 'aigis') imgKey = 'AigisVortex';
                else if (pClass.id === 'hivemother') imgKey = 'HiveMother';

                const img = meteoriteImages[imgKey];
                if (img && img.complete) {
                    const iconSize = cellSize * 2.1; // Increased from 1.8 to 2.1
                    ctx.save();
                    ctx.globalAlpha = 0.8 * Math.min(1, ease * 2);
                    ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        const finalDist = cellSize * Math.sqrt(3);
        const startDist = finalDist * 5;
        const currentDist = startDist - (startDist - finalDist) * ease;

        ctx.globalAlpha = Math.min(1, ease * 2);
        const hexSockets = state.moduleSockets.hexagons;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i; // Match UI placement (0, 60, 120...)
            const cx = currentDist * Math.cos(angle);
            const cy = currentDist * Math.sin(angle);
            drawHexagon(cx, cy, cellSize);

            // Draw Legendary Icon in spawn
            const hex = hexSockets[i];
            if (hex) {
                const iconName = hex.customIcon?.split('/').pop()?.split('.')[0];
                if (iconName) {
                    const img = meteoriteImages[iconName];
                    if (img && img.complete) {
                        const iconSize = cellSize * 2.2; // Increased from 1.9 to 2.2
                        ctx.save();
                        ctx.globalAlpha = 0.7 * Math.min(1, ease * 2);
                        ctx.drawImage(img, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
                        ctx.restore();
                    }
                }
            }
        }
        ctx.globalAlpha = 1;
    } else {
        ctx.shadowBlur = 0;
        drawHexagon(0, 0, cellSize);

        // Draw Class Icon in center
        const pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
        if (pClass) {
            let imgKey = '';
            if (pClass.id === 'malware') imgKey = 'MalwarePrime';
            else if (pClass.id === 'eventhorizon') imgKey = 'EventHorizon';
            else if (pClass.id === 'stormstrike') imgKey = 'CosmicBeam';
            else if (pClass.id === 'aigis') imgKey = 'AigisVortex';
            else if (pClass.id === 'hivemother') imgKey = 'HiveMother';

            const img = meteoriteImages[imgKey];
            if (img && img.complete) {
                const iconSize = cellSize * 2.1; // Increased from 1.8 to 2.1
                ctx.save();
                ctx.globalAlpha = 0.8 * ghostAlpha;
                ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
                ctx.restore();
            }
        }

        const cellDistance = cellSize * Math.sqrt(3);
        const hexSockets = state.moduleSockets.hexagons;
        for (let i = 0; i < 6; i++) {
            ctx.save(); // STRICT ISOLATION START

            const angle = (Math.PI / 3) * i; // Match UI placement (0, 60, 120...)
            const cx = cellDistance * Math.cos(angle);
            const cy = cellDistance * Math.sin(angle);

            // Strict reset of styles
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0 * ghostAlpha;
            ctx.globalCompositeOperation = 'source-over';

            ctx.strokeStyle = themeColor;
            ctx.fillStyle = '#020617';
            ctx.lineWidth = 2.5;

            // Draw Base Hexagon (Fill Only)
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const ang = (Math.PI / 3) * j - Math.PI / 2;
                const px = cx + cellSize * Math.cos(ang);
                const py = cy + cellSize * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = '#020617';
            ctx.fill();

            // Draw Legendary Icon if socketed
            const hex = hexSockets[i];
            if (hex) {
                const iconName = hex.customIcon?.split('/').pop()?.split('.')[0];
                if (iconName) {
                    const img = meteoriteImages[iconName];
                    if (img && img.complete) {
                        const iconSize = cellSize * 2.0; // Increased from 1.7 to 2.0
                        ctx.globalAlpha = 0.8 * ghostAlpha;
                        ctx.drawImage(img, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
                    }
                }
            }

            // Draw Hexagon Border (Stroke Only) - Drawn LAST to overlap icon
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const ang = (Math.PI / 3) * j - Math.PI / 2;
                const px = cx + cellSize * Math.cos(ang);
                const py = cy + cellSize * Math.sin(ang);
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = themeColor;
            ctx.lineWidth = 2.5;
            ctx.stroke();


            ctx.restore(); // STRICT ISOLATION END
        }
    }

    ctx.restore();

    // --- SHIELD RIPPLE (Active Shield Chunks) ---
    const totalShield = (player.shieldChunks || []).reduce((sum, c) => sum + c.amount, 0);
    if (totalShield > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        const time = state.gameTime;
        const pulse = 0.8 + Math.sin(time * 6) * 0.2;
        const shieldColor = '#3b82f6'; // Bright Blue

        ctx.strokeStyle = shieldColor;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = shieldColor;
        ctx.globalAlpha = 0.4 * pulse;

        // Draw multiple expanding hexagonal rings
        for (let i = 0; i < 2; i++) {
            const ringProgress = (time * 1.5 + i * 0.5) % 1.0;
            const r = cellSize * (1.8 + ringProgress * 0.6);
            ctx.globalAlpha = 0.3 * (1 - ringProgress) * pulse;

            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const ang = (Math.PI / 3) * j - Math.PI / 2;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }

        // Inner solid-ish barrier
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = shieldColor;
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const ang = (Math.PI / 3) * j - Math.PI / 2;
            const r = cellSize * 2.0;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // Stun VFX
    if (player.stunnedUntil && now < player.stunnedUntil) {
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 10;
        const arcCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < arcCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 25 + Math.random() * 10;
            const startX = Math.cos(angle) * 15;
            const startY = Math.sin(angle) * 15;
            const endX = Math.cos(angle) * dist;
            const endY = Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 20;
            const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        ctx.restore();
    }
}
