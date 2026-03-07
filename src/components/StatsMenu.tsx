import React, { useState } from 'react';
import { RadarChart } from './RadarChart';
export { RadarChart };
import type { GameState, PlayerStats } from '../logic/core/types';
import { calcStat, getDefenseReduction } from '../logic/utils/MathUtils';
import { getCdMod } from '../logic/utils/CooldownUtils';
import { calculateLegendaryBonus } from '../logic/upgrades/LegendaryLogic';
import { getArenaIndex } from '../logic/mission/MapLogic';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { DROP_TABLE } from '../logic/mission/LootLogic';


import { PLAYER_CLASSES } from '../logic/core/classes';
import { getKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';
import { SHAPE_DEFS, SHAPE_CYCLE_ORDER } from '../logic/core/constants';
import { getCycleHpMult } from '../logic/enemies/EnemySpawnLogic';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

import { formatLargeNumber } from '../utils/format';
import { ThreatProgression } from './ThreatProgression';
import { StatRow } from './stats/StatRow';
import { DamageRow } from './stats/DamageRow';
import { getDamageMapping } from '../utils/damageMapping';

interface StatsMenuProps {
    gameState: GameState;
}



export const StatsMenu: React.FC<StatsMenuProps> = ({ gameState }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const [activeTab, setActiveTab] = useState<'system' | 'threat' | 'damage'>('system');
    const { player } = gameState;
    const currentClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
    const classColor = currentClass?.themeColor || '#a855f7';

    // Helper to safely convert hex `#RRGGBB` to rgba without alpha hex logic
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '168, 85, 247';
    };
    const classRgbaBg = `rgba(${hexToRgb(classColor)}, 0.1)`;
    const classRgbaBorder = `rgba(${hexToRgb(classColor)}, 0.2)`;

    return (
        <div className="stats-panel-slide open">
            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: 10 }}>
                <button
                    onClick={() => setActiveTab('system')}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        background: activeTab === 'system' ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${activeTab === 'system' ? '#22d3ee' : 'transparent'}`,
                        color: activeTab === 'system' ? '#22d3ee' : '#64748b',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t.statsMenu.tabs.system}
                </button>
                <button
                    onClick={() => setActiveTab('threat')}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        background: activeTab === 'threat' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${activeTab === 'threat' ? '#ef4444' : 'transparent'}`,
                        color: activeTab === 'threat' ? '#ef4444' : '#64748b',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t.statsMenu.tabs.threat}
                </button>
                <button
                    onClick={() => setActiveTab('damage')}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        background: activeTab === 'damage' ? classRgbaBg : 'transparent',
                        border: 'none',
                        borderBottom: `2px solid ${activeTab === 'damage' ? classColor : 'transparent'}`,
                        color: activeTab === 'damage' ? classColor : '#64748b',
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {t.statsMenu.tabs.damage}
                </button>
            </div>

            {/* HEADER */}
            <div style={{
                padding: '0 10px 10px 10px',
                textAlign: 'center',
                color: activeTab === 'system' ? '#22d3ee' : (activeTab === 'threat' ? '#f87171' : classColor),
                fontWeight: 900,
                borderBottom: '1px solid #334155',
                marginBottom: 10,
                letterSpacing: '1px',
                fontSize: 14,
                textTransform: 'uppercase'
            }}>
                {activeTab === 'system' ? t.statsMenu.headers.system : (activeTab === 'threat' ? t.statsMenu.headers.threat : t.statsMenu.headers.damage)}
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, display: activeTab === 'system' ? 'block' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Radar Chart */}
                    <div className="radar-chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 0 }}>
                        <div className="radar-chart-wrapper" style={{ display: 'inline-block', padding: '15px 5px 5px 5px' }}>
                            <RadarChart player={player} size={140} />
                        </div>
                    </div>

                    {/* Stats Table */}
                    <div className="stats-calculations" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0, marginTop: -10 }}>
                        {(() => {
                            return (
                                <>
                                    <StatRow label={t.statsMenu.labels.health} stat={player.hp} t={t} legendaryBonusFlat={player.hp.hexFlat || 0} legendaryBonusPct={player.hp.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} />
                                    <StatRow label={t.statsMenu.labels.regeneration} stat={player.reg} t={t} legendaryBonusFlat={player.reg.hexFlat || 0} legendaryBonusPct={player.reg.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} isDisabled={player.healingDisabled} />
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
                                    <StatRow
                                        label={t.statsMenu.labels.armor}
                                        stat={player.arm}
                                        t={t}
                                        legendaryBonusFlat={player.arm.hexFlat || 0}
                                        legendaryBonusPct={player.arm.hexMult || 0}
                                        extraInfo={`(${(getDefenseReduction(calcStat(player.arm)) * 100).toFixed(1)}%)`}
                                    />

                                    {(() => {
                                        const colRed = calculateLegendaryBonus(gameState, 'col_red_per_kill');
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.collisionReduction}</span>
                                                <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {Math.min(80, colRed).toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    {(() => {
                                        const projRed = calculateLegendaryBonus(gameState, 'proj_red_per_kill');
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.projectileReduction}</span>
                                                <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {Math.min(80, projRed).toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.xpGain}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(() => {
                                                const flatBase = 40 + (player.level * 3) + player.xp_per_kill.flat;
                                                const hexFlat = calculateLegendaryBonus(gameState, 'xp_per_kill');
                                                const baseSum = flatBase + hexFlat;
                                                const normalMult = 1 + player.xp_per_kill.mult / 100;
                                                const hexMult = 1 + calculateLegendaryBonus(gameState, 'xp_pct_per_kill') / 100;
                                                const classMult = 1 + (player.xp_per_kill.classMult || 0) / 100;
                                                const refineryMult = (player as any).inRefineryZone ? 4.0 : 1.0;
                                                const total = baseSum * normalMult * hexMult * classMult * refineryMult;
                                                const showBreakdown = hexFlat > 0;

                                                return (
                                                    <>
                                                        {showBreakdown ? (
                                                            <span style={{ color: '#64748b', fontSize: 12 }}>
                                                                ({Math.round(flatBase).toLocaleString()} <span style={{ color: '#fbbf24' }}>+{Math.round(hexFlat).toLocaleString()}</span>)
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#64748b', fontSize: 12 }}>{Math.round(baseSum).toLocaleString()}</span>
                                                        )}
                                                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatLargeNumber(Math.round(normalMult * 100))}%</span>
                                                        {hexMult > 1 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#fbbf24', fontSize: 12 }}>{formatLargeNumber(Math.round(hexMult * 100))}%</span>
                                                            </>
                                                        )}
                                                        {(player.xp_per_kill.classMult || 0) !== 0 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#d946ef', fontSize: 12 }}>{formatLargeNumber(Math.round(classMult * 100))}%</span>
                                                            </>
                                                        )}
                                                        {(player as any).inRefineryZone && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#22d3ee', fontSize: 12 }}>400%</span>
                                                            </>
                                                        )}
                                                        <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                                                        <span style={{ color: (player as any).inRefineryZone ? '#22d3ee' : '#4ade80', fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                                                            {formatLargeNumber(Math.round(total))}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.meteoriteChance}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(() => {
                                                const baseChance = 5.0;
                                                const surge = isBuffActive(gameState, 'ARENA_SURGE') ? 2.0 : 1.0;
                                                const arenaMult = gameState.xpSoulBuffMult || 1.0;
                                                const hexFlat = calculateLegendaryBonus(gameState, 'met_drop_per_kill');
                                                const bluePrintMult = isBuffActive(gameState, 'METEOR_SHOWER') ? (1 + (0.5 * surge)) : 1;
                                                const total = ((baseChance / 100 * arenaMult) + hexFlat) * bluePrintMult * 100;

                                                return (
                                                    <>
                                                        <span style={{ color: '#64748b', fontSize: 12 }}>{baseChance.toFixed(1)}%</span>
                                                        {arenaMult !== 1 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#3b82f6', fontSize: 12 }}>{formatLargeNumber(Math.round(arenaMult * 100))}%</span>
                                                            </>
                                                        )}
                                                        {hexFlat > 0 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> + </span>
                                                                <span style={{ color: '#fbbf24', fontSize: 12 }}>{(hexFlat * 100).toFixed(1)}%</span>
                                                            </>
                                                        )}
                                                        {bluePrintMult !== 1 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#60a5fa', fontSize: 12 }}>{formatLargeNumber(Math.round(bluePrintMult * 100))}%</span>
                                                            </>
                                                        )}
                                                        <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                                                        <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                                                            {formatLargeNumber(total)}%
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.cooldownReduction}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {((1 - getCdMod(gameState, player)) * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.movementSpeed}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            {player.playerClass === 'stormstrike' && (
                                                <>
                                                    {(() => {
                                                        const ct = player.stormCircleChargeTime ?? 0;
                                                        const maxCharge = GAME_CONFIG.SKILLS.STORM_CIRCLE_MAX_CHARGE;
                                                        const p = Math.max(0, Math.min(1, ct / maxCharge));
                                                        let stormMod = 1;
                                                        if (p < 0.05) {
                                                            stormMod = 0.9 + (p / 0.05) * 0.1;
                                                        } else {
                                                            stormMod = 1.0 + ((p - 0.05) / 0.95) * 0.1;
                                                        }
                                                        const baseSpeed = calcStat(player.spd);
                                                        return (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}>({baseSpeed.toFixed(1)} <span style={{ color: '#fbbf24' }}>x {Math.round(stormMod * 100)}%</span>)</span>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                                                            </>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                            <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600 }}>
                                                {player.speed.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.pierce}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {player.pierce}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.critChance}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {player.critChance.toFixed(1)}%
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.critDamage}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {player.critDamage.toFixed(0)}%
                                        </span>
                                    </div>


                                    {/* --- CONDITIONAL STATS --- */}
                                    {(() => {
                                        const lifesteal = calculateLegendaryBonus(gameState, 'lifesteal');
                                        if (lifesteal <= 0) return null;
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.lifesteal}</span>
                                                <span style={{ color: player.healingDisabled ? '#ef4444' : '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {player.healingDisabled ? '0.0' : lifesteal.toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const hasAOEPerk = gameState.moduleSockets.hexagons.some(h =>
                                            h && (h.type === 'EcoDMG' || h.type === 'KineticTsunami' || h.type === 'SoulShatterCore') && h.level >= 4
                                        );
                                        if (!hasAOEPerk) return null;

                                        const aoeChance = calculateLegendaryBonus(gameState, 'aoe_chance_per_kill');
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.knockback}</span>
                                                <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {aoeChance.toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* THREAT CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, display: activeTab === 'threat' ? 'flex' : 'none', flexDirection: 'column', gap: 20 }}>
                <ThreatProgression gameState={gameState} t={t} />
            </div>

            {/* DAMAGE CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingRight: 4, display: activeTab === 'damage' ? 'flex' : 'none', flexDirection: 'column', gap: 10, padding: '0 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: classRgbaBg, borderRadius: 8, border: `1px solid ${classRgbaBorder}`, marginBottom: 10 }}>
                    <span style={{ color: classColor, fontSize: 13, fontWeight: 900, letterSpacing: '1px' }}>{t.statsMenu.labels.damageSources.total}</span>
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>{formatLargeNumber(player.damageDealt)}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                        const breakdown = player.damageBreakdown || {};

                        const sources = Object.entries(breakdown)
                            .filter(([_, amount]) => amount > 0)
                            .sort((a, b) => b[1] - a[1]);

                        if (sources.length === 0) {
                            return (
                                <div style={{ textAlign: 'center', color: '#64748b', fontSize: 12, marginTop: 40, letterSpacing: '1px' }}>
                                    NO COMBAT DATA RECORDED
                                </div>
                            );
                        }

                        const { groupMap, sourceColors, sourceGradients, classColor } = getDamageMapping(player.playerClass);

                        const processedSources = new Set<string>();
                        const groupedRows: { key: string; total: number; element: React.ReactNode }[] = [];

                        Object.entries(groupMap).forEach(([parent, cfg]) => {
                            let groupTotal = 0;
                            cfg.children.forEach(c => groupTotal += (breakdown[c] || 0));

                            if (groupTotal > 0) {
                                const activeChildren = cfg.children.filter(c => (breakdown[c] || 0) > 0);
                                const showChildren = activeChildren.length > 1;

                                groupedRows.push({
                                    key: parent,
                                    total: groupTotal,
                                    element: (
                                        <div key={parent + "_group"}>
                                            <DamageRow
                                                label={parent === 'Projectile' ? ((t.statsMenu.labels.damageSources as any).projectile || 'Projectile') : parent}
                                                amount={groupTotal}
                                                total={player.damageDealt}
                                                color={cfg.color}
                                                gradient={cfg.gradient}
                                                icon={cfg.icon}
                                            />
                                            {showChildren && (
                                                <div style={{ paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 0, marginTop: -4 }}>
                                                    {activeChildren.map(c => {
                                                        const amt = breakdown[c] || 0;
                                                        return (
                                                            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(30, 41, 59, 0.5)', alignItems: 'center' }}>
                                                                <span style={{ color: '#64748b', fontSize: 11, fontWeight: 600 }}>- {cfg.childLabels[c] || c}</span>
                                                                <span style={{ color: sourceColors[c] || '#94a3b8', fontSize: 11, fontWeight: 700 }}>{formatLargeNumber(amt)}</span>
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
                            const label = (t.statsMenu.labels.damageSources as any)[sourceKey] || source;

                            const fusionIconMap: Record<string, string> = {
                                'Neural Singularity': '/assets/Fusions/THE NEURAL SINGULARITY.png',
                                'Kinetic Tsunami': '/assets/Fusions/THE KINETIC TSUNAMI.png',
                                'Neutron Star (Aura)': '/assets/Fusions/THE NEUTRON STAR.png',
                                'Gravitational Harvest': '/assets/Fusions/THE GRAVITATIONAL HARVEST.png',
                                'Necro-Kinetic Engine': '/assets/Fusions/THE NECRO-KINETIC ENGINE.png',
                            };

                            const baseIconMap: Record<string, string> = {
                                'Storm of Steel (LVL 4)': '/assets/hexes/EcoDMG.png',
                                'Radiation Aura': '/assets/hexes/ComRad.png',
                                'Shockwave': '/assets/hexes/ComWave.png',
                                'Fire Turret': '🔥',
                                'Ice Turret': '❄️',
                                'Wall Shockwave': '🧱',
                                'Malware Wall Bonus': '/assets/hexes/MalwarePrime.png',
                            };

                            const classSkills = [
                                'Orbital Vortex',
                                'Magnetic Vortex',
                                'Storm Circle',
                                'Void Singularity',
                                'Nanite Swarm',
                                'Quantum Fragmentation',
                                currentClass?.capabilityName
                            ].filter(Boolean);

                            const icon = fusionIconMap[source] ||
                                baseIconMap[source] ||
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

                        const allRows = [...groupedRows, ...standaloneRows]
                            .sort((a, b) => b.total - a.total);

                        return allRows.map(r => r.element);
                    })()}
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20, color: '#475569', fontSize: 10, textAlign: 'center' }}>
                {t.statsMenu.footer.replace('{key}', getKeyDisplay(getKeybinds().stats))}
            </div>
        </div>
    );
};

