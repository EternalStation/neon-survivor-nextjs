import { GameState, Meteorite, MeteoriteQuality, RARITY_ORDER } from '../core/types';
import { PERK_POOLS } from '../mission/LootLogic';
import { playSfx } from '../audio/AudioLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { isBuffActive } from './BlueprintLogic';

export function getUpgradeQualityCost(item: Meteorite): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
    const versionBonus = Math.floor(Math.max(0, (item.version || 1.0) - 1.0) * 10);
    return 50 + (rarityIdx * 30) + versionBonus;
}

export function getRerollTypeCost(item: Meteorite, lockedCount: number): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
    const versionBonus = Math.floor(Math.max(0, (item.version || 1.0) - 1.0) * 10);
    const base = 5 + (rarityIdx * 3) + versionBonus;
    return base * Math.pow(2, lockedCount);
}

export function getRerollValueCost(item: Meteorite, lockedCount: number): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
    const versionBonus = Math.floor(Math.max(0, (item.version || 1.0) - 1.0) * 10);
    const base = 5 + (rarityIdx * 3) + versionBonus;
    return base * Math.pow(2, lockedCount);
}

export function upgradeMeteoriteQuality(state: GameState, item: Meteorite): boolean {
    const cost = getUpgradeQualityCost(item);
    if (state.player.isotopes < cost) return false;

    // Quality Progression: Broken -> Damaged -> New
    let newQuality: MeteoriteQuality;
    let qualityBonus = 3; // Standard +3 shift for any upgrade

    if (item.quality === 'Broken') {
        newQuality = 'Damaged';
    } else if (item.quality === 'Damaged') {
        newQuality = 'New';
    } else {
        return false; // Already Max or Corrupted
    }

    state.player.isotopes -= cost;
    item.quality = newQuality;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;

    // Apply Stat Bonus (+3 to all existing perks)
    item.perks.forEach(p => {
        p.value += qualityBonus;
        p.range.min += qualityBonus;
        p.range.max += qualityBonus;
    });

    playSfx('upgrade'); // Ensure this exists or use 'level-up'
    spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "QUALITY UPGRADED", '#a855f7', true);

    return true;
}

export function rerollPerkType(state: GameState, item: Meteorite, lockedIndices: number[]): boolean {
    const cost = getRerollTypeCost(item, lockedIndices.length);
    if (state.player.isotopes < cost) return false;

    state.player.isotopes -= cost;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;

    const blueprintAdj = isBuffActive(state, 'PERK_RESONANCE') ? 2 : 0;
    const corruptionAdj = item.isCorrupted ? 3 : 0;

    item.perks = item.perks.map((p, idx) => {
        if (lockedIndices.includes(idx)) return p;

        const lvl = idx + 1;
        const pool = PERK_POOLS[lvl];
        if (!pool) return p;

        const filteredPool = pool.filter(def => def.id !== p.id);
        const finalPool = filteredPool.length > 0 ? filteredPool : pool;

        const def = finalPool[Math.floor(Math.random() * finalPool.length)];

        // Use quality-specific ranges
        const baseRange = def.ranges[item.quality as keyof typeof def.ranges];
        const min = Math.max(0, baseRange.min + blueprintAdj + corruptionAdj);
        const max = baseRange.max + blueprintAdj + corruptionAdj;
        return {
            id: def.id,
            description: def.description,
            value: p.value,
            range: { min, max }
        };
    });

    playSfx('reroll');
    spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "PERKS RECONFIGURED", '#6366f1', true);
    return true;
}

export function rerollPerkValue(state: GameState, item: Meteorite, lockedIndices: number[]): boolean {
    const cost = getRerollValueCost(item, lockedIndices.length);
    if (state.player.isotopes < cost) return false;

    state.player.isotopes -= cost;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;

    item.perks = item.perks.map((p, idx) => {
        if (lockedIndices.includes(idx)) return p;

        const { min, max } = p.range;
        let newValue = p.value;
        let attempts = 0;

        // Try to roll a different value if range allows
        if (max > min) {
            do {
                newValue = min + Math.floor(Math.random() * (max - min + 1));
                attempts++;
            } while (newValue === p.value && attempts < 10);

            // Force change if RNG fails after attempts
            if (newValue === p.value) {
                newValue = (p.value < max) ? p.value + 1 : p.value - 1;
            }
        }

        return { ...p, value: newValue };
    });

    playSfx('upgrade');
    spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "VALUES TUNED", '#4ade80', true);
    return true;
}
