import type { GameState, Meteorite, MeteoriteRarity } from './types';
import { playSfx } from './AudioLogic';
import { calculateLegendaryBonus } from './LegendaryLogic';
import { isBuffActive } from './BlueprintLogic';


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
        { id: 'base_efficiency', description: 'Base Efficiency Boost', min: 3, max: 5 }
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
        { id: 'neighbor_bro_def', description: 'Efficiency per neighboring BROKEN meteorite from DEF arena', min: 4, max: 10 },
        { id: 'neighbor_cor_eco', description: 'Efficiency per neighboring CORRUPTED meteorite from ECO arena', min: 6, max: 12 },
        { id: 'neighbor_cor_com', description: 'Efficiency per neighboring CORRUPTED meteorite from COM arena', min: 6, max: 12 },
        { id: 'neighbor_cor_def', description: 'Efficiency per neighboring CORRUPTED meteorite from DEF arena', min: 6, max: 12 }
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
export const DROP_TABLE: { min: number, max: number, weights: number[] }[] = [
    { min: 0, max: 5, weights: [5.3, 3.4, 1.3, 0, 0, 0, 0, 0, 0] },
    { min: 5, max: 10, weights: [4.5, 3.1, 1.7, 0.7, 0, 0, 0, 0, 0] },
    { min: 10, max: 15, weights: [3.5, 2.9, 2.1, 1.1, 0.4, 0, 0, 0, 0] },
    { min: 15, max: 20, weights: [2.6, 2.6, 2.2, 1.5, 0.7, 0.4, 0, 0, 0] },
    { min: 20, max: 25, weights: [1.5, 2.3, 2.3, 1.9, 1.1, 0.5, 0.4, 0, 0] },
    { min: 25, max: 30, weights: [0, 2.0, 2.4, 2.4, 1.6, 0.8, 0.6, 0.2, 0] },
    { min: 30, max: 35, weights: [0, 0, 2.1, 2.5, 2.1, 1.3, 1.0, 0.6, 0.4] },
    { min: 35, max: 40, weights: [0, 0, 0, 2.3, 2.3, 1.9, 1.6, 1.2, 0.7] },
    { min: 40, max: 45, weights: [0, 0, 0, 0, 2.3, 2.0, 2.0, 2.0, 1.7] },
    { min: 45, max: 50, weights: [0, 0, 0, 0, 1.9, 2.1, 2.4, 2.1, 1.5] },
    { min: 50, max: 55, weights: [0, 0, 0, 0, 0, 2.0, 2.5, 2.75, 2.75] },
    { min: 55, max: 60, weights: [0, 0, 0, 0, 0, 1.7, 2.5, 3.1, 2.7] },
    { min: 60, max: 9999, weights: [0, 0, 0, 0, 0, 0, 2.7, 4.0, 3.3] }
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

    const rand = Math.random();
    let quality: import('./types').MeteoriteQuality = 'Broken';
    if (rand < 0.03) {
        quality = 'Corrupted';
    } else if (rand < 0.15) {
        quality = 'New';
    } else if (rand < 0.50) {
        quality = 'Damaged';
    } else {
        quality = 'Broken';
    }

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
    // HARM-V Blueprint: +2 shift to all perks
    const blueprintActive = isBuffActive(state, 'PERK_RESONANCE');
    const qualityAdj = (quality === 'Corrupted' ? 6 : (quality === 'New' ? 3 : (quality === 'Broken' ? -3 : 0))) + (blueprintActive ? 2 : 0);

    const perks: Meteorite['perks'] = [];

    // Logic: Cumulative Perks.
    // Level X meteorite gets one random perk from EACH level pool from 1 to X.
    for (let lvl = 1; lvl <= rarityLevel; lvl++) {
        const pool = PERK_POOLS[lvl];
        if (pool) {
            const def = pool[Math.floor(Math.random() * pool.length)];

            // Quality Mod: applies straight to the range boundaries
            const min = Math.max(0, def.min + qualityAdj);
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

    const item: Meteorite = {
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
        stats,
        blueprintBoosted: blueprintActive
    };

    return item;
}

export function trySpawnMeteorite(state: GameState, x: number, y: number) {
    const minutes = state.gameTime / 60;
    const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];

    // Base chance is the sum of the weights (e.g. 1.6 + 1.0 + 0.4 = 3.0 -> 3%)
    let chance = (entry.weights.reduce((a, b) => a + b, 0) / 100) * 0.7; // User Request: Lower from 10% to 7%

    const surge = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
    if (state.currentArena === 0) chance *= (1 + (0.15 * surge)); // +15% (or +30%) Drop Chance in Economic Hex

    // Add Legendary Bonus
    chance += calculateLegendaryBonus(state, 'met_drop_per_kill');

    // Blueprint: Meteor Shower (+50% DROP RATE) - Boosted by Surge
    if (isBuffActive(state, 'METEOR_SHOWER')) {
        const surge = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
        chance *= (1 + (0.5 * surge));
    }

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
                // User Request: Skip Row 1 (Safe Slots: 0-9) and Row 2 (Removed: 10-19)
                // Items go directly into Row 3 (Index 20+)
                let emptySlotIndex = -1;
                for (let j = 20; j < inventory.length; j++) {
                    if (inventory[j] === null) {
                        emptySlotIndex = j;
                        break;
                    }
                }

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
