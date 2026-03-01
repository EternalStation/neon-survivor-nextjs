import React, { useMemo } from 'react';
import type { GameState, Meteorite } from '../logic/core/types';
import { getMeteoriteImage, RARITY_COLORS, getPerkName, getPerkParts, getMeteoriteColor } from './modules/ModuleUtils';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { isBuffActive } from '../logic/upgrades/BlueprintLogic';

interface MeteoriteTooltipProps {
    meteorite: Meteorite;
    gameState: GameState;
    meteoriteIdx?: number;
    x: number;
    y: number;
    isInteractive?: boolean;
    isEmbedded?: boolean;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
}

export const MeteoriteTooltip: React.FC<MeteoriteTooltipProps> = ({
    meteorite, gameState, meteoriteIdx = -1, x, y,
    isInteractive,
    isEmbedded,
    onMouseEnter, onMouseLeave
}) => {
    const { language } = useLanguage();
    const isRu = language === 'ru';
    const t = getUiTranslation(language);
    const mTrans = t.meteorites;
    const rarityColor = RARITY_COLORS[meteorite.rarity];
    const infoName = mTrans.rarities[meteorite.rarity as keyof typeof mTrans.rarities] || mTrans.rarities.anomalous;

    const formatPerkDescription = (description: string) => {
        const isRu = language === 'ru';
        let text = description;

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
                if (q.toLowerCase() === 'damaged') return t.meteorites.stats.damaged;
                if (q.toLowerCase() === 'broken') return t.meteorites.stats.broken;
                if (q.toLowerCase() === 'new') return t.meteorites.stats.new;
            }
            return q;
        };

        // 1. Dual Forge Patterns (Lvl 5, 6)
        text = text.replace(/(\s*(?:&|and|& connects|connects|and connects)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, conj, pref, q, p1, p2) => {
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

        text = text.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\()\]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, sec, p1, p2) => {
            const f1 = getForgeName(p1);
            const f2 = getForgeName(p2);
            if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${f1} и ${f2}`;
            return `Located in Sector-${sec}. Empowering Forge ${f1} and ${f2}`;
        });

        // 2. Single Forge Patterns (Lvl 1)
        text = text.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:neighboring|&|& connects|connects|and connects) an? [\[\(]?(Eco|Com|Def)[\]\)]?( Hex| ⬡| ⬢|)/gi, (match, sec, p1) => {
            const forge = getForgeName(p1);
            if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${forge}`;
            return `Located in Sector-${sec} and empowering Forge ${forge}`;
        });

        // 3. Generic Connects/Neighbors (Catch-all)
        text = text.replace(/(\s*(?:&|and)\s+)?(& connects|connects|Connects|and connects|& neighboring|neighboring|Neighboring) (an? [\[\(]?(Eco|Com|Def)[\]\)]? (Hex|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]?)/gi, (match, conj, verb, rest, p1, h1, p2, p3, h2, p4, h3, p5) => {
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
                if (isRu) return `усиляет кузню ${forge1} и ${forge2}`;
                return `Empowering Forge ${forge1} and ${forge2}`;
            }
            if (isRu) return `усиляет кузню ${forge1}`;
            // If preceded by sector info, add 'and'
            const prefix = (conj || match.toLowerCase().includes('and') || text.toLowerCase().includes('located in sector')) ? 'and empowering' : 'Empowering';
            return `${prefix} Forge ${forge1}`;
        });

        text = text.replace(/(\s*(?:&|and)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite/gi, (match, conj, pref, q) => {
            const status = getQualityName(q);
            if (isRu) {
                const prefixStr = pref.toLowerCase().includes('secondary') ? 'вторичное соседство' : 'соседствует';
                return `${prefixStr} с ${status} метеоритом`;
            }
            const prefixStr = conj ? pref.toLowerCase() : (pref.charAt(0).toUpperCase() + pref.toLowerCase().slice(1));
            return `${conj || ''}${prefixStr} a ${q} Meteorite`;
        });

        // 4. Found in
        text = text.replace(/found in (Economic|Combat|Defence) Arena/gi, (match, a) => {
            if (isRu) {
                const arena = a.toLowerCase().includes('eco') ? mTrans.stats.economicArena : a.toLowerCase().includes('com') ? mTrans.stats.combatArena : mTrans.stats.defenceArena;
                return `найден в ${arena}`;
            }
            return `found in ${a} Arena`;
        });

        // 5. Cleanup
        if (isRu) {
            text = text
                .replace(/Located in Sector-(\d+)/gi, 'Находится в Сектор-$1')
                .replace(/located in Sector-(\d+)/gi, 'найден в Сектор-$1')
                .replace(/Sector-(\d+)/gi, 'Сектор-$1')
                .replace(/Broken Meteorite/gi, `${t.meteorites.stats.broken} метеорит`)
                .replace(/Damaged Meteorite/gi, `${t.meteorites.stats.damaged} метеорит`)
                .replace(/New Meteorite/gi, `${t.meteorites.stats.new} метеорит`)
                .replace(/\bLocated in\b/gi, 'Находится в')
                .replace(/\band\b/gi, 'и')
                .replace(/&/g, 'и');

            // Explicitly fix common missing-and patterns
            text = text.replace(/(Сектор-\d+)\s+усиляет/gi, '$1 и усиляет');

            // Join descriptors in RU: Search for nouns followed by verbs and bridge them with 'и'
            text = text.replace(/(Сектор-\d+|метеоритом|метеорит)\.?[\s\u00A0]*(и\s+)?(усиляет|Усиляет|найден|соседствует|вторичное)/gi, (match, obj, hasAnd, verb) => {
                const v = verb.toLowerCase();
                let joinVerb = v;
                if (v.includes('усиляет')) joinVerb = 'усиляет';
                else if (v.includes('соседствует')) joinVerb = 'соседствует';
                else if (v.includes('вторичное')) joinVerb = 'вторичное соседство';
                else joinVerb = 'найден';

                return `${obj} и ${joinVerb}`;
            });

            // Final cleanup for dot-and-verb leftover patterns
            text = text.replace(/\.[\s\u00A0]+и усиляет/g, ' и усиляет').replace(/\.[\s\u00A0]+усиляет/g, ' и усиляет');
        } else {
            text = text
                .replace(/Sector-01/gi, mTrans.stats.sector01)
                .replace(/Sector-02/gi, mTrans.stats.sector02)
                .replace(/Sector-03/gi, mTrans.stats.sector03)
                .replace(/&/g, 'and');

            // Join descriptors in EN
            text = text.replace(/((?:Sector-\d+|SECTOR-\d+)|Meteorite)\s+(found)/gi, '$1 and $2')
                .replace(/Located in ((?:Sector-\d+|SECTOR-\d+))\s+and/gi, 'Located in $1 and');
        }

        text = text.trim();
        if (text.length > 0) {
            text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        return text;
    };

    const applyHighlighting = (text: string) => {
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
                        whiteSpace: 'nowrap'
                    }}>{part.toUpperCase()}</span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const efficiency = useMemo(() => {
        return meteoriteIdx !== -1
            ? calculateMeteoriteEfficiency(gameState, meteoriteIdx)
            : { totalBoost: 0, perkResults: {} as Record<string, any>, blueprintBoost: 0 };
    }, [gameState, meteoriteIdx]);

    const activeStatsCount = meteorite.perks ? meteorite.perks.length : 0;
    const CARD_WIDTH = isEmbedded ? '100%' : 320;
    const CARD_HEIGHT = isEmbedded ? 'auto' : 310 + (activeStatsCount * 65);
    const OFFSET = 20;

    let finalX = x + OFFSET;
    const getQualityColor = (quality: string | undefined) => {
        const q = quality?.toLowerCase();
        if (q === 'new') return '#ffffff';      // White
        if (q === 'damaged') return '#cbd5e1';  // Light grey
        if (q === 'broken') return '#94a3b8';   // Medium grey
        return rarityColor;
    };

    const finalY = (window.innerHeight - (typeof CARD_HEIGHT === 'number' ? CARD_HEIGHT : 400)) / 2;

    if (!isEmbedded && finalX + (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 320) > window.innerWidth) {
        finalX = x - (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 320) - OFFSET;
    }

    const tooltipStyle: React.CSSProperties = isEmbedded ? {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'none'
    } : {
        position: 'fixed',
        left: finalX,
        top: finalY,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        zIndex: 10000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        animation: 'cardEntry 0.3s ease-out forwards'
    };

    return (
        <div
            id="meteorite-tooltip"
            style={tooltipStyle}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <style>
                {`
                    @keyframes cardEntry {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes heroPulse {
                        0%, 100% { transform: scale(1); filter: drop-shadow(0 0 20px ${rarityColor}44); }
                        50% { transform: scale(1.05); filter: drop-shadow(0 0 40px ${rarityColor}88); }
                    }
                `}
            </style>

            {/* Main tooltip content */}
            <div style={{
                background: isEmbedded ? 'transparent' : '#0a0a0f',
                backgroundImage: isEmbedded ? 'none' : `
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                backdropFilter: isEmbedded ? 'none' : 'blur(16px)',
                border: isEmbedded ? 'none' : `1px solid ${rarityColor}55`,
                boxShadow: isEmbedded ? 'none' : `0 30px 60px rgba(0,0,0,0.8), inset 0 0 30px ${rarityColor}11`,
                borderRadius: '8px',
                height: isEmbedded ? '100%' : '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header (Integrated Compact Design) */}
                <div style={{
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.85) 100%)',
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
                                src={getMeteoriteImage(meteorite)}
                                style={{ width: '52px', height: '52px', objectFit: 'contain', filter: `drop-shadow(0 0 15px ${rarityColor})`, animation: 'heroPulse 4s ease-in-out infinite' }}
                                alt="loaded unit"
                            />
                            {/* Status micro-badge row: C → I → H → M */}
                            {(meteorite.isCorrupted || (meteorite.incubatorBoost || 0) > 0 || (meteorite as any).blueprintBoosted || isBuffActive(gameState, 'MATRIX_OVERDRIVE')) && (
                                <div style={{
                                    position: 'absolute', top: '-4px', left: '-4px',
                                    display: 'flex', flexDirection: 'row', gap: '2px',
                                    zIndex: 5
                                }}>
                                    {meteorite.isCorrupted && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid #991b1b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(153,27,27,0.6)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#dc2626', lineHeight: 1 }}>C</span>
                                        </div>
                                    )}
                                    {(meteorite.incubatorBoost || 0) > 0 && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid #0ea5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(14,165,233,0.5)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                        </div>
                                    )}
                                    {(meteorite as any).blueprintBoosted && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid #3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(96,165,250,0.5)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                        </div>
                                    )}
                                    {isBuffActive(gameState, 'MATRIX_OVERDRIVE') && (
                                        <div style={{ width: '14px', height: '14px', background: '#0a0f18', border: '1px solid #ea580c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(234,88,12,0.5)' }}>
                                            <span style={{ fontSize: '8px', fontWeight: 950, color: '#f97316', lineHeight: 1 }}>M</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: DATA SECTION */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, minWidth: 0 }}>
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
                                    {infoName.toUpperCase()}
                                </h2>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    {meteorite.isCorrupted && (
                                        <div style={{
                                            background: 'rgba(153, 27, 27, 0.15)',
                                            color: '#ef4444',
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            border: '1px solid rgba(153, 27, 27, 0.4)',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {mTrans.stats.corrupted} <span style={{ opacity: 0.7 }}>+3%</span>
                                        </div>
                                    )}
                                    {(meteorite.incubatorBoost || 0) > 0 && (
                                        <div style={{
                                            background: 'rgba(0, 217, 255, 0.1)',
                                            color: '#00d9ff',
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            border: '1px solid rgba(0, 217, 255, 0.4)',
                                            letterSpacing: '0.5px'
                                        }}>
                                            INCUB +{meteorite.incubatorBoost}%
                                        </div>
                                    )}
                                    {(meteorite as any).blueprintBoosted && (
                                        <div style={{
                                            background: 'rgba(96, 165, 250, 0.15)',
                                            color: '#60a5fa',
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            border: '1px solid rgba(96, 165, 250, 0.4)',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase'
                                        }}>
                                            HARM-V <span style={{ opacity: 0.7 }}>+2%</span>
                                        </div>
                                    )}
                                    {isBuffActive(gameState, 'MATRIX_OVERDRIVE') && (
                                        <div style={{
                                            background: 'rgba(234, 88, 12, 0.15)',
                                            color: '#f97316',
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            fontSize: '7px',
                                            fontWeight: 900,
                                            border: '1px solid rgba(234, 88, 12, 0.4)',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase'
                                        }}>
                                            MATR-X <span style={{ opacity: 0.7 }}>+{(efficiency.blueprintBoost * 100).toFixed(1).replace('.0', '')}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', fontWeight: 900, letterSpacing: '2px', marginBottom: '2px' }}>
                                    {language === 'ru' ? 'ВЕРСИЯ' : 'VERSION'}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 950, color: '#fff', lineHeight: 1, textShadow: `0 0 20px ${rarityColor}44` }}>
                                    {(meteorite.version || 1.0).toFixed(1)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HARDWARE ARRAY divider - matches Recalibrate style */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase' }}>
                        {t.recalibrate.hardwareArray}
                    </div>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(270deg, rgba(255,255,255,0.1), transparent)' }} />
                </div>

                <div style={{
                    padding: '2px 10px 8px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    {meteorite.perks && meteorite.perks.map((perk, i) => {
                        const val = perk.value + (meteorite.incubatorBoost || 0);
                        const rangeSpan = perk.range.max - perk.range.min;
                        const pos = rangeSpan > 0 ? (perk.value - perk.range.min) / rangeSpan : 1;
                        const effColor = pos < 0.3 ? '#f87171' : pos < 0.7 ? '#fbbf24' : '#34d399';

                        return (
                            <div key={i} style={{
                                display: 'flex', flexDirection: 'column',
                                padding: '7px 10px',
                                background: 'rgba(15, 23, 42, 0.5)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '6px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>
                                        {getPerkName(perk.id, language).toUpperCase()}
                                    </span>

                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                        [{perk.range.min + (meteorite.incubatorBoost || 0)}-{perk.range.max + (meteorite.incubatorBoost || 0)}%]
                                    </span>

                                    <div style={{ flex: 1 }} />

                                    <div style={{ fontSize: '14px', fontWeight: 900, color: effColor, textShadow: `0 0 10px ${effColor}44` }}>
                                        {val}%
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
                                    {applyHighlighting(
                                        formatPerkDescription(perk.description) +
                                        ((efficiency.perkResults[perk.id]?.count > 1) ? ` (x${efficiency.perkResults[perk.id].count})` : '')
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FOOTER: TYPE & FOUND IN - LARGE CONSOLE STYLE */}
                <div style={{
                    padding: '8px 12px 12px',
                    display: 'flex',
                    gap: '10px',
                    marginTop: 'auto',
                    flexShrink: 0
                }}>
                    {/* FOUND IN LABEL */}
                    <div style={{
                        flex: 1,
                        height: '46px',
                        background: `${getMeteoriteColor(meteorite.discoveredIn)}12`,
                        border: `1px solid ${getMeteoriteColor(meteorite.discoveredIn)}`,
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        boxShadow: `0 0 10px ${getMeteoriteColor(meteorite.discoveredIn)}22`,
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>
                            {t.recalibrate.filterLabels.foundIn.toUpperCase()}
                        </span>
                        <span style={{
                            color: getMeteoriteColor(meteorite.discoveredIn),
                            fontSize: '11px',
                            fontWeight: 950,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            textShadow: `0 0 10px ${getMeteoriteColor(meteorite.discoveredIn)}66`
                        }}>
                            {(meteorite.discoveredIn?.toUpperCase().includes('FORGE') || meteorite.discoveredIn?.toUpperCase().includes('LEGENDARY')) ? (
                                meteorite.discoveredIn?.includes('Eco') ? t.matrix.legendaryDetail.exisOrigin :
                                    meteorite.discoveredIn?.includes('Com') ? t.matrix.legendaryDetail.apexOrigin :
                                        t.matrix.legendaryDetail.bastionOrigin
                            ) : (
                                meteorite.discoveredIn?.includes('Eco') ? mTrans.stats.economicArena :
                                    meteorite.discoveredIn?.includes('Com') ? mTrans.stats.combatArena :
                                        mTrans.stats.defenceArena
                            )}
                        </span>
                    </div>

                    {/* CONDITION LABEL */}
                    <div style={{
                        flex: 1,
                        height: '46px',
                        background: `${getQualityColor(meteorite.quality)}12`,
                        border: `1px solid ${getQualityColor(meteorite.quality)}`,
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        boxShadow: `0 0 10px ${getQualityColor(meteorite.quality)}22`,
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', fontWeight: 900, letterSpacing: '1.5px' }}>
                            {language === 'ru' ? 'СОСТОЯНИЕ' : 'CONDITION'}
                        </span>
                        <span style={{
                            color: getQualityColor(meteorite.quality),
                            fontSize: '11px',
                            fontWeight: 950,
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                            textShadow: `0 0 10px ${getQualityColor(meteorite.quality)}66`
                        }}>
                            {isRu ? (
                                meteorite.quality?.toLowerCase() === 'broken' ? mTrans.stats.broken :
                                    meteorite.quality?.toLowerCase() === 'damaged' ? mTrans.stats.damaged :
                                        mTrans.stats.new
                            ) : (
                                meteorite.quality?.toUpperCase() || 'NEW'
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
