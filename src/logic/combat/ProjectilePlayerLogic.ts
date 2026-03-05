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

    // Ensure hits is a Set (serialization back-compat)
    if (!(b.hits instanceof Set)) {
        const oldHits = (b as any).hits;
        b.hits = new Set();
        if (oldHits && typeof oldHits === 'object') {
            Object.values(oldHits).forEach((v: any) => b.hits.add(v));
        }
    }

    // Movement
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    // Collision with Map Boundary (Walls)
    if (!isInMap(b.x, b.y)) {
        if (owner.playerClass === 'malware') {
            b.bounceCount = (b.bounceCount || 0) + 1;
            const dmgMult = 1 + (b.bounceDmgMult || 0.2);
            b.dmg *= dmgMult;

            if (b.bounceCount === 1) b.color = '#fb923c';
            else {
                const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                const green = Math.floor(146 * (1 - redProgress));
                b.color = `rgb(255, ${green}, 0)`;
            }

            const { dist, normal } = getHexDistToWall(b.x, b.y);
            const dot = b.vx * normal.x + b.vy * normal.y;

            if (dot < 0) {
                const speedMult = 1 + (b.bounceSpeedBonus || 0.2);
                b.vx = (b.vx - 2 * dot * normal.x) * speedMult;
                b.vy = (b.vy - 2 * dot * normal.y) * speedMult;
                b.x += normal.x * (Math.abs(dist) + 5);
                b.y += normal.y * (Math.abs(dist) + 5);
                spawnParticles(state, b.x, b.y, b.color, 12);
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

    // Sandbox Containment (Malware Active Ability)
    if (owner.playerClass === 'malware' && owner.sandboxActive && owner.sandboxUntil && now < owner.sandboxUntil && !b.isNanite) {
        const sbx = owner.sandboxX ?? 0;
        const sby = owner.sandboxY ?? 0;
        const R = GAME_CONFIG.SKILLS.SANDBOX_RADIUS;
        const apothem = R * Math.cos(Math.PI / 5);
        const dx = b.x - sbx;
        const dy = b.y - sby;

        let inside = true;
        for (let i = 0; i < 5 && inside; i++) {
            const midAngle = -Math.PI / 2 + Math.PI / 5 + (2 * Math.PI * i) / 5;
            if (dx * Math.cos(midAngle) + dy * Math.sin(midAngle) > apothem) inside = false;
        }

        if (inside) {
            b.insideSandbox = true;
        } else if (b.insideSandbox) {
            let maxOvershoot = 0;
            let rnx = 0;
            let rny = 0;
            for (let i = 0; i < 5; i++) {
                const midAngle = -Math.PI / 2 + Math.PI / 5 + (2 * Math.PI * i) / 5;
                const enx = Math.cos(midAngle);
                const eny = Math.sin(midAngle);
                const overshoot = dx * enx + dy * eny - apothem;
                if (overshoot > maxOvershoot) {
                    maxOvershoot = overshoot;
                    rnx = enx;
                    rny = eny;
                }
            }
            b.x -= rnx * (maxOvershoot + 2);
            b.y -= rny * (maxOvershoot + 2);
            const outDot = b.vx * rnx + b.vy * rny;
            if (outDot > 0) {
                b.vx -= 2 * outDot * rnx;
                b.vy -= 2 * outDot * rny;
                const speedMult = 1 + (b.bounceSpeedBonus || 0.05);
                b.vx *= speedMult;
                b.vy *= speedMult;
                b.dmg *= 1 + (b.bounceDmgMult || 0.2);
                b.bounceCount = (b.bounceCount || 0) + 1;
                if (b.bounceCount === 1) b.color = '#fb923c';
                else {
                    const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                    b.color = `rgb(255, ${Math.floor(146 * (1 - redProgress))}, 0)`;
                }
                spawnParticles(state, b.x, b.y, b.color, 6);
            }
        }
    }

    // Malware Trail
    if (owner.playerClass === 'malware' && (b.bounceCount || 0) > 0) {
        if (!b.trails) b.trails = [];
        b.trails.unshift({ x: b.x, y: b.y });
        const maxTrail = (b.bounceCount || 0) * 5;
        if (b.trails.length > maxTrail) b.trails.pop();
    }

    // Nanite Homing
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
            b.life = 0;
        }
    } else if (b.isNanite && b.isWobbly) {
        // Wobbly straight moving nanites
        const speed = GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
        const currentAngle = Math.atan2(b.vy, b.vx);
        // Add a wobble based on gameTime and its ID to offset phases
        const wobble = Math.sin(state.gameTime * 15 + b.id) * 0.1;
        b.vx = Math.cos(currentAngle + wobble) * speed;
        b.vy = Math.sin(currentAngle + wobble) * speed;
    }

    // Aigis Orbiting
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

        const nearbyEnemies = state.spatialGrid.query(b.x, b.y, b.ringRadius! + 100);
        for (const e of nearbyEnemies) {
            if (e.dead || e.isFriendly || e.isZombie || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) continue;
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            const entityHitRadius = e.size + 20;
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
        let hitRadius = e.size + 10;
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

            let damageAmount = b.dmg;
            if (e.takenDamageMultiplier) damageAmount *= e.takenDamageMultiplier;

            const critLvl = getHexLevel(state, 'ComCrit');
            const shatterLvl = getHexLevel(state, 'SoulShatterCore');
            if ((critLvl >= 3 || shatterLvl > 0) && e.deathMarkExpiry && now < e.deathMarkExpiry) {
                damageAmount = (b.dmg / (b.critMult || 1.0)) * Math.max(b.critMult || 1.0, GAME_CONFIG.SKILLS.DEATH_MARK_MULT);
                spawnParticles(state, e.x, e.y, '#FF0000', 3);
                e.critGlitchUntil = now + 100;
            }

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
                        if (t.hp <= 0 && !t.dead) handleEnemyDeath(state, t, onEvent);
                    }
                });
            }

            const lifeLevel = getHexLevel(state, 'ComLife');
            if (lifeLevel >= 3 && !e.boss) damageAmount += e.maxHp * 0.02;

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
                        t.frozen = (t.frozen || 0) + (b.freezeDuration || 3.0);
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
                        const nanitesToApply = 3 + Math.floor(owner.level / 10);

                        e.slowFactor = Math.max(e.slowFactor || 0, 0.5); // 50% slow
                        e.slowUntil = Math.max(e.slowUntil || 0, state.gameTime + 3); // 3 seconds

                        e.activeNaniteCount = (e.activeNaniteCount || 0) + nanitesToApply;
                        // Since b.dmg is the base dmgPerNanite, we add (b.dmg * nanitesToApply) for the payload.
                        e.activeNaniteDmg = (e.activeNaniteDmg || 0) + (b.dmg * nanitesToApply);
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

            if (damageAmount > 0) {
                // --- RARE: Snitch Phase Logic ---
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
                    if (b.isCrit) { t.critGlitchUntil = now + 150; spawnParticles(state, t.x, t.y, b.color || '#fff', 5); }
                    if (targets.length > 1) spawnParticles(state, t.x, t.y, '#ff00ff', 2);
                    if (t.hp <= 0 && !t.dead) handleEnemyDeath(state, t, onEvent);
                });
                if (!b.isHyperPulse) spawnFloatingNumber(state, e.x, e.y, Math.round(damageAmount).toString(), b.color || '#fff', b.isCrit);
            }

            // --- ComCrit Lvl 3: Apply Death Mark ---
            const cdMod = getCdMod(state, owner);
            if ((critLvl >= 3 || shatterLvl > 0) && !isOnCooldown(owner.lastDeathMark ?? -999999, GAME_CONFIG.SKILLS.DEATH_MARK_COOLDOWN, cdMod, now)) {
                e.deathMarkExpiry = now + 3;
                owner.lastDeathMark = now;
                spawnParticles(state, e.x, e.y, '#8800FF', 8);
                playSfx('rare-spawn');
            }

            // --- ComCrit Lvl 2: Execute (Non-Bosses) ---
            if ((critLvl >= 2 || shatterLvl > 0) && !e.boss && e.hp < e.maxHp * GAME_CONFIG.SKILLS.EXECUTE_THRESHOLD) {
                if (Math.random() < GAME_CONFIG.SKILLS.EXECUTE_CHANCE) {
                    const remainingHp = Math.round(e.hp);
                    e.hp = 0;
                    e.isExecuted = true;
                    spawnFloatingNumber(state, e.x + 10, e.y - 10, `EXEC ${remainingHp}`, '#64748b', false);
                    playSfx('rare-kill');
                }
            }

            // --- ComCrit Lvl 4: Execute Bosses ---
            if ((critLvl >= 4 || shatterLvl > 0) && e.boss && e.hp < e.maxHp * GAME_CONFIG.SKILLS.BOSS_EXECUTE_THRESHOLD) {
                if (Math.random() < GAME_CONFIG.SKILLS.BOSS_EXECUTE_CHANCE) {
                    const remainingHp = Math.round(e.hp);
                    e.hp = 0;
                    e.isExecuted = true;
                    spawnFloatingNumber(state, e.x + 10, e.y - 20, `BOSS EXEC ${remainingHp}`, '#dc2626', true);
                    playSfx('rare-kill');
                }
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
