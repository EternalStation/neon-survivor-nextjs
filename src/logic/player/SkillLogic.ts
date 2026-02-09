import type { GameState } from '../core/types';
import { getHexLevel } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';

export function castSkill(state: GameState, skillIndex: number) {
    // 0-indexed skill slot
    if (skillIndex < 0 || skillIndex >= state.player.activeSkills.length) return;

    const skill = state.player.activeSkills[skillIndex];
    if (skill.cooldown > 0) return;

    const cdMod = (isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0) * (1 - (state.player.cooldownReduction || 0));

    if (skill.type === 'DefPuddle') {
        const level = getHexLevel(state, 'DefPuddle');
        const radius = level >= 4 ? 600 : 500;

        state.areaEffects.push({
            id: Math.random(),
            type: 'puddle',
            x: state.player.x,
            y: state.player.y,
            radius,
            duration: 10, // 10 seconds
            creationTime: state.gameTime,
            level
        });

        // Cooldown
        skill.cooldownMax = 25 * cdMod;
        skill.cooldown = skill.cooldownMax;
        skill.inUse = true; // Visuals?
        // Auto-disable inUse after duration? Handled in loop.
    }

    if (skill.type === 'DefEpi') {
        const level = getHexLevel(state, 'DefEpi');
        state.player.immobilized = true;

        if (level >= 3) {
            state.player.buffs = state.player.buffs || {};
            state.player.buffs.epicenterShield = 3; // 3 seconds shield
        }

        state.areaEffects.push({
            id: Math.random(),
            type: 'epicenter',
            x: state.player.x,
            y: state.player.y,
            radius: 500,
            duration: 10,
            creationTime: state.gameTime,
            level,
            casterId: -1, // Player
            pulseTimer: 100 // Force immediate first pulse in update loop
        });

        // playSfx('ice-loop'); // Handled by pulse logic now for consistency

        skill.cooldownMax = 30 * cdMod;
        skill.cooldown = skill.cooldownMax; // Start cooldown
        skill.inUse = true;
    }

    if (skill.type === 'KineticBattery') {
        const kinLvl = getHexLevel(state, 'KineticBattery');
        const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
        if (kinLvl >= 1 && triggerZap) {
            triggerZap(state, state.player, kinLvl);

            // Short cooldown for manual zap
            skill.cooldownMax = 5 * cdMod;
            skill.cooldown = skill.cooldownMax;
        }
    }
}
