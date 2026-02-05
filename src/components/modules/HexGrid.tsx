import React from 'react';
import type { GameState, LegendaryHex, PlayerClass } from '../../logic/types';
import { calculateMeteoriteEfficiency } from '../../logic/EfficiencyLogic';
import { getHexPoints, getMeteoriteImage, getLegendaryInfo, findClosestVertices, RARITY_COLORS } from './ModuleUtils';

interface HexGridProps {
    gameState: GameState;
    movedItem: { item: any, source: string, index: number } | null;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    onInventoryUpdate: (index: number, item: any) => void;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex', index: number } | null) => void;
    setHoveredItem: (item: { item: any, x: number, y: number } | null) => void;
    setLockedItem: (item: { item: any, x: number, y: number } | null) => void;
    handleMouseEnterItem: (item: any, x: number, y: number) => void;
    handleMouseLeaveItem: (delay?: number) => void;
    setHoveredHex: (hex: { hex: LegendaryHex, index: number, x: number, y: number } | null) => void;
    onShowClassDetail: (playerClass: PlayerClass) => void;
    onAttemptRemove: (index: number, item: any, replaceWith?: any) => void;
}

export const HexGrid: React.FC<HexGridProps> = ({
    gameState,
    movedItem,
    onSocketUpdate,
    onInventoryUpdate,
    setMovedItem,
    setHoveredItem,
    setLockedItem,
    handleMouseEnterItem,
    handleMouseLeaveItem,
    setHoveredHex,
    onShowClassDetail,
    onAttemptRemove
}) => {
    const { moduleSockets } = gameState;
    const centerX = 432; // Centered in 45% of 1920 (864px wide)
    const centerY = 540; // True Vertical Centering
    const innerRadius = 170;
    const outerRadius = 260;
    const edgeRadius = 350;

    const INACTIVE_STROKE = "rgba(74, 85, 104, 0.2)";

    const hexPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i;
        const pos = { x: centerX + outerRadius * Math.cos(angle), y: centerY + outerRadius * Math.sin(angle) };
        const vertices = Array.from({ length: 6 }).map((_, vIdx) => {
            const vAngle = (Math.PI / 3) * vIdx - Math.PI / 2;
            return { x: pos.x + 60 * Math.cos(vAngle), y: pos.y + 60 * Math.sin(vAngle) };
        });
        return { ...pos, vertices };
    });

    const innerDiamondPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const pos = { x: centerX + innerRadius * Math.cos(angle), y: centerY + innerRadius * Math.sin(angle) };
        const vertices = [
            { x: 40, y: 0 },
            { x: 0, y: 40 },
            { x: -40, y: 0 },
            { x: 0, y: -40 }
        ].map(v => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: pos.x + (v.x * cos - v.y * sin),
                y: pos.y + (v.x * sin + v.y * cos)
            };
        });
        return { ...pos, vertices, angle };
    });

    const edgeDiamondPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const pos = { x: centerX + edgeRadius * Math.cos(angle), y: centerY + edgeRadius * Math.sin(angle) };
        const vertices = [
            { x: 40, y: 0 },
            { x: 0, y: 40 },
            { x: -40, y: 0 },
            { x: 0, y: -40 }
        ].map(v => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: pos.x + (v.x * cos - v.y * sin),
                y: pos.y + (v.x * sin + v.y * cos)
            };
        });
        return { ...pos, vertices, angle };
    });

    const centerSideMidpoints = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        return { x: centerX + 69.28 * Math.cos(angle), y: centerY + 69.28 * Math.sin(angle) };
    });
    const allDiamondPositions = [...innerDiamondPositions, ...edgeDiamondPositions];

    return (
        <svg width="100%" height="100%" viewBox="0 0 864 1080">
            <text x={centerX} y={centerY - 480} textAnchor="middle" fill="#22d3ee" fontSize="32" fontWeight="900" style={{ letterSpacing: '8px', opacity: 0.8 }}>MODULE MATRIX</text>
            <text x={centerX} y={centerY - 440} textAnchor="middle" fill="#94a3b8" fontSize="12" style={{ letterSpacing: '2px', opacity: 0.6 }}>CONSTRUCT SYNERGIES BY SLOTTING METEORITES AND RECOVERED MODULES</text>
            <line x1={centerX - 250} y1={centerY - 425} x2={centerX + 250} y2={centerY - 425} stroke="#22d3ee" strokeWidth="1" opacity="0.2" />

            {/* 2. MS LINES (Met-Met) */}
            {/* 2.1 Inner-Inner Adjacent (6) */}
            {innerDiamondPositions.map((pos, i) => {
                const nextPos = innerDiamondPositions[(i + 1) % 6];
                const active = moduleSockets.diamonds[i] && moduleSockets.diamonds[(i + 1) % 6];
                const v1 = pos;
                const v2 = nextPos;
                return (
                    <g key={`ms-ii-adj-group-${i}`}>
                        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={active ? "#EF4444" : INACTIVE_STROKE} strokeWidth={active ? "3" : "2"} opacity={active ? 0.3 : 1} className={active ? "pulse-crimson" : ""} />
                        {active && (
                            <>
                                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#F87171" strokeWidth="5" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#F87171" strokeWidth="5" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>
                );
            })}
            {/* 2.3 Inner-Outer Radial (6) */}
            {edgeDiamondPositions.map((ePos, i) => {
                const iPos = innerDiamondPositions[i];
                const active = moduleSockets.diamonds[i + 6] && moduleSockets.diamonds[i];
                const v1 = ePos;
                const v2 = iPos;
                return (
                    <g key={`ms-io-rad-group-${i}`}>
                        <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke={active ? "#EF4444" : INACTIVE_STROKE} strokeWidth={active ? "3" : "2"} opacity={active ? 0.3 : 1} className={active ? "pulse-crimson" : ""} />
                        {active && (
                            <>
                                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#F87171" strokeWidth="5" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#F87171" strokeWidth="5" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>
                );
            })}

            {/* 3. XMS LINES (Hex-Met) */}
            {/* 3.1 Center-Inner Perpendicular (6) */}
            {innerDiamondPositions.map((pos, i) => {
                const active = moduleSockets.diamonds[i];
                const mid = centerSideMidpoints[i];
                const targetV = pos;
                return (
                    <g key={`xms-ci-perp-group-${i}`}>
                        <line x1={mid.x} y1={mid.y} x2={targetV.x} y2={targetV.y} stroke={active ? "#6366F1" : INACTIVE_STROKE} strokeWidth={active ? "2" : "1"} opacity={active ? 0.3 : 1} className={active ? "synergy-trail" : ""} />
                        {active && (
                            <>
                                <line x1={mid.x} y1={mid.y} x2={targetV.x} y2={targetV.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={mid.x} y1={mid.y} x2={targetV.x} y2={targetV.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>
                );
            })}
            {/* 3.2 OuterHex-InnerMet (12) */}
            {hexPositions.map((hPos, i) => {
                const dIdx1 = i;
                const dIdx2 = (i + 5) % 6;
                const active1 = moduleSockets.hexagons[i] && moduleSockets.diamonds[dIdx1];
                const active2 = moduleSockets.hexagons[i] && moduleSockets.diamonds[dIdx2];
                const dPos1 = innerDiamondPositions[dIdx1];
                const dPos2 = innerDiamondPositions[dIdx2];
                const pair1 = findClosestVertices(hPos.vertices, [dPos1]);
                const pair2 = findClosestVertices(hPos.vertices, [dPos2]);
                return [
                    <g key={`xms-hi-group-${i}-1`}>
                        <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke={active1 ? "#6366F1" : INACTIVE_STROKE} strokeWidth={active1 ? "2" : "1"} opacity={active1 ? 0.3 : 1} className={active1 ? "synergy-trail" : ""} />
                        {active1 && (
                            <>
                                <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>,
                    <g key={`xms-hi-group-${i}-2`}>
                        <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke={active2 ? "#6366F1" : INACTIVE_STROKE} strokeWidth={active2 ? "2" : "1"} opacity={active2 ? 0.3 : 1} className={active2 ? "synergy-trail" : ""} />
                        {active2 && (
                            <>
                                <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>
                ];
            })}
            {/* 3.3 OuterHex-EdgeMet (12) */}
            {hexPositions.map((hPos, i) => {
                const eIdx1 = i;
                const eIdx2 = (i + 5) % 6;
                const active1 = moduleSockets.hexagons[i] && moduleSockets.diamonds[eIdx1 + 6];
                const active2 = moduleSockets.hexagons[i] && moduleSockets.diamonds[eIdx2 + 6];
                const ePos1 = edgeDiamondPositions[eIdx1];
                const ePos2 = edgeDiamondPositions[eIdx2];
                const pair1 = findClosestVertices(hPos.vertices, [ePos1]);
                const pair2 = findClosestVertices(hPos.vertices, [ePos2]);
                return [
                    <g key={`xms-he-group-${i}-1`}>
                        <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke={active1 ? "#6366F1" : INACTIVE_STROKE} strokeWidth={active1 ? "2" : "1"} opacity={active1 ? 0.4 : 1} className={active1 ? "synergy-trail" : ""} />
                        {active1 && (
                            <>
                                <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={pair1.v1.x} y1={pair1.v1.y} x2={pair1.v2.x} y2={pair1.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>,
                    <g key={`xms-he-group-${i}-2`}>
                        <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke={active2 ? "#6366F1" : INACTIVE_STROKE} strokeWidth={active2 ? "2" : "1"} opacity={active2 ? "0.4" : 1} className={active2 ? "synergy-trail" : ""} />
                        {active2 && (
                            <>
                                <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-forward" />
                                <line x1={pair2.v1.x} y1={pair2.v1.y} x2={pair2.v2.x} y2={pair2.v2.y} stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="2, 120" className="energy-dot-reverse" />
                            </>
                        )}
                    </g>
                ];
            })}

            <defs>
                <radialGradient id="hp-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                </radialGradient>
                <radialGradient id="socket-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(2, 6, 23, 0.95)" />
                    <stop offset="70%" stopColor="rgba(15, 23, 42, 0.6)" />
                    <stop offset="100%" stopColor="rgba(30, 41, 59, 0.2)" />
                </radialGradient>
                <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgb(15, 23, 42)" />
                    <stop offset="100%" stopColor="rgb(2, 6, 23)" />
                </radialGradient>
                <filter id="rugged-rim">
                    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                </filter>
            </defs>

            <g
                style={{ cursor: 'pointer' }}
                onClick={() => {
                    const centerClass = gameState.moduleSockets.center;
                    if (centerClass) {
                        onShowClassDetail(centerClass);
                    }
                }}
            >
                {/* Attention Pulse for First-Time Players */}
                {!gameState.chassisDetailViewed && (
                    <polygon
                        points={getHexPoints(centerX, centerY, 90)}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        className="pulse-attention"
                        pointerEvents="none"
                    />
                )}

                {/* Invisible click target for the central hex area */}
                <polygon
                    points={getHexPoints(centerX, centerY, 80)}
                    fill="transparent"
                    pointerEvents="all"
                />

                {!gameState.moduleSockets.center?.iconUrl && (
                    <polygon
                        points={getHexPoints(centerX, centerY, 80)}
                        fill="url(#core-grad)"
                        stroke={gameState.moduleSockets.center ? gameState.moduleSockets.center.icon : "#22d3ee"}
                        strokeWidth="4"
                        className={gameState.moduleSockets.center ? "glow-hex" : "glow-cyan"}
                        style={{ '--hex-color': gameState.moduleSockets.center?.icon } as any}
                        pointerEvents="none"
                    />
                )}
                {gameState.moduleSockets.center && (
                    <>
                        {gameState.moduleSockets.center.iconUrl ? (
                            <image
                                href={gameState.moduleSockets.center.iconUrl}
                                x={centerX - 80}
                                y={centerY - 80}
                                width="160"
                                height="160"
                                pointerEvents="none"
                                style={{ filter: `drop-shadow(0 0 20px ${gameState.moduleSockets.center.icon})` }}
                            />
                        ) : (
                            <>
                                <text
                                    x={centerX}
                                    y={centerY - 5}
                                    textAnchor="middle"
                                    fill={gameState.moduleSockets.center.icon}
                                    fontSize="24"
                                    fontWeight="900"
                                    style={{ filter: `drop-shadow(0 0 10px ${gameState.moduleSockets.center.icon})`, letterSpacing: '2px' }}
                                    pointerEvents="none"
                                >
                                    {gameState.moduleSockets.center.name.toUpperCase()}
                                </text>
                                <text
                                    x={centerX}
                                    y={centerY + 25}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="10"
                                    fontWeight="700"
                                    style={{ letterSpacing: '1px' }}
                                    pointerEvents="none"
                                >
                                    CHASSIS
                                </text>
                            </>
                        )}
                    </>
                )}
            </g>

            {hexPositions.map((pos, i) => {
                const hex = gameState.moduleSockets.hexagons[i];
                const info = hex ? getLegendaryInfo(hex.category, hex.type) : null;
                return (
                    <g key={`hex-socket-${i}`}
                        onClick={() => {
                            if (gameState.pendingLegendaryHex && !hex) {
                                onSocketUpdate('hex', i, { ...gameState.pendingLegendaryHex });
                            }
                        }}
                        onMouseMove={(e) => {
                            if (hex && !movedItem) {
                                setHoveredHex({ hex, index: i, x: e.clientX, y: e.clientY });
                            }
                        }}
                        onMouseLeave={() => setHoveredHex(null)}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ cursor: (gameState.pendingLegendaryHex && !hex) ? 'copy' : (hex ? 'help' : 'default') }}
                    >
                        <polygon
                            points={getHexPoints(pos.x, pos.y, 60)}
                            fill="url(#core-grad)"
                            stroke={hex ? info?.color : "rgba(250, 204, 21, 0.5)"}
                            strokeWidth={hex ? "4" : "2"}
                            className={hex ? "glow-hex" : "glow-yellow"}
                            style={{ '--hex-color': info?.color } as any}
                        />
                        {hex && (
                            <g>
                                {hex.customIcon ? (
                                    <image
                                        href={hex.customIcon}
                                        x={pos.x - 60}
                                        y={pos.y - 60}
                                        width="120"
                                        height="120"
                                        style={{ imageRendering: 'pixelated', filter: `drop-shadow(0 0 15px ${info?.color}88)` }}
                                        pointerEvents="none"
                                    />
                                ) : (
                                    <text x={pos.x} y={pos.y - 5} textAnchor="middle" fill={info?.color} fontSize="28" style={{ filter: `drop-shadow(0 0 8px ${info?.color})`, fontWeight: 900 }} pointerEvents="none">
                                        {info?.icon}
                                    </text>
                                )}
                                <rect x={pos.x - 28} y={pos.y + 40} width="56" height="18" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke={info?.color} strokeWidth="2" pointerEvents="none" />
                                <text x={pos.x} y={pos.y + 53} textAnchor="middle" fill={hex.level === 5 ? "#FCD34D" : info?.color} fontSize="12" fontWeight="900" pointerEvents="none" style={{ letterSpacing: '1px' }}>
                                    {hex.level === 5 ? "MAX" : `LVL ${hex.level}`}
                                </text>
                                {gameState.upgradingHexIndex === i && gameState.upgradingHexTimer > 0 && (
                                    <g>
                                        <polygon
                                            points={getHexPoints(pos.x, pos.y, 52.5)}
                                            fill="none"
                                            stroke="#fbbf24"
                                            strokeWidth="3"
                                            className="pulse-upgrade-ring"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                        <text
                                            x={pos.x}
                                            y={pos.y - 80}
                                            textAnchor="middle"
                                            fill="#fbbf24"
                                            fontSize="24"
                                            fontWeight="900"
                                            className="float-up-fade"
                                            style={{ textShadow: '0 0 10px #fbbf24' }}
                                        >
                                            UPGRADED!
                                        </text>
                                    </g>
                                )}
                                {hex.level === 5 && (
                                    <circle cx={pos.x} cy={pos.y} r="55" fill="none" stroke="#FCD34D" strokeWidth="2" strokeDasharray="4 4" className="spin-slow" pointerEvents="none" />
                                )}
                            </g>
                        )}
                        {gameState.pendingLegendaryHex && !hex && (
                            <polygon
                                points={getHexPoints(pos.x, pos.y, 68)}
                                fill="rgba(251, 191, 36, 0.05)"
                                stroke="#fbbf24"
                                strokeWidth="2"
                                style={{ pointerEvents: 'none', transformBox: 'fill-box', transformOrigin: 'center' }}
                                className="pulse-legendary-glow"
                            />
                        )}
                    </g>
                );
            })}

            {allDiamondPositions.map((pos, i) => (
                <g key={`diamond-socket-${i}`}
                    style={{ pointerEvents: gameState.pendingLegendaryHex ? 'none' : 'auto' }}
                    onMouseDown={(e) => {
                        if (gameState.pendingLegendaryHex) return; // Disable during placement
                        if (!movedItem && moduleSockets.diamonds[i]) {
                            e.stopPropagation();
                            onAttemptRemove(i, moduleSockets.diamonds[i]);
                            return;
                        }
                    }}
                    onClick={() => {
                        // Only Click-Lock tooltip if not dragging
                        if (!movedItem && moduleSockets.diamonds[i]) {
                            // Note: onMouseDown usually fires before onClick, so this might be redundant or unreachable if handled above.
                            // However, if we want dragging logic separate from locking, we need to be careful.
                            // Current request is "try to drag" -> show popup.
                            // If we assume interaction starts with mousedown, we use that.
                            // We'll keep setLockedItem here for explicit clicks that don't trigger drag threshold (if we had one),
                            // BUT since we are popping up a modal on ANY attempt to "pick up" (which assumes mousedown),
                            // we might block the lock info.
                            // Actually, if a modal pops up, you can't lock the item instructions anyway.
                            // Let's rely on onMouseDown for the "Remove" flow.
                        }
                    }}
                    onMouseUp={(_e) => {
                        _e.stopPropagation();
                        if (movedItem) {
                            const itemAtTarget = moduleSockets.diamonds[i];
                            // FIX: If target is filled, force removal check (5-dust fee) instead of free swap
                            if (itemAtTarget) {
                                onAttemptRemove(i, itemAtTarget, movedItem);
                                // We don't drop the new item yet; user must pay to clear the slot first
                                setMovedItem(null);
                                return;
                            }

                            // Handle Drop on Empty Socket
                            if (movedItem.source === 'inventory') {
                                onSocketUpdate('diamond', i, movedItem.item);
                                onInventoryUpdate(movedItem.index, null);
                            } else if (movedItem.source === 'diamond') {
                                // Move from socket to socket (both were empty or source index is reset)
                                onSocketUpdate('diamond', i, movedItem.item);
                                onSocketUpdate('diamond', movedItem.index, null);
                            }
                            setMovedItem(null);
                            setHoveredItem(null);
                            setLockedItem(null);
                        }
                    }}
                >
                    {movedItem && !moduleSockets.diamonds[i] && (
                        <circle
                            cx={pos.x} cy={pos.y} r="50"
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="3"
                            strokeDasharray="8 6"
                            className="pulse-cyan-glow"
                            pointerEvents="none"
                        />
                    )}
                    <circle cx={pos.x} cy={pos.y} r="40" fill="none" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="2" filter="url(#rugged-rim)" className="glow-pink" />
                    <circle cx={pos.x} cy={pos.y} r="35" fill="url(#socket-grad)" stroke="rgba(236, 72, 153, 0.25)" strokeWidth="1" filter="url(#rugged-rim)" />
                    <circle cx={pos.x} cy={pos.y} r="25" fill="rgba(0,0,0,0.3)" />

                    {moduleSockets.diamonds[i] && (
                        <>
                            <foreignObject x={pos.x - 35} y={pos.y - 35} width="70" height="70" style={{ pointerEvents: 'none' }}>
                                <div
                                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseMove={(e) => {
                                        const item = moduleSockets.diamonds[i];
                                        if (item && !movedItem) {
                                            handleMouseEnterItem(item, e.clientX, e.clientY);
                                            if (item.isNew) {
                                                item.isNew = false;
                                                onSocketUpdate('diamond', i, item);
                                            }
                                        }
                                    }}

                                    onMouseLeave={() => handleMouseLeaveItem(100)}
                                >
                                    {moduleSockets.diamonds[i]?.isNew && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            background: '#ef4444',
                                            color: 'white',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            padding: '2px 4px',
                                            borderRadius: '4px',
                                            boxShadow: '0 0 10px #ef4444',
                                            zIndex: 10,
                                            pointerEvents: 'none',
                                            animation: 'pulse-red 1s infinite'
                                        }}>
                                            NEW
                                        </div>
                                    )}
                                    <img
                                        src={getMeteoriteImage(moduleSockets.diamonds[i]!)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'auto', // Allow mouse events for hover
                                            cursor: movedItem ? 'copy' : 'help' // Indicate info available
                                        }}
                                        alt="meteorite"
                                    />
                                </div>
                            </foreignObject>

                            {/* SVG-based Efficiency Label (to avoid clipping) */}
                            <g pointerEvents="none">
                                <rect
                                    x={pos.x - 32}
                                    y={pos.y + 25}
                                    width="64"
                                    height="18"
                                    rx="4"
                                    fill="rgba(15, 23, 42, 0.98)"
                                    stroke={RARITY_COLORS[moduleSockets.diamonds[i]!.rarity]}
                                    strokeWidth="1.5"
                                    style={{ filter: `drop-shadow(0 0 8px ${RARITY_COLORS[moduleSockets.diamonds[i]!.rarity]}66)` }}
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y + 38}
                                    textAnchor="middle"
                                    fill={RARITY_COLORS[moduleSockets.diamonds[i]!.rarity]}
                                    fontSize="11"
                                    fontWeight="900"
                                    style={{ letterSpacing: '0.5px' }}
                                >
                                    +{Math.round(calculateMeteoriteEfficiency(gameState, i).totalBoost * 100)}%
                                </text>
                            </g>
                        </>
                    )}
                </g>
            ))}
        </svg>
    );
};
