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


            const pulse = (Math.sin(state.gameTime * 5) + 1) * 2;
            ctx.shadowBlur = 10 + pulse;
            ctx.shadowColor = '#4ade80';


            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;


            ctx.beginPath();
            ctx.moveTo(0, -10 - pulse / 2);
            ctx.lineTo(8 + pulse / 2, 0);
            ctx.lineTo(0, 10 + pulse / 2);
            ctx.lineTo(-8 - pulse / 2, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();


            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();


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


        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const pulseScale = 1 + Math.sin(state.gameTime * 3 + m.id) * 0.08;
        ctx.scale(pulseScale, pulseScale);

        if (m.magnetized) ctx.translate((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);

        if (m.isBlueprint) {
            const size = 32;
            const img = (meteoriteImages as any).blueprint;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            }
        } else if (m.type === 'void_flux') {
            const size = 32;
            const img = (meteoriteImages as any).void_flux;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (m.type === 'dust_pile') {
            const size = 24;
            const img = (meteoriteImages as any).dust_pile;
            if (img && img.complete && img.naturalWidth !== 0) {
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (m.type === 'vital_spark') {
            const pulse = (Math.sin(state.gameTime * 8 + m.id) + 1) * 0.5;


            ctx.shadowBlur = 15 + pulse * 10;
            ctx.shadowColor = '#fbbf24';


            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#fbbf24');
            grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 10 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();


            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 14 + pulse * 4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0;
        } else {
            const assetQuality = m.quality;
            const imgKey = `M${m.visualIndex}${assetQuality}`;
            const img = meteoriteImages[imgKey];
            if (img && img.complete && img.naturalWidth !== 0) {
                const size = 32;
                ctx.drawImage(img, -size / 2, -size / 2, size, size);
            } else {
                let color = '#EAB308';
                if (m.rarity === 'anomalous') color = '#60a5fa';
                else if (m.rarity === 'abyss') color = '#4F46E5';
                else if (m.rarity === 'eternal') color = '#B8860B';
                else if (m.rarity === 'divine') color = '#FFFFFF';
                else if (m.rarity === 'singularity') color = '#E942FF';

                ctx.fillStyle = color;
                ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, -6); ctx.lineTo(12, 6); ctx.lineTo(0, 12); ctx.lineTo(-10.5, 7.5); ctx.lineTo(-9, -7.5); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
            }
        }

        if (state.tutorial.isActive &&
            state.tutorial.currentStep === TutorialStep.COLLECT_METEORITE &&
            state.gameTime >= 60 &&
            state.meteorites.length > 0 &&
            m === state.meteorites[0]) {

            const pulse = 1 + Math.sin(state.gameTime * 5) * 0.2;
            ctx.filter = `drop-shadow(0 0 10px #00ffff)`;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3 / pulse;
            ctx.beginPath();
            ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.filter = 'none';


            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(0, -60 - (pulse * 10));
            ctx.lineTo(10, -80 - (pulse * 10));
            ctx.lineTo(-10, -80 - (pulse * 10));
            ctx.closePath();
            ctx.fill();


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


    const hover = Math.sin(state.gameTime * 2) * 20;
    ctx.translate(0, hover);

    if (img && img.complete && img.naturalWidth !== 0) {
        const size = 300;
        ctx.drawImage(img, -size / 2, -size / 2, size, size);


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


    }
    const dpr = window.devicePixelRatio || 1;
    const zoom = scaleFactor * 0.58 * dpr;


    const activeBosses = state.enemies.filter(e => e.boss && !e.dead);
    activeBosses.forEach((e, index) => {
        const screenX = (e.x - camera.x) * zoom + width / 2;
        const screenY = (e.y - camera.y) * zoom + height / 2;
        const pad = 60 * dpr;


        if (screenX < pad || screenX > width - pad || screenY < pad || screenY > height - pad) {
            let ix = Math.max(pad, Math.min(width - pad, screenX));
            let iy = Math.max(pad, Math.min(height - pad, screenY));


            if (activeBosses.length > 1) {
                const offset = (index - (activeBosses.length - 1) / 2) * (40 * dpr);

                if (ix === pad || ix === width - pad) iy += offset;
                else ix += offset;
            }

            ctx.save();
            ctx.translate(ix, iy);


            const pulse = 1 + Math.sin(state.gameTime * 8) * 0.15;
            ctx.scale(pulse, pulse);

            const bossColor = '#ff0000';
            ctx.fillStyle = bossColor;
            ctx.shadowBlur = 15;
            ctx.shadowColor = bossColor;

            const size = 45 * dpr;


            ctx.beginPath();
            ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
            ctx.fill();


            ctx.beginPath();
            ctx.roundRect(-size * 0.25, size * 0.25, size * 0.5, size * 0.3, 4 * dpr);
            ctx.fill();


            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-size * 0.18, size * 0.05, size * 0.12, 0, Math.PI * 2);
            ctx.arc(size * 0.18, size * 0.05, size * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    });


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
