import type { Enemy, GameState } from '../../core/types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { calcStat, getDefenseReduction, distToSegment } from '../../utils/MathUtils';
import { PALETTES } from '../../core/constants';

export function updateTriangleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    let isBerserk = false;

    // LVL 4: Mortality Curse (Anti-Healing Aura)
    if (isLevel4) {
        state.player.healingDisabled = true;
        if (state.players) {
            Object.values(state.players).forEach(p => p.healingDisabled = true);
        }
        // Visual for "Reaper" aura
        if (state.frameCount % 10 === 0) {
            spawnParticles(state, e.x, e.y, '#7f1d1d', 5, 8, 30, 'void');
        }
    }

    if (isLevel2) {
        if (!e.berserkTimer) e.berserkTimer = 0;
        e.berserkTimer++;

        const CD = 300; // 5s Cooldown
        const DURATION = 180; // 3s Duration (Was 5s)

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

    // LVL 3: Projectile Deflection
    if (isLevel3) {
        // Deflect active whenever Berserk/Spinning
        e.deflectState = isBerserk;
    }

    const modifier = isBerserk ? 2.55 : 1.0;
    const finalSpd = currentSpd * modifier;
    const angle = Math.atan2(dy, dx);

    // Wobble while berserk
    const wobble = isBerserk ? Math.sin(state.gameTime * 20) * 0.5 : 0;
    e.rotationPhase = (e.rotationPhase || 0) + (isBerserk ? 0.3 : 0.05);

    const vx = Math.cos(angle + wobble) * finalSpd + pushX;
    const vy = Math.sin(angle + wobble) * finalSpd + pushY;
    return { vx, vy };
}

export function updateDiamondBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean, isLevel5: boolean, onEvent?: (event: string, data?: any) => void) {
    // LVL 5: Electric Crystal Fence
    if (isLevel5) {
        const distToPlayer = Math.hypot(dx, dy);

        // Determine Era Color
        const spawnedMinutes = (e.spawnedAt || state.gameTime) / 60;
        const eraIndex = Math.floor(spawnedMinutes / 15) % PALETTES.length;
        const crystalColor = PALETTES[eraIndex].colors[0];

        if (!e.crystalState || e.crystalState === 0) {
            const isCooldownDone = (e.timer || 0) >= 0;
            const isFirstCast = !e.crystalState;

            // Only require distance for the VERY FIRST cast. 
            // Subsequent casts (looping) trigger immediately when cooldown is done.
            if ((isFirstCast && distToPlayer < 1000) || (!isFirstCast && isCooldownDone)) {
                // Initial Spawn
                e.crystalState = 1; // Spawning (Wait 1s)
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
            if (e.timer > 60) { // 1 second
                e.crystalState = 2; // Active
                e.timer = 0;
                playSfx('laser'); // Activation sound
            }
            // Visual for crystals appearing
            if (e.crystalPositions) {
                e.crystalPositions.forEach(p => {
                    if (state.frameCount % 5 === 0) {
                        spawnParticles(state, p.x, p.y, crystalColor, 2, 5, Math.random() * 6.28, 'spark');
                    }
                });
            }
        } else if (e.crystalState === 2) {
            e.timer = (e.timer || 0) + 1;
            // Damage check (Electric Fence)
            if (state.frameCount % 5 === 0 && e.crystalPositions) {
                const fenceDmg = e.maxHp * 0.01; // 1% max HP per 5 frames (~12% per sec)
                const px = state.player.x;
                const py = state.player.y;
                const pSize = state.player.size;

                // Check distance to each of the 5 segments
                for (let i = 0; i < 5; i++) {
                    const p1 = e.crystalPositions[i];
                    const p2 = e.crystalPositions[(i + 1) * 1 % 5];

                    // Distance from point to line segment
                    const dist = distToSegment(px, py, p1.x, p1.y, p2.x, p2.y);
                    if (dist < pSize + 15) { // 15px fence thickness grace
                        state.player.curHp -= fenceDmg;
                        state.player.damageTaken += fenceDmg;
                        state.player.lastHitDamage = fenceDmg;
                        state.player.killerHp = e.hp;
                        state.player.killerMaxHp = e.maxHp;
                        spawnFloatingNumber(state, px, py, Math.round(fenceDmg).toString(), '#ef4444', false);
                        spawnParticles(state, px, py, crystalColor, 5); // Electric sparks
                    }
                }
            }

            if (e.timer > 600) { // 10 seconds
                e.crystalState = 0; // Reset (Cooldown)
                e.timer = -600; // 10 second cooldown before next use
                e.crystalPositions = undefined;
                playSfx('dash'); // End sound
            }
        } else if (e.crystalState === 0 && (e.timer || 0) < 0) {
            e.timer = (e.timer || 0) + 1; // Cooldown counting up
        }
    }

    // LVL 4: Convergence Zone (Handled in Beam Logic)
    // LVL 3: Orbital Satellites
    if (isLevel3) {
        if (!e.satelliteTimer) e.satelliteTimer = 0;
        e.satelliteTimer++;

        // 10s Cooldown (600f)
        if (!e.satelliteState) e.satelliteState = 0;

        if (e.satelliteState === 0) { // Idle
            if (e.satelliteTimer > 600) {
                e.satelliteState = 1; // Mark Zones
                e.satelliteTimer = 0;
                e.satelliteTargets = [];

                // Mark 3 zones around player (Triangle formation around player)
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
        } else if (e.satelliteState === 1) { // Warning Phase (1.5s = 90f)
            // Visual Indicators for Zones
            if (state.frameCount % 5 === 0 && e.satelliteTargets) {
                // Determine era color
                const minutes = (e.spawnedAt || state.gameTime) / 60;
                const eraIndex = Math.floor(minutes / 15) % 5; // 0-4 for 5 eras (Green, Blue, Purple, Orange, Red)
                const eraColors = [
                    '#4ade80', // 0-15: Green
                    '#3b82f6', // 15-30: Blue  
                    '#a855f7', // 30-45: Purple
                    '#f97316', // 45-60: Orange
                    '#ef4444'  // 60+: Red
                ];
                const warningColor = eraColors[eraIndex];

                e.satelliteTargets.forEach(t => {
                    spawnParticles(state, t.x, t.y, warningColor, 2); // Era-colored Warning Dust
                });
            }

            if (e.satelliteTimer > 90) {
                e.satelliteState = 2; // FIRE
                e.satelliteTimer = 0;
                playSfx('laser'); // Reuse laser sound
            }
        } else if (e.satelliteState === 2) { // Strike Phase (instant/short)
            if (e.satelliteTimer === 1 && e.satelliteTargets) {
                const dmg = e.maxHp * 0.03;

                // Determine era color for strike particles
                const minutes = (e.spawnedAt || state.gameTime) / 60;
                const eraIndex = Math.floor(minutes / 15) % 5;
                const eraColors = [
                    '#4ade80', // 0-15: Green
                    '#3b82f6', // 15-30: Blue
                    '#a855f7', // 30-45: Purple
                    '#f97316', // 45-60: Orange
                    '#ef4444'  // 60+: Red
                ];
                const strikeColor = eraColors[eraIndex];

                e.satelliteTargets.forEach(t => {
                    // Strike Visual with era color
                    // Make a vertical beam look (Line of particles)
                    for (let k = 0; k < 10; k++) {
                        spawnParticles(state, t.x, t.y - k * 20, strikeColor, 5);
                    }

                    // Damage Check
                    const d = Math.hypot(state.player.x - t.x, state.player.y - t.y);
                    if (d < 60) { // 60px radius hit
                        state.player.curHp -= dmg;
                        state.player.damageTaken += dmg;
                        state.player.lastHitDamage = dmg;
                        state.player.killerHp = e.hp;
                        state.player.killerMaxHp = e.maxHp;
                        spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(dmg).toString(), '#ef4444', true);
                        spawnParticles(state, state.player.x, state.player.y, '#FF0000', 10);

                        // Kinetic Battery: Trigger Zap on Satellite Strike
                        const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                        if (triggerZap) triggerZap(state, state.player, 1);
                        if (state.player.curHp <= 0) {
                            state.player.curHp = 0;
                            state.gameOver = true;
                            state.player.deathCause = "Vaporized by Diamond Boss: Orbital Satellites";
                            if (onEvent) onEvent('game_over');
                        }
                    }
                });
            }
            if (e.satelliteTimer > 20) {
                e.satelliteState = 0; // Reset
                e.satelliteTimer = 0;
                e.satelliteTargets = undefined;
            }
        }
    }

    // Lvl 2 Beam Logic (Unchanged but nested properly)
    if (isLevel2) {
        if (!e.beamTimer) e.beamTimer = 0;
        e.beamTimer++;
        if (!e.beamState) e.beamState = 0;

        const CD = 300; // 5s

        if (e.beamState === 0) {
            // Kiting / Cooldown Phase
            if (!e.distGoal) e.distGoal = 600 + Math.random() * 200;
            const dist = Math.hypot(dx, dy);
            const distFactor = (dist - e.distGoal) / 100;

            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * distFactor * currentSpd + pushX;
            const vy = Math.sin(angle) * distFactor * currentSpd + pushY;

            if (e.beamTimer > CD) {
                e.beamState = 1; // Charge
                e.beamTimer = 0;
                e.beamX = state.player.x;
                e.beamY = state.player.y;
            }
            return { vx, vy };

        } else if (e.beamState === 1) {
            // Charge (1s total = 60 frames)
            const vx = 0; const vy = 0;

            if (e.beamTimer <= 30) {
                // Phase 1: Tracking (0.5s)
                e.beamX = state.player.x;
                e.beamY = state.player.y;
                e.beamAngle = Math.atan2(e.beamY - e.y, e.beamX - e.x);
            } else {
                // Phase 2: Locked (0.5s) - DO NOT update beamX/Y/Angle
                // This is the player's window to dodge!
            }

            if (e.beamTimer > 60) {
                e.beamState = 2; // Fire
                e.beamTimer = 0;
                e.hasHitThisBurst = false;
                playSfx('laser');
            }
            return { vx, vy };

        } else if (e.beamState === 2) {
            // Fire (Instant Burst or Sustained Convergence)
            const vx = 0; const vy = 0;
            const centerAngle = e.beamAngle || 0;
            const px = state.player.x - e.x;
            const py = state.player.y - e.y;
            const pDist = Math.hypot(px, py);
            const pAngle = Math.atan2(py, px);

            const duration = isLevel4 ? 240 : 30; // 4s for Lvl 4, 0.5s for Lvl 2/3

            if (isLevel4) {
                // Convergence Logic
                const t = Math.min(1, e.beamTimer / duration);
                const startOff = (45 * Math.PI) / 180;
                const endOff = (4.5 * Math.PI) / 180; // 9 deg gap total
                const currentOffset = startOff - (startOff - endOff) * t;

                const laser1 = centerAngle + currentOffset;
                const laser2 = centerAngle - currentOffset;

                // Check collisions for both lasers
                [laser1, laser2].forEach(angle => {
                    const diff = Math.abs(pAngle - angle);
                    const normDiff = Math.min(diff, Math.abs(diff - Math.PI * 2));

                    if (normDiff < 0.05 && pDist < 3000) {
                        // Periodic damage if inside the laser
                        if (state.frameCount % 5 === 0) {
                            const finalDmg = e.maxHp * 0.005; // 0.5% max HP per 5 frames (~6% per sec)

                            state.player.curHp -= finalDmg;
                            state.player.damageTaken += finalDmg;
                            state.player.lastHitDamage = finalDmg;
                            state.player.killerHp = e.hp;
                            state.player.killerMaxHp = e.maxHp;
                            spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(finalDmg).toString(), '#ef4444', false);
                        }
                    }
                });
            } else {
                // Standard Lvl 2/3 Burst
                const laserAngle = centerAngle;
                const angleDiff = Math.abs(pAngle - laserAngle);
                const normalizedDiff = Math.min(angleDiff, Math.abs(angleDiff - Math.PI * 2));

                if (normalizedDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
                    e.hasHitThisBurst = true;
                    const finalDmg = e.maxHp * 0.05; // 5% of Boss Max HP (True Damage from Lvl 2+)
                    state.player.curHp -= finalDmg;
                    state.player.damageTaken += finalDmg;
                    state.player.lastHitDamage = finalDmg;
                    state.player.killerHp = e.hp;
                    state.player.killerMaxHp = e.maxHp;
                    spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(finalDmg).toString(), e.palette[1], isLevel2);
                }
            }

            // Zombie Insta-Kill
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

    // Fallback Lvl 1
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
        // LVL 4: Hivemind Phalanx (Tactical Sweep)
        if (isLevel4) {
            if (e.phalanxState === undefined) e.phalanxState = 0;
            if (e.phalanxTimer === undefined) e.phalanxTimer = 0;
            e.phalanxTimer++;

            const PHALANX_CD = 720; // 12s
            const FORMATION_DUR = 180; // 3.0s
            const CHARGE_DUR = 93; // 1400px @ 15spd
            const RUSH_SPD = 15;

            if (e.phalanxState === 0) {
                if (e.phalanxTimer! > PHALANX_CD) {
                    e.phalanxState = 1; e.phalanxTimer = 0;
                    // Initial drone spawn
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
                // Phase 1: Tracking/Looking (3s)
                if (e.phalanxTimer! > FORMATION_DUR) {
                    e.phalanxState = 2; e.phalanxTimer = 0;

                    // LOCK DIRECTION NOW (Start of 1.5s wait)
                    const targetDx = state.player.x - e.x;
                    const targetDy = state.player.y - e.y;
                    e.phalanxAngle = Math.atan2(targetDy, targetDx);

                    playSfx('lock-on');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 2) {
                // Phase 2: Locked (1.5s) - Waiting to fly
                if (e.phalanxTimer! > 90) { // 1.5s
                    e.phalanxState = 3; e.phalanxTimer = 0;
                    playSfx('dash');
                }
                return { vx: 0, vy: 0 };
            } else if (e.phalanxState === 3) {
                // Phase 3: Rush/Sweep
                if (e.phalanxTimer! > CHARGE_DUR) {
                    e.phalanxState = 0; e.phalanxTimer = 0;
                    // Cleanup drones
                    state.enemies.forEach(d => {
                        if (d.isPhalanxDrone && d.soulLinkHostId === e.id) {
                            d.dead = true;
                            spawnParticles(state, d.x, d.y, '#eab308', 15);
                            const dist = Math.hypot(state.player.x - d.x, state.player.y - d.y);
                            if (dist < 100) {
                                // One-shot damage (150% max hp)
                                const maxHp = calcStat(state.player.hp);
                                const oneShotDmg = maxHp * 1.5;
                                state.player.curHp -= oneShotDmg;
                                state.player.damageTaken += oneShotDmg;
                                spawnFloatingNumber(state, state.player.x, state.player.y, "CRIT", '#ef4444', true);
                                playSfx('impact');
                            }
                        }
                    });
                }
                return { vx: 0, vy: 0 };
            }
        }
        // LVL 4: Entropy Link (Draining more if already linked)
        // (Removed old L4 logic in favor of Phalanx)

        // LVL 3: Parasitic Link (Player)
        if (isLevel3) {
            const pDist = Math.hypot(state.player.x - e.x, state.player.y - e.y);

            // Check for Attach
            if (!e.parasiteLinkActive) {
                if (pDist < 500) {
                    e.parasiteLinkActive = true;
                    playSfx('warning');
                }
            } else {
                // Active Drain
                if (pDist > 800) {
                    e.parasiteLinkActive = false; // Break
                } else {
                    if (state.frameCount % 60 === 0) { // Once per second
                        // approximate max hp calc
                        const maxHP = calcStat(state.player.hp);
                        const realDrain = maxHP * 0.03;

                        state.player.curHp -= realDrain;
                        state.player.damageTaken += realDrain;
                        state.player.lastHitDamage = realDrain;
                        state.player.killerHp = e.hp;
                        state.player.killerMaxHp = e.maxHp;

                        // Heal Boss
                        if (e.hp < e.maxHp) {
                            e.hp = Math.min(e.maxHp, e.hp + realDrain);
                            spawnFloatingNumber(state, e.x, e.y, `+${Math.round(realDrain)}`, '#4ade80', false);
                        }

                        spawnFloatingNumber(state, state.player.x, state.player.y, `-${Math.round(realDrain)}`, '#ef4444', true); // Red drain text
                        spawnParticles(state, state.player.x, state.player.y, e.palette[0], 5);

                        if (state.player.curHp <= 0) {
                            state.player.curHp = 0;
                            state.gameOver = true;
                            state.player.deathCause = "Drained by Pentagon Boss: Parasitic Link";
                            if (onEvent) onEvent('game_over');
                        }
                    }
                }
            }
        }

        // Soul Link Aura Logic
        // Find enemies within 500
        e.soulLinkTargets = [];
        state.enemies.forEach(other => {
            if (other.id !== e.id && !other.dead) {
                // Restriction: Only Normal and Elite enemies (No Bosses, Zombies, Snitches, or Minions)
                // Phalanx Drones are NOW allowed for Level 4 link
                if (other.boss || other.isZombie || other.shape === 'snitch' || other.shape === 'minion') {
                    // Force unlink if previously linked
                    if (other.soulLinkHostId === e.id) other.soulLinkHostId = undefined;
                    return;
                }

                const d = Math.hypot(other.x - e.x, other.y - e.y);
                // Phalanx drones are always linked if they belong to this host
                const isMyDrone = other.isPhalanxDrone && other.soulLinkHostId === e.id;

                if (d < 500 || isMyDrone) {
                    e.soulLinkTargets!.push(other.id);
                    other.soulLinkHostId = e.id;
                } else {
                    if (other.soulLinkHostId === e.id) other.soulLinkHostId = undefined; // Unlink
                }
            }
        });
    }

    const pMod = isLevel2 ? 0.8 : 1.0; // Slower if Lvl 2
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * (currentSpd * pMod) + pushX;
    const vy = Math.sin(angle) * (currentSpd * pMod) + pushY;
    return { vx, vy };
}
