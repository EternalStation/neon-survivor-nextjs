import React from 'react';
import type { LegendaryHex } from '../logic/types';

interface LegendarySelectionMenuProps {
    options: LegendaryHex[];
    onSelect: (selection: LegendaryHex) => void;
}

export const LegendarySelectionMenu: React.FC<LegendarySelectionMenuProps> = ({ options, onSelect }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();
            if (key === 'a' || code === 'keya' || key === 'arrowleft' || code === 'arrowleft') {
                setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
            } else if (key === 'd' || code === 'keyd' || key === 'arrowright' || code === 'arrowright') {
                setSelectedIndex(prev => (prev + 1) % options.length);
            } else if (key === 'enter' || code === 'enter' || key === ' ' || code === 'space') {
                onSelect(options[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, selectedIndex, onSelect]);

    const getLegendaryInfo = (category: string) => {
        const categories: Record<string, { color: string, label: string }> = {
            Economic: { color: '#fbbf24', label: 'ECONOMIC' },
            Combat: { color: '#f87171', label: 'COMBAT' },
            Defensive: { color: '#60a5fa', label: 'DEFENCE' }
        };
        return categories[category] || { color: '#fbbf24', label: 'TECH' };
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5, 5, 20, 0.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, fontFamily: 'Orbitron, sans-serif', color: 'white'
        }}>
            <h1 style={{
                fontSize: '3rem', color: '#fbbf24', textShadow: '0 0 20px #fbbf24',
                letterSpacing: '10px', marginBottom: '50px'
            }}>
                LEGENDARY UPGRADE
            </h1>

            <div style={{ display: 'flex', gap: '30px' }}>
                {options.map((opt, i) => {
                    const info = getLegendaryInfo(opt.category);
                    const isSelected = i === selectedIndex;

                    return (
                        <div
                            key={i}
                            onClick={() => onSelect(opt)}
                            style={{
                                width: '320px', height: '480px',
                                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%)',
                                border: isSelected ? `4px solid #fff` : `3px solid ${info.color}`,
                                borderRadius: '15px',
                                padding: '30px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                transition: 'all 0.2s ease-out',
                                boxShadow: isSelected ? `0 0 50px ${info.color}, 0 0 20px #fff` : `0 0 15px ${info.color}44`,
                                transform: isSelected ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)',
                                position: 'relative',
                                overflow: 'hidden',
                                zIndex: isSelected ? 10 : 1
                            }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px',
                                color: info.color, fontSize: '0.8rem', fontWeight: 'bold'
                            }}>
                                {opt.level > 1 ? `LEVEL ${opt.level}` : 'NEW MODULE'}
                            </div>

                            <div style={{
                                width: '220px', height: '220px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '20px',
                                position: 'relative',
                                filter: `drop-shadow(0 0 15px ${info.color})`
                            }}>
                                {opt.customIcon ? (
                                    <img
                                        src={opt.customIcon}
                                        alt={opt.name}
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: 'contain',
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '3rem' }}>★</span>
                                )}
                            </div>

                            <h2 style={{ color: info.color, fontSize: '1.4rem', textAlign: 'center', marginBottom: '15px', textShadow: `0 0 10px ${info.color}aa` }}>
                                {opt.name}
                            </h2>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 10px', overflowY: 'auto' }}>
                                {opt.perks?.map((perk, idx) => {
                                    const isNew = idx === opt.level - 1;
                                    return (
                                        <div key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            color: isNew ? '#fbbf24' : '#64748b',
                                            fontSize: '0.85rem',
                                            fontWeight: isNew ? '900' : '500',
                                            padding: '6px 12px',
                                            background: isNew ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0,0,0,0.2)',
                                            borderRadius: '6px',
                                            border: isNew ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                                            textShadow: isNew ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'
                                        }}>
                                            {isNew && <span style={{
                                                fontSize: '9px',
                                                background: '#fbbf24',
                                                color: '#0f172a',
                                                padding: '2px 5px',
                                                borderRadius: '3px',
                                                fontWeight: '900',
                                                textShadow: 'none',
                                                boxShadow: '0 0 10px #fbbf24'
                                            }}>NEW</span>}
                                            {perk}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                <div style={{ color: '#22d3ee', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                                    {opt.category.toUpperCase()} SECTOR
                                </div>
                            </div>

                            {/* Animated Glow Line */}
                            <div className="legendary-glow-line" style={{
                                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px',
                                background: info.color, boxShadow: `0 0 15px ${info.color}`
                            }} />
                        </div>
                    );
                })}
            </div>

            <p style={{ marginTop: '40px', color: '#64748b', fontSize: '0.9rem' }}>
                Recovered technology must be manually integrated in the Module Matrix.
            </p>

            <style>{`
                @keyframes legendaryPulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .legendary-glow-line {
                    animation: legendaryPulse 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
