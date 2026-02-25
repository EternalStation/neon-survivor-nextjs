
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, Meteorite } from '../../logic/core/types';
import { getMeteoriteImage, RARITY_COLORS, getPerkName, PerkFilter, getPerkParts, SPIN_POOLS, matchesPerk } from './ModuleUtils';
import { playSfx } from '../../logic/audio/AudioLogic';
import { getUpgradeQualityCost, getRerollTypeCost, getRerollValueCost } from '../../logic/upgrades/RecalibrateLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

const LEGENDARY_TYPES = ['All', 'Eco Legendary', 'Com Legendary', 'Def Legendary'];

interface RecalibrateInterfaceProps {
    item: Meteorite;
    gameState: GameState;
    onClose: () => void;
    onUpgradeQuality: () => void;
    onRerollType: (lockedPerkIndices: number[]) => void;
    onRerollValue: (lockedPerkIndices: number[]) => void;
    lockedIndices: number[];
    onToggleLock: (idx: number) => void;
    recalibrateFilters: Record<number, PerkFilter>;
    setRecalibrateFilters: React.Dispatch<React.SetStateAction<Record<number, PerkFilter>>>;
    // Called from parent after each auto-reroll to let parent re-apply auto-lock logic
    // (same as the normal onRerollType callback path)
}

export const RecalibrateInterface: React.FC<RecalibrateInterfaceProps> = ({
    item, gameState, onClose, onUpgradeQuality, onRerollType, onRerollValue,
    lockedIndices, onToggleLock, recalibrateFilters, setRecalibrateFilters
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const tr = t.recalibrate;

    const PAIR_COMBOS = [tr.all, tr.combos.eco_eco, tr.combos.eco_com, tr.combos.eco_def, tr.combos.com_com, tr.combos.com_def, tr.combos.def_def];
    const QUALITIES = [tr.all, tr.qualities.new.toUpperCase().slice(0, 3), tr.qualities.dam.toUpperCase().slice(0, 3), tr.qualities.bro.toUpperCase().slice(0, 3), tr.qualities.cor?.toUpperCase().slice(0, 3) || 'COR'];
    const ARENAS = [tr.all, tr.sectors.s1, tr.sectors.s2, tr.sectors.s3];
    const FOUND_IN_ARENAS = [tr.all, tr.arenas.eco, tr.arenas.com, tr.arenas.def];
    const LEGENDARY_TYPES = [tr.all, tr.legendary.eco, tr.legendary.com, tr.legendary.def];

    // Local state removed - lifted to parent


    const rarityColor = RARITY_COLORS[item.rarity];
    const quality = item.quality || 'Broken';

    const qualityCost = getUpgradeQualityCost(item);
    const canUpgradeQuality = quality === 'Broken' || quality === 'Damaged';
    const canAffordQuality = gameState.player.isotopes >= qualityCost;

    const rerollTypeCost = getRerollTypeCost(item, lockedIndices.length);
    const rerollValueCost = getRerollValueCost(item, lockedIndices.length);

    const canAffordRerollType = gameState.player.isotopes >= rerollTypeCost;
    const canAffordRerollValue = gameState.player.isotopes >= rerollValueCost;

    const [isSpinningPerks, setIsSpinningPerks] = useState(false);
    const [isSpinningRange, setIsSpinningRange] = useState(false);
    const [spinningLevel, setSpinningLevel] = useState<number | null>(null); // null means all or none

    // Auto-reroll state
    const [isAutoRolling, setIsAutoRolling] = useState(false);
    const [isErrorFlashing, setIsErrorFlashing] = useState(false);
    const autoRollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track roll count for the pulsing display
    const [autoRollCount, setAutoRollCount] = useState(0);

    const autoRollStateRef = useRef({ item, lockedIndices, gameState, allFiltersSatisfied: (): boolean => false, currentRolls: 0 });
    useEffect(() => {
        autoRollStateRef.current.item = item;
        autoRollStateRef.current.lockedIndices = lockedIndices;
        autoRollStateRef.current.gameState = gameState;
    }); // Update ref with latest values on every render

    // Local state for Accordion Behavior
    const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

    // ─── Helpers ──────────────────────────────────────────────────────────────
    /** True when at least one perk filter is active */
    const hasActiveFilters = Object.values(recalibrateFilters).some(f => f?.active);

    /** Check whether all currently-active filters are satisfied by the item's current perks */
    const allFiltersSatisfied = useCallback(() => {
        return item.perks.every((p, idx) => {
            const lvl = idx + 1;
            const filter = recalibrateFilters[lvl];
            if (!filter || !filter.active) return true; // not required
            return matchesPerk(p, lvl, filter);
        });
    }, [item.perks, recalibrateFilters]);

    useEffect(() => {
        autoRollStateRef.current.allFiltersSatisfied = allFiltersSatisfied;
    }, [allFiltersSatisfied]);

    /** Stop the auto-roll loop */
    const stopAutoRoll = useCallback(() => {
        if (autoRollIntervalRef.current !== null) {
            clearInterval(autoRollIntervalRef.current);
            autoRollIntervalRef.current = null;
        }
        setIsAutoRolling(false);
        setIsSpinningPerks(false);
    }, []);

    // Clean up interval on unmount
    useEffect(() => {
        return () => stopAutoRoll();
    }, [stopAutoRoll]);

    const updateFilter = (lvl: number, updates: Partial<PerkFilter>) => {
        setRecalibrateFilters(prev => {
            const current = prev[lvl] || { active: false, val: 0, thing1: 'All', thing2: 'All' };
            return {
                ...prev,
                [lvl]: { ...current, ...updates }
            };
        });
    };

    // Close expansion on click outside
    React.useEffect(() => {
        if (expandedLevel === null) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If click is not strictly inside an expanded panel or a toggle
            if (!target.closest('.auto-lock-panel') && !target.closest('.auto-lock-toggle')) {
                setExpandedLevel(null);
            }
        };
        // Stagger listener to avoid immediate close from the opening click
        const timer = setTimeout(() => {
            window.addEventListener('mousedown', handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expandedLevel]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex', flexDirection: 'column',
            color: '#fff',
            position: 'relative',
            margin: '0',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 10%, rgba(15, 23, 42, 0.4) 0%, transparent 70%)',
            animation: 'panel-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* AMBIENT BACKGROUND GLOW */}
            <div style={{
                position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                width: '300px', height: '300px',
                background: rarityColor,
                filter: 'blur(100px)',
                opacity: 0.08,
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* TOP HEADER: ENHANCEMENT ARRAY */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: `1px solid ${rarityColor}44`,
                padding: '8px 16px',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        position: 'relative',
                        width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            border: `2px solid ${rarityColor}`,
                            borderRadius: '4px',
                            transform: 'rotate(45deg)',
                            animation: 'pulse-glow 2s infinite'
                        }} />
                        <span style={{ fontSize: '10px', fontWeight: 900, color: rarityColor }}>☢</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', color: '#fff', textShadow: `0 0 10px ${rarityColor}66` }}>
                            {tr.enhancementStation}
                        </span>
                        <span style={{ fontSize: '7px', color: rarityColor, fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>{tr.systemReady} {item.rarity.toUpperCase()}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444',
                        padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 900, fontSize: '10px', transition: 'all 0.2s', textTransform: 'uppercase',
                        letterSpacing: '1px',
                        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'; }}
                >
                    {tr.eject}
                </button>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 5 }}>

                {/* CENTRAL UNIT HUD */}
                <div style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '86px'
                }}>
                    {/* Scanner Lines Animated Background */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.03) 1px, rgba(59, 130, 246, 0.03) 2px)',
                        pointerEvents: 'none'
                    }} />

                    {/* LEFT: ICON */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            position: 'relative',
                            width: '44px', height: '44px',
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${rarityColor}aa`,
                            boxShadow: `0 0 20px ${rarityColor}44, inset 0 0 15px ${rarityColor}22`
                        }}>
                            <div style={{
                                position: 'absolute', inset: -10,
                                border: `1px solid ${rarityColor}33`,
                                borderRadius: '50%',
                                animation: 'spin-slow 20s infinite linear'
                            }} />
                            <div style={{
                                position: 'absolute', inset: -5,
                                border: `1px dashed ${rarityColor}44`,
                                borderRadius: '50%',
                                animation: 'spin-reverse 10s infinite linear'
                            }} />

                            <img
                                src={getMeteoriteImage(item)}
                                style={{ width: '32px', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 12px ${rarityColor})` }}
                                alt="loaded unit"
                            />
                            {item.isCorrupted && (
                                <div style={{
                                    position: 'absolute', top: '-4px', left: '-4px',
                                    width: '10px', height: '10px',
                                    background: '#1e293b',
                                    border: '1px solid #a855f7',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 5px rgba(168, 85, 247, 0.4)',
                                    zIndex: 5
                                }}>
                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#a855f7', lineHeight: 1 }}>C</span>
                                </div>
                            )}
                            {item.blueprintBoosted && (
                                <div style={{
                                    position: 'absolute', bottom: '-4px', left: '-4px',
                                    width: '10px', height: '10px',
                                    background: '#1e293b',
                                    border: '1px solid #60a5fa',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 5px rgba(96, 165, 250, 0.4)',
                                    zIndex: 5
                                }}>
                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                </div>
                            )}
                            {item.incubatorBoost && item.incubatorBoost > 0 && (
                                <div style={{
                                    position: 'absolute', bottom: '-4px', right: '-4px',
                                    width: '10px', height: '10px',
                                    background: '#1e293b',
                                    border: '1px solid #00d9ff',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 0 5px rgba(0, 217, 255, 0.4)',
                                    zIndex: 5
                                }}>
                                    <span style={{ fontSize: '6px', fontWeight: 900, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: UNIT NAME */}
                    <div style={{ flex: 1, textAlign: 'center', zIndex: 1 }}>
                        <div style={{
                            fontSize: '15px',
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '4px',
                            textShadow: `0 0 15px ${rarityColor}66`,
                            textTransform: 'uppercase'
                        }}>
                            {item.rarity} {tr.unit}
                        </div>
                    </div>

                    {/* RIGHT: DATA COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', zIndex: 1, minWidth: '130px' }}>
                        {/* REPAIR BUTTON (Top Right) */}
                        <div style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
                            {canUpgradeQuality ? (
                                <button
                                    disabled={!canAffordQuality}
                                    onClick={() => {
                                        playSfx('upgrade-confirm');
                                        onUpgradeQuality();
                                    }}
                                    style={{
                                        background: canAffordQuality ? `linear-gradient(180deg, ${rarityColor}, ${rarityColor}cc)` : '#1e293b',
                                        color: '#000',
                                        border: 'none',
                                        padding: '4px 20px', borderRadius: '4px',
                                        fontSize: '9px', fontWeight: 900,
                                        cursor: canAffordQuality ? 'pointer' : 'not-allowed',
                                        boxShadow: canAffordQuality ? `0 0 12px ${rarityColor}44` : 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        opacity: canAffordQuality ? 1 : 0.5,
                                        clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tr.repair} ({qualityCost} F)
                                </button>
                            ) : (
                                <span style={{ fontSize: '8px', color: '#22c55e', fontWeight: 900, letterSpacing: '1.5px', textShadow: '0 0 5px rgba(34, 197, 94, 0.5)', whiteSpace: 'nowrap' }}>✓ {tr.integrityMax}</span>
                            )}
                        </div>

                        {/* INTEGRITY STATUS (Middle Right) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Visual Integrity Bar */}
                            <div style={{ width: '60px', height: '3px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                                <div style={{
                                    width: quality === 'Broken' ? '33%' : quality === 'Damaged' ? '66%' : '100%',
                                    height: '100%',
                                    background: quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e',
                                    boxShadow: `0 0 10px ${quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e'}66`
                                }} />
                            </div>
                            <span style={{ fontSize: '7px', fontWeight: 900, color: quality === 'Broken' ? '#ef4444' : quality === 'Damaged' ? '#fbbf24' : '#22c55e', textTransform: 'uppercase' }}>
                                {quality === 'Broken' ? tr.qualities.bro : quality === 'Damaged' ? tr.qualities.dam : tr.qualities.new}
                            </span>
                        </div>

                        {/* VERSION & CORRUPTION STATUS (Bottom Right) */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                            <span style={{
                                fontSize: '9px', color: '#fff',
                                fontWeight: 900, fontFamily: 'monospace',
                                opacity: 0.8
                            }}>
                                {tr.version} {item.version?.toFixed(1) || '1.0'}
                            </span>
                            {item.incubatorBoost && item.incubatorBoost > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(0, 217, 255, 0.1)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid rgba(0, 217, 255, 0.3)',
                                        boxShadow: '0 0 10px rgba(0, 217, 255, 0.2)',
                                        marginTop: '2px'
                                    }}>
                                        <span style={{ fontSize: '7px', fontWeight: 950, color: '#fff', letterSpacing: '0.5px' }}>
                                            {tr.incubLabel} <span style={{ color: '#00d9ff' }}>+{item.incubatorBoost}%</span>
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '6px', color: 'rgba(0, 217, 255, 0.6)', fontWeight: 700, marginTop: '1px', textTransform: 'uppercase' }}>
                                        {tr.incubCostNote}
                                    </span>
                                </div>
                            )}
                            {item.isCorrupted && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    background: 'rgba(239, 68, 68, 0.1)', padding: '1px 4px', borderRadius: '2px',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                    <span style={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.5px' }}>{tr.corruptedUnit.toUpperCase()} // {tr.costPlus50}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PERK ARRAY - ENHANCED VISUALS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
                            {tr.hardwareArray}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, rgba(255,255,255,0.1), transparent)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {item.perks.map((p, idx) => {
                            const isLocked = lockedIndices.includes(idx);
                            const rangeSpan = p.range.max - p.range.min;
                            const pos = rangeSpan > 0 ? (p.value - p.range.min) / rangeSpan : 1;
                            const effColor = pos < 0.3 ? '#f87171' : pos < 0.7 ? '#fbbf24' : '#34d399';

                            const lvl = idx + 1;
                            const filter = recalibrateFilters[lvl] || { active: false };
                            const isFilterActive = filter.active;
                            const isExpanded = expandedLevel === lvl;

                            const config = {
                                1: { t1Label: tr.filterLabels.sector, t1Opts: ARENAS, t2Label: tr.filterLabels.connected, t2Opts: LEGENDARY_TYPES },
                                2: { t1Label: tr.filterLabels.sector, t1Opts: ARENAS, t2Label: tr.filterLabels.neighbor, t2Opts: QUALITIES.slice(0, 4) },
                                3: { t1Label: tr.filterLabels.neighbor, t1Opts: QUALITIES.slice(0, 4), t2Label: tr.filterLabels.foundIn, t2Opts: FOUND_IN_ARENAS },
                                4: { t1Label: tr.filterLabels.neighbor, t1Opts: QUALITIES.slice(0, 4), t2Label: tr.filterLabels.foundIn, t2Opts: FOUND_IN_ARENAS },
                                5: { t1Label: tr.filterLabels.sector, t1Opts: ARENAS, t2Label: tr.filterLabels.pair, t2Opts: PAIR_COMBOS },
                                6: { t1Label: tr.filterLabels.neighbor, t1Opts: QUALITIES.slice(0, 4), t2Label: tr.filterLabels.pair, t2Opts: PAIR_COMBOS }
                            }[lvl as 1 | 2 | 3 | 4 | 5 | 6];

                            const handleToggleFilter = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                playSfx('ui-click');

                                if (!isFilterActive) {
                                    // OFF -> ON: Activate & Expand
                                    updateFilter(lvl, { active: true });
                                    setExpandedLevel(lvl);
                                } else {
                                    // Already Active
                                    if (isExpanded) {
                                        // Open -> Close + Disable
                                        updateFilter(lvl, { active: false });
                                        setExpandedLevel(null);
                                    } else {
                                        // Closed -> Re-open (STAY ACTIVE)
                                        setExpandedLevel(lvl);
                                    }
                                }
                            };

                            const formatPerkDescription = (text: string) => {
                                if (language === 'ru') {
                                    const mTrans = t.meteorites;
                                    text = text
                                        .replace(/neighboring a (Damaged|Broken|New) Meteorite/gi, (match, p1) => {
                                            const status = p1.toLowerCase() === 'damaged' ? mTrans.stats.damaged : p1.toLowerCase() === 'broken' ? mTrans.stats.broken : mTrans.stats.new;
                                            return `соседствует с ${status}`;
                                        })
                                        .replace(/neighboring/gi, 'соседствует с')
                                        .replace(/Secondary neighboring/gi, 'Вторичное соседство с')
                                        .replace(/Located in Sector-(\d+)/gi, (match, p1) => {
                                            const sector = p1 === '01' ? mTrans.stats.sector01 : p1 === '02' ? mTrans.stats.sector02 : mTrans.stats.sector03;
                                            return `Находится в ${sector}`;
                                        })
                                        .replace(/located in Sector-(\d+)/gi, (match, p1) => {
                                            const sector = p1 === '01' ? mTrans.stats.sector01 : p1 === '02' ? mTrans.stats.sector02 : mTrans.stats.sector03;
                                            return `найден в ${sector}`;
                                        })
                                        .replace(/located in/gi, 'найден в')
                                        .replace(/found in (ECO|COM|DEF) HEX/gi, (match, p1) => {
                                            const arena = p1 === 'ECO' ? mTrans.stats.economicArena : p1 === 'COM' ? mTrans.stats.combatArena : mTrans.stats.defenceArena;
                                            return `найден в ${arena}`;
                                        })
                                        .replace(/found in (Economic|Combat|Defence) Arena/gi, (match, p1) => {
                                            const arena = p1.toLowerCase() === 'economic' ? mTrans.stats.economicArena : p1.toLowerCase() === 'combat' ? mTrans.stats.combatArena : mTrans.stats.defenceArena;
                                            return `найден в ${arena}`;
                                        })
                                        .replace(/connected to (Eco|Com|Def) Hexes/gi, (match, p1) => {
                                            const arenaShort = p1 === 'Eco' ? 'Эко' : p1 === 'Com' ? 'Бой' : 'Защ';
                                            return `соседствует с ${arenaShort} Легендарный ⬢`;
                                        })
                                        .replace(/Connects (Eco|Com|Def) & (Eco|Com|Def) Hexes/gi, (match, p1, p2) => {
                                            const s1 = p1 === 'Eco' ? 'Эко' : p1 === 'Com' ? 'Бой' : 'Защ';
                                            const s2 = p2 === 'Eco' ? 'Эко' : p2 === 'Com' ? 'Бой' : 'Защ';
                                            return `Соседствует с ${s1} и ${s2} Легендарный ⬢`;
                                        })
                                        .replace(/connected to/gi, 'соседствует с')
                                        .replace(/connects/gi, 'соседствует с')
                                        .replace(/Connects/gi, 'Соседствует с')
                                        .replace(/\band\b/gi, 'и')
                                        .replace(/&/g, 'и')
                                        .replace(/Eco ⬢/g, 'Эко ⬢')
                                        .replace(/Com ⬢/g, 'Бой ⬢')
                                        .replace(/Def ⬢/g, 'Защ ⬢')
                                        .replace(/\bEco\b/gi, 'Эко')
                                        .replace(/\bCom\b/gi, 'Бой')
                                        .replace(/\bDef\b/gi, 'Защ')
                                        .replace(/Broken Meteorite/gi, mTrans.stats.broken)
                                        .replace(/Damaged Meteorite/gi, mTrans.stats.damaged)
                                        .replace(/New Meteorite/gi, mTrans.stats.new);

                                    text = text.trim();
                                    if (text.length > 0) {
                                        text = text.charAt(0).toUpperCase() + text.slice(1);
                                    }
                                }
                                return text;
                            };

                            const renderDescription = () => {
                                const translatedDesc = formatPerkDescription(p.description);
                                const parts = getPerkParts(p.id, language);
                                if (parts.length === 0) {
                                    return applyHighlighting(translatedDesc);
                                }

                                const isActuallySpinning = isSpinningPerks && !lockedIndices.includes(idx);

                                // Replace keywords with spinning components
                                let res: (string | React.ReactNode)[] = [translatedDesc];
                                parts.forEach(part => {
                                    const nextRes: (string | React.ReactNode)[] = [];
                                    res.forEach(item => {
                                        if (typeof item === 'string') {
                                            const sub = item.split(part);
                                            sub.forEach((s, i) => {
                                                nextRes.push(s);
                                                if (i < sub.length - 1) {
                                                    nextRes.push(<SpinningWord key={part + i} target={part} isSpinning={isActuallySpinning} />);
                                                }
                                            });
                                        } else {
                                            nextRes.push(item);
                                        }
                                    });
                                    res = nextRes;
                                });
                                return <span>{res.map((chunk, i) => typeof chunk === 'string' ? applyHighlighting(chunk) : chunk)}</span>;
                            };

                            const applyHighlighting = (text: string) => {
                                const highlightColor = '#60a5fa';
                                const mTrans = t.meteorites;
                                const keywords = [
                                    mTrans.stats.sector01, mTrans.stats.sector02, mTrans.stats.sector03,
                                    mTrans.stats.economicArena, mTrans.stats.combatArena, mTrans.stats.defenceArena,
                                    'Economic Arena', 'Combat Arena', 'Defence Arena',
                                    'Экономическая Арена', 'Боевая Арена', 'Защитная Арена',
                                    'Эко ⬢', 'Бой ⬢', 'Защ ⬢',
                                    'Эко и Бой ⬢', 'Эко и Защ ⬢', 'Бой и Защ ⬢',
                                    'Бой и Эко ⬢', 'Защ и Эко ⬢', 'Защ и Бой ⬢',
                                    'Эко и Эко ⬢', 'Бой и Бой ⬢', 'Защ и Защ ⬢',
                                    'НОВЫЙ', 'ПОВРЕЖДЕН', 'СЛОМАН', 'ИСКАЖЕН',
                                    'Sector-01', 'Sector-02', 'Sector-03'
                                ];

                                const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
                                return text.split(regex).filter(Boolean).map((part, i) => {
                                    const isKeyword = keywords.some(k => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part));
                                    if (isKeyword) {
                                        return <span key={i} style={{ color: highlightColor, fontWeight: 'bold' }}>{part.toUpperCase()}</span>;
                                    }
                                    return <span key={i}>{part}</span>;
                                });
                            };

                            return (
                                <div key={idx}
                                    style={{
                                        display: 'flex', flexDirection: 'column',
                                        padding: '8px 12px',
                                        background: isLocked ? 'rgba(251, 191, 36, 0.05)' : 'rgba(15, 23, 42, 0.5)',
                                        border: `1px solid ${isLocked ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: '6px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isLocked && <div style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '100%', background: '#fbbf24' }} />}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        {/* MANUAL LOCK BUTTON */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); onToggleLock(idx); }}
                                            style={{
                                                width: '24px', height: '24px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isLocked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isLocked ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: isLocked ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                                                fontSize: '12px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = isLocked ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.15)';
                                                e.currentTarget.style.borderColor = isLocked ? '#fbbf24' : 'rgba(255,255,255,0.3)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isLocked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.borderColor = isLocked ? '#fbbf24' : 'rgba(255,255,255,0.1)';
                                            }}
                                        >
                                            {isLocked ? '🔒' : '🔓'}
                                        </div>

                                        <span style={{ fontSize: '11px', fontWeight: 900, color: isLocked ? '#fff' : 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                                            {getPerkName(p.id, language).toUpperCase()}
                                        </span>

                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                            [{p.range.min + (item.incubatorBoost || 0)}-{p.range.max + (item.incubatorBoost || 0)}%]
                                        </span>

                                        <div style={{ flex: 1 }} />

                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontSize: '15px', fontWeight: 900, color: effColor, textShadow: `0 0 10px ${effColor}44` }}>
                                                {isSpinningRange && !lockedIndices.includes(idx) ?
                                                    <SpinningNumber min={p.range.min + (item.incubatorBoost || 0)} max={p.range.max + (item.incubatorBoost || 0)} isSpinning={true} />
                                                    :
                                                    `${p.value + (item.incubatorBoost || 0)}%`
                                                }
                                            </div>

                                            {/* AUTO-LOCK TOGGLE SWITCH */}
                                            {config && (
                                                <div
                                                    className="auto-lock-toggle"
                                                    onClick={handleToggleFilter}
                                                    style={{
                                                        width: '26px', height: '14px',
                                                        background: isFilterActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                                        border: `1px solid ${isFilterActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                                                        borderRadius: '10px',
                                                        position: 'relative',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: isFilterActive ? '0 0 12px rgba(59, 130, 246, 0.3)' : 'none'
                                                    }}
                                                >
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: isFilterActive ? '16px' : '2px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        width: '8px', height: '8px',
                                                        background: isFilterActive ? '#fff' : 'rgba(255,255,255,0.3)',
                                                        borderRadius: '50%',
                                                        transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                                                        boxShadow: isFilterActive ? '0 0 5px #fff' : 'none'
                                                    }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{
                                        fontSize: '9px', color: 'rgba(255,255,255,0.5)',
                                        whiteSpace: 'normal',
                                        lineHeight: '1.4',
                                        paddingTop: '6px',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        fontStyle: 'italic'
                                    }}>
                                        {renderDescription()}
                                    </div>

                                    {/* FILTER CONFIG PANEL - Show if EXPANDED */}
                                    {isExpanded && config && (
                                        <div
                                            className="auto-lock-panel"
                                            onClick={e => e.stopPropagation()}
                                            style={{
                                                marginTop: '8px',
                                                padding: '8px',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                animation: 'fadeIn 0.2s ease-out'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                {/* Status Indicator */}
                                                <div style={{
                                                    width: '6px', height: '6px',
                                                    background: '#3b82f6',
                                                    borderRadius: '50%',
                                                    boxShadow: '0 0 10px #3b82f6'
                                                }} />
                                                <span style={{ fontSize: '8px', color: '#60a5fa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{tr.autoLockActive}</span>
                                            </div>

                                            {/* DROPDOWNS */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900 }}>{config.t1Label}</span>
                                                    <select
                                                        value={filter.thing1}
                                                        onChange={e => updateFilter(lvl, { thing1: e.target.value })}
                                                        style={{
                                                            background: 'rgba(15, 23, 42, 0.8)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            color: '#fff',
                                                            fontSize: '7px',
                                                            borderRadius: '2px',
                                                            padding: '2px',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        {config.t1Opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900 }}>{config.t2Label}</span>
                                                    <select
                                                        value={filter.thing2}
                                                        onChange={e => updateFilter(lvl, { thing2: e.target.value })}
                                                        style={{
                                                            background: 'rgba(15, 23, 42, 0.8)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            color: '#fff',
                                                            fontSize: '7px',
                                                            borderRadius: '2px',
                                                            padding: '2px',
                                                            outline: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {config.t2Opts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BOTTOM CONSOLE: REROLL ACTIONS */}
                <div style={{ marginTop: '-5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            disabled={isSpinningRange || (!isAutoRolling && (!canAffordRerollType || isSpinningPerks))}
                            onClick={() => {
                                if (isAutoRolling) {
                                    // ── STOP ──────────────────────────────────
                                    stopAutoRoll();
                                    return;
                                }

                                if (hasActiveFilters) {
                                    // ── START AUTO-ROLL ───────────────────────
                                    if (!canAffordRerollType) return;

                                    setIsAutoRolling(true);
                                    setIsSpinningPerks(true);
                                    setAutoRollCount(0);
                                    autoRollStateRef.current.currentRolls = 0;

                                    // Perform first roll immediately
                                    const doRoll = () => {
                                        const { item: curItem, lockedIndices: curLocked, gameState: curGs, allFiltersSatisfied: curSat, currentRolls } = autoRollStateRef.current;
                                        // Re-check affordability inside the interval
                                        const cost = getRerollTypeCost(curItem, curLocked.length);
                                        if (curGs.player.isotopes < cost) {
                                            if (currentRolls >= 7 && curLocked.length > 0) {
                                                (curGs.assistant.history as any).pendingBrokeSnark = true;
                                            }
                                            playSfx('warning');
                                            setIsErrorFlashing(true);
                                            setTimeout(() => setIsErrorFlashing(false), 1000);
                                            stopAutoRoll();
                                            return;
                                        }
                                        playSfx('reroll');
                                        onRerollType(curLocked);
                                        setAutoRollCount(c => c + 1);
                                        autoRollStateRef.current.currentRolls++;

                                        // After parent updates perks, check if all filters match
                                        // Use a small delay so React state has settled
                                        setTimeout(() => {
                                            if (autoRollStateRef.current.allFiltersSatisfied()) {
                                                stopAutoRoll();
                                                playSfx('upgrade-confirm');
                                            }
                                        }, 50);
                                    };

                                    doRoll();
                                    autoRollIntervalRef.current = setInterval(doRoll, 1000);
                                } else {
                                    // ── NORMAL SINGLE ROLL (no filters) ──────
                                    setIsSpinningPerks(true);
                                    playSfx('reroll');
                                    setTimeout(() => {
                                        onRerollType(lockedIndices);
                                        setIsSpinningPerks(false);
                                    }, 1000);
                                }
                            }}
                            style={{
                                flex: 1,
                                height: '44px',
                                background: isAutoRolling
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : canAffordRerollType ? 'rgba(168, 85, 247, 0.05)' : 'rgba(51, 65, 85, 0.05)',
                                color: isAutoRolling
                                    ? '#fca5a5'
                                    : canAffordRerollType ? '#d8b4fe' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: isAutoRolling
                                    ? '#ef4444'
                                    : canAffordRerollType ? '#a855f7' : 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                                cursor: (isAutoRolling || canAffordRerollType) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                            onMouseEnter={(e) => {
                                if (isAutoRolling) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; return; }
                                if (canAffordRerollType) { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)'; e.currentTarget.style.borderColor = '#c084fc'; }
                            }}
                            onMouseLeave={(e) => {
                                if (isAutoRolling) { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; return; }
                                if (canAffordRerollType) { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.05)'; e.currentTarget.style.borderColor = '#a855f7'; }
                            }}
                        >
                            {isAutoRolling ? (
                                <>
                                    <span style={{ fontSize: '11px' }}>⏹ {tr.stopAutoRoll.toUpperCase()}</span>
                                    <span style={{ fontSize: '7px', opacity: 0.7, fontFamily: 'monospace' }}>
                                        {tr.roll.toUpperCase()} #{autoRollCount} · {rerollTypeCost.toLocaleString()} FLUX/ea
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '12px' }}>{hasActiveFilters ? `⟳ ${tr.autoReroll.toUpperCase()}` : tr.rerollPerks.toUpperCase()}</span>
                                    <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollTypeCost.toLocaleString()} FLUX{hasActiveFilters ? ` · ${tr.seeksFilter.toUpperCase()}` : ''}</span>
                                </>
                            )}
                            {!isAutoRolling && canAffordRerollType && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }} />}
                            {isAutoRolling && <div style={{ position: 'absolute', inset: 0, background: 'rgba(239, 68, 68, 0.08)', animation: 'pulse-fast 0.5s infinite alternate' }} />}
                            {isSpinningPerks && !isAutoRolling && <div style={{ position: 'absolute', inset: 0, background: 'rgba(168, 85, 247, 0.2)', animation: 'pulse-fast 0.1s infinite alternate' }} />}
                        </button>

                        <button
                            disabled={!canAffordRerollValue || isSpinningPerks || isSpinningRange}
                            onClick={() => {
                                setIsSpinningRange(true);
                                playSfx('upgrade');
                                setTimeout(() => {
                                    onRerollValue(lockedIndices);
                                    setIsSpinningRange(false);
                                }, 500); // Shorter for range
                            }}
                            style={{
                                flex: 1,
                                height: '44px',
                                background: canAffordRerollValue ? 'rgba(16, 185, 129, 0.05)' : 'rgba(51, 65, 85, 0.05)',
                                color: canAffordRerollValue ? '#6ee7b7' : 'rgba(255,255,255,0.2)',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: canAffordRerollValue ? '#10b981' : 'rgba(255,255,255,0.1)',
                                borderRadius: '4px',
                                fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px',
                                cursor: canAffordRerollValue ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                            }}
                            onMouseEnter={(e) => { if (canAffordRerollValue) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; e.currentTarget.style.borderColor = '#34d399'; } }}
                            onMouseLeave={(e) => { if (canAffordRerollValue) { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'; e.currentTarget.style.borderColor = '#10b981'; } }}
                        >
                            <span style={{ fontSize: '12px' }}>{tr.rerollRange.toUpperCase()}</span>
                            <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollValueCost.toLocaleString()} FLUX</span>
                            {canAffordRerollValue && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />}
                            {isSpinningRange && <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.2)', animation: 'pulse-fast 0.1s infinite alternate' }} />}
                        </button>
                    </div>
                </div>

                {/* ERROR FLASH OVERLAY */}
                {isErrorFlashing && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(239, 68, 68, 0.2)',
                        boxShadow: 'inset 0 0 100px rgba(239, 68, 68, 0.5)',
                        animation: 'flash-red 0.5s infinite',
                        pointerEvents: 'none',
                        zIndex: 100
                    }} />
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
                
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; box-shadow: 0 0 10px currentColor; }
                    50% { opacity: 1; box-shadow: 0 0 20px currentColor; }
                }

                @keyframes panel-appear {
                    from { opacity: 0; transform: scale(1.02) translateY(5px); filter: blur(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }

                @keyframes pulse-fast {
                    from { opacity: 0.5; filter: blur(0px); }
                    to { opacity: 1; filter: blur(1px); }
                }

                @keyframes flash-red {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
};

const SpinningWord: React.FC<{ target: string, isSpinning: boolean }> = ({ target, isSpinning }) => {
    const [current, setCurrent] = useState(target);

    useEffect(() => {
        if (!isSpinning) {
            setCurrent(target);
            return;
        }

        let pool: string[] = [];
        if (SPIN_POOLS.Sector.includes(target)) pool = SPIN_POOLS.Sector;
        else if (SPIN_POOLS.Arena.includes(target)) pool = SPIN_POOLS.Arena;
        else if (SPIN_POOLS.Legendary.includes(target)) pool = SPIN_POOLS.Legendary;
        else if (SPIN_POOLS.Pairing.includes(target)) pool = SPIN_POOLS.Pairing;
        else if (SPIN_POOLS.Quality.includes(target)) pool = SPIN_POOLS.Quality;
        else pool = [target, '???', 'ERROR', '---'];

        const interval = setInterval(() => {
            setCurrent(pool[Math.floor(Math.random() * pool.length)]);
        }, 60);

        return () => clearInterval(interval);
    }, [isSpinning, target]);

    // Find the longest string in the relevant pool to act as the stable width metric
    let longestStringInPool = target;
    if (SPIN_POOLS.Sector.includes(target)) longestStringInPool = [...SPIN_POOLS.Sector].sort((a, b) => b.length - a.length)[0];
    else if (SPIN_POOLS.Arena.includes(target)) longestStringInPool = [...SPIN_POOLS.Arena].sort((a, b) => b.length - a.length)[0];
    else if (SPIN_POOLS.Legendary.includes(target)) longestStringInPool = [...SPIN_POOLS.Legendary].sort((a, b) => b.length - a.length)[0];
    else if (SPIN_POOLS.Pairing.includes(target)) longestStringInPool = [...SPIN_POOLS.Pairing].sort((a, b) => b.length - a.length)[0];
    else if (SPIN_POOLS.Quality.includes(target)) longestStringInPool = [...SPIN_POOLS.Quality].sort((a, b) => b.length - a.length)[0];

    return (
        <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1px 6px',
            margin: '0 2px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '4px',
            color: '#60a5fa',
            fontWeight: 900,
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)',
            verticalAlign: 'middle',
            animation: isSpinning ? 'pulse-fast 0.1s infinite alternate' : 'none',
            overflow: 'hidden'
        }}>
            <span style={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>{longestStringInPool}</span>
            <span style={{ position: 'absolute', whiteSpace: 'nowrap' }}>{current}</span>
        </span>
    );
};

const SpinningNumber: React.FC<{ min: number, max: number, isSpinning: boolean }> = ({ min, max, isSpinning }) => {
    const [current, setCurrent] = useState(max);

    useEffect(() => {
        if (!isSpinning) return;

        const interval = setInterval(() => {
            const rangeSpan = Math.max(1, max - min);
            const randomVal = min + Math.floor(Math.random() * (rangeSpan + 1));
            setCurrent(randomVal);
        }, 30);

        return () => clearInterval(interval);
    }, [isSpinning, min, max]);

    return (
        <span style={{
            animation: isSpinning ? 'pulse-fast 0.05s infinite alternate' : 'none',
            display: 'inline-block',
            filter: isSpinning ? 'blur(0.5px)' : 'none'
        }}>
            {current}%
        </span>
    );
};
