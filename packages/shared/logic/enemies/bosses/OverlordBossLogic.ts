import type { Enemy, GameState } from '../../core/Types';
import { checkBossStageTransition } from './BossStageUtils';

export function updateOverlordBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, _isLevel4: boolean) {
    checkBossStageTransition(e, state);

    const angle = Math.atan2(dy, dx);
    const wobble = Math.sin(state.gameTime * 5) * 0.2;
    const vx = Math.cos(angle + wobble) * currentSpd + pushX;
    const vy = Math.sin(angle + wobble) * currentSpd + pushY;
    e.rotationPhase = angle + Math.PI / 2;

    return { vx, vy };
}
