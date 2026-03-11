import { GameState, Meteorite, MeteoriteQuality, RARITY_ORDER } from '../core/types';
import { PERK_POOLS } from '../mission/LootLogic';
import { playSfx } from '../audio/AudioLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { isBuffActive } from './BlueprintLogic';

export function getUpgradeQualityCost(item: Meteorite): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);

    // Reduced base costs to make repair more affordable than before
    const base = item.quality === 'Broken' ? 20 : 40;

    let cost = base + (rarityIdx * 15);
    if (item.isCorrupted) cost *= 1.5;
    return Math.ceil(cost);
}

export function getRerollTypeCost(item: Meteorite, lockedCount: number): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
    const versionBonus = Math.floor(Math.max(0, (item.version || 1.0) - 1.0) * 10);
    const incubatorBonus = item.incubatorBoost || 0;
    const base = 5 + (rarityIdx * 3) + versionBonus + incubatorBonus;
    let cost = base * Math.pow(1.5, lockedCount);
    if (item.isCorrupted) cost *= 1.5;
    return Math.ceil(cost);
}

export function getRerollValueCost(item: Meteorite, lockedCount: number): number {
    const rarityIdx = RARITY_ORDER.indexOf(item.rarity);
    const versionBonus = Math.floor(Math.max(0, (item.version || 1.0) - 1.0) * 10);
    const incubatorBonus = item.incubatorBoost || 0;
    const base = 5 + (rarityIdx * 3) + versionBonus + incubatorBonus;
    let cost = base * Math.pow(1.5, lockedCount);
    if (item.isCorrupted) cost *= 1.5;
    return Math.ceil(cost);
}

export function upgradeMeteoriteQuality(state: GameState, item: Meteorite): boolean {
    const cost = getUpgradeQualityCost(item);
    if (state.player.isotopes < cost) return false;


    let newQuality: MeteoriteQuality;
    let qualityBonus = 3;

    if (item.quality === 'Broken') {
        newQuality = 'Damaged';
    } else if (item.quality === 'Damaged') {
        newQuality = 'New';
    } else {
        return false;
    }

    state.player.isotopes -= cost;
    item.quality = newQuality;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;


    item.perks.forEach(p => {
        p.value += qualityBonus;
        p.range.min += qualityBonus;
        p.range.max += qualityBonus;
    });

    playSfx('upgrade');
    spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "QUALITY UPGRADED", '#a855f7', true);

    return true;
}

export function rerollPerkType(state: GameState, item: Meteorite, lockedIndices: number[]): boolean {

    if (lockedIndices.length >= item.perks.length) {
        spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "ALL PERKS LOCKED", '#ef4444', true);
        return false;
    }

    const cost = getRerollTypeCost(item, lockedIndices.length);
    if (state.player.isotopes < cost) return false;

    state.player.isotopes -= cost;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;
    if (item.version >= 2.5) {
        (state.assistant.history as any).pendingRerollSnark = true;
    }

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

    return true;
}

export function rerollPerkValue(state: GameState, item: Meteorite, lockedIndices: number[]): boolean {

    if (lockedIndices.length >= item.perks.length) {
        spawnFloatingNumber(state, item.x || state.player.x, item.y || state.player.y, "ALL PERKS LOCKED", '#ef4444', true);
        return false;
    }

    const cost = getRerollValueCost(item, lockedIndices.length);
    if (state.player.isotopes < cost) return false;

    state.player.isotopes -= cost;
    item.recalibrationCount = (item.recalibrationCount || 0) + 1;
    item.version = Math.round(((item.version || 1.0) + 0.1) * 10) / 10;
    if (item.version >= 2.5) {
        (state.assistant.history as any).pendingRerollSnark = true;
    }

    item.perks = item.perks.map((p, idx) => {
        if (lockedIndices.includes(idx)) return p;

        const boost = item.incubatorBoost || 0;
        const min = p.range.min + boost;
        const max = p.range.max + boost;

        let newValue = p.value + boost;
        let attempts = 0;


        if (max > min) {
            do {
                newValue = min + Math.floor(Math.random() * (max - min + 1));
                attempts++;
            } while (newValue === (p.value + boost) && attempts < 10);


            if (newValue === (p.value + boost)) {
                newValue = (p.value + boost < max) ? (p.value + boost) + 1 : (p.value + boost) - 1;
            }
        }


        return {
            ...p,
            value: newValue - boost
        };
    });

    playSfx('upgrade');

    return true;
}
