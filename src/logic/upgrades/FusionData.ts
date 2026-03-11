import * as MergeLogic from './LegendaryMergeLogic';

export const FUSIONS = [
    { id: 'XenoAlchemist', result: 'XenoAlchemist', bases: ['EcoXP', 'DefPuddle'], perform: MergeLogic.performXenoAlchemistMerge },
    { id: 'IrradiatedMire', result: 'IrradiatedMire', bases: ['DefPuddle', 'ComRadiation'], perform: MergeLogic.performIrradiatedMireMerge },
    { id: 'NeuralSingularity', result: 'NeuralSingularity', bases: ['EcoXP', 'ComWave'], perform: MergeLogic.performNeuralSingularityMerge },
    { id: 'KineticTsunami', result: 'KineticTsunami', bases: ['EcoDMG', 'ComWave'], perform: MergeLogic.performKineticTsunamiMerge },
    { id: 'SoulShatterCore', result: 'SoulShatterCore', bases: ['ComCrit', 'EcoDMG'], perform: MergeLogic.performSoulShatterCoreMerge },
    { id: 'BloodForgedCapacitor', result: 'BloodForgedCapacitor', bases: ['ComLife', 'DefBattery'], perform: MergeLogic.performBloodForgedCapacitorMerge },
    { id: 'GravityAnchor', result: 'GravityAnchor', bases: ['EcoShield', 'DefEpi'], perform: MergeLogic.performGravityAnchorMerge },
    { id: 'TemporalMonolith', result: 'TemporalMonolith', bases: ['EcoShield', 'DefPlatting'], perform: MergeLogic.performTemporalMonolithMerge },
    { id: 'NeutronStar', result: 'NeutronStar', bases: ['EcoHP', 'ComRadiation'], perform: MergeLogic.performNeutronStarMerge },
    { id: 'GravitationalHarvest', result: 'GravitationalHarvest', bases: ['EcoHP', 'DefEpi'], perform: MergeLogic.performGravitationalHarvestMerge },
    { id: 'ShatteredCapacitor', result: 'ShatteredCapacitor', bases: ['ComCrit', 'DefBattery'], perform: MergeLogic.performShatteredCapacitorMerge },
    { id: 'ChronoDevourer', result: 'ChronoDevourer', bases: ['ComLife', 'DefPlatting'], perform: MergeLogic.performChronoDevourerMerge }
];
