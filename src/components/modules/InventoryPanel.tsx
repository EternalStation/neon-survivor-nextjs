import React, { useState } from 'react';
import type { Meteorite } from '../../logic/core/types';
import { RARITY_ORDER } from '../../logic/core/types';
import { getMeteoriteImage, RARITY_COLORS, PerkFilter, matchesFilter } from './ModuleUtils';
import { MassRecycleConfirmationModal } from './MassRecycleConfirmationModal';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface InventoryPanelProps {
    inventory: (Meteorite | null)[];
    gameTime: number;
    movedItem: { item: any, source: string, index: number } | null;
    onInventoryUpdate: (index: number, item: any) => void;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    onAttemptRemove?: (index: number, item: any, replaceWith?: any, dropTarget?: { type: 'inventory' | 'recalibrate', index?: number }) => void;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null) => void;
    handleMouseEnterItem: (item: any, x: number, y: number) => void;
    handleMouseLeaveItem: (delay?: number) => void;
    isRecycleMode: boolean;
    onRecycleClick: (index: number) => void;
    onMassRecycle: (indices: number[]) => void;
    onSort: () => void;
    onToggleRecycle: () => void;
    onResearch?: (index: number) => void;
    /** Called when a ready blueprint is right-clicked — deploys it immediately */
    onBlueprintActivate?: (index: number) => void;
    /** Called when a blueprint slot is left-clicked — opens the deploy/recycle modal */
    onBlueprintClick?: (bp: any) => void;
    recyclingAnim?: boolean;
    coreFilter: { quality: string | string[], rarity: string | string[], arena: string | string[] };
    setCoreFilter: React.Dispatch<React.SetStateAction<{ quality: string | string[], rarity: string | string[], arena: string | string[] }>>;
    perkFilters: Record<number, PerkFilter>;
    setPerkFilters: React.Dispatch<React.SetStateAction<Record<number, PerkFilter>>>;
    setLockedItem: (item: { item: any, x: number, y: number, index?: number } | null) => void;
    refreshKey?: number;

}

const PAIR_COMBOS = ['All', 'Exis-Exis', 'Exis-Apex', 'Exis-Bastion', 'Apex-Apex', 'Apex-Bastion', 'Bastion-Bastion'];
const QUALITIES = ['All', 'NEW', 'DAM', 'BRO', 'COR', 'BLUEPRINTS'];
const ARENAS = ['All', 'Economic Arena', 'Combat Arena', 'Defence Arena'];


export const InventoryPanel: React.FC<InventoryPanelProps> = React.memo(({
    inventory,
    gameTime,
    movedItem,
    onInventoryUpdate,
    onSocketUpdate,
    onAttemptRemove,
    setMovedItem,
    handleMouseEnterItem,
    handleMouseLeaveItem,
    isRecycleMode,
    onRecycleClick,
    onMassRecycle,
    onSort,
    onToggleRecycle,
    onResearch,
    onBlueprintActivate,
    onBlueprintClick,
    recyclingAnim,
    coreFilter,
    setCoreFilter,
    perkFilters,
    setPerkFilters,
    setLockedItem,

}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);

    // Localized filter option arrays (values stay English for logic matching)
    const PAIR_COMBOS = ['All', 'Exis-Exis', 'Exis-Apex', 'Exis-Bastion', 'Apex-Apex', 'Apex-Bastion', 'Bastion-Bastion'];
    const QUALITIES = ['All', 'NEW', 'DAM', 'BRO', 'COR', 'BLUEPRINTS'];
    const ARENAS = ['All', 'Economic Arena', 'Combat Arena', 'Defence Arena'];
    const SECTOR_OPTS = ['All', 'Sector 01', 'Sector 02', 'Sector 03'];
    const LEGENDARY_OPTS = ['All', 'Exis ◈', 'Apex ◆', 'Bastion ⬡'];

    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [activePerkDropdown, setActivePerkDropdown] = useState<string | null>(null);
    const [massRecycleCandidate, setMassRecycleCandidate] = useState<{ type: 'SELECTED' | 'GHOSTS', indices: number[] } | null>(null);
    const [tick, setTick] = useState(0);
    const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);

    // Color for each perk option chip
    const getPerkOptColor = (opt: string): string => {
        const u = opt.toUpperCase();
        if (u.includes('SECTOR 01') || u.includes('SECTOR-01')) return '#e9d5ff';
        if (u.includes('SECTOR 02') || u.includes('SECTOR-02')) return '#c084fc';
        if (u.includes('SECTOR 03') || u.includes('SECTOR-03')) return '#a855f7';
        if (u.includes('ECONOMIC')) return '#eab308';
        if (u.includes('COMBAT')) return '#ef4444';
        if (u.includes('DEFENCE')) return '#3b82f6';
        if (u === 'NEW') return '#ffffff';   // White
        if (u === 'DAM') return '#cbd5e1';   // Light grey
        if (u === 'BRO') return '#94a3b8';   // Medium grey
        if (u === 'COR') return '#dc2626';
        if (u.includes('EXIS') || u.includes('\u25C8') || u.includes('ECO')) return '#d946ef';
        if (u.includes('APEX') || u.includes('\u25C6') || u.includes('COM')) return '#fb923c';
        if (u.includes('BASTION') || u.includes('\u2B21') || u.includes('DEF')) return '#22d3ee';
        if (u === 'ALL') return 'rgba(255,255,255,0.45)';
        return '#64748b';
    };

    // Human-readable label for each option
    const translatePerkOpt = (opt: string): string => {
        if (opt === 'Sector 01') return t.matrix.sector01;
        if (opt === 'Sector 02') return t.matrix.sector02;
        if (opt === 'Sector 03') return t.matrix.sector03;
        if (opt === 'BRO') return t.meteorites.stats.broken;
        if (opt === 'DAM') return t.meteorites.stats.damaged;
        if (opt === 'NEW') return t.meteorites.stats.new;
        if (opt === 'COR') return t.meteorites.stats.corrupted || 'CORRUPTED';
        if (opt === 'All') return t.matrix.all;
        if (opt === 'Economic Arena') return t.matrix.ecoArena || 'ECO ARENA';
        if (opt === 'Combat Arena') return t.matrix.comArena || 'COM ARENA';
        if (opt === 'Defence Arena') return t.matrix.defArena || 'DEF ARENA';
        if (opt === 'Eco Legendary Hex') return t.matrix.ecoLeg || opt;
        if (opt === 'Com Legendary Hex') return t.matrix.comLeg || opt;
        if (opt === 'Def Legendary Hex') return t.matrix.defLeg || opt;
        if (opt === 'Exis-Exis') return t.matrix.comboEcoEco || opt;
        if (opt === 'Exis-Apex') return t.matrix.comboEcoCom || opt;
        if (opt === 'Exis-Bastion') return t.matrix.comboEcoDef || opt;
        if (opt === 'Apex-Apex') return t.matrix.comboComCom || opt;
        if (opt === 'Apex-Bastion') return t.matrix.comboComDef || opt;
        if (opt === 'Bastion-Bastion') return t.matrix.comboDefDef || opt;
        return opt;
    };

    // Custom styled perk option dropdown
    const renderPerkDropdown = (
        id: string,
        value: string,
        opts: string[],
        onChange: (v: string) => void,
        rarityColor: string,
        dropUp: boolean = false
    ) => {
        const isOpen = activePerkDropdown === id;
        const color = getPerkOptColor(value);
        return (
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                {/* Trigger */}
                <div
                    onClick={e => { e.stopPropagation(); setActivePerkDropdown(isOpen ? null : id); }}
                    style={{
                        height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0 5px',
                        background: `${color}18`,
                        border: `1px solid ${color}88`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        gap: '4px'
                    }}
                >
                    <span style={{ fontSize: '7px', fontWeight: 900, color, letterSpacing: '0.3px', textTransform: 'uppercase', textShadow: `0 0 6px ${color}66`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {translatePerkOpt(value)}
                    </span>
                    <span style={{ fontSize: '6px', color, opacity: 0.7, flexShrink: 0 }}>{dropUp ? '▲' : '▼'}</span>
                </div>

                {/* Dropdown */}
                {isOpen && (
                    <>
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 3999 }}
                            onClick={() => setActivePerkDropdown(null)}
                        />
                        <div
                            onClick={e => e.stopPropagation()}
                            style={{
                                position: 'absolute',
                                ...(dropUp ? { bottom: '100%', top: 'auto', marginBottom: '2px' } : { top: '100%', marginTop: '2px' }),
                                left: 0, width: '130px',
                                background: '#080e1a',
                                border: `1px solid ${rarityColor}55`,
                                borderRadius: '4px',
                                zIndex: 4000,
                                boxShadow: `0 8px 24px rgba(0,0,0,0.8), 0 0 12px ${rarityColor}22`,
                                padding: '3px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px'
                            }}
                        >
                            {opts.map(opt => {
                                const c = getPerkOptColor(opt);
                                const isSelected = opt === value;
                                return (
                                    <div
                                        key={opt}
                                        onClick={() => { onChange(opt); setActivePerkDropdown(null); }}
                                        style={{
                                            padding: '4px 7px',
                                            background: isSelected ? `${c}22` : 'transparent',
                                            border: `1px solid ${isSelected ? c : 'transparent'}`,
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${c}18`; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? `${c}22` : 'transparent'; }}
                                    >
                                        <div style={{
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: c,
                                            boxShadow: `0 0 4px ${c}`,
                                            flexShrink: 0
                                        }} />
                                        <span style={{
                                            fontSize: '7px', fontWeight: 900, color: c,
                                            letterSpacing: '0.3px', textTransform: 'uppercase',
                                            textShadow: isSelected ? `0 0 6px ${c}88` : 'none'
                                        }}>
                                            {translatePerkOpt(opt)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        );
    };

    React.useEffect(() => {
        const hasResearch = inventory.some(item => item?.isBlueprint && item.status === 'researching');
        if (hasResearch) {
            const interval = setInterval(() => {
                setTick(t => t + 1);
            }, 1000); // Update every second for the timer
            return () => clearInterval(interval);
        }
    }, [inventory]);

    const toggleFilterValue = (key: 'quality' | 'rarity' | 'arena', value: string) => {
        const current = coreFilter[key] || ['All'];
        let newValues: string[] = Array.isArray(current) ? [...current] : [current as string];

        if (value === 'All') {
            newValues = ['All'];
        } else {
            if (newValues.includes('All')) newValues = [];

            if (newValues.includes(value)) {
                newValues = newValues.filter(v => v !== value);
                if (newValues.length === 0) newValues = ['All'];
            } else {
                newValues.push(value);
            }
        }
        setCoreFilter(prev => ({ ...prev, [key]: newValues }));
    };

    const matchesFilterLocal = (item: Meteorite | null): boolean => {
        return matchesFilter(item, coreFilter, perkFilters);
    };

    const renderSlot = (item: Meteorite | null, idx: number, isAnyFilterActive: boolean) => {
        const matches = matchesFilterLocal(item);
        if (isAnyFilterActive && item && item.isNew && !matches) {
            item.isNew = false;
        }
        const isVisible = matches || (!isAnyFilterActive && (item?.isNew ?? false));

        return (
            <div key={idx}
                onClick={() => {
                    if (isRecycleMode && item) {
                        onRecycleClick(idx);
                    }
                }}
                onMouseEnter={(e) => {
                    if (item && !movedItem) {
                        handleMouseEnterItem(item, e.clientX, e.clientY);
                        if (item.isBlueprint) setHoveredSlotIdx(idx);
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
                onMouseLeave={() => {
                    handleMouseLeaveItem(0);
                    setHoveredSlotIdx(null);
                }}
                onMouseDown={(e) => {
                    if (isRecycleMode) return;
                    if (e.button === 0 && item && !movedItem) {
                        setLockedItem({ item, x: e.clientX, y: e.clientY, index: idx }); // LOCK ON CLICK
                        e.preventDefault();
                        setMovedItem({ item, source: 'inventory', index: idx });
                    }
                }}
                onContextMenu={(e) => {
                    e.preventDefault();
                    if (!item || !item.isBlueprint) return;
                    if (item.status === 'ready') {
                        // Right-click on ready blueprint → deploy directly
                        onBlueprintActivate?.(idx);
                    } else if (item.status === 'locked') {
                        // Right-click on locked blueprint → start research
                        onResearch?.(idx);
                    }
                }}
                onMouseUp={(e) => {
                    if (isRecycleMode) return;
                    e.stopPropagation();
                    if (movedItem) {
                        if (movedItem.source === 'diamond') {
                            if (onAttemptRemove) {
                                onAttemptRemove(movedItem.index, movedItem.item, undefined, { type: 'inventory', index: idx });
                            } else {
                                const itemAtTarget = inventory[idx];
                                onInventoryUpdate(idx, { ...movedItem.item });
                                onSocketUpdate('diamond', movedItem.index, itemAtTarget);
                            }
                        } else if (movedItem.source === 'inventory') {
                            const itemAtTarget = inventory[idx];
                            onInventoryUpdate(idx, { ...movedItem.item });
                            onInventoryUpdate(movedItem.index, itemAtTarget);
                        } else if (movedItem.source === 'recalibrate' || movedItem.source === 'incubator') {
                            // DROP FROM LAB MODULES INTO INVENTORY
                            const itemAtTarget = inventory[idx];
                            if (itemAtTarget) {
                                // Find first empty slot instead of overwriting
                                let emptyIdx = -1;
                                for (let i = 9; i < inventory.length; i++) if (!inventory[i]) { emptyIdx = i; break; }
                                if (emptyIdx === -1) for (let i = 0; i < 9; i++) if (!inventory[i]) { emptyIdx = i; break; }

                                if (emptyIdx !== -1) {
                                    onInventoryUpdate(emptyIdx, { ...movedItem.item });
                                }
                            } else {
                                onInventoryUpdate(idx, { ...movedItem.item });
                            }
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
                        : `1.5px solid ${movedItem?.index === idx && movedItem.source === 'inventory' ? '#3b82f6' : (item && isVisible ? (RARITY_COLORS as any)[item.rarity] : '#1e293b')} `,
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    cursor: isRecycleMode ? (item ? 'crosshair' : 'default') : 'pointer',
                    opacity: (movedItem?.index === idx && movedItem.source === 'inventory') || (isRecycleMode && idx < 9) ? 0.3 : 1, // Dim safe slots in recycle mode
                    pointerEvents: 'auto',
                    animation: isRecycleMode && item && idx >= 9 ? 'shake 0.5s infinite' : 'none',
                    transition: 'all 0.2s',
                    filter: isRecycleMode && idx < 9 ? 'grayscale(1)' : 'none' // Gray out safe slots in recycle mode
                }}>
                {isRecycleMode && item && idx >= 9 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.2)', zIndex: 5, pointerEvents: 'none' }} />
                )}
                {item?.isNew && (
                    <div style={{
                        position: 'absolute', top: '-2px', right: '-2px',
                        background: '#ef4444', color: 'white', fontSize: '7px', fontWeight: 900,
                        padding: '1px 3px', borderRadius: '3px', boxShadow: '0 0 10px #ef4444', zIndex: 10,
                        animation: 'pulse-red 1s infinite',
                        filter: isVisible ? 'none' : 'grayscale(100%)',
                        opacity: isVisible ? 1 : 0.5
                    }}>
                        {idx < 9 ? 'SAFE' : 'NEW'}
                    </div>
                )}
                {/* Status badge row — top-left, flex, order: C → I → H */}
                {(item?.isCorrupted || (item?.incubatorBoost && item.incubatorBoost > 0) || (item as any)?.blueprintBoosted) && (
                    <div style={{
                        position: 'absolute', top: '2px', left: '2px',
                        display: 'flex', flexDirection: 'row', gap: '2px',
                        zIndex: 5,
                        filter: isVisible ? 'none' : 'grayscale(100%)',
                        opacity: isVisible ? 1 : 0.5
                    }}>
                        {item?.isCorrupted && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e293b', border: '0.5px solid #991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 3px rgba(153,27,27,0.5)' }}>
                                <span style={{ fontSize: '5px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>C</span>
                            </div>
                        )}
                        {item?.incubatorBoost && item.incubatorBoost > 0 && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e293b', border: '0.5px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 3px rgba(14,165,233,0.4)' }}>
                                <span style={{ fontSize: '5px', fontWeight: 900, color: '#00d9ff', lineHeight: 1 }}>I</span>
                            </div>
                        )}
                        {(item as any)?.blueprintBoosted && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e293b', border: '0.5px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 3px rgba(96,165,250,0.4)' }}>
                                <span style={{ fontSize: '5px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>H</span>
                            </div>
                        )}
                    </div>
                )}
                {item && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <img
                            src={item.isBlueprint ? `/assets/Icons/Blueprint.png` : getMeteoriteImage(item as any)}
                            style={{
                                width: '80%', height: '80%', objectFit: 'contain', pointerEvents: 'none',
                                filter: item.isBlueprint && item.status === 'broken'
                                    ? 'grayscale(1) brightness(0.4) sepia(1) hue-rotate(-50deg)'
                                    : isVisible ? 'none' : 'grayscale(100%)',
                                opacity: item.isBlueprint && item.status === 'broken' ? 0.5 : isVisible ? 1 : 0.2
                            }}
                            alt="blueprint"
                        />
                        {/* Blueprint status label */}
                        {item.isBlueprint && (
                            <div style={{
                                position: 'absolute', inset: 0,
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                zIndex: 10,
                                pointerEvents: 'none'
                            }}>
                                {/* Normal status badge */}
                                <span style={{
                                    fontSize: '5px',
                                    color: item.status === 'researching' ? '#facc15'
                                        : item.status === 'ready' ? '#2dd4bf'
                                            : item.status === 'locked' ? '#ef4444'
                                                : item.status === 'active' ? '#60a5fa'
                                                    : '#64748b',
                                    fontWeight: 900,
                                    textShadow: '0 0 4px rgba(0,0,0,0.8)',
                                    textTransform: 'uppercase'
                                }}>
                                    {item.status === 'researching' ? t.matrix.bpDecrypting
                                        : item.status === 'ready' ? t.matrix.bpReady
                                            : item.status === 'locked' ? t.matrix.bpEncrypted
                                                : item.status === 'active' ? t.matrix.bpActive
                                                    : t.matrix.bpBroken}
                                </span>
                                {item.status === 'researching' && (item as any).researchFinishTime && (
                                    <span style={{
                                        fontSize: '7px', color: '#facc15', fontWeight: 900,
                                        fontFamily: 'monospace', textShadow: '0 0 5px #000'
                                    }}>
                                        {Math.ceil(Math.max(0, ((item as any).researchFinishTime - gameTime))).toFixed(0)}s
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const isFilterActive =
        (Array.isArray(coreFilter.quality) ? !coreFilter.quality.includes('All') : coreFilter.quality !== 'All') ||
        (Array.isArray(coreFilter.rarity) ? !coreFilter.rarity.includes('All') : coreFilter.rarity !== 'All') ||
        (Array.isArray(coreFilter.arena) ? !coreFilter.arena.includes('All') : coreFilter.arena !== 'All') ||
        Object.values(perkFilters).some(f => f.active);

    const displayInventory = [...inventory, ...Array(Math.max(0, 320 - inventory.length)).fill(null)];

    // ... [Styles preserved]
    const selectStyle: React.CSSProperties = {
        background: '#0f172a',
        border: '1px solid #3b82f6',
        color: '#fff',
        fontSize: '8px',
        fontWeight: 600,
        padding: '2px 4px',
        borderRadius: '4px',
        width: '100%',
        cursor: 'pointer',
        boxSizing: 'border-box',
        height: '20px',
        display: 'flex',
        alignItems: 'center'
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '8px',
        lineHeight: 1,
        color: '#94a3b8',
        fontWeight: 900,
        marginBottom: '2px',
        display: 'block',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    };

    const updatePerk = (lvl: number, updates: Partial<PerkFilter>) => {
        setPerkFilters(prev => ({
            ...prev,
            [lvl]: { ...prev[lvl], ...updates }
        }));
    };

    // Helper to render Multi-Select Dropdowns
    const renderMultiSelect = (
        key: 'quality' | 'rarity' | 'arena',
        options: string[],
        label: string,
        colors?: Record<string, string>,
        getLabel?: (opt: string) => string
    ) => {
        const selected = Array.isArray(coreFilter[key]) ? coreFilter[key] as string[] : [coreFilter[key] as string];
        const isAll = selected.includes('All');
        const count = isAll ? 'ALL' : `${selected.length}`;
        const isOpen = activeDropdown === key;

        return (
            <div style={{ position: 'relative', width: '100%' }}>
                <span style={labelStyle}>{label}</span>
                <div
                    onClick={() => setActiveDropdown(isOpen ? null : key)}
                    style={{ ...selectStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isAll ? '#fff' : '#3b82f6' }}
                >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '8px', lineHeight: 1 }}>
                        {isAll ? t.matrix.all : (selected.length === 1 ? (getLabel ? getLabel(selected[0]) : selected[0]) : `${count} ${t.matrix.sel}`)}
                    </span>
                    <span style={{ fontSize: '7px', opacity: 0.7, flexShrink: 0 }}>▼</span>
                </div>

                {isOpen && (
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'absolute', top: '100%', left: 0, width: '100%',
                            background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '4px',
                            zIndex: 2000, maxHeight: '400px', overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            marginTop: '2px'
                        }}>
                        <div
                            onClick={() => toggleFilterValue(key, 'All')}
                            style={{
                                padding: '5px 8px', fontSize: '8px', cursor: 'pointer',
                                background: isAll ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: '#fff', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', lineHeight: 1
                            }}
                        >
                            {t.matrix.all}
                        </div>
                        {options.map(opt => {
                            if (opt === 'All') return null;
                            const isSelected = selected.includes(opt);
                            const color = colors ? (colors[opt] || '#fff') : '#fff';
                            return (
                                <div key={opt}
                                    onClick={() => toggleFilterValue(key, opt)}
                                    style={{
                                        padding: '5px 8px', fontSize: '8px', cursor: 'pointer',
                                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                        color: color, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        lineHeight: 1
                                    }}
                                >
                                    <div style={{
                                        width: '6px', height: '6px',
                                        border: `1px solid ${color} `,
                                        background: isSelected ? color : 'transparent',
                                        borderRadius: '2px'
                                    }} />
                                    {getLabel ? getLabel(opt) : opt}
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* Backdrop to close */}
                {isOpen && (
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1999 }}
                        onClick={() => setActiveDropdown(null)}
                    />
                )}
            </div>
        );
    };

    return (
        <div style={{
            flex: 1,
            height: '100%',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden' // Main container doesn't scroll
        }}>
            {/* FIXED HEADER: Scanner + Safe Slots */}
            <div style={{
                background: 'rgba(5, 10, 20, 0.98)',
                zIndex: 100,
                borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
                padding: '10px 2px 0 1px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                flexShrink: 0 // Prevents header from shrinking
            }}>
                {/* ADVANCED MASS SCANNER AREA */}
                <div
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseMove={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                    {/* TOP ROW: FILTER DROPDOWNS */}
                    <div className="filter-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '6px', marginBottom: '2px', alignItems: 'flex-end', position: 'relative', zIndex: 200 }}>
                        {/* TYPE */}
                        <div style={{ gridColumn: 'span 2' }}>
                            {renderMultiSelect('quality', QUALITIES, t.matrix.filterType, {
                                'NEW': '#ffffff', 'DAM': '#cbd5e1', 'BRO': '#94a3b8', 'COR': '#dc2626', 'BLUEPRINTS': '#60a5fa'
                            }, (opt) => (t.matrix as any).qualityLabels?.[opt] || opt)}
                        </div>
                        {/* RARITY — not applicable to blueprints */}
                        {(() => {
                            const qArr = Array.isArray(coreFilter.quality) ? coreFilter.quality : [coreFilter.quality];
                            const onlyBP = qArr.length > 0 && !qArr.includes('All') && qArr.every(q => q === 'BLUEPRINTS');
                            return (
                                <div style={{ gridColumn: 'span 2', opacity: onlyBP ? 0.3 : 1, pointerEvents: onlyBP ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                                    {renderMultiSelect('rarity', RARITY_ORDER, t.matrix.filterRarity, RARITY_COLORS as any, (r) => (t.upgradeRarities as any)[r] || r)}
                                </div>
                            );
                        })()}
                        {/* FOUND IN — not applicable to blueprints */}
                        {(() => {
                            const qArr = Array.isArray(coreFilter.quality) ? coreFilter.quality : [coreFilter.quality];
                            const onlyBP = qArr.length > 0 && !qArr.includes('All') && qArr.every(q => q === 'BLUEPRINTS');
                            return (
                                <div style={{ gridColumn: 'span 2', opacity: onlyBP ? 0.3 : 1, pointerEvents: onlyBP ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                                    {renderMultiSelect('arena', ARENAS, t.matrix.filterFoundIn, {
                                        'Economic Arena': '#eab308', 'Combat Arena': '#ef4444', 'Defence Arena': '#3b82f6'
                                    }, (opt) => (t.matrix as any).arenaLabels?.[opt] || opt)}
                                </div>
                            );
                        })()}
                        {/* ACTION CONTROLS GROUP (RESET, SORT) */}
                        <div style={{
                            gridColumn: 'span 2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '3px'
                        }}>
                            {/* RESET BUTTON */}
                            <button
                                onClick={() => {
                                    setCoreFilter({ quality: ['All'], rarity: ['All'], arena: ['All'] });
                                    const resetPerks = { ...perkFilters };
                                    Object.keys(resetPerks).forEach((k: any) => {
                                        resetPerks[k] = { active: false, val: 0, thing1: 'All', thing2: 'All' };
                                    });
                                    setPerkFilters(resetPerks);
                                }}
                                style={{
                                    ...selectStyle,
                                    background: isFilterActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(156, 163, 175, 0.05)',
                                    borderColor: isFilterActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(156, 163, 175, 0.2)',
                                    color: isFilterActive ? '#ef4444' : '#6b7280',
                                    height: '22px',
                                    width: '46px',
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
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                    <path d="M3 3v5h5" />
                                </svg>
                            </button>

                            {/* SORT BUTTON */}
                            <button
                                onClick={onSort}
                                style={{
                                    ...selectStyle,
                                    background: 'rgba(59, 130, 246, 0.15)',
                                    borderColor: '#3b82f6',
                                    color: '#fff',
                                    height: '22px',
                                    width: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                title="Sort by Rarity"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m11 5-3-3-3 3M8 22V2M13 19l3 3 3-3M16 2v20" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* MASS PERK GRID (2x3) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px'
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(lvl => {
                            const rarityKey = RARITY_ORDER[lvl - 1];
                            const rarityColor = RARITY_COLORS[rarityKey];

                            const isActive = perkFilters[lvl].active;

                            const config = {
                                1: { t1Label: t.matrix.filterSector, t1Opts: SECTOR_OPTS, t2Label: language === 'ru' ? 'КУЗНИЦА' : 'FORGE', t2Opts: LEGENDARY_OPTS },
                                2: { t1Label: t.matrix.filterSector, t1Opts: SECTOR_OPTS, t2Label: t.matrix.filterNeighbor, t2Opts: QUALITIES.slice(0, 4) },
                                3: { t1Label: t.matrix.filterNeighbor, t1Opts: QUALITIES.slice(0, 4), t2Label: t.matrix.filterArena, t2Opts: ARENAS },
                                4: { t1Label: language === 'ru' ? 'ТИП' : 'TYPE', t1Opts: QUALITIES.slice(0, 4), t2Label: t.matrix.filterArena, t2Opts: ARENAS },
                                5: { t1Label: t.matrix.filterSector, t1Opts: SECTOR_OPTS, t2Label: t.matrix.filterPair, t2Opts: PAIR_COMBOS },
                                6: { t1Label: t.matrix.filterNeighbor, t1Opts: QUALITIES.slice(0, 4), t2Label: t.matrix.filterPair, t2Opts: PAIR_COMBOS }
                            }[lvl as 1 | 2 | 3 | 4 | 5 | 6];

                            return (

                                <div key={lvl}
                                    onClick={() => updatePerk(lvl, { active: !isActive })}
                                    style={{
                                        background: isActive ? `${rarityColor} 20` : 'rgba(15, 23, 42, 0.4)',
                                        border: `1px solid ${isActive ? rarityColor : `${rarityColor}40`} `,
                                        borderRadius: '4px',
                                        padding: '6px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? `inset 0 0 10px ${rarityColor} 33` : 'none',
                                        cursor: 'pointer'
                                    }}>
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}
                                    >
                                        <span style={{
                                            fontSize: '8px',
                                            fontWeight: 900,
                                            color: rarityColor,
                                            letterSpacing: '0.2px',
                                            opacity: isActive ? 1 : 0.8,
                                            textTransform: 'uppercase'
                                        }}>
                                            {(t.matrix as any)[`perk${lvl}`]}
                                        </span>
                                    </div>

                                    {isActive && (
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s' }}
                                        >
                                            {/* Value Row (Universal for L1-L9) */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase' }}>{t.matrix.filterThreshold}</span>
                                                    <span style={{ fontSize: '8px', fontWeight: 900, color: rarityColor }}>
                                                        {perkFilters[lvl].val}%
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="35"
                                                    step="1"
                                                    className="scanner-range"
                                                    value={perkFilters[lvl].val}
                                                    onChange={e => updatePerk(lvl, { val: parseInt(e.target.value) || 0 })}
                                                    style={{
                                                        width: '100%',
                                                        cursor: 'pointer',
                                                        height: '4px',
                                                        margin: '4px 0',
                                                        accentColor: rarityColor
                                                    }}
                                                />
                                            </div>

                                            {/* Thing 1 Custom Dropdown */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900, textTransform: 'uppercase' }}>{config.t1Label}</span>
                                                {renderPerkDropdown(
                                                    `${lvl}-t1`,
                                                    perkFilters[lvl].thing1,
                                                    config.t1Opts,
                                                    v => updatePerk(lvl, { thing1: v }),
                                                    rarityColor,
                                                    lvl >= 4
                                                )}
                                            </div>

                                            {/* Thing 2 Custom Dropdown */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900, textTransform: 'uppercase' }}>{config.t2Label}</span>
                                                {renderPerkDropdown(
                                                    `${lvl}-t2`,
                                                    perkFilters[lvl].thing2,
                                                    config.t2Opts,
                                                    v => updatePerk(lvl, { thing2: v }),
                                                    rarityColor,
                                                    lvl >= 4
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* SAFE SLOTS (FIXED IN HEADER) */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(59, 130, 246, 0.2)', marginTop: '4px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '4px'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#a855f7', letterSpacing: '2px' }}>{t.matrix.safeSlots}</span>
                        <span style={{ fontSize: '7px', color: '#94a3b8', fontStyle: 'italic', opacity: 0.8 }}>{t.matrix.safeSlotsSub}</span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(9, minmax(0, 1fr))',
                        columnGap: '5px',
                        rowGap: '1px',
                        alignContent: 'start',
                        padding: '0 4px 0 1px'
                    }}>
                        {Array.from({ length: 9 }).map((_, i) => renderSlot(displayInventory[i], i, isFilterActive))}
                    </div>
                </div>

                {/* STORAGE HEADER (FIXED IN HEADER) */}
                <div style={{
                    padding: '8px 0 8px 0',
                    borderTop: '1px solid rgba(59, 130, 246, 0.3)',
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#3b82f6', letterSpacing: '2px' }}>{t.matrix.storage}</span>
                    </div>

                    <div className="recycle-btn" style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        marginTop: '2px'
                    }}>
                        <button
                            onClick={onToggleRecycle}
                            style={{
                                ...selectStyle,
                                background: isRecycleMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                                borderColor: isRecycleMode ? '#ef4444' : '#3b82f6',
                                color: isRecycleMode ? '#ef4444' : '#3b82f6',
                                height: '24px',
                                width: 'auto',
                                padding: '0 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                                boxShadow: isRecycleMode ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none',
                                transition: 'all 0.2s',
                                transform: recyclingAnim ? 'scale(0.95)' : 'scale(1)',
                                letterSpacing: '1px'
                            }}
                            title="Toggle Recycle Mode"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            {t.matrix.recycle}
                        </button>

                        <button
                            onClick={() => {
                                if (!isRecycleMode) return;
                                const targets: number[] = [];
                                inventory.forEach((item, i) => {
                                    if (i >= 9 && item && matchesFilterLocal(item)) targets.push(i);
                                });
                                if (targets.length > 0) {
                                    setMassRecycleCandidate({ type: 'SELECTED', indices: targets });
                                }
                            }}
                            disabled={!isRecycleMode}
                            style={{
                                ...selectStyle,
                                background: isRecycleMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                                borderColor: isRecycleMode ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)',
                                color: isRecycleMode ? '#fff' : '#475569',
                                height: '24px',
                                width: 'auto',
                                minWidth: '60px',
                                padding: '0 8px',
                                fontSize: '9px',
                                fontWeight: 900,
                                cursor: isRecycleMode ? 'pointer' : 'default',
                                opacity: isRecycleMode ? 1 : 0.4,
                                transition: 'all 0.2s',
                            }}
                        >
                            {t.matrix.selected}
                        </button>

                        <button
                            onClick={() => {
                                if (!isRecycleMode) return;
                                const discards: number[] = [];
                                inventory.forEach((item, i) => {
                                    if (i >= 9 && item && !matchesFilterLocal(item)) discards.push(i);
                                });
                                if (discards.length > 0) {
                                    setMassRecycleCandidate({ type: 'GHOSTS', indices: discards });
                                }
                            }}
                            disabled={!isRecycleMode}
                            style={{
                                ...selectStyle,
                                background: isRecycleMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.5)',
                                borderColor: isRecycleMode ? '#ef4444' : 'rgba(148, 163, 184, 0.1)',
                                color: isRecycleMode ? '#fff' : '#475569',
                                height: '24px',
                                width: 'auto',
                                minWidth: '70px',
                                padding: '0 8px',
                                fontSize: '9px',
                                fontWeight: 900,
                                cursor: isRecycleMode ? 'pointer' : 'default',
                                opacity: isRecycleMode ? 1 : 0.4,
                                transition: 'all 0.2s',
                                gap: '3px'
                            }}
                        >
                            {t.matrix.ghosts}
                        </button>
                    </div>
                </div>
            </div>

            {/* STORAGE AREA */}
            <div className="inventory-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(9, minmax(0, 1fr))', // 9 COLUMNS
                gridAutoRows: 'min-content',
                columnGap: '5px',
                rowGap: '1px',
                alignContent: 'start',
                width: '100%',
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                boxSizing: 'border-box',
                padding: '0 4px 8px 1px'
            }}>
                {/* INVENTORY ITEMS (STORAGE ONLY) */}
                {
                    displayInventory.slice(9).map((item, i) => renderSlot(item, i + 9, isFilterActive))
                }
            </div>

            {massRecycleCandidate && (
                <MassRecycleConfirmationModal
                    type={massRecycleCandidate.type}
                    count={massRecycleCandidate.indices.length}
                    onCancel={() => setMassRecycleCandidate(null)}
                    onConfirm={() => {
                        onMassRecycle(massRecycleCandidate.indices);
                        setMassRecycleCandidate(null);
                    }}
                />
            )}
            <style>{`
                .inventory-grid::-webkit-scrollbar { width: 6px; }
                .inventory-grid::-webkit-scrollbar-track { background: transparent; }
                .inventory-grid::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 3px; }
                .inventory-grid::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.5); }
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
            `}</style>
        </div>
    );
});
