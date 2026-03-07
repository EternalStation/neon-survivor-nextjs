import type { GameState, GameEventType, GameEvent } from '../core/types';
import { playSfx } from '../audio/AudioLogic';

const CHECK_INTERVAL = 120; 
const MIN_TIME_FOR_EVENTS = 60; 

export function updateDirector(state: GameState, step: number) {
    if (state.gameOver || state.isPaused || state.extractionStatus !== 'none') return;

    
    if (!state.directorState) state.directorState = { necroticCycle: -1, legionCycle: -1 };

    const minutes = state.gameTime / 60;
    const current5MinCycle = Math.floor(minutes / 5);


    
    
    if (minutes >= 10 && !state.activeEvent) {

        
        
        if (current5MinCycle > state.directorState.necroticCycle) {
            
            
            
            
            if (Math.random() < 0.0003) {
                startEvent(state, 'necrotic_surge');
                state.directorState.necroticCycle = current5MinCycle;
            }
        }

        
        
        
        
        if (!state.activeEvent && current5MinCycle > state.directorState.legionCycle) {
            if (Math.random() < 0.0003) {
                startEvent(state, 'legion_formation');
                state.directorState.legionCycle = current5MinCycle;
                state.directorState.legionSpawned = false; 
            }
        }
    }

    
    if (state.activeEvent) {
        if (state.activeEvent.type === 'legion_formation' && state.directorState?.legionSpawned) {
            
            const anyLegionAlive = state.enemies.some(e => e.legionId === state.directorState?.activeLegionId && !e.dead);
            if (!anyLegionAlive) {
                console.log(`Director: Legion destroyed, ending event`);
                state.activeEvent = null;
                return;
            }
        } else {
            updateActiveEvent(state, step);
        }
    }
}

function startEvent(state: GameState, type: GameEventType) {
    let duration = 60; 

    
    if (type === 'necrotic_surge') {
        duration = 30; 
    } else if (type === 'legion_formation') {
        duration = 600; 
    }

    const event: GameEvent = {
        type,
        startTime: state.gameTime,
        duration,
        endTime: state.gameTime + duration,
        data: {}
    };

    state.activeEvent = event;

    
    switch (type) {
        case 'necrotic_surge':
            playSfx('ghost-horde');
            break;
        case 'legion_formation':
            playSfx('warning'); 
            break;
    }

    console.log(`Director: Starting event ${type} for ${duration}s`);
}

function updateActiveEvent(state: GameState, _step: number) {
    if (!state.activeEvent) return;

    
    if (state.activeEvent.pendingZombieSpawns && state.activeEvent.pendingZombieSpawns.length > 0) {
        const spawnsToProcess = state.activeEvent.pendingZombieSpawns.filter(z => state.gameTime >= z.spawnAt);

        spawnsToProcess.forEach(zombieData => {
            
            const eventZombie: any = {
                id: Math.random(),
                type: zombieData.shape,
                shape: zombieData.shape,
                x: zombieData.x,
                y: zombieData.y,
                size: zombieData.size,
                hp: Math.floor(zombieData.maxHp * 0.5), 
                maxHp: Math.floor(zombieData.maxHp * 0.5),
                spd: zombieData.spd,
                boss: false,
                bossType: 0,
                bossAttackPattern: 0,
                lastAttack: 0,
                dead: false,
                shellStage: 0,
                palette: ['#93c5fd', '#3b82f6', '#1e3a8a'], 
                eraPalette: ['#93c5fd', '#3b82f6', '#1e3a8a'],
                fluxState: 0,
                pulsePhase: 0,
                rotationPhase: 0,
                knockback: { x: 0, y: 0 },
                isElite: false,
                xpRewardMult: 0.5, 
                spawnedAt: state.gameTime,
                frozen: 1.0, 
                summonState: 1, 
                isGhost: true, 
                isNecroticZombie: true 
            };
            state.enemies.push(eventZombie);

            
            import('../effects/ParticleLogic').then(({ spawnParticles }) => {
                spawnParticles(state, zombieData.x, zombieData.y, '#3b82f6', 20);
            });
        });

        
        state.activeEvent.pendingZombieSpawns = state.activeEvent.pendingZombieSpawns.filter(
            z => state.gameTime < z.spawnAt
        );
    }

    
    if (state.gameTime >= state.activeEvent.endTime) {
        console.log(`Director: Event ${state.activeEvent.type} ended`);
        state.activeEvent = null;
        return;
    }
}


export function isEventActive(state: GameState, type: GameEventType): boolean {
    return state.activeEvent?.type === type;
}
