import type { PlayerClass } from './types';

export const PLAYER_CLASSES: PlayerClass[] = [
    {
        id: 'malware',
        name: 'Malware-Prime',
        title: 'THE GLITCHED SOVEREIGN',
        lore: 'A flickering phantom in the machine. Reconstructed from corrupted sector data, this chassis exists in a state of constant quantum instability, allowing it to bypass standard ballistic limitations.',
        description: 'A glitched, unstable frame reconstructed from corrupted sector data.',
        characteristics: [
            'Manual Targeting System',
            'Quantum Ricochet Rounds'
        ],
        capabilityName: 'QUANTUM FRAGMENTATION',
        capabilityDesc: 'Manual Targeting. Projectiles have 300% of default range, +1 Piercing, and ricochet off all surfaces infinitely. Each bounce gains 20% Damage, Increased Speed, and intense Heat Trail.',
        capabilityMetrics: [
            { label: 'RANGE', value: 300, unit: '%', isPercentage: true, description: 'Base projectile range multiplier' },
            { label: 'DMG/WALL', value: 20, unit: '%', isPercentage: true, description: 'Damage gain per bounce' },
            { label: 'SPD/WALL', value: 20, unit: '%', isPercentage: true, description: 'Speed gain per bounce' },
        ],
        stats: {
            hpMult: -0.15,
            bounceDmgMult: 0.2,
            bounceSpeedBonus: 0.2, // +20%
            projLifeMult: 3.0,
            pierce: 1,
        },
        icon: '#d946ef', // Pink-Purple
        themeColor: '#d946ef',
        iconUrl: '/assets/hexes/MalwarePrime.png',
    },
    {
        id: 'eventhorizon',
        name: 'Event-Horizon',
        title: 'THE VOID WEAVER',
        lore: 'The Singularity made manifest. This chassis warps the fabric of reality around it, turning every impact into a gravitational catastrophe.',
        description: 'Built around a contained singularity, this chassis manipulates local gravity.',
        characteristics: [
            'Crowd control specialist',
            'Heavy defensive plating',
            'AoE vacuum effect on hit'
        ],
        capabilityName: 'Void Singularity',
        capabilityDesc: 'Spawns a 400px void for 3s with 10s CD. Instantly consumes normal enemies at core, while Elites take 25% and Bosses take 10% Max HP per second.',
        capabilityMetrics: [
            { label: 'Singularity Radius', value: 400, unit: 'px', isPercentage: false, description: 'Static radius' },
            { label: 'Pull Strength', value: 5, unit: '%', isPercentage: true, description: 'Base pull force' },
            { label: 'Duration', value: 3, unit: 's', isPercentage: false, description: 'Static duration' },
            { label: 'Elite DMG', value: 25, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' },
            { label: 'Boss DMG', value: 10, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' }
        ],
        stats: {
            armMult: 0.30,
            spdMult: 0.10,
        },
        icon: '#8b5cf6', // Violet
        themeColor: '#8b5cf6',
        iconUrl: '/assets/hexes/EventHorizon.png'
    },
    {
        id: 'stormstrike',
        name: 'Cosmic Beam',
        title: 'THE THUNDER ENGINE',
        lore: 'A walking capacitor bank. Channels ionized atmosphere to call down devastating orbital strikes from satellite weapons platforms.',
        description: 'A heavy artillery frame with orbital strike capabilities.',
        characteristics: [
            'Slow-firing heavy ordnance',
            'Massive AOE orbital strikes'
        ],
        capabilityName: 'Orbital Strike',
        capabilityDesc: 'Every 8 seconds, a massive vertical laser beam strikes a random enemy, dealing AOE damage.',
        capabilityMetrics: [
            { label: 'Frequency', value: 8, unit: 's', isPercentage: false, description: 'Static cooldown (Every 8s)' },
            { label: 'Strike DMG', value: 150, unit: '%', isPercentage: true, description: 'Damage multiplier' },
            { label: 'AOE Radius', value: 100, unit: 'px', isPercentage: true, description: 'Strike radius' }
        ],
        stats: {
            dmgMult: 0.40,
            atkMult: -0.20,
        },
        icon: '#06b6d4', // Cyan
        themeColor: '#06b6d4',
        iconUrl: '/assets/hexes/CosmicBeam.png'
    },
    {
        id: 'aigis',
        name: 'Aigis-Vortex',
        title: 'THE GOLDEN BASTION',
        lore: 'The ultimate deterrent. By weaving a web of magnetic flux, Aigis creates a rotating perimeter of death that protects its pilot while devastating anything that enters its orbit.',
        description: 'An experimental defensive unit maintaining an intense electromagnetic flux.',
        characteristics: [
            'Short-range defensive perimeter',
            'Delay-based burst patterns',
            'Enhanced vitality systems'
        ],
        capabilityName: 'Magnetic Vortex',
        capabilityDesc: 'Projectiles orbit the player in a tight ring indefinitely until they hit an enemy. Chance to spawn additional layers.',
        capabilityMetrics: [
            { label: 'Ring II', value: 10, unit: '%', isPercentage: true, description: 'Chance for 2nd Layer' },
            { label: 'Ring III', value: 5, unit: '%', isPercentage: true, description: 'Chance for 3rd Layer' },
            { label: 'Targeting', value: 0, unit: '', isPercentage: false, isStatic: true, description: 'Indefinite Orbit' }
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
        name: 'Hive-Mother',
        title: 'THE SWARM OVERLORD',
        lore: 'Host to a trillion hungry minds. Each projectile fired by the Hive-Mother is a delivery system for a viral nanite swarm that consumes matter and replicates across the battlefield.',
        description: 'A bio-mechanical hybrid that hosts a swarm of adaptive nanites.',
        characteristics: [
            'Damage-over-time specialist',
            'Organic growth scaling',
            'Viral spread mechanics'
        ],
        capabilityName: 'Nanite Swarm',
        capabilityDesc: 'On hit, bullets dissolve into nanites that deal continuous damage until death. On death, the swarm jumps to the next host within 400px.',
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
