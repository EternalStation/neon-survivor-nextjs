import type { GameState, Meteorite, LegendaryHex } from '../core/types';
import { isBuffActive } from './BlueprintLogic';

const FORGE_MAP: Record<string, string> = {
    'Economic': 'Exis',
    'Combat': 'Apex',
    'Defensive': 'Bastion'
};

function hasCategory(hex: LegendaryHex, cat: string): boolean {
    if (hex.category === cat) return true;
    if (hex.categories?.includes(cat as any)) return true;
    if (hex.forgedAt) {
        const forgeName = FORGE_MAP[cat];
        if (forgeName && hex.forgedAt.includes(forgeName)) return true;
    }
    return false;
}

export interface PerkResult {
    activeValue: number;
    count: number;
    connections?: {
        diamonds: number[];
        hexagons: number[];
        sectors: string[];
    };
}

export function getSector(idx: number): 'Economic' | 'Combat' | 'Defensive' {
    if (idx === 0 || idx === 1 || idx === 6 || idx === 7) return 'Combat';
    if (idx === 2 || idx === 3 || idx === 8 || idx === 9) return 'Defensive';
    return 'Economic'; // 4, 5, 10, 11
}

function getArenaKey(arenaName: string): 'eco' | 'com' | 'def' {
    const n = arenaName.toUpperCase();
    if (n.includes('ECO')) return 'eco';
    if (n.includes('COM')) return 'com';
    return 'def';
}

function getQualityKey(q: string): 'bro' | 'dam' | 'new' {
    if (q === 'Broken') return 'bro';
    if (q === 'Damaged') return 'dam';
    return 'new';
}

export function calculateMeteoriteEfficiency(state: GameState, meteoriteIdx: number): { totalBoost: number, perkResults: Record<string, PerkResult>, blueprintBoost: number } {
    const meteorite = state.moduleSockets.diamonds[meteoriteIdx];
    if (!meteorite) return { totalBoost: 0, perkResults: {}, blueprintBoost: 0 };

    let totalActiveBoostPct = 0;
    const perkResults: Record<string, PerkResult> = {};

    const neighbors = getMeteoriteNeighbors(state, meteoriteIdx);
    const secondaryNeighbors = getMeteoriteNeighbors(state, meteoriteIdx, true);
    const hexConnData = getMeteoriteHexConnections(state, meteoriteIdx);
    const sector = getSector(meteoriteIdx);

    if (meteorite.perks) {
        meteorite.perks.forEach(perk => {
            let count = 0;
            const pts = perk.id.split('_');
            const level = pts[0]; // 'lvl1', 'lvl2' etc.
            const conns: { diamonds: number[], hexagons: number[], sectors: string[] } = { diamonds: [], hexagons: [], sectors: [] };

            switch (level) {
                case 'lvl1': {
                    // lvl1_{sector}_{hexType}
                    const targetSector = pts[1] === 'eco' ? 'Economic' : (pts[1] === 'com' ? 'Combat' : 'Defensive');
                    const targetHexType = pts[2] === 'eco' ? 'Economic' : (pts[2] === 'com' ? 'Combat' : 'Defensive');
                    if (sector === targetSector) {
                        const matchingHexIndices = hexConnData.indices.filter(hIdx => {
                            const hex = state.moduleSockets.hexagons[hIdx];
                            if (!hex) return false;
                            return hasCategory(hex, targetHexType);
                        });
                        if (matchingHexIndices.length > 0) {
                            count = 1;
                            conns.sectors.push(targetSector);
                            conns.hexagons.push(...matchingHexIndices);
                        }
                    }
                    break;
                }
                case 'lvl2': {
                    // lvl2_{sector}_{neighborQuality}
                    const targetSector = pts[1] === 'eco' ? 'Economic' : (pts[1] === 'com' ? 'Combat' : 'Defensive');
                    const targetQuality = pts[2] === 'bro' ? 'Broken' : (pts[2] === 'dam' ? 'Damaged' : 'New');
                    if (sector === targetSector) {
                        const matchingNeighbors = neighbors.indices.filter(nIdx => state.moduleSockets.diamonds[nIdx]?.quality === targetQuality);
                        if (matchingNeighbors.length > 0) {
                            count = matchingNeighbors.length;
                            conns.sectors.push(targetSector);
                            conns.diamonds.push(...matchingNeighbors);
                        }
                    }
                    break;
                }
                case 'lvl3': {
                    // lvl3_{arena}_{neighborQuality}
                    const targetArena = pts[1].toUpperCase(); // 'ECO', 'COM', 'DEF'
                    const targetQuality = pts[2] === 'bro' ? 'Broken' : (pts[2] === 'dam' ? 'Damaged' : 'New');
                    const matchingNeighbors = neighbors.indices.filter(nIdx => {
                        const m = state.moduleSockets.diamonds[nIdx];
                        return m && getArenaKey(m.discoveredIn) === pts[1] && m.quality === targetQuality;
                    });
                    if (matchingNeighbors.length > 0) {
                        count = matchingNeighbors.length;
                        conns.diamonds.push(...matchingNeighbors);
                    }
                    break;
                }
                case 'lvl4': {
                    // lvl4_{arena}_{neighborQuality} (Secondary)
                    const targetArena = pts[1].toUpperCase();
                    const targetQuality = pts[2] === 'bro' ? 'Broken' : (pts[2] === 'dam' ? 'Damaged' : 'New');
                    const matchingNeighbors = secondaryNeighbors.indices.filter(nIdx => {
                        const m = state.moduleSockets.diamonds[nIdx];
                        return m && getArenaKey(m.discoveredIn) === pts[1] && m.quality === targetQuality;
                    });
                    if (matchingNeighbors.length > 0) {
                        count = matchingNeighbors.length;
                        conns.diamonds.push(...matchingNeighbors);
                    }
                    break;
                }
                case 'lvl5': {
                    // lvl5_{sector}_{t1}_{t2}
                    const targetSector = pts[1] === 'eco' ? 'Economic' : (pts[1] === 'com' ? 'Combat' : 'Defensive');
                    const t1 = pts[2] === 'eco' ? 'Economic' : (pts[2] === 'com' ? 'Combat' : 'Defensive');
                    const t2 = pts[3] === 'eco' ? 'Economic' : (pts[3] === 'com' ? 'Combat' : 'Defensive');
                    if (sector === targetSector && hexConnData.hexes.length >= 2) {
                        const h1 = hexConnData.hexes[0];
                        const h2 = hexConnData.hexes[1];
                        if ((hasCategory(h1, t1) && hasCategory(h2, t2)) || (hasCategory(h1, t2) && hasCategory(h2, t1))) {
                            count = 1;
                            conns.sectors.push(targetSector);
                            conns.hexagons.push(...hexConnData.indices);
                        }
                    }
                    break;
                }
                case 'lvl6': {
                    // lvl6_{neighborQual}_{t1}_{t2}
                    const targetQuality = pts[1] === 'bro' ? 'Broken' : (pts[1] === 'dam' ? 'Damaged' : 'New');
                    const t1 = pts[2] === 'eco' ? 'Economic' : (pts[2] === 'com' ? 'Combat' : 'Defensive');
                    const t2 = pts[3] === 'eco' ? 'Economic' : (pts[3] === 'com' ? 'Combat' : 'Defensive');
                    const matchingNeighborIdxs = neighbors.indices.filter(nIdx => state.moduleSockets.diamonds[nIdx]?.quality === targetQuality);
                    const isBridge = hexConnData.hexes.length >= 2 && (
                        (hasCategory(hexConnData.hexes[0], t1) && hasCategory(hexConnData.hexes[1], t2)) ||
                        (hasCategory(hexConnData.hexes[0], t2) && hasCategory(hexConnData.hexes[1], t1))
                    );
                    if (matchingNeighborIdxs.length > 0 && isBridge) {
                        count = 1;
                        conns.diamonds.push(...matchingNeighborIdxs);
                        conns.hexagons.push(...hexConnData.indices);
                    }
                    break;
                }
                // Deprecated Fallback
                case 'base_efficiency': count = 1; break;
            }

            const resonanceBonus = calculateLegendaryBonus(state, 'metric_resonance', true);
            const incubatorBonus = meteorite.incubatorBoost || 0;
            const activeValue = count * (perk.value + resonanceBonus + incubatorBonus);
            totalActiveBoostPct += activeValue;
            perkResults[perk.id] = { activeValue, count, connections: count > 0 ? conns : undefined };
        });
    }

    const matrixActive = isBuffActive(state, 'MATRIX_OVERDRIVE');
    const finalBoost = (totalActiveBoostPct / 100) * (matrixActive ? 1.15 : 1.0);
    // User Request: MATR-X is 15% of the WHOLE meteorite efficiency (Base 100% + Perks)
    const bpBoost = matrixActive ? (1 + (totalActiveBoostPct / 100)) * 0.15 : 0;

    return {
        totalBoost: finalBoost,
        perkResults,
        blueprintBoost: bpBoost
    };
}

import { calculateLegendaryBonus } from './LegendaryLogic';

function getMeteoriteNeighbors(state: GameState, idx: number, secondary: boolean = false): { meteorites: Meteorite[], indices: number[] } {
    const meteorites: Meteorite[] = [];
    const isInner = idx < 6;

    let neighborIdxs: number[] = [];
    if (!secondary) {
        if (isInner) {
            neighborIdxs = [(idx + 5) % 6, (idx + 1) % 6, idx + 6];
        } else {
            neighborIdxs = [idx - 6];
        }
    } else {
        // SECONDARY NEIGHBORS (LVL 4)
        // Jump over 1.
        if (isInner) {
            // Inner (i) connections: (i-1), (i+1), i+6.
            // Jump over (i-1) -> (i-2)
            // Jump over (i+1) -> (i+2)
            // Jump over (i+6)? If i+6 had outer neighbors j, then j would be secondary. 
            // In our current grid, outer j is only connected to inner j-6.
            // So if I'm at inner 0, jump over 0+6 (outer 6) -> nothing.
            // BUT, if I am at inner 0, jump over inner 5 -> outer 11? 
            // No, jumping over a primary neighbor to find what IT connects to (excluding the source).
            // Inner 0 -> Inner 1 -> {2, 7}
            // Inner 0 -> Inner 5 -> {4, 11}
            // Secondary neighbors for Inner 0: 2, 7, 4, 11. (Total 4 as requested).
            neighborIdxs = [
                (idx + 2) % 6,   // Inner jump
                (idx - 2 + 6) % 6,
                ((idx + 1) % 6) + 6, // Outer jump via adjacent inner
                ((idx - 1 + 6) % 6) + 6
            ];
        } else {
            // Outer (o) connects to Inner (o-6).
            // Jump over (o-6) -> (o-6-1) and (o-6+1). (Total 2 as requested).
            neighborIdxs = [
                (idx - 6 + 1) % 6,
                (idx - 6 - 1 + 6) % 6
            ];
        }
    }

    neighborIdxs.forEach(nIdx => {
        const met = state.moduleSockets.diamonds[nIdx];
        if (met) meteorites.push(met);
    });

    return { meteorites, indices: neighborIdxs };
}



function getMeteoriteHexConnections(state: GameState, idx: number): { hexes: LegendaryHex[], indices: number[] } {
    const hexes: LegendaryHex[] = [];
    const hexIdxs = idx < 6 ? [idx, (idx + 1) % 6] : [idx - 6, (idx - 6 + 1) % 6];

    hexIdxs.forEach(hIdx => {
        if (state.moduleSockets.hexagons[hIdx]) hexes.push(state.moduleSockets.hexagons[hIdx]!);
    });

    return { hexes, indices: hexIdxs };
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
    return totalBoost + (state.chassisResonanceBonus || 0);
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

    const getCat = (h: LegendaryHex) => h.categories || [h.category];
    const c1 = getCat(h1);
    const c2 = getCat(h2);
    const sortedTargets = [...targetTypes].sort();

    const typeMatch = c1.some(cat1 => c2.some(cat2 => {
        const sortedActual = [cat1, cat2].sort();
        return sortedActual[0] === sortedTargets[0] && sortedActual[1] === sortedTargets[1];
    }));

    if (!typeMatch) return 0;

    if (checkLevel && h1.level !== h2.level) return 0;

    return value;
}
