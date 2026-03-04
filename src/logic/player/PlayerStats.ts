
import type { GameState } from '../core/types';
import { calcStat } from '../utils/MathUtils';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';

export function updatePlayerStats(state: GameState, overridePlayer?: any) {
    const player = overridePlayer || state.player;
    const curseMult = state.assistant.history.curseIntensity || 1.0;

    // Calculate and assign Hex bonuses to player stats for this frame
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

    // --- LEGENDARY HEX LOGIC ---

    // TOXIC SWAMP (DefPuddle - Defense)
    // Moved up to apply stats before calculation
    if (player.buffs?.puddleRegen) {
        player.reg.hexMult = (player.reg.hexMult || 0) + 25; // +25% Regen
        player.hp.hexMult = (player.hp.hexMult || 0) + 25;   // +25% Max HP
    }

    // XENO-ALCHEMIST: 300% XP Stat Feedback
    (player as any).inRefineryZone = false;
    const alchemist = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
    if (alchemist) {
        const playerInPuddle = state.areaEffects.some(ae =>
            ae.type === 'puddle' &&
            Math.hypot(ae.x - player.x, ae.y - player.y) < ae.radius
        );
        if (playerInPuddle) {
            (player as any).inRefineryZone = true;
        }
    }

    // ARENA BUFFS
    const currentArenaLevel = state.arenaLevels[state.currentArena] || 0;
    const isSurging = isBuffActive(state, 'ARENA_SURGE');

    const baseBuffAmount = 0.3; // 30% Base Buff
    const baseMult = 1 + baseBuffAmount; // 1.3x
    const surgedMult = 1 + (baseBuffAmount * 2.0); // 1.6x (Surge doubles the 30% bonus to 60%)

    const activeArenaMult = isSurging ? surgedMult : baseMult;

    state.hpRegenBuffMult = (state.currentArena === 2 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;
    state.dmgAtkBuffMult = (state.currentArena === 1 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;

    // XP & Soul Yield is an Arena Buff -> Boosted by Surge
    state.xpSoulBuffMult = (state.currentArena === 0 && currentArenaLevel >= 1) ? activeArenaMult : 1.0;

    // Meteorite Drop Rate is NOT an Arena Buff (it's a Player Stat) -> Never boosted by Surge
    state.meteoriteRateBuffMult = (state.currentArena === 0 && currentArenaLevel >= 1) ? baseMult : 1.0;

    // Movement stat
    player.speed = calcStat(player.spd, 1.0, curseMult);
    if (player.buffs?.waveSpeed && state.gameTime < player.buffs.waveSpeed) {
        player.speed *= 1.03;
    }

    const maxHp = calcStat(player.hp, state.hpRegenBuffMult, curseMult);
    let regenAmount = (calcStat(player.reg, state.hpRegenBuffMult, curseMult) / 60);

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
        if (kinLvl >= 4) {
            // Updated Lvl 4: CD Reduction per minute
            const kinHex = state.moduleSockets.hexagons.find(h => h?.type === 'KineticBattery');
            const startTime = kinHex?.timeAtLevel?.[4] ?? state.gameTime;
            const elapsed = state.gameTime - startTime;
            const minutes = Math.floor(elapsed / 60);
            const mult = kinHex ? getHexMultiplier(state, kinHex.type) : 1;
            // 0.25% per minute * multiplier
            player.cooldownReduction += minutes * 0.0025 * mult;
        }
    }

    // CHRONO PLATING (Defensive - Arena 2) / TEMPORAL MONOLITH Inherited
    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    const monolithIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'TemporalMonolith');
    if (chronoLvl >= 3 || monolithIdx !== -1) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating' || h?.type === 'TemporalMonolith');
        const startTime = chronoHex?.timeAtLevel?.[3] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const minutes = Math.floor(elapsed / 60);
        const mult = chronoHex ? getHexMultiplier(state, chronoHex.type) : 1;
        // 0.25% per minute * efficiency multiplier
        player.cooldownReduction += minutes * 0.0025 * mult;
    }

    // Apply Regen
    if (player.healingDisabled) {
        regenAmount = 0;
    }
    player.curHp = Math.min(maxHp, player.curHp + regenAmount);
}
