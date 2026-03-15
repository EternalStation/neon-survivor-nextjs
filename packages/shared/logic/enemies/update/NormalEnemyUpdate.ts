import { EnemyUpdateContext } from './EnemyUpdateContext';
import { updateNormalCircle } from './NormalCircleUpdate';
import { updateNormalTriangle } from './NormalTriangleUpdate';
import { updateNormalSquare } from './NormalSquareUpdate';
import { updateNormalDiamond } from './NormalDiamondUpdate';
import { updateNormalPentagon, updateUniquePentagon } from './NormalPentagonUpdate';

export { updateNormalCircle, updateNormalTriangle, updateNormalSquare, updateNormalDiamond, updateNormalPentagon, updateUniquePentagon };

export function updateNormalEnemy(context: EnemyUpdateContext) {
    switch (context.enemy.shape) {
        case 'circle':
            return updateNormalCircle(context);
        case 'triangle':
            return updateNormalTriangle(context);
        case 'square':
        case 'hexagon':
            return updateNormalSquare(context);
        case 'diamond':
            return updateNormalDiamond(context);
        case 'pentagon':
            return updateNormalPentagon(context);
        default:
            return { vx: 0, vy: 0 };
    }
}
