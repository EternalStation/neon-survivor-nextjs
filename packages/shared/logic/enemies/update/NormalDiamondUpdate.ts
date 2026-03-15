import { spawnEnemyBullet } from '../../combat/ProjectileSpawning';
import { ARENA_CENTERS, ARENA_RADIUS } from '../../mission/MapLogic';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateNormalDiamond({ enemy, state, dist, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    if (!enemy.distGoal) {
        enemy.distGoal = 500 + Math.random() * 400;
    }

    const angleToPlayer = Math.atan2(dy, dx);
    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(enemy.x - center.x, enemy.y - center.y);
        return distToCenter < Math.hypot(enemy.x - best.x, enemy.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToWall = ARENA_RADIUS - Math.hypot(enemy.x - nearestCenter.x, enemy.y - nearestCenter.y);

    if (!enemy.timer || Date.now() > enemy.timer) {
        enemy.dodgeDir = Math.random() > 0.5 ? 1 : -1;
        enemy.timer = Date.now() + 3000 + Math.random() * 2000;
    }

    const strafeAngle = angleToPlayer + (enemy.dodgeDir || 1) * Math.PI / 2;
    const distFactor = (dist - enemy.distGoal) / 100;

    let vx: number;
    let vy: number;

    if (distToWall < 500 || (enemy.dodgeCooldown && Date.now() < enemy.dodgeCooldown)) {
        if (!enemy.dodgeCooldown || Date.now() > enemy.dodgeCooldown) {
            const angleToCenter = Math.atan2(nearestCenter.y - enemy.y, nearestCenter.x - enemy.x);
            enemy.dashState = (angleToCenter + angleToPlayer + Math.PI) / 2;
            enemy.dodgeCooldown = Date.now() + 2000;
        }
        vx = Math.cos(enemy.dashState || 0) * currentSpd * 2;
        vy = Math.sin(enemy.dashState || 0) * currentSpd * 2;
    } else {
        vx = Math.cos(strafeAngle) * currentSpd + Math.cos(angleToPlayer) * distFactor * currentSpd + pushX;
        vy = Math.sin(strafeAngle) * currentSpd + Math.sin(angleToPlayer) * distFactor * currentSpd + pushY;
    }

    if (!enemy.nextAttackCD) enemy.nextAttackCD = 7 + Math.random() * 3;
    if (state.gameTime - (enemy.lastAttack || 0) > enemy.nextAttackCD) {
        const damage = Math.floor(enemy.maxHp * 0.20);
        const bulletColor = enemy.baseColor || (enemy.originalPalette ? enemy.originalPalette[0] : enemy.palette[0]);
        spawnEnemyBullet(state, enemy.x, enemy.y, angleToPlayer, damage, bulletColor, enemy.shape);
        enemy.lastAttack = state.gameTime;
        enemy.nextAttackCD = 7 + Math.random() * 3;
    }

    return { vx, vy };
}
