import React, { useState } from 'react';
import type { GameState, Blueprint, BlueprintType } from '../logic/types';
import { BLUEPRINT_DATA, activateBlueprint, researchBlueprint } from '../logic/BlueprintLogic';

interface BlueprintBayProps {
    gameState: GameState;
    spendDust: (amount: number) => boolean;
    onUpdate: () => void;
}

export const BlueprintBay: React.FC<BlueprintBayProps> = ({ gameState, spendDust, onUpdate }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [promptBlueprint, setPromptBlueprint] = useState<Blueprint | null>(null);

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

    return (
        <div className="blueprint-bay">
            <div className="bay-header">
                <h3>BLUEPRINT ARCHIVE</h3>
            </div>

            <div className="blueprint-grid">
                {gameState.blueprints.map((bp, idx) => {
                    const isLocked = idx >= 8;
                    const isActive = bp && gameState.activeBlueprintBuffs[bp.type];

                    return (
                        <div
                            key={idx}
                            className={`blueprint-slot ${isLocked ? 'locked' : bp ? 'occupied' : 'empty'} ${isActive ? 'active' : ''}`}
                            onMouseEnter={() => !isLocked && setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onClick={() => {
                                if (bp && !isActive) setPromptBlueprint(bp);
                            }}
                            style={{
                                cursor: bp && !isActive ? 'pointer' : 'default',
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
                                        backgroundImage: "url('/assets/Icons/Blueprint.png')",
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        opacity: isActive ? 0.4 : 0.8,
                                        filter: isActive ? 'sepia(1) hue-rotate(180deg) brightness(1.2)' : 'none',
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
                                        padding: '4px'
                                    }}>
                                        <span className="bp-name" style={{
                                            fontSize: '0.5rem',
                                            fontWeight: 900,
                                            background: 'rgba(0,0,0,0.7)',
                                            padding: '1px 2px',
                                            borderRadius: '2px',
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            textTransform: 'uppercase'
                                        }}>{bp.name}</span>

                                        {!isActive && (
                                            <div style={{
                                                background: 'rgba(59, 130, 246, 0.85)',
                                                border: '1px solid #60a5fa',
                                                borderRadius: '2px',
                                                fontSize: '0.5rem',
                                                fontWeight: 900,
                                                padding: '2px 0',
                                                color: '#fff',
                                                letterSpacing: '0.5px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                            }}>
                                                ACTIVATE
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
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ fontSize: '0.4rem', opacity: 0.8 }}>ACTIVE</span>
                                                <span>{Math.ceil((gameState.activeBlueprintBuffs[bp.type]! - Date.now()) / 1000)}s</span>
                                            </div>
                                        )}
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
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                        minWidth: '320px',
                        maxWidth: '400px'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '5px' }}>
                                <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #3b82f6)' }} />
                                <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 900, letterSpacing: '3px', textShadow: '0 0 10px #3b82f6' }}>SYSTEM INITIALIZATION</div>
                                <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, #3b82f6, transparent)' }} />
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', letterSpacing: '2px', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}>{promptBlueprint.name}</div>
                        </div>

                        <div style={{
                            padding: '15px',
                            background: 'rgba(5, 5, 15, 0.6)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '4px',
                            color: '#e2e8f0',
                            fontSize: '13px',
                            textAlign: 'left',
                            lineHeight: '1.5',
                            position: 'relative',
                            zIndex: 1,
                            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 900, marginBottom: '8px', opacity: 0.8 }}>// FUNCTIONAL_OVERVIEW_LOG</div>
                            {promptBlueprint.desc}
                        </div>

                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 15px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <span style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900, letterSpacing: '1px' }}>RUNTIME_LIMIT</span>
                                <span style={{ fontSize: '16px', color: '#fff', fontWeight: 900 }}>{promptBlueprint.duration}s</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(251, 191, 36, 0.1)', padding: '8px 15px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                                <span style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 900, letterSpacing: '1px' }}>REQUISITION_COST</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '20px', color: '#fff', fontWeight: 900 }}>{promptBlueprint.cost}</span>
                                    <img src="/assets/Icons/MeteoriteDust.png" style={{ width: '18px', height: '18px', filter: 'drop-shadow(0 0 5px #fbbf24)' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '5px', position: 'relative', zIndex: 1 }}>
                            <button
                                onClick={() => setPromptBlueprint(null)}
                                style={{
                                    flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid #475569', color: '#94a3b8', borderRadius: '4px', cursor: 'pointer',
                                    fontWeight: 900, fontSize: '12px', letterSpacing: '2px', transition: 'all 0.2s'
                                }}
                            >
                                ABORT
                            </button>
                            <button
                                onClick={handleConfirmActivate}
                                disabled={gameState.player.dust < promptBlueprint.cost}
                                style={{
                                    flex: 1.5, padding: '12px',
                                    background: gameState.player.dust >= promptBlueprint.cost ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid #60a5fa', color: '#fff',
                                    borderRadius: '4px', cursor: gameState.player.dust >= promptBlueprint.cost ? 'pointer' : 'not-allowed',
                                    fontWeight: 900, fontSize: '13px', letterSpacing: '2px',
                                    boxShadow: gameState.player.dust >= promptBlueprint.cost ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase'
                                }}
                            >
                                {gameState.player.dust >= promptBlueprint.cost ? 'INITIALIZE_PROTOCOL' : 'LOW_RESOURCE_STATE'}
                            </button>
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
        </div>
    );
};
