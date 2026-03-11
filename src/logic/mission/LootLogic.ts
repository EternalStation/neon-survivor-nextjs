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

        { id: 'lvl1_eco_eco', description: 'Located in Sector-01 & connects Eco ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_eco_com', description: 'Located in Sector-01 & connects Com ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_eco_def', description: 'Located in Sector-01 & connects Def ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_eco', description: 'Located in Sector-02 & connects Eco ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_com', description: 'Located in Sector-02 & connects Com ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_com_def', description: 'Located in Sector-02 & connects Def ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_eco', description: 'Located in Sector-03 & connects Eco ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_com', description: 'Located in Sector-03 & connects Com ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
        { id: 'lvl1_def_def', description: 'Located in Sector-03 & connects Def ⬢', ranges: { Broken: { min: 1, max: 3 }, Damaged: { min: 4, max: 6 }, New: { min: 7, max: 9 } } },
    ],
    2: [

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

        { id: 'lvl5_eco_eco_eco', description: 'Located in Sector-01. Connects Eco & Eco ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_eco_com', description: 'Located in Sector-01. Connects Eco & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_eco_def', description: 'Located in Sector-01. Connects Eco & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_com_com', description: 'Located in Sector-01. Connects Com & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_com_def', description: 'Located in Sector-01. Connects Com & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_eco_def_def', description: 'Located in Sector-01. Connects Def & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_eco', description: 'Located in Sector-02. Connects Eco & Eco ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_com', description: 'Located in Sector-02. Connects Eco & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_eco_def', description: 'Located in Sector-02. Connects Eco & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_com_com', description: 'Located in Sector-02. Connects Com & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_com_def', description: 'Located in Sector-02. Connects Com & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_com_def_def', description: 'Located in Sector-02. Connects Def & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_eco', description: 'Located in Sector-03. Connects Eco & Eco ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_com', description: 'Located in Sector-03. Connects Eco & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_eco_def', description: 'Located in Sector-03. Connects Eco & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_com_com', description: 'Located in Sector-03. Connects Com & Com ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_com_def', description: 'Located in Sector-03. Connects Com & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
        { id: 'lvl5_def_def_def', description: 'Located in Sector-03. Connects Def & Def ⬢', ranges: { Broken: { min: 11, max: 17 }, Damaged: { min: 14, max: 19 }, New: { min: 17, max: 24 } } },
    ],
    6: [

        { id: 'lvl6_bro_eco_eco', description: 'Neighboring a Broken meteorite. Connects Eco & Eco ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_eco_com', description: 'Neighboring a Broken meteorite. Connects Eco & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_eco_def', description: 'Neighboring a Broken meteorite. Connects Eco & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_com_com', description: 'Neighboring a Broken meteorite. Connects Com & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_com_def', description: 'Neighboring a Broken meteorite. Connects Com & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_bro_def_def', description: 'Neighboring a Broken meteorite. Connects Def & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_eco', description: 'Neighboring a Damaged meteorite. Connects Eco & Eco ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_com', description: 'Neighboring a Damaged meteorite. Connects Eco & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_eco_def', description: 'Neighboring a Damaged meteorite. Connects Eco & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_com_com', description: 'Neighboring a Damaged meteorite. Connects Com & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_com_def', description: 'Neighboring a Damaged meteorite. Connects Com & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_dam_def_def', description: 'Neighboring a Damaged meteorite. Connects Def & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_eco', description: 'Neighboring a New meteorite. Connects Eco & Eco ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_com', description: 'Neighboring a New meteorite. Connects Eco & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_eco_def', description: 'Neighboring a New meteorite. Connects Eco & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_com_com', description: 'Neighboring a New meteorite. Connects Com & Com ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_com_def', description: 'Neighboring a New meteorite. Connects Com & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
        { id: 'lvl6_new_def_def', description: 'Neighboring a New meteorite. Connects Def & Def ⬢', ranges: { Broken: { min: 16, max: 23 }, Damaged: { min: 19, max: 25 }, New: { min: 23, max: 30 } } },
    ]
};

import { SECTOR_NAMES } from './MapLogic';




export const DROP_TABLE: { min: number, max: number, weights: number[] }[] = [









    // 0-10 Minutes: [80, 15, 4.5, 0.5, 0, 0]
    { min: 0, max: 10, weights: [80, 15, 4.5, 0.5, 0, 0] },
    // 10-20 Minutes: [10, 35, 40, 14.5, 0.5, 0]
    { min: 10, max: 20, weights: [10, 35, 40, 14.5, 0.5, 0] },
    // 20-30 Minutes: [0, 0, 40, 50, 9.5, 0.5]
    { min: 20, max: 30, weights: [0, 0, 40, 50, 9.5, 0.5] },
    // 30-40 Minutes: [0, 0, 0, 20, 70, 10]
    { min: 30, max: 40, weights: [0, 0, 0, 20, 70, 10] },
    // 40+ Minutes: [0, 0, 0, 0, 60, 40]
    { min: 40, max: 9999, weights: [0, 0, 0, 0, 60, 40] }
];

const RARITY_LIST: MeteoriteRarity[] = ['anomalous', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];

function getRandomRarity(state: GameState): MeteoriteRarity {
    const minutes = state.gameTime / 60;
    const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];


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



    const boostRaw = calculateLegendaryBonus(state, 'rarity_boost_per_kill');
    const fullTiers = Math.floor(boostRaw);
    const fraction = boostRaw - fullTiers;

    let finalIndex = baseIndex + fullTiers;
    if (Math.random() < fraction) finalIndex += 1;


    finalIndex = Math.min(5, finalIndex);

    return RARITY_LIST[finalIndex];
}

export function createMeteorite(state: GameState, rarity: MeteoriteRarity, x: number = 0, y: number = 0): Meteorite {
    const stats: Meteorite['stats'] = {};

    const rand = Math.random();
    let isCorrupted = false;
    let quality: import('../core/types').MeteoriteQuality = 'Broken';


    if (rand < 0.05) {
        // Corrupted
        isCorrupted = true;
        const qRand = Math.random();
        quality = qRand < 0.2 ? 'New' : (qRand < 0.5 ? 'Damaged' : 'Broken');
    } else {
        const qRand = Math.random();
        if (qRand < 0.20) quality = 'New';
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
    const visualIndex = rarityLevel;


    const blueprintActive = isBuffActive(state, 'PERK_RESONANCE');
    const blueprintAdj = blueprintActive ? 2 : 0;
    const corruptionAdj = isCorrupted ? 3 : 0;

    const perks: Meteorite['perks'] = [];


    const powerLevel = rarityLevel + 1;

    for (let lvl = 1; lvl <= powerLevel; lvl++) {
        const pool = PERK_POOLS[lvl];
        if (pool) {
            const def = pool[Math.floor(Math.random() * pool.length)];


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


    let chance = (entry.weights.reduce((a, b) => a + b, 0) / 100) * 0.01;


    chance *= state.meteoriteRateBuffMult;


    chance += calculateLegendaryBonus(state, 'met_drop_per_kill');


    if (isBuffActive(state, 'METEOR_SHOWER')) {
        chance *= 1.5;
    }


    if (Math.random() > chance) return;

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
        rarity: 'anomalous',
        quality: 'New',
        perks: [],
        stats: {}
    };
    state.meteorites.push(item);
}

export function spawnDustPile(state: GameState, x: number, y: number, amount: number) {
    const item: any = {
        id: Math.random(),
        x,
        y,
        type: 'dust_pile',
        amount,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        magnetized: false,
        spawnedAt: state.gameTime,
        rarity: 'anomalous',
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


        if (state.gameTime - item.spawnedAt > 120) {
            meteorites.splice(i, 1);
            continue;
        }


        item.x += item.vx;
        item.y += item.vy;
        item.vx *= 0.95;
        item.vy *= 0.95;


        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        let nearestPlayerWithSpace: any = null;
        let minPlayerDist = Infinity;



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


        if (nearestPlayerWithSpace && minPlayerDist < MAGNET_RANGE) {
            item.magnetized = true;
            item.targetPlayer = nearestPlayerWithSpace;
        } else {

            item.magnetized = false;
            item.targetPlayer = null;
        }

        if (item.magnetized && item.targetPlayer) {
            const target = item.targetPlayer;
            const dx = target.x - item.x;
            const dy = target.y - item.y;
            const dist = Math.hypot(dx, dy);


            const speed = 12;
            const angle = Math.atan2(dy, dx);
            item.x += Math.cos(angle) * speed;
            item.y += Math.sin(angle) * speed;


            if (dist < PICKUP_RANGE) {
                if (item.type === 'void_flux') {
                    state.player.isotopes += item.amount || 0;
                    playSfx('shoot');
                    meteorites.splice(i, 1);
                    continue;
                }

                if (item.type === 'dust_pile') {
                    state.player.dust += item.amount || 0;
                    playSfx('shoot');
                    meteorites.splice(i, 1);
                    continue;
                }



                let emptySlotIndex = -1;
                for (let j = 10; j < inventory.length; j++) {
                    if (inventory[j] === null) {
                        emptySlotIndex = j;
                        break;
                    }
                }

                if (emptySlotIndex !== -1) {

                    item.isNew = true;
                    inventory[emptySlotIndex] = item;
                    state.meteoritesPickedUp++;
                    playSfx('shoot');
                    meteorites.splice(i, 1);
                }
            }
        }
    }
}
