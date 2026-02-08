import React from 'react';
import type { GameState, Meteorite, LegendaryHex, Blueprint } from '../../logic/types';
import { MeteoriteTooltip } from '../MeteoriteTooltip';
import { LegendaryDetail } from '../LegendaryDetail';
import { isBuffActive } from '../../logic/BlueprintLogic';
import { ARENA_DATA } from '../../logic/MapLogic';
import { EXTRACTION_MESSAGES } from '../../logic/ExtractionLogic';
import { fadeOutMusic, playSfx } from '../../logic/AudioLogic';
import { playTypewriterClick } from '../../logic/SfxLogic';



interface ModuleDetailPanelProps {
    gameState: GameState;
    placementAlert: boolean;
    hoveredHex: { hex: LegendaryHex, index: number, x: number, y: number } | null;
    movedItem: { item: Meteorite | any, source: 'inventory' | 'diamond' | 'hex', index: number } | null;
    hoveredItem: { item: Meteorite | any, x: number, y: number } | null;
    lockedItem: { item: Meteorite | any, x: number, y: number } | null;
    hoveredBlueprint: Blueprint | null;
    onCancelHoverTimeout: () => void;
    onMouseLeaveItem: (delay?: number) => void;
}

export const ModuleDetailPanel: React.FC<ModuleDetailPanelProps> = ({
    gameState,
    placementAlert,
    hoveredHex,
    movedItem,
    hoveredItem,
    lockedItem,
    hoveredBlueprint,
    onCancelHoverTimeout,
    onMouseLeaveItem
}) => {
    const terminalRef = React.useRef<HTMLDivElement>(null);
    const lastTypedCountRef = React.useRef(0);
    const extractionDialogActive = ['requested', 'waiting'].includes(gameState.extractionStatus);
    React.useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [gameState.extractionMessageIndex, gameState.extractionStatus]);

    React.useEffect(() => {
        if (!extractionDialogActive) {
            lastTypedCountRef.current = 0;
            return;
        }
        const clock = gameState.extractionDialogTime ?? 0;
        const visibleTotal = EXTRACTION_MESSAGES.slice(0, gameState.extractionStatus === 'waiting' ? EXTRACTION_MESSAGES.length : gameState.extractionMessageIndex + 1)
            .reduce((sum, msg, i) => {
                const resolvedText = msg.text
                    .replace('[ARENA_NAME]', ARENA_DATA[gameState.extractionTargetArena]?.name || "TARGET SECTOR")
                    .replace('[SECTOR_NAME]', gameState.extractionSectorLabel || "LZ")
                    .replace('[PLAYER_NAME]', (gameState.playerName || "PLAYER").toUpperCase());
                const startTime = gameState.extractionMessageTimes?.[i] ?? clock;
                const elapsed = Math.max(0, clock - startTime);
                const revealCount = Math.min(resolvedText.length, Math.floor(elapsed * 12));
                return sum + revealCount;
            }, 0);

        if (visibleTotal > lastTypedCountRef.current) {
            playTypewriterClick();
            lastTypedCountRef.current = visibleTotal;
        }
    }, [extractionDialogActive, gameState.extractionDialogTime, gameState.extractionMessageIndex, gameState.extractionStatus, gameState.extractionTargetArena, gameState.extractionSectorLabel]);

    const { moduleSockets } = gameState;

    return (
        <div style={{
            flex: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px',
            background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, rgba(2, 2, 5, 0.2) 100%)',
        }}>
            <div className="data-panel" style={{
                width: '100%',
                height: '100%',
                background: 'rgba(5, 5, 15, 0.95)',
                border: '2px solid #3b82f6',
                borderRadius: '8px',
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                display: 'flex',
                // Removed overflow: hidden to allow extraction terminal expansion
                boxSizing: 'border-box',
                position: 'relative'
            }}>
                {gameState.pendingLegendaryHex ? (
                    <LegendaryDetail
                        hex={gameState.pendingLegendaryHex}
                        gameState={gameState}
                        hexIdx={-1}
                        pending={true}
                        placementAlert={placementAlert}
                    />
                ) : (hoveredHex && !movedItem) ? (
                    <LegendaryDetail
                        hex={hoveredHex.hex}
                        gameState={gameState}
                        hexIdx={hoveredHex.index}
                    />
                ) : (hoveredItem || lockedItem) && !movedItem ? (
                    <MeteoriteTooltip
                        meteorite={(lockedItem?.item || hoveredItem?.item) as Meteorite}
                        gameState={gameState}
                        x={0} y={0}
                        meteoriteIdx={moduleSockets.diamonds.indexOf((lockedItem?.item || hoveredItem?.item))}
                        isEmbedded={true}
                        isInteractive={true}
                        onMouseEnter={onCancelHoverTimeout}
                        onMouseLeave={() => onMouseLeaveItem(100)}
                    />
                ) : (hoveredBlueprint) ? (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        padding: '15px', color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        position: 'relative'
                    }}>
                        {/* HEADER */}
                        <div style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 900, letterSpacing: '2px' }}>
                                    {hoveredBlueprint.status === 'researching' ? 'UNKNOWN SIGNAL' : 'BLUEPRINT PROTOCOL'}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>
                                    {hoveredBlueprint.status === 'researching' ? '??-???' : hoveredBlueprint.serial}
                                </div>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', paddingRight: '5px' }}>
                            {hoveredBlueprint.status === 'researching' ? (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    height: '100%', opacity: 0.6, textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔐</div>
                                    <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '2px', color: '#60a5fa' }}>DATA ENCRYPTED</div>
                                    <div style={{ fontSize: '10px', marginTop: '5px' }}>RESEARCH REQUIRED TO ACCESS PROTOCOL</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                        <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 700, marginBottom: '2px' }}>DECRYPTED DESIGNATION</div>
                                        <div style={{ fontSize: '20px', fontWeight: 900, color: '#3b82f6', letterSpacing: '2px' }}>{hoveredBlueprint.name}</div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <img
                                            src="/assets/Icons/Blueprint.png"
                                            style={{ width: '80px', height: '80px', filter: 'drop-shadow(0 0 15px #3b82f6)' }}
                                            alt="blueprint"
                                        />
                                    </div>

                                    <div style={{ fontSize: '12px', lineHeight: '1.5', color: '#cbd5e1', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                        <div style={{ fontSize: '9px', color: '#3b82f6', fontWeight: 900, marginBottom: '4px' }}>FUNCTIONAL OVERVIEW</div>
                                        {hoveredBlueprint.desc}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900 }}>ACTIVATION COST</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredBlueprint.cost}</span>
                                                <img src="/assets/Icons/MeteoriteDust.png" style={{ width: '12px', height: '12px' }} />
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900 }}>
                                                {hoveredBlueprint.type === 'QUANTUM_SCRAPPER' ? 'CAPACITY' : 'DURATION'}
                                            </div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>
                                                {hoveredBlueprint.type === 'QUANTUM_SCRAPPER' ? '50 USES' : `${hoveredBlueprint.duration}s`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* STATUS INDICATOR */}
                                    {hoveredBlueprint.status === 'broken' ? (
                                        <div style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: 900, fontSize: '11px', letterSpacing: '1px' }}>
                                            PROTOCOL DAMAGED
                                        </div>
                                    ) : isBuffActive(gameState, hoveredBlueprint.type) ? (
                                        <div style={{ marginTop: '10px', background: 'rgba(34, 197, 94, 0.2)', border: '1px solid #22c55e', color: '#4ade80', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: 900, fontSize: '11px', letterSpacing: '1px' }}>
                                            PROTOCOL ACTIVE {hoveredBlueprint.type === 'QUANTUM_SCRAPPER'
                                                ? `(${gameState.activeBlueprintCharges[hoveredBlueprint.type]} USES)`
                                                : `(${Math.max(0, Math.ceil(gameState.activeBlueprintBuffs[hoveredBlueprint.type]! - gameState.gameTime) - 1)}s)`}
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '8px', borderRadius: '4px', textAlign: 'center', fontWeight: 900, fontSize: '11px', letterSpacing: '1px', opacity: 0.7 }}>
                                            READY FOR ACTIVATION
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.95) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(2, 6, 23, 0.95) 100%)',
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
                    }}>
                        {/* SCROLLING GRID FLOOR (Perspective) */}
                        {!extractionDialogActive && (
                            <div style={{
                                position: 'absolute', bottom: '-30%', left: '-50%', right: '-50%', height: '80%',
                                background: 'linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)',
                                backgroundSize: '40px 40px',
                                transform: 'perspective(300px) rotateX(60deg)',
                                animation: 'grid-pan 10s infinite linear',
                                pointerEvents: 'none',
                                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                            }} />
                        )}

                        {/* SCANNER APERTURE RINGS */}
                        {!extractionDialogActive && (
                            <>
                                <div style={{
                                    position: 'absolute',
                                    width: '280px', height: '280px',
                                    borderRadius: '50%',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderTop: '2px solid rgba(59, 130, 246, 0.6)',
                                    borderBottom: '2px solid rgba(59, 130, 246, 0.6)',
                                    animation: 'spin-slow 12s infinite linear',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{
                                        width: '85%', height: '85%',
                                        borderRadius: '50%',
                                        border: '1px dashed rgba(59, 130, 246, 0.15)',
                                        transform: 'rotate(45deg)'
                                    }} />
                                </div>

                                <div style={{
                                    position: 'absolute',
                                    width: '220px', height: '220px',
                                    borderRadius: '50%',
                                    borderLeft: '4px solid rgba(59, 130, 246, 0.4)',
                                    borderRight: '4px solid rgba(59, 130, 246, 0.4)',
                                    borderTop: '1px solid transparent',
                                    borderBottom: '1px solid transparent',
                                    animation: 'spin-reverse 8s infinite linear',
                                    opacity: 0.7
                                }} />
                            </>
                        )}

                        {/* LASER SCAN BAR */}
                        {!extractionDialogActive && (
                            <div style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '2px',
                                background: 'linear-gradient(90deg, transparent, #60a5fa, #3b82f6, #60a5fa, transparent)',
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 10px rgba(96, 165, 250, 0.8)',
                                animation: 'scan-vertical 4s infinite ease-in-out',
                                zIndex: 5,
                                opacity: 0.9
                            }} />
                        )}

                        {/* TEXT PROMPTS - CENTERED */}
                        <div style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            gap: '15px',
                            zIndex: 10,
                            textAlign: 'center',
                            width: '90%',
                            height: extractionDialogActive ? 'calc(100% + 40px)' : 'auto',
                            marginTop: extractionDialogActive ? '-20px' : 0
                        }}>
                            {extractionDialogActive ? (() => {
                                const visibleMessages = EXTRACTION_MESSAGES.slice(0, gameState.extractionStatus === 'waiting' ? EXTRACTION_MESSAGES.length : gameState.extractionMessageIndex + 1);
                                const hasAlert = visibleMessages.some(m => (m as any).isAlert);

                                return (
                                    <div
                                        ref={terminalRef}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            background: hasAlert ? 'rgba(30, 0, 0, 0.94)' : 'rgba(5, 10, 20, 0.92)',
                                            border: hasAlert ? '1px solid #ef4444' : '1px solid #3b82f6',
                                            borderRadius: '6px',
                                            padding: '18px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px',
                                            overflowY: 'auto',
                                            boxShadow: hasAlert ? '0 0 30px rgba(239, 68, 68, 0.25), inset 0 0 20px rgba(0,0,0,0.6)' : '0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 20px rgba(0,0,0,0.6)',
                                            fontFamily: 'monospace',
                                            color: hasAlert ? '#fca5a5' : '#93c5fd',
                                            scrollbarWidth: 'none',
                                            transition: 'all 0.5s ease'
                                        }}>
                                        {/* TERMINAL HEADER */}
                                        <div style={{ borderBottom: '1px solid ' + (hasAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'), paddingBottom: '6px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', opacity: 0.85, color: hasAlert ? '#ef4444' : 'inherit' }}>
                                            <span>SIGNAL INTERCEPT :: ENCRYPTED</span>
                                            <span style={{ animation: 'pulse-text 1s infinite' }}>{hasAlert ? 'CRITICAL_ALERT' : 'COMMS_ACTIVE'}</span>
                                        </div>

                                        {/* MESSAGES */}
                                        {visibleMessages.map((msg, i) => {
                                            const resolvedText = msg.text
                                                .replace('[ARENA_NAME]', ARENA_DATA[gameState.extractionTargetArena]?.name || "TARGET SECTOR")
                                                .replace('[SECTOR_NAME]', gameState.extractionSectorLabel || "LZ")
                                                .replace('[PLAYER_NAME]', (gameState.playerName || "PLAYER").toUpperCase());
                                            const clock = gameState.extractionDialogTime ?? 0;
                                            const startTime = gameState.extractionMessageTimes?.[i] ?? clock;
                                            const elapsed = Math.max(0, clock - startTime);
                                            const revealCount = Math.min(resolvedText.length, Math.floor(elapsed * 12));
                                            const visibleText = resolvedText.slice(0, revealCount);
                                            const isYou = (msg as any).speaker === 'you';
                                            const isAlert = (msg as any).isAlert;

                                            return (
                                                <div key={i} style={{
                                                    padding: '6px 0',
                                                    borderLeft: !isYou ? (isAlert ? '2px solid #ef4444' : '2px solid #3b82f6') : 'none',
                                                    borderRight: isYou ? '2px solid #f59e0b' : 'none',
                                                    paddingLeft: !isYou ? '10px' : '0',
                                                    paddingRight: isYou ? '10px' : '0',
                                                    textAlign: isYou ? 'right' : 'left',
                                                    alignSelf: isYou ? 'flex-end' : 'flex-start',
                                                    maxWidth: '95%',
                                                    color: isYou ? '#fde68a' : (isAlert ? '#fca5a5' : '#93c5fd'),
                                                    animation: 'typewriter 0.5s ease-out forwards',
                                                    lineHeight: '1.7',
                                                    fontSize: '13px'
                                                }}>
                                                    <span style={{ color: isYou ? '#fbbf24' : (isAlert ? '#ef4444' : '#60a5fa'), opacity: 0.8, marginRight: isYou ? 0 : '8px', marginLeft: isYou ? '8px' : 0 }}>
                                                        {isYou ? 'YOU' : 'ORBITAL'}:
                                                    </span>
                                                    <span style={{ textShadow: isAlert ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none' }}>
                                                        {visibleText}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        {gameState.extractionStatus === 'requested' && (
                                            <div style={{ marginTop: '5px', animation: 'pulse-text 0.8s infinite', fontSize: '12px' }}>_ AWAITING DATA...</div>
                                        )}
                                    </div>
                                );
                            })() : (gameState.extractionStatus === 'active' || gameState.extractionStatus === 'arriving' || gameState.extractionStatus === 'arrived') ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444', animation: 'pulse-text 1s infinite' }}>
                                        EVACUATION ACTIVE
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#fff', marginTop: '10px', opacity: 0.8 }}>
                                        PROCEED TO {ARENA_DATA[gameState.extractionTargetArena]?.name || "TARGET SECTOR"}
                                    </div>
                                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff', marginTop: '5px' }}>
                                        {Math.max(0, Math.ceil(gameState.extractionTimer))}s
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        fontSize: '10px', color: '#3b82f6', fontWeight: 900,
                                        letterSpacing: '5px', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                                        opacity: 0.8
                                    }}>
                                        AWAITING SIGNAL...
                                    </div>

                                    {/* DUST COST FOR EXTRACTION (If any) */}
                                    {gameState.player.dust >= 4000 && (
                                        <button
                                            className="evac-button"
                                            onClick={() => {
                                                if (gameState.player.dust < 4000) return;
                                                fadeOutMusic(1.0);
                                                playSfx('alert');
                                                gameState.extractionStatus = 'requested';
                                                gameState.extractionTimer = 3.0;
                                                gameState.extractionMessageIndex = -1;
                                                gameState.extractionMessageTimes = [];
                                                gameState.extractionDialogTime = 0;
                                                gameState.player.dust -= 4000;
                                            }}
                                            style={{
                                                marginTop: '10px',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '2px solid #ef4444',
                                                padding: '12px 24px',
                                                color: '#fff',
                                                fontWeight: 900,
                                                fontSize: '14px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                letterSpacing: '2px',
                                                textShadow: '0 0 10px #ef4444',
                                                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                                                pointerEvents: 'auto',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            REQUEST EVACUATION (4000 DUST)
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                        <style>{`
                            @keyframes typewriter {
                                from { max-height: 0; }
                                to { max-height: 100px; }
                            }
                            .evac-button:hover {
                                background: rgba(239, 68, 68, 0.4) !important;
                                transform: scale(1.05);
                                boxShadow: 0 0 30px rgba(239, 68, 68, 0.5) !important;
                            }
                        `}</style>

                        <style>{`
                            @keyframes grid-pan {
                                0% { background-position: 0 0; }
                                100% { background-position: 0 40px; }
                            }
                            @keyframes scan-vertical {
                                0% { top: 10%; opacity: 0; }
                                15% { opacity: 1; }
                                85% { opacity: 1; }
                                100% { top: 90%; opacity: 0; }
                            }
                            @keyframes spin-slow {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes spin-reverse {
                                0% { transform: rotate(360deg); }
                                100% { transform: rotate(0deg); }
                            }
                            @keyframes pulse-text {
                                0%, 100% { opacity: 0.7; text-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
                                50% { opacity: 1; text-shadow: 0 0 20px rgba(59, 130, 246, 0.9); }
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};



