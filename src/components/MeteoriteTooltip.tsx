import React from 'react';
import type { GameState, Meteorite, MeteoriteRarity } from '../logic/core/types';
import './MeteoriteTooltip.css';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';

interface MeteoriteTooltipProps {
    meteorite: Meteorite;
    gameState: GameState;
    meteoriteIdx?: number; // Optional index if placed in socket
    x: number;
    y: number;
    isInteractive?: boolean;
    isEmbedded?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const RARITY_COLORS: Record<MeteoriteRarity, string> = {
    scrap: '#7FFF00',
    anomalous: '#00C0C0',
    quantum: '#00FFFF',
    astral: '#7B68EE',
    radiant: '#FFD700',
    void: '#8B0000',
    eternal: '#B8860B',
    divine: '#FFFFFF',
    singularity: '#E942FF'
};

const RARITY_INFO: Record<MeteoriteRarity, { name: string, symbol: string }> = {
    scrap: { name: 'SALVAGED FRAGMENT', symbol: '◈' },
    anomalous: { name: 'ANOMALOUS SHARD', symbol: '⬢' },
    quantum: { name: 'QUANTUM CORE', symbol: '◆' },
    astral: { name: 'ASTRAL SEED', symbol: '★' },
    radiant: { name: 'RADIANT STAR', symbol: '✦' },
    void: { name: 'VOID CATALYST', symbol: '❂' },
    eternal: { name: 'ETERNAL CORE', symbol: '✵' },
    divine: { name: 'DIVINE ESSENCE', symbol: '✷' },
    singularity: { name: 'SINGULARITY POINT', symbol: '✺' }
};

const getMeteoriteImage = (m: Meteorite) => {
    const assetQuality = m.quality === 'Corrupted' ? 'New' : m.quality;
    return `/assets/meteorites/M${m.visualIndex}${assetQuality}.png`;
};

const formatDescription = (text: string, highlightColor: string) => {
    // Keywords to highlight - Order matters (longest first to avoid partial matches)
    const keywords = [
        'ECO-ECO', 'ECO-COM', 'ECO-DEF', 'COM-COM', 'COM-DEF', 'DEF-DEF',
        'Legendary Hex', 'PRISTINE', 'DAMAGED', 'BROKEN', 'CORRUPTED',
        'Type', 'Rarity', 'Arena',
        'ECO', 'COM', 'DEF',
        '\\(Any\\)', 'same level'
    ];

    // Case-insensitive regex
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.split(regex).filter(Boolean).map((part, i) => {
        const upperPart = part.toUpperCase();
        // Check if this part matches one of the keywords (ignoring case)
        if (keywords.some(k => new RegExp(`^${k}$`, 'i').test(part))) {
            const isCorrupted = upperPart === 'CORRUPTED';
            return (
                <span key={i} style={{
                    color: highlightColor,
                    fontWeight: 'bold',
                    background: isCorrupted ? `${highlightColor}15` : 'transparent',
                    padding: isCorrupted ? '0 4px' : '0',
                    borderRadius: '3px',
                    border: isCorrupted ? `1px solid ${highlightColor}33` : 'none',
                    textShadow: `0 0 8px ${highlightColor}44`,
                    display: isCorrupted ? 'inline-block' : 'inline',
                    lineHeight: isCorrupted ? '1.2' : 'normal'
                }}>
                    {upperPart}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

export const MeteoriteTooltip: React.FC<MeteoriteTooltipProps> = ({
    meteorite, gameState, meteoriteIdx = -1, x,
    isInteractive,
    isEmbedded,
    onMouseEnter, onMouseLeave
}) => {
    // const [shake, setShake] = React.useState(false); // Unused
    const rarityColor = RARITY_COLORS[meteorite.rarity];
    const info = RARITY_INFO[meteorite.rarity];

    // ... efficiency logic remains ...
    const efficiency = meteoriteIdx !== -1
        ? calculateMeteoriteEfficiency(gameState, meteoriteIdx)
        : { totalBoost: 0, perkResults: {} as Record<string, any>, blueprintBoost: 0 };

    // Calculate how many stats we have
    const activeStatsCount = meteorite.perks ? meteorite.perks.length : 0;

    const CARD_WIDTH = isEmbedded ? '100%' : 350;
    // Tighter height calculation to remove empty space
    const CARD_HEIGHT = isEmbedded ? '100%' : 240 + (activeStatsCount * 32);
    const OFFSET = 20;

    // Final positioning: Centered vertically on screen, horizontal follows cursor
    let finalX = x + OFFSET;
    const finalY = (window.innerHeight - (typeof CARD_HEIGHT === 'number' ? CARD_HEIGHT : 400)) / 2;

    if (!isEmbedded && finalX + (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 350) > window.innerWidth) {
        finalX = x - (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 350) - OFFSET;
    }

    const tooltipStyle: React.CSSProperties = isEmbedded ? {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'transparent',
        ['--rarity-color' as any]: rarityColor
    } : {
        position: 'fixed',
        left: finalX,
        top: finalY,
        width: `${CARD_WIDTH}px`,
        height: 'auto', // Allow content to dictate height to ensure border wraps everything
        minHeight: `${CARD_HEIGHT}px`,
        zIndex: 5000,
        pointerEvents: isInteractive ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: `3px solid ${rarityColor}`,
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        boxShadow: `0 0 30px ${rarityColor}44`,
        ['--rarity-color' as any]: rarityColor,
        // Animation removed
    };

    const formatPct = (val: number, isDirectPct: boolean = false) => {
        const raw = isDirectPct ? val : val * 100;
        const rounded = Math.round(raw * 10) / 10;
        return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    };

    return (
        <div
            style={tooltipStyle}
            className="meteorite-card-pulse"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${rarityColor}66;
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${rarityColor};
                }
            `}</style>
            {meteorite.isBlueprint ? (
                <div style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                    border: '2px solid #3b82f6',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.2)',
                    minHeight: '160px',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* SCANLINE EFFECT */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.05) 1px, rgba(59, 130, 246, 0.05) 2px)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '55px', height: '55px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid #3b82f6',
                            borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                        }}>
                            <img src="/assets/Icons/Blueprint.png" style={{
                                width: '75%', height: '75%', objectFit: 'contain',
                                filter: 'drop-shadow(0 0 5px #60a5fa)'
                            }} alt="BP" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 5px #3b82f6' }} />
                                <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 900, letterSpacing: '2px' }}>ARCHIVE ANOMALY</span>
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>ENCRYPTED DATASET</span>
                        </div>
                    </div>

                    <p style={{
                        fontSize: '11px', color: '#94a3b8', margin: '4px 0', lineHeight: '1.4', fontStyle: 'italic',
                        borderLeft: '2px solid #3b82f6', paddingLeft: '10px', position: 'relative', zIndex: 1
                    }}>
                        Deep-space telemetry recovered from an abandoned orbital station. The data appears to contain advanced chassis augmentation protocols, but requires local research processing to initialize.
                    </p>

                    <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        background: 'rgba(59, 130, 246, 0.05)',
                        border: '1px dashed rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        textAlign: 'center',
                        position: 'relative', zIndex: 1
                    }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#60a5fa', marginBottom: '2px' }}>RESEARCH ANALYSIS</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>DECRYPTION COMPLEXITY:</span>
                            <span style={{ fontSize: '10px', color: '#fff', fontWeight: 900 }}>UNKNOWN (PROCESSING...)</span>
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px', textAlign: 'center', opacity: 0.7 }}>
                            *Decryption duration varies based on encryption complexity
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.5px' }}>RIGHT-CLICK TO BEGIN DECRYPTION</span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header: Name + Symbol + Total Power */}
                    <div style={{
                        padding: '12px 10px',
                        borderBottom: `2px solid ${rarityColor}66`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: `${rarityColor}11`
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: 900,
                                color: '#fff',
                                letterSpacing: '1px'
                            }}>{info.name}</span>
                            <div style={{
                                marginTop: '2px',
                                fontSize: '12px',
                                fontWeight: 900,
                                color: rarityColor,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{ opacity: 0.6, fontSize: '10px' }}>ACTIVE POWER:</span>
                                <span>+{formatPct(efficiency.totalBoost)}%</span>
                                {meteorite.blueprintBoosted && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px',
                                        background: 'rgba(59, 130, 246, 0.2)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid rgba(59, 130, 246, 0.4)',
                                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#60a5fa', letterSpacing: '0.5px' }}>HARM-V +2%</span>
                                    </div>
                                )}
                                {efficiency.blueprintBoost > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px',
                                        background: 'rgba(249, 115, 22, 0.2)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid rgba(249, 115, 22, 0.4)',
                                        boxShadow: '0 0 10px rgba(249, 115, 22, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#fb923c', letterSpacing: '0.5px' }}>MATR-X +{formatPct(efficiency.blueprintBoost)}%</span>
                                    </div>
                                )}
                                {meteoriteIdx === -1 && <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '4px' }}>(UNPLACED)</span>}
                            </div>
                        </div>
                        <span style={{
                            fontSize: '19px',
                            color: rarityColor,
                            textShadow: `0 0 10px ${rarityColor}`
                        }}>{info.symbol}</span>
                    </div>


                    {/* Illustration Area (Unchanged) */}
                    <div style={{
                        flex: '0 0 140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 70%)`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0.1,
                            backgroundImage: `linear-gradient(${rarityColor} 1px, transparent 1px), linear-gradient(90deg, ${rarityColor} 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }} />
                        <img
                            src={getMeteoriteImage(meteorite)}
                            alt={meteorite.rarity}
                            style={{
                                width: '110px',
                                height: '110px',
                                objectFit: 'contain',
                                filter: `drop-shadow(0 0 15px ${rarityColor})`
                            }}
                        />
                    </div>

                    {/* Protocols Label */}
                    <div style={{
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: rarityColor,
                        fontWeight: 900,
                        letterSpacing: '2px',
                        backgroundColor: `${rarityColor}22`,
                        textAlign: 'center',
                        textTransform: 'uppercase'
                    }}>
                        Augmentation Protocols
                    </div>

                    {/* Stats Area with Active/Inactive Logic */}
                    <div className="custom-scrollbar" style={{
                        flex: 1,
                        padding: '12px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        overflowY: 'auto',
                        minHeight: 0
                    }}>
                        {meteorite.perks && meteorite.perks.map((perk, idx) => {
                            const perkResult = efficiency.perkResults[perk.id];
                            const isActive = perkResult && perkResult.count > 0;

                            const getPerkIcon = (id: string) => {
                                return '◈';
                            };

                            const getPerkName = (id: string) => {
                                if (id === 'base_efficiency') return 'METEORITIC PARTICLE';
                                if (id === 'neighbor_any_all') return 'PROXIMITY RELAY';
                                if (id.startsWith('neighbor_any_')) return 'SECTOR AMPLIFIER';
                                if (id.startsWith('neighbor_new_') || id.startsWith('neighbor_dam_') || id.startsWith('neighbor_bro_')) return 'CONDITION LINK';
                                if (id === 'neighbor_leg_any') return 'LEGENDARY LIAISON';
                                if (id.startsWith('neighbor_leg_')) return 'ALPHA CONTROLLER';
                                if (id.startsWith('pair_')) {
                                    if (id.endsWith('_lvl')) return 'HARMONY PAIR';
                                    return 'SYNERGY PAIR';
                                }
                                if (id === 'matrix_same_type_rarity') return 'SINGULARITY CORE';
                                return 'METEORIC PROTOCOL';
                            };

                            const formatVal = (val: number) => {
                                const rounded = Math.round(val * 10) / 10;
                                return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
                            };

                            return (
                                <div key={idx} className="card-stat-line" style={{
                                    alignItems: 'flex-start',
                                    paddingRight: '6px'
                                }}>
                                    <span className="bullet" style={{ color: isActive ? rarityColor : '#94a3b8', marginTop: '2px', opacity: isActive ? 1 : 0.6 }}>
                                        {getPerkIcon(perk.id)}
                                    </span>
                                    <div className="content" style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <span className="label" style={{ fontSize: '9px', opacity: 0.9, fontWeight: 900 }}>{getPerkName(perk.id)}</span>
                                                <span style={{ fontSize: '9px', color: rarityColor, opacity: 0.5 }}>({perk.range.min}-{perk.range.max}%)</span>
                                            </div>
                                            <span className="value" style={{
                                                fontSize: '13px',
                                                color: isActive ? '#fff' : '#94a3b8',
                                                opacity: isActive ? 1 : 0.4,
                                                fontWeight: 900,
                                                marginLeft: '12px',
                                                textAlign: 'right'
                                            }}>
                                                +{formatPct(isActive ? perkResult.activeValue : (perk.id === 'base_efficiency' ? perk.value : 0), true)}%
                                            </span>
                                        </div>


                                        <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2', marginTop: '1px', opacity: 0.9 }}>
                                            {formatDescription(perk.description, rarityColor)}
                                            {isActive && perkResult.count > 1 && <span style={{ color: '#FCD34D' }}> (x{perkResult.count})</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer / Info Panel */}
                    <div style={{
                        padding: '10px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '10px', // Added spacing per request
                        borderTop: `1px solid ${rarityColor}33`,
                        background: 'rgba(0,0,0,0.5)',
                        fontSize: '11px',
                        letterSpacing: '0.5px',
                        fontWeight: 900,
                        textTransform: 'uppercase'
                    }}>
                        <div style={{ color: '#fff' }}>
                            <span style={{ color: rarityColor, opacity: 0.8 }}>TYPE:</span> <span style={{
                                color: meteorite.quality === 'Corrupted' ? '#a855f7' : (meteorite.quality === 'New' ? '#4ade80' : (meteorite.quality === 'Broken' ? '#ef4444' : '#fbbf24')),
                                fontSize: '12px',
                                textShadow: `0 0 10px ${meteorite.quality === 'Corrupted' ? '#a855f7' : (meteorite.quality === 'New' ? '#4ade80' : (meteorite.quality === 'Broken' ? '#ef4444' : '#fbbf24'))}66`
                            }}>{meteorite.quality === 'New' ? 'PRISTINE' : meteorite.quality.toUpperCase()}{meteorite.quality === 'Corrupted' && <span style={{ fontSize: '9px', marginLeft: '6px', opacity: 0.8, color: '#ef4444' }}>(COST X3 DUST)</span>}</span>
                        </div>
                        <div style={{ color: '#fff' }}>
                            <span style={{ color: rarityColor, opacity: 0.8 }}>DISCOVERED IN:</span> {meteorite.discoveredIn}
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};
