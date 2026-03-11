import { GameState, AreaEffect, Enemy, Player } from '../logic/core/types';
import { getHexLevel, getHexMultiplier } from '../logic/upgrades/LegendaryLogic';
import { spawnParticles, spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import { handleEnemyDeath } from '../logic/mission/DeathLogic';
import { spawnNanitesFromCloud } from '../logic/player/PlayerCombat';
import { recordDamage } from '../logic/utils/DamageTracking';
import { calcStat } from '../logic/utils/MathUtils';
import { PLAYER_CLASSES } from '../logic/core/classes';
import { playSfx } from '../logic/audio/AudioLogic';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { applyDamageToPlayer } from '../logic/utils/CombatUtils';
import { getChassisResonance } from '../logic/upgrades/EfficiencyLogic';

export function updateAreaEffects(state: GameState, step: number, onEvent?: (event: string, data?: any) => void) {
    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    players.forEach(p => { if (p.buffs) p.buffs.puddleRegen = false; });
    const eventHandler = onEvent;

    const newEffects: AreaEffect[] = [];

    state.areaEffects = state.areaEffects.filter(effect => {
        effect.duration -= step;

        if (effect.type === 'temporal_freeze_wave') {
            const range = effect.radius;
            state.enemies.forEach(e => {
                if (e.dead || e.isFriendly || e.isZombie) return;
                const d = Math.hypot(e.x - effect.x, e.y - effect.y);
                if (d < range) {
                    e.frozen = 4.0;
                    e.temporalMonolithExplosive = true;
                }
            });
        }

        if (effect.type === 'afk_strike') {
            if (state.frameCount % 20 === 0) {
                const owner = effect.ownerId
                    ? (state.players?.[effect.ownerId] || state.player)
                    : state.player;
                const ox = owner.x;
                const oy = owner.y;
                const facing = Math.atan2(effect.y - oy, effect.x - ox);
                const sprayLen = Math.hypot(effect.x - ox, effect.y - oy);
                const frac = Math.random();
                const spread = effect.radius * 0.4 * frac;
                const px = ox + Math.cos(facing) * sprayLen * frac + Math.cos(facing + Math.PI / 2) * (Math.random() - 0.5) * spread * 2;
                const py = oy + Math.sin(facing) * sprayLen * frac + Math.sin(facing + Math.PI / 2) * (Math.random() - 0.5) * spread * 2;
                spawnParticles(state, px, py, '#22c55e', 1, 2, 40, 'bubble');
            }
        }

        if (effect.type === 'blackhole') {
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * effect.radius;
                const px = effect.x + Math.cos(angle) * dist;
                const py = effect.y + Math.sin(angle) * dist;
                spawnParticles(state, px, py, '#8b5cf6', 1, 2, 40, 'void');
            }
        }

        if (effect.type === 'glitch_cloud') {
            const range = effect.radius;
            players.forEach(p => {
                const dist = Math.hypot(p.x - effect.x, p.y - effect.y);
                if (dist < range + p.size) {
                    p.invertedControlsUntil = state.gameTime + 0.5;
                }
            });
        }

        if (effect.type === 'nanite_cloud') {
            const elapsed = state.gameTime - effect.creationTime;
            const range = effect.radius || 200;
            const resonance = getChassisResonance(state);

            state.enemies.forEach(e => {
                if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                const d = Math.hypot(e.x - effect.x, e.y - effect.y);
                if (d < range + (e.size || 20)) {
                    if (e.lastSpitHitId !== effect.naniteSpitId) {
                        const nanitesToApply = 4 + Math.floor((effect.level || 0) / 10);
                        const baseSwarmPct = 0.05 * (1 + resonance);
                        const naniteDmgPerSec = (effect.naniteDmg || 0) * baseSwarmPct * nanitesToApply;

                        e.slowFactor = Math.max(e.slowFactor || 0, 0.3);
                        e.slowUntil = 999999999;

                        if (!e.naniteGroups) e.naniteGroups = [];
                        e.naniteGroups.push({ count: nanitesToApply, dmgPerSecond: naniteDmgPerSec, spitId: effect.naniteSpitId! });

                        e.activeNaniteCount = (e.activeNaniteCount || 0) + nanitesToApply;
                        e.activeNaniteDmg = (e.activeNaniteDmg || 0) + naniteDmgPerSec;

                        e.isInfected = true;
                        e.infectedUntil = 999999999;
                        e.lastSpitHitId = effect.naniteSpitId;

                        spawnParticles(state, e.x, e.y, '#22c55e', 5, 2, 20);
                    }
                }
            });

            if (elapsed >= 0.4 && !effect.naniteSpawned) {
                effect.naniteSpawned = true;
                spawnNanitesFromCloud(state, effect);
                spawnParticles(state, effect.x, effect.y, '#22c55e', 30, 4, 60, 'spark');
            }
        }

        if (effect.type === 'puddle') {
            const mireLvl = getHexLevel(state, 'IrradiatedMire');
            const range = mireLvl > 0 ? 666 : effect.radius;

            players.forEach(p => {
                const dist = Math.hypot(p.x - effect.x, p.y - effect.y);
                if (dist < range + p.size) {
                    if (effect.level >= 3) {
                        if (!p.buffs) p.buffs = {};
                        p.buffs.puddleRegen = true;
                    }
                }
            });

            let fluxBonus = 0;
            const alchemist = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
            if (alchemist) {
                fluxBonus = (state.player.isotopes || 0) / 500;
            }

            state.enemies.forEach(e => {
                if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                if (dist < range + e.size) {
                    if (effect.level >= 2) {
                        const baseSlow = 0.20;
                        const slowAmt = baseSlow + (fluxBonus / 100);
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);
                    }
                    if (effect.level >= 4) {
                        const baseAmp = 1.4;
                        const dmgAmp = baseAmp + (fluxBonus / 100);
                        e.takenDamageMultiplier = Math.max(e.takenDamageMultiplier || 1.0, dmgAmp);
                    }
                    if (effect.level >= 1) {
                        let dotDmg = (e.maxHp * 0.05) * step;
                        if (mireLvl > 0) {
                            const distToPlayer = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                            if (distToPlayer < 666) {
                                const mireMult = getHexMultiplier(state, 'IrradiatedMire');
                                dotDmg *= (1 + 1.0 * mireMult);
                            }
                        }
                        e.hp -= dotDmg;
                        state.player.damageDealt += dotDmg;
                        const isXeno = state.moduleSockets.hexagons.some(h => h?.type === 'XenoAlchemist');
                        const isMirePuddle = state.moduleSockets.hexagons.some(h => h?.type === 'IrradiatedMire');
                        const puddleSource = isXeno ? 'Xeno Alchemist (Puddle)' : (isMirePuddle ? 'Irradiated Mire (Puddle)' : (effect.level >= 4 ? 'Toxic Puddle (LVL 4)' : 'Toxic Puddle (LVL 1)'));
                        recordDamage(state, puddleSource as import('../logic/core/types').DamageSource, dotDmg, e);

                        e.puddleDmgAcc = (e.puddleDmgAcc || 0) + dotDmg;
                        e.puddleDmgTimer = (e.puddleDmgTimer || 0) + step;
                        if (e.puddleDmgTimer >= 1.0 && e.puddleDmgAcc > 0) {
                            spawnFloatingNumber(state, e.x, e.y, Math.round(e.puddleDmgAcc).toString(), '#22c55e', false);
                            e.puddleDmgAcc = 0;
                            e.puddleDmgTimer = 0;
                        }

                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                    }
                }
            });
        } else if (effect.type === 'epicenter') {
            const isGravity = effect.isGravityAnchor || getHexLevel(state, 'GravityAnchor') >= 1;
            const meteoritesMult = getHexMultiplier(state, isGravity ? 'GravityAnchor' : 'DefEpi');
            let range = 500;

            if (effect.level >= 3) {
                const progress = 1 - (effect.duration / 10);
                const growthFactor = 1 + (0.20 * meteoritesMult * progress);
                range *= Math.max(1, growthFactor);
            }

            effect.radius = range;
            const executeThreshold = (effect.level >= 4 || isGravity) ? 0.05 * meteoritesMult : 0;

            state.enemies.forEach(e => {
                if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                const dx = e.x - effect.x;
                const dy = (e.y - effect.y) / 0.6;
                const dist = Math.hypot(dx, dy);

                if (dist < range + e.size) {
                    e.slowFactor = Math.max(e.slowFactor || 0, 0.50);
                    if (effect.level >= 2) {
                        const pullPct = 2 * meteoritesMult;
                        const pullSpeed = 1000 * (pullPct / 100);
                        const pullStrength = pullSpeed * step;
                        const angle = Math.atan2(effect.y - e.y, effect.x - e.x);
                        e.x += Math.cos(angle) * pullStrength;
                        e.y += Math.sin(angle) * pullStrength;
                    }

                    if (executeThreshold > 0 && !e.boss && !e.dead && e.hp <= e.maxHp * executeThreshold) {
                        const executedHp = e.hp;
                        state.player.damageDealt += executedHp;
                        const isHarvestExec = effect.isGravitationalHarvest || state.moduleSockets.hexagons.some(h => h?.type === 'GravitationalHarvest');
                        const isGravityExec = effect.isGravityAnchor || state.moduleSockets.hexagons.some(h => h?.type === 'GravityAnchor');
                        const execSource = isHarvestExec ? 'Gravitational Harvest' : (isGravityExec ? 'Gravity Anchor' : 'Epicenter (LVL 4)');
                        recordDamage(state, execSource as import('../logic/core/types').DamageSource, executedHp, e);
                        e.hp = 0;
                        e.isExecuted = true;
                        spawnFloatingNumber(state, e.x, e.y, "EXECUTED", '#0ea5e9', true, undefined, 12);
                        handleEnemyDeath(state, e, eventHandler);
                    }
                }
            });

            effect.pulseTimer = (effect.pulseTimer || 0) + step;
            if (effect.pulseTimer >= 1.0) {
                effect.pulseTimer = 0;
                const pDmg = calcStat(state.player.dmg, state.dmgAtkBuffMult);
                let dmg = pDmg * 0.25 * meteoritesMult;
                if (isGravity) dmg += calcStat(state.player.arm) * 0.02 * meteoritesMult;

                state.enemies.forEach(e => {
                    if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                    const dx = e.x - effect.x;
                    const dy = (e.y - effect.y) / 0.6;
                    if (Math.hypot(dx, dy) < range) {
                        e.hp -= dmg;
                        state.player.damageDealt += dmg;
                        const isHarvest = effect.isGravitationalHarvest || state.moduleSockets.hexagons.some(h => h?.type === 'GravitationalHarvest');
                        const isGravityAnc = effect.isGravityAnchor || state.moduleSockets.hexagons.some(h => h?.type === 'GravityAnchor');
                        const epicSource = isHarvest ? 'Gravitational Harvest' : (isGravityAnc ? 'Gravity Anchor' : 'Epicenter (LVL 1)');
                        recordDamage(state, epicSource as import('../logic/core/types').DamageSource, dmg, e);
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#0ea5e9', false);
                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                    }
                });
                playSfx('ice-loop');
            }
        } else if (effect.type === 'blackhole') {
            const range = effect.radius;
            const eliteDps = 0.25;
            const bossDps = 0.10;
            const minionCoreRadius = 80;

            state.enemies.forEach(e => {
                if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                const dx = e.x - effect.x;
                const dy = (e.y - effect.y) / 0.6;
                const dist = Math.hypot(dx, dy);

                if (dist < range + (e.size || 20)) {
                    if (effect.level >= 2) {
                        const blackholeClass = PLAYER_CLASSES.find(c => c.id === 'eventhorizon');
                        const pullPct = blackholeClass?.capabilityMetrics.find(m => m.label === 'Pull Strength')?.value || 5;
                        const pullStrength = 1000 * (pullPct / 100) * step;
                        const angle = Math.atan2(effect.y - e.y, effect.x - e.x);
                        e.x += Math.cos(angle) * pullStrength;
                        e.y += Math.sin(angle) * pullStrength;
                    }

                    if (e.boss) {
                        const dmg = (e.maxHp * bossDps) * step;
                        e.hp -= dmg;
                        state.player.damageDealt += dmg;
                        recordDamage(state, 'Void Singularity', dmg, e);
                        if (state.frameCount % 30 === 0) spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#8b5cf6', false);
                    } else if ((e.isElite || e.isRare) && e.shape !== 'snitch') {
                        const dmg = (e.maxHp * eliteDps) * step;
                        e.hp -= dmg;
                        state.player.damageDealt += dmg;
                        recordDamage(state, 'Void Singularity', dmg, e);
                        if (state.frameCount % 30 === 0) spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#8b5cf6', false);
                    } else {
                        if (dist < minionCoreRadius) {
                            e.hp = 0;
                            state.player.damageDealt += e.maxHp;
                            recordDamage(state, 'Void Singularity', e.maxHp, e);
                            spawnParticles(state, e.x, e.y, '#8b5cf6', 5, 2, 30, 'void');
                            handleEnemyDeath(state, e, eventHandler);
                        } else if (e.shape !== 'worm' && e.shape !== 'snitch') {
                            const dmg = (e.maxHp * 0.5) * step;
                            e.hp -= dmg;
                        }
                    }
                    if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                }
            });
        }

        if (effect.duration <= 0) {
            if (effect.type === 'storm_laser') {
                const dmgPct = effect.dmgMult ?? 0.1;
                const pDmg = calcStat(state.player.dmg, state.dmgAtkBuffMult);
                const dmg = pDmg * dmgPct;

                state.enemies.forEach(e => {
                    if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                    if (Math.hypot(e.x - effect.x, e.y - effect.y) < effect.radius + (e.size || 20)) {
                        e.hp -= dmg;
                        state.player.damageDealt += dmg;
                        recordDamage(state, 'Storm Circle', dmg, e);
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#06b6d4', true);
                        spawnParticles(state, e.x, e.y, '#06b6d4', 4);
                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                    }
                });

                newEffects.push({
                    id: Date.now() + Math.random(),
                    type: 'storm_hit',
                    x: effect.x,
                    y: effect.y,
                    radius: effect.radius,
                    duration: 0.45,
                    creationTime: state.gameTime,
                    level: 1
                });

                playSfx('laser');
            } else if (effect.type === 'orbital_strike') {
                const range = effect.radius;
                const pDmg = calcStat(state.player.dmg, state.dmgAtkBuffMult);
                const dmg = pDmg * 1.5;

                state.enemies.forEach(e => {
                    if (e.dead || e.isFriendly || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range + (e.size || 20)) {
                        e.hp -= dmg;
                        state.player.damageDealt += dmg;
                        recordDamage(state, 'Storm Circle', dmg, e);
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#06b6d4', true);
                        spawnParticles(state, e.x, e.y, '#06b6d4', 5);
                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                    }
                });

                spawnParticles(state, effect.x, effect.y, '#06b6d4', 30, 2, 20, 'spark');
                newEffects.push({
                    id: Date.now() + Math.random(),
                    type: 'crater',
                    x: effect.x,
                    y: effect.y,
                    radius: range,
                    duration: 8.0,
                    creationTime: state.gameTime,
                    level: 1
                });

                playSfx('impact');
            } else if (effect.type === 'afk_strike') {
                const owner = effect.ownerId
                    ? (state.players?.[effect.ownerId] || state.player)
                    : state.player;

                newEffects.push({
                    id: Date.now() + Math.random(),
                    type: 'crater',
                    x: effect.x,
                    y: effect.y,
                    radius: effect.radius,
                    duration: 12.0,
                    creationTime: state.gameTime,
                    level: 1
                });

                newEffects.push({
                    id: Date.now() + Math.random(),
                    type: 'afk_strike_hit',
                    x: effect.x,
                    y: effect.y,
                    radius: effect.radius,
                    duration: 0.6,
                    ownerId: effect.ownerId,
                    creationTime: state.gameTime,
                    level: 1
                });

                playSfx('impact');
            } else if (effect.type === 'afk_strike_hit') {
                const owner = effect.ownerId
                    ? (state.players?.[effect.ownerId] || state.player)
                    : state.player;

                const dist = Math.hypot(owner.x - effect.x, owner.y - effect.y);
                if (dist < effect.radius + owner.size) {
                    const playerMaxHp = calcStat(owner.hp, state.hpRegenBuffMult, state.assistant?.history?.curseIntensity || 1.0);
                    const exactLethalDmg = playerMaxHp * 1.05;

                    applyDamageToPlayer(state, owner, exactLethalDmg, {
                        bypassArmor: true,
                        bypassShield: true,
                        deathCause: 'Coffee Spilled',
                        sourceType: 'other',
                        floatingNumberColor: '#dc2626'
                    });
                }
            }
            return false;
        }

        return true;
    });

    if (newEffects.length > 0) {
        state.areaEffects.push(...newEffects);
    }
}
