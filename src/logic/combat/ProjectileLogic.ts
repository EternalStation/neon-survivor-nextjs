import { isInMap, getHexDistToWall } from '../mission/MapLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import type { GameState, Enemy, Bullet } from '../core/types';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { getHexMultiplier, getHexLevel, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { getPlayerThemeColor } from '../utils/helpers';
import { getDefenseReduction } from '../utils/MathUtils';

export function updateProjectiles(state: GameState, onEvent?: (event: string, data?: any) => void) {
    const { bullets, enemyBullets, player } = state;
    const now = state.gameTime;

    // --- PLAYER BULLETS ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let bulletRemoved = false;
        // Collision with Enemies
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Collision with Map Boundary (Walls)
        if (!isInMap(b.x, b.y)) {
            // --- CLASS MODIFIER: Malware-Prime Glitch Bounce ---
            if (player.playerClass === 'malware') {
                b.bounceCount = (b.bounceCount || 0) + 1;

                // User Request: +20% Damage per bounce (Multiplicative) - Scaled with Resonance
                // b.bounceDmgMult is already (0.2 * resonance_factor)
                const dmgMult = 1 + (b.bounceDmgMult || 0.2);
                b.dmg *= dmgMult;

                // Color Shifting: Initial Purple -> First Hit Orange -> Subsequent Hits Red
                if (b.bounceCount === 1) {
                    b.color = '#fb923c'; // Vibrant Orange
                } else {
                    // Slowly shift green channel out to reach pure Red
                    const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                    const green = Math.floor(146 * (1 - redProgress));
                    b.color = `rgb(255, ${green}, 0)`;
                }

                // Accurate Hexagonal Reflection
                const { dist, normal } = getHexDistToWall(b.x, b.y);
                const dot = b.vx * normal.x + b.vy * normal.y;

                // Only bounce if moving OUTWARD (dot < 0 with inward normal)
                if (dot < 0) {
                    // Mirror Reflection + Speed Increase (Multiplicative)
                    // b.bounceSpeedBonus is e.g. 0.2 (scaled).
                    const speedMult = 1 + (b.bounceSpeedBonus || 0.2);
                    b.vx = (b.vx - 2 * dot * normal.x) * speedMult;
                    b.vy = (b.vy - 2 * dot * normal.y) * speedMult;

                    // Nudge back into bounds
                    b.x += normal.x * (Math.abs(dist) + 5);
                    b.y += normal.y * (Math.abs(dist) + 5);

                    spawnParticles(state, b.x, b.y, b.color, 12);
                }
                continue;
            }

            spawnParticles(state, b.x, b.y, b.color || '#22d3ee', 4);

            // --- AIGIS Optimization: Decrement Ring Count if orbiting bullet hits wall ---
            if (b.vortexState === 'orbiting' && b.orbitDist && state.player.aigisRings?.[b.orbitDist]) {
                const ringData = state.player.aigisRings[b.orbitDist];
                if (ringData.count > 0) {
                    ringData.count--;
                    ringData.totalDmg -= b.dmg;
                }
            }

            bullets.splice(i, 1);
            continue;
        }

        // --- Malware Trail Management ---
        if (player.playerClass === 'malware' && (b.bounceCount || 0) > 0) {
            if (!b.trails) b.trails = [];
            b.trails.unshift({ x: b.x, y: b.y });
            // Minimum trail starts after first bounce (bounceCount = 1)
            const maxTrail = (b.bounceCount || 0) * 5;
            if (b.trails.length > maxTrail) b.trails.pop();
        }

        // --- CLASS MODIFIER: Hive-Mother Nanite Swarm Homing ---
        if (b.isNanite && b.naniteTargetId) {
            const target = state.enemies.find(e => e.id === b.naniteTargetId && !e.dead);
            if (target) {
                // Steer towards target
                const angleToTarget = Math.atan2(target.y - b.y, target.x - b.x);
                // Smooth turn? Or just swarm behavior?
                // Let's do simple easing for "liquid" feel
                const speed = 12; // Fast

                // Lerp angle? No, just velocity steering is easier for swarm look
                const tx = Math.cos(angleToTarget) * speed;
                const ty = Math.sin(angleToTarget) * speed;

                // Add 'Jaggy' Jitter for swarm aesthetic
                const jitter = 4.0;
                b.vx += (tx - b.vx) * 0.15 + (Math.random() - 0.5) * jitter;
                b.vy += (ty - b.vy) * 0.15 + (Math.random() - 0.5) * jitter;
            } else {
                // Target died? Find new one? Or just drift
                b.life = 0; // Fizzle out
            }
        }

        // --- CLASS MODIFIERS: Aigis-Vortex Orbtial Movement ---
        if (b.vortexState === 'orbiting') {
            b.orbitAngle = (b.orbitAngle || 0) + 0.05;
            const dist = b.orbitDist || 125;
            b.x = player.x + Math.cos(b.orbitAngle) * dist;
            b.y = player.y + Math.sin(b.orbitAngle) * dist;
            // Update velocity so it "looks" like it's moving for hit detection (approx)
            b.vx = 0; b.vy = 0;
        }

        // --- AIGIS RING LOGIC ---
        if (b.isRing) {
            // 1. Keep centered on player
            b.x = player.x;
            b.y = player.y;

            // 2. Defusion Check
            // User Request: "after the bullet amount will drop to like notaml one that we can actualyl diffrencate"
            const THRESHOLD = 190; // Hysteresis: Merge at 200, Defuse at 190
            const currentCount = state.player.aigisRings?.[b.ringRadius!]?.count || 0;

            // Update our internal ammo checking against the global source of truth
            // (In case spawning logic added more ammo while we were a ring)
            b.ringAmmo = currentCount;

            if (currentCount < THRESHOLD) {
                // DEFUSE!
                b.life = 0; // Kill the ring
                bulletRemoved = true; // Mark for removal

                // Spawn individual bullets
                const ringData = state.player.aigisRings![b.ringRadius!];
                const countToSpawn = ringData.count;
                const avgDmg = ringData.count > 0 ? (ringData.totalDmg / ringData.count) : 0;
                // Don't modify global count here, we are just "visualizing" them now.
                // Actually, the global count 'state.bullets' needs them back.
                // The 'aigisRings' stats track the logical count.
                // We don't change 'aigisRings' stats here, we just change representation.

                for (let k = 0; k < countToSpawn; k++) {
                    const angle = (k / countToSpawn) * Math.PI * 2 + (state.gameTime * 0.05); // Distribute evenly + rotation
                    const restoredB: Bullet = {
                        ...b,
                        id: Math.random(),
                        isRing: false,
                        vortexState: 'orbiting',
                        orbitAngle: angle,
                        orbitDist: b.ringRadius,
                        x: player.x + Math.cos(angle) * b.ringRadius!,
                        y: player.y + Math.sin(angle) * b.ringRadius!,
                        dmg: avgDmg, // Give them average damage
                        color: b.color,
                        life: 999999,
                        vx: 0,
                        vy: 0,
                        hits: new Set(),
                        pierce: 0, // Should be irrelevant for orbiting? Or keep piercing? infinite?
                        isEnemy: false,
                        size: 4
                    };
                    // Clean up ring props from spread
                    delete restoredB.ringAmmo;
                    delete restoredB.ringRadius;
                    delete restoredB.ringVisualIntensity;

                    // We can't push to 'bullets' while iterating it?
                    // standard 'updateProjectiles' loop goes backwards: `for (let i = bullets.length - 1; i >= 0; i--)`
                    // So pushing to end of array is safe!
                    bullets.push(restoredB);
                }

                // Remove the ring data tracking? No, Spawning logic continues to use it.
                // But now that they are individual bullets, Spawning Logic will see "count > threshold" and re-merge them immediately?
                // No, we defuse at 60. Merge at 65. So safely stays as bullets until 5 more are spawned.
                // Wait, Spawning Logic uses `state.player.aigisRings` to track count.
                // If we have individual bullets, we MUST ensure `spawnBullet` logic updates the count correctly when they die or spawn.
                // Currently `spawnBullet` increments count.
                // Does updating individual bullets decrement count?
                // NO! We need to implement that in `bulletRemoved` section!
                // IF A BULLET DIES and it was part of Aigis Ring system (orbiting), we must decrement `aigisRings`.

                bullets.splice(i, 1);
                continue;
            }

            // 2.5 Wall Collision Logic for Ring
            // "getHexDistToWall" returns distance from a point to the nearest wall.
            const wallInfo = getHexDistToWall(b.x, b.y);

            // Dist is + inside, - outside.
            // If dist < ringRadius, the ring is touching/intersecting the wall.
            // RELAXED THRESHOLD: Add buffer to ensure it feels responsive before hard clipping
            const WALL_BUFFER = 50;
            if (wallInfo.dist < (b.ringRadius! + WALL_BUFFER)) {
                // The ring is scratching the wall.
                // Drop ammo rapidly (5 per frame = ~12 frames to kill a ring of 60)
                const ringData = state.player.aigisRings![b.ringRadius!];
                if (ringData.count > 0) {
                    const avgDmg = ringData.totalDmg / ringData.count;

                    const drainAmount = 5;
                    const actualDrain = Math.min(drainAmount, ringData.count);

                    ringData.count -= actualDrain;
                    ringData.totalDmg -= avgDmg * actualDrain;
                    b.ringAmmo = ringData.count;


                    // Visual sparks on wall?
                    // We know the wall normal, so we can spawn sparks at the intersection point.
                    // Point on ring closest to wall:
                    // Center + Normal * Radius? No, normal points inward from wall to center.
                    // So Center - Normal * Radius is the point on the ring touching the wall.
                    const sparkX = b.x - wallInfo.normal.x * b.ringRadius!;
                    const sparkY = b.y - wallInfo.normal.y * b.ringRadius!;

                    // Occasional spark
                    if (Math.random() < 0.3) {
                        spawnParticles(state, sparkX, sparkY, b.color || '#22d3ee', 2);
                    }
                }
            }

            // 3. Ring Collision Logic
            // We don't use the standard collision loop because that checks `dist < hitRadius`.
            // We need `abs(dist - ringRadius) < hitRadius`.

            const nearbyEnemies = state.spatialGrid.query(b.x, b.y, b.ringRadius! + 100);
            // We need to query a larger area to catch things on the ring edge

            let hitsThisFrame = 0;
            const MAX_HITS_PER_FRAME = 5; // Cap to prevent lag spikes processing too many hits?

            for (const e of nearbyEnemies) {
                if (e.dead || e.hp <= 0 || e.isFriendly || e.isZombie) continue;

                const dist = Math.hypot(e.x - b.x, e.y - b.y);
                const ringWidth = 20; // Visual width approximation
                const entityHitRadius = e.size + ringWidth;

                // Check if inside the ring's "kill zone" (Annulus)
                if (Math.abs(dist - b.ringRadius!) < entityHitRadius) {
                    // HIT!

                    // Calculate Single Bullet Damage
                    const ringData = state.player.aigisRings![b.ringRadius!];
                    if (ringData.count <= 0) break; // Should trigger defuse next frame

                    const avgDmg = ringData.totalDmg / ringData.count;

                    // Apply Damage (Directly call damage logic? Or mock a bullet hit?)
                    // Since we are inside the loop, we can just Copy-Paste damage logic effectively?
                    // Or better, let's just apply damage directly here to keep it clean.

                    // Decrement Ammo
                    ringData.count--;
                    ringData.totalDmg -= avgDmg;
                    b.ringAmmo = ringData.count;

                    // Apply Damage to Enemy
                    e.hp -= avgDmg;
                    player.damageDealt += avgDmg;

                    // Visuals
                    // Don't spawn floating number every time? Maybe only crits or every 5 hits?
                    // User feedback: "FPS drops". Reducing floating numbers is key.
                    if (Math.random() < 0.2) {
                        spawnFloatingNumber(state, e.x, e.y, Math.round(avgDmg).toString(), b.color || '#22d3ee', false);
                        spawnParticles(state, e.x, e.y, b.color || '#22d3ee', 1);
                    }

                    if (e.hp <= 0 && !e.dead) {
                        handleEnemyDeath(state, e, onEvent);
                    }

                    hitsThisFrame++;
                    // if (hitsThisFrame > MAX_HITS_PER_FRAME) break; // Optional performance cap
                }
            }

            continue; // Skip standard collision logic for Ring
        }

        // Collision with Enemies
        const nearbyEnemies = state.spatialGrid.query(b.x, b.y, 100); // 100px search radius (covers max enemy size)

        for (let j = 0; j < nearbyEnemies.length; j++) {
            const e = nearbyEnemies[j];

            // Ignore friendly zombies or dead/immune stuff
            // Friendly zombies shouldn't be hit by player bullets? Usually yes.
            // "on your side".
            if (e.dead || e.hp <= 0 || b.hits.has(e.id) || e.isFriendly || e.isZombie || (e.legionId && !e.legionReady)) continue;

            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            const hitRadius = e.size + 10;

            // --- SQUARE BOSS BUBBLE REFLECTION (Lvl 3) ---
            // If boss has shields active, reflect bullets at the bubble radius
            if (e.shape === 'square' && e.boss && e.orbitalShields && e.orbitalShields > 0) {
                const bubbleRadius = 110; // Protective bubble radius
                if (dist < bubbleRadius) {
                    // Bullet is inside or touching the bubble - REFLECT IT
                    // Calculate reflection angle (bounce off like a wall)
                    const angleToBullet = Math.atan2(b.y - e.y, b.x - e.x);
                    const reflectAngle = angleToBullet + Math.PI + (Math.random() - 0.5) * 0.4;

                    b.vx = Math.cos(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                    b.vy = Math.sin(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

                    // --- MALWARE BOUNCE LOGIC (Color Shift) ---
                    if (player.playerClass === 'malware') {
                        b.bounceCount = (b.bounceCount || 0) + 1;
                        if (b.bounceCount === 1) {
                            b.color = '#fb923c';
                        } else {
                            const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                            const green = Math.floor(146 * (1 - redProgress));
                            b.color = `rgb(255, ${green}, 0)`;
                        }
                        // Increase Damage (Bounce Logic)
                        const dmgMult = 1 + (b.bounceDmgMult || 0.2);
                        b.dmg *= dmgMult;
                    }

                    // Visual feedback - removed particles to avoid fountain effect
                    playSfx('impact');

                    // Bullet bounces - skip ALL further checks for this enemy
                    continue;
                }
            }

            if (dist < hitRadius) {
                // --- ComCrit Lvl 3: Death Mark Amplification ---
                const critLevel = getHexLevel(state, 'ComCrit');
                let damageAmount = b.dmg;

                // Apply Taken Damage Multiplier (e.g. Puddle)
                if (e.takenDamageMultiplier) {
                    damageAmount *= e.takenDamageMultiplier;
                }

                // Check if Marked (Shattered Fate Lvl 3)
                if (critLevel >= 3 && e.deathMarkExpiry && state.gameTime < e.deathMarkExpiry) {
                    const markMult = GAME_CONFIG.SKILLS.DEATH_MARK_MULT;
                    const bulletMult = b.critMult || 1.0;
                    const finalMult = Math.max(bulletMult, markMult);

                    // Priority: Apply the highest multiplier (ensure at least 300% for marked)
                    damageAmount = (b.dmg / bulletMult) * finalMult;

                    spawnParticles(state, e.x, e.y, '#FF0000', 3);
                    e.critGlitchUntil = now + 100; // Set glitch timer (100ms)
                }

                // --- TRIANGLE BOSS DEFLECTION (Lvl 3) ---
                if (e.shape === 'triangle' && e.deflectState) {
                    // 50% Chance to deflect
                    if (Math.random() < 0.5) {
                        // Deflect!
                        // Calculate normal vector from boss center to bullet
                        const angleToBullet = Math.atan2(b.y - e.y, b.x - e.x);
                        // Deflect angle: Random wide angle (160 deg -> ~2.8 rad spread)
                        // User request: "160 degrees angle" - implied separate from incoming?
                        // Interpretation: Bounce off at a wild angle generally away from boss
                        const deflectAngle = angleToBullet + (Math.random() - 0.5) * 2.5;

                        b.vx = Math.cos(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                        b.vy = Math.sin(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

                        // --- MALWARE BOUNCE LOGIC (Deflection counts as bounce) ---
                        if (player.playerClass === 'malware') {
                            b.bounceCount = (b.bounceCount || 0) + 1;
                            if (b.bounceCount === 1) {
                                b.color = '#fb923c';
                            } else {
                                const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                                const green = Math.floor(146 * (1 - redProgress));
                                b.color = `rgb(255, ${green}, 0)`;
                            }
                            // Increase Damage (Bounce Logic)
                            const dmgMult = 1 + (b.bounceDmgMult || 0.2);
                            b.dmg *= dmgMult;
                        }

                        // Extend life so it can fly away
                        b.life = 120;
                        // It can now kill other enemies, but not damage player (already handled by it being 'isEnemy: false')
                        // It also shouldn't hit this boss again immediately.
                        b.hits.add(e.id);

                        // Visuals
                        spawnParticles(state, b.x, b.y, '#FFFFFF', 5);
                        playSfx('impact'); // Fallback since 'ricochet' might not exist

                        continue; // Skip damage processing for this frame
                    }
                }

                // --- ComLife Lvl 3: +2% Max HP Dmg (Non-Boss) ---
                const lifeLevel = getHexLevel(state, 'ComLife');
                if (lifeLevel >= 3 && !e.boss) {
                    damageAmount += e.maxHp * 0.02;
                }

                // --- SPECIAL: Nanite Swarm Infection (Hive-Mother) ---
                if (b.isNanite) {
                    // Nanites apply infection without impact damage
                    damageAmount = 0;
                    const wasInfected = e.isInfected;
                    e.isInfected = true;
                    e.infectedUntil = 999999999; // Keep as fallback/legacy check
                    // Inherit per-tick damage directly from nanite projectile (no recursion)
                    e.infectionDmg = Math.max(e.infectionDmg || 0, b.dmg);

                    // Visuals - only on initial infection, not refresh
                    if (!wasInfected) {
                        const themeColor = getPlayerThemeColor(state);
                        spawnParticles(state, e.x, e.y, themeColor, 5);
                    }
                }

                // --- LEGION SHIELD LOGIC ---
                if (e.legionId) {
                    const lead = state.legionLeads?.[e.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                        const shieldDmg = Math.min(damageAmount, lead.legionShield || 0);
                        lead.legionShield = (lead.legionShield || 0) - shieldDmg;
                        damageAmount -= shieldDmg;

                        // Visual feedback for shield hit
                        spawnParticles(state, e.x, e.y, '#60a5fa', 5); // Blue spark for shield
                        spawnFloatingNumber(state, e.x, e.y, Math.round(shieldDmg).toString(), '#60a5fa', false);

                        if (damageAmount <= 0) {
                            // Bullet absorbed by shield
                            b.hits.add(e.id);
                            if (!b.isHyperPulse) b.pierce--;
                            // Skip regular damage but stay in loop for bullet removal check
                        }
                    }
                }

                // 0.5 Thorns Logic (Reflect Damage)
                if (e.thorns && e.thorns > 0 && damageAmount > 0) {
                    const reflected = damageAmount * e.thorns;
                    state.player.curHp -= reflected;
                    const displayDmg = Math.round(reflected);
                    if (displayDmg > 0) {
                        spawnFloatingNumber(state, state.player.x, state.player.y, `-${displayDmg}`, '#FF0000', true);
                    }
                    spawnParticles(state, state.player.x, state.player.y, '#FF0000', 3);

                    if (state.player.curHp <= 0 && !state.gameOver) {
                        state.player.curHp = 0;
                        state.gameOver = true;
                        state.player.deathCause = `Killed by Boss Thorns (${e.shape})`;
                        if (onEvent) onEvent('game_over');
                    }
                }

                // 1. Apply Damage (with Soul Link Logic)
                if (damageAmount > 0) {

                    // SOUL LINK LOGIC (Pentagon Boss)
                    let linkedTargets: Enemy[] = [];
                    if (e.soulLinkHostId) {
                        const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
                        if (host) {
                            linkedTargets.push(host);
                            // Find other minions linked to this host? 
                            // Optimized: The Host has `soulLinkTargets`.
                            if (host.soulLinkTargets) {
                                const peers = state.enemies.filter(p => host.soulLinkTargets!.includes(p.id) && !p.dead);
                                linkedTargets.push(...peers);
                            }
                        }
                    } else if (e.soulLinkTargets && e.soulLinkTargets.length > 0) {
                        // Takes hit as host
                        linkedTargets.push(e);
                        const minions = state.enemies.filter(m => e.soulLinkTargets!.includes(m.id) && !m.dead);
                        linkedTargets.push(...minions);
                    }

                    if (linkedTargets.length > 1) {
                        // Remove duplicates (Host is in targets, etc)
                        linkedTargets = Array.from(new Set(linkedTargets));

                        // Determine Link Color
                        // User Request: Prevent Green Color (Era 0). Use Bullet Color to maintain theme.
                        const linkColor = b.color || '#22d3ee'; // Default to Cyan if no bullet color

                        const splitDmg = damageAmount / linkedTargets.length;

                        linkedTargets.forEach(target => {
                            target.hp -= splitDmg;
                            player.damageDealt += splitDmg; // Total damage dealt remains same, just split
                            spawnFloatingNumber(state, target.x, target.y, Math.round(splitDmg).toString(), linkColor, false);
                            spawnParticles(state, target.x, target.y, linkColor, 2);

                            // Handle Death for linked targets
                            if (target.hp <= 0 && !target.dead) {
                                handleEnemyDeath(state, target, onEvent);
                            }
                        });

                        b.hits.add(e.id); // Register hit on primary target for bullet logic
                    } else {
                        // Standard Single Target
                        e.hp -= damageAmount;
                        player.damageDealt += damageAmount;
                        b.hits.add(e.id);
                    }

                    // Hyper-Pulse infinite pierce
                    if (!b.isHyperPulse) {
                        b.pierce--;
                    }
                }

                // --- CLASS MODIFIER: Event-Horizon Gravimetric Pull ---
                if (player.playerClass === 'eventhorizon') {
                    const now = state.gameTime;
                    const cdMod = isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0;
                    const cooldownDuration = 10 * cdMod; // 10 seconds * reduction
                    const blackholeDuration = 3; // 3 seconds

                    // Check if blackhole is off cooldown
                    if (!player.blackholeCooldown || now >= player.blackholeCooldown) {
                        // Create persistent blackhole area effect
                        state.areaEffects.push({
                            id: Date.now(),
                            type: 'blackhole',
                            x: b.x,
                            y: b.y,
                            radius: 400, // Reduced from 450px
                            duration: blackholeDuration,
                            creationTime: now,
                            level: 1
                        });

                        playSfx('impact'); // Heavier feedback

                        // Set cooldown
                        player.blackholeCooldown = now + cooldownDuration;
                    }
                }

                // --- CLASS MODIFIER: Hive-Mother Nanite Swarm ---
                if (player.playerClass === 'hivemother' && !b.isNanite) {
                    const resonance = getChassisResonance(state);
                    const multiplier = 1 + resonance;
                    const swarmDmgPerSecPct = 5 * multiplier;

                    e.isInfected = true;
                    e.infectedUntil = 999999999; // Keep as fallback/legacy check
                    const basePower = calcStat(player.dmg);
                    e.infectionDmg = basePower * (swarmDmgPerSecPct / 100); // 5%/sec * resonance, 1 tick per second
                }

                // Determine if crit for visual
                const isCritVisible = !!b.isCrit || (critLevel >= 3 && damageAmount > b.dmg * 2);
                const themeColor = getPlayerThemeColor(state);
                // Only show damage number if damage was actually dealt
                if (damageAmount > 0) {
                    spawnFloatingNumber(state, e.x, e.y, Math.round(damageAmount).toString(), isCritVisible ? '#ef4444' : themeColor, isCritVisible);
                }

                // --- ComCrit Lvl 3: Apply Death Mark ---
                // "Death marks enemy you hit every 10second"
                if (critLevel >= 3) {
                    const cdMod = isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0;
                    const dmCooldown = 10 * cdMod;

                    if (!player.lastDeathMark || state.gameTime - player.lastDeathMark > dmCooldown) {
                        e.deathMarkExpiry = state.gameTime + 3; // 3 seconds
                        player.lastDeathMark = state.gameTime;
                        // Visual for Mark?
                        spawnParticles(state, e.x, e.y, '#8800FF', 8); // Reduced count
                        playSfx('rare-spawn'); // Sound cue
                    }
                }

                // --- ComLife Lvl 1: Lifesteal ---
                if (lifeLevel >= 1 && (b.id !== -1)) { // Ensure it's a projectile (Shockwave shouldn't trigger this? Bullet ID check is weak but ok)
                    // "Lifesteal from dmg dealth of projectiles"
                    const heal = damageAmount * 0.03;

                    const maxHp = calcStat(player.hp);
                    const missing = maxHp - player.curHp;

                    if (heal <= missing) {
                        player.curHp += heal;
                    } else {
                        player.curHp = maxHp;
                        // Lvl 2: Overheal Shield Chunks (Dynamic Max HP Cap)
                        if (lifeLevel >= 2) {
                            const overflow = heal - missing;
                            let shieldGain = overflow * 2.0; // Double stolen health

                            if (!player.shieldChunks) player.shieldChunks = [];

                            const currentLifestealShield = player.shieldChunks
                                .filter(c => (c as any).source === 'lifesteal')
                                .reduce((s, c) => s + c.amount, 0);

                            const effMult = getHexMultiplier(state, 'ComLife');
                            const lifestealCap = maxHp * effMult;

                            if (currentLifestealShield < lifestealCap) {
                                // Cap to lifestealCap
                                shieldGain = Math.min(shieldGain, lifestealCap - currentLifestealShield);
                                player.shieldChunks.push({
                                    amount: shieldGain,
                                    expiry: now + 3.0,
                                    source: 'lifesteal'
                                });
                            }
                        }
                    }
                }

                // Crit Visuals
                if (b.isCrit) {
                    e.critGlitchUntil = now + 0.1; // Set glitch timer (100ms)
                    state.critShake = Math.min(state.critShake + 8, 20); // Add heavy shake

                } else {
                    if (onEvent) onEvent('hit');
                }

                // ELITE SKILL: SQUARE THORNS (Blade Mail)
                if (e.isElite && e.shape === 'square' && damageAmount > 0) {
                    // Returns 3% of player's damage for every hit
                    let reflectDmg = damageAmount * 0.03;

                    if (reflectDmg > 0) {
                        // Thorns are reduced by armor
                        const armorValue = calcStat(player.arm);
                        const drCap = 0.95;
                        const armRedMult = 1 - getDefenseReduction(armorValue, drCap);

                        // Correct Placement: Inside the contactDist check (happened above)
                        // But we already have it here. Let's make sure it's only if kinLvl >= 1
                        const kinLvl = getHexLevel(state, 'KineticBattery');
                        const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                        if (kinLvl >= 1 && triggerZap) triggerZap(state, player, kinLvl);
                        const safeDmg = Math.min(reflectDmg, player.curHp - 1);

                        if (safeDmg > 0) {
                            // Check Shield First
                            if (player.shieldChunks && player.shieldChunks.length > 0) {
                                // Apply to chunks
                                let rem = safeDmg;
                                let absorbed = 0;
                                for (const chunk of player.shieldChunks) {
                                    if (chunk.amount >= rem) {
                                        chunk.amount -= rem;
                                        absorbed += rem;
                                        rem = 0; break;
                                    } else {
                                        absorbed += chunk.amount;
                                        rem -= chunk.amount;
                                        chunk.amount = 0;
                                    }
                                }
                                player.shieldChunks = player.shieldChunks.filter((c: any) => c.amount > 0);
                                const finalThornDmg = safeDmg - absorbed;

                                if (finalThornDmg > 0) {
                                    player.curHp -= finalThornDmg;
                                    player.damageTaken += finalThornDmg;
                                }
                            } else {
                                player.curHp -= safeDmg;
                                player.damageTaken += safeDmg;
                            }

                            if (onEvent) onEvent('player_hit', { dmg: safeDmg }); // Trigger red flash
                            spawnParticles(state, player.x, player.y, '#FF0000', 3); // Visual feedback

                            const displayDmg = Math.round(safeDmg);
                            if (displayDmg > 0) {
                                spawnFloatingNumber(state, player.x, player.y, displayDmg.toString(), '#ef4444', false);
                            }

                            // Explicit Death Check for Thorns
                            if (player.curHp <= 0) {
                                player.curHp = 0;
                                state.gameOver = true;
                                player.deathCause = 'Executed by Elite Square Thorns';
                                if (onEvent) onEvent('game_over');
                            }
                        }
                    }
                }

                // --- ComCrit Lvl 2: Execute ---
                if (critLevel >= 2 && !e.boss && e.hp < e.maxHp * GAME_CONFIG.SKILLS.EXECUTE_THRESHOLD) {
                    if (Math.random() < GAME_CONFIG.SKILLS.EXECUTE_CHANCE) {
                        const remainingHp = Math.round(e.hp);
                        e.hp = 0; // Execute
                        e.isExecuted = true; // Mark for no particles in handleEnemyDeath

                        // "Death Color" (Greyish) - Combined into one line for clarity.
                        // Shifted 10px to the right to clear the enemy model.
                        spawnFloatingNumber(state, e.x + 10, e.y - 10, `EXEC ${remainingHp}`, '#64748b', false);

                        playSfx('rare-kill');
                    }
                }

                // 2. Handle Rare Transitions (These may shift phase)
                // 2. Handle Rare Transitions (These may shift phase)
                if (e.isRare) {
                    if (e.rarePhase === 0 || e.rarePhase === 1) {
                        // First Hit Trigger: Escape Sequence (Phase 0 -> 2 or 1 -> 2)
                        // This ensures Snitch doesn't die on first hit, even if sniped from afar.
                        e.rarePhase = 2;
                        e.rareTimer = state.gameTime;
                        e.palette = ['#EF4444', '#DC2626', '#B91C1C']; // Red Shift

                        // Phase 3 Stats
                        e.spd = state.player.speed * 1.4; // 1.4x Player Speed
                        e.invincibleUntil = now + 2.0; // 2s Immunity

                        // Refresh Skills
                        e.shieldCd = 0; // Reset Barrels
                        e.panicCooldown = 0; // Reset Smoke (reusing panicCooldown for smoke CD)
                        e.lastDodge = 0; // Reset internal logic

                        // Smoke Screen Visual
                        spawnParticles(state, e.x, e.y, ['#FFFFFF', '#808080'], 150, 400, 100);
                        playSfx('smoke-puff');

                        e.hp = 1000; e.maxHp = 1000; // Ensure survival
                        e.knockback = { x: 0, y: 0 };
                        b.life = 0; // Consume bullet

                        // Signal Teleport Logic (handled in UniqueEnemyLogic.ts)
                        e.forceTeleport = true;

                        // Don't die yet
                        if (onEvent) onEvent('hit');
                        return; // Skip death check
                    } else if (e.rarePhase === 2) {
                        // Phase 3: Check Immunity
                        if (e.invincibleUntil && now < e.invincibleUntil) {
                            spawnParticles(state, e.x, e.y, '#FFFFFF', 5); // Immune feedback
                            b.life = 0;
                            return;
                        }
                        // Vulnerable -> Death
                        e.hp = 0;
                    }
                }

                // 3. Common Death Check
                if (e.hp <= 0 && !e.dead) {
                    handleEnemyDeath(state, e, onEvent);
                }

                // 4. Bullet Removal
                if (b.pierce < 0 || b.life <= 0) {
                    bullets.splice(i, 1);
                    bulletRemoved = true;

                    // --- AIGIS Optimization: Decrement Ring Count if orbiting bullet dies ---
                    if (b.vortexState === 'orbiting' && b.orbitDist && state.player.aigisRings?.[b.orbitDist]) {
                        const ringData = state.player.aigisRings[b.orbitDist];
                        if (ringData.count > 0) {
                            ringData.count--;
                            ringData.totalDmg -= b.dmg;
                        }
                    }

                    break;
                }
            }
        }

        if (!bulletRemoved && b.life <= 0) {
            bullets.splice(i, 1);

            // --- AIGIS Optimization: Decrement Ring Count if orbiting bullet dies (natural expiry or boundary) ---
            if (b.vortexState === 'orbiting' && b.orbitDist && state.player.aigisRings?.[b.orbitDist]) {
                const ringData = state.player.aigisRings[b.orbitDist];
                if (ringData.count > 0) {
                    ringData.count--;
                    ringData.totalDmg -= b.dmg;
                }
            }
        }
    }

    // --- ENEMY BULLETS ---
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;
        eb.life--;

        if (!isInMap(eb.x, eb.y)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // --- Collision with Zombies (They block bullets) ---
        let hitZombie = false;
        const nearbyZombies = state.spatialGrid.query(eb.x, eb.y, 50);
        for (const z of nearbyZombies) {
            if (z.isZombie && z.zombieState === 'active' && !z.dead) {
                const zDist = Math.hypot(z.x - eb.x, z.y - eb.y);
                if (zDist < z.size + 10) {
                    if (z.zombieHearts !== undefined) {
                        z.zombieHearts--;
                        spawnParticles(state, z.x, z.y, '#4ade80', 5);
                        playSfx('impact');
                        if (z.zombieHearts <= 0) {
                            z.dead = true;
                            z.hp = 0;
                            spawnParticles(state, z.x, z.y, '#4ade80', 15);
                        }
                    }
                    hitZombie = true;
                    break;
                }
            }
        }

        if (hitZombie) {
            enemyBullets.splice(i, 1);
            continue;
        }

        const distP = Math.hypot(player.x - eb.x, player.y - eb.y);
        if (distP < player.size + 10) {
            const armorValue = calcStat(player.arm);
            const armRedMult = 1 - getDefenseReduction(armorValue);

            const projRedRaw = calculateLegendaryBonus(state, 'proj_red_per_kill');
            const projRed = Math.min(80, projRedRaw); // Cap at 80% reduction
            const projRedMult = 1 - (projRed / 100);

            const rawDmg = eb.dmg;
            const dmgAfterArmor = rawDmg * armRedMult;
            const blockedByArmor = rawDmg - dmgAfterArmor;

            const finalProjDmg = dmgAfterArmor * projRedMult;
            const blockedByProj = dmgAfterArmor - finalProjDmg;

            player.damageBlockedByArmor += blockedByArmor;
            player.damageBlockedByProjectileReduc += blockedByProj;
            player.damageBlocked += (blockedByArmor + blockedByProj);

            const dmg = finalProjDmg;

            // Check Shield Chunks
            let absorbedDmg = 0;
            if (player.shieldChunks && player.shieldChunks.length > 0) {
                // Sort by soonest expiring
                player.shieldChunks.sort((a, b) => a.expiry - b.expiry);
                let remainingToAbsorb = dmg;
                for (let k = 0; k < player.shieldChunks.length; k++) {
                    const chunk = player.shieldChunks[k];
                    if (chunk.amount >= remainingToAbsorb) {
                        chunk.amount -= remainingToAbsorb;
                        absorbedDmg += remainingToAbsorb;
                        remainingToAbsorb = 0;
                        break;
                    } else {
                        absorbedDmg += chunk.amount;
                        remainingToAbsorb -= chunk.amount;
                        chunk.amount = 0;
                    }
                }
                player.shieldChunks = player.shieldChunks.filter(c => c.amount > 0);
            }

            const finalDmg = Math.max(0, dmg - absorbedDmg);
            player.damageBlockedByShield += absorbedDmg;
            player.damageBlocked += absorbedDmg;
            // User: "dmg blocked not working should show how much was blocked by armorm, Colision dmg reduction and projcetile reducitom"
            // I'll keep the breakdown separate as requested.

            if (dmg > 0) {
                // Kinetic Battery: Trigger Zap on Hit (even if shielded)
                const kinLvl = getHexLevel(state, 'KineticBattery');
                if (kinLvl >= 1) {
                    const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                    if (triggerZap) triggerZap(state, player, kinLvl);
                }

                if (finalDmg > 0) {
                    player.curHp -= finalDmg;
                    player.damageTaken += finalDmg;
                    if (onEvent) onEvent('player_hit', { dmg: finalDmg });
                }

                if (player.curHp <= 0 && !state.gameOver) {
                    state.gameOver = true;
                    player.deathCause = 'Died from Enemy Projectile';
                    if (onEvent) onEvent('game_over');
                }
            }
            spawnFloatingNumber(state, player.x, player.y, Math.round(dmg).toString(), '#ef4444', false);

            enemyBullets.splice(i, 1);
            continue;
        }

        if (eb.life <= 0) {
            enemyBullets.splice(i, 1);
        }
    }

    // Shield Cleanup
    if (player.shieldChunks) {
        player.shieldChunks = player.shieldChunks.filter(c => now < c.expiry && c.amount > 0);
    }
}
