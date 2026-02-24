import type { PlayerStats } from '../core/types';

export function calcStat(s: PlayerStats, arenaMult: number = 1, curseMult: number = 1): number {
    const baseSum = s.base + s.flat + (s.hexFlat || 0);
    const upgradeMult = 1 + (s.mult || 0) / 100;
    const hexScaling = 1 + (s.hexMult || 0) / 100;
    const hexScaling2 = 1 + (s.hexMult2 || 0) / 100;
    return baseSum * upgradeMult * hexScaling * hexScaling2 * arenaMult * curseMult;
}

export function getDefenseReduction(armor: number, cap: number = 0.95): number {
    if (armor <= 0) return 0;
    const cappedArmor = Math.min(armor, 999999);
    // Twice as hard to scale (divisor 2) and sharper power curve
    // Tuned so: A=16 -> ~9%, A=200k -> 90%, A=~328k -> 95%
    const reduction = 0.0945 * Math.pow(Math.log10(cappedArmor / 2 + 1), 1.4);
    return Math.min(cap, reduction);
}

export function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}
