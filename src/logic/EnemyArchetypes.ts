export type EnemyArchetype = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon';

export interface ArchetypeConfig {
    shape: EnemyArchetype;
    name: string;
    speedMult: number;      // Speed multiplier vs baseline
    hpMult: number;         // HP multiplier vs baseline
    spawnRateMult: number;  // Spawn rate multiplier
    specialAbility?: string;
}

export const ARCHETYPES: Record<EnemyArchetype, ArchetypeConfig> = {
    circle: {
        shape: 'circle',
        name: 'Chaser',
        speedMult: 1.2,
        hpMult: 1.0,
        spawnRateMult: 1.5,
    },
    triangle: {
        shape: 'triangle',
        name: 'Charger',
        speedMult: 1.0,
        hpMult: 1.0,
        spawnRateMult: 1.0,
        specialAbility: 'charge',
    },
    square: {
        shape: 'square',
        name: 'Tank',
        speedMult: 0.8,
        hpMult: 2.0,
        spawnRateMult: 0.75,
    },
    diamond: {
        shape: 'diamond',
        name: 'Sniper',
        speedMult: 0.85,
        hpMult: 1.0,
        spawnRateMult: 0.75,
        specialAbility: 'snipe',
    },
    pentagon: {
        shape: 'pentagon',
        name: 'Swarm Leader',
        speedMult: 0.8,
        hpMult: 1.0,
        spawnRateMult: 0.25,
        specialAbility: 'spawn',
    },
};
