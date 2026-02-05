import React, { useState, useEffect, useRef } from 'react';
import { RadarChart } from './RadarChart';
export { RadarChart };
import type { GameState, PlayerStats } from '../logic/types';
import { calcStat } from '../logic/MathUtils';
import { calculateLegendaryBonus } from '../logic/LegendaryLogic';
import { getArenaIndex } from '../logic/MapLogic';
import { GAME_CONFIG } from '../logic/GameConfig';


interface StatsMenuProps {
    gameState: GameState;
}

export const StatRow: React.FC<{ label: string; stat: PlayerStats; isPercent?: boolean; extraInfo?: string; legendaryBonusFlat?: number; legendaryBonusPct?: number; arenaMult?: number }> = ({ label, stat, isPercent, extraInfo, legendaryBonusFlat = 0, legendaryBonusPct = 0, arenaMult = 1 }) => {
    // Formula: (Base + Flat + HexFlat) * (1 + NormalMult%) * (1 + HexMult%)
    const baseSum = stat.base + stat.flat + legendaryBonusFlat;
    const upgradeMult = 1 + (stat.mult || 0) / 100;
    const hexScaling = 1 + legendaryBonusPct / 100;

    const total = baseSum * upgradeMult * hexScaling * arenaMult;

    const displayTotal = isPercent ? `${Math.round(total)}%` : Math.round(total * 10) / 10;

    // Color logic
    const isBuffed = arenaMult > 1;
    // User requested Green for all non-buffed stats (avoiding Red for base stats)
    const totalColor = isBuffed ? '#3b82f6' : '#4ade80';

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{label}</span>
                {extraInfo && <span style={{ color: '#64748b', fontSize: 12 }}>{extraInfo}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>

                {/* 1. Base (Sum of Base + Flat + HexFlat) */}
                {legendaryBonusFlat > 0 ? (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        ({Math.round((stat.base + stat.flat) * 10) / 10} <span style={{ color: '#fbbf24' }}>+{Math.round(legendaryBonusFlat * 10) / 10}</span>)
                    </span>
                ) : (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        {Math.round(baseSum * 10) / 10}
                    </span>
                )}

                {/* 2. Upgrade Mult */}
                <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>{Math.round(upgradeMult * 100)}%</span>

                {/* 3. Hex Mult (Only if > 0% boost, i.e. > 100% scale) */}
                {legendaryBonusPct > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#fbbf24', fontSize: 12 }}>{Math.round(hexScaling * 100)}%</span>
                    </>
                )}

                {/* 4. Arena Mult (Only if != 1) */}
                {arenaMult !== 1 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#3b82f6', fontSize: 12 }}>{Math.round(arenaMult * 100)}%</span>
                    </>
                )}

                {/* 5. Equals Total */}
                <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                <span style={{ color: totalColor, fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                    {displayTotal}
                </span>
            </div>
        </div>
    );
};

// --- BLUEPRINT VISUAL PREVIEW ---

const EnemyPreview: React.FC<{ shape: string; color: string }> = ({ shape, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;

        const cx = w / 2;
        const cy = h / 2;
        const size = 25;

        // Draw Shape Logic (Simplified from Game Renderer)
        ctx.beginPath();
        if (shape === 'circle') {
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
        } else if (shape === 'triangle') {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx + size * 0.866, cy + size * 0.5);
            ctx.lineTo(cx - size * 0.866, cy + size * 0.5);
            ctx.closePath();
        } else if (shape === 'square') {
            ctx.rect(cx - size, cy - size, size * 2, size * 2);
        } else if (shape === 'diamond') {
            ctx.moveTo(cx, cy - size * 1.3);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size * 1.3);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
        } else if (shape === 'pentagon') {
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
                ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
            }
            ctx.closePath();
        } else if (shape === 'minion') {
            // Chevron / Dart (Stealth Bomber)
            const p1 = { x: cx + size * 0.8, y: cy };
            const p2 = { x: cx - size, y: cy + size * 0.7 };
            const p3 = { x: cx - size * 0.3, y: cy };
            const p4 = { x: cx - size, y: cy - size * 0.7 };

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.closePath();
        } else if (shape === 'snitch') {
            // Snitch (Circle with Blades)
            const bodyR = size * 0.6;
            ctx.arc(cx, cy, bodyR, 0, Math.PI * 2);
            ctx.closePath();

            // Blades
            const drawBlade = (angle: number) => {
                const bx = cx + Math.cos(angle) * bodyR;
                const by = cy + Math.sin(angle) * bodyR;
                const tipX = cx + Math.cos(angle) * size * 1.5;
                const tipY = cy + Math.sin(angle) * size * 1.5;
                ctx.moveTo(bx, by);
                ctx.lineTo(tipX, tipY);
            };
            // 6 Blades roughly
            for (let i = 0; i < 6; i++) {
                drawBlade(i * Math.PI / 3);
            }
        }

        // Fill & Stroke
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();

    }, [shape, color]);

    return <canvas ref={canvasRef} width={80} height={80} style={{ borderRadius: 8, background: '#0f172a', border: '1px solid #334155' }} />;
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
    const [tab, setTab] = useState<'stats' | 'blueprint'>('stats');
    // Keyboard Navigation
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();
            if (key === 'a' || code === 'keya' || key === 'arrowleft' || code === 'arrowleft') {
                setTab('stats');
            }
            if (key === 'd' || code === 'keyd' || key === 'arrowright' || code === 'arrowright') {
                setTab('blueprint');
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    // Enemy Intel Data
    const enemyIntel = [
        {
            id: 'circle',
            name: 'DRONE EX-01',
            role: 'Chaser',
            desc: 'Standard relentless pursuit unit. Swarms in large numbers.',
            stats: 'HP: Normal | Spd: Fast',
            color: '#00FF00'
        },
        {
            id: 'triangle',
            name: 'VECTOR STRIKER',
            role: 'Charger',
            desc: 'Charges at high speed after locking onto position. Dangerous in groups.',
            stats: 'HP: Low | Spd: Very Fast',
            color: '#00FFFF'
        },
        {
            id: 'square',
            name: 'BLOCKADE HULL',
            role: 'Tank',
            desc: 'High durability unit acting as a moving wall. Slow but tough.',
            stats: 'HP: High | Spd: Slow',
            color: '#BF00FF'
        },
        {
            id: 'diamond',
            name: 'PRISM SNIPER',
            role: 'Ranger',
            desc: 'Kiting AI (Variable Range 500-900px). Randomized Dodge (3-5s). Slow Fire (6s). Projectiles (Base 20 Dmg, +50% per 5m).',
            stats: 'HP: Low | Spd: Fast',
            color: '#FF9900'
        },
        {
            id: 'pentagon',
            name: 'HIVE OVERLORD',
            role: 'Summoner',
            desc: 'Maintains distance. Spawns Minions. SELF-DESTRUCTS after 60s (Huge Area Damage). Enrages/Guards if player gets close.',
            stats: 'HP: Very High | Spd: Medium',
            color: '#FF0000'
        },
        {
            id: 'minion', // Special
            name: 'SWARM MINION',
            role: 'Minion',
            desc: 'Spawned by Hive Overlords. Weak but numerous. Aggressively LAUNCHES at player if player nears the Hive.',
            stats: 'HP: Very Low | Spd: Very Fast',
            color: '#FFD700',
            shape: 'minion'
        },
        {
            id: 'snitch',
            name: 'LOOT SNITCH',
            role: 'Rare',
            desc: 'Flees from player. Swaps positions with other enemies to escape. Despawns after 30s if not killed.',
            stats: 'HP: Low | Spd: Extreme',
            color: '#f97316',
            shape: 'snitch'
        }
    ];

    return (
        <div className="stats-panel-slide open">
            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: 20 }}>
                <div
                    onClick={() => setTab('stats')}
                    style={{
                        flex: 1, padding: 10, textAlign: 'center', cursor: 'pointer',
                        color: tab === 'stats' ? '#22d3ee' : '#64748b',
                        fontWeight: 900,
                        borderBottom: tab === 'stats' ? '2px solid #22d3ee' : 'none'
                    }}
                >
                    SYSTEM DIAGNOSTICS
                </div>
                <div
                    onClick={() => setTab('blueprint')}
                    style={{
                        flex: 1, padding: 10, textAlign: 'center', cursor: 'pointer',
                        color: tab === 'blueprint' ? '#22d3ee' : '#64748b',
                        fontWeight: 900,
                        borderBottom: tab === 'blueprint' ? '2px solid #22d3ee' : 'none'
                    }}
                >
                    BLUEPRINTS
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>

                {tab === 'stats' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                        {/* Radar Chart */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ color: '#64748b', fontSize: 10, marginBottom: 10, textTransform: 'uppercase' }}>Build Profile</div>
                            <RadarChart player={player} size={180} />
                        </div>

                        {/* Stats Table */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {(() => {
                                const arenaIdx = getArenaIndex(player.x, player.y);
                                let hpMult = arenaIdx === 2 ? 1.2 : 1;
                                let regMult = arenaIdx === 2 ? 1.2 : 1;

                                if (player.buffs?.puddleRegen) {
                                    hpMult *= 1.25;
                                    regMult *= 1.25;
                                }

                                return (
                                    <>
                                        <StatRow label="Health" stat={player.hp} legendaryBonusFlat={calculateLegendaryBonus(gameState, 'hp_per_kill')} legendaryBonusPct={calculateLegendaryBonus(gameState, 'hp_pct_per_kill')} arenaMult={hpMult} />
                                        <StatRow label="Damage" stat={player.dmg} legendaryBonusFlat={calculateLegendaryBonus(gameState, 'dmg_per_kill')} legendaryBonusPct={calculateLegendaryBonus(gameState, 'dmg_pct_per_kill')} />
                                        <StatRow
                                            label="Attack Speed"
                                            stat={player.atk}
                                            legendaryBonusFlat={calculateLegendaryBonus(gameState, 'ats_per_kill')}
                                            legendaryBonusPct={calculateLegendaryBonus(gameState, 'ats_pct_per_kill')}
                                            extraInfo={(() => {
                                                // Correlate with Game Loop logic (useGame.ts)
                                                // calcStat(player.atk) includes hexFlat/hexMult because they are updated in PlayerLogic every frame
                                                const score = calcStat(player.atk);
                                                const sps = Math.max(1.65, 2.8 * Math.log(score) - 14.3 + score / 150000);
                                                return `(${sps.toFixed(2)}/s)`;
                                            })()}
                                        />
                                        <StatRow label="Regeneration" stat={player.reg} legendaryBonusFlat={calculateLegendaryBonus(gameState, 'reg_per_kill')} legendaryBonusPct={calculateLegendaryBonus(gameState, 'reg_pct_per_kill')} arenaMult={regMult} />
                                        <StatRow
                                            label="Armor"
                                            stat={player.arm}
                                            legendaryBonusFlat={calculateLegendaryBonus(gameState, 'arm_per_kill')}
                                            legendaryBonusPct={calculateLegendaryBonus(gameState, 'arm_pct_per_kill')}
                                            extraInfo={`(${(0.95 * (calcStat(player.arm) / (calcStat(player.arm) + GAME_CONFIG.PLAYER.ARMOR_CONSTANT)) * 100).toFixed(1)}%)`}
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                                            <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>Movement Speed</span>
                                            <span style={{ color: '#4ade80', fontSize: 18, fontWeight: 600 }}>
                                                {player.speed.toFixed(1)}
                                            </span>
                                        </div>
                                        {(() => {
                                            const colRed = calculateLegendaryBonus(gameState, 'col_red_per_kill');
                                            if (colRed <= 0) return null;
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
                                            if (projRed <= 0) return null;
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

                                        {/* XP Breakdown */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
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
                                                                    ({Math.round(flatBase)} <span style={{ color: '#fbbf24' }}>+{Math.round(hexFlat)}</span>)
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#64748b', fontSize: 12 }}>{Math.round(baseSum)}</span>
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
                                                                {Math.round(total)}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #334155', marginTop: 10 }}>
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
                )}

                {tab === 'blueprint' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                        {enemyIntel.map(intel => (
                            <div key={intel.id} style={{
                                display: 'flex', gap: 15, alignItems: 'center',
                                background: '#1e293b50', padding: 10, borderRadius: 8,
                                border: `1px solid ${intel.color}40`
                            }}>
                                <EnemyPreview shape={intel.shape || intel.id} color={intel.color} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: intel.color, fontWeight: 900, fontSize: 14 }}>{intel.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: 10, textTransform: 'uppercase', background: '#0f172a', padding: '2px 6px', borderRadius: 4 }}>
                                            {intel.role}
                                        </div>
                                    </div>
                                    <div style={{ color: '#cbd5e1', fontSize: 13, marginTop: 4, lineHeight: 1.3 }}>
                                        {intel.desc}
                                    </div>
                                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: 700 }}>
                                        {intel.stats}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20, color: '#475569', fontSize: 10, textAlign: 'center' }}>
                PRESS [C] TO CLOSE
            </div>
        </div>
    );
};
