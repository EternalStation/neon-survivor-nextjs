import { playSfx } from '../../audio/AudioLogic';
import { spawnParticles } from '../../effects/ParticleLogic';
import { ARENA_CENTERS, ARENA_RADIUS } from '../../mission/MapLogic';
import { applyDamageToPlayer } from '../../utils/CombatUtils';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateEliteDiamond({ enemy, state, dist, dx, dy, currentSpd, pushX, pushY, onEvent }: EnemyUpdateContext) {
    const angleToPlayer = Math.atan2(dy, dx);
    let vx = 0;
    let vy = 0;

    if (!enemy.eliteState) enemy.eliteState = 0;
    if (!enemy.distGoal) {
        enemy.distGoal = 600 + Math.random() * 200;
    }

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(enemy.x - center.x, enemy.y - center.y);
        return distToCenter < Math.hypot(enemy.x - best.x, enemy.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToCenter = Math.hypot(enemy.x - nearestCenter.x, enemy.y - nearestCenter.y);
    const distToWall = ARENA_RADIUS - distToCenter;
    const veryCloseToWall = distToWall < 500;
    const distFactor = (dist - enemy.distGoal) / 100;

    if (enemy.eliteState === 0) {
        if (veryCloseToWall && (!enemy.lastDodge || state.gameTime - (enemy.lastDodge || 0) > 3.0)) {
            const angleToCenter = Math.atan2(nearestCenter.y - enemy.y, nearestCenter.x - enemy.x);
            const angleAwayFromPlayer = angleToPlayer + Math.PI;
            enemy.dashState = (angleToCenter + angleAwayFromPlayer) / 2;
            enemy.lockedTargetX = 0;
            enemy.lockedTargetY = state.gameTime + 2.0;
            enemy.lastDodge = state.gameTime;
        }

        if (enemy.lockedTargetX === 0) {
            if (state.gameTime > (enemy.lockedTargetY || 0)) {
                enemy.lockedTargetX = undefined;
                enemy.lockedTargetY = undefined;
            } else {
                vx = Math.cos(enemy.dashState || 0) * currentSpd * 2;
                vy = Math.sin(enemy.dashState || 0) * currentSpd * 2;
            }
        }

        if (enemy.lockedTargetX !== 0) {
            vx = Math.cos(angleToPlayer) * distFactor * currentSpd + pushX;
            vy = Math.sin(angleToPlayer) * distFactor * currentSpd + pushY;
        }

        const currentCooldown = (enemy as any).nextAttackCD || 5.0;
        if (state.gameTime - (enemy.lastAttack || 0) > currentCooldown) {
            enemy.eliteState = 1;
            enemy.timer = state.gameTime + 1.4;
            enemy.dashState = angleToPlayer;
        }
    } else if (enemy.eliteState === 1) {
        if ((enemy.timer || 0) - state.gameTime > 0.8) {
            enemy.dashState = angleToPlayer;
        }

        if (state.gameTime > (enemy.timer || 0)) {
            enemy.eliteState = 2;
            enemy.timer = state.gameTime + 0.8;
            enemy.hasHitThisBurst = false;
            playSfx('laser');
        }
    } else if (enemy.eliteState === 2) {
        enemy.lockedTargetX = enemy.x + Math.cos(enemy.dashState || 0) * 3000;
        enemy.lockedTargetY = enemy.y + Math.sin(enemy.dashState || 0) * 3000;

        const laserAngle = enemy.dashState || 0;
        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        players.forEach(player => {
            const px = player.x - enemy.x;
            const py = player.y - enemy.y;
            const playerDist = Math.hypot(px, py);
            const playerAngle = Math.atan2(py, px);
            const angleDiff = Math.abs(playerAngle - laserAngle);

            if (angleDiff < 0.1 && playerDist < 3000 && !enemy.hasHitThisBurst) {
                enemy.hasHitThisBurst = true;
                applyDamageToPlayer(state, player, enemy.maxHp * 0.04, {
                    sourceType: 'projectile',
                    incomingDamageSource: enemy.shape.charAt(0).toUpperCase() + enemy.shape.slice(1),
                    onEvent,
                    deathCause: 'Incinerated by Elite Diamond Laser',
                    killerHp: enemy.hp,
                    killerMaxHp: enemy.maxHp,
                    floatingNumberColor: enemy.palette ? enemy.palette[0] : '#f87171'
                });

                const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                if (triggerZap) triggerZap(state, player, 1);
            }
        });

        state.enemies.forEach(zombie => {
            if (zombie.isZombie && zombie.zombieState === 'active' && !zombie.dead) {
                const zDx = zombie.x - enemy.x;
                const zDy = zombie.y - enemy.y;
                const zDist = Math.hypot(zDx, zDy);
                const zAngle = Math.atan2(zDy, zDx);
                if (Math.abs(zAngle - laserAngle) < 0.1 && zDist < 3000) {
                    zombie.dead = true;
                    zombie.hp = 0;
                    spawnParticles(state, zombie.x, zombie.y, '#4ade80', 15);
                    playSfx('smoke-puff');
                }
            }
        });
    }

    if (enemy.eliteState !== 0 && state.gameTime > (enemy.timer || 0)) {
        enemy.eliteState = 0;
        enemy.lastAttack = state.gameTime;
        (enemy as any).nextAttackCD = 5.0 + Math.random() * 2.0;
        enemy.lockedTargetX = undefined;
        enemy.lockedTargetY = undefined;
    }

    return { vx, vy };
}
