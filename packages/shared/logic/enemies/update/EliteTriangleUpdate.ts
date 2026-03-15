import { playSfx } from '../../audio/AudioLogic';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateEliteTriangle({ enemy, state, dist, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    let vx = 0;
    let vy = 0;

    if (!enemy.eliteState) enemy.eliteState = 0;

    if (enemy.eliteState === 0) {
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * currentSpd + pushX;
        vy = Math.sin(angle) * currentSpd + pushY;

        if ((!enemy.timer || state.gameTime > enemy.timer) && dist < 600) {
            enemy.eliteState = 1;
            enemy.timer = state.gameTime + 0.7;
            enemy.dashState = 1;
            playSfx('warning');
            vx = 0;
            vy = 0;
            enemy.jitterX = 0;
            enemy.jitterY = 0;
        } else {
            enemy.jitterX = 0;
            enemy.jitterY = 0;
        }
    } else if (enemy.eliteState === 1) {
        enemy.rotationPhase = (enemy.rotationPhase || 0) + 0.25;
        enemy.dashState = 1;
        enemy.jitterX = (Math.random() - 0.5) * 6;
        enemy.jitterY = (Math.random() - 0.5) * 6;

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
            enemy.lockedTargetX = nearestPlayer.x + Math.cos(targetAngle) * 300;
            enemy.lockedTargetY = nearestPlayer.y + Math.sin(targetAngle) * 300;
            enemy.eliteState = 2;
            enemy.timer = state.gameTime + 1.5;
            enemy.jitterX = 0;
            enemy.jitterY = 0;
        }
    } else if (enemy.eliteState === 2) {
        enemy.dashState = 1;
        enemy.jitterX = 0;
        enemy.jitterY = 0;
        if (enemy.lockedTargetX !== undefined && enemy.lockedTargetY !== undefined) {
            const rDx = enemy.lockedTargetX - enemy.x;
            const rDy = enemy.lockedTargetY - enemy.y;
            const rDist = Math.hypot(rDx, rDy);

            if (rDist > 10 && state.gameTime < (enemy.timer || 0)) {
                enemy.rotationPhase = (enemy.rotationPhase || 0) + 0.6;
                const angle = Math.atan2(rDy, rDx) + Math.sin(state.gameTime * 20) * 0.3;
                vx = Math.cos(angle) * 10;
                vy = Math.sin(angle) * 10;
            } else {
                enemy.eliteState = 0;
                enemy.timer = state.gameTime + 4.0 + Math.random() * 2.0;
                enemy.lockedTargetX = undefined;
                enemy.lockedTargetY = undefined;
                enemy.dashState = 0;
            }
        } else {
            enemy.eliteState = 0;
            enemy.dashState = 0;
        }
    }

    return { vx, vy };
}
