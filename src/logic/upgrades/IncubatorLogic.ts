import type { GameState } from '../core/types';

export const TICK_INTERVAL = 20; // 20 seconds per growth tick
const INSTABILITY_THRESHOLD = 3; // 3 ticks (1 minute) before instability kicks in

export function updateIncubator(state: GameState, step: number) {
    if (!state.incubator) return;

    for (let i = 0; i < state.incubator.length; i++) {
        const met = state.incubator[i];

        // Skip empty slots or already ruined meteorites
        if (!met || met.isRuined) continue;

        // NEW: Fuel Check
        if (state.incubatorFuel <= 0) {
            met.insertedAt += step; // Shift insertion time forward to "pause" progress
            continue;
        }

        const timeInIncubator = state.gameTime - met.insertedAt;
        const expectedTicks = Math.floor(timeInIncubator / TICK_INTERVAL);

        if (expectedTicks > met.growthTicks) {
            // Consume Fuel (1 unit per tick)
            state.incubatorFuel = Math.max(0, state.incubatorFuel - 1);

            // Destruction check happens at the START of a new tick (based on instability from previous tick)
            if (met.instability > 0) {
                const breakChance = met.instability / 100;
                if (Math.random() < breakChance) {
                    met.isRuined = true;
                    continue;
                }
            }

            // Apply growth boost (1% to 2%)
            const boost = Math.floor(Math.random() * 2) + 1;
            met.incubatorBoost = (met.incubatorBoost || 0) + boost;

            // Update instability if we are past the 1 minute threshold
            if (expectedTicks >= INSTABILITY_THRESHOLD) {
                const instabilityAdd = Math.floor(Math.random() * 3) + 3; // 3% to 5%
                met.instability = (met.instability || 0) + instabilityAdd;
            }

            // Mark tick as processed
            met.growthTicks = expectedTicks;
        }
    }
}
