import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateNormalCircle({ enemy, state, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    if (enemy.timer && state.gameTime < enemy.timer) return { vx: 0, vy: 0 };

    const angle = Math.atan2(dy, dx);
    return {
        vx: Math.cos(angle) * currentSpd + pushX,
        vy: Math.sin(angle) * currentSpd + pushY
    };
}
