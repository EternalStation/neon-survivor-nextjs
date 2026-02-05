import React from 'react';
import type { GameState, LegendaryHex, LegendaryCategory } from '../logic/types';
import { calculateMeteoriteEfficiency } from '../logic/EfficiencyLogic';

interface LegendaryDetailProps {
    hex: LegendaryHex;
    gameState: GameState;
    hexIdx: number;
    pending?: boolean;
    placementAlert?: boolean;
}

const CATEGORY_COLORS: Record<LegendaryCategory, string> = {
    Economic: '#fbbf24', // Gold
    Combat: '#ef4444',   // Red
    Defensive: '#3b82f6' // Blue
};

export const LegendaryDetail: React.FC<LegendaryDetailProps> = ({ hex, gameState, hexIdx, pending, placementAlert }) => {
    const color = placementAlert ? '#ef4444' : CATEGORY_COLORS[hex.category];
    const bgGlow = placementAlert ? 'rgba(239, 68, 68, 0.15)' : `${color}11`;

    // Hex i connects to Diamonds: i, (i+5)%6, i+6, ((i+5)%6)+6
    // If pending, use -1 or similar logic? If pending, hexIdx is usually not fixed.
    // However, pending usually means no neighbors yet.
    const connectedDiamondIdxs = pending ? [] : [
        hexIdx,
        (hexIdx + 5) % 6,
        hexIdx + 6,
        ((hexIdx + 5) % 6) + 6
    ];

    const individualBoosts = connectedDiamondIdxs.map(dIdx => {
        const item = gameState.moduleSockets.diamonds[dIdx];
        if (!item) return 0;
        return calculateMeteoriteEfficiency(gameState, dIdx).totalBoost;
    });

    const totalEfficiency = individualBoosts.reduce((acc, b) => acc + b, 0);
    const multiplier = 1 + totalEfficiency;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: bgGlow,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '15px'
            }}>
                {/* ALERT OVERLAY FOR PENDING */}
                {placementAlert && (
                    <div style={{
                        fontSize: '10px', color: '#fff', fontWeight: 900, letterSpacing: '2px',
                        padding: '6px 15px', background: '#ef4444', borderRadius: '4px',
                        border: '1px solid #fff', animation: 'shake 0.5s infinite',
                        boxShadow: '0 0 20px #ef4444', textAlign: 'center', marginBottom: '15px'
                    }}>
                        ATTENTION: INSTALL MODULE FIRST
                    </div>
                )}

                {!placementAlert && pending && (
                    <div style={{
                        fontSize: '10px', color: color, fontWeight: 900, letterSpacing: '2px',
                        padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px',
                        border: `1px solid ${color}`, animation: 'pulse-accent 2s infinite',
                        textAlign: 'center', marginBottom: '15px'
                    }}>
                        PENDING INTEGRATION
                    </div>
                )}

                {/* HEADER */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    marginBottom: '15px', position: 'relative'
                }}>
                    <div style={{
                        width: '60px', height: '60px',
                        border: `2px solid ${color}`, borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.3)',
                        boxShadow: `0 0 20px ${color}33`
                    }}>
                        {hex.customIcon ? (
                            <img src={hex.customIcon} alt="hex" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ fontSize: '32px', color: color }}>★</span>
                        )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: '1px', textShadow: `0 0 10px ${color}66` }}>
                            {hex.name.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* CAPABILITY DESCRIPTION */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '4px', opacity: 0.6 }}>
                            SYSTEM CAPABILITY
                        </div>
                        <div style={{ fontSize: '11px', color: '#fff', lineHeight: '1.4', fontWeight: 600 }}>
                            {hex.description}
                        </div>
                    </div>

                    {hex.lore && (
                        <div style={{
                            padding: '0 10px', borderLeft: `2px solid ${color}44`, fontStyle: 'italic'
                        }}>
                            <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5' }}>
                                "{hex.lore}"
                            </div>
                        </div>
                    )}
                </div>

                {/* STATS AREA (Tactical Format) */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px'
                }}>
                    <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '4px', opacity: 0.6 }}>
                        AUGMENTATION DATA
                    </div>
                    {hex.perks && hex.perks.map((p, i) => {
                        const soulsMatch = p.match(/\((\d+) Souls\)/);
                        const levelKills = soulsMatch ? parseInt(soulsMatch[1]) : 0;
                        const baseMatch = p.match(/(\d+\.?\d*)/);
                        const baseValue = baseMatch ? parseFloat(baseMatch[1]) : 0;
                        const hasPercent = p.includes('%');
                        const isEconomic = hex.category === 'Economic';

                        let displayValue = "";
                        let cleanLabel = p;
                        let isNumeric = false;

                        const tacticalKeywords = ['DMG', 'HP', 'Lifesteal', 'Crit', 'Slow', 'Taken', 'Resist', 'Range', 'Duration', 'Uptime', 'Regen'];

                        if (isEconomic) {
                            const finalValuePerKill = baseValue * multiplier;
                            let divisor = 1;
                            let useFloor = false;
                            if (p.includes('per 20 kills')) divisor = 20;
                            if (p.includes('per 50 kills')) { divisor = 50; useFloor = true; }

                            const effectiveKills = useFloor ? Math.floor(levelKills / divisor) : (levelKills / divisor);
                            const totalValue = finalValuePerKill * effectiveKills;

                            displayValue = `+${totalValue.toFixed(1)}${hasPercent ? '%' : ''}`;
                            isNumeric = p.includes('per kill') || p.includes('per 20 kills') || p.includes('per 50 kills');
                            cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '')
                                .replace('per kill', '')
                                .replace('per 50 kills', '')
                                .replace('per 20 kills', '')
                                .trim();
                        } else {
                            if (baseValue > 0 && (hasPercent || tacticalKeywords.some(k => p.includes(k)))) {
                                const amplified = baseValue * multiplier;
                                displayValue = `${hasPercent ? '+' : ''}${amplified.toFixed(1)}${hasPercent ? '%' : ''}`;
                                isNumeric = true;
                                cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '').trim();
                            }
                        }

                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff' }}>{isNumeric ? `${baseValue}${hasPercent ? '%' : ''}` : ''}</span>
                                        <span style={{ fontSize: '8px', color: isNumeric ? '#64748b' : '#fff', fontWeight: 700, textTransform: 'uppercase' }}>{cleanLabel}</span>
                                    </div>

                                    {isNumeric && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', gap: '4px' }}>
                                            <span style={{ fontSize: '8px', color: '#475569' }}>×</span>
                                            <span style={{ fontSize: '9px', color: color, fontWeight: 900 }}>{multiplier.toFixed(2)}</span>
                                            <span style={{ fontSize: '10px', color: color, opacity: 0.5 }}>|</span>
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>{displayValue}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* RESONANCE SYNERGY (Only if not pending) */}
                {!pending && (
                    <div style={{
                        background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px'
                    }}>
                        <div style={{ fontSize: '8px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '8px', opacity: 0.6 }}>
                            RESONANCE SYNERGY
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {connectedDiamondIdxs.map((dIdx, i) => {
                                const item = gameState.moduleSockets.diamonds[dIdx];
                                const boost = individualBoosts[i];
                                return (
                                    <div key={i} style={{
                                        height: '52px', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 10px',
                                        background: item ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
                                        border: item ? `1px solid ${color}33` : '1px dashed rgba(255,255,255,0.05)',
                                        borderRadius: '6px'
                                    }}>
                                        {item ? (
                                            <>
                                                <img src={`/assets/meteorites/M${item.visualIndex}${item.quality}.png`} alt="met" style={{ width: '28px', height: '28px' }} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900 }}>BOOST</span>
                                                    <span style={{ fontSize: '10px', color: color, fontWeight: 900 }}>+{Math.round(boost * 100)}%</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.05)' }}>⬡</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* PENDING PROMPT (Sticky Footer) */}
            {pending && (
                <div style={{
                    fontSize: '9px', color: color, fontWeight: 900,
                    textAlign: 'center', animation: 'pulse-accent 1s infinite alternate',
                    padding: '12px 10px', letterSpacing: '1px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 -4px 15px rgba(0,0,0,0.3)'
                }}>
                    ◄ SELECT AN OPEN HEX SOCKET IN THE MATRIX ►
                </div>
            )}

            <style>{`
                @keyframes pulse-accent {
                    0% { opacity: 0.5; text-shadow: 0 0 0px ${color}; }
                    100% { opacity: 1; text-shadow: 0 0 10px ${color}; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    );
};
