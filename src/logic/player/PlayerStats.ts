
import type { GameState } from '../core/types';
import { calcStat } from '../utils/MathUtils';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';

export function updatePlayerStats(state: GameState, overridePlayer?: any) {
    const player = overridePlayer || state.player;

    // Calculate and assign Hex bonuses to player stats for this frame
    player.hp.hexFlat = calculateLegendaryBonus(state, 'hp_per_kill');
    player.hp.hexMult = calculateLegendaryBonus(state, 'hp_pct_per_kill');
    player.hp.hexMult2 = 0;

    player.reg.hexFlat = calculateLegendaryBonus(state, 'reg_per_kill');
    player.reg.hexMult = calculateLegendaryBonus(state, 'reg_pct_per_kill');
    player.reg.hexMult2 = 0;

    player.arm.hexFlat = calculateLegendaryBonus(state, 'arm_per_kill') + (player.chronoArmorBonus || 0);
    player.arm.hexMult = calculateLegendaryBonus(state, 'arm_pct_per_kill');
    player.arm.hexMult2 = calculateLegendaryBonus(state, 'arm_pct_conditional');

    player.dmg.hexFlat = calculateLegendaryBonus(state, 'dmg_per_kill');
    player.dmg.hexMult = calculateLegendaryBonus(state, 'dmg_pct_per_kill') + calculateLegendaryBonus(state, 'dmg_pct_per_hp');
    player.dmg.hexMult2 = 0;

    player.atk.hexFlat = calculateLegendaryBonus(state, 'ats_per_kill');
    player.atk.hexMult = calculateLegendaryBonus(state, 'ats_pct_per_kill');
    player.atk.hexMult2 = 0;
    player.cooldownReduction = 0;

    // --- LEGENDARY HEX LOGIC ---

    // TOXIC SWAMP (DefPuddle - Defense)
    // Moved up to apply stats before calculation
    if (player.buffs?.puddleRegen) {
        player.reg.hexMult = (player.reg.hexMult || 0) + 25; // +25% Regen
        player.hp.hexMult = (player.hp.hexMult || 0) + 25;   // +25% Max HP
    }

    // ARENA BUFFS
    const currentArenaLevel = state.arenaLevels[state.currentArena] || 0;
    const surgeMult = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
    const baseBuff = 0.3; // 30% Base Buff
    const activeBuff = 1 + (baseBuff * surgeMult);

    state.hpRegenBuffMult = (state.currentArena === 2 && currentArenaLevel >= 1) ? activeBuff : 1.0;
    state.dmgAtkBuffMult = (state.currentArena === 1 && currentArenaLevel >= 1) ? activeBuff : 1.0;
    state.xpSoulBuffMult = (state.currentArena === 0 && currentArenaLevel >= 1) ? activeBuff : 1.0;

    // Movement stat
    const maxHp = calcStat(player.hp, state.hpRegenBuffMult);
    let regenAmount = (calcStat(player.reg, state.hpRegenBuffMult) / 60);

    if (player.buffs?.systemSurge && state.gameTime < player.buffs.systemSurge.end) {
        const surge = player.buffs.systemSurge;
        player.atk.hexMult = (player.atk.hexMult || 0) + surge.atk;
    }

    // KINETIC BATTERY (Defense - Arena 2)
    const kinLvl = getHexLevel(state, 'KineticBattery');
    if (kinLvl >= 1) {
        if (kinLvl >= 2) {
            // Updated Lvl 2: Shield = 100% Armor (from 500%)
            if (!player.kineticShieldTimer || state.gameTime >= player.kineticShieldTimer) {
                const totalArmor = calcStat(player.arm);
                const shieldAmount = totalArmor * 1.0;
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
            // Updated Lvl 4: CD Reduction per minute
            const kinHex = state.moduleSockets.hexagons.find(h => h?.type === 'KineticBattery');
            const startTime = kinHex?.timeAtLevel?.[4] ?? state.gameTime;
            const elapsed = state.gameTime - startTime;
            const minutes = Math.floor(elapsed / 60);
            // 0.25% per minute
            player.cooldownReduction = minutes * 0.0025;
        } else {
            if (!player.cooldownReduction) player.cooldownReduction = 0;
            // Note: If Chrono also sets this, we need to be careful not to overwrite if they stack.
            // Currently logic assumed one or the other. Let's make it additive if needed, but for now we set it.
            // Actually, let's init it to 0 at start of update function if we want to be safe, but updatePlayerStats assumes it's building up.
            // For safety: Logic below for Chrono might overwrite if we are not careful.
            // Let's use a temporary accumulator or just let them overwrite if mutually exclusive (they are different legendary hexes, can have both).
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
        // Updated Lvl 4: HP Regen increased by 0.5% OF ARMOR
        const totalArmor = calcStat(player.arm);
        const bonusRegen = totalArmor * 0.005;
        // Apply directly to regen calculation logic?
        // We need to add it to 'player.reg.flat' or similar for this frame.
        // Or just add to 'regenAmount'.
        regenAmount += (bonusRegen / 60);
    }

    // Apply Regen
    player.curHp = Math.min(maxHp, player.curHp + regenAmount);
}
