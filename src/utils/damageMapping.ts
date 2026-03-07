import { PLAYER_CLASSES } from '../logic/core/Classes';

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
        'Nanite Swarm': '/assets/hexes/HiveMother.png',
        'Storm of Steel (LVL 4)': '/assets/hexes/EcoDMG.png',
        'Shockwave': '/assets/hexes/ComWave.png',
        'Radiation Aura': '/assets/hexes/ComRad.png',
        'Neutron Star (Aura)': '/assets/Fusions/THE NEUTRON STAR.png',
        'Fire Turret': '🔥',
        'Ice Turret': '❄️',
        'Wall Shockwave': '🧱',
        'Malware Wall Bonus': classIconSmall || '/assets/hexes/MalwarePrime.png',
        'Aegis Rings': '/assets/hexes/AigisVortex.PNG',
        'Collision': '💥',
        'Void Singularity': '/assets/hexes/EventHorizon.png',
        'Storm Circle': classIconSmall,
        'Orbital Vortex': '/assets/hexes/AigisVortex.PNG',
        'Shattered Fate (Execute)': '/assets/Icons/DeathMark.png',
        'Shattered Fate (Death Mark)': '/assets/Icons/DeathMark.png',
        'Shattered Fate (Crit)': '/assets/hexes/ComCrit.png'
    };

    const sourceColors: Record<string, string> = {
        'Projectile': classColor,
        'Shattered Fate (Crit)': '#fca5a5',
        'Shattered Fate (Death Mark)': '#f87171',
        'Shattered Fate (Execute)': '#ef4444',
        'Shockwave': '#ef4444',
        'Neural Singularity': '#a855f7',
        'Kinetic Tsunami': '#fbbf24',
        'Storm of Steel (LVL 4)': '#eab308',
        'Nanite Swarm': '#22c55e',
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
        'Toxic Puddle (LVL 1)': '#22c55e',
        'Toxic Puddle (LVL 4)': '#22c55e',
        'Xeno Alchemist (Puddle)': '#a3e635',
        'Irradiated Mire (Puddle)': '#4ade80',
        'Shattered Capacitor (Arc)': '#dc2626',
        'Shattered Capacitor (Bleed)': '#b91c1c',
        'Necro-Kinetic Engine': '#4ade80',
        'Zombie': '#4ade80',
        'Malware Wall Bonus': '#d946ef',
        'Wall Shockwave': '#f87171',
        'Storm Circle': '#22d3ee',
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
        'Void Singularity': ['#8b5cf6', '#d946ef'],
    };

    const groupMap: Record<string, DamageGroupConfig> = {
        'Main Arsenal': {
            children: ['Projectile', 'Malware Wall Bonus', 'Storm of Steel (LVL 4)'],
            icon: classIcon || '/assets/hexes/MalwarePrime.png',
            color: classColor,
            childLabels: {
                'Projectile': 'Direct Impact',
                'Malware Wall Bonus': 'Ricochet Bonus',
                'Storm of Steel (LVL 4)': 'Steel Storm (AOE)'
            }
        },
        'Shattered Fate': {
            children: ['Shattered Fate (Crit)', 'Shattered Fate (Death Mark)', 'Shattered Fate (Execute)'],
            icon: '/assets/hexes/ComCrit.png',
            color: '#ef4444',
            childLabels: {
                'Shattered Fate (Crit)': 'Crit Vulnerability',
                'Shattered Fate (Death Mark)': 'Marked Bonus',
                'Shattered Fate (Execute)': 'Insta-Kill'
            }
        },
        'Void Power': {
            children: ['Void Singularity', 'Orbital Vortex'],
            icon: '/assets/hexes/EventHorizon.png',
            color: '#8b5cf6',
            gradient: ['#8b5cf6', '#d946ef'],
            childLabels: {
                'Void Singularity': 'Black Hole',
                'Orbital Vortex': 'Vortex Gravity'
            }
        },
        'Storm Circle': {
            children: ['Storm Circle'],
            icon: classIconSmall,
            color: '#22d3ee',
            childLabels: {
                'Storm Circle': 'Shock Damage'
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
        'Nanite Swarm': {
            children: ['Nanite Swarm'],
            icon: '/assets/hexes/HiveMother.png',
            color: '#22c55e',
            childLabels: {
                'Nanite Swarm': 'Biological DOT'
            }
        },
        'Necro-Core': {
            children: ['Necro-Kinetic Engine', 'Zombie', 'Crimson Feast (LVL 4)', 'Crimson Feast (LVL 3)'],
            icon: '/assets/Fusions/THE NECRO-KINETIC ENGINE.png',
            color: '#4ade80',
            childLabels: {
                'Necro-Kinetic Engine': 'Engine Pulse',
                'Zombie': 'Zombie Swarm',
                'Crimson Feast (LVL 4)': 'LVL 4 Consumption',
                'Crimson Feast (LVL 3)': 'LVL 3 Life Drain'
            }
        },
        'Toxic Swamp': {
            children: ['Toxic Puddle (LVL 1)', 'Toxic Puddle (LVL 4)', 'Xeno Alchemist (Puddle)', 'Irradiated Mire (Puddle)'],
            icon: '/assets/hexes/DefPuddle.png',
            color: '#22c55e',
            childLabels: {
                'Toxic Puddle (LVL 1)': 'Acidic Ground',
                'Toxic Puddle (LVL 4)': 'Amplification',
                'Xeno Alchemist (Puddle)': 'Alchemical Mire',
                'Irradiated Mire (Puddle)': 'Mire (Fusion)'
            }
        },
        'Epicenter': {
            children: ['Epicenter (LVL 1)', 'Epicenter (LVL 4)', 'Gravity Anchor', 'Gravity Anchor (Explosion)', 'Gravitational Harvest'],
            icon: '/assets/hexes/DefEpi.png',
            color: '#3b82f6',
            childLabels: {
                'Epicenter (LVL 1)': 'Pulse Impact',
                'Epicenter (LVL 4)': 'Execution Shock',
                'Gravity Anchor': 'Anchor (Fusion)',
                'Gravity Anchor (Explosion)': 'Anchor Blast',
                'Gravitational Harvest': 'Harvest (Fusion)'
            }
        },
        'Kinetic Battery': {
            children: ['Kinetic Bolt (LVL 1)', 'Static Bolt'],
            icon: '/assets/hexes/DefBattery.png',
            color: '#3b82f6',
            childLabels: {
                'Kinetic Bolt (LVL 1)': 'Chain Data',
                'Static Bolt': 'Static Surge'
            }
        },
        'Neural Singularity': {
            children: ['Neural Singularity'],
            icon: '/assets/Fusions/THE NEURAL SINGULARITY.png',
            color: '#a855f7',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Neural Singularity': 'Psychic Ripple (Fusion)' }
        },
        'Kinetic Tsunami': {
            children: ['Kinetic Tsunami'],
            icon: '/assets/Fusions/THE KINETIC TSUNAMI.png',
            color: '#fbbf24',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Kinetic Tsunami': 'Sonic Avalanche (Fusion)' }
        },
        'Neutron Star': {
            children: ['Neutron Star (Aura)'],
            icon: '/assets/Fusions/THE NEUTRON STAR.png',
            color: '#facc15',
            gradient: ['#4ade80', '#ef4444'],
            childLabels: { 'Neutron Star (Aura)': 'Event Horizon (Fusion)' }
        },
        'Temporal Monolith': {
            children: ['Temporal Monolith', 'Temporal Monolith (Explosion)'],
            icon: '/assets/Fusions/THE TEMPORAL MONOLITH.png',
            color: '#38bdf8',
            gradient: ['#4ade80', '#3b82f6'],
            childLabels: {
                'Temporal Monolith': 'Freeze Wave (Fusion)',
                'Temporal Monolith (Explosion)': 'Shatter AOE'
            }
        },
        'Shattered Capacitor': {
            children: ['Shattered Capacitor (Arc)', 'Shattered Capacitor (Bleed)'],
            icon: '/assets/Fusions/THE SHATTERED CAPACITOR.png',
            color: '#dc2626',
            gradient: ['#ef4444', '#3b82f6'],
            childLabels: {
                'Shattered Capacitor (Arc)': 'Arc Bolt (Fusion)',
                'Shattered Capacitor (Bleed)': 'Bleed DOT'
            }
        }
    };
    return { sourceColors, sourceIcons, sourceGradients, groupMap, classColor, classIcon };
}
