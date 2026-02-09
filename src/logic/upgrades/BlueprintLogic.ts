import type { GameState, Blueprint, BlueprintType, PlayerStats } from '../core/types';
import { playSfx } from '../audio/AudioLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';

export const BLUEPRINT_DATA: Record<BlueprintType, Omit<Blueprint, 'id' | 'researched' | 'isBlueprint' | 'status'>> = {
    METEOR_SHOWER: {
        type: 'METEOR_SHOWER',
        name: 'Meteor Shower',
        serial: 'ORB-01',
        desc: 'Increases Meteorite drop rate by 50%. Duration 300s.',
        cost: 50,
        duration: 300 // 5 min
    },
    NEURAL_OVERCLOCK: {
        type: 'NEURAL_OVERCLOCK',
        name: 'Neural Overclock',
        serial: 'NEU-77',
        desc: 'Reduces Active skill cooldown by 30%. Duration 180s.',
        cost: 50,
        duration: 180 // 3 min
    },
    STASIS_FIELD: {
        type: 'STASIS_FIELD',
        name: 'Stasis Field',
        serial: 'STA-X2',
        desc: 'Reduces all nearby Enemy movement speed by 20%. Duration 120s.',
        cost: 50,
        duration: 120 // 2 min
    },
    PERK_RESONANCE: {
        type: 'PERK_RESONANCE',
        name: 'Perk Resonance',
        serial: 'HARM-V',
        desc: 'New meteorites gain a permanent +2% quality shift to all perk value ranges. Duration 180s.',
        cost: 50,
        duration: 180 // 3 min
    },
    ARENA_SURGE: {
        type: 'ARENA_SURGE',
        name: 'Arena Surge',
        serial: 'SURG-0',
        desc: 'Increases all Arena-specific modifiers by 100%. Duration 300s.',
        cost: 50,
        duration: 300 // 5 min
    },
    QUANTUM_SCRAPPER: {
        type: 'QUANTUM_SCRAPPER',
        name: 'Quantum Scrapper',
        serial: 'SCRP-Q',
        desc: 'Grants a 25% chance to refund double Dust on recycle. Limit 50 recycles.',
        cost: 50,
        duration: 0 // Charge based
    },
    MATRIX_OVERDRIVE: {
        type: 'MATRIX_OVERDRIVE',
        name: 'Matrix Overdrive',
        serial: 'MATR-X',
        desc: 'Increases effectiveness of all slotted Meteorite perks by 15%. Duration 300s.',
        cost: 50,
        duration: 300 // 5 min
    },
    TEMPORAL_GUARD: {
        type: 'TEMPORAL_GUARD',
        name: 'Temporal Guard',
        serial: 'GUAR_D',
        desc: 'Block lethal hit, teleport to random safe location (min 2500u offset) and grant 1.5s immunity. Duration 300s.',
        cost: 100,
        duration: 300 // 5 min
    }
};

export function createBlueprint(type: BlueprintType): Blueprint {
    const data = BLUEPRINT_DATA[type];
    return {
        id: Math.random(),
        ...data,
        isBlueprint: true,
        researched: false,
        status: 'ready'
    };
}

export function dropBlueprint(state: GameState, type: BlueprintType, x: number, y: number) {
    const data = BLUEPRINT_DATA[type];
    const blueprintItem: any = {
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        rarity: 'divine', // Visual color tier
        quality: 'New',
        visualIndex: 8,
        magnetized: false,
        isBlueprint: true,
        blueprintType: type,
        name: data.name,
        researched: false,
        status: 'ready',
        spawnedAt: state.gameTime,
        discoveredIn: 'BLUEPRINT ARCHIVE',
        perks: [],
        stats: {}
    };
    state.meteorites.push(blueprintItem);
    playSfx('rare-spawn');
}

export function trySpawnBlueprint(state: GameState, x: number, y: number) {
    // 15% Drop Rate from Elites
    if (Math.random() > 0.15) return;

    const types: BlueprintType[] = ['METEOR_SHOWER', 'NEURAL_OVERCLOCK', 'STASIS_FIELD', 'PERK_RESONANCE', 'ARENA_SURGE', 'QUANTUM_SCRAPPER', 'MATRIX_OVERDRIVE', 'TEMPORAL_GUARD'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    dropBlueprint(state, randomType, x, y);
}

export function researchBlueprint(state: GameState, inventoryIndex: number): boolean {
    const item = state.inventory[inventoryIndex];
    if (!item) return false;

    const type = (item as any).blueprintType || (item as any).type;
    if (!type || !BLUEPRINT_DATA[type as BlueprintType]) return false;

    // If it's a world-drop meteorite format, convert it to a full blueprint
    const blueprint = (item as any).blueprintType ? createBlueprint((item as any).blueprintType) : (item as unknown as Blueprint);

    // Find empty blueprint slot (Only slots 0-7 are available for now)
    const slotIdx = state.blueprints.findIndex((s, idx) => s === null && idx < 8);
    if (slotIdx !== -1) {
        blueprint.researched = false;
        blueprint.status = 'researching';
        // Random duration between 30 and 120 seconds
        const randomDuration = 30 + Math.random() * 90; // 30 + (0 to 90) = 30 to 120
        blueprint.researchFinishTime = Date.now() + (randomDuration * 1000);
        state.blueprints[slotIdx] = blueprint;
        state.inventory[inventoryIndex] = null;
        playSfx('socket-place');
        return true;
    } else {
        // Warning: Slots full. (Handled via UI)
        return false;
    }
}

export function checkResearchProgress(state: GameState) {
    const now = Date.now();
    let updated = false;
    state.blueprints.forEach(bp => {
        if (bp && bp.status === 'researching' && bp.researchFinishTime) {
            if (now >= bp.researchFinishTime) {
                bp.status = 'ready';
                bp.researched = true;
                playSfx('rare-spawn'); // Research Complete Sound
                updated = true;
            }
        }
    });
    return updated;
}

export function activateBlueprint(state: GameState, slotIndex: number): boolean {
    const blueprint = state.blueprints[slotIndex];
    if (!blueprint || slotIndex >= 8 || state.player.dust < blueprint.cost) return false;
    if (blueprint.status === 'broken') return false;

    // Check if duplicate is active
    if (isBuffActive(state, blueprint.type)) {
        return false;
    }

    state.player.dust -= blueprint.cost;
    blueprint.status = 'active';

    if (blueprint.type === 'QUANTUM_SCRAPPER') {
        state.activeBlueprintCharges[blueprint.type] = 50;
    } else if (blueprint.type === 'ARENA_SURGE') {
        state.arenaBuffMult = 2.0; // 100% increase
        // Sync to whole seconds: round gameTime up, then add duration
        const endTime = Math.ceil(state.gameTime) + blueprint.duration;
        state.activeBlueprintBuffs[blueprint.type] = endTime;
    } else {
        // Sync to whole seconds: round gameTime up, then add duration
        const endTime = Math.ceil(state.gameTime) + blueprint.duration;
        state.activeBlueprintBuffs[blueprint.type] = endTime;
    }

    if (blueprint.type === 'TEMPORAL_GUARD') {
        state.player.temporalGuardActive = true;
    }

    playSfx('rare-spawn');
    return true;
}

export function isBuffActive(state: GameState, type: BlueprintType): boolean {
    // Check time-based buffs
    const endTime = state.activeBlueprintBuffs[type];
    if (endTime && state.gameTime < endTime) return true;

    // Check charge-based buffs
    const charges = state.activeBlueprintCharges[type];
    if (charges !== undefined && charges > 0) return true;

    return false;
}


export function updateBlueprints(state: GameState, step: number) {
    const time = state.gameTime;

    // Handle Research Timers
    // Handle Research Timers
    checkResearchProgress(state);

    for (const type in state.activeBlueprintBuffs) {
        const t = type as BlueprintType;
        if (state.activeBlueprintBuffs[t]! <= time) {
            delete state.activeBlueprintBuffs[t];
            if (t === 'TEMPORAL_GUARD') {
                state.player.temporalGuardActive = false;
            }
            if (t === 'ARENA_SURGE') {
                state.arenaBuffMult = 1.0;
            }
        }
    }

    // Check for expired blueprints (Broken State Transition)
    state.blueprints.forEach(bp => {
        if (bp && bp.status === 'active') {
            const isActive = isBuffActive(state, bp.type);
            if (!isActive) {
                bp.status = 'broken';
                playSfx('impact'); // Or 'shield-break'
            }
        }
    });

    // Clean up expired charges/buffs and mark charge-based blueprints as broken
    for (const type in state.activeBlueprintCharges) {
        const t = type as BlueprintType;
        if (state.activeBlueprintCharges[t]! <= 0) {
            delete state.activeBlueprintCharges[t];
            // Mark the blueprint as broken
            const bp = state.blueprints.find(b => b && b.type === t);
            if (bp && bp.status === 'active') {
                bp.status = 'broken';
                playSfx('impact');
            }
        }
    }
}

export function scrapBlueprint(state: GameState, slotIndex: number) {
    const bp = state.blueprints[slotIndex];
    if (bp) {
        // Broken = 5 dust scrap.
        // Ready = 5 dust (sold).

        state.player.dust += 5;
        state.blueprints[slotIndex] = null;
        spawnFloatingNumber(state, state.player.x, state.player.y, "+5", '#60a5fa', true);
        playSfx('recycle');
    }
}
