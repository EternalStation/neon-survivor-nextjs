import React from 'react';
import type { GameState, LegendaryHex, LegendaryCategory } from '../logic/core/types';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getMeteoriteImage } from './modules/ModuleUtils';
import { getUiTranslation } from '../lib/uiTranslations';
import { useLanguage } from '../lib/LanguageContext';

interface LegendaryDetailProps {
    hex: LegendaryHex;
    gameState: GameState;
    hexIdx: number;
    pending?: boolean;
    placementAlert?: boolean;
}

const CATEGORY_COLORS: Record<LegendaryCategory | 'Merger', string> = {
    Economic: '#fbbf24', // Yellow (Arena)
    Combat: '#ef4444',   // Red (Arena)
    Defensive: '#3b82f6', // Blue (Arena)
    Fusion: '#f59e0b',    // Orange/Amber
    Merger: '#10b981'    // Emerald/Green (Xeno-Alchemist)
};

const FORGE_COLORS: Record<LegendaryCategory | 'Merger', string> = {
    Economic: '#d946ef', // Magenta (Exis)
    Combat: '#fb923c',   // Orange (Apex)
    Defensive: '#4ade80', // Green (Bastion)
    Fusion: '#f59e0b',    // Orange
    Merger: '#22d3ee'    // Cyan (Refinery)
};

export const LegendaryDetail: React.FC<LegendaryDetailProps> = ({ hex, gameState, hexIdx, pending, placementAlert }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language as any);
    const isXeno = hex.type === 'XenoAlchemist';
    const isMire = hex.type === 'IrradiatedMire';
    const isSingularity = hex.type === 'NeuralSingularity';
    const isMerger = isXeno || isMire || isSingularity;

    const color = placementAlert ? '#ef4444' :
        (isXeno ? CATEGORY_COLORS.Merger :
            (isMire ? '#22d3ee' :
                (isSingularity ? '#a855f7' : CATEGORY_COLORS[hex.category])));

    const forgeColor = isXeno ? FORGE_COLORS.Merger :
        (isMire ? '#22d3ee' :
            (isSingularity ? '#a855f7' : FORGE_COLORS[hex.category]));

    const bgGlow = placementAlert ? 'rgba(239, 68, 68, 0.15)' :
        (isXeno ? 'rgba(16, 185, 129, 0.1)' :
            (isMire ? 'rgba(34, 211, 238, 0.1)' :
                (isSingularity ? 'rgba(168, 85, 247, 0.1)' : `${color}11`)));

    // Efficiency calculations
    const connectedDiamondIdxs = pending ? [] : [
        hexIdx,
        (hexIdx + 5) % 6,
        hexIdx + 6,
        ((hexIdx + 5) % 6) + 6
    ];

    const individualBoosts = connectedDiamondIdxs.map(dIdx => {
        const item = gameState.moduleSockets.diamonds[dIdx];
        if (!item) return 0;
        return calculateMeteoriteEfficiency(gameState, dIdx).totalBoost;
    });

    const totalEfficiency = individualBoosts.reduce((acc, b) => acc + b, 0);
    const multiplier = 1 + totalEfficiency;

    const getForgeName = (cat: string) => {
        if (cat === 'Economic') return 'EXIS FORGE';
        if (cat === 'Combat') return 'APEX FORGE';
        if (cat === 'Defensive') return 'BASTION FORGE';
        return cat;
    };

    const forgeName = isXeno ? 'EXIS / BASTION' :
        (isMire ? 'APEX / BASTION' :
            (isSingularity ? 'EXIS / APEX' : getForgeName(hex.category)));

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: bgGlow,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '15px'
            }}>
                {/* ALERT OVERLAY FOR PENDING */}
                {placementAlert && (
                    <div style={{
                        fontSize: '10px', color: '#fff', fontWeight: 900, letterSpacing: '2px',
                        padding: '6px 15px', background: '#ef4444', borderRadius: '4px',
                        border: '1px solid #fff', animation: 'shake 0.5s infinite',
                        boxShadow: '0 0 20px #ef4444', textAlign: 'center', marginBottom: '15px'
                    }}>
                        ATTENTION: INSTALL MODULE FIRST
                    </div>
                )}

                {!placementAlert && pending && (
                    <div style={{
                        fontSize: '10px', color: color, fontWeight: 900, letterSpacing: '2px',
                        padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px',
                        border: `1px solid ${color}`, animation: 'pulse-accent 2s infinite',
                        textAlign: 'center', marginBottom: '15px'
                    }}>
                        PENDING INTEGRATION
                    </div>
                )}

                {/* HEADER */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    marginBottom: '15px', position: 'relative'
                }}>
                    <div style={{
                        width: '52px', height: '60px',
                        backgroundColor: color,
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        boxShadow: `0 0 20px ${color}33`
                    }}>
                        <div style={{
                            width: 'calc(100% - 4px)', height: 'calc(100% - 4px)',
                            backgroundColor: '#0f172a',
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {hex.customIcon ? (
                                <img src={hex.customIcon} alt="hex" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '32px', color: color }}>★</span>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: '1px', textShadow: `0 0 10px ${color}66` }}>
                            {hex.name.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* CAPABILITY DESCRIPTION */}
                {!isMerger && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '4px', opacity: 0.6 }}>
                                {t.legendary?.systemCapability || 'SYSTEM CAPABILITY'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#fff', lineHeight: '1.4', fontWeight: 600 }}>
                                {hex.lore}
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVE SKILL SPECIFICATIONS */}
                {(t.legendaries as any)[hex.type]?.skillDesc && (
                    <div style={{
                        background: 'rgba(34, 211, 238, 0.05)', padding: '10px', borderRadius: '6px',
                        border: '1px solid rgba(34, 211, 238, 0.15)', marginBottom: '10px'
                    }}>
                        <div style={{ fontSize: '7px', color: '#22d3ee', fontWeight: 900, letterSpacing: '2px', marginBottom: '4px' }}>
                            {t.legendary?.skillSpecsHeader || 'ACTIVE SKILL SPECIFICATIONS'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#fff', lineHeight: '1.4', fontWeight: 600 }}>
                            {(t.legendaries as any)[hex.type].skillDesc}
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '2px',
                    background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px'
                }}>
                    <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '2px', opacity: 0.6 }}>
                        {t.legendary?.augmentationData || 'AUGMENTATION DATA'}
                    </div>
                    {hex.perks && hex.perks.map((p, i) => {
                        if (typeof p !== 'string') return null;

                        if (p.startsWith('GROUP:')) {
                            const groupName = p.replace('GROUP:', '');
                            return (
                                <div key={i} style={{
                                    marginTop: '4px',
                                    marginBottom: '2px',
                                    padding: '2px 0',
                                    borderBottom: `1px solid ${color}33`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ width: '4px', height: '4px', backgroundColor: color, borderRadius: '50%' }} />
                                    <div style={{ fontSize: '9px', fontWeight: 950, color: color, letterSpacing: '1.5px' }}>{groupName}</div>
                                </div>
                            );
                        }

                        if (p.startsWith('[') && p.endsWith(']')) {
                            return (
                                <div key={i} style={{
                                    textAlign: 'center',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    marginTop: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#10b981', letterSpacing: '2px' }}>{p}</div>
                                </div>
                            );
                        }

                        const soulsMatch = p.match(/\(([\d\.]+) Souls\)/);
                        const levelKills = soulsMatch ? parseFloat(soulsMatch[1]) : 0;
                        const strippedForBase = p.replace(/\([\d\.]+ Souls\)/, '');
                        const baseMatch = strippedForBase.match(/(\d+\.?\d*)/);
                        let baseValue: number | string = baseMatch ? parseFloat(baseMatch[1]) : 0;
                        let hasPercent = p.includes('%');

                        const isRange = p.includes('-') && (p.includes('%') || p.includes('HP'));
                        const isEconomic = (hex.category === 'Economic' && p.toLowerCase().includes('kill')) || (hex.type === 'CombShield' && p.includes('Armor'));
                        const isCurve = hex.type === 'CombShield' && (p.includes('Collision') || p.includes('Projectile'));

                        let displayValue = "";
                        let cleanLabel = p;
                        let isNumeric = false;
                        const tacticalKeywords = ['DMG', 'HP', 'Lifesteal', 'Crit', 'Slow', 'Taken', 'Resist', 'Range', 'Duration', 'Uptime', 'Regen', 'XP', 'Dust', 'Flux', 'Fear', 'Урон', 'ОЗ', 'Вампир', 'Крит', 'Замедл', 'Опыт', 'Пыль', 'Поток', 'Страх'];

                        if (isCurve) {
                            const stacks = levelKills * multiplier;
                            const val = 85 * (Math.pow(stacks, 0.75) / (Math.pow(stacks, 0.75) + 400));
                            displayValue = `+${val.toFixed(1)}%`;
                            isNumeric = true;
                            cleanLabel = p.replace(/[+-]?\d+\.?\d*%?\s*/, '').trim();
                        } else if (isRange) {
                            const matches = p.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
                            if (matches) {
                                const low = parseFloat(matches[1]);
                                const high = parseFloat(matches[2]);
                                (baseValue as any) = `${low.toFixed(0)}-${high.toFixed(0)}%`;
                                const finalLow = (low * multiplier).toFixed(1);
                                const finalHigh = (high * multiplier).toFixed(1);
                                displayValue = `[${finalLow}-${finalHigh}%]`;
                                isNumeric = true;
                                // Keep original label but remove the numbers (e.g. "Deals 5-10% HP/sec" -> "Deals HP/sec")
                                cleanLabel = p.replace(/(\d+\.?\d*)-(\d+\.?\d*)%?/, '').trim();
                            }
                        } else if (isEconomic) {
                            const finalValuePerKill = (baseValue as number) * multiplier;
                            let divisor = 1;
                            let useFloor = false;
                            if (p.includes('per 20 kills')) divisor = 20;
                            if (p.includes('per 50 kills')) { divisor = 50; useFloor = true; }
                            if (p.includes('for 100 kills')) { divisor = 100; useFloor = false; }
                            const effectiveKills = useFloor ? Math.floor(levelKills / divisor) : (levelKills / divisor);
                            const totalValue = finalValuePerKill * effectiveKills;
                            displayValue = `+${totalValue.toFixed(1)}${hasPercent ? '%' : ''}`;
                            isNumeric = p.toLowerCase().includes('kill') || p.toLowerCase().includes('убий');
                            cleanLabel = p.replace(/[+-]?\d+\.?\d*%?\s*/, '').trim();
                        } else {
                            if ((baseValue as number) > 0 && (hasPercent || tacticalKeywords.some(k => p.includes(k)))) {
                                const amplified = (baseValue as number) * multiplier;
                                const hasSeconds = p.match(/\d+\.?\d*s\b/);
                                const suffix = hasPercent ? '%' : (hasSeconds ? 's' : '');
                                displayValue = `${hasPercent ? '+' : ''}${amplified.toFixed(1)}${suffix}`;
                                isNumeric = true;
                                cleanLabel = p.replace(/[+-]?\d+\.?\d*%?s?\s*/, '').trim();
                                if (soulsMatch && multiplier > 1) {
                                    const rawSouls = parseFloat(soulsMatch[1]);
                                    const effectiveSouls = rawSouls * multiplier;
                                    cleanLabel = cleanLabel.replace(/\([\d\.]+ Souls\)/, `(${rawSouls.toFixed(0)} x ${(multiplier * 100).toFixed(0)}% = ${effectiveSouls.toFixed(1)})`);
                                }
                            }
                        }

                        let isStatic = false;
                        if (p.includes('(STATIC)')) {
                            isStatic = true;
                            cleanLabel = cleanLabel.replace('(STATIC)', '').trim();
                        }
                        if (hex.type === 'ChronoPlating' && (p.includes('Double Armor') || p.includes('Брони'))) {
                            const interval = 300;
                            const startTime = hex.timeAtLevel?.[3] ?? gameState.gameTime;
                            const elapsed = gameState.gameTime - startTime;
                            const remaining = interval - (elapsed % interval);
                            const m = Math.floor(remaining / 60);
                            const s = Math.floor(remaining % 60).toString().padStart(2, '0');
                            baseValue = "X2";
                            // Try to preserve language for the static timer label
                            cleanLabel = cleanLabel.includes('Armour') ? `Armour every 5 min (${m}:${s})` : `Броня каждые 5 мин (${m}:${s})`;
                            isNumeric = true;
                            isStatic = true;
                            hasPercent = false;
                            displayValue = `+${(gameState.player.chronoArmorBonus || 0).toFixed(1)}`;
                        }

                        if (hex.type === 'ChronoPlating' && (p.includes('Cooldown Reduction') || p.includes('перезарядки'))) {
                            const curCDR = (gameState.player.cooldownReduction || 0) * 100;
                            const cdrLabel = cleanLabel.includes('Cooldown') ? 'Cooldown Reduction' : 'Снижение перезарядки';
                            cleanLabel = `[${curCDR.toFixed(1)}%] ${cdrLabel}`;
                            baseValue = 0.25;
                            hasPercent = true;
                            isNumeric = true;
                            displayValue = `+${(0.25 * multiplier).toFixed(1)}%`;
                        }

                        if (hex.type === 'IrradiatedMire' && (p.includes('666px') || p.includes('Radius') || p.includes('Радиус'))) {
                            isStatic = true;
                            isNumeric = true;
                            baseValue = "666px";
                            displayValue = "666px";
                            cleanLabel = p.includes('Radius') || p.includes('Радиус') ? (cleanLabel.includes('px') ? cleanLabel.replace('666px ', '') : cleanLabel) : cleanLabel;
                        }

                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                        <span style={{ fontSize: isNumeric && typeof baseValue === 'string' && (baseValue as string).includes('-') ? '10px' : '11px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                                            {isNumeric ? (typeof baseValue === 'string' ? baseValue : `${baseValue}${hasPercent ? '%' : (p.match(/\d+\.?\d*s\b/) ? 's' : '')}`) : ''}
                                        </span>
                                        <span style={{ fontSize: hex.type === 'RadiationCore' && cleanLabel.includes('DPS') ? '7px' : '8px', color: isNumeric ? '#64748b' : '#fff', fontWeight: 700, textTransform: 'uppercase' }}>{cleanLabel}</span>
                                    </div>
                                    {isNumeric && !isStatic && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', gap: '4px' }}>
                                            <span style={{ fontSize: '8px', color: '#475569' }}>×</span>
                                            <span style={{ fontSize: '9px', color: color, fontWeight: 900 }}>{multiplier.toFixed(2)}</span>
                                            <span style={{ fontSize: '10px', color: color, opacity: 0.5 }}>|</span>
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>{displayValue}</span>
                                        </div>
                                    )}
                                    {isNumeric && isStatic && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', gap: '6px' }}>
                                            <span style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>STATIC</span>
                                            <span style={{ fontSize: '10px', color: color, opacity: 0.5 }}>|</span>
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>{displayValue}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FORGE ORIGIN SECTION (REVISED) */}
            <div style={{
                padding: '12px 15px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>
                        {t.matrix.legendaryDetail.forgeOrigin.toUpperCase()}
                    </span>
                    <span style={{
                        color: forgeColor,
                        fontSize: '11px',
                        fontWeight: 950,
                        letterSpacing: '0.5px',
                        background: `${forgeColor}15`,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        border: `1px solid ${forgeColor}44`,
                        textTransform: 'uppercase'
                    }}>
                        {forgeName}
                    </span>
                </div>
            </div>

            {/* PENDING PROMPT (Sticky Footer) */}
            {
                pending && (
                    <div style={{
                        fontSize: '9px', color: color, fontWeight: 900,
                        textAlign: 'center', animation: 'pulse-accent 1s infinite alternate',
                        padding: '12px 10px', letterSpacing: '1px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 -4px 15px rgba(0,0,0,0.3)'
                    }}>
                        ◄ SELECT AN OPEN HEX SOCKET IN THE MATRIX ►
                    </div>
                )
            }

            <style>{`
                @keyframes sweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes pulse-accent {
                    0% { opacity: 0.5; text-shadow: 0 0 0px ${color}; }
                    100% { opacity: 1; text-shadow: 0 0 10px ${color}; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div >
    );
};
