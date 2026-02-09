
import type { Meteorite, MeteoriteRarity, LegendaryCategory } from '../../logic/core/types';

export type PerkFilter = {
    active: boolean;
    val: number;
    arena: string;
    matchQuality: string;
};


export const RARITY_COLORS: Record<MeteoriteRarity, string> = {
    scrap: '#7FFF00',
    anomalous: '#00C0C0',
    quantum: '#00FFFF',
    astral: '#7B68EE',
    radiant: '#FFD700',
    void: '#8B0000',
    eternal: '#B8860B',
    divine: '#FFFFFF',
    singularity: '#E942FF'
};

// Rarity Order for Dust Value (1 to 9)
export const RARITY_ORDER: MeteoriteRarity[] = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'void', 'eternal', 'divine', 'singularity'];

export const getDustValue = (rarity: MeteoriteRarity) => {
    // 1-Based Dust Value based on Rarity Index
    return RARITY_ORDER.indexOf(rarity) + 1;
};

export const getMeteoriteImage = (m: Meteorite) => {
    const assetQuality = m.quality === 'Corrupted' ? 'New' : m.quality;
    return `/assets/meteorites/M${m.visualIndex}${assetQuality}.png`;
};

export const getBlueprintImage = (type: string) => {
    return `/assets/Icons/Blueprint.png`;
};

export const getHexPoints = (x: number, y: number, r: number) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        points.push(`${x + r * Math.cos(angle)},${y + r * Math.sin(angle)}`);
    }
    return points.join(' ');
};

export const findClosestVertices = (v1s: { x: number, y: number }[], v2s: { x: number, y: number }[]) => {
    let minVal = Infinity;
    let bestPair = { v1: v1s[0], v2: v2s[0] };
    v1s.forEach(v1 => {
        v2s.forEach(v2 => {
            const d = (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2;
            if (d < minVal) {
                minVal = d;
                bestPair = { v1, v2 };
            }
        });
    });
    return bestPair;
};

export const getLegendaryInfo = (category: string, type: string) => {
    const categories: Record<LegendaryCategory, { icon: string, color: string }> = {
        Economic: { icon: '💰', color: '#fbbf24' },
        Combat: { icon: '⚔️', color: '#f87171' },
        Defensive: { icon: '🛡️', color: '#60a5fa' }
    };
    const base = categories[category as LegendaryCategory] || { icon: '★', color: '#fbbf24' };

    // For type-specific icons (overrides)
    switch (type) {
        case 'hp_per_kill': return { ...base, icon: '✚' };
        case 'ats_per_kill': return { ...base, icon: '⚡' };
        case 'xp_per_kill': return { ...base, icon: '✨' };
        case 'dmg_per_kill': return { ...base, icon: '⚔' };
        case 'reg_per_kill': return { ...base, icon: '❤' };
        case 'shockwave': return { ...base, icon: '🌊' };
        case 'shield_passive': return { ...base, icon: '🛡️' };
        case 'dash_boost': return { ...base, icon: '💨' };
        case 'lifesteal': return { ...base, icon: '🩸' };
        case 'orbital_strike': return { ...base, icon: '🛰️' };
        case 'drone_overdrive': return { ...base, icon: '🤖' };
        default: return base;
    }
};

export const getMeteoriteColor = (discoveredIn: string) => {
    if (discoveredIn.includes('ECONOMIC')) return '#fbbf24'; // Yellow
    if (discoveredIn.includes('COMBAT')) return '#f87171';   // Red
    if (discoveredIn.includes('DEFENCE') || discoveredIn.includes('DEFENSE')) return '#60a5fa'; // Blue
    return '#94a3b8'; // Slate-400 (Default/Grey)
};

export const matchesFilter = (
    item: Meteorite | null,
    coreFilter: { quality: string, rarity: string, arena: string },
    perkFilters: Record<number, PerkFilter>
): boolean => {
    if (!item) return true;

    // Core Checks
    // Map UI labels to internal quality types
    const qualityMap: Record<string, string> = { 'PRI': 'New', 'DAM': 'Damaged', 'BRO': 'Broken', 'COR': 'Corrupted' };
    if (coreFilter.quality !== 'All' && item.quality !== qualityMap[coreFilter.quality]) return false;

    if (coreFilter.rarity !== 'All' && item.rarity !== coreFilter.rarity) return false;
    if (coreFilter.arena !== 'All' && !item.discoveredIn.toUpperCase().includes(coreFilter.arena.toUpperCase())) return false;

    // Perk Checks (Cumulative/AND logic)
    for (let lvl = 1; lvl <= 9; lvl++) {
        const f = perkFilters[lvl];
        if (!f.active) continue;

        const perks = item.perks;
        let levelMatch = false;

        const checkValue = (v: number) => v >= f.val;

        switch (lvl) {
            case 1: {
                const p = perks.find((x: any) => x.id === 'base_efficiency');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 2: {
                const p = perks.find((x: any) => x.id === 'neighbor_any_all');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 3: {
                const a = f.arena.toLowerCase();
                const target = a === 'all' ? 'neighbor_any_' : `neighbor_any_${a}`;
                const p = perks.find((x: any) => x.id.startsWith(target) && x.id.split('_').length === 3 && x.id !== 'neighbor_any_all');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 4: {
                const a = f.arena.toLowerCase();
                // Match Quality Mapping
                const qMap: Record<string, string> = { 'PRI': 'new', 'DAM': 'dam', 'BRO': 'bro', 'COR': 'cor' };
                let q = qMap[f.matchQuality] || 'any';

                const p = perks.find((x: any) => {
                    const pts = x.id.split('_');
                    if (pts[0] !== 'neighbor') return false;
                    // Exclude 'any' which is reserved for L2/L3 (Proximity/Sector)
                    if (pts[1] === 'any') return false;
                    if (f.matchQuality !== 'All' && pts[1] !== q) return false;
                    if (f.arena !== 'All' && pts[2] !== a) return false;
                    return pts.length === 3;
                });
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 5: {
                const p = perks.find((x: any) => x.id === 'neighbor_leg_any');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 6: {
                const a = f.arena.toLowerCase();
                const target = a === 'all' ? 'neighbor_leg_' : `neighbor_leg_${a}`;
                const p = perks.find((x: any) => x.id.startsWith(target) && x.id !== 'neighbor_leg_any');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 7:
            case 8: {
                const a = f.arena.toLowerCase().replace('-', '_');
                const p = perks.find((x: any) => {
                    if (!x.id.startsWith('pair_')) return false;
                    if (lvl === 8 && !x.id.endsWith('_lvl')) return false;
                    if (lvl === 7 && x.id.endsWith('_lvl')) return false;
                    return f.arena === 'All' || x.id.includes(`_${a}`);
                });
                if (p) levelMatch = checkValue(p.value);
                break;
            }
            case 9: {
                const p = perks.find((x: any) => x.id === 'matrix_same_type_rarity');
                if (p) levelMatch = checkValue(p.value);
                break;
            }
        }

        if (!levelMatch) return false;
    }

    return true;
};

