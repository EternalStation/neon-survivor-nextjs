import type { GameState, LegendaryHex, LegendaryType } from '../core/types';
import { calcStat } from '../utils/MathUtils';

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
        desc: 'Sonic Wave on every 15th shot',
        description: 'High-frequency sonic resonators that discharge a wave of psychological interference and physical force.',
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
        desc: '0.1% Resist per Kill',
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
    }
};

export function getLegendaryPerksArray(type: string, level: number, state?: GameState, hex?: LegendaryHex, returnAll?: boolean): string[] | string[][] {
    const getSouls = (lvl: number) => {
        if (!state || !hex || !hex.killsAtLevel) return null;
        const startKills = hex.killsAtLevel[lvl] ?? hex.killsAtAcquisition;
        return Math.max(0, state.killCount - startKills);
    };

    const formatPerk = (p: string, lvl: number) => {
        const souls = getSouls(lvl);
        if (souls !== null && (p.toLowerCase().includes("kill") || p.includes("Resist"))) {
            return `${p} (${souls} Souls)`;
        }
        return p;
    };

    const perks: Record<string, string[][]> = {
        EcoDMG: [
            ["+0.1 DMG per kill"],
            ["+0.1 ATS per kill"],
            ["+0.1% DMG per kill"],
            ["+0.1% ATS per kill"],
            ["MAX LEVEL"]
        ],
        EcoXP: [
            ["+0.1 XP per kill"],
            ["+0.01 Dust per kill"],
            ["+0.01% Meteorite Perk Effectiveness per kill"],
            ["+0.1% XP per kill"],
            ["MAX LEVEL"]
        ],
        EcoHP: [
            ["+0.1 Max HP per kill"],
            ["+0.1 HP/sec per kill"],
            ["+0.1% Max HP per kill"],
            ["+0.1% HP/sec per kill"],
            ["MAX LEVEL"]
        ],
        ComLife: [
            ["+3% Lifesteal"],
            ["Overheal becomes Shield (200% efficiency, 3s)"],
            ["+2% Enemy Max HP as DMG (Non-Bosses)"],
            ["10% Zombie Spawn Chance (5s Delay, Feasters)"],
            ["MAX LEVEL"]
        ],
        ComCrit: [
            ["+15% Crit Chance"],
            ["HP < 50%: 10% Execute"],
            ["300% Death Mark DMG"],
            ["25% Mega-Crit Chance"],
            ["MAX LEVEL"]
        ],
        ComWave: [
            ["75% Wave DMG", "450 Wave Range"],
            ["1.5s Wave Fear"],
            ["125% Wave DMG", "600 Wave Range"],
            ["Twin Front/Back Wave"],
            ["MAX LEVEL"]
        ],
        DefPuddle: [
            ["Acid deals 5% Enemy Max HP/sec. Duration 10s"],
            ["Acid Slows enemies by 20% and Damage Received +20%"],
            ["While in Acid: +25% Max HP and +25% Regen/sec"],
            ["Acid Slows enemies by 40% and Damage Received +40%"],
            ["MAX LEVEL"]
        ],
        DefEpi: [
            ["Channeling spikes 10s. 70% Slow, 25% DMG/sec. 30s CD"],
            ["Channeling: +50% Damage Reduction"],
            ["Spikes: 3s Damage Immunity on start"],
            ["Channeling: 80% Slow, 35% DMG/sec. 30s CD"],
            ["MAX LEVEL"]
        ],
        CombShield: [
            ["+0.1 Armor per kill"],
            ["+0.1% DMG reduction from Collision per kill"],
            ["+0.1% DMG reduction from Projectile per kill"],
            ["+0.1% Armor per kill"],
            ["MAX LEVEL"]
        ],
        KineticBattery: [
            ["On-hit Shockwave 10 targets (100% Armor DMG, 5s CD)"],
            ["Gain Shield 100% Armor. 1 min Refresh"],
            ["HP < 50%: ARMOR increased by 100%"],
            ["Gain 0.25% Cooldown Reduction per minute"],
            ["MAX LEVEL"]
        ],
        RadiationCore: [
            ["Deals 5.0-10.0% Player Max HP/sec in 500 AOE (Closer = More Dmg)"],
            ["Heal 0.2% Max HP/sec per Aura Enemy"],
            ["+1% Radiation Aura Dmg per 1% Missing HP"],
            ["Global Decay: Enemies lose 2.0% Max HP/sec Map-wide"],
            ["MAX LEVEL"]
        ],
        ChronoPlating: [
            ["DMG% & ATS% increased by 1% of your Armor"],
            ["+1% DMG for every 100 HP you have"],
            ["Double Armor every 5 minutes"],
            ["HP/sec increased by 0.5% OF YOUR ARMOR"],
            ["MAX LEVEL"]
        ]
    };
    const list = perks[type];
    if (!list) return [];

    if (returnAll) {
        return list.map((perksAtLevel, idx) => {
            return perksAtLevel.map(p => formatPerk(p, idx + 1));
        });
    }

    return list.slice(0, level).map((perksAtLevel, idx) => {
        return perksAtLevel.map(p => formatPerk(p, idx + 1));
    }).flat();
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

        return {
            ...base,
            level,
            killsAtAcquisition,
            timeAtAcquisition,
            killsAtLevel,
            timeAtLevel,
            desc: getLegendaryPerkDesc(base.type, level, undefined, undefined),
            perks: getLegendaryPerksArray(base.type, level, undefined, undefined) as string[],
            allPerks: getLegendaryPerksArray(base.type, level, undefined, undefined, true) as string[][]
        };
    });
}

export function syncLegendaryHex(state: GameState, hex: LegendaryHex) {
    hex.desc = getLegendaryPerkDesc(hex.type, hex.level, state, hex);
    hex.perks = getLegendaryPerksArray(hex.type, hex.level, state, hex) as string[];
    hex.allPerks = getLegendaryPerksArray(hex.type, hex.level, state, hex, true) as string[][];
}

export function syncAllLegendaries(state: GameState) {
    state.moduleSockets.hexagons.forEach(hex => {
        if (hex) syncLegendaryHex(state, hex);
    });
}

const ACTIVE_LEGENDARIES: string[] = ['DefPuddle', 'DefEpi', 'KineticBattery'];

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
                    state.player.activeSkills.push({
                        type: selection.type,
                        cooldownMax: selection.type === 'DefPuddle' ? 25000 : (selection.type === 'DefEpi' ? 30000 : 5000), // 25s, 30s, or 5s for Zap
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

import { calculateMeteoriteEfficiency } from './EfficiencyLogic';

export function getHexLevel(state: GameState, type: LegendaryType): number {
    const hex = state.moduleSockets.hexagons.find(h => h?.type === type);
    return hex ? hex.level : 0;
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
    state.moduleSockets.hexagons.forEach(hex => {
        if (!hex) return;
        if (!hex.statBonuses) hex.statBonuses = {};

        const multiplier = getHexMultiplier(state, hex.type);

        if (hex.type === 'EcoDMG') {
            if (hex.level >= 1) hex.statBonuses['dmg_per_kill'] = (hex.statBonuses['dmg_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 2) hex.statBonuses['ats_per_kill'] = (hex.statBonuses['ats_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 3) hex.statBonuses['dmg_pct_per_kill'] = (hex.statBonuses['dmg_pct_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 4) hex.statBonuses['ats_pct_per_kill'] = (hex.statBonuses['ats_pct_per_kill'] || 0) + souls * 0.1 * multiplier;
        }
        if (hex.type === 'EcoXP') {
            if (hex.level >= 1) hex.statBonuses['xp_per_kill'] = (hex.statBonuses['xp_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 2) hex.statBonuses['dust_extraction'] = (hex.statBonuses['dust_extraction'] || 0) + souls * 0.01 * multiplier;
            if (hex.level >= 3) hex.statBonuses['metric_resonance'] = (hex.statBonuses['metric_resonance'] || 0) + souls * 0.01 * multiplier;
            if (hex.level >= 4) hex.statBonuses['xp_pct_per_kill'] = (hex.statBonuses['xp_pct_per_kill'] || 0) + souls * 0.1 * multiplier;
        }
        if (hex.type === 'EcoHP') {
            if (hex.level >= 1) hex.statBonuses['hp_per_kill'] = (hex.statBonuses['hp_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 2) hex.statBonuses['reg_per_kill_flat'] = (hex.statBonuses['reg_per_kill_flat'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 3) hex.statBonuses['hp_pct_per_kill'] = (hex.statBonuses['hp_pct_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 4) hex.statBonuses['reg_per_kill_pct'] = (hex.statBonuses['reg_per_kill_pct'] || 0) + souls * 0.1 * multiplier;
        }
        if (hex.type === 'CombShield') {
            if (hex.level >= 1) hex.statBonuses['arm_per_kill'] = (hex.statBonuses['arm_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 2) hex.statBonuses['col_red_per_kill'] = (hex.statBonuses['col_red_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 3) hex.statBonuses['proj_red_per_kill'] = (hex.statBonuses['proj_red_per_kill'] || 0) + souls * 0.1 * multiplier;
            if (hex.level >= 4) hex.statBonuses['arm_pct_per_kill'] = (hex.statBonuses['arm_pct_per_kill'] || 0) + souls * 0.1 * multiplier;
        }
    });
}

export function calculateLegendaryBonus(state: GameState, statKey: string, skipMultiplier: boolean = false): number {
    let total = 0;
    state.moduleSockets.hexagons.forEach((hex) => {
        if (!hex) return;

        const multiplier = skipMultiplier ? 1.0 : getHexMultiplier(state, hex.type);
        const kl = hex.killsAtLevel || { [1]: hex.killsAtAcquisition };

        const getBonusSoulsSinceLevel = (lvl: number) => {
            const startKills = kl[lvl] ?? state.rawKillCount;
            const rawKillsSince = Math.max(0, state.rawKillCount - startKills);
            // Apply unbuffed kills * current efficiency mult
            return rawKillsSince * multiplier;
        };

        if (hex.type === 'EcoDMG' && hex.statBonuses) {
            if (statKey === 'dmg_per_kill') total += (hex.statBonuses['dmg_per_kill'] || 0);
            if (statKey === 'ats_per_kill') total += (hex.statBonuses['ats_per_kill'] || 0);
            if (statKey === 'dmg_pct_per_kill') total += (hex.statBonuses['dmg_pct_per_kill'] || 0);
            if (statKey === 'ats_pct_per_kill') total += (hex.statBonuses['ats_pct_per_kill'] || 0);
        }
        if (hex.type === 'EcoXP' && hex.statBonuses) {
            if (statKey === 'xp_per_kill') total += (hex.statBonuses['xp_per_kill'] || 0);
            if (statKey === 'dust_extraction') total += Math.floor(hex.statBonuses['dust_extraction'] || 0);
            if (statKey === 'metric_resonance') total += (hex.statBonuses['metric_resonance'] || 0);
            if (statKey === 'xp_pct_per_kill') total += (hex.statBonuses['xp_pct_per_kill'] || 0);
        }
        if (hex.type === 'EcoHP' && hex.statBonuses) {
            if (statKey === 'hp_per_kill') total += (hex.statBonuses['hp_per_kill'] || 0);
            if (statKey === 'reg_per_kill') {
                total += (hex.statBonuses['reg_per_kill_flat'] || 0);
                if (hex.statBonuses['reg_per_kill_pct']) {
                    const maxHp = calcStat(state.player.hp, state.hpRegenBuffMult);
                    // reg_per_kill_pct is the baked-in % points (0.1 per soul * gems)
                    total += maxHp * (hex.statBonuses['reg_per_kill_pct'] / 100);
                }
            }
            if (statKey === 'hp_pct_per_kill') total += (hex.statBonuses['hp_pct_per_kill'] || 0);
        }
        if (hex.type === 'CombShield' && hex.statBonuses) {
            if (statKey === 'arm_per_kill') total += (hex.statBonuses['arm_per_kill'] || 0);
            if (statKey === 'col_red_per_kill') total += (hex.statBonuses['col_red_per_kill'] || 0);
            if (statKey === 'proj_red_per_kill') total += (hex.statBonuses['proj_red_per_kill'] || 0);
            if (statKey === 'arm_pct_per_kill') total += (hex.statBonuses['arm_pct_per_kill'] || 0);
        }

        // ComLife Logic
        if (hex.type === 'ComLife') {
            if (statKey === 'lifesteal' && hex.level >= 1) total += 3 * multiplier;
        }

        // Kinetic Battery Logic
        if (hex.type === 'KineticBattery') {
            if (statKey === 'arm_pct_conditional' && hex.level >= 3) {
                const maxHp = calcStat(state.player.hp, state.hpRegenBuffMult);
                if (state.player.curHp < maxHp * 0.5) {
                    total += 100 * multiplier;
                }
            }
        }

        // Radiation Core Logic
        if (hex.type === 'RadiationCore') {
            // Lvl 3: Aura damage increases by 1% for every 1% of missing HP
            if (statKey === 'aura_dmg_missing_hp' && hex.level >= 3) {
                const missing = 1 - (state.player.curHp / Math.max(1, state.player.hp.flat + state.player.hp.base));
                const pctMissing = Math.max(0, missing * 100);
                total += pctMissing * 0.01 * multiplier;
            }
        }

        // Chrono Plating Logic
        if (hex.type === 'ChronoPlating') {
            // Lvl 1: DMG% & ATS% increased by 1% of your Armor
            if (hex.level >= 1) {
                const totalArmor = calcStat(state.player.arm);
                // 1% per point of armor -> totalArmor * 1
                if (statKey === 'dmg_pct_per_kill') total += totalArmor * 1.0 * multiplier;
                if (statKey === 'ats_pct_per_kill') total += totalArmor * 1.0 * multiplier;
            }
            // Lvl 2: +1% DMG for every 100 HP
            if (statKey === 'dmg_pct_per_hp' && hex.level >= 2) {
                const maxHp = calcStat(state.player.hp, state.hpRegenBuffMult);
                total += (maxHp / 100) * 1.0 * multiplier;
            }
        }
    });
    return total;
}

