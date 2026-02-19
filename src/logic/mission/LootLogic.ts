import type { GameState, Meteorite, MeteoriteRarity } from '../core/types';
import { playSfx } from '../audio/AudioLogic';
import { calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';


const MAGNET_RANGE = 200;
const PICKUP_RANGE = 20;



interface PerkDef {
    id: string;
    description: string;
    ranges: {
        Broken: { min: number, max: number },
        Damaged: { min: number, max: number },
        New: { min: number, max: number }
    }
}

export const PERK_POOLS: Record<number, PerkDef[]> = {
    1: [
        // LVL1: Sector + Connected Leg
        { id: 'lvl1_eco_eco', description: 'Located in Sector-01 & connected to Economic Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_eco_com', description: 'Located in Sector-01 & connected to Combat Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_eco_def', description: 'Located in Sector-01 & connected to Defence Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_eco', description: 'Located in Sector-02 & connected to Economic Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_com', description: 'Located in Sector-02 & connected to Combat Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_def', description: 'Located in Sector-02 & connected to Defence Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_eco', description: 'Located in Sector-03 & connected to Economic Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_com', description: 'Located in Sector-03 & connected to Combat Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_def', description: 'Located in Sector-03 & connected to Defence Legendary Upgrades', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
    ],
    2: [
        // LVL2: Sector + Neighbors Quality
        { id: 'lvl2_eco_bro', description: 'Located in Sector-01 and neighboring a Broken Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_eco_dam', description: 'Located in Sector-01 and neighboring a Damaged Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_eco_new', description: 'Located in Sector-01 and neighboring a New Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_com_bro', description: 'Located in Sector-02 and neighboring a Broken Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_com_dam', description: 'Located in Sector-02 and neighboring a Damaged Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_com_new', description: 'Located in Sector-02 and neighboring a New Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_def_bro', description: 'Located in Sector-03 and neighboring a Broken Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_def_dam', description: 'Located in Sector-03 and neighboring a Damaged Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
        { id: 'lvl2_def_new', description: 'Located in Sector-03 and neighboring a New Meteorite', ranges: { Broken: { min: 2, max: 5 }, Damaged: { min: 5, max: 8 }, New: { min: 8, max: 12 } } },
    ],
    3: [
        // LVL3: Neighbor Quality from Arena
        { id: 'lvl3_eco_bro', description: 'Neighboring a Broken Meteorite found in Economic Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_eco_dam', description: 'Neighboring a Damaged Meteorite found in Economic Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_eco_new', description: 'Neighboring a New Meteorite found in Economic Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_com_bro', description: 'Neighboring a Broken Meteorite found in Combat Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_com_dam', description: 'Neighboring a Damaged Meteorite found in Combat Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_com_new', description: 'Neighboring a New Meteorite found in Combat Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_def_bro', description: 'Neighboring a Broken Meteorite found in Defence Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_def_dam', description: 'Neighboring a Damaged Meteorite found in Defence Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
        { id: 'lvl3_def_new', description: 'Neighboring a New Meteorite found in Defence Arena', ranges: { Broken: { min: 4, max: 8 }, Damaged: { min: 7, max: 11 }, New: { min: 10, max: 15 } } },
    ],
    4: [
        // LVL4: Secondary Neighbor Quality from Arena
        { id: 'lvl4_eco_bro', description: 'Secondary neighboring a Broken Meteorite found in Economic Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_eco_dam', description: 'Secondary neighboring a Damaged Meteorite found in Economic Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_eco_new', description: 'Secondary neighboring a New Meteorite found in Economic Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_com_bro', description: 'Secondary neighboring a Broken Meteorite found in Combat Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_com_dam', description: 'Secondary neighboring a Damaged Meteorite found in Combat Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_com_new', description: 'Secondary neighboring a New Meteorite found in Combat Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_def_bro', description: 'Secondary neighboring a Broken Meteorite found in Defence Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_def_dam', description: 'Secondary neighboring a Damaged Meteorite found in Defence Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
        { id: 'lvl4_def_new', description: 'Secondary neighboring a New Meteorite found in Defence Arena', ranges: { Broken: { min: 7, max: 12 }, Damaged: { min: 10, max: 14 }, New: { min: 13, max: 19 } } },
    ],
    5: [
        // LVL5: Sector + Connecting Pairs
        { id: 'lvl5_eco_eco_eco', description: 'Located in Sector-01. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_eco_com', description: 'Located in Sector-01. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_eco_def', description: 'Located in Sector-01. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_com_com', description: 'Located in Sector-01. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_com_def', description: 'Located in Sector-01. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_def_def', description: 'Located in Sector-01. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_eco', description: 'Located in Sector-02. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_com', description: 'Located in Sector-02. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_def', description: 'Located in Sector-02. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_com_com', description: 'Located in Sector-02. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_com_def', description: 'Located in Sector-02. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_def_def', description: 'Located in Sector-02. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_eco', description: 'Located in Sector-03. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_com', description: 'Located in Sector-03. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_def', description: 'Located in Sector-03. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_com_com', description: 'Located in Sector-03. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_com_def', description: 'Located in Sector-03. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_def_def', description: 'Located in Sector-03. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
    ],
    6: [
        // LVL6: Neighbor Quality + Bridge
        { id: 'lvl6_bro_eco_eco', description: 'Neighboring a Broken Meteorite. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_eco_com', description: 'Neighboring a Broken Meteorite. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_eco_def', description: 'Neighboring a Broken Meteorite. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_com_com', description: 'Neighboring a Broken Meteorite. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_com_def', description: 'Neighboring a Broken Meteorite. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_def_def', description: 'Neighboring a Broken Meteorite. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_eco', description: 'Neighboring a Damaged Meteorite. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_com', description: 'Neighboring a Damaged Meteorite. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_def', description: 'Neighboring a Damaged Meteorite. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_com_com', description: 'Neighboring a Damaged Meteorite. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_com_def', description: 'Neighboring a Damaged Meteorite. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_def_def', description: 'Neighboring a Damaged Meteorite. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_eco', description: 'Neighboring a New Meteorite. Connects Economic & Economic Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_com', description: 'Neighboring a New Meteorite. Connects Economic & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_def', description: 'Neighboring a New Meteorite. Connects Economic & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_com_com', description: 'Neighboring a New Meteorite. Connects Combat & Combat Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_com_def', description: 'Neighboring a New Meteorite. Connects Combat & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_def_def', description: 'Neighboring a New Meteorite. Connects Defence & Defence Legendary Upgrades', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
    ]
};

import { SECTOR_NAMES } from './MapLogic';

// Time-based Rarity Weights (Percentages)
// [MinTime, MaxTime, [Lvl0, Lvl1, Lvl2, Lvl3, Lvl4, Lvl5]]
// Time in Minutes
export const DROP_TABLE: { min: number, max: number, weights: number[] }[] = [
    // Rarity Indices:
    // 0: Anomalous (Lvl 1)
    // 1: Radiant (Lvl 2)
    // 2: Abyss (Lvl 3)
    // 3: Eternal (Lvl 4)
    // 4: Divine (Lvl 5)
    // 5: Singularity (Lvl 6)

    // 0-5 min: 90% Anomalous, 10% Radiant, 1% Abyss
    { min: 0, max: 5, weights: [90, 10, 1, 0, 0, 0] },
    // 5-10 min: 70% Anomalous, 20% Radiant, 9% Abyss, 1% Eternal
    { min: 5, max: 10, weights: [70, 20, 9, 1, 0, 0] },
    // 10-15 min: 50% Anomalous, 30% Radiant, 15% Abyss, 5% Eternal, 1% Divine
    { min: 10, max: 15, weights: [50, 30, 15, 5, 1, 0] },
    // 15-20 min: 10% Anomalous, 30% Radiant, 40% Abyss, 14% Eternal, 5% Divine, 1% Singularity
    { min: 15, max: 20, weights: [10, 30, 40, 14, 5, 1] },
    // 20-25 min: 0% Anomalous, 0% Radiant, 20% Abyss, 40% Eternal, 30% Divine, 10% Singularity
    { min: 20, max: 25, weights: [0, 0, 20, 40, 30, 10] },
    // 25-30 min: 0% Anomalous, 0% Radiant, 0% Abyss, 0% Eternal, 60% Divine, 40% Singularity
    { min: 25, max: 30, weights: [0, 0, 0, 0, 60, 40] },
    // 30+ min: 20% Divine, 80% Singularity
    { min: 30, max: 9999, weights: [0, 0, 0, 0, 20, 80] }
];

const RARITY_LIST: MeteoriteRarity[] = ['anomalous', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];

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

    // Cap at Singularity (index 5)
    finalIndex = Math.min(5, finalIndex);

    return RARITY_LIST[finalIndex];
}

export function createMeteorite(state: GameState, rarity: MeteoriteRarity, x: number = 0, y: number = 0): Meteorite {
    const stats: Meteorite['stats'] = {};

    const rand = Math.random();
    let isCorrupted = false;
    let quality: import('../core/types').MeteoriteQuality = 'Broken';

    // Quality Weights: 15% New, 35% Damaged, 50% Broken (excluding Corruption)
    if (rand < 0.05) {
        // 5% Chance for Corrupted Status (Applied to any quality)
        isCorrupted = true;
        const qRand = Math.random();
        quality = qRand < 0.2 ? 'New' : (qRand < 0.5 ? 'Damaged' : 'Broken');
    } else {
        const qRand = Math.random();
        if (qRand < 0.15) quality = 'New';
        else if (qRand < 0.50) quality = 'Damaged';
        else quality = 'Broken';
    }

    const rarityMap: Record<MeteoriteRarity, number> = {
        anomalous: 0,
        radiant: 1,
        abyss: 2,
        eternal: 3,
        divine: 4,
        singularity: 5
    };
    const rarityLevel = rarityMap[rarity];
    const visualIndex = rarityLevel; // 0-based indexing (M0-M5 assets)

    // Blueprint: Perk Resonance (+2 shift to all perks)
    const blueprintActive = isBuffActive(state, 'PERK_RESONANCE');
    const blueprintAdj = blueprintActive ? 2 : 0;
    const corruptionAdj = isCorrupted ? 3 : 0;

    const perks: Meteorite['perks'] = [];

    // Cumulative Perks: Level X gets one perk from EACH level pool from 1 to X.
    const powerLevel = rarityLevel + 1;

    for (let lvl = 1; lvl <= powerLevel; lvl++) {
        const pool = PERK_POOLS[lvl];
        if (pool) {
            const def = pool[Math.floor(Math.random() * pool.length)];

            // Get range based on quality
            const baseRange = def.ranges[quality];
            const min = Math.max(0, baseRange.min + blueprintAdj + corruptionAdj);
            const max = baseRange.max + blueprintAdj + corruptionAdj;

            const value = min + Math.floor(Math.random() * (max - min + 1));

            perks.push({
                id: def.id,
                description: def.description,
                value,
                range: { min, max }
            });
        }
    }

    // Audio Request: First 4 rarities (1-4) have 9 free rolls, 5-6 have 18.
    const recalibrationCount = powerLevel <= 4 ? 9 : 18;

    const item: Meteorite = {
        id: Math.random(),
        x,
        y,
        rarity,
        quality,
        visualIndex,
        version: 1.0,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        magnetized: false,
        discoveredIn: SECTOR_NAMES[state.currentArena] || "UNKNOWN SECTOR",
        perks,
        spawnedAt: state.gameTime,
        stats,
        blueprintBoosted: blueprintActive,
        isCorrupted,
        recalibrationCount
    };

    return item;
}


export function trySpawnMeteorite(state: GameState, x: number, y: number) {
    const minutes = state.gameTime / 60;
    const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];

    // Base chance is the sum of the weights (e.g. 1.6 + 1.0 + 0.4 = 3.0 -> 3%)
    let chance = (entry.weights.reduce((a, b) => a + b, 0) / 100) * 0.05; // 5% Chance (Normalizing 100 weight sum to 0.05)

    // Multiplied by Sector Buff (Econ Sector) - specifically the meteorite rate version
    chance *= state.meteoriteRateBuffMult;

    // Add Legendary Bonus
    chance += calculateLegendaryBonus(state, 'met_drop_per_kill');

    // Blueprint: Meteor Shower (+50% DROP RATE) - Never boosted by Surge (Player Stat)
    if (isBuffActive(state, 'METEOR_SHOWER')) {
        chance *= 1.5;
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

export function spawnVoidFlux(state: GameState, x: number, y: number, amount: number) {
    const item: any = {
        id: Math.random(),
        x,
        y,
        type: 'void_flux',
        amount,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        magnetized: false,
        spawnedAt: state.gameTime,
        rarity: 'anomalous', // Default
        quality: 'New',
        perks: [],
        stats: {}
    };
    state.meteorites.push(item);
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

        // Check GLOBAL inventory (Module Storage) for space 
        // OR check if it's a currency (which doesn't need inventory slots)
        const isCurrency = item.type === 'void_flux' || item.type === 'dust_pile';
        const hasSPACE = isCurrency || inventory.slice(10).some(slot => slot === null);

        if (hasSPACE) {
            players.forEach(p => {
                const d = Math.hypot(p.x - item.x, p.y - item.y);
                if (d < minPlayerDist) {
                    minPlayerDist = d;
                    nearestPlayerWithSpace = p;
                }
            });
        }

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
                if (item.type === 'void_flux') {
                    state.player.isotopes += item.amount || 0;
                    spawnFloatingNumber(state, target.x, target.y - 20, `+${(item.amount || 0).toLocaleString()} FLUX`, '#a855f7', true);
                    playSfx('shoot');
                    meteorites.splice(i, 1);
                    continue;
                }

                // Try to add to GLOBAL inventory
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
