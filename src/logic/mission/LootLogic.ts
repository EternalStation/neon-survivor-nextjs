import type { GameState, Meteorite, MeteoriteRarity } from '../core/types';
import { playSfx } from '../audio/AudioLogic';
import { calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';


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
        { id: 'base_efficiency', description: '3-5%effieciency%', min: 3, max: 5 }
    ],
    2: [
        { id: 'neighbor_any_all', description: '3-6% effieciency% per neigboring (any type) meteorite collected in (any type) arena', min: 3, max: 6 }
    ],
    3: [
        { id: 'neighbor_any_eco', description: '3-6% effieciency% per neigboring (any type) meteorite collected in (Eco) arena', min: 3, max: 6 },
        { id: 'neighbor_any_com', description: '3-6% effieciency% per neigboring (any type) meteorite collected in (Com) arena', min: 3, max: 6 },
        { id: 'neighbor_any_def', description: '3-6% effieciency% per neigboring (any type) meteorite collected in (Def) arena', min: 3, max: 6 }
    ],
    4: [
        { id: 'neighbor_new_eco', description: '4-10% effieciency% per neigboring (New) meteorite collected in (Eco) arena', min: 4, max: 10 },
        { id: 'neighbor_dam_eco', description: '4-10% effieciency% per neigboring (Damaged) meteorite collected in (Eco) arena', min: 4, max: 10 },
        { id: 'neighbor_bro_eco', description: '4-10% effieciency% per neigboring (Broken) meteorite collected in (Eco) arena', min: 4, max: 10 },
        { id: 'neighbor_new_com', description: '4-10% effieciency% per neigboring (New) meteorite collected in (Com) arena', min: 4, max: 10 },
        { id: 'neighbor_dam_com', description: '4-10% effieciency% per neigboring (Damaged) meteorite collected in (Com) arena', min: 4, max: 10 },
        { id: 'neighbor_bro_com', description: '4-10% effieciency% per neigboring (Broken) meteorite collected in (Com) arena', min: 4, max: 10 },
        { id: 'neighbor_new_def', description: '4-10% effieciency% per neigboring (New) meteorite collected in (Def) arena', min: 4, max: 10 },
        { id: 'neighbor_dam_def', description: '4-10% effieciency% per neigboring (Damaged) meteorite collected in (Def) arena', min: 4, max: 10 },
        { id: 'neighbor_bro_def', description: '4-10% effieciency% per neigboring (Broken) meteorite collected in (Def) arena', min: 4, max: 10 },
        { id: 'neighbor_cor_eco', description: '4-10% effieciency% per neigboring (Corrupted) meteorite collected in (Eco) arena', min: 4, max: 10 },
        { id: 'neighbor_cor_com', description: '4-10% effieciency% per neigboring (Corrupted) meteorite collected in (Com) arena', min: 4, max: 10 },
        { id: 'neighbor_cor_def', description: '4-10% effieciency% per neigboring (Corrupted) meteorite collected in (Def) arena', min: 4, max: 10 }
    ],
    5: [
        { id: 'neighbor_leg_any', description: '6-15% effieciency% per neigboring (any type) Legendary Upgrade', min: 6, max: 15 }
    ],
    6: [
        { id: 'neighbor_leg_eco', description: '8-20% effieciency% per neigboring (Eco) Legendary Upgrade', min: 8, max: 20 },
        { id: 'neighbor_leg_com', description: '8-20% effieciency% per neigboring (Com) Legendary Upgrade', min: 8, max: 20 },
        { id: 'neighbor_leg_def', description: '8-20% effieciency% per neigboring (Def) Legendary Upgrade', min: 8, max: 20 }
    ],
    7: [
        { id: 'pair_eco_eco', description: '10-25% effieciency% per connecting (Eco) and (Eco) Legendary Upgrades', min: 10, max: 25 },
        { id: 'pair_eco_com', description: '10-25% effieciency% per connecting (Eco) and (Com) Legendary Upgrades', min: 10, max: 25 },
        { id: 'pair_eco_def', description: '10-25% effieciency% per connecting (Eco) and (Def) Legendary Upgrades', min: 10, max: 25 },
        { id: 'pair_com_com', description: '10-25% effieciency% per connecting (Com) and (Com) Legendary Upgrades', min: 10, max: 25 },
        { id: 'pair_com_def', description: '10-25% effieciency% per connecting (Com) and (Def) Legendary Upgrades', min: 10, max: 25 },
        { id: 'pair_def_def', description: '10-25% effieciency% per connecting (Def) and (Def) Legendary Upgrades', min: 10, max: 25 }
    ],
    8: [
        { id: 'pair_eco_eco_lvl', description: '12-30% effieciency% per connecting (Eco) and (Eco) Legendary Upgrades of same level', min: 12, max: 30 },
        { id: 'pair_eco_com_lvl', description: '12-30% effieciency% per connecting (Eco) and (Com) Legendary Upgrades of same level', min: 12, max: 30 },
        { id: 'pair_eco_def_lvl', description: '12-30% effieciency% per connecting (Eco) and (Def) Legendary Upgrades of same level', min: 12, max: 30 },
        { id: 'pair_com_com_lvl', description: '12-30% effieciency% per connecting (Com) and (Com) Legendary Upgrades of same level', min: 12, max: 30 },
        { id: 'pair_com_def_lvl', description: '12-30% effieciency% per connecting (Com) and (Def) Legendary Upgrades of same level', min: 12, max: 30 },
        { id: 'pair_def_def_lvl', description: '12-30% effieciency% per connecting (Def) and (Def) Legendary Upgrades of same level', min: 12, max: 30 }
    ],
    9: [
        { id: 'matrix_same_type_rarity', description: '5-20% efficiency per each methoirite of same type and same rarity an found in that is placed in a matrix', min: 5, max: 20 }
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
    let quality: import('../core/types').MeteoriteQuality = 'Broken';
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

    chance *= state.xpSoulBuffMult;

    // Add Legendary Bonus
    chance += calculateLegendaryBonus(state, 'met_drop_per_kill');

    // Blueprint: Meteor Shower (+50% DROP RATE) - Boosted by Surge
    if (isBuffActive(state, 'METEOR_SHOWER')) {
        const surge = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
        chance *= (1 + (0.5 * surge));
    }

    // DELAY MECHANIC: No meteorites until 1 minute (60s)
    if (minutes < 1.0) return;

    let forceSpawn = false;

    // First Meteorite: Forcefully spawn at 1 minute mark (or first kill after)
    if (!state.firstMeteoriteSpawned) {
        state.firstMeteoriteSpawned = true;
        forceSpawn = true;
    } else {
        // Subsequent Meteorites: Only start spawning normally after 1:30 (90s)
        if (minutes < 1.5) return;
    }

    if (!forceSpawn && Math.random() > chance) return;

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

        // Check all players for magnetism
        const players = state.players ? Object.values(state.players) : [state.player];
        let nearestPlayerWithSpace: any = null;
        let minPlayerDist = Infinity;

        players.forEach(p => {
            const hasSPACE = p.inventory.slice(10).some(slot => slot === null);
            if (hasSPACE) {
                const d = Math.hypot(p.x - item.x, p.y - item.y);
                if (d < minPlayerDist) {
                    minPlayerDist = d;
                    nearestPlayerWithSpace = p;
                }
            }
        });

        // Magnet Logic
        if (nearestPlayerWithSpace && minPlayerDist < MAGNET_RANGE) {
            item.magnetized = true;
            item.targetPlayer = nearestPlayerWithSpace; // Store target for pull logic
        } else {
            // If no space, or out of range, drop magnet
            item.magnetized = false;
            item.targetPlayer = null;
        }

        if (item.magnetized && item.targetPlayer) {
            const target = item.targetPlayer;
            const dx = target.x - item.x;
            const dy = target.y - item.y;
            const dist = Math.hypot(dx, dy);

            // Accelerate towards player
            const speed = 12; // Fast magnetic pull
            const angle = Math.atan2(dy, dx);
            item.x += Math.cos(angle) * speed;
            item.y += Math.sin(angle) * speed;

            // Pickup Logic
            if (dist < PICKUP_RANGE) {
                // Try to add to inventory
                const inventory = target.inventory;
                let emptySlotIndex = -1;
                for (let j = 10; j < inventory.length; j++) {
                    if (inventory[j] === null) {
                        emptySlotIndex = j;
                        break;
                    }
                }

                if (emptySlotIndex !== -1) {
                    // Add to inventory
                    item.isNew = true;
                    inventory[emptySlotIndex] = item;
                    state.meteoritesPickedUp++; // This is global for now, which is fine
                    playSfx('shoot'); // Pickup sound
                    meteorites.splice(i, 1);
                }
            }
        }
    }
}
