import type { GameState, LegendaryHex, LegendaryType, Player } from '../core/types';
import { getUiTranslation } from '../../lib/uiTranslations';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { calcStat } from '../utils/MathUtils';
import { calculateMeteoriteEfficiency } from './EfficiencyLogic';
import { GAME_CONFIG } from '../core/GameConfig';

export const ACTIVE_LEGENDARIES: string[] = ['DefPuddle', 'DefEpi', 'ComWave', 'XenoAlchemist', 'IrradiatedMire', 'NeuralSingularity', 'KineticTsunami', 'TemporalMonolith', 'GravitationalHarvest', 'ChronoDevourer'];

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
        customIcon: '/assets/hexes/EcoDMG.png',
        forgedAt: ['Exis']
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
        customIcon: '/assets/hexes/EcoXP.png',
        forgedAt: ['Exis']
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
        customIcon: '/assets/hexes/EcoHP.png',
        forgedAt: ['Exis']
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
        customIcon: '/assets/hexes/ComLife.png',
        forgedAt: ['Apex']
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
        customIcon: '/assets/hexes/ComCrit.png',
        forgedAt: ['Apex']
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
        customIcon: '/assets/hexes/ComWave.png',
        forgedAt: ['Apex']
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
        customIcon: '/assets/hexes/DefPuddle.png',
        forgedAt: ['Bastion']
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
        customIcon: '/assets/hexes/DefEpi.png',
        forgedAt: ['Bastion']
    },
    CombShield: {
        id: 'comb_shield',
        name: 'AEGIS PROTOCOL',
        desc: 'Adaptive Resistance Scaling',
        description: 'Adaptive plating algorithms that strengthen structural integrity based on combat data.',
        lore: 'The Aegis is a living shield. It learns from every hit taken and every enemy destroyed, reinforcing your chassis until it becomes an impenetrable fortress.',
        category: 'Economic',
        type: 'CombShield',
        level: 1,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/EcoArmor.png',
        forgedAt: ['Exis']
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
        customIcon: '/assets/hexes/DefBattery.png',
        forgedAt: ['Bastion']
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
        customIcon: '/assets/hexes/ComRad.png',
        forgedAt: ['Apex']
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
        customIcon: '/assets/hexes/DefChromo.png',
        forgedAt: ['Bastion']
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
        customIcon: '/assets/Fusions/THE NEURAL SINGULARITY.png'
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
        customIcon: '/assets/Fusions/THE KINETIC TSUNAMI.png'
    },
    SoulShatterCore: {
        id: 'soul_shatter_core',
        name: 'THE SOUL-SHATTER CORE',
        desc: 'Combat / Economic Fusion',
        description: 'A critical fusion of Shattered Fate and Storm of Steel. Extends critical lethality through soul harvesting.',
        lore: 'The core doesn’t just record death; it shatters the very concept of survival. By feeding on the souls of the executed, it recalibrates your weapon’s frequency to absolute zero precision.',
        category: 'Fusion',
        categories: ['Combat', 'Economic'],
        type: 'SoulShatterCore',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE SOUL-SHATTER CORE.png'
    },
    BloodForgedCapacitor: {
        id: 'blood_forged_capacitor',
        name: 'THE NECRO-KINETIC ENGINE',
        desc: 'Combat / Defensive Fusion',
        description: 'Kinetic shockwaves trigger lifesteal from damage dealt. Each time a zombie consumes an enemy, there is a chance to cast a green kinetic bolt.',
        lore: 'The capacitor doesn’t just store energy; it refines it through the lens of pain. Every shockwave sent through the enemy ranks carries a parasitic pulse, tearing life from their hulls and feeding it directly into your core.',
        category: 'Fusion',
        categories: ['Combat', 'Defensive'],
        type: 'BloodForgedCapacitor',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE NECRO-KINETIC ENGINE.png'
    },
    GravityAnchor: {
        id: 'gravity_anchor',
        name: 'THE GRAVITY ANCHOR',
        desc: 'Defensive / Defensive Fusion',
        description: 'A structural collapse between Aegis Protocol and Epicenter. Crushes enemies under the weight of your armor.',
        lore: 'The shield is no longer just a barrier; it is a weight. It condenses the gravitational pull of your impact, anchoring it to your armor until the pressure shatters the very ground beneath you.',
        category: 'Fusion',
        categories: ['Defensive', 'Defensive'],
        type: 'GravityAnchor',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE GRAVITY ANCHOR.png'
    },
    TemporalMonolith: {
        id: 'temporal_monolith',
        name: 'THE TEMPORAL MONOLITH',
        desc: 'Defensive / Defensive Fusion',
        description: 'Taking any damage increases your Cooldown Recovery Speed by 20% for 1 sec. Active: Freezes enemies in 400px for 4s. Frozen enemies explode on death for 25% MAX HP.',
        lore: 'A timeless monolith forged from raw endurance. It does not just absorb blows; it converts their kinetic energy into localized temporal accelerations, letting you move faster as the world slows down.',
        category: 'Fusion',
        categories: ['Defensive', 'Defensive'],
        type: 'TemporalMonolith',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE TEMPORAL MONOLITH.png'
    },
    NeutronStar: {
        id: 'neutron_star',
        name: 'THE NEUTRON STAR',
        desc: 'EcoHP / Combat Fusion',
        description: 'A stellar collapse between Essence Syphon and Radiation Core. [EVENT HORIZON] Radiation damage increased by 2% for every 100 Max HP. 0.01% Aura DMG increase for kills by your Radiant Aura and double souls for Essence Syphon.',
        lore: 'A collapsed star’s core, bound by biological essence. It pulls everything into its inescapable reach, converting matter into pure gravitational force.',
        category: 'Fusion',
        categories: ['Economic', 'Combat'],
        type: 'NeutronStar',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE NEUTRON STAR.png'
    },
    GravitationalHarvest: {
        id: 'gravitational_harvest',
        name: 'THE GRAVITATIONAL HARVEST',
        desc: 'EcoHP / Defensive Fusion',
        description: 'A stellar resonance between Essence Syphon and Epicenter. Kills within the well extend its duration. 10% of damage taken is reflected to trapped enemies.',
        lore: 'The harvest is eternal. As you pull them into your reach, their very life force is used to stabilize the gravity well, while their strikes only fuel the crushing pressure of the singularity.',
        category: 'Fusion',
        categories: ['Economic', 'Defensive'],
        type: 'GravitationalHarvest',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE GRAVITATIONAL HARVEST.png'
    },
    ShatteredCapacitor: {
        id: 'shattered_capacitor',
        name: 'THE SHATTERED CAPACITOR',
        desc: '20% of damage dealt arcs as Kinetic Bolt damage to 2 nearby enemies on hit. Applies 15% of Armor as bleed for 3 seconds.',
        description: '20% of damage dealt arcs as Kinetic Bolt damage to 2 nearby enemies on hit. Applies 15% of Armor as bleed for 3 seconds.',
        lore: 'The capacitor doesn’t just store energy; it refines it through the lens of critical impact. Every arc sent through the enemy ranks identifies a structural failure, letting the next strike tear them apart.',
        category: 'Fusion',
        categories: ['Combat', 'Defensive'],
        type: 'ShatteredCapacitor',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/hexes/DefBattery.png'
    },
    ChronoDevourer: {
        id: 'chrono_devourer',
        name: 'THE CHRONO-DEVOURER',
        desc: 'Combat / Defensive Fusion',
        description: 'Active: Explodes all shields to deal AOE damage based on Armor + Shield value. Zombies have a 10% chance to consume enemies on first bite. Zombie kills grant 20% Cooldown Recovery Speed for 1s.',
        lore: 'A parasitic anomaly that feeds on both temporal energy and biomatter. It trades your shields for raw devastation, while accelerating your systems with every successful consumption.',
        category: 'Fusion',
        categories: ['Combat', 'Defensive'],
        type: 'ChronoDevourer',
        level: 5,
        killsAtAcquisition: 0,
        customIcon: '/assets/Fusions/THE CHRONO-DEVOURER.png'
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
            (type === 'ChronoDevourer' && (p.toLowerCase().includes('explode all shields') || p.toLowerCase().includes('cooldown recovery') || p.toLowerCase().includes('chance for zombies') || p.toLowerCase().includes('взрывает все щиты') || p.toLowerCase().includes('шанс зомби') || p.toLowerCase().includes('ускорение перезарядки')));

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
                const availableKeys = ['1', '2', '3', '4', '5'];
                const key = availableKeys.find(k => !usedKeys.includes(k));

                if (key) {
                    let baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
                    if (selection.type === 'DefPuddle') baseCD = GAME_CONFIG.SKILLS.PUDDLE_COOLDOWN;
                    if (selection.type === 'DefEpi') baseCD = GAME_CONFIG.SKILLS.EPI_COOLDOWN;
                    if (selection.type === 'KineticBattery') baseCD = GAME_CONFIG.SKILLS.KINETIC_ZAP_COOLDOWN;
                    if (selection.type === 'ComWave') baseCD = (selection.level >= 4 ? GAME_CONFIG.SKILLS.WAVE_COOLDOWN_LVL4 : GAME_CONFIG.SKILLS.WAVE_COOLDOWN);
                    if (selection.type === 'TemporalMonolith') baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
                    if (selection.type === 'GravitationalHarvest') baseCD = 30000;
                    if (selection.type === 'ChronoDevourer') baseCD = 15000;

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
            if (statKey === 'dmg_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            if (statKey === 'ats_per_kill') total += getSoulsSinceLevel(2) * 0.1;
            if (statKey === 'dmg_pct_per_kill') total += getSoulsSinceLevel(3) * 0.05;
            if (statKey === 'aoe_chance_per_kill') {
                const souls = getSoulsSinceLevel(4);
                if (souls > 0) {
                    // Logarithmic scaling: 100% at 500,000 souls
                    total += (Math.log(souls + 1) / Math.log(500001)) * 100;
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
            if (statKey === 'xp_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            if (statKey === 'dust_extraction') {
                total += getSoulsSinceLevel(2) * 0.05;
            }
            if (statKey === 'flux_per_kill') total += getSoulsSinceLevel(3) * 0.1;
            if (statKey === 'xp_pct_per_kill') total += getSoulsSinceLevel(4) * 0.1;
        }

        if (hex.type === 'EcoHP' || hex.type === 'NeutronStar' || hex.type === 'GravitationalHarvest') {
            const multi = (hex.type === 'NeutronStar' || hex.type === 'GravitationalHarvest') ? 2.0 : 1.0;
            if (statKey === 'hp_per_kill') total += getSoulsSinceLevel(1) * 0.1 * multi;
            if (statKey === 'reg_per_kill') total += getSoulsSinceLevel(2) * 0.03 * multi;
            if (statKey === 'hp_pct_per_kill') total += getSoulsSinceLevel(3) * 0.1 * multi;
            if (statKey === 'reg_pct_per_kill') {
                total += getSoulsSinceLevel(4) * 0.03 * multi;
            }
        }

        if (hex.type === 'CombShield') {
            if (statKey === 'arm_per_kill') total += getSoulsSinceLevel(1) * 0.1;
            if (statKey === 'col_red_per_kill') total += getSoulsSinceLevel(2) * 0.15;
            if (statKey === 'proj_red_per_kill') total += getSoulsSinceLevel(3) * 0.15;
            if (statKey === 'arm_pct_per_kill') total += getSoulsSinceLevel(4) * 0.05;
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
