import React from 'react';
import type { GameState, LegendaryHex, Meteorite, LegendaryCategory } from '../logic/types';
import './HexTooltip.css';
import { calculateMeteoriteEfficiency } from '../logic/EfficiencyLogic';

interface HexTooltipProps {
    hex: LegendaryHex;
    gameState: GameState;
    hexIdx: number;
    neighbors: (Meteorite | null)[];
    x: number;
    y: number;
}

const CATEGORY_COLORS: Record<LegendaryCategory, string> = {
    Economic: '#fbbf24', // Gold
    Combat: '#f87171',   // Red
    Defensive: '#60a5fa' // Blue
};

export const HexTooltip: React.FC<HexTooltipProps> = ({ hex, gameState, hexIdx, x }) => {
    const color = CATEGORY_COLORS[hex.category];

    const CARD_WIDTH = 280;
    // Calculate content height based on stats
    const CARD_HEIGHT = 420;
    const OFFSET = 20;

    // ... Positioning Logic (unchanged)
    let finalX = x + OFFSET;
    const finalY = (window.innerHeight - CARD_HEIGHT) / 2;
    if (finalX + CARD_WIDTH > window.innerWidth) finalX = x - CARD_WIDTH - OFFSET;

    // Empowerment calculation
    // Hex i connects to Diamonds: i, (i+5)%6, i+6, ((i+5)%6)+6
    const connectedDiamondIdxs = [
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
    const kills = gameState.killCount - hex.killsAtAcquisition;

    return (
        <div className="hex-tooltip hex-tooltip-pulse" style={{
            left: finalX,
            top: finalY,
            '--hex-color': color,
            border: `3px solid ${color}`,
            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            boxShadow: `0 0 30px ${color}44`,
        } as any}>
            {/* Header: Name + Level + Kills */}
            <div style={{
                padding: '12px 10px',
                borderBottom: `2px solid ${color}66`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: `${color}11`
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff', letterSpacing: '2px', textShadow: `0 0 10px ${color}` }}>
                        {hex.name.toUpperCase()}
                    </div>
                    {hex.category === 'Economic' && (
                        <div style={{ fontSize: '7px', color: '#94a3b8', marginTop: '2px', fontWeight: 900 }}>
                            SOUL HARVEST: <span style={{ color: '#fff' }}>{kills}</span>
                        </div>
                    )}
                </div>
                <div className="hex-level-tag" style={{ background: color, color: '#111', fontSize: '10px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px' }}>
                    LVL {hex.level}
                </div>
            </div>

            <div className="hex-tooltip-body" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Statutory Breakdown Section */}
                <div style={{
                    padding: '8px 10px',
                    fontSize: '8px',
                    color: color,
                    fontWeight: 900,
                    letterSpacing: '2px',
                    backgroundColor: `${color}15`,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    marginTop: '2px'
                }}>
                    Augmentation Breakdown
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                    {hex.perks && hex.perks.map((p, i) => {
                        const isEconomic = hex.category === 'Economic';
                        const level = i + 1;
                        const startKills = hex.killsAtLevel ? (hex.killsAtLevel[level] ?? hex.killsAtAcquisition) : hex.killsAtAcquisition;
                        const levelKills = Math.max(0, gameState.killCount - startKills);

                        // Logic to extract numeric value: +15%, 0.2, etc.
                        const baseMatch = p.match(/(\d+\.?\d*)/);
                        const baseValue = baseMatch ? parseFloat(baseMatch[1]) : 0;
                        const hasPercent = p.includes('%');

                        let displayValue = "";
                        let cleanLabel = p;
                        let isNumeric = false;

                        if (isEconomic) {
                            // Economic logic: Base * Resonance * Souls
                            const finalValuePerKill = baseValue * multiplier;
                            const totalValue = finalValuePerKill * levelKills;
                            displayValue = `+${totalValue.toFixed(2)}${hasPercent ? '%' : ''}`;
                            isNumeric = p.includes('per kill');

                            // Extract Label: "+0.2 DMG per kill" -> "DMG"
                            cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '').replace('per kill', '').trim();
                        } else {
                            // Combat/Defense logic: Base * Resonance (if it has a number)
                            if (baseValue > 0 && (hasPercent || p.includes('DMG') || p.includes('HP') || p.includes('Lifesteal') || p.includes('Crit'))) {
                                const amplified = baseValue * multiplier;
                                displayValue = `${hasPercent ? '+' : ''}${amplified.toFixed(1)}${hasPercent ? '%' : ''}`;
                                isNumeric = true;

                                // Extract Label: "+15% Lifesteal" -> "Lifesteal"
                                cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '').trim();
                            }
                        }

                        return (
                            <div key={i} className="hex-stat-column" style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: i < hex.perks!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '7px', color: color, fontWeight: 900, opacity: 0.8, letterSpacing: '1px' }}>
                                        {cleanLabel.toUpperCase()}
                                    </div>
                                    {isEconomic && isNumeric && (
                                        <div style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 900 }}>SOULS: <span style={{ color: '#fff' }}>{levelKills}</span></div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {isNumeric ? (
                                        <>
                                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '10px' }}>
                                                <span style={{ color: '#fff', fontWeight: 900, opacity: 0.6 }}>{baseValue}{hasPercent ? '%' : ''}</span>
                                                <span style={{ color: '#94a3b8', fontSize: '7px' }}>×</span>
                                                <span style={{ color: color, fontWeight: 900 }}>{multiplier.toFixed(2)}</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 900, textShadow: `0 0 10px ${color}66` }}>
                                                {displayValue}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ fontSize: '10px', color: '#fff', fontWeight: 900, lineHeight: '1.2' }}>{p}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Synergy Matrix (The 4 connected meteorites) */}
                <div className="hex-synergy-section" style={{ marginTop: '2px' }}>
                    <div className="synergy-label" style={{ fontSize: '8px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '10px', opacity: 0.8, textAlign: 'center' }}>
                        RESONANCE SYNERGY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {connectedDiamondIdxs.map((dIdx, i) => {
                            const item = gameState.moduleSockets.diamonds[dIdx];
                            const boost = individualBoosts[i];

                            return (
                                <div key={i} style={{
                                    height: '55px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: item ? `${color}11` : 'rgba(0,0,0,0.2)',
                                    border: item ? `1px solid ${color}44` : '1px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '6px',
                                    position: 'relative'
                                }}>
                                    {item ? (
                                        <>
                                            <img
                                                src={`/assets/meteorites/M${item.visualIndex}${item.quality}.png`}
                                                alt="met"
                                                style={{ width: '22px', height: '22px', filter: `drop-shadow(0 0 5px ${color}44)` }}
                                            />
                                            <span style={{ fontSize: '8px', color: color, fontWeight: 900, marginTop: '2px' }}>+{Math.round(boost * 100)}%</span>
                                        </>
                                    ) : (
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {totalEfficiency > 0 ? (
                        <div style={{
                            marginTop: '12px',
                            padding: '6px',
                            background: `${color}22`,
                            borderRadius: '4px',
                            textAlign: 'center',
                            border: `1px solid ${color}33`
                        }}>
                            <span style={{ fontSize: '9px', color: '#fff', fontWeight: 900, letterSpacing: '1px' }}>
                                TOTAL RESONANCE: <span style={{ color }}>+{Math.round(totalEfficiency * 100)}%</span>
                            </span>
                        </div>
                    ) : (
                        <div style={{ marginTop: '10px', textAlign: 'center', fontSize: '8px', color: '#64748b', fontStyle: 'italic' }}>
                            Zero Resonance Detected
                        </div>
                    )}
                </div>
            </div>

            <div className="hex-tooltip-footer" style={{ padding: '8px', textAlign: 'center', fontSize: '9px', color: `${color}66`, letterSpacing: '2px', background: 'rgba(0,0,0,0.4)', borderTop: `1px solid ${color}22` }}>
                LEGENDARY UPGRADE ⌬ SYNERGY ENABLED
            </div>
        </div>
    );
};
