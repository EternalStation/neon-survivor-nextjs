import * as MergeLogic from './LegendaryMergeLogic';

export const FUSIONS = [
    { id: 'XenoAlchemist', result: 'XenoAlchemist', bases: ['EcoXP', 'DefPuddle'], perform: MergeLogic.performXenoAlchemistMerge },
    { id: 'IrradiatedMire', result: 'IrradiatedMire', bases: ['DefPuddle', 'RadiationCore'], perform: MergeLogic.performIrradiatedMireMerge },
    { id: 'NeuralSingularity', result: 'NeuralSingularity', bases: ['EcoXP', 'ComWave'], perform: MergeLogic.performNeuralSingularityMerge },
    { id: 'KineticTsunami', result: 'KineticTsunami', bases: ['EcoDMG', 'ComWave'], perform: MergeLogic.performKineticTsunamiMerge },
    { id: 'SoulShatterCore', result: 'SoulShatterCore', bases: ['ComCrit', 'EcoDMG'], perform: MergeLogic.performSoulShatterCoreMerge },
    { id: 'BloodForgedCapacitor', result: 'BloodForgedCapacitor', bases: ['ComLife', 'KineticBattery'], perform: MergeLogic.performBloodForgedCapacitorMerge },
    { id: 'GravityAnchor', result: 'GravityAnchor', bases: ['CombShield', 'DefEpi'], perform: MergeLogic.performGravityAnchorMerge },
    { id: 'TemporalMonolith', result: 'TemporalMonolith', bases: ['CombShield', 'ChronoPlating'], perform: MergeLogic.performTemporalMonolithMerge },
    { id: 'NeutronStar', result: 'NeutronStar', bases: ['EcoHP', 'RadiationCore'], perform: MergeLogic.performNeutronStarMerge },
    { id: 'GravitationalHarvest', result: 'GravitationalHarvest', bases: ['EcoHP', 'DefEpi'], perform: MergeLogic.performGravitationalHarvestMerge },
    { id: 'ShatteredCapacitor', result: 'ShatteredCapacitor', bases: ['ComCrit', 'KineticBattery'], perform: MergeLogic.performShatteredCapacitorMerge },
    { id: 'ChronoDevourer', result: 'ChronoDevourer', bases: ['ComLife', 'ChronoPlating'], perform: MergeLogic.performChronoDevourerMerge },
    { id: 'VitalMire', result: 'VitalMire', bases: ['EcoHP', 'DefPuddle'], perform: MergeLogic.performVitalMireMerge }
];
