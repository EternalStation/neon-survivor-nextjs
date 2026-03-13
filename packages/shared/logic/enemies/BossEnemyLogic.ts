import type { Enemy, GameState } from '../core/Types';
import { updateAbominationBoss, updateSquareBoss, updateCircleBoss } from './bosses/BossLogicPart1';
import { updateTriangleBoss, updateDiamondBoss, updatePentagonBoss } from './bosses/BossLogicPart2';

export function updateBossEnemy(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, onEvent?: (event: string, data?: any) => void) {
    
    const isLevel5 = e.bossTier === 5 || (state.gameTime > 2400 && e.bossTier !== 1);
    const isLevel4 = e.bossTier === 4 || (state.gameTime > 1800 && e.bossTier !== 1) || isLevel5;
    const isLevel3 = e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1) || isLevel4;
    const isLevel2 = e.bossTier === 2 || (state.gameTime > 600 && e.bossTier !== 1) || isLevel3; 

    
    if (e.shape === 'abomination') {
        return updateAbominationBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel4);
    }

    
    if (e.shape === 'square') {
        return updateSquareBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, isLevel4);
    }

    
    if (e.shape === 'circle') {
        return updateCircleBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, isLevel4);
    }

    
    if (e.shape === 'triangle') {
        return updateTriangleBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, isLevel4);
    }

    
    if (e.shape === 'diamond') {
        return updateDiamondBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, isLevel4, isLevel5, onEvent);
    }

    
    if (e.shape === 'pentagon') {
        return updatePentagonBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, isLevel4, onEvent);
    }

    
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * currentSpd + pushX;
    const vy = Math.sin(angle) * currentSpd + pushY;
    return { vx, vy };
}
