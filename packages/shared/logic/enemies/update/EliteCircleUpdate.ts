import { spawnParticles } from '../../effects/ParticleLogic';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateEliteCircle({ enemy, state, dist, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    let vx = 0;
    let vy = 0;

    if (!enemy.eliteState) enemy.eliteState = 0;
    if (enemy.eliteState === 0) {
        if (dist < 600 && (!enemy.timer || state.gameTime > enemy.timer)) {
            enemy.eliteState = 1;
            enemy.timer = state.gameTime + 0.5;
        }
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * currentSpd + pushX;
        vy = Math.sin(angle) * currentSpd + pushY;
    } else if (enemy.eliteState === 1) {
        enemy.rotationPhase = (enemy.rotationPhase || 0) + 0.2;
        if (state.gameTime > (enemy.timer || 0)) {
            const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
            let nearestPlayer: any = players[0];
            let minDist = Infinity;
            players.forEach(player => {
                const playerDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
                if (playerDist < minDist) {
                    minDist = playerDist;
                    nearestPlayer = player;
                }
            });

            const targetAngle = Math.atan2(nearestPlayer.y - enemy.y, nearestPlayer.x - enemy.x);
            enemy.lockedTargetX = nearestPlayer.x + Math.cos(targetAngle) * 200;
            enemy.lockedTargetY = nearestPlayer.y + Math.sin(targetAngle) * 200;
            enemy.dashState = targetAngle;
            enemy.eliteState = 2;
            enemy.timer = state.gameTime + 0.5;
        }
    } else if (enemy.eliteState === 2 && enemy.lockedTargetX !== undefined && enemy.lockedTargetY !== undefined) {
        const rDx = enemy.lockedTargetX - enemy.x;
        const rDy = enemy.lockedTargetY - enemy.y;
        const rDist = Math.hypot(rDx, rDy);
        if (rDist > 10) {
            const angle = Math.atan2(rDy, rDx);
            vx = Math.cos(angle) * 10;
            vy = Math.sin(angle) * 10;
            spawnParticles(state, enemy.x, enemy.y, enemy.palette ? enemy.palette[0] : '#EF4444', 1);
        } else {
            enemy.eliteState = 0;
            enemy.timer = state.gameTime + 5.0 + Math.random() * 2.0;
            enemy.lockedTargetX = undefined;
            enemy.lockedTargetY = undefined;
        }
    }

    return { vx, vy };
}
