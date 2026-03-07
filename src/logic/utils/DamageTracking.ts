import { GameState, DamageSource, Enemy } from '../core/Types';

export function recordDamage(state: GameState, source: DamageSource, amount: number, target?: Enemy) {
    if (amount <= 0) return;

    const player = state.player;
    if (!player.damageBreakdown) {
        player.damageBreakdown = {};
    }

    player.damageBreakdown[source] = (player.damageBreakdown[source] || 0) + amount;

    // Track active skill damage for the current minute
    const classSkillSources: DamageSource[] = [
        'Orbital Vortex',
        'Storm Circle',
        'Void Singularity',
        'Nanite Swarm',
        'Malware Wall Bonus',
        'Wall Shockwave',
        'Aegis Rings'
    ];

    if (classSkillSources.includes(source)) {
        // Update both the state for real-time tracking and player for persistence
        state.currentMinuteClassSkillDamage = (state.currentMinuteClassSkillDamage || 0) + amount;

        if (!player.activeSkillDamageByMinute) {
            player.activeSkillDamageByMinute = {};
        }
        const currentMinute = Math.floor(state.gameTime / 60);
        if (!player.activeSkillDamageByMinute[currentMinute]) {
            player.activeSkillDamageByMinute[currentMinute] = 0;
        }
        player.activeSkillDamageByMinute[currentMinute] += amount;
    }
}
