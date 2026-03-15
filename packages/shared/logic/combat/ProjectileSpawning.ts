import type { GameState, Player, Bullet } from '../core/Types';
import { GAME_CONFIG } from '../core/GameConfig';
import { PLAYER_CLASSES } from '../core/Classes';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus, getLogarithmicSum } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { spawnParticles, spawnFloatingNumber, particlePool } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import { PALETTES } from '../core/Constants';
import { getPlayerThemeColor } from '../utils/Helpers';
import { networkManager } from '../networking/NetworkManager';
import { ObjectPool, removeAtSwapPop } from '../core/ObjectPool';

export const bulletPool = new ObjectPool<Bullet>(
    () => ({ id: 0, x: 0, y: 0, vx: 0, vy: 0, dmg: 0, pierce: 0, life: 0, isEnemy: false, hits: new Set(), size: 0 }),
    (b) => {
        b.id = 0; b.x = 0; b.y = 0; b.vx = 0; b.vy = 0; b.dmg = 0; b.pierce = 0; b.life = 0; b.isEnemy = false; b.size = 0;
        b.hits.clear();
        b.ownerId = undefined; b.color = undefined; b.isCrit = undefined; b.critMult = undefined;
        b.bounceCount = undefined; b.isHyperPulse = undefined; b.vortexState = undefined;
        b.orbitAngle = undefined; b.orbitDist = undefined; b.spawnTime = undefined; b.trails = undefined;
        b.isNanite = undefined; b.naniteTargetId = undefined; b.isWobbly = undefined;
        b.isHiveMotherSkill = undefined; b.hiveMotherSpitId = undefined;
        b.cloudCenterX = undefined; b.cloudCenterY = undefined; b.cloudRadius = undefined;
        b.bounceDmgMult = undefined; b.bounceSpeedBonus = undefined;
        b.isRing = undefined; b.ringRadius = undefined; b.ringVisualIntensity = undefined; b.ringAmmo = undefined;
        b.insideSandbox = undefined; b.isTrace = undefined; b.slowPercent = undefined; b.freezeDuration = undefined;
        b.isMist = undefined; b.isVisualOnly = undefined; b.burnDamage = undefined;
        b.isTurretFire = undefined; b.turretLevel = undefined; b.turretVariant = undefined;
        b.isBomb = undefined; b.explodeRadius = undefined;
        b.isShockwaveCircle = undefined; b.isSingularity = undefined; b.isTsunami = undefined;
        b.maxSize = undefined; b.shockwaveLevel = undefined; b.maxLife = undefined;
        b.startAngle = undefined; b.endAngle = undefined; b.sourceShape = undefined;
    }
)



export function triggerShockwave(state: GameState, player: Player, level: number, isSingularity: boolean = false, isTsunami: boolean = false) {
    const range = 1000;
    const themeColor = getPlayerThemeColor(state, player);

    const playerDmg = calcStat(player.dmg);
    const uses = player.waveUses || 0;

    let multiplier = 1.0;
    if (isSingularity) multiplier = getHexMultiplier(state, 'NeuralSingularity');
    else if (isTsunami) multiplier = getHexMultiplier(state, 'KineticTsunami');
    else multiplier = getHexMultiplier(state, 'ComWave');

    let waveDmg = playerDmg * 0.75 * (1 + (uses * 0.01 * multiplier));


    if (isTsunami) {
        const stormHex = state.moduleSockets.hexagons.find(h => h?.type === 'KineticTsunami');
        if (stormHex && stormHex.killsAtLevel) {
            const startKills = stormHex.killsAtLevel[1] ?? stormHex.killsAtAcquisition ?? state.killCount;
            const stormSouls = Math.max(0, state.killCount - startKills);
            const tsunamiBonus = getLogarithmicSum(stormSouls) * 0.01;
            waveDmg *= (1 + tsunamiBonus);
        }
    }

    player.waveUses = uses + 1;


    const waveLife = 60;

    const wp = particlePool.acquire();
    wp.x = player.x; wp.y = player.y; wp.vx = 0; wp.vy = 0;
    wp.life = waveLife; wp.maxLife = waveLife;
    wp.color = isTsunami ? '#fbbf24' : (isSingularity ? '#a855f7' : '#ef4444');
    wp.size = range; wp.type = 'shockwave_circle';
    wp.isTsunami = isTsunami; wp.isSingularity = isSingularity;
    wp.alpha = 1.0; wp.decay = 1.0 / waveLife;
    state.particles.push(wp);



    playSfx('sonic-wave');


    const wb = bulletPool.acquire();
    wb.id = Math.random(); wb.ownerId = player.id;
    wb.x = player.x; wb.y = player.y; wb.vx = 0; wb.vy = 0;
    wb.dmg = waveDmg; wb.pierce = 999999; wb.life = waveLife; wb.maxLife = waveLife;
    wb.isEnemy = false; wb.size = 0;
    wb.isShockwaveCircle = true; wb.maxSize = range; wb.shockwaveLevel = Math.max(2, level);
    wb.isSingularity = isSingularity; wb.isTsunami = isTsunami;
    wb.color = isTsunami ? '#fbbf24' : (isSingularity ? '#a855f7' : themeColor);
    wb.spawnTime = Date.now();
    state.bullets.push(wb);
}

export function spawnBullet(state: GameState, player: Player, x: number, y: number, angle: number, dmg: number, pierce: number, offsetAngle: number = 0) {
    if (player.immobilized) return;
    const spd = GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED * (state.gameSpeedMult ?? 1);


    const critLevel = getHexLevel(state, 'ComCrit');
    const shatterLvl = getHexLevel(state, 'SoulShatterCore');
    let isCrit = false;
    let finalDmg = dmg;
    let mult = 1.0;

    if (critLevel > 0 || shatterLvl > 0) {
        let chance = GAME_CONFIG.SKILLS.CRIT_BASE_CHANCE;
        mult = GAME_CONFIG.SKILLS.CRIT_BASE_MULT;

        const chanceBonus = calculateLegendaryBonus(state, 'crit_chance_scaling', false, player);
        const dmgBonus = calculateLegendaryBonus(state, 'crit_dmg_scaling', false, player);

        chance += (chanceBonus / 100);
        mult += (dmgBonus / 100);

        if (Math.random() < chance) {
            isCrit = true;
            finalDmg *= mult;
        } else {
            mult = 1.0;
        }
    }

    let isHyperPulse = false;
    let bulletSize = 4;
    let pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
    let bulletColor: string | undefined = pClass?.themeColor;
    let bulletPierce = pierce;
    const classStats = PLAYER_CLASSES.find(c => c.id === player.playerClass);
    const resonance = getChassisResonance(state);

    const bulletId = Math.random();



    const b = bulletPool.acquire();
    b.id = bulletId; b.ownerId = player.id; b.x = x; b.y = y;
    b.vx = Math.cos(angle + offsetAngle) * spd; b.vy = Math.sin(angle + offsetAngle) * spd;
    b.dmg = finalDmg; b.pierce = bulletPierce;
    b.life = 140 * (classStats?.stats.projLifeMult || 1) * (1 + resonance) / (state.gameSpeedMult ?? 1);
    b.bounceDmgMult = (classStats?.stats.bounceDmgMult || 0) * (1 + resonance);
    b.bounceSpeedBonus = (classStats?.stats.bounceSpeedBonus || 0) * (1 + resonance);
    b.isEnemy = false; b.size = bulletSize; b.isCrit = isCrit; b.critMult = mult;
    b.isHyperPulse = isHyperPulse; b.color = bulletColor; b.spawnTime = Date.now();


    if (player.playerClass === 'aigis') {
        const RING_THRESHOLD = 200;


        const handleRingSpawn = (baseBullet: any, distance: number) => {

            if (!player.aigisRings) player.aigisRings = {};


            if (!player.aigisRings[distance]) {
                player.aigisRings[distance] = { count: 0, totalDmg: 0 };
            }

            const ringData = player.aigisRings[distance];



            if (ringData.count >= RING_THRESHOLD) {

                ringData.count++;
                ringData.totalDmg += baseBullet.dmg;


                const existingRing = state.bullets.find(b => b.isRing && b.ringRadius === distance);
                if (existingRing) {
                    existingRing.ringAmmo = ringData.count;


                    return;
                } else {


                    let removedCount = 0;
                    let removedDmg = 0;
                    for (let i = state.bullets.length - 1; i >= 0; i--) {
                        const b = state.bullets[i];


                        if (b.vortexState === 'orbiting' && Math.abs((b.orbitDist || 0) - distance) < 5) {
                            removedCount++;
                            removedDmg += b.dmg;
                            removeAtSwapPop(state.bullets, i, bulletPool);
                        }
                    }





                    ringData.count = removedCount + 1;
                    ringData.totalDmg = removedDmg + baseBullet.dmg;


                    const ringProj = bulletPool.acquire();
                    ringProj.id = Math.random(); ringProj.x = player.x; ringProj.y = player.y;
                    ringProj.vx = 0; ringProj.vy = 0; ringProj.dmg = 0; ringProj.pierce = 999999;
                    ringProj.life = 999999; ringProj.isEnemy = false;
                    ringProj.color = baseBullet.color || '#22d3ee'; ringProj.size = distance;
                    ringProj.isRing = true; ringProj.ringRadius = distance;
                    ringProj.ringAmmo = ringData.count; ringProj.ringVisualIntensity = 1.0;
                    ringProj.spawnTime = Date.now();
                    state.bullets.push(ringProj);


                    spawnParticles(state, player.x, player.y, baseBullet.color || '#22d3ee', 20);
                    playSfx('rare-spawn');
                    return;
                }
            }


            const bullet = bulletPool.acquire();
            Object.assign(bullet, baseBullet);
            bullet.id = Math.random(); bullet.orbitDist = distance; bullet.hits = new Set(baseBullet.hits);
            state.bullets.push(bullet);


            ringData.count++;
            ringData.totalDmg += bullet.dmg;
        };


        b.vortexState = 'orbiting';
        b.orbitAngle = angle + offsetAngle;
        b.life = 999999;

        handleRingSpawn(b, 125);



        const chance2 = 0.15 * (1 + resonance);
        if (Math.random() < chance2) {
            handleRingSpawn(b, 190);
        }


        const chance3 = 0.10 * (1 + resonance);
        if (Math.random() < chance3) {
            handleRingSpawn(b, 255);
        }


        const chance4 = 0.05 * (1 + resonance);
        if (Math.random() < chance4) {
            handleRingSpawn(b, 320);
        }

        bulletPool.release(b);
        return;
    }

    state.bullets.push(b);


    if (state.multiplayer.active && state.multiplayer.isHost) {
        networkManager.broadcastBulletSpawn({
            x: b.x,
            y: b.y,
            angle: angle + offsetAngle,
            dmg: b.dmg,
            pierce: b.pierce,
            ownerId: player.id,
            color: b.color,
            isEnemy: false
        });
    }
}

export function spawnEnemyBullet(state: GameState, x: number, y: number, angle: number, dmg: number, _color: string = '#FF0000', sourceShape?: string) {
    const spd = GAME_CONFIG.PROJECTILE.ENEMY_BULLET_SPEED * (state.gameSpeedMult ?? 1);


    const minutes = state.gameTime / 60;
    const eraIndex = Math.floor(minutes / 15);
    const eraPalette = PALETTES[eraIndex % PALETTES.length];
    const brightColor = eraPalette.colors[0];

    const eb = bulletPool.acquire();
    eb.id = Math.random(); eb.x = x; eb.y = y;
    eb.vx = Math.cos(angle) * spd; eb.vy = Math.sin(angle) * spd;
    eb.dmg = dmg; eb.pierce = 0; eb.life = 300 / (state.gameSpeedMult ?? 1);
    eb.isEnemy = true; eb.color = brightColor; eb.size = 4; eb.sourceShape = sourceShape;
    state.enemyBullets.push(eb);


    if (state.multiplayer.active && state.multiplayer.isHost) {
        networkManager.broadcastBulletSpawn({
            x, y,
            angle,
            dmg,
            pierce: 0,
            ownerId: 'enemy',
            color: brightColor,
            isEnemy: true
        });
    }
}
