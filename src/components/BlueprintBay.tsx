import React, { useState } from 'react';
import type { GameState, Blueprint, Meteorite } from '../logic/core/Types';
import { BLUEPRINT_DATA, activateBlueprint, researchBlueprint, scrapBlueprint, checkResearchProgress, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { TICK_INTERVAL } from '../logic/upgrades/IncubatorLogic';
import { getMeteoriteImage, RARITY_COLORS } from './modules/ModuleUtils';
import { playSfx } from '../logic/audio/AudioLogic';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/UiTranslations';

interface BlueprintBayProps {
    gameState: GameState;
    onHoverBlueprint: (bp: Blueprint | null) => void;
    recalibrateSlot: Meteorite | null;
    setRecalibrateSlot: (item: Meteorite | null) => void;
    movedItem: { item: any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null) => void;
    onInventoryUpdate: (index: number, item: any) => void;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    onAttemptRemove?: (index: number, item: any, replaceWith?: any, dropTarget?: { type: 'inventory' | 'recalibrate', index?: number }) => void;
    onIncubatorUpdate: (index: number, item: any | null) => void;
    onUpdate: () => void;
    onInsufficientDust?: () => void;
    /** Called once on mount so the parent can trigger opening the deploy modal from elsewhere (e.g. InventoryPanel) */
    onRegisterBlueprintClick?: (fn: (bp: Blueprint) => void) => void;
}

export const BlueprintBay: React.FC<BlueprintBayProps> = ({
    gameState,
    onHoverBlueprint,
    recalibrateSlot,
    setRecalibrateSlot,
    movedItem,
    setMovedItem,
    onInventoryUpdate,
    onSocketUpdate,
    onAttemptRemove,
    onIncubatorUpdate,
    onUpdate,
    onInsufficientDust,
    onRegisterBlueprintClick
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const [promptBlueprint, setPromptBlueprint] = useState<Blueprint | null>(null);
    const [isHoveringForge, setHoveringForge] = useState(false);
    const [fuelError, setFuelError] = useState(false);
    const [, setTick] = useState(0);
    // Shutter stays OPEN if: hovering, dragging, OR meteorite is inside
    const isForgeShieldOpen = !!movedItem || isHoveringForge || !!gameState.incubator[0];

    // Register the open-modal callback so parent/InventoryPanel can trigger it
    React.useEffect(() => {
        if (onRegisterBlueprintClick) {
            onRegisterBlueprintClick((bp: Blueprint) => setPromptBlueprint(bp));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onRegisterBlueprintClick]);

    React.useEffect(() => {
        const hasResearch = gameState.inventory.some(item => item?.isBlueprint && item.status === 'researching');
        if (hasResearch) {
            const interval = setInterval(() => {
                const finished = checkResearchProgress(gameState);
                if (finished) {
                    onUpdate();
                } else {
                    setTick(t => t + 1);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameState.inventory, onUpdate]);

    const handleConfirmActivate = () => {
        if (promptBlueprint) {
            // Find in inventory instead of gameState.blueprints
            const invIdx = gameState.inventory.findIndex(i => i && i.isBlueprint && (i as any).id === promptBlueprint.id);
            if (invIdx !== -1) {
                if (activateBlueprint(gameState, invIdx)) {
                    setPromptBlueprint(null);
                    onUpdate();
                }
            }
        }
    };

    const handleScrap = () => {
        if (promptBlueprint) {
            const invIdx = gameState.inventory.findIndex(i => i && i.isBlueprint && (i as any).id === promptBlueprint.id);
            if (invIdx !== -1) {
                scrapBlueprint(gameState, invIdx);
                setPromptBlueprint(null);
                onUpdate();
            }
        }
    };

    return (
        <div className="blueprint-bay-lab">
            {/* GRID OVERLAY & SCANLINES */}
            <div className="lab-overlay" />



            <div className="lab-main-layout">
                {/* LEFT: RECALIBRATION MODULE FRAME */}
                <div className="lab-section recalibration-zone">
                    <div className="section-header">{t.recalibrate.moduleTitle}</div>
                    <div
                        className={`scanner-socket recalibration-dock ${recalibrateSlot ? 'active' : ''} ${movedItem ? 'highlight' : ''}`}
                        onMouseUp={(e) => {
                            if (movedItem && movedItem.source !== 'recalibrate') {
                                e.stopPropagation();
                                if (recalibrateSlot) {
                                    let emptyIdx = -1;
                                    for (let i = 10; i < gameState.inventory.length; i++) if (!gameState.inventory[i]) { emptyIdx = i; break; }
                                    if (emptyIdx === -1) for (let i = 0; i < 10; i++) if (!gameState.inventory[i]) { emptyIdx = i; break; }
                                    if (emptyIdx !== -1) onInventoryUpdate(emptyIdx, { ...recalibrateSlot, isNew: false });
                                }
                                if (movedItem.source === 'diamond' && onAttemptRemove) {
                                    onAttemptRemove(movedItem.index, movedItem.item, undefined, { type: 'recalibrate' });
                                    setMovedItem(null);
                                    return;
                                }
                                setRecalibrateSlot(movedItem.item);
                                if (movedItem.source === 'inventory') onInventoryUpdate(movedItem.index, null);
                                if (movedItem.source === 'diamond') onSocketUpdate('diamond', movedItem.index, null);
                                setMovedItem(null);
                            }
                        }}
                    >
                        {/* INDUSTRIAL DOCK BASE */}
                        <div className="dock-mechanical-layer">
                            <div className="mounting-bracket br-tl" />
                            <div className="mounting-bracket br-tr" />
                            <div className="mounting-bracket br-bl" />
                            <div className="mounting-bracket br-br" />
                            <div className="optical-lens">
                                <div className="lens-iris" />
                            </div>
                        </div>

                        {recalibrateSlot ? (
                            <div className="socket-item-wrap recalibrate-static">
                                <img
                                    src={getMeteoriteImage(recalibrateSlot)}
                                    className="item-img"
                                    style={{ width: '62px', height: '62px', objectFit: 'contain', filter: 'drop-shadow(0 0 15px #3b82f6)' }}
                                />
                                {/* Status badges */}
                                <div style={{ position: 'absolute', bottom: '-13px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', zIndex: 10 }}>
                                    {recalibrateSlot.isCorrupted && (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(153,27,27,0.6)' }}>
                                            <span style={{ fontSize: '6px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>C</span>
                                        </div>
                                    )}
                                    {(recalibrateSlot.incubatorBoost || 0) > 0 && (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(14,165,233,0.5)' }}>
                                            <span style={{ fontSize: '6px', fontWeight: 900, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                        </div>
                                    )}
                                    {(recalibrateSlot as any).blueprintBoosted && (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(96,165,250,0.5)' }}>
                                            <span style={{ fontSize: '6px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="item-drag-layer"
                                    onMouseDown={(e) => {
                                        if (e.button === 0) {
                                            e.stopPropagation();
                                            setMovedItem({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="dock-status-led">STANDBY</div>
                        )}
                        {recalibrateSlot && <div className="diagnostic-ring" />}
                    </div>
                </div>

                {/* RIGHT: METEORITE INCUBATOR FRAME */}
                <div className="lab-section forge-complex">
                    <div className="section-header">
                        <span>{t.incubator.title}</span>
                        <div className="fuel-header-wrap">
                            <span className="fuel-text">{gameState.incubatorFuel}/30</span>
                            <div className="tube-container horizontal" style={{ width: '64px' }}>
                                <div className="tube-fill fuel horizontal" style={{ width: `${(gameState.incubatorFuel / gameState.incubatorFuelMax) * 100}%` }}>
                                    <div className="plasma-core horizontal" />
                                    <div className="plasma-bubbles horizontal" />
                                </div>
                                <div className="tube-glass" />
                            </div>
                            <button
                                className="load-fuel-btn mini"
                                onClick={() => {
                                    if (gameState.incubatorFuel >= gameState.incubatorFuelMax) return;

                                    if (gameState.player.dust >= 3) {
                                        gameState.player.dust -= 3;
                                        gameState.incubatorFuel = Math.min(gameState.incubatorFuelMax, gameState.incubatorFuel + 3);
                                        playSfx('upgrade-confirm');
                                        onUpdate();
                                    } else {
                                        playSfx('ui-click');
                                        setFuelError(true);
                                        setTimeout(() => setFuelError(false), 2000);
                                        if (onInsufficientDust) onInsufficientDust();
                                    }
                                }}
                                disabled={gameState.incubatorFuel >= gameState.incubatorFuelMax}
                            >
                                {t.incubator.loadFuel}
                            </button>
                            {fuelError && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    right: '5px',
                                    color: '#ef4444',
                                    fontSize: '8px',
                                    fontWeight: 900,
                                    textShadow: '0 0 5px black',
                                    animation: 'fadeOutUp 1.5s forwards',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 9999
                                }}>
                                    {t.incubator.notEnoughDust}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="forge-and-tubes-row">
                        {/* THE FORGE SOCKET */}
                        <div
                            className={`forge-socket ${gameState.incubator[0] ? 'active' : ''}`}
                            onMouseEnter={() => setHoveringForge(true)}
                            onMouseLeave={() => setHoveringForge(false)}
                            onMouseUp={(e) => {
                                if (!movedItem || !movedItem.item || movedItem.item.isBlueprint || movedItem.source === 'incubator') return;
                                e.stopPropagation();
                                const current = gameState.incubator[0];
                                const newMet = {
                                    ...movedItem.item,
                                    insertedAt: gameState.gameTime,
                                    growthTicks: 0,
                                    instability: movedItem.item.instability || 0
                                };

                                // Clear previous item in incubator if any, move to inventory or swap
                                if (current) {
                                    let targetIdx = -1;
                                    if (movedItem.source === 'inventory') targetIdx = movedItem.index;
                                    else {
                                        for (let i = 10; i < gameState.inventory.length; i++) if (!gameState.inventory[i]) { targetIdx = i; break; }
                                        if (targetIdx === -1) for (let i = 0; i < 10; i++) if (!gameState.inventory[i]) { targetIdx = i; break; }
                                    }
                                    if (targetIdx !== -1) onInventoryUpdate(targetIdx, { ...current, isNew: false });
                                }

                                // Clear source
                                if (movedItem.source === 'inventory' && !current) onInventoryUpdate(movedItem.index, null);
                                if (movedItem.source === 'recalibrate') setRecalibrateSlot(null);
                                if (movedItem.source === 'diamond') onSocketUpdate('diamond', movedItem.index, null);

                                onIncubatorUpdate(0, newMet);
                                setMovedItem(null);
                                playSfx('socket-place');
                                onUpdate();
                            }}
                        >
                            {/* THE VERTICAL LAB SHUTTER SYSTEM */}
                            <div className={`forge-shutter-complex ${isForgeShieldOpen ? 'open' : 'closed'}`}>
                                <div className="shutter-roller" />
                                <div className="shutter-glass">
                                    <div className="glass-grid" />
                                    <div className="glass-reflection" />
                                </div>
                                <div className="shutter-bezel-bottom" />
                            </div>

                            {/* HIGH-FIDELITY MAGNETIC PANEL */}
                            <div className="forge-base industrial-panel">
                                <div className="panel-frame" />
                                <div className="energy-core">
                                    <div className="core-aperture" />
                                </div>
                                <div className="flux-conduits">
                                    <div className="conduit c-left" />
                                    <div className="conduit c-right" />
                                </div>
                                <div className="magnetic-plasma-column" />
                                <div className="base-glow" />
                            </div>

                            {/* METEORITE ICON (SCALED UP) */}
                            {gameState.incubator[0] && (
                                <>
                                    {/* INCUBATOR GROWTH LABEL (STATIC) */}
                                    <div style={{
                                        position: 'absolute',
                                        top: gameState.incubator[0].isRuined ? '-18px' : '-22px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        whiteSpace: 'nowrap',
                                        color: (gameState.incubator[0].isRuined || gameState.incubatorFuel <= 0) ? '#ef4444' : '#00d9ff',
                                        fontSize: '10px',
                                        fontWeight: 950,
                                        textAlign: 'center',
                                        textShadow: (gameState.incubator[0].isRuined || gameState.incubatorFuel <= 0)
                                            ? '0 0 10px rgba(239, 68, 68, 0.7)'
                                            : '0 0 10px rgba(0, 217, 255, 0.5)',
                                        zIndex: 5
                                    }}>
                                        {gameState.incubator[0].isRuined
                                            ? t.incubator.criticalFailure
                                            : gameState.incubatorFuel <= 0
                                                ? t.incubator.offline
                                                : `${t.meteorites.stats.incubLabel || 'INCUB'}: +${gameState.incubator[0].incubatorBoost || 0}%`}
                                    </div>

                                    <div className="socket-item-wrap floating-forge" style={{ width: '52px', height: '72px', zIndex: 1 }}>
                                        <img
                                            src={getMeteoriteImage(gameState.incubator[0])}
                                            className="item-img forge-img"
                                            style={{
                                                width: '100%', height: '100%', objectFit: 'contain',
                                                filter: gameState.incubator[0].isRuined
                                                    ? 'grayscale(1) brightness(0.5) sepia(1) hue-rotate(-50deg) drop-shadow(0 0 10px #ef4444)'
                                                    : 'drop-shadow(0 0 10px #f8717144)'
                                            }}
                                        />
                                        {gameState.incubator[0].isRuined && (
                                            <div style={{
                                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)',
                                                background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 950,
                                                padding: '2px 8px', borderRadius: '2px', border: '2px solid #fff',
                                                boxShadow: '0 0 20px #ef4444', zIndex: 10, pointerEvents: 'none',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {t.incubator.destructed}
                                            </div>
                                        )}
                                        <div className="item-drag-layer" onMouseDown={(e) => {
                                            const met = gameState.incubator[0];
                                            if (!met) return;

                                            // If ruined, clicking recycles it for 5 dust
                                            if (met.isRuined) {
                                                e.stopPropagation();
                                                gameState.player.dust += 5;
                                                onIncubatorUpdate(0, null);
                                                playSfx('recycle');
                                                onUpdate();
                                                return;
                                            }

                                            setMovedItem({ item: met, source: 'incubator', index: 0 });
                                            onIncubatorUpdate(0, null);
                                            onUpdate();
                                        }}
                                            onDoubleClick={(e) => {
                                                const met = gameState.incubator[0];
                                                if (!met) return;
                                                // Find first empty slot (preferring storage 9+)
                                                let emptyIdx = -1;
                                                for (let i = 9; i < gameState.inventory.length; i++) {
                                                    if (gameState.inventory[i] === null) { emptyIdx = i; break; }
                                                }
                                                if (emptyIdx === -1) {
                                                    for (let i = 0; i < 9; i++) {
                                                        if (gameState.inventory[i] === null) { emptyIdx = i; break; }
                                                    }
                                                }

                                                if (emptyIdx !== -1) {
                                                    onInventoryUpdate(emptyIdx, met);
                                                    onIncubatorUpdate(0, null);
                                                    setMovedItem(null); // Just in case it was picked up
                                                    playSfx('socket-place');
                                                    onUpdate();
                                                }
                                            }}
                                        />

                                        {/* Status badges for incubator — order: C → I → H */}
                                        <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px', zIndex: 10 }}>
                                            {gameState.incubator[0]?.isCorrupted && (
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(153,27,27,0.6)' }}>
                                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>C</span>
                                                </div>
                                            )}
                                            {(gameState.incubator[0]?.incubatorBoost || 0) > 0 && (
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(14,165,233,0.5)' }}>
                                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                                </div>
                                            )}
                                            {(gameState.incubator[0]?.blueprintBoosted) && (
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 4px rgba(96,165,250,0.5)' }}>
                                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                                </div>
                                            )}
                                        </div>
                                        {/* CORRUPTION SMOKE / GLOW */}
                                        <div className="forge-energy-field" />
                                    </div>
                                </>
                            )}

                            {/* CONSOLIDATED FORGE SVG (ARMS + LASERS) - ALWAYS WORK IF METEORITE PRESENT */}
                            {gameState.incubator[0] && (
                                <svg className="forge-svg" viewBox="0 0 130 110" preserveAspectRatio="none">
                                    <defs>
                                        <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feGaussianBlur stdDeviation="1.5" result="blur" />
                                        </filter>
                                    </defs>

                                    {/* RAILS */}
                                    <line x1="10" y1="5" x2="10" y2="105" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1" />
                                    <line x1="120" y1="5" x2="120" y2="105" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1" />

                                    {/* LEFT ARM SYSTEM */}
                                    <g className="arm-l-sync">
                                        <rect x="2" y="-5" width="10" height="10" rx="1" fill="#334155" stroke="#475569" />
                                        <rect x="12" y="-2" width="6" height="4" fill="#0f172a" stroke="#1e293b" />
                                        {!gameState.incubator[0].isRuined && (
                                            <g className="active-fire-l l-sweep-group">
                                                <line x1="18" y1="0" x2="58" y2="0" className="laser-line quarrel-anim" />
                                                <line x1="18" y1="0" x2="58" y2="0" className="laser-core-line quarrel-anim" />
                                                {/* SPARK POINT */}
                                                <circle cx="58" cy="0" r="2" fill="#fff" className="spark-flicker">
                                                    <animate attributeName="r" values="1;3;1" dur="0.1s" repeatCount="indefinite" />
                                                </circle>
                                            </g>
                                        )}
                                    </g>

                                    {/* RIGHT ARM SYSTEM */}
                                    <g className="arm-r-sync">
                                        <rect x="118" y="-5" width="10" height="10" rx="1" fill="#334155" stroke="#475569" />
                                        <rect x="112" y="-2" width="6" height="4" fill="#0f172a" stroke="#1e293b" />
                                        {!gameState.incubator[0].isRuined && (
                                            <g className="active-fire-r r-sweep-group">
                                                <line x1="112" y1="1" x2="72" y2="1" className="laser-line quarrel-anim" />
                                                <line x1="112" y1="1" x2="72" y2="1" className="laser-core-line quarrel-anim" />
                                                {/* SPARK POINT */}
                                                <circle cx="72" cy="1" r="2" fill="#fff" className="spark-flicker">
                                                    <animate attributeName="r" values="1;3;1" dur="0.1s" repeatCount="indefinite" />
                                                </circle>
                                            </g>
                                        )}
                                    </g>
                                </svg>
                            )}

                            {/* MAGNETIC FIELD EFFECT */}
                            <div className="magnetic-ripples" />

                            {/* INTEGRATED EVOLUTION BAR */}
                            {(() => {
                                const met = gameState.incubator[0];
                                if (!met) return null;
                                return (
                                    <div className="evolution-bar-wrap">
                                        <div className="evolution-bar-container">
                                            <div className="evolution-bar-fill" style={{
                                                width: `${(() => {
                                                    const elapsed = (gameState.gameTime - met.insertedAt) % 3;
                                                    return (elapsed / 3) * 100;
                                                })()}%`
                                            }}>
                                                <div className="bubble-anim" />
                                            </div>
                                        </div>
                                        <div className="evolution-timer">
                                            {(() => {
                                                const elapsed = (gameState.gameTime - met.insertedAt) % TICK_INTERVAL;
                                                const remaining = Math.ceil(TICK_INTERVAL - elapsed);
                                                return `${remaining.toString().padStart(2, '0')} SEC`;
                                            })()}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* STATUS HUB (Tubes) */}
                        <div className="status-hub single-hub">
                            {/* Tube 1: Instability */}
                            <div className="hub-module" style={{ position: 'relative', paddingTop: '6px' }}>
                                <div className="tube-label" style={{
                                    position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)',
                                    whiteSpace: 'nowrap', color: '#94a3b8', letterSpacing: '1px'
                                }}>{t.incubator.instability}</div>

                                <div className="tube-container" style={{ marginTop: '11px' }}>
                                    <div className="tube-fill red" style={{ height: `${gameState.incubator[0]?.instability || 0}%` }}>
                                        <div className="plasma-core" />
                                        <div className="plasma-bubbles" />
                                    </div>
                                    <div className="tube-glass" />
                                </div>

                                <div className="tube-value" style={{ marginTop: '4px', textShadow: '0 0 8px rgba(239, 68, 68, 0.4)' }}>
                                    {Math.round(gameState.incubator[0]?.instability || 0)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTIVATION PROMPT MODAL */}
            {
                promptBlueprint && (
                    <div className="lab-modal-overlay" onClick={() => setPromptBlueprint(null)}>
                        <div className="lab-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <span className="modal-tag">{t.activation.initProtocol}</span>
                                <div className="modal-title">{promptBlueprint.serial || promptBlueprint.name}</div>
                            </div>

                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setPromptBlueprint(null)}>{t.activation.close}</button>

                                {promptBlueprint.status === 'active' && (
                                    <div className="status-label active">{t.activation.deployed}</div>
                                )}

                                {promptBlueprint.status === 'locked' && (
                                    <div className="status-label" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid currentColor' }}>{t.activation.encrypted}</div>
                                )}

                                {promptBlueprint.status === 'researching' && (
                                    <div className="status-label researching">{t.matrix.bpDecrypting}...</div>
                                )}

                                {promptBlueprint.status === 'ready' && (
                                    <>
                                        {isBuffActive(gameState, promptBlueprint.type) ? (
                                            <button disabled className="btn-inactive">{t.activation.alreadyActive}</button>
                                        ) : (
                                            <button
                                                onClick={handleConfirmActivate}
                                                disabled={gameState.player.dust < promptBlueprint.cost}
                                                className={`btn-deploy ${gameState.player.dust < promptBlueprint.cost ? 'locked' : ''}`}
                                            >
                                                <span>{t.activation.deploy}</span>
                                                <div className="price-tag">
                                                    <span>{promptBlueprint.cost}</span>
                                                    <img src="/assets/Icons/MeteoriteDust.png" />
                                                </div>
                                            </button>
                                        )}
                                    </>
                                )}

                                {(promptBlueprint.status === 'locked' || promptBlueprint.status === 'researching' || promptBlueprint.status === 'ready' || promptBlueprint.status === 'broken') && (
                                    <button className="btn-recycle" onClick={handleScrap}>
                                        <span>{t.matrix.recycle}</span>
                                        <div className="price-tag">
                                            <span>+5</span>
                                            <img src="/assets/Icons/MeteoriteDust.png" />
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* DECORATIVE CORNER ACCENTS */}
                            <div className="modal-corner tl" /><div className="modal-corner tr" />
                            <div className="modal-corner bl" /><div className="modal-corner br" />
                        </div>
                    </div>
                )
            }

            <style jsx>{`
                .blueprint-bay-lab {
                    position: relative;
                    background: rgba(4, 4, 8, 0.98);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 4px;
                    padding: 6px 12px;
                    color: white;
                    font-family: 'JetBrains Mono', 'Inter', monospace;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(59, 130, 246, 0.05);
                    margin-top: 4px;
                    height: 175px;
                    overflow: visible;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                }

                .lab-overlay {
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0) 2px, rgba(59, 130, 246, 0.03) 3px, rgba(59, 130, 246, 0.03) 3px);
                    pointer-events: none;
                    z-index: 100;
                }

                .lab-data-corner {
                    position: absolute;
                    font-size: 6px;
                    color: rgba(96, 165, 250, 0.4);
                    line-height: 1.4;
                    pointer-events: none;
                }
                .top-left { top: 6px; left: 12px; }
                .top-right { top: 6px; right: 12px; text-align: right; }

                .lab-header {
                    margin-bottom: 12px;
                    position: relative;
                    z-index: 10;
                }
                .header-label {
                    font-size: 10px;
                    font-weight: 950;
                    color: #fff;
                    letter-spacing: 2px;
                    text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }
                .header-line {
                    height: 1px;
                    background: linear-gradient(90deg, #3b82f6 0%, transparent 100%);
                    margin-top: 2px;
                    width: 150px;
                }

                .lab-main-layout {
                    display: flex;
                    gap: 12px;
                    flex: 1;
                    align-items: stretch;
                }

                .section-divider {
                    width: 1px;
                    background: linear-gradient(180deg, 
                        transparent 0%, 
                        rgba(59, 130, 246, 0.2) 20%, 
                        rgba(59, 130, 246, 0.2) 80%, 
                        transparent 100%
                    );
                    margin: 8px 0;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
                }

                .lab-section {
                    display: flex;
                    flex-direction: column;
                    background: rgba(15, 23, 42, 0.3);
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    border-radius: 4px;
                    padding: 8px 12px;
                    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
                    position: relative;
                }
                .recalibration-zone { flex: 0 0 145px; }
                .forge-complex { flex: 1; }

                .section-header {
                    font-size: 11px;
                    font-weight: 950;
                    color: #fff;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                    padding-bottom: 4px;
                    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .fuel-header-wrap {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(15, 23, 42, 0.5);
                    padding: 2px 6px;
                    border-radius: 4px;
                    border: 0.5px solid rgba(14, 165, 233, 0.2);
                }
                .fuel-text {
                    font-size: 8px;
                    color: #0ea5e9;
                    font-family: monospace;
                    letter-spacing: 0;
                }
                .tube-container.horizontal {
                    width: 42px;
                    height: 8px;
                    flex: none;
                    border-radius: 4px;
                }
                .tube-fill.horizontal {
                    bottom: 0;
                    left: 0;
                    height: 100%;
                    width: 0%;
                    transition: width 0.5s ease-out;
                }
                .tube-fill.fuel.horizontal {
                    background: linear-gradient(90deg, #0c4a6e, #0ea5e9, #7dd3fc);
                }
                .load-fuel-btn {
                    background: #0ea5e9;
                    color: #fff;
                    border: none;
                    border-radius: 2px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 0 5px rgba(14, 165, 233, 0.4);
                }
                .load-fuel-btn:hover:not(:disabled) {
                    background: #0284c7;
                    transform: scale(1.05);
                }
                .load-fuel-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    background: #334155;
                }
                .load-fuel-btn.mini {
                    position: static;
                    font-size: 7px;
                    padding: 1px 4px;
                    height: 14px;
                    margin-left: 2px;
                }
                
                @keyframes fadeOutUp {
                    0% { opacity: 1; transform: translateY(0); }
                    80% { opacity: 1; transform: translateY(-5px); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }

                /* RECALIBRATION SCANNER DOCK */
                .scanner-socket {
                    width: 128px;
                    height: 128px;
                    background: rgba(15, 23, 42, 0.9);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    clip-path: polygon(15% 0, 85% 0, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0 85%, 0 15%);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: auto;
                    box-shadow: 0 0 20px rgba(0,0,0,0.5), inset 0 0 15px rgba(59, 130, 246, 0.1);
                }
                .dock-mechanical-layer {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .mounting-bracket {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    border: 2px solid #334155;
                    transition: border-color 0.5s, box-shadow 0.5s;
                }
                .br-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
                .br-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
                .br-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
                .br-br { bottom: 0; right: 0; border-left: none; border-top: none; }
                
                .scanner-socket.active .mounting-bracket {
                    border-color: #3b82f6;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }

                .optical-lens {
                    position: absolute;
                    inset: 14px;
                    border-radius: 50%;
                    background: #020617;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
                }
                .lens-iris {
                    width: 60%;
                    height: 60%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 80%);
                    border-radius: 50%;
                    opacity: 0.3;
                    transition: opacity 0.5s, transform 0.5s;
                }
                .scanner-socket.active .lens-iris {
                    opacity: 1;
                    transform: scale(1.2);
                    animation: iris-scan 2s infinite ease-in-out;
                }
                @keyframes iris-scan { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; filter: brightness(1.5); } }

                .dock-status-led {
                    font-size: 8px;
                    color: rgba(148, 163, 184, 0.4);
                    font-weight: 900;
                    letter-spacing: 2px;
                }

                .recalibrate-static {
                    transform: translateY(-2px);
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .diagnostic-ring {
                    position: absolute;
                    width: 86px;
                    height: 86px;
                    border: 1px dashed rgba(59, 130, 246, 0.3);
                    border-radius: 50%;
                    animation: spin 15s linear infinite;
                    pointer-events: none;
                    top: 50%;
                    left: 50%;
                    margin-top: -43px;
                    margin-left: -43px;
                }


                /* FORGE COMPLEX */
                .forge-and-tubes-row {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    height: 110px;
                    margin-top: auto;
                    margin-bottom: 4px;
                }
                .forge-socket {
                    width: 130px;
                    height: 92px;
                    position: relative;
                    background: radial-gradient(ellipse at bottom, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .industrial-panel {
                    position: absolute;
                    bottom: 0px;
                    width: 100px;
                    height: 24px;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 2px;
                    transform: perspective(200px) rotateX(40deg);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.8);
                    overflow: visible;
                }
                .panel-frame {
                    position: absolute;
                    inset: 2px;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    background: repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(148, 163, 184, 0.05) 11px);
                }
                .energy-core {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 12px;
                    background: #1e293b;
                    border: 1px solid #475569;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .core-aperture {
                    width: 20px;
                    height: 4px;
                    background: #7e22ce;
                    box-shadow: 0 0 15px #a855f7;
                    border-radius: 10px;
                    opacity: 0.3;
                    transition: all 0.5s;
                }
                .forge-socket.active .core-aperture {
                    background: #2dd4bf;
                    box-shadow: 0 0 20px #2dd4bf, 0 0 40px rgba(45, 212, 191, 0.4);
                    opacity: 1;
                    width: 30px;
                }
                .flux-conduits {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .conduit {
                    position: absolute;
                    top: 4px;
                    bottom: 4px;
                    width: 2px;
                    background: #334155;
                    transition: background 0.5s;
                }
                .c-left { left: 10px; }
                .c-right { right: 10px; }
                .forge-socket.active .conduit { background: #2dd4bf; box-shadow: 0 0 5px #2dd4bf; }

                .magnetic-plasma-column {
                    position: absolute;
                    bottom: 24px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 60px;
                    height: 100px;
                    background: radial-gradient(ellipse at bottom, rgba(45, 212, 191, 0.2) 0%, transparent 70%);
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s;
                    mix-blend-mode: screen;
                }
                .forge-socket.active .magnetic-plasma-column { 
                    opacity: 1; 
                    animation: plasma-pulse 2s infinite ease-in-out;
                }
                @keyframes plasma-pulse {
                    0%, 100% { transform: translateX(-50%) scaleX(1) opacity(0.6); }
                    50% { transform: translateX(-50%) scaleX(1.2) opacity(0.8); }
                }

                .forge-socket.active .base-glow { opacity: 1; }
                
                /* FLOATING METEORITE PHYSICS */
                .floating-forge {
                    animation: magnetic-jitter-float 4s infinite ease-in-out;
                }
                @keyframes magnetic-jitter-float {
                    0%, 100% { transform: translateY(-8px) rotate(0deg); }
                    25% { transform: translateY(-12px) rotate(1deg) scale(1.02); }
                    50% { transform: translateY(-5px) rotate(-1deg) scale(0.98); }
                    75% { transform: translateY(-10px) rotate(0.5deg) scale(1.01); }
                }
                
                .forge-energy-field {
                    position: absolute;
                    inset: -20px;
                    background: radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.5s;
                    animation: aura-spin 10s linear infinite;
                }
                .forge-socket.active .forge-energy-field { opacity: 1; }
                @keyframes aura-spin {
                    100% { transform: rotate(360deg); }
                }
                
                .forge-pylon {
                    position: absolute;
                    width: 3px;
                    height: 15px;
                    background: #64748b;
                    border-radius: 2px;
                }
                .forge-svg {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 100;
                    pointer-events: none;
                    overflow: visible;
                }

                /* SYMMETRIC 9-SECOND CONSTANT SPEED CYCLE */
                /* ASYMMETRIC ORGANIC SPEEDS */
                .arm-l-sync { animation: arm-global-step-l 8.7s linear infinite; }
                .arm-r-sync { animation: arm-global-step-r 9.4s linear infinite -2.1s; }

                @keyframes arm-global-step-l {
                    0%, 22% { transform: translateY(33px); }
                    27% { transform: translateY(50px); }
                    27%, 49% { transform: translateY(50px); }
                    54% { transform: translateY(67px); }
                    54%, 74% { transform: translateY(67px); }
                    79% { transform: translateY(50px); }
                    79%, 95% { transform: translateY(50px); }
                    100% { transform: translateY(33px); }
                }

                @keyframes arm-global-step-r {
                    0%, 18% { transform: translateY(28px); }
                    24% { transform: translateY(55px); }
                    24%, 44% { transform: translateY(55px); }
                    50% { transform: translateY(74px); }
                    50%, 72% { transform: translateY(74px); }
                    78% { transform: translateY(55px); }
                    78%, 94% { transform: translateY(55px); }
                    100% { transform: translateY(28px); }
                }

                .active-fire-l { animation: fire-logic-l 8.7s infinite; }
                .active-fire-r { animation: fire-logic-r 9.4s infinite -2.1s; }

                .l-sweep-group { 
                    animation: sweep-l-organic 8.7s linear infinite; 
                    transform-origin: 18px 0px; 
                }
                .r-sweep-group { 
                    animation: sweep-r-organic 9.4s linear infinite -2.1s; 
                    transform-origin: 112px 0px; 
                }

                @keyframes fire-logic-l {
                    0%, 2% { opacity: 0; } 2.1%, 19% { opacity: 1; } 19.1%, 29% { opacity: 0; }
                    29.1%, 46% { opacity: 1; } 46.1%, 56% { opacity: 0; }
                    56.1%, 71% { opacity: 1; } 71.1%, 81% { opacity: 0; }
                    81.1%, 92% { opacity: 1; } 92.1%, 100% { opacity: 0; }
                }
                @keyframes fire-logic-r {
                    0%, 2% { opacity: 0; } 2.1%, 15% { opacity: 1; } 15.1%, 26% { opacity: 0; }
                    26.1%, 41% { opacity: 1; } 41.1%, 52% { opacity: 0; }
                    52.1%, 69% { opacity: 1; } 69.1%, 80% { opacity: 0; }
                    80.1%, 91% { opacity: 1; } 91.1%, 100% { opacity: 0; }
                }

                @keyframes sweep-l-organic {
                    /* SINGLE SMOOTH SWEEPS WITH VARYING ANGLES AND LENGTHS */
                    0%, 3% { transform: rotate(0deg) scaleX(1); }
                    12% { transform: rotate(-15deg) scaleX(1.05); }
                    15% { transform: rotate(-10deg) scaleX(0.9); }
                    19%, 29% { transform: rotate(0deg) scaleX(1); }
                    38% { transform: rotate(10deg) scaleX(1.1); }
                    42% { transform: rotate(5deg) scaleX(0.95); }
                    46%, 56% { transform: rotate(0deg) scaleX(1); }
                    64% { transform: rotate(-12deg) scaleX(0.85); }
                    71%, 81% { transform: rotate(0deg) scaleX(1); }
                    88% { transform: rotate(18deg) scaleX(1.15); }
                    92%, 100% { transform: rotate(0deg) scaleX(1); }
                }

                @keyframes sweep-r-organic {
                    0%, 3% { transform: rotate(0deg) scaleX(1); }
                    10% { transform: rotate(18deg) scaleX(1.1); }
                    13% { transform: rotate(12deg) scaleX(0.9); }
                    15%, 26% { transform: rotate(0deg) scaleX(1); }
                    34% { transform: rotate(-12deg) scaleX(1.05); }
                    38% { transform: rotate(-8deg) scaleX(0.95); }
                    41%, 52% { transform: rotate(0deg) scaleX(1); }
                    61% { transform: rotate(15deg) scaleX(0.88); }
                    69%, 80% { transform: rotate(0deg) scaleX(1); }
                    86% { transform: rotate(-10deg) scaleX(1.12); }
                    91%, 100% { transform: rotate(0deg) scaleX(1); }
                }

                .quarrel-anim { animation: laser-jitter 0.1s infinite; }
                @keyframes laser-jitter {
                    0%, 100% { transform: translate(0, 0) scaleY(1); }
                    25% { transform: translate(0.3px, -0.2px) scaleY(1.1); }
                    50% { transform: translate(-0.2px, 0.4px) scaleY(0.9); }
                    75% { transform: translate(0.1px, -0.1px) scaleY(1.05); }
                }

                .spark-flicker {
                    filter: drop-shadow(0 0 4px #fff);
                    opacity: 0.8;
                }

                /* FOCUS LOCK: Pointing exactly at meteorite center (65, 55) */
                .laser-line {
                    stroke: #ff1111;
                    stroke-width: 2.8;
                    filter: drop-shadow(0 0 6px #ff0000);
                    stroke-linecap: round;
                }
                .laser-core-line {
                    stroke: #ffffff;
                    stroke-width: 0.8;
                    filter: drop-shadow(0 0 3px #ffffff);
                    stroke-linecap: round;
                }

                .flare-flicker {
                    animation: flicker-fast 0.08s infinite;
                }
                @keyframes flicker-fast {
                    0%, 100% { opacity: 0.7; r: 2; }
                    50% { opacity: 1; r: 3.2; }
                }

                @keyframes float-forge {
                    0%, 100% { transform: translateY(-3px); }
                    50% { transform: translateY(-8px); }
                }

                /* STATUS HUB */
                .status-hub {
                    flex: 0 0 60px;
                    display: flex;
                    gap: 12px;
                    padding: 8px 6px;
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(59, 130, 246, 0.1);
                    border-radius: 4px;
                    height: 115px;
                    transform: translateY(-5px);
                }
                .single-hub {
                    justify-content: center;
                }
                .evolution-bar-wrap {
                    position: absolute;
                    bottom: -17px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1px;
                }
                .evolution-bar-label {
                    font-size: 6px;
                    color: #94a3b8;
                    font-weight: 950;
                    letter-spacing: 1px;
                }
                .evolution-bar-container {
                    width: 100%;
                    height: 3px;
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 2px;
                    overflow: hidden;
                    position: relative;
                }
                .evolution-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #064e3b, #10b981);
                    box-shadow: 0 0 8px #10b981;
                    transition: width 0.3s linear;
                }
                .evolution-timer {
                    font-size: 6px;
                    color: #10b981;
                    font-weight: 900;
                }
                .hub-module {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                }
                .tube-label { font-size: 6px; color: #94a3b8; font-weight: 900; }
                .tube-container {
                    width: 14px;
                    flex: 1;
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                }
                .tube-fill {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    transition: height 0.5s ease-out;
                    box-shadow: 0 0 10px currentcolor;
                    overflow: hidden;
                }
                .tube-fill.red { 
                    background: linear-gradient(to top, #7f1d1d, #ef4444, #f87171); 
                    color: #ef4444; 
                }
                .tube-fill.fuel { 
                    background: linear-gradient(to top, #0c4a6e, #0ea5e9, #7dd3fc); 
                    color: #0ea5e9; 
                }
                .tube-fill.green { background: linear-gradient(to top, #064e3b, #10b981); color: #10b981; }

                .plasma-core {
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 0) 0px,
                        rgba(255, 255, 255, 0.05) 10px,
                        rgba(255, 255, 255, 0) 20px
                    );
                    animation: plasma-flow 1.5s infinite linear;
                }
                .plasma-core.horizontal {
                    background: repeating-linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0px,
                        rgba(255, 255, 255, 0.05) 10px,
                        rgba(255, 255, 255, 0) 20px
                    );
                    animation: plasma-flow-h 1.5s infinite linear;
                }
                .plasma-bubbles {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle at 50% 100%, white 0.6px, transparent 1px);
                    background-size: 6px 15px;
                    animation: bubbles-rise 2s infinite linear;
                    opacity: 0.4;
                }
                .plasma-bubbles.horizontal {
                    background-image: radial-gradient(circle at 100% 50%, white 0.6px, transparent 1px);
                    background-size: 15px 6px;
                    animation: bubbles-flow-h 2s infinite linear;
                }
                @keyframes plasma-flow {
                    from { background-position: 0 0; }
                    to { background-position: 0 40px; }
                }
                @keyframes plasma-flow-h {
                    from { background-position: 0 0; }
                    to { background-position: 40px 0; }
                }
                @keyframes bubbles-rise {
                    from { background-position: 0 0; }
                    to { background-position: 0 -30px; }
                }
                @keyframes bubbles-flow-h {
                    from { background-position: 0 0; }
                    to { background-position: -30px 0; }
                }

                .tube-glass {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, 
                        rgba(255,255,255,0.1) 0%, 
                        rgba(255,255,255,0.05) 20%,
                        transparent 45%, 
                        rgba(255,255,255,0.15) 100%
                    );
                    border-radius: 20px;
                    pointer-events: none;
                    box-shadow: inset 0 0 5px rgba(255,255,255,0.05);
                }
                .tube-value { font-size: 7px; color: #fff; font-weight: 900; }

                /* COMMON */
                .socket-item-wrap {
                    width: 70px;
                    height: 70px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                }
                .item-img { width: 100%; height: 100%; objectFit: contain; }
                .item-drag-layer { position: absolute; inset: 0; cursor: grab; z-index: 20; }
                .socket-placeholder { font-size: 8px; color: rgba(148, 163, 184, 0.4); font-weight: 900; letter-spacing: 1px; }
                .socket-footer { position: absolute; bottom: 8px; font-size: 5px; color: rgba(148, 163, 184, 0.4); }

                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes beam-flow { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 3; } }
                @keyframes energy-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

                /* MODAL OVERLAY */
                .lab-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(8px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .lab-modal {
                    background: #0f172a;
                    border: 1px solid #3b82f6;
                    border-radius: 4px;
                    padding: 20px;
                    width: 320px;
                    position: relative;
                    box-shadow: 0 0 50px rgba(59, 130, 246, 0.3);
                }
                .modal-header { margin-bottom: 20px; text-align: center; }
                .modal-tag { font-size: 7px; color: #3b82f6; letter-spacing: 2px; }
                .modal-title { font-size: 24px; font-weight: 950; color: #fff; text-shadow: 0 0 10px #3b82f666; }
                
                .modal-actions { display: flex; flex-direction: column; gap: 8px; }
                .btn-deploy, .btn-recycle, .btn-cancel, .btn-inactive {
                    padding: 10px;
                    font-size: 11px;
                    font-weight: 950;
                    border: 1px solid;
                    border-radius: 2px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.2s;
                    text-transform: uppercase;
                }
                .btn-deploy { background: #1e3a8a; border-color: #3b82f6; color: #fff; }
                .btn-deploy.locked { background: #450a0a; border-color: #ef4444; color: #fee2e2; cursor: not-allowed; }
                .btn-recycle { background: #1e293b; border-color: #334155; color: #94a3b8; }
                .btn-cancel { background: transparent; border-color: rgba(148,163,184,0.3); color: #64748b; }
                .price-tag { display: flex; alignItems: center; gap: 4px; background: rgba(0,0,0,0.4); padding: 2px 8px; border-radius: 10px; }
                .price-tag img { width: 12px; height: 12px; }

                .status-label {
                    padding: 8px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 950;
                    border-radius: 2px;
                }
                .status-label.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid #3b82f644; }
                .status-label.researching { background: rgba(251, 191, 36, 0.1); color: #fbbf24; border: 1px solid #fbbf2444; }

                .modal-corner { position: absolute; width: 10px; height: 10px; border: 2px solid #3b82f6; opacity: 0.5; }
                .tl { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
                .tr { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
                .bl { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
                .br { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }
            `}</style>
        </div >
    );
};
