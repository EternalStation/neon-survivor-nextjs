import React, { useState } from 'react';
import type { GameState, Blueprint, Meteorite } from '../logic/core/types';
import { BLUEPRINT_DATA, activateBlueprint, researchBlueprint, scrapBlueprint, checkResearchProgress, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { RecalibrateInterface } from './modules/RecalibrateInterface';
import { upgradeMeteoriteQuality, rerollPerkType, rerollPerkValue } from '../logic/upgrades/RecalibrateLogic';
import { getMeteoriteImage } from './modules/ModuleUtils';

interface BlueprintBayProps {
    gameState: GameState;
    onUpdate: () => void;
    onHoverBlueprint: (bp: Blueprint | null) => void;
    recalibrateSlot: Meteorite | null;
    setRecalibrateSlot: (item: Meteorite | null) => void;
    movedItem: { item: any, source: string, index: number } | null;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate', index: number } | null) => void;
    onInventoryUpdate: (index: number, item: any) => void;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
}

export const BlueprintBay: React.FC<BlueprintBayProps> = ({
    gameState,
    onUpdate,
    onHoverBlueprint,
    recalibrateSlot,
    setRecalibrateSlot,
    movedItem,
    setMovedItem,
    onInventoryUpdate,
    onSocketUpdate
}) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [promptBlueprint, setPromptBlueprint] = useState<Blueprint | null>(null);
    const [, setTick] = useState(0);


    React.useEffect(() => {
        const hasResearch = gameState.blueprints.some(bp => bp?.status === 'researching');
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
    }, [gameState.blueprints, onUpdate]);

    const handleConfirmActivate = () => {
        if (promptBlueprint) {
            const slotIdx = gameState.blueprints.findIndex(b => b?.id === promptBlueprint.id);
            if (slotIdx !== -1) {
                if (activateBlueprint(gameState, slotIdx)) {
                    setPromptBlueprint(null);
                    onUpdate();
                }
            }
        }
    };

    const handleScrap = () => {
        if (promptBlueprint) {
            const slotIdx = gameState.blueprints.findIndex(b => b?.id === promptBlueprint.id);
            if (slotIdx !== -1) {
                scrapBlueprint(gameState, slotIdx);
                setPromptBlueprint(null);
                onUpdate();
            }
        }
    };

    return (
        <div className="blueprint-bay">
            {/* MAIN HEADER */}
            <div className="bay-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, color: '#60a5fa', fontSize: '9px', fontWeight: 900, letterSpacing: '2px' }}>ENGINEERING & ARCHIVE</h3>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>

                {/* LEFT: RECALIBRATION DROP SLOT (Small Square) */}
                {/* LEFT: ENHANCEMENT MATRIX DROP SLOT */}
                <div className="recalibrate-drop-section" style={{
                    flex: '0 0 160px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    position: 'relative'
                }}>
                    <div
                        style={{
                            width: '140px', height: '140px',
                            position: 'relative',
                            border: `1px solid ${movedItem ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)'}`,
                            borderRadius: '12px',
                            background: movedItem ? 'rgba(59, 130, 246, 0.1)' : 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: recalibrateSlot
                                ? '0 0 25px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1)'
                                : 'inset 0 0 20px rgba(0,0,0,0.5)',
                            overflow: 'hidden'
                        }}
                        onMouseUp={(e) => {
                            if (movedItem && movedItem.source !== 'recalibrate') {
                                e.stopPropagation();

                                // If already occupied, return current item to inventory
                                if (recalibrateSlot) {
                                    let emptyIdx = -1;
                                    for (let i = 10; i < gameState.inventory.length; i++) {
                                        if (!gameState.inventory[i]) { emptyIdx = i; break; }
                                    }
                                    if (emptyIdx === -1) {
                                        for (let i = 0; i < 10; i++) {
                                            if (!gameState.inventory[i]) { emptyIdx = i; break; }
                                        }
                                    }
                                    if (emptyIdx !== -1) {
                                        onInventoryUpdate(emptyIdx, { ...recalibrateSlot, isNew: false });
                                    }
                                }

                                setRecalibrateSlot(movedItem.item);
                                if (movedItem.source === 'inventory') {
                                    onInventoryUpdate(movedItem.index, null);
                                }
                                if (movedItem.source === 'diamond') {
                                    onSocketUpdate('diamond', movedItem.index, null);
                                }
                                setMovedItem(null);
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#60a5fa';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.2), inset 0 0 10px rgba(59, 130, 246, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = movedItem ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)';
                            e.currentTarget.style.boxShadow = recalibrateSlot
                                ? '0 0 25px rgba(59, 130, 246, 0.3), inset 0 0 15px rgba(59, 130, 246, 0.1)'
                                : 'inset 0 0 20px rgba(0,0,0,0.5)';
                        }}
                    >
                        {/* HOLOGRAPHIC SCANNING ARTIFACTS */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(59, 130, 246, 0.02) 2px, rgba(59, 130, 246, 0.02) 4px)',
                            pointerEvents: 'none',
                            zIndex: 1
                        }} />

                        {/* DECORATIVE CORNER BRACKETS */}
                        {!recalibrateSlot && (
                            <>
                                <div style={{ position: 'absolute', top: '10px', left: '10px', width: '15px', height: '15px', borderTop: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6', opacity: 0.6 }} />
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '15px', height: '15px', borderTop: '2px solid #3b82f6', borderRight: '2px solid #3b82f6', opacity: 0.6 }} />
                                <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '15px', height: '15px', borderBottom: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6', opacity: 0.6 }} />
                                <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '15px', height: '15px', borderBottom: '2px solid #3b82f6', borderRight: '2px solid #3b82f6', opacity: 0.6 }} />

                                {/* RADAR CIRCLES */}
                                <div style={{ position: 'absolute', width: '100px', height: '100px', border: '1px solid rgba(59, 130, 246, 0.05)', borderRadius: '50%' }} />
                                <div style={{ position: 'absolute', width: '60px', height: '60px', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '50%' }} />
                            </>
                        )}

                        {recalibrateSlot ? (
                            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                                <div style={{
                                    position: 'absolute', inset: '10%',
                                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                                    animation: 'pulse-glow 2s infinite ease-in-out'
                                }} />
                                <img src={getMeteoriteImage(recalibrateSlot)} style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.6))', animation: 'float 3s infinite ease-in-out' }} />

                                <div
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        cursor: 'grab', zIndex: 20
                                    }}
                                    onMouseDown={(e) => {
                                        if (e.button === 0) {
                                            e.stopPropagation();
                                            // Don't clear recalibrateSlot here - let the drop handler do it
                                            setMovedItem({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', zIndex: 5, animation: movedItem ? 'pulse-blue 1s infinite' : 'none' }}>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#fff',
                                    fontWeight: 900,
                                    letterSpacing: '2px',
                                    padding: '6px 12px',
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    borderRadius: '4px',
                                    border: '1px solid #3b82f6',
                                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
                                    textShadow: '0 0 8px rgba(255,255,255,0.5)'
                                }}>
                                    LOAD CORE
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '9px', color: '#fff', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 5px rgba(59, 130, 246, 0.5)' }}>HYPER-FLUX CORE</span>
                        <div style={{ width: '100px', height: '1px', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }} />
                        <span style={{ fontSize: '6px', color: '#60a5fa', fontWeight: 800, letterSpacing: '1px', opacity: 0.6 }}>UNIT_LEVEL: ENHANCED</span>
                    </div>
                </div>

                {/* RIGHT: BLUEPRINT ARCHIVE (Small Grid - 8 Slots) */}
                <div className="blueprint-grid" style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 64px)', // 4 Columns, 2 Rows (8 Total)
                    gap: '6px',
                    alignContent: 'start'
                }}>

                    {gameState.blueprints.slice(0, 8).map((bp, idx) => { // 8 OPEN SLOTS AS REQUESTED
                        const isActive = bp && bp.status === 'active';
                        const isBroken = bp && bp.status === 'broken';

                        return (
                            <div
                                key={idx}
                                className={`blueprint-slot ${bp ? 'occupied' : 'empty'} ${isActive ? 'active' : ''} ${isBroken ? 'broken' : ''}`}
                                onMouseEnter={() => {
                                    setHoveredIdx(idx);
                                    if (bp) onHoverBlueprint(bp);
                                }}
                                onMouseLeave={() => {
                                    setHoveredIdx(null);
                                    onHoverBlueprint(null);
                                }}
                                onClick={() => {
                                    if (bp && bp.status !== 'researching') setPromptBlueprint(bp);
                                }}
                                style={{
                                    cursor: bp ? 'pointer' : 'default',
                                    position: 'relative'
                                }}
                            >
                                {bp ? (
                                    <div className="blueprint-item">
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            backgroundImage: isBroken ? "url('/assets/Icons/BlueprintBroken.png')" : "url('/assets/Icons/Blueprint.png')",
                                            backgroundSize: '80%',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center',
                                            opacity: isActive ? 0.3 : isBroken ? 0.5 : 0.7,
                                            filter: isActive ? 'sepia(1) hue-rotate(180deg) brightness(1.2)' : isBroken ? 'grayscale(1)' : 'none',
                                            zIndex: 0
                                        }}></div>

                                        <div style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            height: '100%',
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ padding: '2px' }}>
                                                <span className="bp-name" style={{
                                                    fontSize: '0.45rem',
                                                    fontWeight: 900,
                                                    color: '#60a5fa',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    textTransform: 'uppercase',
                                                    display: 'block',
                                                    textAlign: 'center'
                                                }}>{bp.status === 'researching' ? 'LOCKED' : (bp.serial || bp.name.substring(0, 3))}</span>
                                            </div>

                                            {bp.status === 'researching' && bp.researchFinishTime && (
                                                <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    zIndex: 5
                                                }}>
                                                    <div style={{
                                                        color: '#facc15', // Yellow
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        fontFamily: 'monospace',
                                                        textShadow: '0 0 5px #facc15'
                                                    }}>
                                                        {Math.max(0, bp.researchFinishTime - gameState.gameTime).toFixed(1)}s
                                                    </div>
                                                </div>
                                            )}

                                            {isActive && (
                                                <div style={{
                                                    fontSize: '0.35rem', color: '#60a5fa', fontWeight: 900,
                                                    background: 'rgba(0,0,0,0.5)', width: '100%', padding: '1px 0',
                                                    position: 'relative', zIndex: 6
                                                }}>
                                                    {(() => {
                                                        const charges = gameState.activeBlueprintCharges[bp.type];
                                                        const endTime = gameState.activeBlueprintBuffs[bp.type];

                                                        if (charges !== undefined) {
                                                            return `${charges} USES`;
                                                        }
                                                        if (endTime !== undefined) {
                                                            const left = Math.max(0, endTime - gameState.gameTime);
                                                            return `${left.toFixed(0)}s`;
                                                        }
                                                        return 'ACTIVE';
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-slot-label" style={{ opacity: 0.1, fontSize: '8px' }}>{idx + 1}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ACTIVATION PROMPT MODAL */}
            {promptBlueprint && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                    onClick={() => setPromptBlueprint(null)}
                >
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '2px solid #3b82f6',
                        padding: '15px',
                        borderRadius: '8px',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                        minWidth: '250px',
                        maxWidth: '300px'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, marginBottom: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '5px' }}>
                                <span style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, transparent, #3b82f6)' }} />
                                <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 10px #3b82f6' }}>SYSTEM INITIALIZATION</div>
                                <span style={{ width: '30px', height: '1px', background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '2px', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>
                                {promptBlueprint.serial || promptBlueprint.name}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '5px', position: 'relative', zIndex: 1 }}>
                            <button
                                onClick={() => setPromptBlueprint(null)}
                                style={{
                                    flex: 1, padding: '10px', background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid #475569', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer',
                                    fontWeight: 900, fontSize: '11px', letterSpacing: '1px', transition: 'all 0.2s'
                                }}
                            >
                                CLOSE
                            </button>
                            {promptBlueprint.status !== 'active' && promptBlueprint.status !== 'broken' && (
                                <>
                                    {isBuffActive(gameState, promptBlueprint.type) ? (
                                        <button
                                            disabled
                                            style={{
                                                flex: 2, padding: '10px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                color: '#60a5fa',
                                                borderRadius: '4px', cursor: 'not-allowed',
                                                fontWeight: 900, fontSize: '10px', letterSpacing: '1px',
                                                textTransform: 'uppercase',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            PROTOCOL ALREADY ACTIVE
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleConfirmActivate}
                                            disabled={gameState.player.dust < promptBlueprint.cost}
                                            style={{
                                                flex: 2, padding: '10px',
                                                background: gameState.player.dust >= promptBlueprint.cost && promptBlueprint.status === 'ready' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#ef4444',
                                                border: `1px solid ${gameState.player.dust >= promptBlueprint.cost && promptBlueprint.status === 'ready' ? '#60a5fa' : '#f87171'}`,
                                                color: '#fff',
                                                borderRadius: '4px', cursor: gameState.player.dust >= promptBlueprint.cost && promptBlueprint.status === 'ready' ? 'pointer' : 'not-allowed',
                                                fontWeight: 900, fontSize: '12px', letterSpacing: '1px',
                                                boxShadow: gameState.player.dust >= promptBlueprint.cost ? '0 0 15px rgba(59, 130, 246, 0.5)' : '0 5px 10px rgba(239, 68, 68, 0.4)',
                                                transition: 'all 0.2s',
                                                textTransform: 'uppercase',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                            }}
                                        >
                                            <span>DEPLOY</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                                <span style={{ fontSize: '12px' }}>{promptBlueprint.cost}</span>
                                                <img src="/assets/Icons/MeteoriteDust.png" style={{ width: '16px', height: '16px' }} />
                                            </div>
                                        </button>
                                    )}
                                </>
                            )}
                            {promptBlueprint.status === 'active' && (
                                <div style={{
                                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '4px',
                                    background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontWeight: 900,
                                    letterSpacing: '1px', fontSize: '12px'
                                }}>
                                    DEPLOYED
                                </div>
                            )}

                            {promptBlueprint.status === 'broken' && (
                                <button
                                    onClick={handleScrap}
                                    style={{
                                        flex: 2, padding: '10px',
                                        background: '#334155',
                                        border: '1px solid #475569',
                                        color: '#94a3b8',
                                        borderRadius: '4px', cursor: 'pointer',
                                        fontWeight: 900, fontSize: '12px', letterSpacing: '1px',
                                        boxShadow: '0 5px 10px rgba(0,0,0,0.3)',
                                        transition: 'all 0.2s',
                                        textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <span>RECYCLE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '12px' }}>+5</span>
                                        <img src="/assets/Icons/MeteoriteDust.png" style={{ width: '16px', height: '16px' }} />
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* DECORATIVE CORNER ACCENTS */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px', borderTop: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6', opacity: 0.5 }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '20px', height: '20px', borderTop: '2px solid #3b82f6', borderRight: '2px solid #3b82f6', opacity: 0.5 }} />
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '20px', height: '20px', borderBottom: '2px solid #3b82f6', borderLeft: '2px solid #3b82f6', opacity: 0.5 }} />
                        <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '20px', height: '20px', borderBottom: '2px solid #3b82f6', borderRight: '2px solid #3b82f6', opacity: 0.5 }} />

                        {/* DIAGONAL SCANLINE */}
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(59, 130, 246, 0.03) 10px, rgba(59, 130, 246, 0.03) 11px)',
                            pointerEvents: 'none'
                        }} />
                    </div>
                </div>
            )}


            <style jsx>{`
                .blueprint-bay {
                    background: rgba(8, 8, 16, 0.98);
                    border: 1px solid rgba(59, 130, 246, 0.15);
                    border-radius: 8px;
                    padding: 6px 10px;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                    margin-top: 8px;
                    height: 185px;
                }

                .bay-header {
                    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
                    padding-bottom: 2px;
                    margin-bottom: 6px;
                }

                .bay-header h3 {
                    margin: 0;
                    letter-spacing: 3px;
                    color: #475569;
                    font-size: 0.55rem;
                    font-weight: 900;
                }

                .blueprint-grid {
                    /* Grid styles inline */
                }

                .blueprint-slot {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.03);
                    border-radius: 4px;
                    width: 64px;
                    height: 64px;
                    position: relative;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .blueprint-slot.occupied {
                    border-color: rgba(59, 130, 246, 0.25);
                    background: rgba(15, 23, 42, 0.9);
                }
                
                .blueprint-slot.occupied:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
                    transform: translateY(-1px);
                }

                .blueprint-slot.active {
                    border-color: #3b82f6;
                    box-shadow: inset 0 0 8px rgba(59, 130, 246, 0.2), 0 0 10px rgba(59, 130, 246, 0.1);
                }

                .blueprint-slot.empty {
                    border-style: dashed;
                    opacity: 0.4;
                }

                .locked-slot-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    color: rgba(255, 255, 255, 0.05);
                }

                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }

                @keyframes pulse-blue {
                    0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.8); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .blueprint-item {
                    height: 100%;
                    width: 100%;
                    position: relative;
                    text-align: center;
                }
            `}</style>
        </div >
    );
};
