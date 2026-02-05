import type { GameState, Meteorite, MeteoriteRarity } from './types';
import { playSfx } from './AudioLogic';
import { calculateLegendaryBonus } from './LegendaryLogic';


const MAGNET_RANGE = 200;
const PICKUP_RANGE = 20;



interface PerkDef {
    id: string;
    description: string;
    min: number;
    max: number;
}

const PERK_POOLS: Record<number, PerkDef[]> = {
    1: [
        { id: 'base_efficiency', description: 'Base Efficiency Boost', min: 2, max: 5 }
    ],
    2: [
        { id: 'neighbor_any_all', description: 'Efficiency per neighboring meteorite (Any)', min: 3, max: 6 }
    ],
    3: [
        { id: 'neighbor_any_eco', description: 'Efficiency per neighboring meteorite from ECO arena', min: 3, max: 6 },
        { id: 'neighbor_any_com', description: 'Efficiency per neighboring meteorite from COM arena', min: 3, max: 6 },
        { id: 'neighbor_any_def', description: 'Efficiency per neighboring meteorite from DEF arena', min: 3, max: 6 }
    ],
    4: [
        { id: 'neighbor_new_eco', description: 'Efficiency per neighboring PRISTINE meteorite from ECO arena', min: 4, max: 10 },
        { id: 'neighbor_dam_eco', description: 'Efficiency per neighboring DAMAGED meteorite from ECO arena', min: 4, max: 10 },
        { id: 'neighbor_bro_eco', description: 'Efficiency per neighboring BROKEN meteorite from ECO arena', min: 4, max: 10 },
        { id: 'neighbor_new_com', description: 'Efficiency per neighboring PRISTINE meteorite from COM arena', min: 4, max: 10 },
        { id: 'neighbor_dam_com', description: 'Efficiency per neighboring DAMAGED meteorite from COM arena', min: 4, max: 10 },
        { id: 'neighbor_bro_com', description: 'Efficiency per neighboring BROKEN meteorite from COM arena', min: 4, max: 10 },
        { id: 'neighbor_new_def', description: 'Efficiency per neighboring PRISTINE meteorite from DEF arena', min: 4, max: 10 },
        { id: 'neighbor_dam_def', description: 'Efficiency per neighboring DAMAGED meteorite from DEF arena', min: 4, max: 10 },
        { id: 'neighbor_bro_def', description: 'Efficiency per neighboring BROKEN meteorite from DEF arena', min: 4, max: 10 }
    ],
    5: [
        { id: 'neighbor_leg_any', description: 'Efficiency per (Any) neighboring Legendary Hex', min: 6, max: 15 }
    ],
    6: [
        { id: 'neighbor_leg_eco', description: 'Efficiency per neighboring ECO Legendary Hex', min: 8, max: 20 },
        { id: 'neighbor_leg_com', description: 'Efficiency per neighboring COM Legendary Hex', min: 8, max: 20 },
        { id: 'neighbor_leg_def', description: 'Efficiency per neighboring DEF Legendary Hex', min: 8, max: 20 }
    ],
    7: [
        { id: 'pair_eco_eco', description: 'Efficiency per connecting ECO-ECO Legendary Hex pair', min: 10, max: 25 },
        { id: 'pair_eco_com', description: 'Efficiency per connecting ECO-COM Legendary Hex pair', min: 10, max: 25 },
        { id: 'pair_eco_def', description: 'Efficiency per connecting ECO-DEF Legendary Hex pair', min: 10, max: 25 },
        { id: 'pair_com_com', description: 'Efficiency per connecting COM-COM Legendary Hex pair', min: 10, max: 25 },
        { id: 'pair_com_def', description: 'Efficiency per connecting COM-DEF Legendary Hex pair', min: 10, max: 25 },
        { id: 'pair_def_def', description: 'Efficiency per connecting DEF-DEF Legendary Hex pair', min: 10, max: 25 }
    ],
    8: [
        { id: 'pair_eco_eco_lvl', description: 'Efficiency per connecting ECO-ECO Legendary Hex pair of same level', min: 12, max: 30 },
        { id: 'pair_eco_com_lvl', description: 'Efficiency per connecting ECO-COM Legendary Hex pair of same level', min: 12, max: 30 },
        { id: 'pair_eco_def_lvl', description: 'Efficiency per connecting ECO-DEF Legendary Hex pair of same level', min: 12, max: 30 },
        { id: 'pair_com_com_lvl', description: 'Efficiency per connecting COM-COM Legendary Hex pair of same level', min: 12, max: 30 },
        { id: 'pair_com_def_lvl', description: 'Efficiency per connecting COM-DEF Legendary Hex pair of same level', min: 12, max: 30 },
        { id: 'pair_def_def_lvl', description: 'Efficiency per connecting DEF-DEF Legendary Hex pair of same level', min: 12, max: 30 }
    ],
    9: [
        { id: 'matrix_same_type_rarity', description: 'Efficiency per neighb. meteorite w/ same Type, Rarity & Arena', min: 5, max: 20 }
    ]
};

import { SECTOR_NAMES } from './MapLogic';

// Time-based Rarity Weights (Percentages)
// [MinTime, MaxTime, [Lvl1, Lvl2, ..., Lvl9]]
// Time in Minutes
const DROP_TABLE: { min: number, max: number, weights: number[] }[] = [
    { min: 0, max: 5, weights: [1.33, 0.83, 0.33, 0, 0, 0, 0, 0, 0] },
    { min: 5, max: 10, weights: [1.08, 0.74, 0.41, 0.17, 0, 0, 0, 0, 0] },
    { min: 10, max: 15, weights: [0.82, 0.66, 0.49, 0.25, 0.08, 0, 0, 0, 0] },
    { min: 15, max: 20, weights: [0.57, 0.57, 0.49, 0.33, 0.16, 0.08, 0, 0, 0] },
    { min: 20, max: 25, weights: [0.32, 0.48, 0.48, 0.40, 0.24, 0.09, 0.09, 0, 0] },
    { min: 25, max: 30, weights: [0, 0.40, 0.48, 0.48, 0.32, 0.16, 0.12, 0.04, 0] },
    { min: 30, max: 35, weights: [0, 0, 0.40, 0.47, 0.40, 0.24, 0.20, 0.12, 0.08] },
    { min: 35, max: 40, weights: [0, 0, 0, 0.38, 0.38, 0.31, 0.27, 0.19, 0.12] },
    { min: 40, max: 45, weights: [0, 0, 0, 0, 0.39, 0.35, 0.35, 0.35, 0.27] },
    { min: 45, max: 50, weights: [0, 0, 0, 0, 0.30, 0.34, 0.38, 0.34, 0.23] },
    { min: 50, max: 55, weights: [0, 0, 0, 0, 0, 0.30, 0.37, 0.41, 0.41] },
    { min: 55, max: 60, weights: [0, 0, 0, 0, 0, 0.22, 0.32, 0.40, 0.36] },
    { min: 60, max: 9999, weights: [0, 0, 0, 0, 0, 0, 0.27, 0.40, 0.33] }
];

const RARITY_LIST: MeteoriteRarity[] = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'void', 'eternal', 'divine', 'singularity'];

function getRandomRarity(state: GameState): MeteoriteRarity {
    const minutes = state.gameTime / 60;
    const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];

    // Calculate total weight for normalization
    const totalWeight = entry.weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    let baseIndex = 0;
    for (let i = 0; i < entry.weights.length; i++) {
        if (random < entry.weights[i]) {
            baseIndex = i;
            break;
        }
        random -= entry.weights[i];
    }

    // Apply Legendary Rarity Boost
    // 100% boost = +1 tier upgrade
    const boostRaw = calculateLegendaryBonus(state, 'rarity_boost_per_kill');
    const fullTiers = Math.floor(boostRaw);
    const fraction = boostRaw - fullTiers;

    let finalIndex = baseIndex + fullTiers;
    if (Math.random() < fraction) finalIndex += 1;

    // Cap at Singularity (index 8)
    finalIndex = Math.min(8, finalIndex);

    return RARITY_LIST[finalIndex];
}

export function createMeteorite(state: GameState, rarity: MeteoriteRarity, x: number = 0, y: number = 0): Meteorite {
    const stats: Meteorite['stats'] = {};

    const qualities: import('./types').MeteoriteQuality[] = ['Broken', 'Damaged', 'New'];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];

    // Mapping: Scrap=1 ... Singularity=9
    const rarityMap: Record<MeteoriteRarity, number> = {
        scrap: 1,
        anomalous: 2,
        quantum: 3,
        astral: 4,
        radiant: 5,
        void: 6,
        eternal: 7,
        divine: 8,
        singularity: 9
    };
    const rarityLevel = rarityMap[rarity];
    const visualIndex = rarityLevel;

    // Quality adjustment: New +2, Damaged +0, Broken -2
    const qualityAdj = quality === 'New' ? 2 : (quality === 'Broken' ? -2 : 0);

    const perks: Meteorite['perks'] = [];

    // Logic: Cumulative Perks.
    // Level X meteorite gets one random perk from EACH level pool from 1 to X.
    for (let lvl = 1; lvl <= rarityLevel; lvl++) {
        const pool = PERK_POOLS[lvl];
        if (pool) {
            const def = pool[Math.floor(Math.random() * pool.length)];

            // Quality Mod: Broken -2%, New +2%, Damaged 0%
            // Apply straight to the range boundaries
            const min = Math.max(0, def.min + qualityAdj); // Ensure min doesn't go below 0 (though -2 on 2 is 0)
            const max = def.max + qualityAdj;

            const value = min + Math.floor(Math.random() * (max - min + 1));

            perks.push({
                id: def.id,
                description: def.description,
                value,
                range: { min, max }
            });
        }
    }

    return {
        id: Math.random(),
        x,
        y,
        rarity,
        quality,
        visualIndex,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        magnetized: false,
        discoveredIn: SECTOR_NAMES[state.currentArena] || "UNKNOWN SECTOR",
        perks,
        spawnedAt: state.gameTime,
        stats
    };
}

export function trySpawnMeteorite(state: GameState, x: number, y: number) {
    const minutes = state.gameTime / 60;
    const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];

    // Base chance is the sum of the weights (e.g. 1.6 + 1.0 + 0.4 = 3.0 -> 3%)
    let chance = entry.weights.reduce((a, b) => a + b, 0) / 100;

    if (state.currentArena === 0) chance *= 1.15; // +15% Drop Chance in Economic Hex

    // Add Legendary Bonus
    chance += calculateLegendaryBonus(state, 'met_drop_per_kill');

    if (Math.random() > chance) return;

    const rarity = getRandomRarity(state);
    const dropX = x + (Math.random() - 0.5) * 20;
    const dropY = y + (Math.random() - 0.5) * 20;

    const meteorite = createMeteorite(state, rarity, dropX, dropY);
    state.meteorites.push(meteorite);
}

export function updateLoot(state: GameState) {
    const { meteorites, player, inventory } = state;

    for (let i = meteorites.length - 1; i >= 0; i--) {
        const item = meteorites[i];

        // 2-Minute Despawn Timer
        if (state.gameTime - item.spawnedAt > 120) {
            meteorites.splice(i, 1);
            continue;
        }

        // Friction / Deceleration for initial bounce
        item.x += item.vx;
        item.y += item.vy;
        item.vx *= 0.95;
        item.vy *= 0.95;

        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const dist = Math.hypot(dx, dy);

        // Magnet Logic
        const hasSPACE = inventory.findIndex(slot => slot === null) !== -1;

        if (dist < MAGNET_RANGE && hasSPACE) {
            item.magnetized = true;
        } else if (!hasSPACE) {
            item.magnetized = false;
        }

        if (item.magnetized) {
            // Accelerate towards player
            const speed = 12; // Fast magnetic pull
            const angle = Math.atan2(dy, dx);
            item.x += Math.cos(angle) * speed;
            item.y += Math.sin(angle) * speed;

            // Pickup Logic
            if (dist < PICKUP_RANGE) {
                // Try to add to inventory
                const emptySlotIndex = inventory.findIndex(slot => slot === null);

                if (emptySlotIndex !== -1) {
                    // Add to inventory
                    item.isNew = true;
                    inventory[emptySlotIndex] = item;
                    state.meteoritesPickedUp++;
                    playSfx('shoot'); // Pickup sound
                    meteorites.splice(i, 1);
                }
            }
        }
    }
}
