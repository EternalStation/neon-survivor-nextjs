import type { GameState, LegendaryHex, LegendaryType } from './types';

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
        desc: 'Log-Scaling Defense per Kill',
        description: 'Adaptive plating algorithms that strengthen structural integrity logarithmically based on combat data.',
        lore: 'The Aegis is a living shield. It learns from every hit taken and every enemy destroyed, reinforcing your chassis until it becomes an impenetrable fortress.',
        category: 'Defensive',
        type: 'CombShield',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefShield.png'
    }
};

export function getLegendaryPerksArray(type: string, level: number, state?: GameState, hex?: LegendaryHex): string[] {
    const getSouls = (lvl: number) => {
        if (!state || !hex || !hex.killsAtLevel) return null;
        const startKills = hex.killsAtLevel[lvl] ?? hex.killsAtAcquisition;
        return Math.max(0, state.killCount - startKills);
    };

    const formatPerk = (p: string, lvl: number) => {
        const souls = getSouls(lvl);
        if (souls !== null && (p.includes("per kill") || p.includes("per 20 kills") || p.includes("per 50 kills") || p.includes("Resist"))) {
            return `${p} (${souls} Souls)`;
        }
        return p;
    };

    const perks: Record<string, string[][]> = {
        EcoDMG: [
            ["+0.2 DMG per kill"],
            ["+0.2 ATS per kill"],
            ["+0.2 DMG% per kill"],
            ["+0.2 ATS% per kill"],
            ["MAX LEVEL"]
        ],
        EcoXP: [
            ["+1 XP per kill"],
            ["+1 Dust per 50 kills"],
            ["+0.1% Perk Power per 100 kills"],
            ["+1% XP Gain per kill"],
            ["MAX LEVEL"]
        ],
        EcoHP: [
            ["+0.2 Max HP per kill"],
            ["+0.1 HP/sec per kill"],
            ["+0.2% Max HP per kill"],
            ["+0.2% Regen per kill"],
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
            ["20% Slow", "20% Dmg Taken"],
            ["5% Max HP/sec Acid DMG"],
            ["+25% Stand-in Max HP", "+25% Stand-in Regen"],
            ["30% Slow", "30% Dmg Taken"],
            ["MAX LEVEL"]
        ],
        DefEpi: [
            ["70% Spike Slow", "25% Spike Dmg/0.5s"],
            ["-50% Channeling Dmg Taken"],
            ["3s Invulnerable Start"],
            ["80% Spike Slow", "35% Spike Dmg/0.5s"],
            ["MAX LEVEL"]
        ],
        CombShield: [
            ["+1 Armor per kill"],
            ["Log-scaling Collision Resist"],
            ["Log-scaling Projectile Resist"],
            ["+1% Armor Multiplier per kill"],
            ["MAX LEVEL"]
        ]
    };
    const list = perks[type];
    if (!list) return [];

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

    // Arena 1 is Combat Hex
    if (state.currentArena === 1) {
        pool = ['ComLife', 'ComCrit', 'ComWave'];
    }

    // Arena 2 is Defense Hex (Assuming Arena 2 is where they drop)
    // Or if currentArena is vague, we might add them to pool if specific condition met?
    // User said "drop from bosses in defenece arena". I'll assume Arena 2 or 3.
    // Let's assume Arena 2.
    if (state.currentArena === 2) {
        pool = ['DefPuddle', 'DefEpi', 'CombShield'];
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
            desc: getLegendaryPerkDesc(base.type, level, state, existing || undefined),
            perks: getLegendaryPerksArray(base.type, level, state, existing || undefined)
        };
    });
}

export function syncLegendaryHex(state: GameState, hex: LegendaryHex) {
    hex.desc = getLegendaryPerkDesc(hex.type, hex.level, state, hex);
    hex.perks = getLegendaryPerksArray(hex.type, hex.level, state, hex);
}

export function syncAllLegendaries(state: GameState) {
    state.moduleSockets.hexagons.forEach(hex => {
        if (hex) syncLegendaryHex(state, hex);
    });
}

const ACTIVE_LEGENDARIES: string[] = ['DefPuddle', 'DefEpi'];

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
                        cooldownMax: selection.type === 'DefPuddle' ? 25000 : 30000, // 25s for Puddle, 30s for Epi
                        cooldown: 0,
                        inUse: false,
                        keyBind: key,
                        icon: selection.customIcon
                    });
                }
            }
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

export function calculateLegendaryBonus(state: GameState, statKey: string, skipMultiplier: boolean = false): number {
    let total = 0;
    state.moduleSockets.hexagons.forEach((hex) => {
        if (!hex) return;

        const multiplier = skipMultiplier ? 1.0 : getHexMultiplier(state, hex.type);
        const kl = hex.killsAtLevel || { [1]: hex.killsAtAcquisition };

        const getKillsSinceLevel = (lvl: number) => {
            const startKills = kl[lvl] ?? state.killCount;
            return Math.max(0, state.killCount - startKills);
        };

        if (hex.type === 'EcoDMG') {
            if (statKey === 'dmg_per_kill' && hex.level >= 1) total += getKillsSinceLevel(1) * 0.2 * multiplier;
            if (statKey === 'ats_per_kill' && hex.level >= 2) total += getKillsSinceLevel(2) * 0.2 * multiplier;
            if (statKey === 'dmg_pct_per_kill' && hex.level >= 3) total += getKillsSinceLevel(3) * 0.2 * multiplier;
            if (statKey === 'ats_pct_per_kill' && hex.level >= 4) total += getKillsSinceLevel(4) * 0.2 * multiplier;
        }
        if (hex.type === 'EcoXP') {
            if (statKey === 'xp_per_kill' && hex.level >= 1) total += getKillsSinceLevel(1) * 1 * multiplier;
            if (statKey === 'dust_extraction' && hex.level >= 2) {
                // Return total dust earned since reaching level 2
                total += Math.floor(getKillsSinceLevel(2) / 50) * multiplier;
            }
            if (statKey === 'metric_resonance' && hex.level >= 3) {
                // Return total % bonus to apply to perks
                total += (getKillsSinceLevel(3) / 100) * 0.1 * multiplier;
            }
            if (statKey === 'xp_pct_per_kill' && hex.level >= 4) total += getKillsSinceLevel(4) * 1 * multiplier;
        }
        if (hex.type === 'EcoHP') {
            if (statKey === 'hp_per_kill' && hex.level >= 1) total += getKillsSinceLevel(1) * 0.2 * multiplier;
            if (statKey === 'reg_per_kill' && hex.level >= 2) total += getKillsSinceLevel(2) * 0.1 * multiplier;
            if (statKey === 'hp_pct_per_kill' && hex.level >= 3) total += getKillsSinceLevel(3) * 0.2 * multiplier;
            if (statKey === 'reg_pct_per_kill' && hex.level >= 4) total += getKillsSinceLevel(4) * 0.2 * multiplier;
        }

        // CombShield Logic (Logarithmic scaling for reductions)
        if (hex.type === 'CombShield') {
            if (statKey === 'arm_per_kill' && hex.level >= 1) total += getKillsSinceLevel(1) * 1 * multiplier;
            if (statKey === 'col_red_per_kill' && hex.level >= 2) {
                const stacks = getKillsSinceLevel(2) * multiplier;
                total += 80 * (stacks / (stacks + 350));
            }
            if (statKey === 'proj_red_per_kill' && hex.level >= 3) {
                const stacks = getKillsSinceLevel(3) * multiplier;
                total += 80 * (stacks / (stacks + 350));
            }
            if (statKey === 'arm_pct_per_kill' && hex.level >= 4) total += getKillsSinceLevel(4) * 0.01 * multiplier;
        }

        // ComLife Logic
        if (hex.type === 'ComLife') {
            if (statKey === 'lifesteal' && hex.level >= 1) total += 3 * multiplier;
        }
    });
    return total;
}

