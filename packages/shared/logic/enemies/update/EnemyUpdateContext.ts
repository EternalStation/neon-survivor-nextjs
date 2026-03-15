import type { Enemy, GameState } from '../../core/Types';

export interface EnemyUpdateContext {
    enemy: Enemy;
    state: GameState;
    step: number;
    dist: number;
    dx: number;
    dy: number;
    currentSpd: number;
    pushX: number;
    pushY: number;
    onEvent?: (event: string, data?: any) => void;
}
