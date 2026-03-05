import { GameState, Bullet, Player } from '../core/types';
import { isInMap } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { getHexLevel, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { triggerKineticBatteryZap } from '../player/PlayerCombat';
import { GAME_CONFIG } from '../core/GameConfig';

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
    if (player.orbitalVortexUntil && player.orbitalVortexUntil > state.gameTime) {
        const vdx = eb.x - player.x;
        const vdy = eb.y - player.y;
        const vdist = Math.hypot(vdx, vdy);
        if (vdist < GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS && vdist > 0.001) {
            const perpX = -vdy / vdist;
            const perpY = vdx / vdist;
            eb.vx += perpX * 0.8;
            eb.vy += perpY * 0.8;
            const speed = Math.hypot(eb.vx, eb.vy);
            const cap = 14;
            if (speed > cap) { eb.vx = (eb.vx / speed) * cap; eb.vy = (eb.vy / speed) * cap; }
        }
    }

    if (!isInMap(eb.x, eb.y)) {
        enemyBullets.splice(index, 1);
        return true;
    }

    // Collision with Zombies
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

    // Collision with Players
    const playersList = Object.values(state.players);
    for (const p of playersList) {
        if (Math.hypot(p.x - eb.x, p.y - eb.y) < p.size + 10) {
            const armorValue = calcStat(p.arm);
            const armRedMult = 1 - getDefenseReduction(armorValue);
            const projRedRaw = calculateLegendaryBonus(state, 'proj_red_per_kill', false, p);
            const projRedMult = 1 - getDefenseReduction(projRedRaw, 0.80);

            const rawDmg = eb.dmg;
            const dmgAfterArmor = rawDmg * armRedMult;
            const finalProjDmg = dmgAfterArmor * projRedMult;

            p.damageBlockedByArmor += (rawDmg - dmgAfterArmor);
            p.damageBlockedByProjectileReduc += (dmgAfterArmor - finalProjDmg);
            p.damageBlocked += (rawDmg - finalProjDmg);

            let absorbedDmg = 0;
            if (p.shieldChunks?.length) {
                p.shieldChunks.sort((a, b) => a.expiry - b.expiry);
                let remaining = finalProjDmg;
                for (const chunk of p.shieldChunks) {
                    if (chunk.amount >= remaining) {
                        chunk.amount -= remaining;
                        absorbedDmg += remaining;
                        remaining = 0;
                        break;
                    } else {
                        absorbedDmg += chunk.amount;
                        remaining -= chunk.amount;
                        chunk.amount = 0;
                    }
                }
                p.shieldChunks = p.shieldChunks.filter(c => c.amount > 0);
            }

            const finalDmg = Math.max(0, finalProjDmg - absorbedDmg);
            p.damageBlockedByShield += absorbedDmg;
            p.damageBlocked += absorbedDmg;

            if (finalProjDmg > 0) {
                if (getHexLevel(state, 'KineticBattery') >= 1) triggerKineticBatteryZap(state, p);
                if (finalDmg > 0) {
                    p.curHp -= finalDmg;
                    p.damageTaken += finalDmg;
                    p.lastHitDamage = finalDmg;
                    if (onEvent) onEvent('player_hit', { dmg: finalDmg, playerId: p.id });
                    if (p.curHp <= 0 && !state.gameOver) {
                        state.gameOver = true;
                        p.deathCause = 'Died from Enemy Projectile';
                        if (onEvent) onEvent('game_over');
                        triggerDeath?.();
                    }
                }
            }
            spawnFloatingNumber(state, p.x, p.y, Math.round(finalProjDmg).toString(), '#ef4444', false);
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
