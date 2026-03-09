import { GameState, Bullet, Player } from '../core/types';
import { isInMap } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { getHexLevel, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { triggerKineticBatteryZap } from '../player/PlayerCombat';
import { GAME_CONFIG } from '../core/GameConfig';
import { applyDamageToPlayer } from '../utils/CombatUtils';

export function updateSingleEnemyBullet(
    state: GameState,
    eb: Bullet,
    enemyBullets: Bullet[],
    index: number,
    onEvent?: (event: string, data?: any) => void,
    triggerDeath?: () => void
): boolean {
    eb.x += eb.vx;
    eb.y += eb.vy;
    eb.life--;

    const player = state.player;
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
        enemyBullets.splice(index, 1);
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
                enemyBullets.splice(index, 1);
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
                if (getHexLevel(state, 'KineticBattery') >= 1) triggerKineticBatteryZap(state, p);
            }

            enemyBullets.splice(index, 1);
            return true;
        }
    }

    if (eb.life <= 0) {
        enemyBullets.splice(index, 1);
        return true;
    }

    return false;
}
