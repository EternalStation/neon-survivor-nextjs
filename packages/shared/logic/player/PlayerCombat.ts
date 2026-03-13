
import type { GameState, Enemy, Player } from '../core/Types';
import { getPlayerThemeColor } from '../utils/Helpers';
import { GAME_CONFIG } from '../core/GameConfig';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { playSfx } from '../audio/AudioLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { spawnFloatingNumber, spawnParticles } from '../effects/ParticleLogic';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { ARENA_CENTERS, isInMap } from '../mission/MapLogic';
import { spawnBullet } from '../combat/ProjectileSpawning';
import { recordDamage, recordHealing } from '../utils/DamageTracking';
import { applyDamageToPlayer, applyHealToPlayer } from '../utils/CombatUtils';

export function handlePlayerCombat(
    state: GameState,
    mouseOffset?: { x: number, y: number },
    onEvent?: (type: string, data?: any) => void,
    overridePlayer?: any,
    triggerDamageTaken?: (dmg: number) => void,
    triggerDeath?: () => void
) {
    const player: Player = overridePlayer || state.player;
    const curseMult = state.assistant.history.curseIntensity || 1.0;




    const mireLvl = getHexLevel(state, 'IrradiatedMire');
    const neutronLvl = getHexLevel(state, 'NeutronStar');
    const radLvl = (mireLvl > 0 || neutronLvl > 0) ? 5 : getHexLevel(state, 'ComRadiation');
    if (radLvl >= 1) {
        if (state.frameCount % 10 === 0) {
            const m = getHexMultiplier(state, neutronLvl > 0 ? 'NeutronStar' : (mireLvl > 0 ? 'IrradiatedMire' : 'ComRadiation'));
            const mireActive = mireLvl > 0;
            const neutronActive = neutronLvl > 0;
            const range = (mireActive || neutronActive) ? 666 : 500;
            const maxHp = calcStat(player.hp, state.hpRegenBuffMult, curseMult);
            let dmgAmp = 1.0 * m;

            if (neutronActive) {

                const hpBonus = (maxHp / 100) * 0.02;
                dmgAmp *= (1 + hpBonus);


                const killBonus = (player.neutronStarAuraKills || 0) * 0.0001;
                dmgAmp *= (1 + killBonus);
            }

            if (radLvl >= 3) {
                const missing = 1 - (player.curHp / maxHp);
                if (missing > 0) dmgAmp += missing;
            }

            const playerMaxHp = calcStat(player.hp, state.hpRegenBuffMult, curseMult);
            const enemiesInAura: Enemy[] = [];

            const puddles = mireActive ? state.areaEffects.filter(ef => ef.type === 'puddle') : [];

            state.enemies.forEach(e => {
                if (e.dead || e.isNeutral || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;

                const dx = e.x - player.x;
                const dy = e.y - player.y;
                const distSq = dx * dx + dy * dy;
                const rangeSq = range * range;
                const inRange = distSq < rangeSq;
                let tickDmg = 0;

                if (radLvl >= 4) {
                    tickDmg += (e.hp * 0.005 * dmgAmp) / 6;
                }

                if (inRange) {
                    enemiesInAura.push(e);
                    const auraPct = 0.05 * dmgAmp;
                    tickDmg += (playerMaxHp * auraPct) / 6;
                }

                if (mireActive && inRange && puddles.length > 0) {
                    let isInAcid = false;
                    for (let i = 0; i < puddles.length; i++) {
                        const p = puddles[i];
                        const pdx = e.x - p.x;
                        const pdy = e.y - p.y;
                        if (pdx * pdx + pdy * pdy < p.radius * p.radius) {
                            isInAcid = true;
                            break;
                        }
                    }
                    if (isInAcid) {
                        const mireMult = getHexMultiplier(state, 'IrradiatedMire');
                        tickDmg *= (1 + 1.0 * mireMult);
                    }
                }

                if (tickDmg > 0) {
                    let finalTickDmg = tickDmg;
                    if (e.legionId) {
                        const lead = state.legionLeads?.[e.legionId];
                        if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                            const shieldAbsorp = Math.min(finalTickDmg, lead.legionShield || 0);
                            lead.legionShield = (lead.legionShield || 0) - shieldAbsorp;
                            finalTickDmg -= shieldAbsorp;
                        }
                    }

                    if (finalTickDmg > 0) {
                        e.hp -= finalTickDmg;
                        player.damageDealt += finalTickDmg;
                        const auraSrc = neutronActive ? 'Neutron Star (Aura)' : (mireActive ? 'Irradiated Mire (Aura)' : 'Radiation Aura');
                        recordDamage(state, auraSrc as import('../core/Types').DamageSource, finalTickDmg, e);

                        const shouldShowText = inRange ? (Math.random() < 0.3) : false;

                        if (shouldShowText) {
                            const color = neutronActive ? '#facc15' : (inRange ? '#22c55e' : '#4ade80');
                            spawnFloatingNumber(state, e.x, e.y, Math.round(tickDmg * 6).toString(), color, false);
                        }

                        if (e.hp <= 0 && !e.dead) {
                            if (neutronActive && inRange) {
                                player.neutronStarAuraKills = (player.neutronStarAuraKills || 0) + 1;
                            }
                            handleEnemyDeath(state, e, onEvent);
                        }
                    }
                }
            });

            if (radLvl >= 2 && enemiesInAura.length > 0 && !player.healingDisabled) {
                const healPerEnemy = playerMaxHp * (0.002 * m) / 6;
                const totalHeal = healPerEnemy * enemiesInAura.length;
                applyHealToPlayer(state, player, totalHeal, 'Radiation Aura');
            }
        }

        if (state.frameCount % 10 === 0) {
            const range = (mireLvl > 0 || neutronLvl > 0) ? 666 : 500;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * range;
            state.particles.push({
                x: player.x + Math.cos(angle) * dist,
                y: player.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                life: 60, maxLife: 60, color: (neutronLvl > 0 && Math.random() < 0.3) ? '#facc15' : '#bef264',
                size: 6 + Math.random() * 8, type: 'bubble', alpha: 0.5
            });
        }
    }


    if (player.playerClass === 'malware' && mouseOffset) {
        player.targetAngle = Math.atan2(mouseOffset.y, mouseOffset.x);
        player.targetX = player.x + mouseOffset.x;
        player.targetY = player.y + mouseOffset.y;
    } else {
        let nearest: Enemy | null = null;
        let minDist = 800;
        state.enemies.forEach((e: Enemy) => {
            if (e.dead || e.isNeutral || e.isZombie || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < minDist) { minDist = d; nearest = e; }
        });

        if (nearest !== null) {
            player.targetAngle = Math.atan2((nearest as Enemy).y - player.y, (nearest as Enemy).x - player.x);
            player.targetX = (nearest as Enemy).x;
            player.targetY = (nearest as Enemy).y;
        } else {
            player.targetAngle = player.lastAngle;
        }
    }


    const now = state.gameTime;
    const atkAtkValue = calcStat(player.atk, state.dmgAtkBuffMult);
    const shotsPerSec = Math.max(0.1, (2.64 * Math.log(atkAtkValue / 100) - 1.25));
    const atkDelay = 1 / shotsPerSec;
    if (now - (player.lastShot || 0) >= atkDelay) {


        player.lastShot = now;
        const dmg = calcStat(player.dmg, state.dmgAtkBuffMult);
        spawnBullet(state, player, player.x, player.y, player.targetAngle, dmg, player.pierce);
        playSfx('shoot');
    }


    handleEnemyContact(state, onEvent, player, triggerDamageTaken, triggerDeath);


    processPendingZaps(state, onEvent);
}

export function handleEnemyContact(
    state: GameState,
    onEvent?: (type: string, data?: any) => void,
    overridePlayer?: any,
    triggerDamageTaken?: (dmg: number) => void,
    triggerDeath?: () => void
) {
    const player = overridePlayer || state.player;
    const now = state.gameTime;
    const kinLvl = getHexLevel(state, 'DefBattery');
    const curseMult = state.assistant.history.curseIntensity || 1.0;

    state.enemies.forEach(e => {
        if (e.dead || e.hp <= 0 || e.isZombie || (e.legionId && !e.legionReady) || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
        if (e.spawnGracePeriod && e.spawnGracePeriod > 0) return;

        const dToE = Math.hypot(e.x - player.x, e.y - player.y);
        const contactDist = e.size + 18;

        if (dToE < contactDist) {
            let rawDmg = 0;
            if (!e.isNeutral && !e.isAssembling) {
                const isLinked = e.soulLinkHostId !== undefined || (e.soulLinkTargets && e.soulLinkTargets.length > 0);
                if (isLinked) {
                    const linkColor = getPlayerThemeColor(state);
                    rawDmg = e.hp * 0.075;
                    let linkedTargets: Enemy[] = [];
                    if (e.soulLinkHostId) {
                        const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
                        if (host) {
                            linkedTargets.push(host);
                            if (host.soulLinkTargets) {
                                linkedTargets.push(...state.enemies.filter(p => host.soulLinkTargets!.includes(p.id) && !p.dead && p.id !== e.id));
                            }
                        }
                    }
                    linkedTargets = Array.from(new Set(linkedTargets));
                    const splitDmg = e.maxHp / linkedTargets.length;
                    linkedTargets.forEach(target => {
                        target.hp -= splitDmg;
                        player.damageDealt += splitDmg;
                        recordDamage(state, 'Collision', splitDmg, target);
                        spawnFloatingNumber(state, target.x, target.y, Math.round(splitDmg).toString(), linkColor, false);
                    });
                    if (!e.boss) e.hp = 0;
                } else if (e.shape === 'minion' && e.parentId !== undefined) {
                    rawDmg = e.hp * 0.075;
                } else {
                    rawDmg = e.hp * 0.075;
                }
            }


            const finalDmg = applyDamageToPlayer(state, player, rawDmg, {
                sourceType: 'collision',
                incomingDamageSource: e.boss
                    ? e.shape.charAt(0).toUpperCase() + e.shape.slice(1) + ' Boss'
                    : e.shape.charAt(0).toUpperCase() + e.shape.slice(1),
                onEvent,
                triggerDeath: () => handlePlayerLethalHit(state, e, onEvent, triggerDeath),
                deathCause: '',
                killerHp: e.hp,
                killerMaxHp: e.maxHp
            });

            if (kinLvl >= 1) triggerKineticBatteryZap(state, player);

            if (finalDmg > 0 || e.wormTrueDamage) {
                const harvestLvl = getHexLevel(state, 'GravitationalHarvest');
                if (harvestLvl > 0) {
                    const reflectedDmg = finalDmg * 0.10;
                    state.areaEffects.filter(ae => ae.type === 'epicenter').forEach(ae => {
                        state.enemies.forEach(target => {
                            if (!target.dead && !target.isFriendly && !target.isZombie) {
                                const d = Math.hypot(target.x - ae.x, target.y - ae.y);
                                if (d < ae.radius) {
                                    target.hp -= reflectedDmg;
                                    player.damageDealt += reflectedDmg;
                                    recordDamage(state, 'Gravitational Harvest', reflectedDmg, target);
                                    spawnFloatingNumber(state, target.x, target.y, Math.round(reflectedDmg).toString(), '#ef4444', false);
                                    if (target.hp <= 0 && !target.dead) {
                                        handleEnemyDeath(state, target, onEvent);
                                    }
                                }
                            }
                        });
                    });
                }
            }

            if (e.stunOnHit) {
                player.stunnedUntil = Math.max(state.gameTime, player.stunnedUntil || 0) + 1.0;
                playSfx('stun-disrupt');
            }

            if (onEvent) onEvent('player_hit', { dmg: e.wormTrueDamage ? (calcStat(player.hp) * 0.2) : finalDmg });
            const lastHit = e.lastCollisionDamage || 0;
            e.lastCollisionDamage = now;

            let canDie = true;
            if (e.legionId) {
                const lead = state.legionLeads?.[e.legionId];
                if (lead && (lead.legionShield || 0) > 0) {
                    canDie = false;
                    const contactShieldDmg = 20;
                    lead.legionShield = Math.max(0, (lead.legionShield || 0) - contactShieldDmg);
                    spawnFloatingNumber(state, e.x, e.y, Math.round(contactShieldDmg).toString(), '#60a5fa', false);
                }
            }

            if (e.dieOnCollision) {
                canDie = true;
            }

            const colCooldown = e.boss ? 0.5 : 0;
            if (canDie && (now - lastHit >= colCooldown)) {
                if (e.hp > 0) {
                    const colDmg = e.boss ? (e.maxHp * 0.2) : e.hp;
                    e.hp -= colDmg;
                    player.damageDealt += colDmg;
                    recordDamage(state, 'Collision', colDmg, e);

                    if (e.boss) {
                        const angle = Math.atan2(e.y - player.y, e.x - player.x);
                        const kbPower = 45;
                        e.knockback.x += Math.cos(angle) * kbPower;
                        e.knockback.y += Math.sin(angle) * kbPower;
                        spawnFloatingNumber(state, e.x, e.y, Math.round(colDmg).toString(), '#ef4444', true);
                    }
                }
                if (e.hp <= 0) {
                    handleEnemyDeath(state, e, onEvent);
                }
            }
        }
    });
}

export function triggerHiveMotherCone(state: GameState, player: Player, cursorX: number, cursorY: number) {
    const cloudX = cursorX;
    const cloudY = cursorY;
    const facing = Math.atan2(cloudY - player.y, cloudX - player.x);

    const cloudRadius = 200;
    const numProjectiles = 20 + player.level;
    const dmgPerNanite = calcStat(player.dmg, state.dmgAtkBuffMult);
    const spitCastId = Math.random();

    state.areaEffects.push({
        id: Date.now() + Math.random(),
        type: 'nanite_cloud',
        x: cloudX,
        y: cloudY,
        radius: cloudRadius,
        duration: 3.0,
        creationTime: state.gameTime,
        level: player.level,
        naniteSpawned: false,
        naniteCount: numProjectiles,
        naniteDmg: dmgPerNanite,
        ownerId: player.id,
        naniteSpitId: spitCastId,
        facingAngle: facing,
        originX: player.x,
        originY: player.y
    });

    playSfx('shoot');
}

export function spawnNanitesFromCloud(state: GameState, effect: import('../core/Types').AreaEffect) {
    const owner = state.players?.[effect.ownerId!] || state.player;
    const count = effect.naniteCount || 20;
    const dmg = effect.naniteDmg || 1;
    const spitId = effect.naniteSpitId || Math.random();

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * effect.radius * 0.8;
        const startX = effect.x + Math.cos(angle) * dist;
        const startY = effect.y + Math.sin(angle) * dist;

        const driftAngle = Math.random() * Math.PI * 2;
        const driftSpeed = 0.3 + Math.random() * 0.7;

        state.bullets.push({
            id: Math.random(),
            ownerId: owner.id,
            x: startX,
            y: startY,
            vx: Math.cos(driftAngle) * driftSpeed,
            vy: Math.sin(driftAngle) * driftSpeed,
            dmg,
            pierce: 0,
            life: 180,
            isEnemy: false,
            hits: new Set<number>(),
            color: '#22c55e',
            size: 4 + Math.random() * 4,
            isNanite: true,
            isHiveMotherSkill: true,
            hiveMotherSpitId: spitId,
            cloudCenterX: effect.x,
            cloudCenterY: effect.y,
            cloudRadius: effect.radius,
        });
    }
}

function handlePlayerLethalHit(state: GameState, e: Enemy, onEvent?: (type: string, data?: any) => void, triggerDeath?: () => void) {
    const { player } = state;
    if (isBuffActive(state, 'TEMPORAL_GUARD')) {
        player.curHp = calcStat(player.hp);
        let foundSafe = false;
        let safeX = player.x, safeY = player.y;
        let attempts = 0;
        while (!foundSafe && attempts < 20) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 2500 + Math.random() * 1500;
            const cx = player.x + Math.cos(angle) * dist, cy = player.y + Math.sin(angle) * dist;
            if (isInMap(cx, cy)) { safeX = cx; safeY = cy; foundSafe = true; }
            attempts++;
        }
        if (!foundSafe) {
            const center = ARENA_CENTERS.find(c => c.id === state.currentArena) || ARENA_CENTERS[0];
            safeX = center.x; safeY = center.y;
        }
        player.x = safeX; player.y = safeY;
        state.activeBlueprintBuffs.TEMPORAL_GUARD = 0;
        player.temporalGuardActive = false;
        const now = state.gameTime;
        player.invincibleUntil = now + 1.5;
        player.phaseShiftUntil = now + 1.5;
        spawnFloatingNumber(state, player.x, player.y, "TEMPORAL GUARD ACTIVATED", '#60a5fa', true);
        playSfx('rare-spawn');
    } else {
        state.gameOver = true;
        if (e.isAnomaly) player.deathCause = `Overlord (Lvl ${state.anomalyBossCount || 1})`;
        else if (e.legionId) player.deathCause = 'Legion Swarm';
        else if (e.isZombie) player.deathCause = 'Zombie Horde';
        else if (e.shape === 'minion') player.deathCause = 'Pentagon Minion';
        else if (e.boss) player.deathCause = `${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)} Boss Level ${e.bossTier || 1} Collision`;
        else if (e.isElite) player.deathCause = `Elite ${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)} Collision`;
        else player.deathCause = `${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)} Collision`;

        if (onEvent) onEvent('game_over');
        triggerDeath?.();
    }
}

export function triggerKineticBatteryZap(state: GameState, player: Player, source?: { x: number, y: number }) {
    const kinLvl = getHexLevel(state, 'DefBattery');
    if (kinLvl < 1) return;
    const now = state.gameTime;
    const cdMod = getCdMod(state, player);
    if (isOnCooldown(player.lastKineticShockwave ?? -999999, GAME_CONFIG.SKILLS.KINETIC_ZAP_COOLDOWN, cdMod, now)) return;

    player.lastKineticShockwave = now;
    const shockDmg = calcStat(player.arm, 1.0, state.assistant.history.curseIntensity || 1.0) * 1.0;


    const sx = source ? source.x : player.x;
    const sy = source ? source.y : player.y;

    let first: Enemy | null = null;
    let minD = Infinity;
    state.enemies.forEach(target => {
        if (target.dead || target.isNeutral || target.isZombie || target.isFriendly || target.wormBurrowState === 'underground') return;
        const d = Math.hypot(target.x - sx, target.y - sy);
        if (d < minD) { minD = d; first = target; }
    });

    if (first) {
        if (!state.pendingZaps) state.pendingZaps = [];
        const targetIds: number[] = [(first as Enemy).id];
        let currentInChain: Enemy = first;
        for (let i = 0; i < 9; i++) {
            let best: Enemy | null = null;
            let bestD = Infinity;
            state.enemies.forEach((cand: Enemy) => {
                if (cand.dead || cand.isNeutral || cand.isZombie || cand.isFriendly || targetIds.includes(cand.id) || cand.wormBurrowState === 'underground') return;
                const d = Math.hypot(cand.x - currentInChain.x, cand.y - currentInChain.y);
                if (d < bestD) { bestD = d; best = cand; }
            });
            if (best) { targetIds.push((best as Enemy).id); currentInChain = best; }
            else break;
        }

        state.pendingZaps.push({
            targetIds, dmg: shockDmg, nextZapTime: now, currentIndex: 0,
            sourcePos: { x: sx, y: sy }, history: [],
            travelProgress: 0, isHunting: true, color: '#60a5fa',
            applyStun: kinLvl >= 4
        });
        playSfx('wall-shock');
    }
}

export function triggerZombieZap(state: GameState, player: Player, source: { x: number, y: number }) {
    const now = state.gameTime;
    if (!state.pendingZaps) state.pendingZaps = [];


    const shockDmg = calcStat(player.arm, 1.0, state.assistant.history.curseIntensity || 1.0) * 0.2;

    let first: Enemy | null = null;
    let minD = Infinity;
    state.enemies.forEach(target => {
        if (target.dead || target.isNeutral || target.isZombie || target.isFriendly || target.wormBurrowState === 'underground') return;
        const d = Math.hypot(target.x - source.x, target.y - source.y);
        if (d < minD) { minD = d; first = target; }
    });

    if (first) {
        const targetIds: number[] = [(first as any).id];
        let currentInChain: Enemy = first;

        for (let i = 0; i < 2; i++) {
            let best: Enemy | null = null;
            let bestD = Infinity;
            state.enemies.forEach((cand: Enemy) => {
                if (cand.dead || cand.isNeutral || cand.isZombie || cand.isFriendly || targetIds.includes(cand.id) || cand.wormBurrowState === 'underground') return;
                const d = Math.hypot(cand.x - currentInChain.x, cand.y - currentInChain.y);
                if (d < bestD) { bestD = d; best = cand; }
            });
            if (best) {
                targetIds.push((best as any).id);
                currentInChain = best;
            } else break;
        }

        state.pendingZaps.push({
            targetIds, dmg: shockDmg, nextZapTime: now, currentIndex: 0,
            sourcePos: { x: source.x, y: source.y }, history: [],
            travelProgress: 0, isHunting: true, color: '#4ade80',
            applyStun: false,
            applyBleed: true
        });
        playSfx('wall-shock');
    }
}

export function spawnHuntingLine(state: GameState, x1: number, y1: number, x2: number, y2: number, color: string, progress: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(dist / 4);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const time = state.frameCount * 0.15;

    for (let i = 0; i <= steps * progress; i++) {
        const t = i / steps;

        const wobbleFactor = Math.min(1.0, t * 10);
        const wobble = (Math.sin(t * Math.PI * 3 + time) * 8 + Math.cos(t * Math.PI * 1.5 - time * 0.5) * 4) * wobbleFactor;

        const px = x1 + (x2 - x1) * t + Math.cos(angle + Math.PI / 2) * wobble;
        const py = y1 + (y2 - y1) * t + Math.sin(angle + Math.PI / 2) * wobble;


        state.particles.push({
            x: px, y: py, vx: 0, vy: 0, life: 8, color: '#fff',
            size: 0.6, type: 'spark', alpha: 1.0
        });

        state.particles.push({
            x: px, y: py, vx: 0, vy: 0, life: 12, color: color,
            size: 1.5, type: 'spark', alpha: 0.4
        });
    }
}

export function triggerKineticBolt(state: GameState, player: Player, source: { x: number, y: number }, targets: number, dmg: number, applyBleed: boolean = false, applyStun: boolean = false) {
    const now = state.gameTime;
    if (!state.pendingZaps) state.pendingZaps = [];


    const sortedEnemies = state.enemies
        .filter(e => !e.dead && !e.isNeutral && !e.isZombie && !e.isFriendly && e.wormBurrowState !== 'underground')
        .map(e => ({ e, d: Math.hypot(e.x - source.x, e.y - source.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, targets);

    sortedEnemies.forEach(entry => {
        state.pendingZaps!.push({
            targetIds: [entry.e.id],
            dmg,
            nextZapTime: now,
            currentIndex: 0,
            sourcePos: { x: source.x, y: source.y },
            applyBleed,
            travelProgress: 0,
            isHunting: true,
            color: '#dc2626',
            history: [],
            applyStun
        });
    });

    if (sortedEnemies.length > 0) {
        playSfx('impact');
    }
}

export function triggerStaticBolt(state: GameState, player: Player, source: { x: number, y: number }, targets: number, dmg: number, applyBleed: boolean = false) {
    const now = state.gameTime;
    if (!state.pendingZaps) state.pendingZaps = [];


    const sortedEnemies = state.enemies
        .filter(e => !e.dead && !e.isNeutral && !e.isZombie && !e.isFriendly && e.wormBurrowState !== 'underground')
        .map(e => ({ e, d: Math.hypot(e.x - source.x, e.y - source.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, targets);

    sortedEnemies.forEach(entry => {
        state.pendingZaps!.push({
            targetIds: [entry.e.id],
            dmg,
            nextZapTime: now,
            currentIndex: 0,
            sourcePos: { x: source.x, y: source.y },
            applyBleed,
            travelProgress: 0,
            isHunting: true,
            color: '#dc2626',
            history: [],
            applyStun: false
        });
    });

    if (sortedEnemies.length > 0) {
        playSfx('impact');
    }
}

function processPendingZaps(state: GameState, onEvent?: (type: string, data?: any) => void) {
    if (!state.pendingZaps || state.pendingZaps.length === 0) return;
    for (let i = state.pendingZaps.length - 1; i >= 0; i--) {
        const zap = state.pendingZaps[i];
        const target = state.enemies.find(e => e.id === zap.targetIds[zap.currentIndex]);

        if (target && !target.dead) {

            zap.travelProgress = (zap.travelProgress || 0) + 0.25;


            const destX = target.x;
            const destY = target.y;


            const boltColor = zap.color || '#60a5fa';
            spawnHuntingLine(state, zap.sourcePos.x, zap.sourcePos.y, destX, destY, boltColor, Math.min(1, zap.travelProgress));


            if (zap.travelProgress >= 1.0) {
                target.hp -= zap.dmg;
                state.player.damageDealt += zap.dmg;

                let source: import('../core/Types').DamageSource = 'Kinetic Bolt (LVL 1)';
                if (zap.color === '#4ade80') {
                    const bloodLvl = getHexLevel(state, 'BloodForgedCapacitor');
                    source = bloodLvl > 0 ? 'Necro-Kinetic Engine' : 'Crimson Feast (LVL 4)';
                }
                else if (zap.color === '#dc2626') {
                    const shatteredLvl = getHexLevel(state, 'ShatteredCapacitor');
                    source = shatteredLvl > 0 ? 'Shattered Capacitor (Arc)' : 'Kinetic Bolt (LVL 1)';
                }
                else if (zap.color === '#60a5fa') {
                    const kinLvl = getHexLevel(state, 'DefBattery');
                    source = kinLvl > 0 ? 'Kinetic Bolt (LVL 1)' : 'Static Bolt';
                }

                recordDamage(state, source, zap.dmg, target);

                spawnFloatingNumber(state, target.x, target.y, Math.round(zap.dmg).toString(), '#3b82f6', true);
                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
                else if (zap.applyStun) {
                    target.stunnedUntil = Math.max(target.stunnedUntil || 0, state.gameTime + 0.5);
                }

                const bloodLevel = getHexLevel(state, 'BloodForgedCapacitor');
                const player = state.player;
                if (bloodLevel >= 5 && !player.healingDisabled) {
                    const heal = zap.dmg * 0.01;
                    applyHealToPlayer(state, player, heal, 'Lifesteal');
                }

                if (zap.applyBleed) {
                    const armorValue = calcStat(player.arm, 1.0, state.assistant.history.curseIntensity || 1.0);
                    target.bleedDmg = armorValue * 0.025;
                    target.bleedTimer = 180;
                    target.bleedAccumulator = 0;
                }

                const boltColor = zap.color || '#60a5fa';
                state.particles.push({ x: target.x, y: target.y, vx: 0, vy: 0, life: 10, color: boltColor, size: 20, type: 'shockwave', alpha: 0.8 });

                zap.currentIndex++;
                zap.sourcePos = { x: target.x, y: target.y };
                zap.travelProgress = 0;

                if (zap.currentIndex >= zap.targetIds.length) {
                    state.pendingZaps.splice(i, 1);
                }
            }
        } else {

            zap.currentIndex++;
            if (zap.currentIndex >= zap.targetIds.length) {
                state.pendingZaps.splice(i, 1);
            } else {
                zap.travelProgress = 0;
            }
        }
    }
}

export function spawnLightning(state: GameState, x1: number, y1: number, x2: number, y2: number, color: string, isBranch: boolean = false, isStraight: boolean = false, lifeOverride?: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const segments = isStraight ? Math.max(1, Math.floor(dist / 80)) : Math.max(2, Math.floor(dist / 40));
    let lastX = x1, lastY = y1;

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        let targetX = x1 + (x2 - x1) * t, targetY = y1 + (y2 - y1) * t;
        if (i < segments && !isStraight) {
            const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
            const jitterAmount = (Math.random() - 0.5) * (isBranch ? 30 : 60);
            targetX += Math.cos(angle) * jitterAmount;
            targetY += Math.sin(angle) * jitterAmount;
        }

        const segDist = Math.hypot(targetX - lastX, targetY - lastY);
        const dots = Math.floor(segDist / 1.5);
        for (let j = 0; j < dots; j++) {
            const tt = j / dots;
            const px = lastX + (targetX - lastX) * tt, py = lastY + (targetY - lastY) * tt;

            state.particles.push({
                x: px, y: py, vx: 0, vy: 0,
                life: lifeOverride || 6, color: '#fff',
                size: 0.5, type: 'spark', alpha: 1.0
            });

            state.particles.push({
                x: px, y: py, vx: 0, vy: 0,
                life: (lifeOverride ? lifeOverride + 2 : 8), color: color,
                size: isBranch ? 1.0 : 1.5, type: 'spark', alpha: 0.6
            });
        }

        lastX = targetX; lastY = targetY;
    }
}
