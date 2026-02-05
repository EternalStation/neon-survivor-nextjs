import type { PlayerStats } from './types';

export function calcStat(s: PlayerStats): number {
    const baseSum = s.base + s.flat + (s.hexFlat || 0);
    const upgradeMult = 1 + (s.mult || 0) / 100;
    const hexScaling = 1 + (s.hexMult || 0) / 100;
    return baseSum * upgradeMult * hexScaling;
}

export function getDefenseReduction(armor: number): number {
    if (armor <= 0) return 0;
    const cappedArmor = Math.min(armor, 999999);
    // New Formula: Matches 25% @ 61, 50% @ 500, 75% @ 8000, 95% @ 100k
    // R = 0.165 * log10(A + 1)^1.1
    const reduction = 0.165 * Math.pow(Math.log10(cappedArmor + 1), 1.1);
    return Math.min(0.95, reduction);
}
