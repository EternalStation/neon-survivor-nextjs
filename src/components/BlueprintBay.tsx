import React, { useState } from 'react';
import type { GameState, Blueprint, Meteorite } from '../logic/core/Types';
import { BLUEPRINT_DATA, activateBlueprint, researchBlueprint, scrapBlueprint, checkResearchProgress, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { TICK_INTERVAL } from '../logic/upgrades/IncubatorLogic';
import { getMeteoriteImage, RARITY_COLORS } from './modules/ModuleUtils';
import { playSfx } from '../logic/audio/AudioLogic';
import './BlueprintBay.css';
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

                                {isBuffActive(gameState, promptBlueprint.type) && (
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
                                        {((promptBlueprint.type === 'DIMENSIONAL_GATE' && gameState.portalsUnlocked) || 
                                         (promptBlueprint.type !== 'QUANTUM_SCRAPPER' && isBuffActive(gameState, promptBlueprint.type))) ? (
                                            <button disabled className="btn-inactive">{t.activation.alreadyActive}</button>
                                        ) : (
                                            <button
                                                onClick={handleConfirmActivate}
                                                disabled={gameState.player.dust < promptBlueprint.cost}
                                                className={`btn-deploy ${gameState.player.dust < promptBlueprint.cost ? 'locked' : ''}`}
                                            >
                                                <span>
                                                    {promptBlueprint.type === 'QUANTUM_SCRAPPER' && isBuffActive(gameState, promptBlueprint.type) ? "ADD CHARGES" : 
                                                     t.activation.deploy}
                                                </span>
                                                <div className="price-tag">
                                                    <span>{promptBlueprint.cost}</span>
                                                    <img src="/assets/Icons/MeteoriteDust.png" />
                                                </div>
                                            </button>
                                        )}
                                    </>
                                )}

                                {(promptBlueprint.status === 'locked' || promptBlueprint.status === 'researching' || promptBlueprint.status === 'ready') && (
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

        </div >
    );
};
