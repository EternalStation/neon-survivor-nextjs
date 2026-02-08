import type { PlayerStats } from './types';

export function calcStat(s: PlayerStats, arenaMult: number = 1): number {
    const baseSum = s.base + s.flat + (s.hexFlat || 0);
    const upgradeMult = 1 + (s.mult || 0) / 100;
    const hexScaling = 1 + (s.hexMult || 0) / 100;
    const hexScaling2 = 1 + (s.hexMult2 || 0) / 100;
    return baseSum * upgradeMult * hexScaling * hexScaling2 * arenaMult;
}

export function getDefenseReduction(armor: number, cap: number = 0.95): number {
    if (armor <= 0) return 0;
    const cappedArmor = Math.min(armor, 999999);
    // Log-scaling armor: tuned so 95% reduction is reached around ~300k armor
    // R = 0.146324 * log10(A + 1)^1.1
    const reduction = 0.146324 * Math.pow(Math.log10(cappedArmor + 1), 1.1);
    return Math.min(cap, reduction);
}
