import React from 'react';
import { RadarChart } from './RadarChart';
export { RadarChart };
import type { GameState, PlayerStats } from '../logic/core/types';
import { calcStat, getDefenseReduction } from '../logic/utils/MathUtils';
import { calculateLegendaryBonus } from '../logic/upgrades/LegendaryLogic';
import { getArenaIndex } from '../logic/mission/MapLogic';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { DROP_TABLE } from '../logic/mission/LootLogic';


import { getKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';

interface StatsMenuProps {
    gameState: GameState;
}

export const StatRow: React.FC<{ label: string; stat: PlayerStats; isPercent?: boolean; extraInfo?: string; legendaryBonusFlat?: number; legendaryBonusPct?: number; arenaMult?: number }> = ({ label, stat, isPercent, extraInfo, legendaryBonusFlat = 0, legendaryBonusPct = 0, arenaMult = 1 }) => {
    // Formula: (Base + Flat + HexFlat) * (1 + NormalMult%) * (1 + HexMult%)
    const baseSum = stat.base + stat.flat + legendaryBonusFlat;
    const upgradeMult = 1 + (stat.mult || 0) / 100;
    const hexScaling = 1 + legendaryBonusPct / 100;

    const total = baseSum * upgradeMult * hexScaling * arenaMult;

    const formatNum = (val: number) => {
        if (isPercent) return Math.round(val).toLocaleString();
        return (Math.round(val * 10) / 10).toLocaleString();
    };

    const displayTotal = isPercent ? `${formatNum(total)}%` : formatNum(total);

    // Color logic
    const isBuffed = arenaMult > 1;
    // User requested Green for all non-buffed stats (avoiding Red for base stats)
    const totalColor = isBuffed ? '#3b82f6' : '#4ade80';

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
                        ({(Math.round((stat.base + stat.flat) * 10) / 10).toLocaleString()} <span style={{ color: '#fbbf24' }}>+{(Math.round(legendaryBonusFlat * 10) / 10).toLocaleString()}</span>)
                    </span>
                ) : (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        {(Math.round(baseSum * 10) / 10).toLocaleString()}
                    </span>
                )}

                {/* 2. Upgrade Mult */}
                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{Math.round(upgradeMult * 100)}%</span>

                {/* 3. Hex Mult (Orange) */}
                {legendaryBonusPct > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#f97316', fontSize: 12 }}>{Math.round(hexScaling * 100)}%</span>
                    </>
                )}

                {/* 4. Hex Mult 2 (Kinetic Battery - Custom Color) */}
                {(stat.hexMult2 ?? 0) > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: label === 'Regeneration' ? '#3b82f6' : '#fbbf24', fontSize: 12 }}>{Math.round((1 + (stat.hexMult2 ?? 0) / 100) * 100)}%</span>
                    </>
                )}

                {/* 5. Arena Mult (Only if != 1) */}
                {arenaMult !== 1 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#3b82f6', fontSize: 12 }}>{Math.round(arenaMult * 100)}%</span>
                    </>
                )}

                {/* 6. Equals Total */}
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
    const { player } = gameState;
    return (
        <div className="stats-panel-slide open">
            {/* HEADER */}
            <div style={{
                padding: 10,
                textAlign: 'center',
                color: '#22d3ee',
                fontWeight: 900,
                borderBottom: '1px solid #334155',
                marginBottom: 10,
                letterSpacing: '1px'
            }}>
                SYSTEM DIAGNOSTICS
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Radar Chart */}
                    <div className="radar-chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: -10 }}>
                        <div className="radar-chart-wrapper" style={{ display: 'inline-block', padding: 5 }}>
                            <RadarChart player={player} size={180} />
                        </div>
                    </div>

                    {/* Stats Table */}
                    <div className="stats-calculations" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {(() => {
                            const arenaIdx = getArenaIndex(player.x, player.y);
                            const surgeMult = gameState.activeBlueprintBuffs['ARENA_SURGE'] ? 2.0 : 1.0;
                            let hpMult = arenaIdx === 2 ? 1 + (0.2 * surgeMult) : 1;
                            let regMult = arenaIdx === 2 ? 1 + (0.2 * surgeMult) : 1;

                            if (player.buffs?.puddleRegen) {
                                hpMult *= 1.25;
                                regMult *= 1.25;
                            }

                            return (
                                <>
                                    <StatRow label="Health" stat={player.hp} legendaryBonusFlat={player.hp.hexFlat || 0} legendaryBonusPct={player.hp.hexMult || 0} arenaMult={hpMult} />
                                    <StatRow label="Regeneration" stat={player.reg} legendaryBonusFlat={player.reg.hexFlat || 0} legendaryBonusPct={player.reg.hexMult || 0} arenaMult={regMult} />
                                    <StatRow label="Damage" stat={player.dmg} legendaryBonusFlat={player.dmg.hexFlat || 0} legendaryBonusPct={player.dmg.hexMult || 0} />
                                    <StatRow
                                        label="Attack Speed"
                                        stat={player.atk}
                                        legendaryBonusFlat={player.atk.hexFlat || 0}
                                        legendaryBonusPct={player.atk.hexMult || 0}
                                        extraInfo={(() => {
                                            // Updated formula: 300 atk = 1.65/s, 500 atk = 3/s, 20000 atk = ~10/s
                                            const score = calcStat(player.atk);
                                            const sps = 2.64 * Math.log(score / 100) - 1.25;
                                            return `(${sps.toFixed(2)}/s)`;
                                        })()}
                                    />
                                    <StatRow
                                        label="Armor"
                                        stat={player.arm}
                                        legendaryBonusFlat={player.arm.hexFlat || 0}
                                        legendaryBonusPct={player.arm.hexMult || 0}
                                        extraInfo={`(${(getDefenseReduction(calcStat(player.arm)) * 100).toFixed(1)}%)`}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Movement Speed</span>
                                        <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600 }}>
                                            {player.speed.toFixed(1)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Cooldown Reduction</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {((player.cooldownReduction || 0) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    {(() => {
                                        const colRed = calculateLegendaryBonus(gameState, 'col_red_per_kill');
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Collision Reduction</span>
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
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Projectile Reduction</span>
                                                <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {Math.min(80, projRed).toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}
                                    {(() => {
                                        const lifesteal = calculateLegendaryBonus(gameState, 'lifesteal');
                                        if (lifesteal <= 0) return null;
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Lifesteal</span>
                                                <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                                    {lifesteal.toFixed(1)}%
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>XP Gain per kill</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(() => {
                                                const flatBase = 40 + (player.level * 3) + player.xp_per_kill.flat;
                                                const hexFlat = calculateLegendaryBonus(gameState, 'xp_per_kill');
                                                const baseSum = flatBase + hexFlat;
                                                const normalMult = 1 + player.xp_per_kill.mult / 100;
                                                const hexMult = 1 + calculateLegendaryBonus(gameState, 'xp_pct_per_kill') / 100;
                                                const total = baseSum * normalMult * hexMult;
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
                                                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{Math.round(normalMult * 100)}%</span>
                                                        {hexMult > 1 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#fbbf24', fontSize: 12 }}>{Math.round(hexMult * 100)}%</span>
                                                            </>
                                                        )}
                                                        <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                                                        <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                                                            {Math.round(total).toLocaleString()}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Meteorite Drop Chance</span>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                                            {(() => {
                                                const minutes = gameState.gameTime / 60;
                                                const entry = DROP_TABLE.find(e => minutes >= e.min && minutes < e.max) || DROP_TABLE[DROP_TABLE.length - 1];
                                                const baseChance = entry.weights.reduce((a, b) => a + b, 0); // %

                                                const surge = isBuffActive(gameState, 'ARENA_SURGE') ? 2.0 : 1.0;
                                                const arenaIdx = getArenaIndex(player.x, player.y);
                                                let arenaMult = 1;
                                                if (arenaIdx === 0) arenaMult = (1 + (0.15 * surge));

                                                const hexFlat = calculateLegendaryBonus(gameState, 'met_drop_per_kill'); // flat boost (e.g. 0.01 for 1%)

                                                const bluePrintMult = isBuffActive(gameState, 'METEOR_SHOWER') ? (1 + (0.5 * surge)) : 1;

                                                const total = ((baseChance / 100 * arenaMult) + hexFlat) * bluePrintMult * 100;

                                                return (
                                                    <>
                                                        <span style={{ color: '#64748b', fontSize: 12 }}>{baseChance.toFixed(1)}%</span>
                                                        {arenaMult !== 1 && (
                                                            <>
                                                                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                                                                <span style={{ color: '#3b82f6', fontSize: 12 }}>{Math.round(arenaMult * 100)}%</span>
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
                                                                <span style={{ color: '#60a5fa', fontSize: 12 }}>{Math.round(bluePrintMult * 100)}%</span>
                                                            </>
                                                        )}
                                                        <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                                                        <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                                                            {total.toFixed(1)}%
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>

                                        <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Pierce</span>
                                        <span style={{ color: '#fbbf24', fontSize: 18, fontWeight: 600 }}>
                                            {player.pierce}
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20, color: '#475569', fontSize: 10, textAlign: 'center' }}>
                PRESS [{getKeyDisplay(getKeybinds().stats)}] TO CLOSE
            </div>
        </div>
    );
};
