import type { GameState } from '../core/types';

export const TICK_INTERVAL = 20; 

export function updateIncubator(state: GameState, step: number, onEvent?: (type: string, data?: any) => void) {
    if (!state.incubator) return;

    for (let i = 0; i < state.incubator.length; i++) {
        const met = state.incubator[i];

        
        if (!met || met.isRuined) continue;

        
        if (state.incubatorFuel <= 0) {
            met.insertedAt += step; 
            continue;
        }

        const timeInIncubator = state.gameTime - met.insertedAt;
        const expectedTicks = Math.floor(timeInIncubator / TICK_INTERVAL);

        if (expectedTicks > met.growthTicks) {
            
            state.incubatorFuel = Math.max(0, state.incubatorFuel - 1);

            
            if (met.instability > 0) {
                const breakChance = met.instability / 100;
                if (Math.random() < breakChance) {
                    met.isRuined = true;
                    if (onEvent) onEvent('incubator_destroyed', met);
                    continue;
                }
            }

            
            const boost = Math.floor(Math.random() * 2) + 1;
            met.incubatorBoost = (met.incubatorBoost || 0) + boost;

            
            const instabilityAdd = Math.floor(Math.random() * 3) + 3; 
            met.instability = (met.instability || 0) + instabilityAdd;

            
            met.growthTicks = expectedTicks;
        }
    }
}
