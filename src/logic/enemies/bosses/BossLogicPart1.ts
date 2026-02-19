import type { Enemy, GameState } from '../../core/types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

export function updateAbominationBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel4: boolean) {
    if (!e.stage) e.stage = 1;

    // --- STAGE TRANSITIONS ---
    const hpPct = e.hp / e.maxHp;

    // Stage 2: 60% HP - Growing Burn Radius
    if (e.stage === 1 && hpPct < 0.6) {
        e.stage = 2;
        e.stage2StartTime = state.gameTime; // Track when Stage 2 started for radius growth
        spawnFloatingNumber(state, e.x, e.y, "STAGE 2: EXPANDING INFERNO", '#ef4444', true);
        playSfx('rare-spawn');
    }

    // Stage 3: 30% HP - Ramping Burn Damage
    if (e.stage === 2 && hpPct < 0.3) {
        e.stage = 3;
        spawnFloatingNumber(state, e.x, e.y, "STAGE 3: ETERNAL FLAME", '#b91c1c', true);
        playSfx('rare-spawn');
        // Add particles
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * 6.28;
            spawnParticles(state, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50, '#ef4444', 3);
        }
    }

    // --- STAGE 2 LOGIC (Growing Burn Radius) ---
    if (e.stage === 2) {
        // Grow burn radius by 10px per second in Stage 2
        if (e.stage2StartTime) {
            const stage2Duration = state.gameTime - e.stage2StartTime;
            e.bonusBurnRadius = Math.floor(stage2Duration * 10); // 10px per second
        }
    }

    // --- STAGE 3 LOGIC (Regen + Ramping Burn Damage) ---
    if (e.stage === 3) {
        // Keep Stage 2 radius growth
        if (e.stage2StartTime) {
            const stage2Duration = state.gameTime - e.stage2StartTime;
            e.bonusBurnRadius = Math.floor(stage2Duration * 10); // 10px per second from Stage 2
        }

        if (state.frameCount % 60 === 0) {
            // Regen 3% HP per second
            const heal = e.maxHp * 0.03;
            if (e.hp < e.maxHp) {
                e.hp = Math.min(e.maxHp, e.hp + heal);
                spawnFloatingNumber(state, e.x, e.y - 40, `+${Math.round(heal)}`, '#22c55e', false);
            }
            // Ramp Burn Damage (1% per sec)
            e.bonusBurnPct = (e.bonusBurnPct || 0) + 0.01;
            // Visual feedback for ramp
            spawnFloatingNumber(state, e.x, e.y + 40, "B U R N ++", '#ef4444', false);
        }
    }

    // --- MOVEMENT ---
    const effectiveSpd = currentSpd * 1.3;
    const angle = Math.atan2(dy, dx);
    const wobble = Math.sin(state.gameTime * 5) * 0.2;
    const vx = Math.cos(angle + wobble) * effectiveSpd + pushX;
    const vy = Math.sin(angle + wobble) * effectiveSpd + pushY;
    e.rotationPhase = angle + Math.PI / 2;

    return { vx, vy };
}

export function updateSquareBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    let effectiveSpd = currentSpd;
    if (isLevel2) {
        e.thorns = 0.03; // 3% Dmg Return
        effectiveSpd = currentSpd * 0.85; // Slower
    }

    if (isLevel4) {
        e.thorns = 0.05; // 5% Dmg Return
        e.thornsIgnoresArmor = true;
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
            import('../EnemySpawnLogic').then(({ spawnShield }) => {
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
                    import('../EnemySpawnLogic').then(({ spawnShield }) => {
                        const angle = (i * Math.PI * 2) / 3;
                        const sx = e.x + Math.cos(angle) * 150;
                        const sy = e.y + Math.sin(angle) * 150;
                        // spawnShield is async imported, so we can't rely on it being instant for frame 1, 
                        // but the logic will catch up. We should update spawnShield signature first.
                        // Assuming we updated spawnShield to take phase:
                        // spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle); 
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
    const vx = Math.cos(angle) * effectiveSpd + pushX;
    const vy = Math.sin(angle) * effectiveSpd + pushY;
    return { vx, vy };
}

export function updateCircleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    const distToPlayer = Math.hypot(dx, dy);

    // LVL 4: Soul Devourer (Black Pallet Transformation)
    if (isLevel4) {
        // First Activation (1 charge)
        if (!e.soulSuckUsed && distToPlayer < 700) {
            e.soulSuckUsed = true;
            e.soulSuckActive = true;
            e.soulSuckTimer = 300; // 5 seconds (5 * 60 frames)
            playSfx('warning'); // Sound cue for transformation
        }

        if (e.soulSuckActive) {
            const totalTime = 300;
            e.soulSuckTimer = (e.soulSuckTimer || 0) - 1;
            const progress = Math.min(1.0, (totalTime - e.soulSuckTimer) / totalTime);

            if (e.soulSuckTimer <= 0) {
                e.soulSuckActive = false;
            }
            // Immune during active stage (bullets will fly through thanks to other logic)
            e.takenDamageMultiplier = 0;
            // Visual for "Soul Sucking" - handled in Renderer and some particles here
            if (state.frameCount % 3 === 0) {
                const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                const spd = 15;
                const px = state.player.x + (Math.random() - 0.5) * 40;
                const py = state.player.y + (Math.random() - 0.5) * 40;
                spawnParticles(state, px, py, '#eab308', 4, spd, angleToBoss, 'void');
            }
            // Gradually drain souls from 1.0 to 0.5
            state.player.soulDrainMult = 1.0 - (0.5 * progress);

            // Core Growth: very small (5px) to medium (30px)
            e.soulSuckCoreSize = 5 + (25 * progress);

            return { vx: 0, vy: 0 }; // STOP AND SUCK
        } else if (e.soulSuckUsed) {
            // Once activated, soul drain persists until death
            state.player.soulDrainMult = 0.5;
            e.takenDamageMultiplier = 1.0; // Back to normal vulnerability after 5s
        }
    }
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
            const vx = Math.cos(angle) * currentSpd + pushX;
            const vy = Math.sin(angle) * currentSpd + pushY;
            return { vx, vy };
        }
        else if (e.dashState === 1) {
            // Lock-On Phase (0.5s = 30 frames)
            const vx = 0; const vy = 0; // Stop
            if (e.dashTimer > 30) {
                e.dashState = 2; // Dash!
                e.dashTimer = 0;
                // Calculate Dash Vector
                const dashAngle = Math.atan2((e.dashLockY || 0) - e.y, (e.dashLockX || 0) - e.x);
                e.dashAngle = dashAngle;
            }
            return { vx, vy };
        }
        else if (e.dashState === 2) {
            // Dashing (0.5s duration?)
            const vx = Math.cos(e.dashAngle || 0) * (currentSpd * 5);
            const vy = Math.sin(e.dashAngle || 0) * (currentSpd * 5);
            if (e.dashTimer > 30) {
                e.dashState = 0; // Reset
                e.dashTimer = 0;
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
