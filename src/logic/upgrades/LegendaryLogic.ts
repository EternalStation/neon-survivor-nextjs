import type { GameState, LegendaryHex, LegendaryType, Player } from '../core/types';
import { ARENA_CENTERS } from '../mission/MapLogic';
import { getUiTranslation } from '../../lib/uiTranslations';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { calcStat } from '../utils/MathUtils';
import { calculateMeteoriteEfficiency } from './EfficiencyLogic';

export const LEGENDARY_UPGRADES: Record<string, LegendaryHex> = {
    EcoDMG: {
        id: 'eco_dmg',
        name: 'STORM OF STEEL',
        desc: '+1 DMG per kill',
        description: 'System-integrated kinetic resonators that convert combat data into localized weapon enhancements.',
        lore: 'A forgotten prototype from the Solar Wars, the Storm of Steel harvests the kinetic energy of fallen foes to calibrate your weapon arrays for higher density impacts.',
        category: 'Economic',
        type: 'EcoDMG',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/EcoDMG.png'
    },
    EcoXP: {
        id: 'eco_xp',
        name: 'NEURAL HARVEST',
        desc: '+1 XP per kill',
        description: 'Bio-mechanical neural links that extract high-fidelity tactical data during enemy neutralization.',
        lore: 'The Neural Harvest protocol was designed for rapid AI training in hostile sectors, leaching every bit of processed data from destroyed units to accelerate evolution.',
        category: 'Economic',
        type: 'EcoXP',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/EcoXP.png'
    },
    EcoHP: {
        id: 'eco_hp',
        name: 'ESSENCE SYPHON',
        desc: '+1 Max HP per kill',
        description: 'Nano-molecular reconstructors that repurpose organic matter from fallen targets into defensive plating.',
        lore: 'Life in the void is scarce; the Essence Syphon ensures nothing is wasted, stitching the remains of your enemies directly into your hull to bolster your survival.',
        category: 'Economic',
        type: 'EcoHP',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/EcoHP.png'
    },
    ComLife: {
        id: 'com_life',
        name: 'CRIMSON FEAST',
        desc: '+3% Lifesteal',
        description: 'Advanced parasitic protocols that bleed energy from enemy hulls to fuel internal repair systems.',
        lore: 'The Feast is a relentless hunger. As you strike, your siphons burrow deep, carrying back the vital energy needed to keep your systems operational even under heavy fire.',
        category: 'Combat',
        type: 'ComLife',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/ComLife.png'
    },
    ComCrit: {
        id: 'com_crit',
        name: 'SHATTERED FATE',
        desc: '+15% Crit Chance',
        description: 'Quantum-synchronized targeting sensors that identify and exploit structural weaknesses in real-time.',
        lore: 'Fate is calculated, not random. These sensors scan for the exact micro-second of vulnerability, allowing your munitions to tear through the toughest armor like glass.',
        category: 'Combat',
        type: 'ComCrit',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/ComCrit.png'
    },
    ComWave: {
        id: 'com_wave',
        name: 'TERROR PULSE',
        desc: 'Active: Sonic Shockwave',
        description: 'High-frequency sonic resonators that discharge a circular wave of psychological interference and physical force.',
        lore: 'The pulse doesn\'t just break hulls; it shatters morale. The oscillating waves resonate at frequencies that disrupt neural patterns, leaving enemies paralyzed with fear.',
        category: 'Combat',
        type: 'ComWave',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/ComWave.png'
    },
    DefPuddle: {
        id: 'def_puddle',
        name: 'TOXIC SWAMP',
        desc: 'Active: Spawn Toxic Puddle',
        description: 'Chemical dispersal system that saturates the region with corrosive, neuro-inhibiting compounds.',
        lore: 'The Toxic Swamp creates a localized dead-zone. Corrosive compounds melt through enemy shielding while neuro-toxins slow their movement to a crawl.',
        category: 'Defensive',
        type: 'DefPuddle',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefPuddle.png'
    },
    DefEpi: {
        id: 'def_epi',
        name: 'EPICENTER',
        desc: 'Active: Channel Spikes',
        description: 'Gravimetric stabilization unit that channels tectonic energy into localized crystalline spikes.',
        lore: 'Become the center of gravity. As the spikes emerge, the sheer force of the energy channel locks you in place but creates a sanctuary of total destruction around you.',
        category: 'Defensive',
        type: 'DefEpi',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefEpi.png'
    },
    CombShield: {
        id: 'comb_shield',
        name: 'AEGIS PROTOCOL',
        desc: '0.01% Resist per Kill',
        description: 'Adaptive plating algorithms that strengthen structural integrity based on combat data.',
        lore: 'The Aegis is a living shield. It learns from every hit taken and every enemy destroyed, reinforcing your chassis until it becomes an impenetrable fortress.',
        category: 'Economic',
        type: 'CombShield',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/EcoArmor.png'
    },
    KineticBattery: {
        id: 'kin_bat',
        name: 'KINETIC BATTERY',
        desc: 'Converts Armor to Shockwaves',
        description: 'Experimental capacitor bank that stores kinetic impact energy and releases it as devastating shockwaves.',
        lore: 'Why simply deflect a blow when you can catch it, amplify it, and send it back tenfold? The Kinetic Battery turns your defense into the ultimate offense.',
        category: 'Defensive',
        type: 'KineticBattery',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefBattery.png'
    },
    RadiationCore: {
        id: 'rad_core',
        name: 'RADIATION CORE',
        desc: 'Global Decay Aura',
        description: 'Unstable isotope reactor that emits a lethal 500px radiation aura. Damage intensity scales with proximity; the closer an enemy is to your core, the faster they decay.',
        lore: 'Harvested from a dying star, this core pulses with entropy. To stand near you is to age a thousand years in a second.',
        category: 'Combat',
        type: 'RadiationCore',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/ComRad.png'
    },
    ChronoPlating: {
        id: 'chrono_plate',
        name: 'CHRONO PLATING',
        desc: 'Time-Scaling Defense',
        description: 'Temporal alloy plating that hardening over time, becoming virtually indestructible the longer you survive.',
        lore: 'Forged outside of time, this armor doesn\'t just resist damage; it denies the very event of impact, rewriting history to keep you intact.',
        category: 'Defensive',
        type: 'ChronoPlating',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefChromo.png'
    },
    XenoAlchemist: {
        id: 'xeno_alchemist',
        name: 'THE XENO-ALCHEMIST',
        desc: 'Economic / Defensive Fusion',
        description: 'A volatile fusion of Neural Harvest and Toxic Swamp. Converts your defensive acid puddles into high-yield resource refineries.',
        lore: 'When the greed of the Neural Harvest met the toxicity of the Swamp, the Xeno-Alchemist was born. It doesn\'t just kill; it extracts every possible resource from the dissolving remains of its victims.',
        category: 'Fusion',
        categories: ['Economic', 'Defensive'],
        type: 'XenoAlchemist',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/XenoAlchemist.png'
    },
    IrradiatedMire: {
        id: 'irradiated_mire',
        name: 'THE IRRADIATED MIRE',
        desc: 'Combat / Defensive Fusion',
        description: 'A volatile fusion of Toxic Swamp and Radiation Core. Saturates the region with lethal isotopes and corrosive acids.',
        lore: 'The mire does not just dissolve flesh; it breaks down the very atoms of anything caught within its neon glow. A beautiful, glowing death sentence.',
        category: 'Fusion',
        categories: ['Combat', 'Defensive'],
        type: 'IrradiatedMire',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/IrradiatedMire.png'
    },
    NeuralSingularity: {
        id: 'neural_singularity',
        name: 'THE NEURAL SINGULARITY',
        desc: 'Economic / Combat Fusion',
        description: 'A mind-bending fusion of Neural Harvest and Terror Pulse. The pulse now ripples with psychic feedback, extending fear based on your enlightenment.',
        lore: 'The Singularity is not just a wave; it is a shared revelation. For a brief moment, the enemies feel the crushing weight of every experience you have ever gained. They do not just flee; they are paralyzed by the truth.',
        category: 'Fusion',
        categories: ['Economic', 'Combat'],
        type: 'NeuralSingularity',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/NeuralSingularity.png'
    },
    KineticTsunami: {
        id: 'kinetic_tsunami',
        name: 'THE KINETIC TSUNAMI',
        desc: 'Economic / Combat Fusion',
        description: 'A devastating fusion of Storm of Steel and Terror Pulse. Sonic avalanches harvest kinetic trauma to amplify your power.',
        lore: 'The shockwaves are no longer just fear; they are physical trauma. It harvests the kinetic energy of everything it shatters, fueling an endless storm of destruction.',
        category: 'Fusion',
        categories: ['Economic', 'Combat'],
        type: 'KineticTsunami',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/KineticTsunami.png'
    }
};

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

        if (type === 'XenoAlchemist' || type === 'NeuralSingularity' || type === 'IrradiatedMire' || type === 'KineticTsunami') {
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
        if (souls !== null && (p.toLowerCase().includes("kill") || p.toLowerCase().includes("убий") || p.includes("Resist"))) {
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

    if (type === 'XenoAlchemist' || type === 'IrradiatedMire' || type === 'NeuralSingularity' || type === 'KineticTsunami') {
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

    // Arena 0 (Economic / CombShield)
    if (state.currentArena === 0) {
        pool = ['CombShield', 'EcoDMG', 'EcoXP', 'EcoHP'];
        // Ensure CombShield is always an option if not maxed
    }

    // Arena 1 (Combat / Radiation)
    if (state.currentArena === 1) {
        pool = ['RadiationCore', 'ComLife', 'ComCrit', 'ComWave'];
    }

    // Arena 2 (Defense / Kinetic)
    if (state.currentArena === 2) {
        pool = ['KineticBattery', 'DefPuddle', 'DefEpi', 'ChronoPlating'];
    }

    const lang = getStoredLanguage();
    const t = getUiTranslation(lang);
    return pool.map(typeKey => {
        const base = LEGENDARY_UPGRADES[typeKey];
        const existing = state.moduleSockets.hexagons.find(h => h?.type === base.type);

        const level = existing ? Math.min(5, existing.level + 1) : 1;
        const killsAtAcquisition = existing ? existing.killsAtAcquisition : state.killCount;
        const timeAtAcquisition = existing ? existing.timeAtAcquisition : state.gameTime;

        // Pass existing killsAtLevel or create new one
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

const ACTIVE_LEGENDARIES: string[] = ['DefPuddle', 'DefEpi', 'ComWave'];

export function applyLegendarySelection(state: GameState, selection: LegendaryHex) {
    // Check if we already have this hex type
    const existingIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === selection.type);

    if (existingIdx !== -1) {
        // Just update the level of the existing one
        const existing = state.moduleSockets.hexagons[existingIdx]!;
        existing.level = selection.level;

        // Initialize killsAtLevel if missing
        if (!existing.killsAtLevel) existing.killsAtLevel = {};
        // Record starting killCount for this NEW level
        existing.killsAtLevel[existing.level] = state.killCount;

        // Initialize timeAtLevel
        if (!existing.timeAtLevel) existing.timeAtLevel = {};
        existing.timeAtLevel[existing.level] = state.gameTime;

        syncLegendaryHex(state, existing); // This ensures `perks`/`desc` are updated for the new level
        state.pendingLegendaryHex = null;
        state.showLegendarySelection = false;
        state.isPaused = false;
    } else {
        // Initial Acquisition
        if (!selection.killsAtLevel) selection.killsAtLevel = {};
        selection.killsAtLevel[1] = state.killCount;

        if (!selection.timeAtLevel) selection.timeAtLevel = {};
        selection.timeAtLevel[1] = state.gameTime;
        // Ensure acquisition time is set
        if (selection.timeAtAcquisition === undefined) selection.timeAtAcquisition = state.gameTime;

        syncLegendaryHex(state, selection);
        state.pendingLegendaryHex = selection;
        if (!state.pendingLegendaryHex.statBonuses) state.pendingLegendaryHex.statBonuses = {};
        state.showLegendarySelection = false;
        state.showModuleMenu = true;
        state.isPaused = true;

        // Handle Active Skills
        if (ACTIVE_LEGENDARIES.includes(selection.type)) {
            // Check if already in active skills (shouldn't be for new acquisition, but safety check)
            const hasSkill = state.player.activeSkills.some(s => s.type === selection.type);
            if (!hasSkill) {
                const usedKeys = state.player.activeSkills.map(s => s.keyBind);
                const availableKeys = ['1', '2', '3', '4', '5'];
                const key = availableKeys.find(k => !usedKeys.includes(k));

                if (key) {
                    let cd = 30000;
                    if (selection.type === 'DefPuddle') cd = 25000;
                    if (selection.type === 'DefEpi') cd = 30000;
                    if (selection.type === 'KineticBattery') cd = 5000;
                    if (selection.type === 'ComWave') cd = (selection.level >= 4 ? 20000 : 30000);

                    state.player.activeSkills.push({
                        type: selection.type,
                        cooldownMax: cd,
                        cooldown: 0,
                        inUse: false,
                        keyBind: key,
                        icon: selection.customIcon
                    });
                }
            }
        }

        // Kinetic Battery Level 2: Immediate Shield
        // Kinetic Battery Level 2+: Immediate Shield Refresh
        if (selection.type === 'KineticBattery' && selection.level >= 2) {
            state.player.kineticShieldTimer = 0;
        }
    }
}

export function getHexLevel(state: GameState, type: LegendaryType): number {
    const hex = state.moduleSockets.hexagons.find(h => h?.type === type);
    if (hex) return hex.level;
    // Xeno-Alchemist counts as Max Level for its parents
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
    return 0;
}

export function canMergeXenoAlchemist(state: GameState): boolean {
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP');
    const defPuddle = state.moduleSockets.hexagons.find(h => h?.type === 'DefPuddle');
    return (ecoXp?.level === 5 && defPuddle?.level === 5);
}

export function performXenoAlchemistMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoXP');
    const pudIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPuddle');

    if (ecoIdx === -1 || pudIdx === -1) return;

    // Inherit progress? Or just start fresh at Lvl 1 merged?
    // User said: "Inherits all 8 perks (Lvl 1-4) from both."
    // This implies it acts as a container for both.

    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.XenoAlchemist,
        level: 5, // Merged starts at Max Level to enable all perks
        killsAtAcquisition: state.killCount,
        timeAtAcquisition: state.gameTime,
        // Inherit kill history from EcoXP for soul-scaling perks
        killsAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {}
    };

    // Remove parents
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[pudIdx] = null;

    // Place merged (prefer eco slot)
    state.moduleSockets.hexagons[ecoIdx] = mergedHex;
    syncLegendaryHex(state, mergedHex);

    // Update active skills (remove puddle, add alchemist if needed - although logic might stay same)
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefPuddle');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'XenoAlchemist';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeIrradiatedMire(state: GameState): boolean {
    const puddle = state.moduleSockets.hexagons.find(h => h?.type === 'DefPuddle');
    const radCore = state.moduleSockets.hexagons.find(h => h?.type === 'RadiationCore');
    return (puddle?.level === 5 && radCore?.level === 5);
}

export function performIrradiatedMireMerge(state: GameState) {
    const pudIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPuddle');
    const radIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'RadiationCore');

    if (pudIdx === -1 || radIdx === -1) return;

    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.IrradiatedMire,
        level: 5,
        killsAtAcquisition: state.killCount,
        timeAtAcquisition: state.gameTime,
        killsAtLevel: {
            ...(state.moduleSockets.hexagons[radIdx]?.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(state.moduleSockets.hexagons[radIdx]?.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive']
    };

    // Remove parents
    state.moduleSockets.hexagons[pudIdx] = null;
    state.moduleSockets.hexagons[radIdx] = null;

    // Place merged (prefer radCore slot)
    state.moduleSockets.hexagons[radIdx] = mergedHex;
    syncLegendaryHex(state, mergedHex);

    // Update active skills (remove puddle, add mire if needed)
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefPuddle');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'IrradiatedMire';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeNeuralSingularity(state: GameState): boolean {
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP');
    const comWave = state.moduleSockets.hexagons.find(h => h?.type === 'ComWave');
    return (ecoXp?.level === 5 && comWave?.level === 5);
}

export function performNeuralSingularityMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoXP');
    const waveIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComWave');

    if (ecoIdx === -1 || waveIdx === -1) return;

    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.NeuralSingularity,
        level: 5,
        killsAtAcquisition: state.killCount,
        timeAtAcquisition: state.gameTime,
        killsAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Economic', 'Combat']
    };

    // Remove parents
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[waveIdx] = null;

    // Place merged (prefer wave slot)
    state.moduleSockets.hexagons[waveIdx] = mergedHex;
    syncLegendaryHex(state, mergedHex);

    // Update active skills (remove wave, add singularity if needed)
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'ComWave');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'NeuralSingularity';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeKineticTsunami(state: GameState): boolean {
    const ecoDmg = state.moduleSockets.hexagons.find(h => h?.type === 'EcoDMG');
    const comWave = state.moduleSockets.hexagons.find(h => h?.type === 'ComWave');
    return (ecoDmg?.level === 5 && comWave?.level === 5);
}

export function performKineticTsunamiMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoDMG');
    const waveIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComWave');

    if (ecoIdx === -1 || waveIdx === -1) return;

    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.KineticTsunami,
        level: 5,
        killsAtAcquisition: state.killCount,
        timeAtAcquisition: state.gameTime,
        killsAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Economic', 'Combat']
    };

    // Remove parents
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[waveIdx] = null;

    // Place merged (prefer wave slot)
    state.moduleSockets.hexagons[waveIdx] = mergedHex;
    syncLegendaryHex(state, mergedHex);

    // Update active skills (remove wave, add tsunami if needed)
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'ComWave' || s.type === 'NeuralSingularity');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'KineticTsunami';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }

    // Reset wave souls for CDR logic
    state.player.kineticTsunamiWaveSouls = 0;
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
    // Deprecated: Souls are now tracked via state.killCount
    // This function remains to avoid breaking signature if called elsewhere,
    // but the logic is now fully dynamic in calculateLegendaryBonus
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
            // Bugfix: Fallback to killsAtAcquisition if lvl record missing (prevents 0 bonus)
            const startKills = kl[lvl] ?? hex.killsAtAcquisition ?? state.killCount;
            // Use killCount directly as it accumulates souls
            const rawSouls = Math.max(0, state.killCount - startKills);
            const soulBonus = rawSouls * (player.soulDrainMult ?? 1.0);
            return soulBonus * multiplier; // Apply dynamic multiplier
        };

        if (hex.type === 'EcoDMG' || hex.type === 'KineticTsunami') {
            // Lvl 1: +0.1 DMG per kill
            if (statKey === 'dmg_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            // Lvl 2: +0.1 ATS per kill
            if (statKey === 'ats_per_kill') total += getSoulsSinceLevel(2) * 0.1;
            // Lvl 3: +0.05% DMG per kill
            if (statKey === 'dmg_pct_per_kill') total += getSoulsSinceLevel(3) * 0.05;
            // Lvl 4: +0.05% ATS per kill
            if (statKey === 'ats_pct_per_kill') total += getSoulsSinceLevel(4) * 0.05;
        }

        if (hex.type === 'EcoXP' || hex.type === 'XenoAlchemist' || hex.type === 'NeuralSingularity') {
            // Lvl 1: +0.1 XP per kill
            if (statKey === 'xp_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            // Lvl 2: Dust Extraction (Handled in DeathLogic)
            if (statKey === 'dust_extraction') {
                total += getSoulsSinceLevel(2) * 0.05;
            }
            // Lvl 3: +0.1 Flux per kill (Handled in DeathLogic)
            if (statKey === 'flux_per_kill') total += getSoulsSinceLevel(3) * 0.1;
            // Lvl 4: +0.1% XP per kill
            if (statKey === 'xp_pct_per_kill') total += getSoulsSinceLevel(4) * 0.1;
        }

        if (hex.type === 'EcoHP') {
            // Lvl 1: +0.1 Max HP per kill
            if (statKey === 'hp_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            // Lvl 2: +0.03 HP/sec per kill (Flat)
            if (statKey === 'reg_per_kill') total += getSoulsSinceLevel(2) * 0.03;
            // Lvl 3: +0.1% Max HP per kill
            if (statKey === 'hp_pct_per_kill') total += getSoulsSinceLevel(3) * 0.1;
            // Lvl 4: +0.03% HP/sec per kill (Percent Multiplier)
            if (statKey === 'reg_pct_per_kill') {
                total += getSoulsSinceLevel(4) * 0.03;
            }
        }

        if (hex.type === 'CombShield') {
            // Lvl 1: +0.01 Armor per kill
            if (statKey === 'arm_per_kill') total += getSoulsSinceLevel(1) * 0.01;
            // Lvl 2: +0.1% Collision DMG Red per kill
            if (statKey === 'col_red_per_kill') total += getSoulsSinceLevel(2) * 0.01;
            // Lvl 3: +0.01% Projectile DMG Red per kill
            if (statKey === 'proj_red_per_kill') total += getSoulsSinceLevel(3) * 0.01;
            // Lvl 4: +0.05% Armor per kill
            if (statKey === 'arm_pct_per_kill') total += getSoulsSinceLevel(4) * 0.05;
        }

        // --- Non-Stacking / Special Logic ---

        // ComLife Logic
        if (hex.type === 'ComLife') {
            if (statKey === 'lifesteal' && hex.level >= 1) total += 3 * multiplier;
        }

        // Kinetic Battery Logic
        if (hex.type === 'KineticBattery') {
            if (statKey === 'arm_pct_conditional' && hex.level >= 3) {
                const maxHp = calcStat(player.hp, state.hpRegenBuffMult);
                if (player.curHp < maxHp * 0.5) {
                    total += 100 * multiplier;
                }
            }
        }

        // Radiation Core Logic
        if (hex.type === 'RadiationCore' || hex.type === 'IrradiatedMire') {
            // Lvl 3: Aura damage increases by 1% for every 1% of missing HP
            if (statKey === 'aura_dmg_missing_hp' && hex.level >= 3) {
                const missing = 1 - (player.curHp / Math.max(1, player.hp.flat + player.hp.base));
                const pctMissing = Math.max(0, missing * 100);
                total += pctMissing * 0.01 * multiplier;
            }
        }

        // Chrono Plating Logic
        if (hex.type === 'ChronoPlating') {
            const totalArmor = calcStat(player.arm);
            const maxHp = calcStat(player.hp, state.hpRegenBuffMult);

            // Lvl 1: DMG% increased by 1% of your Armor
            if (hex.level >= 1 && statKey === 'dmg_pct_per_kill') {
                total += totalArmor * 0.01 * multiplier;
            }
            // Lvl 2: ATS% increases by 1% of your Health
            if (hex.level >= 2 && statKey === 'ats_pct_per_kill') {
                total += maxHp * 0.01 * multiplier;
            }
            // Lvl 3: Health% increased by 1% of your Armor
            if (hex.level >= 3 && statKey === 'hp_pct_per_kill') {
                total += totalArmor * 0.01 * multiplier;
            }
            // Lvl 4: Regen% increases by 0.5% of your Armor
            if (hex.level >= 4 && statKey === 'reg_pct_per_kill') {
                total += totalArmor * 0.005 * multiplier;
            }
        }
    });

    return total;
}
