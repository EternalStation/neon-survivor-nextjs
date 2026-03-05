import React, { useState, useEffect, useRef } from 'react';
import type { GameState } from '../../logic/core/types';
import { LEGENDARY_UPGRADES } from '../../logic/upgrades/LegendaryLogic';
import * as MergeLogic from '../../logic/upgrades/LegendaryMergeLogic';
import { playSfx } from '../../logic/audio/AudioLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface FusionMenuProps {
    gameState: GameState;
    onClose: () => void;
    onUpdate?: () => void;
    initialHighlightType?: string;
}

const FUSIONS = [
    { id: 'XenoAlchemist', result: 'XenoAlchemist', bases: ['EcoXP', 'DefPuddle'], perform: MergeLogic.performXenoAlchemistMerge },
    { id: 'IrradiatedMire', result: 'IrradiatedMire', bases: ['DefPuddle', 'RadiationCore'], perform: MergeLogic.performIrradiatedMireMerge },
    { id: 'NeuralSingularity', result: 'NeuralSingularity', bases: ['EcoXP', 'ComWave'], perform: MergeLogic.performNeuralSingularityMerge },
    { id: 'KineticTsunami', result: 'KineticTsunami', bases: ['EcoDMG', 'ComWave'], perform: MergeLogic.performKineticTsunamiMerge },
    { id: 'SoulShatterCore', result: 'SoulShatterCore', bases: ['ComCrit', 'EcoDMG'], perform: MergeLogic.performSoulShatterCoreMerge },
    { id: 'BloodForgedCapacitor', result: 'BloodForgedCapacitor', bases: ['ComLife', 'KineticBattery'], perform: MergeLogic.performBloodForgedCapacitorMerge },
    { id: 'GravityAnchor', result: 'GravityAnchor', bases: ['CombShield', 'DefEpi'], perform: MergeLogic.performGravityAnchorMerge },
    { id: 'TemporalMonolith', result: 'TemporalMonolith', bases: ['CombShield', 'ChronoPlating'], perform: MergeLogic.performTemporalMonolithMerge },
    { id: 'NeutronStar', result: 'NeutronStar', bases: ['EcoHP', 'RadiationCore'], perform: MergeLogic.performNeutronStarMerge },
    { id: 'GravitationalHarvest', result: 'GravitationalHarvest', bases: ['EcoHP', 'DefEpi'], perform: MergeLogic.performGravitationalHarvestMerge },
    { id: 'ShatteredCapacitor', result: 'ShatteredCapacitor', bases: ['ComCrit', 'KineticBattery'], perform: MergeLogic.performShatteredCapacitorMerge },
    { id: 'ChronoDevourer', result: 'ChronoDevourer', bases: ['ComLife', 'ChronoPlating'], perform: MergeLogic.performChronoDevourerMerge }
];

const CATEGORY_COLORS: Record<string, string> = {
    Economic: '#fbbf24',
    Combat: '#ef4444',
    Defensive: '#3b82f6',
    Fusion: '#c084fc'
};

function getCatColor(categories: string[] | undefined): string {
    if (!categories || categories.length === 0) return '#c084fc';
    return CATEGORY_COLORS[categories[0]] || '#c084fc';
}

function getSecColor(categories: string[] | undefined): string {
    if (!categories || categories.length < 2) return getCatColor(categories);
    return CATEGORY_COLORS[categories[1]] || '#c084fc';
}

interface CardData {
    fusion: typeof FUSIONS[0];
    hasBase1: boolean;
    hasBase2: boolean;
    canMerge: boolean;
    wasConsumed: boolean;
    isActiveTarget: boolean;
    base1Data: typeof LEGENDARY_UPGRADES[string];
    base2Data: typeof LEGENDARY_UPGRADES[string];
    resultData: typeof LEGENDARY_UPGRADES[string];
}

function getFusionPerkGroups(fusionId: string, translations: ReturnType<typeof getUiTranslation>): { title: string; perks: string[] }[] {
    const matrixData = translations.matrix as unknown as Record<string, Record<string, Record<string, string[]>>>;
    const raw = matrixData?.legendaries?.perks?.[fusionId];
    if (!raw) return [];
    const groups: { title: string; perks: string[] }[] = [];
    let current: { title: string; perks: string[] } | null = null;
    for (const line of raw) {
        if (line.startsWith('GROUP:')) {
            if (current) groups.push(current);
            current = { title: line.replace('GROUP:', ''), perks: [] };
        } else if (current) {
            current.perks.push(line);
        }
    }
    if (current) groups.push(current);
    return groups;
}

const FusionCard: React.FC<{
    data: CardData;
    isSelected: boolean;
    onSelect: () => void;
    onFuse: () => void;
    animDelay: number;
    translations: ReturnType<typeof getUiTranslation>;
}> = ({ data, isSelected, onSelect, onFuse, animDelay, translations }) => {
    const { hasBase1, hasBase2, canMerge, wasConsumed, base1Data, base2Data, resultData } = data;
    const [entered, setEntered] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setEntered(true), animDelay);
        return () => clearTimeout(timer);
    }, [animDelay]);

    const primaryColor = getCatColor(resultData.categories);
    const secondaryColor = getSecColor(resultData.categories);

    let statusLabel = 'LOCKED';
    let statusColor = '#475569';
    if (wasConsumed) { statusLabel = 'CONSUMED'; statusColor = '#ef4444'; }
    else if (canMerge) { statusLabel = 'READY'; statusColor = '#10b981'; }
    else if (hasBase1 || hasBase2) { statusLabel = 'PARTIAL'; statusColor = '#f59e0b'; }

    const matrixData = translations.matrix as unknown as Record<string, Record<string, { skillDesc?: string }>>;
    const fusionTrans = matrixData?.legendaries?.[data.fusion.result];
    const skillDesc = fusionTrans?.skillDesc || "";
    const perkGroups = getFusionPerkGroups(data.fusion.result, translations);

    return (
        <div
            onClick={onSelect}
            style={{
                width: '100%',
                opacity: entered ? 1 : 0,
                transform: entered ? (isSelected ? 'scale(1.02)' : 'scale(1)') : 'translateY(20px) scale(0.95)',
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: 'pointer',
                position: 'relative',
                filter: wasConsumed ? 'grayscale(0.7) brightness(0.5)' : 'none'
            }}
        >
            <div style={{
                background: isSelected
                    ? `linear-gradient(135deg, ${primaryColor}15 0%, rgba(5,5,15,0.95) 40%, ${secondaryColor}10 100%)`
                    : 'linear-gradient(135deg, rgba(12,16,30,0.98) 0%, rgba(6,8,20,0.99) 100%)',
                border: isSelected ? `2px solid ${primaryColor}88` : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: isSelected ? `0 0 40px ${primaryColor}22, inset 0 1px 0 ${primaryColor}15` : '0 2px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease'
            }}>
                <div style={{
                    height: '3px',
                    background: canMerge
                        ? `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`
                        : `linear-gradient(90deg, ${primaryColor}33, ${secondaryColor}33)`,
                    opacity: canMerge ? 1 : 0.4
                }} />

                <div style={{ padding: '14px 18px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{
                            fontSize: '12px', fontWeight: 900, color: canMerge ? '#e2e8f0' : '#64748b',
                            letterSpacing: '1.5px', textTransform: 'uppercase',
                            textShadow: canMerge ? `0 0 15px ${primaryColor}44` : 'none'
                        }}>
                            {resultData.name}
                        </div>
                        <div style={{
                            fontSize: '8px', fontWeight: 900, letterSpacing: '2px',
                            color: statusColor, padding: '2px 8px', borderRadius: '4px',
                            background: `${statusColor}12`, border: `1px solid ${statusColor}28`
                        }}>
                            {statusLabel}
                        </div>
                    </div>

                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0', padding: '4px 0', position: 'relative'
                    }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            flex: '0 0 90px',
                            filter: hasBase1 ? 'none' : 'grayscale(100%) brightness(0.35)',
                            transition: 'filter 0.3s'
                        }}>
                            <img
                                src={base1Data.customIcon || `/assets/hexes/${base1Data.type}.png`}
                                style={{
                                    width: '72px', height: '72px', objectFit: 'contain',
                                    filter: hasBase1 ? `drop-shadow(0 0 8px ${primaryColor}66)` : 'none',
                                    transition: 'filter 0.3s'
                                }}
                                alt={base1Data.name}
                            />
                        </div>

                        <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
                            <svg width="40" height="20" viewBox="0 0 40 20" style={{ overflow: 'visible' }}>
                                <line x1="0" y1="10" x2="40" y2="10"
                                    stroke={canMerge ? primaryColor : '#334155'} strokeWidth="2" opacity="0.3" />
                                {canMerge && (
                                    <line x1="0" y1="10" x2="40" y2="10"
                                        stroke={primaryColor} strokeWidth="2" strokeDasharray="6 6"
                                        className="fusion-flow-anim" />
                                )}
                            </svg>
                        </div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            flex: '0 0 90px',
                            filter: hasBase2 ? 'none' : 'grayscale(100%) brightness(0.35)',
                            transition: 'filter 0.3s'
                        }}>
                            <img
                                src={base2Data.customIcon || `/assets/hexes/${base2Data.type}.png`}
                                style={{
                                    width: '72px', height: '72px', objectFit: 'contain',
                                    filter: hasBase2 ? `drop-shadow(0 0 8px ${secondaryColor}66)` : 'none',
                                    transition: 'filter 0.3s'
                                }}
                                alt={base2Data.name}
                            />
                        </div>

                        <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
                            <svg width="40" height="20" viewBox="0 0 40 20" style={{ overflow: 'visible' }}>
                                <line x1="0" y1="10" x2="40" y2="10"
                                    stroke={canMerge ? '#22d3ee' : '#334155'} strokeWidth="2" opacity="0.3" />
                                {canMerge && (
                                    <line x1="0" y1="10" x2="40" y2="10"
                                        stroke="#22d3ee" strokeWidth="2" strokeDasharray="6 6"
                                        className="fusion-flow-anim" />
                                )}
                            </svg>
                        </div>

                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            flex: '0 0 120px',
                            filter: canMerge ? 'none' : 'grayscale(50%) brightness(0.55)',
                            transition: 'filter 0.3s'
                        }}>
                            <img
                                src={resultData.customIcon || `/assets/hexes/${resultData.type}.png`}
                                style={{
                                    width: '104px', height: '104px', objectFit: 'contain',
                                    filter: canMerge ? 'drop-shadow(0 0 16px rgba(34,211,238,0.7))' : 'none',
                                    transition: 'filter 0.3s'
                                }}
                                alt={resultData.name}
                            />
                        </div>
                    </div>
                </div>

                {isSelected && (
                    <div style={{
                        padding: '0 18px 16px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        marginTop: '2px',
                        animation: 'fusionDetailSlideIn 0.3s ease-out'
                    }}>
                        <div style={{
                            fontSize: '10px', color: '#22d3ee', lineHeight: '1.6',
                            padding: '10px 0 8px', fontWeight: 700, letterSpacing: '0.3px',
                            borderLeft: '2px solid #22d3ee44', paddingLeft: '10px'
                        }}>
                            ⚡ {skillDesc}
                        </div>

                        {perkGroups.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {perkGroups.map((group, gIdx) => (
                                    <div key={gIdx}>
                                        <div style={{
                                            fontSize: '8px', fontWeight: 900, letterSpacing: '2px',
                                            color: gIdx === 0 ? '#22d3ee' : '#64748b',
                                            marginBottom: '4px', textTransform: 'uppercase',
                                            borderBottom: `1px solid ${gIdx === 0 ? '#22d3ee22' : '#1e293b'}`,
                                            paddingBottom: '3px'
                                        }}>
                                            {group.title}
                                        </div>
                                        {group.perks.map((perk, pIdx) => (
                                            <div key={pIdx} style={{
                                                fontSize: '9px', color: gIdx === 0 ? '#94a3b8' : '#475569',
                                                padding: '2px 0 2px 8px', lineHeight: '1.5',
                                                borderLeft: `1px solid ${gIdx === 0 ? '#22d3ee22' : '#1e293b'}`
                                            }}>
                                                {perk}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {canMerge && !wasConsumed && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onFuse(); }}
                                style={{
                                    width: '100%', padding: '12px', marginTop: '10px',
                                    background: `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}33)`,
                                    border: `1px solid ${primaryColor}77`,
                                    color: '#fff', fontWeight: 900, fontSize: '12px',
                                    borderRadius: '8px', cursor: 'pointer',
                                    textTransform: 'uppercase', letterSpacing: '3px',
                                    boxShadow: `0 0 20px ${primaryColor}22`,
                                    transition: 'all 0.2s', fontFamily: 'Orbitron, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 0 35px ${primaryColor}44`;
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}55, ${secondaryColor}55)`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 0 20px ${primaryColor}22`;
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${primaryColor}33, ${secondaryColor}33)`;
                                }}
                            >
                                ⚡ INITIATE FUSION ⚡
                            </button>
                        )}

                        {wasConsumed && (
                            <div style={{
                                textAlign: 'center', fontSize: '9px', color: '#ef4444',
                                fontWeight: 900, letterSpacing: '2px', padding: '8px 0', marginTop: '6px'
                            }}>
                                FUSION BLOCKED — COMPONENT CONSUMED
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const FusionMenu: React.FC<FusionMenuProps> = ({ gameState, onClose, onUpdate, initialHighlightType }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scanlineOffset, setScanlineOffset] = useState(0);
    const { language } = useLanguage();
    const translations = getUiTranslation(language);

    const level4Hexes = new Set<string>();
    gameState.moduleSockets.hexagons.forEach(hex => {
        if (hex && hex.level >= 4) level4Hexes.add(hex.type);
    });

    useEffect(() => {
        let frame: number;
        const tick = () => {
            setScanlineOffset(prev => (prev + 0.3) % 100);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    const fusionCards: CardData[] = FUSIONS
        .filter(f => level4Hexes.has(f.bases[0]) || level4Hexes.has(f.bases[1]))
        .map(f => {
            const h1 = level4Hexes.has(f.bases[0]);
            const h2 = level4Hexes.has(f.bases[1]);
            return {
                fusion: f, hasBase1: h1, hasBase2: h2, canMerge: h1 && h2,
                wasConsumed: !!(gameState.player.consumedLegendaries?.includes(f.bases[0]) || gameState.player.consumedLegendaries?.includes(f.bases[1])),
                isActiveTarget: initialHighlightType === f.bases[0] || initialHighlightType === f.bases[1],
                base1Data: LEGENDARY_UPGRADES[f.bases[0]],
                base2Data: LEGENDARY_UPGRADES[f.bases[1]],
                resultData: LEGENDARY_UPGRADES[f.result]
            };
        })
        .sort((a, b) => {
            if (a.canMerge && !b.canMerge) return -1;
            if (!a.canMerge && b.canMerge) return 1;
            if (a.wasConsumed && !b.wasConsumed) return 1;
            if (!a.wasConsumed && b.wasConsumed) return -1;
            return 0;
        });

    const readyCount = fusionCards.filter(f => f.canMerge && !f.wasConsumed).length;
    const partialCount = fusionCards.filter(f => !f.canMerge && !f.wasConsumed).length;

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(15,20,40,0.98), rgba(3,3,12,0.99) 70%)',
            zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center',
            fontFamily: 'Orbitron, sans-serif', color: '#e2e8f0', overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,211,238,0.15) 2px, rgba(34,211,238,0.15) 4px)',
                backgroundSize: '100% 4px',
                backgroundPosition: `0 ${scanlineOffset}px`
            }} />

            <div style={{
                position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(34,211,238,0.25) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }} />

            <div style={{
                position: 'absolute', top: '50%', left: '50%', width: '500px', height: '500px',
                transform: 'translate(-50%, -50%)', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(34,211,238,0.03) 0%, transparent 70%)',
                pointerEvents: 'none', filter: 'blur(40px)'
            }} />

            <div style={{
                padding: '24px 40px 0', width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2
            }}>
                <div style={{
                    fontSize: '10px', color: '#475569', letterSpacing: '6px',
                    fontWeight: 700, textAlign: 'center', marginBottom: '4px'
                }}>
                    PROTOCOL // LEGENDARY
                </div>
                <h1 style={{
                    fontSize: '26px', fontWeight: 900, letterSpacing: '8px',
                    color: '#22d3ee', margin: '0 0 6px 0', textAlign: 'center',
                    textShadow: '0 0 30px rgba(34,211,238,0.4), 0 0 60px rgba(34,211,238,0.15)',
                    background: 'linear-gradient(180deg, #67e8f9, #22d3ee, #0891b2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    FUSION FORGE
                </h1>

                <svg width="240" height="10" viewBox="0 0 240 10" style={{ marginBottom: '6px' }}>
                    <line x1="0" y1="5" x2="95" y2="5" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                    <polygon points="105,1 113,5 105,9" fill="#22d3ee" opacity="0.5" />
                    <circle cx="120" cy="5" r="3" fill="#22d3ee" opacity="0.8" />
                    <polygon points="135,1 127,5 135,9" fill="#22d3ee" opacity="0.5" />
                    <line x1="145" y1="5" x2="240" y2="5" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                </svg>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>
                        <div style={{
                            width: '7px', height: '7px', borderRadius: '50%', background: '#10b981',
                            boxShadow: '0 0 8px #10b981',
                            animation: readyCount > 0 ? 'fusionDotPulse 1.5s infinite' : 'none'
                        }} />
                        {readyCount} READY
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#f59e0b', fontWeight: 700, letterSpacing: '1px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
                        {partialCount} PARTIAL
                    </div>
                </div>
            </div>

            <div style={{
                flex: 1, overflowY: 'auto', width: '100%', zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0 20px 30px', overflowX: 'hidden'
            }}>
                <div style={{
                    width: '100%', maxWidth: '780px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '12px', justifyItems: 'center'
                }}>
                    {fusionCards.map((data, idx) => (
                        <FusionCard
                            key={data.fusion.id}
                            data={data}
                            isSelected={selectedId === data.fusion.id}
                            onSelect={() => setSelectedId(selectedId === data.fusion.id ? null : data.fusion.id)}
                            onFuse={() => {
                                data.fusion.perform(gameState);
                                playSfx('upgrade-confirm');
                                onUpdate?.();
                                onClose();
                            }}
                            animDelay={idx * 80}
                            translations={translations}
                        />
                    ))}

                    {fusionCards.length === 0 && (
                        <div style={{
                            gridColumn: '1 / -1', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '16px'
                        }}>
                            <svg width="60" height="60" viewBox="0 0 60 60" style={{ opacity: 0.15 }}>
                                <polygon points="30,3 57,18 57,42 30,57 3,42 3,18" fill="none" stroke="#22d3ee" strokeWidth="2" />
                                <line x1="30" y1="3" x2="30" y2="57" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                                <line x1="3" y1="30" x2="57" y2="30" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                            </svg>
                            <div style={{ color: '#475569', fontSize: '13px', fontWeight: 700, letterSpacing: '3px' }}>
                                NO FUSIONS DETECTED
                            </div>
                            <div style={{ color: '#334155', fontSize: '10px', letterSpacing: '1px' }}>
                                Requires at least one Level 4 Legendary Module
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b', padding: '8px 18px', cursor: 'pointer',
                    fontSize: '10px', fontWeight: 700, borderRadius: '6px',
                    transition: 'all 0.2s', textTransform: 'uppercase',
                    letterSpacing: '2px', backdropFilter: 'blur(10px)',
                    fontFamily: 'Orbitron, sans-serif', zIndex: 10
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#e2e8f0';
                    e.currentTarget.style.borderColor = '#22d3ee';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(34,211,238,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                }}
            >
                ✕ CLOSE
            </button>

            <style>{`
                @keyframes fusionResultPulse {
                    0%, 100% { box-shadow: inset 0 0 10px rgba(34,211,238,0.1); opacity: 0.4; }
                    50% { box-shadow: inset 0 0 25px rgba(34,211,238,0.3); opacity: 1; }
                }
                @keyframes fusionDotPulse {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.4); opacity: 1; }
                }
                @keyframes fusionDetailSlideIn {
                    from { opacity: 0; max-height: 0; }
                    to { opacity: 1; max-height: 600px; }
                }
                @keyframes fusionFlowAnim {
                    from { stroke-dashoffset: 12; }
                    to { stroke-dashoffset: 0; }
                }
                .fusion-flow-anim {
                    animation: fusionFlowAnim 0.5s linear infinite;
                }
            `}</style>
        </div>
    );
};
