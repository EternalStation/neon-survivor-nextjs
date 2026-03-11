import React from 'react';
import type { GameState, LegendaryHex, Meteorite, LegendaryCategory } from '../logic/core/types';
import './HexTooltip.css';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getMeteoriteImage } from './modules/ModuleUtils';

interface HexTooltipProps {
    hex: LegendaryHex;
    gameState: GameState;
    hexIdx: number;
    neighbors: (Meteorite | null)[];
    x: number;
    y: number;
}

const CATEGORY_COLORS: Record<LegendaryCategory | 'Merger', string> = {
    Economic: '#fbbf24',
    Combat: '#ef4444',
    Defensive: '#3b82f6',
    Fusion: '#f59e0b',
    Merger: '#10b981'
};

export const HexTooltip: React.FC<HexTooltipProps> = ({ hex, gameState, hexIdx, x }) => {
    const color = CATEGORY_COLORS[hex.category];

    const CARD_WIDTH = 280;
    const CARD_HEIGHT = 420;
    const OFFSET = 20;

    let finalX = x + OFFSET;
    const finalY = (window.innerHeight - CARD_HEIGHT) / 2;
    if (finalX + CARD_WIDTH > window.innerWidth) finalX = x - CARD_WIDTH - OFFSET;

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


                        const baseMatch = p.match(/(\d+\.?\d*)/);
                        let baseValue = baseMatch ? parseFloat(baseMatch[1]) : 0;
                        const hasPercent = p.includes('%');

                        let displayValue = "";
                        let cleanLabel = p;
                        let isNumeric = false;

                        if (isEconomic) {

                            const soulMult = gameState.player.soulDrainMult ?? 1.0;
                            const finalValuePerKill = baseValue * multiplier * soulMult;
                            const totalValue = finalValuePerKill * levelKills;
                            displayValue = `+${totalValue.toFixed(2)}${hasPercent ? '%' : ''}`;
                            isNumeric = p.includes('per kill');
                            cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '').replace('per kill', '').trim();
                        } else {
                            if (baseValue > 0 && (hasPercent || p.includes('DMG') || p.includes('HP') || p.includes('Lifesteal') || p.includes('Crit'))) {
                                const amplified = baseValue * multiplier;
                                displayValue = `${hasPercent ? '+' : ''}${amplified.toFixed(1)}${hasPercent ? '%' : ''}`;
                                isNumeric = true;

                                cleanLabel = p.replace(/[+]\d+\.?\d*%?\s*/, '').trim();
                            }
                        }

                        let isStatic = false;
                        if (hex.type === 'DefPlatting') {
                            const isLvl1 = p.includes('DMG') || p.includes('Урон');
                            const isLvl2 = p.includes('HP%') || p.includes('Здоровье%');
                            const isLvl3 = p.includes('Cooldown') || p.includes('перезарядки');
                            const isLvl4 = p.includes('HP/sec') || p.includes('Регенерацию');

                            if (isLvl1 || isLvl2 || isLvl4) {
                                const armorStats = gameState.player.arm;
                                const totalArmor = armorStats ? (armorStats.base + (armorStats.flat || 0) + (armorStats.hexFlat || 0)) * (1 + ((armorStats.mult || 0) + (armorStats.hexMult2 || 0) + (armorStats.hexMult || 0)) / 100) : 0;
                                const actualAmount = totalArmor * 0.01 * multiplier;

                                baseValue = 1;
                                isNumeric = true;
                                isStatic = false;
                                displayValue = `+${actualAmount.toFixed(1)}%`;
                                cleanLabel = `${cleanLabel} (${actualAmount.toFixed(1)}% actual)`;
                            } else if (isLvl3) {
                                const curCDR = (gameState.player.cooldownReduction || 0) * 100;
                                const cdrLabel = cleanLabel.includes('Cooldown') ? 'Cooldown Reduction' : 'Снижение перезарядки';
                                cleanLabel = `${cdrLabel} [${curCDR.toFixed(1)}%]`;
                                baseValue = 0.25;
                                isNumeric = true;
                                displayValue = `+${(0.25 * multiplier).toFixed(1)}% / min`;
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
                                            {isNumeric && !isStatic && (
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '10px' }}>
                                                    <span style={{ color: '#fff', fontWeight: 900, opacity: 0.6 }}>{baseValue}{hasPercent ? '%' : ''}</span>
                                                    <span style={{ color: '#94a3b8', fontSize: '7px' }}>×</span>
                                                    <span style={{ color: color, fontWeight: 900 }}>{multiplier.toFixed(2)}</span>
                                                </div>
                                            )}
                                            {isNumeric && isStatic && (
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    <span style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 900 }}>STATIC</span>
                                                    <span style={{ color: '#fff', fontWeight: 900, opacity: 0.6, fontSize: '10px' }}>{baseValue}</span>
                                                </div>
                                            )}
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
                                                src={getMeteoriteImage(item)}
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
