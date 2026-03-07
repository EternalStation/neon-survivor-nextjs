import type { Enemy, GameState } from '../../core/types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { calcStat, getDefenseReduction, distToSegment } from '../../utils/MathUtils';
import { applyDamageToPlayer } from '../../utils/CombatUtils';
import { PALETTES } from '../../core/constants';

export function updateTriangleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    let isBerserk = false;


    if (isLevel4) {
        state.player.healingDisabled = true;
        if (state.players) {
            Object.values(state.players).forEach(p => p.healingDisabled = true);
        }

        if (state.frameCount % 10 === 0) {
            spawnParticles(state, e.x, e.y, '#7f1d1d', 5, 8, 30, 'void');
        }
    }

    if (isLevel2) {
        if (!e.berserkTimer) e.berserkTimer = 0;
        e.berserkTimer++;

        const CD = 300;
        const DURATION = 180;

        if (!e.berserkState) {
            if (e.berserkTimer > CD) {
                e.berserkState = true;
                e.berserkTimer = 0;
            }
        } else {
            if (e.berserkTimer > DURATION) {
                e.berserkState = false;
                e.berserkTimer = 0;
            }
        }
        isBerserk = e.berserkState || false;
    }


    if (isLevel3) {

        e.deflectState = isBerserk;
    }

    const modifier = isBerserk ? 1.8 : 1.0;
    const finalSpd = currentSpd * modifier;
    const angle = Math.atan2(dy, dx);

    const wobble = isBerserk ? Math.sin(state.gameTime * 20) * 0.5 : 0;
    e.rotationPhase = (e.rotationPhase || 0) + (isBerserk ? 0.3 : 0.05);

    const vx = Math.cos(angle + wobble) * finalSpd + pushX;
    const vy = Math.sin(angle + wobble) * finalSpd + pushY;
    return { vx, vy };
}

export function updateDiamondBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean, isLevel5: boolean, onEvent?: (event: string, data?: any) => void) {
    if (isLevel5) e.bossTier = 5;
    else if (isLevel4) e.bossTier = 4;
    else if (isLevel3) e.bossTier = 3;
    else if (isLevel2) e.bossTier = 2;
    else e.bossTier = 1;

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
                    e.crystalPositions.push({
                        x: state.player.x + Math.cos(ang) * 600,
                        y: state.player.y + Math.sin(ang) * 600
                    });
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

            if (e.crystalPositions) {
                e.crystalPositions.forEach(p => {
                    if (state.frameCount % 5 === 0) {
                        spawnParticles(state, p.x, p.y, crystalColor, 2, 5, Math.random() * 6.28, 'spark');
                    }
                });
            }
        } else if (e.crystalState === 2) {
            e.timer = (e.timer || 0) + 1;

            if (state.frameCount % 5 === 0 && e.crystalPositions) {
                const fenceDmg = e.maxHp * 0.01;
                const px = state.player.x;
                const py = state.player.y;
                const pSize = state.player.size;


                for (let i = 0; i < 5; i++) {
                    const p1 = e.crystalPositions[i];
                    const p2 = e.crystalPositions[(i + 1) * 1 % 5];


                    const dist = distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < pSize + 15) {
                        applyDamageToPlayer(state, state.player, fenceDmg, {
                            sourceType: 'other',
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
            if (e.satelliteTimer > 600) {
                e.satelliteState = 1;
                e.satelliteTimer = 0;
                e.satelliteTargets = [];


                for (let k = 0; k < 3; k++) {
                    const a = (k * Math.PI * 2) / 3 + Math.random();
                    const r = 150 + Math.random() * 100;
                    e.satelliteTargets.push({
                        x: state.player.x + Math.cos(a) * r,
                        y: state.player.y + Math.sin(a) * r
                    });
                }
                playSfx('lock-on');
            }
        } else if (e.satelliteState === 1) {

            if (state.frameCount % 5 === 0 && e.satelliteTargets) {

                const minutes = (e.spawnedAt || state.gameTime) / 60;
                const eraIndex = Math.floor(minutes / 15) % 5;
                const eraColors = [
                    '#4ade80',
                    '#3b82f6',
                    '#a855f7',
                    '#f97316',
                    '#ef4444'
                ];
                const warningColor = eraColors[eraIndex];

                e.satelliteTargets.forEach(t => {
                    spawnParticles(state, t.x, t.y, warningColor, 2);
                });
            }

            if (e.satelliteTimer > 90) {
                e.satelliteState = 2;
                e.satelliteTimer = 0;
                playSfx('laser');
            }
        } else if (e.satelliteState === 2) {
            if (e.satelliteTimer === 1 && e.satelliteTargets) {
                const dmg = e.maxHp * 0.03;


                const minutes = (e.spawnedAt || state.gameTime) / 60;
                const eraIndex = Math.floor(minutes / 15) % 5;
                const eraColors = [
                    '#4ade80',
                    '#3b82f6',
                    '#a855f7',
                    '#f97316',
                    '#ef4444'
                ];
                const strikeColor = eraColors[eraIndex];

                e.satelliteTargets.forEach(t => {


                    for (let k = 0; k < 10; k++) {
                        spawnParticles(state, t.x, t.y - k * 20, strikeColor, 5);
                    }


                    const d = Math.hypot(state.player.x - t.x, state.player.y - t.y);
                    if (d < 60) {
                        applyDamageToPlayer(state, state.player, dmg, {
                            sourceType: 'other',
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


    if (isLevel2) {
        if (!e.beamTimer) e.beamTimer = 0;
        e.beamTimer++;
        if (!e.beamState) e.beamState = 0;

        const CD = 300;

        if (e.beamState === 0) {

            if (!e.distGoal) e.distGoal = 600 + Math.random() * 200;
            const dist = Math.hypot(dx, dy);
            const distFactor = (dist - e.distGoal) / 100;

            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * distFactor * currentSpd + pushX;
            const vy = Math.sin(angle) * distFactor * currentSpd + pushY;

            if (e.beamTimer > CD) {
                e.beamState = 1;
                e.beamTimer = 0;
                e.beamX = state.player.x;
                e.beamY = state.player.y;
            }
            return { vx, vy };

        } else if (e.beamState === 1) {

            const vx = 0; const vy = 0;

            if (e.beamTimer <= 30) {

                e.beamX = state.player.x;
                e.beamY = state.player.y;
                e.beamAngle = Math.atan2(e.beamY - e.y, e.beamX - e.x);
            } else {


            }

            if (e.beamTimer > 60) {
                e.beamState = 2;
                e.beamTimer = 0;
                e.hasHitThisBurst = false;
                playSfx('laser');
            }
            return { vx, vy };

        } else if (e.beamState === 2) {

            const vx = 0; const vy = 0;
            const centerAngle = e.beamAngle || 0;
            const px = state.player.x - e.x;
            const py = state.player.y - e.y;
            const pDist = Math.hypot(px, py);
            const pAngle = Math.atan2(py, px);

            const duration = isLevel4 ? 240 : 30;

            if (isLevel4) {

                const t = Math.min(1, e.beamTimer / duration);
                const startOff = (45 * Math.PI) / 180;
                const endOff = (4.5 * Math.PI) / 180;
                const currentOffset = startOff - (startOff - endOff) * t;

                const laser1 = centerAngle + currentOffset;
                const laser2 = centerAngle - currentOffset;


                [laser1, laser2].forEach(angle => {
                    const diff = Math.abs(pAngle - angle);
                    const normDiff = Math.min(diff, Math.abs(diff - Math.PI * 2));

                    if (normDiff < 0.05 && pDist < 3000) {

                        if (state.frameCount % 5 === 0) {
                            const finalDmg = e.maxHp * 0.005;
                            applyDamageToPlayer(state, state.player, finalDmg, {
                                sourceType: 'projectile',
                                deathCause: `Diamond Boss Level ${e.bossTier} Beam Attack`,
                                killerHp: e.hp,
                                killerMaxHp: e.maxHp,
                                floatingNumberColor: '#ef4444'
                            });
                        }
                    }
                });
            } else {

                const laserAngle = centerAngle;
                const angleDiff = Math.abs(pAngle - laserAngle);
                const normalizedDiff = Math.min(angleDiff, Math.abs(angleDiff - Math.PI * 2));

                if (normalizedDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
                    e.hasHitThisBurst = true;
                    const finalDmg = e.maxHp * 0.05;
                    applyDamageToPlayer(state, state.player, finalDmg, {
                        sourceType: 'projectile',
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
                        z.dead = true; z.hp = 0;
                        spawnParticles(state, z.x, z.y, '#4ade80', 10);
                    }
                }
            });

            if (e.beamTimer > duration) {
                e.beamState = 0;
                e.beamTimer = 0;
            }
            return { vx, vy };
        }
    }


    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * currentSpd + pushX;
    const vy = Math.sin(angle) * currentSpd + pushY;
    return { vx, vy };
}

export function updatePentagonBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean, onEvent?: (event: string, data?: any) => void) {
    e.isLevel3 = isLevel3;
    e.isLevel4 = isLevel4;
    if (isLevel4) e.bossTier = 4;
    else if (isLevel3) e.bossTier = 3;
    else if (isLevel2) e.bossTier = 2;
    else e.bossTier = 1;

    if (isLevel2) {

        if (isLevel4) {
            if (e.phalanxState === undefined) e.phalanxState = 0;
            if (e.phalanxTimer === undefined) e.phalanxTimer = 0;
            e.phalanxTimer++;

            const PHALANX_CD = 720;
            const FORMATION_DUR = 180;
            const CHARGE_DUR = 93;
            const RUSH_SPD = 15;

            if (e.phalanxState === 0) {
                if (e.phalanxTimer! > PHALANX_CD) {
                    e.phalanxState = 1; e.phalanxTimer = 0;

                    e.phalanxDrones = [];
                    const dxP = state.player.x - e.x;
                    const dyP = state.player.y - e.y;
                    const initialAngle = Math.atan2(dyP, dxP);
                    const perp = initialAngle + Math.PI / 2;
                    for (let i = 0; i < 8; i++) {
                        const offset = (i - 3.5) * 80;
                        const sx = e.x + Math.cos(perp) * offset;
                        const sy = e.y + Math.sin(perp) * offset;
                        const droneId = Math.random();
                        const drone: Enemy = {
                            id: droneId,
                            shape: 'long_drone',
                            type: 'minion',
                            x: sx, y: sy,
                            hp: Math.max(state.player.curHp * 10, 1000), maxHp: Math.max(state.player.curHp * 10, 1000),
                            size: 25,
                            spd: 0,
                            isPhalanxDrone: true,
                            soulLinkHostId: e.id,
                            phalanxDroneAngle: i,
                            palette: ['#000000', '#334155', '#eab308'],
                            knockback: { x: 0, y: 0 },
                            dead: false,
                            spawnedAt: state.gameTime,
                            lastAttack: state.gameTime,
                            pulsePhase: 0,
                            fluxState: 0,
                            rotationPhase: initialAngle,
                            boss: false,
                            bossType: 0,
                            bossAttackPattern: 0,
                            shellStage: 0,
                            isLevel3: false,
                            isLevel4: false
                        };
                        state.enemies.push(drone);
                        e.phalanxDrones.push(droneId.toString());
                    }
                    playSfx('warning');
                }
            } else if (e.phalanxState === 1) {

                if (e.phalanxTimer! > FORMATION_DUR) {
                    e.phalanxState = 2; e.phalanxTimer = 0;


                    const targetDx = state.player.x - e.x;
                    const targetDy = state.player.y - e.y;
                    e.phalanxAngle = Math.atan2(targetDy, targetDx);

                    playSfx('lock-on');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 2) {

                if (e.phalanxTimer! > 90) {
                    e.phalanxState = 3; e.phalanxTimer = 0;
                    playSfx('dash');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 3) {

                if (e.phalanxTimer! > CHARGE_DUR) {
                    e.phalanxState = 0; e.phalanxTimer = 0;

                    state.enemies.forEach(d => {
                        if (d.isPhalanxDrone && d.soulLinkHostId === e.id) {
                            d.dead = true;
                            spawnParticles(state, d.x, d.y, '#eab308', 15);
                            const dist = Math.hypot(state.player.x - d.x, state.player.y - d.y);
                            if (dist < 100) {
                                const maxHp = calcStat(state.player.hp);
                                const oneShotDmg = maxHp * 1.5;
                                applyDamageToPlayer(state, state.player, oneShotDmg, {
                                    sourceType: 'collision',
                                    deathCause: `Pentagon Boss Level ${e.bossTier} Phalanx Drone Charge`,
                                    floatingNumberColor: '#ef4444'
                                });
                                playSfx('impact');
                            }
                        }
                    });
                }
                return { vx: 0, vy: 0 };
            }
        }




        if (isLevel3) {
            const pDist = Math.hypot(state.player.x - e.x, state.player.y - e.y);


            if (!e.parasiteLinkActive) {
                if (pDist < 500) {
                    e.parasiteLinkActive = true;
                    playSfx('warning');
                }
            } else {

                if (pDist > 800) {
                    e.parasiteLinkActive = false;
                } else {
                    if (state.frameCount % 60 === 0) {
                        const maxHP = calcStat(state.player.hp);
                        const realDrain = maxHP * 0.03;

                        applyDamageToPlayer(state, state.player, realDrain, {
                            sourceType: 'other',
                            deathCause: `Pentagon Boss Level ${e.bossTier} Parasitic Soul Link`,
                            killerHp: e.hp,
                            killerMaxHp: e.maxHp,
                            floatingNumberColor: '#ef4444'
                        });

                        if (e.hp < e.maxHp) {
                            e.hp = Math.min(e.maxHp, e.hp + realDrain);
                            spawnFloatingNumber(state, e.x, e.y, `+${Math.round(realDrain)}`, '#4ade80', false);
                        }
                        spawnParticles(state, state.player.x, state.player.y, e.palette[0], 5);
                    }
                }
            }
        }

        if (isLevel2 && !isLevel4) {
            if (e.phalanxTimer === undefined) e.phalanxTimer = 0;
            e.phalanxTimer++;

            const interval = isLevel3 ? 300 : 450;
            if (e.phalanxTimer > interval) {
                e.phalanxTimer = 0;
                const angleToPlayer = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                const count = isLevel3 ? 5 : 3;

                for (let i = 0; i < count; i++) {
                    const spread = (i - (count - 1) / 2) * 0.25;
                    const rAngle = angleToPlayer + spread;
                    const rocket: Enemy = {
                        id: Math.random(),
                        shape: 'long_drone',
                        type: 'minion',
                        x: e.x, y: e.y,
                        hp: 300, maxHp: 300,
                        size: 20,
                        spd: 12,
                        isPhalanxDrone: true,
                        soulLinkHostId: e.id,
                        palette: e.palette,
                        knockback: { x: 0, y: 0 },
                        dead: false,
                        spawnedAt: state.gameTime,
                        rotationPhase: rAngle,
                        boss: false, bossType: 0, bossAttackPattern: 0, shellStage: 0, isLevel3: false, isLevel4: false
                    } as any;
                    state.enemies.push(rocket);
                }
                playSfx('dash');
            }
        }

        e.soulLinkTargets = [];
        state.enemies.forEach(other => {
            if (other.id !== e.id && !other.dead) {


                if (other.boss || other.isZombie || other.shape === 'snitch' || other.shape === 'minion') {

                    if (other.soulLinkHostId === e.id) other.soulLinkHostId = undefined;
                    return;
                }

                const d = Math.hypot(other.x - e.x, other.y - e.y);

                const isMyDrone = other.isPhalanxDrone && other.soulLinkHostId === e.id;

                if (d < 500 || isMyDrone) {
                    e.soulLinkTargets!.push(other.id);
                    other.soulLinkHostId = e.id;
                } else {
                    if (other.soulLinkHostId === e.id) other.soulLinkHostId = undefined;
                }
            }
        });
    }

    const pMod = isLevel2 ? 0.8 : 1.0;
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * (currentSpd * pMod) + pushX;
    const vy = Math.sin(angle) * (currentSpd * pMod) + pushY;
    return { vx, vy };
}
