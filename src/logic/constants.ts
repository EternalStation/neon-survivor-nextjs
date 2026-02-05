import type { Rarity, Upgrade } from './types';

export const CANVAS_WIDTH = typeof window !== 'undefined' ? window.innerWidth : 1920;
export const CANVAS_HEIGHT = typeof window !== 'undefined' ? window.innerHeight : 1080;

export const RARITIES: Rarity[] = [
    { id: 'scrap', label: 'Scrap', color: '#7FFF00', mult: 0.5 }, // High-Vis Lime
    { id: 'anomalous', label: 'Anomalous', color: '#00C0C0', mult: 0.8 },
    { id: 'quantum', label: 'Quantum', color: '#00FFFF', mult: 1.5 },
    { id: 'astral', label: 'Astral', color: '#7B68EE', mult: 2.5 },
    { id: 'radiant', label: 'Radiant', color: '#FFD700', mult: 4 },
    { id: 'abyss', label: 'Abyss', color: '#8B0000', mult: 7 },
    { id: 'eternal', label: 'Eternal', color: '#B8860B', mult: 12 },
    { id: 'divine', label: 'Divine', color: '#FFFFFF', mult: 20 },
    { id: 'singularity', label: 'Singularity', color: '#E942FF', mult: 35 }
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
    dmg_f: 10,
    dmg_m: 5,
    atk_s: 25,
    hp_f: 40,
    hp_m: 20,
    reg_f: 2.5,
    reg_m: 15,
    xp_f: 15,
    xp_m: 5,
    arm_f: 10,
    arm_m: 10
};

// --- Enemy Progression Constants ---

export const SHAPE_CYCLE_ORDER = ['circle', 'triangle', 'square', 'diamond', 'pentagon'];

export const SHAPE_DEFS: Record<string, { type: string; hpMult: number; speedMult: number; sizeMult: number; spawnWeight: number }> = {
    circle: { type: 'circle', hpMult: 0.9, speedMult: 1.2, sizeMult: 1.0, spawnWeight: 1.1 },
    triangle: { type: 'triangle', hpMult: 1.0, speedMult: 1.2, sizeMult: 1.0, spawnWeight: 1.2 },
    square: { type: 'square', hpMult: 2.0, speedMult: 0.7, sizeMult: 1.2, spawnWeight: 0.8 },
    diamond: { type: 'diamond', hpMult: 0.6, speedMult: 1.5, sizeMult: 1.0, spawnWeight: 1.0 },
    pentagon: { type: 'pentagon', hpMult: 2.0, speedMult: 0.8, sizeMult: 1.5, spawnWeight: 0.25 }
};

// Core, Medium, Dark (for Cycle Logic)
export const PALETTES = [
    { name: 'Neon Green', colors: ['#00FF00', '#408040', '#204020'] },
    { name: 'Cyber Blue', colors: ['#00FFFF', '#206080', '#103040'] }, // Cyan Main
    { name: 'Void Purple', colors: ['#BF00FF', '#602080', '#301040'] }, // Electric Purple
    { name: 'Solar Orange', colors: ['#FF9900', '#805020', '#402510'] }, // Deep Orange
    { name: 'Crimson Red', colors: ['#FF0000', '#802020', '#401010'] }  // Pure Red
];

export const PULSE_RATES = [
    { time: 5, interval: 300 },   // 0-5 mins: Slow Pulse
    { time: 10, interval: 180 },  // 5-10 mins: Medium Pulse
    { time: 15, interval: 120 },  // 10-15 mins: Fast Pulse
    { time: 999, interval: 60 }   // 15+ mins: Hyper Pulse
];
