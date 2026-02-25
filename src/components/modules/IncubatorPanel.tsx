import React, { useState } from 'react';
import type { GameState, IncubatedMeteorite } from '../../logic/core/types';
import { getMeteoriteImage } from './ModuleUtils';
import { playSfx } from '../../logic/audio/AudioLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface IncubatorPanelProps {
    gameState: GameState;
    movedItem: { item: any; source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null;
    setMovedItem: (item: any) => void;
    onIncubatorUpdate: (index: number, item: any | null) => void;
    onInventoryUpdate: (index: number, item: any | null) => void;
    onUpdate: () => void;
}

export const IncubatorPanel: React.FC<IncubatorPanelProps> = ({
    gameState, movedItem, setMovedItem, onIncubatorUpdate, onInventoryUpdate, onUpdate
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);

    const handleMouseUp = (idx: number) => {
        if (!movedItem || !movedItem.item) return;

        // Ensure it's a meteorite (not a legendary hex)
        if (movedItem.item.rarity === undefined) return;

        const targetMet = gameState.incubator[idx];

        if (movedItem.source === 'inventory') {
            // Move to Incubator
            const newMet: IncubatedMeteorite = {
                ...movedItem.item,
                insertedAt: gameState.gameTime,
                growthTicks: 0,
                instability: movedItem.item.instability || 0
            };

            // Swap if occupied
            if (targetMet) {
                onInventoryUpdate(movedItem.index, targetMet);
            } else {
                onInventoryUpdate(movedItem.index, null);
            }

            onIncubatorUpdate(idx, newMet);
            setMovedItem(null);
            playSfx('socket-place');
            onUpdate();
        } else if (movedItem.source === 'incubator') {
            // Swap within incubator
            onIncubatorUpdate(movedItem.index, targetMet);
            onIncubatorUpdate(idx, movedItem.item);
            setMovedItem(null);
            playSfx('socket-place');
            onUpdate();
        }
    };

    const handleMouseDown = (idx: number) => {
        const met = gameState.incubator[idx];
        if (met) {
            setMovedItem({ item: met, source: 'incubator', index: idx });
            onIncubatorUpdate(idx, null);
            playSfx('ui-click');
            onUpdate();
        }
    };

    return (
        <div style={{
            background: 'linear-gradient(180deg, rgba(20, 10, 30, 0.9) 0%, rgba(10, 5, 20, 0.95) 100%)',
            border: '1px solid #7e22ce',
            borderRight: '4px solid #a855f7',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: '#e9d5ff', fontSize: '13px', letterSpacing: '2px', fontWeight: 900 }}>{t.incubator.title}</h3>
                <div style={{ fontSize: '10px', color: '#a855f7' }}>{t.incubator.growth} +5% / MIN</div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-around' }}>
                {gameState.incubator.map((met, i) => (
                    <div
                        key={i}
                        onMouseUp={() => handleMouseUp(i)}
                        onMouseDown={() => handleMouseDown(i)}
                        style={{
                            width: '70px',
                            height: '70px',
                            background: met ? (met.isRuined ? 'rgba(50, 10, 10, 0.5)' : 'rgba(30, 10, 50, 0.5)') : 'rgba(0,0,0,0.3)',
                            border: `1px solid ${met ? (met.isRuined ? '#ef4444' : '#a855f7') : '#334155'}`,
                            borderRadius: '6px',
                            position: 'relative',
                            cursor: met ? 'grab' : (movedItem ? 'grabbing' : 'pointer'),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: met && !met.isRuined ? 'inset 0 0 15px rgba(168, 85, 247, 0.2)' : 'none'
                        }}
                        className={met && !met.isRuined ? 'incubating' : ''}
                    >
                        {met ? (
                            <>
                                <img
                                    src={getMeteoriteImage(met)}
                                    alt="Meteorite"
                                    style={{
                                        width: '45px',
                                        height: '45px',
                                        objectFit: 'contain',
                                        filter: met.isRuined ? 'grayscale(100%) brightness(0.5)' : `drop-shadow(0 0 5px #a855f7)`,
                                        opacity: met.isRuined ? 0.4 : 1
                                    }}
                                />
                                {met.isRuined ? (
                                    <div style={{ position: 'absolute', color: '#ef4444', fontWeight: 900, fontSize: '11px', textShadow: '0 0 4px black', zIndex: 2 }}>{t.incubator.ruined}</div>
                                ) : (
                                    <div style={{ position: 'absolute', bottom: '2px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: 900, textShadow: '0 0 4px #000' }}>
                                            +{met.incubatorBoost || 0}
                                        </span>
                                        <div style={{ width: '80%', height: '3px', background: '#333', margin: '2px auto 0', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{ width: `${met.instability}%`, height: '100%', background: '#ef4444' }} />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ color: '#475569', fontSize: '10px', fontWeight: 700 }}>{t.incubator.empty}</div>
                        )}

                        {/* Hover Overlay */}
                        {movedItem && !met && (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(168, 85, 247, 0.1)' }} />
                        )}
                    </div>
                ))}
            </div>
            <style jsx>{`
                @keyframes forge-pulse {
                    0% { box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.2), 0 0 5px rgba(168, 85, 247, 0.1); }
                    50% { box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.4), 0 0 15px rgba(168, 85, 247, 0.2); }
                    100% { box-shadow: inset 0 0 10px rgba(168, 85, 247, 0.2), 0 0 5px rgba(168, 85, 247, 0.1); }
                }
                .incubating {
                    animation: forge-pulse 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};
