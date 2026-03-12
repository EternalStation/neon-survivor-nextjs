
import type { GameState } from '../core/Types';
import { getHexLevel, getHexMultiplier, getLogarithmicSum } from '../upgrades/LegendaryLogic';
import { triggerShockwave } from '../combat/ProjectileSpawning';
import { GAME_CONFIG } from '../core/GameConfig';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { calcStat } from '../utils/MathUtils';
import { spawnParticles } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';

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
            pulseTimer: 100,
            isGravitationalHarvest: skill.type === 'GravitationalHarvest'
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
            baseCD -= (getLogarithmicSum(harvestedSouls) * 0.01 * mult);
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
                    spawnParticles(state, e.x, e.y, '#38bdf8', 5, 8, 20, 'shard');
                }
            }
        });


        spawnParticles(state, state.player.x, state.player.y, '#38bdf8', 20, 12, 30, 'shockwave');

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


    if (skill.type === 'GravityAnchor') {
        const level = 5;

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
            pulseTimer: 100,
            isGravityAnchor: true
        });

        skill.baseCD = GAME_CONFIG.SKILLS.EPI_COOLDOWN;
        skill.lastUsed = now;
        skill.inUse = true;
        skill.duration = 10;
        playSfx('power-up');
    }
}
