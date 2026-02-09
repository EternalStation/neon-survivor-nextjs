import React, { useState, useEffect } from 'react';
import { type BestiaryEntry, getThreatColor } from '../../data/BestiaryData';

interface BestiaryDetailViewProps {
    entry: BestiaryEntry;
}

// SVG Shape Renderer (Duplicated from BestiaryView for now to avoid circular deps/refactoring)
const EnemyShapeIcon: React.FC<{ shape: string, size?: number, color?: string }> = ({ shape, size = 60, color = '#ef4444' }) => {
    const s = size / 2;
    const isBoss = shape.includes('boss_');
    const baseShape = shape.replace('elite_', '').replace('boss_', '');
    const strokeWidth = isBoss ? "4" : "2";

    // ... shapes ...
    const renderShape = () => {
        switch (baseShape) {
            case 'circle': return <circle cx={size} cy={size} r={s} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'triangle': return <polygon points={`${size},${size - s} ${size + s * 0.866},${size + s * 0.5} ${size - s * 0.866},${size + s * 0.5}`} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'square': return <rect x={size - s} y={size - s} width={s * 2} height={s * 2} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'diamond': return <polygon points={`${size},${size - s * 1.3} ${size + s},${size} ${size},${size + s * 1.3} ${size - s},${size}`} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'pentagon':
                const pentPoints = Array.from({ length: 5 }).map((_, i) => {
                    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                    return `${size + Math.cos(angle) * s},${size + Math.sin(angle) * s}`;
                }).join(' ');
                return <polygon points={pentPoints} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'hexagon':
                const hexPoints = Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
                    return `${size + Math.cos(angle) * s},${size + Math.sin(angle) * s}`;
                }).join(' ');
                return <polygon points={hexPoints} fill={color} stroke={color} strokeWidth={strokeWidth} opacity="0.8" />;
            case 'minion': return <polygon points={`${size + s},${size} ${size - s},${size + s * 0.7} ${size - s * 0.3},${size} ${size - s},${size - s * 0.7}`} fill={color} stroke={color} strokeWidth="2" opacity="0.8" />;
            case 'snitch': return <g><circle cx={size} cy={size} r={s * 0.7} fill={color} opacity="0.8" /><polygon points={`${size - s * 0.8},${size - s * 0.6} ${size - s * 2.2},${size - s * 0.4} ${size - s * 2.0},${size} ${size - s * 0.8},${size - s * 0.2}`} fill={color} opacity="0.6" /><polygon points={`${size + s * 0.8},${size - s * 0.6} ${size + s * 2.2},${size - s * 0.4} ${size + s * 2.0},${size} ${size + s * 0.8},${size - s * 0.2}`} fill={color} opacity="0.6" /></g>;
            case 'glitcher': return <g><line x1={size} y1={size} x2={size + s * 1.5} y2={size - s * 1.5} stroke="#ff00ff" strokeWidth="3" opacity="0.7" /><line x1={size} y1={size} x2={size - s * 1.5} y2={size + s * 1.5} stroke="#00ffff" strokeWidth="3" opacity="0.7" /></g>;
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
            // 'boss' generic is no longer needed but kept for safety
            case 'boss': return <g><circle cx={size} cy={size} r={s * 1.2} fill="none" stroke={color} strokeWidth="4" opacity="0.8" /><circle cx={size} cy={size} r={s * 0.6} fill={color} opacity="0.6" /></g>;
            default: return <circle cx={size} cy={size} r={s} fill={color} opacity="0.5" />;
        }
    };
    return (
        <svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`}>
            <defs><filter id={`glow-${shape}-detail`}><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <g filter={`url(#glow-${shape}-detail)`}>{renderShape()}</g>
        </svg>
    );
};

export const BestiaryDetailView: React.FC<BestiaryDetailViewProps> = ({ entry }) => {
    const [scanProgress, setScanProgress] = useState(0);

    useEffect(() => {
        setScanProgress(0);
        const interval = setInterval(() => {
            setScanProgress(prev => {
                const next = prev + 5;
                if (next >= 100) clearInterval(interval);
                return next;
            });
        }, 50);
        return () => clearInterval(interval);
    }, [entry]);

    const color = getThreatColor(entry.threat);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            position: 'relative',
            overflowY: 'auto', // Ensure whole container scrolls if needed
            overflowX: 'hidden'
        }}>
            {/* HEADER */}
            <div style={{
                padding: '15px',
                borderBottom: `1px solid ${color}40`,
                background: `${color}10`,
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexShrink: 0,
                position: 'relative'
            }}>
                <div style={{
                    width: '60px', height: '60px',
                    border: `1px solid ${color}`,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '4px'
                }}>
                    <EnemyShapeIcon shape={entry.id} size={40} color={color} />
                </div>
                <div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px', textShadow: `0 0 10px ${color}80` }}>
                        {entry.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                        {entry.classification.toUpperCase()}
                    </div>
                </div>

                {/* TYPE Badge moved to bottom right */}
                <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '15px',
                    padding: '4px 10px',
                    background: `${color}22`,
                    border: `1px solid ${color}66`,
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <span style={{ fontSize: '9px', color: color, fontWeight: 900, opacity: 0.7 }}>TYPE:</span>
                    <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
                        {entry.threat.replace(' Enemy', '').toUpperCase()}
                    </span>
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div style={{
                flex: 1,
                padding: '20px',
                fontFamily: 'monospace',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* SCANNING EFFECT OVERLAY (Fade out) */}
                {scanProgress < 100 && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(5, 5, 15, 0.9)',
                        zIndex: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ width: '80%', height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${scanProgress}%`, height: '100%', background: color, transition: 'width 0.05s linear' }} />
                        </div>
                        <div style={{ position: 'absolute', top: '55%', color: color, fontSize: '10px', fontWeight: 900, letterSpacing: '2px' }}>
                            ANALYZING... {Math.floor(scanProgress)}%
                        </div>
                    </div>
                )}

                {/* Description Box */}
                <div style={{
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    background: 'rgba(59, 130, 246, 0.05)',
                    padding: '12px',
                    borderRadius: '4px'
                }}>
                    <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 900, marginBottom: '6px', letterSpacing: '1px' }}>
                        OVERVIEW
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        {entry.description}
                    </div>
                </div>

                {/* Boss Abilities */}
                {entry.abilities && (
                    <div style={{
                        border: `1px solid ${color}60`,
                        background: `${color}10`,
                        padding: '12px',
                        borderRadius: '4px'
                    }}>
                        <div style={{ fontSize: '10px', color: color, fontWeight: 900, marginBottom: '8px', letterSpacing: '1px' }}>
                            THREAT CAPABILITIES
                        </div>
                        {entry.abilities.lvl1 && (
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ color: '#94a3b8', fontWeight: 700, fontSize: '11px', marginRight: '5px' }}>[LVL 1]</span>
                                <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{entry.abilities.lvl1}</span>
                            </div>
                        )}
                        <div style={{ marginBottom: '8px' }}>
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '11px', marginRight: '5px' }}>[LVL 2]</span>
                            <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{entry.abilities.lvl2}</span>
                        </div>
                        <div>
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px', marginRight: '5px' }}>[LVL 3]</span>
                            <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{entry.abilities.lvl3}</span>
                        </div>
                    </div>
                )}

                <div style={{
                    borderLeft: `2px solid ${color}`,
                    paddingLeft: '12px'
                }}>
                    <div style={{ fontSize: '10px', color: color, fontWeight: 900, marginBottom: '6px', letterSpacing: '1px' }}>
                        BEHAVIOR
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5' }}>
                        {entry.behavior}
                    </div>
                </div>

                {/* Merge Info */}
                {entry.mergeInfo && (
                    <div style={{
                        borderLeft: `2px solid #ef4444`,
                        paddingLeft: '12px'
                    }}>
                        <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 900, marginBottom: '6px', letterSpacing: '1px' }}>
                            FUSION PROTOCOL
                        </div>
                        <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: '1.5', fontWeight: 700 }}>
                            {entry.mergeInfo}
                        </div>
                    </div>
                )}

                {/* Stats Grid - Fixed Line by Line */}
                <div>
                    <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 900, marginBottom: '8px', letterSpacing: '1px' }}>
                        COMBAT METRICS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900 }}>HP RATING</div>
                            <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 900 }}>{entry.stats.hp}</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900 }}>SPEED CLASS</div>
                            <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 900 }}>{entry.stats.speed}</div>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 900 }}>DAMAGE RATING</div>
                            <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 900, maxWidth: '60%', textAlign: 'right' }}>{entry.stats.damage}</div>
                        </div>
                        {entry.stats.xp && (
                            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.2)', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 900 }}>XP REWARD</div>
                                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 900 }}>{entry.stats.xp}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Decorative Footer */}
            <div style={{
                padding: '8px',
                borderTop: `1px solid ${color}40`,
                background: 'rgba(0, 0, 0, 0.4)',
                fontSize: '9px',
                fontFamily: 'monospace',
                color: color,
                display: 'flex', justifyContent: 'space-between',
                opacity: 0.6
            }}>
                <span>SECURE CONNECTION</span>
                <span>DB_VER_2.4.9</span>
            </div>
        </div>
    );
};
