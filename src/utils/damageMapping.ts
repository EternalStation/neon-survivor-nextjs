import { PLAYER_CLASSES } from '../logic/core/classes';

export interface DamageGroupConfig {
    children: string[];
    icon: string;
    color: string;
    gradient?: [string, string];
    childLabels: Record<string, string>;
}

export function getDamageMapping(playerClass?: string) {
    const currentClass = PLAYER_CLASSES.find(c => c.id === playerClass?.toLowerCase() || c.name.toLowerCase() === playerClass?.toLowerCase());
    const classColor = currentClass?.themeColor || '#60a5fa';
    const classIcon = currentClass?.iconUrl || '';
    const classIconSmall = classIcon;

    const sourceIcons: Record<string, string> = {
        'Projectile': classIcon,
        'Nanite Swarm': classIcon,
        'Storm of Steel (LVL 4)': '/assets/hexes/EcoDMG.png',
        'Shockwave': '/assets/hexes/ComWave.png',
        'Radiation Aura': '/assets/hexes/ComRad.png',
        'Neutron Star (Aura)': '/assets/Fusions/THE NEUTRON STAR.png',
        'Fire Turret': '🔥',
        'Ice Turret': '❄️',
        'Wall Shockwave': '🧱',
        'Malware Wall Bonus': classIconSmall || '/assets/hexes/MalwarePrime.png',
        'Aegis Rings': '/assets/hexes/AigisVortex.PNG',
        'Collision': '💥'
    };

    const sourceColors: Record<string, string> = {
        'Projectile': classColor,
        'Shattered Fate (Crit)': '#ef4444',
        'Shattered Fate (Death Mark)': '#ef4444',
        'Shockwave': '#ef4444',
        'Neural Singularity': '#a855f7',
        'Kinetic Tsunami': '#fbbf24',
        'Storm of Steel (LVL 4)': '#eab308',
        'Nanite Swarm': classColor,
        'Fire Turret': '#f97316',
        'Ice Turret': '#22d3ee',
        'Radiation Aura': '#4ade80',
        'Neutron Star (Aura)': '#facc15',
        'Irradiated Mire (Aura)': '#86efac',
        'Collision': '#ef4444',
        'Epicenter (LVL 1)': '#3b82f6',
        'Epicenter (LVL 4)': '#3b82f6',
        'Gravitational Harvest': '#06b6d4',
        'Gravity Anchor': '#64748b',
        'Gravity Anchor (Explosion)': '#ef4444',
        'Static Bolt': '#3b82f6',
        'Kinetic Bolt (LVL 1)': '#3b82f6',
        'Crimson Feast (LVL 3)': '#ef4444',
        'Crimson Feast (LVL 4)': '#ef4444',
        'Wall Impact': '#ef4444',
        'Temporal Monolith': '#38bdf8',
        'Temporal Monolith (Explosion)': '#0ea5e9',
        'Shattered Fate (Execute)': '#ef4444',
        'Toxic Puddle (LVL 1)': '#22c55e',
        'Toxic Puddle (LVL 4)': '#22c55e',
        'Xeno Alchemist (Puddle)': '#a3e635',
        'Irradiated Mire (Puddle)': '#4ade80',
        'Vital Mire (Puddle)': '#facc15',
        'Shattered Capacitor (Arc)': '#dc2626',
        'Shattered Capacitor (Bleed)': '#b91c1c',
        'Necro-Kinetic Engine': '#4ade80',
        'Zombie': '#4ade80',
        'Malware Wall Bonus': '#d946ef',
        'Wall Shockwave': '#ef4444',
        'Storm Circle': '#06b6d4',
        'Orbital Vortex': '#f59e0b',
        'Aegis Rings': '#22d3ee',
        'Void Singularity': '#8b5cf6'
    };

    const sourceGradients: Record<string, [string, string]> = {
        'Xeno Alchemist (Puddle)': ['#4ade80', '#3b82f6'],
        'Irradiated Mire (Puddle)': ['#3b82f6', '#ef4444'],
        'Irradiated Mire (Aura)': ['#3b82f6', '#ef4444'],
        'Neural Singularity': ['#4ade80', '#ef4444'],
        'Kinetic Tsunami': ['#4ade80', '#ef4444'],
        'Neutron Star (Aura)': ['#4ade80', '#ef4444'],
        'Gravitational Harvest': ['#4ade80', '#3b82f6'],
        'Gravity Anchor': ['#4ade80', '#3b82f6'],
        'Gravity Anchor (Explosion)': ['#4ade80', '#3b82f6'],
        'Temporal Monolith': ['#4ade80', '#3b82f6'],
        'Temporal Monolith (Explosion)': ['#4ade80', '#3b82f6'],
        'Shattered Capacitor (Arc)': ['#ef4444', '#3b82f6'],
        'Shattered Capacitor (Bleed)': ['#ef4444', '#3b82f6'],
        'Necro-Kinetic Engine': ['#ef4444', '#3b82f6'],
        'Vital Mire (Puddle)': ['#719b0b', '#facc15'],
    };

    const groupMap: Record<string, DamageGroupConfig> = {
        'Projectile': {
            children: ['Projectile', 'Shattered Fate (Crit)', 'Shattered Fate (Death Mark)', 'Shattered Fate (Execute)', 'Storm of Steel (LVL 4)', 'Crimson Feast (LVL 3)', 'Toxic Puddle (LVL 4)'],
            icon: classIcon || '/assets/hexes/MalwarePrime.png',
            color: classColor,
            childLabels: {
                'Projectile': 'Base Impact',
                'Shattered Fate (Crit)': 'Crit Bonus',
                'Shattered Fate (Death Mark)': 'Death Mark',
                'Shattered Fate (Execute)': 'Execution',
                'Storm of Steel (LVL 4)': 'Steel Storm',
                'Crimson Feast (LVL 3)': 'Crimson Feast',
                'Toxic Puddle (LVL 4)': 'Acid AMP',

            }
        },
        'Collision': {
            children: ['Collision'],
            icon: '💥',
            color: '#ef4444',
            childLabels: {
                'Collision': 'Enemy Collision',

            }
        },
        'Wall Shockwave': {
            children: ['Wall Shockwave'],
            icon: '🧱',
            color: '#ef4444',
            childLabels: {
                'Wall Shockwave': 'Shockwave'
            }
        },
        'Aegis Rings': {
            children: ['Aegis Rings'],
            icon: '/assets/hexes/AigisVortex.PNG',
            color: '#22d3ee',
            childLabels: {
                'Aegis Rings': 'Orbital Pulsar'
            }
        },
        'Malware Wall Bonus': {
            children: ['Malware Wall Bonus'],
            icon: classIcon || '/assets/hexes/MalwarePrime.png',
            color: '#d946ef',
            childLabels: {
                'Malware Wall Bonus': 'Ricochet Bonus'
            }
        },
        'Crimson Feast': {
            children: ['Crimson Feast (LVL 4)'],
            icon: '/assets/hexes/ComLife.png',
            color: '#ef4444',
            childLabels: {
                'Crimson Feast (LVL 4)': 'LVL 4 (Zombies)'
            }
        },
        'Toxic Swamp': {
            children: ['Toxic Puddle (LVL 1)'],
            icon: '/assets/hexes/DefPuddle.png',
            color: '#22c55e',
            childLabels: {
                'Toxic Puddle (LVL 1)': 'LVL 1 (Acid DOT)'
            }
        },
        'Epicenter': {
            children: ['Epicenter (LVL 1)', 'Epicenter (LVL 4)'],
            icon: '/assets/hexes/DefEpi.png',
            color: '#3b82f6',
            childLabels: {
                'Epicenter (LVL 1)': 'LVL 1 (Pulse)',
                'Epicenter (LVL 4)': 'LVL 4 (Execute)'
            }
        },
        'Kinetic Battery': {
            children: ['Kinetic Bolt (LVL 1)', 'Static Bolt'],
            icon: '/assets/hexes/DefBattery.png',
            color: '#3b82f6',
            childLabels: {
                'Kinetic Bolt (LVL 1)': 'LVL 1 (Chain Data)',
                'Static Bolt': 'Static Bolt'
            }
        },
        'Xeno Alchemist': {
            children: ['Xeno Alchemist (Puddle)'],
            icon: '/assets/Fusions/THE XENO-ALCHEMIST.png',
            color: '#a3e635',
            gradient: ['#4ade80', '#3b82f6'],
            childLabels: { 'Xeno Alchemist (Puddle)': 'Acid Refinery' }
        },
        'Irradiated Mire': {
            children: ['Irradiated Mire (Puddle)', 'Irradiated Mire (Aura)'],
            icon: '/assets/Fusions/THE IRRADIATED MIRE.png',
            color: '#86efac',
            gradient: ['#3b82f6', '#ef4444'],
            childLabels: {
                'Irradiated Mire (Puddle)': 'Acid Mire',
                'Irradiated Mire (Aura)': 'Radiant Aura'
            }
        },
        'Gravity Anchor': {
            children: ['Gravity Anchor', 'Gravity Anchor (Explosion)'],
            icon: '/assets/Fusions/THE GRAVITY ANCHOR.png',
            color: '#64748b',
            gradient: ['#4ade80', '#3b82f6'],
            childLabels: {
                'Gravity Anchor': 'Anchor Pulse',
                'Gravity Anchor (Explosion)': 'Execute Blast'
            }
        },
        'Temporal Monolith': {
            children: ['Temporal Monolith', 'Temporal Monolith (Explosion)'],
            icon: '/assets/Fusions/THE TEMPORAL MONOLITH.png',
            color: '#38bdf8',
            gradient: ['#4ade80', '#3b82f6'],
            childLabels: {
                'Temporal Monolith': 'Freeze Wave',
                'Temporal Monolith (Explosion)': 'Shatter AOE'
            }
        },
        'Shattered Capacitor': {
            children: ['Shattered Capacitor (Arc)', 'Shattered Capacitor (Bleed)'],
            icon: '/assets/Fusions/THE SHATTERED CAPACITOR.png',
            color: '#dc2626',
            gradient: ['#ef4444', '#3b82f6'],
            childLabels: {
                'Shattered Capacitor (Arc)': 'Arc Bolt',
                'Shattered Capacitor (Bleed)': 'Bleed DOT'
            }
        },
        'Vital Mire': {
            children: ['Vital Mire (Puddle)'],
            icon: '/assets/Fusions/THE IRRADIATED MIRE.png', // Fallback as VITAL MIRE png is missing
            color: '#facc15',
            gradient: ['#719b0b', '#facc15'],
            childLabels: { 'Vital Mire (Puddle)': 'Mutagenic Mire' }
        },
        'Neural Singularity': {
            children: ['Neural Singularity'],
            icon: '/assets/Fusions/THE NEURAL SINGULARITY.png',
            color: '#a855f7',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Neural Singularity': 'Psychic Ripple' }
        },
        'Kinetic Tsunami': {
            children: ['Kinetic Tsunami'],
            icon: '/assets/Fusions/THE KINETIC TSUNAMI.png',
            color: '#fbbf24',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Kinetic Tsunami': 'Sonic Avalanche' }
        },
        'Neutron Star': {
            children: ['Neutron Star (Aura)'],
            icon: '/assets/Fusions/THE NEUTRON STAR.png',
            color: '#facc15',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Neutron Star (Aura)': 'Event Horizon' }
        },
        'Gravitational Harvest': {
            children: ['Gravitational Harvest'],
            icon: '/assets/Fusions/THE GRAVITATIONAL HARVEST.png',
            color: '#06b6d4',
            gradient: ['#4ade80', '#3b82f6'],
            childLabels: { 'Gravitational Harvest': 'Stellar Singularity' }
        },
        'Necro-Kinetic Engine': {
            children: ['Necro-Kinetic Engine', 'Zombie'],
            icon: '/assets/Fusions/THE NECRO-KINETIC ENGINE.png',
            color: '#4ade80',
            gradient: ['#ef4444', '#3b82f6'],
            childLabels: {
                'Necro-Kinetic Engine': 'Engine Pulse',
                'Zombie': 'Zombie Damage'
            }
        }
    };

    return { sourceColors, sourceIcons, sourceGradients, groupMap, classColor, classIcon };
}
