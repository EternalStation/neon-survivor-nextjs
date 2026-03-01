import type { GameState, Enemy } from '../core/types';
import { relocatePOI } from '../mission/MapLogic';
import { playSfx } from '../audio/AudioLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { getProgressionParams, spawnEnemy, manageRareSpawnCycles, getCycleHpMult } from './EnemySpawnLogic';
import { scanForMerges, manageMerges } from './EnemyMergeLogic';
import { spawnVoidBurrower } from './WormLogic';
import { getArenaIndex, getHexDistToWall, getRandomPositionInArena } from '../mission/MapLogic';

export function handleWorldSystems(state: GameState, step: number): { bhPullSpeed: number, overclockActive: boolean } {
    const blackholes = state.areaEffects.filter(ae => ae.type === 'blackhole');
    let bhPullSpeed = 0;
    if (blackholes.length > 0) {
        const resonance = getChassisResonance(state);
        bhPullSpeed = (0.66 + (resonance * 0.85));
    }

    // --- ARENA TRANSITION: POI RESET ---
    if (state.lastArena === undefined) state.lastArena = state.currentArena;
    if (state.lastArena !== state.currentArena) {
        state.lastArena = state.currentArena;
        state.pois.forEach(poi => {
            if (poi.arenaId === state.currentArena && poi.type !== 'turret') {
                poi.respawnTimer = 0;
                poi.active = (poi.type === 'anomaly');
                poi.progress = 0;
                poi.activationProgress = 0;
                poi.activeDuration = 0;
            }
        });
    }

    // --- POI EFFECTS: Overclock ---
    let overclockActive = false;
    state.pois.forEach(poi => {
        if (poi.type === 'overclock') {
            if (poi.respawnTimer > 0) {
                poi.respawnTimer -= step;
                if (poi.respawnTimer <= 0) {
                    poi.respawnTimer = 0;
                }
                return;
            }

            if (poi.cooldown > 0) {
                poi.cooldown -= step;
                if (poi.cooldown <= 0) {
                    poi.cooldown = 0;
                    // Relocate to a new random position after cooldown
                    relocatePOI(poi);
                    poi.active = false;
                    poi.activationProgress = 0;
                }
            }

            const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
            let inRange = false;
            players.forEach(p => {
                const d = Math.hypot(p.x - poi.x, p.y - poi.y);
                if (d < poi.radius) inRange = true;
            });

            if (poi.active) {
                overclockActive = true;
                poi.activeDuration += step;
                if (!inRange || poi.activeDuration >= 30) {
                    poi.active = false;
                    playSfx('power-down');
                    poi.activeDuration = 0;
                    poi.activationProgress = 0;
                    poi.cooldown = 60;
                }
            } else if (poi.cooldown === 0) {
                if (inRange) {
                    poi.activationProgress += step * 20;
                    if (poi.activationProgress >= 100) {
                        poi.active = true;
                        poi.activationProgress = 100;
                        poi.activeDuration = 0;
                        playSfx('power-up');
                        spawnFloatingNumber(state, poi.x, poi.y, "OVERCLOCK ACTIVE", '#22d3ee', true);
                    }
                } else {
                    if (poi.activationProgress > 0) {
                        poi.activationProgress -= step * 40;
                        if (poi.activationProgress < 0) poi.activationProgress = 0;
                    }
                }
            }
        }
    });

    // --- POI EFFECTS: Anomaly Summoning ---
    state.pois.forEach(poi => {
        if (poi.type === 'anomaly') {
            if (poi.respawnTimer > 0) {
                poi.respawnTimer -= step;
                if (poi.respawnTimer <= 0) poi.respawnTimer = 0;
                return;
            }

            if (poi.cooldown > 0) {
                poi.cooldown -= step;
                if (poi.cooldown <= 0) {
                    poi.cooldown = 0;
                    // Relocate to new random position after cooldown
                    relocatePOI(poi);
                    poi.active = true; // Anomaly starts active after relocate
                    poi.progress = 0;
                }
            }

            const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
            let inRange = false;
            let nearestPlayer: any = players[0];
            let nearestDist = Infinity;
            players.forEach(p => {
                const d = Math.hypot(p.x - poi.x, p.y - poi.y);
                if (d < poi.radius) inRange = true;
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestPlayer = p;
                }
            });

            if (poi.anomalySpawnDelay !== undefined && poi.anomalySpawnDelay > 0) {
                poi.anomalySpawnDelay -= step;
                if (poi.anomalySpawnDelay <= 0) {
                    poi.anomalySpawnDelay = undefined;
                    const tier = poi.anomalySpawnTier || 1;
                    poi.anomalySpawnTier = undefined;
                    const boss = spawnEnemy(state, poi.x, poi.y, undefined, true, tier, true);
                    if (boss) {
                        boss.shape = 'abomination';
                        boss.isAnomaly = true;
                        boss.spawnGracePeriod = 0.5;
                        state.anomalyBossCount = (state.anomalyBossCount || 0) + 1;
                    }
                    poi.active = true;
                    poi.cooldown = 60;
                    poi.progress = 0;
                }
            }

            if (poi.active && poi.cooldown === 0 && inRange) {
                poi.progress += step * 10.0;
                if (poi.progress >= 100) {
                    const minutesRaw = state.gameTime / 60;
                    const current10MinCycle = Math.floor(minutesRaw / 10);
                    const tier = Math.min(3, current10MinCycle + 1);

                    const pushAngle = Math.atan2(nearestPlayer.y - poi.y, nearestPlayer.x - poi.x);
                    nearestPlayer.knockback.x = Math.cos(pushAngle) * 65;
                    nearestPlayer.knockback.y = Math.sin(pushAngle) * 65;

                    spawnFloatingNumber(state, poi.x, poi.y, "ANOMALY SUMMONED", '#ef4444', true);
                    playSfx('warning');

                    poi.anomalySpawnDelay = 0.2;
                    poi.anomalySpawnTier = tier;
                    poi.progress = 0;
                }
            } else if (poi.progress > 0) {
                poi.progress -= step * 2.5;
                if (poi.progress < 0) poi.progress = 0;
            }
        }
    });

    return { bhPullSpeed, overclockActive };
}

export function handleSpawnExecution(state: GameState, overclockActive: boolean, step: number) {
    const { gameTime } = state;
    const { shapeDef } = getProgressionParams(gameTime);
    const minutes = gameTime / 60;

    let addedRate = 0;
    const fullCycles = Math.floor(minutes / 5);
    for (let i = 0; i < fullCycles; i++) {
        addedRate += 1.0 * (i + 1);
    }
    const currentCycleRate = 0.2 * (fullCycles + 1);
    addedRate += (minutes % 5) * currentCycleRate;

    const baseSpawnRate = GAME_CONFIG.ENEMY.BASE_SPAWN_RATE + addedRate;
    let actualRate = baseSpawnRate * shapeDef.spawnWeight;

    if (['active', 'arriving', 'arrived'].includes(state.extractionStatus) && state.extractionStartTime) {
        const extractionElapsed = state.gameTime - state.extractionStartTime;
        const rageGrowth = Math.floor(extractionElapsed / 15) * 0.15;
        actualRate += rageGrowth;
    }

    if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        actualRate *= (state.extractionPowerMult || 1.0);
    }

    if (overclockActive) {
        actualRate *= 2.0;
    }

    const spawnChancePerFrame = actualRate * step * (state.gameSpeedMult ?? 1);
    let spawnsToExecute = Math.floor(spawnChancePerFrame);
    if (Math.random() < (spawnChancePerFrame - spawnsToExecute)) spawnsToExecute++;

    for (let i = 0; i < spawnsToExecute; i++) {
        if (state.portalState !== 'transferring') {
            spawnEnemy(state);
        }
    }
}

export function handleScheduledSpawns(state: GameState) {
    const { gameTime } = state;
    const currentMinute = Math.floor(gameTime / 60);

    // Rare Spawning Logic
    if (state.portalState !== 'transferring' && state.extractionStatus === 'none') {
        manageRareSpawnCycles(state);
    }

    // --- PRISM GLITCHER RANDOM SPAWN ---
    if (state.glitcherLastCheckedMinute === undefined) state.glitcherLastCheckedMinute = 9;
    const glitcherAlive = state.enemies.some(e => e.shape === 'glitcher' && !e.dead);
    if (currentMinute > state.glitcherLastCheckedMinute && !state.glitcherScheduledSpawnTime && !glitcherAlive && currentMinute >= 10) {
        state.glitcherLastCheckedMinute = currentMinute;
        if (Math.random() < 0.15) {
            state.glitcherScheduledSpawnTime = currentMinute * 60 + Math.random() * 60;
        }
    }
    if (state.glitcherScheduledSpawnTime && gameTime >= state.glitcherScheduledSpawnTime) {
        if (!glitcherAlive) {
            const p = state.player;
            const angle = Math.random() * Math.PI * 2;
            const dToPlayer = 1200;
            const spawnX = p.x + Math.cos(angle) * dToPlayer;
            const spawnY = p.y + Math.sin(angle) * dToPlayer;
            spawnEnemy(state, spawnX, spawnY, 'glitcher');
        }
        state.glitcherScheduledSpawnTime = undefined;
    }

    // --- VOID BURROWER RANDOM SPAWN ---
    if (state.wormLastCheckedMinute === undefined) state.wormLastCheckedMinute = 4;
    const wormAlive = state.enemies.some(e => e.shape === 'worm' && !e.dead);
    if (currentMinute > state.wormLastCheckedMinute && !state.wormScheduledSpawnTime && !wormAlive && currentMinute >= 5) {
        state.wormLastCheckedMinute = currentMinute;
        if (Math.random() < 0.08) {
            state.wormScheduledSpawnTime = currentMinute * 60 + Math.random() * 60;
        }
    }
    if (state.wormScheduledSpawnTime && gameTime >= state.wormScheduledSpawnTime) {
        if (!wormAlive) {
            const p = state.player;
            const angle = Math.random() * Math.PI * 2;
            const distance = 2000 + Math.random() * 200;
            const spawnX = p.x + Math.cos(angle) * distance;
            const spawnY = p.y + Math.sin(angle) * distance;
            spawnVoidBurrower(state, spawnX, spawnY);
            playSfx('warning');
            spawnFloatingNumber(state, p.x, p.y, 'VOID BURROWER DETECTED', '#ff0000', true);
        }
        state.wormScheduledSpawnTime = undefined;
    }

    // Boss Spawning (Scheduled)
    if (gameTime >= state.nextBossSpawnTime && state.portalState !== 'transferring' && state.extractionStatus === 'none') {
        const minutesRaw = gameTime / 60;
        const current10MinCycle = Math.floor(minutesRaw / 10);
        const tier = Math.min(4, current10MinCycle + 1);
        spawnEnemy(state, undefined, undefined, undefined, true, tier);

        const schedule = [1.75, 3.75, 5.75, 7.75, 9.75];
        const currentMinuteInCycle = minutesRaw % 10;
        let nextMinuteInCycle = -1;
        for (const m of schedule) {
            if (m > currentMinuteInCycle + 0.01) {
                nextMinuteInCycle = m;
                break;
            }
        }
        if (nextMinuteInCycle !== -1) {
            state.nextBossSpawnTime = (current10MinCycle * 10 + nextMinuteInCycle) * 60;
        } else {
            state.nextBossSpawnTime = ((current10MinCycle + 1) * 10 + schedule[0]) * 60;
        }
    }
}

export function handleLegionAndMerges(state: GameState, step: number) {
    // --- LEGION CACHING (Optimization) ---
    const legionGroups = new Map<string, { lead: Enemy | null, members: Enemy[] }>();
    state.legionLeads = {};
    state.enemies.forEach(e => {
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

        let formationCenterX = state.player.x;
        let formationCenterY = state.player.y;
        let foundSafePos = false;
        const playerArena = getArenaIndex(state.player.x, state.player.y);

        for (let attempt = 0; attempt < 100; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 1500 + Math.random() * 300;
            const tx = state.player.x + Math.cos(angle) * dist;
            const ty = state.player.y + Math.sin(angle) * dist;
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

        if (!foundSafePos) {
            const fallback = getRandomPositionInArena(playerArena);
            formationCenterX = fallback.x;
            formationCenterY = fallback.y;
        }

        const minutes = state.gameTime / 60;
        const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
        const hpMult = getCycleHpMult(state.gameTime) * shapeDef.hpMult;
        const baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;
        const finalHp = baseHp * hpMult;
        const sharedShield = (finalHp * 30) * 1.0;

        for (let i = 0; i < 30; i++) {
            const slotX = i % 6 - 2.5;
            const slotY = Math.floor(i / 6) - 2;
            const spacing = 20 * shapeDef.sizeMult * 2.5;

            const newUnit: Enemy = {
                id: Math.random(),
                type: 'hexagon',
                shape: 'hexagon',
                x: formationCenterX + (slotX * spacing),
                y: formationCenterY + (slotY * spacing),
                size: 20 * shapeDef.sizeMult,
                hp: finalHp,
                maxHp: finalHp,
                spd: state.player.speed * shapeDef.speedMult,
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
                legionLeadId: 0,
                legionSlot: { x: slotX, y: slotY },
                legionShield: sharedShield,
                maxLegionShield: sharedShield,
                legionReady: true,
                wasInLegion: true,
                legionCenter: { x: formationCenterX, y: formationCenterY }
            };
            state.enemies.push(newUnit);
        }

        const lead = state.enemies.filter(e => e.legionId === legionId)[0];
        if (lead) {
            state.enemies.filter(e => e.legionId === legionId).forEach(m => m.legionLeadId = lead.id);
            if (!state.legionLeads) state.legionLeads = {};
            state.legionLeads[legionId] = lead;
        }
    }

    // --- MERGING LOGIC ---
    const anyLegionAlive = activeLegionIds.length > 0;
    const compromisedMergeIds = new Set<string>();
    state.enemies.forEach(e => {
        if (e.legionId && e.mergeId) compromisedMergeIds.add(e.mergeId);
    });

    if (compromisedMergeIds.size > 0) {
        state.enemies.forEach(e => {
            if (e.mergeId && compromisedMergeIds.has(e.mergeId)) {
                e.mergeState = undefined;
                e.mergeId = undefined;
                e.mergeTimer = undefined;
                e.mergeHost = undefined;
            }
        });
    }

    if (state.activeEvent?.type !== 'legion_formation' && !anyLegionAlive) {
        manageMerges(state);
        if (Math.floor(state.gameTime * 60) % 30 === 0) {
            scanForMerges(state);
        }
    }
}
