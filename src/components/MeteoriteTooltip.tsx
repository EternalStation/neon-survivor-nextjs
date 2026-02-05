import React from 'react';
import type { GameState, Meteorite, MeteoriteRarity } from '../logic/types';
import './MeteoriteTooltip.css';
import { calculateMeteoriteEfficiency } from '../logic/EfficiencyLogic';

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
    return `/assets/meteorites/M${m.visualIndex}${m.quality}.png`;
};

const formatDescription = (text: string, highlightColor: string) => {
    // Keywords to highlight - Order matters (longest first to avoid partial matches)
    const keywords = [
        'ECO-ECO', 'ECO-COM', 'ECO-DEF', 'COM-COM', 'COM-DEF', 'DEF-DEF',
        'Legendary Hex', 'PRISTINE', 'DAMAGED', 'BROKEN',
        'Type', 'Rarity', 'Arena',
        'ECO', 'COM', 'DEF',
        '\\(Any\\)', 'same level'
    ];

    // Case-insensitive regex
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.split(regex).filter(Boolean).map((part, i) => {
        // Check if this part matches one of the keywords (ignoring case)
        if (keywords.some(k => new RegExp(`^${k}$`, 'i').test(part))) {
            return <span key={i} style={{ color: highlightColor, fontWeight: 'bold' }}>{part}</span>;
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
        : { totalBoost: 0, perkResults: {} };

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
                        <span>+{Math.round(efficiency.totalBoost * 100)}%</span>
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
                        if (id.includes('neighbor_any')) return '⚙';
                        if (id.includes('neighbor_new') || id.includes('neighbor_dam') || id.includes('neighbor_bro')) return '◈';
                        if (id.includes('_leg')) return '⌬';
                        if (id.includes('pair')) return '🝔';
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
                                        +{isActive ? perkResult.activeValue : perk.value}%
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
                        color: meteorite.quality === 'New' ? '#4ade80' : (meteorite.quality === 'Broken' ? '#ef4444' : '#fbbf24'),
                        fontSize: '12px',
                        textShadow: `0 0 10px ${meteorite.quality === 'New' ? '#4ade80' : (meteorite.quality === 'Broken' ? '#ef4444' : '#fbbf24')}66`
                    }}>{meteorite.quality === 'New' ? 'PRISTINE' : meteorite.quality.toUpperCase()}</span>
                </div>
                <div style={{ color: '#fff' }}>
                    <span style={{ color: rarityColor, opacity: 0.8 }}>DISCOVERED IN:</span> {meteorite.discoveredIn}
                </div>
            </div>

            {/* Remove Button if Applicable */}
            {/* Remove Button removed as per request to move logic to drag interaction */}
        </div>
    );
};
