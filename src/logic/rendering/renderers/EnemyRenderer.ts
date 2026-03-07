import type { GameState, Enemy } from '../../core/types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { PALETTES } from '../../core/constants';


export function renderEnemies(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>) {
    const { enemies } = state;
    
    const enemyMap = new Map<number, Enemy>();
    enemies.forEach(e => { if (!e.dead) enemyMap.set(e.id, e); });
    const bossMap = new Map<number, Enemy>();
    enemies.forEach(e => { if (e.boss && !e.dead) bossMap.set(e.id, e); });

    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([]);

    
    const dimHex = (hex: string, factor: number) => {
        if (!hex.startsWith('#') || hex.length < 7) return hex;
        try {
            const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
            const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
            const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        } catch { return hex; }
    };

    
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
                ctx.strokeStyle = '#FFFFFF'; 
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.6;
                ctx.setLineDash([8, 8]); 
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                ctx.lineTo(host.x, host.y);
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    
    enemies.forEach(e => {
        if (!e.boss || e.dead) return;

        
        if (e.shape === 'pentagon' && e.soulLinkTargets && e.soulLinkTargets.length > 0) {
            
            
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const linkColor = PALETTES[eraIndex].colors[0]; 

            ctx.save();
            ctx.strokeStyle = linkColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            
            ctx.lineWidth = 6;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1.0;

            const time = state.gameTime;

            e.soulLinkTargets.forEach((targetId, i) => {
                const target = enemyMap.get(targetId);
                if (target) {
                    
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);

                    const angle = Math.atan2(target.y - e.y, target.x - e.x);
                    const dist = Math.hypot(target.x - e.x, target.y - e.y);

                    
                    const midX = (e.x + target.x) / 2;
                    const midY = (e.y + target.y) / 2;

                    
                    const offset = Math.sin(time * 8 + i) * 20;
                    const perpX = Math.cos(angle + Math.PI / 2) * offset;
                    const perpY = Math.sin(angle + Math.PI / 2) * offset;

                    ctx.quadraticCurveTo(midX + perpX, midY + perpY, target.x, target.y);
                    ctx.stroke();

                    
                    const particleCount = 2;
                    for (let p = 0; p < particleCount; p++) {
                        const t = (time * 1.5 + (p / particleCount) + (i * 0.3)) % 1.0;
                        const px = e.x + (target.x - e.x) * t + Math.sin(t * Math.PI + time * 5) * offset * 0.5;
                        const py = e.y + (target.y - e.y) * t + Math.cos(t * Math.PI + time * 5) * offset * 0.5;
                        ctx.fillStyle = '#FFF';
                        ctx.globalAlpha = 0.8 * (1 - Math.abs(t - 0.5) * 2);
                        ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
                    }
                }
            });
            ctx.restore();
        }

        const isLvl4 = !!e.isLevel4;
        const isLvl3 = !!e.isLevel3 || isLvl4;

        if (e.shape === 'pentagon' && e.boss && e.parasiteLinkActive && isLvl3) {
            
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const eraColor = PALETTES[eraIndex].colors[0];

            ctx.save();
            const time = state.gameTime;

            
            const segments = 8;
            for (let s = 0; s < segments; s++) {
                const progress = s / segments;
                const nextProgress = (s + 1) / segments;

                const glitchAmp = (isLvl4 ? 10 : 5) + Math.sin(time * 20 + s) * 5;
                const x1 = e.x + (state.player.x - e.x) * progress + (Math.random() - 0.5) * glitchAmp;
                const y1 = e.y + (state.player.y - e.y) * progress + (Math.random() - 0.5) * glitchAmp;
                const x2 = e.x + (state.player.x - e.x) * nextProgress + (Math.random() - 0.5) * glitchAmp;
                const y2 = e.y + (state.player.y - e.y) * nextProgress + (Math.random() - 0.5) * glitchAmp;

                ctx.strokeStyle = eraColor;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.5 + Math.sin(time * 10 + s * 0.5) * 0.2;

                ctx.shadowColor = eraColor;
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            if (state.frameCount % 8 === 0) {
                const particlePos = Math.random();
                spawnParticles(state, e.x + (state.player.x - e.x) * particlePos, e.y + (state.player.y - e.y) * particlePos, eraColor, 1);
            }
            ctx.restore();
        }

        
        if (e.shape === 'pentagon' && isLvl4 && e.phalanxState && e.phalanxState > 0) {
            ctx.save();
            const time = state.gameTime;
            const phalanxColor = '#a855f7'; 

            ctx.strokeStyle = phalanxColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = phalanxColor;
            ctx.shadowBlur = 15;

            state.enemies.forEach(d => {
                if (d.isPhalanxDrone && d.soulLinkHostId === e.id && !d.dead) {
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);

                    
                    const midX = (e.x + d.x) / 2;
                    const midY = (e.y + d.y) / 2;
                    const ang = Math.atan2(d.y - e.y, d.x - e.x);
                    const wave = Math.sin(time * 10 + d.id) * 30;
                    const cpx = midX + Math.cos(ang + Math.PI / 2) * wave;
                    const cpy = midY + Math.sin(ang + Math.PI / 2) * wave;

                    ctx.quadraticCurveTo(cpx, cpy, d.x, d.y);
                    ctx.stroke();

                }
            });
            ctx.restore();
        }

        
        if (e.shape === 'circle' && e.dashState === 1 && e.dashLockX && e.dashLockY) {
            ctx.save();
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]); 
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.dashLockX, e.dashLockY);
            ctx.stroke();

            
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

        
        if (e.shape === 'circle' && e.soulSuckActive) {
            ctx.save();
            const time = state.gameTime;
            const dist = Math.hypot(state.player.x - e.x, state.player.y - e.y);
            const angle = Math.atan2(e.y - state.player.y, e.x - state.player.x);

            ctx.translate(state.player.x, state.player.y);
            ctx.rotate(angle);

            
            const beamWidth = 80;
            const grad = ctx.createLinearGradient(0, -beamWidth / 2, 0, beamWidth / 2);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.5, 'rgba(40, 40, 40, 0.85)'); 
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.globalCompositeOperation = 'source-over';

            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let d = 0; d < dist; d += 20) {
                const wave = Math.sin(d * 0.01 + time * 5) * 15;
                ctx.lineTo(d, wave);
            }

            
            ctx.save();
            ctx.lineWidth = beamWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = grad;
            ctx.stroke();
            ctx.restore();

            
            const particleCount = 15;
            for (let i = 0; i < particleCount; i++) {
                const pTime = (time * 1.5 + (i / particleCount)) % 1.0;
                const pd = pTime * dist;
                const pWave = Math.sin(pd * 0.01 + time * 5 + i) * 20;
                const pSize = 2 + Math.random() * 3;

                if (i % 3 === 0) ctx.fillStyle = '#eab308'; 
                else if (i % 3 === 1) ctx.fillStyle = '#facc15'; 
                else ctx.fillStyle = '#94a3b8'; 

                ctx.globalAlpha = 1.0 * (1 - Math.abs(pTime - 0.5) * 2);
                ctx.beginPath();
                ctx.arc(pd, pWave, pSize, 0, Math.PI * 2);
                ctx.fill();
            }

            
            ctx.restore();
            ctx.save();
            ctx.translate(e.x, e.y);
            const vortexPulse = 1.0 + Math.sin(time * 15) * 0.15;
            const vortexGrad = ctx.createRadialGradient(0, 0, e.size * 0.2, 0, 0, e.size * 2 * vortexPulse);
            vortexGrad.addColorStop(0, 'rgba(234, 179, 8, 0.4)'); 
            vortexGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.6)');
            vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = vortexGrad;
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 2 * vortexPulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        
        if (e.shape === 'diamond' && e.beamState === 1 && e.beamX && e.beamY) {
            ctx.save();
            const isLvl4 = (e.bossTier || 0) >= 4 || (state.gameTime > 1800 && e.bossTier !== 1);
            const ang = e.beamAngle || Math.atan2(e.beamY - e.y, e.beamX - e.x);
            const isLocked = (e.beamTimer || 0) > 30;

            
            ctx.strokeStyle = e.palette[1];
            ctx.globalAlpha = isLocked ? 0.8 : 0.3;
            ctx.lineWidth = isLocked ? 3 : 1;

            if (isLvl4) {
                const off = (45 * Math.PI) / 180;
                [ang + off, ang - off].forEach(a => {
                    ctx.beginPath();
                    ctx.moveTo(e.x, e.y);
                    ctx.lineTo(e.x + Math.cos(a) * 3000, e.y + Math.sin(a) * 3000);
                    ctx.stroke();
                });
            } else {
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                ctx.lineTo(e.x + Math.cos(ang) * 3000, e.y + Math.sin(ang) * 3000);
                ctx.stroke();
            }

            
            const chargeProgress = (e.beamTimer || 0) / 60;
            const chargeSize = chargeProgress * 40;
            ctx.fillStyle = e.palette[1];
            ctx.globalAlpha = (0.5 + Math.random() * 0.5) * (isLocked ? 1.0 : 0.7);
            ctx.beginPath();
            ctx.arc(e.x, e.y, chargeSize, 0, Math.PI * 2);
            ctx.fill();

            
            if (isLocked) {
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 0.3 + Math.sin(state.gameTime * 20) * 0.2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, chargeSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }


            ctx.restore();
        }

        
        if (e.shape === 'diamond' && e.satelliteState === 2 && e.satelliteTargets && (e.satelliteTimer || 0) <= 20) {
            
            const minutes = (e.spawnedAt || state.gameTime) / 60;
            const eraIndex = Math.floor(minutes / 15) % PALETTES.length;
            const beamColor = PALETTES[eraIndex].colors[0]; 
            const beamColorMid = PALETTES[eraIndex].colors[1];

            e.satelliteTargets.forEach(t => {
                ctx.save();
                ctx.translate(t.x, t.y);

                
                const beamAlpha = 1 - (e.satelliteTimer || 0) / 20;
                const beamHeight = 2000;
                const beamWidth = 120; 

                
                const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);
                beamGrad.addColorStop(0, `${beamColor}00`); 
                beamGrad.addColorStop(0.2, beamColorMid.replace(')', `, ${0.5 * beamAlpha})`).replace('rgb', 'rgba'));
                beamGrad.addColorStop(0.5, `rgba(255, 255, 255, ${1.0 * beamAlpha})`);
                beamGrad.addColorStop(0.8, beamColorMid.replace(')', `, ${0.5 * beamAlpha})`).replace('rgb', 'rgba'));
                beamGrad.addColorStop(1, `${beamColor}00`); 

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
                ctx.strokeStyle = beamColor.replace(')', `, ${0.4 * beamAlpha})`).replace('rgb', 'rgba');
                ctx.beginPath();
                ctx.moveTo(-60, 0); ctx.lineTo(-60, -beamHeight);
                ctx.moveTo(60, 0); ctx.lineTo(60, -beamHeight);
                ctx.stroke();

                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            });
        }

        
        if (e.shape === 'diamond' && e.boss && (e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1))) {
            ctx.save();
            const orbitRadius = e.size * 2.5;
            const orbitSpeed = state.gameTime * 2.0;
            const satX = Math.cos(orbitSpeed) * orbitRadius;
            const satY = Math.sin(orbitSpeed) * orbitRadius;

            ctx.translate(satX, satY);
            const satSize = 10;
            const color = e.eraPalette?.[0] || e.palette[0];

            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;

            
            ctx.beginPath();
            ctx.moveTo(0, -satSize);
            ctx.lineTo(satSize * 0.4, -satSize * 0.2);
            ctx.lineTo(satSize, 0);
            ctx.lineTo(satSize * 0.4, satSize * 0.2);
            ctx.lineTo(0, satSize);
            ctx.lineTo(-satSize * 0.4, satSize * 0.2);
            ctx.lineTo(-satSize, 0);
            ctx.lineTo(-satSize * 0.4, -satSize * 0.2);
            ctx.closePath();
            ctx.fill();

            
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.4;
            ctx.rotate(state.gameTime * 4);
            ctx.beginPath();
            ctx.ellipse(0, 0, satSize * 1.8, satSize * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        
        if (e.shape === 'diamond' && e.crystalPositions && e.crystalState && e.crystalState > 0) {
            ctx.save();
            const time = state.gameTime;
            const spawnedMinutes = (e.spawnedAt || time) / 60;
            const eraIndex = Math.floor(spawnedMinutes / 15) % PALETTES.length;
            const crystalColor = PALETTES[eraIndex].colors[0];
            const fenceActive = e.crystalState === 2;

            e.crystalPositions.forEach((p, i) => {
                ctx.save();
                ctx.translate(p.x, p.y);

                
                const pulse = 1.0 + Math.sin(time * 10 + i) * 0.1;
                ctx.scale(pulse, pulse);
                const spin = time * 3 + i;
                const crystalH = 34;
                const crystalW = 16;
                const gap = 5;

                ctx.globalAlpha = 1.0;

                
                for (let side = 0; side < 4; side++) {
                    const ang1 = spin + (side * Math.PI) / 2;
                    const ang2 = ang1 + Math.PI / 2;
                    const x1 = Math.cos(ang1) * crystalW;
                    const x2 = Math.cos(ang2) * crystalW;

                    if (Math.sin(ang1) > 0 || Math.sin(ang2) > 0) {
                        const shadeFactor = 0.6 + Math.cos(ang1) * 0.4;
                        ctx.fillStyle = crystalColor;
                        ctx.globalAlpha = shadeFactor; 

                        
                        ctx.beginPath();
                        ctx.moveTo(0, -crystalH); ctx.lineTo(x1, -gap); ctx.lineTo(x2, -gap); ctx.closePath(); ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(0, crystalH); ctx.lineTo(x1, gap); ctx.lineTo(x2, gap); ctx.closePath(); ctx.fill();

                        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.2; ctx.stroke();
                        ctx.globalAlpha = 1.0;
                    }
                }

                
                ctx.fillStyle = '#FFF'; ctx.globalAlpha = 0.8;
                ctx.fillRect(-1.5, -gap, 3, gap * 2);
                ctx.restore();

                
                if (fenceActive && e.crystalPositions) {
                    const nextP = e.crystalPositions[(i + 1) * 1 % 5];
                    ctx.save();
                    ctx.strokeStyle = crystalColor;
                    ctx.lineWidth = 4 + Math.sin(time * 20 + i) * 2;
                    ctx.globalAlpha = 0.7 + Math.sin(time * 15) * 0.2;

                    
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    const segments = 6;
                    const ang = Math.atan2(nextP.y - p.y, nextP.x - p.x);
                    const perpA = ang + Math.PI / 2;
                    for (let s = 1; s <= segments; s++) {
                        const progress = s / segments;
                        const jitter = (Math.random() - 0.5) * 20;
                        ctx.lineTo(
                            p.x + (nextP.x - p.x) * progress + Math.cos(perpA) * jitter,
                            p.y + (nextP.y - p.y) * progress + Math.sin(perpA) * jitter
                        );
                    }
                    ctx.stroke();
                    ctx.restore();
                }
            });
            ctx.restore();
        }

        
        if (e.isAnomaly && !e.dead) {
            ctx.save();
            const time = state.gameTime;

            
            const gen = e.anomalyGeneration || 0;
            const baseBurnRadius = 390 + (gen * 10); 
            const stage3Bonus = (e.bonusBurnRadius || 0); 
            const burnRadius = baseBurnRadius + stage3Bonus;

            const pulse = 1.0 + Math.sin(time * 4) * 0.05;

            
            const stage = e.stage || 1;
            let innerColor = 'rgba(245, 158, 11, 0.4)'; 
            let outerColor = 'rgba(239, 68, 68, 0.15)'; 
            let auraColor = '#ef4444'; 
            let shadowColor = '#dc2626'; 

            if (stage === 2) {
                innerColor = 'rgba(239, 68, 68, 0.5)'; 
                outerColor = 'rgba(220, 38, 38, 0.2)'; 
                auraColor = '#dc2626'; 
                shadowColor = '#b91c1c'; 
            } else if (stage === 3) {
                innerColor = 'rgba(220, 38, 38, 0.6)'; 
                outerColor = 'rgba(185, 28, 28, 0.3)'; 
                auraColor = '#b91c1c'; 
                shadowColor = '#991b1b'; 
            }

            
            const grad = ctx.createRadialGradient(e.x, e.y, 50, e.x, e.y, burnRadius * pulse);
            grad.addColorStop(0, innerColor); 
            grad.addColorStop(0.7, outerColor); 
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            const edgePoints = 32;
            for (let i = 0; i <= edgePoints; i++) {
                const ang = (i / edgePoints) * Math.PI * 2;
                const r = (burnRadius * pulse) + Math.sin(ang * 8 + time * 5) * 15;
                const px = e.x + Math.cos(ang) * r;
                const py = e.y + Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.fill();

            
            
            
            ctx.shadowBlur = 40;
            ctx.shadowColor = shadowColor;
            ctx.strokeStyle = auraColor;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + (stage - 1) * 0.1; 

            ctx.beginPath();

            
            const auraPoints = 16;
            for (let i = 0; i <= auraPoints; i++) {
                const ang = (i / auraPoints) * Math.PI * 2;
                const r = e.size * (1.6 + Math.sin(ang * 5 + time * 8) * 0.2);
                const px = e.x + Math.cos(ang) * r;
                const py = e.y + Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    });

    enemies.forEach(e => {
        if (e.dead && !e.isZombie) return;
        ctx.save();
        ctx.translate(e.x, e.y);

        
        if (e.jitterX || e.jitterY) {
            ctx.translate(e.jitterX || 0, e.jitterY || 0);
        }

        
        const pDistV = Math.hypot(e.x - state.player.x, e.y - state.player.y);
        const isVortexSkillOn = !!(state.player.orbitalVortexUntil && state.player.orbitalVortexUntil > state.gameTime);
        const isVortexStunned = isVortexSkillOn && pDistV < 800;
        const isVortexRecovering = !!(e.vortexRecoveryUntil && e.vortexRecoveryUntil > state.gameTime);
        if (isVortexStunned || isVortexRecovering) {
            const t = state.gameTime;
            const alpha = isVortexStunned ? 0.6 : 0.4 * Math.max(0, ((e.vortexRecoveryUntil || 0) - t) / 3.0);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#fbbf24'; 
            ctx.lineWidth = 2.5;
            const spin = t * 15;
            for (let i = 0; i < 3; i++) {
                const rot = spin + i * (Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(0, 0, e.size * 1.6, rot, rot + 1.2);
                ctx.stroke();
            }
            ctx.restore();
        }

        
        if (e.slowFactor && e.slowFactor > 0.4) {
            ctx.save();
            const slowAmt = Math.min(1, (e.slowFactor - 0.4) * 2);
            ctx.strokeStyle = '#67e8f9';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.5 * slowAmt;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';

            
            ctx.beginPath();
            ctx.arc(0, 0, e.size * 1.2, 0, Math.PI * 2);
            ctx.stroke();

            
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI / 3) + state.gameTime;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * e.size * 1.1, Math.sin(ang) * e.size * 1.1);
                ctx.lineTo(Math.cos(ang) * e.size * 1.4, Math.sin(ang) * e.size * 1.4);
                ctx.stroke();
            }
            ctx.restore();
        }

        
        if (e.frozen && e.frozen > 0) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#bae6fd'; 
            ctx.strokeStyle = '#38bdf8'; 
            ctx.lineWidth = 2;

            
            ctx.beginPath();
            const shards = 8;
            for (let i = 0; i < shards; i++) {
                const ang = (i / shards) * Math.PI * 2;
                const r = e.size * (1.1 + (i % 2 === 0 ? 0.2 : 0.05));
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-e.size * 0.3, -e.size * 0.3, e.size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        
        if (e.isEnraged) {
            ctx.save();
            const time = state.gameTime;
            const rageColor = '#ef4444';
            ctx.strokeStyle = rageColor;
            ctx.lineWidth = 4;
            ctx.shadowBlur = 20;
            ctx.shadowColor = rageColor;
            ctx.globalAlpha = 0.4 + Math.sin(time * 15) * 0.2;

            
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI / 3) + time * 3.5; 
                const len = e.size * (1.2 + Math.random() * 0.3);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
                ctx.stroke();
            }
            ctx.restore();
        }

        if (e.isPhalanxDrone && !e.dead) {
            const host = e.soulLinkHostId ? bossMap.get(e.soulLinkHostId) : null;
            if (host && host.phalanxState === 3) {
                ctx.save();
                ctx.translate(e.x, e.y);
                const angle = e.rotationPhase || 0;
                const rx = Math.cos(angle);
                const ry = Math.sin(angle);

                ctx.strokeStyle = '#eab308'; 
                ctx.lineWidth = 1; 
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                
                const edgeOffset = e.size * 1.5;
                ctx.moveTo(-rx * edgeOffset, -ry * edgeOffset);
                ctx.lineTo(-rx * (edgeOffset + 30), -ry * (edgeOffset + 30)); 
                ctx.stroke();
                ctx.restore();
            }
        }

        
        if (e.isZombie) {
            const zombieImg = (meteoriteImages as any).zombie;
            if (zombieImg && zombieImg.complete) {
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#4ade80';
                const zSize = e.size * 2;
                if (e.zombieState === 'rising') {
                    const now = state.gameTime * 1000;
                    const timeLeft = (e.zombieTimer || 0) - now;
                    const totalRiseTime = 1500;
                    const progress = 1 - Math.max(0, timeLeft / totalRiseTime);
                    const shake = (1 - progress) * 12;
                    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

                    
                    ctx.fillStyle = '#451a03';
                    const particleCount = progress < 0.3 ? 15 : 5;
                    for (let i = 0; i < particleCount; i++) {
                        const dr = Math.sin(i * 123 + state.gameTime * 20) * e.size * (1.2 + progress);
                        const da = i * (Math.PI * 2 / particleCount);
                        ctx.fillRect(Math.cos(da) * dr, Math.sin(da) * dr, 5, 5);
                    }

                    if (progress > 0.3) {
                        const zProgress = (progress - 0.3) / 0.7;
                        ctx.globalAlpha = zProgress;
                        ctx.translate(0, (1 - zProgress) * 35);
                        ctx.scale(0.8 + 0.2 * zProgress, 0.8 + 0.2 * zProgress);
                        ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                    }
                } else if (e.zombieState !== 'dead') {
                    
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

                    
                    const isMovingRight = (e.vx || 0) > 0.1;
                    ctx.save();
                    if (isMovingRight) {
                        ctx.scale(-1, 1);
                    }
                    ctx.drawImage(zombieImg, -zSize / 2, -zSize / 2, zSize, zSize);
                    ctx.restore();

                    
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

        
        if (e.orbitalShields && e.orbitalShields > 0) {
            ctx.save();
            
            
            
            ctx.strokeStyle = '#06b6d4'; 
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#06b6d4';
            ctx.globalAlpha = 0.4;

            
            const barrierSize = 110; 
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                const px = Math.cos(ang) * barrierSize;
                const py = Math.sin(ang) * barrierSize;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            
            ctx.fillStyle = '#06b6d4';
            ctx.globalAlpha = 0.1;
            ctx.fill();
            ctx.restore();
        }

        


        const pulse = 1.0 + (Math.sin(e.pulsePhase || 0) * 0.05);
        ctx.scale(pulse, pulse);

        
        const p = e.palette || PALETTES[0].colors;
        let coreColor = e.eraPalette?.[2] || p[0];
        let innerColor = e.eraPalette?.[1] || p[1];
        let outerColor = e.eraPalette?.[0] || p[2];

        
        const fState = e.fluxState || 0;
        if (e.soulSuckActive || e.soulSuckUsed) {
            coreColor = '#eab308'; 
            innerColor = '#334155'; 
            outerColor = '#000000'; 
            ctx.shadowColor = e.soulSuckActive ? '#eab308' : '#000000';
            ctx.shadowBlur = e.soulSuckActive ? 25 : 5;
        } else {
            if (fState === 0) {
                
                coreColor = e.eraPalette?.[0] || p[0];
                innerColor = e.eraPalette?.[2] || p[1];
                outerColor = e.eraPalette?.[1] || p[2];
            } else if (fState === 1) {
                
                coreColor = e.eraPalette?.[1] || p[0];
                innerColor = e.eraPalette?.[0] || p[1];
                outerColor = e.eraPalette?.[2] || p[2];
            } else if (fState === 2) {
                
                coreColor = '#FFFFFF'; 
                innerColor = e.eraPalette?.[0] || e.palette[0];
                outerColor = e.eraPalette?.[1] || e.palette[1];
                ctx.shadowColor = innerColor;
                ctx.shadowBlur = 15;
            }
        }

        
        if (fState === 1) {
            innerColor = dimHex(innerColor, 0.8);
        }

        let chaosLevel = 0;
        const minutes = state.gameTime / 60;
        if (e.boss) {
            chaosLevel = Math.min(1, Math.max(0, (minutes - 2) / 10));
        }

        
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

            
            if (isCore) {
                const sides = 3 + (Math.floor((e.id || 0) * 10) % 3); 
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
            if (e.shape === 'abomination') {
                const dx = state.player.x - e.x;
                const dy = state.player.y - e.y;
                const angleToPlayer = Math.atan2(dy, dx);
                const relativeAngle = angleToPlayer - (e.rotationPhase || 0) + Math.PI / 2;

                ctx.save();
                ctx.rotate(relativeAngle);

                const s = size;
                const snoutW = s * 0.5;
                const headCW = s * 0.8;
                const headCY = -s * 0.2;

                ctx.beginPath();
                ctx.moveTo(0, -s * 0.8);
                ctx.lineTo(s * 0.5, -s * 0.8);
                ctx.lineTo(headCW, -s * 0.5);
                ctx.lineTo(headCW, headCY);
                ctx.lineTo(snoutW, s * 0.4);
                ctx.lineTo(snoutW * 1.2, s * 0.7);
                ctx.lineTo(0, s * 1.0);
                ctx.lineTo(-snoutW * 1.2, s * 0.7);
                ctx.lineTo(-snoutW, s * 0.4);
                ctx.lineTo(-headCW, headCY);
                ctx.lineTo(-headCW, -s * 0.5);
                ctx.lineTo(-s * 0.5, -s * 0.8);
                ctx.lineTo(0, -s * 0.8);
                ctx.closePath();

                const drawHorn = (side: number) => {
                    const hornBaseX = side * s * 0.5;
                    const hornBaseY = -s * 0.8;
                    const hornTipX = side * s * 2.2;
                    const hornTipY = -s * 1.4;

                    ctx.moveTo(hornBaseX, hornBaseY);
                    ctx.quadraticCurveTo(side * s * 1.5, -s * 0.7, hornTipX, hornTipY);
                    ctx.quadraticCurveTo(side * s * 0.9, -s * 0.4, hornBaseX - (side * s * 0.2), hornBaseY + (s * 0.3));
                };
                drawHorn(1);
                drawHorn(-1);

                ctx.restore();
            } else if (e.shape === 'circle') {
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
            } else if (e.shape === 'long_drone') {
                const s = size;
                const p1 = wp(s * 2.5, 0); 
                const p2 = wp(-s * 1.5, s * 0.4); 
                const p3 = wp(-s * 0.8, 0); 
                const p4 = wp(-s * 1.5, -s * 0.4); 
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(p3.x, p3.y);
                ctx.lineTo(p4.x, p4.y);
                ctx.closePath();
            } else if (e.shape === 'triangle') {
                const p1 = wp(0, -size); const p2 = wp(size * 0.866, size * 0.5); const p3 = wp(-size * 0.866, size * 0.5);
                ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.closePath();
            } else if (e.shape === 'square') {
                if (e.isElite && !isCore) {
                    
                    const spike = size * 0.5;
                    const inner = size * 0.7;

                    for (let i = 0; i < 8; i++) {
                        const ang = (i * Math.PI / 4) - Math.PI / 2;
                        const isCorner = i % 2 === 0;
                        const r = isCorner ? size * 1.3 : size + spike;
                        const p = wp(Math.cos(ang) * r, Math.sin(ang) * r);
                        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                    }
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
                    const angle = (i * 2 * Math.PI / 6) - Math.PI / 2; 
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
                
                
                const arcLen = Math.PI / 1.5; 
                
                ctx.beginPath();
                ctx.arc(0, 0, size, -arcLen / 2, arcLen / 2); 
                ctx.arc(0, 0, size * 0.6, arcLen / 2, -arcLen / 2, true); 
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
            } else if (e.shape === 'worm') {
                const isPromoDormant = e.wormPromotionTimer && state.gameTime < e.wormPromotionTimer;
                const isHead = e.wormRole === 'head' && !isPromoDormant;
                const t = state.gameTime;
                const isUnderground = e.wormBurrowState === 'underground';
                const alphaMult = isUnderground ? 0.35 : (isPromoDormant ? 0.5 : 1.0);

                
                const dim = (hex: string, amt: number) => {
                    if (isUnderground) return hex + '88'; 
                    return hex;
                };

                const moveAngle = (e.vx && e.vy) ? Math.atan2(e.vy, e.vx) : 0;
                const headColor = dim(innerColor, 0.5);
                const outlineColor = dim(outerColor, 0.5);
                const eyesColor = dim(coreColor, 0.5);

                if (isHead) {
                    
                    ctx.save();
                    ctx.globalAlpha *= alphaMult;

                    
                    const drawMandible = (side: number) => {
                        const open = Math.sin(t * 15) * 0.4 + 0.5;
                        const ang = moveAngle + (0.7 + open) * side;

                        ctx.beginPath();
                        ctx.strokeStyle = headColor;
                        ctx.lineWidth = 4;
                        ctx.lineJoin = 'round';
                        ctx.moveTo(Math.cos(moveAngle + 0.4 * side) * size * 0.8, Math.sin(moveAngle + 0.4 * side) * size * 0.8);

                        
                        const j1x = Math.cos(ang) * size * 1.5;
                        const j1y = Math.sin(ang) * size * 1.5;
                        ctx.lineTo(j1x, j1y);

                        
                        const tipAng = ang + 0.8 * side;
                        const tX = j1x + Math.cos(tipAng) * size * 0.8;
                        const tY = j1y + Math.sin(tipAng) * size * 0.8;
                        ctx.lineTo(tX, tY);
                        ctx.stroke();

                        
                        ctx.beginPath();
                        ctx.fillStyle = eyesColor; 
                        for (let i = 0; i < 3; i++) {
                            const p = 0.3 + i * 0.3;
                            const sx = j1x * (1 - p) + (Math.cos(moveAngle + 0.4 * side) * size * 0.8) * p;
                            const sy = j1y * (1 - p) + (Math.sin(moveAngle + 0.4 * side) * size * 0.8) * p;
                            ctx.arc(sx, sy, 2, 0, Math.PI * 2);
                        }
                        ctx.fill();
                    };
                    drawMandible(1);
                    drawMandible(-1);

                    
                    ctx.beginPath();
                    const skullSteps = 8;
                    for (let i = 0; i <= skullSteps; i++) {
                        const ang = moveAngle + (i / skullSteps - 0.5) * Math.PI * 1.2;
                        const r = size * (1.2 + Math.random() * 0.1);
                        const px = Math.cos(ang) * r;
                        const py = Math.sin(ang) * r;
                        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                    }
                    
                    ctx.lineTo(Math.cos(moveAngle + Math.PI) * size * 0.5, Math.sin(moveAngle + Math.PI) * size * 0.5);
                    ctx.closePath();
                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.fillStyle = '#111827';
                    ctx.fill();

                    
                    const eyePos = [
                        { a: 0.2, d: 0.8, s: 4 }, { a: -0.2, d: 0.8, s: 4 }, 
                        { a: 0.5, d: 0.6, s: 2 }, { a: -0.5, d: 0.6, s: 2 }, 
                        { a: 0, d: 1.1, s: 3 } 
                    ];

                    const isCharging = e.wormAIState === 'charging' && !isUnderground;
                    const activeEyesColor = isCharging ? '#ff0000' : eyesColor;
                    const finalEyesColor = isUnderground ? activeEyesColor + (activeEyesColor.length === 7 ? '88' : '') : activeEyesColor;

                    ctx.shadowBlur = isUnderground ? 5 : 15;
                    ctx.shadowColor = finalEyesColor;
                    ctx.fillStyle = finalEyesColor;
                    eyePos.forEach(p => {
                        const ep = (isCharging ? 1.2 : 0.8) + Math.sin(t * 10 + p.a * 5) * 0.2;
                        ctx.beginPath();
                        ctx.arc(Math.cos(moveAngle + p.a) * size * p.d, Math.sin(moveAngle + p.a) * size * p.d, p.s * ep, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.restore();

                } else {
                    
                    ctx.save();
                    ctx.globalAlpha *= alphaMult;

                    
                    const rot = t * 3 + e.wormSegmentIndex! * 0.4;
                    ctx.rotate(rot);

                    
                    ctx.beginPath();
                    ctx.moveTo(0, -size * 1.2);
                    ctx.lineTo(size * 0.8, 0);
                    ctx.lineTo(0, size * 1.2);
                    ctx.lineTo(-size * 0.8, 0);
                    ctx.closePath();

                    ctx.strokeStyle = outlineColor;
                    ctx.lineWidth = isUnderground ? 1.5 : 4;
                    ctx.stroke();
                    ctx.fillStyle = isUnderground ? '#0f172a' : '#1e293b';
                    ctx.fill();

                    
                    if (!isUnderground) {
                        ctx.beginPath();
                        ctx.strokeStyle = headColor;
                        ctx.lineWidth = 1;
                        ctx.moveTo(-size * 0.4, 0);
                        ctx.lineTo(size * 0.4, 0);
                        ctx.moveTo(0, -size * 0.6);
                        ctx.lineTo(0, size * 0.6);
                        ctx.stroke();
                    }
                    ctx.restore();
                }

                
                if (isUnderground) {
                    ctx.save();
                    ctx.globalAlpha = 0.2;
                    ctx.strokeStyle = outlineColor;
                    ctx.setLineDash([4, 12]);
                    ctx.beginPath();
                    ctx.arc(0, 0, size * (1.5 + Math.sin(t * 5) * 0.2), 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }

                
                ctx.beginPath();
            } else if (e.shape === 'glitcher') {
                
                const t = state.gameTime;

                
                const lineCount = 2;
                for (let i = 0; i < lineCount; i++) {
                    ctx.save();
                    const angle = (i / lineCount) * Math.PI * 2 + t * 5;
                    const length = size * (1.8 + Math.sin(t * 20 + i) * 0.7);

                    
                    ctx.strokeStyle = i === 0 ? '#ff00ff' : '#00ffff';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.7 + Math.sin(t * 15 + i) * 0.3; 

                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        };

        
        if (e.summonState === 1 && e.frozen && e.frozen > 0) {
            const progress = 1 - Math.max(0, e.frozen / 1.0); 
            const shake = (1 - progress) * 8;
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

            
            ctx.fillStyle = '#451a03';
            const particleCount = progress < 0.5 ? 12 : 6;
            for (let i = 0; i < particleCount; i++) {
                const dr = Math.sin(i * 123 + state.gameTime * 25) * e.size * (1 + progress);
                const da = i * (Math.PI * 2 / particleCount);
                ctx.fillRect(Math.cos(da) * dr, Math.sin(da) * dr, 3, 3);
            }

            
            ctx.beginPath();
            ctx.rect(-e.size * 2, -e.size * 2, e.size * 4, e.size * 2 + 10);
            ctx.clip();

            const riseOffset = (1 - progress) * e.size * 1.5;
            ctx.translate(0, riseOffset);
            ctx.scale(progress, progress);
            ctx.globalAlpha = Math.min(1, progress * 1.5);
        }



        if (e.critGlitchUntil && state.gameTime < e.critGlitchUntil) {
            ctx.save();
            const shift = 4 + Math.random() * 4;
            ctx.save(); ctx.translate(shift, 0); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#FF0000'; drawShape(e.size * 1.05); ctx.stroke(); ctx.restore();
            ctx.save(); ctx.translate(-shift, 0); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#0000FF'; drawShape(e.size * 1.05); ctx.stroke(); ctx.restore();
            ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; drawShape(e.size * 1.1); ctx.stroke();
            ctx.restore();
            ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        }

        
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
            ctx.strokeStyle = '#FF0000'; ctx.lineWidth = 3;
            
            ctx.lineWidth = 8; ctx.globalAlpha = redAlpha * 0.3; drawShape(e.size * 1.25, true); ctx.stroke();
            ctx.lineWidth = 3; ctx.globalAlpha = redAlpha; drawShape(e.size * 1.25, true); ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        ctx.strokeStyle = outerColor; ctx.lineWidth = 1.5;
        if (e.boss) {
            
            ctx.lineWidth = 6; ctx.strokeStyle = outerColor; ctx.globalAlpha = 0.4; drawShape(e.size * 1.1, true); ctx.stroke();
            ctx.lineWidth = 1.5; ctx.globalAlpha = 1.0;
        } else {
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
        drawShape(e.size * 1.1, true); ctx.stroke();

        ctx.fillStyle = innerColor; ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
        drawShape(e.size, true); ctx.fill();

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

        if (false) { 
        } else {
            
            ctx.fillStyle = coreColor; ctx.globalAlpha = 1.0;

            if (e.soulSuckCoreSize) {
                
                ctx.fillStyle = coreColor;
                drawShape(e.soulSuckCoreSize, true, false);
            } else if (e.isNecroticZombie) {
                
                drawShape(e.size * 0.5, true, true);
            } else {
                
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

        
        if ((e.isElite || e.shape === 'worm') && e.maxHp > 0 && e.hp < e.maxHp) {
            ctx.save();
            ctx.rotate(-(e.rotationPhase || 0)); 
            let barWidth = e.size * 2.5;
            let barHeight = 4;
            let yOffset = -e.size * 1.8;

            if (e.shape === 'worm') {
                if (e.wormRole === 'head') {
                    barWidth = e.size * 3.0; 
                } else {
                    barWidth = e.size * 1.5; 
                    barHeight = 2.5;
                }
            }

            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);

            
            const pct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = e.palette[1] || '#ff0000'; 
            ctx.fillRect(-barWidth / 2, yOffset, barWidth * pct, barHeight);

            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-barWidth / 2, yOffset, barWidth, barHeight);

            ctx.restore();
        }

        
        if (e.shape === 'triangle' && e.berserkState) {
            ctx.save();
            
            const auraSize = e.size * 2.0;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#F59E0B'; 
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6 + Math.sin(state.gameTime * 20) * 0.4; 

            ctx.beginPath();
            
            for (let i = 0; i < 3; i++) {
                
                const ang = i * (Math.PI * 2 / 3) - Math.PI / 2;
                const ax = Math.cos(ang) * auraSize;
                const ay = Math.sin(ang) * auraSize;
                if (i === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        
        if (e.shape === 'diamond' && e.beamState === 2 && e.beamX && e.beamY) {
            const isLvl4 = (e.bossTier || 0) >= 4 || (state.gameTime > 1800 && e.bossTier !== 1);
            const centerAngle = e.beamAngle || Math.atan2(e.beamY - e.y, e.beamX - e.x);
            const duration = isLvl4 ? 240 : 30;
            const t = Math.min(1, (e.beamTimer || 0) / duration);

            const drawLaser = (angle: number) => {
                ctx.save();
                ctx.rotate(angle - (e.rotationPhase || 0));
                const dist = 3000;
                const beamWidth = (isLvl4 ? 30 : 40) + Math.sin(state.gameTime * 50) * 10;

                
                ctx.fillStyle = e.palette[1];
                ctx.globalAlpha = 0.3;
                ctx.fillRect(0, -beamWidth / 2, dist, beamWidth);

                
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = e.palette[1];
                ctx.shadowBlur = isLvl4 ? 30 : 40;
                ctx.globalAlpha = 0.8;
                ctx.fillRect(0, -beamWidth / 6, dist, beamWidth / 3);

                
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = 1.0;
                ctx.shadowBlur = 10;
                ctx.fillRect(0, -1.5, dist, 3);
                ctx.restore();
            };

            if (isLvl4) {
                const startOff = (45 * Math.PI) / 180;
                const endOff = (4.5 * Math.PI) / 180; 
                const currentOffset = startOff - (startOff - endOff) * t;
                drawLaser(centerAngle + currentOffset);
                drawLaser(centerAngle - currentOffset);
            } else {
                drawLaser(centerAngle);
            }
        }

        
        if (e.legionId && e.maxLegionShield && e.legionShield) {
            const isLead = e.id === e.legionLeadId;
            if (isLead) {
                ctx.save();
                ctx.rotate(-(e.rotationPhase || 0)); 

                const spacing = e.size * 2.5;
                const gridWidth = 5 * spacing; 
                const gridHeight = 4 * spacing; 

                
                const centerX = -(e.legionSlot?.x || 0) * spacing;
                const centerY = -(e.legionSlot?.y || 0) * spacing;

                
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

                
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 4;
                ctx.globalAlpha = 0.4 * auraPulse;
                ctx.setLineDash([20, 10]);
                const padding = 40;
                ctx.strokeRect(-gridWidth / 2 - padding, -gridHeight / 2 - padding, gridWidth + padding * 2, gridHeight + padding * 2);
                ctx.restore();

                
                const barWidth = gridWidth + padding;
                const barHeight = 8;
                const barX = centerX - barWidth / 2;
                const barY = centerY - gridHeight / 2 - padding - 40;

                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                
                const shieldPct = Math.max(0, e.legionShield / e.maxLegionShield);
                ctx.fillStyle = '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.fillRect(barX, barY, barWidth * shieldPct, barHeight);

                
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

    
    enemies.forEach(e => {
        if (!e.isElite || e.shape !== 'diamond' || e.dead) return;

        
        if (e.eliteState === 1) {
            ctx.save();
            const ang = e.dashState || 0;
            const remaining = (e.timer || 0) - state.gameTime;
            const isLocked = remaining <= 0.8; 

            
            ctx.strokeStyle = e.palette[1];
            ctx.globalAlpha = isLocked ? 0.8 : 0.3;
            ctx.lineWidth = isLocked ? 3 : 1;
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x + Math.cos(ang) * 3000, e.y + Math.sin(ang) * 3000);
            ctx.stroke();

            
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
                
                ctx.globalAlpha = 0.3 + Math.sin(state.gameTime * 20) * 0.2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, chargeSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        
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
