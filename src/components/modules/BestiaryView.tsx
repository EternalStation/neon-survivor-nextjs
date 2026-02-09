import React, { useState, useEffect } from 'react';
import type { GameState } from '../../logic/core/types';
import { BESTIARY_DATA, getThreatColor, type BestiaryEntry } from '../../data/BestiaryData';

interface BestiaryViewProps {
    gameState: GameState;
    selectedEnemy?: BestiaryEntry | null;
    onSelectEnemy?: (enemy: BestiaryEntry | null) => void;
}

// SVG Shape Renderer for Enemy Types
const EnemyShapeIcon: React.FC<{ shape: string, size?: number, color?: string }> = ({ shape, size = 60, color = '#ef4444' }) => {
    const renderShape = () => {
        const s = size / 2;
        const isBoss = shape.includes('boss_');
        const baseShape = shape.replace('elite_', '').replace('boss_', '');
        const strokeWidth = isBoss ? "4" : "2";

        switch (baseShape) {
            case 'circle':
                return <circle cx={size} cy={size} r={s} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;

            case 'triangle':
                return (
                    <polygon
                        points={`${size},${size - s} ${size + s * 0.866},${size + s * 0.5} ${size - s * 0.866},${size + s * 0.5}`}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity="0.8"
                    />
                );

            case 'square':
                return (
                    <rect
                        x={size - s}
                        y={size - s}
                        width={s * 2}
                        height={s * 2}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity="0.8"
                    />
                );

            case 'diamond':
                return (
                    <polygon
                        points={`${size},${size - s * 1.3} ${size + s},${size} ${size},${size + s * 1.3} ${size - s},${size}`}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity="0.8"
                    />
                );

            case 'pentagon':
                const pentPoints = Array.from({ length: 5 }).map((_, i) => {
                    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                    return `${size + Math.cos(angle) * s},${size + Math.sin(angle) * s}`;
                }).join(' ');
                return (
                    <polygon
                        points={pentPoints}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity="0.8"
                    />
                );

            case 'hexagon':
                const hexPoints = Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
                    return `${size + Math.cos(angle) * s},${size + Math.sin(angle) * s}`;
                }).join(' ');
                return (
                    <polygon
                        points={hexPoints}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity="0.8"
                    />
                );

            case 'minion':
                return (
                    <polygon
                        points={`${size + s},${size} ${size - s},${size + s * 0.7} ${size - s * 0.3},${size} ${size - s},${size - s * 0.7}`}
                        fill={color}
                        stroke={color}
                        strokeWidth="2"
                        opacity="0.8"
                    />
                );

            case 'snitch':
                return (
                    <g>
                        <circle cx={size} cy={size} r={s * 0.7} fill={color} opacity="0.8" />
                        {/* Blades */}
                        <polygon points={`${size - s * 0.8},${size - s * 0.6} ${size - s * 2.2},${size - s * 0.4} ${size - s * 2.0},${size} ${size - s * 0.8},${size - s * 0.2}`} fill={color} opacity="0.6" />
                        <polygon points={`${size + s * 0.8},${size - s * 0.6} ${size + s * 2.2},${size - s * 0.4} ${size + s * 2.0},${size} ${size + s * 0.8},${size - s * 0.2}`} fill={color} opacity="0.6" />
                    </g>
                );

            case 'glitcher':
                return (
                    <g>
                        <line x1={size} y1={size} x2={size + s * 1.5} y2={size - s * 1.5} stroke="#ff00ff" strokeWidth="3" opacity="0.7" />
                        <line x1={size} y1={size} x2={size - s * 1.5} y2={size + s * 1.5} stroke="#00ffff" strokeWidth="3" opacity="0.7" />
                    </g>
                );
            case 'worm':
                return (
                    <g transform={`translate(${size},${size}) scale(${s / 20})`}>
                        {/* Skull Shape */}
                        <path d="M-15,-10 L-10,-15 L10,-15 L15,-10 L15,5 L0,15 L-15,5 Z" fill={color} opacity="0.8" />
                        {/* Mandibles */}
                        <path d="M-15,-5 L-25,-15 L-20,-5 Z" fill={color} opacity="0.6" />
                        <path d="M15,-5 L25,-15 L20,-5 Z" fill={color} opacity="0.6" />
                        {/* Eyes */}
                        <circle cx="-5" cy="-5" r="2" fill="#fff" />
                        <circle cx="5" cy="-5" r="2" fill="#fff" />
                    </g>
                );
            case 'boss':
                return (
                    <g>
                        <circle cx={size} cy={size} r={s * 1.2} fill="none" stroke={color} strokeWidth="4" opacity="0.8" />
                        <circle cx={size} cy={size} r={s * 0.6} fill={color} opacity="0.6" />
                    </g>
                );

            default:
                return <circle cx={size} cy={size} r={s} fill={color} opacity="0.5" />;
        }
    };

    return (
        <svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
            <defs>
                <filter id={`glow-${shape}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <g filter={`url(#glow-${shape})`}>
                {renderShape()}
            </g>
        </svg>
    );
};



export const BestiaryView: React.FC<BestiaryViewProps> = ({ gameState, selectedEnemy, onSelectEnemy }) => {
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Normal Enemy': false,
        'Elite Enemy': false,
        'Unique': false,
        'Boss': false
    });

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    // Group Data
    const groupedData = BESTIARY_DATA.reduce((acc, entry) => {
        const key = entry.threat;
        if (!acc[key]) acc[key] = [];
        acc[key].push(entry);
        return acc;
    }, {} as Record<string, typeof BESTIARY_DATA>);

    // Order: Normal, Elite, Unique, Boss
    const categoryOrder = ['Normal Enemy', 'Elite Enemy', 'Unique', 'Boss'];

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    color: '#ef4444',
                    letterSpacing: '8px',
                    marginBottom: '5px',
                    textShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
                }}>
                    BESTIARY
                </div>
                <div style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    letterSpacing: '4px',
                    opacity: 0.6
                }}>
                    TACTICAL ENEMY DATABASE
                </div>
            </div>

            {/* ENEMY LIST (Full Width) */}
            <div className="custom-scrollbar" style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: '15px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px', // Gap between categories
                paddingBottom: '20px'
            }}>
                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #ef4444; border-radius: 2px; }
                `}</style>

                {categoryOrder.map(category => {
                    const entries = groupedData[category] || [];
                    if (entries.length === 0) return null;
                    const isExpanded = expandedCategories[category];
                    const color = getThreatColor(entries[0].threat); // Use color of first item for header

                    return (
                        <div key={category}>
                            {/* Category Header */}
                            <div
                                onClick={() => toggleCategory(category)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 15px',
                                    background: isExpanded ? `${color}22` : 'rgba(15, 23, 42, 0.4)',
                                    border: `1px solid ${isExpanded ? `${color}66` : 'rgba(255, 255, 255, 0.05)'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginBottom: isExpanded ? '10px' : '0',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 900,
                                        color: isExpanded ? color : '#94a3b8',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {category}
                                    </span>
                                    <span style={{
                                        fontSize: '10px',
                                        color: '#64748b',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '1px 6px',
                                        borderRadius: '10px'
                                    }}>{entries.length}</span>
                                </div>
                                <div style={{
                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    color: isExpanded ? color : '#64748b',
                                    fontSize: '10px'
                                }}>
                                    ▼
                                </div>
                            </div>

                            {/* Category Items */}
                            {isExpanded && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '10px' }}>
                                    {entries.map(entry => (
                                        <div
                                            key={entry.id}
                                            onMouseEnter={(e) => {
                                                if (onSelectEnemy) onSelectEnemy(entry);
                                                if (selectedEnemy?.id !== entry.id) {
                                                    e.currentTarget.style.backgroundColor = `${color}15`;
                                                }
                                            }}
                                            style={{
                                                background: selectedEnemy?.id === entry.id ? `${color}15` : 'rgba(15, 23, 42, 0.4)',
                                                border: `1px solid ${selectedEnemy?.id === entry.id ? color : 'transparent'}`,
                                                borderLeft: `3px solid ${selectedEnemy?.id === entry.id ? color : 'transparent'}`,
                                                borderRadius: '4px',
                                                padding: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedEnemy?.id !== entry.id) {
                                                    e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.4)';
                                                }
                                            }}
                                        >
                                            <div style={{ flexShrink: 0 }}>
                                                <EnemyShapeIcon shape={entry.id} size={24} color={color} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: 900,
                                                    color: selectedEnemy?.id === entry.id ? '#fff' : '#cbd5e1',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {entry.name}
                                                </div>
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: '#94a3b8',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    opacity: 0.7
                                                }}>
                                                    {entry.classification}
                                                </div>
                                            </div>
                                            {selectedEnemy?.id === entry.id && (
                                                <div style={{
                                                    fontSize: '10px',
                                                    color: color,
                                                    fontWeight: 900,
                                                    animation: 'pulse-arrow 1s infinite'
                                                }}>
                                                    ►
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes pulse-arrow {
                    0%, 100% { transform: translateX(0); opacity: 1; }
                    50% { transform: translateX(3px); opacity: 0.5; }
                }
            `}</style>
        </div >
    );
};
