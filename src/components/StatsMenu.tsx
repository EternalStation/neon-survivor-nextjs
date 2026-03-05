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


import { getKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';
import { SHAPE_DEFS, SHAPE_CYCLE_ORDER } from '../logic/core/constants';
import { getCycleHpMult } from '../logic/enemies/EnemySpawnLogic';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

import { formatLargeNumber } from '../utils/format';

interface StatsMenuProps {
    gameState: GameState;
}

export const StatRow: React.FC<{ label: string; stat: PlayerStats; isPercent?: boolean; extraInfo?: string; legendaryBonusFlat?: number; legendaryBonusPct?: number; arenaMult?: number; isDisabled?: boolean }> = ({ label, stat, isPercent, extraInfo, legendaryBonusFlat = 0, legendaryBonusPct = 0, arenaMult = 1, isDisabled = false }) => {
    // Formula: (Base + Flat + HexFlat) * (1 + NormalMult%) * (1 + HexMult%) * (1 + ClassMult%)
    const baseSum = stat.base + stat.flat + legendaryBonusFlat;
    const upgradeMult = 1 + (stat.mult || 0) / 100;
    const hexScaling = 1 + legendaryBonusPct / 100;
    const classScaling = 1 + (stat.classMult || 0) / 100;

    let total = baseSum * upgradeMult * hexScaling * classScaling * arenaMult;
    if (isDisabled) total = 0;

    const formatNum = (val: number) => {
        return formatLargeNumber(val);
    };

    const displayTotal = isPercent ? `${formatNum(total)}%` : formatNum(total);

    // Color logic
    const isBuffed = arenaMult > 1;
    // Use Red if disabled, else normal color logic
    const totalColor = isDisabled ? '#ef4444' : (isBuffed ? '#3b82f6' : '#4ade80');

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{label}</span>
                {extraInfo && <span style={{ color: '#64748b', fontSize: 12 }}>{extraInfo}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>

                {/* 1. Base (Sum of Base + Flat + HexFlat) */}
                {legendaryBonusFlat > 0 ? (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        ({formatLargeNumber(Math.round((stat.base + stat.flat) * 10) / 10)} <span style={{ color: '#fbbf24' }}>+{formatLargeNumber(Math.round(legendaryBonusFlat * 10) / 10)}</span>)
                    </span>
                ) : (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        {formatLargeNumber(Math.round(baseSum * 10) / 10)}
                    </span>
                )}

                {/* 2. Upgrade Mult */}
                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatLargeNumber(Math.round(upgradeMult * 100))}%</span>

                {/* 3. Hex Mult (Orange) */}
                {legendaryBonusPct > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#f97316', fontSize: 12 }}>{formatLargeNumber(Math.round(hexScaling * 100))}%</span>
                    </>
                )}

                {/* 4. Hex Mult 2 (Kinetic Battery - Custom Color) */}
                {(stat.hexMult2 ?? 0) > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: label === 'Regeneration' ? '#3b82f6' : '#fbbf24', fontSize: 12 }}>{formatLargeNumber(Math.round((1 + (stat.hexMult2 ?? 0) / 100) * 100))}%</span>
                    </>
                )}

                {/* 5. Class Mult (Pink-Purple) */}
                {(stat.classMult ?? 0) !== 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#d946ef', fontSize: 12 }}>{formatLargeNumber(Math.round(classScaling * 100))}%</span>
                    </>
                )}

                {/* 6. Arena Mult (Only if != 1) */}
                {arenaMult !== 1 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#3b82f6', fontSize: 12 }}>{formatLargeNumber(Math.round(arenaMult * 100))}%</span>
                    </>
                )}

                {/* 7. Equals Total */}
                <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                <span style={{ color: totalColor, fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                    {displayTotal}
                </span>
            </div>
        </div>
    );
};

// --- MAIN MENU ---

/**
 * UPDATED SYSTEM STATS MENU (Version 2.1)
 * Removed Level display as requested.
 * Restored Movement Speed and Regeneration.
 * Fixed Pierce display for non-Malware classes.
 */
export const StatsMenu: React.FC<StatsMenuProps> = ({ gameState }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const [activeTab, setActiveTab] = useState<'system' | 'threat'>('system');
    const { player } = gameState;

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
            </div>

            {/* HEADER */}
            <div style={{
                padding: '0 10px 10px 10px',
                textAlign: 'center',
                color: activeTab === 'system' ? '#22d3ee' : '#f87171',
                fontWeight: 900,
                borderBottom: '1px solid #334155',
                marginBottom: 10,
                letterSpacing: '1px',
                fontSize: 14,
                textTransform: 'uppercase'
            }}>
                {activeTab === 'system' ? t.statsMenu.headers.system : t.statsMenu.headers.threat}
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
                                    {/* 1. Armor */}
                                    <StatRow
                                        label={t.statsMenu.labels.armor}
                                        stat={player.arm}
                                        legendaryBonusFlat={player.arm.hexFlat || 0}
                                        legendaryBonusPct={player.arm.hexMult || 0}
                                        extraInfo={`(${(getDefenseReduction(calcStat(player.arm)) * 100).toFixed(1)}%)`}
                                    />

                                    {/* 2. Collision Reduction */}
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

                                    {/* 3. Projectile Reduction */}
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

                                    {/* 4. XP Gain */}
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

                                    {/* 5. Meteorite Drop */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.meteoriteChance}</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(() => {
                                                const baseChance = 5.0; // Static 5% Base Chance

                                                const surge = isBuffActive(gameState, 'ARENA_SURGE') ? 2.0 : 1.0;
                                                const arenaMult = gameState.xpSoulBuffMult || 1.0;

                                                const hexFlat = calculateLegendaryBonus(gameState, 'met_drop_per_kill'); // flat boost (e.g. 0.01 for 1%)

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

                                    {/* 6. Cooldown Reduction */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.cooldownReduction}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {((1 - getCdMod(gameState, player)) * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* 7. Movement Speed */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.movementSpeed}</span>
                                        <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600 }}>
                                            {player.speed.toFixed(1)}
                                        </span>
                                    </div>

                                    {/* 8. Pierce */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{t.statsMenu.labels.pierce}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {player.pierce}
                                        </span>
                                    </div>

                                    {/* --- FUNDAMENTAL STATS --- */}
                                    <StatRow label={t.statsMenu.labels.health} stat={player.hp} legendaryBonusFlat={player.hp.hexFlat || 0} legendaryBonusPct={player.hp.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} />
                                    <StatRow label={t.statsMenu.labels.regeneration} stat={player.reg} legendaryBonusFlat={player.reg.hexFlat || 0} legendaryBonusPct={player.reg.hexMult || 0} arenaMult={gameState.hpRegenBuffMult} isDisabled={player.healingDisabled} />
                                    <StatRow label={t.statsMenu.labels.damage} stat={player.dmg} legendaryBonusFlat={player.dmg.hexFlat || 0} legendaryBonusPct={player.dmg.hexMult || 0} arenaMult={gameState.dmgAtkBuffMult} />
                                    <StatRow
                                        label={t.statsMenu.labels.attackSpeed}
                                        stat={player.atk}
                                        legendaryBonusFlat={player.atk.hexFlat || 0}
                                        legendaryBonusPct={player.atk.hexMult || 0}
                                        arenaMult={gameState.dmgAtkBuffMult}
                                        extraInfo={(() => {
                                            const score = calcStat(player.atk, gameState.dmgAtkBuffMult);
                                            const sps = 2.64 * Math.log(score / 100) - 1.25;
                                            return `(${sps.toFixed(2)} ${t.units.sps})`;
                                        })()}
                                    />

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

            <div style={{ marginTop: 'auto', paddingTop: 20, color: '#475569', fontSize: 10, textAlign: 'center' }}>
                {t.statsMenu.footer.replace('{key}', getKeyDisplay(getKeybinds().stats))}
            </div>
        </div>
    );
};

// --- THREAT PROGRESSION UI ---

const ThreatProgression: React.FC<{ gameState: GameState, t: any }> = ({ gameState, t }) => {
    // Generate data for 0-60 minutes
    const minutes = Array.from({ length: 61 }, (_, i) => i);

    // HP Data
    const hpData = minutes.map(m => {
        const difficultyMult = 1 + (m * Math.log2(2 + m) / 30);
        const hpMult = getCycleHpMult(m * 60);
        const baseHp = 60 * Math.pow(1.2, m) * difficultyMult;
        return baseHp * hpMult;
    });

    // Spawn Rate Data
    const spawnRateData = minutes.map(m => {
        let addedRate = 0;
        const fullCycles = Math.floor(m / 5);
        for (let i = 0; i < fullCycles; i++) {
            addedRate += 1.0 * (i + 1);
        }
        const currentCycleRate = 0.2 * (fullCycles + 1);
        addedRate += (m % 5) * currentCycleRate;
        return GAME_CONFIG.ENEMY.BASE_SPAWN_RATE + addedRate;
    });

    // Specific HP Milestones
    const targetHPPoints = [
        hpData[0], // Start
        20000000,   // 20M (Updated from 12M)
        6000000000, // 6B 
        500000000000, // 500B
        hpData[60]  // Max
    ];

    const hpDots = targetHPPoints.slice(1).map(target => {
        let bestMinute = 0;
        let minDiff = Infinity;
        hpData.forEach((val, m) => {
            const diff = Math.abs(val - target);
            if (diff < minDiff) {
                minDiff = diff;
                bestMinute = m;
            }
        });
        return { minute: bestMinute, value: target };
    });

    // Specific Spawn Rate Milestones
    const targetSpawnPoints = [1.5, 8, 20, 45, 79.5]; // Updated: 5->8, 15->20, 40->45
    const spawnDots = targetSpawnPoints.slice(1).map(target => {
        let bestMinute = 0;
        let minDiff = Infinity;
        spawnRateData.forEach((val, m) => {
            const diff = Math.abs(val - target);
            if (diff < minDiff) {
                minDiff = diff;
                bestMinute = m;
            }
        });
        return { minute: bestMinute, value: target };
    });

    const currentMinute = Math.min(60, gameState.gameTime / 60);

    // Current Values for side-display
    const currentBaseHp = (() => {
        const m = gameState.gameTime / 60;
        const difficultyMult = 1 + (m * Math.log2(2 + m) / 30);
        const hpMult = getCycleHpMult(gameState.gameTime) * SHAPE_DEFS['circle'].hpMult;
        const baseHp = 60 * Math.pow(1.2, m) * difficultyMult;
        return Math.round(baseHp * hpMult);
    })();

    const currentSpawnRate = (() => {
        const m = gameState.gameTime / 60;
        let addedRate = 0;
        const fullCycles = Math.floor(m / 5);
        for (let i = 0; i < fullCycles; i++) {
            addedRate += 1.0 * (i + 1);
        }
        const currentCycleRate = 0.2 * (fullCycles + 1);
        addedRate += (m % 5) * currentCycleRate;
        return GAME_CONFIG.ENEMY.BASE_SPAWN_RATE + addedRate;
    })();

    return (
        <>
            {/* HEALTH SECTION */}
            <div style={{ paddingLeft: 10, marginTop: 10, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
                    {t.statsMenu.threat.hpGrowth}
                </div>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SimpleLineChart
                            data={hpData}
                            color="#4ade80"
                            yLabel={(val) => formatLargeNumber(val)}
                            scaleType="power"
                            customTicks={targetHPPoints}
                            dots={hpDots}
                            currentTimeMinute={currentMinute}
                        />
                    </div>
                    <div style={{ width: 70, flexShrink: 0, position: 'relative', left: -40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(74, 222, 128, 0.05)', height: 170, borderRadius: 8, border: '1px solid rgba(74, 222, 128, 0.1)', zIndex: 5, boxSizing: 'border-box' }}>
                        <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 900 }}>{formatLargeNumber(currentBaseHp)}</div>
                        <div style={{ color: '#475569', fontSize: 8, fontWeight: 800, textAlign: 'center' }}>{t.statsMenu.threat.currentHp}</div>
                    </div>
                </div>
            </div>

            {/* SPAWN RATE SECTION */}
            <div style={{ paddingLeft: 10, marginTop: 20, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
                    {t.statsMenu.threat.spawnRateGrowth}
                </div>
                <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <SimpleLineChart
                            data={spawnRateData}
                            color="#22d3ee"
                            yLabel={(val) => val.toFixed(1)}
                            scaleType="linear"
                            customTicks={targetSpawnPoints}
                            dots={spawnDots}
                            currentTimeMinute={currentMinute}
                        />
                    </div>
                    <div style={{ width: 70, flexShrink: 0, position: 'relative', left: -40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'rgba(34, 211, 238, 0.05)', height: 170, borderRadius: 8, border: '1px solid rgba(34, 211, 238, 0.1)', zIndex: 5, boxSizing: 'border-box' }}>
                        <div style={{ color: '#22d3ee', fontSize: 16, fontWeight: 900 }}>{currentSpawnRate.toFixed(1)}</div>
                        <div style={{ color: '#475569', fontSize: 8, fontWeight: 800, textAlign: 'center' }}>{t.statsMenu.threat.unitsSec}</div>
                    </div>
                </div>
            </div>

            {/* ARENA ENEMY DATA */}
            <div style={{ marginTop: 20, width: '100%', paddingLeft: 10, paddingRight: 15, boxSizing: 'border-box' }}>
                <div style={{
                    padding: '8px 10px',
                    textAlign: 'center',
                    color: '#ef4444',
                    fontWeight: 900,
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px 8px 0 0',
                    fontSize: 14,
                    letterSpacing: '1.5px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    textTransform: 'uppercase'
                }}>
                    {t.statsMenu.threat.analysis}
                </div>

                <div style={{
                    padding: '12px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid #1e293b',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    {(() => {
                        const t_next = gameState.nextBossSpawnTime || 105;
                        const minutes = t_next / 60;
                        const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
                        const shapeIndex = Math.floor(minutes) % 5;
                        const shapeId = SHAPE_CYCLE_ORDER[shapeIndex];
                        const hpMult = getCycleHpMult(t_next) * SHAPE_DEFS[shapeId].hpMult;
                        const baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;

                        const mTotal = Math.floor(minutes);
                        let progressiveBonus = 0;
                        const fullIntervals = Math.floor(mTotal / 5);
                        for (let i = 0; i < fullIntervals; i++) {
                            progressiveBonus += 5 * (i + 1);
                        }
                        progressiveBonus += (mTotal % 5) * (fullIntervals + 1);
                        const bossHpMult = 25 + progressiveBonus;
                        const nextBossHp = baseHp * bossHpMult * hpMult;
                        const collisionDmg = nextBossHp * 0.075;

                        return (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>{t.statsMenu.threat.nextBossHp}</span>
                                    <span style={{ color: '#f87171', fontSize: 16, fontWeight: 900, position: 'relative', left: -30 }}>
                                        {formatLargeNumber(Math.round(nextBossHp))}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>{t.statsMenu.threat.collisionDmg}</span>
                                    <span style={{ color: '#f87171', fontSize: 16, fontWeight: 900, position: 'relative', left: -30 }}>
                                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginRight: 8 }}>7.5% /</span>
                                        {formatLargeNumber(Math.round(collisionDmg))}
                                    </span>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </>
    );
};

const SimpleLineChart: React.FC<{
    data: number[],
    color: string,
    yLabel: (val: number) => string,
    scaleType: 'linear' | 'log' | 'power',
    customTicks?: number[],
    dots?: { minute: number, value: number }[],
    currentTimeMinute?: number
}> = ({ data, color, yLabel, scaleType, customTicks, dots, currentTimeMinute }) => {
    // Optimized Dimensions to fit without scrolling
    const width = 290;
    const height = 170;
    const padding = { top: 15, right: 30, bottom: 25, left: 55 };

    const maxVal = Math.max(...data);
    const minVal = scaleType !== 'linear' ? Math.min(...data.filter(v => v > 0)) : 0;

    const getY = (val: number) => {
        const availableHeight = height - padding.top - padding.bottom;

        if (scaleType === 'log') {
            const logMin = Math.log10(minVal);
            const logMax = Math.log10(maxVal);
            const logVal = Math.log10(val || 1);
            const clampedLog = Math.max(logMin, Math.min(logMax, logVal));
            return height - padding.bottom - ((clampedLog - logMin) / (logMax - logMin)) * availableHeight;
        } else if (scaleType === 'power') {
            // Power scale (e.g. ^0.2) handles trillions while keeping a visible exponential curve
            const exponent = 0.22;
            const pMin = Math.pow(minVal, exponent);
            const pMax = Math.pow(maxVal, exponent);
            const pVal = Math.pow(val, exponent);
            return height - padding.bottom - ((pVal - pMin) / (pMax - pMin)) * availableHeight;
        } else {
            return height - padding.bottom - (val / maxVal) * availableHeight;
        }
    };

    const getX = (m: number) => {
        return padding.left + (m / 60) * (width - padding.left - padding.right);
    };

    // Interpolate for current time value
    const getCurrentValue = (m: number) => {
        const floorM = Math.floor(m);
        const ceilM = Math.min(60, Math.ceil(m));
        if (floorM === ceilM) return data[floorM];
        const t = m - floorM;
        return data[floorM] * (1 - t) + data[ceilM] * t;
    };

    const points = data.map((val, i) => {
        const x = getX(i);
        const y = getY(val);
        return `${x},${y}`;
    }).join(' ');

    const gridMinutes = [0, 10, 20, 30, 40, 50, 60];
    const ticks = customTicks || (scaleType === 'power' ? [minVal, Math.pow(maxVal, 0.5), maxVal] : [minVal, maxVal / 2, maxVal]);

    return (
        <div style={{ position: 'relative', width, height, background: 'rgba(15, 23, 42, 0.5)', borderRadius: 12, border: '1px solid #334155', marginInline: 'auto', overflow: 'hidden' }}>
            <svg width={width} height={height} style={{ display: 'block' }}>
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* 5-Min Cycle Vertical Bands */}
                {Array.from({ length: 12 }).map((_, i) => (
                    <rect
                        key={i}
                        x={getX(i * 5)}
                        y={padding.top}
                        width={(5 / 60) * (width - padding.left - padding.right)}
                        height={height - padding.top - padding.bottom}
                        fill={i % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'}
                    />
                ))}

                {/* Grid Lines X */}
                {gridMinutes.map(m => {
                    const x = getX(m);
                    return (
                        <g key={m}>
                            <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
                            <text x={x} y={height - 8} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">{m}</text>
                        </g>
                    );
                })}

                {/* Grid Lines Y */}
                {ticks.map((val, i) => {
                    if (val < minVal && scaleType !== 'linear') return null;
                    const y = getY(val);
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(51, 65, 85, 0.3)" strokeDasharray="3,3" />
                            <text x={padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="end">{yLabel(val)}</text>
                        </g>
                    );
                })}

                {/* The Line Area */}
                <polyline
                    points={`${padding.left},${height - padding.bottom} ${points} ${width - padding.right},${height - padding.bottom}`}
                    fill={`url(#grad-${color})`}
                />

                {/* The Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />

                {/* Progress Dots */}
                {dots?.map((dot, i) => (
                    <g key={i}>
                        <circle
                            cx={getX(dot.minute)}
                            cy={getY(dot.value)}
                            r="4"
                            fill={color}
                            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                        />
                        <circle
                            cx={getX(dot.minute)}
                            cy={getY(dot.value)}
                            r="8"
                            fill="none"
                            stroke={color}
                            strokeWidth="1"
                            strokeOpacity="0.5"
                        />
                    </g>
                ))}

                {/* Player Progress Marker (Pulse Red Dot) */}
                {currentTimeMinute !== undefined && (
                    <g>
                        <circle
                            cx={getX(currentTimeMinute)}
                            cy={getY(getCurrentValue(currentTimeMinute))}
                            r="5"
                            fill="#ef4444"
                            style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}
                        >
                            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle
                            cx={getX(currentTimeMinute)}
                            cy={getY(getCurrentValue(currentTimeMinute))}
                            r="10"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="1.5"
                            strokeOpacity="0.4"
                        >
                            <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                        </circle>
                    </g>
                )}
            </svg>
        </div>
    );
};
