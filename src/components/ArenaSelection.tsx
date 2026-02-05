import React from 'react';
import { ARENA_DATA } from '../logic/MapLogic';

interface ArenaSelectionProps {
    onSelect: (arenaId: number) => void;
}

export const ArenaSelection: React.FC<ArenaSelectionProps> = ({ onSelect }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const arenas = Object.values(ARENA_DATA);

    // Keyboard Navigation
    React.useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (key === 'a' || code === 'keya' || code === 'arrowleft' || key === 'arrowleft') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : arenas.length - 1));
            }
            if (key === 'd' || code === 'keyd' || code === 'arrowright' || key === 'arrowright') {
                setSelectedIndex(prev => (prev < arenas.length - 1 ? prev + 1 : 0));
            }
            if (key === ' ' || code === 'space' || key === 'enter' || code === 'enter') {
                onSelect(arenas[selectedIndex].id);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [selectedIndex, onSelect, arenas]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at center, #020617 0%, #000 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            fontFamily: 'Orbitron, sans-serif',
            color: '#fff',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Grid */}
            <div style={{
                position: 'absolute',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                transform: 'perspective(500px) rotateX(60deg) translateY(-200px)',
                animation: 'grid-scroll 20s linear infinite',
                pointerEvents: 'none'
            }}></div>

            <div style={{ zIndex: 1, textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{
                    fontSize: '3rem',
                    letterSpacing: '0.8rem',
                    marginBottom: '10px',
                    textShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
                    fontWeight: 900
                }}>DEPLOYMENT ZONE</h1>
            </div>

            <div style={{
                display: 'flex',
                gap: '30px',
                width: '95%',
                maxWidth: '1300px',
                justifyContent: 'center',
                zIndex: 1
            }}>
                {arenas.map((arena, i) => (
                    <div
                        key={arena.id}
                        onClick={() => onSelect(arena.id)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{
                            flex: 1,
                            background: i === selectedIndex ? 'rgba(15, 23, 42, 0.95)' : 'rgba(2, 6, 23, 0.7)',
                            border: `2px solid ${i === selectedIndex ? arena.color : 'rgba(148, 163, 184, 0.1)'}`,
                            borderRadius: '16px',
                            padding: '40px 25px',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            transform: i === selectedIndex ? 'translateY(-20px) scale(1.05)' : 'scale(0.95)',
                            boxShadow: i === selectedIndex ? `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px ${arena.color}44` : 'none'
                        }}
                    >
                        {/* Selected Flare */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '4px',
                            background: `linear-gradient(90deg, transparent, ${arena.color}, transparent)`,
                            opacity: i === selectedIndex ? 1 : 0
                        }}></div>

                        {/* Location Badge */}
                        <div style={{
                            fontSize: '0.7rem',
                            color: arena.color,
                            fontWeight: 900,
                            letterSpacing: '2px',
                            marginBottom: '15px',
                            opacity: 0.8
                        }}>{arena.location}</div>

                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            marginBottom: '20px',
                            color: '#fff',
                            textShadow: i === selectedIndex ? `0 0 20px ${arena.color}66` : 'none'
                        }}>{arena.name}</h2>

                        <p style={{
                            fontSize: '0.85rem',
                            color: '#94a3b8',
                            lineHeight: '1.6',
                            marginBottom: '30px',
                            height: '60px'
                        }}>{arena.description}</p>

                        <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {/* Buffs */}
                            {arena.buffs.map((buff, bi) => (
                                <div key={bi} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: '#4ade80',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: 'rgba(74, 222, 128, 0.05)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(74, 222, 128, 0.1)'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>+</span>
                                    <span>{buff}</span>
                                </div>
                            ))}

                            {/* Debuffs */}
                            {arena.debuffs.map((debuff, di) => (
                                <div key={di} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: '#f87171',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    background: 'rgba(248, 113, 113, 0.05)',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(248, 113, 113, 0.1)'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>−</span>
                                    <span>{debuff}</span>
                                </div>
                            ))}
                        </div>

                        {/* Selection Indicator */}
                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '30px',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                color: i === selectedIndex ? arena.color : '#475569',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                borderBottom: `1px solid ${i === selectedIndex ? arena.color : 'transparent'}`,
                                paddingBottom: '4px',
                                transition: 'all 0.3s'
                            }}>
                                {i === selectedIndex ? 'PRESS [ENTER] TO DEPLOY' : 'CLICK TO SELECT'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes grid-scroll {
                    from { background-position: 0 0; }
                    to { background-position: 0 1000px; }
                }
            `}</style>
        </div>
    );
};
