import type { GameState, GameEventType, GameEvent } from './types';
import { playSfx } from './AudioLogic';

const CHECK_INTERVAL = 120; // Check every 2 minutes (120s)
const MIN_TIME_FOR_EVENTS = 60; // Start events after 1 minute

export function updateDirector(state: GameState, step: number) {
    if (state.gameOver || state.isPaused) return;

    // Ensure state tracking exists
    if (!state.directorState) state.directorState = { necroticCycle: -1, legionCycle: -1 };

    const minutes = state.gameTime / 60;
    const current5MinCycle = Math.floor(minutes / 5);


    // 1. Check for RANDOM events (Solar EMP) - Exclude scheduled ones
    // Check every 2 minutes for general random events logic if not active
    if (state.gameTime >= state.nextEventCheckTime && !state.activeEvent) {
        if (state.gameTime > MIN_TIME_FOR_EVENTS) {
            // General pool (Only solar_emp now, since others are scheduled)
            const pool: GameEventType[] = ['solar_emp'];

            // 30% chance every 2 mins
            if (Math.random() < 0.3) {
                const type = pool[Math.floor(Math.random() * pool.length)];
                startEvent(state, type);
            }
        }
        state.nextEventCheckTime = state.gameTime + CHECK_INTERVAL;
    }

    // 2. SCHEDULED EVENTS (Necrotic Surge & Legion Formation)
    // Only start attempting after 10 minutes (Cycle 2+)
    if (minutes >= 10 && !state.activeEvent) {

        // --- Necrotic Surge Logic ---
        // Once per 5-min cycle
        if (current5MinCycle > state.directorState.necroticCycle) {
            // Chance to spawn: We want it to happen EVENTUALLY in this 5 minute window.
            // Window is 300 seconds. 60 FPS. 18000 frames.
            // 1/9000 chance gives approx 2 events per window on avg? No, we cap it at 1.
            // Let's use 1/3600 (once per minute prob) to ensure it happens early-ish but random.
            if (Math.random() < 0.0003) {
                startEvent(state, 'necrotic_surge');
                state.directorState.necroticCycle = current5MinCycle;
            }
        }

        // --- Legion Formation Logic ---
        // Same rules: Once per 5-min cycle, after 10 mins.
        // We check if we are NOT currently running an event (already checked above)
        // Note: If Necrotic Surge starts, this won't run until it ends. That's fine.
        if (!state.activeEvent && current5MinCycle > state.directorState.legionCycle) {
            if (Math.random() < 0.0003) {
                startEvent(state, 'legion_formation');
                state.directorState.legionCycle = current5MinCycle;
                state.directorState.legionSpawned = false; // Reset for new event
            }
        }
    }

    // 3. Update existing event
    if (state.activeEvent) {
        if (state.activeEvent.type === 'legion_formation' && state.directorState?.legionSpawned) {
            // Check if any legion members remain
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
    let duration = 60; // Default 1 minute

    // Necrotic Surge is shorter, Legion Formation lasts until death
    if (type === 'necrotic_surge') {
        duration = 30; // 30 seconds
    } else if (type === 'legion_formation') {
        duration = 600; // 10 minutes fallback
    }

    const event: GameEvent = {
        type,
        startTime: state.gameTime,
        duration,
        endTime: state.gameTime + duration,
        data: {}
    };

    state.activeEvent = event;

    // Event Specific Initialization
    switch (type) {
        case 'necrotic_surge':
            playSfx('rare-spawn');
            break;
        case 'solar_emp':
            playSfx('warning');
            break;
        case 'legion_formation':
            playSfx('warning'); // Maybe a horn?
            break;
    }

    console.log(`Director: Starting event ${type} for ${duration}s`);
}

function updateActiveEvent(state: GameState, _step: number) {
    if (!state.activeEvent) return;

    // Process pending zombie spawns
    if (state.activeEvent.pendingZombieSpawns && state.activeEvent.pendingZombieSpawns.length > 0) {
        const spawnsToProcess = state.activeEvent.pendingZombieSpawns.filter(z => state.gameTime >= z.spawnAt);

        spawnsToProcess.forEach(zombieData => {
            // Spawn the hostile zombie NOW
            const eventZombie: any = {
                id: Math.random(),
                type: zombieData.shape,
                shape: zombieData.shape,
                x: zombieData.x,
                y: zombieData.y,
                size: zombieData.size,
                hp: Math.floor(zombieData.maxHp * 0.5), // 50% HP
                maxHp: Math.floor(zombieData.maxHp * 0.5),
                spd: zombieData.spd,
                boss: false,
                bossType: 0,
                bossAttackPattern: 0,
                lastAttack: 0,
                dead: false,
                shellStage: 0,
                palette: ['#0f172a', '#4f46e5', '#818cf8'], // Void Indigo
                eraPalette: ['#0f172a', '#4f46e5', '#818cf8'],
                fluxState: 0,
                pulsePhase: 0,
                rotationPhase: 0,
                knockback: { x: 0, y: 0 },
                isElite: false,
                xpRewardMult: 0.5, // 50% XP
                spawnedAt: state.gameTime,
                frozen: 1.0, // Digging for 1 second
                summonState: 1, // Trigger digging animation in renderer
                isNecroticZombie: true // Prevent palette overrides
            };
            state.enemies.push(eventZombie);

            // Visual feedback - Void particles
            import('./ParticleLogic').then(({ spawnParticles }) => {
                spawnParticles(state, zombieData.x, zombieData.y, '#818cf8', 20);
            });
        });

        // Remove processed spawns
        state.activeEvent.pendingZombieSpawns = state.activeEvent.pendingZombieSpawns.filter(
            z => state.gameTime < z.spawnAt
        );
    }

    // Handle end of event
    if (state.gameTime >= state.activeEvent.endTime) {
        console.log(`Director: Event ${state.activeEvent.type} ended`);
        state.activeEvent = null;
        return;
    }
}

// Helper to check if a specific event is active
export function isEventActive(state: GameState, type: GameEventType): boolean {
    return state.activeEvent?.type === type;
}
