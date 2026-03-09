import { PLAYER_CLASSES } from '../../core/Classes';
import { PALETTES } from '../../core/Constants';
import type { GameState } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { GAME_CONFIG } from '../../core/GameConfig';
import { getHexLevel } from '../../upgrades/LegendaryLogic';

export function renderPlayer(ctx: CanvasRenderingContext2D, player: any, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {

    ctx.save();
    const now = state.gameTime;
    const ghostAlpha = (player.phaseShiftUntil && now < player.phaseShiftUntil)
        ? (0.5 + Math.sin(now * 20) * 0.3)
        : 1.0;

    ctx.globalAlpha = ghostAlpha;
    ctx.translate(player.x, player.y);


    const radLevel = getHexLevel(state, 'RadiationCore');
    const mireLvl = getHexLevel(state, 'IrradiatedMire');
    const neutronLvl = getHexLevel(state, 'NeutronStar');

    if (radLevel >= 1 || mireLvl >= 1 || neutronLvl >= 1) {
        ctx.save();
        const radius = (mireLvl >= 1 || neutronLvl >= 1) ? 666 : 500;
        const t = state.gameTime;

        const pulse = 0.98 + Math.sin(t * 2) * 0.02;

        const grad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
        if (neutronLvl >= 1) {
            grad.addColorStop(0, 'rgba(250, 204, 21, 0.16)');
            grad.addColorStop(0.5, 'rgba(163, 230, 53, 0.09)');
            grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        } else if (mireLvl >= 1) {
            grad.addColorStop(0, 'rgba(34, 197, 94, 0.16)');
            grad.addColorStop(0.5, 'rgba(22, 163, 74, 0.09)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        } else {
            grad.addColorStop(0, 'rgba(163, 230, 53, 0.16)');
            grad.addColorStop(0.5, 'rgba(34, 197, 94, 0.09)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

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
            const angle = (Math.PI / 3) * i - Math.PI / 2;
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


    const spawnTimer = (player.spawnTimer !== undefined) ? player.spawnTimer : 0;

    if (spawnTimer > 0) {
        ctx.shadowBlur = 30 * (spawnTimer / GAME_CONFIG.PLAYER.SPAWN_DURATION);
        ctx.shadowColor = themeColor;

        const duration = GAME_CONFIG.PLAYER.SPAWN_DURATION;
        const progress = Math.min(1.0, Math.max(0, duration - spawnTimer) / (duration * 0.9));
        const ease = 1 - Math.pow(1 - progress, 3);
        const spin = (1.0 - ease) * Math.PI * 4;
        ctx.rotate(spin);

        const scale = Math.min(1, ease * 1.5);
        if (scale > 0) {
            ctx.save();
            ctx.scale(scale, scale);
            drawHexagon(0, 0, cellSize);

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
                    const iconSize = cellSize * 2.1;
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
        const hexSockets = player.moduleSockets?.hexagons || [];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const cx = currentDist * Math.cos(angle);
            const cy = currentDist * Math.sin(angle);
            drawHexagon(cx, cy, cellSize);

            const hex = hexSockets[i];
            if (hex) {
                const iconName = hex.customIcon?.split('/').pop()?.split('.')[0];
                if (iconName) {
                    const img = meteoriteImages[iconName];
                    if (img && img.complete) {
                        const iconSize = cellSize * 2.2;
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
                const iconSize = cellSize * 2.1;
                ctx.save();
                ctx.globalAlpha = 0.8 * ghostAlpha;
                ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
                ctx.restore();
            }
        }

        const cellDistance = cellSize * Math.sqrt(3);
        const hexSockets = player.moduleSockets?.hexagons || [];
        for (let i = 0; i < 6; i++) {
            ctx.save();

            const angle = (Math.PI / 3) * i;
            const cx = cellDistance * Math.cos(angle);
            const cy = cellDistance * Math.sin(angle);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0 * ghostAlpha;
            ctx.globalCompositeOperation = 'source-over';

            ctx.strokeStyle = themeColor;
            ctx.fillStyle = '#020617';
            ctx.lineWidth = 2.5;

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

            const hex = hexSockets[i];
            if (hex) {
                const iconName = hex.customIcon?.split('/').pop()?.split('.')[0];
                if (iconName) {
                    const img = meteoriteImages[iconName];
                    if (img && img.complete) {
                        const iconSize = cellSize * 2.0;
                        ctx.globalAlpha = 0.8 * ghostAlpha;
                        ctx.drawImage(img, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
                    }
                }
            }

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

            ctx.restore();
        }


        if (player.buffs?.waveSpeed && state.gameTime < player.buffs.waveSpeed) {
            if (Math.random() > 0.8) {
                const angle = Math.atan2(player.knockback.y, player.knockback.x) + Math.PI;
                const scatter = (Math.random() - 0.5) * 1.2;
                const pAngle = angle + scatter;
                const speed = 1.5 + Math.random() * 2.5;

                state.particles.push({
                    x: player.x + (Math.random() - 0.5) * cellSize,
                    y: player.y + cellSize * 0.8,
                    vx: Math.cos(pAngle) * speed,
                    vy: Math.sin(pAngle) * speed,
                    life: 12 + Math.random() * 8,
                    maxLife: 20,
                    color: Math.random() > 0.5 ? '#ef4444' : '#fbbf24',
                    size: 0.8 + Math.random() * 1.2,
                    type: 'dust',
                    alpha: 0.5,
                    decay: 0.04
                });
            }
        }
    }

    ctx.restore();


    const totalShield = (player.shieldChunks || []).reduce((sum: number, c: any) => sum + c.amount, 0);
    if (totalShield > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        const time = state.gameTime;
        const pulse = 0.8 + Math.sin(time * 6) * 0.2;
        const shieldColor = '#3b82f6';
        const cellDistance = cellSize * Math.sqrt(3);

        ctx.strokeStyle = shieldColor;
        ctx.lineWidth = 2.0;
        ctx.shadowBlur = 12;
        ctx.shadowColor = shieldColor;

        const centers: [number, number][] = [[0, 0]];
        for (let i = 0; i < 6; i++) {
            const ang = (Math.PI / 3) * i;
            centers.push([cellDistance * Math.cos(ang), cellDistance * Math.sin(ang)]);
        }

        for (let i = 0; i < 2; i++) {
            const ringProgress = (time * 1.5 + i * 0.5) % 1.0;
            const expansion = 1.1 + ringProgress * 0.25;
            ctx.globalAlpha = 0.25 * (1 - ringProgress) * pulse;

            centers.forEach(([cx, cy]) => {
                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                    const ang = (Math.PI / 3) * j - Math.PI / 2;
                    const r = cellSize * expansion;
                    const px = cx + Math.cos(ang) * r;
                    const py = cy + Math.sin(ang) * r;
                    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();
            });
        }

        ctx.globalAlpha = 0.1;
        ctx.fillStyle = shieldColor;
        centers.forEach(([cx, cy]) => {
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const ang = (Math.PI / 3) * j - Math.PI / 2;
                const r = cellSize * 1.15;
                const px = cx + Math.cos(ang) * r;
                const py = cy + Math.sin(ang) * r;
                if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            ctx.save();
            ctx.globalAlpha = 0.3 * pulse;
            ctx.stroke();
            ctx.restore();
        });

        ctx.restore();
    }



    if (player.orbitalVortexUntil && now < player.orbitalVortexUntil) {
        ctx.save();
        ctx.translate(player.x, player.y);

        const vPulse = 0.8 + Math.sin(now * 10) * 0.2;
        const vortexGrad = ctx.createRadialGradient(0, 0, 50, 0, 0, GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS);
        vortexGrad.addColorStop(0, 'rgba(245, 158, 11, 0.05)');
        vortexGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.02)');
        vortexGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = vortexGrad;
        ctx.beginPath();
        ctx.arc(0, 0, GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(now * 3);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.3 * vPulse;

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 100 + i * 40, (i * Math.PI) / 2, (i * Math.PI) / 2 + Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }


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


    if (player.healingDisabled) {
        ctx.save();
        ctx.translate(player.x, player.y - 80);
        const time = state.gameTime;
        const pulse = 0.8 + Math.sin(time * 10) * 0.2;
        ctx.globalAlpha = pulse;

        const size = 20;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, size * 0.7);
        ctx.bezierCurveTo(-size, 0, -size, -size, 0, -size * 0.3);
        ctx.bezierCurveTo(size, -size, size, 0, 0, size * 0.7);
        ctx.fill();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const xSize = 10;
        ctx.moveTo(-xSize, -xSize);
        ctx.lineTo(xSize, xSize);
        ctx.moveTo(xSize, -xSize);
        ctx.lineTo(-xSize, xSize);
        ctx.stroke();

        ctx.restore();
    }


    if (player.invertedControlsUntil && now < player.invertedControlsUntil) {
        ctx.save();
        ctx.translate(0, 0);

        const t = state.gameTime;

        for (let i = 0; i < 8; i++) {
            const offX = Math.sin(i * 123 + t * 40) * 40;
            const offY = Math.cos(i * 456 + t * 40) * 40;
            const sz = 4 + Math.random() * 8;
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff';
            ctx.globalAlpha = 0.6;
            ctx.fillRect(offX, offY, sz, sz);
        }

        if (Math.sin(t * 15) > 0) {
            ctx.font = "900 12px 'Outfit', sans-serif";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ff00ff";
            ctx.fillText("SYSTEM GLITCH", 0, -45);
        }

        ctx.restore();
    }


    ctx.restore();
}

export function renderVoidMarker(ctx: CanvasRenderingContext2D, state: GameState) {
    const { player } = state;
    if (!player.voidMarkerActive || player.voidMarkerX === undefined || player.voidMarkerY === undefined) return;

    const x = player.voidMarkerX;
    const y = player.voidMarkerY;
    const t = state.gameTime;
    const age = t - (player.voidMarkerSpawnTime ?? t);
    const alpha = Math.min(1, age * 4);

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;

    const rotation = (t * 18) % (Math.PI * 2);
    ctx.rotate(rotation);

    const coreRadius = 12;
    const outerRadius = 24;

    for (let i = 0; i < 3; i++) {
        const layerR = coreRadius + (outerRadius - coreRadius) * (i / 2);
        ctx.beginPath();
        ctx.arc(0, 0, layerR, 0, Math.PI * 2);
        const opacity = (0.5 - i * 0.12) * (0.7 + Math.sin(t * 20 + i) * 0.3);
        ctx.strokeStyle = `rgba(139, 92, 246, ${Math.max(0, opacity)})`;
        ctx.lineWidth = 2 - i * 0.5;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, coreRadius + 2, 0, Math.PI * 2);
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    const pulseR = outerRadius * (0.5 + (t % 0.15) / 0.15);
    ctx.beginPath();
    ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 92, 246, ${Math.max(0, 1 - (t % 0.15) / 0.15) * 0.6})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}
