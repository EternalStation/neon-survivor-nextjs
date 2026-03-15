import type { Rarity, Upgrade } from './Types';

export const CANVAS_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
export const CANVAS_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;

export const RARITIES: Rarity[] = [
    { id: 'scrap', label: 'Scrap', color: '#7FFF00', mult: 0.5 },
    { id: 'anomalous', label: 'Anomalous', color: '#00C0C0', mult: 1 },
    { id: 'quantum', label: 'Quantum', color: '#00FFFF', mult: 2.5 },
    { id: 'astral', label: 'Astral', color: '#7B68EE', mult: 4.5 },
    { id: 'radiant', label: 'Radiant', color: '#FFD700', mult: 9 },
    { id: 'abyss', label: 'Abyss', color: '#8B0000', mult: 18 },
    { id: 'eternal', label: 'Eternal', color: '#B8860B', mult: 35 },
    { id: 'divine', label: 'Divine', color: '#FFFFFF', mult: 60 },
    { id: 'singularity', label: 'Singularity', color: '#E942FF', mult: 95 }
];

export const UPGRADE_TYPES: Upgrade[] = [
    { id: 'dmg_f', name: 'Damage', desc: 'Increases base power.', icon: 'dmg' },
    { id: 'dmg_m', name: 'Damage Multiplier', desc: 'Boosts total power %.', icon: 'dmg_m' },
    { id: 'atk_s', name: 'Attack Speed', desc: 'Reduces firing delay.', icon: 'atk' },
    { id: 'hp_f', name: 'Max Health', desc: 'Increases HP capacity.', icon: 'hp_f' },
    { id: 'hp_m', name: 'Health Multiplier', desc: 'Boosts HP capacity %.', icon: 'hp_m' },
    { id: 'reg_f', name: 'Health Regen', desc: 'Flat HP/sec.', icon: 'reg_f' },
    { id: 'reg_m', name: 'Regen Multiplier', desc: 'Boosts regen %.', icon: 'reg_m' },
    { id: 'xp_f', name: 'Exp Per Kill', desc: 'Flat XP bonus.', icon: 'xp' },
    { id: 'xp_m', name: 'Exp Multiplier', desc: 'Boosts XP gain %.', icon: 'xp_m' },
    { id: 'arm_f', name: 'Armor', desc: 'Flat reduction.', icon: 'arm' },
    { id: 'arm_m', name: 'Armor Multiplier', desc: 'Boosts armor %.', icon: 'arm_m' }
];

export const BASE_UPGRADE_VALUES: Record<string, number> = {
    dmg_f: 15,
    dmg_m: 15,
    atk_s: 30,
    hp_f: 100,
    hp_m: 60,
    reg_f: 2,
    reg_m: 30,
    xp_f: 20,
    xp_m: 10,
    arm_f: 15,
    arm_m: 15
};


export const SHAPE_CYCLE_ORDER = ['circle', 'triangle', 'square', 'diamond', 'pentagon'];

export const SHAPE_DEFS: Record<string, { type: string; hpMult: number; speedMult: number; sizeMult: number; spawnWeight: number }> = {
    circle: { type: 'circle', hpMult: 0.9, speedMult: 0.9, sizeMult: 1.0, spawnWeight: 1.1 },
    triangle: { type: 'triangle', hpMult: 1.0, speedMult: 1.0, sizeMult: 1.0, spawnWeight: 1.2 },
    square: { type: 'square', hpMult: 2.0, speedMult: 0.7, sizeMult: 1.2, spawnWeight: 0.8 },
    diamond: { type: 'diamond', hpMult: 0.6, speedMult: 1.0, sizeMult: 1.0, spawnWeight: 1.0 },
    pentagon: { type: 'pentagon', hpMult: 2.0, speedMult: 0.8, sizeMult: 1.5, spawnWeight: 0.25 },
    glitcher: { type: 'glitcher', hpMult: 1.5, speedMult: 1.1, sizeMult: 1.1, spawnWeight: 0.05 },
    hexagon: { type: 'hexagon', hpMult: 1.0, speedMult: 0.9, sizeMult: 1.0, spawnWeight: 0 },
    worm: { type: 'worm', hpMult: 1.5, speedMult: 0.65, sizeMult: 1.2, spawnWeight: 0 }
};

export const PALETTES = [
    { name: 'Neon Green', colors: ['#4ade80', '#22c55e', '#064e3b'] },
    { name: 'Cyber Blue', colors: ['#00ffff', '#3b82f6', '#1e3a8a'] },
    { name: 'Void Purple', colors: ['#e9d5ff', '#a855f7', '#581c87'] },
    { name: 'Solar Orange', colors: ['#fff7ed', '#f97316', '#7c2d12'] },
    { name: 'Crimson Red', colors: ['#fee2e2', '#ef4444', '#7f1d1d'] }
];

export const PULSE_RATES = [
    { time: 5, interval: 300 },
    { time: 10, interval: 180 },
    { time: 15, interval: 120 },
    { time: 999, interval: 60 }
];
