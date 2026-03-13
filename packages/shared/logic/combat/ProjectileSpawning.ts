import type { GameState, Player } from '../core/Types';
import { GAME_CONFIG } from '../core/GameConfig';
import { PLAYER_CLASSES } from '../core/Classes';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus, getLogarithmicSum } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import { PALETTES } from '../core/Constants';
import { getPlayerThemeColor } from '../utils/Helpers';
import { networkManager } from '../networking/NetworkManager';



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

    state.particles.push({
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        life: waveLife,
        maxLife: waveLife,
        color: isTsunami ? '#fbbf24' : (isSingularity ? '#a855f7' : '#ef4444'),
        size: range,
        type: 'shockwave_circle',
        isTsunami,
        isSingularity,
        alpha: 1.0,
        decay: 1.0 / waveLife
    });



    playSfx('sonic-wave');


    state.bullets.push({
        id: Math.random(),
        ownerId: player.id,
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        dmg: waveDmg,
        pierce: 999999,
        life: waveLife,
        maxLife: waveLife,
        isEnemy: false,
        hits: new Set(),
        size: 0,
        isShockwaveCircle: true,
        maxSize: range,
        shockwaveLevel: Math.max(2, level),
        isSingularity,
        isTsunami,
        color: isTsunami ? '#fbbf24' : (isSingularity ? '#a855f7' : themeColor),
        spawnTime: Date.now()
    });
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



    const b: any = {
        id: bulletId,
        ownerId: player.id,
        x, y,
        vx: Math.cos(angle + offsetAngle) * spd,
        vy: Math.sin(angle + offsetAngle) * spd,
        dmg: finalDmg,
        pierce: bulletPierce,

        life: 140 * (classStats?.stats.projLifeMult || 1) * (1 + resonance) / (state.gameSpeedMult ?? 1),
        bounceDmgMult: (classStats?.stats.bounceDmgMult || 0) * (1 + resonance),
        bounceSpeedBonus: (classStats?.stats.bounceSpeedBonus || 0) * (1 + resonance),
        isEnemy: false,
        hits: new Set(),
        size: bulletSize,
        isCrit,
        critMult: mult,
        isHyperPulse,
        color: bulletColor,
        spawnTime: Date.now()
    };


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
                            state.bullets.splice(i, 1);
                        }
                    }





                    ringData.count = removedCount + 1;
                    ringData.totalDmg = removedDmg + baseBullet.dmg;


                    const ringProj: any = {
                        id: Math.random(),
                        x: player.x,
                        y: player.y,
                        vx: 0, vy: 0,
                        dmg: 0,
                        pierce: 999999,
                        life: 999999,
                        isEnemy: false,
                        hits: new Set(),
                        color: baseBullet.color || '#22d3ee',
                        size: distance,
                        isRing: true,
                        ringRadius: distance,
                        ringAmmo: ringData.count,
                        ringVisualIntensity: 1.0,
                        spawnTime: Date.now()
                    };
                    state.bullets.push(ringProj);


                    spawnParticles(state, player.x, player.y, baseBullet.color || '#22d3ee', 20);
                    playSfx('rare-spawn');
                    return;
                }
            }


            const bullet = { ...baseBullet, id: Math.random(), orbitDist: distance };
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

    state.enemyBullets.push({
        id: Math.random(),
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        dmg,
        pierce: 0,
        life: 300 / (state.gameSpeedMult ?? 1),
        isEnemy: true,
        hits: new Set(),
        color: brightColor,
        size: 4,
        sourceShape
    });


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
