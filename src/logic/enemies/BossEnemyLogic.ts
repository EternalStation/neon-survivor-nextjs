import type { Enemy, GameState } from '../core/types';
import { updateAbominationBoss, updateSquareBoss, updateCircleBoss } from './bosses/BossLogicPart1';
import { updateTriangleBoss, updateDiamondBoss, updatePentagonBoss } from './bosses/BossLogicPart2';

export function updateBossEnemy(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, onEvent?: (event: string, data?: any) => void) {
    // Level 3 Boss Logic (20 Minutes+)
    const isLevel3 = e.bossTier === 3 || (state.gameTime > 1200 && e.bossTier !== 1);
    const isLevel2 = e.bossTier === 2 || (state.gameTime > 600 && e.bossTier !== 1) || isLevel3; // Lvl 3 includes Lvl 2 mechanics usually, unless overridden

    // --- ABOMINATION (BULL HEAD) ---
    if (e.shape === 'abomination') {
        return updateAbominationBoss(e, currentSpd, dx, dy, pushX, pushY, state);
    }

    // --- SQUARE BOSS (THE FORTRESS) ---
    if (e.shape === 'square') {
        return updateSquareBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3);
    }

    // --- CIRCLE BOSS (THE WARLORD) ---
    if (e.shape === 'circle') {
        return updateCircleBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3);
    }

    // --- TRIANGLE BOSS (THE REAPER) ---
    if (e.shape === 'triangle') {
        return updateTriangleBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3);
    }

    // --- DIAMOND BOSS (THE MARKSMAN) ---
    if (e.shape === 'diamond') {
        return updateDiamondBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, onEvent);
    }

    // --- PENTAGON BOSS (THE OMEGA) ---
    if (e.shape === 'pentagon') {
        return updatePentagonBoss(e, currentSpd, dx, dy, pushX, pushY, state, isLevel2, isLevel3, onEvent);
    }

    // Default Fallback
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * currentSpd + pushX;
    const vy = Math.sin(angle) * currentSpd + pushY;
    return { vx, vy };
}
