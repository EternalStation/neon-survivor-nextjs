import type { GameState, Enemy } from '../types';
import { spawnParticles } from '../ParticleLogic';
import { PALETTES } from '../constants';

export function renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    const { enemies } = state;
    // Defensive Reset: Ensure no leaked shadows or styles from previous layers affect enemies
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([]);

    // 1. Draw Merging Lines (Optimized)
    const mergeHosts = new Map<string, Enemy>();
    enemies.forEach(e => {
        if (e.mergeHost && e.mergeId && !e.dead) mergeHosts.set(e.mergeId, e);
    });

    enemies.forEach(e => {
        if (e.dead) return;
        if (e.mergeState === 'warming_up' && e.mergeTimer && !e.mergeHost && e.mergeId) {
            const host = mergeHosts.get(e.mergeId);
            if (host) {
                ctx.save();
                ctx.strokeStyle = '#FFFFFF'; // White dashed line
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.6;
                ctx.setLineDash([8, 8]); // Distinct dash pattern
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                ctx.lineTo(host.x, host.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    // --- LEVEL 2 BOSS VISUALS (Underlay - Lines etc) ---
    enemies.forEach(e => {
        if (!e.boss || e.dead) return;

        // PENTAGON SOUL LINK (Snake Lines)
        if (e.shape === 'pentagon' && e.soulLinkTargets && e.soulLinkTargets.length > 0) {
            // Determine Color based on Spawn Time (Era)
            // 0-15: Green, 15-30: Blue, 30-45: Purple, 45-60: Orange -> Red
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const linkColor = PALETTES[eraIndex].colors[0]; // Brightest color

            ctx.save();
            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 2;
            ctx.shadowColor = linkColor;
            ctx.shadowBlur = 10;
            ctx.lineCap = 'round';

            const time = state.gameTime;

            e.soulLinkTargets.forEach((targetId, i) => {
                const target = enemies.find(t => t.id === targetId && !t.dead);
                if (target) {
                    // Draw Snake Line
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);

                    const angle = Math.atan2(target.y - e.y, target.x - e.x);

                    // Bezier Curve with sine wave offset
                    const midX = (e.x + target.x) / 2;
                    const midY = (e.y + target.y) / 2;

                    // Animate the curve "snaking"
                    const offset = Math.sin(time * 10 + i) * 30;
                    // Perpendicular vector
                    const perpX = Math.cos(angle + Math.PI / 2) * offset;
                    const perpY = Math.sin(angle + Math.PI / 2) * offset;

                    ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
                    ctx.stroke();
                }
            });
            ctx.restore();
        }

        // PENTAGON LVL 3 PLAYER TETHER (Distorted Glitchy Link)
        if (e.shape === 'pentagon' && e.boss && e.parasiteLinkActive && (e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1))) {
            // Determine Color based on Era
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const tetherColor = PALETTES[eraIndex].colors[0]; // Brightest era color
            const tetherColorDark = PALETTES[eraIndex].colors[2]; // Darkest for contrast

            ctx.save();
            const time = state.gameTime;

            // Glitchy distorted line - multiple overlapping segments
            const segments = 8;
            for (let s = 0; s < segments; s++) {
                const progress = s / segments;
                const nextProgress = (s + 1) / segments;

                // Calculate positions with glitch offset
                const glitchAmp = 15 + Math.sin(time * 20 + s) * 10;
                const glitchX1 = (Math.random() - 0.5) * glitchAmp;
                const glitchY1 = (Math.random() - 0.5) * glitchAmp;
                const glitchX2 = (Math.random() - 0.5) * glitchAmp;
                const glitchY2 = (Math.random() - 0.5) * glitchAmp;

                const x1 = e.x + (state.player.x - e.x) * progress + glitchX1;
                const y1 = e.y + (state.player.y - e.y) * progress + glitchY1;
                const x2 = e.x + (state.player.x - e.x) * nextProgress + glitchX2;
                const y2 = e.y + (state.player.y - e.y) * nextProgress + glitchY2;

                // Alternating colors for glitch effect
                ctx.strokeStyle = s % 2 === 0 ? tetherColor : tetherColorDark;
                ctx.lineWidth = 3 + Math.sin(time * 15 + s) * 1.5;
                ctx.globalAlpha = 0.6 + Math.sin(time * 10 + s * 0.5) * 0.3;

                // Add shadow for scary effect
                ctx.shadowColor = tetherColor;
                ctx.shadowBlur = 15;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Add crackling particles along the line
            if (state.frameCount % 3 === 0) {
                const particlePos = Math.random();
                const px = e.x + (state.player.x - e.x) * particlePos;
                const py = e.y + (state.player.y - e.y) * particlePos;
                spawnParticles(state, px, py, tetherColor, 2);
            }

            ctx.restore();
        }

        // CIRCLE DASH INDICATOR (Laser Sight)
        if (e.shape === 'circle' && e.dashState === 1 && e.dashLockX && e.dashLockY) {
            ctx.save();
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]); // Dashed aim line
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.dashLockX, e.dashLockY);
            ctx.stroke();

            // Draw Target Reticle
            ctx.translate(e.dashLockX, e.dashLockY);
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
            ctx.moveTo(0, -30); ctx.lineTo(0, 30);
            ctx.stroke();
            ctx.restore();
        }

        // DIAMOND BEAM CHARGE (Pre-Fire)
        if (e.shape === 'diamond' && e.beamState === 1 && e.beamX && e.beamY) {
            ctx.save();
            const ang = e.beamAngle || Math.atan2(e.beamY - e.y, e.beamX - e.x);
            const isLocked = (e.beamTimer || 0) > 30;

            // Thin guide line
            ctx.strokeStyle = e.palette[1];
            ctx.globalAlpha = isLocked ? 0.8 : 0.3; // Much brighter when locked
            ctx.lineWidth = isLocked ? 3 : 1; // Thicker when locked
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(ang) * 3000, e.y + Math.sin(ang) * 3000);
            ctx.stroke();

            // Charge buildup at source
            const chargeProgress = (e.beamTimer || 0) / 60;
            const chargeSize = chargeProgress * 40;
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = (0.5 + Math.random() * 0.5) * (isLocked ? 1.0 : 0.7);
            ctx.beginPath();
            ctx.arc(e.x, e.y, chargeSize, 0, Math.PI * 2);
            ctx.fill();

            // Internal Pulse
            if (isLocked) {
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 50) * 0.2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, chargeSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }


            ctx.restore();
        }

        // DIAMOND LVL 3 SATELLITE STRIKE BEAMS (Cosmic Beam Style)
        if (e.shape === 'diamond' && e.satelliteState === 2 && e.satelliteTargets && (e.satelliteTimer || 0) <= 20) {
            // Determine era color
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const beamColor = PALETTES[eraIndex].colors[0]; // Brightest era color
            const beamColorMid = PALETTES[eraIndex].colors[1];

            e.satelliteTargets.forEach(t => {
                ctx.save();
                ctx.translate(t.x, t.y);

                // Beam animation (fades over 20 frames)
                const beamAlpha = 1 - (e.satelliteTimer || 0) / 20;
                const beamHeight = 2000;
                const beamWidth = 120; // Slightly wider than crater

                // Gradient: High center opacity (Cosmic Beam style)
                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, `${beamColor}00`); // Transparent
                beamGrad.addColorStop(0.2, beamColorMid.replace(')', `, ${0.5 * beamAlpha})`).replace('rgb', 'rgba'));
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${1.0 * beamAlpha})`);
                beamGrad.addColorStop(0.8, beamColorMid.replace(')', `, ${0.5 * beamAlpha})`).replace('rgb', 'rgba'));
                beamGrad.addColorStop(1, `${beamColor}00`); // Transparent

                ctx.fillStyle = beamGrad;
                ctx.fillRect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight);

                // Core beam line
                ctx.globalCompositeOperation = 'lighter';
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * beamAlpha})`;
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -beamHeight);
                ctx.stroke();

                // Side streaks with era color
                ctx.lineWidth = 2;
                ctx.strokeStyle = beamColor.replace(')', `, ${0.4 * beamAlpha})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.moveTo(-60, 0); ctx.lineTo(-60, -beamHeight);
                ctx.moveTo(60, 0); ctx.lineTo(60, -beamHeight);
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            });
        }

        // DIAMOND LVL 3 SATELLITE (Orbiting UI indicator)
        if (e.shape === 'diamond' && e.boss && (e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1))) {
            ctx.save();
            // Orbit around boss
            const orbitRadius = e.size * 2.5;
            const orbitSpeed = state.gameTime * 1.5; // Slow orbit
            const satX = Math.cos(orbitSpeed) * orbitRadius;
            const satY = Math.sin(orbitSpeed) * orbitRadius;

            ctx.translate(satX, satY);

            // Draw small satellite
            const satSize = 8;
            ctx.fillStyle = e.eraPalette?.[0] || e.palette[0];
            ctx.shadowColor = e.eraPalette?.[0] || e.palette[0];
            ctx.shadowBlur = 10;

            // Diamond shape for satellite
            ctx.beginPath();
            ctx.moveTo(0, -satSize);
            ctx.lineTo(satSize * 0.7, 0);
            ctx.lineTo(0, satSize);
            ctx.lineTo(-satSize * 0.7, 0);
            ctx.closePath();
            ctx.fill();

            // Glow ring
            ctx.strokeStyle = e.eraPalette?.[0] || e.palette[0];
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, satSize * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }
    });

    enemies.forEach(e => {
        if (e.dead && !e.isZombie) return;
        ctx.save();
        ctx.translate(e.x, e.y);

        // SLOW VFX
        if (e.slowFactor && e.slowFactor > 0.5) {
            ctx.save();
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 1.3, 0, Math.PI * 2);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const ang = (i * Math.PI / 2) + state.gameTime * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * e.size, Math.sin(ang) * e.size);
                ctx.lineTo(Math.cos(ang) * e.size * 1.5, Math.sin(ang) * e.size * 1.5);
                ctx.stroke();
            }
            ctx.restore();
        }

        // ZOMBIE RENDERER
        if (e.isZombie) {
            const zombieImg = (meteoriteImages as any).zombie;
            if (zombieImg && zombieImg.complete) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#4ade80';
                const zSize = e.size * 2;
                if (e.zombieState === 'rising') {
                    const timeLeft = (e.zombieTimer || 0) - (state.gameTime * 1000);
                    const totalRiseTime = 1500;
                    const progress = 1 - Math.max(0, timeLeft / totalRiseTime);
                    const shake = (1 - progress) * 8;
                    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
                    ctx.fillStyle = '#5d4037';
                    const particleCount = progress < 0.4 ? 10 : 5;
                    for (let i = 0; i < particleCount; i++) {
                        const dr = Math.sin(i * 123 + state.gameTime * 20) * e.size * (1 + progress);
                        const da = i * (Math.PI * 2 / particleCount);
                        ctx.fillRect(Math.cos(da) * dr, Math.sin(da) * dr, 4, 4);
                    }
                    if (progress > 0.4) {
                        const zProgress = (progress - 0.4) / 0.6;
                        ctx.globalAlpha = zProgress;
                        ctx.translate(0, (1 - zProgress) * 25);
                        ctx.scale(zProgress, zProgress);
                        ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                    }
                } else if (e.zombieState !== 'dead') {
                    // Frenzy Glow
                    if (e.isEnraged) {
                        ctx.save();
                        ctx.shadowBlur = 20;
                        ctx.shadowColor = '#ef4444';
                        ctx.strokeStyle = '#ef4444';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, zSize * 0.6, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }

                    // Mirroring logic: PNG faces LEFT. If vx > 0 (moving right), flip.
                    const isMovingRight = (e.vx || 0) > 0.1;
                    ctx.save();
                    if (isMovingRight) {
                        ctx.scale(-1, 1);
                    }
                    ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                    ctx.restore();

                    // Heart Indicators (3 Pips)
                    if (e.zombieHearts !== undefined) {
                        const hCount = e.zombieHearts;
                        const startX = -15;
                        for (let i = 0; i < 3; i++) {
                            ctx.fillStyle = i < hCount ? '#4ade80' : 'rgba(255,255,255,0.1)';
                            ctx.fillRect(startX + i * 12, -zSize / 2 - 10, 8, 4);
                        }
                    }
                }
                ctx.restore();
            }
            ctx.restore();
            return;
        }

        if (e.rotationPhase) ctx.rotate(e.rotationPhase);

        // BOSS SHIELDED AURA (Level 3 protection)
        if (e.orbitalShields && e.orbitalShields > 0) {
            ctx.save();
            // Counter-rotate a bit or just spin a slow barrier
            // e.rotationPhase rotates the context, so this barrier spins with the boss.
            // Draw a protective energy field
            ctx.strokeStyle = '#06b6d4'; // Cyan
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';
            ctx.globalAlpha = 0.4;

            // Draw a hexagonal force field barrier
            const barrierSize = 110; // Protective bubble radius
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                const px = Math.cos(ang) * barrierSize;
                const py = Math.sin(ang) * barrierSize;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Inner fill
            ctx.fillStyle = '#06b6d4';
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.restore();
        }

        // ELITE AURA - Disabled to fix visual leaks
        // if (e.isElite) { ... }

        const pulse = 1.0 + (Math.sin(e.pulsePhase || 0) * 0.05);
        ctx.scale(pulse, pulse);

        // --- Spectral Flux: Color Logic ---
        let coreColor = e.eraPalette?.[2] || e.palette[0];
        let innerColor = e.eraPalette?.[1] || e.palette[1];
        let outerColor = e.eraPalette?.[0] || e.palette[2];

        const fState = e.fluxState || 0;
        if (fState === 0) {
            // Prime: High Contrast (Stable)
            coreColor = e.eraPalette?.[0] || e.palette[0];
            innerColor = e.eraPalette?.[2] || e.palette[1];
            outerColor = e.eraPalette?.[1] || e.palette[2];
        } else if (fState === 1) {
            // Resonance: Inner Pulse (Solid)
            coreColor = e.eraPalette?.[1] || e.palette[0];
            innerColor = e.eraPalette?.[0] || e.palette[1];
            outerColor = e.eraPalette?.[2] || e.palette[2];
        } else if (fState === 2) {
            // Radiance: Overloaded Aura (Static Glow)
            coreColor = '#FFFFFF'; // White Hot
            innerColor = e.eraPalette?.[0] || e.palette[0];
            outerColor = e.eraPalette?.[1] || e.palette[1];
            ctx.shadowColor = innerColor;
            ctx.shadowBlur = 15;
        }

        let chaosLevel = 0;
        const minutes = state.gameTime / 60;
        if (e.boss) {
            chaosLevel = Math.min(1, Math.max(0, (minutes - 2) / 10));
        }

        // --- Era Corruption: Glitch (30-60m) ---
        if (minutes > 30 && !e.boss) {
            const glitchAmount = Math.min(1, (minutes - 30) / 30);
            if (Math.random() < glitchAmount * 0.2) {
                const shift = glitchAmount * 8;
                ctx.translate((Math.random() - 0.5) * shift, (Math.random() - 0.5) * shift);
                if (Math.random() > 0.5) ctx.globalAlpha = 0.7;
            }
        }

        const drawShape = (size: number, isWarpedLimit: boolean = false, isCore: boolean = false) => {
            ctx.beginPath();

            // CORE DISTORTION: Internal digital fragment
            if (isCore) {
                const sides = 3 + (Math.floor((e.id || 0) * 10) % 3); // 3-5 sides
                const rot = state.gameTime * 4 * ((e.id || 0) > 0.5 ? 1 : -1);
                for (let i = 0; i < sides; i++) {
                    const ang = (i * 2 * Math.PI / sides) + rot;
                    const r = size * (0.8 + Math.sin(state.gameTime * 12 + i) * 0.3);
                    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                }
                ctx.closePath();
                return;
            }

            const warpAmp = isWarpedLimit && e.boss ? (0.1 + chaosLevel * 0.2) * size : 0;
            const wp = (px: number, py: number) => {
                if (warpAmp === 0) return { x: px, y: py };
                const offset = Math.sin((py / size) * 4 + (state.gameTime * 10)) * warpAmp;
                return { x: px + offset, y: py };
            };
            if (e.shape === 'circle') {
                if (warpAmp > 0) {
                    for (let i = 0; i <= 20; i++) {
                        const theta = (i / 20) * Math.PI * 2;
                        const p = wp(Math.cos(theta) * size, Math.sin(theta) * size);
                        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                    }
                } else ctx.arc(0, 0, size, 0, Math.PI * 2);
            } else if (e.shape === 'minion') {
                const isStun = !!e.stunOnHit;
                if (isStun) {
                    const p1 = wp(size * 2.5, 0); const p2 = wp(-size * 1.5, -size * 0.8);
                    const p3 = wp(-size * 0.5, -size * 0.4); const p4 = wp(-size * 2.5, -size * 0.8);
                    const p5 = wp(-size * 1.5, 0); const p6 = wp(-size * 2.5, size * 0.8);
                    const p7 = wp(-size * 0.5, size * 0.4); const p8 = wp(-size * 1.5, size * 0.8);
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
                    ctx.lineTo(p5.x, p5.y); ctx.lineTo(p6.x, p6.y); ctx.lineTo(p7.x, p7.y); ctx.lineTo(p8.x, p8.y);
                } else {
                    const p1 = wp(size, 0); const p2 = wp(-size, size * 0.7);
                    const p3 = wp(-size * 0.3, 0); const p4 = wp(-size, -size * 0.7);
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
                }
                ctx.closePath();
            } else if (e.shape === 'triangle') {
                const p1 = wp(0, -size); const p2 = wp(size * 0.866, size * 0.5); const p3 = wp(-size * 0.866, size * 0.5);
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
            } else if (e.shape === 'square') {
                if (e.isElite && !isCore) {
                    // Elite Square (Thorns): Draw Spiked Corners
                    const spike = size * 0.4;
                    const p1 = wp(-size, -size); const p1a = wp(0, -size - spike); // Top Spike
                    const p2 = wp(size, -size); const p2a = wp(size + spike, 0); // Right Spike
                    const p3 = wp(size, size); const p3a = wp(0, size + spike); // Bottom Spike
                    const p4 = wp(-size, size); const p4a = wp(-size - spike, 0); // Left Spike

                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p1a.x, p1a.y);
                    ctx.lineTo(p2.x, p2.y); ctx.lineTo(p2a.x, p2a.y);
                    ctx.lineTo(p3.x, p3.y); ctx.lineTo(p3a.x, p3a.y);
                    ctx.lineTo(p4.x, p4.y); ctx.lineTo(p4a.x, p4a.y);
                    ctx.closePath();
                } else {
                    const p1 = wp(-size, -size); const p2 = wp(size, -size); const p3 = wp(size, size); const p4 = wp(-size, size);
                    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
                }
            } else if (e.shape === 'diamond') {
                const p1 = wp(0, -size * 1.3); const p2 = wp(size, 0); const p3 = wp(0, size * 1.3); const p4 = wp(-size, 0);
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
            } else if (e.shape === 'hexagon') {
                for (let i = 0; i < 6; i++) {
                    const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; // Pointy top
                    const p = wp(Math.cos(angle) * size, Math.sin(angle) * size);
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                }
                ctx.closePath();
            } else if (e.shape === 'pentagon') {
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                    const p = wp(Math.cos(angle) * size, Math.sin(angle) * size);
                    if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                }
                ctx.closePath();
            } else if ((e.type as any) === 'orbital_shield') {
                // Shield Plate Design: Curved rectangle/Arc
                // Wider arc for better coverage
                const arcLen = Math.PI / 1.5; // 120 degrees coverage (wider than before)
                // Draw a thick arc section
                ctx.beginPath();
                ctx.arc(0, 0, size, -arcLen / 2, arcLen / 2); // Outer arc
                ctx.arc(0, 0, size * 0.6, arcLen / 2, -arcLen / 2, true); // Inner arc
                ctx.closePath();
            } else if (e.shape === 'snitch') {
                const bodyR = size * 0.7;
                if (warpAmp > 0) {
                    for (let i = 0; i <= 20; i++) {
                        const theta = (i / 20) * Math.PI * 2;
                        const p = wp(Math.cos(theta) * bodyR, Math.sin(theta) * bodyR);
                        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                    }
                } else ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
                ctx.closePath();
                const drawBlade = (side: number, angle: number, lengthMult: number, widthMult: number) => {
                    const start = wp(side * bodyR * 0.8, side * bodyR * angle);
                    const mid = wp(side * size * 2.2 * lengthMult, side * size * (angle + 0.4) * widthMult);
                    const end = wp(side * size * 2.0 * lengthMult, side * size * angle * widthMult);
                    const back = wp(side * bodyR * 0.8, side * bodyR * (angle - 0.2));
                    ctx.moveTo(start.x, start.y); ctx.lineTo(mid.x, mid.y); ctx.lineTo(end.x, end.y); ctx.lineTo(back.x, back.y); ctx.closePath();
                };
                drawBlade(-1, -0.6, 1.0, 1.0); drawBlade(-1, 0, 1.2, 0.5); drawBlade(-1, 0.6, 1.0, 1.0);
                drawBlade(1, -0.6, 1.0, 1.0); drawBlade(1, 0, 1.2, 0.5); drawBlade(1, 0.6, 1.0, 1.0);
            }
        };

        // --- DIGGING / SUMMONING ANIMATION ---
        if (e.summonState === 1 && e.frozen && e.frozen > 0) {
            const progress = 1 - Math.max(0, e.frozen / 1.0); // 1.0s duration
            const shake = (1 - progress) * 8;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

            // Draw Dirt particles (Matching friendly zombie style)
            ctx.fillStyle = '#451a03';
            const particleCount = progress < 0.5 ? 12 : 6;
            for (let i = 0; i < particleCount; i++) {
                const dr = Math.sin(i * 123 + state.gameTime * 25) * e.size * (1 + progress);
                const da = i * (Math.PI * 2 / particleCount);
                ctx.fillRect(Math.cos(da) * dr, Math.sin(da) * dr, 3, 3);
            }

            // Clip & Rise
            ctx.beginPath();
            ctx.rect(-e.size * 2, -e.size * 2, e.size * 4, e.size * 2 + 10);
            ctx.clip();

            const riseOffset = (1 - progress) * e.size * 1.5;
            ctx.translate(0, riseOffset);
            ctx.scale(progress, progress);
            ctx.globalAlpha = Math.min(1, progress * 1.5);
        }



        if (e.critGlitchUntil && Date.now() < e.critGlitchUntil) {
            ctx.save();
            const shift = 4 + Math.random() * 4;
            ctx.save(); ctx.translate(shift, 0); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FF0000'; drawShape(e.size * 1.05); ctx.stroke(); ctx.restore();
            ctx.save(); ctx.translate(-shift, 0); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#0000FF'; drawShape(e.size * 1.05); ctx.stroke(); ctx.restore();
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; drawShape(e.size * 1.1); ctx.stroke();
            ctx.restore();
            ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        // Blackhole Vortex Glitch Effect
        const inBlackhole = state.areaEffects.some(effect => {
            if (effect.type !== 'blackhole') return false;
            const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
            return dist < effect.radius;
        });

        if (inBlackhole) {
            const shift = 3 + Math.random() * 3;
            ctx.save();
            ctx.translate((Math.random() - 0.5) * shift, (Math.random() - 0.5) * shift);
            ctx.globalAlpha = 0.4;
            ctx.strokeStyle = '#7e22ce';
            drawShape(e.size * 1.05);
            ctx.stroke();
            ctx.restore();
        }

        if ((e.glitchPhase && e.glitchPhase > 0) || e.boss) {
            const intensity = e.boss ? chaosLevel * 15 : 10;
            if (e.boss && Math.random() < chaosLevel * 0.3) ctx.translate((Math.random() - 0.5) * intensity, -(Math.random() - 0.5) * intensity);
            else if (e.glitchPhase && !e.boss) ctx.translate((Math.random() - 0.5) * 10, -(Math.random() - 0.5) * 10);
            if (Math.random() > (e.boss ? 0.8 - (chaosLevel * 0.2) : 0.8)) ctx.globalAlpha = 0.6;
        }

        if (e.boss && e.trails) {
            e.trails.forEach(t => {
                ctx.save(); ctx.translate(-e.x, -e.y); ctx.translate(t.x, t.y); ctx.scale(pulse, pulse); ctx.rotate(t.rotation);
                ctx.strokeStyle = outerColor; ctx.lineWidth = 1; ctx.globalAlpha = t.alpha * 0.5; drawShape(e.size, false); ctx.stroke(); ctx.restore();
            });
        }

        if (e.boss) {
            const redAlpha = (0.6 + Math.sin(state.gameTime * 10) * 0.4) * (Math.random() > 0.5 ? 1 : 0.8);
            ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 3; ctx.shadowColor = '#FF0000'; ctx.shadowBlur = 20; ctx.globalAlpha = redAlpha; drawShape(e.size * 1.25, true); ctx.stroke(); ctx.globalAlpha = 1.0;
        }

        ctx.strokeStyle = outerColor; ctx.lineWidth = 1.5;
        if (e.boss) { ctx.shadowBlur = 8; ctx.shadowColor = outerColor; }
        drawShape(e.size * 1.1, true); ctx.stroke();
        ctx.fillStyle = innerColor; ctx.globalAlpha = 1.0; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; drawShape(e.size, true); ctx.fill();

        if (e.boss) {
            ctx.save(); ctx.clip(); ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.8;
            const seed = Math.floor(state.gameTime * 10);
            for (let k = 0; k < 2 + Math.floor(chaosLevel * 4); k++) {
                ctx.beginPath();
                const r = (n: number) => { const sin = Math.sin(n + (e.id || 0)); return sin - Math.floor(sin); };
                const cx = (r(seed + k) - 0.5) * e.size * 1.2; const cy = (r(seed + k + 100) - 0.5) * e.size * 1.2;
                for (let v = 0; v < 4; v++) {
                    const ang = v * (Math.PI / 2) + r(k + v); const dist = 5 + r(k * v) * 15;
                    if (v === 0) ctx.moveTo(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
                    else ctx.lineTo(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
                }
                ctx.closePath(); ctx.fill();
            }
            ctx.restore();
        }

        if (e.isElite) {
            // ELITE REACTOR CORE
            ctx.save();
            const corePulse = 1.0 + Math.sin(state.gameTime * 8) * 0.2;
            const coreRot = state.gameTime * 2;
            ctx.scale(corePulse, corePulse);

            // Core Color - Pulsing White to Era Color
            const pulseMix = (Math.sin(state.gameTime * 10) + 1) / 2; // 0 to 1
            // Simple approach for mixing colors isn't easy in 2D canvas without parsing hex
            // So we overlay white with varying opacity

            // Base Core Color
            ctx.fillStyle = coreColor;

            const coreSize = e.size * 0.5;

            ctx.beginPath();
            if (e.shape === 'square') {
                // Spinning Diamond
                ctx.rotate(coreRot);
                ctx.moveTo(0, -coreSize);
                ctx.lineTo(coreSize, 0);
                ctx.lineTo(0, coreSize);
                ctx.lineTo(-coreSize, 0);
            } else if (e.shape === 'triangle') {
                // Inverted Triangle
                ctx.rotate(Math.PI); // Flip 180
                // Standard triangle path but flipped due to rotation
                const h = coreSize * 0.866;
                ctx.moveTo(0, -coreSize);
                ctx.lineTo(h, coreSize * 0.5);
                ctx.lineTo(-h, coreSize * 0.5);
            } else if (e.shape === 'circle') {
                // Spinning Hexagon
                ctx.rotate(-coreRot);
                for (let i = 0; i < 6; i++) {
                    const ang = (i * Math.PI * 2) / 6;
                    const px = Math.cos(ang) * coreSize;
                    const py = Math.sin(ang) * coreSize;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
            } else if (e.shape === 'diamond') {
                // Spinning "X" or Cross
                ctx.rotate(coreRot * 1.5);
                const w = coreSize * 0.4;
                const l = coreSize * 1.2;
                // Draw X using 2 rects? Or polygon. Let's do polygon for fill.
                // 4 points? No, "X" implies 4 arms. 
                // Let's do a 4-pointed star (hypocycloid-ish)
                for (let i = 0; i < 8; i++) {
                    const r = i % 2 === 0 ? l : w;
                    const ang = (i * Math.PI * 2) / 8;
                    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                }
            } else if (e.shape === 'pentagon') {
                // Pentagonal Gear (5 Teeth) - "Mechanical/Heavy" feel
                ctx.rotate(coreRot);
                const outer = coreSize;
                const inner = coreSize * 0.6;
                const teeth = 5;
                for (let i = 0; i < teeth * 2; i++) {
                    const r = i % 2 === 0 ? outer : inner;
                    // Stepped gear teeth
                    const ang = (i * Math.PI * 2) / (teeth * 2) - Math.PI / 2;
                    if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
                    else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
                }
            } else {
                // Fallback for others
                ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
            }
            ctx.closePath();
            ctx.fill();

            // White Flash Overlay
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.3 + pulseMix * 0.4; // 0.3 to 0.7
            ctx.fill();

            ctx.restore();

        } else {
            // Existing Logic
            ctx.fillStyle = coreColor; ctx.globalAlpha = 1.0;
            if (e.isNecroticZombie) {
                // Only zombies get the unique shapeshifting core
                drawShape(e.size * 0.5, true, true);
            } else {
                // Normal enemies have a core that matches their shape
                drawShape(e.size * 0.5, true, false);
            }
            ctx.fill();
        }

        if (e.deathMarkExpiry && e.deathMarkExpiry > state.gameTime) {
            const dmImg = (meteoriteImages as any).deathMark;
            if (dmImg) {
                const s = 64; ctx.save(); ctx.rotate(-(e.rotationPhase || 0)); ctx.translate(0, -e.size * 1.5 - 25);
                const sPulse = 1 + Math.sin(state.gameTime * 5) * 0.1; ctx.scale(sPulse, sPulse); ctx.drawImage(dmImg, -s / 2, -s / 2, s, s); ctx.restore();
            }
        }

        // ELITE HP BAR
        if (e.isElite && e.maxHp > 0 && e.hp < e.maxHp) {
            ctx.save();
            ctx.rotate(-(e.rotationPhase || 0)); // Counter-rotate so bar is horizontal
            const barWidth = e.size * 2.5;
            const barHeight = 4;
            const yOffset = -e.size * 1.8;

            // BG
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);

            // Fill
            const pct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = e.palette[1] || '#ff0000'; // Use inner color or red
            ctx.fillRect(-barWidth / 2, yOffset, barWidth * pct, barHeight);

            // Border/Glow for visibility
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-barWidth / 2, yOffset, barWidth, barHeight);

            ctx.restore();
        }

        // TRIANGLE BERSERK AURA (Over everything for visibility)
        if (e.shape === 'triangle' && e.berserkState) {
            ctx.save();
            // Rotation removed to allow spin
            const auraSize = e.size * 2.0;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#F59E0B'; // Amber/Gold
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + Math.sin(state.gameTime * 20) * 0.4; // Rapid flicker

            ctx.beginPath();
            // Jagged Aura
            for (let i = 0; i < 3; i++) {
                // rough triangle
                const ang = i * (Math.PI * 2 / 3) - Math.PI / 2;
                const ax = Math.cos(ang) * auraSize;
                const ay = Math.sin(ang) * auraSize;
                if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        // DIAMOND HYPER BEAM (FIRE STATE)
        if (e.shape === 'diamond' && e.beamState === 2 && e.beamX && e.beamY) {
            ctx.save();
            // Global coords, so need to untranslate or just calculate correctly
            // Currently inside `translate(e.x, e.y)`

            const dx = e.beamX - e.x;
            const dy = e.beamY - e.y;
            const dist = 3000; // Screen length
            const angle = Math.atan2(dy, dx);

            ctx.rotate(angle - (e.rotationPhase || 0)); // Align with beam
            // e.rotationPhase accumulates, so `rotate(-rot)` creates 0 aligned context?
            // Actually `angle` is absolute. Current context is rotated by `e.rotationPhase`?
            // Wait, line 250: `ctx.translate(e.x, e.y);`. Line 338: `if (e.rotationPhase) ctx.rotate(e.rotationPhase);`.
            // The Elite code block (where this snippet matches) is INSIDE the main loop after rotation?
            // checking context...
            // YES. 
            // We should use `ctx.save()` before rotation if possible, but we are inserting at the end of the loop where rotation might be active.
            // Actually, inserting at the end of the `enemies.forEach` loop (Line 840ish) is safer for "Overlays".
            // But here we are modifying the "Elite HP Bar" section which is inside the per-enemy loop.
            // The per-enemy loop DOES apply rotation (line 338).
            // So we need to cancel it out to draw a beam to a world coordinate.
            // `ctx.rotate(-(e.rotationPhase || 0));`

            // Draw Beam
            const beamWidth = 40 + Math.sin(state.gameTime * 50) * 10;

            // 1. Ultimate Glow Base (Broad)
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = 0.3;
            ctx.fillRect(0, -beamWidth / 2, dist, beamWidth);

            // 2. Searing Core (Intense)
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = e.palette[1];
            ctx.shadowBlur = 40;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(0, -beamWidth / 6, dist, beamWidth / 3);

            // 3. Ultra-Bright Center Line (Extreme Opacity)
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 10;
            ctx.fillRect(0, -1.5, dist, 3); // 3px sharp center line

            ctx.restore();
        }

        // --- LEGION VISUALS (Aura & Shield Bar) ---
        if (e.legionId && e.maxLegionShield && e.legionShield) {
            const isLead = e.id === e.legionLeadId;
            if (isLead) {
                ctx.save();
                ctx.rotate(-(e.rotationPhase || 0)); // Un-rotate for bar/aura logic if needed or keep it dynamic

                const spacing = e.size * 2.5;
                const gridWidth = 5 * spacing; // 6 slots = 5 intervals
                const gridHeight = 4 * spacing; // 5 slots = 4 intervals

                // Offset from lead to formation center (slot 0,0)
                const centerX = -(e.legionSlot?.x || 0) * spacing;
                const centerY = -(e.legionSlot?.y || 0) * spacing;

                // 1. Legion AURA
                ctx.save();
                ctx.translate(centerX, centerY);
                const auraPulse = 0.5 + Math.sin(state.gameTime * 3) * 0.2;
                const auraGradient = ctx.createRadialGradient(0, 0, gridWidth * 0.3, 0, 0, gridWidth * 1.0);
                auraGradient.addColorStop(0, 'rgba(56, 189, 248, 0)');
                auraGradient.addColorStop(0.5, `rgba(56, 189, 248, ${0.15 * auraPulse})`);
                auraGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

                ctx.fillStyle = auraGradient;
                ctx.beginPath();
                ctx.arc(0, 0, gridWidth * 1.2, 0, Math.PI * 2);
                ctx.fill();

                // Shield Border Glow
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.4 * auraPulse;
                ctx.setLineDash([20, 10]);
                const padding = 40;
                ctx.strokeRect(-gridWidth / 2 - padding, -gridHeight / 2 - padding, gridWidth + padding * 2, gridHeight + padding * 2);
                ctx.restore();

                // 2. Legion SHIELD BAR (Focused above the total formation)
                const barWidth = gridWidth + padding;
                const barHeight = 8;
                const barX = centerX - barWidth / 2;
                const barY = centerY - gridHeight / 2 - padding - 40;

                // BG
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Shield Fill
                const shieldPct = Math.max(0, e.legionShield / e.maxLegionShield);
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.fillRect(barX, barY, barWidth * shieldPct, barHeight);

                // Text
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 12px Rajdhani, sans-serif';
                ctx.textAlign = 'center';
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.fillText(`LEGION SHIELD: ${Math.round(e.legionShield)}`, barX + barWidth / 2, barY - 8);

                ctx.restore();
            }
        }

        ctx.restore();
    });

    // Diamond Elite Laser (Warning & Fire)
    enemies.forEach(e => {
        if (!e.isElite || e.shape !== 'diamond' || e.dead) return;

        // Warning Phase
        if (e.eliteState === 1) {
            ctx.save();
            const ang = e.dashState || 0;
            const remaining = (e.timer || 0) - state.gameTime;
            const isLocked = remaining <= 0.8; // Matches logic in EliteEnemyLogic.ts (0.8s lock)

            // Thin guide line
            ctx.strokeStyle = e.palette[1];
            ctx.globalAlpha = isLocked ? 0.8 : 0.3;
            ctx.lineWidth = isLocked ? 3 : 1;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(ang) * 3000, e.y + Math.sin(ang) * 3000);
            ctx.stroke();

            // Charge buildup at source
            const totalDuration = 1.4;
            const chargeProgress = Math.min(1, Math.max(0, 1 - (remaining / totalDuration)));
            const chargeSize = chargeProgress * 30;
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = (0.5 + Math.random() * 0.5) * (isLocked ? 1.0 : 0.7);
            ctx.beginPath();
            ctx.arc(e.x, e.y, chargeSize, 0, Math.PI * 2);
            ctx.fill();

            if (isLocked) {
                ctx.fillStyle = '#FFFFFF';
                // Use state.gameTime for consistency or Date.now for visual flicker
                ctx.globalAlpha = 0.3 + Math.sin(state.gameTime * 20) * 0.2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, chargeSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Fire Phase
        if (e.eliteState === 2 && e.lockedTargetX !== undefined && e.lockedTargetY !== undefined) {
            ctx.save();
            const pulse = 0.8 + Math.sin(state.gameTime * 20) * 0.2;
            const baseWidth = 4 * pulse;
            ctx.strokeStyle = e.palette[1]; ctx.lineWidth = baseWidth * 5; ctx.globalAlpha = 0.15;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.lineWidth = baseWidth * 2.5; ctx.globalAlpha = 0.35;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.strokeStyle = e.palette[0]; ctx.lineWidth = baseWidth; ctx.globalAlpha = 0.8;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = baseWidth * 0.3; ctx.globalAlpha = 1.0;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.lockedTargetX, e.lockedTargetY); ctx.stroke();
            ctx.restore();
        }
    });
}
