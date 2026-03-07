import type { GameState, Enemy } from '../core/types';
import { isInMap, getHexDistToWall, ARENA_CENTERS } from '../mission/MapLogic';
import { playSfx } from '../audio/AudioLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { recordDamage } from '../utils/DamageTracking';
import { applyDamageToPlayer } from '../utils/CombatUtils';
import { getPlayerThemeColor } from '../utils/helpers';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { calcStat } from '../utils/MathUtils';
import { GAME_CONFIG } from '../core/GameConfig';
import { updateNormalCircle, updateNormalTriangle, updateNormalSquare, updateNormalDiamond, updateNormalPentagon, updateUniquePentagon } from './NormalEnemyLogic';
import { updateEliteCircle, updateEliteTriangle, updateEliteSquare, updateEliteDiamond, updateElitePentagon } from './EliteEnemyLogic';
import { updateBossEnemy } from './BossEnemyLogic';
import { getProgressionParams, getEventPalette } from './EnemySpawnLogic';
import { updateZombie, updateSnitch, updateMinion, updatePrismGlitcher } from './UniqueEnemyLogic';
import { updateVoidBurrower } from './WormLogic';
import { getFlankingVelocity } from './EnemyAILogic';

export function updateSingleEnemy(
    e: Enemy,
    state: GameState,
    step: number,
    bhPullSpeed: number,
    onEvent?: (event: string, data?: any) => void,
    resonance: number = 0
) {
    if (e.dead) return;


    const params = getProgressionParams(state.gameTime);
    e.fluxState = params.fluxState;

    if (!e.isNeutral && !e.isRare && !e.isNecroticZombie && e.shape !== 'worm' && e.shape !== 'glitcher' && !e.isAnomaly) {
        const eventPalette = getEventPalette(state);
        e.eraPalette = eventPalette || params.eraPalette.colors;
    } else if (e.shape === 'worm' || e.isAnomaly) {
        e.eraPalette = undefined;
    }

    if (e.isAnomaly && !e.dead) {
        const gen = e.anomalyGeneration || 0;
        const burnRadius = 390 + (gen * 10) + (e.bonusBurnRadius || 0);
        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        players.forEach(p => {
            const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);
            if (distToPlayer < burnRadius) {
                const burnTick = 10;
                if (state.frameCount % burnTick === 0) {
                    const burnDmgPct = 0.05 + (gen * 0.01) + (e.bonusBurnPct || 0);
                    const dmg = (calcStat(p.hp) * burnDmgPct) / (60 / burnTick);
                    applyDamageToPlayer(state, p, dmg, {
                        sourceType: 'other',
                        deathCause: "Overlord Burn"
                    });
                }
            }
        });
        e.rotationPhase = (e.rotationPhase || 0) + 0.02;
    }


    const minutes = state.gameTime / 60;
    if (minutes > 30 && !e.isNeutral && (Math.floor(e.id * 1000) % 2 === 0)) {
        const isLate = minutes >= 60;
        const chance = isLate ? 20 : 40;
        if (state.frameCount % chance === 0) {
            spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 1, Math.random() > 0.5 ? 10 : 8, isLate ? 45 : 30, 'void');
        }
    }

    if (e.isZombie) {
        updateZombie(e, state, step, onEvent);
        return;
    }

    if (e.isPhalanxDrone) {
        let host = state.enemies.find(h => h.id === e.soulLinkHostId);
        if (!host) host = state.enemies.find(h => h.boss && h.shape === 'pentagon');
        const age = state.gameTime - (e.spawnedAt || 0);
        if (!host || host.dead || (host.phalanxState === 0 && age > 0.5)) {
            e.dead = true;
            return;
        }

        if (host.phalanxState === 1) {
            const aimAngle = Math.atan2(state.player.y - host.y, state.player.x - host.x);
            const perp = aimAngle + Math.PI / 2;
            const offset = ((e.phalanxDroneAngle || 0) - 3.5) * 80;
            e.x = host.x + Math.cos(perp) * offset;
            e.y = host.y + Math.sin(perp) * offset;
            e.rotationPhase = aimAngle;
            e.vx = 0; e.vy = 0;
        } else if (host.phalanxState === 2) {
            const aimAngle = host.phalanxAngle || 0;
            const perp = aimAngle + Math.PI / 2;
            const offset = ((e.phalanxDroneAngle || 0) - 3.5) * 80;
            e.x = host.x + Math.cos(perp) * offset;
            e.y = host.y + Math.sin(perp) * offset;
            e.rotationPhase = aimAngle;
            e.vx = 0; e.vy = 0;
            if (state.frameCount % 10 < 5) spawnParticles(state, e.x, e.y, '#FFFFFF', 1, 4, 10);
        } else if (host.phalanxState === 3) {
            const spd = 15 * (state.gameSpeedMult ?? 1);
            const moveAngle = host.phalanxAngle || 0;
            e.x += Math.cos(moveAngle) * spd;
            e.y += Math.sin(moveAngle) * spd;
            e.rotationPhase = moveAngle;
            const distToPlayer = Math.hypot(state.player.x - e.x, state.player.y - e.y);
            if (distToPlayer < (e.size + state.player.size)) {
                const oneShotDmg = calcStat(state.player.hp) * 1.5;
                applyDamageToPlayer(state, state.player, oneShotDmg, {
                    sourceType: 'collision',
                    deathCause: `Pentagon Boss Level ${host.bossTier || 1} Phalanx Drone Charge`,
                    floatingNumberColor: '#ef4444'
                });
                spawnFloatingNumber(state, state.player.x, state.player.y, "CRIT", '#ef4444', true);
                e.dead = true;
                spawnParticles(state, e.x, e.y, '#eab308', 15);
                playSfx('impact');
            }
        }
        return;
    }

    if (e.shape === 'worm') {
        updateVoidBurrower(e, state, step, onEvent);
        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
        return;
    }

    if (e.frozen && e.frozen > 0) {
        e.frozen -= 1 / 60;
        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
        return;
    }

    if (e.stunnedUntil && e.stunnedUntil > state.gameTime) {
        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
        return;
    }

    if (e.spawnGracePeriod && e.spawnGracePeriod > 0) {
        e.spawnGracePeriod -= step;
        if (e.spawnGracePeriod <= 0) e.spawnGracePeriod = undefined;
    }

    if (!e.boss) e.takenDamageMultiplier = 1.0;

    if (e.activeNaniteCount && e.activeNaniteCount > 0) {
        const dotFreq = 30;
        if (state.frameCount % dotFreq === 0) {
            const totalDns = (e.activeNaniteDmg || 0);
            const dmgPerTick = totalDns / 2;
            if (dmgPerTick > 0) {
                e.hp -= dmgPerTick;
                state.player.damageDealt += dmgPerTick;

                const rawNumToShow = Math.min(3, e.activeNaniteCount);

                if (e.hp <= 0 && !e.dead) { handleEnemyDeath(state, e, onEvent); return; }

                const dmgPerNumber = dmgPerTick / rawNumToShow;
                for (let n = 0; n < rawNumToShow; n++) {

                    const rx = e.x + (Math.random() - 0.5) * 30;
                    const ry = e.y + (Math.random() - 0.5) * 30;
                    spawnFloatingNumber(state, rx, ry, Math.round(dmgPerNumber).toString(), '#22c55e', false);
                }
            }
        }
    }

    if (e.isInfected) {
        const dotFreq = 30;
        if (state.frameCount % dotFreq === 0) {
            const dmgPerTick = (e.infectionDmg || 0) / 2;
            if (dmgPerTick > 0) {
                e.infectionAccumulator = (e.infectionAccumulator || 0) + dmgPerTick;
                if (e.infectionAccumulator >= 1) {
                    const actualDmg = Math.floor(e.infectionAccumulator);
                    let dmgDealt = actualDmg;
                    if (e.legionId) {
                        const lead = state.legionLeads?.[e.legionId];
                        if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                            const shieldAbsorp = Math.min(dmgDealt, lead.legionShield || 0);
                            lead.legionShield = (lead.legionShield || 0) - shieldAbsorp;
                            dmgDealt -= shieldAbsorp;
                            if (shieldAbsorp > 0) {
                                spawnFloatingNumber(state, e.x, e.y, Math.round(shieldAbsorp).toString(), '#60a5fa', false);
                            }
                        }
                    }
                    if (dmgDealt > 0) {
                        e.hp -= dmgDealt;
                        e.lastHitTime = state.gameTime;
                        state.player.damageDealt += dmgDealt;
                        const themeColor = getPlayerThemeColor(state);
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmgDealt).toString(), themeColor, false);
                        spawnParticles(state, e.x, e.y, themeColor, 1);
                    }
                    e.infectionAccumulator -= actualDmg;
                }
            }
        }
    }

    if (e.bleedTimer && e.bleedTimer > 0) {
        e.bleedTimer--;
        const dotFreq = 30;
        if (state.frameCount % dotFreq === 0) {
            let dmgPerTick = e.bleedDmg || 0;
            if (dmgPerTick > 0) {
                e.bleedAccumulator = (e.bleedAccumulator || 0) + dmgPerTick;
                if (e.bleedAccumulator >= 1) {
                    const actualDmg = Math.floor(e.bleedAccumulator);
                    let dmgDealt = actualDmg;
                    if (e.legionId) {
                        const lead = state.legionLeads?.[e.legionId];
                        if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                            const absorbed = Math.min(dmgDealt, lead.legionShield || 0);
                            lead.legionShield = (lead.legionShield || 0) - absorbed;
                            dmgDealt -= absorbed;
                            if (absorbed > 0) spawnFloatingNumber(state, e.x, e.y, Math.round(absorbed).toString(), '#60a5fa', false);
                        }
                    }
                    if (dmgDealt > 0) {
                        e.hp -= dmgDealt;
                        e.lastHitTime = state.gameTime;
                        state.player.damageDealt += dmgDealt;
                        const shattered = state.moduleSockets.hexagons.some((h: any) => h?.type === 'ShatteredCapacitor');
                        recordDamage(state, shattered ? 'Shattered Capacitor (Bleed)' : 'Other', dmgDealt);
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmgDealt).toString(), '#dc2626', false);
                        spawnParticles(state, e.x, e.y, '#dc2626', 1);
                    }
                    e.bleedAccumulator -= actualDmg;
                    if (e.hp <= 0 && !e.dead) { handleEnemyDeath(state, e, onEvent); return; }
                }
            }
        }
    } else {
        e.bleedDmg = 0;
        e.bleedAccumulator = 0;
    }

    if ((e as any).burnTimer && (e as any).burnTimer > 0) {
        (e as any).burnTimer--;
        if (state.frameCount % 30 === 0) {
            const stacks = (e as any).burnStack || 0;
            if (stacks > 0) {
                let dmg = stacks;
                if (e.legionId) {
                    const lead = state.legionLeads?.[e.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                        const absorbed = Math.min(dmg, lead.legionShield || 0);
                        lead.legionShield = (lead.legionShield || 0) - absorbed;
                        dmg -= absorbed;
                        if (absorbed > 0) spawnFloatingNumber(state, e.x, e.y, Math.round(absorbed).toString(), '#60a5fa', false);
                    }
                }
                if (dmg > 0) {
                    e.hp -= dmg;
                    e.lastHitTime = state.gameTime;
                    state.player.damageDealt += dmg;
                    spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#ef4444', false);
                    spawnParticles(state, e.x, e.y, '#ef4444', 1);
                }
                if (e.hp <= 0 && !e.dead) { handleEnemyDeath(state, e, onEvent); return; }
            }
        }
    } else {
        (e as any).burnStack = 0;
    }

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
                e.x += normal.x * (Math.abs(dist) + 150);
                e.y += normal.y * (Math.abs(dist) + 150);
                e.knockback.x = normal.x * 20;
                e.knockback.y = normal.y * 20;
            }
            if (e.hp <= 0 && !e.dead) { handleEnemyDeath(state, e, onEvent); return; }
        } else if (e.shape === 'snitch' || e.legionId) {
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

    if (e.knockback && (e.knockback.x !== 0 || e.knockback.y !== 0)) {
        e.x += e.knockback.x;
        e.y += e.knockback.y;
        e.knockback.x *= 0.7;
        e.knockback.y *= 0.7;
        if (Math.abs(e.knockback.x) < 0.1) e.knockback.x = 0;
        if (Math.abs(e.knockback.y) < 0.1) e.knockback.y = 0;
    }

    let targetX = state.player.x;
    let targetY = state.player.y;
    let dist = Math.hypot(state.player.x - e.x, state.player.y - e.y);
    if (state.players) {
        let minDist = Infinity;
        Object.values(state.players).forEach(p => {
            if (p.curHp <= 0) return;
            const d = Math.hypot(p.x - e.x, p.y - e.y);
            if (d < minDist) { minDist = d; targetX = p.x; targetY = p.y; }
        });
        if (minDist < Infinity) dist = minDist;
    }
    for (const z of state.enemies) {
        if (z.isZombie && z.zombieState === 'active' && !z.dead) {
            if (e.boss) continue;
            const zDist = Math.hypot(z.x - e.x, z.y - e.y);
            if (zDist < dist) { dist = zDist; targetX = z.x; targetY = z.y; }
        }
    }
    const dx = targetX - e.x;
    const dy = targetY - e.y;
    if (dist === 0) dist = 0.001;

    const shouldCheckPush = dist < 1000 && (e.id + state.frameCount) % 4 === 0;
    if (shouldCheckPush) {
        let nextPushX = 0;
        let nextPushY = 0;
        const nearbyEnemies = state.spatialGrid.query(e.x, e.y, e.size * 3);
        nearbyEnemies.forEach(other => {
            if (e === other) return;
            const odx = e.x - other.x;
            const ody = e.y - other.y;
            if (Math.abs(odx) < e.size + other.size && Math.abs(ody) < e.size + other.size) {
                const odist = Math.sqrt(odx * odx + ody * ody);
                if (odist < e.size + other.size) {
                    const pushDist = (e.size + other.size) - odist;
                    if (odist > 0.001) {
                        let multiplier = other.legionId ? 0.8 : 0.01;
                        nextPushX += (odx / odist) * pushDist * multiplier;
                        nextPushY += (ody / odist) * pushDist * multiplier;
                    }
                }
            }
        });
        e.lastPushX = nextPushX;
        e.lastPushY = nextPushY;
    }
    let pushX = e.lastPushX || 0;
    let pushY = e.lastPushY || 0;

    let currentSpd = e.spd * (state.gameSpeedMult ?? 1);
    if (e.boss) {
        currentSpd *= 0.8;
    }


    const knockbackMag = e.knockback ? Math.hypot(e.knockback.x, e.knockback.y) : 0;
    const vortexActive = !!(state.player.orbitalVortexUntil && state.player.orbitalVortexUntil > state.gameTime);
    const isRecoveringFromVortex = !!(e.vortexRecoveryUntil && e.vortexRecoveryUntil > state.gameTime);
    const isInInertia = !!(e.vortexExitInertiaUntil && state.gameTime < e.vortexExitInertiaUntil);

    const isInVortexField = vortexActive && dist < 800;

    if (knockbackMag > e.spd * 0.5 || isInVortexField || isRecoveringFromVortex) {
        currentSpd = 0;

        if (isInVortexField || isRecoveringFromVortex) {
            e.jitterX = (Math.random() - 0.5) * 6;
            e.jitterY = (Math.random() - 0.5) * 6;
        }
    } else {
        e.jitterX = 0;
        e.jitterY = 0;
        if (isBuffActive(state, 'STASIS_FIELD')) currentSpd *= 0.8;
        if (e.slowFactor) {
            currentSpd *= (1 - e.slowFactor);
            e.slowFactor = 0;
        }
        if (e.slowUntil && e.slowUntil > state.gameTime) currentSpd *= (1 - (e.slowPercentVal || 0));
    }

    let v = { vx: 0, vy: 0 };
    const isFeared = e.fearedUntil && e.fearedUntil > state.gameTime;
    if (isFeared) {
        const angle = Math.atan2(dy, dx);
        v = { vx: -Math.cos(angle) * currentSpd, vy: -Math.sin(angle) * currentSpd };
    } else if ((e.type as string) === 'orbital_shield') {
        if (e.parentId) {
            const parent = state.enemies.find(p => p.id === e.parentId);
            if (!parent || parent.dead) { e.dead = true; e.hp = 0; }
            else {
                const orbitSpeed = 0.01;
                const orbitDist = 150;
                e.rotationPhase = (e.rotationPhase || 0) + orbitSpeed;
                e.x = parent.x + Math.cos(e.rotationPhase) * orbitDist;
                e.y = parent.y + Math.sin(e.rotationPhase) * orbitDist;
                v = { vx: 0, vy: 0 };
            }
        } else e.dead = true;
    } else if (e.boss) {
        v = updateBossEnemy(e, currentSpd, dx, dy, pushX, pushY, state, onEvent);
    } else if (e.shape === 'minion') {
        v = updateMinion(e, state, state.player, dx, dy, 0, 0);
    } else if (e.shape === 'snitch') {
        v = updateSnitch(e, state, state.player, state.gameTime);
    } else if (e.shape === 'glitcher') {
        v = updatePrismGlitcher(e, state, step);
    } else if (e.isRare && e.shape === 'pentagon') {
        v = updateUniquePentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY);
    } else if (e.isElite) {
        switch (e.shape) {
            case 'circle': v = updateEliteCircle(e, state, state.player, dist, dx, dy, currentSpd, pushX, pushY); break;
            case 'triangle': v = updateEliteTriangle(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
            case 'square': v = updateEliteSquare(e, state, currentSpd, dx, dy, pushX, pushY); break;
            case 'diamond': v = updateEliteDiamond(e, state, state.player, dist, dx, dy, currentSpd, pushX, pushY, onEvent); break;
            case 'pentagon': v = updateElitePentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY, onEvent); break;
        }
    } else {
        switch (e.shape) {
            case 'circle': v = updateNormalCircle(e, state, dx, dy, currentSpd, pushX, pushY); break;
            case 'triangle': v = updateNormalTriangle(e, state, dx, dy, currentSpd, pushX, pushY); break;
            case 'square': v = updateNormalSquare(currentSpd, dx, dy, pushX, pushY); break;
            case 'hexagon': v = updateNormalSquare(currentSpd, dx, dy, pushX, pushY); break;
            case 'diamond': v = updateNormalDiamond(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
            case 'pentagon': v = updateNormalPentagon(e, state, dist, dx, dy, currentSpd, pushX, pushY); break;
        }
    }

    if (e.isFlanker && !e.boss && !e.legionId && !e.isRare && e.shape !== 'minion' && !e.isZombie) {
        const isSpecialManeuver = e.dashState === 1 || (e.isElite && e.eliteState && e.eliteState > 0) || e.summonState === 1;
        if (!isSpecialManeuver) {
            const flankV = getFlankingVelocity(e, state, targetX, targetY, currentSpd, pushX, pushY);
            v.vx = flankV.vx; v.vy = flankV.vy;
        }
    }

    let vx = v.vx;
    let vy = v.vy;

    if (bhPullSpeed > 0) {
        const blackholes = state.areaEffects.filter(ae => ae.type === 'blackhole');
        blackholes.forEach(bh => {
            const bdx = bh.x - e.x;
            const bdy = bh.y - e.y;
            const bdist = Math.hypot(bdx, bdy);
            if (bdist < bh.radius) {
                const angle = Math.atan2(bdy, bdx);
                vx += Math.cos(angle) * bhPullSpeed;
                vy += Math.sin(angle) * bhPullSpeed;
                e.voidAmplified = true;
            }
        });
    }

    if (vortexActive) {
        const vdx = e.x - state.player.x;
        const vdy = e.y - state.player.y;
        const vdist = Math.hypot(vdx, vdy);
        if (vdist < GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS && vdist > 0.001) {

            const pullBase = 1 * (1 + resonance) * (state.player.vortexStrength || 1.0);
            const pullStrength = pullBase * (e.boss ? 0.35 : 1.0);


            const perpX = -vdy / vdist;
            const perpY = vdx / vdist;




            const circlesIn2s = Math.max(0.1, 0.2 + 0.32 * Math.log(Math.max(1, pullBase)));
            const tangentialStrength = (circlesIn2s * (e.boss ? 0.35 : 1.0) * Math.PI * vdist) / 60;
            const vortexVx = perpX * tangentialStrength;
            const vortexVy = perpY * tangentialStrength;

            vx += vortexVx;
            vy += vortexVy;




            let radialForceFactor = 0;
            if (vdist > 250) {
                radialForceFactor = -0.4;
            } else if (vdist > 120) {
                radialForceFactor = -0.15;
            } else {

                if (pullBase > 4.0) {
                    radialForceFactor = 4.5;
                } else {
                    radialForceFactor = 0.5;
                }
            }

            const radialVx = (vdx / vdist) * (pullStrength * radialForceFactor);
            const radialVy = (vdy / vdist) * (pullStrength * radialForceFactor);

            vx += radialVx;
            vy += radialVy;


            e.lastVortexVelX = vortexVx + radialVx;
            e.lastVortexVelY = vortexVy + radialVy;
            e.vortexExitInertiaUntil = state.gameTime + 1.5;


            e.vortexRecoveryUntil = (state.player.orbitalVortexUntil || 0) + 1.4;


            if (e.knockback) {
                e.knockback.x += (e.lastVortexVelX || 0) * 0.3;
                e.knockback.y += (e.lastVortexVelY || 0) * 0.3;
            }
        } else {


            if (e.vortexExitInertiaUntil && state.gameTime < e.vortexExitInertiaUntil) {
                const decay = Math.max(0, (e.vortexExitInertiaUntil - state.gameTime) / 1.5);
                vx += (e.lastVortexVelX || 0) * decay;
                vy += (e.lastVortexVelY || 0) * decay;
            }
        }
    } else {

        if (e.vortexExitInertiaUntil && state.gameTime < e.vortexExitInertiaUntil) {
            const decay = Math.max(0, (e.vortexExitInertiaUntil - state.gameTime) / 1.5);
            vx += (e.lastVortexVelX || 0) * decay;
            vy += (e.lastVortexVelY || 0) * decay;
        }
    }

    if (e.legionId && e.legionSlot && e.legionLeadId) {
        const lead = state.legionLeads?.[e.legionId];
        if (lead) {
            e.fearedUntil = 0;
            const spacing = e.size * 2.5;
            const targetX = lead.x + (e.legionSlot.x - (lead.legionSlot?.x || 0)) * spacing;
            const targetY = lead.y + (e.legionSlot.y - (lead.legionSlot?.y || 0)) * spacing;
            if (e === lead) {
                const playerAngle = Math.atan2(state.player.y - e.y, state.player.x - e.x);
                vx = Math.cos(playerAngle) * currentSpd * 1.2;
                vy = Math.sin(playerAngle) * currentSpd * 1.2;
            } else {
                const tdx = targetX - e.x;
                const tdy = targetY - e.y;
                const tdist = Math.hypot(tdx, tdy);
                if (tdist > 5) {
                    vx = (tdx / tdist) * Math.min(tdist, currentSpd * 3);
                    vy = (tdy / tdist) * Math.min(tdist, currentSpd * 3);
                } else {
                    vx = lead.vx || 0;
                    vy = lead.vy || 0;
                }
            }
            if (Math.abs(vx) > 100) vx = Math.sign(vx) * 100;
            if (Math.abs(vy) > 100) vy = Math.sign(vy) * 100;
            e.legionShield = lead.legionShield;
            e.maxLegionShield = lead.maxLegionShield;
            e.legionReady = true;
        } else {
            e.legionId = undefined;
            e.isAssembling = false;
        }
    }

    e.x += (Math.random() - 0.5);
    e.y += (Math.random() - 0.5);
    const nX = e.x + vx;
    const nY = e.y + vy;

    if (isInMap(nX, nY)) {
        e.x = nX; e.y = nY;
        e.vx = vx; e.vy = vy;
    } else {
        if (e.boss) {
            const now = state.gameTime;
            if (!e.lastWallHit || now - e.lastWallHit > 1.0) {
                const wallDmg = e.maxHp * 0.1;
                e.hp -= wallDmg;

                const isRecoveringFromVortex = !!(e.vortexRecoveryUntil && e.vortexRecoveryUntil > state.gameTime);
                const isInInertia = !!(e.vortexExitInertiaUntil && state.gameTime < e.vortexExitInertiaUntil);
                if (isRecoveringFromVortex || isInInertia) {
                    recordDamage(state, 'Orbital Vortex', wallDmg);
                    state.player.damageDealt += wallDmg;
                }

                spawnFloatingNumber(state, e.x, e.y, Math.round(wallDmg).toString(), '#ef4444', true);
                spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 10);
                playSfx('impact');
                e.lastWallHit = now;
            }
            const { dist: wDist, normal } = getHexDistToWall(e.x, e.y);
            e.x += normal.x * (Math.abs(wDist) + 150);
            e.y += normal.y * (Math.abs(wDist) + 150);
            e.knockback.x = normal.x * 20;
            e.knockback.y = normal.y * 20;
            if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
        } else if (e.shape === 'snitch' && e.rareReal) {
            const c = ARENA_CENTERS[0];
            const a = Math.atan2(c.y - e.y, c.x - e.x);
            e.x += Math.cos(a) * 50; e.y += Math.sin(a) * 50;
        } else if (e.shape === 'snitch' || e.legionId) {
            const { dist: wDist, normal } = getHexDistToWall(e.x, e.y);
            e.x += normal.x * (Math.abs(wDist) + 50);
            e.y += normal.y * (Math.abs(wDist) + 50);
        } else {
            if (e.legionId && e.legionLeadId) {
                const lead = state.enemies.find(m => m.id === e.legionLeadId && !m.dead);
                if (lead && (lead.legionShield || 0) > 0) return;
            }

            const isRecoveringFromVortex = !!(e.vortexRecoveryUntil && e.vortexRecoveryUntil > state.gameTime);
            const isInInertia = !!(e.vortexExitInertiaUntil && state.gameTime < e.vortexExitInertiaUntil);
            if (isRecoveringFromVortex || isInInertia) {
                recordDamage(state, 'Orbital Vortex', e.hp > 0 ? e.hp : e.maxHp);
                state.player.damageDealt += e.hp > 0 ? e.hp : e.maxHp;
            }

            handleEnemyDeath(state, e, onEvent);
            return;
        }
    }

    const { pulseDef } = getProgressionParams(state.gameTime);
    e.pulsePhase = (e.pulsePhase + (Math.PI * 2) / pulseDef.interval * (state.gameSpeedMult ?? 1)) % (Math.PI * 2);


    const isSpinning = isInVortexField || isRecoveringFromVortex || isInInertia;
    const rotBase = isSpinning ? 0.25 : 0.01;
    e.rotationPhase = (e.rotationPhase || 0) + rotBase;

    if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
}
