
import React, { useState, useRef } from 'react';
import type { GameState, Meteorite, LegendaryHex, PlayerClass } from '../logic/types';

import { HexGrid } from './modules/HexGrid';

import { InventoryPanel, PerkFilter } from './modules/InventoryPanel';
import { ChassisDetail } from './modules/ChassisDetail';
import { ModuleDetailPanel } from './modules/ModuleDetailPanel';
import { getMeteoriteImage, getDustValue, RARITY_ORDER } from './modules/ModuleUtils';
import { isBuffActive, researchBlueprint } from '../logic/BlueprintLogic';
import { BlueprintBay } from './BlueprintBay';
import { Blueprint } from '../logic/types';
import { spawnFloatingNumber } from '../logic/ParticleLogic';
import { RemovalConfirmationModal } from './modules/RemovalConfirmationModal';
import { CorruptionWarningModal } from './modules/CorruptionWarningModal';
import { ARENA_DATA } from '../logic/MapLogic';
import { EXTRACTION_MESSAGES } from '../logic/ExtractionLogic';
import './modules/ModuleMenu.css';


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
    const [hoveredBlueprint, setHoveredBlueprint] = useState<Blueprint | null>(null);
    const [selectedClassDetail, setSelectedClassDetail] = useState<PlayerClass | null>(null);
    const [isRecycleMode, setIsRecycleMode] = useState(false);
    const [recyclingAnim, setRecyclingAnim] = useState(false); // Used for visual feedback on button
    const [dustIndicators, setDustIndicators] = useState<{ id: number, baseValue: number, bonusValue: number }[]>([]);

    // Persistent Filter State (Lifted from InventoryPanel)
    const [coreFilter, setCoreFilter] = useState({
        quality: 'All',
        rarity: 'All',
        arena: 'All'
    });

    const [perkFilters, setPerkFilters] = useState<Record<number, PerkFilter>>({
        1: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        2: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        3: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        4: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        5: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        6: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        7: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        8: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
        9: { active: false, val: 0, arena: 'All', matchQuality: 'All' },
    });

    // Removal Confirmation State
    const [removalCandidate, setRemovalCandidate] = useState<{ index: number, item: any, replaceWith?: { item: any, source: string, index: number } } | null>(null);
    const [corruptionCandidate, setCorruptionCandidate] = useState<{ index: number, item: any, source: string, sourceIndex: number } | null>(null);
    const [placementAlert, setPlacementAlert] = useState(false);
    const [archiveFullAlert, setArchiveFullAlert] = useState(false);
    const [, setRefresh] = useState(0);

    const hoverTimeout = useRef<number | null>(null);

    // Reset Recycle Mode when menu closes (because component might stay mounted but return null)
    React.useEffect(() => {
        if (!isOpen) {
            setIsRecycleMode(false);
            setRemovalCandidate(null);
            setSelectedClassDetail(null);
            setHoveredItem(null);
            setLockedItem(null);
            setLockedItem(null);
            setHoveredHex(null);
            setHoveredBlueprint(null);
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

    const getRemovalCost = (item: any) => {
        const baseCost = Math.floor(1 + (gameState.gameTime / 60)); // User Request: 1 + 1 per minute
        return item?.quality === 'Corrupted' ? baseCost * 3 : baseCost;
    };

    const handleAttemptRemove = (index: number, item: any, replaceWith?: { item: any, source: string, index: number }) => {
        setLockedItem(null); // Clear tooltip lock so popup is visible
        setRemovalCandidate({ index, item, replaceWith });
    };

    const confirmRemoval = () => {
        if (removalCandidate) {
            // Check if WE ARE ABOUT TO PLACE a corrupted item via replacement
            if (removalCandidate.replaceWith?.item?.quality === 'Corrupted') {
                setCorruptionCandidate({
                    index: removalCandidate.index,
                    item: removalCandidate.replaceWith.item,
                    source: removalCandidate.replaceWith.source,
                    sourceIndex: removalCandidate.replaceWith.index
                });
                // We don't clear the removalCandidate yet, OR we clear it and let corruption modal finish it.
                // Better approach: If they confirm removal, but the replacement is corrupted, 
                // we should have warned them about the corruption FIRST or SIMULTANEOUSLY.
                // Actually, the UX is: "You want to replace X with Y (Corrupted)".
                // Let's modify the RemovalConfirmationModal later or just chain them.
                // For now, let's assume they confirmed the removal (paid the dust), 
                // then if the new item is corrupted, we warn them BEFORE finalizing the swap into the socket.
            }

            const removalCost = getRemovalCost(removalCandidate.item);
            if (spendDust(removalCost)) {
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
                    if (replaceWith.item.quality === 'Corrupted') {
                        // Delay final placement for corruption confirmation
                        setCorruptionCandidate({
                            index,
                            item: replaceWith.item,
                            source: replaceWith.source,
                            sourceIndex: replaceWith.index // This index might be invalid if it was inventory and we already set it to null...
                            // Actually, in confirmRemoval step 1, we set it to null.
                        });
                    } else {
                        onSocketUpdate('diamond', index, replaceWith.item);
                    }
                } else {
                    onSocketUpdate('diamond', index, null);
                }

                setRemovalCandidate(null);
            }
        }
    };

    const confirmCorruptionPlacement = () => {
        if (corruptionCandidate) {
            const { index, item, source, sourceIndex } = corruptionCandidate;
            // Finalize placement
            onSocketUpdate('diamond', index, item);
            if (source === 'inventory') {
                onInventoryUpdate(sourceIndex, null);
            } else if (source === 'diamond') {
                onSocketUpdate('diamond', sourceIndex, null);
            }
            setCorruptionCandidate(null);
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
            let dustAmount = getDustValue(item.rarity);
            let isBonus = false;

            // Blueprint: Quantum Scrapper
            let bonusAmount = 0;
            if (isBuffActive(gameState, 'QUANTUM_SCRAPPER')) {
                const charges = gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] || 0;
                if (charges > 0) {
                    // Consume charge
                    const newCharges = charges - 1;
                    gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] = newCharges;

                    // If charges hit 0, immediately mark blueprint as broken
                    if (newCharges <= 0) {
                        const bp = gameState.blueprints.find(b => b && b.type === 'QUANTUM_SCRAPPER');
                        if (bp && bp.status === 'active') {
                            bp.status = 'broken';
                        }
                        delete gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'];
                    }

                    if (Math.random() < 0.25) {
                        bonusAmount = dustAmount; // Double means adding the amount again
                    }
                }
            }

            onRecycle('inventory', idx, dustAmount + bonusAmount);

            // Spawn indicator
            const id = Date.now() + Math.random();
            setDustIndicators(prev => [...prev.slice(-8), { id, baseValue: Math.round(dustAmount), bonusValue: Math.round(bonusAmount) }]);
            setTimeout(() => setDustIndicators(prev => prev.filter(ind => ind.id !== id)), 1200);

            // Visual feedback for successful recycle
            setRecyclingAnim(true);
            setTimeout(() => setRecyclingAnim(false), 400);
        }
    };

    const handleResearch = (idx: number) => {
        if (researchBlueprint(gameState, idx)) {
            setRefresh(p => p + 1);
        } else {
            // Check if it failed due to full slots
            const emptySlot = gameState.blueprints.find(b => b === null);
            if (emptySlot === undefined) {
                // If no empty slot is found (all occupied), trigger full alert
                setArchiveFullAlert(true);
                setTimeout(() => setArchiveFullAlert(false), 2000);
            }
        }
    };

    const handleMassRecycle = (indices: number[]) => {
        if (indices.length === 0) return;

        let totalDust = 0;
        let bonusActive = isBuffActive(gameState, 'QUANTUM_SCRAPPER');
        let bonusTriggeredCount = 0; // Keeping track for logic but not needed for display anymore (using amounts)
        let totalBase = 0;
        let totalBonus = 0;

        indices.forEach(idx => {
            if (idx < 10) return; // Skip Safe Slots
            const item = gameState.inventory[idx];
            if (item) {
                let amount = getDustValue(item.rarity);
                let currentBonus = 0;

                if (bonusActive) {
                    const charges = gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] || 0;
                    if (charges > 0) {
                        const newCharges = charges - 1;
                        gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] = newCharges;

                        // If charges hit 0, immediately mark blueprint as broken
                        if (newCharges <= 0) {
                            const bp = gameState.blueprints.find(b => b && b.type === 'QUANTUM_SCRAPPER');
                            if (bp && bp.status === 'active') {
                                bp.status = 'broken';
                            }
                            delete gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'];
                            bonusActive = false;
                        }

                        if (Math.random() < 0.25) {
                            currentBonus = amount;
                            bonusTriggeredCount++;
                        }
                    } else {
                        bonusActive = false; // Charges depleted during bulk
                    }
                }

                totalBase += amount;
                totalBonus += currentBonus;
                totalDust += (amount + currentBonus);
            }
        });

        // Loop backwards to preserve indices? No, the onRecycle for inventory just sets it to null at that index.
        indices.forEach(idx => {
            onRecycle('inventory', idx, 0);
        });

        // Award dust
        gameState.player.dust += totalDust;

        // Spawn UI indicator for the recycled batch
        const id = Date.now() + Math.random();
        setDustIndicators(prev => [...prev.slice(-8), {
            id,
            baseValue: Math.round(totalBase),
            bonusValue: Math.round(totalBonus)
        }]);
        setTimeout(() => setDustIndicators(prev => prev.filter(ind => ind.id !== id)), 1500);

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

    const extractionFocusActive = gameState.extractionStatus !== 'none' && gameState.extractionStatus !== 'complete';

    return (
        <div
            onMouseMove={(e) => {
                if (!movedItem || ['requested', 'waiting'].includes(gameState.extractionStatus)) return;
                const rect = e.currentTarget.getBoundingClientRect();

                const scaleX = e.currentTarget.offsetWidth / rect.width;
                const scaleY = e.currentTarget.offsetHeight / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                setMousePos({ x, y });
            }}
            onMouseUp={() => {
                if (movedItem && !['requested', 'waiting'].includes(gameState.extractionStatus)) {
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
                userSelect: 'none'
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
                        onAttemptPlace={(index, item, source, sourceIndex) => {
                            setCorruptionCandidate({ index, item, source, sourceIndex });
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
                    pointerEvents: 'auto',
                    position: 'relative'
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
                        <ModuleDetailPanel
                            gameState={gameState}
                            placementAlert={placementAlert}
                            hoveredHex={hoveredHex}
                            movedItem={movedItem}
                            hoveredItem={hoveredItem}
                            lockedItem={lockedItem}
                            hoveredBlueprint={hoveredBlueprint}
                            onCancelHoverTimeout={() => {
                                if (hoverTimeout.current) {
                                    clearTimeout(hoverTimeout.current);
                                    hoverTimeout.current = null;
                                }
                            }}
                            onMouseLeaveItem={handleMouseLeaveItem}
                        />

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
                                    minHeight: '36px',
                                    position: 'relative' // Added for indicator positioning
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <img src="/assets/Icons/MeteoriteDust.png" alt="Dust" style={{
                                            width: '20px',
                                            height: '20px',
                                            filter: 'drop-shadow(0 0 5px #22d3ee)',
                                        }} />
                                        <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', fontWeight: 700 }}>DUST:</span>
                                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#fff', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)' }}>{Number(meteoriteDust.toFixed(1)).toLocaleString()}</span>

                                        {/* EVACUATION COST LABEL */}
                                        <div style={{ marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '5px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
                                            <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 900, letterSpacing: '1px' }}>EVACUATION PROTOCOL:</span>
                                            <span style={{ fontSize: '11px', fontWeight: '900', color: '#f87171' }}>4,000 DUST</span>
                                        </div>

                                        {/* DUST FLOW INDICATORS (Relocated) */}
                                        <div style={{ position: 'relative', marginLeft: '30px', width: 0, height: 0, overflow: 'visible' }}>
                                            {dustIndicators.map((ind, i) => (
                                                <div key={ind.id} className="float-up-fade" style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '-10px',
                                                    color: '#fff',
                                                    fontSize: '18px',
                                                    fontWeight: 900,
                                                    textShadow: '0 0 5px #000, 0 0 10px rgba(34, 211, 238, 0.8)',
                                                    whiteSpace: 'nowrap',
                                                    pointerEvents: 'none',
                                                    zIndex: 1000,
                                                    display: 'flex', alignItems: 'center', gap: '5px'
                                                }}>
                                                    <span>+{ind.baseValue}</span>
                                                    {ind.bonusValue > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '5px' }}>
                                                            <span style={{ color: '#fbbf24', textShadow: '0 0 10px #fbbf24' }}>+{ind.bonusValue}</span>
                                                            <span style={{ fontSize: '9px', background: '#fbbf24', color: '#000', padding: '1px 3px', borderRadius: '2px' }}>CRIT</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
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
                            onResearch={handleResearch}
                            recyclingAnim={recyclingAnim}
                            coreFilter={coreFilter}
                            setCoreFilter={setCoreFilter}
                            perkFilters={perkFilters}
                            setPerkFilters={setPerkFilters}
                        />

                        <BlueprintBay
                            gameState={gameState}
                            spendDust={spendDust}
                            onUpdate={() => setRefresh(prev => prev + 1)}
                            onHoverBlueprint={setHoveredBlueprint}
                        />
                    </div>

                    {/* EXTRACTION FOCUS DIMMER (Right: Inventory/Sorting Only) */}
                    {extractionFocusActive && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 'calc(100% - (40% + 50px))',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.75)',
                            zIndex: 2500,
                            pointerEvents: 'none'
                        }} />
                    )}
                </div>
            </div>

            {/* Ghost Item Rendering */}
            {
                movedItem && (
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
                )
            }

            {/* REMOVAL CONFIRMATION MODAL */}
            {
                removalCandidate && (
                    <RemovalConfirmationModal
                        candidate={removalCandidate}
                        dust={meteoriteDust}
                        cost={getRemovalCost(removalCandidate.item)}
                        onCancel={() => setRemovalCandidate(null)}
                        onConfirm={confirmRemoval}
                    />
                )
            }

            {
                selectedClassDetail && (
                    <ChassisDetail
                        gameState={gameState}
                        playerClass={selectedClassDetail}
                        onClose={() => setSelectedClassDetail(null)}
                    />
                )
            }

            {
                corruptionCandidate && (
                    <CorruptionWarningModal
                        onCancel={() => setCorruptionCandidate(null)}
                        onConfirm={confirmCorruptionPlacement}
                    />
                )
            }


            {/* EXTRACTION FOCUS DIMMER (Left: Matrix Only) */}
            {extractionFocusActive && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                    background: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 2500,
                    pointerEvents: 'none'
                }} />
            )}


        </div >
    );
};
