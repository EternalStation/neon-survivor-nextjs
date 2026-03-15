import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateNormalSquare({ dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    const angle = Math.atan2(dy, dx);
    return {
        vx: Math.cos(angle) * currentSpd + pushX,
        vy: Math.sin(angle) * currentSpd + pushY
    };
}
