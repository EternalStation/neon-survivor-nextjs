import React from 'react';
import type { LegendaryHex } from '../logic/core/types';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

interface LegendarySelectionMenuProps {
    options: LegendaryHex[];
    onSelect: (selection: LegendaryHex) => void;
}

import { getKeybinds } from '../logic/utils/Keybinds';

export const LegendarySelectionMenu: React.FC<LegendarySelectionMenuProps> = ({ options, onSelect }) => {
    const { language } = useLanguage();
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const mTrans = getUiTranslation(language as any).meteorites;

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const code = e.code.toLowerCase();
            if (code === 'tab') {
                e.preventDefault();
            }
            const binds = getKeybinds();
            const leftBind = (binds.moveLeft || 'keya').toLowerCase();
            const rightBind = (binds.moveRight || 'keyd').toLowerCase();

            if (code === leftBind || code === 'arrowleft' || (binds.useDefaultMovement && code === 'keya')) {
                setSelectedIndex(prev => (prev - 1 + options.length) % options.length);
            } else if (code === rightBind || code === 'arrowright' || (binds.useDefaultMovement && code === 'keyd')) {
                setSelectedIndex(prev => (prev + 1) % options.length);
            } else if (code === 'enter' || code === 'space') {
                onSelect(options[selectedIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [options, selectedIndex, onSelect]);

    const getLegendaryInfo = (category: string) => {
        const t = getUiTranslation(language as any).matrix.legendaryDetail;
        const categories: Record<string, { color: string, label: string, symbol: string }> = {
            Economic: {
                color: '#fbbf24', // Yellow (Arena)
                label: t.exisOrigin,
                symbol: ''
            },
            Combat: {
                color: '#ef4444', // Red (Arena)
                label: t.apexOrigin,
                symbol: ''
            },
            Defensive: {
                color: '#3b82f6', // Blue (Arena)
                label: t.bastionOrigin,
                symbol: ''
            }
        };
        return categories[category] || { color: '#fbbf24', label: 'TECH', symbol: '☢' };
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(5, 5, 20, 0.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            zIndex: 3000, fontFamily: 'Orbitron, sans-serif', color: 'white'
        }}>
            <h1 style={{
                fontSize: '3rem', color: '#fbbf24', textShadow: '0 0 20px #fbbf24',
                letterSpacing: '10px', marginBottom: '50px', marginTop: '-60px'
            }}>
                {language === 'ru' ? 'ЛЕГЕНДАРНЫЙ МОДУЛЬ' : 'LEGENDARY UPGRADE'}
            </h1>

            <div style={{ display: 'flex', gap: '20px' }}>
                {options.map((opt, i) => {
                    const info = getLegendaryInfo(opt.category);
                    const isSelected = i === selectedIndex;

                    return (
                        <div
                            key={i}
                            onClick={() => onSelect(opt)}
                            style={{
                                width: '280px', height: '510px',
                                background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.95) 0%, rgba(10, 10, 20, 0.98) 100%)',
                                border: isSelected ? `4px solid #fff` : `3px solid ${info.color}`,
                                borderRadius: '15px',
                                padding: '30px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                transition: 'all 0.2s ease-out',
                                boxShadow: isSelected ? `0 0 50px ${info.color}, 0 0 20px #fff` : `0 0 15px ${info.color}44`,
                                transform: isSelected ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)',
                                position: 'relative',
                                overflow: 'hidden',
                                zIndex: isSelected ? 10 : 1
                            }}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <div style={{
                                position: 'absolute', top: '10px', right: '10px',
                                color: info.color, fontSize: '0.8rem', fontWeight: 'bold'
                            }}>
                                {opt.level > 1 ? (language === 'ru' ? `УРОВЕНЬ ${opt.level}` : `LEVEL ${opt.level}`) : (language === 'ru' ? 'НОВЫЙ МОДУЛЬ' : 'NEW MODULE')}
                            </div>

                            <div style={{
                                width: '144px', height: '144px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '10px',
                                position: 'relative',
                                filter: `drop-shadow(0 0 15px ${info.color})`
                            }}>
                                {opt.customIcon ? (
                                    <img
                                        src={opt.customIcon}
                                        alt={opt.name}
                                        style={{
                                            width: '100%', height: '100%',
                                            objectFit: 'contain',
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '3rem' }}>★</span>
                                )}
                            </div>

                            <h2 style={{ color: info.color, fontSize: '1.2rem', textAlign: 'center', marginBottom: '10px', textShadow: `0 0 10px ${info.color}aa` }}>
                                {opt.name}
                            </h2>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', padding: '0 6px', overflowY: 'hidden' }}>
                                {opt.allPerks ? (
                                    opt.allPerks.map((levelPerks, levelIdx) => {
                                        const currentLevel = levelIdx + 1;
                                        const isPast = currentLevel < opt.level;
                                        const isNew = currentLevel === opt.level;
                                        const isFuture = currentLevel > opt.level;

                                        return (
                                            <div key={levelIdx} style={{
                                                display: 'flex', flexDirection: 'column', gap: '2px',
                                                opacity: isFuture ? 0.6 : 1,
                                                marginBottom: '4px'
                                            }}>
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    color: isNew ? '#fbbf24' : (isPast ? '#4ade80' : '#94a3b8'),
                                                    fontWeight: 'bold',
                                                    marginBottom: '1px',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    borderBottom: isNew ? '1px solid #fbbf24' : (isPast ? '1px solid #4ade80' : '1px solid #334155'),
                                                    paddingBottom: '1px'
                                                }}>
                                                    <span>{language === 'ru' ? `УРОВЕНЬ ${currentLevel}` : `LEVEL ${currentLevel}`}</span>
                                                    {isNew && <span style={{ color: '#fbbf24', textShadow: '0 0 5px #fbbf24' }}>★ {language === 'ru' ? 'НОВОЕ' : 'NEW'}</span>}
                                                    {isPast && <span style={{ color: '#4ade80' }}>✔ {language === 'ru' ? 'АКТИВНО' : 'ACTIVE'}</span>}
                                                    {isFuture && <span style={{ color: '#94a3b8' }}>{language === 'ru' ? 'ЗАКРЫТО' : 'LOCKED'}</span>}
                                                </div>

                                                {levelPerks.map((perk, pIdx) => (
                                                    <div key={pIdx} style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        textAlign: 'center',
                                                        color: isNew ? '#fbbf24' : (isFuture ? '#94a3b8' : '#e2e8f0'),
                                                        fontSize: '0.65rem',
                                                        padding: '2px 4px',
                                                        background: isNew ? 'rgba(251, 191, 36, 0.15)' : (isPast ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.2)'),
                                                        borderRadius: '4px',
                                                        border: isNew ? '1px solid rgba(251, 191, 36, 0.4)' : (isPast ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(255,255,255,0.05)'),
                                                        textShadow: isNew ? '0 0 5px rgba(251, 191, 36, 0.3)' : 'none',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {perk}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })
                                ) : (
                                    opt.perks?.map((perk, idx) => {
                                        const isNew = idx === opt.level - 1;
                                        let processedPerk = perk
                                            .replace(/Sector-01/gi, 'Сектор-01')
                                            .replace(/Sector-02/gi, 'Сектор-02')
                                            .replace(/Sector-03/gi, 'Сектор-03')
                                            .replace(/Economic Arena/gi, mTrans.stats.economicArena)
                                            .replace(/Combat Arena/gi, mTrans.stats.combatArena)
                                            .replace(/Defence Arena/gi, mTrans.stats.defenceArena)
                                            .replace(/ECO HEX/gi, mTrans.stats.economicArena)
                                            .replace(/COM HEX/gi, mTrans.stats.combatArena)
                                            .replace(/DEF HEX/gi, mTrans.stats.defenceArena);

                                        if (language === 'ru') {
                                            processedPerk = processedPerk
                                                .replace(/connected to (Eco|Com|Def) Hexes/gi, (match, p1) => {
                                                    const name = p1 === 'Eco' ? 'ЭКЗИС' : p1 === 'Com' ? 'ПРЕДЕЛ' : 'БАСТИОН';
                                                    return `и Усиляет Кузню ${name}`;
                                                })
                                                .replace(/Connects (Eco|Com|Def) & (Eco|Com|Def) Hexes/gi, (match, p1, p2) => {
                                                    const s1 = p1 === 'Eco' ? 'ЭКЗИС' : p1 === 'Com' ? 'ПРЕДЕЛ' : 'БАСТИОН';
                                                    const s2 = p2 === 'Eco' ? 'ЭКЗИС' : p2 === 'Com' ? 'ПРЕДЕЛ' : 'БАСТИОН';
                                                    return `и Усиляет Кузню ${s1} & ${s2}`;
                                                });
                                        } else {
                                            processedPerk = processedPerk
                                                .replace(/connected to (Eco|Com|Def) Hexes/gi, (match, p1) => {
                                                    const name = p1 === 'Eco' ? 'EXIS' : p1 === 'Com' ? 'APEX' : 'BASTION';
                                                    return `and Empowers Forge ${name}`;
                                                })
                                                .replace(/Connects (Eco|Com|Def) & (Eco|Com|Def) Hexes/gi, (match, p1, p2) => {
                                                    const s1 = p1 === 'Eco' ? 'EXIS' : p1 === 'Com' ? 'APEX' : 'BASTION';
                                                    const s2 = p2 === 'Eco' ? 'EXIS' : p2 === 'Com' ? 'APEX' : 'BASTION';
                                                    return `and Empowers Forge ${s1} & ${s2}`;
                                                });
                                        }
                                        return (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                color: isNew ? '#fbbf24' : '#64748b',
                                                fontSize: '0.75rem',
                                                fontWeight: isNew ? '900' : '500',
                                                padding: '6px 8px',
                                                background: isNew ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0,0,0,0.2)',
                                                borderRadius: '6px',
                                                border: isNew ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                                                textShadow: isNew ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'
                                            }}>
                                                {isNew && <span style={{
                                                    fontSize: '9px',
                                                    background: '#fbbf24',
                                                    color: '#0f172a',
                                                    padding: '2px 5px',
                                                    borderRadius: '3px',
                                                    fontWeight: '900',
                                                    textShadow: 'none',
                                                    boxShadow: '0 0 10px #fbbf24'
                                                }}>{language === 'ru' ? 'НОВОЕ' : 'NEW'}</span>}
                                                {processedPerk}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* FORGE ORIGIN BADGE STYLE */}
                            <div style={{
                                position: 'absolute', bottom: '20px', left: '0', width: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', fontWeight: 900, letterSpacing: '1px' }}>
                                    {getUiTranslation(language as any).matrix.legendaryDetail.forgeOrigin}
                                </span>
                                <span style={{
                                    color: opt.category === 'Economic' ? '#d946ef' : opt.category === 'Combat' ? '#fb923c' : '#4ade80',
                                    fontSize: '10px',
                                    fontWeight: 950,
                                    letterSpacing: '0.5px',
                                    background: `${opt.category === 'Economic' ? '#d946ef' : opt.category === 'Combat' ? '#fb923c' : '#4ade80'}15`,
                                    padding: '1px 6px',
                                    borderRadius: '2px',
                                    border: `1px solid ${opt.category === 'Economic' ? '#d946ef' : opt.category === 'Combat' ? '#fb923c' : '#4ade80'}44`,
                                    textTransform: 'uppercase'
                                }}>
                                    {opt.category === 'Economic' ? (language === 'ru' ? 'ЭКЗИС' : 'EXIS') :
                                        opt.category === 'Combat' ? (language === 'ru' ? 'ПРЕДЕЛ' : 'APEX') :
                                            (language === 'ru' ? 'БАСТИОН' : 'BASTION')}
                                </span>
                            </div>

                            {/* Animated Glow Line */}
                            <div className="legendary-glow-line" style={{
                                position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px',
                                background: info.color, boxShadow: `0 0 15px ${info.color}`
                            }} />
                        </div>
                    );
                })}
            </div>



            <style>{`
                @keyframes legendaryPulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .legendary-glow-line {
                    animation: legendaryPulse 2s infinite ease-in-out;
                }
            `}</style>
        </div >
    );
};
