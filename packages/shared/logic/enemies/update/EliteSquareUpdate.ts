import { spawnParticles } from '../../effects/ParticleLogic';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateEliteSquare({ enemy, state, currentSpd, dx, dy, pushX, pushY }: EnemyUpdateContext) {
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * (currentSpd * 0.85) + pushX;
    const vy = Math.sin(angle) * (currentSpd * 0.85) + pushY;

    if (Math.random() < 0.1) {
        spawnParticles(state, enemy.x + (Math.random() - 0.5) * enemy.size * 2, enemy.y + (Math.random() - 0.5) * enemy.size * 2, '#94A3B8', 1);
    }

    return { vx, vy };
}
