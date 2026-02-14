import type { Enemy, GameState } from '../../core/types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { calcStat, getDefenseReduction } from '../../utils/MathUtils';

export function updateTriangleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean) {
    let isBerserk = false;

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

export function updateDiamondBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, onEvent?: (event: string, data?: any) => void) {
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
            // Fire (Instant Burst + Linger Visual)
            const vx = 0; const vy = 0;

            const laserAngle = e.beamAngle || 0;
            const px = state.player.x - e.x;
            const py = state.player.y - e.y;
            const pDist = Math.hypot(px, py);
            const pAngle = Math.atan2(py, px);
            const angleDiff = Math.abs(pAngle - laserAngle);
            const normalizedDiff = Math.min(angleDiff, Math.abs(angleDiff - Math.PI * 2));

            // Laser Damage Logic (Once per burst)
            if (normalizedDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
                e.hasHitThisBurst = true;
                const rawDmg = e.maxHp * 0.05; // 5% of Boss Max HP

                // LASER REDUCTION LOGIC
                // User: LVL 1 & 2 is reduced by armor. LVL 3 PIERCES ALL ARMOR.
                let finalDmg = rawDmg;
                if (!isLevel3) {
                    const armor = calcStat(state.player.arm);
                    const reduction = getDefenseReduction(armor);
                    finalDmg = rawDmg * (1 - reduction);

                    // Track Stats
                    state.player.damageBlockedByArmor += (rawDmg - finalDmg);
                    state.player.damageBlocked += (rawDmg - finalDmg);
                }

                state.player.curHp -= finalDmg;
                state.player.damageTaken += finalDmg;
                state.player.lastHitDamage = finalDmg;
                state.player.killerHp = e.hp;
                state.player.killerMaxHp = e.maxHp;

                spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(finalDmg).toString(), e.palette[1], isLevel2); // LVL 2 gets Crit look (larger)
                spawnParticles(state, state.player.x, state.player.y, e.palette[1], 10);

                // Kinetic Battery: Trigger Zap on Beam Hit
                const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                if (triggerZap) triggerZap(state, state.player, 1);

                if (state.player.curHp <= 0) {
                    state.player.curHp = 0;
                    state.gameOver = true;
                    state.player.deathCause = "Killed by Diamond Boss: Kinetic Beam";
                    if (onEvent) onEvent('game_over');
                }
            }

            // Zombie Insta-Kill
            state.enemies.forEach(z => {
                if (z.isZombie && z.zombieState === 'active' && !z.dead) {
                    const zdx = z.x - e.x, zdy = z.y - e.y;
                    const zDist = Math.hypot(zdx, zdy);
                    const zAngle = Math.atan2(zdy, zdx);
                    const zAngleDiff = Math.abs(zAngle - laserAngle);
                    const zNormDiff = Math.min(zAngleDiff, Math.abs(zAngleDiff - Math.PI * 2));

                    if (zNormDiff < 0.1 && zDist < 3000) {
                        z.dead = true; z.hp = 0;
                        spawnParticles(state, z.x, z.y, '#4ade80', 10);
                    }
                }
            });

            if (e.beamTimer > 30) { // 0.5s Fire animation
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

export function updatePentagonBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, onEvent?: (event: string, data?: any) => void) {
    if (isLevel2) {
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
                // Restriction: Only Normal and Elite enemies (No Bosses, Zombies, Snitches, Minions)
                if (other.boss || other.isZombie || other.shape === 'snitch' || other.shape === 'minion') {
                    // Force unlink if previously linked
                    if (other.soulLinkHostId === e.id) other.soulLinkHostId = undefined;
                    return;
                }

                const d = Math.hypot(other.x - e.x, other.y - e.y);
                if (d < 500) {
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
