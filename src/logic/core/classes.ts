import type { PlayerClass } from './Types';

export const PLAYER_CLASSES: PlayerClass[] = [
    {
        id: 'malware',
        name: 'Malware',
        title: 'THE MALWARE',
        lore: 'A flickering phantom in the machine. Reconstructed from corrupted sector data, this chassis exists in a state of constant quantum instability, allowing it to bypass standard ballistic limitations.',
        description: 'A glitched, unstable frame reconstructed from corrupted sector data.',
        characteristics: [
            'Manual Targeting System',
            'Quantum Ricochet Rounds'
        ],
        capabilityName: 'QUANTUM FRAGMENTATION',
        capabilityDesc: 'Manual Targeting. Projectiles ricochet off all surfaces. ACTIVE SKILL: Deploy a Sandbox Hexagon for 15s (25s CD). Bullets gain +1% Speed and +20% Damage per bounce inside or on walls.',
        capabilityMetrics: [
            { label: 'RANGE', value: 100, unit: '%', isPercentage: true, isResonant: true, description: 'Base projectile range multiplier' },
            { label: 'DMG/WALL', value: 20, unit: '%', isPercentage: true, isResonant: true, description: 'Damage gain per bounce' },
            { label: 'SPD/WALL', value: 1, unit: '%', isPercentage: true, isResonant: true, description: 'Speed gain per bounce' },
        ],
        stats: {
            hpMult: -0.15,
            bounceDmgMult: 0.20,
            bounceSpeedBonus: 0.01,
            projLifeMult: 1.0,
            pierce: 1,
        },
        icon: '#d946ef',
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
            { label: 'Void Radius', value: 400, unit: 'px', isPercentage: false, isResonant: true, description: 'Base radius' },
            { label: 'Pull Strength', value: 5, unit: '%', isPercentage: true, isResonant: true, description: 'Base pull force' },
            { label: 'Duration', value: 3, unit: 's', isPercentage: false, isStatic: true, description: 'Static duration' },
            { label: 'Elite DMG', value: 25, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' },
            { label: 'Boss DMG', value: 10, unit: '%', isPercentage: true, isStatic: true, description: 'Max HP per second' }
        ],
        stats: {
            armMult: 0.20,
            spdMult: 0.10,
        },
        icon: '#8b5cf6',
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
            'Chargeable ring of laser strikes (ACTIVE SKILL)'
        ],
        capabilityName: 'Storm Circle',
        capabilityDesc: 'Press ACTIVE SKILL to unleash a ring of lasers around the player. Charges over 10s. More charge = more lasers and damage. Speed scales with charge level.',
        capabilityMetrics: [
            { label: 'Recharge', value: 10, unit: 's', isPercentage: false, isStatic: true, description: 'Full charge time' },
            { label: 'Min DMG', value: 10, unit: '%', isPercentage: true, isResonant: true, description: 'Damage at min charge' },
            { label: 'Max Lasers', value: 12, unit: '', isPercentage: false, isStatic: true, description: 'Laser count at full charge' },
            { label: 'Max DMG', value: 150, unit: '%', isPercentage: true, isResonant: true, description: 'Damage at full charge' },
            { label: 'Laser AOE', value: 50, unit: 'px', isPercentage: false, isResonant: true, description: 'Radius per laser' },
            { label: 'Strike Radius', value: 250, unit: 'px', isPercentage: false, isResonant: true, description: 'Max distance from player' }
        ],
        stats: {
            dmgMult: 0.50,
            atkMult: -0.20,
        },
        icon: '#06b6d4',
        themeColor: '#06b6d4',
        iconUrl: '/assets/hexes/CosmicBeam.png'
    },
    {
        id: 'aigis',
        name: 'Aegis',
        title: 'THE GOLDEN BASTION',
        lore: 'The ultimate deterrent. By weaving a web of magnetic flux, Aigis creates a rotating perimeter of death that protects its pilot while devastating anything that enters its orbit.',
        description: 'Projectiles spawn in 4 orbits with different chances.',
        characteristics: [
            '4 Magnetic Orbits',
            'Projectile course-correction',
            'ACTIVE SKILL: Orbital Vortex'
        ],
        capabilityName: 'Magnetic Vortex',
        capabilityDesc: 'Projectiles spawn in 4 orbits with different chances. Provides +30% HP and +15% HP Regen. ACTIVE SKILL: Generates a 800px vortex for 2s that pulls enemies and projectiles into orbit.',
        capabilityMetrics: [
            { label: 'Active CD', value: 20, unit: 's', isPercentage: false, isStatic: true, description: 'Recharge time' },
            { label: 'Orbit II', value: 15, unit: '%', isPercentage: true, isResonant: true, description: 'Chance to spawn' },
            { label: 'Duration', value: 2, unit: 's', isPercentage: false, isStatic: true, description: 'Active duration' },
            { label: 'Orbit III', value: 10, unit: '%', isPercentage: true, isResonant: true, description: 'Chance to spawn' },
            { label: 'Strength Pull', value: 1, unit: '%', isPercentage: true, isResonant: true, description: 'Vortex suction power' },
            { label: 'Orbit IV', value: 5, unit: '%', isPercentage: true, isResonant: true, description: 'Chance to spawn' }
        ],
        stats: {
            hpMult: 0.30,
            regMult: 0.15,
        },
        icon: '#f59e0b',
        themeColor: '#f59e0b',
        iconUrl: '/assets/hexes/AigisVortex.PNG'
    },
    {
        id: 'hivemother',
        name: 'Hive Mother',
        title: 'THE SWARM OVERLORD',
        lore: 'Host to a trillion hungry minds. Each projectile fired by the Hive-Mother is a delivery system for a viral nanite swarm that consumes matter and replicates across the battlefield.',
        description: 'A bio-mechanical hybrid that hosts a swarm of adaptive nanites.',
        characteristics: [
            'Damage-over-time specialist',
            'Organic growth scaling',
            'ACTIVE SKILL: Nanite Spitter'
        ],
        capabilityName: 'Nanite Swarm',
        capabilityDesc: 'On hit, bullets dissolve into nanites dealing damage. On death, nanite jumps to next host. ACTIVE SKILL: Spits a 40-degree cone of nanites up to 800px. Slows enemies and applies 3 (+1 per 10 lvls) nanites to each. 14s CD.',
        capabilityMetrics: [
            { label: 'Active CD', value: 14, unit: 's', isPercentage: false, isStatic: true, description: 'Active Skill Cooldown' },
            { label: 'Infection Rate', value: 30, unit: '%', isPercentage: true, description: '' },
            { label: 'Swarm DMG / sec', value: 5, unit: '% Max HP', isPercentage: true, isResonant: true, description: '' },
            { label: 'Jump Range', value: 400, unit: 'px', isPercentage: false, isStatic: true, description: 'Static jump distance' }
        ],
        stats: {
            xpMult: 0.15,
            dmgMult: 0.10,
        },
        icon: '#22c55e',
        themeColor: '#22c55e',
        iconUrl: '/assets/hexes/HiveMother.png'
    }
];

export type PlayerClassId = 'malware' | 'eventhorizon' | 'stormstrike' | 'aigis' | 'hivemother';
