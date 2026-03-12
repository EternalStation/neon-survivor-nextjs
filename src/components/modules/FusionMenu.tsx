import React, { useState, useEffect } from 'react';
import type { GameState, LegendaryHex, LegendaryCategory } from '../../logic/core/Types';
import { LEGENDARY_UPGRADES } from '../../logic/upgrades/LegendaryData';
import * as MergeLogic from '../../logic/upgrades/LegendaryMergeLogic';
import { playSfx } from '../../logic/audio/AudioLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/UiTranslations';
import styles from './FusionMenu.module.css';

interface FusionMenuProps {
    gameState: GameState;
    onClose: () => void;
    onUpdate?: () => void;
    initialHighlightType?: string;
}

interface FusionConfig {
    id: string;
    result: string;
    bases: string[];
    perform: (gameState: GameState) => void;
}

const FUSIONS: FusionConfig[] = [
    { id: 'XenoAlchemist', result: 'XenoAlchemist', bases: ['EcoXP', 'DefPuddle'], perform: MergeLogic.performXenoAlchemistMerge },
    { id: 'IrradiatedMire', result: 'IrradiatedMire', bases: ['DefPuddle', 'ComRadiation'], perform: MergeLogic.performIrradiatedMireMerge },
    { id: 'NeuralSingularity', result: 'NeuralSingularity', bases: ['EcoXP', 'ComWave'], perform: MergeLogic.performNeuralSingularityMerge },
    { id: 'KineticTsunami', result: 'KineticTsunami', bases: ['EcoDMG', 'ComWave'], perform: MergeLogic.performKineticTsunamiMerge },
    { id: 'SoulShatterCore', result: 'SoulShatterCore', bases: ['ComCrit', 'EcoDMG'], perform: MergeLogic.performSoulShatterCoreMerge },
    { id: 'BloodForgedCapacitor', result: 'BloodForgedCapacitor', bases: ['ComLife', 'DefBattery'], perform: MergeLogic.performBloodForgedCapacitorMerge },
    { id: 'GravityAnchor', result: 'GravityAnchor', bases: ['EcoShield', 'DefEpi'], perform: MergeLogic.performGravityAnchorMerge },
    { id: 'TemporalMonolith', result: 'TemporalMonolith', bases: ['EcoShield', 'DefPlatting'], perform: MergeLogic.performTemporalMonolithMerge },
    { id: 'NeutronStar', result: 'NeutronStar', bases: ['EcoHP', 'ComRadiation'], perform: MergeLogic.performNeutronStarMerge },
    { id: 'GravitationalHarvest', result: 'GravitationalHarvest', bases: ['EcoHP', 'DefEpi'], perform: MergeLogic.performGravitationalHarvestMerge },
    { id: 'ShatteredCapacitor', result: 'ShatteredCapacitor', bases: ['ComCrit', 'DefBattery'], perform: MergeLogic.performShatteredCapacitorMerge },
    { id: 'ChronoDevourer', result: 'ChronoDevourer', bases: ['ComLife', 'DefPlatting'], perform: MergeLogic.performChronoDevourerMerge },
];

const CATEGORY_COLORS: Record<LegendaryCategory, string> = {
    Economic: '#fbbf24',
    Combat: '#ef4444',
    Defensive: '#3b82f6',
    Fusion: '#c084fc'
};

function getCatColor(categories: LegendaryCategory[] | undefined): string {
    if (!categories || categories.length === 0) return '#c084fc';
    return CATEGORY_COLORS[categories[0]] ?? '#c084fc';
}

function getSecColor(categories: LegendaryCategory[] | undefined): string {
    if (!categories || categories.length < 2) return getCatColor(categories);
    return CATEGORY_COLORS[categories[1]] ?? '#c084fc';
}

type LegendaryTransEntry = { name?: string; desc?: string; skillDesc?: string };
type LegendaryTranslationsIndex = Record<string, LegendaryTransEntry> & { perks?: Record<string, string[]> };

interface CardData {
    fusion: FusionConfig;
    hasBase1: boolean;
    hasBase2: boolean;
    canMerge: boolean;
    wasConsumed: boolean;
    isActiveTarget: boolean;
    base1Data: LegendaryHex;
    base2Data: LegendaryHex;
    resultData: LegendaryHex;
}

function getFusionPerkGroups(fusionId: string, translations: ReturnType<typeof getUiTranslation>): { title: string; perks: string[] }[] {
    const legTrans = translations.legendaries as object as LegendaryTranslationsIndex;
    const raw = legTrans.perks?.[fusionId];
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

interface CardCSSVariables extends React.CSSProperties {
    '--primary': string;
    '--secondary': string;
    '--status': string;
}

interface FusionCardProps {
    data: CardData;
    isSelected: boolean;
    onSelect: () => void;
    onFuse: () => void;
    animDelay: number;
    translations: ReturnType<typeof getUiTranslation>;
}

const FusionCard: React.FC<FusionCardProps> = ({ data, isSelected, onSelect, onFuse, animDelay, translations }) => {
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

    const legTrans = translations.legendaries as object as LegendaryTranslationsIndex;
    const fusionTrans = legTrans[data.fusion.result];
    const skillDesc = fusionTrans?.skillDesc ?? '';
    const perkGroups = getFusionPerkGroups(data.fusion.result, translations);

    const cardClass = [
        styles.card,
        wasConsumed ? styles.cardConsumed : '',
        entered ? (isSelected ? styles.cardEnteredSelected : styles.cardEntered) : '',
    ].join(' ');

    const cardInnerClass = [
        styles.cardInner,
        isSelected ? styles.cardInnerSelected : '',
    ].join(' ');

    const topBarClass = [
        styles.topBar,
        canMerge ? styles.topBarActive : '',
    ].join(' ');

    return (
        <div
            onClick={onSelect}
            className={cardClass}
            style={{ '--primary': primaryColor, '--secondary': secondaryColor, '--status': statusColor } as CardCSSVariables}
        >
            <div className={cardInnerClass}>
                <div className={topBarClass} />

                <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                        <div className={`${styles.cardName} ${canMerge ? styles.cardNameActive : ''}`}>
                            {resultData.name}
                        </div>
                        <div className={styles.cardStatus}>
                            {statusLabel}
                        </div>
                    </div>

                    <div className={styles.cardVisuals}>
                        <div className={`${styles.baseSlot} ${!hasBase1 ? styles.baseSlotInactive : ''}`}>
                            <img
                                src={base1Data.customIcon ?? `/assets/hexes/${base1Data.type}.png`}
                                className={`${styles.baseImg} ${hasBase1 ? styles.baseImgPrimary : ''}`}
                                alt={base1Data.name}
                            />
                        </div>

                        <div className={styles.flowArrow}>
                            <svg width="40" height="20" viewBox="0 0 40 20" className={styles.flowSvg}>
                                <line x1="0" y1="10" x2="40" y2="10"
                                    stroke={canMerge ? 'var(--primary)' : '#334155'} strokeWidth="2" opacity="0.3" />
                                {canMerge && (
                                    <line x1="0" y1="10" x2="40" y2="10"
                                        stroke="var(--primary)" strokeWidth="2" strokeDasharray="6 6"
                                        className={styles.fusionFlowLine} />
                                )}
                            </svg>
                        </div>

                        <div className={`${styles.baseSlot} ${!hasBase2 ? styles.baseSlotInactive : ''}`}>
                            <img
                                src={base2Data.customIcon ?? `/assets/hexes/${base2Data.type}.png`}
                                className={`${styles.baseImg} ${hasBase2 ? styles.baseImgSecondary : ''}`}
                                alt={base2Data.name}
                            />
                        </div>

                        <div className={styles.flowArrow}>
                            <svg width="40" height="20" viewBox="0 0 40 20" className={styles.flowSvg}>
                                <line x1="0" y1="10" x2="40" y2="10"
                                    stroke={canMerge ? 'var(--secondary)' : '#334155'} strokeWidth="2" opacity="0.3" />
                                {canMerge && (
                                    <line x1="0" y1="10" x2="40" y2="10"
                                        stroke="var(--secondary)" strokeWidth="2" strokeDasharray="6 6"
                                        className={styles.fusionFlowLine} />
                                )}
                            </svg>
                        </div>

                        <div className={`${styles.resultSlot} ${!canMerge ? styles.resultSlotInactive : ''}`}>
                            <img
                                src={resultData.customIcon ?? `/assets/hexes/${resultData.type}.png`}
                                className={`${styles.resultImg} ${canMerge ? styles.resultImgActive : ''}`}
                                alt={resultData.name}
                            />
                        </div>
                    </div>
                </div>

                {isSelected && (
                    <div className={styles.cardDetail}>
                        <div className={styles.skillDesc}>
                            ⚡ {skillDesc}
                        </div>

                        {perkGroups.length > 0 && (
                            <div className={styles.perkGroups}>
                                {perkGroups.map((group, gIdx) => (
                                    <div key={gIdx}>
                                        <div className={`${styles.perkGroupTitle} ${gIdx === 0 ? styles.perkGroupTitlePrimary : styles.perkGroupTitleSecondary}`}>
                                            {group.title}
                                        </div>
                                        {group.perks.map((perk, pIdx) => (
                                            <div key={pIdx} className={`${styles.perkItem} ${gIdx === 0 ? styles.perkItemPrimary : styles.perkItemSecondary}`}>
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
                                className={styles.fuseBtn}
                            >
                                ⚡ INITIATE FUSION ⚡
                            </button>
                        )}

                        {wasConsumed && (
                            <div className={styles.consumedMsg}>
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
    const { language } = useLanguage();
    const translations = getUiTranslation(language);

    const ownedLevels = new Map<string, number>();
    gameState.moduleSockets.hexagons.forEach(hex => {
        if (hex) ownedLevels.set(hex.type, hex.level);
    });

    const fusionCards: CardData[] = FUSIONS
        .map(f => {
            const l1 = ownedLevels.get(f.bases[0]) ?? 0;
            const l2 = ownedLevels.get(f.bases[1]) ?? 0;
            return {
                fusion: f,
                hasBase1: l1 >= 1,
                hasBase2: l2 >= 1,
                canMerge: l1 >= 4 && l2 >= 4,
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
    const partialCount = fusionCards.filter(f => !f.canMerge && !f.wasConsumed && (f.hasBase1 || f.hasBase2)).length;

    return (
        <div className={styles.overlay}>
            <div className={styles.scanlines} />
            <div className={styles.dotGrid} />
            <div className={styles.ambientGlow} />

            <div className={styles.header}>
                <div className={styles.headerSubtitle}>PROTOCOL // LEGENDARY</div>
                <h1 className={styles.headerTitle}>FUSION FORGE</h1>

                <svg width="240" height="10" viewBox="0 0 240 10" className={styles.decorativeSvg}>
                    <line x1="0" y1="5" x2="95" y2="5" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                    <polygon points="105,1 113,5 105,9" fill="#22d3ee" opacity="0.5" />
                    <circle cx="120" cy="5" r="3" fill="#22d3ee" opacity="0.8" />
                    <polygon points="135,1 127,5 135,9" fill="#22d3ee" opacity="0.5" />
                    <line x1="145" y1="5" x2="240" y2="5" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                </svg>

                <div className={styles.statsRow}>
                    <div className={`${styles.statItem} ${styles.statItemReady}`}>
                        <div className={`${styles.statDot} ${styles.statDotReady} ${readyCount > 0 ? styles.statDotReadyAnim : ''}`} />
                        {readyCount} READY
                    </div>
                    <div className={`${styles.statItem} ${styles.statItemPartial}`}>
                        <div className={`${styles.statDot} ${styles.statDotPartial}`} />
                        {partialCount} PARTIAL
                    </div>
                </div>
            </div>

            <div className={styles.scrollArea}>
                <div className={styles.cardGrid}>
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
                        <div className={styles.emptyState}>
                            <svg width="60" height="60" viewBox="0 0 60 60" className={styles.emptyStateIcon}>
                                <polygon points="30,3 57,18 57,42 30,57 3,42 3,18" fill="none" stroke="#22d3ee" strokeWidth="2" />
                                <line x1="30" y1="3" x2="30" y2="57" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                                <line x1="3" y1="30" x2="57" y2="30" stroke="#22d3ee" strokeWidth="1" opacity="0.3" />
                            </svg>
                            <div className={styles.emptyStateTitle}>NO FUSIONS DETECTED</div>
                            <div className={styles.emptyStateSub}>
                                Fusions represent the ultimate evolution of your abilities.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={onClose} className={styles.closeBtn}>
                ✕ CLOSE
            </button>
        </div>
    );
};
