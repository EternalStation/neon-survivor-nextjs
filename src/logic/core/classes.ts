import type { PlayerClass } from './types';

export const PLAYER_CLASSES: PlayerClass[] = [
    {
        id: 'malware',
        name: 'Sovereign',
        title: 'THE GLITCHED SOVEREIGN',
        lore: 'A flickering phantom in the machine. Reconstructed from corrupted sector data, this chassis exists in a state of constant quantum instability, allowing it to bypass standard ballistic limitations.',
        description: 'A glitched, unstable frame reconstructed from corrupted sector data.',
        characteristics: [
            'Manual Targeting System',
            'Quantum Ricochet Rounds'
        ],
        capabilityName: 'QUANTUM FRAGMENTATION',
        capabilityDesc: 'Manual Targeting. Projectiles have 150% of default range, +1 Piercing, and ricochet off all surfaces infinitely. Each bounce gains 20% Damage and 5% Speed.',
        capabilityMetrics: [
            { label: 'RANGE', value: 150, unit: '%', isPercentage: true, description: 'Base projectile range multiplier' },
            { label: 'DMG/WALL', value: 20, unit: '%', isPercentage: true, description: 'Damage gain per bounce' },
            { label: 'SPD/WALL', value: 5, unit: '%', isPercentage: true, description: 'Speed gain per bounce' },
        ],
        stats: {
            hpMult: -0.30,
            atkMult: 0.50,
            bounceDmgMult: 0.2,
            bounceSpeedBonus: 0.05,
            projLifeMult: 1.5,
            pierce: 1,
        },
        icon: '#d946ef', // Pink-Purple
        themeColor: '#d946ef',
        iconUrl: '/assets/hexes/MalwarePrime.png',
    },
    {
        id: 'eventhorizon',
        name: 'Oblivion',
        title: 'THE VOID WEAVER',
        lore: 'The Singularity made manifest. This chassis warps the fabric of reality around it, turning every impact into a gravitational catastrophe.',
        description: 'Built around a contained singularity, this chassis manipulates local gravity.',
        characteristics: [
            'Crowd control specialist',
            'Heavy defensive plating',
            'AoE vacuum effect on hit'
        ],
        capabilityName: 'Void Singularity',
        capabilityDesc: 'Spawns a 400px void for 3s with 10s CD. Slowly absorbs enemies in the center. Elites take 25% and Bosses take 10% Max HP per second.',
        capabilityMetrics: [
            { label: 'Singularity Radius', value: 400, unit: 'px', isPercentage: false, description: 'Static radius' },
            { label: 'Pull Strength', value: 5, unit: '%', isPercentage: true, description: 'Base pull force' },
            { label: 'Duration', value: 3, unit: 's', isPercentage: false, description: 'Static duration' },
            { label: 'Elite DMG', value: 25, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' },
            { label: 'Boss DMG', value: 10, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' }
        ],
        stats: {
            armMult: 0.20,
            spdMult: 0.10,
        },
        icon: '#8b5cf6', // Violet
        themeColor: '#8b5cf6',
        iconUrl: '/assets/hexes/EventHorizon.png'
    },
    {
        id: 'stormstrike',
        name: 'Zenith',
        title: 'THE THUNDER ENGINE',
        lore: 'A walking capacitor bank. Saturates the ionosphere with targeting data, then unleashes a devastating ring of orbital laser strikes around itself.',
        description: 'A heavy artillery frame with a chargeable orbital ring strike.',
        characteristics: [
            'Slow-firing heavy ordnance',
            'Chargeable ring of laser strikes (E)'
        ],
        capabilityName: 'Storm Circle',
        capabilityDesc: 'Press E to unleash a ring of lasers around the player. Charges over 10s. More charge = more lasers and damage. Speed scales with charge level.',
        capabilityMetrics: [
            { label: 'Max Charge', value: 10, unit: 's', isPercentage: false, description: 'Full charge time' },
            { label: 'Max DMG', value: 150, unit: '%', isPercentage: true, description: 'Damage per laser at full charge' },
            { label: 'Max Lasers', value: 12, unit: '', isPercentage: false, description: 'Laser count at full charge' }
        ],
        stats: {
            dmgMult: 0.50,
            atkMult: -0.20,
        },
        icon: '#06b6d4', // Cyan
        themeColor: '#06b6d4',
        iconUrl: '/assets/hexes/CosmicBeam.png'
    },
    {
        id: 'aigis',
        name: 'Aegis',
        title: 'THE GOLDEN BASTION',
        lore: 'The ultimate deterrent. By weaving a web of magnetic flux, Aigis creates a rotating perimeter of death that protects its pilot while devastating anything that enters its orbit.',
        description: 'An experimental defensive unit maintaining an intense electromagnetic flux.',
        characteristics: [
            'Short-range defensive perimeter',
            'Delay-based burst patterns',
            'Enhanced vitality systems'
        ],
        capabilityName: 'Magnetic Vortex',
        capabilityDesc: 'Projectiles orbit the player in a ring until they hit an enemy. Chance to create up to 4 orbits.',
        capabilityMetrics: [
            { label: 'Ring II', value: 15, unit: '%', isPercentage: true, description: 'Chance for 2nd Layer' },
            { label: 'Ring III', value: 10, unit: '%', isPercentage: true, description: 'Chance for 3rd Layer' },
            { label: 'Ring IV', value: 5, unit: '%', isPercentage: true, description: 'Chance for 4th Layer' }
        ],
        stats: {
            hpMult: 0.20,
            regMult: 0.50,
        },
        icon: '#f59e0b', // Amber/Gold
        themeColor: '#f59e0b',
        iconUrl: '/assets/hexes/AigisVortex.PNG'
    },
    {
        id: 'hivemother',
        name: 'Legion',
        title: 'THE SWARM OVERLORD',
        lore: 'Host to a trillion hungry minds. Each projectile fired by the Hive-Mother is a delivery system for a viral nanite swarm that consumes matter and replicates across the battlefield.',
        description: 'A bio-mechanical hybrid that hosts a swarm of adaptive nanites.',
        characteristics: [
            'Damage-over-time specialist',
            'Organic growth scaling',
            'Viral spread mechanics'
        ],
        capabilityName: 'Nanite Swarm',
        capabilityDesc: 'On hit, bullets dissolve into nanites that deal continuous damage until death. On death, the nanite jumps to the next host within 400px.',
        capabilityMetrics: [
            { label: 'Infection Rate', value: 30, unit: '%', isPercentage: true, description: '' },
            { label: 'Swarm DMG / sec', value: 5, unit: '%', isPercentage: true, description: '' },
            { label: 'Jump Range', value: 400, unit: 'px', isPercentage: false, isStatic: true, description: 'Static jump distance' }
        ],
        stats: {
            xpMult: 0.15,
            dmgMult: 0.10,
        },
        icon: '#22c55e', // Green
        themeColor: '#22c55e',
        iconUrl: '/assets/hexes/HiveMother.png'
    }
];

export type PlayerClassId = 'malware' | 'eventhorizon' | 'stormstrike' | 'aigis' | 'hivemother';
