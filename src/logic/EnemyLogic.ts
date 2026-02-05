import type { GameState, Enemy } from './types';
import { isInMap, ARENA_CENTERS, getHexDistToWall, getArenaIndex, getRandomPositionInArena } from './MapLogic';
import { playSfx } from './AudioLogic';
import { spawnParticles, spawnFloatingNumber } from './ParticleLogic';
import { handleEnemyDeath } from './DeathLogic';
import { getPlayerThemeColor } from './helpers';

// Modular Enemy Logic
import { updateNormalCircle, updateNormalTriangle, updateNormalSquare, updateNormalDiamond, updateNormalPentagon, updateUniquePentagon } from './enemies/NormalEnemyLogic';
import { updateEliteCircle, updateEliteTriangle, updateEliteSquare, updateEliteDiamond, updateElitePentagon } from './enemies/EliteEnemyLogic';
import { updateBossEnemy } from './enemies/BossEnemyLogic';
import { GAME_CONFIG } from './GameConfig';
import { getProgressionParams, spawnEnemy, manageRareSpawnCycles } from './enemies/EnemySpawnLogic';
import { scanForMerges, manageMerges } from './enemies/EnemyMergeLogic';
import { updateZombie, updateSnitch, updateMinion } from './enemies/UniqueEnemyLogic';

// Helper to determine current game era params
export { spawnEnemy, spawnRareEnemy } from './enemies/EnemySpawnLogic';


export function updateEnemies(state: GameState, onEvent?: (event: string, data?: any) => void, step: number = 1 / 60) {
    const { enemies, player, gameTime } = state;
    const { shapeDef, pulseDef } = getProgressionParams(gameTime);

    // Spawning Logic
    const minutes = gameTime / 60;
    const baseSpawnRate = GAME_CONFIG.ENEMY.BASE_SPAWN_RATE + (minutes * GAME_CONFIG.ENEMY.SPAWN_RATE_PER_MINUTE);
    let actualRate = baseSpawnRate * shapeDef.spawnWeight;
    if (state.currentArena === 1) actualRate *= 1.15; // +15% Spawn Rate in Combat Hex

    if (Math.random() < actualRate / 60 && state.portalState !== 'transferring') {
        spawnEnemy(state);
    }

    // Rare Spawning Logic
    if (state.portalState !== 'transferring') {
        manageRareSpawnCycles(state);
    }

    // Boss Spawning
    if (gameTime >= state.nextBossSpawnTime && state.portalState !== 'transferring') {
        // Fix: Pass arguments correctly (x, y, shape, isBoss)
        spawnEnemy(state, undefined, undefined, undefined, true);
        state.nextBossSpawnTime += GAME_CONFIG.ENEMY.BOSS_SPAWN_INTERVAL; // 2 Minutes
    }

    // --- SPATIAL GRID UPDATE ---
    state.spatialGrid.clear();
    enemies.forEach(e => {
        if (!e.dead) state.spatialGrid.add(e);
    });

    // --- LEGION CACHING (Optimization) ---
    const legionGroups = new Map<string, { lead: Enemy | null, members: Enemy[] }>();
    state.legionLeads = {}; // Global cache for this frame
    enemies.forEach(e => {
        if (e.legionId && !e.dead) {
            if (!legionGroups.has(e.legionId)) {
                legionGroups.set(e.legionId, { lead: null, members: [] });
            }
            const group = legionGroups.get(e.legionId)!;
            group.members.push(e);
            if (e.id === e.legionLeadId) {
                group.lead = e;
                state.legionLeads![e.legionId] = e;
            }
        }
    });

    // Handle lead reassignment for broken legions
    legionGroups.forEach((group, legionId) => {
        if (!group.lead && group.members.length > 0) {
            const newLead = group.members[0];
            group.lead = newLead;
            group.members.forEach(m => m.legionLeadId = newLead.id);
            state.legionLeads![legionId] = newLead;
        }
    });

    const activeLegionIds = Array.from(legionGroups.keys());

    // --- LEGION SPAWNING ---
    if (state.activeEvent?.type === 'legion_formation' && !state.directorState?.legionSpawned) {
        const { shapeDef, eraPalette } = getProgressionParams(state.gameTime);
        const legionId = `legion_${Math.random()}`;
        state.directorState!.legionSpawned = true;
        state.directorState!.activeLegionId = legionId;

        const formationAngle = Math.random() * Math.PI * 2;
        const formationDist = 1500;
        let baseCenterX = state.player.x + Math.cos(formationAngle) * formationDist;
        let baseCenterY = state.player.y + Math.sin(formationAngle) * formationDist;

        // Ensure formation center is in map/current arena roughly
        if (!isInMap(baseCenterX, baseCenterY)) {
            const playerArena = getArenaIndex(state.player.x, state.player.y);
            const fallback = getRandomPositionInArena(playerArena);
            baseCenterX = fallback.x;
            baseCenterY = fallback.y;
        }

        const formationCenterX = baseCenterX;
        const formationCenterY = baseCenterY;

        // Scaling (Matching EnemySpawnLogic.ts)
        const minutes = state.gameTime / 60;
        const cycleCount = Math.floor(minutes / 5);
        const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
        const hpMult = Math.pow(1.2, cycleCount) * shapeDef.hpMult;
        const baseHp = 60 * Math.pow(1.186, minutes) * difficultyMult;
        const finalHp = baseHp * hpMult;

        const sharedShield = (finalHp * 30) * 20.0; // 20x of combined HP (User Request)

        for (let i = 0; i < 30; i++) {
            const slotX = i % 6 - 2.5; // Center the 6 columns (-2.5 to 2.5)
            const slotY = Math.floor(i / 6) - 2; // Center the 5 rows (-2 to 2)
            const spacing = 20 * shapeDef.sizeMult * 2.5;

            const newUnit: Enemy = {
                id: Math.random(),
                type: shapeDef.type as any,
                shape: shapeDef.type as any,
                x: formationCenterX + (slotX * spacing),
                y: formationCenterY + (slotY * spacing),
                size: 20 * shapeDef.sizeMult,
                hp: finalHp,
                maxHp: finalHp,
                spd: 2.4 * shapeDef.speedMult,
                boss: false,
                bossType: 0,
                bossAttackPattern: 0,
                lastAttack: Date.now(),
                dead: false,
                shellStage: 2,
                palette: eraPalette.colors,
                eraPalette: eraPalette.colors,
                fluxState: 0,
                pulsePhase: 0,
                rotationPhase: Math.random() * Math.PI * 2,
                knockback: { x: 0, y: 0 },
                isElite: false,
                spawnedAt: state.gameTime,
                legionId: legionId,
                legionLeadId: 0, // Assigned below
                legionSlot: { x: slotX, y: slotY },
                legionShield: sharedShield,
                maxLegionShield: sharedShield,
                legionReady: true, // Fully formed instantly
                wasInLegion: true,
                legionCenter: { x: formationCenterX, y: formationCenterY }
            };
            state.enemies.push(newUnit);
        }

        // Set Lead ID and map the lead in the global legionLeads map
        const legionMembers = state.enemies.filter(e => e.legionId === legionId);
        const lead = legionMembers[0];

        if (lead) {
            legionMembers.forEach(m => m.legionLeadId = lead.id);
            // CRITICAL: Must register the lead in legionLeads so ProjectileLogic sees the shield!
            if (!state.legionLeads) state.legionLeads = {};
            state.legionLeads[legionId] = lead;

            console.log(`Director: Legion spawned with ${shapeDef.type}s at 1500px, Shield: ${sharedShield}`);
        }
    }

    // --- MERGING LOGIC ---
    // User: No merges until at least one legion is still alive
    const anyLegionAlive = activeLegionIds.length > 0;

    // Clear merge groups if any member is in a legion
    const compromisedMergeIds = new Set<string>();
    enemies.forEach(e => {
        if (e.legionId && e.mergeId) compromisedMergeIds.add(e.mergeId);
    });

    // User: Legion members are strictly excluded from merging and cluster logic
    if (compromisedMergeIds.size > 0) {
        enemies.forEach(e => {
            if (e.mergeId && compromisedMergeIds.has(e.mergeId)) {
                e.mergeState = undefined;
                e.mergeId = undefined;
                e.mergeTimer = undefined;
                e.mergeHost = undefined;
            }
        });
    }

    if (state.activeEvent?.type !== 'legion_formation' && !anyLegionAlive) {
        // 1. Manage Active Clusters
        manageMerges(state);

        // 2. Scan for new clusters (Throttled)
        if (Math.floor(state.gameTime * 60) % 30 === 0) { // Check every 0.5s
            scanForMerges(state);
        }
    }

    enemies.forEach(e => {
        if (e.dead) return;

        // Sync visual progression to current game time
        const params = getProgressionParams(gameTime);
        e.fluxState = params.fluxState;

        if (!e.isNeutral && !e.isRare && !e.isNecroticZombie) {
            e.eraPalette = params.eraPalette.colors;
        }

        // Particle Leakage (Starts at 30m, increases at 60m)
        const minutes = gameTime / 60;
        if (minutes > 30 && !e.isNeutral) {
            const chance = minutes > 60 ? 10 : 30; // Every 10 or 30 frames
            if (state.frameCount % chance === 0) {
                spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 1, 15, 0, 'void');
            }
        }

        // --- ZOMBIE LOGIC ---
        if (e.isZombie) {
            updateZombie(e, state, step, onEvent);
            return;
        }

        if (e.frozen && e.frozen > 0) {
            e.frozen -= 1 / 60;
            return;
        }

        // Reset Frame-based Multipliers (but not for bosses - they manage their own)
        if (!e.boss) {
            e.takenDamageMultiplier = 1.0;
        }

        // --- CLASS MODIFIER: Hive-Mother Nanite DOT ---
        if (e.isInfected) {
            const dotFreq = 30; // Every 30 frames (2 times per second at 60fps)
            if (state.frameCount % dotFreq === 0) {
                const dmgPerTick = (e.infectionDmg || 0) / 2; // Split damage over 2 ticks per second
                if (dmgPerTick > 0) {
                    // Accumulate damage to handle sub-integer values correctly
                    e.infectionAccumulator = (e.infectionAccumulator || 0) + dmgPerTick;

                    if (e.infectionAccumulator >= 1) {
                        const actualDmg = Math.floor(e.infectionAccumulator);
                        if (actualDmg > 0) { // Only show if damage is actually dealt
                            e.hp -= actualDmg;
                            player.damageDealt += actualDmg;
                            e.infectionAccumulator -= actualDmg;

                            const themeColor = getPlayerThemeColor(state);
                            spawnFloatingNumber(state, e.x, e.y, actualDmg.toString(), themeColor, false);
                            spawnParticles(state, e.x, e.y, themeColor, 1); // Reduced count for higher frequency
                        }
                    }
                }
            }
        }

        // Wall collision - Bosses survive with 10% Max HP penalty
        if (!isInMap(e.x, e.y)) {
            if (e.boss) {
                const now = state.gameTime;
                if (!e.lastWallHit || now - e.lastWallHit > 1.0) {
                    const wallDmg = e.maxHp * 0.1;
                    e.hp -= wallDmg;
                    spawnFloatingNumber(state, e.x, e.y, Math.round(wallDmg).toString(), '#ef4444', true);
                    spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 10);
                    playSfx('impact');
                    e.lastWallHit = now;

                    const { dist, normal } = getHexDistToWall(e.x, e.y);
                    // Strong bounce back (150px away from wall to clear boundary definitively)
                    e.x += normal.x * (Math.abs(dist) + 150);
                    e.y += normal.y * (Math.abs(dist) + 150);

                    // Add lingering knockback velocity
                    e.knockback.x = normal.x * 20;
                    e.knockback.y = normal.y * 20;
                }

                if (e.hp <= 0 && !e.dead) {
                    handleEnemyDeath(state, e, onEvent);
                    return;
                }
            } else {
                e.dead = true;
                e.hp = 0;
                spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 20);
                return;
            }
        }

        // Knockback handling - Decay faster for snappier boss bounces
        if (e.knockback && (e.knockback.x !== 0 || e.knockback.y !== 0)) {
            e.x += e.knockback.x;
            e.y += e.knockback.y;
            e.knockback.x *= 0.7; // Snappier decay
            e.knockback.y *= 0.7;
            if (Math.abs(e.knockback.x) < 0.1) e.knockback.x = 0;
            if (Math.abs(e.knockback.y) < 0.1) e.knockback.y = 0;
            // DO NOT RETURN - let boss/enemy AI continue to process
        }

        // Target Determination (Mutual Aggression)
        let targetX = player.x;
        let targetY = player.y;
        let dist = Math.hypot(player.x - e.x, player.y - e.y);
        // Enemies target nearest: Player or Active Zombie
        for (const z of state.enemies) {
            if (z.isZombie && z.zombieState === 'active' && !z.dead) {
                if (e.boss) continue;
                const zDist = Math.hypot(z.x - e.x, z.y - e.y);
                if (zDist < dist) {
                    dist = zDist;
                    targetX = z.x;
                    targetY = z.y;
                }
            }
        }

        const dx = targetX - e.x;
        const dy = targetY - e.y;
        if (dist === 0) dist = 0.001;

        // Collision with Zombie - (Handled in UniqueEnemyLogic.ts now)
        // if (targetZombie && dist < e.size + targetZombie.size) { ... }

        // Separator
        let pushX = 0;
        let pushY = 0;

        // Optimized Push Logic - Only run for enemies near player and stagger checks
        const shouldCheckPush = dist < 1000 && (e.id + state.frameCount) % 2 === 0;

        if (shouldCheckPush) {
            const nearbyEnemies = state.spatialGrid.query(e.x, e.y, e.size * 3);

            nearbyEnemies.forEach(other => {
                if (e === other) return;
                const odx = e.x - other.x;
                const ody = e.y - other.y;
                // Quick box check before expensive hypot
                if (Math.abs(odx) < e.size + other.size && Math.abs(ody) < e.size + other.size) {
                    const odist = Math.sqrt(odx * odx + ody * ody);
                    // Push radius usually 2*size
                    if (odist < e.size + other.size) {
                        const pushDist = (e.size + other.size) - odist;
                        if (odist > 0.001) { // Avoid div by zero
                            // User: Legion members are like walls, push others strongly
                            let multiplier = 0.01;
                            if (other.legionId) multiplier = 0.8; // Harder wall-like push

                            pushX += (odx / odist) * pushDist * multiplier;
                            pushY += (ody / odist) * pushDist * multiplier;
                        }
                    }
                }
            });
        }

        // Apply Speed Modifiers
        // Speed - elites move at same speed as normal enemies generally, unless specific shape logic overrides
        let currentSpd = e.spd;
        if (e.shape === 'circle') currentSpd *= 1.5;

        // Apply Slow Factor (reset each frame by logic, or persistence?)
        // If we set e.slowFactor in the loop, we use it here.
        if (e.slowFactor) {
            currentSpd *= (1 - e.slowFactor);
            // Decay slow factor for smooth recovery or just expect it to be re-applied?
            // Let's assume re-applied every frame by Puddle/Epi.
            e.slowFactor = 0; // Reset for next frame
        }

        // Calculate Velocity using Delegates
        let v = { vx: 0, vy: 0 };
        const isFeared = e.fearedUntil && e.fearedUntil > state.gameTime;

        if (isFeared) {
            // Run Away Behavior (Fear)
            const angle = Math.atan2(dy, dx);
            v = {
                vx: -Math.cos(angle) * currentSpd,
                vy: -Math.sin(angle) * currentSpd
            };
        } else if ((e.type as string) === 'orbital_shield') {
            // --- ORBITAL SHIELD LOGIC ---
            if (e.parentId) {
                const parent = state.enemies.find(p => p.id === e.parentId);
                if (!parent || parent.dead) {
                    e.dead = true;
                    e.hp = 0;
                } else {
                    // Orbit Logic
                    const orbitSpeed = 0.01; // Slower orbit (3x slower)
                    const orbitDist = 150; // Increased to properly cover boss (boss size is 60)
                    e.rotationPhase = (e.rotationPhase || 0) + orbitSpeed;

                    // Assign position directly (lock to parent)
                    // We also add the index offset to space them out? 
                    // No, usually we spawn them with different phases. 
                    // spawnShield sets random phase, but Boss spawns them with specific angles.
                    // We should let rotationPhase drive the position.

                    // Recalculate position based on Parent + Phase
                    // Note: BossSpawnLogic sets initial pos, but here we override it to orbit.
                    const targetX = parent.x + Math.cos(e.rotationPhase) * orbitDist;
                    const targetY = parent.y + Math.sin(e.rotationPhase) * orbitDist;

                    // Direct set or smooth move? Direct set is better for rigid shield feel.
                    e.x = targetX;
                    e.y = targetY;
                    v = { vx: 0, vy: 0 }; // No independent velocity
                }
            } else {
                e.dead = true; // Orphaned shield
            }
        } else if (e.boss) {
            v = updateBossEnemy(e, currentSpd, dx, dy, pushX, pushY, state, onEvent);
        } else if (e.shape === 'minion') {
            v = updateMinion(e, state, player, dx, dy, 0, 0);
        } else if (e.shape === 'snitch') {
            v = updateSnitch(e, state, player, state.gameTime);
        } else if (e.isRare && e.shape === 'pentagon') {
            v = updateUniquePentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY);
        } else if (e.isElite) {
            switch (e.shape) {
                case 'circle': v = updateEliteCircle(e, state, player, dist, dx, dy, currentSpd, pushX, pushY); break;
                case 'triangle': v = updateEliteTriangle(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
                case 'square': v = updateEliteSquare(e, state, currentSpd, dx, dy, pushX, pushY); break;
                case 'diamond': v = updateEliteDiamond(e, state, player, dist, dx, dy, currentSpd, pushX, pushY, onEvent); break;
                case 'pentagon': v = updateElitePentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY, onEvent); break;
            }
        } else {
            switch (e.shape) {
                case 'circle': v = updateNormalCircle(e, dx, dy, currentSpd, pushX, pushY); break;
                case 'triangle': v = updateNormalTriangle(e, dx, dy, pushX, pushY); break;
                case 'square': v = updateNormalSquare(currentSpd, dx, dy, pushX, pushY); break;
                case 'diamond': v = updateNormalDiamond(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
                case 'pentagon': v = updateNormalPentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
            }
        }

        let vx = v.vx;
        let vy = v.vy;



        // 2. Behavior (Persists after event ends)
        if (e.legionId && e.legionSlot && e.legionLeadId) {
            const lead = state.legionLeads?.[e.legionId];
            if (lead) {
                // Legion members ignore fear/fleeing
                e.fearedUntil = 0;

                // No personal push when in legion to maintain formation
                pushX = 0;
                pushY = 0;

                const spacing = e.size * 2.5;
                // Corrected relative slot logic: target = lead + (mySlot - leadSlot) * spacing
                const targetX = lead.x + (e.legionSlot.x - (lead.legionSlot?.x || 0)) * spacing;
                const targetY = lead.y + (e.legionSlot.y - (lead.legionSlot?.y || 0)) * spacing;

                if (e === lead) {
                    // Lead chases player direct
                    const playerAngle = Math.atan2(player.y - e.y, player.x - e.x);
                    vx = Math.cos(playerAngle) * currentSpd * 1.2;
                    vy = Math.sin(playerAngle) * currentSpd * 1.2;
                } else {
                    // Move to slot relative to lead
                    const tdx = targetX - e.x;
                    const tdy = targetY - e.y;
                    const tdist = Math.hypot(tdx, tdy);
                    if (tdist > 5) {
                        vx = (tdx / tdist) * Math.min(tdist, currentSpd * 3); // Faster catch-up
                        vy = (tdy / tdist) * Math.min(tdist, currentSpd * 3);
                    } else {
                        vx = lead.vx || 0;
                        vy = lead.vy || 0;
                    }
                }

                // Restore Shield Ref Sync
                e.legionShield = lead.legionShield;
                e.maxLegionShield = lead.maxLegionShield;
                e.legionReady = true;
            } else {
                e.legionId = undefined;
                e.isAssembling = false;
            }
        }

        // --- STATUS OVERRIDES ---
        // (Removed old broken fear logic)


        // --- GLOBAL LOGIC ---
        e.x += (Math.random() - 0.5);
        e.y += (Math.random() - 0.5);

        const nX = e.x + vx;
        const nY = e.y + vy;

        if (isInMap(nX, nY)) {
            e.x = nX; e.y = nY;
        } else {
            if (e.boss) {
                const now = state.gameTime;
                if (!e.lastWallHit || now - e.lastWallHit > 1.0) {
                    const wallDmg = e.maxHp * 0.1;
                    e.hp -= wallDmg;
                    spawnFloatingNumber(state, e.x, e.y, Math.round(wallDmg).toString(), '#ef4444', true);
                    spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 10);
                    playSfx('impact');
                    e.lastWallHit = now;
                }

                const { dist, normal } = getHexDistToWall(e.x, e.y);
                e.x += normal.x * (Math.abs(dist) + 150);
                e.y += normal.y * (Math.abs(dist) + 150);

                // Add lingering knockback velocity
                e.knockback.x = normal.x * 20;
                e.knockback.y = normal.y * 20;

                if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
            } else if (e.shape === 'snitch' && e.rareReal) {
                const c = ARENA_CENTERS[0];
                const a = Math.atan2(c.y - e.y, c.x - e.x);
                e.x += Math.cos(a) * 50; e.y += Math.sin(a) * 50;
            } else {
                // User: Legion enemies are invincible until shield is destroyed
                if (e.legionId && e.legionLeadId) {
                    const lead = state.enemies.find(m => m.id === e.legionLeadId && !m.dead);
                    if (lead && (lead.legionShield || 0) > 0) {
                        return;
                    }
                }
                handleEnemyDeath(state, e, onEvent);
                return;
            }
        }

        e.pulsePhase = (e.pulsePhase + (Math.PI * 2) / pulseDef.interval) % (Math.PI * 2);
        e.rotationPhase = (e.rotationPhase || 0) + 0.01;
        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
    });
}

/**
 * Resets the attack states and timers of all elite and boss enemies.
 * This is called when the game is unpaused to prevent immediate hits
 * from telegraphed attacks that were mid-animation.
 */
export function resetEnemyAggro(state: GameState) {
    state.enemies.forEach(e => {
        // Reset Elite States
        if (e.isElite) {
            e.eliteState = 0;
            e.timer = Date.now() + 1000; // Force a delay before stalking again
            e.lastAttack = Date.now();
            e.lockedTargetX = undefined;
            e.lockedTargetY = undefined;
            e.hasHitThisBurst = false;
        }

        // Reset Boss States
        if (e.boss) {
            if (e.shape === 'circle') e.dashState = 0;
            if (e.shape === 'triangle') e.berserkState = false;
            if (e.shape === 'diamond') e.beamState = 0;

            // Shared Boss Timers
            e.dashTimer = 0;
            e.beamTimer = 0;
            e.berserkTimer = 0;
            e.lastAttack = Date.now();
            e.hasHitThisBurst = false;
        }
    });
}


