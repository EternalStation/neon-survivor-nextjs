import type { GameState, Player } from '../core/types';
import { GAME_CONFIG } from '../core/GameConfig';
import { PLAYER_CLASSES } from '../core/classes';
import { getHexLevel, getHexMultiplier, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import { PALETTES } from '../core/constants';
import { getPlayerThemeColor } from '../utils/helpers';
import { networkManager } from '../networking/NetworkManager';

// Helper: Trigger Shockwave
// Helper: Trigger Shockwave
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

    // Tsunami Damage Scaling: +1% DMG for every 100 souls from Storm of Steel
    if (isTsunami) {
        const stormHex = state.moduleSockets.hexagons.find(h => h?.type === 'KineticTsunami');
        if (stormHex && stormHex.killsAtLevel) {
            const startKills = stormHex.killsAtLevel[1] ?? stormHex.killsAtAcquisition ?? state.killCount;
            const stormSouls = Math.max(0, state.killCount - startKills);
            const tsunamiBonus = Math.floor(stormSouls / 100) * 0.01;
            waveDmg *= (1 + tsunamiBonus);
        }
    }

    player.waveUses = uses + 1;

    // Visuals: Circular Shockwave Particle
    const waveLife = 60; // 1 second total (60 frames at 60fps)

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

    // Damage Logic (Dynamic expanding matching visual)
    state.bullets.push({
        id: Math.random(),
        ownerId: player.id,
        x: player.x,
        y: player.y,
        vx: 0,
        vy: 0,
        dmg: waveDmg,
        pierce: 999999, // Infinite pierce
        life: waveLife,
        maxLife: waveLife,
        isEnemy: false,
        hits: new Set(),
        size: 0, // Starts at 0, grows dynamically
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

    // --- ComCrit Logic ---
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
    // Malware pierce logic is now handled in player.pierce initialization in GameState.ts


    // --- CLASS MODIFIERS: Cosmic Beam (formerly Storm-Strike) ---
    if (player.playerClass === 'stormstrike') {
        const now = state.gameTime;
        const cdMod = getCdMod(state, player);
        if (!isOnCooldown(player.lastCosmicStrikeTime ?? -999999, GAME_CONFIG.SKILLS.COSMIC_COOLDOWN, cdMod, now)) {
            playSfx('lock-on');
            player.lastCosmicStrikeTime = now;

            // Determine Impact Point
            let tx = player.targetX;
            let ty = player.targetY;

            // Range-limited Targeting Logic (1000px)
            const maxRange = 1000;
            const liveEnemies = state.enemies.filter(e => {
                if (e.dead || e.isFriendly || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return false;
                const d = Math.hypot(e.x - x, e.y - y);
                return d <= maxRange;
            });

            if (liveEnemies.length > 0) {
                const randomEnemy = liveEnemies[Math.floor(Math.random() * liveEnemies.length)];
                tx = randomEnemy.x;
                ty = randomEnemy.y;
            } else {
                // Fallback if no enemies within range: Project out from cursor/aim up to maxRange
                const angleToUse = (tx !== undefined && ty !== undefined)
                    ? Math.atan2(ty - player.y, tx - player.x)
                    : (angle + offsetAngle);

                tx = x + Math.cos(angleToUse) * maxRange;
                ty = y + Math.sin(angleToUse) * maxRange;
            }

            // Apply Resonance to Radius
            const resonance = getChassisResonance(state);
            const baseRadius = 100;
            // 100% + Resonance% (e.g. 50% resonance -> 1.5 multiplier)
            const radius = baseRadius * (1 + resonance);

            state.areaEffects.push({
                id: Date.now() + Math.random(),
                type: 'orbital_strike',
                x: tx,
                y: ty,
                radius: radius,
                duration: 0.3, // 0.3s delay (Reverted to ensure hits)
                creationTime: Date.now(),
                level: 1,
                casterId: player.playerClass === 'stormstrike' ? 1 : 0
            });

            // Visual Marker immediately
            // spawnParticles(state, tx, ty, '#38bdf8', 1, 150, 0, 'shockwave'); // Removed as per request

            return; // STOP! Do not spawn a bullet.
        }
    }

    // --- CLASS MODIFIERS: Stinger -> Stinger id is gone, replaced by others. 
    // Wait, I should use the new IDs.
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
        // Dynamic Life: Base 140 * Class Mult * (1 + Resonance) / gameSpeedMult (чтобы дальность не зависела от скорости игры)
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

    // --- CLASS MODIFIERS: Aigis-Vortex Initial State ---
    if (player.playerClass === 'aigis') {
        const RING_THRESHOLD = 200; // Updated per user request

        // Helper to handle ring logic
        const handleRingSpawn = (baseBullet: any, distance: number) => {
            // Ensure map exists (backwards compat)
            if (!player.aigisRings) player.aigisRings = {};

            // Get or Init Ring Data
            if (!player.aigisRings[distance]) {
                player.aigisRings[distance] = { count: 0, totalDmg: 0 };
            }

            const ringData = player.aigisRings[distance];

            // If we are ALREADY at/above threshold, we just add ammo/damage to the existing ring
            // (Or create the ring if it doesn't exist yet visually but logic says we should)
            if (ringData.count >= RING_THRESHOLD) {
                // Optimization: Don't spawn a bullet object. Just add numbers.
                ringData.count++;
                ringData.totalDmg += baseBullet.dmg;

                // Check if the visual "Ring Projectile" exists
                const existingRing = state.bullets.find(b => b.isRing && b.ringRadius === distance);
                if (existingRing) {
                    existingRing.ringAmmo = ringData.count;
                    // Update dmg? We might want the ring to update its damage dynamically or per tick
                    // For now, let's keep it simple: Ring Bullet Logic will reference `player.aigisRings[dist]` for damage calc
                    return;
                } else {
                    // Threshold reached but no ring? Trigger FUSION.
                    // Remove all individual bullets of this ring
                    let removedCount = 0;
                    let removedDmg = 0;
                    for (let i = state.bullets.length - 1; i >= 0; i--) {
                        const b = state.bullets[i];
                        // Check approximate distance for "orbiting" bullets
                        // Note: bullets move, but orbitDist prop is stable
                        if (b.vortexState === 'orbiting' && Math.abs((b.orbitDist || 0) - distance) < 5) {
                            removedCount++;
                            removedDmg += b.dmg;
                            state.bullets.splice(i, 1);
                        }
                    }

                    // Sync our tracked stats with what we just vacuumed up (plus the one we're trying to spawn)
                    // Actually, relies on `ringData.count` which persists? 
                    // Aigis Rings might get out of sync if bullets expire naturally or hit things without decrementing global counter
                    // So, Fusion Event should probably Recalculate accurately.
                    ringData.count = removedCount + 1; // +1 for the current new spawn
                    ringData.totalDmg = removedDmg + baseBullet.dmg;

                    // Spawn The Ring Entity
                    const ringProj: any = {
                        id: Math.random(),
                        x: player.x,
                        y: player.y,
                        vx: 0, vy: 0,
                        dmg: 0, // Damage is calculated dynamically from totalDmg / count ratio
                        pierce: 999999,
                        life: 999999,
                        isEnemy: false,
                        hits: new Set(),
                        color: baseBullet.color || '#22d3ee',
                        size: distance, // Visual size logic uses this
                        isRing: true,
                        ringRadius: distance,
                        ringAmmo: ringData.count,
                        ringVisualIntensity: 1.0,
                        spawnTime: Date.now()
                    };
                    state.bullets.push(ringProj);

                    // Visual Flare
                    spawnParticles(state, player.x, player.y, baseBullet.color || '#22d3ee', 20);
                    playSfx('rare-spawn'); // Fusion sound
                    return;
                }
            }

            // Below Threshold: Spawn normal bullet
            const bullet = { ...baseBullet, id: Math.random(), orbitDist: distance };
            state.bullets.push(bullet);

            // Track it
            ringData.count++;
            ringData.totalDmg += bullet.dmg;
        };

        // Ring I
        b.vortexState = 'orbiting';
        b.orbitAngle = angle + offsetAngle;
        b.life = 999999;
        // Logic for Ring 1
        handleRingSpawn(b, 125);

        // Multi-Ring Logic
        // Ring II: 15% Base + Resonance
        const chance2 = 0.15 * (1 + resonance);
        if (Math.random() < chance2) {
            handleRingSpawn(b, 190);
        }

        // Ring III: 10% Base + Resonance
        const chance3 = 0.10 * (1 + resonance);
        if (Math.random() < chance3) {
            handleRingSpawn(b, 255);
        }

        // Ring IV: 5% Base + Resonance
        const chance4 = 0.05 * (1 + resonance);
        if (Math.random() < chance4) {
            handleRingSpawn(b, 320);
        }

        return;
    }

    state.bullets.push(b);

    // Multiplayer: Sync bullet spawn to other players (Host only)
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

export function spawnEnemyBullet(state: GameState, x: number, y: number, angle: number, dmg: number, _color: string = '#FF0000') {
    const spd = GAME_CONFIG.PROJECTILE.ENEMY_BULLET_SPEED * (state.gameSpeedMult ?? 1);

    // Always use the bright color from the current 15-minute era palette
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
        color: brightColor, // Ignore passed color, use bright era color
        size: 4
    });

    // Multiplayer Sync
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
