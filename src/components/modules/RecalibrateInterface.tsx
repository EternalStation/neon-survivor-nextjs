
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
            background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)',
            animation: 'panel-appear 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* COMPACT HEADER */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${rarityColor}33`,
                padding: '6px 12px',
                background: `linear-gradient(90deg, ${rarityColor}11, transparent)`,
                position: 'relative',
                zIndex: 5
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '18px', height: '18px',
                        background: rarityColor,
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 10px ${rarityColor}66`
                    }}>
                        <div style={{ width: '60%', height: '60%', background: '#000', clipPath: 'inherit' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: rarityColor }}>
                            RECALIBRATION STATION
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)',
                        padding: '4px 8px', borderRadius: '2px', cursor: 'pointer',
                        fontWeight: 900, fontSize: '9px', transition: 'all 0.2s', textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                    DISCONNECT
                </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative', zIndex: 1 }}>

                {/* ITEM INFO / QUALITY UPGRADE */}
                <div style={{
                    padding: '10px',
                    background: 'rgba(0,0,0,0.5)',
                    borderWidth: '1px',
                    borderLeftWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderLeftColor: rarityColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative'
                }}>
                    <div style={{ position: 'relative' }}>
                        <img
                            src={getMeteoriteImage(item)}
                            style={{ width: '42px', height: '42px', filter: `drop-shadow(0 0 10px ${rarityColor})` }}
                        />
                        <div style={{
                            position: 'absolute', inset: -4,
                            borderWidth: '1px',
                            borderStyle: 'dashed',
                            borderColor: `${rarityColor}22`,
                            borderRadius: '50%',
                            animation: 'spin-slow 15s infinite linear'
                        }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: '#fff', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.rarity.toUpperCase()} UNIT
                            <span style={{ fontSize: '8px', padding: '1px 4px', background: `${rarityColor}33`, color: rarityColor, borderRadius: '2px' }}>V {item.version?.toFixed(1) || '1.0'}</span>
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            INTEGRITY:
                            <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                                <div style={{
                                    width: quality === 'Broken' ? '20%' : quality === 'Damaged' ? '50%' : '100%',
                                    height: '100%',
                                    background: quality === 'New' ? '#22c55e' : '#f59e0b',
                                    borderRadius: 'inherit',
                                    boxShadow: `0 0 5px ${quality === 'New' ? '#22c55e' : '#f59e0b'}`
                                }} />
                            </div>
                            <span style={{ color: canUpgradeQuality ? '#f59e0b' : '#34d399', fontWeight: 900 }}>{quality}</span>
                        </div>
                    </div>
                    {canUpgradeQuality && (
                        <button
                            disabled={!canAffordQuality}
                            onClick={() => {
                                playSfx('upgrade-confirm');
                                onUpgradeQuality();
                            }}
                            style={{
                                background: canAffordQuality ? rarityColor : '#334155',
                                color: '#000',
                                border: 'none',
                                padding: '6px 12px', borderRadius: '4px',
                                fontSize: '10px', fontWeight: 900,
                                cursor: canAffordQuality ? 'pointer' : 'not-allowed',
                                boxShadow: canAffordQuality ? `0 0 15px ${rarityColor}44` : 'none',
                                transition: 'all 0.2s',
                                clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)'
                            }}
                        >
                            REPAIR {qualityCost.toLocaleString()} FLUX
                        </button>
                    )}
                </div>

                {/* PERK LIST - MORE TECHNICAL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                            [ HARDWARE ARRAY ]
                        </div>
                    </div>

                    {item.perks.map((p, idx) => {
                        const isLocked = lockedIndices.includes(idx);

                        // Efficiency Health Logic (Bad to Great)
                        const rangeSpan = p.range.max - p.range.min;
                        const pos = rangeSpan > 0 ? (p.value - p.range.min) / rangeSpan : 1;
                        const effColor = pos < 0.3 ? '#f87171' : pos < 0.7 ? '#fbbf24' : '#34d399';

                        return (
                            <div key={idx}
                                onClick={() => toggleLock(idx)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '4px 10px',
                                    background: isLocked ? 'rgba(251, 191, 36, 0.05)' : 'rgba(255,255,255,0.02)',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: isLocked ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '1px',
                                    cursor: 'pointer',
                                    transition: 'all 0.1s',
                                    position: 'relative',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <div style={{
                                    fontSize: '8px',
                                    color: isLocked ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                                    width: '48px',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: isLocked ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                                    padding: '2px 3px',
                                    textAlign: 'center',
                                    fontWeight: 900,
                                    letterSpacing: '0.5px',
                                    flexShrink: 0
                                }}>
                                    {isLocked ? 'SECURED' : 'OPEN'}
                                </div>

                                <div style={{ color: 'rgba(255,255,255,0.1)', fontWeight: 100 }}>|</div>

                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                                    <span style={{ fontWeight: 900, color: isLocked ? '#fff' : 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                                        {getPerkName(p.id)}
                                    </span>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '8px', opacity: 0.3 }}>EFFICIENCY:</span>
                                        <span style={{ color: effColor, fontWeight: 900, fontSize: '12px' }}>{p.value}%</span>
                                    </div>
                                </div>

                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 900, fontFamily: 'monospace' }}>
                                    [{p.range.min}-{p.range.max}%]
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ACTION CONSOLE */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '2px', marginBottom: '2px' }}>REROLL</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            disabled={!canAffordRerollType}
                            onClick={() => onRerollType(lockedIndices)}
                            style={{
                                flex: 1,
                                height: '32px',
                                background: canAffordRerollType ? 'rgba(168, 85, 247, 0.1)' : 'rgba(51, 65, 85, 0.1)',
                                color: canAffordRerollType ? '#d8b4fe' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: canAffordRerollType ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                borderRadius: '2px',
                                fontSize: '10px', fontWeight: 900, letterSpacing: '1px',
                                cursor: canAffordRerollType ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 1 }}>PERK {rerollTypeCost.toLocaleString()}</div>
                            {canAffordRerollType && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: '#a855f7' }} />}
                        </button>
                        <button
                            disabled={!canAffordRerollValue}
                            onClick={() => onRerollValue(lockedIndices)}
                            style={{
                                flex: 1,
                                height: '32px',
                                background: canAffordRerollValue ? 'rgba(16, 185, 129, 0.1)' : 'rgba(51, 65, 85, 0.1)',
                                color: canAffordRerollValue ? '#6ee7b7' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: canAffordRerollValue ? '#10b981' : 'rgba(255,255,255,0.1)',
                                borderRadius: '2px',
                                fontSize: '10px', fontWeight: 900, letterSpacing: '1px',
                                cursor: canAffordRerollValue ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'relative', zIndex: 1 }}>PERK RANGE {rerollValueCost.toLocaleString()}</div>
                            {canAffordRerollValue && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: '#10b981' }} />}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 0; }
                
                @keyframes scan-line {
                    0% { transform: translateY(0); opacity: 0; }
                    5% { opacity: 0.3; }
                    95% { opacity: 0.3; }
                    100% { transform: translateY(400px); opacity: 0; }
                }

                @keyframes panel-appear {
                    from { opacity: 0; transform: scale(0.99); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
