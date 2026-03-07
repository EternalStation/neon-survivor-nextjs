import { GameState, DamageSource } from '../core/types';

export function recordDamage(state: GameState, source: DamageSource, amount: number) {
    if (amount <= 0) return;

    const player = state.player;
    if (!player.damageBreakdown) {
        player.damageBreakdown = {};
    }

    player.damageBreakdown[source] = (player.damageBreakdown[source] || 0) + amount;

    // Track active skill damage for the current minute
    const classSkillSources: DamageSource[] = ['Orbital Vortex', 'Storm Circle', 'Void Singularity', 'Nanite Swarm', 'Malware Wall Bonus'];
    if (classSkillSources.includes(source)) {
        state.currentMinuteClassSkillDamage = (state.currentMinuteClassSkillDamage || 0) + amount;
    }
}
