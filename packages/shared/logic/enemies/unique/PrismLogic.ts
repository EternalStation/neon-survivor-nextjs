import type { GameState, Enemy } from '../../core/Types';
import { updateGlitcher } from './GlitcherLogic';

export function updatePrism(e: Enemy, state: GameState, step: number) {
    return updateGlitcher(e, state, step);
}
