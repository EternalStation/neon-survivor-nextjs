
import type { Meteorite, MeteoriteRarity, LegendaryCategory } from '../../logic/core/types';
import { getUiTranslation } from '../../lib/uiTranslations';
import { RARITY_ORDER } from '../../logic/core/types';

export type PerkFilter = {
    active: boolean;
    val: number;
    thing1: string;
    thing2: string;
};


export const RARITY_COLORS: Record<string, string> = {
    anomalous: '#60a5fa', // Blue (Anomalous)
    radiant: '#FFD700',   // Gold
    abyss: '#8B0000',      // Dark Red
    eternal: '#B8860B',   // Bronze/Orange
    divine: '#FFFFFF',    // White
    singularity: '#E942FF', // Magenta
    // Compatibility fallbacks for older items or direct mapping
    Common: '#94a3b8',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#fbbf24'
};

// Rarity Order for Dust Value (1 to 6)

export const getDustValue = (rarity: MeteoriteRarity) => {
    // 1-Based Dust Value based on Rarity Index
    return RARITY_ORDER.indexOf(rarity) + 1;
};

export const getMeteoriteImage = (m: Meteorite) => {
    // Quality is now strictly Broken/Damaged/New
    return `/assets/meteorites/M${m.visualIndex}${m.quality}.png`;
};

export const getBlueprintImage = (type: string) => {
    return `/assets/Icons/Blueprint.png`;
};

export const getPerkIcon = (id: string) => {
    return '◈';
};

export const getPerkName = (id: string | number, language: string = 'en') => {
    const sId = String(id);
    const t = getUiTranslation(language as any).meteorites.perkNames;

    if (sId.startsWith('lvl1')) return t.lvl1;
    if (sId.startsWith('lvl2')) return t.lvl2;
    if (sId.startsWith('lvl3')) return t.lvl3;
    if (sId.startsWith('lvl4')) return t.lvl4;
    if (sId.startsWith('lvl5')) return t.lvl5;
    if (sId.startsWith('lvl6')) return t.lvl6;
    if (id === 'base_efficiency') return t.lvl1;
    return t.lvl1;
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
    const up = discoveredIn.toUpperCase();
    if (up.includes('SECTOR-01') || up.includes('ECO')) return '#fbbf24'; // Yellow
    if (up.includes('SECTOR-02') || up.includes('COM') || up.includes('COMBAT')) return '#f87171'; // Red
    if (up.includes('SECTOR-03') || up.includes('DEF')) return '#60a5fa'; // Blue
    return '#94a3b8'; // Slate-400 (Default/Grey)
};

export const matchesFilter = (
    item: Meteorite | null,
    coreFilter: { quality: string | string[], rarity: string | string[], arena: string | string[] },
    perkFilters: Record<number, PerkFilter>
): boolean => {
    if (!item) return true;

    // Core Checks
    // Map UI labels to internal quality types
    const qualityMap: Record<string, string> = { 'NEW': 'New', 'DAM': 'Damaged', 'BRO': 'Broken' };

    // Handle Quality Filter (Multi-Select)
    if (Array.isArray(coreFilter.quality)) {
        // If empty or includes 'All', it passes
        if (coreFilter.quality.length > 0 && !coreFilter.quality.includes('All')) {
            const wantBlueprints = coreFilter.quality.includes('BLUEPRINTS');
            const wantCorrupted = coreFilter.quality.includes('COR');

            if (item.isBlueprint) {
                if (!wantBlueprints) return false;
            } else {
                let matchesQuality = false;

                // check if any selected quality matches item.quality
                let mappedQualities = coreFilter.quality.map(q => qualityMap[q]).filter(q => q !== undefined);
                if (mappedQualities.includes(item.quality)) matchesQuality = true;

                // check if COR matches item.isCorrupted
                if (wantCorrupted && item.isCorrupted) matchesQuality = true;

                if (!matchesQuality) return false;
            }
        }
    } else {
        // Legacy string support
        if (coreFilter.quality === 'BLUEPRINTS') {
            if (!item.isBlueprint) return false;
        } else if (coreFilter.quality === 'COR') {
            if (!item.isCorrupted) return false;
        } else if (coreFilter.quality !== 'All') {
            if (item.isBlueprint) return false;
            if (item.quality !== qualityMap[coreFilter.quality]) return false;
        }
    }

    // Handle Rarity Filter
    if (Array.isArray(coreFilter.rarity)) {
        if (coreFilter.rarity.length > 0 && !coreFilter.rarity.includes('All')) {
            if (!coreFilter.rarity.includes(item.rarity)) return false;
        }
    } else {
        if (coreFilter.rarity !== 'All' && item.rarity !== coreFilter.rarity) return false;
    }

    // Handle Arena Filter
    if (Array.isArray(coreFilter.arena)) {
        if (coreFilter.arena.length > 0 && !coreFilter.arena.includes('All')) {
            const match = coreFilter.arena.some(a => item.discoveredIn.toUpperCase().includes(a.toUpperCase()));
            if (!match) return false;
        }
    } else {
        if (coreFilter.arena !== 'All' && !item.discoveredIn.toUpperCase().includes(coreFilter.arena.toUpperCase())) return false;
    }

    // Perk Checks (Cumulative/AND logic)
    // Skip blueprints, non-meteorite items (dust/flux), and items with no perks array.
    // An empty array [] is truthy in JS, so we must also check .length > 0.
    if (item.isBlueprint || !item.perks || !Array.isArray(item.perks) || item.perks.length === 0) return true;

    for (let lvl = 1; lvl <= 6; lvl++) {
        const f = perkFilters[lvl];
        if (!f || !f.active) continue;

        const perks = item.perks;
        // Find the perk matching this level's tier (indices 0 to 5 map to tiers 1 to 6).
        // Meteorites only have perks up to their rarity level (e.g. anomalous has 1, singularity has 6).
        // If the item doesn't have this perk level, it doesn't match the filter.
        const p = perks[lvl - 1];
        if (!p) return false;

        if (!matchesPerk(p, lvl, f)) return false;
    }

    return true;
};

export const matchesPerk = (p: { id: string, value: number }, lvl: number, f: PerkFilter): boolean => {
    if (!f.active) return true;

    const checkValue = (v: number) => v >= f.val;

    const normalize = (s: string) => {
        const lower = s.toLowerCase();
        if (lower === 'sector-01' || lower === 'sector 01' || lower === 's1' || lower.includes('eco')) return 'eco';
        if (lower === 'sector-02' || lower === 'sector 02' || lower === 's2' || lower.includes('com')) return 'com';
        if (lower === 'sector-03' || lower === 'sector 03' || lower === 's3' || lower.includes('def')) return 'def';
        return lower;
    };

    const normalizePair = (s: string) => {
        const parts = s.split('-');
        if (parts.length === 2) {
            return `${normalize(parts[0])}_${normalize(parts[1])}`;
        }
        return s.toLowerCase().replace(/-/g, '_');
    };

    if (p.id.startsWith(`lvl${lvl}`)) {
        const pts = p.id.split('_');
        let contextMatches = true;

        const t1 = normalize(f.thing1);
        const t2 = f.thing2.includes('-') ? normalizePair(f.thing2) : normalize(f.thing2);
        const rawT2 = f.thing2.toLowerCase(); // For non-mapped checks if any

        // Level-specific mapping
        // pts[0] is always 'lvlX'
        if (lvl === 1 || lvl === 2 || lvl === 5) {
            // [lvl, Sector, Other...]
            if (f.thing1 !== 'All' && pts[1] !== t1) contextMatches = false;
            if (contextMatches && f.thing2 !== 'All') {
                if (f.thing2.includes('-')) {
                    // Pair check (e.g. Eco-Eco -> eco_eco)
                    // Level 5 pair starts at pts[2]
                    const itemPair = pts.slice(2, 4).join('_');
                    if (itemPair !== t2) contextMatches = false;
                } else if (pts[2] !== t2) contextMatches = false;
            }
        } else if (lvl === 3 || lvl === 4) {
            // [lvl, Arena, NeighborQuality] 
            // Swap in UI: thing1=Neighbor, thing2=Arena
            if (f.thing1 !== 'All' && pts[2] !== t1) contextMatches = false;
            if (contextMatches && f.thing2 !== 'All' && pts[1] !== t2) contextMatches = false;
        } else if (lvl === 6) {
            // [lvl, NeighborQual, Pair...]
            if (f.thing1 !== 'All' && pts[1] !== t1) contextMatches = false;
            if (contextMatches && f.thing2 !== 'All') {
                // Pair check (e.g. Eco-Eco -> eco_eco)
                // Level 6 pair starts at pts[2]
                const itemPair = pts.slice(2, 4).join('_');
                if (itemPair !== t2) contextMatches = false;
            }
        }

        if (contextMatches) {
            return checkValue(p.value);
        }
    }

    return false;
};

export const SPIN_POOLS = {
    Sector: ['Sector-01', 'Sector-02', 'Sector-03'],
    Arena: ['Economic Arena', 'Combat Arena', 'Defence Arena'],
    Legendary: ['Eco ⬢', 'Com ⬢', 'Def ⬢'],
    Pairing: [
        'Eco & Eco ⬢', 'Eco & Com ⬢', 'Eco & Def ⬢',
        'Com & Com ⬢', 'Com & Def ⬢', 'Def & Def ⬢'
    ],
    Quality: ['Broken', 'Damaged', 'New']
};

/**
 * Extracts the "spinny parts" from a perk ID for the casino animation.
 * Returns an array of strings that should be animated.
 */
export const getPerkParts = (id: string, language: string = 'en') => {
    const pts = id.split('_');
    if (pts.length < 2) return [];

    const t = getUiTranslation(language as any).recalibrate;
    const parts: string[] = [];

    const mapSector = (s: string) => {
        if (s === 'eco') return t.sectors.s1;
        if (s === 'com') return t.sectors.s2;
        if (s === 'def') return t.sectors.s3;
        return s;
    };

    const mapArena = (s: string) => {
        if (s === 'eco') return t.arenas.eco;
        if (s === 'com') return t.arenas.com;
        if (s === 'def') return t.arenas.def;
        return s;
    };

    const mapLegendary = (s: string) => {
        if (s === 'eco') return t.legendary.eco;
        if (s === 'com') return t.legendary.com;
        if (s === 'def') return t.legendary.def;
        return s;
    };

    const mapLegendarySuffix = (s: string) => {
        if (s === 'eco') return `${t.legendary.eco} ⬢`;
        if (s === 'com') return `${t.legendary.com} ⬢`;
        if (s === 'def') return `${t.legendary.def} ⬢`;
        return s;
    };

    const mapQuality = (s: string) => {
        if (s === 'bro') return t.qualities.bro;
        if (s === 'dam') return t.qualities.dam;
        if (s === 'new') return t.qualities.new;
        return s;
    };

    const lvl = parseInt(pts[0].replace('lvl', ''));

    if (lvl === 1) {
        // lvl1_SECTOR_LEGENDARY
        parts.push(mapSector(pts[1]));
        parts.push(mapLegendarySuffix(pts[2]));
    } else if (lvl === 2) {
        // lvl2_SECTOR_NEIGHBOR
        parts.push(mapSector(pts[1]));
        parts.push(mapQuality(pts[2]));
    } else if (lvl === 3 || lvl === 4) {
        // lvl3_ARENA_NEIGHBOR
        parts.push(mapArena(pts[1]));
        parts.push(mapQuality(pts[2]));
    } else if (lvl === 5) {
        // lvl5_SECTOR_PAIR1_PAIR2
        parts.push(mapSector(pts[1]));
        parts.push(`${mapLegendary(pts[2])} & ${mapLegendarySuffix(pts[3])}`);
    } else if (lvl === 6) {
        // lvl6_NEIGHBOR_PAIR1_PAIR2
        parts.push(mapQuality(pts[1]));
        parts.push(`${mapLegendary(pts[2])} & ${mapLegendarySuffix(pts[3])}`);
    }

    return parts;
};
