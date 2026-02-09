import type { GameState, Enemy } from '../core/types';
import { isInMap, ARENA_CENTERS, getHexDistToWall, getArenaIndex, getRandomPositionInArena } from '../mission/MapLogic';
import { playSfx } from '../audio/AudioLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { getPlayerThemeColor } from '../utils/helpers';
import { isBuffActive } from '../upgrades/BlueprintLogic';

// Modular Enemy Logic
import { updateNormalCircle, updateNormalTriangle, updateNormalSquare, updateNormalDiamond, updateNormalPentagon, updateUniquePentagon } from './NormalEnemyLogic';
import { updateEliteCircle, updateEliteTriangle, updateEliteSquare, updateEliteDiamond, updateElitePentagon } from './EliteEnemyLogic';
import { updateBossEnemy } from './BossEnemyLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { getProgressionParams, spawnEnemy, manageRareSpawnCycles, getEventPalette } from './EnemySpawnLogic';
import { scanForMerges, manageMerges } from './EnemyMergeLogic';
import { updateZombie, updateSnitch, updateMinion, updatePrismGlitcher } from './UniqueEnemyLogic';
import { updateVoidBurrower } from './WormLogic';
import { getFlankingVelocity } from './EnemyAILogic';

// Helper to determine current game era params
export { spawnEnemy, spawnRareEnemy } from './EnemySpawnLogic';


export function updateEnemies(state: GameState, onEvent?: (event: string, data?: any) => void, step: number = 1 / 60) {
    const { enemies, player, gameTime } = state;
    const { shapeDef, pulseDef } = getProgressionParams(gameTime);

    // Spawning Logic
    const minutes = gameTime / 60;

    // Tiered Spawn Rate Scaling (User Request)
    // 0-10m: +0.2/min
    // 10-20m: +0.3/min (+2.0 total from previous)
    // 20m+: +0.4/min (+5.0 total from previous)
    let addedRate = 0;
    if (minutes <= 10) {
        addedRate = minutes * 0.2;
    } else if (minutes <= 20) {
        addedRate = (10 * 0.2) + ((minutes - 10) * 0.3);
    } else {
        addedRate = (10 * 0.2) + (10 * 0.3) + ((minutes - 20) * 0.4);
    }

    const baseSpawnRate = GAME_CONFIG.ENEMY.BASE_SPAWN_RATE + addedRate;
    let actualRate = baseSpawnRate * shapeDef.spawnWeight;

    // Extraction Rage Spawn Growth
    if (['active', 'arriving', 'arrived'].includes(state.extractionStatus) && state.extractionStartTime) {
        const extractionElapsed = state.gameTime - state.extractionStartTime;
        const rageGrowth = Math.floor(extractionElapsed / 15) * 0.15; // +0.15 spawn rate every 15s
        actualRate += rageGrowth;
    }

    if (state.currentArena === 1) actualRate *= 1.15; // +15% Spawn Rate in Combat Hex

    // Extraction Spawn Scaling (Faster and faster)
    if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        actualRate *= (state.extractionPowerMult || 1.0);
    }

    if (Math.random() < actualRate / 60 && state.portalState !== 'transferring') {
        spawnEnemy(state);
    }

    // Rare Spawning Logic
    if (state.portalState !== 'transferring' && state.extractionStatus === 'none') {
        manageRareSpawnCycles(state);
    }

    // --- PRISM GLITCHER RANDOM SPAWN ---
    // After 10 minutes, 15% chance to schedule a spawn for a random second within that minute window
    if (state.glitcherLastCheckedMinute === undefined) state.glitcherLastCheckedMinute = 9; // Start checking from minute 10
    const currentMinute = Math.floor(gameTime / 60);

    const glitcherAlive = state.enemies.some(e => e.shape === 'glitcher' && !e.dead);

    if (currentMinute > state.glitcherLastCheckedMinute && !state.glitcherScheduledSpawnTime && !glitcherAlive && currentMinute >= 10) {
        state.glitcherLastCheckedMinute = currentMinute;

        // 15% chance per minute window (e.g. 10-11m, 12-13m)
        if (Math.random() < 0.15) {
            const randomSeconds = Math.random() * 60;
            const spawnTime = currentMinute * 60 + randomSeconds;
            state.glitcherScheduledSpawnTime = spawnTime;
            // console.log(`[GLITCHER] Scheduled for minute ${currentMinute}: at ${Math.floor(randomSeconds)}s`);
        }
    }

    // Execute scheduled glitcher spawn
    if (state.glitcherScheduledSpawnTime && gameTime >= state.glitcherScheduledSpawnTime) {
        // Only spawn if another one didn't appear somehow (rare)
        if (!glitcherAlive) {
            const p = state.player;
            const angle = Math.random() * Math.PI * 2;
            const dToPlayer = 1200; // Spawn far away (standard enemy distance)
            const spawnX = p.x + Math.cos(angle) * dToPlayer;
            const spawnY = p.y + Math.sin(angle) * dToPlayer;

            spawnEnemy(state, spawnX, spawnY, 'glitcher');
            console.log(`[GLITCHER] Spawn triggered at scheduled time ${gameTime.toFixed(1)}s (Dist: 1200px)`);
        }
        state.glitcherScheduledSpawnTime = undefined;
    }

    // --- VOID BURROWER RANDOM SPAWN ---
    // After 5 minutes, 8% chance per minute to schedule a spawn
    if (state.wormLastCheckedMinute === undefined) state.wormLastCheckedMinute = 4; // Start checking from minute 5

    const wormAlive = state.enemies.some(e => e.shape === 'worm' && !e.dead);

    if (currentMinute > state.wormLastCheckedMinute && !state.wormScheduledSpawnTime && !wormAlive && currentMinute >= 5) {
        state.wormLastCheckedMinute = currentMinute;

        if (Math.random() < 0.08) { // 8% chance
            const randomSeconds = Math.random() * 60;
            const spawnTime = currentMinute * 60 + randomSeconds;
            state.wormScheduledSpawnTime = spawnTime;
            console.log(`[WORM] Scheduled for minute ${currentMinute}: at ${Math.floor(randomSeconds)}s`);
        }
    }

    // Execute scheduled worm spawn
    if (state.wormScheduledSpawnTime && gameTime >= state.wormScheduledSpawnTime) {
        if (!wormAlive) {
            const p = state.player;
            const angle = Math.random() * Math.PI * 2;
            const distance = 800 + Math.random() * 300; // Spawn further away to orbit
            const spawnX = p.x + Math.cos(angle) * distance;
            const spawnY = p.y + Math.sin(angle) * distance;

            spawnEnemy(state, spawnX, spawnY, 'worm');
            playSfx('warning'); // Sound cue for boss-like unique
            spawnFloatingNumber(state, p.x, p.y, 'VOID BURROWER DETECTED', '#ff0000', true);
        }
        state.wormScheduledSpawnTime = undefined;
    }

    // Boss Spawning (Scheduled)
    if (gameTime >= state.nextBossSpawnTime && state.portalState !== 'transferring' && state.extractionStatus === 'none') {
        const minutesRaw = gameTime / 60;
        const current10MinCycle = Math.floor(minutesRaw / 10);

        // Determine tier (1, 2, or 3+)
        const tier = Math.min(3, current10MinCycle + 1);

        spawnEnemy(state, undefined, undefined, undefined, true, tier);

        // Calculate next spawn time in the schedule: [2, 4, 6, 8, 10] (5 bosses per tier, every 2 minutes)
        const schedule = [2, 4, 6, 8, 10];
        const currentMinuteInCycle = minutesRaw % 10;

        let nextMinuteInCycle = -1;
        for (const m of schedule) {
            if (m > currentMinuteInCycle + 0.01) { // Add small epsilon to avoid immediate re-spawn
                nextMinuteInCycle = m;
                break;
            }
        }

        if (nextMinuteInCycle !== -1) {
            state.nextBossSpawnTime = (current10MinCycle * 10 + nextMinuteInCycle) * 60;
        } else {
            // Move to next 10-min cycle
            state.nextBossSpawnTime = ((current10MinCycle + 1) * 10 + schedule[0]) * 60;
        }
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

        // --- Legion Formation Center Search ---
        let formationCenterX = state.player.x;
        let formationCenterY = state.player.y;
        let foundSafePos = false;

        const playerArena = getArenaIndex(state.player.x, state.player.y);

        // 1. Try to find a spot ~1500-1800px away from player
        for (let attempt = 0; attempt < 100; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1500 + Math.random() * 300;
            const tx = state.player.x + Math.cos(angle) * dist;
            const ty = state.player.y + Math.sin(angle) * dist;

            // Constraint: Must be in same arena AND 500px from any wall
            if (getArenaIndex(tx, ty) === playerArena) {
                const { dist: wallDist } = getHexDistToWall(tx, ty);
                if (wallDist >= 500) {
                    formationCenterX = tx;
                    formationCenterY = ty;
                    foundSafePos = true;
                    break;
                }
            }
        }

        // 2. Fallback: Search anywhere in the player's arena if player-relative search fails
        if (!foundSafePos) {
            for (let attempt = 0; attempt < 200; attempt++) {
                const pos = getRandomPositionInArena(playerArena);
                const dToPlayer = Math.hypot(pos.x - state.player.x, pos.y - state.player.y);
                const { dist: wallDist } = getHexDistToWall(pos.x, pos.y);

                if (dToPlayer >= 1500 && wallDist >= 500) {
                    formationCenterX = pos.x;
                    formationCenterY = pos.y;
                    foundSafePos = true;
                    break;
                }
            }
        }

        // 3. Final Fallback: Use standard arena random (at least we are in a hex)
        if (!foundSafePos) {
            const fallback = getRandomPositionInArena(playerArena);
            formationCenterX = fallback.x;
            formationCenterY = fallback.y;
        }

        // Scaling (Matching EnemySpawnLogic.ts)
        const minutes = state.gameTime / 60;
        const cycleCount = Math.floor(minutes / 5);
        const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
        const hpMult = Math.pow(1.65, cycleCount) * shapeDef.hpMult;
        const baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult; // User formula: 60 base, 1.2 exponential, 1.65 cycle multiplier
        const finalHp = baseHp * hpMult;

        const sharedShield = (finalHp * 30) * 1.0; // 100% of combined HP (User Request)

        for (let i = 0; i < 30; i++) {
            const slotX = i % 6 - 2.5; // Center the 6 columns (-2.5 to 2.5)
            const slotY = Math.floor(i / 6) - 2; // Center the 5 rows (-2 to 2)
            const spacing = 20 * shapeDef.sizeMult * 2.5;

            const newUnit: Enemy = {
                id: Math.random(),
                type: 'hexagon', // Legion is always hexagon
                shape: 'hexagon',
                x: formationCenterX + (slotX * spacing),
                y: formationCenterY + (slotY * spacing),
                size: 20 * shapeDef.sizeMult,
                hp: finalHp,
                maxHp: finalHp,
                spd: 2.4 * shapeDef.speedMult,
                boss: false,
                bossType: 0,
                bossAttackPattern: 0,
                lastAttack: state.gameTime,
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

        if (!e.isNeutral && !e.isRare && !e.isNecroticZombie && e.shape !== 'worm' && e.shape !== 'glitcher') {
            const eventPalette = getEventPalette(state);
            e.eraPalette = eventPalette || params.eraPalette.colors;
        } else if (e.shape === 'worm') {
            // Hard enforce worm palette to be safe
            e.eraPalette = undefined; // Force it to use its unique palette
        }

        // Particle Leakage (Starts at 30m, stronger at 60m+)
        const minutes = gameTime / 60;
        if (minutes > 30 && !e.isNeutral) {
            const isLate = minutes > 60;
            const chance = isLate ? 8 : 24; // More frequent later
            if (state.frameCount % chance === 0) {
                const count = isLate ? 3 : 1;
                const size = isLate ? 20 : 15;
                const life = isLate ? 26 : 18;
                spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], count, size, life, 'void');
            }
        }

        // --- ZOMBIE LOGIC ---
        if (e.isZombie) {
            updateZombie(e, state, step, onEvent);
            return;
        }

        if (e.shape === 'worm') {
            updateVoidBurrower(e, state, step, onEvent);
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
                            let dmgDealt = actualDmg;

                            // --- LEGION SHIELD LOGIC FOR DOT ---
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                                    const shieldAbsorp = Math.min(dmgDealt, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldAbsorp;
                                    dmgDealt -= shieldAbsorp;

                                    if (shieldAbsorp > 0) {
                                        const themeColor = getPlayerThemeColor(state);
                                        spawnFloatingNumber(state, e.x, e.y, Math.round(shieldAbsorp).toString(), '#60a5fa', false);
                                        spawnParticles(state, e.x, e.y, '#60a5fa', 1);
                                    }
                                }
                            }

                            if (dmgDealt > 0) {
                                e.hp -= dmgDealt;
                                player.damageDealt += dmgDealt;
                                const themeColor = getPlayerThemeColor(state);
                                spawnFloatingNumber(state, e.x, e.y, Math.round(dmgDealt).toString(), themeColor, false);
                                spawnParticles(state, e.x, e.y, themeColor, 1);
                            }

                            e.infectionAccumulator -= actualDmg;
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
            } else if (e.shape === 'snitch') {
                // Snitch enemies don't die from walls
                const { dist, normal } = getHexDistToWall(e.x, e.y);
                e.x += normal.x * (Math.abs(dist) + 50);
                e.y += normal.y * (Math.abs(dist) + 50);
                return;
            } else if (e.legionId) {
                // Legion members don't die from walls
                const { dist, normal } = getHexDistToWall(e.x, e.y);
                e.x += normal.x * (Math.abs(dist) + 50);
                e.y += normal.y * (Math.abs(dist) + 50);
                return;
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

        // Blueprint: Stasis Field (-20% Movement Speed)
        if (isBuffActive(state, 'STASIS_FIELD')) {
            currentSpd *= 0.8;
        }

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
        } else if (e.shape === 'glitcher') {
            v = updatePrismGlitcher(e, state, step);
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
                case 'circle': v = updateNormalCircle(e, state, dx, dy, currentSpd, pushX, pushY); break;
                case 'triangle': v = updateNormalTriangle(e, state, dx, dy, pushX, pushY); break;
                case 'square': v = updateNormalSquare(currentSpd, dx, dy, pushX, pushY); break;
                case 'hexagon': v = updateNormalSquare(currentSpd, dx, dy, pushX, pushY); break; // Hexagons use square movement (steady chase)
                case 'diamond': v = updateNormalDiamond(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
                case 'pentagon': v = updateNormalPentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
            }
        }

        // --- SMART AI: FLANKING LOGIC ---
        if (e.isFlanker && !e.boss && !e.legionId && !e.isRare && e.shape !== 'minion' && !e.isZombie) {
            // Only override if not already in a special maneuver (like triangle dash or elite skill)
            const isSpecialManeuver = e.dashState === 1 || (e.isElite && e.eliteState && e.eliteState > 0) || e.summonState === 1;

            if (!isSpecialManeuver) {
                const flankV = getFlankingVelocity(e, state, targetX, targetY, currentSpd, pushX, pushY);
                v.vx = flankV.vx;
                v.vy = flankV.vy;
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

                // Safety Clamp: Never jump more than 100px/frame
                if (Math.abs(vx) > 100) vx = Math.sign(vx) * 100;
                if (Math.abs(vy) > 100) vy = Math.sign(vy) * 100;

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
                // Real snitches get special center-bouncing behavior
                const c = ARENA_CENTERS[0];
                const a = Math.atan2(c.y - e.y, c.x - e.x);
                e.x += Math.cos(a) * 50; e.y += Math.sin(a) * 50;
            } else if (e.shape === 'snitch') {
                // Regular snitch enemies don't die from walls - bounce them back
                const { dist, normal } = getHexDistToWall(e.x, e.y);
                e.x += normal.x * (Math.abs(dist) + 50);
                e.y += normal.y * (Math.abs(dist) + 50);
            } else if (e.legionId) {
                // Double check for legion wall safety (e.g. lead chase logic)
                const { dist, normal } = getHexDistToWall(e.x, e.y);
                e.x += normal.x * (Math.abs(dist) + 50);
                e.y += normal.y * (Math.abs(dist) + 50);
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

// ... (context)
export function resetEnemyAggro(state: GameState) {
    state.enemies.forEach(e => {
        // Reset Elite States
        if (e.isElite) {
            e.eliteState = 0;
            e.timer = state.gameTime + 1.0; // Force a delay before stalking again
            e.lastAttack = state.gameTime;
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
            e.lastAttack = state.gameTime;
            e.hasHitThisBurst = false;
        }
    });
}

