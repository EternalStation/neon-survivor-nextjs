import { updateEliteEnemy } from './EliteEnemyUpdate';
import { updateNormalEnemy, updateUniquePentagon } from './NormalEnemyUpdate';
import { updateBossEnemy } from './BossEnemyUpdate';
import { updateMinion } from './MinionEnemyUpdate';
import { updateSnitch } from '../unique/SnitchLogic';
import { updateGlitcher } from '../unique/GlitcherLogic';
import { updatePrism } from '../unique/PrismLogic';
import type { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateEnemy(context: EnemyUpdateContext) {
    const { enemy, state, step } = context;

    if (enemy.boss) {
        return updateBossEnemy(enemy, context.currentSpd, context.dx, context.dy, context.pushX, context.pushY, state, context.onEvent);
    }

    if (enemy.shape === 'minion' || enemy.shape === 'elite_minion') {
        return updateMinion(enemy, state, state.player, context.dx, context.dy, 0, 0);
    }

    if (enemy.shape === 'snitch') return updateSnitch(enemy, state, state.player, state.gameTime);
    if (enemy.shape === 'glitcher') return updateGlitcher(enemy, state, step);
    if ((enemy.shape as string) === 'prism') return updatePrism(enemy, state, step);
    if (enemy.isRare && enemy.shape === 'pentagon') return updateUniquePentagon(context);
    if (enemy.isElite) return updateEliteEnemy(context);

    return updateNormalEnemy(context);
}
