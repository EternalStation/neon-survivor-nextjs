
import type { GameState } from '../core/Types';
import { calcStat } from '../utils/MathUtils';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { GAME_CONFIG } from '../core/GameConfig';


export function updatePlayerStats(state: GameState, overridePlayer?: any) {
    const player = overridePlayer || state.player;
    const curseMult = state.assistant.history.curseIntensity || 1.0;


    player.hp.hexFlat = calculateLegendaryBonus(state, 'hp_per_kill', false, player);
    player.hp.hexMult = calculateLegendaryBonus(state, 'hp_pct_per_kill', false, player);
    player.hp.hexMult2 = 0;

    player.reg.hexFlat = calculateLegendaryBonus(state, 'reg_per_kill', false, player);
    player.reg.hexMult = calculateLegendaryBonus(state, 'reg_pct_per_kill', false, player);
    player.reg.hexMult2 = 0;

    player.arm.hexFlat = calculateLegendaryBonus(state, 'arm_per_kill', false, player) + (player.chronoArmorBonus || 0);
    player.arm.hexMult = calculateLegendaryBonus(state, 'arm_pct_per_kill', false, player);
    player.arm.hexMult2 = calculateLegendaryBonus(state, 'arm_pct_conditional', false, player);

    player.dmg.hexFlat = calculateLegendaryBonus(state, 'dmg_per_kill', false, player);
    player.dmg.hexMult = calculateLegendaryBonus(state, 'dmg_pct_per_kill', false, player) + calculateLegendaryBonus(state, 'dmg_pct_per_hp', false, player);
    player.dmg.hexMult2 = 0;

    player.atk.hexFlat = calculateLegendaryBonus(state, 'ats_per_kill', false, player);
    player.atk.hexMult = calculateLegendaryBonus(state, 'ats_pct_per_kill', false, player);
    player.atk.hexMult2 = 0;
    player.cooldownReduction = 0;





    if (player.buffs?.puddleRegen) {
        player.reg.hexMult = (player.reg.hexMult || 0) + 25;
        player.hp.hexMult = (player.hp.hexMult || 0) + 25;
    }


    player.inRefineryZone = false;
    const alchemist = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
    if (alchemist) {
        const playerInPuddle = state.areaEffects.some(ae =>
            ae.type === 'puddle' &&
            Math.hypot(ae.x - player.x, ae.y - player.y) < ae.radius
        );
        if (playerInPuddle) {
            player.inRefineryZone = true;
        }
    }


    const currentArenaLevel = state.arenaLevels[state.currentArena] || 0;
    const isSurging = isBuffActive(state, 'ARENA_SURGE');

    const baseBuffAmount = 0.3;
    const baseMult = 1 + baseBuffAmount;
    const surgedMult = 1 + (baseBuffAmount * 2.0);

    const activeArenaMult = isSurging ? surgedMult : baseMult;

    state.hpRegenBuffMult = (state.currentArena === 2 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;
    state.dmgAtkBuffMult = (state.currentArena === 1 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;


    state.xpSoulBuffMult = (state.currentArena === 0 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;


    state.meteoriteRateBuffMult = (state.currentArena === 0 && currentArenaLevel >= 1) ? baseMult : 1.0;


    player.speed = calcStat(player.spd, 1.0, curseMult);

    if (player.playerClass === 'stormstrike') {
        const ct = player.stormCircleChargeTime ?? 0;
        const maxCharge = GAME_CONFIG.SKILLS.STORM_CIRCLE_MAX_CHARGE;
        const p = Math.max(0, Math.min(1, ct / maxCharge));
        let stormMod = 1;
        if (p < 0.05) {
            stormMod = 0.9 + (p / 0.05) * 0.1;
        } else {
            stormMod = 1.0 + ((p - 0.05) / 0.95) * 0.1;
        }
        player.speed *= stormMod;
    }

    if (player.buffs?.waveSpeed && state.gameTime < player.buffs.waveSpeed) {
        player.speed *= 1.03;
    }

    const maxHp = calcStat(player.hp, state.hpRegenBuffMult, curseMult);
    let regenAmount = (calcStat(player.reg, state.hpRegenBuffMult, curseMult) / 60);

    if (player.buffs?.systemSurge && state.gameTime < player.buffs.systemSurge.end) {
        const surge = player.buffs.systemSurge;
        player.atk.hexMult = (player.atk.hexMult || 0) + surge.atk;
    }



    const kinLvl = getHexLevel(state, 'KineticBattery');
    if (kinLvl >= 1) {
        if (kinLvl >= 2) {

            if (!player.kineticShieldTimer || state.gameTime >= player.kineticShieldTimer) {
                const totalArmor = calcStat(player.arm, 1.0, curseMult);
                const shieldAmount = totalArmor * 1.0;
                if (!player.shieldChunks) player.shieldChunks = [];

                player.shieldChunks = player.shieldChunks.filter((c: any) => (c as any).source !== 'kinetic');

                player.shieldChunks.push({
                    amount: shieldAmount,
                    expiry: state.gameTime + 60,
                    source: 'kinetic' as any
                });
                player.kineticShieldTimer = state.gameTime + 60;
                spawnFloatingNumber(state, player.x, player.y, "SHIELD RECHARGE", '#3b82f6', true);
            }
        }
    }


    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    const monolithIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'TemporalMonolith' || h?.type === 'ChronoDevourer');
    if (chronoLvl >= 3 || monolithIdx !== -1) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating' || h?.type === 'TemporalMonolith' || h?.type === 'ChronoDevourer');
        const startTime = chronoHex?.timeAtLevel?.[3] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const minutes = Math.floor(elapsed / 60);
        const mult = chronoHex ? getHexMultiplier(state, chronoHex.type) : 1;

        player.cooldownReduction += minutes * 0.0025 * mult;
    }




    if (player.healingDisabled) {
        regenAmount = 0;
    }
    player.curHp = Math.min(maxHp, player.curHp + regenAmount);


    const critLevel = getHexLevel(state, 'ComCrit');
    const shatterLvl = getHexLevel(state, 'SoulShatterCore');
    if (critLevel > 0 || shatterLvl > 0) {
        const chanceBonus = calculateLegendaryBonus(state, 'crit_chance_scaling', false, player);
        const dmgBonus = calculateLegendaryBonus(state, 'crit_dmg_scaling', false, player);
        player.critChance = (GAME_CONFIG.SKILLS.CRIT_BASE_CHANCE * 100) + chanceBonus;
        player.critDamage = (GAME_CONFIG.SKILLS.CRIT_BASE_MULT * 100) + dmgBonus;
    } else {
        player.critChance = 0;
        player.critDamage = 0;
    }
}

