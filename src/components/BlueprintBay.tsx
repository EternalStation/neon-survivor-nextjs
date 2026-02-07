import React, { useState } from 'react';
import type { GameState, Blueprint, BlueprintType } from '../logic/types';
import { BLUEPRINT_DATA, activateBlueprint, researchBlueprint, scrapBlueprint, checkResearchProgress, isBuffActive } from '../logic/BlueprintLogic';

interface BlueprintBayProps {
    gameState: GameState;
    spendDust: (amount: number) => boolean;
    onUpdate: () => void;
    onHoverBlueprint: (bp: Blueprint | null) => void;
}

export const BlueprintBay: React.FC<BlueprintBayProps> = ({ gameState, spendDust, onUpdate, onHoverBlueprint }) => {
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
            <div className="bay-header">
                <h3>BLUEPRINT ARCHIVE</h3>
            </div>

            <div className="blueprint-grid">
                {gameState.blueprints.map((bp, idx) => {
                    const isLocked = idx >= 8;
                    const isActive = bp && bp.status === 'active';
                    const isBroken = bp && bp.status === 'broken';

                    return (
                        <div
                            key={idx}
                            className={`blueprint-slot ${isLocked ? 'locked' : bp ? 'occupied' : 'empty'} ${isActive ? 'active' : ''} ${isBroken ? 'broken' : ''}`}
                            onMouseEnter={() => {
                                if (!isLocked) {
                                    setHoveredIdx(idx);
                                    if (bp) onHoverBlueprint(bp);
                                }
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
                            {isLocked ? (
                                <div className="locked-slot-content">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span style={{ fontSize: '0.45rem', fontWeight: 900, opacity: 0.4 }}>LOCKED</span>
                                </div>
                            ) : bp ? (
                                <div className="blueprint-item">
                                    {/* BACKGROUND ICON */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundImage: isBroken ? "url('/assets/Icons/BlueprintBroken.png')" : "url('/assets/Icons/Blueprint.png')",
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        opacity: isActive ? 0.4 : isBroken ? 0.6 : 0.8,
                                        filter: isActive ? 'sepia(1) hue-rotate(180deg) brightness(1.2)' : isBroken ? 'grayscale(1)' : 'none',
                                        zIndex: 0
                                    }}></div>

                                    {/* OVERLAY CONTENT */}
                                    <div style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        height: '100%',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        padding: '0' // REMOVED PADDING to allow full-width bottom
                                    }}>
                                        {/* NAME (Padded) */}
                                        <div style={{ padding: '4px' }}>
                                            <span className="bp-name" style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 900,
                                                color: '#60a5fa',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                display: 'block',
                                                textShadow: '0 0 8px rgba(59, 130, 246, 0.8), 0 0 4px rgba(0, 0, 0, 1), 1px 1px 2px rgba(0, 0, 0, 0.9)'
                                            }}>{bp.status === 'researching' ? '??-???' : (bp.serial || bp.name.substring(0, 5))}</span>
                                        </div>

                                        {/* STATUS / BUTTONS (Full Width) */}
                                        <div style={{ width: '100%' }}>
                                            {!isActive && !isBroken && bp.status !== 'researching' && (
                                                <div style={{
                                                    background: 'rgba(59, 130, 246, 0.85)',
                                                    borderTop: '1px solid #60a5fa',
                                                    borderBottom: '1px solid #60a5fa', // Ensure borders are clean
                                                    fontSize: '0.45rem',
                                                    fontWeight: 900,
                                                    padding: '2px 0',
                                                    color: '#fff',
                                                    letterSpacing: '0.5px',
                                                    boxShadow: '0 -2px 4px rgba(0,0,0,0.3)',
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    marginBottom: '4px' // Add margin to float it slightly from bottom or keep 0 if desired? User wanted "to the edge".
                                                    // Actually, if I want it to the edge of the SLOT, I should remove margin bottom.
                                                    // But the slot has `overflow: hidden` (Line 342).
                                                    // Let's keep marginBottom 4px to match previous design aesthetics but ensure width is full.
                                                    // User said "on left it has some space left". Removing parent padding fixes this.
                                                    // I will add horizontal margin: 0.
                                                }}>
                                                    DEPLOY
                                                </div>
                                            )}

                                            {bp.status === 'researching' && (
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 900,
                                                    color: '#fbbf24',
                                                    textShadow: '0 0 5px rgba(0,0,0,1)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    padding: '2px 0',
                                                    marginBottom: '4px',
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.4)'
                                                }}>
                                                    <span style={{ fontSize: '0.35rem', opacity: 0.8, letterSpacing: '1px' }}>DECRYPTING</span>
                                                    <span style={{ fontFamily: 'monospace', fontSize: '0.5rem' }}>ANALYZING...</span>
                                                </div>
                                            )}

                                            {isActive && (
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 900,
                                                    color: '#60a5fa',
                                                    textShadow: '0 0 5px rgba(0,0,0,1)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    marginBottom: '4px',
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.4)',
                                                    padding: '2px 0'
                                                }}>
                                                    <span style={{ fontSize: '0.35rem', opacity: 0.8 }}>RUNNING</span>
                                                    {bp.type === 'QUANTUM_SCRAPPER' ? (
                                                        <span style={{ fontSize: '0.5rem' }}>USES: {Math.max(0, gameState.activeBlueprintCharges[bp.type] || 0)}</span>
                                                    ) : (
                                                        <span>{Math.max(0, Math.ceil(gameState.activeBlueprintBuffs[bp.type]! - gameState.gameTime) - 1)}s</span>
                                                    )}
                                                </div>
                                            )}

                                            {isBroken && (
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 900,
                                                    color: '#ef4444',
                                                    textShadow: '0 0 5px rgba(0,0,0,1)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    marginBottom: '4px',
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.4)',
                                                    padding: '2px 0'
                                                }}>
                                                    <span style={{ fontSize: '0.45rem', opacity: 0.8 }}>BROKEN</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-slot-label" style={{ opacity: 0.2 }}>{idx + 1}</div>
                            )}
                        </div>
                    );
                })}
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
                                    <span>SCRAP (Recycle)</span>
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
                    background: rgba(10, 10, 20, 0.95);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    padding: 6px 10px;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
                    margin-top: 8px;
                }

                .bay-header {
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                    padding-bottom: 2px;
                    margin-bottom: 6px;
                }

                .bay-header h3 {
                    margin: 0;
                    letter-spacing: 2px;
                    color: #60a5fa;
                    font-size: 0.6rem;
                    font-weight: 900;
                }

                .blueprint-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 6px;
                }

                .blueprint-slot {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    aspect-ratio: 1 / 1;
                    position: relative;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .blueprint-slot.occupied {
                    border-color: rgba(59, 130, 246, 0.4);
                }
                
                .blueprint-slot.occupied:hover {
                    border-color: #60a5fa;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }

                .blueprint-slot.active {
                    border-color: #3b82f6;
                    box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.4);
                    animation: pulseBlue 2s infinite;
                }

                @keyframes pulseBlue {
                    0% { box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2); }
                    50% { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.5); }
                    100% { box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2); }
                }

                .blueprint-slot.empty {
                    border-style: dashed;
                    opacity: 0.5;
                }

                .locked-slot-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    color: rgba(255, 255, 255, 0.1);
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
