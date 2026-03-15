import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateNormalTriangle({ enemy, state, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    if (!enemy.timer) enemy.timer = state.gameTime;

    if (enemy.dashState !== 1 && state.gameTime - (enemy.lastAttack || 0) > 5.0 && currentSpd > 0) {
        enemy.dashState = 1;
        enemy.timer = state.gameTime + 0.2;
        enemy.lastAttack = state.gameTime;
        enemy.dashAngle = Math.atan2(dy, dx);
    }

    if (enemy.dashState === 1) {
        if (state.gameTime < enemy.timer) {
            const dashSpeed = 12.5 * (state.gameSpeedMult ?? 1) * (currentSpd > 0 ? 1 : 0);
            const angle = enemy.dashAngle || Math.atan2(dy, dx);
            return {
                vx: Math.cos(angle) * dashSpeed + pushX,
                vy: Math.sin(angle) * dashSpeed + pushY
            };
        }

        enemy.dashState = 0;
        enemy.lastAttack = state.gameTime;
    }

    const angle = Math.atan2(dy, dx);
    return {
        vx: Math.cos(angle) * currentSpd + pushX,
        vy: Math.sin(angle) * currentSpd + pushY
    };
}
