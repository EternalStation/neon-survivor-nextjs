import type { GameState } from '../../core/types';
import { calcStat } from '../../utils/MathUtils';

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
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#06b6d4';
            ctx.stroke();

            ctx.globalAlpha = 0.3; ctx.strokeStyle = '#bef264'; ctx.lineWidth = 2;
            const rippleP = (t * 50) % baseR;
            ctx.beginPath(); ctx.arc(0, 0, rippleP, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        } else if (effect.type === 'epicenter') {
            const baseR = effect.radius || 500;


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


            ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'; ctx.stroke();
            ctx.lineWidth = 2; ctx.strokeStyle = '#22d3ee'; ctx.stroke();


            const pulseR = baseR * (0.5 + (state.gameTime % 1.5) / 1.5);
            ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, pulseR), Math.max(1, pulseR * 0.6), 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(34, 211, 238, ${Math.max(0, 1 - (state.gameTime % 1.5) / 1.5)})`; ctx.lineWidth = 1; ctx.stroke();
            ctx.restore();

            const progress = ((effect.pulseTimer || 0) / 0.5) % 1;

            ctx.save(); ctx.translate(effect.x, effect.y);
            const spikeCount = 16;
            const shardScale = 0.75;


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

                if ((effect.isGravityAnchor || effect.isGravitationalHarvest) && i % 2 === 0) {
                    ctx.fillStyle = 'rgba(251, 191, 36, 0.7)';
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                } else {
                    ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                }

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

            const pullRadius = effect.radius || 400;
            const coreRadius = 40;
            if (isNaN(effect.x) || isNaN(effect.y)) return;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            const t = state.gameTime;


            const rotation = (t * 3) % (Math.PI * 2);
            for (let layer = 0; layer < 6; layer++) {


                const layerRadius = coreRadius + (pullRadius - coreRadius) * (0.2 + (layer / 5) * 0.8);
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



                ctx.stroke();
            }


            ctx.beginPath();
            ctx.arc(0, 0, coreRadius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;

            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#38bdf8';
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#f8fafc';
            ctx.stroke();


            ctx.beginPath();
            ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();

            ctx.restore();
        } else if (effect.type === 'orbital_strike') {


            const timeLeft = effect.duration;
            const progress = 1 - (timeLeft / 0.3);
            const baseR = effect.radius || 150;

            ctx.save();
            ctx.translate(effect.x, effect.y);


            ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.beginPath();
            ctx.arc(0, 0, baseR, 0, Math.PI * 2);
            ctx.fill();


            ctx.rotate(state.gameTime * 2);
            ctx.beginPath();
            ctx.arc(0, 0, baseR * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.5 + progress * 0.5})`;
            ctx.setLineDash([10, 10]);
            ctx.stroke();


            ctx.beginPath();
            ctx.arc(0, 0, baseR * 0.2, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#38bdf8';
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.restore();

        } else if (effect.type === 'storm_zone') {
            const alpha = Math.min(1, effect.duration * 3);
            const baseR = effect.radius || 250;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, baseR, 0, Math.PI * 2);
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.setLineDash([14, 10]);
            ctx.lineDashOffset = -(state.gameTime * 60) % 24;
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.globalAlpha = 1;
            ctx.restore();

        } else if (effect.type === 'storm_laser') {
            const initialDuration = effect.pulseTimer || 0.15;
            const progress = Math.min(1, 1 - (effect.duration / initialDuration));
            const visR = (effect.radius || 120) * 0.55;

            ctx.save();
            ctx.translate(effect.x, effect.y);

            ctx.beginPath();
            ctx.arc(0, 0, visR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${0.08 + progress * 0.12})`;
            ctx.fill();

            ctx.rotate(state.gameTime * 4);
            ctx.beginPath();
            ctx.arc(0, 0, visR * (1 - progress * 0.3), 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + progress * 0.65})`;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(0, 0, visR * 0.18, 0, Math.PI * 2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();

        } else if (effect.type === 'storm_hit') {
            const lifeTime = state.gameTime - effect.creationTime;
            const beamDuration = 0.35;
            const radius = effect.radius || 120;

            ctx.save();
            ctx.translate(effect.x, effect.y);

            if (lifeTime < beamDuration) {
                const beamAlpha = 1 - (lifeTime / beamDuration);
                const beamHeight = 2000;
                const beamWidth = radius * 0.9;

                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, `rgba(56, 189, 248, 0)`);
                beamGrad.addColorStop(0.25, `rgba(186, 230, 253, ${0.45 * beamAlpha})`);
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${0.85 * beamAlpha})`);
                beamGrad.addColorStop(0.75, `rgba(186, 230, 253, ${0.45 * beamAlpha})`);
                beamGrad.addColorStop(1, `rgba(56, 189, 248, 0)`);
                ctx.fillStyle = beamGrad;
                ctx.fillRect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight);

                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * beamAlpha})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -beamHeight);
                ctx.stroke();

                ctx.lineWidth = 1.5;
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 * beamAlpha})`;
                ctx.beginPath();
                ctx.moveTo(-radius * 0.35, 0); ctx.lineTo(-radius * 0.35, -beamHeight);
                ctx.moveTo(radius * 0.35, 0); ctx.lineTo(radius * 0.35, -beamHeight);
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();

        } else if (effect.type === 'crater') {


            const lifeTime = state.gameTime - effect.creationTime;
            const duration = effect.duration;
            const radius = effect.radius || 150;
            const remaining = duration - lifeTime;
            const alpha = Math.max(0, remaining > 1.0 ? 1.0 : remaining);

            ctx.save();
            ctx.translate(effect.x, effect.y);



            ctx.strokeStyle = `rgba(50, 60, 80, ${0.8 * alpha})`;
            ctx.lineWidth = 3;


            const seed = effect.id;
            const count = 4;
            for (let i = 0; i < count; i++) {
                ctx.beginPath();

                const angle = (i * (Math.PI / count)) + (seed % 100) * 0.01;
                const len = radius * 0.4;


                ctx.moveTo(Math.cos(angle) * -len, Math.sin(angle) * -len * 0.6);
                ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len * 0.6);
                ctx.stroke();
            }


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



            const beamDuration = 0.6;
            if (lifeTime < beamDuration) {
                const beamAlpha = 1 - (lifeTime / beamDuration);




                const beamHeight = 2000;
                const beamWidth = radius * 1.5;


                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, `rgba(56, 189, 248, 0)`);
                beamGrad.addColorStop(0.2, `rgba(186, 230, 253, ${0.5 * beamAlpha})`);
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${1.0 * beamAlpha})`);
                beamGrad.addColorStop(0.8, `rgba(186, 230, 253, ${0.5 * beamAlpha})`);
                beamGrad.addColorStop(1, `rgba(56, 189, 248, 0)`);

                ctx.fillStyle = beamGrad;
                ctx.fillRect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight);


                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * beamAlpha})`;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -beamHeight);
                ctx.stroke();


                ctx.lineWidth = 2;
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * beamAlpha})`;
                ctx.beginPath();
                ctx.moveTo(-radius * 0.5, 0); ctx.lineTo(-radius * 0.5, -beamHeight);
                ctx.moveTo(radius * 0.5, 0); ctx.lineTo(radius * 0.5, -beamHeight);
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
        } else if (effect.type === 'glitch_cloud') {
            const radius = effect.radius || 100;
            ctx.save();
            ctx.translate(effect.x, effect.y);
            const t = state.gameTime;


            for (let i = 0; i < 15; i++) {
                const offX = Math.sin(i * 123 + t * 5) * radius * 0.8;
                const offY = Math.cos(i * 456 + t * 5) * radius * 0.8;
                const sz = 10 + Math.sin(i + t * 10) * 5;

                ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff';
                ctx.globalAlpha = 0.4 + Math.sin(t * 20 + i) * 0.2;
                ctx.fillRect(offX, offY, sz, sz);
            }


            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            for (let a = 0; a < Math.PI * 2; a += 0.5) {
                const r = radius * (0.9 + Math.random() * 0.2);
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        } else if (effect.type === 'nanite_cloud') {
            const elapsed = state.gameTime - effect.creationTime;
            const t = state.gameTime;
            const facing = effect.facingAngle ?? 0;
            const baseRadius = effect.radius || 150;

            const sprayDuration = 0.4;

            const owner = effect.ownerId
                ? (state.players?.[effect.ownerId] || state.player)
                : state.player;
            const px = owner.x;
            const py = owner.y;

            ctx.save();

            if (elapsed < sprayDuration) {
                const sprayProgress = elapsed / sprayDuration;
                const sprayLen = Math.hypot(effect.x - px, effect.y - py);
                const currentLen = sprayLen * sprayProgress;
                const tipSpread = baseRadius * 0.4 * sprayProgress;

                ctx.translate(px, py);
                const liveAngle = Math.atan2(effect.y - py, effect.x - px);
                ctx.rotate(liveAngle);
                ctx.globalCompositeOperation = 'lighter';

                const grad = ctx.createLinearGradient(0, 0, currentLen, 0);
                grad.addColorStop(0, 'rgba(34, 197, 94, 0.5)');
                grad.addColorStop(0.4, 'rgba(74, 222, 128, 0.35)');
                grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                for (let i = 0; i <= 16; i++) {
                    const frac = i / 16;
                    const x = currentLen * frac;
                    const spread = tipSpread * frac;
                    const wobble = Math.sin(frac * 10 + t * 6 + i) * spread * 0.2;
                    ctx.lineTo(x, -spread - wobble);
                }
                for (let i = 16; i >= 0; i--) {
                    const frac = i / 16;
                    const x = currentLen * frac;
                    const spread = tipSpread * frac;
                    const wobble = Math.sin(frac * 8 + t * 5 + i * 2) * spread * 0.2;
                    ctx.lineTo(x, spread + wobble);
                }
                ctx.closePath();
                ctx.fill();

                for (let i = 0; i < 14; i++) {
                    const frac = (i / 14) * sprayProgress;
                    const dotX = currentLen * frac;
                    const spread = tipSpread * frac;
                    const dotY = Math.sin(i * 7.3 + t * 8) * spread * 0.8;
                    const sz = 2 + Math.sin(i * 3 + t * 10) * 1.5;
                    ctx.globalAlpha = 0.5 + Math.sin(i + t * 12) * 0.3;
                    ctx.fillStyle = i % 3 === 0 ? '#86efac' : '#4ade80';
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, sz, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalCompositeOperation = 'source-over';
            } else {
                const cloudElapsed = elapsed - sprayDuration;
                const totalCloudTime = (effect.duration + elapsed) - sprayDuration;
                const remainingTime = effect.duration;
                const dissipateStart = totalCloudTime * 0.5;
                const isDissipating = cloudElapsed > dissipateStart;

                let expandMult = 1.0;
                let alpha = 0.4;
                if (isDissipating) {
                    const dissipateProgress = Math.min(1, (cloudElapsed - dissipateStart) / (totalCloudTime - dissipateStart));
                    expandMult = 1.0 + dissipateProgress * 1.2;
                    alpha = 0.4 * (1 - dissipateProgress);
                }

                const currentRadius = baseRadius * expandMult;

                ctx.translate(effect.x, effect.y);
                ctx.globalCompositeOperation = 'lighter';

                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius);
                grad.addColorStop(0, `rgba(34, 197, 94, ${alpha})`);
                grad.addColorStop(0.5, `rgba(74, 222, 128, ${alpha * 0.6})`);
                grad.addColorStop(1, `rgba(34, 197, 94, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.6})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 2; a += 0.25) {
                    const wobble = Math.sin(a * 5 + t * 3) * currentRadius * 0.06;
                    const r = currentRadius + wobble;
                    if (a === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.stroke();

                for (let i = 0; i < 16; i++) {
                    const a = (i / 16) * Math.PI * 2 + t * 1.5;
                    const d = currentRadius * (0.2 + Math.sin(i * 5 + t * 3) * 0.5);
                    const sz = 2 + Math.sin(i * 3 + t * 8) * 1.5;
                    ctx.globalAlpha = Math.max(0, (0.5 + Math.sin(i + t * 10) * 0.3) * (alpha / 0.4));
                    ctx.fillStyle = i % 3 === 0 ? '#86efac' : '#4ade80';
                    ctx.beginPath();
                    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, sz, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
        } else if (effect.type === 'afk_strike') {
            const elapsed = state.gameTime - effect.creationTime;
            const total = elapsed + effect.duration;
            const progress = Math.min(1, elapsed / total);
            const baseR = 300;

            ctx.save();
            ctx.translate(effect.x, effect.y);



            let currentRadius;
            if (progress < 0.5) {

                const p = progress / 0.5;
                currentRadius = baseR * (1 - p);
            } else {

                const p = (progress - 0.5) / 0.5;
                currentRadius = baseR * p;
            }


            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, currentRadius), 0, Math.PI * 2);
            ctx.stroke();


            ctx.globalAlpha = 0.3 * Math.sin(progress * Math.PI);
            ctx.fillStyle = '#8B0000';
            ctx.fill();


            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();


            ctx.restore();
        } else if (effect.type === 'afk_strike_hit') {
            const lifeTime = state.gameTime - effect.creationTime;
            const beamDuration = effect.duration;
            const radius = effect.radius || 300;

            ctx.save();
            ctx.translate(effect.x, effect.y);

            if (lifeTime < beamDuration) {
                const beamAlpha = 1 - (lifeTime / beamDuration);

                // Deep crater lines matching the circle
                ctx.strokeStyle = `rgba(139, 0, 0, ${0.8 * beamAlpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();

                const beamHeight = 2000;
                const beamWidth = 600;
                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, 'rgba(139, 0, 0, 0)');
                beamGrad.addColorStop(0.2, `rgba(255, 0, 0, ${0.5 * beamAlpha})`);
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${1.0 * beamAlpha})`);
                beamGrad.addColorStop(0.8, `rgba(255, 0, 0, ${0.5 * beamAlpha})`);
                beamGrad.addColorStop(1, 'rgba(139, 0, 0, 0)');

                ctx.fillStyle = beamGrad;
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillRect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight);

                // Intense core
                ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * beamAlpha})`;
                const coreWidth = 200;
                ctx.fillRect(-coreWidth / 2, -beamHeight, coreWidth, beamHeight);
                ctx.globalCompositeOperation = 'source-over';
            }

            ctx.restore();
        } else if (effect.type === 'temporal_freeze_wave') {
            const elapsed = state.gameTime - effect.creationTime;
            const progress = Math.min(1, elapsed / effect.duration);
            const radius = effect.radius * progress;
            const alpha = 1 - progress;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.stroke();


            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha * 0.3})`;
            ctx.lineWidth = 20 * (1 - progress);
            ctx.stroke();

            ctx.restore();
        } else if (effect.type === 'temporal_burst') {
            const elapsed = state.gameTime - effect.creationTime;
            const progress = Math.min(1, elapsed / effect.duration);
            const radius = effect.radius * progress;
            const alpha = 1 - progress;

            ctx.save();
            ctx.translate(effect.x, effect.y);


            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 8 * (1 - progress);
            ctx.stroke();


            for (let i = 0; i < 8; i++) {
                const ang = (i / 8) * Math.PI * 2 + state.gameTime * 2;
                const d = radius * 0.9;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * d, Math.sin(ang) * d);
                ctx.lineTo(Math.cos(ang) * (d + 20), Math.sin(ang) * (d + 20));
                ctx.stroke();
            }


            if (progress < 0.5) {
                const bloomAlpha = (1 - progress * 2) * 0.6;
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                grad.addColorStop(0, `rgba(255, 255, 255, ${bloomAlpha})`);
                grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();
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


        ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)'; ctx.stroke();
        ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 3; ctx.stroke();
        ctx.clip();
        const sweepY = (t * 200) % (radius * 4) - radius * 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(-radius, sweepY, radius * 2, 20);
        ctx.restore();
    }
}

export function renderParticles(ctx: CanvasRenderingContext2D, state: GameState, filter?: 'void' | 'non-void') {

    const colorGroups = new Map<string, { x: number, y: number, size: number, alpha: number }[]>();

    state.particles.forEach(p => {

        if (filter === 'void' && p.type !== 'void') return;
        if (filter === 'non-void' && p.type === 'void') return;

        if (p.type === 'shard') {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life < 0.2 ? p.life * 5 : 1;
            ctx.translate(p.x, p.y);
            ctx.rotate(state.gameTime * 5 + (p.x * 0.1));
            ctx.beginPath(); ctx.moveTo(p.size * 2, 0); ctx.lineTo(-p.size, p.size); ctx.lineTo(-p.size, -p.size); ctx.closePath(); ctx.fill();
            ctx.restore();
        } else if (p.type === 'void') {
            ctx.save();
            ctx.globalAlpha = p.life < 0.2 ? p.life * 5 : 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = '#000000';
            ctx.fill();
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (p.type === 'shockwave') {
            const alpha = (p.alpha || 1.0) * (p.life < 10 ? p.life / 10 : 1.0);
            ctx.save();
            ctx.globalAlpha = alpha;
            const angle = Math.atan2(p.vy, p.vx);
            const radius = p.size;
            const cx = p.x - Math.cos(angle) * (radius * 0.5);
            const cy = p.y - Math.sin(angle) * (radius * 0.5);

            ctx.fillStyle = p.color || '#FFFFFF';
            ctx.globalAlpha = alpha * 0.15;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, angle - 0.75, angle + 0.75);
            if (radius > 50) {
                ctx.arc(cx, cy, radius - 50, angle + 0.75, angle - 0.75, true);
            } else {
                ctx.lineTo(cx, cy);
            }
            ctx.fill();

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = p.color || '#FFFFFF';
            ctx.lineWidth = 3;

            ctx.globalAlpha = alpha * 0.3;
            ctx.lineWidth = 10;
            ctx.beginPath(); ctx.arc(cx, cy, radius, angle - 0.7, angle + 0.7); ctx.stroke();
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            ctx.beginPath(); ctx.arc(cx, cy, radius, angle - 0.7, angle + 0.7); ctx.stroke();
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = alpha * 0.6;
            ctx.beginPath(); ctx.arc(cx, cy, radius * 0.85, angle - 0.6, angle + 0.6); ctx.stroke();
            ctx.restore();
        } else if (p.type === 'shockwave_circle') {
            const maxLife = p.maxLife || 1.0;
            const progress = 1 - (p.life / maxLife);
            const alpha = (p.alpha || 1.0) * (p.life / maxLife);

            let radius = p.size * progress;

            ctx.save();
            ctx.translate(p.x, p.y);

            const sA = p.startAngle ?? 0;
            const eA = p.endAngle ?? (p.startAngle !== undefined ? p.startAngle + Math.PI : Math.PI * 2);

            if (p.isTsunami || p.isSingularity) {

                const redColor = '#ef4444';

                const secondaryColor = p.isTsunami ? '#fbbf24' : '#fff176';


                ctx.beginPath();
                ctx.arc(0, 0, radius, sA, eA);
                ctx.strokeStyle = redColor;
                ctx.globalAlpha = alpha * 0.4;
                ctx.lineWidth = 30 * (1 - progress * 0.7);
                ctx.stroke();
                ctx.globalAlpha = alpha;
                ctx.lineWidth = 3;
                ctx.stroke();


                const secondaryRadius = radius * 0.96;
                ctx.beginPath();
                ctx.arc(0, 0, secondaryRadius, sA, eA);
                ctx.strokeStyle = secondaryColor;
                ctx.globalAlpha = alpha * 0.35;
                ctx.lineWidth = 20 * (1 - progress * 0.7);
                ctx.stroke();
                ctx.globalAlpha = alpha * 0.85;
                ctx.lineWidth = 2.5;
                ctx.stroke();


                if (radius > 10) {
                    const fillAlpha = alpha * 0.2;
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
                    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                    grad.addColorStop(0.7, `rgba(239, 68, 68, 0)`);
                    grad.addColorStop(0.85, `rgba(239, 68, 68, ${fillAlpha})`);
                    grad.addColorStop(1, p.isTsunami ? `rgba(251, 191, 36, ${fillAlpha})` : `rgba(255, 241, 118, ${fillAlpha})`);
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, radius, sA, eA);
                    ctx.closePath();
                    ctx.fill();
                }

            } else {

                ctx.beginPath();
                ctx.arc(0, 0, radius, sA, eA);
                ctx.strokeStyle = p.color || '#ef4444';


                ctx.globalAlpha = alpha * 0.3;
                ctx.lineWidth = 40 * (1 - progress * 0.7);
                ctx.stroke();


                ctx.globalAlpha = alpha;
                ctx.lineWidth = 3;
                ctx.stroke();


                if (radius > 10) {
                    const fillAlpha = alpha * 0.25;
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);


                    let colorBase = p.color || '#ef4444';
                    if (colorBase.startsWith('#')) {
                        const r = parseInt(colorBase.slice(1, 3), 16);
                        const g = parseInt(colorBase.slice(3, 5), 16);
                        const bArr = parseInt(colorBase.slice(5, 7), 16);
                        colorBase = `rgba(${r}, ${g}, ${bArr}, `;
                    } else {
                        colorBase = colorBase.replace('rgb', 'rgba').replace(')', ', ');
                    }

                    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                    grad.addColorStop(0.5, `rgba(0, 0, 0, 0)`);
                    grad.addColorStop(0.9, colorBase + fillAlpha + ')');
                    grad.addColorStop(1, colorBase + (alpha * 0.8) + ')');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, radius, sA, eA);
                    ctx.closePath();
                    ctx.fill();
                }
            }


            if (progress > 0.2) {
                const echoProgress = (progress - 0.2) / 0.8;
                const echoRadius = radius * 0.6;
                ctx.beginPath();
                ctx.arc(0, 0, echoRadius, sA, eA);
                ctx.globalAlpha = alpha * 0.3 * (1 - echoProgress);
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();
        } else if (p.type === 'bubble') {
            const maxLife = p.maxLife || 60;
            const progress = 1 - (p.life / maxLife);
            const alpha = (p.alpha || 0.5);

            ctx.save();
            ctx.translate(p.x, p.y);

            let size, currentAlpha, rimAlpha;
            if (progress < 0.8) {
                const normP = progress / 0.8;
                size = p.size * (0.4 + normP * 0.6);
                currentAlpha = alpha * normP * 0.4;
                rimAlpha = alpha * normP * 0.8;
            } else {
                const normP = (progress - 0.8) / 0.2;
                size = p.size * (1.0 + normP * 0.7);
                currentAlpha = alpha * (1 - normP) * 0.4;
                rimAlpha = alpha * (1 - normP) * 1.0;
            }

            const spotGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.5);
            spotGrad.addColorStop(0, `rgba(163, 230, 53, ${currentAlpha})`);
            spotGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            ctx.fillStyle = spotGrad;
            ctx.beginPath(); ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = `rgba(190, 242, 100, ${rimAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.stroke();

            if (progress < 0.8) {
                ctx.fillStyle = `rgba(255, 255, 255, ${rimAlpha * 0.5})`;
                ctx.beginPath(); ctx.arc(-size * 0.3, -size * 0.3, size * 0.2, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        } else {

            const alpha = p.life < 0.2 ? p.life * 5 : 1;
            if (!colorGroups.has(p.color)) colorGroups.set(p.color, []);
            colorGroups.get(p.color)!.push({ x: p.x, y: p.y, size: p.size, alpha });
        }
    });


    colorGroups.forEach((items, color) => {
        ctx.fillStyle = color;


        ctx.beginPath();
        let hasOpaque = false;
        items.forEach(item => {
            if (item.alpha >= 0.98) {
                ctx.moveTo(item.x + item.size, item.y);
                ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
                hasOpaque = true;
            }
        });
        if (hasOpaque) ctx.fill();



        const alphaGroups: Record<string, { x: number, y: number, size: number }[]> = {};
        items.forEach(item => {
            if (item.alpha < 0.98) {
                const aKey = (Math.round(item.alpha * 10) / 10).toString();
                if (!alphaGroups[aKey]) alphaGroups[aKey] = [];
                alphaGroups[aKey].push(item);
            }
        });

        for (const aKey in alphaGroups) {
            const groupItems = alphaGroups[aKey];
            ctx.save();
            ctx.globalAlpha = parseFloat(aKey);
            ctx.beginPath();
            groupItems.forEach(item => {
                ctx.moveTo(item.x + item.size, item.y);
                ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
            });
            ctx.fill();
            ctx.restore();
        }
    });

    ctx.globalAlpha = 1;
}

export function renderFloatingNumbers(ctx: CanvasRenderingContext2D, state: GameState) {
    if (!state.floatingNumbers) return;
    state.floatingNumbers.forEach(fn => {
        const age = fn.life / fn.maxLife;
        ctx.save();

        ctx.translate(fn.x + 10, fn.y - 10);

        let style: 'normal' | 'crit' | 'alert' = 'normal';
        const isCombatText = /^[+-]?\d+(?:\.\d+)?[a-zA-Z]?$/.test(fn.value) || fn.value === "CRIT";

        if (fn.isCrit) {
            if (isCombatText) {
                style = 'crit';
            } else {
                style = 'alert';
            }
        }

        let scale = 1.0;
        let fontStr = "";
        let strokeWidth = 2;

        if (style === 'crit') {
            scale = 1.2 + Math.sin(age * Math.PI) * 0.3;
            fontStr = `italic 900 ${fn.fontSize || 24}px 'Outfit', sans-serif`;
            strokeWidth = 3;
        } else if (style === 'alert') {
            const popScale = age > 0.8 ? 1.0 + (age - 0.8) * 1.0 : 1.0;
            scale = popScale;
            fontStr = `900 ${fn.fontSize || 22}px 'Orbitron', 'Outfit', sans-serif`;
            strokeWidth = 3;
        } else {
            scale = 1.0;
            fontStr = `800 ${fn.fontSize || 16}px 'Outfit', sans-serif`;
            strokeWidth = 2;
        }

        ctx.scale(scale, scale);


        if (style === 'alert') {
            ctx.globalAlpha = Math.min(1, age * 5);
        } else {
            ctx.globalAlpha = Math.min(1, age * 3);
        }


        if (fn.backgroundColor) {
            ctx.font = fontStr;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const metrics = ctx.measureText(fn.value);
            const padding = 8;
            const bgWidth = metrics.width + padding * 2;
            const bgHeight = parseInt(fontStr.match(/\d+/)![0]) + padding;

            ctx.fillStyle = fn.backgroundColor;
            ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
        }

        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';


        if (!fn.backgroundColor) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = '#000000';
            ctx.strokeText(fn.value, 0, 0);
        }

        if (style === 'crit') {
            const grad = ctx.createLinearGradient(0, -12, 0, 12);
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(0.5, '#991b1b');
            grad.addColorStop(1, '#450a0a');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = fn.color || '#ffffff';
        }

        ctx.fillText(fn.value, 0, 0);

        ctx.restore();
    });
}

export function renderScreenEffects(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) {

    if (state.portalState === 'transferring') {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const cx = width / 2;
        const cy = height / 2;
        const t = state.gameTime;
        const progress = 1 - (state.transferTimer / 2.0);


        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(cx, cy);


        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        const gridCount = 32;
        for (let i = 0; i < gridCount; i++) {
            const angle = (i / gridCount) * Math.PI * 2 + t * 0.1;
            const xEdge = Math.cos(angle) * width * 1.5;
            const yEdge = Math.sin(angle) * height * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(xEdge, yEdge);
            ctx.stroke();
        }


        const colors = ['#22d3ee', '#a855f7', '#3b82f6'];
        for (let c = 0; c < 3; c++) {
            const baseAlpha = 0.5 - (c * 0.1);
            const layers = 6;
            for (let i = 0; i < layers; i++) {
                const z = ((t * 6) + i * 2) % 12;
                const scale = Math.pow(1.7, z);
                const alpha = Math.max(0, 1 - z / 11) * baseAlpha;

                if (alpha <= 0) continue;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.scale(scale, scale);
                ctx.strokeStyle = colors[c];
                ctx.lineWidth = 1.5 / scale;

                ctx.beginPath();
                const rot = t * (c % 2 === 0 ? 0.5 : -0.5) + i;
                for (let j = 0; j < 6; j++) {
                    const ang = (Math.PI / 3) * j + rot;
                    const rx = 40 * Math.cos(ang);
                    const ry = 40 * Math.sin(ang);

                    if (j % 2 === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.stroke();
                ctx.restore();
            }
        }


        for (let i = 0; i < 40; i++) {
            const idSeed = (i * 167.5);
            const angle = (idSeed % (Math.PI * 2));
            const speed = 15 + (idSeed % 25);
            const offset = (t * speed * 25 + idSeed) % (width * 1.2);
            const length = 40 + (idSeed % 120);

            ctx.strokeStyle = i % 4 === 0 ? '#ffffff' : (i % 3 === 0 ? '#a855f7' : '#22d3ee');
            ctx.lineWidth = 1 + (idSeed % 2);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * offset, Math.sin(angle) * offset);
            ctx.lineTo(Math.cos(angle) * (offset + length), Math.sin(angle) * (offset + length));
            ctx.stroke();
        }


        if (Math.random() < 0.15 * (0.5 + progress)) {
            const sliceY = (Math.random() - 0.5) * height;
            const sliceH = 20 + Math.random() * 50;
            ctx.fillStyle = `rgba(34, 211, 238, ${0.1 + Math.random() * 0.2})`;
            ctx.fillRect(-width / 2, sliceY, width, sliceH);
        }


        if (state.transferTimer < 0.5) {
            const easeIn = Math.pow((0.5 - state.transferTimer) / 0.5, 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = easeIn;
            ctx.fillRect(-cx, -cy, width, height);
        }

        ctx.restore();
        ctx.restore();
    }


    if (state.smokeBlindTime !== undefined) {
        const elapsed = state.gameTime - state.smokeBlindTime;
        if (elapsed < 2.6) {
            const alpha = elapsed < 0.3 ? elapsed / 0.3 : elapsed < 2.3 ? 1 : 1 - (elapsed - 2.3) / 0.3;
            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);


            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.05})`;
            ctx.fillRect(0, 0, width, height);


            for (let i = 0; i < 8; i++) {
                const x = i % 2 === 0 ? Math.random() * width : (Math.random() < 0.5 ? Math.random() * 150 : width - Math.random() * 150);
                const y = i % 2 !== 0 ? Math.random() * height : (Math.random() < 0.5 ? Math.random() * 150 : height - Math.random() * 150);

                const drift = Math.sin(state.gameTime * 0.5 + i) * 60;

                const size = 100 + Math.abs(Math.sin(i)) * 150;

                const grad = ctx.createRadialGradient(x + drift, y + drift, 0, x + drift, y + drift, size);

                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.2})`);
                grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

                ctx.fillStyle = grad;

                ctx.fillRect((x + drift) - size, (y + drift) - size, size * 2, size * 2);
                ctx.fillRect((x + drift) - size, (y + drift) - size, size * 2, size * 2);
            }
            ctx.restore();
        }
    }



    if (state.flashIntensity && state.flashIntensity > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255, 255, 255, ${state.flashIntensity})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }


    if (state.unpauseDelay && state.unpauseDelay > 0 && state.unpauseMode === 'slow_motion') {

    }





    const maxHp = calcStat(state.player.hp);
    const hpRatio = Math.max(0, Math.min(1, state.player.curHp / Math.max(1, maxHp)));

    if (hpRatio <= 0.5) {



        let ambientAlpha: number;
        if (hpRatio > 0.2) {

            ambientAlpha = (0.5 - hpRatio) / 0.3 * 0.15;
        } else {

            ambientAlpha = 0.15 + (0.2 - hpRatio) / 0.2 * 0.15;
        }


        if (hpRatio <= 0.2) {
            const pulseFreq = 1.2;
            const pulse = 0.5 + 0.5 * Math.sin(state.gameTime * pulseFreq * Math.PI * 2);
            ambientAlpha *= (0.7 + 0.3 * pulse);
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.max(width, height) * 0.75;
        const dangerGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
        dangerGrad.addColorStop(0, 'rgba(220, 20, 20, 0)');
        dangerGrad.addColorStop(1, `rgba(220, 20, 20, ${ambientAlpha})`);
        ctx.fillStyle = dangerGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }


    if (state.player.lastDamageTime !== undefined) {
        const elapsedDamage = state.gameTime - state.player.lastDamageTime;
        const FLASH_DURATION = 0.35;
        if (elapsedDamage < FLASH_DURATION) {

            if (hpRatio <= 0.5) {
                const flashProgress = 1 - (elapsedDamage / FLASH_DURATION);

                const maxFlash = hpRatio <= 0.2 ? 0.22 : 0.12;
                const flashAlpha = flashProgress * maxFlash;
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = `rgba(255, 20, 20, ${flashAlpha})`;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }
    }
}


let cachedVignetteCanvas: HTMLCanvasElement | null = null;
let lastWidth = 0;
let lastHeight = 0;

export function renderVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {

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

    if (cachedVignetteCanvas) {
        ctx.drawImage(cachedVignetteCanvas, 0, 0);
    }
    ctx.restore();
}
