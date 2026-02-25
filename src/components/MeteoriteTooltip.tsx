import React from 'react';
import type { GameState, Meteorite, MeteoriteRarity, Blueprint } from '../logic/core/types';
import './MeteoriteTooltip.css';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getPerkName, getPerkIcon } from './modules/ModuleUtils';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

interface MeteoriteTooltipProps {
    meteorite: Meteorite;
    gameState: GameState;
    meteoriteIdx?: number; // Optional index if placed in socket
    x: number;
    y: number;
    isInteractive?: boolean;
    isEmbedded?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const RARITY_COLORS: Record<string, string> = {
    // Removed legacy rarities to match MeteoriteRarity type
    anomalous: '#60a5fa', // Blue (Anomalous)
    radiant: '#FFD700',
    void: '#8B0000',
    abyss: '#8B0000', // Legacy alias for void
    eternal: '#B8860B',
    divine: '#FFFFFF',
    singularity: '#E942FF'
};

const getMeteoriteImage = (m: Meteorite) => {
    return `/assets/meteorites/M${m.visualIndex}${m.quality}.png`;
};



export const MeteoriteTooltip: React.FC<MeteoriteTooltipProps> = ({
    meteorite, gameState, meteoriteIdx = -1, x,
    isInteractive,
    isEmbedded,
    onMouseEnter, onMouseLeave
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const mTrans = t.meteorites;

    // const [shake, setShake] = React.useState(false); // Unused
    const rarityColor = RARITY_COLORS[meteorite.rarity];
    const infoName = mTrans.rarities[meteorite.rarity as keyof typeof mTrans.rarities] || mTrans.rarities.anomalous;

    const formatDescription = (text: string, highlightColor: string) => {
        const { language } = useLanguage();
        const mTrans = getUiTranslation(language).meteorites;

        if (language === 'ru') {
            // 1. Initial pattern-based replacements for better grammar
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
                });

            // 2. Connector replacements
            text = text
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
                .replace(/ECO HEX/gi, mTrans.stats.sector01)
                .replace(/COM HEX/gi, mTrans.stats.sector02)
                .replace(/DEF HEX/gi, mTrans.stats.sector03)
                .replace(/Hexes/gi, 'Легендарный ⬢')
                .replace(/Hex/gi, 'Легендарный ⬢')
                .replace(/Damaged Meteorite/gi, mTrans.stats.damaged)
                .replace(/Broken Meteorite/gi, mTrans.stats.broken)
                .replace(/New Meteorite/gi, mTrans.stats.new);

            // 3. Final polish: Ensure starting capital letter
            text = text.trim();
            if (text.length > 0) {
                text = text.charAt(0).toUpperCase() + text.slice(1);
            }
        } else {
            // Original English replacement logic
            text = text.replace(/found in ECO HEX/gi, `found in ${mTrans.stats.economicArena}`)
                .replace(/found in COM HEX/gi, `found in ${mTrans.stats.combatArena}`)
                .replace(/found in DEF HEX/gi, `found in ${mTrans.stats.defenceArena}`)
                .replace(/found in Economic Arena/gi, `found in ${mTrans.stats.economicArena}`)
                .replace(/found in Combat Arena/gi, `found in ${mTrans.stats.combatArena}`)
                .replace(/found in Defence Arena/gi, `found in ${mTrans.stats.defenceArena}`)
                .replace(/Located in Sector-01/gi, `Located in ${mTrans.stats.sector01}`)
                .replace(/Located in Sector-02/gi, `Located in ${mTrans.stats.sector02}`)
                .replace(/Located in Sector-03/gi, `Located in ${mTrans.stats.sector03}`)
                .replace(/Located in ECO HEX/gi, `Located in ${mTrans.stats.sector01}`)
                .replace(/Located in COM HEX/gi, `Located in ${mTrans.stats.sector02}`)
                .replace(/Located in DEF HEX/gi, `Located in ${mTrans.stats.sector03}`)
                .replace(/connected to Eco Hexes/gi, 'connected to Eco Legendary Upgrade')
                .replace(/connected to Com Hexes/gi, 'connected to Com Legendary Upgrade')
                .replace(/connected to Def Hexes/gi, 'connected to Def Legendary Upgrade')
                .replace(/neighboring a/gi, 'neighboring a')
                .replace(/neighboring/gi, 'neighboring')
                .replace(/Eco ⬢/g, 'Eco ⬢')
                .replace(/Com ⬢/g, 'Com ⬢')
                .replace(/Def ⬢/g, 'Def ⬢')
                .replace(/Hexes/gi, 'Legendary ⬢')
                .replace(/Hex/gi, 'Legendary ⬢')
                .replace(/ECO HEX/gi, mTrans.stats.sector01)
                .replace(/COM HEX/gi, mTrans.stats.sector02)
                .replace(/DEF HEX/gi, mTrans.stats.sector03);
        }

        // Keywords to highlight - Order matters (longest first to avoid partial matches)
        const keywords = [
            mTrans.stats.sector01, mTrans.stats.sector02, mTrans.stats.sector03,
            mTrans.stats.economicArena, mTrans.stats.combatArena, mTrans.stats.defenceArena,
            'Economic', 'Combat', 'Defence',
            'Экономическая', 'Боевая', 'Защитная',
            'Экономическая Арена', 'Боевая Арена', 'Защитная Арена',
            '(?:Eco|Com|Def) & (?:Eco|Com|Def) ⬢',
            '\\bEco\\b', '\\bCom\\b', '\\bDef\\b',
            '\\bЭко\\b', '\\bБой\\b', '\\bЗащ\\b',
            'Эко ⬢', 'Бой ⬢', 'Защ ⬢',
            'Эко и Бой ⬢', 'Эко и Защ ⬢', 'Бой и Защ ⬢',
            'Бой и Эко ⬢', 'Защ и Эко ⬢', 'Защ и Бой ⬢',
            'Эко и Эко ⬢', 'Бой и Бой ⬢', 'Защ и Защ ⬢',
            'ECO-ECO', 'ECO-COM', 'ECO-DEF', 'COM-COM', 'COM-DEF', 'DEF-DEF',
            'HEX', 'NEW', 'DAMAGED', 'BROKEN', 'CORRUPTED',
            'НОВЫЙ', 'ПОВРЕЖДЕН', 'СЛОМАН', 'ИСКАЖЕН',
            'ТИП', 'РАРИТЕТ', 'СЕКТОР',
            'Type', 'Rarity', 'Sector',
            '\\(Any\\)', 'same level', 'того же уровня'
        ];

        // Case-insensitive regex
        const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
        return text.split(regex).filter(Boolean).map((part, i) => {
            const upperPart = part.toUpperCase();

            // Fixed matching logic
            const isKeyword = keywords.some(k => {
                const cleanK = k.replace(/\\b/g, '').replace(/\((?:\?\:)?/g, '').replace(/\)/g, '');
                return new RegExp(`^${cleanK}$`, 'i').test(part);
            });

            if (isKeyword) {
                const isCorrupted = upperPart === 'CORRUPTED' || upperPart === 'ИСКАЖЕН';
                return (
                    <span key={i} style={{
                        color: highlightColor,
                        fontWeight: 'bold',
                        background: isCorrupted ? `${highlightColor}15` : 'transparent',
                        padding: isCorrupted ? '0 4px' : '0',
                        borderRadius: '3px',
                        border: isCorrupted ? `1px solid ${highlightColor}33` : 'none',
                        textShadow: `0 0 8px ${highlightColor}44`,
                        display: isCorrupted ? 'inline-block' : 'inline',
                        lineHeight: isCorrupted ? '1.2' : 'normal'
                    }}>
                        {upperPart}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    // ... efficiency logic remains ...
    const efficiency = meteoriteIdx !== -1
        ? calculateMeteoriteEfficiency(gameState, meteoriteIdx)
        : { totalBoost: 0, perkResults: {} as Record<string, any>, blueprintBoost: 0 };

    // Calculate how many stats we have
    const activeStatsCount = meteorite.perks ? meteorite.perks.length : 0;

    const CARD_WIDTH = isEmbedded ? '100%' : 350;
    // Tighter height calculation to remove empty space
    const CARD_HEIGHT = isEmbedded ? '100%' : 260 + (activeStatsCount * 36);
    const OFFSET = 20;

    // Final positioning: Centered vertically on screen, horizontal follows cursor
    let finalX = x + OFFSET;
    const finalY = (window.innerHeight - (typeof CARD_HEIGHT === 'number' ? CARD_HEIGHT : 400)) / 2;

    if (!isEmbedded && finalX + (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 350) > window.innerWidth) {
        finalX = x - (typeof CARD_WIDTH === 'number' ? CARD_WIDTH : 350) - OFFSET;
    }

    const tooltipStyle: React.CSSProperties = isEmbedded ? {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        background: 'transparent',
        ['--rarity-color' as any]: rarityColor
    } : {
        position: 'fixed',
        left: finalX,
        top: finalY,
        width: `${CARD_WIDTH}px`,
        height: 'auto', // Allow content to dictate height to ensure border wraps everything
        minHeight: `${CARD_HEIGHT}px`,
        zIndex: 5000,
        pointerEvents: isInteractive ? 'auto' : 'none',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        border: `3px solid ${rarityColor}`,
        background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
        boxShadow: `0 0 30px ${rarityColor}44`,
        ['--rarity-color' as any]: rarityColor,
        // Animation removed
    };

    const formatPct = (val: number, isDirectPct: boolean = false) => {
        const raw = isDirectPct ? val : val * 100;
        const rounded = Math.round(raw * 10) / 10;
        return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
    };

    return (
        <div
            style={tooltipStyle}
            className="meteorite-card-pulse"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${rarityColor}66;
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: ${rarityColor};
                }
            `}</style>
            {meteorite.isBlueprint ? (
                (() => {
                    const bp = meteorite as any as Blueprint;
                    const isResearching = bp.status === 'researching';
                    const timeLeft = isResearching && bp.researchFinishTime ? Math.max(0, bp.researchFinishTime - gameState.gameTime) : 0;

                    return (
                        <div style={{
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                            border: `2px solid ${isResearching ? '#fbbf24' : '#3b82f6'}`,
                            boxShadow: `0 0 30px ${isResearching ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.5)'}, inset 0 0 20px ${isResearching ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.2)'}`,
                            minHeight: '180px',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* SCANLINE EFFECT */}
                            <div style={{
                                position: 'absolute', inset: 0,
                                background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(59, 130, 246, 0.05) 1px, rgba(59, 130, 246, 0.05) 2px)',
                                pointerEvents: 'none'
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1 }}>
                                <div style={{
                                    width: '65px', height: '65px',
                                    background: isResearching ? 'rgba(251, 191, 36, 0.05)' : 'rgba(59, 130, 246, 0.1)',
                                    border: `1px solid ${isResearching ? '#fbbf24' : '#3b82f6'}`,
                                    borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 15px ${isResearching ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.3)'}`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img src="/assets/Icons/Blueprint.png" style={{
                                        width: '75%', height: '75%', objectFit: 'contain',
                                        filter: isResearching ? 'grayscale(1) brightness(0.5) sepia(1) hue-rotate(-10deg) saturate(3)' : 'drop-shadow(0 0 5px #60a5fa)',
                                        opacity: isResearching ? 0.3 : 1
                                    }} alt="BP" />

                                    {isResearching && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(transparent, #fbbf24, transparent)',
                                            height: '200%', width: '100%',
                                            opacity: 0.3,
                                            animation: 'scanning-bar 1.5s infinite linear'
                                        }} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '8px', height: '8px', background: isResearching ? '#fbbf24' : '#3b82f6', borderRadius: '50%', boxShadow: `0 0 5px ${isResearching ? '#fbbf24' : '#3b82f6'}` }} />
                                        <span style={{ fontSize: '10px', color: isResearching ? '#fbbf24' : '#60a5fa', fontWeight: 900, letterSpacing: '2px' }}>
                                            {isResearching ? (language === 'ru' ? 'ИДЕТ ДЕШИФРОВКА' : 'DECRYPTION UNDERWAY') : (language === 'ru' ? 'АРХИВНАЯ АНОМАЛИЯ' : 'ARCHIVE ANOMALY')}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '1px',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                        fontFamily: 'Orbitron, sans-serif'
                                    }}>
                                        {isResearching ? (language === 'ru' ? 'ЗАШИФРОВАННОЕ ЯДРО' : 'ENCRYPTED CORE') : (bp.name || (language === 'ru' ? 'НЕИЗВЕСТНЫЙ НАБОР' : 'UNKNOWN DATASET'))}
                                    </span>
                                </div>
                            </div>

                            <p style={{
                                fontSize: '11px', color: '#94a3b8', margin: '8px 0', lineHeight: '1.5',
                                borderLeft: `3px solid ${isResearching ? '#fbbf24' : '#3b82f6'}`,
                                paddingLeft: '12px', position: 'relative', zIndex: 1
                            }}>
                                {isResearching
                                    ? (language === 'ru' ? "Система в данный момент анализирует зашифрованные пакеты высокой плотности. Структурный анализ и функциональный обзор недоступны до завершения синхронизации потока битов." : "System is currently parsing high-density encrypted packets. Structural analysis and functional overview are unavailable until bitstream synchronization is complete.")
                                    : (bp.desc || (language === 'ru' ? "Телеметрия из глубокого космоса, полученная с заброшенной орбитальной станции. Требуется локальная обработка для инициализации." : "Deep-space telemetry recovered from an abandoned orbital station. Requires local research processing to initialize."))}
                            </p>

                            <div style={{
                                marginTop: '10px',
                                padding: '12px',
                                background: isResearching ? 'rgba(251, 191, 36, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                                border: `1px dashed ${isResearching ? 'rgba(251, 191, 36, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                                borderRadius: '6px',
                                textAlign: 'center',
                                position: 'relative', zIndex: 1
                            }}>
                                <div style={{ fontSize: '9px', fontWeight: 900, color: isResearching ? '#fbbf24' : '#60a5fa', marginBottom: '4px', letterSpacing: '1px' }}>
                                    {isResearching ? (language === 'ru' ? 'СТАТУС ДЕШИФРОВКИ' : 'DECRYPTION STATUS') : (language === 'ru' ? 'АНАЛИЗ ИССЛЕДОВАНИЯ' : 'RESEARCH ANALYSIS')}
                                </div>

                                {isResearching ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                        <div style={{ fontSize: '24px', color: '#fbbf24', fontWeight: 900, fontFamily: 'monospace', textShadow: '0 0 10px #fbbf24' }}>
                                            {timeLeft.toFixed(1)}s
                                        </div>
                                        <div style={{ width: '100%', height: '4px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', background: '#fbbf24',
                                                width: `${Math.max(5, (1 - (timeLeft / (bp.researchDuration || 60))) * 100)}%`,
                                                boxShadow: '0 0 10px #fbbf24'
                                            }} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{language === 'ru' ? 'ПРОЧНОСТЬ:' : 'DURABILITY STATUS:'}</span>
                                            <span style={{ fontSize: '10px', color: '#fff', fontWeight: 900 }}>{language === 'ru' ? 'СТАБИЛЬНО' : 'STABLE'}</span>
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.5px' }}>
                                            {language === 'ru' ? 'ГОТОВО К ИНИЦИАЛИЗАЦИИ' : 'READY FOR INITIALIZATION'}
                                        </span>
                                    </>
                                )}
                            </div>

                            <style>{`
                                @keyframes scanning-bar {
                                    from { transform: translateY(-100%); }
                                    to { transform: translateY(100%); }
                                }
                            `}</style>
                        </div>
                    );
                })()
            ) : (
                <>
                    {/* Header: Name + Symbol + Total Power */}
                    <div style={{
                        padding: '12px 10px',
                        borderBottom: `2px solid ${rarityColor}66`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: `${rarityColor}11`
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    letterSpacing: '1px'
                                }}>{infoName}</span>
                                <span style={{
                                    fontSize: '9px', padding: '1px 4px',
                                    background: `${rarityColor}33`, color: rarityColor,
                                    borderRadius: '2px', fontWeight: 900
                                }}>V {meteorite.version?.toFixed(1) || '1.0'}</span>
                                {meteorite.isCorrupted && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(239, 68, 68, 0.15)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid #ef4444',
                                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.5px' }}>{mTrans.stats.corruptedEject}</span>
                                    </div>
                                )}
                            </div>
                            <div style={{
                                marginTop: '2px',
                                fontSize: '12px',
                                fontWeight: 900,
                                color: rarityColor,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <span style={{ opacity: 0.6, fontSize: '10px' }}>{mTrans.stats.activePower}</span>
                                <span>+{formatPct(efficiency.totalBoost)}%</span>
                                {meteorite.blueprintBoosted && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px',
                                        background: 'rgba(59, 130, 246, 0.2)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid rgba(59, 130, 246, 0.4)',
                                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#60a5fa', letterSpacing: '0.5px' }}>{mTrans.stats.harmV} +2%</span>
                                    </div>
                                )}
                                {efficiency.blueprintBoost > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px',
                                        background: 'rgba(249, 115, 22, 0.2)', padding: '1px 6px', borderRadius: '4px',
                                        border: '1px solid rgba(249, 115, 22, 0.4)',
                                        boxShadow: '0 0 10px rgba(249, 115, 22, 0.3)'
                                    }}>
                                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#fb923c', letterSpacing: '0.5px' }}>{mTrans.stats.coreX} +{formatPct(efficiency.blueprintBoost)}%</span>
                                    </div>
                                )}
                                {meteorite.incubatorBoost && meteorite.incubatorBoost > 0 && (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '6px'
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'rgba(15, 23, 42, 0.8)', padding: '1px 8px', borderRadius: '4px',
                                            border: '1px solid #475569',
                                            boxShadow: '0 0 15px rgba(0, 217, 255, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '10px', fontWeight: 950, color: '#fff', letterSpacing: '0.5px' }}>
                                                {mTrans.stats.incubLabel} <span style={{ color: '#00d9ff' }}>+{formatPct(meteorite.incubatorBoost, true)}%</span>
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '6px', color: 'rgba(0, 217, 255, 0.6)', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase' }}>
                                            {t.recalibrate.incubCostNote}
                                        </span>
                                    </div>
                                )}
                                {meteoriteIdx === -1 && <span style={{ fontSize: '9px', opacity: 0.5, marginLeft: '4px' }}>{mTrans.stats.unplaced}</span>}
                            </div>
                        </div>
                    </div>


                    {/* Illustration Area (Unchanged) */}
                    <div style={{
                        flex: '0 0 140px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `radial-gradient(circle, ${rarityColor}33 0%, transparent 70%)`,
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0.1,
                            backgroundImage: `linear-gradient(${rarityColor} 1px, transparent 1px), linear-gradient(90deg, ${rarityColor} 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }} />
                        {/* USER MANUAL EDIT REPLACED IMG WITH DIV IN BLUEPRINTBAY, BUT TOOLTIP SHOULD KEEP IMG */}
                        <img
                            src={getMeteoriteImage(meteorite)}
                            alt={meteorite.rarity}
                            style={{
                                width: '110px',
                                height: '110px',
                                objectFit: 'contain',
                                filter: `drop-shadow(0 0 15px ${rarityColor})`
                            }}
                        />
                    </div>

                    {/* Protocols Label */}
                    <div style={{
                        padding: '4px 10px',
                        fontSize: '10px',
                        color: rarityColor,
                        fontWeight: 900,
                        letterSpacing: '2px',
                        backgroundColor: `${rarityColor}22`,
                        textAlign: 'center',
                        textTransform: 'uppercase'
                    }}>
                        {mTrans.stats.augmentationProtocols}
                    </div>

                    {/* Stats Area with Active/Inactive Logic */}
                    <div className="custom-scrollbar" style={{
                        flex: 1,
                        padding: '12px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        overflowY: 'auto',
                        minHeight: 0
                    }}>
                        {meteorite.perks && meteorite.perks.map((perk, idx) => {
                            const perkResult = efficiency.perkResults[perk.id];
                            const isActive = perkResult && perkResult.count > 0;



                            const formatVal = (val: number) => {
                                const rounded = Math.round(val * 10) / 10;
                                return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
                            };

                            return (
                                <div key={idx} className="card-stat-line" style={{
                                    alignItems: 'center',
                                    paddingRight: '6px',
                                    display: 'flex',
                                    gap: '10px',
                                    minHeight: '42px' // Ensure enough height for 2 lines + padding
                                }}>
                                    <span className="bullet" style={{ color: isActive ? rarityColor : '#94a3b8', opacity: isActive ? 1 : 0.6 }}>
                                        {getPerkIcon(perk.id)}
                                    </span>
                                    <div className="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span className="label" style={{ fontSize: '9px', opacity: 0.9, fontWeight: 900 }}>
                                                {(() => {
                                                    const rawName = getPerkName(perk.id);
                                                    if (rawName.includes('Perk')) {
                                                        const num = parseInt(rawName);
                                                        if (!isNaN(num)) {
                                                            if (language === 'ru') return `${num}-ый перк`;
                                                            const suffixes = ['st', 'nd', 'rd', 'th'];
                                                            const suffix = num <= 3 ? suffixes[num - 1] : 'th';
                                                            return `${num}${suffix} Perk`;
                                                        }
                                                        const key = Object.keys(mTrans.perkNames).find(k => rawName.toLowerCase().startsWith(k));
                                                        return key ? mTrans.perkNames[key as keyof typeof mTrans.perkNames] : rawName;
                                                    }
                                                    return rawName;
                                                })()}
                                            </span>
                                            <span style={{ fontSize: '9px', color: rarityColor, opacity: 0.5 }}>
                                                ({perk.range.min + (meteorite.incubatorBoost || 0)}-{perk.range.max + (meteorite.incubatorBoost || 0)}%)
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2', opacity: 0.9 }}>
                                            {formatDescription(perk.description, rarityColor)}
                                            {isActive && perkResult.count > 1 && <span style={{ color: '#FCD34D' }}> (x{perkResult.count})</span>}
                                        </div>
                                    </div>
                                    <span className="value" style={{
                                        fontSize: '13px',
                                        color: isActive ? '#fff' : '#94a3b8',
                                        opacity: isActive ? 1 : 0.4,
                                        fontWeight: 900,
                                        textAlign: 'right',
                                        minWidth: '45px'
                                    }}>
                                        +{formatPct(isActive ? perkResult.activeValue : (perk.value + (meteorite.incubatorBoost || 0)), true)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer / Info Panel */}
                    <div style={{
                        padding: '10px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginTop: '10px', // Added spacing per request
                        borderTop: `1px solid ${rarityColor}33`,
                        background: 'rgba(0,0,0,0.5)',
                        fontSize: '11px',
                        letterSpacing: '0.5px',
                        fontWeight: 900,
                        textTransform: 'uppercase'
                    }}>
                        <div style={{ color: '#fff' }}>
                            <span style={{ color: rarityColor, opacity: 0.8 }}>{mTrans.stats.typeLabel}</span> <span style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                textShadow: `0 0 10px ${meteorite.quality === 'New' ? '#4ade80' : (meteorite.quality === 'Broken' ? '#ef4444' : '#fbbf24')}`
                            }}>{(() => {
                                if (meteorite.quality === 'New') return mTrans.stats.new;
                                if (meteorite.quality === 'Broken') return mTrans.stats.broken;
                                if (meteorite.quality === 'Damaged') return mTrans.stats.damaged;
                                return (meteorite.quality as string).toUpperCase();
                            })()}
                            </span>
                        </div>
                        <div style={{ color: '#fff' }}>
                            <span style={{ color: rarityColor, opacity: 0.8 }}>{mTrans.stats.foundInLabel}</span> {
                                meteorite.discoveredIn
                                    .replace(/Sector-01/gi, mTrans.stats.economicArena)
                                    .replace(/Sector-02/gi, mTrans.stats.combatArena)
                                    .replace(/Sector-03/gi, mTrans.stats.defenceArena)
                                    .replace(/ECO HEX/gi, mTrans.stats.economicArena)
                                    .replace(/COM HEX/gi, mTrans.stats.combatArena)
                                    .replace(/DEF HEX/gi, mTrans.stats.defenceArena)
                            }
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};
