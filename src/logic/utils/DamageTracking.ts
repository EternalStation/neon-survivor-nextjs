import { GameState, DamageSource, Enemy, Player } from '../core/types';

export function recordDamage(state: GameState, source: DamageSource, amount: number, target?: Enemy) {
    if (amount <= 0) return;

    const player = state.player;
    if (!player.damageBreakdown) {
        player.damageBreakdown = {};
    }

    player.damageBreakdown[source] = (player.damageBreakdown[source] || 0) + amount;

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

export function recordHealing(player: Player, source: string, amount: number) {
    if (amount <= 0) return;
    if (!player.healingBreakdown) player.healingBreakdown = {};
    player.healingBreakdown[source] = (player.healingBreakdown[source] || 0) + amount;
}

export function recordIncomingDamage(player: Player, source: string, amount: number) {
    if (amount <= 0) return;
    if (!player.incomingDamageBreakdown) player.incomingDamageBreakdown = {};
    player.incomingDamageBreakdown[source] = (player.incomingDamageBreakdown[source] || 0) + amount;
}
