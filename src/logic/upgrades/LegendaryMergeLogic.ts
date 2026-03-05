import type { GameState, LegendaryHex } from '../core/types';
import { LEGENDARY_UPGRADES, syncLegendaryHex } from './LegendaryLogic';
import { GAME_CONFIG } from '../core/GameConfig';

function combineForgedAt(h1: LegendaryHex, h2: LegendaryHex): string[] {
    const combined = [...(h1.forgedAt || []), ...(h2.forgedAt || [])];
    return Array.from(new Set(combined));
}

export function canMergeXenoAlchemist(state: GameState): boolean {
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP');
    const defPuddle = state.moduleSockets.hexagons.find(h => h?.type === 'DefPuddle');
    return (ecoXp?.level === 4 && defPuddle?.level === 4);
}

export function performXenoAlchemistMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoXP');
    const pudIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPuddle');
    if (ecoIdx === -1 || pudIdx === -1) return;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.XenoAlchemist,
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
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[pudIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[pudIdx]!.type);
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[pudIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [ecoIdx, pudIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefPuddle');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'XenoAlchemist';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeIrradiatedMire(state: GameState): boolean {
    const puddle = state.moduleSockets.hexagons.find(h => h?.type === 'DefPuddle');
    const radCore = state.moduleSockets.hexagons.find(h => h?.type === 'RadiationCore');
    return (puddle?.level === 4 && radCore?.level === 4);
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
        categories: ['Combat', 'Defensive'],
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[pudIdx]!, state.moduleSockets.hexagons[radIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[pudIdx]!.type, state.moduleSockets.hexagons[radIdx]!.type);
    state.moduleSockets.hexagons[pudIdx] = null;
    state.moduleSockets.hexagons[radIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [pudIdx, radIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefPuddle');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'IrradiatedMire';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeNeuralSingularity(state: GameState): boolean {
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP');
    const comWave = state.moduleSockets.hexagons.find(h => h?.type === 'ComWave');
    return (ecoXp?.level === 4 && comWave?.level === 4);
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
        categories: ['Economic', 'Combat'],
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[waveIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[waveIdx]!.type);
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[waveIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [ecoIdx, waveIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'ComWave');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'NeuralSingularity';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeKineticTsunami(state: GameState): boolean {
    const ecoDmg = state.moduleSockets.hexagons.find(h => h?.type === 'EcoDMG');
    const comWave = state.moduleSockets.hexagons.find(h => h?.type === 'ComWave');
    return (ecoDmg?.level === 4 && comWave?.level === 4);
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
        categories: ['Economic', 'Combat'],
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[waveIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[waveIdx]!.type);
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[waveIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [ecoIdx, waveIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'ComWave' || s.type === 'NeuralSingularity');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'KineticTsunami';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
    state.player.kineticTsunamiWaveSouls = 0;
}

export function canMergeSoulShatterCore(state: GameState): boolean {
    const comCrit = state.moduleSockets.hexagons.find(h => h?.type === 'ComCrit');
    const ecoDmg = state.moduleSockets.hexagons.find(h => h?.type === 'EcoDMG');
    return (comCrit?.level === 4 && ecoDmg?.level === 4);
}

export function performSoulShatterCoreMerge(state: GameState) {
    const comIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComCrit');
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoDMG');
    if (comIdx === -1 || ecoIdx === -1) return;
    const comHex = state.moduleSockets.hexagons[comIdx]!;
    const ecoHex = state.moduleSockets.hexagons[ecoIdx]!;
    const ecoKills = ecoHex.killsAtLevel || {};
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.SoulShatterCore,
        level: 5,
        killsAtAcquisition: Math.min(comHex.killsAtAcquisition, ecoHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(comHex.timeAtAcquisition || 0, ecoHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(comHex.killsAtLevel || {}),
            ...ecoKills,
            5: state.killCount
        },
        timeAtLevel: {
            ...(comHex.timeAtLevel || {}),
            ...(ecoHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Combat', 'Economic'],
        forgedAt: combineForgedAt(comHex, ecoHex)
    };
    (mergedHex as any).ecoKillsAtLevel = { ...ecoKills };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[comIdx]!.type, state.moduleSockets.hexagons[ecoIdx]!.type);
    state.moduleSockets.hexagons[comIdx] = null;
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [comIdx, ecoIdx] };
    syncLegendaryHex(state, mergedHex);
    const ecoSouls = [1, 2, 3, 4].reduce((sum, lvl) => {
        const start = ecoKills[lvl];
        if (start === undefined) return sum;
        return sum + Math.max(0, state.killCount - start);
    }, 0);
    state.player.soulShatterSouls = ecoSouls;
}

export function canMergeBloodForgedCapacitor(state: GameState): boolean {
    const comLife = state.moduleSockets.hexagons.find(h => h?.type === 'ComLife');
    const kinBat = state.moduleSockets.hexagons.find(h => h?.type === 'KineticBattery');
    return (comLife?.level === 4 && kinBat?.level === 4);
}

export function performBloodForgedCapacitorMerge(state: GameState) {
    const lifeIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComLife');
    const kinIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'KineticBattery');
    if (lifeIdx === -1 || kinIdx === -1) return;
    const lifeHex = state.moduleSockets.hexagons[lifeIdx]!;
    const kinHex = state.moduleSockets.hexagons[kinIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.BloodForgedCapacitor,
        level: 5,
        killsAtAcquisition: Math.min(lifeHex.killsAtAcquisition, kinHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(lifeHex.timeAtAcquisition || 0, kinHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(lifeHex.killsAtLevel || {}),
            ...(kinHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(lifeHex.timeAtLevel || {}),
            ...(kinHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        forgedAt: combineForgedAt(lifeHex, kinHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[lifeIdx]!.type, state.moduleSockets.hexagons[kinIdx]!.type);
    state.moduleSockets.hexagons[lifeIdx] = null;
    state.moduleSockets.hexagons[kinIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [lifeIdx, kinIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'KineticBattery');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'BloodForgedCapacitor';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeGravityAnchor(state: GameState): boolean {
    const combShield = state.moduleSockets.hexagons.find(h => h?.type === 'CombShield');
    const defEpi = state.moduleSockets.hexagons.find(h => h?.type === 'DefEpi');
    return (combShield?.level === 4 && defEpi?.level === 4);
}

export function performGravityAnchorMerge(state: GameState) {
    const shieldIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'CombShield');
    const epiIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefEpi');
    if (shieldIdx === -1 || epiIdx === -1) return;
    const shieldHex = state.moduleSockets.hexagons[shieldIdx]!;
    const epiHex = state.moduleSockets.hexagons[epiIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.GravityAnchor,
        level: 5,
        killsAtAcquisition: Math.min(shieldHex.killsAtAcquisition, epiHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(shieldHex.timeAtAcquisition || 0, epiHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(shieldHex.killsAtLevel || {}),
            ...(epiHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(shieldHex.timeAtLevel || {}),
            ...(epiHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Defensive', 'Defensive'],
        forgedAt: combineForgedAt(shieldHex, epiHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[shieldIdx]!.type, state.moduleSockets.hexagons[epiIdx]!.type);
    state.moduleSockets.hexagons[shieldIdx] = null;
    state.moduleSockets.hexagons[epiIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [shieldIdx, epiIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefEpi');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'GravityAnchor';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeTemporalMonolith(state: GameState): boolean {
    const combShield = state.moduleSockets.hexagons.find(h => h?.type === 'CombShield');
    const chronoPlating = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
    return (combShield?.level === 4 && chronoPlating?.level === 4);
}

export function performTemporalMonolithMerge(state: GameState) {
    const shieldIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'CombShield');
    const chronoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ChronoPlating');
    if (shieldIdx === -1 || chronoIdx === -1) return;
    const shieldHex = state.moduleSockets.hexagons[shieldIdx]!;
    const chronoHex = state.moduleSockets.hexagons[chronoIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.TemporalMonolith,
        level: 5,
        killsAtAcquisition: Math.min(shieldHex.killsAtAcquisition, chronoHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(shieldHex.timeAtAcquisition || 0, chronoHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(shieldHex.killsAtLevel || {}),
            ...(chronoHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(shieldHex.timeAtLevel || {}),
            ...(chronoHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Defensive', 'Defensive'],
        forgedAt: combineForgedAt(shieldHex, chronoHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[shieldIdx]!.type, state.moduleSockets.hexagons[chronoIdx]!.type);
    state.moduleSockets.hexagons[shieldIdx] = null;
    state.moduleSockets.hexagons[chronoIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [shieldIdx, chronoIdx] };
    syncLegendaryHex(state, mergedHex);
    state.player.temporalMonolithSouls = 0;
}

export function canMergeNeutronStar(state: GameState): boolean {
    const ecoHp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoHP');
    const radCore = state.moduleSockets.hexagons.find(h => h?.type === 'RadiationCore');
    return (ecoHp?.level === 4 && radCore?.level === 4);
}

export function performNeutronStarMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoHP');
    const radIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'RadiationCore');
    if (ecoIdx === -1 || radIdx === -1) return;
    const ecoHex = state.moduleSockets.hexagons[ecoIdx]!;
    const radHex = state.moduleSockets.hexagons[radIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.NeutronStar,
        level: 5,
        killsAtAcquisition: Math.min(ecoHex.killsAtAcquisition, radHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(ecoHex.timeAtAcquisition || 0, radHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(ecoHex.killsAtLevel || {}),
            ...(radHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(ecoHex.timeAtLevel || {}),
            ...(radHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Economic', 'Combat'],
        forgedAt: combineForgedAt(ecoHex, radHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[radIdx]!.type);
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[radIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [ecoIdx, radIdx] };
    syncLegendaryHex(state, mergedHex);
    state.player.neutronStarAuraKills = 0;
}

export function canMergeGravitationalHarvest(state: GameState): boolean {
    const ecoHp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoHP');
    const defEpi = state.moduleSockets.hexagons.find(h => h?.type === 'DefEpi');
    return (ecoHp?.level === 4 && defEpi?.level === 4);
}

export function performGravitationalHarvestMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoHP');
    const epiIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefEpi');
    if (ecoIdx === -1 || epiIdx === -1) return;
    const ecoHex = state.moduleSockets.hexagons[ecoIdx]!;
    const epiHex = state.moduleSockets.hexagons[epiIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.GravitationalHarvest,
        level: 5,
        killsAtAcquisition: Math.min(ecoHex.killsAtAcquisition, epiHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(ecoHex.timeAtAcquisition || 0, epiHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(ecoHex.killsAtLevel || {}),
            ...(epiHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(ecoHex.timeAtLevel || {}),
            ...(epiHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Economic', 'Defensive'],
        forgedAt: combineForgedAt(ecoHex, epiHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[epiIdx]!.type);
    state.moduleSockets.hexagons[ecoIdx] = null;
    state.moduleSockets.hexagons[epiIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [ecoIdx, epiIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefEpi');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'GravitationalHarvest';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeShatteredCapacitor(state: GameState): boolean {
    const comCrit = state.moduleSockets.hexagons.find(h => h?.type === 'ComCrit');
    const kinBat = state.moduleSockets.hexagons.find(h => h?.type === 'KineticBattery');
    return (comCrit?.level === 4 && kinBat?.level === 4);
}

export function performShatteredCapacitorMerge(state: GameState) {
    const comIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComCrit');
    const kinIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'KineticBattery');
    if (comIdx === -1 || kinIdx === -1) return;
    const comHex = state.moduleSockets.hexagons[comIdx]!;
    const kinHex = state.moduleSockets.hexagons[kinIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.ShatteredCapacitor,
        level: 5,
        killsAtAcquisition: Math.min(comHex.killsAtAcquisition, kinHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(comHex.timeAtAcquisition || 0, kinHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(comHex.killsAtLevel || {}),
            ...(kinHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(comHex.timeAtLevel || {}),
            ...(kinHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        forgedAt: combineForgedAt(comHex, kinHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[comIdx]!.type, state.moduleSockets.hexagons[kinIdx]!.type);
    state.moduleSockets.hexagons[comIdx] = null;
    state.moduleSockets.hexagons[kinIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [comIdx, kinIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'KineticBattery');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'ShatteredCapacitor';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
        state.player.activeSkills[skillIdx].baseCD = 8;
    }
}

export function canMergeChronoDevourer(state: GameState): boolean {
    const comLife = state.moduleSockets.hexagons.find(h => h?.type === 'ComLife');
    const chronoPlating = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
    return (comLife?.level === 4 && chronoPlating?.level === 4);
}

export function performChronoDevourerMerge(state: GameState) {
    const lifeIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComLife');
    const chronoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ChronoPlating');
    if (lifeIdx === -1 || chronoIdx === -1) return;
    const lifeHex = state.moduleSockets.hexagons[lifeIdx]!;
    const chronoHex = state.moduleSockets.hexagons[chronoIdx]!;
    const mergedHex: LegendaryHex = {
        ...LEGENDARY_UPGRADES.ChronoDevourer,
        level: 5,
        killsAtAcquisition: Math.min(lifeHex.killsAtAcquisition, chronoHex.killsAtAcquisition),
        timeAtAcquisition: Math.min(lifeHex.timeAtAcquisition || 0, chronoHex.timeAtAcquisition || 0),
        killsAtLevel: {
            ...(lifeHex.killsAtLevel || {}),
            ...(chronoHex.killsAtLevel || {}),
            5: state.killCount
        },
        timeAtLevel: {
            ...(lifeHex.timeAtLevel || {}),
            ...(chronoHex.timeAtLevel || {}),
            5: state.gameTime
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        forgedAt: combineForgedAt(lifeHex, chronoHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[lifeIdx]!.type, state.moduleSockets.hexagons[chronoIdx]!.type);
    state.moduleSockets.hexagons[lifeIdx] = null;
    state.moduleSockets.hexagons[chronoIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [lifeIdx, chronoIdx] };
    syncLegendaryHex(state, mergedHex);

    const usedKeys = state.player.activeSkills.map(s => s.keyBind);
    const availableKeys = ['1', '2', '3', '4', '5'];
    const key = availableKeys.find(k => !usedKeys.includes(k));
    if (key) {
        state.player.activeSkills.push({
            type: 'ChronoDevourer',
            baseCD: GAME_CONFIG.SKILLS.CHRONO_DEVOURER_COOLDOWN,
            lastUsed: -999999,
            inUse: false,
            keyBind: key,
            icon: mergedHex.customIcon
        });
    }
}

