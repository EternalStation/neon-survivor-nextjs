import type { GameState, Meteorite, LegendaryHex } from '../core/Types';
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
    return 'Economic'; 
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
            const level = pts[0]; 
            const conns: { diamonds: number[], hexagons: number[], sectors: string[] } = { diamonds: [], hexagons: [], sectors: [] };

            switch (level) {
                case 'lvl1': {
                    
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
                    
                    const targetArena = pts[1].toUpperCase(); 
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
        
        
        if (isInner) {
            
            
            
            
            
            
            
            
            
            
            
            neighborIdxs = [
                (idx + 2) % 6,   
                (idx - 2 + 6) % 6,
                ((idx + 1) % 6) + 6, 
                ((idx - 1 + 6) % 6) + 6
            ];
        } else {
            
            
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
