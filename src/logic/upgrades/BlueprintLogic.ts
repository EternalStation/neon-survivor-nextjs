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
        serial: 'GUAR-D',
        desc: 'Block lethal hit, teleport to random safe location (min 2500u offset) and grant 1.5s immunity. Duration 300s.',
        cost: 100,
        duration: 300 // 5 min
    },
    DIMENSIONAL_GATE: {
        type: 'DIMENSIONAL_GATE',
        name: 'Dimensional Gate',
        serial: 'GATE-KEY',
        desc: 'Unlocks Neural Portals, allowing travel to other sectors.',
        cost: 0,
        duration: -1 // Permanent
    },
    SECTOR_UPGRADE_ECO: {
        type: 'SECTOR_UPGRADE_ECO',
        name: 'Sector Override: ECO',
        serial: 'ECO-OVR',
        desc: 'Unlocks Economic Sector Protocol: +30% EXP and Soul Harvest. Permanent.',
        cost: 200,
        duration: -1 // Permanent
    },
    SECTOR_UPGRADE_COM: {
        type: 'SECTOR_UPGRADE_COM',
        name: 'Sector Override: COM',
        serial: 'COM-OVR',
        desc: 'Unlocks Combat Sector Protocol: +30% Offensive Output (DMG & Attack Speed). Permanent.',
        cost: 200,
        duration: -1 // Permanent
    },
    SECTOR_UPGRADE_DEF: {
        type: 'SECTOR_UPGRADE_DEF',
        name: 'Sector Override: DEF',
        serial: 'DEF-OVR',
        desc: 'Unlocks Defense Sector Protocol: +30% Vitality Metrics (Max HP & Regen). Permanent.',
        cost: 200,
        duration: -1 // Permanent
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
    // DELAY MECHANIC: No Blueprints until 10 minutes (600s)
    if (state.gameTime < 600) return;

    // 15% Drop Rate from Elites
    if (Math.random() > 0.15) return;

    const types: BlueprintType[] = [
        'METEOR_SHOWER', 'NEURAL_OVERCLOCK', 'STASIS_FIELD', 'PERK_RESONANCE', 'ARENA_SURGE', 'QUANTUM_SCRAPPER', 'MATRIX_OVERDRIVE', 'TEMPORAL_GUARD',
        'SECTOR_UPGRADE_ECO', 'SECTOR_UPGRADE_COM', 'SECTOR_UPGRADE_DEF'
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];
    dropBlueprint(state, randomType, x, y);
}

export function researchBlueprint(state: GameState, inventoryIndex: number): boolean {
    const item = state.inventory[inventoryIndex];
    if (!item || !item.isBlueprint) return false;

    // Convert format if needed
    const blueprint: any = (item as any).blueprintType ? createBlueprint((item as any).blueprintType) : item;

    blueprint.researched = false;
    blueprint.status = 'researching';
    // Random duration between 30 and 60 seconds
    const randomDuration = 30 + Math.random() * 30;
    blueprint.researchFinishTime = state.gameTime + randomDuration;

    // Try to move to a Safe Slot (0-9) if not already in one
    if (inventoryIndex >= 10) {
        const safeSlotIdx = state.inventory.findIndex((s, idx) => s === null && idx < 10);
        if (safeSlotIdx !== -1) {
            state.inventory[safeSlotIdx] = blueprint;
            state.inventory[inventoryIndex] = null;
        } else {
            // Slaps it back in current slot if no safe slot available
            state.inventory[inventoryIndex] = blueprint;
        }
    } else {
        state.inventory[inventoryIndex] = blueprint;
    }

    playSfx('socket-place');
    return true;
}

export function checkResearchProgress(state: GameState) {
    const now = state.gameTime;
    let updated = false;
    state.inventory.forEach(item => {
        if (item && item.isBlueprint && item.status === 'researching' && (item as any).researchFinishTime) {
            if (now >= (item as any).researchFinishTime) {
                item.status = 'ready';
                item.researched = true;
                playSfx('rare-spawn');
                updated = true;
            }
        }
    });
    return updated;
}

export function activateBlueprint(state: GameState, inventoryIndex: number): boolean {
    const item = state.inventory[inventoryIndex];
    if (!item || !item.isBlueprint || state.player.dust < (item as any).cost) return false;
    const blueprint = item as unknown as Blueprint;
    if (blueprint.status === 'broken') return false;

    // Check if duplicate is active
    if (isBuffActive(state, blueprint.type)) {
        return false;
    }

    state.player.dust -= blueprint.cost;
    blueprint.status = 'active';

    // Handle Permanent Unlocks
    if (blueprint.type === 'DIMENSIONAL_GATE') {
        state.portalsUnlocked = true;
        playSfx('rare-spawn'); // Placeholder sound
        blueprint.status = 'broken'; // Mark as broken immediately (One-time use)
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_ECO') {
        state.arenaLevels[0] = (state.arenaLevels[0] || 0) + 1;
        blueprint.status = 'broken';
        playSfx('rare-spawn');
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_COM') {
        state.arenaLevels[1] = (state.arenaLevels[1] || 0) + 1;
        blueprint.status = 'broken';
        playSfx('rare-spawn');
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_DEF') {
        state.arenaLevels[2] = (state.arenaLevels[2] || 0) + 1;
        blueprint.status = 'broken';
        playSfx('rare-spawn');
        return true;
    }

    if (blueprint.type === 'QUANTUM_SCRAPPER') {
        state.activeBlueprintCharges[blueprint.type] = 50;
    } else if (blueprint.type === 'ARENA_SURGE') {
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
        }
    }

    // Check for expired blueprints (Broken State Transition)
    state.inventory.forEach(item => {
        if (item && item.isBlueprint && item.status === 'active') {
            const blueprint = item as unknown as Blueprint;
            const data = BLUEPRINT_DATA[blueprint.type];
            if (data.duration === -1) return;

            const isActive = isBuffActive(state, blueprint.type);
            if (!isActive) {
                blueprint.status = 'broken';
                playSfx('impact');
            }
        }
    });

    // Clean up expired charges/buffs and mark charge-based blueprints as broken
    for (const type in state.activeBlueprintCharges) {
        const t = type as BlueprintType;
        if (state.activeBlueprintCharges[t]! <= 0) {
            delete state.activeBlueprintCharges[t];
            // Mark the blueprint as broken in inventory
            const item = state.inventory.find(i => i && i.isBlueprint && (i as any).type === t);
            if (item && item.status === 'active') {
                item.status = 'broken';
                playSfx('impact');
            }
        }
    }
}

export function scrapBlueprint(state: GameState, inventoryIndex: number) {
    const item = state.inventory[inventoryIndex];
    if (item && item.isBlueprint) {
        state.player.dust += 5;
        state.inventory[inventoryIndex] = null;
        spawnFloatingNumber(state, state.player.x, state.player.y, "+5", '#60a5fa', true);
        playSfx('recycle');
    }
}
