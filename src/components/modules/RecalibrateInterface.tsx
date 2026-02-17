
import React, { useState } from 'react';
import type { GameState, Meteorite } from '../../logic/core/types';
import { getMeteoriteImage, RARITY_COLORS, getPerkName, getPerkIcon } from './ModuleUtils';
import { playSfx } from '../../logic/audio/AudioLogic';
import { getUpgradeQualityCost, getRerollTypeCost, getRerollValueCost } from '../../logic/upgrades/RecalibrateLogic';

interface RecalibrateInterfaceProps {
    item: Meteorite;
    gameState: GameState;
    onClose: () => void;
    onUpgradeQuality: () => void;
    onRerollType: (lockedPerkIndices: number[]) => void;
    onRerollValue: (lockedPerkIndices: number[]) => void;
}

export const RecalibrateInterface: React.FC<RecalibrateInterfaceProps> = ({
    item, gameState, onClose, onUpgradeQuality, onRerollType, onRerollValue
}) => {
    const [lockedIndices, setLockedIndices] = useState<number[]>([]);

    const toggleLock = (idx: number) => {
        setLockedIndices(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
        playSfx('ui-click');
    };

    const rarityColor = RARITY_COLORS[item.rarity];
    const quality = item.quality || 'Broken';

    const qualityCost = getUpgradeQualityCost(item);
    const canUpgradeQuality = quality === 'Broken' || quality === 'Damaged';
    const canAffordQuality = gameState.player.isotopes >= qualityCost;

    const rerollTypeCost = getRerollTypeCost(item, lockedIndices.length);
    const rerollValueCost = getRerollValueCost(item, lockedIndices.length);

    const canAffordRerollType = gameState.player.isotopes >= rerollTypeCost;
    const canAffordRerollValue = gameState.player.isotopes >= rerollValueCost;

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex', flexDirection: 'column',
            color: '#fff',
            position: 'relative',
            margin: '0',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 10%, rgba(15, 23, 42, 0.4) 0%, transparent 70%)',
            animation: 'panel-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* AMBIENT BACKGROUND GLOW */}
            <div style={{
                position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                width: '300px', height: '300px',
                background: rarityColor,
                filter: 'blur(100px)',
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* TOP HEADER: ENHANCEMENT ARRAY */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${rarityColor}44`,
                padding: '8px 16px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        position: 'relative',
                        width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            border: `2px solid ${rarityColor}`,
                            borderRadius: '4px',
                            transform: 'rotate(45deg)',
                            animation: 'pulse-glow 2s infinite'
                        }} />
                        <span style={{ fontSize: '10px', fontWeight: 900, color: rarityColor }}>☢</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: '#fff', textShadow: `0 0 10px ${rarityColor}66` }}>
                            ENHANCEMENT STATION
                        </span>
                        <span style={{ fontSize: '7px', color: rarityColor, fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>SYSTEM READY // LOADED UNIT: {item.rarity.toUpperCase()}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444',
                        padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 900, fontSize: '10px', transition: 'all 0.2s', textTransform: 'uppercase',
                        letterSpacing: '1px',
                        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                >
                    EJECT
                </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 5 }}>

                {/* CENTRAL UNIT HUD */}
                <div style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '86px'
                }}>
                    {/* Scanner Lines Animated Background */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.03) 1px, rgba(59, 130, 246, 0.03) 2px)',
                        pointerEvents: 'none'
                    }} />

                    {/* LEFT: ICON */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            position: 'relative',
                            width: '44px', height: '44px',
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${rarityColor}aa`,
                            boxShadow: `0 0 20px ${rarityColor}44, inset 0 0 15px ${rarityColor}22`
                        }}>
                            <div style={{
                                position: 'absolute', inset: -10,
                                border: `1px solid ${rarityColor}33`,
                                borderRadius: '50%',
                                animation: 'spin-slow 20s infinite linear'
                            }} />
                            <div style={{
                                position: 'absolute', inset: -5,
                                border: `1px dashed ${rarityColor}44`,
                                borderRadius: '50%',
                                animation: 'spin-reverse 10s infinite linear'
                            }} />

                            <img
                                src={getMeteoriteImage(item)}
                                style={{ width: '32px', height: '32px', filter: `drop-shadow(0 0 12px ${rarityColor})` }}
                                alt="loaded unit"
                            />
                        </div>
                    </div>

                    {/* CENTER: UNIT NAME */}
                    <div style={{ flex: 1, textAlign: 'center', zIndex: 1 }}>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '4px',
                            textShadow: `0 0 15px ${rarityColor}66`,
                            textTransform: 'uppercase'
                        }}>
                            {item.rarity} UNIT
                        </div>
                    </div>

                    {/* RIGHT: DATA COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', zIndex: 1, minWidth: '130px' }}>
                        {/* REPAIR BUTTON (Top Right) */}
                        <div style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                            {canUpgradeQuality ? (
                                <button
                                    disabled={!canAffordQuality}
                                    onClick={() => {
                                        playSfx('upgrade-confirm');
                                        onUpgradeQuality();
                                    }}
                                    style={{
                                        background: canAffordQuality ? `linear-gradient(180deg, ${rarityColor}, ${rarityColor}cc)` : '#1e293b',
                                        color: '#000',
                                        border: 'none',
                                        padding: '4px 20px', borderRadius: '4px',
                                        fontSize: '9px', fontWeight: 900,
                                        cursor: canAffordQuality ? 'pointer' : 'not-allowed',
                                        boxShadow: canAffordQuality ? `0 0 12px ${rarityColor}44` : 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        opacity: canAffordQuality ? 1 : 0.5,
                                        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    REPAIR ({qualityCost} F)
                                </button>
                            ) : (
                                <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: 900, letterSpacing: '1.5px', textShadow: '0 0 5px rgba(34, 197, 94, 0.5)', whiteSpace: 'nowrap' }}>✓ INTEGRITY MAX</span>
                            )}
                        </div>

                        {/* INTEGRITY STATUS (Middle Right) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Visual Integrity Bar */}
                            <div style={{ width: '60px', height: '3px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{
                                    width: quality === 'Broken' ? '33%' : quality === 'Damaged' ? '66%' : '100%',
                                    height: '100%',
                                    background: quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e',
                                    boxShadow: `0 0 10px ${quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e'}66`
                                }} />
                            </div>
                            <span style={{ fontSize: '7px', fontWeight: 900, color: quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e', textTransform: 'uppercase' }}>{quality}</span>
                        </div>

                        {/* VERSION & CORRUPTION STATUS (Bottom Right) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '7px', color: '#64748b', fontWeight: 900, letterSpacing: '1px' }}>VERSION ID</span>
                                <span style={{
                                    fontSize: '9px', color: '#fff',
                                    fontWeight: 900, fontFamily: 'monospace',
                                    opacity: 0.8
                                }}>
                                    V {item.version?.toFixed(1) || '1.0'}
                                </span>
                            </div>
                            {item.isCorrupted && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'rgba(239, 68, 68, 0.1)', padding: '1px 4px', borderRadius: '2px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.5px' }}>CORRUPTED UNIT // COST +50%</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PERK ARRAY - ENHANCED VISUALS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
                            HARDWARE ARRAY
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, rgba(255,255,255,0.1), transparent)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {item.perks.map((p, idx) => {
                            const isLocked = lockedIndices.includes(idx);
                            const rangeSpan = p.range.max - p.range.min;
                            const pos = rangeSpan > 0 ? (p.value - p.range.min) / rangeSpan : 1;
                            const effColor = pos < 0.3 ? '#f87171' : pos < 0.7 ? '#fbbf24' : '#34d399';

                            return (
                                <div key={idx}
                                    onClick={() => toggleLock(idx)}
                                    style={{
                                        display: 'flex', flexDirection: 'column',
                                        padding: '8px 12px',
                                        background: isLocked ? 'rgba(251, 191, 36, 0.08)' : 'rgba(15, 23, 42, 0.5)',
                                        border: `1px solid ${isLocked ? '#fbbf24' : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isLocked) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isLocked) {
                                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                        }
                                    }}
                                >
                                    {isLocked && <div style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '100%', background: '#fbbf24' }} />}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <div style={{
                                            width: '14px', height: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: isLocked ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                                            fontSize: '10px'
                                        }}>
                                            {isLocked ? '🔒' : '🔓'}
                                        </div>

                                        <span style={{ fontSize: '11px', fontWeight: 900, color: isLocked ? '#fff' : 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                                            {getPerkName(p.id).toUpperCase()}
                                        </span>

                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                            [{p.range.min}-{p.range.max}%]
                                        </span>

                                        <div style={{ flex: 1 }} />

                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '15px', fontWeight: 900, color: effColor, textShadow: `0 0 10px ${effColor}44` }}>
                                                {p.value}%
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: '9px', color: 'rgba(255,255,255,0.5)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        paddingTop: '6px',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        fontStyle: 'italic'
                                    }}>
                                        {p.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BOTTOM CONSOLE: REROLL ACTIONS */}
                <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            disabled={!canAffordRerollType}
                            onClick={() => onRerollType(lockedIndices)}
                            style={{
                                flex: 1,
                                height: '44px',
                                background: canAffordRerollType ? 'rgba(168, 85, 247, 0.05)' : 'rgba(51, 65, 85, 0.05)',
                                color: canAffordRerollType ? '#d8b4fe' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: canAffordRerollType ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                                cursor: canAffordRerollType ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                            onMouseEnter={(e) => { if (canAffordRerollType) { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; e.currentTarget.style.borderColor = '#c084fc'; } }}
                            onMouseLeave={(e) => { if (canAffordRerollType) { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)'; e.currentTarget.style.borderColor = '#a855f7'; } }}
                        >
                            <span style={{ fontSize: '12px' }}>REROLL PERKS</span>
                            <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollTypeCost.toLocaleString()} FLUX</span>
                            {canAffordRerollType && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />}
                        </button>

                        <button
                            disabled={!canAffordRerollValue}
                            onClick={() => onRerollValue(lockedIndices)}
                            style={{
                                flex: 1,
                                height: '44px',
                                background: canAffordRerollValue ? 'rgba(16, 185, 129, 0.05)' : 'rgba(51, 65, 85, 0.05)',
                                color: canAffordRerollValue ? '#6ee7b7' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: canAffordRerollValue ? '#10b981' : 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                                cursor: canAffordRerollValue ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                            onMouseEnter={(e) => { if (canAffordRerollValue) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.borderColor = '#34d399'; } }}
                            onMouseLeave={(e) => { if (canAffordRerollValue) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; e.currentTarget.style.borderColor = '#10b981'; } }}
                        >
                            <span style={{ fontSize: '12px' }}>REROLL RANGE</span>
                            <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollValueCost.toLocaleString()} FLUX</span>
                            {canAffordRerollValue && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
                
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; box-shadow: 0 0 10px currentColor; }
                    50% { opacity: 1; box-shadow: 0 0 20px currentColor; }
                }

                @keyframes panel-appear {
                    from { opacity: 0; transform: scale(1.02) translateY(5px); filter: blur(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
            `}</style>
        </div>
    );
};
