import type { GameState, Enemy, ShapeType } from '../core/types';
import { TutorialStep } from '../core/types';
import { playSfx } from '../audio/AudioLogic';
import { getLegendaryOptions, getHexLevel, calculateLegendaryBonus, getHexMultiplier, recordLegendarySouls } from '../upgrades/LegendaryLogic';
import { trySpawnMeteorite, createMeteorite, spawnVoidFlux, spawnDustPile } from './LootLogic';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { trySpawnBlueprint, dropBlueprint } from '../upgrades/BlueprintLogic';
import { handleVoidBurrowerDeath } from '../enemies/WormLogic';
import { getUiTranslation } from '../../lib/uiTranslations';
import { getStoredLanguage } from '../../lib/LanguageContext';

export function handleEnemyDeath(state: GameState, e: Enemy, onEvent?: (event: string, data?: any) => void) {
    if (e.dead) return;

    if (e.shape === 'worm') {
        handleVoidBurrowerDeath(state, e, onEvent);
    }

    // --- PHALANX DRONE DEATH TRANSFER ---
    if (e.isPhalanxDrone && e.soulLinkHostId) {
        const host = state.enemies.find(h => h.id === e.soulLinkHostId);
        if (host && !host.dead) {
            // Give a massive burst to boss if drone is somehow killed
            // Drones have 1,000,000 HP, so 1% is 10k. 
            // Let's just deal a flat significant % or a standard amount.
            const deathPenalty = host.maxHp * 0.05; // 5% of Boss Max HP as penalty
            host.hp -= deathPenalty;
            spawnFloatingNumber(state, host.x, host.y, `PHALANX BREACH -${Math.round(deathPenalty)}`, '#ef4444', true);
            playSfx('rare-kill');
        }
    }

    if (e.temporalMonolithExplosive && e.hp <= 0 && !e.boss) {
        const mult = getHexMultiplier(state, 'TemporalMonolith');
        const aoeDmg = e.maxHp * 0.25 * mult;
        const radius = 200 * mult;

        state.player.temporalMonolithSouls = (state.player.temporalMonolithSouls || 0) + 1;

        state.enemies.forEach(other => {
            if (!other.dead && other.id !== e.id) {
                const dist = Math.hypot(other.x - e.x, other.y - e.y);
                if (dist <= radius) {
                    other.hp -= aoeDmg;
                    spawnFloatingNumber(state, other.x, other.y, Math.round(aoeDmg).toString(), '#38bdf8', true);
                    if (other.hp <= 0) {
                        state.player.temporalMonolithSouls = (state.player.temporalMonolithSouls || 0) + 1;
                    }
                }
            }
        });
        spawnFloatingNumber(state, e.x, e.y, 'TEMPORAL SHATTER', '#38bdf8', true);
        state.areaEffects.push({
            id: Math.random(),
            type: 'temporal_burst',
            x: e.x,
            y: e.y,
            radius: radius,
            duration: 0.2,
            creationTime: state.gameTime,
            level: 1
        });
    }

    e.dead = true; e.hp = 0;

    // Soul Reward Multipliers (Kill Count)
    let baseSouls = 1;
    if (e.soulRewardMult !== undefined) {
        baseSouls = e.soulRewardMult;
    } else if (e.isElite) {
        baseSouls = e.shape === 'pentagon' ? 5 : 10; // 5 for pentagons, 10 for others (10-merge)
    } else if (e.shape === 'worm' && e.wormRole === 'head') {
        baseSouls = 50; // Big reward for head
    }

    // Apply Eco Buff (Only affects Legendary scaling, not displayed kill count)
    const soulCount = baseSouls * state.xpSoulBuffMult;

    // SOUL-SHATTER CORE: Execute multiplier (Static 5x)
    let finalSoulCount = soulCount;
    const shatterLvl = getHexLevel(state, 'SoulShatterCore');
    if (shatterLvl > 0 && e.isExecuted) {
        finalSoulCount = soulCount * 5;
    }

    state.killCount += soulCount;
    state.score += soulCount;
    recordLegendarySouls(state, soulCount);

    // --- GRAVITATIONAL HARVEST: Duration Extension ---
    const harvestLvl = getHexLevel(state, 'GravitationalHarvest');
    if (harvestLvl > 0) {
        // Check if killed within an epicenter
        const epi = state.areaEffects.find(ae => ae.type === 'epicenter' && Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius);
        if (epi) {
            const extension = 0.1; // 0.1 seconds per kill
            epi.duration += extension;
            // Also extend player's skill active state if possible
            const skill = state.player.activeSkills.find(s => s.type === 'GravitationalHarvest');
            if (skill && skill.duration !== undefined) {
                skill.duration += extension;
            }
        }
    }

    // Add to SoulShatter pool
    if (shatterLvl > 0) {
        state.player.soulShatterSouls = (state.player.soulShatterSouls || 0) + finalSoulCount;
    }

    // Track unbuffed kills for HUD
    if (state.rawKillCount === undefined) {
        state.rawKillCount = 0;
    }
    state.rawKillCount += baseSouls;



    // --- Void Flux Currency Drops ---
    let fluxDrop = 0;
    const minutes = state.gameTime / 60;

    // --- XENO-ALCHEMIST: Refinery Bonus (300% / 4x) ---
    let refineryBonus = 1.0;
    const alchemyHex = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
    if (alchemyHex) {
        const playerInPuddle = state.areaEffects.some(ae => ae.type === 'puddle' && Math.hypot(ae.x - state.player.x, ae.y - state.player.y) < ae.radius);
        const enemyInPuddle = state.areaEffects.some(ae => ae.type === 'puddle' && Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius + e.size);
        if (playerInPuddle || enemyInPuddle) {
            refineryBonus = 4.0;
        }
    }

    if (e.boss) {
        // Optimized: Scale with time to match increasing reroll costs
        // Base: 100 | Time: +15 per min | Random: +/- 15
        const timeScaling = Math.floor(minutes * 15);
        const variance = Math.floor(Math.random() * 31) - 15; // -15 to +15
        fluxDrop = Math.max(50, 100 + timeScaling + variance);
    } else if (e.isElite) {
        // Optimized: Scale with time
        // Base: 25 | Time: +5.0 per min | Random: +/- 4
        const timeScaling = Math.floor(minutes * 5.0);
        const variance = Math.floor(Math.random() * 9) - 4; // -4 to +4
        fluxDrop = Math.max(15, 25 + timeScaling + variance);
    }

    if (fluxDrop > 0) {
        fluxDrop *= refineryBonus;
        spawnVoidFlux(state, e.x, e.y, fluxDrop);
    }

    // --- 3% Dust Drop ---
    if (Math.random() < 0.03) {
        const dustAmount = (e.isElite ? 5 : 1) * refineryBonus;
        spawnDustPile(state, e.x, e.y, dustAmount);
    }

    // --- EcoXP Lvl 2: Dust Extraction ---
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP' || h?.type === 'XenoAlchemist' || h?.type === 'NeuralSingularity');
    if (ecoXp && ecoXp.level >= 2) {
        const kl = ecoXp.killsAtLevel?.[2] ?? ecoXp.killsAtAcquisition;
        const killsSinceLvl2 = state.killCount - kl;
        const prevKillsSinceLvl2 = killsSinceLvl2 - soulCount;

        const currentThresholds = Math.floor(killsSinceLvl2 / 50);
        const prevThresholds = Math.floor(prevKillsSinceLvl2 / 50);

        if (currentThresholds > prevThresholds && killsSinceLvl2 > 0) {
            const multiplier = getHexMultiplier(state, ecoXp.type);
            const dustAmount = (currentThresholds - prevThresholds) * 1 * multiplier;
            state.player.dust += dustAmount;
            playSfx('socket-place');
            spawnFloatingNumber(state, e.x, e.y, `+${dustAmount.toFixed(1)} DUST`, '#a855f7', false);
        }
    }

    // --- EcoXP Lvl 3: Flux Extraction ---
    if (ecoXp && ecoXp.level >= 3) {
        const kl = ecoXp.killsAtLevel?.[3] ?? ecoXp.killsAtAcquisition;
        const killsSinceLvl3 = state.killCount - kl;
        const prevKillsSinceLvl3 = killsSinceLvl3 - soulCount;

        const currentThresholds = Math.floor(killsSinceLvl3 / 10);
        const prevThresholds = Math.floor(prevKillsSinceLvl3 / 10);

        if (currentThresholds > prevThresholds && killsSinceLvl3 > 0) {
            const multiplier = getHexMultiplier(state, ecoXp.type);
            const fluxAmount = (currentThresholds - prevThresholds) * 5 * multiplier; // 10 kills * 0.5 = 5 Flux
            state.player.isotopes += fluxAmount;
            playSfx('socket-place');
            spawnFloatingNumber(state, e.x, e.y, `+${fluxAmount.toFixed(0)} FLUX`, '#a855f7', false);
        }
    }

    // --- CLASS MODIFIER: Hive-Mother Nanite Spread ---
    if (e.isInfected) {
        const resonance = getChassisResonance(state);
        const multiplier = 1 + resonance;
        const totalInfectionRate = 30 * multiplier;

        let jumpCount = Math.floor(totalInfectionRate / 100);
        const jumpChance = (totalInfectionRate % 100) / 100;
        if (Math.random() < jumpChance) jumpCount++;

        if (jumpCount > 0) {
            // Find multiple nearest enemies
            const candidates = state.enemies
                .filter(other => !other.dead && other.id !== e.id && !other.isFriendly)
                .map(other => ({
                    enemy: other,
                    dist: Math.hypot(other.x - e.x, other.y - e.y)
                }))
                .filter(c => c.dist < 400)
                .sort((a, b) => a.dist - b.dist);

            const targets = candidates.slice(0, jumpCount);

            targets.forEach(t => {
                const other = t.enemy;
                // Spawn Nanite Projectile
                state.bullets.push({
                    id: Math.random(),
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 2, // Initial Jitter
                    vy: (Math.random() - 0.5) * 2,
                    dmg: e.infectionDmg || 5, // Carry over damage (already adjusted to per-tick in ProjectileLogic)
                    pierce: 1,
                    life: 120, // 2 Seconds to find target
                    isEnemy: false,
                    hits: new Set([e.id]),
                    color: '#4ade80',
                    size: 4,
                    isNanite: true,
                    naniteTargetId: other.id
                });
            });
        }
    }

    // Tutorial Force Drop: If waiting for first meteorite and none exist and time > 60s
    if (state.tutorial.isActive &&
        state.tutorial.currentStep === TutorialStep.COLLECT_METEORITE &&
        state.gameTime >= 60 &&
        state.meteorites.length === 0 &&
        state.inventory.every(slot => slot === null)) { // Strict check: no meteorites at all

        const m = createMeteorite(state, 'anomalous', e.x, e.y); // Force drop
        state.meteorites.push(m);
        // Don't return, allow normal drops too (though unlikely due to probability)
    }

    // Meteorite Drop Check
    trySpawnMeteorite(state, e.x, e.y);

    // Blueprint Drop Check (15% from Elites)
    if (e.isElite) {
        trySpawnBlueprint(state, e.x, e.y);
    }

    if (e.boss && state.extractionStatus === 'none') {
        state.bossKills++; // Track boss kills correctly

        // Restore Souls if Circle Boss Lvl 4 dies
        if (e.shape === 'circle' && e.isLevel4) {
            state.player.soulDrainMult = 1.0;
        }

        // --- ANOMALY BOSS DEATH LOGIC ---
        if (e.isAnomaly) {
            // Find the POI associated with this boss (it should be inactive).
            const anomalyPoi = state.pois.find(p => p.type === 'anomaly' && !p.active);

            if (anomalyPoi) {
                // Trigger relocation now
                import('./MapLogic').then(({ relocatePOI }) => {
                    relocatePOI(anomalyPoi);
                    // Override respawn timer to 30s as requested
                    anomalyPoi.respawnTimer = 30;
                    spawnFloatingNumber(state, anomalyPoi.x, anomalyPoi.y, "RITUAL CLEARED", '#4ade80', true);
                });
            }

            // Anomaly reward removed per user request (moved to Snitch)
        }

        // UNLOCK PROGRESSION: First Boss Drops Dimensional Gate
        if (state.bossKills === 1 && !state.portalsUnlocked) {
            // Check if we already have it (safety check)
            const hasInv = state.inventory.some(i => i && ((i as any).blueprintType === 'DIMENSIONAL_GATE'));
            const hasBp = state.blueprints.some(b => b && b.type === 'DIMENSIONAL_GATE');

            if (!hasInv && !hasBp) {
                dropBlueprint(state, 'DIMENSIONAL_GATE', e.x, e.y);
                const lang = getStoredLanguage();
                const t = getUiTranslation(lang);
                spawnFloatingNumber(state, e.x, e.y, t.hud.blueprintFound, '#a855f7', true);
            }
        }

        // Boss gives normal XP
        const xpBase = state.player.xp_per_kill.base;
        const hexFlat = calculateLegendaryBonus(state, 'xp_per_kill');
        const hexPct = calculateLegendaryBonus(state, 'xp_pct_per_kill');
        const totalFlat = xpBase + state.player.xp_per_kill.flat + hexFlat;
        const normalMult = 1 + (state.player.xp_per_kill.mult / 100);
        const hexMult = 1 + (hexPct / 100);
        const finalXp = totalFlat * normalMult * hexMult;
        if (!state.xpDisabled) state.player.xp.current += finalXp;

        if (onEvent) onEvent('boss_kill');
    }

    if (state.extractionStatus === 'none') {
        if (e.isRare && e.rareReal) {
            playSfx('rare-kill');
            state.rareSpawnActive = false;
            state.snitchCaught++;
            state.rareRewardActive = true; // Added rarity boost flag
            if (onEvent) onEvent('snitch_kill');
        } else {
            // Consolidated XP Logic (Matches PlayerLogic/ProjectileLogic advanced formula)
            let xpBase = state.player.xp_per_kill.base;

            if (e.xpRewardMult !== undefined) {
                xpBase *= e.xpRewardMult;
            } else if (e.isElite) {
                xpBase *= 14; // Elite = 14x XP
            }

            xpBase *= state.xpSoulBuffMult;

            // --- POI EFFECTS: Overclock XP Bonus ---
            let overclockActive = false;
            state.pois.forEach(poi => {
                if (poi.type === 'overclock' && poi.active) {
                    const d = Math.hypot(state.player.x - poi.x, state.player.y - poi.y);
                    if (d < poi.radius) {
                        overclockActive = true;
                    }
                }
            });

            if (overclockActive) {
                xpBase *= 2.0; // Double XP in Overclock zone
            }

            // Legendary XP Bonuses
            const hexFlat = calculateLegendaryBonus(state, 'xp_per_kill');
            const hexPct = calculateLegendaryBonus(state, 'xp_pct_per_kill');

            const totalFlat = xpBase + state.player.xp_per_kill.flat + hexFlat;
            const normalMult = 1 + (state.player.xp_per_kill.mult / 100);
            const hexMult = 1 + (hexPct / 100);

            const finalXp = totalFlat * normalMult * hexMult * refineryBonus;

            if (!state.xpDisabled) state.player.xp.current += finalXp;
        }
    }

    // Necromancy (Friendly): ComLife Lvl 4+ (10% Chance)
    let comLifeLevel = 0;
    if (state.moduleSockets && state.moduleSockets.hexagons) {
        const hex = state.moduleSockets.hexagons.find(h => h && (h.type === 'ComLife'));
        if (hex) comLifeLevel = hex.level;
    } else {
        comLifeLevel = getHexLevel(state, 'ComLife');
    }

    if (!e.isZombie && !e.isGhost && !e.boss && !e.isRare) {
        // 1. Check for Friendly Zombie (ComLife)
        if (comLifeLevel >= 4) {
            if (Math.random() < 0.10) { // 10% Chance
                const speedBoost = 1.0;
                const crimsonRiseDelay = 5000;
                const now = state.gameTime * 1000;
                const zombieSpd = 6.5; // Scaled to player speed
                const zombie: Enemy = {
                    id: Math.random(),
                    type: e.type,
                    shape: e.shape,
                    x: e.x, y: e.y,
                    size: e.size,
                    hp: Math.floor(e.maxHp * 0.5),
                    maxHp: Math.floor(e.maxHp * 0.5),
                    spd: zombieSpd,
                    boss: false,
                    bossType: 0,
                    bossAttackPattern: 0,
                    lastAttack: 0,
                    dead: false,
                    shellStage: 0,
                    zombieTimer: now + crimsonRiseDelay,
                    zombieSpd: zombieSpd,
                    palette: ['#4ade80', '#22c55e', '#166534'], // Undead Green
                    pulsePhase: 0,
                    rotationPhase: 0,
                    isZombie: true, // Friendly
                    zombieState: 'dead',
                    vx: 0,
                    vy: 0,
                    knockback: { x: 0, y: 0 },
                    frozen: 0,
                    isElite: false,
                    isRare: false,
                    eraPalette: ['#4ade80', '#22c55e', '#166534'],
                    fluxState: 0
                } as any;
                state.enemies.push(zombie);
                // playSfx('zombie-consume'); // Removed per user request (no spawn sound)
            }
        }

        // 2. Check for Hostile Ghost (Ghost Horde Event)
        // MUST happen independently of friendlies
        if (state.activeEvent?.type === 'necrotic_surge') {
            // Schedule GHOST spawn
            if (!state.activeEvent.pendingZombieSpawns) {
                state.activeEvent.pendingZombieSpawns = [];
            }
            const riseDelay = 3000; // 3s delay
            const speedBoost = 1.1; // 10% faster

            state.activeEvent.pendingZombieSpawns.push({
                x: e.x,
                y: e.y,
                shape: e.shape as ShapeType,
                spd: e.spd * speedBoost,
                maxHp: e.maxHp,
                size: e.size,
                spawnAt: state.gameTime + (riseDelay / 1000)
            });
        }
    }

    // Level Up Loop
    if (state.extractionStatus === 'none') {
        while (state.player.xp.current >= state.player.xp.needed) {
            state.player.xp.current -= state.player.xp.needed;
            state.player.level++;
            state.player.xp.needed *= 1.10;
            if (onEvent) onEvent('level_up');
        }
    }
}
