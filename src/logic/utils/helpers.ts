import type { GameState } from '../core/types';
import { PLAYER_CLASSES } from '../core/classes';

/**
 * Get the theme color for the current player class
 */
export function getPlayerThemeColor(state: GameState): string {
    const classId = state.player.playerClass;
    const classData = PLAYER_CLASSES.find(c => c.id === classId);
    return classData?.themeColor || '#22d3ee'; // Default cyan
}
