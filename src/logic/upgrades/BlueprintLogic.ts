import type { GameState, Blueprint, BlueprintType, PlayerStats } from '../core/Types';
import { playSfx } from '../audio/AudioLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';

export const BLUEPRINT_DATA: Record<BlueprintType, Omit<Blueprint, 'id' | 'researched' | 'isBlueprint' | 'status'>> = {
    METEOR_SHOWER: {
        type: 'METEOR_SHOWER',
        name: 'Meteor Shower',
        serial: 'ORB-01',
        desc: 'Increases Meteorite drop rate by 50%. Duration 300s.',
        cost: 50,
        duration: 300
    },
    NEURAL_OVERCLOCK: {
        type: 'NEURAL_OVERCLOCK',
        name: 'Neural Overclock',
        serial: 'NEU-77',
        desc: 'Reduces Active skill cooldown by 30%. Duration 180s.',
        cost: 50,
        duration: 180
    },
    STASIS_FIELD: {
        type: 'STASIS_FIELD',
        name: 'Stasis Field',
        serial: 'STA-X2',
        desc: 'Reduces all nearby Enemy movement speed by 20%. Duration 120s.',
        cost: 50,
        duration: 120
    },
    PERK_RESONANCE: {
        type: 'PERK_RESONANCE',
        name: 'Perk Resonance',
        serial: 'HARM-V',
        desc: 'New meteorites gain a permanent +2% quality shift to all perk value ranges. Duration 180s.',
        cost: 50,
        duration: 180
    },
    ARENA_SURGE: {
        type: 'ARENA_SURGE',
        name: 'Arena Surge',
        serial: 'SURG-0',
        desc: 'Increases all Arena-specific modifiers by 100%. Duration 300s.',
        cost: 50,
        duration: 300
    },
    QUANTUM_SCRAPPER: {
        type: 'QUANTUM_SCRAPPER',
        name: 'Quantum Scrapper',
        serial: 'SCRP-Q',
        desc: 'Grants a 25% chance to refund double Dust on recycle. Limit 50 recycles.',
        cost: 50,
        duration: 0
    },
    MATRIX_OVERDRIVE: {
        type: 'MATRIX_OVERDRIVE',
        name: 'Matrix Overdrive',
        serial: 'MATR-X',
        desc: 'Increases effectiveness of all slotted Meteorite perks by 15%. Duration 300s.',
        cost: 50,
        duration: 300
    },
    TEMPORAL_GUARD: {
        type: 'TEMPORAL_GUARD',
        name: 'Temporal Guard',
        serial: 'GUAR-D',
        desc: 'Block lethal hit, teleport to random safe location (min 2500u offset) and grant 1.5s immunity. Duration 300s.',
        cost: 100,
        duration: 300
    },
    DIMENSIONAL_GATE: {
        type: 'DIMENSIONAL_GATE',
        name: 'Dimensional Gate',
        serial: 'GATE-KEY',
        desc: 'Unlocks Neural Portals, allowing travel to other sectors.',
        cost: 0,
        duration: -1
    },
    SECTOR_UPGRADE_ECO: {
        type: 'SECTOR_UPGRADE_ECO',
        name: 'Sector Override: ECO',
        serial: 'ECO-OVR',
        desc: 'Unlocks Economic Sector Protocol: +30% EXP and Soul Harvest. Permanent.',
        cost: 200,
        duration: -1
    },
    SECTOR_UPGRADE_COM: {
        type: 'SECTOR_UPGRADE_COM',
        name: 'Sector Override: COM',
        serial: 'COM-OVR',
        desc: 'Unlocks Combat Sector Protocol: +30% Offensive Output (DMG & Attack Speed). Permanent.',
        cost: 200,
        duration: -1
    },
    SECTOR_UPGRADE_DEF: {
        type: 'SECTOR_UPGRADE_DEF',
        name: 'Sector Override: DEF',
        serial: 'DEF-OVR',
        desc: 'Unlocks Defense Sector Protocol: +30% Vitality Metrics (Max HP & Regen). Permanent.',
        cost: 200,
        duration: -1
    }
};

export function createBlueprint(type: BlueprintType): Blueprint {
    const data = BLUEPRINT_DATA[type];
    return {
        id: Math.random(),
        ...data,
        isBlueprint: true,
        researched: false,
        status: 'locked',
        discoveredIn: 'BLUEPRINT ARCHIVE'
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
        rarity: 'divine',
        quality: 'New',
        visualIndex: 8,
        magnetized: false,
        isBlueprint: true,
        blueprintType: type,
        name: data.name,
        researched: false,
        status: 'locked',
        spawnedAt: state.gameTime,
        discoveredIn: 'BLUEPRINT ARCHIVE',
        perks: [],
        stats: {}
    };
    state.meteorites.push(blueprintItem);
    playSfx('rare-spawn');
}

export function trySpawnBlueprint(state: GameState, x: number, y: number) {

    if (state.gameTime < 600) return;


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
    if (!item || !item.isBlueprint || item.status !== 'locked') return false;


    const blueprint: any = (item as any).blueprintType ? createBlueprint((item as any).blueprintType) : item;

    blueprint.researched = false;
    blueprint.status = 'researching';

    const randomDuration = 30 + Math.random() * 30;
    blueprint.researchDuration = randomDuration;
    blueprint.researchFinishTime = state.gameTime + randomDuration;


    if (inventoryIndex >= 9) {
        const safeSlotIdx = state.inventory.findIndex((s, idx) => s === null && idx < 9);
        if (safeSlotIdx !== -1) {
            state.inventory[safeSlotIdx] = blueprint;
            state.inventory[inventoryIndex] = null;
        } else {

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
    if (!item || !item.isBlueprint) return false;
    const blueprint = item as unknown as Blueprint;

    if (state.player.dust < blueprint.cost) return false;

    if (blueprint.type !== 'QUANTUM_SCRAPPER' && isBuffActive(state, blueprint.type)) {
        return false;
    }
    if (blueprint.type === 'DIMENSIONAL_GATE' && state.portalsUnlocked) {
        return false;
    }

    state.player.dust -= blueprint.cost;

    if (blueprint.type === 'QUANTUM_SCRAPPER') {
        state.activeBlueprintCharges[blueprint.type] = (state.activeBlueprintCharges[blueprint.type] || 0) + 50;
        state.inventory[inventoryIndex] = null;
        playSfx('rare-spawn');
        return true;
    }

    if (blueprint.type === 'DIMENSIONAL_GATE') {
        state.portalsUnlocked = true;
        state.inventory[inventoryIndex] = null;
        playSfx('rare-spawn');
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_ECO') {
        state.arenaLevels[0] = (state.arenaLevels[0] || 0) + 1;
        state.inventory[inventoryIndex] = null;
        playSfx('rare-spawn');
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_COM') {
        state.arenaLevels[1] = (state.arenaLevels[1] || 0) + 1;
        state.inventory[inventoryIndex] = null;
        playSfx('rare-spawn');
        return true;
    }
    if (blueprint.type === 'SECTOR_UPGRADE_DEF') {
        state.arenaLevels[2] = (state.arenaLevels[2] || 0) + 1;
        state.inventory[inventoryIndex] = null;
        playSfx('rare-spawn');
        return true;
    }

    const endTime = Math.ceil(state.gameTime) + (blueprint.duration || 0);
    state.activeBlueprintBuffs[blueprint.type] = endTime;

    if (blueprint.type === 'TEMPORAL_GUARD') {
        state.player.temporalGuardActive = true;
    }

    state.inventory[inventoryIndex] = null;
    playSfx('rare-spawn');
    return true;
}

export function isBuffActive(state: GameState, type: BlueprintType): boolean {

    const endTime = state.activeBlueprintBuffs[type];
    if (endTime && state.gameTime < endTime) return true;


    const charges = state.activeBlueprintCharges[type];
    if (charges !== undefined && charges > 0) return true;

    return false;
}


export function updateBlueprints(state: GameState, step: number) {
    const time = state.gameTime;

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

    for (const type in state.activeBlueprintCharges) {
        const t = type as BlueprintType;
        if (state.activeBlueprintCharges[t]! <= 0) {
            delete state.activeBlueprintCharges[t];
        }
    }
}

export function scrapBlueprint(state: GameState, inventoryIndex: number) {
    const item = state.inventory[inventoryIndex];
    if (item && item.isBlueprint) {
        state.player.dust += 25;
        state.inventory[inventoryIndex] = null;
        spawnFloatingNumber(state, state.player.x, state.player.y, "+25", '#60a5fa', true);
        playSfx('recycle');
    }
}
