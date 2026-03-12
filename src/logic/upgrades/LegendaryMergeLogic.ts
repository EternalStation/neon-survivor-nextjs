import type { GameState, LegendaryHex } from '../core/Types';
import { syncLegendaryHex } from './LegendaryLogic';
import { LEGENDARY_UPGRADES } from './LegendaryData';
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
        typeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.typeAtLevel || { 1: 'EcoXP', 2: 'EcoXP', 3: 'EcoXP', 4: 'EcoXP' }),
            5: 'XenoAlchemist'
        },
        statBonuses: {},
        baseType: state.moduleSockets.hexagons[ecoIdx]!.type,
        secondaryType: state.moduleSockets.hexagons[pudIdx]!.type,
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[pudIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[pudIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });
    if (state.moduleSockets.hexagons[pudIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[pudIdx]! });

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
    const radCore = state.moduleSockets.hexagons.find(h => h?.type === 'ComRadiation');
    return (puddle?.level === 4 && radCore?.level === 4);
}

export function performIrradiatedMireMerge(state: GameState) {
    const pudIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPuddle');
    const radIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComRadiation');
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
        typeAtLevel: {
            ...(state.moduleSockets.hexagons[radIdx]?.typeAtLevel || { 1: 'ComRadiation', 2: 'ComRadiation', 3: 'ComRadiation', 4: 'ComRadiation' }),
            5: 'IrradiatedMire'
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        baseType: state.moduleSockets.hexagons[radIdx]!.type,
        secondaryType: state.moduleSockets.hexagons[pudIdx]!.type,
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[pudIdx]!, state.moduleSockets.hexagons[radIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[pudIdx]!.type, state.moduleSockets.hexagons[radIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[pudIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[pudIdx]! });
    if (state.moduleSockets.hexagons[radIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[radIdx]! });
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
        typeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.typeAtLevel || { 1: 'EcoXP', 2: 'EcoXP', 3: 'EcoXP', 4: 'EcoXP' }),
            5: 'NeuralSingularity'
        },
        statBonuses: {},
        categories: ['Economic', 'Combat'],
        baseType: state.moduleSockets.hexagons[ecoIdx]!.type,
        secondaryType: state.moduleSockets.hexagons[waveIdx]!.type,
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[waveIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[waveIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });
    if (state.moduleSockets.hexagons[waveIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[waveIdx]! });
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
        typeAtLevel: {
            ...(state.moduleSockets.hexagons[ecoIdx]?.typeAtLevel || { 1: 'EcoDMG', 2: 'EcoDMG', 3: 'EcoDMG', 4: 'EcoDMG' }),
            5: 'KineticTsunami'
        },
        statBonuses: {},
        categories: ['Economic', 'Combat'],
        baseType: state.moduleSockets.hexagons[ecoIdx]!.type,
        secondaryType: state.moduleSockets.hexagons[waveIdx]!.type,
        forgedAt: combineForgedAt(state.moduleSockets.hexagons[ecoIdx]!, state.moduleSockets.hexagons[waveIdx]!)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[waveIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });
    if (state.moduleSockets.hexagons[waveIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[waveIdx]! });
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
        typeAtLevel: {
            ...(comHex.typeAtLevel || { 1: 'ComCrit', 2: 'ComCrit', 3: 'ComCrit', 4: 'ComCrit' }),
            ...(ecoHex.typeAtLevel || { 1: 'EcoDMG', 2: 'EcoDMG', 3: 'EcoDMG', 4: 'EcoDMG' }),
            5: 'SoulShatterCore'
        },
        statBonuses: {},
        categories: ['Combat', 'Economic'],
        baseType: comHex.type,
        secondaryType: ecoHex.type,
        forgedAt: combineForgedAt(comHex, ecoHex)
    };
    (mergedHex as any).ecoKillsAtLevel = { ...ecoKills };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[comIdx]!.type, state.moduleSockets.hexagons[ecoIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[comIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[comIdx]! });
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });

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
    const kinBat = state.moduleSockets.hexagons.find(h => h?.type === 'DefBattery');
    return (comLife?.level === 4 && kinBat?.level === 4);
}

export function performBloodForgedCapacitorMerge(state: GameState) {
    const lifeIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComLife');
    const kinIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefBattery');
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
        typeAtLevel: {
            ...(kinHex.typeAtLevel || { 1: 'DefBattery', 2: 'DefBattery', 3: 'DefBattery', 4: 'DefBattery' }),
            ...(lifeHex.typeAtLevel || { 1: 'ComLife', 2: 'ComLife', 3: 'ComLife', 4: 'ComLife' }),
            5: 'BloodForgedCapacitor'
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        baseType: kinHex.type,
        secondaryType: lifeHex.type,
        forgedAt: combineForgedAt(lifeHex, kinHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[lifeIdx]!.type, state.moduleSockets.hexagons[kinIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[lifeIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[lifeIdx]! });
    if (state.moduleSockets.hexagons[kinIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[kinIdx]! });
    state.moduleSockets.hexagons[lifeIdx] = null;
    state.moduleSockets.hexagons[kinIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [lifeIdx, kinIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefBattery');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'BloodForgedCapacitor';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeGravityAnchor(state: GameState): boolean {
    const combShield = state.moduleSockets.hexagons.find(h => h?.type === 'EcoShield');
    const defEpi = state.moduleSockets.hexagons.find(h => h?.type === 'DefEpi');
    return (combShield?.level === 4 && defEpi?.level === 4);
}

export function performGravityAnchorMerge(state: GameState) {
    const shieldIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoShield');
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
        typeAtLevel: {
            ...(epiHex.typeAtLevel || { 1: 'DefEpi', 2: 'DefEpi', 3: 'DefEpi', 4: 'DefEpi' }),
            ...(shieldHex.typeAtLevel || { 1: 'EcoShield', 2: 'EcoShield', 3: 'EcoShield', 4: 'EcoShield' }),
            5: 'GravityAnchor'
        },
        statBonuses: {},
        categories: ['Defensive', 'Defensive'],
        baseType: epiHex.type,
        secondaryType: shieldHex.type,
        forgedAt: combineForgedAt(shieldHex, epiHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[shieldIdx]!.type, state.moduleSockets.hexagons[epiIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[shieldIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[shieldIdx]! });
    if (state.moduleSockets.hexagons[epiIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[epiIdx]! });

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
    const combShield = state.moduleSockets.hexagons.find(h => h?.type === 'EcoShield');
    const chronoPlating = state.moduleSockets.hexagons.find(h => h?.type === 'DefPlatting');
    return (combShield?.level === 4 && chronoPlating?.level === 4);
}

export function performTemporalMonolithMerge(state: GameState) {
    const shieldIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoShield');
    const chronoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPlatting');
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
        typeAtLevel: {
            ...(chronoHex.typeAtLevel || { 1: 'DefPlatting', 2: 'DefPlatting', 3: 'DefPlatting', 4: 'DefPlatting' }),
            ...(shieldHex.typeAtLevel || { 1: 'EcoShield', 2: 'EcoShield', 3: 'EcoShield', 4: 'EcoShield' }),
            5: 'TemporalMonolith'
        },
        statBonuses: {},
        categories: ['Defensive', 'Defensive'],
        baseType: chronoHex.type,
        secondaryType: shieldHex.type,
        forgedAt: combineForgedAt(shieldHex, chronoHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[shieldIdx]!.type, state.moduleSockets.hexagons[chronoIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[shieldIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[shieldIdx]! });
    if (state.moduleSockets.hexagons[chronoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[chronoIdx]! });

    state.moduleSockets.hexagons[shieldIdx] = null;
    state.moduleSockets.hexagons[chronoIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [shieldIdx, chronoIdx] };
    syncLegendaryHex(state, mergedHex);
    state.player.temporalMonolithSouls = 0;

    const usedKeys = state.player.activeSkills.map(s => s.keyBind);
    const availableKeys = ['1', '2', '3', '4', '5', '6'];
    const key = availableKeys.find(k => !usedKeys.includes(k)) || '1';


    const existingSkillIdx = state.player.activeSkills.findIndex(s => s.type === 'TemporalMonolith');
    if (existingSkillIdx === -1) {
        state.player.activeSkills.push({
            type: 'TemporalMonolith',
            baseCD: GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN,
            lastUsed: -999999,
            inUse: false,
            keyBind: key,
            icon: mergedHex.customIcon
        });
    } else {

        state.player.activeSkills[existingSkillIdx].baseCD = GAME_CONFIG.SKILLS.MONOLITH_COOLDOWN;
        state.player.activeSkills[existingSkillIdx].icon = mergedHex.customIcon;
    }
}

export function canMergeNeutronStar(state: GameState): boolean {
    const ecoHp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoHP');
    const radCore = state.moduleSockets.hexagons.find(h => h?.type === 'ComRadiation');
    return (ecoHp?.level === 4 && radCore?.level === 4);
}

export function performNeutronStarMerge(state: GameState) {
    const ecoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'EcoHP');
    const radIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComRadiation');
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
        typeAtLevel: {
            ...(radHex.typeAtLevel || { 1: 'ComRadiation', 2: 'ComRadiation', 3: 'ComRadiation', 4: 'ComRadiation' }),
            ...(ecoHex.typeAtLevel || { 1: 'EcoHP', 2: 'EcoHP', 3: 'EcoHP', 4: 'EcoHP' }),
            5: 'NeutronStar'
        },
        statBonuses: {},
        categories: ['Economic', 'Combat'],
        baseType: radHex.type,
        secondaryType: ecoHex.type,
        forgedAt: combineForgedAt(ecoHex, radHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[radIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });
    if (state.moduleSockets.hexagons[radIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[radIdx]! });
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
        typeAtLevel: {
            ...(epiHex.typeAtLevel || { 1: 'DefEpi', 2: 'DefEpi', 3: 'DefEpi', 4: 'DefEpi' }),
            ...(ecoHex.typeAtLevel || { 1: 'EcoHP', 2: 'EcoHP', 3: 'EcoHP', 4: 'EcoHP' }),
            5: 'GravitationalHarvest'
        },
        statBonuses: {},
        categories: ['Economic', 'Defensive'],
        baseType: epiHex.type,
        secondaryType: ecoHex.type,
        forgedAt: combineForgedAt(ecoHex, epiHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[ecoIdx]!.type, state.moduleSockets.hexagons[epiIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[ecoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[ecoIdx]! });
    if (state.moduleSockets.hexagons[epiIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[epiIdx]! });

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
    const kinBat = state.moduleSockets.hexagons.find(h => h?.type === 'DefBattery');
    return (comCrit?.level === 4 && kinBat?.level === 4);
}

export function performShatteredCapacitorMerge(state: GameState) {
    const comIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComCrit');
    const kinIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefBattery');
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
        typeAtLevel: {
            ...(kinHex.typeAtLevel || { 1: 'DefBattery', 2: 'DefBattery', 3: 'DefBattery', 4: 'DefBattery' }),
            ...(comHex.typeAtLevel || { 1: 'ComCrit', 2: 'ComCrit', 3: 'ComCrit', 4: 'ComCrit' }),
            5: 'ShatteredCapacitor'
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        baseType: kinHex.type,
        secondaryType: comHex.type,
        forgedAt: combineForgedAt(comHex, kinHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[comIdx]!.type, state.moduleSockets.hexagons[kinIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[comIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[comIdx]! });
    if (state.moduleSockets.hexagons[kinIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[kinIdx]! });
    state.moduleSockets.hexagons[comIdx] = null;
    state.moduleSockets.hexagons[kinIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [comIdx, kinIdx] };
    syncLegendaryHex(state, mergedHex);
    const skillIdx = state.player.activeSkills.findIndex(s => s.type === 'DefBattery');
    if (skillIdx !== -1) {
        state.player.activeSkills[skillIdx].type = 'ShatteredCapacitor';
        state.player.activeSkills[skillIdx].icon = mergedHex.customIcon;
        state.player.activeSkills[skillIdx].baseCD = 8;
    }
}

export function canMergeChronoDevourer(state: GameState): boolean {
    const comLife = state.moduleSockets.hexagons.find(h => h?.type === 'ComLife');
    const chronoPlating = state.moduleSockets.hexagons.find(h => h?.type === 'DefPlatting');
    return (comLife?.level === 4 && chronoPlating?.level === 4);
}

export function performChronoDevourerMerge(state: GameState) {
    const lifeIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'ComLife');
    const chronoIdx = state.moduleSockets.hexagons.findIndex(h => h?.type === 'DefPlatting');
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
        typeAtLevel: {
            ...(chronoHex.typeAtLevel || { 1: 'DefPlatting', 2: 'DefPlatting', 3: 'DefPlatting', 4: 'DefPlatting' }),
            ...(lifeHex.typeAtLevel || { 1: 'ComLife', 2: 'ComLife', 3: 'ComLife', 4: 'ComLife' }),
            5: 'ChronoDevourer'
        },
        statBonuses: {},
        categories: ['Combat', 'Defensive'],
        baseType: chronoHex.type,
        secondaryType: lifeHex.type,
        forgedAt: combineForgedAt(lifeHex, chronoHex)
    };
    if (!state.player.consumedLegendaries) state.player.consumedLegendaries = [];
    state.player.consumedLegendaries.push(state.moduleSockets.hexagons[lifeIdx]!.type, state.moduleSockets.hexagons[chronoIdx]!.type);
    if (!state.archivedHexes) state.archivedHexes = [];
    if (state.moduleSockets.hexagons[lifeIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[lifeIdx]! });
    if (state.moduleSockets.hexagons[chronoIdx]) state.archivedHexes.push({ ...state.moduleSockets.hexagons[chronoIdx]! });

    state.moduleSockets.hexagons[lifeIdx] = null;
    state.moduleSockets.hexagons[chronoIdx] = null;
    state.pendingFusionHex = { hex: mergedHex, validHexIndices: [lifeIdx, chronoIdx] };
    syncLegendaryHex(state, mergedHex);

}


