import { GameState, Bullet, Player } from '../core/types';
import { isInMap, getHexDistToWall } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { getPlayerThemeColor } from '../utils/helpers';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { triggerKineticBolt } from '../player/PlayerCombat';
import { recordDamage } from '../utils/DamageTracking';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';

export function updateSinglePlayerBullet(
    state: GameState,
    b: Bullet,
    owner: Player,
    bullets: Bullet[],
    index: number,
    onEvent?: (event: string, data?: any) => void
): boolean {
    let bulletRemoved = false;
    const now = state.gameTime;


    if (!(b.hits instanceof Set)) {
        const oldHits = (b as any).hits;
        b.hits = new Set();
        if (oldHits && typeof oldHits === 'object') {
            Object.values(oldHits).forEach((v: any) => b.hits.add(v));
        }
    }


    b.x += b.vx;
    b.y += b.vy;
    b.life--;


    if (!isInMap(b.x, b.y)) {
        if (owner.playerClass === 'malware') {
            const p = ['#d946ef', '#8b5cf6', '#3b82f6', '#0ea5e9', '#22d3ee', '#f8fafc', '#fbbf24', '#ef4444'];
            b.color = p[Math.min(b.bounceCount || 0, p.length - 1)];

            const { dist, normal } = getHexDistToWall(b.x, b.y);
            const dot = b.vx * normal.x + b.vy * normal.y;

            if (dot < 0) {
                const speedMult = 1 + (b.bounceSpeedBonus || 0.01);
                b.vx = (b.vx - 2 * dot * normal.x) * speedMult;
                b.vy = (b.vy - 2 * dot * normal.y) * speedMult;
                b.dmg *= 1 + (b.bounceDmgMult || 0.2);
                b.bounceCount = (b.bounceCount || 0) + 1;
                b.x += normal.x * (Math.abs(dist) + 5);
                b.y += normal.y * (Math.abs(dist) + 5);
            }
            if (b.life <= 0 || b.pierce < 0) {
                bullets.splice(index, 1);
                return true;
            }
            return false;
        }

        spawnParticles(state, b.x, b.y, b.color || '#22d3ee', 4);
        if (b.vortexState === 'orbiting' && b.orbitDist && owner.aigisRings?.[b.orbitDist]) {
            const ringData = owner.aigisRings[b.orbitDist];
            if (ringData.count > 0) {
                ringData.count--;
                ringData.totalDmg -= b.dmg;
            }
        }
        bullets.splice(index, 1);
        return true;
    }


    if (owner.playerClass === 'malware' && owner.sandboxActive && owner.sandboxUntil && now < owner.sandboxUntil && !b.isNanite) {
        const sbx = owner.sandboxX ?? 0;
        const sby = owner.sandboxY ?? 0;
        const R = GAME_CONFIG.SKILLS.SANDBOX_RADIUS;
        const rotation = -Math.PI / 2;
        const apothem = R * Math.cos(Math.PI / 6);
        const dx = b.x - sbx;
        const dy = b.y - sby;

        let maxOvershoot = -Infinity;
        let bestNormalX = 0;
        let bestNormalY = 0;

        for (let i = 0; i < 6; i++) {
            const faceAngle = rotation + Math.PI / 6 + (Math.PI * 2 * i) / 6;
            const nx = Math.cos(faceAngle);
            const ny = Math.sin(faceAngle);
            const dist = dx * nx + dy * ny;
            const overshoot = dist - apothem;
            if (overshoot > maxOvershoot) {
                maxOvershoot = overshoot;
                bestNormalX = nx;
                bestNormalY = ny;
            }
        }

        const isInsideNow = maxOvershoot <= 0;

        if (isInsideNow) {
            b.insideSandbox = true;
        } else if (b.insideSandbox) {
            b.x -= bestNormalX * (maxOvershoot + 2);
            b.y -= bestNormalY * (maxOvershoot + 2);

            const dot = b.vx * bestNormalX + b.vy * bestNormalY;
            if (dot > 0) {
                b.vx -= 2 * dot * bestNormalX;
                b.vy -= 2 * dot * bestNormalY;

                const speedMult = 1 + (b.bounceSpeedBonus || 0.01);
                b.vx *= speedMult;
                b.vy *= speedMult;
                b.dmg *= 1 + (b.bounceDmgMult || 0.2);
                b.bounceCount = (b.bounceCount || 0) + 1;

                const p = ['#d946ef', '#8b5cf6', '#3b82f6', '#0ea5e9', '#22d3ee', '#f8fafc', '#fbbf24', '#ef4444'];
                b.color = p[Math.min(b.bounceCount, p.length - 1)];
            }
        }
    }


    if (owner.playerClass === 'malware' && (b.bounceCount || 0) > 0) {
        if (!b.trails) b.trails = [];
        b.trails.unshift({ x: b.x, y: b.y });
        const maxTrail = (b.bounceCount || 0) * 2;
        if (b.trails.length > maxTrail) b.trails.pop();
    }


    if (b.isNanite && b.isHiveMotherSkill && b.cloudCenterX !== undefined && b.cloudCenterY !== undefined && !b.naniteTargetId) {
        const cx = b.cloudCenterX;
        const cy = b.cloudCenterY;
        const cr = b.cloudRadius || 150;
        const distToCenter = Math.hypot(b.x - cx, b.y - cy);

        if (distToCenter > cr * 0.7) {
            const pullAngle = Math.atan2(cy - b.y, cx - b.x);
            b.vx += Math.cos(pullAngle) * 0.3;
            b.vy += Math.sin(pullAngle) * 0.3;
        }

        const driftAngle = Math.sin(state.gameTime * 3 + b.id * 7) * Math.PI;
        b.vx += Math.cos(driftAngle) * 0.05;
        b.vy += Math.sin(driftAngle) * 0.05;

        const spd = Math.hypot(b.vx, b.vy);
        if (spd > 1.5) {
            b.vx *= 1.5 / spd;
            b.vy *= 1.5 / spd;
        }

        let nearestId: number | undefined;
        let nearestDist = Infinity;
        for (const e of state.enemies) {
            if (e.dead || e.isNeutral || e.isZombie || e.wormBurrowState === 'underground'
                || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) continue;
            const d = Math.hypot(e.x - cx, e.y - cy);
            if (d <= cr) {
                const db = Math.hypot(e.x - b.x, e.y - b.y);
                if (db < nearestDist) { nearestDist = db; nearestId = e.id; }
            }
        }
        if (nearestId !== undefined) {
            b.naniteTargetId = nearestId;
        }
    }


    if (b.isNanite && b.naniteTargetId) {
        const target = state.enemies.find(e => e.id === b.naniteTargetId && !e.dead);
        if (target) {
            const angleToTarget = Math.atan2(target.y - b.y, target.x - b.x);
            const speed = 12 * (state.gameSpeedMult ?? 1);
            const tx = Math.cos(angleToTarget) * speed;
            const ty = Math.sin(angleToTarget) * speed;
            b.vx += (tx - b.vx) * 0.15 + (Math.random() - 0.5) * 4.0;
            b.vy += (ty - b.vy) * 0.15 + (Math.random() - 0.5) * 4.0;
        } else {
            if (b.isHiveMotherSkill && b.cloudCenterX !== undefined) {
                b.naniteTargetId = undefined;
            } else {
                b.life = 0;
            }
        }
    } else if (b.isNanite && b.isWobbly) {
        const speed = GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
        const currentAngle = Math.atan2(b.vy, b.vx);
        const wobble = Math.sin(state.gameTime * 15 + b.id) * 0.1;
        b.vx = Math.cos(currentAngle + wobble) * speed;
        b.vy = Math.sin(currentAngle + wobble) * speed;
    }


    if (b.vortexState === 'orbiting') {
        const vortexActive = owner.orbitalVortexUntil && owner.orbitalVortexUntil > now;
        const orbitSpeedMult = vortexActive ? GAME_CONFIG.SKILLS.ORBITAL_VORTEX_SPEED_MULT : 1.0;
        b.orbitAngle = (b.orbitAngle || 0) + 0.05 * (state.gameSpeedMult ?? 1) * orbitSpeedMult;
        const dist = b.orbitDist || 125;
        b.x = owner.x + Math.cos(b.orbitAngle) * dist;
        b.y = owner.y + Math.sin(b.orbitAngle) * dist;
        b.vx = 0; b.vy = 0;
    }

    if (b.isRing) {
        const vortexActive = owner.orbitalVortexUntil && owner.orbitalVortexUntil > now;
        b.ringVisualIntensity = vortexActive ? (0.6 + Math.abs(Math.sin(now * 8)) * 0.4) : undefined;
        b.x = owner.x;
        b.y = owner.y;
        const currentCount = owner.aigisRings?.[b.ringRadius!]?.count || 0;
        b.ringAmmo = currentCount;

        if (currentCount < 190) {
            b.life = 0;
            const ringData = owner.aigisRings![b.ringRadius!];
            const countToSpawn = ringData.count;
            const avgDmg = ringData.count > 0 ? (ringData.totalDmg / ringData.count) : 0;

            for (let k = 0; k < countToSpawn; k++) {
                const angle = (k / countToSpawn) * Math.PI * 2 + (state.gameTime * 0.05);
                bullets.push({
                    ...b, id: Math.random(), isRing: false, vortexState: 'orbiting',
                    orbitAngle: angle, orbitDist: b.ringRadius,
                    x: owner.x + Math.cos(angle) * b.ringRadius!,
                    y: owner.y + Math.sin(angle) * b.ringRadius!,
                    dmg: avgDmg, color: b.color, life: 999999,
                    vx: 0, vy: 0, hits: new Set(), pierce: 0, isEnemy: false, size: 4
                });
            }
            bullets.splice(index, 1);
            return true;
        }

        const wallInfo = getHexDistToWall(b.x, b.y);
        if (wallInfo.dist < (b.ringRadius! + 50)) {
            const ringData = owner.aigisRings![b.ringRadius!];
            if (ringData.count > 0) {
                const avgDmg = ringData.totalDmg / ringData.count;
                const actualDrain = Math.min(5, ringData.count);
                ringData.count -= actualDrain;
                ringData.totalDmg -= avgDmg * actualDrain;
                b.ringAmmo = ringData.count;
                if (Math.random() < 0.3) {
                    const sparkX = b.x - wallInfo.normal.x * b.ringRadius!;
                    const sparkY = b.y - wallInfo.normal.y * b.ringRadius!;
                    spawnParticles(state, sparkX, sparkY, b.color || '#22d3ee', 2);
                }
            }
        }

        const nearbyEnemies = state.spatialGrid.query(b.x, b.y, b.ringRadius! + 250);
        for (const e of nearbyEnemies) {
            if (e.dead || e.isFriendly || e.isZombie || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) continue;
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            const ringThickness = 25;
            const entityHitRadius = e.size + ringThickness;
            if (Math.abs(dist - b.ringRadius!) < entityHitRadius) {
                const ringData = owner.aigisRings![b.ringRadius!];
                if (ringData.count <= 0) break;
                const avgDmg = ringData.totalDmg / ringData.count;
                ringData.count--;
                ringData.totalDmg -= avgDmg;
                b.ringAmmo = ringData.count;
                e.hp -= avgDmg;
                e.lastHitTime = state.gameTime;
                owner.damageDealt += avgDmg;
                recordDamage(state, 'Aegis Rings', avgDmg);
                if (Math.random() < 0.2) spawnFloatingNumber(state, e.x, e.y, Math.round(avgDmg).toString(), b.color || '#22d3ee', false);
                spawnParticles(state, e.x, e.y, b.color || '#22d3ee', 1);
                if (e.hp <= 0 && !e.dead) {
                    if (b.isTsunami) owner.kineticTsunamiWaveSouls = (owner.kineticTsunamiWaveSouls || 0) + (e.isElite ? 10 : 1);
                    handleEnemyDeath(state, e, onEvent);
                }
            }
        }
        return false;
    }

    if (b.isShockwaveCircle && b.maxLife && b.maxSize) {
        b.size = b.maxSize * (1 - (b.life / b.maxLife));
    }

    const searchRadius = typeof b.size === 'number' && b.size > 50 ? b.size + 100 : 100;
    const nearbyEnemies = state.spatialGrid.query(b.x, b.y, searchRadius);

    for (let j = 0; j < nearbyEnemies.length; j++) {
        const e = nearbyEnemies[j];
        if (e.dead || b.hits.has(e.id) || e.isFriendly || e.isZombie || (e.legionId && !e.legionReady) || e.wormBurrowState === 'underground' || e.soulSuckActive || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) continue;

        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        let hitRadius = e.size + (e.boss ? 35 : 10);
        if (b.isShockwaveCircle && typeof b.size === 'number') hitRadius += b.size;

        if (e.shape === 'square' && e.boss && e.orbitalShields && e.orbitalShields > 0 && dist < 110) {
            const angleToBullet = Math.atan2(b.y - e.y, b.x - e.x);
            const reflectAngle = angleToBullet + Math.PI + (Math.random() - 0.5) * 0.4;
            b.vx = Math.cos(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
            b.vy = Math.sin(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
            if (owner.playerClass === 'malware') {
                b.bounceCount = (b.bounceCount || 0) + 1;
                b.dmg *= (1 + (b.bounceDmgMult || 0.2));
            }
            playSfx('impact');
            continue;
        }

        if (dist < hitRadius) {
            if (b.slowPercent) {
                e.slowUntil = now + (b.freezeDuration || 2.0);
                e.slowPercentVal = Math.max(e.slowPercentVal || 0, b.slowPercent);
                spawnParticles(state, e.x, e.y, b.color || '#22d3ee', 3);
            }

            let baseDmg = b.dmg;
            let lvl4PuddleBonus = 0;
            if (e.takenDamageMultiplier && e.takenDamageMultiplier > 1) {
                lvl4PuddleBonus = baseDmg * (e.takenDamageMultiplier - 1);
                baseDmg *= e.takenDamageMultiplier;
            }

            const critMult = b.critMult || 1.0;
            const critBonusBase = b.isCrit ? (baseDmg - (baseDmg / critMult)) : 0;
            let deathMarkBonus = 0;

            const critLvl = getHexLevel(state, 'ComCrit');
            const shatterLvl = getHexLevel(state, 'SoulShatterCore');
            if ((critLvl >= 3 || shatterLvl > 0) && e.deathMarkExpiry && now < e.deathMarkExpiry) {
                const totalDmg = (baseDmg / critMult) * Math.max(critMult, GAME_CONFIG.SKILLS.DEATH_MARK_MULT);
                deathMarkBonus = totalDmg - baseDmg;
                baseDmg = totalDmg;
                spawnParticles(state, e.x, e.y, '#FF0000', 3);
                e.critGlitchUntil = now + 100;
            }
            let damageAmount = baseDmg;

            if (e.shape === 'triangle' && e.deflectState && Math.random() < 0.5) {
                const deflectAngle = Math.atan2(b.y - e.y, b.x - e.x) + (Math.random() - 0.5) * 2.5;
                b.vx = Math.cos(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                b.vy = Math.sin(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                b.life = 120;
                b.hits.add(e.id);
                spawnParticles(state, b.x, b.y, '#FFFFFF', 5);
                playSfx('impact');
                continue;
            }

            const aoeChance = calculateLegendaryBonus(state, 'aoe_chance_per_kill', false, owner);
            if (aoeChance > 0 && Math.random() < aoeChance / 100) {
                const aoeRadius = 100;
                const aoeDmg = damageAmount;
                spawnParticles(state, e.x, e.y, b.color || '#fff', 15);
                state.spatialGrid.query(e.x, e.y, aoeRadius).forEach(t => {
                    if (t.id !== e.id && !t.dead && !t.isFriendly && Math.hypot(t.x - e.x, t.y - e.y) <= aoeRadius) {
                        t.hp -= aoeDmg;
                        owner.damageDealt += aoeDmg;
                        recordDamage(state, 'Storm of Steel (LVL 4)', aoeDmg, t);
                        if (t.hp <= 0 && !t.dead) {
                            if (b.isTsunami) owner.kineticTsunamiWaveSouls = (owner.kineticTsunamiWaveSouls || 0) + (t.isElite ? 10 : 1);
                            handleEnemyDeath(state, t, onEvent);
                        }
                    }
                });
            }

            const lifeLevel = getHexLevel(state, 'ComLife');
            if (lifeLevel >= 3 && !e.boss) {
                const bonusDmg = e.maxHp * 0.02;
                e.hp -= bonusDmg;
                owner.damageDealt += bonusDmg;
                recordDamage(state, 'Projectile', bonusDmg, e);
            }

            if (b.burnDamage) {
                e.burnStack = (e.burnStack || 0) + b.burnDamage;
                e.burnTimer = 300;
                spawnParticles(state, e.x, e.y, '#ef4444', 3);
            }

            if (b.isBomb && b.explodeRadius) {
                spawnParticles(state, b.x, b.y, '#3b82f6', 20);
                playSfx('shatter');
                state.spatialGrid.query(b.x, b.y, b.explodeRadius).forEach(t => {
                    if (!t.dead && !t.isFriendly && Math.hypot(t.x - b.x, t.y - b.y) <= b.explodeRadius!) {
                        t.frozen = Math.max(t.frozen || 0, Math.min(3.0, b.freezeDuration || 3.0));
                    }
                });
                b.life = 0;
                continue;
            }

            if (b.isNanite) {
                if (b.isHiveMotherSkill) {
                    damageAmount = 0;
                    b.life = 0;

                    if (e.lastSpitHitId !== b.hiveMotherSpitId) {
                        const nanitesToApply = 4 + Math.floor(owner.level / 10);
                        const resonance = getChassisResonance(state);
                        const baseSwarmPct = 0.05 * (1 + resonance);
                        const groupDmg = b.dmg * baseSwarmPct * nanitesToApply;

                        e.slowFactor = Math.max(e.slowFactor || 0, 0.3);
                        e.slowUntil = 999999999;

                        if (!e.naniteGroups) e.naniteGroups = [];
                        e.naniteGroups.push({ count: nanitesToApply, dmgPerSecond: groupDmg, spitId: b.hiveMotherSpitId! });

                        e.activeNaniteCount = (e.activeNaniteCount || 0) + nanitesToApply;
                        e.activeNaniteDmg = (e.activeNaniteDmg || 0) + groupDmg;

                        e.isInfected = true;
                        e.infectedUntil = 999999999;
                        e.lastSpitHitId = b.hiveMotherSpitId;
                    }
                } else {
                    damageAmount = 0;
                    e.isInfected = true;
                    e.infectedUntil = 999999999;
                    e.infectionDmg = Math.max(e.infectionDmg || 0, b.dmg);
                }
            }

            if (e.legionId) {
                const lead = state.legionLeads?.[e.legionId];
                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                    const shieldDmg = Math.min(damageAmount, lead.legionShield!);
                    lead.legionShield! -= shieldDmg;
                    damageAmount -= shieldDmg;
                    if (damageAmount <= 0) { b.hits.add(e.id); if (!b.isHyperPulse) b.pierce--; }
                }
            }

            if (e.thorns && damageAmount > 0) {
                let reflected = Math.min(damageAmount, e.hp) * e.thorns;
                if (!e.thornsIgnoresArmor) reflected *= (1 - getDefenseReduction(calcStat(owner.arm), 0.95));
                owner.curHp -= reflected;
                if (owner.curHp <= 0) { state.gameOver = true; owner.deathCause = `Killed by Boss Thorns (${e.shape})`; if (onEvent) onEvent('game_over'); }
            }

            // Execution Logic (Moved up to suppress normal damage display on execution)
            let wasExecuted = false;
            const hexMult = (1 + (shatterLvl > 0 ? (state.player.soulShatterSouls || 0) * 0.001 : 0));

            if ((critLvl >= 2 || shatterLvl > 0) && !e.boss && !e.dead) {
                const execChance = GAME_CONFIG.SKILLS.EXECUTE_BASE_CHANCE_HIT * hexMult;
                if (Math.random() < execChance) {
                    const remainingHp = Math.round(e.hp);
                    e.hp = 0;
                    e.isExecuted = true;
                    wasExecuted = true;
                    owner.damageDealt += remainingHp;
                    recordDamage(state, 'Shattered Fate (Execute)', remainingHp);
                    spawnFloatingNumber(state, e.x, e.y, "EXECUTED", '#64748b', true, undefined, 12);
                    handleEnemyDeath(state, e, onEvent);
                }
            }

            if (!wasExecuted && (critLvl >= 4 || shatterLvl > 0) && e.boss && !e.dead) {
                const bossExecChance = GAME_CONFIG.SKILLS.BOSS_EXECUTE_CHANCE_HIT * hexMult;
                if (Math.random() < bossExecChance) {
                    const bossDmg = e.maxHp * GAME_CONFIG.SKILLS.BOSS_PERCENT_HP_ON_HIT;
                    e.hp -= bossDmg;
                    owner.damageDealt += bossDmg;
                    wasExecuted = true;
                    recordDamage(state, 'Shattered Fate (Execute)', bossDmg);
                    spawnFloatingNumber(state, e.x, e.y, "EXECUTED", '#dc2626', true, undefined, 12);
                    spawnParticles(state, e.x, e.y, '#dc2626', 15);
                    if (e.hp <= 0 && !e.dead) {
                        handleEnemyDeath(state, e, onEvent);
                    }
                }
            }

            if (!wasExecuted && damageAmount > 0) {
                // ... (rest of the block)
                if (e.isRare && e.shape === 'snitch') {
                    if (!e.rarePhase || e.rarePhase === 1) {
                        e.rarePhase = 2;
                        e.rareTimer = now;
                        e.palette = ['#EF4444', '#DC2626', '#B91C1C'];
                        e.spd = (owner as any).speed * 1.4;
                        e.invincibleUntil = now + 2.0;
                        e.shieldCd = 0;
                        e.panicCooldown = 0;
                        e.lastDodge = 0;
                        spawnParticles(state, e.x, e.y, ['#FFFFFF', '#808080'], 150, 400, 100);
                        playSfx('smoke-puff');
                        e.hp = 1000; e.maxHp = 1000;
                        e.knockback = { x: 0, y: 0 };
                        e.forceTeleport = true;
                        if (onEvent) onEvent('hit');
                        b.hits.add(e.id);
                        if (!b.isHyperPulse) b.pierce--;
                        continue;
                    } else if (e.rarePhase === 2) {
                        if (e.invincibleUntil && now < e.invincibleUntil) {
                            spawnParticles(state, e.x, e.y, '#FFFFFF', 5);
                            b.life = 0;
                            continue;
                        }
                        e.hp = 0;
                    }
                }

                let linked = [];
                if (e.soulLinkHostId) {
                    const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
                    if (host) { linked.push(host); if (host.soulLinkTargets) linked.push(...state.enemies.filter(p => host.soulLinkTargets!.includes(p.id) && !p.dead)); }
                } else if (e.soulLinkTargets?.length) {
                    linked.push(e, ...state.enemies.filter(m => e.soulLinkTargets!.includes(m.id) && !m.dead));
                }
                const targets = linked.length ? Array.from(new Set(linked)) : [e];
                const finalDmg = damageAmount / targets.length;
                targets.forEach(t => {
                    t.hp -= finalDmg; t.lastHitTime = now; owner.damageDealt += finalDmg;

                    let source: import('../core/types').DamageSource = 'Projectile';
                    if (b.isShockwaveCircle) {
                        if (b.isSingularity) source = 'Neural Singularity';
                        else if (b.isTsunami) source = 'Kinetic Tsunami';
                        else source = 'Shockwave';
                    }
                    else if (b.isNanite) source = 'Nanite Swarm';
                    else if (b.isTurretFire) source = b.turretVariant === 'ice' ? 'Ice Turret' : 'Fire Turret';
                    else if (b.vortexState === 'orbiting') source = 'Aegis Rings';
                    else if (b.id === -1) source = 'Kinetic Bolt (LVL 1)';

                    const total = finalDmg;
                    const lvl4PuddlePart = (lvl4PuddleBonus / (damageAmount || 1)) * total;
                    const selfPart = total - lvl4PuddlePart;

                    if (lvl4PuddlePart > 0) recordDamage(state, 'Toxic Puddle (LVL 4)', lvl4PuddlePart, t);

                    if (source === 'Projectile') {
                        const dMarkPart = (deathMarkBonus / (damageAmount || 1)) * total;
                        const critPart = (critBonusBase / (damageAmount || 1)) * total;
                        let rawPart = selfPart - dMarkPart - critPart;

                        if (rawPart > 0) {
                            let bouncePart = 0;
                            if (owner.playerClass === 'malware' && (b.bounceCount || 0) > 0) {
                                const bounceMultTotal = Math.pow(1 + (b.bounceDmgMult || 0.2), b.bounceCount || 0);
                                if (bounceMultTotal > 1) {
                                    const origPart = rawPart / bounceMultTotal;
                                    bouncePart = rawPart - origPart;
                                    rawPart = origPart;
                                }
                            }
                            if (rawPart > 0) recordDamage(state, 'Projectile', rawPart, t);
                            if (bouncePart > 0) recordDamage(state, 'Malware Wall Bonus', bouncePart, t);
                        }
                        if (critPart > 0) recordDamage(state, 'Shattered Fate (Crit)', critPart, t);
                        if (dMarkPart > 0) recordDamage(state, 'Shattered Fate (Death Mark)', dMarkPart, t);
                    } else {
                        if (selfPart > 0) recordDamage(state, source, selfPart, t);
                    }
                    if (b.isCrit) { t.critGlitchUntil = now + 150; spawnParticles(state, t.x, t.y, b.color || '#fff', 5); }
                    if (targets.length > 1) spawnParticles(state, t.x, t.y, '#ff00ff', 2);
                    if (t.hp <= 0 && !t.dead) {
                        if (b.isTsunami) owner.kineticTsunamiWaveSouls = (owner.kineticTsunamiWaveSouls || 0) + (t.isElite ? 10 : 1);
                        handleEnemyDeath(state, t, onEvent);
                    }
                });
                if (!b.isHyperPulse) spawnFloatingNumber(state, e.x, e.y, Math.round(damageAmount).toString(), b.color || '#fff', b.isCrit);
            }

            // Death Mark logic
            const cdMod = getCdMod(state, owner);
            const isNonNormal = e.boss || e.isElite || e.legionId || e.wormId || e.shape === 'snitch' || e.isAnomaly;

            if ((critLvl >= 3 || shatterLvl > 0) && isNonNormal && !isOnCooldown(owner.lastDeathMark ?? -999999, GAME_CONFIG.SKILLS.DEATH_MARK_COOLDOWN, cdMod, now)) {
                e.deathMarkExpiry = now + GAME_CONFIG.SKILLS.DEATH_MARK_DURATION;
                owner.lastDeathMark = now;
                spawnParticles(state, e.x, e.y, '#8800FF', 8);
                playSfx('rare-spawn');
            }

            const bloodLevel = getHexLevel(state, 'BloodForgedCapacitor');
            const shatteredLevel = getHexLevel(state, 'ShatteredCapacitor');
            if (shatteredLevel >= 5 && !b.isShockwaveCircle && b.id !== -1) {
                triggerKineticBolt(state, owner, { x: e.x, y: e.y }, 2, damageAmount * 0.2, true);
            }

            let lifestealPercent = 0;
            if (lifeLevel >= 1 && !b.isShockwaveCircle && b.id !== -1) lifestealPercent = 0.03;
            if (bloodLevel >= 5 && b.isShockwaveCircle) lifestealPercent = 0.01;
            if (lifestealPercent > 0 && !owner.healingDisabled) {
                const heal = damageAmount * lifestealPercent;
                owner.curHp = Math.min(calcStat(owner.hp), owner.curHp + heal);
            }

            b.hits.add(e.id);
            if (!b.isHyperPulse) b.pierce--;
        }
    }

    if (b.life <= 0 || b.pierce < 0) {

        if (b.isTsunami && b.vortexState === 'orbiting' && b.orbitDist && owner.aigisRings?.[b.orbitDist]) {
            const rd = owner.aigisRings[b.orbitDist];
            if (rd.count > 0) { rd.count--; rd.totalDmg -= b.dmg; }
        }
        bullets.splice(index, 1);
        return true;
    }

    return false;
}
