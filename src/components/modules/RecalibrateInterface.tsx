
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, Meteorite } from '../../logic/core/types';
import { getMeteoriteImage, RARITY_COLORS, getPerkName, PerkFilter, getPerkParts, SPIN_POOLS, matchesPerk, getSpinPools, getMeteoriteColor } from './ModuleUtils';
import { playSfx } from '../../logic/audio/AudioLogic';
import { getUpgradeQualityCost, getRerollTypeCost, getRerollValueCost } from '../../logic/upgrades/RecalibrateLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';
import { calculateMeteoriteEfficiency } from '../../logic/upgrades/EfficiencyLogic';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';

const LEGENDARY_TYPES = ['All', 'Exis Forge', 'Apex Forge', 'Bastion Forge'];

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
    const QUALITIES = [tr.all, tr.qualities.new.toUpperCase(), tr.qualities.dam.toUpperCase(), tr.qualities.bro.toUpperCase(), tr.qualities.cor?.toUpperCase() || 'COR'];
    const ARENAS = [tr.all, tr.sectors.s1, tr.sectors.s2, tr.sectors.s3];
    const FOUND_IN_ARENAS = [tr.all, tr.arenas.eco, tr.arenas.com, tr.arenas.def];
    const LEGENDARY_TYPES = [tr.all, tr.legendary.eco, tr.legendary.com, tr.legendary.def];

    // Local state removed - lifted to parent


    const rarityColor = RARITY_COLORS[item.rarity];
    const quality = item.quality || 'Broken';

    const qualityCost = getUpgradeQualityCost(item);
    const canUpgradeQuality = quality === 'Broken' || quality === 'Damaged';
    const canAffordQuality = gameState.player.isotopes >= qualityCost;

    const diamondIdx = gameState.moduleSockets.diamonds.indexOf(item);
    const efficiency = calculateMeteoriteEfficiency(gameState, diamondIdx);

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

            <div style={{ flex: 1, padding: '0px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', zIndex: 5, overflow: 'hidden' }}>

                {/* CENTRAL UNIT HUD - COMPACT HORIZONTAL LAYOUT */}
                <div style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.85) 100%)',
                    borderRadius: '0px',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.6), inset 0 0 25px ${rarityColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '97px',
                    flexShrink: 0
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `linear-gradient(to right, ${rarityColor}15, transparent)`,
                        pointerEvents: 'none'
                    }} />

                    {/* LEFT: ICON SECTION */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{
                            position: 'relative',
                            width: '70px', height: '70px',
                            background: 'rgba(0,0,0,0.6)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `2px solid ${rarityColor}aa`,
                            boxShadow: `0 0 20px ${rarityColor}44, inset 0 0 10px ${rarityColor}22`
                        }}>
                            <div style={{
                                position: 'absolute', inset: -10,
                                border: `1px solid ${rarityColor}22`,
                                borderRadius: '50%',
                                animation: 'spin-slow 2s infinite linear'
                            }} />
                            <div style={{
                                position: 'absolute', inset: -6,
                                border: `1px dashed ${rarityColor}33`,
                                borderRadius: '50%',
                                animation: 'spin-reverse 5s infinite linear'
                            }} />

                            <img
                                src={getMeteoriteImage(item)}
                                style={{ width: '52px', height: '52px', objectFit: 'contain', filter: `drop-shadow(0 0 15px ${rarityColor})`, animation: 'heroPulse 4s ease-in-out infinite' }}
                                alt="loaded unit"
                            />
                            {/* Status badge row on icon: C → I → H */}
                            {(item.isCorrupted || (item.incubatorBoost || 0) > 0 || (item as any).blueprintBoosted) && (
                                <div style={{
                                    position: 'absolute', top: '-4px', left: '-4px',
                                    display: 'flex', flexDirection: 'row', gap: '2px',
                                    zIndex: 5
                                }}>
                                    {item.isCorrupted && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid #991b1b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(153,27,27,0.6)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#dc2626', lineHeight: 1 }}>C</span>
                                        </div>
                                    )}
                                    {(item.incubatorBoost || 0) > 0 && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid rgba(0, 217, 255, 0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(0, 217, 255, 0.4)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                        </div>
                                    )}
                                    {(item as any).blueprintBoosted && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid rgba(96, 165, 250, 0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(96, 165, 250, 0.4)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: DATA SECTION */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, minWidth: 0 }}>
                        {/* TOP ROW: NAME & POWER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{
                                    color: '#fff',
                                    fontSize: '15px',
                                    fontWeight: 950,
                                    margin: 0,
                                    letterSpacing: '1px',
                                    textShadow: `0 0 15px ${rarityColor}aa`,
                                }}>
                                    {(t.meteorites.rarities[item.rarity as keyof typeof t.meteorites.rarities] || t.meteorites.rarities.anomalous).toUpperCase()}
                                </h2>

                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {item.isCorrupted && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', marginTop: '4px',
                                            padding: '1px 8px',
                                            background: 'rgba(153, 27, 27, 0.25)', color: '#fecaca',
                                            fontSize: '8px', fontWeight: 950, borderRadius: '3px',
                                            border: '1px solid rgba(153, 27, 27, 0.6)', letterSpacing: '1px'
                                        }}>
                                            {t.meteorites.stats.corrupted.toUpperCase()} <span style={{ opacity: 0.7, marginLeft: '3px' }}>+3%</span>
                                        </div>
                                    )}
                                    {(item.incubatorBoost || 0) > 0 && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', marginTop: '4px',
                                            padding: '1px 8px',
                                            background: 'rgba(0, 217, 255, 0.1)', color: '#00d9ff',
                                            fontSize: '8px', fontWeight: 950, borderRadius: '3px',
                                            border: '1px solid rgba(0, 217, 255, 0.4)', letterSpacing: '1px'
                                        }}>
                                            INCUB <span style={{ opacity: 0.7, marginLeft: '3px' }}>+{(item.incubatorBoost || 0)}%</span>
                                        </div>
                                    )}
                                    {(item as any).blueprintBoosted && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', marginTop: '4px',
                                            padding: '1px 8px',
                                            background: 'rgba(96, 165, 250, 0.15)', color: '#60a5fa',
                                            fontSize: '8px', fontWeight: 950, borderRadius: '3px',
                                            border: '1px solid rgba(96, 165, 250, 0.4)', letterSpacing: '1px'
                                        }}>
                                            HARM-V <span style={{ opacity: 0.7, marginLeft: '3px' }}>+2%</span>
                                        </div>
                                    )}
                                    {isBuffActive(gameState, 'MATRIX_OVERDRIVE') && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', marginTop: '4px',
                                            padding: '1px 8px',
                                            background: 'rgba(234, 88, 12, 0.15)', color: '#f97316',
                                            fontSize: '8px', fontWeight: 950, borderRadius: '3px',
                                            border: '1px solid rgba(234, 88, 12, 0.4)', letterSpacing: '1px'
                                        }}>
                                            MATR-X <span style={{ opacity: 0.7, marginLeft: '3px' }}>+{(efficiency.blueprintBoost * 100).toFixed(1).replace('.0', '')}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'baseline', gap: '4px', justifyContent: 'flex-end', marginTop: '12px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 950, letterSpacing: '1px' }}>V</span>
                                <span style={{ fontSize: '18px', fontWeight: 950, color: '#fff', lineHeight: 1, textShadow: `0 0 20px ${rarityColor}44` }}>
                                    {(item.version || 1.0).toFixed(1)}
                                </span>
                            </div>
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }} />

                        {/* BOTTOM ROW: REPAIR */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
                                    {canUpgradeQuality ? (
                                        <button
                                            disabled={!canAffordQuality}
                                            onClick={() => {
                                                playSfx('upgrade-confirm');
                                                onUpgradeQuality();
                                            }}
                                            style={{
                                                background: canAffordQuality ? 'linear-gradient(180deg, #ffffff, #cbd5e1)' : 'rgba(0,0,0,0.6)',
                                                color: canAffordQuality ? '#000' : 'rgba(255,255,255,0.2)',
                                                border: canAffordQuality ? `1px solid #fff` : '1px solid rgba(255,255,255,0.05)',
                                                padding: '3px 12px', borderRadius: '4px',
                                                fontSize: '9px', fontWeight: 950,
                                                cursor: canAffordQuality ? 'pointer' : 'not-allowed',
                                                boxShadow: canAffordQuality ? `0 0 15px rgba(255,255,255,0.15)` : 'none',
                                                transition: 'all 0.3s',
                                                textTransform: 'uppercase',
                                                opacity: canAffordQuality ? 1 : 0.6,
                                                clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)',
                                                whiteSpace: 'nowrap',
                                                textShadow: 'none'
                                            }}
                                        >
                                            {tr.repair} ({qualityCost} F)
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 950, letterSpacing: '1px' }}>✓ {tr.integrityMax.toUpperCase()}</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '60px', height: '4px', background: '#000', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{
                                            width: quality === 'Broken' ? '33%' : quality === 'Damaged' ? '66%' : '100%',
                                            height: '100%',
                                            background: quality === 'Broken' ? '#94a3b8' : quality === 'Damaged' ? '#cbd5e1' : '#ffffff',
                                        }} />
                                    </div>
                                    <span style={{
                                        fontSize: '8px',
                                        fontWeight: 950,
                                        color: quality === 'Broken' ? '#94a3b8' : quality === 'Damaged' ? '#cbd5e1' : '#ffffff',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {quality === 'Broken' ? tr.qualities.bro.toUpperCase() : quality === 'Damaged' ? tr.qualities.dam.toUpperCase() : tr.qualities.new.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PERK ARRAY - ENHANCED VISUALS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
                            {tr.hardwareArray}
                        </div>
                        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, rgba(255,255,255,0.1), transparent)' }} />
                    </div>

                    <div className="custom-scrollbar" style={{
                        flex: 1,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '6px'
                    }}>
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
                                const isRu = language === 'ru';
                                const mTrans = t.meteorites;
                                let processedPerk = text;

                                const getForgeName = (code: string) => {
                                    if (isRu) {
                                        if (code === 'Eco') return 'ЭКЗИС';
                                        if (code === 'Com') return 'ПРЕДЕЛ';
                                        if (code === 'Def') return 'БАСТИОН';
                                    } else {
                                        if (code === 'Eco') return 'EXIS';
                                        if (code === 'Com') return 'APEX';
                                        if (code === 'Def') return 'BASTION';
                                    }
                                    return code;
                                };

                                const getQualityName = (q: string) => {
                                    if (isRu) {
                                        if (q.toLowerCase() === 'damaged') return tr.qualities.dam;
                                        if (q.toLowerCase() === 'broken') return tr.qualities.bro;
                                        if (q.toLowerCase() === 'new') return tr.qualities.new;
                                    }
                                    return q;
                                };

                                // 1. Dual Forge Patterns (Lvl 5, 6)
                                processedPerk = processedPerk.replace(/(\s*(?:&|and|& connects|connects|and connects)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, conj, pref, q, p1, p2) => {
                                    const status = getQualityName(q);
                                    const f1 = getForgeName(p1);
                                    const f2 = getForgeName(p2);
                                    if (isRu) {
                                        const prefixStr = pref.toLowerCase().includes('secondary') ? 'вторичное соседство' : 'соседствует';
                                        return `${prefixStr} с ${status} метеоритом и усиляет кузню ${f1} и ${f2}`;
                                    } else {
                                        const prefixStr = conj ? pref.toLowerCase() : (pref.charAt(0).toUpperCase() + pref.toLowerCase().slice(1));
                                        return `${conj || ''}${prefixStr} a ${q} Meteorite. Empowering Forge ${f1} and ${f2}`;
                                    }
                                });

                                processedPerk = processedPerk.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\()\]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, sec, p1, p2) => {
                                    const f1 = getForgeName(p1);
                                    const f2 = getForgeName(p2);
                                    if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${f1} и ${f2}`;
                                    return `Located in Sector-${sec}. Empowering Forge ${f1} and ${f2}`;
                                });

                                // 2. Single Forge Patterns (Lvl 1)
                                processedPerk = processedPerk.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:neighboring|&|& connects|connects|and connects) an? [\[\(]?(Eco|Com|Def)[\]\)]?( Hex| ⬡| ⬢|)/gi, (match, sec, p1) => {
                                    const forge = getForgeName(p1);
                                    if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${forge}`;
                                    return `Located in Sector-${sec} and empowering Forge ${forge}`;
                                });

                                // 3. Generic Connects/Neighbors (Catch-all)
                                processedPerk = processedPerk.replace(/(\s*(?:&|and)\s+)?(& connects|connects|Connects|and connects|& neighboring|neighboring|Neighboring) (an? [\[\(]?(Eco|Com|Def)[\]\)]? (Hex|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]?)/gi, (match, conj, verb, rest, p1, h1, p2, p3, h2, p4, h3, p5) => {
                                    const f1Code = p1 || p2 || p4 || p5;
                                    const f2Code = p3;
                                    const forge1 = getForgeName(f1Code);
                                    const verbLower = verb.toLowerCase();

                                    if (verbLower.includes('neighbor')) {
                                        const prefix = conj ? 'neighboring' : 'Neighboring';
                                        if (f2Code) {
                                            const forge2 = getForgeName(f2Code);
                                            if (isRu) return `соседствует с кузней ${forge1} и ${forge2}`;
                                            return `${conj || ''}${prefix} Forge ${forge1} and ${forge2}`;
                                        }
                                        if (isRu) return `соседствует с кузней ${forge1}`;
                                        return `${conj || ''}${prefix} Forge ${forge1}`;
                                    }

                                    if (f2Code) {
                                        const forge2 = getForgeName(f2Code);
                                        if (isRu) return `и усиляет кузню ${forge1} и ${forge2}`;
                                        return `Empowering Forge ${forge1} and ${forge2}`;
                                    }
                                    if (isRu) return `и усиляет кузню ${forge1}`;
                                    // If preceded by sector info, add 'and'
                                    const prefix = (conj || match.toLowerCase().includes('and') || processedPerk.toLowerCase().includes('located in sector')) ? 'and empowering' : 'Empowering';
                                    return `${prefix} Forge ${forge1}`;
                                });

                                processedPerk = processedPerk.replace(/(\s*(?:&|and)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite/gi, (match, conj, pref, q) => {
                                    const status = getQualityName(q);
                                    if (isRu) {
                                        const prefixStr = pref.toLowerCase().includes('secondary') ? 'вторичное соседство' : 'соседствует';
                                        return `${prefixStr} с ${status} метеоритом`;
                                    }
                                    const prefixStr = conj ? pref.toLowerCase() : (pref.charAt(0).toUpperCase() + pref.toLowerCase().slice(1));
                                    return `${conj || ''}${prefixStr} a ${q} Meteorite`;
                                });

                                // 4. Found in
                                processedPerk = processedPerk.replace(/found in (Economic|Combat|Defence) Arena/gi, (match, a) => {
                                    if (isRu) {
                                        const arena = a.toLowerCase().includes('eco') ? mTrans.stats.economicArena : a.toLowerCase().includes('com') ? mTrans.stats.combatArena : mTrans.stats.defenceArena;
                                        return `найден в ${arena}`;
                                    }
                                    return `found in ${a} Arena`;
                                });

                                // 5. Cleanup
                                if (isRu) {
                                    processedPerk = processedPerk
                                        .replace(/Located in Sector-(\d+)/gi, 'Находится в Сектор-$1')
                                        .replace(/located in Sector-(\d+)/gi, 'найден в Сектор-$1')
                                        .replace(/Sector-(\d+)/gi, 'Сектор-$1')
                                        .replace(/Broken Meteorite/gi, `${tr.qualities.bro} метеорит`)
                                        .replace(/Damaged Meteorite/gi, `${tr.qualities.dam} метеорит`)
                                        .replace(/New Meteorite/gi, `${tr.qualities.new} метеорит`)
                                        .replace(/\bLocated in\b/gi, 'Находится в')
                                        .replace(/\band\b/gi, 'и')
                                        .replace(/&/g, 'и')
                                        .replace(/\bEco\b/gi, 'Экзис')
                                        .replace(/\bCom\b/gi, 'Предел')
                                        .replace(/\bDef\b/gi, 'Бастион');

                                    // Explicitly fix common missing-and patterns
                                    processedPerk = processedPerk.replace(/(Сектор-\d+)\s+усиляет/gi, '$1 и усиляет');

                                    // Join descriptors in RU: Search for nouns followed by verbs and bridge them with 'и'
                                    processedPerk = processedPerk.replace(/(Сектор-\d+|метеоритом|метеорит)\.?[\s\u00A0]*(и\s+)?(усиляет|Усиляет|найден|соседствует|вторичное)/gi, (match, obj, hasAnd, verb) => {
                                        const v = verb.toLowerCase();
                                        let joinVerb = v;
                                        if (v.includes('усиляет')) joinVerb = 'усиляет';
                                        else if (v.includes('соседствует')) joinVerb = 'соседствует';
                                        else if (v.includes('вторичное')) joinVerb = 'вторичное соседство';
                                        else joinVerb = 'найден';

                                        return `${obj} и ${joinVerb}`;
                                    });

                                    // Final cleanup for dot-and-verb leftover patterns
                                    processedPerk = processedPerk.replace(/\.[\s\u00A0]+и усиляет/g, ' и усиляет').replace(/\.[\s\u00A0]+усиляет/g, ' и усиляет');
                                } else {
                                    processedPerk = processedPerk
                                        .replace(/Sector-01/gi, mTrans.stats.sector01)
                                        .replace(/Sector-02/gi, mTrans.stats.sector02)
                                        .replace(/Sector-03/gi, mTrans.stats.sector03)
                                        .replace(/\bEco\b/gi, 'Exis')
                                        .replace(/\bCom\b/gi, 'Apex')
                                        .replace(/\bDef\b/gi, 'Bastion')
                                        .replace(/&/g, 'and');

                                    // Join descriptors in EN
                                    processedPerk = processedPerk.replace(/((?:Sector-\d+|SECTOR-\d+)|Meteorite)\s+(found)/gi, '$1 and $2')
                                        .replace(/Located in ((?:Sector-\d+|SECTOR-\d+))\s+and/gi, 'Located in $1 and');
                                }

                                processedPerk = processedPerk.trim();
                                if (processedPerk.length > 0) {
                                    // Handle logic segments: neighboring after a period
                                    processedPerk = processedPerk.replace(/\. neighboring/g, '. Neighboring');
                                    // Start of string
                                    processedPerk = processedPerk.charAt(0).toUpperCase() + processedPerk.slice(1);
                                }
                                return processedPerk;
                            };

                            const renderDescription = () => {
                                const count = efficiency.perkResults[p.id]?.count || 0;
                                const translatedDesc = formatPerkDescription(p.description) + (count > 1 ? ` (x${count})` : '');
                                const parts = getPerkParts(p.id, language);
                                if (parts.length === 0) {
                                    return applyHighlighting(translatedDesc);
                                }

                                const isActuallySpinning = isSpinningPerks && !lockedIndices.includes(idx);

                                // Build localized spin pools so SpinningWord doesn't fall back to ERROR/---
                                const trR = tr;
                                const mTrans = t.meteorites;
                                const localizedPools = {
                                    Sector: [trR.sectors.s1, trR.sectors.s2, trR.sectors.s3],
                                    Arena: [mTrans.stats.economicArena, mTrans.stats.combatArena, mTrans.stats.defenceArena],
                                    Legendary: [trR.legendary.eco.toUpperCase(), trR.legendary.com.toUpperCase(), trR.legendary.def.toUpperCase()],
                                    Quality: [trR.qualities.bro, trR.qualities.dam, trR.qualities.new],
                                };

                                const getLocalizedPool = (word: string): string[] => {
                                    if (localizedPools.Sector.includes(word)) return localizedPools.Sector;
                                    if (localizedPools.Arena.includes(word)) return localizedPools.Arena;
                                    if (localizedPools.Legendary.includes(word) || ['EXIS', 'APEX', 'BASTION', 'ЭКЗИС', 'ПРЕДЕЛ', 'БАСТИОН'].includes(word.toUpperCase())) return localizedPools.Legendary;
                                    if (localizedPools.Quality.map(q => q.toLowerCase()).includes(word.toLowerCase())) return localizedPools.Quality;
                                    // Also check SPIN_POOLS (English fallback)
                                    if (SPIN_POOLS.Sector.includes(word)) return SPIN_POOLS.Sector;
                                    if (SPIN_POOLS.Arena.includes(word)) return SPIN_POOLS.Arena;
                                    if (SPIN_POOLS.Legendary.includes(word)) return SPIN_POOLS.Legendary;
                                    if (SPIN_POOLS.Quality.includes(word)) return SPIN_POOLS.Quality;
                                    return [word]; // just show the word itself, no random cycling
                                };

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
                                                    const color = getHighlightColor(part);
                                                    nextRes.push(<SpinningWord key={part + i} target={part} pool={getLocalizedPool(part)} chipColor={color} isSpinning={isActuallySpinning} />);
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

                            const getHighlightColor = (word: string) => {
                                const w = word.toUpperCase();
                                // Sectors (Purple Variations - Brightened)
                                if (w.includes('01') || w.includes('SECTOR-01') || w.includes('СЕКТОР-01')) return '#e9d5ff';
                                if (w.includes('02') || w.includes('SECTOR-02') || w.includes('СЕКТОР-02')) return '#c084fc';
                                if (w.includes('03') || w.includes('SECTOR-03') || w.includes('СЕКТОР-03')) return '#a855f7';
                                // Arenas
                                if (w.includes('ECONOMIC') || w.includes('ЭКОНОМИЧ')) return '#fbbf24';
                                if (w.includes('COMBAT') || w.includes('БОЕВ')) return '#ef4444';
                                if (w.includes('DEFENCE') || w.includes('ЗАЩИТН') || w.includes('ОБОРОНИТ')) return '#3b82f6';
                                // Forges
                                if (w.includes('EXIS') || w.includes('ЭКЗИС')) return '#d946ef';
                                if (w.includes('APEX') || w.includes('ПРЕДЕЛ')) return '#fb923c';
                                if (w.includes('BASTION') || w.includes('БАСТИОН')) return '#22d3ee';
                                // Statuses (White/Grey Theme - Higher Contrast)
                                if (w.includes('NEW') || w.includes('НОВЫЙ')) return '#ffffff';
                                if (w.includes('DAMAGED') || w.includes('ПОВРЕЖДЕН')) return '#cbd5e1';
                                if (w.includes('BROKEN') || w.includes('СЛОМАН')) return '#94a3b8';
                                if (w.startsWith('(X')) return '#fb923c'; // Multiplier Orange
                                return rarityColor;
                            };

                            const applyHighlighting = (text: string) => {
                                const mTrans = t.meteorites;
                                const keywords = [
                                    mTrans.stats.sector01, mTrans.stats.sector02, mTrans.stats.sector03,
                                    mTrans.stats.economicArena, mTrans.stats.combatArena, mTrans.stats.defenceArena,
                                    'Exis', 'Apex', 'Bastion',
                                    'Экзис', 'Предел', 'Бастион',
                                    'НОВЫЙ', 'ПОВРЕЖДЕН', 'СЛОМАН', 'ИСКАЖЕН',
                                    'Sector-01', 'Sector-02', 'Sector-03',
                                    'Damaged', 'Broken', 'New',
                                    'СЕКТОР-01', 'СЕКТОР-02', 'СЕКТОР-03',
                                    '(x2)', '(x3)', '(x4)', '(x5)', '(x6)'
                                ];

                                const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
                                return text.split(regex).filter(Boolean).map((part, i) => {
                                    const isKeyword = keywords.some(k => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part));
                                    if (isKeyword) {
                                        const color = getHighlightColor(part);
                                        return (
                                            <span key={i} style={{
                                                display: 'inline-block',
                                                padding: '0px 5px',
                                                borderRadius: '3px',
                                                fontSize: '8px',
                                                fontWeight: 900,
                                                fontStyle: 'normal',
                                                letterSpacing: '0.5px',
                                                verticalAlign: 'middle',
                                                margin: '0 1px',
                                                lineHeight: '14px',
                                                color: color,
                                                background: `${color}18`,
                                                border: `1px solid ${color}55`,
                                                boxShadow: `0 0 8px ${color}22`,
                                            }}>{part.toUpperCase()}</span>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                });
                            };



                            return (
                                <div key={idx}
                                    style={{
                                        display: 'flex', flexDirection: 'column',
                                        padding: '7px 10px',
                                        background: isLocked ? 'rgba(251, 191, 36, 0.05)' : 'rgba(15, 23, 42, 0.5)',
                                        border: `1px solid ${isLocked ? 'rgba(251, 191, 36, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: '6px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isLocked && <div style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '100%', background: '#fbbf24' }} />}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                        <div
                                            onClick={(e) => { e.stopPropagation(); onToggleLock(idx); }}
                                            style={{
                                                width: '23px', height: '23px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isLocked ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isLocked ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: isLocked ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                                                fontSize: '11px',
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
                                            <div style={{ fontSize: '14px', fontWeight: 900, color: effColor, textShadow: `0 0 10px ${effColor}44` }}>
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
                                        paddingTop: '5px',
                                        borderTop: '1px solid rgba(255,255,255,0.05)',
                                        fontStyle: 'italic'
                                    }}>
                                        {renderDescription()}
                                    </div>

                                    {/* FILTER CONFIG PANEL - Show if EXPANDED */}
                                    {
                                        isExpanded && config && (
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
                                        )
                                    }
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BOTTOM CONSOLE: REROLL ACTIONS */}
                <div style={{ marginTop: 'auto', padding: '0 8px 6px 8px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
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
                                        {tr.roll.toUpperCase()} #{autoRollCount} · {rerollTypeCost.toLocaleString()} {t.matrix.flux.toUpperCase()}/ea
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '12px' }}>{hasActiveFilters ? `⟳ ${tr.autoReroll.toUpperCase()}` : tr.rerollPerks.toUpperCase()}</span>
                                    <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollTypeCost.toLocaleString()} {t.matrix.flux.toUpperCase()}{hasActiveFilters ? ` · ${tr.seeksFilter.toUpperCase()}` : ''}</span>
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
                            <span style={{ fontSize: '8px', opacity: 0.6 }}>{rerollValueCost.toLocaleString()} {t.matrix.flux.toUpperCase()}</span>
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

                    @keyframes reroll-pulse {
                        from { box-shadow: 0 0 10px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.4); }
                        to { box-shadow: 0 0 28px rgba(168, 85, 247, 0.6), inset 0 0 16px rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.9); }
                    }
                `}</style>
            </div>
        </div >
    );
};

const SpinningWord: React.FC<{ target: string, isSpinning: boolean, pool?: string[], chipColor?: string }> = ({ target, isSpinning, pool: poolProp, chipColor = '#60a5fa' }) => {
    const { language } = useLanguage();
    const [current, setCurrent] = useState(target);

    useEffect(() => {
        if (!isSpinning) {
            setCurrent(target);
            return;
        }

        const localizedPools = getSpinPools(language);
        let pool: string[];
        if (poolProp && poolProp.length > 0) {
            pool = poolProp;
        } else if (localizedPools.Sector.includes(target)) pool = localizedPools.Sector;
        else if (localizedPools.Arena.includes(target)) pool = localizedPools.Arena;
        else if (localizedPools.Legendary.includes(target)) pool = localizedPools.Legendary;
        else if (localizedPools.Quality.includes(target)) pool = localizedPools.Quality;
        else pool = [target];

        const interval = setInterval(() => {
            setCurrent(pool[Math.floor(Math.random() * pool.length)]);
        }, 60);

        return () => clearInterval(interval);
    }, [isSpinning, target, poolProp, language]);

    const localizedPools = getSpinPools(language);
    const allPoolItems = poolProp && poolProp.length > 0 ? poolProp : (
        localizedPools.Sector.includes(target) ? localizedPools.Sector :
            localizedPools.Arena.includes(target) ? localizedPools.Arena :
                localizedPools.Legendary.includes(target) ? localizedPools.Legendary :
                    localizedPools.Quality.includes(target) ? localizedPools.Quality : [target]
    );
    const longestStringInPool = [...allPoolItems].sort((a, b) => b.length - a.length)[0] || target;

    return (
        <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1px 6px',
            margin: '0 2px',
            background: `${chipColor}18`,
            border: `1px solid ${chipColor}55`,
            borderRadius: '4px',
            color: chipColor,
            fontWeight: 900,
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            boxShadow: `0 0 10px ${chipColor}33`,
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
