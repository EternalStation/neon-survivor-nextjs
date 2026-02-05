import type { GameState, Meteorite, LegendaryHex } from './types';

export interface PerkResult {
    activeValue: number;
    count: number;
}

export function calculateMeteoriteEfficiency(state: GameState, meteoriteIdx: number): { totalBoost: number, perkResults: Record<string, PerkResult> } {
    const meteorite = state.moduleSockets.diamonds[meteoriteIdx];
    if (!meteorite) return { totalBoost: 0, perkResults: {} };

    let totalActiveBoostPct = 0;
    const perkResults: Record<string, PerkResult> = {};

    const neighbors = getMeteoriteNeighbors(state, meteoriteIdx);
    const hexConnections = getMeteoriteHexConnections(state, meteoriteIdx);

    if (meteorite.perks) {
        meteorite.perks.forEach(perk => {
            let count = 0;
            switch (perk.id) {
                case 'base_efficiency':
                    count = 1; // Always active
                    break;
                case 'matrix_same_type_rarity':
                    const currentMet = state.moduleSockets.diamonds[meteoriteIdx];
                    if (currentMet) {
                        count = neighbors.meteorites.filter(m =>
                            m.rarity === currentMet.rarity &&
                            m.discoveredIn === currentMet.discoveredIn &&
                            m.quality === currentMet.quality
                        ).length;
                    }
                    break;
                case 'neighbor_any_all':
                    count = neighbors.meteorites.length;
                    break;
                case 'neighbor_any_eco':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'ECONOMIC HEX').length;
                    break;
                case 'neighbor_any_com':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'COMBAT HEX').length;
                    break;
                case 'neighbor_any_def':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'DEFENCE HEX').length;
                    break;
                case 'neighbor_new_eco':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'ECONOMIC HEX' && m.quality === 'New').length;
                    break;
                case 'neighbor_dam_eco':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'ECONOMIC HEX' && m.quality === 'Damaged').length;
                    break;
                case 'neighbor_bro_eco':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'ECONOMIC HEX' && m.quality === 'Broken').length;
                    break;
                case 'neighbor_new_com':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'COMBAT HEX' && m.quality === 'New').length;
                    break;
                case 'neighbor_dam_com':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'COMBAT HEX' && m.quality === 'Damaged').length;
                    break;
                case 'neighbor_bro_com':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'COMBAT HEX' && m.quality === 'Broken').length;
                    break;
                case 'neighbor_new_def':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'DEFENCE HEX' && m.quality === 'New').length;
                    break;
                case 'neighbor_dam_def':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'DEFENCE HEX' && m.quality === 'Damaged').length;
                    break;
                case 'neighbor_bro_def':
                    count = neighbors.meteorites.filter(m => m.discoveredIn === 'DEFENCE HEX' && m.quality === 'Broken').length;
                    break;
                case 'neighbor_leg_any':
                    count = hexConnections.length;
                    break;
                case 'neighbor_leg_eco':
                    count = hexConnections.filter(h => h.category === 'Economic').length;
                    break;
                case 'neighbor_leg_com':
                    count = hexConnections.filter(h => h.category === 'Combat').length;
                    break;
                case 'neighbor_leg_def':
                    count = hexConnections.filter(h => h.category === 'Defensive').length;
                    break;
                case 'pair_eco_eco':
                case 'pair_eco_com':
                case 'pair_eco_def':
                case 'pair_com_com':
                case 'pair_com_def':
                case 'pair_def_def':
                    count = calculatePairBonus(hexConnections, perk.id, 1, false);
                    break;
                case 'pair_eco_eco_lvl':
                case 'pair_eco_com_lvl':
                case 'pair_eco_def_lvl':
                case 'pair_com_com_lvl':
                case 'pair_com_def_lvl':
                case 'pair_def_def_lvl':
                    count = calculatePairBonus(hexConnections, perk.id, 1, true);
                    break;
            }

            const resonanceBonus = calculateLegendaryBonus(state, 'metric_resonance', true);
            const activeValue = count * (perk.value + resonanceBonus);
            totalActiveBoostPct += activeValue;
            perkResults[perk.id] = { activeValue, count };
        });
    }

    return { totalBoost: totalActiveBoostPct / 100, perkResults };
}

import { calculateLegendaryBonus } from './LegendaryLogic';

function getMeteoriteNeighbors(state: GameState, idx: number) {
    const meteorites: Meteorite[] = [];
    const isInner = idx < 6;

    if (isInner) {
        // Neighbors: prev inner, next inner, same-index edge
        const neighborIdxs = [(idx + 5) % 6, (idx + 1) % 6, idx + 6];
        neighborIdxs.forEach(nIdx => {
            if (state.moduleSockets.diamonds[nIdx]) meteorites.push(state.moduleSockets.diamonds[nIdx]!);
        });
    } else {
        // Neighbors: inner equivalent
        const innerIdx = idx - 6;
        if (state.moduleSockets.diamonds[innerIdx]) meteorites.push(state.moduleSockets.diamonds[innerIdx]!);
    }

    return { meteorites };
}

function getMeteoriteHexConnections(state: GameState, idx: number): LegendaryHex[] {
    const hexes: LegendaryHex[] = [];
    const hexIdxs = idx < 6 ? [idx, (idx + 1) % 6] : [idx - 6, (idx - 6 + 1) % 6];

    hexIdxs.forEach(hIdx => {
        if (state.moduleSockets.hexagons[hIdx]) hexes.push(state.moduleSockets.hexagons[hIdx]!);
    });

    return hexes;
}


export function getChassisResonance(state: GameState): number {
    // The center slot (chassis) connects to the FIRST 6 diamonds (inner ring)
    const connectedDiamondIdxs = [0, 1, 2, 3, 4, 5];
    let totalBoost = 0;

    for (const dIdx of connectedDiamondIdxs) {
        if (state.moduleSockets.diamonds[dIdx]) {
            totalBoost += calculateMeteoriteEfficiency(state, dIdx).totalBoost;
        }
    }
    return totalBoost;
}

function calculatePairBonus(hexes: LegendaryHex[], perkId: string, value: number, checkLevel: boolean): number {
    if (hexes.length < 2) return 0;

    const h1 = hexes[0];
    const h2 = hexes[1];

    const idMap: Record<string, [string, string]> = {
        pair_eco_eco: ['Economic', 'Economic'],
        pair_eco_com: ['Economic', 'Combat'],
        pair_eco_def: ['Economic', 'Defensive'],
        pair_com_com: ['Combat', 'Combat'],
        pair_com_def: ['Combat', 'Defensive'],
        pair_def_def: ['Defensive', 'Defensive'],
        pair_eco_eco_lvl: ['Economic', 'Economic'],
        pair_eco_com_lvl: ['Economic', 'Combat'],
        pair_eco_def_lvl: ['Economic', 'Defensive'],
        pair_com_com_lvl: ['Combat', 'Combat'],
        pair_com_def_lvl: ['Combat', 'Defensive'],
        pair_def_def_lvl: ['Defensive', 'Defensive']
    };

    const targetTypes = idMap[perkId.replace('_lvl', '')];
    if (!targetTypes) return 0;

    const actualTypes = [h1.category, h2.category].sort();
    const sortedTargets = [...targetTypes].sort();

    const typeMatch = actualTypes[0] === sortedTargets[0] && actualTypes[1] === sortedTargets[1];
    if (!typeMatch) return 0;

    if (checkLevel && h1.level !== h2.level) return 0;

    return value;
}
