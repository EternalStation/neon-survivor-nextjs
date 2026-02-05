import React from 'react';
import type { Meteorite } from '../../logic/types';
import { getMeteoriteImage, RARITY_COLORS, RARITY_ORDER } from './ModuleUtils';

interface InventoryPanelProps {
    inventory: (Meteorite | null)[];
    movedItem: { item: any, source: string, index: number } | null;
    onInventoryUpdate: (index: number, item: any) => void;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex', index: number } | null) => void;
    handleMouseEnterItem: (item: any, x: number, y: number) => void;
    handleMouseLeaveItem: (delay?: number) => void;
    isRecycleMode: boolean;
    onRecycleClick: (index: number) => void;
    onMassRecycle: (indices: number[]) => void;
    onSort: () => void;
    onToggleRecycle: () => void;
    recyclingAnim?: boolean;
}

const PAIR_COMBOS = ['All', 'ECO-ECO', 'ECO-COM', 'ECO-DEF', 'COM-COM', 'COM-DEF', 'DEF-DEF'];
const QUALITIES = ['All', 'Pristine', 'Damaged', 'Broken'];
const ARENAS = ['All', 'ECO', 'COM', 'DEF'];

type PerkFilter = {
    active: boolean;
    val: number;
    arena: string;
    matchQuality: string;
};

export const InventoryPanel: React.FC<InventoryPanelProps> = React.memo(({
    inventory,
    movedItem,
    onInventoryUpdate,
    onSocketUpdate,
    setMovedItem,
    handleMouseEnterItem,
    handleMouseLeaveItem,
    isRecycleMode,
    onRecycleClick,
    onMassRecycle,
    onSort,
    onToggleRecycle,
    recyclingAnim
}) => {
    const [coreFilter, setCoreFilter] = React.useState({
        quality: 'All',
        rarity: 'All',
        arena: 'All'
    });

    // Individual state for all 9 perk levels
    const [perkFilters, setPerkFilters] = React.useState<Record<number, PerkFilter>>({
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

    const matchesFilter = (item: Meteorite | null): boolean => {
        if (!item) return true;

        // Core Checks
        // Map UI 'Pristine' to Internal 'New'
        const targetQuality = coreFilter.quality === 'Pristine' ? 'New' : coreFilter.quality;
        if (coreFilter.quality !== 'All' && item.quality !== targetQuality) return false;

        if (coreFilter.rarity !== 'All' && item.rarity !== coreFilter.rarity) return false;
        if (coreFilter.arena !== 'All' && !item.discoveredIn.toUpperCase().includes(coreFilter.arena.toUpperCase())) return false;

        // Perk Checks (Cumulative/AND logic)
        for (let lvl = 1; lvl <= 9; lvl++) {
            const f = perkFilters[lvl];
            if (!f.active) continue;

            const perks = item.perks;
            let levelMatch = false;

            const checkValue = (v: number) => v >= f.val;

            switch (lvl) {
                case 1: {
                    const p = perks.find((x: any) => x.id === 'base_efficiency');
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 2: {
                    const p = perks.find((x: any) => x.id === 'neighbor_any_all');
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 3: {
                    const a = f.arena.toLowerCase();
                    const target = a === 'all' ? 'neighbor_any_' : `neighbor_any_${a}`;
                    const p = perks.find((x: any) => x.id.startsWith(target) && x.id.split('_').length === 3);
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 4: {
                    const a = f.arena.toLowerCase();
                    // Match Quality Mapping
                    let q = f.matchQuality.toLowerCase().slice(0, 3);
                    if (f.matchQuality === 'Pristine') q = 'new';

                    const p = perks.find((x: any) => {
                        const pts = x.id.split('_');
                        if (pts[0] !== 'neighbor') return false;
                        // Exclude 'any' which is reserved for L2/L3 (Proximity/Sector)
                        if (pts[1] === 'any') return false;
                        if (f.matchQuality !== 'All' && pts[1] !== q) return false;
                        if (f.arena !== 'All' && pts[2] !== a) return false;
                        return pts.length === 3;
                    });
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 5: {
                    const p = perks.find((x: any) => x.id === 'neighbor_leg_any');
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 6: {
                    const a = f.arena.toLowerCase();
                    const target = a === 'all' ? 'neighbor_leg_' : `neighbor_leg_${a}`;
                    const p = perks.find((x: any) => x.id.startsWith(target));
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 7:
                case 8: {
                    const a = f.arena.toLowerCase().replace('-', '_');
                    const p = perks.find((x: any) => {
                        if (!x.id.startsWith('pair_')) return false;
                        if (lvl === 8 && !x.id.endsWith('_lvl')) return false;
                        if (lvl === 7 && x.id.endsWith('_lvl')) return false;
                        return f.arena === 'All' || x.id.includes(`_${a}`);
                    });
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
                case 9: {
                    const p = perks.find((x: any) => x.id === 'matrix_same_type_rarity');
                    if (p) levelMatch = checkValue(p.value);
                    break;
                }
            }

            if (!levelMatch) return false;
        }

        return true;
    };

    const isFilterActive =
        coreFilter.quality !== 'All' ||
        coreFilter.rarity !== 'All' ||
        coreFilter.arena !== 'All' ||
        Object.values(perkFilters).some(f => f.active);

    const displayInventory = [...inventory, ...Array(Math.max(0, 300 - inventory.length)).fill(null)];

    const selectStyle: React.CSSProperties = {
        background: '#0f172a',
        border: '1px solid #3b82f6',
        color: '#fff',
        fontSize: '9px',
        fontWeight: 'bold',
        padding: '2px 4px',
        borderRadius: '4px',
        width: '100%',
        cursor: 'pointer',
        boxSizing: 'border-box',
        height: '20px'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '8px',
        color: '#94a3b8',
        fontWeight: 900,
        marginBottom: '2px',
        display: 'block',
        textTransform: 'uppercase'
    };

    const updatePerk = (lvl: number, updates: Partial<PerkFilter>) => {
        setPerkFilters(prev => ({
            ...prev,
            [lvl]: { ...prev[lvl], ...updates }
        }));
    };

    return (
        <div style={{
            flex: 1,
            height: '100%',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div className="inventory-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                gridAutoRows: 'min-content',
                columnGap: '6px',
                rowGap: '2px',
                width: '100%',
                height: '100%',
                paddingRight: '20px',
                overflowY: 'auto',
                boxSizing: 'border-box'
            }}>
                {/* ADVANCED MASS SCANNER AREA */}
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        gridColumn: 'span 10',
                        background: 'rgba(5, 10, 20, 0.98)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '8px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginBottom: '5px', // Reduced from 10px
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
                    }}>
                    {/* TOP ROW: CORE + SORT/RESET + RECYCLE */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '8px', marginBottom: '4px', alignItems: 'flex-end' }}>
                        {/* TYPE */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={labelStyle}>TYPE</span>
                            <select style={selectStyle} value={coreFilter.quality} onChange={e => setCoreFilter({ ...coreFilter, quality: e.target.value })}>
                                {QUALITIES.map(q => <option key={q} value={q}>{q.toUpperCase().slice(0, 3)}</option>)}
                            </select>
                        </div>
                        {/* RARITY */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={labelStyle}>RARITY</span>
                            <select style={selectStyle} value={coreFilter.rarity} onChange={e => setCoreFilter({ ...coreFilter, rarity: e.target.value })}>
                                <option value="All">ALL</option>
                                {RARITY_ORDER.map(r => <option key={r} value={r}>{r.toUpperCase().slice(0, 3)}</option>)}
                            </select>
                        </div>
                        {/* FOUND IN */}
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={labelStyle}>FOUND</span>
                            <select style={selectStyle} value={coreFilter.arena} onChange={e => setCoreFilter({ ...coreFilter, arena: e.target.value })}>
                                {ARENAS.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        {/* ACTION CONTROLS GROUP (RESET, SORT, RECYCLE) */}
                        <div style={{ gridColumn: 'span 6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* RESET BUTTON (Large Icon) */}
                            <button
                                onClick={() => {
                                    setCoreFilter({ quality: 'All', rarity: 'All', arena: 'All' });
                                    const resetPerks = { ...perkFilters };
                                    Object.keys(resetPerks).forEach((k: any) => {
                                        resetPerks[k] = { ...resetPerks[k], active: false, val: 0 };
                                    });
                                    setPerkFilters(resetPerks);
                                }}
                                style={{
                                    ...selectStyle,
                                    background: isFilterActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.05)',
                                    borderColor: isFilterActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(156, 163, 175, 0.2)',
                                    color: isFilterActive ? '#ef4444' : '#6b7280',
                                    height: '38px',
                                    width: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    cursor: isFilterActive ? 'pointer' : 'default',
                                    opacity: isFilterActive ? 1 : 0.6,
                                    flexShrink: 0
                                }}
                                title="Reset Filters"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>

                            {/* SORT BUTTON (Large Icon) */}
                            <button
                                onClick={onSort}
                                style={{
                                    ...selectStyle,
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    borderColor: '#3b82f6',
                                    color: '#fff',
                                    height: '38px',
                                    width: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                title="Sort by Rarity"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m11 5-3-3-3 3M8 22V2M13 19l3 3 3-3M16 2v20" />
                                </svg>
                            </button>

                            {/* RECYCLE CONTROLS GROUP */}
                            <div style={{ display: 'flex', alignItems: 'stretch', gap: '4px', flex: 1 }}>
                                {/* RECYCLE TOGGLE ICON (Large) */}
                                <button
                                    onClick={onToggleRecycle}
                                    style={{
                                        ...selectStyle,
                                        background: isRecycleMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                        borderColor: isRecycleMode ? '#ef4444' : '#3b82f6',
                                        color: isRecycleMode ? '#ef4444' : '#3b82f6',
                                        height: '38px', // Double height
                                        width: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                        cursor: 'pointer',
                                        boxShadow: isRecycleMode ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
                                        transition: 'all 0.2s',
                                        transform: recyclingAnim ? 'scale(0.8) rotate(-10deg)' : 'scale(1)',
                                        flexShrink: 0
                                    }}
                                    title="Toggle Recycle Mode"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 5v6m4-5v6" />
                                    </svg>
                                </button>

                                {/* STACKED BUTTONS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                    <button
                                        onClick={() => {
                                            if (!isRecycleMode) return;
                                            const targets: number[] = [];
                                            inventory.forEach((item, i) => {
                                                if (item && matchesFilter(item)) targets.push(i);
                                            });
                                            if (targets.length > 0) onMassRecycle(targets);
                                        }}
                                        disabled={!isRecycleMode}
                                        style={{
                                            ...selectStyle,
                                            background: isRecycleMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                                            borderColor: isRecycleMode ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)',
                                            color: isRecycleMode ? '#fff' : '#475569',
                                            height: '18px',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            cursor: isRecycleMode ? 'pointer' : 'default',
                                            opacity: isRecycleMode ? 1 : 0.4,
                                            transition: 'all 0.2s',
                                            padding: '0 4px'
                                        }}
                                    >
                                        SELECTED
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!isRecycleMode) return;
                                            const discards: number[] = [];
                                            inventory.forEach((item, i) => {
                                                if (item && !matchesFilter(item)) discards.push(i);
                                            });
                                            if (discards.length > 0) onMassRecycle(discards);
                                        }}
                                        disabled={!isRecycleMode}
                                        style={{
                                            ...selectStyle,
                                            background: isRecycleMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                                            borderColor: isRecycleMode ? '#ef4444' : 'rgba(148, 163, 184, 0.1)',
                                            color: isRecycleMode ? '#fff' : '#475569',
                                            height: '18px',
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            cursor: isRecycleMode ? 'pointer' : 'default',
                                            opacity: isRecycleMode ? 1 : 0.4,
                                            transition: 'all 0.2s',
                                            padding: '0 4px'
                                        }}
                                    >
                                        GHOSTS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MASS PERK GRID (3x3) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => {
                            const PERK_NAMES: Record<number, string> = {
                                1: 'METEORITIC PARTICLE',
                                2: 'PROXIMITY RELAY',
                                3: 'SECTOR AMPLIFIER',
                                4: 'CONDITION LINK',
                                5: 'LEGENDARY LIAISON',
                                6: 'ALPHA CONTROLLER',
                                7: 'SYNERGY PAIR',
                                8: 'HARMONY PAIR',
                                9: 'SINGULARITY CORE'
                            };
                            return (
                                <div key={lvl} style={{
                                    background: perkFilters[lvl].active ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${perkFilters[lvl].active ? '#3b82f6' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '4px',
                                    padding: '6px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    transition: 'all 0.2s',
                                    boxShadow: perkFilters[lvl].active ? 'inset 0 0 10px rgba(59, 130, 246, 0.2)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <span style={{ fontSize: '7.5px', fontWeight: 900, color: perkFilters[lvl].active ? '#fff' : '#475569', letterSpacing: '0.5px' }}>{PERK_NAMES[lvl]}</span>
                                        <input
                                            type="checkbox"
                                            checked={perkFilters[lvl].active}
                                            onChange={e => updatePerk(lvl, { active: e.target.checked })}
                                            style={{ cursor: 'pointer', width: '12px', height: '12px' }}
                                        />
                                    </div>

                                    {perkFilters[lvl].active && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s' }}>
                                            {/* Value Row (Universal for L1-L9) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 900 }}>THRESHOLD</span>
                                                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6' }}>
                                                        {perkFilters[lvl].val}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="35"
                                                    step="1"
                                                    className="scanner-range"
                                                    style={{ width: '100%', cursor: 'pointer', height: '4px', margin: '4px 0' }}
                                                    value={perkFilters[lvl].val}
                                                    onChange={e => updatePerk(lvl, { val: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>

                                            {/* Contextual Rows */}
                                            {(lvl === 3 || lvl === 4 || lvl === 6) && (
                                                <select style={{ ...selectStyle, height: '18px', fontSize: '8px' }} value={perkFilters[lvl].arena} onChange={e => updatePerk(lvl, { arena: e.target.value })}>
                                                    {ARENAS.map(a => <option key={a} value={a}>{a} ARENA</option>)}
                                                </select>
                                            )}
                                            {(lvl === 7 || lvl === 8) && (
                                                <select style={{ ...selectStyle, height: '18px', fontSize: '8px' }} value={perkFilters[lvl].arena} onChange={e => updatePerk(lvl, { arena: e.target.value })}>
                                                    {PAIR_COMBOS.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            )}
                                            {lvl === 4 && (
                                                <select style={{ ...selectStyle, height: '18px', fontSize: '8px' }} value={perkFilters[lvl].matchQuality} onChange={e => updatePerk(lvl, { matchQuality: e.target.value })}>
                                                    {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div >

                {/* INVENTORY ITEMS */}
                {
                    (() => {
                        const isAnyFilterActive =
                            coreFilter.quality !== 'All' ||
                            coreFilter.rarity !== 'All' ||
                            coreFilter.arena !== 'All' ||
                            Object.values(perkFilters).some(f => f.active);

                        return displayInventory.map((item, idx) => {
                            const matches = matchesFilter(item);
                            // User Request: If filtering is active, and the NEW item doesn't match, 
                            // it should lose the NEW status and become ghosted.
                            if (isAnyFilterActive && item && item.isNew && !matches) {
                                item.isNew = false;
                                // Optionally sync to parent, but next matrix open will show it as seen regardless
                            }

                            const isVisible = matches || (!isAnyFilterActive && (item?.isNew ?? false));
                            return (
                                <div key={idx}
                                    onClick={() => {
                                        if (isRecycleMode && item) {
                                            onRecycleClick(idx);
                                        }
                                    }}
                                    onMouseMove={(e) => {
                                        if (item && !movedItem) {
                                            handleMouseEnterItem(item, e.clientX, e.clientY);
                                            if (item.isNew) {
                                                item.isNew = false;
                                                onInventoryUpdate(idx, item);
                                            }
                                        }
                                    }}
                                    onMouseLeave={() => handleMouseLeaveItem(0)}
                                    onMouseDown={(e) => {
                                        if (isRecycleMode) return;
                                        if (e.button === 0 && item && !movedItem) {
                                            setMovedItem({ item, source: 'inventory', index: idx });
                                            handleMouseLeaveItem(0);
                                        }
                                    }}
                                    onMouseUp={(e) => {
                                        if (isRecycleMode) return;
                                        e.stopPropagation();
                                        if (movedItem) {
                                            if (movedItem.source === 'diamond') {
                                                const itemAtTarget = inventory[idx];
                                                onInventoryUpdate(idx, { ...movedItem.item });
                                                onSocketUpdate('diamond', movedItem.index, itemAtTarget);
                                            } else if (movedItem.source === 'inventory') {
                                                const itemAtTarget = inventory[idx];
                                                onInventoryUpdate(idx, { ...movedItem.item });
                                                onInventoryUpdate(movedItem.index, itemAtTarget);
                                            }
                                            setMovedItem(null);
                                        }
                                    }}
                                    style={{
                                        width: '100%', height: 'auto',
                                        aspectRatio: '1/1',
                                        background: '#0f172a',
                                        border: isRecycleMode && item
                                            ? `2px dashed #ef4444`
                                            : `2px solid ${movedItem?.index === idx && movedItem.source === 'inventory' ? '#3b82f6' : (item && isVisible ? (RARITY_COLORS as any)[item.rarity] : '#1e293b')}`,
                                        borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative',
                                        cursor: isRecycleMode ? (item ? 'crosshair' : 'default') : 'pointer',
                                        opacity: movedItem?.index === idx && movedItem.source === 'inventory' ? 0.3 : 1,
                                        pointerEvents: (isVisible || !item || item?.isNew) ? 'auto' : 'none',
                                        animation: isRecycleMode && item ? 'shake 0.5s infinite' : 'none',
                                        transition: 'all 0.2s',
                                    }}>
                                    {isRecycleMode && item && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.2)', zIndex: 5, pointerEvents: 'none' }} />
                                    )}
                                    {item?.isNew && (
                                        <div style={{
                                            position: 'absolute', top: '-5px', right: '-5px',
                                            background: '#ef4444', color: 'white', fontSize: '8px', fontWeight: 900,
                                            padding: '2px 4px', borderRadius: '4px', boxShadow: '0 0 10px #ef4444', zIndex: 10,
                                            animation: 'pulse-red 1s infinite',
                                            filter: isVisible ? 'none' : 'grayscale(100%)',
                                            opacity: isVisible ? 1 : 0.5
                                        }}>
                                            NEW
                                        </div>
                                    )}
                                    {item && (
                                        <img
                                            src={getMeteoriteImage(item)}
                                            style={{
                                                width: '80%', height: '80%', objectFit: 'contain', pointerEvents: 'none',
                                                filter: isVisible ? 'none' : 'grayscale(100%)',
                                                opacity: isVisible ? 1 : 0.2
                                            }}
                                            alt="meteorite"
                                        />
                                    )}
                                </div>
                            );
                        });
                    })()
                }
            </div >
            <style>{`
                .inventory-grid::-webkit-scrollbar { width: 6px; }
                .inventory-grid::-webkit-scrollbar-track { background: #0f172a; }
                .inventory-grid::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 3px; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
                @keyframes pulse-red {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .scanner-range {
                    -webkit-appearance: none;
                    background: rgba(59, 130, 246, 0.2);
                    border-radius: 2px;
                    outline: none;
                }
                .scanner-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 10px;
                    height: 10px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                    border: 2px solid #fff;
                }
                .scanner-range::-moz-range-thumb {
                    width: 10px;
                    height: 10px;
                    background: #3b82f6;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                    border: 2px solid #fff;
                }
            `}</style>
        </div >
    );
});
