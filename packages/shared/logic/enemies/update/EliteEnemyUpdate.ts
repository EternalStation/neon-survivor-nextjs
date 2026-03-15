import { EnemyUpdateContext } from './EnemyUpdateContext';
import { updateEliteCircle } from './EliteCircleUpdate';
import { updateEliteTriangle } from './EliteTriangleUpdate';
import { updateEliteSquare } from './EliteSquareUpdate';
import { updateEliteDiamond } from './EliteDiamondUpdate';
import { updateElitePentagon } from './ElitePentagonUpdate';

export { updateEliteCircle, updateEliteTriangle, updateEliteSquare, updateEliteDiamond, updateElitePentagon };

export function updateEliteEnemy(context: EnemyUpdateContext) {
    switch (context.enemy.shape) {
        case 'circle':
            return updateEliteCircle(context);
        case 'triangle':
            return updateEliteTriangle(context);
        case 'square':
            return updateEliteSquare(context);
        case 'diamond':
            return updateEliteDiamond(context);
        case 'pentagon':
            return updateElitePentagon(context);
        default:
            return { vx: 0, vy: 0 };
    }
}
