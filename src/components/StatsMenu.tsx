import React, {useState} from 'react';
import {RadarChart} from './RadarChart';
import type {GameState} from '../logic/core/Types';
import {calcStat, getDefenseReduction} from '../logic/utils/MathUtils';
import {getCdMod} from '../logic/utils/CooldownUtils';
import {calculateLegendaryBonus} from '../logic/upgrades/LegendaryLogic';
import {isBuffActive} from '../logic/upgrades/BlueprintLogic';
import {PLAYER_CLASSES} from '../logic/core/Classes';
import {getKeybinds, getKeyDisplay} from '../logic/utils/Keybinds';
import {useLanguage} from '../lib/LanguageContext';
import {getUiTranslation} from '../lib/UiTranslations';
import {formatLargeNumber} from '../utils/Format';
import {ThreatProgression} from './ThreatProgression';
import {StatRow} from './stats/StatRow';
import {DamageRow} from './stats/DamageRow';
import {VitalsAnalysis} from './stats/VitalsAnalysis';
import {getDamageMapping} from '../utils/DamageMapping';
import styles from './StatsMenu.module.css';

export { RadarChart };

const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '168, 85, 247';
};

interface CSSVariables extends React.CSSProperties {
    '--class-color': string;
    '--class-rgb': string;
}

interface ChildRowCSSVariables extends React.CSSProperties {
    '--source-color': string;
}

interface StatsMenuProps {
    gameState: GameState;
}

type ActiveTab = 'system' | 'threat' | 'damage' | 'incoming';

type ExtendedLabels = ReturnType<typeof getUiTranslation>['statsMenu']['labels'] & {
    baseStats?: string;
    classStats?: string;
    specialStats?: string;
    damageSources: Record<string, string | undefined>;
};

type ClassStatKey = 'hpMult' | 'spdMult' | 'dmgMult' | 'atkMult' | 'armMult' | 'xpMult' | 'regMult' | 'pierce';

export const StatsMenu: React.FC<StatsMenuProps> = ({ gameState }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const [activeTab, setActiveTab] = useState<ActiveTab>('system');
    const { player } = gameState;
    const currentClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
    const classColor: string = currentClass?.themeColor || '#a855f7';
    const cssVars: CSSVariables = { '--class-color': classColor, '--class-rgb': hexToRgb(classColor) };

    const labels = t.statsMenu.labels as ExtendedLabels;

    const subGroup = (label: string, first: boolean = false): React.ReactElement => (
        <div className={`${styles.subGroupLabel} ${first ? styles.subGroupLabelFirst : ''}`}>
            {label}
        </div>
    );

    const lifesteal = calculateLegendaryBonus(gameState, 'lifesteal');
    const colRed = calculateLegendaryBonus(gameState, 'col_red_per_kill');
    const projRed = calculateLegendaryBonus(gameState, 'proj_red_per_kill');
    const hasAOEPerk = gameState.moduleSockets.hexagons.some(h =>
        h && (h.type === 'EcoDMG' || h.type === 'KineticTsunami' || h.type === 'SoulShatterCore') && h.level >= 4
    );
    const aoeChance = calculateLegendaryBonus(gameState, 'aoe_chance_per_kill');

    const classStatKeys: { key: ClassStatKey; label: string }[] = [
        { key: 'hpMult', label: t.statsMenu.labels.health },
        { key: 'spdMult', label: t.statsMenu.labels.movementSpeed },
        { key: 'dmgMult', label: t.statsMenu.labels.damage },
        { key: 'atkMult', label: t.statsMenu.labels.attackSpeed },
        { key: 'armMult', label: t.statsMenu.labels.armor },
        { key: 'xpMult', label: t.statsMenu.labels.xpGain },
        { key: 'regMult', label: t.statsMenu.labels.regeneration },
        { key: 'pierce', label: t.statsMenu.labels.pierce },
    ];

    return (
        <div className={styles.panel} style={cssVars}>
            <div className={styles.tabBar}>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`${styles.tab} ${activeTab === 'system' ? styles.tabSystemActive : ''}`}
                >
                    {t.statsMenu.tabs.system}
                </button>
                <button
                    onClick={() => setActiveTab('threat')}
                    className={`${styles.tab} ${activeTab === 'threat' ? styles.tabThreatActive : ''}`}
                >
                    {t.statsMenu.tabs.threat}
                </button>
                <button
                    onClick={() => setActiveTab('damage')}
                    className={`${styles.tab} ${activeTab === 'damage' ? styles.tabDamageActive : ''}`}
                >
                    {t.statsMenu.tabs.damage}
                </button>
                <button
                    onClick={() => setActiveTab('incoming')}
                    className={`${styles.tab} ${activeTab === 'incoming' ? styles.tabIncomingActive : ''}`}
                >
                    {t.statsMenu.tabs.incoming}
                </button>
            </div>

            <div
                className={`${styles.sectionHeader} ${activeTab === 'system' ? styles.headerSystem : activeTab === 'threat' ? styles.headerThreat : activeTab === 'damage' ? styles.headerDamage : styles.headerIncoming}`}
            >
                {activeTab === 'system' ? t.statsMenu.headers.system : activeTab === 'threat' ? t.statsMenu.headers.threat : activeTab === 'damage' ? t.statsMenu.headers.damage : t.statsMenu.headers.incoming}
            </div>

            <div className={`${styles.tabPanel} ${activeTab === 'system' ? styles.tabPanelSystem : styles.tabPanelHidden}`}>
                <div className={styles.statsColumn}>
                    <div className={styles.radarContainer}>
                        <div className={styles.radarWrapper}>
                            <RadarChart player={player} size={140} />
                        </div>
                    </div>

                    <div className={styles.statsCalculations}>
                        <div className={styles.sectionDivider}>{labels.baseStats || 'BASE STATS'}</div>

                        {subGroup('HEALTH & DEFENSE', true)}
                        <StatRow label={t.statsMenu.labels.health} stat={player.hp} t={t} legendaryBonusFlat={player.hp.hexFlat || 0} legendaryBonusPct={player.hp.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} />
                        <StatRow label={t.statsMenu.labels.regeneration} stat={player.reg} t={t} legendaryBonusFlat={player.reg.hexFlat || 0} legendaryBonusPct={player.reg.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} isDisabled={player.healingDisabled} />
                        {lifesteal > 0 && (
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>{t.statsMenu.labels.lifesteal}</span>
                                <span className={`${styles.lifestealValue} ${player.healingDisabled ? styles.lifestealDisabled : styles.lifestealEnabled}`}>
                                    {player.healingDisabled ? '0.0' : lifesteal.toFixed(1)}%
                                </span>
                            </div>
                        )}
                        <StatRow
                            label={t.statsMenu.labels.armor}
                            stat={player.arm}
                            t={t}
                            legendaryBonusFlat={player.arm.hexFlat || 0}
                            legendaryBonusPct={player.arm.hexMult || 0}
                            extraInfo={`(${(getDefenseReduction(calcStat(player.arm)) * 100).toFixed(1)}%)`}
                        />
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.collisionReduction}</span>
                            <span className={styles.statValue}>{Math.min(80, colRed).toFixed(1)}%</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.projectileReduction}</span>
                            <span className={styles.statValue}>{Math.min(80, projRed).toFixed(1)}%</span>
                        </div>

                        {subGroup('COMBAT')}
                        <StatRow label={t.statsMenu.labels.damage} stat={player.dmg} t={t} legendaryBonusFlat={player.dmg.hexFlat || 0} legendaryBonusPct={player.dmg.hexMult || 0} arenaMult={gameState.dmgAtkBuffMult} />
                        <StatRow
                            label={t.statsMenu.labels.attackSpeed}
                            stat={player.atk}
                            t={t}
                            legendaryBonusFlat={player.atk.hexFlat || 0}
                            legendaryBonusPct={player.atk.hexMult || 0}
                            arenaMult={gameState.dmgAtkBuffMult}
                            extraInfo={(() => {
                                const score = calcStat(player.atk, gameState.dmgAtkBuffMult);
                                const sps = 2.64 * Math.log(score / 100) - 1.25;
                                return `(${sps.toFixed(2)} ${t.units.sps})`;
                            })()}
                        />
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.critChance}</span>
                            <span className={styles.statValue}>{player.critChance.toFixed(1)}%</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.critDamage}</span>
                            <span className={styles.statValue}>{player.critDamage.toFixed(0)}%</span>
                        </div>
                        {hasAOEPerk && (
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>{t.statsMenu.labels.knockback}</span>
                                <span className={styles.statValue}>{aoeChance.toFixed(1)}%</span>
                            </div>
                        )}

                        {subGroup('UTILITY')}
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.cooldownReduction}</span>
                            <span className={styles.statValue}>{((1 - getCdMod(gameState, player)) * 100).toFixed(1)}%</span>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.xpGain}</span>
                            <div className={styles.xpRow}>
                                {(() => {
                                    const flatBase = 40 + (player.level * 3) + player.xp_per_kill.flat;
                                    const hexFlat = calculateLegendaryBonus(gameState, 'xp_per_kill');
                                    const baseSum = flatBase + hexFlat;
                                    const normalMult = 1 + player.xp_per_kill.mult / 100;
                                    const hexMult = 1 + calculateLegendaryBonus(gameState, 'xp_pct_per_kill') / 100;
                                    const classMult = 1 + (player.xp_per_kill.classMult || 0) / 100;
                                    const refineryMult = player.inRefineryZone ? 4.0 : 1.0;
                                    const total = baseSum * normalMult * hexMult * classMult * refineryMult;
                                    const showBreakdown = hexFlat > 0;
                                    return (
                                        <>
                                            {showBreakdown ? (
                                                <span className={styles.textMuted}>
                                                    ({Math.round(flatBase).toLocaleString()} <span className={styles.textBonus}>+{Math.round(hexFlat).toLocaleString()}</span>)
                                                </span>
                                            ) : (
                                                <span className={styles.textMuted}>{Math.round(baseSum).toLocaleString()}</span>
                                            )}
                                            <span className={styles.textMuted}> x </span>
                                            <span className={styles.xpNormalMult}>{formatLargeNumber(Math.round(normalMult * 100))}%</span>
                                            {hexMult > 1 && (
                                                <>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.textBonus}>{formatLargeNumber(Math.round(hexMult * 100))}%</span>
                                                </>
                                            )}
                                            {(player.xp_per_kill.classMult || 0) !== 0 && (
                                                <>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.textPurple}>{formatLargeNumber(Math.round(classMult * 100))}%</span>
                                                </>
                                            )}
                                            {player.inRefineryZone && (
                                                <>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.textRefinery}>400%</span>
                                                </>
                                            )}
                                            <span className={styles.textMuted}> = </span>
                                            <span className={player.inRefineryZone ? styles.textRefineryValue : styles.textGreen}>
                                                {formatLargeNumber(Math.round(total))}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabel}>{t.statsMenu.labels.meteoriteChance}</span>
                            <div className={styles.xpRow}>
                                {(() => {
                                    const baseChance = 5.0;
                                    const surge = isBuffActive(gameState, 'ARENA_SURGE') ? 2.0 : 1.0;
                                    const arenaMult = gameState.xpSoulBuffMult || 1.0;
                                    const hexFlat = calculateLegendaryBonus(gameState, 'met_drop_per_kill');
                                    const bluePrintMult = isBuffActive(gameState, 'METEOR_SHOWER') ? (1 + (0.5 * surge)) : 1;
                                    const total = ((baseChance / 100 * arenaMult) + hexFlat) * bluePrintMult * 100;
                                    return (
                                        <>
                                            <span className={styles.textMuted}>{baseChance.toFixed(1)}%</span>
                                            {arenaMult !== 1 && (
                                                <>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.textArena}>{formatLargeNumber(Math.round(arenaMult * 100))}%</span>
                                                </>
                                            )}
                                            {hexFlat > 0 && (
                                                <>
                                                    <span className={styles.textMuted}> + </span>
                                                    <span className={styles.textBonus}>{(hexFlat * 100).toFixed(1)}%</span>
                                                </>
                                            )}
                                            {bluePrintMult !== 1 && (
                                                <>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.xpBlueprintMult}>{formatLargeNumber(Math.round(bluePrintMult * 100))}%</span>
                                                </>
                                            )}
                                            <span className={styles.textMuted}> = </span>
                                            <span className={styles.textGreen}>{formatLargeNumber(total)}%</span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {currentClass && (
                        <div className={styles.classSection}>
                            <div className={styles.classSectionHeader}>
                                <span className={styles.classDiamond}>◆</span>
                                {labels.classStats || 'CLASS STATS'}
                            </div>
                            <div className={styles.classNameRow}>
                                {currentClass.iconUrl && (
                                    <img src={currentClass.iconUrl} alt="" className={styles.classIcon} />
                                )}
                                <span className={styles.className}>{currentClass.capabilityName}</span>
                            </div>

                            {currentClass.capabilityMetrics.map((metric, i) => (
                                <div key={i} className={styles.metricRow}>
                                    <div className={styles.metricLabelGroup}>
                                        <span className={styles.metricLabel}>{metric.label}</span>
                                        {metric.isResonant && <span className={styles.badgeResonant}>RESONANT</span>}
                                        {metric.isStatic && <span className={styles.badgeStatic}>STATIC</span>}
                                    </div>
                                    <span className={`${styles.metricValue} ${metric.isResonant ? styles.metricValueResonant : ''}`}>
                                        {metric.value}{metric.unit}
                                    </span>
                                </div>
                            ))}

                            {classStatKeys
                                .filter(({ key }) => currentClass.stats[key] !== undefined && currentClass.stats[key] !== 0)
                                .map(({ key, label }) => {
                                    const val = currentClass.stats[key]!;
                                    const isPct = key !== 'pierce';
                                    const isPositive = val > 0;
                                    const display = isPct ? `${isPositive ? '+' : ''}${Math.round(val * 100)}%` : `+${val}`;
                                    return (
                                        <div key={key} className={styles.metricRow}>
                                            <span className={styles.metricLabel}>{label}</span>
                                            <span className={`${styles.metricValue} ${isPositive ? styles.metricValuePositive : styles.metricValueNegative}`}>{display}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}

                    <div className={styles.specialSection}>
                        <div className={styles.sectionDivider}>{labels.specialStats || 'SPECIAL STATS'}</div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabelMuted}>{t.statsMenu.labels.movementSpeed}</span>
                            <div className={styles.speedRow}>
                                {(() => {
                                    const s = player.spd;
                                    const preClass = (s.base + s.flat + (s.hexFlat || 0)) * (1 + (s.mult || 0) / 100) * (1 + ((s.hexMult || 0) + (s.hexMult2 || 0)) / 100);
                                    const classMod = 1 + (s.classMult || 0) / 100;
                                    const final = preClass * classMod;
                                    const pctMod = final > 0 ? Math.round(((player.speed / final) - 1) * 100) : 0;
                                    return (
                                        <>
                                            {(s.classMult || 0) !== 0 ? (
                                                <>
                                                    <span className={styles.textMuted}>{preClass.toFixed(1)}</span>
                                                    <span className={styles.textMuted}> x </span>
                                                    <span className={styles.speedClassMult}>{Math.round(classMod * 100)}%</span>
                                                    <span className={styles.textMuted}> = </span>
                                                    <span className={styles.speedValue}>{final.toFixed(1)}</span>
                                                </>
                                            ) : (
                                                <span className={styles.speedValue}>{final.toFixed(1)}</span>
                                            )}
                                            {pctMod !== 0 && (
                                                <span className={styles.speedMod}>
                                                    {pctMod > 0 ? '+' : ''}{pctMod}%
                                                </span>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className={styles.statRow}>
                            <span className={styles.statLabelMuted}>{t.statsMenu.labels.pierce}</span>
                            <span className={styles.speedValue}>{player.pierce}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${styles.tabPanel} ${activeTab === 'threat' ? styles.tabPanelThreat : styles.tabPanelHidden}`}>
                <ThreatProgression gameState={gameState} t={t} />
            </div>

            <div className={`${styles.tabPanel} ${activeTab === 'damage' ? styles.tabPanelDamage : styles.tabPanelHidden}`}>
                <div className={`${styles.totalDamageCard} ${styles.totalDamageCardThemed}`}>
                    <span className={styles.totalDamageLabel}>{labels.damageSources['total']}</span>
                    <span className={styles.totalDamageValue}>{formatLargeNumber(player.damageDealt)}</span>
                </div>

                <div className={styles.damageList}>
                    {(() => {
                        const breakdown = player.damageBreakdown || {};
                        const sources = Object.entries(breakdown)
                            .filter(([_key, amount]) => amount > 0)
                            .sort((a, b) => b[1] - a[1]);

                        if (sources.length === 0) {
                            return <div className={styles.noData}>NO COMBAT DATA RECORDED</div>;
                        }

                        const { groupMap, sourceColors, sourceIcons, sourceGradients } = getDamageMapping(player.playerClass);

                        const processedSources = new Set<string>();
                        const groupedRows: { key: string; total: number; element: React.ReactNode }[] = [];

                        Object.entries(groupMap).forEach(([parent, cfg]) => {
                            let groupTotal = 0;
                            cfg.children.forEach(c => groupTotal += (breakdown[c] || 0));

                            if (groupTotal > 0) {
                                const activeChildren = cfg.children.filter(c => (breakdown[c] || 0) > 0);
                                const showChildren = activeChildren.length > 1;
                                const parentKey = parent.charAt(0).toLowerCase() + parent.slice(1).replace(/\s+/g, '');

                                groupedRows.push({
                                    key: parent,
                                    total: groupTotal,
                                    element: (
                                        <div key={parent + '_group'}>
                                            <DamageRow
                                                label={labels.damageSources[parentKey] || parent}
                                                amount={groupTotal}
                                                total={player.damageDealt}
                                                color={cfg.color}
                                                gradient={cfg.gradient}
                                                icon={cfg.icon}
                                            />
                                            {showChildren && (
                                                <div className={styles.childList}>
                                                    {activeChildren.map(c => {
                                                        const amt = breakdown[c] || 0;
                                                        return (
                                                            <div key={c} className={styles.childRow}>
                                                                <span className={styles.childRowLabel}>- {cfg.childLabels[c] || c}</span>
                                                                <span className={styles.childRowValue} style={{ '--source-color': sourceColors[c] || '#94a3b8' } as ChildRowCSSVariables}>{formatLargeNumber(amt)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                });
                                cfg.children.forEach(c => processedSources.add(c));
                            }
                        });

                        const standaloneRows: { key: string; total: number; element: React.ReactNode }[] = [];
                        sources.forEach(([source, amount]) => {
                            if (processedSources.has(source)) return;

                            const sourceKey = source.charAt(0).toLowerCase() + source.slice(1).replace(/\s+/g, '').replace(/\(LVL\d\)/g, '').replace(/\(|\)/g, '');
                            const label = labels.damageSources[sourceKey] || source;

                            const fusionIconMap: Record<string, string> = {
                                'Neural Singularity': '/assets/Fusions/THE NEURAL SINGULARITY.png',
                                'Kinetic Tsunami': '/assets/Fusions/THE KINETIC TSUNAMI.png',
                                'Neutron Star (Aura)': '/assets/Fusions/THE NEUTRON STAR.png',
                                'Gravitational Harvest': '/assets/Fusions/THE GRAVITATIONAL HARVEST.png',
                                'Necro-Kinetic Engine': '/assets/Fusions/THE NECRO-KINETIC ENGINE.png',
                            };

                            const classSkills = [
                                'Orbital Vortex',
                                'Magnetic Vortex',
                                'Storm Circle',
                                'Void Singularity',
                                'Nanite Swarm',
                                'Quantum Fragmentation',
                                currentClass?.capabilityName
                            ].filter((s): s is string => Boolean(s));

                            const icon = fusionIconMap[source] ||
                                sourceIcons[source] ||
                                (classSkills.includes(source) ? currentClass?.iconUrl : undefined);

                            const subLabelMap: Record<string, string> = {
                                'Storm of Steel (LVL 4)': 'LVL 4 (AOE)',
                                'Collision': 'BODY IMPACT',
                                'Neural Singularity': 'FUSION',
                                'Kinetic Tsunami': 'FUSION',
                                'Neutron Star (Aura)': 'FUSION',
                                'Gravitational Harvest': 'FUSION',
                                'Necro-Kinetic Engine': 'FUSION (BOLTS CAST BY ZOMBIES)',
                            };

                            standaloneRows.push({
                                key: source,
                                total: amount,
                                element: (
                                    <DamageRow
                                        key={source}
                                        label={label}
                                        amount={amount}
                                        total={player.damageDealt}
                                        color={source === 'Projectile' ? (currentClass?.themeColor || '#60a5fa') : (sourceColors[source] || '#94a3b8')}
                                        gradient={sourceGradients[source]}
                                        icon={icon}
                                        subLabel={subLabelMap[source]}
                                    />
                                )
                            });
                        });

                        return [...groupedRows, ...standaloneRows]
                            .sort((a, b) => b.total - a.total)
                            .map(r => r.element);
                    })()}
                </div>
            </div>

            <div className={`${styles.tabPanel} ${activeTab === 'incoming' ? styles.tabPanelIncoming : styles.tabPanelHidden}`}>
                <VitalsAnalysis player={player} t={t} />
            </div>

            <div className={styles.footer}>
                {t.statsMenu.footer.replace('{key}', getKeyDisplay(getKeybinds().stats))}
            </div>
        </div>
    );
};
