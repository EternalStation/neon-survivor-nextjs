import type { GameState, UpgradeChoice } from './types';
import { UPGRADE_TYPES, RARITIES, BASE_UPGRADE_VALUES } from './constants';
import { calcStat } from './MathUtils';
import { calculateLegendaryBonus } from './LegendaryLogic';

// [Start Minute, End Minute, Probabilities {rarityId: percent}]
// Note: End Minute is exclusive. 90+ handles everything after.
const RARITY_TABLE: { range: [number, number], weights: Record<string, number> }[] = [
    { range: [0, 5], weights: { scrap: 60, anomalous: 30, quantum: 10 } },
    { range: [5, 10], weights: { scrap: 35, anomalous: 40, quantum: 20, astral: 5 } },
    { range: [10, 15], weights: { scrap: 15, anomalous: 25, quantum: 30, astral: 20, radiant: 10 } },
    { range: [15, 20], weights: { scrap: 8, anomalous: 20, quantum: 25, astral: 25, radiant: 15, abyss: 7 } },
    { range: [20, 25], weights: { scrap: 4, anomalous: 15, quantum: 25, astral: 25, radiant: 20, abyss: 10, eternal: 1 } },
    { range: [25, 30], weights: { scrap: 0, anomalous: 10, quantum: 20, astral: 22, radiant: 20, abyss: 15, eternal: 8, divine: 5 } },
    { range: [30, 35], weights: { scrap: 0, anomalous: 4, quantum: 18, astral: 20, radiant: 18, abyss: 17, eternal: 13, divine: 7, singularity: 3 } },
    { range: [35, 40], weights: { scrap: 0, anomalous: 0, quantum: 14, astral: 18, radiant: 20, abyss: 18, eternal: 15, divine: 9, singularity: 6 } },
    { range: [40, 45], weights: { scrap: 0, anomalous: 0, quantum: 8, astral: 15, radiant: 21, abyss: 20, eternal: 17, divine: 11, singularity: 8 } },
    { range: [45, 50], weights: { scrap: 0, anomalous: 0, quantum: 4, astral: 11, radiant: 23, abyss: 22, eternal: 19, divine: 12, singularity: 9 } },
    { range: [50, 55], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 6, radiant: 24, abyss: 24, eternal: 22, divine: 14, singularity: 10 } },
    { range: [55, 60], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 2, radiant: 21, abyss: 26, eternal: 24, divine: 16, singularity: 11 } },
    { range: [60, 65], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 17, abyss: 28, eternal: 25, divine: 18, singularity: 12 } },
    { range: [65, 70], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 12, abyss: 30, eternal: 26, divine: 19, singularity: 13 } },
    { range: [70, 75], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 8, abyss: 31, eternal: 27, divine: 20, singularity: 14 } },
    { range: [75, 80], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 4, abyss: 32, eternal: 28, divine: 21, singularity: 15 } },
    { range: [80, 85], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 33, eternal: 29, divine: 22, singularity: 16 } },
    { range: [85, 90], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 30, eternal: 30, divine: 23, singularity: 17 } },
    { range: [90, 999], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 25, eternal: 33, divine: 24, singularity: 18 } }
];

const BOOSTED_RARITY_TABLE: { range: [number, number], weights: Record<string, number> }[] = [
    { range: [0, 5], weights: { scrap: 35, anomalous: 40, quantum: 20, astral: 5 } },
    { range: [5, 10], weights: { scrap: 15, anomalous: 25, quantum: 30, astral: 20, radiant: 10 } },
    { range: [10, 15], weights: { scrap: 8, anomalous: 20, quantum: 25, astral: 25, radiant: 15, abyss: 7 } },
    { range: [15, 20], weights: { scrap: 4, anomalous: 15, quantum: 25, astral: 25, radiant: 20, abyss: 10, eternal: 1 } },
    { range: [20, 25], weights: { scrap: 0, anomalous: 10, quantum: 20, astral: 22, radiant: 20, abyss: 15, eternal: 8, divine: 5 } },
    { range: [25, 30], weights: { scrap: 0, anomalous: 4, quantum: 18, astral: 20, radiant: 18, abyss: 17, eternal: 13, divine: 7, singularity: 3 } },
    { range: [30, 35], weights: { scrap: 0, anomalous: 0, quantum: 14, astral: 18, radiant: 20, abyss: 18, eternal: 15, divine: 9, singularity: 6 } },
    { range: [35, 40], weights: { scrap: 0, anomalous: 0, quantum: 8, astral: 15, radiant: 21, abyss: 20, eternal: 17, divine: 11, singularity: 8 } },
    { range: [40, 45], weights: { scrap: 0, anomalous: 0, quantum: 4, astral: 11, radiant: 23, abyss: 22, eternal: 19, divine: 12, singularity: 9 } },
    { range: [45, 50], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 6, radiant: 24, abyss: 24, eternal: 22, divine: 14, singularity: 10 } },
    { range: [50, 55], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 2, radiant: 21, abyss: 26, eternal: 24, divine: 16, singularity: 11 } },
    { range: [55, 60], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 17, abyss: 28, eternal: 25, divine: 18, singularity: 12 } },
    { range: [60, 65], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 12, abyss: 30, eternal: 26, divine: 19, singularity: 13 } },
    { range: [65, 70], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 8, abyss: 31, eternal: 27, divine: 19, singularity: 14 } },
    { range: [70, 75], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 4, abyss: 32, eternal: 28, divine: 21, singularity: 15 } },
    { range: [75, 80], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 33, eternal: 29, divine: 21, singularity: 16 } },
    { range: [80, 85], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 30, eternal: 30, divine: 23, singularity: 17 } },
    { range: [85, 90], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 25, eternal: 33, divine: 24, singularity: 18 } },
    { range: [90, 999], weights: { scrap: 0, anomalous: 0, quantum: 0, astral: 0, radiant: 0, abyss: 22, eternal: 34, divine: 25, singularity: 19 } }
];

function getRarityForTime(state: GameState, isRareBoost: boolean): string {
    const { gameTime } = state;
    const minutes = gameTime / 60;

    // Select correct table
    const table = isRareBoost ? BOOSTED_RARITY_TABLE : RARITY_TABLE;

    // Find matching bracket
    const bracket = table.find(b => minutes >= b.range[0] && minutes < b.range[1]) || table[table.length - 1];

    const rarityBoost = calculateLegendaryBonus(state, 'rarity_boost_per_kill');
    // Each 1% rarity boost reduces the effective roll, making better items likely.
    // Limit to 50% shift to avoid completely breaking progression early.
    const effectiveBoost = Math.min(50, rarityBoost * 100);
    const rand = Math.max(0, Math.random() * 100 - effectiveBoost);

    let cumulative = 0;
    const weights = Object.entries(bracket.weights);
    for (const [id, weight] of weights) {
        cumulative += weight;
        if (rand < cumulative) return id;
    }
    return weights[weights.length - 1][0]; // Fallback to highest
}

export function spawnUpgrades(state: GameState, isBoss: boolean = false): UpgradeChoice[] {
    state.isPaused = true;
    const choices: UpgradeChoice[] = [];

    if (isBoss) {
        choices.push(
            { type: { id: 'm', name: 'Dual Pulse', desc: '+1 Projectile per Shot', icon: 'special' }, rarity: { id: 'boss', label: 'Anomaly Tech', color: '#ef4444', mult: 0 }, isSpecial: true },
            { type: { id: 'p', name: 'Vortex Point', desc: '+1 Enemy Penetration', icon: 'special' }, rarity: { id: 'boss', label: 'Anomaly Tech', color: '#ef4444', mult: 0 }, isSpecial: true },
            { type: { id: 'd', name: 'Orbit Sentry', desc: state.player.droneCount < 3 ? 'Deploy Automated Drone' : '2x Damage for all Drones', icon: 'special' }, rarity: { id: 'boss', label: 'Anomaly Tech', color: '#ef4444', mult: 0 }, isSpecial: true }
        );
    } else {
        // Guarantee Uniqueness: Track IDs and Names
        const selectedIds = new Set<string>();
        const selectedNames = new Set<string>();
        const potentialTypes = [...UPGRADE_TYPES];

        for (let i = 0; i < 3; i++) {
            // Filter out already selected IDs or Names from the pool candidates
            const available = potentialTypes.filter(t => !selectedIds.has(t.id) && !selectedNames.has(t.name));

            if (available.length === 0) break;

            // Pick random
            const idx = Math.floor(Math.random() * available.length);
            const type = available[idx];

            selectedIds.add(type.id);
            selectedNames.add(type.name);

            // Pick Rarity based on Time
            // Note: We might want slightly different rarities for each card?
            // Currently it uses the same time seed, so Math.random() in getRarityForTime is key.
            // getRarityForTime uses Math.random(), so it's fine.
            const rarityId = getRarityForTime(state, state.rareRewardActive || false);
            const rarity = RARITIES.find(r => r.id === rarityId) || RARITIES[0];

            choices.push({ type, rarity });
        }
    }

    return choices;
}

export function spawnSnitchUpgrades(state: GameState): UpgradeChoice[] {
    state.isPaused = true;
    const choices: UpgradeChoice[] = [];

    // Calculate Snitch Forced Rarity
    // 0-5 mins -> Index 3 (Astral)
    // Increases by 1 every 5 minutes
    const minutes = state.gameTime / 60;
    const rarityIndex = Math.min(8, 3 + Math.floor(minutes / 5));
    const targetRarity = RARITIES[rarityIndex];

    // Select 3 Unique Upgrades
    const selectedIds = new Set<string>();
    const selectedNames = new Set<string>();
    const potentialTypes = [...UPGRADE_TYPES];

    for (let i = 0; i < 3; i++) {
        const available = potentialTypes.filter(t => !selectedIds.has(t.id) && !selectedNames.has(t.name));
        if (available.length === 0) break;

        const idx = Math.floor(Math.random() * available.length);
        const type = available[idx];

        selectedIds.add(type.id);
        selectedNames.add(type.name);

        choices.push({ type, rarity: targetRarity });
    }

    return choices;
}

export function applyUpgrade(state: GameState, choice: UpgradeChoice) {
    const { player } = state;

    // CONSUME RARE REWARD
    if (state.rareRewardActive) {
        state.rareRewardActive = false;
    }

    if (choice.isSpecial) {
        if (choice.type.id === 'm') player.multi++;
        if (choice.type.id === 'p') player.pierce++;
        if (choice.type.id === 'd') {
            player.droneCount++;
            if (player.droneCount <= 3) {
                state.drones.push({ a: Math.random() * 6.28, last: 0, x: player.x, y: player.y });
            }
        }
    } else {
        const baseValue = BASE_UPGRADE_VALUES[choice.type.id] || 0;
        const multiplier = choice.rarity.mult || 1;
        const finalValue = Math.round(baseValue * multiplier);
        const id = choice.type.id;

        if (choice.type.id === 'heal') {
            player.curHp = Math.min(player.curHp + 50, calcStat(player.hp));
        } else {
            if (id === 'dmg_f') player.dmg.flat += finalValue;
            if (id === 'dmg_m') player.dmg.mult += finalValue;
            if (id === 'atk_s') player.atk.flat = Math.min(9990, player.atk.flat + finalValue); // Cap at 9990 (30 attacks/sec approx)
            if (id === 'hp_f') { player.hp.flat += finalValue; player.curHp += finalValue; }
            if (id === 'hp_m') {
                const oldMax = calcStat(player.hp);
                player.hp.mult += finalValue;
                player.curHp += (calcStat(player.hp) - oldMax);
            }
            if (id === 'reg_f') player.reg.flat += finalValue;
            if (id === 'reg_m') player.reg.mult += finalValue;
            if (id === 'xp_f') player.xp_per_kill.flat += finalValue;
            if (id === 'xp_m') player.xp_per_kill.mult += finalValue;
            if (id === 'arm_f') player.arm.flat += Math.min(9999, finalValue); // Cap armor later, but here just add (cap is on total usually)
            if (id === 'arm_m') player.arm.mult += finalValue;

            player.upgradesCollected.push(choice);
        }
    }

    state.isPaused = false;
}
