import type { GameState, Player } from '../core/Types';
import { PLAYER_CLASSES } from '../core/Classes';

/**
 * Get the theme color for the current player class
 */
export function getPlayerThemeColor(state: GameState, overridePlayer?: Player): string {
    const player = overridePlayer || state.player;
    const classId = player.playerClass;
    const classData = PLAYER_CLASSES.find(c => c.id === classId);
    return classData?.themeColor || '#22d3ee'; 
}
