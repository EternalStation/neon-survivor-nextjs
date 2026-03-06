
import type { GameState } from '../core/types';
import { getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { triggerShockwave } from '../combat/ProjectileSpawning';
import { GAME_CONFIG } from '../core/GameConfig';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { calcStat } from '../utils/MathUtils';

export function castSkill(state: GameState, skillIndex: number) {
    if (skillIndex < 0 || skillIndex >= state.player.activeSkills.length) return;

    const skill = state.player.activeSkills[skillIndex];
    const now = state.gameTime;
    const cdMod = getCdMod(state, state.player);

    if (isOnCooldown(skill.lastUsed, skill.baseCD, cdMod, now)) return;

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
            duration: 10,
            creationTime: state.gameTime,
            level
        });

        skill.baseCD = GAME_CONFIG.SKILLS.PUDDLE_COOLDOWN;
        skill.lastUsed = now;
        skill.inUse = true;
        skill.duration = 10;
    }

    if (skill.type === 'DefEpi' || skill.type === 'GravitationalHarvest') {
        const level = getHexLevel(state, skill.type as any);

        state.areaEffects.push({
            id: Math.random(),
            type: 'epicenter',
            x: state.player.x,
            y: state.player.y,
            radius: 500,
            duration: 10,
            creationTime: state.gameTime,
            level,
            casterId: -1,
            pulseTimer: 100
        });

        skill.baseCD = GAME_CONFIG.SKILLS.EPI_COOLDOWN;
        skill.lastUsed = now;
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
            state.player.buffs.waveSpeed = state.gameTime + 3;
        }

        let baseCD = level >= 4 ? GAME_CONFIG.SKILLS.WAVE_COOLDOWN_LVL4 : GAME_CONFIG.SKILLS.WAVE_COOLDOWN;

        if (singLvl > 0) {
            const mult = getHexMultiplier(state, 'NeuralSingularity');
            baseCD -= (state.player.level * 0.02 * mult);
        }
        if (tsunamiLvl > 0) {
            const mult = getHexMultiplier(state, 'KineticTsunami');
            const harvestedSouls = state.player.kineticTsunamiWaveSouls || 0;
            baseCD -= (harvestedSouls * 0.01 * mult);
        }

        if (baseCD < 5) baseCD = 5;

        skill.baseCD = baseCD;
        skill.lastUsed = now;
    }

    if (skill.type === 'TemporalMonolith') {
        const mult = getHexMultiplier(state, 'TemporalMonolith');
        const radius = 400 * mult;
        const duration = 4 * mult;
        state.enemies.forEach(e => {
            if (!e.dead && !e.isFriendly) {
                const dist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                if (dist <= radius) {
                    e.frozen = duration;
                    e.temporalMonolithExplosive = true;
                }
            }
        });

        state.areaEffects.push({
            id: Math.random(),
            type: 'temporal_freeze_wave',
            x: state.player.x,
            y: state.player.y,
            radius,
            duration: 0.5,
            creationTime: state.gameTime,
            level: 1
        });

        skill.baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
        skill.lastUsed = now;
        skill.inUse = true;
        skill.duration = duration;
    }

    if (skill.type === 'ChronoDevourer') {
        const mult = getHexMultiplier(state, 'ChronoDevourer');
        const shieldPieces = state.player.shieldChunks || [];
        const totalShield = shieldPieces.reduce((sum, chunk) => sum + Math.max(0, chunk.amount), 0);
        const totalArmor = calcStat(state.player.arm);

        const damage = (totalArmor + totalShield) * mult;

        state.player.shieldChunks = [];
        state.player.shield = 0;

        const radius = 600 * mult;

        state.areaEffects.push({
            id: Math.random(),
            type: 'temporal_burst',
            x: state.player.x,
            y: state.player.y,
            radius,
            duration: 0.5,
            creationTime: state.gameTime,
            level: 5
        });

        state.enemies.forEach(e => {
            if (!e.dead && !e.boss && !e.isFriendly) {
                const dist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                if (dist <= radius) {
                    e.hp -= damage;
                }
            }
        });

        skill.baseCD = GAME_CONFIG.SKILLS.CHRONO_DEVOURER_COOLDOWN;
        skill.lastUsed = now;
        skill.inUse = true;
        skill.duration = 0.5;
    }
}
