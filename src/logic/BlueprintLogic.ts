import type { GameState, Blueprint, BlueprintType } from './types';
import { playSfx } from './AudioLogic';

export const BLUEPRINT_DATA: Record<BlueprintType, Omit<Blueprint, 'id' | 'researched' | 'isBlueprint'>> = {
    METEOR_SHOWER: {
        type: 'METEOR_SHOWER',
        name: 'Meteor Shower',
        desc: 'Orbital Resonance: Calibrates atmospheric scanners to identify high-density debris clusters. Increases Meteorite drop rate by +50%.',
        cost: 40,
        duration: 300 // 5 min
    },
    NEURAL_OVERCLOCK: {
        type: 'NEURAL_OVERCLOCK',
        name: 'Neural Overclock',
        desc: 'Cognitive Surge: Accelerates neural processing between chassis and tactical modules. Reduces Active Skill Cooldowns by -30%.',
        cost: 35,
        duration: 180 // 3 min
    },
    STASIS_FIELD: {
        type: 'STASIS_FIELD',
        name: 'Stasis Field',
        desc: 'Temporal Anchor: Projects a localized sub-atomic friction field around the chassis. Reduces all nearby Enemy movement speed by -20%.',
        cost: 25,
        duration: 120 // 2 min
    },
    PERK_RESONANCE: {
        type: 'PERK_RESONANCE',
        name: 'Perk Resonance',
        desc: 'Harmonic Alignment: Infuses incoming meteorites with resonant energy. New meteorites feature a 1.2x Perk Power Multiplier.',
        cost: 45,
        duration: 180 // 3 min
    },
    ARENA_SURGE: {
        type: 'ARENA_SURGE',
        name: 'Arena Surge',
        desc: 'Environmental Overdrive: Amplifies the output of Sector-specific power grids. Increases Arena Buff effectiveness by x2.',
        cost: 30,
        duration: 300 // 5 min
    },
    QUANTUM_SCRAPPER: {
        type: 'QUANTUM_SCRAPPER',
        name: 'Quantum Scrapper',
        desc: 'Matter Reconstitution: Implements a non-destructive recycling protocol. Grants a 25% chance to refund double Dust on recycle.',
        cost: 35,
        duration: 300 // 5 min
    },
    MATRIX_OVERDRIVE: {
        type: 'MATRIX_OVERDRIVE',
        name: 'Matrix Overdrive',
        desc: 'System Synchronization: Forces global synchronization between all active modules. Grants +15% power to every slotted Meteorite.',
        cost: 75,
        duration: 300 // 5 min
    },
    TEMPORAL_GUARD: {
        type: 'TEMPORAL_GUARD',
        name: 'Temporal Guard',
        desc: 'Quantum Backtrack: Monitors vital telemetry. Upon detecting lethal hull failure, teleports the chassis to a safe coordinate and restores full integrity.',
        cost: 500,
        duration: 300 // 5 min
    }
};

export function createBlueprint(type: BlueprintType): Blueprint {
    const data = BLUEPRINT_DATA[type];
    return {
        id: Math.random(),
        ...data,
        isBlueprint: true,
        researched: false
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
        spawnedAt: state.gameTime,
        discoveredIn: 'BLUEPRINT ARCHIVE',
        perks: [],
        stats: {}
    };
    state.meteorites.push(blueprintItem);
    playSfx('rare-spawn');
}

export function trySpawnBlueprint(state: GameState, x: number, y: number) {
    // 5% Drop Rate from Elites
    if (Math.random() > 0.05) return;

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
        blueprint.researched = true;
        state.blueprints[slotIdx] = blueprint;
        state.inventory[inventoryIndex] = null;
        playSfx('socket-place');
        return true;
    } else {
        // Warning: Slots full. (Handled via UI)
        return false;
    }
}

export function activateBlueprint(state: GameState, slotIndex: number): boolean {
    const blueprint = state.blueprints[slotIndex];
    if (!blueprint || slotIndex >= 8 || state.player.dust < blueprint.cost) return false;

    state.player.dust -= blueprint.cost;
    const now = Date.now();
    const endTime = now + (blueprint.duration * 1000);

    state.activeBlueprintBuffs[blueprint.type] = endTime;

    if (blueprint.type === 'TEMPORAL_GUARD') {
        state.player.temporalGuardActive = true;
    }

    playSfx('rare-spawn'); // Or some "Activation" sound
    return true;
}

export function isBuffActive(state: GameState, type: BlueprintType): boolean {
    const endTime = state.activeBlueprintBuffs[type];
    if (!endTime) return false;
    return Date.now() < endTime;
}

export function updateBlueprints(state: GameState) {
    const now = Date.now();
    for (const type in state.activeBlueprintBuffs) {
        const t = type as BlueprintType;
        if (state.activeBlueprintBuffs[t]! <= now) {
            delete state.activeBlueprintBuffs[t];
            if (t === 'TEMPORAL_GUARD') {
                state.player.temporalGuardActive = false;
            }
        }
    }
}
