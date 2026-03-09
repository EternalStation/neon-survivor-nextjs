import type { GameState } from '../core/Types';
import { handleWorldSystems, handleSpawnExecution, handleScheduledSpawns, handleLegionAndMerges } from './EnemySystemLogic';
import { updateSingleEnemy } from './EnemyIndividualUpdate';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';


export { spawnEnemy, spawnRareEnemy } from './EnemySpawnLogic';

export function updateEnemies(state: GameState, onEvent?: (event: string, data?: any) => void, step: number = 1 / 60) {
    const { enemies } = state;

    
    const { bhPullSpeed, overclockActive } = handleWorldSystems(state, step);
    const resonance = getChassisResonance(state);

    
    handleSpawnExecution(state, overclockActive, step);
    handleScheduledSpawns(state);

    
    state.spatialGrid.clear();
    enemies.forEach(e => {
        if (!e.dead) state.spatialGrid.add(e);
    });

    
    handleLegionAndMerges(state, step);

    
    enemies.forEach(e => {
        updateSingleEnemy(e, state, step, bhPullSpeed, onEvent, resonance);
    });
}

export function resetEnemyAggro(state: GameState) {
    
}


