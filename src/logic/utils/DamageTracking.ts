import { GameState, DamageSource } from '../core/types';

export function recordDamage(state: GameState, source: DamageSource, amount: number) {
    if (amount <= 0) return;

    const player = state.player;
    if (!player.damageBreakdown) {
        player.damageBreakdown = {};
    }

    player.damageBreakdown[source] = (player.damageBreakdown[source] || 0) + amount;

    // Also update the total damageDealt just in case some logic missed it
    // although most combat logic already updates damageDealt separately.
    // We want to keep damageDealt as the ground truth for total.
}
