import { GameState, Bullet, Player } from '../core/Types';
import { isInMap } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { getHexLevel, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { triggerKineticBatteryZap } from '../player/PlayerCombat';
import { GAME_CONFIG } from '../core/GameConfig';
import { applyDamageToPlayer } from '../utils/CombatUtils';
import { bulletPool } from './ProjectileSpawning';
import { removeAtSwapPop } from '../core/ObjectPool';

export function updateSingleEnemyBullet(
    state: GameState,
    eb: Bullet,
    enemyBullets: Bullet[],
    index: number,
    onEvent?: (event: string, data?: any) => void,
    triggerDeath?: () => void
): boolean {
    const player = state.player;
    const now = state.gameTime;
    let slowMult = 1.0;
    if (player.stasisFieldActive && player.stasisFieldX !== undefined && player.stasisFieldY !== undefined) {
        const distToZone = Math.hypot(eb.x - player.stasisFieldX, eb.y - player.stasisFieldY);
        if (distToZone < 400) {
            slowMult = 0.5;
        }
    }

    eb.x += eb.vx * slowMult;
    eb.y += eb.vy * slowMult;
    eb.life -= slowMult;

    if (player.playerClass === 'aigis') {
        const vdx = eb.x - player.x;
        const vdy = eb.y - player.y;
        const vdist = Math.hypot(vdx, vdy);
        const vPower = player.vortexStrength || 1.0;

        if (player.orbitalVortexUntil && player.orbitalVortexUntil > state.gameTime) {

            if (vdist < GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS && vdist > 0.001) {
                const perpX = -vdy / vdist;
                const perpY = vdx / vdist;
                eb.vx += perpX * 0.15 * vPower;
                eb.vy += perpY * 0.15 * vPower;
                const speed = Math.hypot(eb.vx, eb.vy);
                const cap = 14;
                if (speed > cap) { eb.vx = (eb.vx / speed) * cap; eb.vy = (eb.vy / speed) * cap; }
            }
        } else {

            if (vdist > 180 && vdist < 330) {
                const perpX = -vdy / vdist;
                const perpY = vdx / vdist;

                eb.vx += perpX * 0.05 * vPower;
                eb.vy += perpY * 0.05 * vPower;
            }
        }
    }

    if (!isInMap(eb.x, eb.y)) {
        removeAtSwapPop(enemyBullets, index, bulletPool);
        return true;
    }


    const nearbyZombies = state.spatialGrid.query(eb.x, eb.y, 50);
    for (const z of nearbyZombies) {
        if (z.isZombie && z.zombieState === 'active' && !z.dead) {
            if (Math.hypot(z.x - eb.x, z.y - eb.y) < z.size! + 10) {
                if (z.zombieHearts !== undefined) {
                    z.zombieHearts--;
                    spawnParticles(state, z.x, z.y, '#4ade80', 5);
                    playSfx('impact');
                    if (z.zombieHearts <= 0) {
                        z.dead = true;
                        z.hp = 0;
                        spawnParticles(state, z.x, z.y, '#4ade80', 15);
                    }
                }
                removeAtSwapPop(enemyBullets, index, bulletPool);
                return true;
            }
        }
    }


    const playersList = Object.values(state.players);
    for (const p of playersList) {
        if (Math.hypot(p.x - eb.x, p.y - eb.y) < p.size + 10) {
            const finalDmg = applyDamageToPlayer(state, p, eb.dmg, {
                sourceType: 'projectile',
                incomingDamageSource: eb.sourceShape
                    ? eb.sourceShape.charAt(0).toUpperCase() + eb.sourceShape.slice(1)
                    : 'Projectile',
                onEvent,
                triggerDeath,
                deathCause: 'Enemy Projectile'
            });

            if (finalDmg > 0 || eb.dmg > 0) {
                if (getHexLevel(state, 'DefBattery') >= 1) triggerKineticBatteryZap(state, p);
            }

            removeAtSwapPop(enemyBullets, index, bulletPool);
            return true;
        }
    }

    if (eb.life <= 0) {
        removeAtSwapPop(enemyBullets, index, bulletPool);
        return true;
    }

    return false;
}
