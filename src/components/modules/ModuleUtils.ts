
import type { Meteorite, MeteoriteRarity, LegendaryCategory } from '../../logic/core/types';

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
