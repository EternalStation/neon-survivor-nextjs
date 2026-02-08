import type { GameState } from './types';
import { GAME_CONFIG } from './GameConfig';
import { PLAYER_CLASSES } from './classes';
import { getHexLevel } from './LegendaryLogic';
import { isBuffActive } from './BlueprintLogic';
import { getChassisResonance } from './EfficiencyLogic';
import { spawnParticles, spawnFloatingNumber } from './ParticleLogic';
import { playSfx } from './AudioLogic';
import { calcStat } from './MathUtils';
import { PALETTES } from './constants';
import { getPlayerThemeColor } from './helpers';

// Helper: Trigger Shockwave
export function triggerShockwave(state: GameState, angle: number, level: number) {
    // Lvl 1: 75% dmg, 450 range (was 2500, then 500)
    // Lvl 3: 125% dmg, 600 range (was 3750, then 750)
    // Lvl 4: Backwards wave too

    const range = level >= 3 ? GAME_CONFIG.SKILLS.WAVE_RANGE.LVL3 : GAME_CONFIG.SKILLS.WAVE_RANGE.LVL1;
    const damageMult = level >= 3 ? GAME_CONFIG.SKILLS.WAVE_DAMAGE_MULT.LVL3 : GAME_CONFIG.SKILLS.WAVE_DAMAGE_MULT.LVL1;
    const coneHalfAngle = 0.7; // ~80 degrees total
    const themeColor = getPlayerThemeColor(state);

    const playerDmg = calcStat(state.player.dmg);
    const waveDmg = playerDmg * damageMult;

    const castWave = (waveAngle: number) => {
        // Visuals: Echolocation Wave (Single clean arc)
        // We use a special 'shockwave' particle type that the renderer draws as a bent line
        const speed = GAME_CONFIG.SKILLS.WAVE_SPEED;
        const waveLife = (range / speed) * 1.5; // Lingers slightly longer for visual overlap

        state.particles.push({
            x: state.player.x,
            y: state.player.y,
            vx: Math.cos(waveAngle) * speed,
            vy: Math.sin(waveAngle) * speed,
            life: waveLife,
            color: themeColor,
            size: 300,
            type: 'shockwave',
            alpha: 1.0,
            decay: 0.03 // Slower decay
        });

        playSfx('sonic-wave');

        // Damage Logic (Instant Hitscan for gameplay feel, visualization catches up)
        state.enemies.forEach(e => {
            if (e.dead || e.isFriendly || e.isZombie) return;
            const dx = e.x - state.player.x;
            const dy = e.y - state.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist < range) {
                const angleToEnemy = Math.atan2(dy, dx);
                const diff = Math.abs(angleToEnemy - waveAngle);
                // Normalized diff
                const normDiff = Math.min(diff, Math.abs(diff - Math.PI * 2));

                if (normDiff < coneHalfAngle) {
                    // Hit!
                    let dmgDealt = waveDmg;

                    // --- LEGION SHIELD LOGIC ---
                    if (e.legionId) {
                        const lead = state.legionLeads?.[e.legionId];
                        if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                            const shieldAbsorp = Math.min(dmgDealt, lead.legionShield || 0);
                            lead.legionShield = (lead.legionShield || 0) - shieldAbsorp;
                            dmgDealt -= shieldAbsorp;

                            if (shieldAbsorp > 0) {
                                spawnFloatingNumber(state, e.x, e.y, Math.round(shieldAbsorp).toString(), '#60a5fa', false);
                                spawnParticles(state, e.x, e.y, '#60a5fa', 1);
                            }
                        }
                    }

                    if (dmgDealt > 0) {
                        e.hp -= dmgDealt;
                        state.player.damageDealt += dmgDealt;
                        spawnFloatingNumber(state, e.x, e.y, Math.round(dmgDealt).toString(), themeColor, false);
                        // Flash hit effect
                        spawnParticles(state, e.x, e.y, '#EF4444', 3);
                    }


                    // Lvl 2: Fear
                    if (level >= 2) {
                        e.fearedUntil = state.gameTime + 1.5; // 1.5s
                    }
                }
            }
        });
    };

    castWave(angle);

    if (level >= 4) {
        castWave(angle + Math.PI);
    }
}

export function spawnBullet(state: GameState, x: number, y: number, angle: number, dmg: number, pierce: number, offsetAngle: number = 0) {
    if (state.player.immobilized) return;
    const spd = GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

    // --- ComCrit Logic ---
    const critLevel = getHexLevel(state, 'ComCrit');
    let isCrit = false;
    let finalDmg = dmg;
    let mult = 1.0;

    if (critLevel > 0) {
        let chance = GAME_CONFIG.SKILLS.CRIT_BASE_CHANCE;
        mult = GAME_CONFIG.SKILLS.CRIT_BASE_MULT;
        if (state.moduleSockets.hexagons.some(h => h?.type === 'ComCrit' && h.level >= 4)) {
            chance = GAME_CONFIG.SKILLS.CRIT_LVL4_CHANCE;
            mult = GAME_CONFIG.SKILLS.CRIT_LVL4_MULT;
        }

        if (Math.random() < chance) {
            isCrit = true;
            finalDmg *= mult;
        } else {
            mult = 1.0;
        }
    }

    let isHyperPulse = false;
    let bulletSize = 4;
    let pClass = PLAYER_CLASSES.find(c => c.id === state.player.playerClass);
    let bulletColor: string | undefined = pClass?.themeColor;
    let bulletPierce = pierce;
    // Malware pierce logic is now handled in player.pierce initialization in GameState.ts

    // --- ComWave Logic ---
    const waveLevel = getHexLevel(state, 'ComWave');
    if (waveLevel > 0) {
        state.player.shotsFired = (state.player.shotsFired || 0) + 1;
        if (state.player.shotsFired % GAME_CONFIG.SKILLS.WAVE_SHOTS_REQUIRED === 0) {
            triggerShockwave(state, angle + offsetAngle, waveLevel);
        }
    }

    // --- CLASS MODIFIERS: Cosmic Beam (formerly Storm-Strike) ---
    if (state.player.playerClass === 'stormstrike') {
        const now = Date.now();
        // Initialize if undefined
        if (!state.player.lastCosmicStrikeTime) {
            state.player.lastCosmicStrikeTime = 0; // Ready immediately? Or start on cooldown? Usually ready.
        }

        const cdMod = isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0;
        const cooldown = 8000 * cdMod; // 8 Seconds Static * Reduction
        if (now - state.player.lastCosmicStrikeTime >= cooldown) {
            // Orbital Strike Trigger
            playSfx('lock-on'); // Targeting sound
            state.player.lastCosmicStrikeTime = now;

            // Determine Impact Point
            let tx = state.player.targetX;
            let ty = state.player.targetY;

            // Range-limited Targeting Logic (1000px)
            const maxRange = 1000;
            const liveEnemies = state.enemies.filter(e => {
                if (e.dead || e.isFriendly) return false;
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
                    ? Math.atan2(ty - state.player.y, tx - state.player.x)
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
                casterId: state.player.playerClass === 'stormstrike' ? 1 : 0
            });

            // Visual Marker immediately
            // spawnParticles(state, tx, ty, '#38bdf8', 1, 150, 0, 'shockwave'); // Removed as per request

            return; // STOP! Do not spawn a bullet.
        }
    }

    // --- CLASS MODIFIERS: Stinger -> Stinger id is gone, replaced by others. 
    // Wait, I should use the new IDs.
    const classStats = PLAYER_CLASSES.find(c => c.id === state.player.playerClass);
    const resonance = getChassisResonance(state);

    const bulletId = Math.random();
    const b: any = {
        id: bulletId,
        x, y,
        vx: Math.cos(angle + offsetAngle) * spd,
        vy: Math.sin(angle + offsetAngle) * spd,
        dmg: finalDmg,
        pierce: bulletPierce,
        // Dynamic Life: Base 140 * Class Mult * (1 + Resonance)
        life: 140 * (classStats?.stats.projLifeMult || 1) * (1 + resonance),
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
    if (state.player.playerClass === 'aigis') {
        b.vortexState = 'orbiting';
        b.orbitAngle = angle + offsetAngle;
        b.orbitDist = 125;
        b.life = 999999; // Orbit indefinitely until hit

        state.bullets.push(b);

        // Multi-Ring Logic
        // Ring II: 15% Base + Resonance
        const chance2 = 0.15 * (1 + resonance);
        if (Math.random() < chance2) {
            const b2 = { ...b, id: Math.random(), orbitDist: 190 };
            state.bullets.push(b2);
        }

        // Ring III: 10% Base + Resonance
        const chance3 = 0.10 * (1 + resonance);
        if (Math.random() < chance3) {
            const b3 = { ...b, id: Math.random(), orbitDist: 255 };
            state.bullets.push(b3);
        }

        // Ring IV: 5% Base + Resonance
        const chance4 = 0.05 * (1 + resonance);
        if (Math.random() < chance4) {
            const b4 = { ...b, id: Math.random(), orbitDist: 320 };
            state.bullets.push(b4);
        }

        return; // Already pushed, return to avoid double push of 'b' or duplicate logic
    }

    state.bullets.push(b);

}

export function spawnEnemyBullet(state: GameState, x: number, y: number, angle: number, dmg: number, _color: string = '#FF0000') {
    const spd = 6;

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
        life: 300,
        isEnemy: true,
        hits: new Set(),
        color: brightColor, // Ignore passed color, use bright era color
        size: 6
    });
}
