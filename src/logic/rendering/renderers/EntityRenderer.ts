import type { GameState } from '../../core/types';
import { TutorialStep } from '../../core/types';



export function renderDrones(ctx: CanvasRenderingContext2D, state: GameState) {
    state.drones.forEach(d => {
        ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2); ctx.fill();
    });
}

export function renderAllies(ctx: CanvasRenderingContext2D, state: GameState) {
    if (!state.allies) return;
    state.allies.forEach(a => {
        if (a.type === 'heal_drone') {
            ctx.save();
            ctx.translate(a.x, a.y);

            // Outer pulse glow
            const pulse = (Math.sin(state.gameTime * 5) + 1) * 2;
            ctx.shadowBlur = 10 + pulse;
            ctx.shadowColor = '#4ade80';

            // Drone body
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;

            // Diamond shape
            ctx.beginPath();
            ctx.moveTo(0, -10 - pulse / 2);
            ctx.lineTo(8 + pulse / 2, 0);
            ctx.lineTo(0, 10 + pulse / 2);
            ctx.lineTo(-8 - pulse / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Center core
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            // Rotors/Flanges
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 1;
            const rot = state.gameTime * 10;
            for (let i = 0; i < 4; i++) {
                const angle = rot + (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
                ctx.lineTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
                ctx.stroke();
            }

            ctx.restore();
        }
    });
}

export function renderMeteorites(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    state.meteorites.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.translate(0, Math.sin(state.gameTime * 3 + m.id) * 5);
        if (m.magnetized) ctx.translate((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);

        if (m.isBlueprint) {
            const size = 32;
            const bloomSize = size * 2.5;
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomSize / 2);
            grad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
            grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(-bloomSize / 2, -bloomSize / 2, bloomSize, bloomSize);
            ctx.globalCompositeOperation = 'source-over';

            const img = (meteoriteImages as any).blueprint;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.2 + Math.sin(state.gameTime * 5) * 0.1;
                ctx.drawImage(img, -size / 2 - 2, -size / 2 - 2, size + 4, size + 4);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            }
        } else if (m.type === 'void_flux') {
            const size = 32;
            const img = (meteoriteImages as any).void_flux;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.5 + Math.sin(state.gameTime * 4) * 0.2;
                ctx.drawImage(img, -size / 2 - 4, -size / 2 - 4, size + 8, size + 8);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            } else {
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            const assetQuality = m.quality;
            const imgKey = `M${m.visualIndex}${assetQuality}`;
            const img = meteoriteImages[imgKey];
            if (img && img.complete && img.naturalWidth !== 0) {
                const size = 32;
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
                // Always apply glow for now, or maybe only for non-Radiant?
                // For now, let's just apply it to everything to look nice.
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.4;
                ctx.drawImage(img, -size / 2 - 2, -size / 2 - 2, size + 4, size + 4);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = 'source-over';
            } else {
                let color = '#EAB308'; // Radiant (Gold)
                if (m.rarity === 'anomalous') color = '#60a5fa'; // Blue
                else if (m.rarity === 'abyss') color = '#4F46E5'; // Abyss (Indigo)
                else if (m.rarity === 'eternal') color = '#B8860B'; // Eternal (Dark Gold)
                else if (m.rarity === 'divine') color = '#FFFFFF'; // Divine (White)
                else if (m.rarity === 'singularity') color = '#E942FF'; // Singularity (Magenta)

                ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
                ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, -6); ctx.lineTo(12, 6); ctx.lineTo(0, 12); ctx.lineTo(-10.5, 7.5); ctx.lineTo(-9, -7.5); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
            }
        }
        // Tutorial Highlight (First Meteorite Only)
        if (state.tutorial.isActive &&
            state.tutorial.currentStep === TutorialStep.COLLECT_METEORITE &&
            state.gameTime >= 60 &&
            state.meteorites.length > 0 &&
            m === state.meteorites[0]) {

            const pulse = 1 + Math.sin(state.gameTime * 5) * 0.2;
            ctx.filter = `drop-shadow(0 0 10px #00ffff)`;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3 / pulse; // Keep stroke consistent visually
            ctx.beginPath();
            ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.filter = 'none';

            // Floating Arrow
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(0, -60 - (pulse * 10));
            ctx.lineTo(10, -80 - (pulse * 10));
            ctx.lineTo(-10, -80 - (pulse * 10));
            ctx.closePath();
            ctx.fill();

            // Text
            ctx.font = '900 12px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText("COLLECT", 0, -90 - (pulse * 10));
        }

        ctx.restore();
    });
}

export function renderExtractionShip(ctx: CanvasRenderingContext2D, state: GameState, images: Record<string, HTMLImageElement>) {
    if (!['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) return;
    if (!state.extractionShipPos) return;

    const { x, y } = state.extractionShipPos;
    const img = (images as any).ship;

    ctx.save();
    ctx.translate(x, y);

    // Hover effect
    const hover = Math.sin(state.gameTime * 2) * 20;
    ctx.translate(0, hover);

    if (img && img.complete && img.naturalWidth !== 0) {
        const size = 300;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);

        // Engine Glow
        ctx.globalCompositeOperation = 'lighter';
        const glow = 20 + Math.sin(state.gameTime * 10) * 10;
        const grad = ctx.createRadialGradient(0, size * 0.4, 0, 0, size * 0.4, glow * 2);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, size * 0.4, glow * 2, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Placeholder Ship (Arrow shape)
        ctx.fillStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(0, -60);
        ctx.lineTo(80, 40);
        ctx.lineTo(0, 20);
        ctx.lineTo(-80, 40);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    // Arrival/Beacon Animation
    if (state.extractionStatus === 'active') {
        const progress = 1 - (state.extractionTimer / 65);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 5;
        ctx.setLineDash([20, 10]);
        ctx.lineDashOffset = -state.gameTime * 50;
        ctx.beginPath();
        ctx.arc(0, 0, 200 * (1 - progress), 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

export function renderBossIndicator(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, camera: { x: number, y: number }, scaleFactor: number) {
    if (state.bossPresence > 0.01) {
        // Red vignettte or indicators?
        // Logic handled in GameRenderer.ts main overlay
    }
    const dpr = window.devicePixelRatio || 1;
    const zoom = scaleFactor * 0.58 * dpr;

    // Boss Indicators (Skull + Shape/Color)
    const activeBosses = state.enemies.filter(e => e.boss && !e.dead);
    activeBosses.forEach((e, index) => {
        const screenX = (e.x - camera.x) * zoom + width / 2;
        const screenY = (e.y - camera.y) * zoom + height / 2;
        const pad = 60 * dpr;

        // Show indicator if off-screen
        if (screenX < pad || screenX > width - pad || screenY < pad || screenY > height - pad) {
            let ix = Math.max(pad, Math.min(width - pad, screenX));
            let iy = Math.max(pad, Math.min(height - pad, screenY));

            // Offset overlapping indicators slightly
            if (activeBosses.length > 1) {
                const offset = (index - (activeBosses.length - 1) / 2) * (40 * dpr);
                // Offset along the perimeter
                if (ix === pad || ix === width - pad) iy += offset;
                else ix += offset;
            }

            ctx.save();
            ctx.translate(ix, iy);

            // Pulse synced with game time to avoid 'laging' feel of Date.now()
            const pulse = 1 + Math.sin(state.gameTime * 8) * 0.15;
            ctx.scale(pulse, pulse);

            const bossColor = '#ff0000'; // Force to clean red
            ctx.fillStyle = bossColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = bossColor;

            const size = 45 * dpr;

            // 1. Draw Skull Base
            ctx.beginPath();
            ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
            ctx.fill();

            // Rounded Jaw
            ctx.beginPath();
            ctx.roundRect(-size * 0.25, size * 0.25, size * 0.5, size * 0.3, 4 * dpr);
            ctx.fill();

            // Eyes (Black)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-size * 0.18, size * 0.05, size * 0.12, 0, Math.PI * 2);
            ctx.arc(size * 0.18, size * 0.05, size * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });

    // Rare/Snitch Indicators (Circle Ping)
    state.enemies.filter(e => e.isRare && !e.dead).forEach(e => {
        const screenX = (e.x - camera.x) * zoom + width / 2;
        const screenY = (e.y - camera.y) * zoom + height / 2;
        const pad = 60 * dpr;
        if (screenX < pad || screenX > width - pad || screenY < pad || screenY > height - pad) {
            const ix = Math.max(pad, Math.min(width - pad, screenX));
            const iy = Math.max(pad, Math.min(height - pad, screenY));
            ctx.save(); ctx.translate(ix, iy);
            const pulse = 1 + Math.sin(Date.now() / 100) * 0.2;
            ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
            ctx.beginPath(); ctx.arc(0, 0, 20 * pulse, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    });
}
