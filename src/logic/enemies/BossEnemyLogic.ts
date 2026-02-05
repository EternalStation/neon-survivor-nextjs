import type { Enemy, GameState } from '../types';
import { spawnParticles, spawnFloatingNumber } from '../ParticleLogic';
import { playSfx } from '../AudioLogic';
import { calcStat, getDefenseReduction } from '../MathUtils';

export function updateBossEnemy(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, onEvent?: (event: string, data?: any) => void) {
    const distToPlayer = Math.hypot(dx, dy);
    let vx = 0, vy = 0;

    // Level 3 Boss Logic (20 Minutes+)
    const isLevel3 = e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1);
    const isLevel2 = e.bossTier === 2 || (state.gameTime > 600 && e.bossTier !== 1) || isLevel3; // Lvl 3 includes Lvl 2 mechanics usually, unless overridden

    // --- SQUARE BOSS (THE FORTRESS) ---
    if (e.shape === 'square') {
        let effectiveSpd = currentSpd;
        if (isLevel2) {
            e.thorns = 0.03; // 3% Dmg Return
            effectiveSpd = currentSpd * 0.85; // Slower
        }

        // LVL 3: Orbital Plating (Shields)
        if (isLevel3) {
            // Check for existing shields (using parentId connection)
            const activeShields = state.enemies.filter(s => s.parentId === e.id && !s.dead);
            e.orbitalShields = activeShields.length;

            // Initialize shields on first spawn
            if (!e.shieldsInitialized) {
                e.shieldsInitialized = true;
                // Spawn 3 initial shields
                import('../enemies/EnemySpawnLogic').then(({ spawnShield }) => {
                    for (let i = 0; i < 3; i++) {
                        const angle = (i * Math.PI * 2) / 3;
                        const sx = e.x + Math.cos(angle) * 150;
                        const sy = e.y + Math.sin(angle) * 150;
                        spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle);
                    }
                });
            }

            if (e.orbitalShields > 0) {
                // Invincible while shields exist
                e.takenDamageMultiplier = 0;
                // Visual feedback for invincibility handled in Renderer ideally, or particles here
                if (state.frameCount % 20 === 0) {
                    spawnParticles(state, e.x, e.y, '#94a3b8', 2); // Grey armor sparks
                }
            } else {
                e.takenDamageMultiplier = 1.0;

                // Regen Logic (15s)
                e.shieldRegenTimer = (e.shieldRegenTimer || 0) + 1;
                if (e.shieldRegenTimer > 900) { // 15s * 60
                    // Spawn 3 Shields
                    for (let i = 0; i < 3; i++) {
                        // We need to spawn them. Since we can't easily import 'spawnShield' due to circular deps potential,
                        // we'll emit an event or push to a queue? 
                        // Actually, let's just create them here manually since it's simple data or use the onEvent callback if we had one for spawning.
                        // Better: Just construct the object here.
                        import('../enemies/EnemySpawnLogic').then(({ spawnShield }) => {
                            const angle = (i * Math.PI * 2) / 3;
                            const sx = e.x + Math.cos(angle) * 150;
                            const sy = e.y + Math.sin(angle) * 150;
                            // spawnShield is async imported, so we can't rely on it being instant for frame 1, 
                            // but the logic will catch up. We should update spawnShield signature first.
                            // Assuming we updated spawnShield to take phase:
                            // spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle); 
                            // Wait, I need to update spawnShield signature in EnemySpawnLogic.ts first.
                            // I will do that in the next step. For now, I'll leave this as is but I will invoke the tool for spawnShield update first next.
                            spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle); // Passing angle as phase
                        });
                    }
                    e.shieldRegenTimer = 0;
                    playSfx('recycle'); // Sound for regen
                }
            }
        }

        // Standard Chase
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * effectiveSpd + pushX;
        vy = Math.sin(angle) * effectiveSpd + pushY;
        return { vx, vy };
    }

    // --- CIRCLE BOSS (THE WARLORD) ---
    if (e.shape === 'circle') {
        // LVL 3: Cyclone Pull
        if (isLevel3) {
            if (!e.cycloneTimer) e.cycloneTimer = 0;
            e.cycloneTimer++;

            // 10sec CD (600 frames), 2sec Duration (120 frames)
            // Cycle: 0-600 Idle, 600-720 Active

            if (e.cycloneState === 1) {
                // Active Spinning
                if (e.cycloneTimer > 120) {
                    e.cycloneState = 0;
                    e.cycloneTimer = 0;
                } else {
                    // Pull Player
                    const pullStrength = 0.86; // Increased by ~15% (was 0.75)
                    const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                    // Add velocity to player, or modify position directly? Velocity is safer.
                    // But PlayerLogic overrides velocity every frame. We might need to affect player.knockback?
                    // Or just position + check map bounds.
                    state.player.knockback.x += Math.cos(angleToBoss) * pullStrength; // Add "Reverse Knockback"
                    state.player.knockback.y += Math.sin(angleToBoss) * pullStrength;



                    // Visual Spin
                    e.rotationPhase = (e.rotationPhase || 0) + 0.5; // Fast spin
                    if (state.frameCount % 5 === 0) {
                        spawnParticles(state, e.x, e.y, '#d1d5db', 3); // Wind particles
                    }

                    // Stationary while pulling
                    return { vx: 0, vy: 0 };
                }
            } else {
                // Cooldown
                if (e.cycloneTimer > 600) {
                    // Only trigger pull if:
                    // 1. Player is FAR away (>400px)
                    // 2. NOT Dashing (dashState === 0 or undefined)
                    // 3. 1.5s (90 frames) passed since dash ended (dashTimer > 90)
                    const pDist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                    const isDashReady = !e.dashState || (e.dashState === 0 && (e.dashTimer || 0) > 90);

                    if (pDist > 400 && isDashReady) {
                        e.cycloneState = 1;
                        e.cycloneTimer = 0;
                        playSfx('warning'); // Sound cue
                    } else {
                        // Keep timer capped so it fires soon as conditions are met
                        e.cycloneTimer = 600;
                    }
                }
            }
        }

        if (isLevel2) {
            if (!e.dashTimer) e.dashTimer = 0;
            e.dashTimer++;
            const CD = 390; // 6.5s

            // 0-CD: Cooldown/Stalk
            if (e.dashState !== 1 && e.dashState !== 2) {
                // Stalk Logic
                // Condition for Dashing:
                // 1. Player Close (<700px)
                // 2. Dash Cooldown Ready (dashTimer > CD)
                // 3. (Lvl 3) NOT Pulling (cycloneState !== 1)
                // 4. (Lvl 3) Cyclone Cooldown hasn't JUST finished (e.cycloneTimer < 120 means it was just pulling?) 
                //    Wait, cycloneTimer counts UP. If it was active, it resets to 0. 
                //    So if it JUST finished pulling, timer is low (0 -> upward).
                //    We want: If it just finished pulling, wait 2s (120 frames).
                //    So: e.cycloneTimer > 120 (If it was 0 at end of pull)

                const isCycloneSafe = !isLevel3 || (e.cycloneState !== 1 && (e.cycloneTimer || 0) > 120);

                if (distToPlayer < 700 && e.dashTimer > CD && isCycloneSafe) {
                    e.dashState = 1; // Enter Lock-on
                    e.dashTimer = 0;
                    e.dashLockX = state.player.x;
                    e.dashLockY = state.player.y;
                }
                // Standard Chase
                const angle = Math.atan2(dy, dx);
                vx = Math.cos(angle) * currentSpd + pushX;
                vy = Math.sin(angle) * currentSpd + pushY;
            }
            else if (e.dashState === 1) {
                // Lock-On Phase (0.5s = 30 frames)
                vx = 0; vy = 0; // Stop
                if (e.dashTimer > 30) {
                    e.dashState = 2; // Dash!
                    e.dashTimer = 0;
                    // Calculate Dash Vector
                    const dashAngle = Math.atan2((e.dashLockY || 0) - e.y, (e.dashLockX || 0) - e.x);
                    e.dashAngle = dashAngle;
                }
            }
            else if (e.dashState === 2) {
                // Dashing (0.5s duration?)
                vx = Math.cos(e.dashAngle || 0) * (currentSpd * 5);
                vy = Math.sin(e.dashAngle || 0) * (currentSpd * 5);
                if (e.dashTimer > 30) {
                    e.dashState = 0; // Reset
                    e.dashTimer = 0;
                }
            }
            return { vx, vy };
        }

        // Fallback Lvl 1
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * currentSpd + pushX;
        vy = Math.sin(angle) * currentSpd + pushY;
        return { vx, vy };
    }

    // --- TRIANGLE BOSS (THE REAPER) ---
    if (e.shape === 'triangle') {
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

        vx = Math.cos(angle + wobble) * finalSpd + pushX;
        vy = Math.sin(angle + wobble) * finalSpd + pushY;
        return { vx, vy };
    }

    // --- DIAMOND BOSS (THE MARKSMAN) ---
    if (e.shape === 'diamond') {

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
                    const eraIndex = Math.floor(minutes / 15) % 4; // 0-3 for 4 eras
                    const eraColors = [
                        '#4ade80', // 0-15: Green
                        '#3b82f6', // 15-30: Blue  
                        '#a855f7', // 30-45: Purple
                        '#f97316'  // 45-60: Orange
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
                    const eraIndex = Math.floor(minutes / 15) % 4;
                    const eraColors = [
                        '#4ade80', // 0-15: Green
                        '#3b82f6', // 15-30: Blue
                        '#a855f7', // 30-45: Purple
                        '#f97316'  // 45-60: Orange
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
                            spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(dmg).toString(), '#ef4444', true);
                            spawnParticles(state, state.player.x, state.player.y, '#FF0000', 10);
                            if (state.player.curHp <= 0) {
                                state.player.curHp = 0;
                                state.gameOver = true;
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
        // ... (Existing logic below)
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
                vx = Math.cos(angle) * distFactor * currentSpd + pushX;
                vy = Math.sin(angle) * distFactor * currentSpd + pushY;

                if (e.beamTimer > CD) {
                    e.beamState = 1; // Charge
                    e.beamTimer = 0;
                    e.beamX = state.player.x;
                    e.beamY = state.player.y;
                }
            } else if (e.beamState === 1) {
                // Charge (1s total = 60 frames)
                vx = 0; vy = 0;

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
            } else if (e.beamState === 2) {
                // Fire (Instant Burst + Linger Visual)
                vx = 0; vy = 0;

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
                    // User: LVL 1 is reduced by armor. LVL 2 PIERCES ALL ARMOR.
                    let finalDmg = rawDmg;
                    if (!isLevel2) {
                        const armor = calcStat(state.player.arm);
                        const reduction = getDefenseReduction(armor);
                        finalDmg = rawDmg * (1 - reduction);

                        // Track Stats
                        state.player.damageBlockedByArmor += (rawDmg - finalDmg);
                        state.player.damageBlocked += (rawDmg - finalDmg);
                    }

                    state.player.curHp -= finalDmg;
                    state.player.damageTaken += finalDmg;

                    spawnFloatingNumber(state, state.player.x, state.player.y, Math.round(finalDmg).toString(), e.palette[1], isLevel2); // LVL 2 gets Crit look (larger)
                    spawnParticles(state, state.player.x, state.player.y, e.palette[1], 10);

                    if (state.player.curHp <= 0) {
                        state.player.curHp = 0;
                        state.gameOver = true;
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
            }
            return { vx, vy };
        }

        // Fallback Lvl 1
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * currentSpd + pushX;
        vy = Math.sin(angle) * currentSpd + pushY;
        return { vx, vy };
    }

    // --- PENTAGON BOSS (THE OMEGA) ---
    if (e.shape === 'pentagon' && isLevel2) {

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

    // Default Fallback / Pentagon Movement
    if (e.shape === 'pentagon') {
        const pMod = isLevel2 ? 0.8 : 1.0; // Slower if Lvl 2
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * (currentSpd * pMod) + pushX;
        vy = Math.sin(angle) * (currentSpd * pMod) + pushY;
        return { vx, vy };
    }

    // Default Fallback
    const angle = Math.atan2(dy, dx);
    vx = Math.cos(angle) * currentSpd + pushX;
    vy = Math.sin(angle) * currentSpd + pushY;
    return { vx, vy };
}
