
import type { Meteorite, MeteoriteRarity, LegendaryCategory } from '../../logic/core/types';
import { RARITY_ORDER } from '../../logic/core/types';

export type PerkFilter = {
    active: boolean;
    val: number;
    thing1: string;
    thing2: string;
};


export const RARITY_COLORS: Record<MeteoriteRarity, string> = {
    anomalous: '#60a5fa', // Blue (Anomalous)
    radiant: '#FFD700',   // Gold
    abyss: '#8B0000',      // Dark Red
    eternal: '#B8860B',   // Bronze/Orange
    divine: '#FFFFFF',    // White
    singularity: '#E942FF' // Magenta
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

export const getPerkName = (id: string | number) => {
    const sId = String(id);
    if (sId.startsWith('lvl1')) return '1st Perk';
    if (sId.startsWith('lvl2')) return '2nd Perk';
    if (sId.startsWith('lvl3')) return '3rd Perk';
    if (sId.startsWith('lvl4')) return '4th Perk';
    if (sId.startsWith('lvl5')) return '5th Perk';
    if (sId.startsWith('lvl6')) return '6th Perk';
    if (id === 'base_efficiency') return '1st Perk';
    return '1st Perk';
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
    for (let lvl = 1; lvl <= 6; lvl++) {
        const f = perkFilters[lvl];
        if (!f || !f.active) continue;

        const perks = item.perks;
        // Find the perk matching this level's tier (indices 0 to 5 map to tiers 1 to 6)
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
                    // Pair check (e.g. S1-S1 -> eco_eco)
                    if (!p.id.includes(t2)) contextMatches = false;
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
                if (!p.id.includes(t2)) contextMatches = false;
            }
        }

        if (contextMatches) {
            return checkValue(p.value);
        }
    }

    return false;
};;
