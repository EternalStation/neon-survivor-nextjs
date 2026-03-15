import type { Enemy, GameState } from '../../core/Types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { calcStat } from '../../utils/MathUtils';
import { applyDamageToPlayer } from '../../utils/CombatUtils';
import { checkBossStageTransition } from './BossStageUtils';

export function updatePentagonBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean, _onEvent?: (event: string, data?: any) => void) {
    checkBossStageTransition(e, state);
    const stage = e.stage || 1;
    e.isLevel3 = isLevel3;
    e.isLevel4 = isLevel4;
    e.bossTier = isLevel4 ? 4 : isLevel3 ? 3 : isLevel2 ? 2 : 1;

    if (isLevel2) {
        if (isLevel4) {
            if (e.phalanxState === undefined) e.phalanxState = 0;
            if (e.phalanxTimer === undefined) e.phalanxTimer = 0;
            e.phalanxTimer++;

            if (e.phalanxState === 0) {
                if (e.phalanxTimer > 720) {
                    e.phalanxState = 1;
                    e.phalanxTimer = 0;
                    e.phalanxDrones = [];
                    const initialAngle = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                    const perp = initialAngle + Math.PI / 2;
                    for (let i = 0; i < 8; i++) {
                        const offset = (i - 3.5) * 80;
                        const droneId = Math.random();
                        state.enemies.push({
                            id: droneId,
                            shape: 'long_drone',
                            type: 'minion',
                            x: e.x + Math.cos(perp) * offset,
                            y: e.y + Math.sin(perp) * offset,
                            hp: Math.max(state.player.curHp * 10, 1000),
                            maxHp: Math.max(state.player.curHp * 10, 1000),
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
                        } as Enemy);
                        e.phalanxDrones.push(droneId.toString());
                    }
                    playSfx('warning');
                }
            } else if (e.phalanxState === 1) {
                if (e.phalanxTimer > 180) {
                    e.phalanxState = 2;
                    e.phalanxTimer = 0;
                    e.phalanxAngle = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                    playSfx('lock-on');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 2) {
                if (e.phalanxTimer > 90) {
                    e.phalanxState = 3;
                    e.phalanxTimer = 0;
                    playSfx('dash');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 3) {
                if (e.phalanxTimer > 93) {
                    e.phalanxState = 0;
                    e.phalanxTimer = 0;
                    state.enemies.forEach(d => {
                        if (d.isPhalanxDrone && d.soulLinkHostId === e.id) {
                            d.dead = true;
                            spawnParticles(state, d.x, d.y, '#eab308', 15);
                            if (Math.hypot(state.player.x - d.x, state.player.y - d.y) < 100) {
                                applyDamageToPlayer(state, state.player, calcStat(state.player.hp) * 1.5, {
                                    sourceType: 'collision',
                                    incomingDamageSource: 'Pentagon Boss',
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
            } else if (pDist > 800) {
                e.parasiteLinkActive = false;
            } else if (state.frameCount % 60 === 0) {
                const realDrain = calcStat(state.player.hp) * 0.03;
                applyDamageToPlayer(state, state.player, realDrain, {
                    sourceType: 'other',
                    incomingDamageSource: 'Pentagon Boss',
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

        if (!isLevel4) {
            if (!e.rocketTimer) e.rocketTimer = 0;
            e.rocketTimer++;
            const fireInterval = 45 - (stage - 1) * 10;
            if (e.rocketTimer > fireInterval) {
                e.rocketTimer = 0;
                const angleToPlayer = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                const count = isLevel3 ? 5 : 3;
                for (let i = 0; i < count; i++) {
                    const spread = (i - (count - 1) / 2) * 0.25;
                    state.enemies.push({
                        id: Math.random(),
                        shape: 'long_drone',
                        type: 'minion',
                        x: e.x,
                        y: e.y,
                        hp: 300,
                        maxHp: 300,
                        size: 20,
                        spd: 12,
                        isPhalanxDrone: true,
                        soulLinkHostId: e.id,
                        palette: e.palette,
                        knockback: { x: 0, y: 0 },
                        dead: false,
                        spawnedAt: state.gameTime,
                        rotationPhase: angleToPlayer + spread,
                        boss: false,
                        bossType: 0,
                        bossAttackPattern: 0,
                        shellStage: 0,
                        isLevel3: false,
                        isLevel4: false
                    } as Enemy);
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
                } else if (other.soulLinkHostId === e.id) {
                    other.soulLinkHostId = undefined;
                }
            }
        });
    }

    const pMod = isLevel2 ? 0.8 : 1.0;
    const angle = Math.atan2(dy, dx);
    const targetVx = Math.cos(angle) * (currentSpd * pMod) + pushX;
    const targetVy = Math.sin(angle) * (currentSpd * pMod) + pushY;
    const smoothing = 0.12;
    return {
        vx: (e.vx || 0) * (1 - smoothing) + targetVx * smoothing,
        vy: (e.vy || 0) * (1 - smoothing) + targetVy * smoothing
    };
}
