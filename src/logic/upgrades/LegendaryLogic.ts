import type { GameState, LegendaryHex, LegendaryType, Player } from '../core/Types';
import { getUiTranslation } from '../../lib/uiTranslations';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { calcStat } from '../utils/MathUtils';
import { calculateMeteoriteEfficiency } from './EfficiencyLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { LEGENDARY_UPGRADES } from './LegendaryData';

export const ACTIVE_LEGENDARIES: string[] = ['DefPuddle', 'DefEpi', 'ComWave', 'XenoAlchemist', 'IrradiatedMire', 'NeuralSingularity', 'KineticTsunami', 'TemporalMonolith', 'GravitationalHarvest', 'GravityAnchor'];

export function getLegendaryPerksArray(type: string, level: number, state?: GameState, hex?: LegendaryHex, returnAll?: boolean): string[] | string[][] {
    const getSouls = (lvl: number) => {
        if (!state || !hex || !hex.killsAtLevel) return null;
        const startKills = hex.killsAtLevel[lvl] ?? hex.killsAtAcquisition;
        return Math.max(0, state.killCount - startKills);
    };

    const lang = getStoredLanguage();
    const t = getUiTranslation(lang);
    const perks = t.legendaries.perks as any;
    const list = perks[type];
    if (!list) return [];

    const formatPerk = (p: string, lvl: number) => {
        let soulLvl = lvl;

        if (type === 'XenoAlchemist' || type === 'NeuralSingularity' || type === 'IrradiatedMire' || type === 'KineticTsunami' || type === 'SoulShatterCore' || type === 'BloodForgedCapacitor' || type === 'GravityAnchor' || type === 'TemporalMonolith' || type === 'NeutronStar' || type === 'GravitationalHarvest' || type === 'ShatteredCapacitor' || type === 'ChronoDevourer') {
            for (const key of Object.keys(perks)) {
                if (key === type) continue;
                const arr = perks[key];
                if (Array.isArray(arr)) {
                    const flat = arr.flat();
                    const foundIdx = flat.indexOf(p);
                    if (foundIdx !== -1) {
                        soulLvl = foundIdx + 1;
                        break;
                    }
                }
            }
        }

        const souls = getSouls(soulLvl);
        const isNewFusionPerk = (type === 'NeuralSingularity' && (p.toLowerCase().includes('fear') || p.toLowerCase().includes('cooldown') || p.toLowerCase().includes('страх') || p.toLowerCase().includes('перезарядк'))) ||
            (type === 'TemporalMonolith' && (p.toLowerCase().includes('frozen') || p.toLowerCase().includes('заморозк') || p.toLowerCase().includes('damage received') || p.toLowerCase().includes('снижения перезарядки'))) ||
            (type === 'NeutronStar' && (p.toLowerCase().includes('horizon') || p.toLowerCase().includes('aura') || p.toLowerCase().includes('essence syphon') || p.toLowerCase().includes('аура'))) ||
            (type === 'GravitationalHarvest' && (p.toLowerCase().includes('duration extension') || p.toLowerCase().includes('reflected') || p.toLowerCase().includes('продление') || p.toLowerCase().includes('отражает'))) ||
            (type === 'ShatteredCapacitor' && (p.toLowerCase().includes('arcs a kinetic') || p.toLowerCase().includes('armor dmg as bleed') || p.toLowerCase().includes('рикошетит кинетический') || p.toLowerCase().includes('кровотечение'))) ||
            (type === 'ChronoDevourer' && (p.toLowerCase().includes('explode all shields') || p.toLowerCase().includes('cooldown decrease') || p.toLowerCase().includes('chance for zombies') || p.toLowerCase().includes('взрывает все щиты') || p.toLowerCase().includes('шанс зомби') || p.toLowerCase().includes('ускорение перезарядки'))) ||
            (type === 'GravityAnchor' && (p.toLowerCase().includes('explosive') || p.toLowerCase().includes('armor') || p.toLowerCase().includes('брони') || p.toLowerCase().includes('взрываются')));

        if (type === 'SoulShatterCore') {
            if (p.includes('+5% Crit DMG') || p.includes('+5% Крит Урона')) {
                const ecoKills = (hex as any).ecoKillsAtLevel as Record<number, number> | undefined;
                let totalSouls = 0;
                if (ecoKills && state) {
                    [1, 2, 3, 4].forEach(lvl => {
                        const start = ecoKills[lvl];
                        if (start !== undefined) {
                            totalSouls += Math.max(0, state.killCount - start);
                        }
                    });
                }
                return `${p} (${totalSouls} total souls)`;
            }
        }

        if (type === 'NeutronStar') {
            if (p.toLowerCase().includes('100 max hp')) {
                const maxHp = calcStat(state?.player.hp || { base: 100, flat: 0, mult: 1 }, state?.hpRegenBuffMult || 1.0);
                const count100 = Math.floor(maxHp / 100);
                const actualBoost = count100 * 2;
                return `${p} (+${actualBoost.toFixed(0)}% actual)`;
            }
            if (p.toLowerCase().includes('0.01%')) {
                const kills = state?.player.neutronStarAuraKills || 0;
                return `${p} (${kills} kills)`;
            }
        }

        if (p.includes('0.25% Cooldown reduction every minute') || p.includes('0.25% перезарядки каждую минуту')) {
            const chronoHex = state?.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating' || h?.type === 'TemporalMonolith' || h?.type === 'ChronoDevourer');
            if (chronoHex?.timeAtLevel && chronoHex.timeAtLevel[3] !== undefined) {
                const diffSeconds = (state?.gameTime || 0) - chronoHex.timeAtLevel[3];
                const minutes = Math.floor(diffSeconds / 60);
                const mult = state ? getHexMultiplier(state, chronoHex.type) : 1;
                const accumulated = minutes * 0.25 * mult;
                return `${p} (${accumulated.toFixed(2)}% total)`;
            }
        }

        if ((type === 'ChronoPlating' || type === 'TemporalMonolith' || type === 'ChronoDevourer') && (p.includes('1% of your Armor') || p.includes('1% от твоей Брони'))) {
            const totalArmor = state ? calcStat(state.player.arm) : 0;
            const mult = state ? getHexMultiplier(state, type) : 1;
            const bonus = totalArmor * 0.01 * mult;
            return `${p} (+${bonus.toFixed(1)}% actual)`;
        }

        if (p.includes('CD)') || p.includes('КД)')) {
            const cdMatch = p.match(/(\d+)s CD/i) || p.match(/(\d+)с КД/i);
            if (cdMatch && state) {
                const baseCd = parseInt(cdMatch[1]);
                const cdMod = (1 - (state.player.cooldownReduction || 0));
                const actualCd = baseCd * cdMod;
                if (actualCd < baseCd - 0.05) {
                    return `${p} (${actualCd.toFixed(1)}s actual)`;
                }
            }
        }

        if (souls !== null && !isNewFusionPerk && (p.toLowerCase().includes("kill") || p.toLowerCase().includes("убий") || p.includes("Resist"))) {
            return `${p} (${souls} Souls)`;
        }
        return p;
    };

    const formattedList = list.map((perk: any, idx: number) => {
        const pArr = Array.isArray(perk) ? perk : [perk];
        return pArr.map((p: string) => formatPerk(p, idx + 1));
    });

    if (returnAll) {
        return formattedList;
    }

    if (type === 'XenoAlchemist' || type === 'IrradiatedMire' || type === 'NeuralSingularity' || type === 'KineticTsunami' || type === 'SoulShatterCore' || type === 'BloodForgedCapacitor' || type === 'GravityAnchor' || type === 'TemporalMonolith' || type === 'NeutronStar' || type === 'GravitationalHarvest' || type === 'ShatteredCapacitor' || type === 'ChronoDevourer') {
        return formattedList.flat();
    }

    return formattedList.slice(0, level).flat();
}

export function getLegendaryPerkDesc(type: string, level: number, state?: GameState, hex?: LegendaryHex): string {
    const list = getLegendaryPerksArray(type, level, state, hex);
    return list.join("\n");
}

export function getLegendaryOptions(state: GameState): LegendaryHex[] {
    let pool: (keyof typeof LEGENDARY_UPGRADES)[] = ['EcoDMG', 'EcoXP', 'EcoHP'];

    if (state.currentArena === 0) {
        pool = ['CombShield', 'EcoDMG', 'EcoXP', 'EcoHP'];
    }

    if (state.currentArena === 1) {
        pool = ['RadiationCore', 'ComLife', 'ComCrit', 'ComWave'];
    }

    if (state.currentArena === 2) {
        pool = ['KineticBattery', 'DefPuddle', 'DefEpi', 'ChronoPlating'];
    }

    pool = pool.filter(typeKey => {
        if (state.player.consumedLegendaries?.includes(typeKey)) return false;
        const existingInfo = state.moduleSockets.hexagons.find(h => h?.type === typeKey);
        if (existingInfo && existingInfo.level >= 4) return false;
        return true;
    });

    const lang = getStoredLanguage();
    const t = getUiTranslation(lang);
    return pool.map(typeKey => {
        const base = LEGENDARY_UPGRADES[typeKey];
        const existing = state.moduleSockets.hexagons.find(h => h?.type === base.type);

        const level = existing ? Math.min(4, existing.level + 1) : 1;
        const killsAtAcquisition = existing ? existing.killsAtAcquisition : state.killCount;
        const timeAtAcquisition = existing ? existing.timeAtAcquisition : state.gameTime;

        const killsAtLevel = existing ? { ...existing.killsAtLevel } : {};
        if (!killsAtLevel[level]) {
            killsAtLevel[level] = state.killCount;
        }

        const timeAtLevel = existing ? { ...existing.timeAtLevel } : {};
        if (!timeAtLevel[level]) {
            timeAtLevel[level] = state.gameTime;
        }

        const legendData = (t.legendaries as any)[base.type];

        return {
            ...base,
            name: legendData?.name || base.name,
            description: legendData?.desc || base.description,
            level,
            killsAtAcquisition,
            timeAtAcquisition,
            killsAtLevel,
            timeAtLevel,
            desc: getLegendaryPerkDesc(base.type, level, state, undefined),
            perks: getLegendaryPerksArray(base.type, level, state, undefined) as string[],
            allPerks: getLegendaryPerksArray(base.type, level, state, undefined, true) as string[][]
        };
    });
}

export function syncLegendaryHex(state: GameState, hex: LegendaryHex) {
    const lang = getStoredLanguage();
    const t = getUiTranslation(lang);
    const legendData = (t.legendaries as any)[hex.type];
    if (legendData) {
        hex.name = legendData.name;
        hex.description = legendData.desc;
    }
    hex.desc = getLegendaryPerkDesc(hex.type, hex.level, state, hex);
    hex.perks = getLegendaryPerksArray(hex.type, hex.level, state, hex) as string[];
    hex.allPerks = getLegendaryPerksArray(hex.type, hex.level, state, hex, true) as string[][];
}

export function syncAllLegendaries(state: GameState) {
    state.moduleSockets.hexagons.forEach(hex => {
        if (hex) syncLegendaryHex(state, hex);
    });
}

export function applyLegendarySelection(state: GameState, selection: LegendaryHex) {
    const existingIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === selection.type);

    if (existingIdx !== -1) {
        const existing = state.moduleSockets.hexagons[existingIdx]!;
        existing.level = selection.level;

        if (!existing.killsAtLevel) existing.killsAtLevel = {};
        existing.killsAtLevel[existing.level] = state.killCount;

        if (!existing.timeAtLevel) existing.timeAtLevel = {};
        existing.timeAtLevel[existing.level] = state.gameTime;

        syncLegendaryHex(state, existing);
        state.pendingLegendaryHex = null;
        state.showLegendarySelection = false;
        state.isPaused = false;
    } else {
        if (!selection.killsAtLevel) selection.killsAtLevel = {};
        selection.killsAtLevel[1] = state.killCount;

        if (!selection.timeAtLevel) selection.timeAtLevel = {};
        selection.timeAtLevel[1] = state.gameTime;

        if (selection.timeAtAcquisition === undefined) selection.timeAtAcquisition = state.gameTime;

        syncLegendaryHex(state, selection);
        state.pendingLegendaryHex = selection;
        if (!state.pendingLegendaryHex.statBonuses) state.pendingLegendaryHex.statBonuses = {};
        state.showLegendarySelection = false;
        state.showModuleMenu = true;
        state.isPaused = true;

        if (ACTIVE_LEGENDARIES.includes(selection.type)) {
            const hasSkill = state.player.activeSkills.some(s => s.type === selection.type);
            if (!hasSkill) {
                const usedKeys = state.player.activeSkills.map(s => s.keyBind);
                const availableKeys = ['1', '2', '3', '4', '5', '6'];
                const key = availableKeys.find(k => !usedKeys.includes(k));

                if (key) {
                    let baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
                    if (selection.type === 'DefPuddle') baseCD = GAME_CONFIG.SKILLS.PUDDLE_COOLDOWN;
                    if (selection.type === 'DefEpi') baseCD = GAME_CONFIG.SKILLS.EPI_COOLDOWN;
                    if (selection.type === 'KineticBattery') baseCD = GAME_CONFIG.SKILLS.KINETIC_ZAP_COOLDOWN;
                    if (selection.type === 'ComWave') baseCD = (selection.level >= 4 ? GAME_CONFIG.SKILLS.WAVE_COOLDOWN_LVL4 : GAME_CONFIG.SKILLS.WAVE_COOLDOWN);
                    if (selection.type === 'TemporalMonolith') baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
                    if (selection.type === 'GravitationalHarvest' || selection.type === 'GravityAnchor') baseCD = GAME_CONFIG.SKILLS.EPI_COOLDOWN;
                    if (selection.type === 'ChronoDevourer') baseCD = GAME_CONFIG.SKILLS.CHRONO_DEVOURER_COOLDOWN;

                    state.player.activeSkills.push({
                        type: selection.type,
                        baseCD,
                        lastUsed: -999999,
                        inUse: false,
                        keyBind: key,
                        icon: selection.customIcon
                    });
                }
            }
        }

        if (selection.type === 'KineticBattery' && selection.level >= 2) {
            state.player.kineticShieldTimer = 0;
        }
    }
}

export function getHexLevel(state: GameState, type: LegendaryType): number {
    const hex = state.moduleSockets.hexagons.find(h => h?.type === type);
    if (hex) return hex.level;
    if (type === 'EcoXP' || type === 'DefPuddle') {
        const alchemist = state.moduleSockets.hexagons.find(h => h?.type === 'XenoAlchemist');
        if (alchemist) return 5;
    }
    if (type === 'DefPuddle' || type === 'RadiationCore') {
        const mire = state.moduleSockets.hexagons.find(h => h?.type === 'IrradiatedMire');
        if (mire) return 5;
    }
    if (type === 'EcoXP' || type === 'ComWave') {
        const sing = state.moduleSockets.hexagons.find(h => h?.type === 'NeuralSingularity');
        if (sing) return 5;
    }
    if (type === 'EcoDMG' || type === 'ComWave') {
        const tsunami = state.moduleSockets.hexagons.find(h => h?.type === 'KineticTsunami');
        if (tsunami) return 5;
    }
    if (type === 'ComCrit' || type === 'EcoDMG') {
        const shatter = state.moduleSockets.hexagons.find(h => h?.type === 'SoulShatterCore');
        if (shatter) return 5;
    }
    if (type === 'ComCrit' || type === 'KineticBattery') {
        const shattered = state.moduleSockets.hexagons.find(h => h?.type === 'ShatteredCapacitor');
        if (shattered) return 5;
    }
    if (type === 'ComLife' || type === 'ChronoPlating') {
        const blood = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoDevourer');
        if (blood) return 5;
    }
    if (type === 'DefEpi' || type === 'CombShield') {
        const gravity = state.moduleSockets.hexagons.find(h => h?.type === 'GravityAnchor');
        if (gravity) return 5;
    }
    if (type === 'ChronoPlating' || type === 'CombShield') {
        const monolith = state.moduleSockets.hexagons.find(h => h?.type === 'TemporalMonolith');
        if (monolith) return 5;
    }
    if (type === 'ComLife' || type === 'KineticBattery') {
        const blood = state.moduleSockets.hexagons.find(h => h?.type === 'BloodForgedCapacitor');
        if (blood) return 5;
    }
    if (type === 'EcoHP' || type === 'RadiationCore') {
        const neutron = state.moduleSockets.hexagons.find(h => h?.type === 'NeutronStar');
        if (neutron) return 5;
    }
    if (type === 'EcoHP' || type === 'DefEpi') {
        const harvest = state.moduleSockets.hexagons.find(h => h?.type === 'GravitationalHarvest');
        if (harvest) return 5;
    }
    if (type === 'ComCrit' || type === 'KineticBattery') {
        const shattered = state.moduleSockets.hexagons.find(h => h?.type === 'ShatteredCapacitor');
        if (shattered) return 5;
    }
    return 0;
}

export function getHexMultiplier(state: GameState, type: LegendaryType): number {
    const hexIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === type);
    if (hexIdx === -1) return 1.0;

    const connectedDiamondIdxs = [
        hexIdx,
        (hexIdx + 5) % 6,
        hexIdx + 6,
        ((hexIdx + 5) % 6) + 6
    ];

    let hexEfficiency = 0;
    connectedDiamondIdxs.forEach(dIdx => {
        const result = calculateMeteoriteEfficiency(state, dIdx);
        hexEfficiency += result.totalBoost;
    });

    return 1 + hexEfficiency;
}

export function recordLegendarySouls(state: GameState, souls: number) {
}

export function calculateLegendaryBonus(state: GameState, statKey: string, skipMultiplier: boolean = false, overridePlayer?: Player): number {
    const player = overridePlayer || state.player;
    let total = 0;
    state.moduleSockets.hexagons.forEach((hex) => {
        if (!hex) return;

        const multiplier = skipMultiplier ? 1.0 : getHexMultiplier(state, hex.type);
        const kl = hex.killsAtLevel || { [1]: hex.killsAtAcquisition };

        const getSoulsSinceLevel = (lvl: number) => {
            if (hex.level < lvl) return 0;
            const startKills = kl[lvl] ?? hex.killsAtAcquisition ?? state.killCount;
            const rawSouls = Math.max(0, state.killCount - startKills);
            const soulBonus = rawSouls * (player.soulDrainMult ?? 1.0);
            return soulBonus * multiplier;
        };

        if (hex.type === 'EcoDMG' || hex.type === 'KineticTsunami' || hex.type === 'SoulShatterCore') {
            if (statKey === 'dmg_per_kill') total += getSoulsSinceLevel(1) * 0.05;
            if (statKey === 'ats_per_kill') total += getSoulsSinceLevel(2) * 0.02;
            if (statKey === 'dmg_pct_per_kill') total += getSoulsSinceLevel(3) * 0.05;
            if (statKey === 'aoe_chance_per_kill') {
                if (hex.level >= 4) {
                    total += player.level * 0.5 * multiplier;
                }
            }
        }

        if (hex.type === 'SoulShatterCore') {
            const ecoKills = (hex as any).ecoKillsAtLevel as Record<number, number> | undefined;
            let souls = 0;
            if (ecoKills) {
                [1, 2, 3, 4].forEach(lvl => {
                    const start = ecoKills[lvl];
                    if (start !== undefined) {
                        souls += Math.max(0, state.killCount - start) * (player.soulDrainMult ?? 1.0);
                    }
                });
            } else {
                souls = getSoulsSinceLevel(1);
            }
            const mult = skipMultiplier ? 1.0 : getHexMultiplier(state, hex.type);
            if (statKey === 'crit_chance_scaling') total += Math.floor(souls / 500) * 1 * mult;
            if (statKey === 'crit_dmg_scaling') total += Math.floor(souls / 500) * 5 * mult;
        }

        if (hex.type === 'EcoXP' || hex.type === 'XenoAlchemist' || hex.type === 'NeuralSingularity') {
            if (statKey === 'xp_per_kill') total += getSoulsSinceLevel(1) * 0.05;
            if (statKey === 'dust_extraction') {
                total += getSoulsSinceLevel(2) * 0.02;
            }
            if (statKey === 'flux_per_kill') total += getSoulsSinceLevel(3) * 0.05;
            if (statKey === 'xp_pct_per_kill') total += getSoulsSinceLevel(4) * 0.05;
        }

        if (hex.type === 'EcoHP' || hex.type === 'NeutronStar' || hex.type === 'GravitationalHarvest') {
            const multi = (hex.type === 'NeutronStar' || hex.type === 'GravitationalHarvest') ? 2.0 : 1.0;
            if (statKey === 'hp_per_kill') total += getSoulsSinceLevel(1) * 0.05 * multi;
            if (statKey === 'reg_per_kill') total += getSoulsSinceLevel(2) * 0.02 * multi;
            if (statKey === 'hp_pct_per_kill') total += getSoulsSinceLevel(3) * 0.05 * multi;
            if (statKey === 'reg_pct_per_kill') {
                total += getSoulsSinceLevel(4) * 0.02 * multi;
            }
        }

        if (hex.type === 'CombShield') {
            if (statKey === 'arm_per_kill') total += getSoulsSinceLevel(1) * 0.05;
            if (statKey === 'col_red_per_kill') total += getSoulsSinceLevel(2) * 0.01;
            if (statKey === 'proj_red_per_kill') total += getSoulsSinceLevel(3) * 0.01;
            if (statKey === 'arm_pct_per_kill') total += getSoulsSinceLevel(4) * 0.02;
        }

        if (hex.type === 'ComLife') {
            if (statKey === 'lifesteal' && hex.level >= 1) total += 3 * multiplier;
        }

        if (hex.type === 'KineticBattery') {
            if (statKey === 'arm_pct_conditional' && hex.level >= 3) {
                const maxHp = calcStat(player.hp, (state as any).hpRegenBuffMult);
                if (player.curHp < maxHp * 0.5) {
                    total += 100 * multiplier;
                }
            }
        }

        if (hex.type === 'RadiationCore' || hex.type === 'IrradiatedMire' || hex.type === 'NeutronStar') {
            if (statKey === 'aura_dmg_missing_hp' && hex.level >= 3) {
                const missing = 1 - (player.curHp / Math.max(1, (player.hp as any).flat + (player.hp as any).base));
                const pctMissing = Math.max(0, missing * 100);
                total += pctMissing * 0.01 * multiplier;
            }
        }

        if (hex.type === 'ChronoPlating') {
            const totalArmor = calcStat(player.arm);

            if (hex.level >= 1 && statKey === 'dmg_pct_per_kill') {
                total += totalArmor * 0.01 * multiplier;
            }
            if (hex.level >= 2 && statKey === 'hp_pct_per_kill') {
                total += totalArmor * 0.01 * multiplier;
            }
            if (hex.level >= 4 && statKey === 'reg_pct_per_kill') {
                total += totalArmor * 0.01 * multiplier;
            }
        }
    });

    return total;
}
