import type { PlayerStats } from '../core/types';

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
    // Twice as hard to scale (divisor 2) and sharper power curve
    // Tuned so: A=16 -> ~9%, A=200k -> 90%, A=~328k -> 95%
    const reduction = 0.0945 * Math.pow(Math.log10(cappedArmor / 2 + 1), 1.4);
    return Math.min(cap, reduction);
}
