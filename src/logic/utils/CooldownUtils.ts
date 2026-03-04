
import type { GameState, Player } from '../core/types';
import { isBuffActive } from '../upgrades/BlueprintLogic';

export function getCdMod(state: GameState, player: Player): number {
    const monolithBonus = ((player as any).temporalMonolithBuff ?? 0) > state.gameTime ? 0.2 : 0;
    const totalReduction = Math.min(0.9, (player.cooldownReduction || 0) + (player.cooldownReductionBonus || 0) + monolithBonus);
    return (isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0) * (1 - totalReduction);
}

export function isOnCooldown(lastUsed: number, baseCD: number, cdMod: number, now: number): boolean {
    return now - lastUsed < baseCD * cdMod;
}

export function getRemainingCD(lastUsed: number, baseCD: number, cdMod: number, now: number): number {
    return Math.max(0, baseCD * cdMod - (now - lastUsed));
}

export function getCDProgress(lastUsed: number, baseCD: number, cdMod: number, now: number): number {
    const effectiveCD = baseCD * cdMod;
    if (effectiveCD <= 0) return 0;
    return Math.max(0, 1 - (now - lastUsed) / effectiveCD);
}
