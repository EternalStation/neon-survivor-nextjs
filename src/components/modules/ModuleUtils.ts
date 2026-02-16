
import type { Meteorite, MeteoriteRarity, LegendaryCategory } from '../../logic/core/types';
import { RARITY_ORDER } from '../../logic/core/types';

export type PerkFilter = {
    active: boolean;
    val: number;
    arena: string;
    matchQuality: string;
};


export const RARITY_COLORS: Record<MeteoriteRarity, string> = {
    anomalous: '#60a5fa', // Blue (Anomalous)
    radiant: '#FFD700',   // Gold
    abyss: '#8B0000',     // Dark Red
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
    if (discoveredIn.includes('ECONOMIC')) return '#fbbf24'; // Yellow
    if (discoveredIn.includes('COMBAT')) return '#f87171';   // Red
    if (discoveredIn.includes('DEFENCE') || discoveredIn.includes('DEFENSE')) return '#60a5fa'; // Blue
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
        let levelMatch = false;

        const checkValue = (v: number) => v >= f.val;

        // Find the perk matching this level's tier (indices 0 to 5 map to tiers 1 to 6)
        // Meteorites of level X have one perk from each tier 1 to X.
        const p = perks[lvl - 1]; // Perk level 1 is at index 0, etc.
        if (p && p.id.startsWith(`lvl${lvl}`)) {
            const pts = p.id.split('_');

            // Check contextual filters (Sector/Arena)
            // pts[1] is usually sector (eco/com/def) or neighbor quality (bro/dam/new)
            // pts[2] is target legendary type or neighbor quality

            let contextMatches = true;

            const a = f.arena.toLowerCase(); // 'eco', 'com', 'def'
            const qMap: Record<string, string> = { 'NEW': 'new', 'DAM': 'dam', 'BRO': 'bro', 'COR': 'cor' };
            const q = qMap[f.matchQuality] || 'any';

            // Filter logic per level based on ID structure in LootLogic.ts
            if (f.arena !== 'All') {
                const arenaMatch = p.id.includes(a);
                if (!arenaMatch) contextMatches = false;
            }

            if (f.matchQuality !== 'All') {
                const qualityMatch = p.id.includes(q);
                if (!qualityMatch) contextMatches = false;
            }

            if (contextMatches) {
                levelMatch = checkValue(p.value);
            }
        }

        if (!levelMatch) return false;
    }

    return true;
};
