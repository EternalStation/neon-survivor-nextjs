import React from 'react';
import type { GameState } from '../logic/core/types';
import { getCycleHpMult } from '../logic/enemies/EnemySpawnLogic';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { SHAPE_DEFS, SHAPE_CYCLE_ORDER } from '../logic/core/constants';
import { formatLargeNumber } from '../utils/format';

interface ThreatProgressionProps {
    gameState: GameState;
    t: any;
}

export const SimpleLineChart: React.FC<{
    data: number[],
    color: string,
    yLabel: (val: number) => string,
    scaleType: 'linear' | 'log' | 'power',
    customTicks?: number[],
    dots?: { minute: number, value: number }[],
    currentTimeMinute?: number
}> = ({ data, color, yLabel, scaleType, customTicks, dots, currentTimeMinute }) => {
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

                {gridMinutes.map(m => {
                    const x = getX(m);
                    return (
                        <g key={m}>
                            <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} stroke="rgba(51, 65, 85, 0.5)" strokeWidth="1" />
                            <text x={x} y={height - 8} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">{m}</text>
                        </g>
                    );
                })}

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

                <polyline
                    points={`${padding.left},${height - padding.bottom} ${points} ${width - padding.right},${height - padding.bottom}`}
                    fill={`url(#grad-${color})`}
                />

                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />

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

export const ThreatProgression: React.FC<ThreatProgressionProps> = ({ gameState, t }) => {
    const minutes = Array.from({ length: 61 }, (_, i) => i);

    const hpData = minutes.map(m => {
        const difficultyMult = 1 + (m * Math.log2(2 + m) / 30);
        const hpMult = getCycleHpMult(m * 60);
        const baseHp = 60 * Math.pow(1.2, m) * difficultyMult;
        return baseHp * hpMult;
    });

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

    const targetHPPoints = [
        hpData[0],
        20000000,
        6000000000,
        500000000000,
        hpData[60]
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

    const targetSpawnPoints = [1.5, 8, 20, 45, 79.5];
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
                        const minsBoss = t_next / 60;
                        const difficultyMult = 1 + (minsBoss * Math.log2(2 + minsBoss) / 30);
                        const shapeIndex = Math.floor(minsBoss) % 5;
                        const shapeId = SHAPE_CYCLE_ORDER[shapeIndex];
                        const hpMult = getCycleHpMult(t_next) * SHAPE_DEFS[shapeId].hpMult;
                        const baseHp = 60 * Math.pow(1.2, minsBoss) * difficultyMult;

                        const mTotal = Math.floor(minsBoss);
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
