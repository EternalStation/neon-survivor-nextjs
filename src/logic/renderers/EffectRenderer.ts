import type { GameState } from '../types';

export function renderAreaEffects(ctx: CanvasRenderingContext2D, state: GameState) {
    state.areaEffects.forEach(effect => {
        if (effect.type === 'puddle') {
            ctx.save();
            ctx.translate(effect.x, effect.y);
            const segments = 30;
            const baseR = effect.radius;
            const t = state.gameTime;

            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const offset = Math.sin(angle * 6 + t * 2) * 20 + Math.sin(angle * 15 - t * 4) * 10 + Math.sin(angle * 3 + t) * 15;
                const r = baseR + offset;
                if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            const grad = ctx.createRadialGradient(0, 0, baseR * 0.2, 0, 0, baseR);
            grad.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
            grad.addColorStop(0.8, 'rgba(21, 128, 61, 0.7)');
            grad.addColorStop(1, 'rgba(6, 182, 212, 0.5)');
            ctx.fillStyle = grad; ctx.fill();
            ctx.lineWidth = 4; ctx.strokeStyle = '#06b6d4'; ctx.stroke();

            ctx.globalAlpha = 0.3; ctx.strokeStyle = '#bef264'; ctx.lineWidth = 2;
            const rippleP = (t * 50) % baseR;
            ctx.beginPath(); ctx.arc(0, 0, rippleP, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        } else if (effect.type === 'epicenter') {
            const baseR = effect.radius || 500;
            // const pTimer = effect.pulseTimer || 0;
            // const progress = pTimer / 0.5;
            if (isNaN(effect.x) || isNaN(effect.y)) return;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.beginPath();
            for (let a = 0; a < 6.28; a += 0.2) {
                const ripple = Math.sin(a * 8 + state.gameTime * 2) * 5;
                const r = baseR + ripple;
                if (a === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.6);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6);
            }
            ctx.closePath();
            const frostGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseR);
            frostGrad.addColorStop(0, 'rgba(186, 230, 253, 0.25)');
            frostGrad.addColorStop(0.8, 'rgba(14, 165, 233, 0.15)');
            frostGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
            ctx.fillStyle = frostGrad; ctx.fill();
            ctx.shadowBlur = 10; ctx.shadowColor = '#22d3ee'; ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;


            const pulseR = baseR * (0.5 + (state.gameTime % 1.5) / 1.5);
            ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, pulseR), Math.max(1, pulseR * 0.6), 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - (state.gameTime % 1.5) / 1.5)})`; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();

            const progress = ((effect.pulseTimer || 0) / 0.5) % 1;

            ctx.save(); ctx.translate(effect.x, effect.y);
            const spikeCount = 16;
            const shardScale = 0.75;

            // Use simple flat color for performance
            ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;

            for (let i = 0; i < spikeCount; i++) {
                const seedX = Math.sin(i * 123.4) * (baseR * shardScale);
                const seedY = Math.cos(i * 567.8) * (baseR * shardScale) * 0.6;
                const localOff = (i * 0.13) % 0.5;
                const heightProg = Math.max(0, Math.sin(((progress + localOff) % 1) * Math.PI));
                const h = (70 + Math.sin(i * 2) * 15) * heightProg;
                const w = (15 + Math.cos(i) * 5);
                const tilt = Math.sin(i * 456) * 10;

                if (h <= 0) continue;
                ctx.save(); ctx.translate(seedX, seedY); ctx.rotate(tilt * Math.PI / 180);

                ctx.beginPath();
                ctx.moveTo(-w / 2, 0);
                ctx.lineTo(0, -h);
                ctx.lineTo(w / 2, 0);
                ctx.closePath();

                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            ctx.restore();
        } else if (effect.type === 'blackhole') {
            // --- VOID SINGULARITY VISUAL (Core + Reverted Organic Outline) ---
            const pullRadius = 400; // Updated to match logic
            const coreRadius = 40;
            if (isNaN(effect.x) || isNaN(effect.y)) return;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            const t = state.gameTime;

            // 1. ORGANIC ACCRETION DISK (Reverted to previous style)
            const rotation = (t * 3) % (Math.PI * 2);
            for (let layer = 0; layer < 6; layer++) {
                // Layer radius scales from core to pull edge
                const layerRadius = coreRadius + (pullRadius - coreRadius) * (0.2 + layer * 0.15);
                if (layerRadius > pullRadius) continue;

                const numSegments = 60;
                ctx.beginPath();
                for (let i = 0; i <= numSegments; i++) {
                    const angle = (i / numSegments) * Math.PI * 2 + rotation + (layer * 0.3);
                    const distortionAngle = angle + Math.sin(angle * 3 + t * 5) * 0.3;
                    const x = Math.cos(distortionAngle) * layerRadius;
                    const y = Math.sin(distortionAngle) * layerRadius * 0.6;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                const opacity = (0.35 - layer * 0.05) * (0.7 + Math.sin(t * 4 + layer) * 0.3);
                ctx.strokeStyle = `rgba(126, 34, 206, ${Math.max(0, opacity)})`;
                ctx.lineWidth = 3 - layer * 0.4;
                ctx.shadowColor = '#7e22ce';
                ctx.shadowBlur = 12 - layer * 1.5;
                ctx.stroke();
            }

            // 2. GRAVITATIONAL LENSING (Keep the clear sharp rim)
            ctx.beginPath();
            ctx.arc(0, 0, coreRadius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#f8fafc'; // Sharp white rim
            ctx.lineWidth = 2;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#38bdf8';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 3. THE SINGULARITY (Keep the pitch black core)
            ctx.beginPath();
            ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.restore();
        } else if (effect.type === 'orbital_strike') {
            // TARGETING VISUAL (0.3s delay)
            // Just a contracting ring or target reticle
            const timeLeft = effect.duration; // 0.3 down to 0
            const progress = 1 - (timeLeft / 0.3); // 0 to 1
            const baseR = effect.radius || 150;

            ctx.save();
            ctx.translate(effect.x, effect.y);

            // Rotating outer ring
            ctx.rotate(state.gameTime * 2);
            ctx.beginPath();
            ctx.arc(0, 0, baseR * (1 - progress * 0.5), 0, Math.PI * 2); // Contracts from 100% to 50%
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + progress * 0.5})`; // Fade in alpha
            ctx.setLineDash([10, 10]);
            ctx.stroke();

            // Inner solid ring
            ctx.beginPath();
            ctx.arc(0, 0, baseR * 0.2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8';
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.restore();

        } else if (effect.type === 'crater') {
            // CRATER + BEAM (Lasts 5s)

            const lifeTime = state.gameTime - effect.creationTime; // Time since creation
            const duration = effect.duration; // 5.0
            const radius = effect.radius || 150;
            const remaining = duration - lifeTime;
            const alpha = Math.max(0, remaining > 1.0 ? 1.0 : remaining); // Fade out last 1 sec

            ctx.save();
            ctx.translate(effect.x, effect.y);

            // 1. CRATER (Scorched SCARS only - No Circle)
            // Draw crossed lines / cracks in the middle
            ctx.strokeStyle = `rgba(50, 60, 80, ${0.8 * alpha})`; // Dark scorch color
            ctx.lineWidth = 3;

            // Random crossed lines near center
            const seed = effect.id; // Consistent random seed
            const count = 4;
            for (let i = 0; i < count; i++) {
                ctx.beginPath();
                // Use deterministic pseudorandom offset based on ID
                const angle = (i * (Math.PI / count)) + (seed % 100) * 0.01;
                const len = radius * 0.4;

                // Draw line through center
                ctx.moveTo(Math.cos(angle) * -len, Math.sin(angle) * -len * 0.6);
                ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len * 0.6);
                ctx.stroke();
            }

            // Add some smaller random cracks
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2.5) + (seed % 50) * 0.1;
                const dist = radius * 0.2;
                const crackLen = radius * 0.3;

                const startX = Math.cos(angle) * dist;
                const startY = Math.sin(angle) * dist * 0.6;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + Math.cos(angle + 0.5) * crackLen, startY + Math.sin(angle + 0.5) * crackLen * 0.6);
                ctx.stroke();
            }

            // 2. BEAM (High Opacity Center -> Fade corners)
            // Only visible for first 0.6s
            const beamDuration = 0.6;
            if (lifeTime < beamDuration) {
                const beamAlpha = 1 - (lifeTime / beamDuration);

                // Beams are tall. Draw huge rectangle going up.
                // We are translated to (x,y).
                // Draw Upwards (-y).
                const beamHeight = 2000;
                const beamWidth = radius * 1.5; // Slightly wider than crater for impact feel

                // Gradient: Horizontal (across beam width) - High Center Opacity
                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, `rgba(56, 189, 248, 0)`); // Corner
                beamGrad.addColorStop(0.2, `rgba(186, 230, 253, ${0.5 * beamAlpha})`); // Transition
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${1.0 * beamAlpha})`); // Center (High Opacity)
                beamGrad.addColorStop(0.8, `rgba(186, 230, 253, ${0.5 * beamAlpha})`); // Transition
                beamGrad.addColorStop(1, `rgba(56, 189, 248, 0)`); // Corner

                ctx.fillStyle = beamGrad;
                ctx.fillRect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight);

                // Add vertical "energy" lines opacity
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * beamAlpha})`;
                ctx.lineWidth = 6; // Thicker core
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -beamHeight);
                ctx.stroke();

                // Add side streaks
                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * beamAlpha})`;
                ctx.beginPath();
                ctx.moveTo(-radius * 0.5, 0); ctx.lineTo(-radius * 0.5, -beamHeight);
                ctx.moveTo(radius * 0.5, 0); ctx.lineTo(radius * 0.5, -beamHeight);
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
        }
    });
}

export function renderEpicenterShield(ctx: CanvasRenderingContext2D, state: GameState) {
    const { player } = state;
    if (player.buffs?.epicenterShield && player.buffs.epicenterShield > 0) {
        ctx.save();
        ctx.translate(player.x, player.y);
        const radius = 80;
        const t = state.gameTime;
        const shimmer = 0.9 + Math.sin(t * 15) * 0.1;
        ctx.scale(shimmer, shimmer);
        const grad = ctx.createRadialGradient(0, 0, radius * 0.7, 0, 0, radius);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
        grad.addColorStop(0.8, 'rgba(59, 130, 246, 0.2)');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0.6)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 15; ctx.stroke();
        ctx.clip();
        const sweepY = (t * 200) % (radius * 4) - radius * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(-radius, sweepY, radius * 2, 20);
        ctx.restore();
    }
}

export function renderParticles(ctx: CanvasRenderingContext2D, state: GameState, filter?: 'void' | 'non-void') {
    state.particles.forEach(p => {
        // Apply filter if specified
        if (filter === 'void' && p.type !== 'void') return;
        if (filter === 'non-void' && p.type === 'void') return;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life < 0.2 ? p.life * 5 : 1;
        if (p.type === 'shard') {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(state.gameTime * 5 + (p.x * 0.1));
            ctx.beginPath(); ctx.moveTo(p.size * 2, 0); ctx.lineTo(-p.size, p.size); ctx.lineTo(-p.size, -p.size); ctx.closePath(); ctx.fill();
            ctx.restore();
        } else if (p.type === 'void') {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            // Black hole core
            ctx.fillStyle = '#000000';
            ctx.fill();
            // Glow border
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (p.type === 'shockwave') {
            ctx.save(); ctx.strokeStyle = p.color || '#FFFFFF'; ctx.lineWidth = 3; ctx.shadowColor = p.color || '#FFFFFF'; ctx.shadowBlur = 5;
            ctx.globalAlpha = (p.alpha || 1.0) * (p.life < 10 ? p.life / 10 : 1.0);
            const angle = Math.atan2(p.vy, p.vx); const radius = p.size;
            const cx = p.x - Math.cos(angle) * (radius * 0.5); const cy = p.y - Math.sin(angle) * (radius * 0.5);
            ctx.beginPath(); ctx.arc(cx, cy, radius, angle - 0.7, angle + 0.7); ctx.stroke();
            ctx.lineWidth = 1; ctx.globalAlpha *= 0.5;
            ctx.beginPath(); ctx.arc(cx, cy, radius * 0.85, angle - 0.6, angle + 0.6); ctx.stroke();
            ctx.restore();
        } else {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}

export function renderFloatingNumbers(ctx: CanvasRenderingContext2D, state: GameState) {
    if (!state.floatingNumbers) return;
    state.floatingNumbers.forEach(fn => {
        const age = fn.life / fn.maxLife;
        ctx.save();
        // Offset (10, -10) to the top-right so the enemy model remains visible
        ctx.translate(fn.x + 10, fn.y - 10);
        const scale = fn.isCrit ? 1.2 + Math.sin(age * Math.PI) * 0.3 : 1.0;
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.min(1, age * 3);
        if (fn.isCrit) ctx.font = "italic 900 25px 'Outfit', sans-serif";
        else ctx.font = "900 20px 'Outfit', sans-serif";
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = fn.isCrit ? 4 : 2; ctx.strokeStyle = '#000000'; ctx.strokeText(fn.value, 0, 0);
        if (fn.isCrit) {
            const grad = ctx.createLinearGradient(0, -12, 0, 12);
            grad.addColorStop(0, '#ef4444'); // Bright Blood Red
            grad.addColorStop(0.5, '#991b1b'); // Deep Crimson
            grad.addColorStop(1, '#450a0a'); // Dark Dried Blood
            ctx.fillStyle = grad; ctx.shadowColor = 'rgba(220, 38, 38, 0.6)'; ctx.shadowBlur = 6;
        } else ctx.fillStyle = fn.color;
        ctx.fillText(fn.value, 0, 0);
        ctx.restore();
    });
}

export function renderScreenEffects(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {
    // 1. Transfer Tunnel
    if (state.portalState === 'transferring') {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        const cx = width / 2; const cy = height / 2;
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, width, height);
        ctx.save(); ctx.translate(cx, cy);
        const color = '#22d3ee'; const baseSize = 50;
        for (let i = 0; i < 20; i++) {
            const z = (state.gameTime * 2 + i * 0.5) % 10; const scale = Math.pow(1.5, z); const alpha = Math.max(0, 1 - z / 10);
            ctx.strokeStyle = color; ctx.lineWidth = 2 + scale; ctx.globalAlpha = alpha;
            ctx.rotate(state.gameTime + i * 0.1);
            ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const ang = Math.PI / 3 * j; const r = baseSize * scale;
                if (j === 0) ctx.moveTo(r * Math.cos(ang), r * Math.sin(ang));
                else ctx.lineTo(r * Math.cos(ang), r * Math.sin(ang));
            }
            ctx.closePath(); ctx.stroke();
            ctx.rotate(-(state.gameTime + i * 0.1));
        }
        if (state.transferTimer < 0.2) {
            ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = (0.2 - state.transferTimer) / 0.2; ctx.fillRect(-cx, -cy, width, height);
        }
        ctx.restore(); ctx.restore();
    }

    // 2. Smoke Blindness
    if (state.smokeBlindTime !== undefined) {
        const elapsed = state.gameTime - state.smokeBlindTime;
        if (elapsed < 2.6) {
            const alpha = elapsed < 0.3 ? elapsed / 0.3 : elapsed < 2.3 ? 1 : 1 - (elapsed - 2.3) / 0.3;
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Base haze (Keep this full screen but very light, 1 rect)
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.05})`;
            ctx.fillRect(0, 0, width, height);

            // Optimized Puffs: Reduced count 20 -> 8
            for (let i = 0; i < 8; i++) {
                const x = i % 2 === 0 ? Math.random() * width : (Math.random() < 0.5 ? Math.random() * 150 : width - Math.random() * 150);
                const y = i % 2 !== 0 ? Math.random() * height : (Math.random() < 0.5 ? Math.random() * 150 : height - Math.random() * 150);

                const drift = Math.sin(state.gameTime * 0.5 + i) * 60;
                // Reduced Size: 100-250 instead of 150-400
                const size = 100 + Math.abs(Math.sin(i)) * 150;

                const grad = ctx.createRadialGradient(x + drift, y + drift, 0, x + drift, y + drift, size);
                // Increased alpha slightly to compensate for fewer particles
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.2})`);
                grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

                ctx.fillStyle = grad;
                // Optimization: Draw only the puff area, not full screen
                ctx.fillRect((x + drift) - size, (y + drift) - size, size * 2, size * 2);
            }
            ctx.restore();
        }
    }
}

// Cache to avoid recreating gradient and fill every frame
let cachedVignetteCanvas: HTMLCanvasElement | null = null;
let lastWidth = 0;
let lastHeight = 0;

export function renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Only recreate if dimensions change significantly (e.g. resize)
    if (!cachedVignetteCanvas || width !== lastWidth || height !== lastHeight) {
        cachedVignetteCanvas = document.createElement('canvas');
        cachedVignetteCanvas.width = width;
        cachedVignetteCanvas.height = height;
        const cCtx = cachedVignetteCanvas.getContext('2d');
        if (cCtx) {
            const radius = Math.max(width, height) * 0.8;
            const cx = width / 2;
            const cy = height / 2;
            const grad = cCtx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.6, 'rgba(2, 6, 23, 0.2)');
            grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
            cCtx.fillStyle = grad;
            cCtx.fillRect(0, 0, width, height);
        }
        lastWidth = width;
        lastHeight = height;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Drawing an image is much faster than calculating gradient per pixel
    if (cachedVignetteCanvas) {
        ctx.drawImage(cachedVignetteCanvas, 0, 0);
    }
    ctx.restore();
}
