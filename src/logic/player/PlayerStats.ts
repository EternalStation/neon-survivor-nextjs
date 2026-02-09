
import type { GameState } from '../core/types';
import { calcStat } from '../utils/MathUtils';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';

export function updatePlayerStats(state: GameState) {
    const { player } = state;

    // Calculate and assign Hex bonuses to player stats for this frame
    player.hp.hexFlat = calculateLegendaryBonus(state, 'hp_per_kill');
    player.hp.hexMult = calculateLegendaryBonus(state, 'hp_pct_per_kill');
    player.hp.hexMult2 = 0;

    player.reg.hexFlat = calculateLegendaryBonus(state, 'reg_per_kill');
    player.reg.hexMult = calculateLegendaryBonus(state, 'reg_pct_per_kill');
    player.reg.hexMult2 = 0;

    player.arm.hexFlat = calculateLegendaryBonus(state, 'arm_per_kill') + (player.chronoArmorBonus || 0);
    player.arm.hexMult = calculateLegendaryBonus(state, 'arm_pct_per_kill');
    player.arm.hexMult2 = calculateLegendaryBonus(state, 'arm_pct_missing_hp');

    player.dmg.hexFlat = calculateLegendaryBonus(state, 'dmg_per_kill');
    player.dmg.hexMult = calculateLegendaryBonus(state, 'dmg_pct_per_kill') + calculateLegendaryBonus(state, 'dmg_pct_per_hp');
    player.dmg.hexMult2 = 0;

    player.atk.hexFlat = calculateLegendaryBonus(state, 'ats_per_kill');
    player.atk.hexMult = calculateLegendaryBonus(state, 'ats_pct_per_kill');
    player.atk.hexMult2 = 0;

    // Arena Buffs (Multiplier based)
    let arenaBuff = 1.0;
    if (state.currentArena === 2) {
        const surgeMult = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
        arenaBuff = 1 + (0.2 * surgeMult);
    }
    state.arenaBuffMult = arenaBuff;

    // Movement stat
    const maxHp = calcStat(player.hp, state.arenaBuffMult);
    let regenAmount = (calcStat(player.reg, state.arenaBuffMult) / 60);

    if (player.buffs?.puddleRegen) {
        regenAmount *= 1.25; // +25% Regen in Puddle (Lvl 3)
    }

    if (player.buffs?.systemSurge && state.gameTime < player.buffs.systemSurge.end) {
        const surge = player.buffs.systemSurge;
        player.atk.hexMult = (player.atk.hexMult || 0) + surge.atk;
    }

    // --- LEGENDARY HEX LOGIC ---

    // KINETIC BATTERY (Defense - Arena 2)
    const kinLvl = getHexLevel(state, 'KineticBattery');
    if (kinLvl >= 1) {
        if (kinLvl >= 2) {
            if (!player.kineticShieldTimer || state.gameTime >= player.kineticShieldTimer) {
                const totalArmor = calcStat(player.arm);
                const shieldAmount = totalArmor * 5;
                if (!player.shieldChunks) player.shieldChunks = [];

                player.shieldChunks = player.shieldChunks.filter(c => (c as any).source !== 'kinetic');

                player.shieldChunks.push({
                    amount: shieldAmount,
                    expiry: state.gameTime + 60,
                    source: 'kinetic' as any
                });
                player.kineticShieldTimer = state.gameTime + 60;
                spawnFloatingNumber(state, player.x, player.y, "SHIELD RECHARGE", '#3b82f6', true);
            }
        }
        if (kinLvl >= 4) {
            const totalArmor = calcStat(player.arm);
            const bonusRegen = totalArmor * 0.005;
            const baseRegenSum = player.reg.base + player.reg.flat + (player.reg.hexFlat || 0);
            if (baseRegenSum > 0) {
                player.reg.hexMult2 = (bonusRegen / baseRegenSum) * 100;
            } else {
                player.reg.hexFlat = (player.reg.hexFlat || 0) + bonusRegen;
            }
        }
    }

    // CHRONO PLATING (Economic - Arena 0)
    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    if (chronoLvl >= 3) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
        const startTime = chronoHex?.timeAtLevel?.[3] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const index = Math.floor(elapsed / 300);

        if (player.lastChronoDoubleIndex === undefined) {
            player.lastChronoDoubleIndex = 0;
        }

        if (index > player.lastChronoDoubleIndex) {
            player.lastChronoDoubleIndex = index;
            const currentTotal = calcStat(player.arm);
            player.chronoArmorBonus = (player.chronoArmorBonus || 0) + currentTotal;
            spawnFloatingNumber(state, player.x, player.y, "ARMOR DOUBLED!", '#60a5fa', true);
            playSfx('level');
        }
    }

    if (chronoLvl >= 4) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
        const startTime = chronoHex?.timeAtLevel?.[4] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const minutes = Math.floor(elapsed / 60);
        const m = getHexMultiplier(state, 'ChronoPlating');
        player.cooldownReduction = minutes * 0.0025 * m;
    } else {
        player.cooldownReduction = 0;
    }

    // Apply Regen
    player.curHp = Math.min(maxHp, player.curHp + regenAmount);
}
