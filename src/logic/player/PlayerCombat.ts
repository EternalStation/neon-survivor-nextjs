
import type { GameState, Enemy } from '../core/types';
import { getPlayerThemeColor } from '../utils/helpers';
import { GAME_CONFIG } from '../core/GameConfig';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { playSfx, fadeOutMusic } from '../audio/AudioLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { ARENA_CENTERS, isInMap } from '../mission/MapLogic';

export function handlePlayerCombat(
    state: GameState,
    mouseOffset?: { x: number, y: number },
    onEvent?: (type: string, data?: any) => void
) {
    const { player } = state;

    // --- Kinetic Battery Skill Sync ---
    const kinSkill = player.activeSkills.find(s => s.type === 'KineticBattery');
    if (kinSkill) {
        const boltElapsed = state.gameTime - (player.lastKineticShockwave || 0);
        const boltCD = Math.max(0, 5.0 - boltElapsed);
        kinSkill.cooldown = boltCD;
        kinSkill.cooldownMax = 5.0;
    }

    // RADIATION CORE (Combat - Arena 1)
    const radLvl = getHexLevel(state, 'RadiationCore');
    if (radLvl >= 1) {
        if (state.frameCount % 10 === 0) {
            const m = getHexMultiplier(state, 'RadiationCore');
            const range = 500;
            const maxHp = calcStat(player.hp, state.hpRegenBuffMult);
            let dmgAmp = 1.0 * m;
            if (radLvl >= 3) {
                const missing = 1 - (player.curHp / maxHp);
                if (missing > 0) dmgAmp += missing;
            }

            const maxDmgPct = 0.10 * dmgAmp;
            const minDmgPct = 0.05 * dmgAmp;
            const playerMaxHp = calcStat(player.hp, state.hpRegenBuffMult);
            const enemiesInAura: Enemy[] = [];

            state.enemies.forEach(e => {
                if (e.dead || e.isNeutral) return;

                const d = Math.hypot(e.x - player.x, e.y - player.y);
                let tickDmg = 0;

                if (radLvl >= 4) {
                    tickDmg += (e.maxHp * 0.01 * dmgAmp) / 6;
                }

                if (d < range) {
                    enemiesInAura.push(e);
                    const distFactor = 1 - (d / range);
                    const auraPct = minDmgPct + (distFactor * (maxDmgPct - minDmgPct));
                    tickDmg += (playerMaxHp * auraPct) / 6;
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
                        const isAuraSource = d < range;
                        const shouldShowText = isAuraSource ? (Math.random() < 0.3) : (Math.floor(state.gameTime * 2) > Math.floor((state.gameTime - 1 / 60) * 2));

                        if (shouldShowText) {
                            const color = isAuraSource ? '#22c55e' : '#4ade80';
                            spawnFloatingNumber(state, e.x, e.y, Math.round(tickDmg * 6).toString(), color, false);
                        }

                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
                    }
                }
            });

            if (radLvl >= 2 && enemiesInAura.length > 0) {
                const healPerEnemy = playerMaxHp * (0.002 * m) / 6;
                const totalHeal = healPerEnemy * enemiesInAura.length;
                player.curHp = Math.min(maxHp, player.curHp + totalHeal);
            }
        }

        if (state.frameCount % 10 === 0) {
            const range = 500;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * range;
            state.particles.push({
                x: player.x + Math.cos(angle) * dist,
                y: player.y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                life: 60, maxLife: 60, color: '#bef264',
                size: 6 + Math.random() * 8, type: 'bubble', alpha: 0.5
            });
        }
    }

    // Aiming Logic
    if (player.playerClass === 'malware' && mouseOffset) {
        player.targetAngle = Math.atan2(mouseOffset.y, mouseOffset.x);
        player.targetX = player.x + mouseOffset.x;
        player.targetY = player.y + mouseOffset.y;
    } else {
        let nearest: Enemy | null = null;
        let minDist = 800;
        state.enemies.forEach((e: Enemy) => {
            if (e.dead || e.isNeutral || e.isZombie) return;
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

    // Contact Damage
    handleEnemyContact(state, onEvent);

    // Pending Zaps
    processPendingZaps(state, onEvent);
}

export function handleEnemyContact(state: GameState, onEvent?: (type: string, data?: any) => void) {
    const { player } = state;
    const now = state.gameTime;
    const kinLvl = getHexLevel(state, 'KineticBattery');

    state.enemies.forEach(e => {
        if (e.dead || e.hp <= 0 || e.isZombie || (e.legionId && !e.legionReady) || e.wormBurrowState === 'underground') return;

        const dToE = Math.hypot(e.x - player.x, e.y - player.y);
        const contactDist = e.size + 18;

        if (dToE < contactDist) {
            let rawDmg = 0;
            if (!e.isNeutral && !e.isAssembling) {
                const isLinked = e.soulLinkHostId !== undefined || (e.soulLinkTargets && e.soulLinkTargets.length > 0);
                if (isLinked) {
                    const linkColor = getPlayerThemeColor(state);
                    rawDmg = e.hp * 0.30;
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
                        state.player.damageDealt += splitDmg;
                        spawnFloatingNumber(state, target.x, target.y, Math.round(splitDmg).toString(), linkColor, false);
                    });
                    if (!e.boss) e.hp = 0;
                } else if (e.shape === 'minion' && e.parentId !== undefined) {
                    const mother = state.enemies.find(m => m.id === e.parentId);
                    rawDmg = (mother ? mother.hp : e.hp) * (e.stunOnHit ? GAME_CONFIG.ENEMY.MINION_STUN_DAMAGE_RATIO : GAME_CONFIG.ENEMY.MINION_DAMAGE_RATIO);
                } else if (e.customCollisionDmg !== undefined) {
                    const playerMaxHp = calcStat(player.hp);
                    rawDmg = playerMaxHp * (e.customCollisionDmg / 100) * (e.hp / e.maxHp);
                } else {
                    rawDmg = Math.pow(e.maxHp, GAME_CONFIG.ENEMY.COLLISION_POWER_SCALING);
                }
            }


            const armorValue = calcStat(player.arm);
            const drCap = 0.95;
            const armRedMult = 1 - getDefenseReduction(armorValue, drCap);

            if (kinLvl >= 1) triggerKineticBatteryZap(state, player, kinLvl);

            const colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill');
            const colRedMult = 1 - (Math.min(80, colRedRaw) / 100);

            const dmgAfterArmor = rawDmg * armRedMult;
            player.damageBlockedByArmor += (rawDmg - dmgAfterArmor);

            let reducedDmg = dmgAfterArmor * colRedMult;
            player.damageBlockedByCollisionReduc += (dmgAfterArmor - reducedDmg);
            player.damageBlocked += (rawDmg - reducedDmg);

            if (player.buffs?.epicenterShield && player.buffs.epicenterShield > 0) {
                player.damageBlocked += reducedDmg;
                reducedDmg = 0;
            }

            // Epicenter Level 2 (DMG reduction increased by 50% while channeling)
            if (player.immobilized && getHexLevel(state, 'DefEpi') >= 2) {
                const epiDmgRed = reducedDmg * 0.5;
                player.damageBlocked += epiDmgRed;
                reducedDmg *= 0.5;
            }

            if (player.invincibleUntil && state.gameTime < player.invincibleUntil) {
                player.damageBlocked += reducedDmg;
                reducedDmg = 0;
            }

            const finalDmg = Math.max(0, reducedDmg);

            if (finalDmg > 0 || e.wormTrueDamage) {
                let absorbed = 0;
                let damageToApply = finalDmg;

                // --- SPECIAL: Worm Head True Damage (Pierces Armor & Reduction) ---
                if (e.wormRole === 'head' && e.wormTrueDamage) {
                    const playerMaxHp = calcStat(player.hp);
                    damageToApply = playerMaxHp * (e.wormTrueDamage / 100);
                }

                if (player.shieldChunks && player.shieldChunks.length > 0) {
                    player.shieldChunks.sort((a, b) => a.expiry - b.expiry);
                    let rem = damageToApply;
                    for (const chunk of player.shieldChunks) {
                        if (chunk.amount >= rem) {
                            chunk.amount -= rem; absorbed += rem; rem = 0; break;
                        } else {
                            absorbed += chunk.amount; rem -= chunk.amount; chunk.amount = 0;
                        }
                    }
                    player.shieldChunks = player.shieldChunks.filter(c => c.amount > 0);
                    player.damageBlockedByShield += absorbed;
                    player.damageBlocked += absorbed;
                }

                const actualDmg = damageToApply - absorbed;
                if (actualDmg > 0) {
                    player.curHp -= actualDmg;
                    player.damageTaken += actualDmg;
                }
                spawnFloatingNumber(state, player.x, player.y, Math.round(damageToApply).toString(), '#ef4444', false);
            }

            if (e.stunOnHit) {
                player.stunnedUntil = Math.max(state.gameTime, player.stunnedUntil || 0) + 1.0;
                playSfx('stun-disrupt');
            }

            if (onEvent) onEvent('player_hit', { dmg: e.wormTrueDamage ? (calcStat(player.hp) * 0.2) : finalDmg });
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

            // --- SPECIAL: Worm Body Segments die on collision ---
            if (e.dieOnCollision) {
                canDie = true;
            }

            if (canDie && (!e.lastCollisionDamage || now - e.lastCollisionDamage <= 10)) {
                handleEnemyDeath(state, e, onEvent);
            }

            if (player.curHp <= 0 && !state.gameOver) {
                handlePlayerLethalHit(state, e, onEvent);
            }
        }
    });
}

function handlePlayerLethalHit(state: GameState, e: Enemy, onEvent?: (type: string, data?: any) => void) {
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
        if (e.legionId) player.deathCause = 'Legion Swarm';
        else if (e.isZombie) player.deathCause = 'Zombie Horde';
        else if (e.shape === 'minion') player.deathCause = 'Pentagon Minion';
        else if (e.boss) player.deathCause = `Boss ${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)} (Lvl ${e.bossTier || 1})`;
        else if (e.isElite) player.deathCause = `Collision with Elite ${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)}`;
        else player.deathCause = `Collision with ${e.shape.charAt(0).toUpperCase() + e.shape.slice(1)}`;

        if (onEvent) onEvent('game_over');
        fadeOutMusic(7.0);
    }
}

export function triggerKineticBatteryZap(state: GameState, source: { x: number, y: number }, _kinLvl: number) {
    const actualKinLvl = getHexLevel(state, 'KineticBattery');
    if (actualKinLvl < 1) return;
    const now = state.gameTime;
    if (state.player.lastKineticShockwave && now < state.player.lastKineticShockwave + 5.0) return;

    state.player.lastKineticShockwave = now;
    const shockDmg = calcStat(state.player.arm) * 1.0; // Updated to 100% Armor

    let first: Enemy | null = null;
    let minD = Infinity;
    state.enemies.forEach(target => {
        if (target.dead || target.isNeutral) return;
        const d = Math.hypot(target.x - source.x, target.y - source.y);
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
                if (cand.dead || cand.isNeutral || targetIds.includes(cand.id)) return;
                const d = Math.hypot(cand.x - currentInChain.x, cand.y - currentInChain.y);
                if (d < bestD) { bestD = d; best = cand; }
            });
            if (best) { targetIds.push((best as Enemy).id); currentInChain = best; }
            else break;
        }

        state.pendingZaps.push({
            targetIds, dmg: shockDmg, nextZapTime: now, currentIndex: 0,
            sourcePos: { x: source.x, y: source.y }, history: []
        });
        playSfx('wall-shock');
    }
}

function processPendingZaps(state: GameState, onEvent?: (type: string, data?: any) => void) {
    if (!state.pendingZaps || state.pendingZaps.length === 0) return;
    for (let i = state.pendingZaps.length - 1; i >= 0; i--) {
        const zap = state.pendingZaps[i];
        if (state.gameTime >= zap.nextZapTime) {
            const target = state.enemies.find(e => e.id === zap.targetIds[zap.currentIndex]);
            if (target && !target.dead) {
                target.hp -= zap.dmg;
                spawnFloatingNumber(state, target.x, target.y, Math.round(zap.dmg).toString(), '#3b82f6', true);
                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
                spawnLightning(state, zap.sourcePos.x, zap.sourcePos.y, target.x, target.y, '#60a5fa', false, true, 10);
                state.particles.push({ x: target.x, y: target.y, vx: 0, vy: 0, life: 10, color: '#60a5fa', size: 20, type: 'shockwave', alpha: 0.8 });
                zap.currentIndex++;
                zap.nextZapTime = state.gameTime + 0.016;
                zap.sourcePos = { x: target.x, y: target.y };
                if (zap.currentIndex >= zap.targetIds.length) state.pendingZaps.splice(i, 1);
            } else {
                zap.currentIndex++;
                if (zap.currentIndex >= zap.targetIds.length) state.pendingZaps.splice(i, 1);
                else zap.nextZapTime = state.gameTime;
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
        const dots = Math.floor(segDist / 2);
        for (let j = 0; j < dots; j++) {
            const tt = j / dots;
            const px = lastX + (targetX - lastX) * tt, py = lastY + (targetY - lastY) * tt;
            state.particles.push({ x: px, y: py, vx: 0, vy: 0, life: lifeOverride || 6, color: '#fff', size: 0.2, type: 'spark', alpha: 1.0 });
            state.particles.push({ x: px, y: py, vx: 0, vy: 0, life: lifeOverride ? lifeOverride + 2 : 8, color: color, size: isBranch ? 0.8 : 1.5, type: 'spark', alpha: 0.4 });
        }

        if (isStraight && !isBranch) {
            const branchCount = Math.floor(Math.random() * 5) + 2;
            for (let b = 0; b < branchCount; b++) {
                if (Math.random() < 0.9) {
                    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 4.0;
                    const len = 15 + Math.random() * 45;
                    spawnLightning(state, targetX, targetY, targetX + Math.cos(angle) * len, targetY + Math.sin(angle) * len, color, true, false, 6);
                }
            }
        }
        lastX = targetX; lastY = targetY;
    }
}
