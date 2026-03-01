import type { GameState } from '../core/types';
import { getHexLevel } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { triggerShockwave } from '../combat/ProjectileSpawning';
import { GAME_CONFIG } from '../core/GameConfig';

export function castSkill(state: GameState, skillIndex: number) {
    // 0-indexed skill slot
    if (skillIndex < 0 || skillIndex >= state.player.activeSkills.length) return;

    const skill = state.player.activeSkills[skillIndex];
    if (skill.cooldown > 0) return;

    const cdMod = (isBuffActive(state, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0) * (1 - (state.player.cooldownReduction || 0));

    if (skill.type === 'DefPuddle' || skill.type === 'XenoAlchemist' || skill.type === 'IrradiatedMire') {
        const level = getHexLevel(state, 'DefPuddle');
        const mireLvl = getHexLevel(state, 'IrradiatedMire');
        const radius = mireLvl > 0 ? 666 : (level >= 4 ? 600 : 500);

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
        skill.duration = 10; // Track active duration for UI/Logic
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
        skill.duration = 10;
    }



    if (skill.type === 'ComWave' || skill.type === 'NeuralSingularity' || skill.type === 'KineticTsunami') {
        const level = getHexLevel(state, 'ComWave');
        const singLvl = getHexLevel(state, 'NeuralSingularity');
        const tsunamiLvl = getHexLevel(state, 'KineticTsunami');
        triggerShockwave(state, state.player, level, singLvl > 0, tsunamiLvl > 0);

        if (level >= 4 || singLvl > 0 || tsunamiLvl > 0) {
            state.player.buffs = state.player.buffs || {};
            state.player.buffs.waveSpeed = state.gameTime + 3; // 3 seconds
        }

        // Cooldown: 30s base, 20s if Level 4
        let baseCD = level >= 4 ? GAME_CONFIG.SKILLS.WAVE_COOLDOWN_LVL4 : GAME_CONFIG.SKILLS.WAVE_COOLDOWN;

        if (singLvl > 0) {
            baseCD -= (state.player.level * 0.1);
        }
        if (tsunamiLvl > 0) {
            const harvestedSouls = state.player.kineticTsunamiWaveSouls || 0;
            baseCD -= (harvestedSouls * 0.01);
        }

        if (baseCD < 5) baseCD = 5;

        skill.cooldownMax = baseCD * cdMod;
        skill.cooldown = skill.cooldownMax;
    }
}
