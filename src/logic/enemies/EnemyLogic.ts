import type { GameState } from '../core/types';
import { handleWorldSystems, handleSpawnExecution, handleScheduledSpawns, handleLegionAndMerges } from './EnemySystemLogic';
import { updateSingleEnemy } from './EnemyIndividualUpdate';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';

// Helper to determine current game era params
export { spawnEnemy, spawnRareEnemy } from './EnemySpawnLogic';

export function updateEnemies(state: GameState, onEvent?: (event: string, data?: any) => void, step: number = 1 / 60) {
    const { enemies } = state;

    // 1. World & Atmospheric Systems
    const { bhPullSpeed, overclockActive } = handleWorldSystems(state, step);
    const resonance = getChassisResonance(state);

    // 2. Spawn Logic
    handleSpawnExecution(state, overclockActive, step);
    handleScheduledSpawns(state);

    // 3. Spatial Optimization
    state.spatialGrid.clear();
    enemies.forEach(e => {
        if (!e.dead) state.spatialGrid.add(e);
    });

    // 4. Large-Scale Formations (Legion & Merge)
    handleLegionAndMerges(state, step);

    // 5. Individual Unit Updates
    enemies.forEach(e => {
        updateSingleEnemy(e, state, step, bhPullSpeed, onEvent, resonance);
    });
}

export function resetEnemyAggro(state: GameState) {
    // Disabled aggressive resets to keep enemy animations playing smoothly after pause/slow-mo.
}


