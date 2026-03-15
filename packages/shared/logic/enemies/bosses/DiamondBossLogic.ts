import type { Enemy, GameState } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { distToSegment } from '../../utils/MathUtils';
import { applyDamageToPlayer } from '../../utils/CombatUtils';
import { PALETTES } from '../../core/Constants';
import { checkBossStageTransition } from './BossStageUtils';

export function updateDiamondBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean, isLevel5: boolean, _onEvent?: (event: string, data?: any) => void) {
    checkBossStageTransition(e, state);
    const stage = e.stage || 1;
    e.bossTier = isLevel5 ? 5 : isLevel4 ? 4 : isLevel3 ? 3 : isLevel2 ? 2 : 1;

    if (isLevel5) {
        const distToPlayer = Math.hypot(dx, dy);
        const spawnedMinutes = (e.spawnedAt || state.gameTime) / 60;
        const eraIndex = Math.floor(spawnedMinutes / 15) % PALETTES.length;
        const crystalColor = PALETTES[eraIndex].colors[0];

        if (!e.crystalState || e.crystalState === 0) {
            const isCooldownDone = (e.timer || 0) >= 0;
            const isFirstCast = !e.crystalState;
            if ((isFirstCast && distToPlayer < 1000) || (!isFirstCast && isCooldownDone)) {
                e.crystalState = 1;
                e.timer = 0;
                e.crystalPositions = [];
                const baseRot = Math.random() * Math.PI * 2;
                for (let i = 0; i < 5; i++) {
                    const ang = baseRot + (i * Math.PI * 2) / 5;
                    e.crystalPositions.push({ x: state.player.x + Math.cos(ang) * 600, y: state.player.y + Math.sin(ang) * 600 });
                }
                playSfx('lock-on');
            }
        } else if (e.crystalState === 1) {
            e.timer = (e.timer || 0) + 1;
            if (e.timer > 60) {
                e.crystalState = 2;
                e.timer = 0;
                playSfx('laser');
            }
            e.crystalPositions?.forEach(p => {
                if (state.frameCount % 5 === 0) spawnParticles(state, p.x, p.y, crystalColor, 2, 5, Math.random() * 6.28, 'spark');
            });
        } else if (e.crystalState === 2) {
            e.timer = (e.timer || 0) + 1;

            if (state.frameCount % 5 === 0 && e.crystalPositions) {
                const fenceDmg = e.maxHp * 0.01;
                const px = state.player.x;
                const py = state.player.y;
                const pSize = state.player.size;

                for (let i = 0; i < 5; i++) {
                    const p1 = e.crystalPositions[i];
                    const p2 = e.crystalPositions[(i + 1) % 5];
                    const dist = distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < pSize + 15) {
                        applyDamageToPlayer(state, state.player, fenceDmg, {
                            sourceType: 'other',
                            incomingDamageSource: 'Diamond Boss',
                            deathCause: `Diamond Boss Level ${e.bossTier} Laser Fence`,
                            killerHp: e.hp,
                            killerMaxHp: e.maxHp,
                            floatingNumberColor: '#ef4444'
                        });
                        spawnParticles(state, px, py, crystalColor, 5);
                    }
                }
            }

            if (e.timer > 600) {
                e.crystalState = 0;
                e.timer = -600;
                e.crystalPositions = undefined;
                playSfx('dash');
            }
        } else if (e.crystalState === 0 && (e.timer || 0) < 0) {
            e.timer = (e.timer || 0) + 1;
        }
    }

    if (isLevel3) {
        if (!e.satelliteTimer) e.satelliteTimer = 0;
        e.satelliteTimer++;
        if (!e.satelliteState) e.satelliteState = 0;

        if (e.satelliteState === 0) {
            const interval = 600 - (stage - 1) * 150;
            if (e.satelliteTimer > interval) {
                e.satelliteState = 1;
                e.satelliteTimer = 0;
                e.satelliteTargets = [];
                const count = 4 + (isLevel2 ? 2 : 0) + (isLevel4 ? 4 : 0) + (stage - 1) * 2;
                for (let k = 0; k < count; k++) {
                    const a = (k * Math.PI * 2) / count + Math.random();
                    const r = 150 + Math.random() * 100;
                    e.satelliteTargets.push({ x: state.player.x + Math.cos(a) * r, y: state.player.y + Math.sin(a) * r });
                }
                playSfx('lock-on');
            }
        } else if (e.satelliteState === 1) {
            if (state.frameCount % 5 === 0 && e.satelliteTargets) {
                const eraColors = ['#4ade80', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];
                const warningColor = eraColors[Math.floor(((e.spawnedAt || state.gameTime) / 60) / 15) % 5];
                e.satelliteTargets.forEach(t => spawnParticles(state, t.x, t.y, warningColor, 2));
            }
            if (e.satelliteTimer > 90) {
                e.satelliteState = 2;
                e.satelliteTimer = 0;
                playSfx('laser');
            }
        } else if (e.satelliteState === 2) {
            if (e.satelliteTimer === 1 && e.satelliteTargets) {
                const dmg = e.maxHp * 0.03;
                const eraColors = ['#4ade80', '#3b82f6', '#a855f7', '#f97316', '#ef4444'];
                const strikeColor = eraColors[Math.floor(((e.spawnedAt || state.gameTime) / 60) / 15) % 5];

                e.satelliteTargets.forEach(t => {
                    for (let k = 0; k < 10; k++) spawnParticles(state, t.x, t.y - k * 20, strikeColor, 5);
                    if (Math.hypot(state.player.x - t.x, state.player.y - t.y) < 60) {
                        applyDamageToPlayer(state, state.player, dmg, {
                            sourceType: 'other',
                            incomingDamageSource: 'Diamond Boss',
                            deathCause: `Diamond Boss Level ${e.bossTier} Satellite Orbital Beam`,
                            killerHp: e.hp,
                            killerMaxHp: e.maxHp,
                            floatingNumberColor: '#ef4444'
                        });
                        spawnParticles(state, state.player.x, state.player.y, '#FF0000', 10);
                        const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                        if (triggerZap) triggerZap(state, state.player, 1);
                    }
                });
            }
            if (e.satelliteTimer > 20) {
                e.satelliteState = 0;
                e.satelliteTimer = 0;
                e.satelliteTargets = undefined;
            }
        }
    }

    if (!isLevel2) return { vx: Math.cos(Math.atan2(dy, dx)) * currentSpd + pushX, vy: Math.sin(Math.atan2(dy, dx)) * currentSpd + pushY };

    if (!e.beamTimer) e.beamTimer = 0;
    e.beamTimer++;
    if (!e.beamState) e.beamState = 0;

    const beamCD = 300 - (stage - 1) * 60;
    if (e.beamState === 0) {
        if (!e.distGoal) e.distGoal = 600 + Math.random() * 200;
        const dist = Math.hypot(dx, dy);
        const distFactor = (dist - e.distGoal) / 100;
        const angle = Math.atan2(dy, dx);
        if (e.beamTimer > beamCD) {
            e.beamState = 1;
            e.beamTimer = 0;
            e.beamX = state.player.x;
            e.beamY = state.player.y;
        }
        return { vx: Math.cos(angle) * distFactor * currentSpd + pushX, vy: Math.sin(angle) * distFactor * currentSpd + pushY };
    }
    if (e.beamState === 1) {
        if (e.beamTimer <= 30) {
            e.beamX = state.player.x;
            e.beamY = state.player.y;
            e.beamAngle = Math.atan2(e.beamY - e.y, e.beamX - e.x);
        }
        if (e.beamTimer > 60) {
            e.beamState = 2;
            e.beamTimer = 0;
            e.hasHitThisBurst = false;
            playSfx('laser');
        }
        return { vx: 0, vy: 0 };
    }

    const centerAngle = e.beamAngle || 0;
    const px = state.player.x - e.x;
    const py = state.player.y - e.y;
    const pDist = Math.hypot(px, py);
    const pAngle = Math.atan2(py, px);
    const duration = isLevel4 ? 240 : 30;

    if (isLevel4) {
        const t = Math.min(1, e.beamTimer / duration);
        const currentOffset = (45 * Math.PI) / 180 - (((45 - 4.5) * Math.PI) / 180) * t;
        [centerAngle + currentOffset, centerAngle - currentOffset].forEach(angle => {
            const diff = Math.abs(pAngle - angle);
            const normDiff = Math.min(diff, Math.abs(diff - Math.PI * 2));
            if (normDiff < 0.05 && pDist < 3000 && state.frameCount % 5 === 0) {
                applyDamageToPlayer(state, state.player, e.maxHp * 0.005, {
                    sourceType: 'projectile',
                    incomingDamageSource: 'Diamond Boss',
                    deathCause: `Diamond Boss Level ${e.bossTier} Beam Attack`,
                    killerHp: e.hp,
                    killerMaxHp: e.maxHp,
                    floatingNumberColor: '#ef4444'
                });
            }
        });
    } else {
        const angleDiff = Math.abs(pAngle - centerAngle);
        const normalizedDiff = Math.min(angleDiff, Math.abs(angleDiff - Math.PI * 2));
        if (normalizedDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
            e.hasHitThisBurst = true;
            applyDamageToPlayer(state, state.player, e.maxHp * 0.05, {
                sourceType: 'projectile',
                incomingDamageSource: 'Diamond Boss',
                deathCause: `Diamond Boss Level ${e.bossTier} Beam Attack`,
                killerHp: e.hp,
                killerMaxHp: e.maxHp,
                floatingNumberColor: e.palette[1]
            });
        }
    }

    state.enemies.forEach(z => {
        if (z.isZombie && z.zombieState === 'active' && !z.dead) {
            const zdx = z.x - e.x, zdy = z.y - e.y;
            const zDist = Math.hypot(zdx, zdy);
            const zAngle = Math.atan2(zdy, zdx);
            const zAngleDiff = Math.abs(zAngle - centerAngle);
            const zNormDiff = Math.min(zAngleDiff, Math.abs(zAngleDiff - Math.PI * 2));
            if (zNormDiff < 0.1 && zDist < 3000) {
                z.dead = true;
                z.hp = 0;
                spawnParticles(state, z.x, z.y, '#4ade80', 10);
            }
        }
    });

    if (e.beamTimer > duration) {
        e.beamState = 0;
        e.beamTimer = 0;
    }
    return { vx: 0, vy: 0 };
}
