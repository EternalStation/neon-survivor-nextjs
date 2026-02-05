
import React, { useState, useRef } from 'react';
import type { GameState, Meteorite, LegendaryHex, PlayerClass } from '../logic/types';
import { MeteoriteTooltip } from './MeteoriteTooltip';
import { HexGrid } from './modules/HexGrid';
import { LegendaryDetail } from './LegendaryDetail';
import { InventoryPanel } from './modules/InventoryPanel';
import { ChassisDetail } from './modules/ChassisDetail';
import { getMeteoriteImage, getDustValue, RARITY_ORDER } from './modules/ModuleUtils';

interface ModuleMenuProps {
    gameState: GameState;
    isOpen: boolean;
    onClose: () => void;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    onInventoryUpdate: (index: number, item: any) => void;
    onRecycle: (source: 'inventory' | 'diamond', index: number, amount: number) => void;
    spendDust: (amount: number) => boolean;
    onViewChassisDetail: () => void;
}

export const ModuleMenu: React.FC<ModuleMenuProps> = ({ gameState, isOpen, onClose, onSocketUpdate, onInventoryUpdate, onRecycle, spendDust, onViewChassisDetail }) => {
    const [movedItem, setMovedItem] = useState<{ item: Meteorite | any, source: 'inventory' | 'diamond' | 'hex', index: number } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [lockedItem, setLockedItem] = useState<{ item: Meteorite | any, x: number, y: number } | null>(null);
    const [hoveredItem, setHoveredItem] = useState<{ item: Meteorite | any, x: number, y: number } | null>(null);
    const [hoveredHex, setHoveredHex] = useState<{ hex: LegendaryHex, index: number, x: number, y: number } | null>(null);
    const [selectedClassDetail, setSelectedClassDetail] = useState<PlayerClass | null>(null);
    const [isRecycleMode, setIsRecycleMode] = useState(false);
    const [recyclingAnim, setRecyclingAnim] = useState(false); // Used for visual feedback on button

    // Removal Confirmation State
    const [removalCandidate, setRemovalCandidate] = useState<{ index: number, item: any, replaceWith?: { item: any, source: string, index: number } } | null>(null);
    const [placementAlert, setPlacementAlert] = useState(false);

    const hoverTimeout = useRef<number | null>(null);

    // Reset Recycle Mode when menu closes (because component might stay mounted but return null)
    React.useEffect(() => {
        if (!isOpen) {
            setIsRecycleMode(false);
            setRemovalCandidate(null);
            setSelectedClassDetail(null);
            setHoveredItem(null);
            setLockedItem(null);
            setHoveredHex(null);
            setMovedItem(null);
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                // Prevent closing if pending placement
                if (!gameState.pendingLegendaryHex) {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleMouseEnterItem = (item: any, x: number, y: number) => {
        if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
            hoverTimeout.current = null;
        }
        setHoveredItem({ item, x, y });
    };

    const handleMouseLeaveItem = (delay: number = 300) => {
        hoverTimeout.current = window.setTimeout(() => {
            setHoveredItem(null);
            setLockedItem(null);
        }, delay);
    };

    const handleAttemptRemove = (index: number, item: any, replaceWith?: { item: any, source: string, index: number }) => {
        setLockedItem(null); // Clear tooltip lock so popup is visible
        setRemovalCandidate({ index, item, replaceWith });
    };

    const confirmRemoval = () => {
        if (removalCandidate) {
            if (spendDust(5)) {
                const { index, item, replaceWith } = removalCandidate;
                const newItem = { ...item, isNew: false };

                // 1. Clear the source slot first (frees up inventory slot if needed)
                if (replaceWith) {
                    if (replaceWith.source === 'inventory') {
                        onInventoryUpdate(replaceWith.index, null);
                    } else if (replaceWith.source === 'diamond') {
                        onSocketUpdate('diamond', replaceWith.index, null);
                    }
                }

                // 2. Extract old item to inventory
                const emptySlotIdx = gameState.inventory.indexOf(null);
                if (emptySlotIdx !== -1) {
                    onInventoryUpdate(emptySlotIdx, newItem);
                }

                // 3. Place new item in target socket if replacing
                if (replaceWith) {
                    onSocketUpdate('diamond', index, replaceWith.item);
                } else {
                    onSocketUpdate('diamond', index, null);
                }

                setRemovalCandidate(null);
            }
        }
    };

    // Destroy Item Logic
    const handleRecycleClick = (idx: number) => {
        if (gameState.pendingLegendaryHex) {
            setPlacementAlert(true);
            setTimeout(() => setPlacementAlert(false), 2000);
            return;
        }
        const item = gameState.inventory[idx];
        if (item) {
            const dustAmount = getDustValue(item.rarity);
            onRecycle('inventory', idx, dustAmount);
            // Visual feedback for successful recycle (maybe sound too if I could)
            setRecyclingAnim(true);
            setTimeout(() => setRecyclingAnim(false), 200);
        }
    };

    const handleMassRecycle = (indices: number[]) => {
        if (indices.length === 0) return;

        let totalDust = 0;
        indices.forEach(idx => {
            const item = gameState.inventory[idx];
            if (item) {
                totalDust += getDustValue(item.rarity);
            }
        });

        // Loop backwards to preserve indices? No, the onRecycle for inventory just sets it to null at that index.
        indices.forEach(idx => {
            onRecycle('inventory', idx, 0); // Amount 0 here because we'll update player dust separately or let the parent handle it
        });

        // Use the game logic to reward dust
        gameState.player.dust += totalDust;

        setRecyclingAnim(true);
        setTimeout(() => setRecyclingAnim(false), 500);
    };

    const handleSortByRarity = () => {
        if (gameState.pendingLegendaryHex) {
            setPlacementAlert(true);
            setTimeout(() => setPlacementAlert(false), 2000);
            return;
        }
        // Collect all actual items
        const items = gameState.inventory.filter((m): m is Meteorite => m !== null);

        // Build rarity map for quick lookup
        const rarityMap: Record<string, number> = {};
        RARITY_ORDER.forEach((r, i) => rarityMap[r] = i);

        // Sort: Highest rarity (highest index in RARITY_ORDER) comes first
        items.sort((a, b) => rarityMap[b.rarity] - rarityMap[a.rarity]);

        // Construct new inventory array with sorted items followed by nulls
        const newInventory: (Meteorite | null)[] = [...items];
        while (newInventory.length < gameState.inventory.length) {
            newInventory.push(null);
        }

        // Apply updates to the state
        newInventory.forEach((item, idx) => {
            onInventoryUpdate(idx, item);
        });
    };

    if (!isOpen) return null;

    const { moduleSockets } = gameState;
    const meteoriteDust = gameState.player.dust;

    return (
        <div
            onMouseMove={(e) => {
                if (!movedItem) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleX = e.currentTarget.offsetWidth / rect.width;
                const scaleY = e.currentTarget.offsetHeight / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                setMousePos({ x, y });
            }}
            onMouseUp={() => {
                if (movedItem) {
                    // Cancel Drag / Drop back to source
                    if (movedItem.source === 'diamond') {
                        onSocketUpdate('diamond', movedItem.index, movedItem.item);
                    } else if (movedItem.source === 'inventory') {
                        onInventoryUpdate(movedItem.index, movedItem.item);
                    }
                    setMovedItem(null);
                }
            }}
            style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                background: 'radial-gradient(circle, rgb(10, 10, 30) 0%, rgb(2, 2, 5) 100%)',
                zIndex: 2000, color: 'white', fontFamily: 'Orbitron, sans-serif',
                overflow: 'hidden'
            }}>

            {/* MAIN LAYOUT CONTAINER */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', pointerEvents: 'none' // Allow clicks only on interactive elements
            }}>

                {/* LEFT: MATRIX (40%) - Shrunk slightly to give more room to right */}
                <div style={{
                    width: '40%',
                    height: '100%',
                    position: 'relative',
                    borderRight: '2px solid rgba(59, 130, 246, 0.3)',
                    background: 'radial-gradient(circle at 60% 50%, rgba(10, 10, 30, 0.9) 0%, rgba(2, 2, 5, 0.4) 100%)',
                    pointerEvents: 'auto'
                }}>
                    <HexGrid
                        gameState={gameState}
                        movedItem={movedItem}
                        onSocketUpdate={onSocketUpdate}
                        onInventoryUpdate={onInventoryUpdate}
                        setMovedItem={(item) => {
                            if (gameState.pendingLegendaryHex) {
                                setPlacementAlert(true);
                                setTimeout(() => setPlacementAlert(false), 2000);
                                return;
                            }
                            setMovedItem(item);
                        }}
                        setHoveredItem={setHoveredItem}
                        setLockedItem={setLockedItem}
                        handleMouseEnterItem={handleMouseEnterItem}
                        handleMouseLeaveItem={handleMouseLeaveItem}
                        setHoveredHex={setHoveredHex}
                        onShowClassDetail={(cls) => {
                            setSelectedClassDetail(cls);
                            onViewChassisDetail();
                        }}
                        onAttemptRemove={(index, item, replaceWith) => {
                            if (gameState.pendingLegendaryHex) {
                                setPlacementAlert(true);
                                setTimeout(() => setPlacementAlert(false), 2000);
                                return;
                            }
                            handleAttemptRemove(index, item, replaceWith);
                        }}
                    />
                </div>

                {/* RIGHT: CONTROLS & INVENTORY (60%) - Expanded */}
                <div style={{
                    width: '60%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
                    pointerEvents: 'auto'
                }}>

                    <div style={{
                        flex: '0 0 calc(40% + 50px)', // Increased significantly to handle Singularity tier perks without shifting
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        paddingRight: '10px', // Add offset from inventory
                        borderRight: 'none' // Remove separator line to use empty space as divider
                    }}>
                        {/* DATA PANEL (Top - 9:16 tactical area) */}
                        <div style={{
                            flex: 1,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            // padding: '10px 0 10px 15px', // Adjust padding -> CHANGED back to uniform
                            padding: '10px',
                            background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, rgba(2, 2, 5, 0.2) 100%)',
                            // overflow: 'hidden' -> REMOVED to show borders
                        }}>
                            <div className="data-panel" style={{
                                width: '100%',
                                height: '100%',
                                background: 'rgba(5, 5, 15, 0.95)',
                                border: '2px solid #3b82f6',
                                borderRadius: '8px',
                                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                overflow: 'hidden',
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
                                        onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
                                        onMouseLeave={() => handleMouseLeaveItem(100)}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        color: '#3b82f6', opacity: 0.5, gap: '6px'
                                    }}>
                                        <div style={{ fontSize: '20px', animation: 'spin-slow 10s infinite linear' }}>⬡</div>
                                        <div style={{ fontWeight: 900, letterSpacing: '1px', fontSize: '12px' }}>SYSTEM IDLE</div>
                                        <div style={{ fontSize: '8px' }}>HOVER OVER MODULE TO SCAN</div>
                                        <style>{`@keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BUTTON CLUSTER (Bottom - Metadata & Recycler) */}
                        <div style={{
                            padding: '10px',
                            display: 'flex',
                            flexDirection: 'row', // Horizontal layout
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            borderTop: '1px solid rgba(59, 130, 246, 0.2)', // Separator from panel
                            background: 'rgba(15, 23, 42, 0.5)',
                            pointerEvents: 'auto'
                        }}>
                            {/* DUST & EXTRACTION GROUP */}
                            <div style={{
                                flex: '1',
                                display: 'flex',
                                alignItems: 'stretch',
                                gap: '4px'
                            }}>
                                {/* DUST RESOURCE DISPLAY */}
                                <div style={{
                                    flex: '1',
                                    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
                                    border: '1px solid #475569',
                                    borderLeft: '4px solid #22d3ee',
                                    borderRadius: '4px',
                                    padding: '6px 10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    minHeight: '36px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src="/assets/Icons/MeteoriteDust.png" alt="Dust" style={{ width: '20px', height: '20px', filter: 'drop-shadow(0 0 5px #22d3ee)' }} />
                                        <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontWeight: 700 }}>DUST:</span>
                                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>{meteoriteDust}</span>
                                    </div>
                                </div>

                                {/* EXTRACTION BUTTON (Future Level Warp) */}
                                <button
                                    onClick={() => {
                                        if (meteoriteDust >= 5000) {
                                            alert("EXTRACTION SUCCESSFUL: Warp Drive Engaged. (To be continued in next Sector)");
                                            onClose();
                                        }
                                    }}
                                    disabled={meteoriteDust < 5000}
                                    style={{
                                        flex: '0 0 120px',
                                        background: meteoriteDust >= 5000
                                            ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                                            : 'rgba(30, 41, 59, 0.4)',
                                        border: `1px solid ${meteoriteDust >= 5000 ? '#60a5fa' : '#475569'}`,
                                        borderRadius: '4px',
                                        color: meteoriteDust >= 5000 ? '#fff' : '#64748b',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        letterSpacing: '1.5px',
                                        cursor: meteoriteDust >= 5000 ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.3s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: meteoriteDust >= 5000 ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '2px' }}>
                                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                        <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3" />
                                        <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5" />
                                    </svg>
                                    <span style={{ fontSize: '9px', fontWeight: 900 }}>EXTRACTION</span>
                                    <span style={{ fontSize: '8px', opacity: 0.8, marginTop: '1px' }}>COST: 5,000</span>
                                </button>
                            </div>

                        </div>
                    </div>

                    {/* COL 2: INVENTORY - Remaining Width (55%) */}
                    <div style={{
                        flex: 1, // Takes remaining width (approx 55% of 55%)
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'rgba(5, 5, 15, 0.98)',
                        padding: '5px' // Reduced padding from 10px
                    }}>
                        <InventoryPanel
                            inventory={gameState.inventory}
                            movedItem={movedItem}
                            onInventoryUpdate={onInventoryUpdate}
                            onSocketUpdate={onSocketUpdate}
                            setMovedItem={(item) => {
                                if (gameState.pendingLegendaryHex) {
                                    setPlacementAlert(true);
                                    setTimeout(() => setPlacementAlert(false), 2000);
                                    return;
                                }
                                setMovedItem(item);
                            }}
                            handleMouseEnterItem={handleMouseEnterItem}
                            handleMouseLeaveItem={handleMouseLeaveItem}
                            isRecycleMode={isRecycleMode}
                            onRecycleClick={handleRecycleClick}
                            onMassRecycle={(indices) => {
                                if (gameState.pendingLegendaryHex) {
                                    setPlacementAlert(true);
                                    setTimeout(() => setPlacementAlert(false), 2000);
                                    return;
                                }
                                handleMassRecycle(indices);
                            }}
                            onSort={handleSortByRarity}
                            onToggleRecycle={() => setIsRecycleMode(!isRecycleMode)}
                            recyclingAnim={recyclingAnim}
                        />
                    </div>
                </div>
            </div>

            {/* Ghost Item Rendering */}
            {movedItem && (
                <div style={{
                    position: 'absolute',
                    top: mousePos.y,
                    left: mousePos.x,
                    width: '60px',
                    height: '60px',
                    pointerEvents: 'none',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999,
                    filter: 'drop-shadow(0 0 15px cyan)'
                }}>
                    <img
                        src={getMeteoriteImage(movedItem.item)}
                        alt="moved"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
            )}

            {/* REMOVAL CONFIRMATION MODAL */}
            {removalCandidate && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                    onClick={() => setRemovalCandidate(null)} // Click outside to cancel
                >
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '2px solid #ef4444',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                        minWidth: '300px'
                    }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
                    >
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444', letterSpacing: '1px' }}>
                            {removalCandidate.replaceWith ? 'REPLACE MODULE?' : 'UNSOCKET MODULE?'}
                        </div>
                        <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '12px' }}>
                            {removalCandidate.replaceWith
                                ? 'Replacing this module will move the current one to your inventory.'
                                : 'Removing this module requires energy to safely extract.'}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '4px' }}>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>COST: 5</span>
                            <img src="/assets/Icons/MeteoriteDust.png" alt="Dust" style={{ width: '20px', height: '20px' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '5px' }}>
                            <button
                                onClick={() => setRemovalCandidate(null)}
                                style={{
                                    flex: 1, padding: '10px', background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                                    fontWeight: 'bold', fontSize: '12px'
                                }}
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmRemoval}
                                disabled={meteoriteDust < 5}
                                style={{
                                    flex: 1, padding: '10px',
                                    background: meteoriteDust >= 5 ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                                    border: '1px solid #ef4444', color: meteoriteDust >= 5 ? '#fff' : '#fecaca',
                                    borderRadius: '4px', cursor: meteoriteDust >= 5 ? 'pointer' : 'not-allowed',
                                    fontWeight: 'bold', fontSize: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                                }}
                            >
                                {meteoriteDust >= 5
                                    ? (removalCandidate.replaceWith ? 'REPLACE' : 'EXTRACT')
                                    : 'NO DUST'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedClassDetail && (
                <ChassisDetail
                    gameState={gameState}
                    playerClass={selectedClassDetail}
                    onClose={() => setSelectedClassDetail(null)}
                />
            )}

            <style>{`
                .glow-cyan { filter: drop-shadow(0 0 10px #22d3ee); }
                .glow-yellow { filter: drop-shadow(0 0 7px rgba(250, 204, 21, 0.7)); }
                .glow-gold { filter: drop-shadow(0 0 15px #fbbf24); }
                .glow-pink { filter: drop-shadow(0 0 15px rgba(236, 72, 153, 0.9)); }
                .glow-hex { filter: drop-shadow(0 0 15px var(--hex-color)); }
                
                .pulse-gold { animation: pulseGold 1.5s infinite; }
                @keyframes pulseGold {
                    0% { opacity: 0.2; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.05); }
                    100% { opacity: 0.2; transform: scale(1); }
                }

                .pulse-purple { animation: pulsePurple 3s infinite ease-in-out; }
                .pulse-crimson { animation: pulseCrimson 3s infinite ease-in-out; }
                .synergy-trail { animation: trailPulse 3s infinite ease-in-out; }

                .pulse-slow { animation: pulseSlow 4s infinite ease-in-out; transform-box: fill-box; transform-origin: center; }
                .rotate-fast { animation: rotateFast 2s infinite linear; transform-box: fill-box; transform-origin: center; }
                
                .glow-purple { filter: drop-shadow(0 0 8px #c084fc); }
                .glow-rose { filter: drop-shadow(0 0 8px #fb7185); }
                .glow-gold { filter: drop-shadow(0 0 8px #fbbf24); }

                @keyframes pulseSlow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                @keyframes rotateFast {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .energy-dot-forward { animation: moveDotForward 10s infinite linear; }
                .energy-dot-reverse { animation: moveDotReverse 10s infinite linear; }
                
                @keyframes moveDotForward { 0% { stroke-dashoffset: 1000; } 100% { stroke-dashoffset: 0; } }
                @keyframes moveDotReverse { 0% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 1000; } }

                @keyframes pulsePurple {
                    0%, 100% { stroke: #A855F7; filter: drop-shadow(0 0 5px #A855F7); }
                    50% { stroke: #D8B4FE; filter: drop-shadow(0 0 20px #A855F7); }
                }
                @keyframes pulseCrimson {
                    0%, 100% { stroke: #EF4444; filter: drop-shadow(0 0 5px #EF4444); }
                    50% { stroke: #F87171; filter: drop-shadow(0 0 20px #EF4444); }
                }
                @keyframes trailPulse {
                    0%, 100% { stroke: #6366F1; filter: drop-shadow(0 0 5px #6366F1); }
                    50% { stroke: #818CF8; filter: drop-shadow(0 0 20px #6366F1); }
                }

                .pulse-cyan-glow { animation: pulseCyanGlow 2s infinite ease-in-out; }
                @keyframes pulseCyanGlow {
                    0% { stroke: #22d3ee; opacity: 0.3; filter: drop-shadow(0 0 5px #22d3ee); stroke-dashoffset: 0; }
                    50% { stroke: #ffffff; opacity: 1; filter: drop-shadow(0 0 20px #22d3ee); stroke-dashoffset: 20; }
                    100% { stroke: #22d3ee; opacity: 0.3; filter: drop-shadow(0 0 5px #22d3ee); stroke-dashoffset: 40; }
                }

                .pulse-legendary-glow { animation: pulseLegendaryGlow 2s infinite ease-in-out; }
                @keyframes pulseLegendaryGlow {
                    0% { stroke: #fbbf24; opacity: 0.3; filter: drop-shadow(0 0 5px #fbbf24); transform: scale(1); }
                    50% { stroke: #ffffff; opacity: 0.8; filter: drop-shadow(0 0 20px #fbbf24); transform: scale(1.08); }
                    100% { stroke: #fbbf24; opacity: 0.3; filter: drop-shadow(0 0 5px #fbbf24); transform: scale(1); }
                }
                @keyframes upgradePulse {
                    0% { transform: scale(1); opacity: 1; stroke-width: 2; }
                    100% { transform: scale(1.5); opacity: 0; stroke-width: 10; }
                }
                .pulse-upgrade-ring {
                    animation: upgradePulse 1s 3 linear;
                    transform-origin: center;
                    transform-box: fill-box;
                }
                @keyframes attentionPulse {
                    0% { transform: scale(1); opacity: 0.1; stroke-width: 1; }
                    50% { transform: scale(1.1); opacity: 0.6; stroke-width: 3; }
                    100% { transform: scale(1); opacity: 0.1; stroke-width: 1; }
                }
                .pulse-attention {
                    animation: attentionPulse 2s infinite ease-in-out;
                    transform-origin: center;
                    transform-box: fill-box;
                }
                @keyframes floatUpFade {
                    0% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-40px); opacity: 0; }
                }
                .float-up-fade {
                    animation: floatUpFade 1.5s forwards ease-out;
                }
            `}</style>
        </div >
    );
};
