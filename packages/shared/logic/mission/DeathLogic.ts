import type { GameState, Enemy, ShapeType } from '../core/Types';
import { TutorialStep } from '../core/Types';
import { playSfx } from '../audio/AudioLogic';
import { getLegendaryOptions, getHexLevel, calculateLegendaryBonus, getHexMultiplier, recordLegendarySouls } from '../upgrades/LegendaryLogic';
import { trySpawnMeteorite, createMeteorite, spawnVoidFlux, spawnDustPile } from './LootLogic';
import { getSpawnPosition } from '../enemies/EnemySpawnLogic';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { bulletPool } from '../combat/ProjectileSpawning';
import { trySpawnBlueprint, dropBlueprint } from '../upgrades/BlueprintLogic';
import { handleVoidBurrowerDeath } from '../enemies/WormLogic';
import { getUiTranslation } from '../../lib/UiTranslations';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { recordDamage } from '../utils/DamageTracking';

export function handleEnemyDeath(state: GameState, e: Enemy, onEvent?: (event: string, data?: any) => void) {
    if (e.dead) return;
    if (e.isFriendly || e.isZombie || e.isGhost || e.isNecroticZombie) {
        e.dead = true;
        e.hp = 0;
        return;
    }

    if (e.shape === 'worm') {
        handleVoidBurrowerDeath(state, e, onEvent);
    }


    if (e.isPhalanxDrone && e.soulLinkHostId) {
        const host = state.enemies.find(h => h.id === e.soulLinkHostId);
        if (host && !host.dead) {



            const deathPenalty = host.maxHp * 0.05;
            host.hp -= deathPenalty;
            spawnFloatingNumber(state, host.x, host.y, `PHALANX BREACH -${Math.round(deathPenalty)}`, '#ef4444', true);
            playSfx('rare-kill');
        }
    }

    if (e.temporalMonolithExplosive && e.hp <= 0) {
        const mult = getHexMultiplier(state, 'TemporalMonolith');
        const aoeDmg = e.maxHp * 0.25 * mult;


        const baseRadius = e.boss ? 400 : 200;
        const radius = (baseRadius + e.size * 1.5) * mult;

        state.player.temporalMonolithSouls = (state.player.temporalMonolithSouls || 0) + 1;

        state.enemies.forEach(other => {
            if (!other.dead && other.id !== e.id && !other.isFriendly) {
                const dist = Math.hypot(other.x - e.x, other.y - e.y);
                if (dist <= radius) {
                    other.hp -= aoeDmg;
                    state.player.damageDealt += aoeDmg;
                    recordDamage(state, 'Temporal Monolith (Explosion)', aoeDmg, other);
                    if (Math.random() < 0.3 || e.boss) {
                        spawnFloatingNumber(state, other.x, other.y, Math.round(aoeDmg).toString(), '#38bdf8', true);
                    }
                    if (other.hp <= 0 && !other.dead) {
                        state.player.temporalMonolithSouls = (state.player.temporalMonolithSouls || 0) + 1;
                    }
                }
            }
        });


        spawnFloatingNumber(state, e.x, e.y, 'TEMPORAL SHATTER', '#38bdf8', true);
        playSfx('shatter');

        state.areaEffects.push({
            id: Math.random(),
            type: 'temporal_burst',
            x: e.x,
            y: e.y,
            radius: radius,
            duration: 0.35,
            creationTime: state.gameTime,
            level: 1
        });


        spawnParticles(state, e.x, e.y, '#38bdf8', 20, 5, 40, 'shard');
    }

    e.dead = true; e.hp = 0;


    let baseSouls = 1;
    if (e.soulRewardMult !== undefined) {
        baseSouls = e.soulRewardMult;
    } else if (e.isElite) {
        baseSouls = e.shape === 'pentagon' ? 5 : (e.shape === 'elite_minion' ? 2 : 10);
    } else if (e.shape === 'worm' && e.wormRole === 'head') {
        baseSouls = 50;
    }


    const soulCount = baseSouls * state.xpSoulBuffMult;


    let finalSoulCount = soulCount;
    const shatterLvl = getHexLevel(state, 'SoulShatterCore');
    if (shatterLvl > 0 && e.isExecuted) {
        finalSoulCount = soulCount * 5;
    }

    state.killCount += Math.ceil(soulCount);
    state.score += Math.ceil(soulCount);
    recordLegendarySouls(state, Math.ceil(soulCount));


    if (state.player.playerClass === 'aigis') {
        state.player.vortexStrength = (state.player.vortexStrength || 1.0) + (baseSouls * 0.0003);
    }


    const harvestLvl = getHexLevel(state, 'GravitationalHarvest');
    const gravityArcLvl = getHexLevel(state, 'GravityAnchor');

    if (harvestLvl > 0 || gravityArcLvl > 0) {
        const epi = state.areaEffects.find(ae => ae.type === 'epicenter' && Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius);
        if (epi) {
            if (harvestLvl > 0) {
                const extension = 0.1;
                epi.duration += extension;

                const skill = state.player.activeSkills.find(s => s.type === 'GravitationalHarvest');
                if (skill && skill.duration !== undefined) {
                    skill.duration += extension;
                }
            }
            if (epi.isGravityAnchor || gravityArcLvl > 0) {
                e.isExecuted = true;
            }
        }
    }

    if (e.isExecuted && (gravityArcLvl > 0 || (state.areaEffects.find(ae => ae.type === 'epicenter' && ae.isGravityAnchor && Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius)))) {
        const meteoritesMult = getHexMultiplier(state, 'GravityAnchor');
        const explodeDmg = e.maxHp * 0.10 * meteoritesMult;
        spawnParticles(state, e.x, e.y, '#ef4444', 20, 3, 50, 'shockwave');

        state.enemies.forEach(other => {
            if (other.dead || other.id === e.id || other.isFriendly) return;
            const dist = Math.hypot(other.x - e.x, other.y - e.y);
            if (dist <= 200) {
                other.hp -= explodeDmg;
                state.player.damageDealt += explodeDmg;
                recordDamage(state, 'Gravity Anchor (Explosion)', explodeDmg, other);
                spawnFloatingNumber(state, other.x, other.y, Math.round(explodeDmg).toString(), '#ef4444', false);
                if (other.hp <= 0 && !other.dead) handleEnemyDeath(state, other, onEvent);
            }
        });
    }


    if (shatterLvl > 0) {
        state.player.soulShatterSouls = (state.player.soulShatterSouls || 0) + finalSoulCount;
    }


    if (state.rawKillCount === undefined) {
        state.rawKillCount = 0;
    }
    state.rawKillCount += baseSouls;




    let fluxDrop = 0;
    const minutes = state.gameTime / 60;


    let refineryBonus = 1.0;
    const alchemyHex = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
    if (alchemyHex) {
        const playerInPuddle = state.areaEffects.some(ae => ae.type === 'puddle' && Math.hypot(ae.x - state.player.x, ae.y - state.player.y) < ae.radius);
        const enemyInPuddle = state.areaEffects.some(ae => ae.type === 'puddle' && Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius + e.size);
        if (playerInPuddle || enemyInPuddle) {
            refineryBonus = 4.0;
        }
    }

    const isTrueElite = e.isElite && e.shape !== 'elite_minion' && e.shape !== 'minion';

    if (e.boss) {


        const timeScaling = Math.floor(minutes * 15);
        const variance = Math.floor(Math.random() * 31) - 15;
        fluxDrop = Math.max(50, 100 + timeScaling + variance);
    } else if (isTrueElite) {


        const timeScaling = Math.floor(minutes * 5.0);
        const variance = Math.floor(Math.random() * 9) - 4;
        fluxDrop = Math.max(15, 25 + timeScaling + variance);
    }

    if (fluxDrop > 0) {
        fluxDrop *= refineryBonus;
        spawnVoidFlux(state, e.x, e.y, fluxDrop);
    }


    if (Math.random() < 0.03) {
        const dustAmount = (isTrueElite ? 5 : (e.boss ? 10 : 1)) * refineryBonus;
        spawnDustPile(state, e.x, e.y, dustAmount);
    }




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


    if (ecoXp && ecoXp.level >= 3) {
        const kl = ecoXp.killsAtLevel?.[3] ?? ecoXp.killsAtAcquisition;
        const killsSinceLvl3 = state.killCount - kl;
        const prevKillsSinceLvl3 = killsSinceLvl3 - soulCount;

        const currentThresholds = Math.floor(killsSinceLvl3 / 100);
        const prevThresholds = Math.floor(prevKillsSinceLvl3 / 100);

        if (currentThresholds > prevThresholds && killsSinceLvl3 > 0) {
            const multiplier = getHexMultiplier(state, ecoXp.type);
            const fluxAmount = (currentThresholds - prevThresholds) * 5 * multiplier;
            state.player.isotopes += fluxAmount;
            playSfx('socket-place');
            spawnFloatingNumber(state, e.x, e.y, `+${fluxAmount.toFixed(0)} FLUX`, '#a855f7', false);
        }
    }


    if (e.isInfected) {
        const resonance = getChassisResonance(state);
        const multiplier = 1 + resonance;
        const totalInfectionRate = 30 * multiplier;

        let jumpCount = Math.floor(totalInfectionRate / 100);
        const jumpChance = (totalInfectionRate % 100) / 100;
        if (Math.random() < jumpChance) jumpCount++;

        if (jumpCount > 0) {

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

                const jb = bulletPool.acquire();
                jb.id = Math.random(); jb.x = e.x; jb.y = e.y;
                jb.vx = (Math.random() - 0.5) * 2; jb.vy = (Math.random() - 0.5) * 2;
                jb.dmg = e.infectionDmg || 5; jb.pierce = 1; jb.life = 120; jb.isEnemy = false;
                jb.hits.add(e.id); jb.color = '#4ade80'; jb.size = 4;
                jb.isNanite = true; jb.naniteTargetId = other.id;
                state.bullets.push(jb);
            });
        }
    }


    if (state.tutorial.isActive &&
        state.tutorial.currentStep === TutorialStep.COLLECT_METEORITE &&
        state.gameTime >= 60 &&
        state.meteorites.length === 0 &&
        state.inventory.every(slot => slot === null)) {

        const m = createMeteorite(state, 'anomalous', e.x, e.y);
        state.meteorites.push(m);

    }


    trySpawnMeteorite(state, e.x, e.y);


    if (isTrueElite) {
        trySpawnBlueprint(state, e.x, e.y);
    }


    if (e.boss && state.extractionStatus === 'none') {
        state.bossKills++;


        if (e.shape === 'circle' && e.isLevel4) {
            state.player.soulDrainMult = 1.0;
        }


        if (e.isAnomaly) {

            const anomalyPoi = state.pois.find(p => p.type === 'anomaly' && !p.active);

            if (anomalyPoi) {

                import('./MapLogic').then(({ relocatePOI }) => {
                    relocatePOI(state.pois, anomalyPoi);

                    anomalyPoi.respawnTimer = 30;
                    spawnFloatingNumber(state, anomalyPoi.x, anomalyPoi.y, "RITUAL CLEARED", '#4ade80', true);
                });
            }


        }


        if (state.bossKills === 1 && !state.portalsUnlocked) {

            const hasInv = state.inventory.some(i => i && ((i as any).blueprintType === 'DIMENSIONAL_GATE'));
            const hasBp = state.blueprints.some(b => b && b.type === 'DIMENSIONAL_GATE');

            if (!hasInv && !hasBp) {
                dropBlueprint(state, 'DIMENSIONAL_GATE', e.x, e.y);
                const lang = getStoredLanguage();
                const t = getUiTranslation(lang);
                spawnFloatingNumber(state, e.x, e.y, t.hud.blueprintFound, '#a855f7', true);
            }
        }


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
            state.rareRewardActive = true;
            if (onEvent) onEvent('snitch_kill');
        } else {

            let xpBase = state.player.xp_per_kill.base;

            if (e.xpRewardMult !== undefined) {
                xpBase *= e.xpRewardMult;
            } else if (e.isElite) {
                xpBase *= (e.shape === 'elite_minion' ? 3 : 14);
            }

            xpBase *= state.xpSoulBuffMult;


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
                xpBase *= 2.0;
            }


            const hexFlat = calculateLegendaryBonus(state, 'xp_per_kill');
            const hexPct = calculateLegendaryBonus(state, 'xp_pct_per_kill');

            const totalFlat = xpBase + state.player.xp_per_kill.flat + hexFlat;
            const normalMult = 1 + (state.player.xp_per_kill.mult / 100);
            const hexMult = 1 + (hexPct / 100);

            const finalXp = totalFlat * normalMult * hexMult * refineryBonus;

            if (!state.xpDisabled) state.player.xp.current += finalXp;
        }
    }


    const comLifeLevel = getHexLevel(state, 'ComLife');

    if (!e.isZombie && !e.isGhost && !e.boss && !e.isRare) {

        if (comLifeLevel >= 4) {
            if (Math.random() < 0.10) {
                const speedBoost = 1.0;
                const crimsonRiseDelay = 5000;
                const now = state.gameTime * 1000;
                const zombieSpd = 6.5;
                const spawnPos = getSpawnPosition(state, false);
                const zombie: Enemy = {
                    id: Math.random(),
                    type: e.type,
                    shape: e.shape,
                    x: spawnPos.x, y: spawnPos.y,
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
                    palette: ['#4ade80', '#22c55e', '#166534'],
                    pulsePhase: 0,
                    rotationPhase: 0,
                    isZombie: true,
                    isFriendly: true,
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

            }
        }



        if (state.activeEvent?.type === 'necrotic_surge') {
            if (!state.activeEvent.pendingZombieSpawns) {
                state.activeEvent.pendingZombieSpawns = [];
            }
            const riseDelay = 3000;
            const speedBoost = 1.1;

            const spawnPos = getSpawnPosition(state, false);

            state.activeEvent.pendingZombieSpawns.push({
                x: spawnPos.x,
                y: spawnPos.y,
                shape: e.shape as ShapeType,
                spd: e.spd * speedBoost,
                maxHp: e.maxHp,
                size: e.size,
                spawnAt: state.gameTime + (riseDelay / 1000)
            });
        }
    }


    if (state.extractionStatus === 'none') {
        while (state.player.xp.current >= state.player.xp.needed) {
            state.player.xp.current -= state.player.xp.needed;
            state.player.level++;
            state.player.xp.needed *= 1.10;
            if (onEvent) onEvent('level_up');
        }
    }
}
