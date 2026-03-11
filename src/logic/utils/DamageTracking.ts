import { GameState, DamageSource, Enemy } from '../core/types';

export function recordDamage(state: GameState, source: DamageSource, amount: number, target?: Enemy) {
    if (amount <= 0) return;

    const player = state.player;
    if (!player.damageBreakdown) {
        player.damageBreakdown = {};
    }

    player.damageBreakdown[source] = (player.damageBreakdown[source] || 0) + amount;

    const classSpecificSources: Record<string, DamageSource[]> = {
        'malware': ['Malware Wall Bonus'],
        'stormstrike': ['Storm Circle'],
        'hivemother': ['Nanite Swarm'],
        'aigis': ['Orbital Vortex', 'Wall Shockwave', 'Aegis Rings'],
        'eventhorizon': ['Void Singularity']
    };

    const playerClass = player.playerClass;
    if (!playerClass) return;

    const currentMinuteSources = classSpecificSources[playerClass] || [];

    if (currentMinuteSources.includes(source)) {
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
