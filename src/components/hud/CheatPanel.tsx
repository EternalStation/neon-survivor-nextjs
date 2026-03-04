import { useState, useEffect, useMemo } from 'react';

interface CheatEntry {
    code: string;
    description: string;
}

interface CheatCategory {
    name: string;
    entries: CheatEntry[];
}

const CHEAT_CATEGORIES: CheatCategory[] = [
    {
        name: 'RESOURCES',
        entries: [
            { code: 'ko', description: '+5100 Dust' },
            { code: 'kp', description: '+1000 Void Flux' },
            { code: 'rmo', description: '+100 Armor base / +10 Armor mult' },
        ]
    },
    {
        name: 'PLAYER',
        entries: [
            { code: 'lvl', description: 'Level Up + Unlock Portals' },
            { code: 'k1', description: 'Suicide (DEBUG)' },
            { code: 'cs2', description: 'Class Skill Resonance x2 per press (0→0.5→1→2→4...)' },
        ]
    },
    {
        name: 'LEGENDARY',
        entries: [
            { code: 'y1', description: 'EcoDMG — STORM OF STEEL (Lv5)' },
            { code: 'y2', description: 'EcoXP — NEURAL HARVEST (Lv5)' },
            { code: 'y3', description: 'EcoHP — ESSENCE SYPHON (Lv5)' },
            { code: 'y4', description: 'CombShield — AEGIS PROTOCOL (Lv5)' },
            { code: 'y5', description: 'ComLife — CRIMSON FEAST (Lv5)' },
            { code: 'y6', description: 'ComCrit — SHATTERED FATE (Lv5)' },
            { code: 'y7', description: 'ComWave — TERROR PULSE (Lv5)' },
            { code: 'y8', description: 'RadiationCore — RADIATION CORE (Lv5)' },
            { code: 'y9', description: 'DefPuddle — TOXIC SWAMP (Lv5)' },
            { code: 'y0', description: 'DefEpi — EPICENTER (Lv5)' },
            { code: 'y-', description: 'KineticBattery — KINETIC BATTERY (Lv5)' },
            { code: 'y=', description: 'ChronoPlating — CHRONO PLATING (Lv5)' },
            { code: 'y[', description: 'GravityAnchor — THE GRAVITY ANCHOR (Lv5)' },
        ]
    },
    {
        name: 'BLUEPRINTS',
        entries: [
            { code: 'o1', description: 'Drop: METEOR_SHOWER' },
            { code: 'o2', description: 'Drop: NEURAL_OVERCLOCK' },
            { code: 'o3', description: 'Drop: STASIS_FIELD' },
            { code: 'o4', description: 'Drop: PERK_RESONANCE' },
            { code: 'o5', description: 'Drop: ARENA_SURGE' },
            { code: 'o6', description: 'Drop: QUANTUM_SCRAPPER' },
            { code: 'o7', description: 'Drop: MATRIX_OVERDRIVE' },
            { code: 'o8', description: 'Drop: TEMPORAL_GUARD' },
            { code: 'o9', description: 'Drop: DIMENSIONAL_GATE' },
            { code: 'o10', description: 'Drop: SECTOR_UPGRADE_ECO' },
            { code: 'o11', description: 'Drop: SECTOR_UPGRADE_COM' },
            { code: 'o12', description: 'Drop: SECTOR_UPGRADE_DEF' },
        ]
    },
    {
        name: 'METEORITES',
        entries: [
            { code: 'm1', description: 'Spawn: anomalous (in world)' },
            { code: 'm3', description: 'Spawn: abyss (in world)' },
            { code: 'm6', description: 'Spawn: singularity (in world)' },
            { code: 'mi1', description: 'Add to inventory: anomalous' },
            { code: 'mi6', description: 'Add to inventory: singularity' },
        ]
    },
    {
        name: 'BOSSES',
        entries: [
            { code: 'b11', description: 'Boss Circle Lvl 1' },
            { code: 'b33', description: 'Boss Square Lvl 3' },
            { code: 'b55', description: 'Boss Pentagon Lvl 5' },
            { code: 'v1', description: 'Boss Circle Max Tier (Lv4)' },
            { code: 'v5', description: 'Boss Pentagon Max Tier (Lv4)' },
        ]
    },
    {
        name: 'ENEMIES',
        entries: [
            { code: 'e1', description: 'Spawn 5 Circles' },
            { code: 'e2', description: 'Spawn 5 Triangles' },
            { code: 'e3', description: 'Spawn 5 Squares' },
            { code: 'e4', description: 'Spawn 5 Diamonds' },
            { code: 'e5', description: 'Spawn 5 Pentagons' },
            { code: 'sni', description: 'Spawn Snitch (rare)' },
            { code: 'z3', description: 'Spawn Void Burrower' },
            { code: 'gli', description: 'Spawn Prism Glitcher' },
        ]
    },
    {
        name: 'EVENTS',
        entries: [
            { code: 'z1', description: 'Legion Formation (600s)' },
            { code: 'z2', description: 'Necrotic Surge (30s)' },
        ]
    },
    {
        name: 'TURRETS',
        entries: [
            { code: 'tf3', description: 'Fire Turret Lvl 3' },
            { code: 'ti3', description: 'Ice Turret Lvl 3' },
            { code: 'th3', description: 'Heal Turret Lvl 3' },
            { code: 'tf6', description: 'Fire Turret Lvl 6' },
        ]
    },
    {
        name: 'TIME',
        entries: [
            { code: 't10', description: 'Skip +10 minutes' },
            { code: 't20', description: 'Skip +20 minutes' },
            { code: 't30', description: 'Skip +30 minutes' },
            { code: 't60', description: 'Skip +60 minutes' },
        ]
    },
    {
        name: 'MISC',
        entries: [
            { code: 'por', description: 'Reset portal (reopen in 10s)' },
            { code: 'bug', description: 'Open Admin Console' },
            { code: 'i15', description: 'Fake Portal Troll (debug)' },
        ]
    },
];

interface CheatPanelProps {
    onClose: () => void;
}

export function CheatPanel({ onClose }: CheatPanelProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [recentCheats, setRecentCheats] = useState<CheatEntry[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem('neon_survivor_recent_cheats');
        if (stored) {
            try {
                setRecentCheats(JSON.parse(stored));
            } catch (e) {
            }
        }
    }, []);

    const handleApply = (entry: CheatEntry) => {
        const newRecent = [entry, ...recentCheats.filter(c => c.code !== entry.code)].slice(0, 3);
        setRecentCheats(newRecent);
        localStorage.setItem('neon_survivor_recent_cheats', JSON.stringify(newRecent));

        entry.code.split('').forEach(char =>
            window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }))
        );
        onClose();
    };

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return CHEAT_CATEGORIES;
        const lowerSearch = searchTerm.toLowerCase();
        return CHEAT_CATEGORIES.map(cat => ({
            ...cat,
            entries: cat.entries.filter(e =>
                e.description.toLowerCase().includes(lowerSearch) ||
                e.code.toLowerCase().includes(lowerSearch)
            )
        })).filter(cat => cat.entries.length > 0);
    }, [searchTerm]);

    return (
        <div
            style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 100000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: `'Rajdhani', monospace`, color: '#00ff00', pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{
                width: '80%', height: '85%', background: '#000', border: '1px solid #00ff00',
                borderRadius: '4px', padding: '24px', position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: '1px solid #00ff00', color: '#00ff00',
                        padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px'
                    }}
                >
                    EXIT
                </button>

                <h2 style={{ margin: '0 0 16px 0', fontSize: '22px', textTransform: 'uppercase', borderBottom: '1px solid #00ff00', paddingBottom: '10px' }}>
                    {'>'} CHEAT_PANEL :: DEBUG_CODES
                </h2>

                <input
                    type="text"
                    placeholder="SEARCH CODES..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: '1px solid #00ff00',
                        color: '#00ff00',
                        padding: '8px',
                        marginBottom: '16px',
                        fontFamily: 'inherit',
                        fontSize: '16px',
                        outline: 'none'
                    }}
                />

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
                    {!searchTerm && recentCheats.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#00aa00', letterSpacing: '2px', marginBottom: '6px', borderLeft: '2px solid #00ff00', paddingLeft: '8px' }}>
                                [RECENTLY USED]
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {recentCheats.map(entry => (
                                        <tr
                                            key={'recent-' + entry.code}
                                            onClick={() => handleApply(entry)}
                                            style={{ borderBottom: '1px solid #001a00', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#003300'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '5px 8px', fontSize: '13px', color: '#88ff88' }}>
                                                {entry.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredCategories.map(cat => (
                        <div key={cat.name} style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#00aa00', letterSpacing: '2px', marginBottom: '6px', borderLeft: '2px solid #00ff00', paddingLeft: '8px' }}>
                                [{cat.name}]
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {cat.entries.map(entry => (
                                        <tr
                                            key={entry.code}
                                            onClick={() => handleApply(entry)}
                                            style={{ borderBottom: '1px solid #001a00', cursor: 'pointer' }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#003300'; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                        >
                                            <td style={{ padding: '5px 8px', fontSize: '13px', color: '#88ff88' }}>
                                                {entry.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
