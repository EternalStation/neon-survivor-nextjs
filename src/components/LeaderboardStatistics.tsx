import React, { useMemo } from 'react';
import { RadarChart } from './RadarChart';
import { PLAYER_CLASSES } from '../logic/core/classes';
import { getUiTranslation } from '../lib/uiTranslations';
import { formatLargeNumber } from '../utils/format';

interface LeaderboardStatisticsProps {
    entries: any[];
    language: any;
    t: any;
    getClassColor: (id: string) => string;
    getClassName: (id: string) => string;
    translateDeathCause: (cause: string) => string;
}

const formatTimeLong = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
};

export const LeaderboardStatistics: React.FC<LeaderboardStatisticsProps> = ({
    entries,
    language,
    t,
    getClassColor,
    getClassName,
    translateDeathCause
}) => {

    const validEntries = useMemo(() => {
        return entries.filter(e => e.survival_time >= 120);
    }, [entries]);

    const stats = useMemo(() => {
        if (validEntries.length === 0) return null;

        const totalRuns = validEntries.length;
        const totalTime = validEntries.reduce((sum, e) => sum + e.survival_time, 0);
        const avgTime = totalTime / totalRuns;

        // Class stats
        const classCounts: Record<string, { count: number, totalTime: number, wins: number }> = {};
        const upgradeCounts: Record<string, number> = {};
        const deathCauses: Record<string, number> = {};
        let totalRadar = { dps: 0, arm: 0, exp: 0, hp: 0, reg: 0 };
        let radarSamples = 0;

        validEntries.forEach(e => {
            const cls = e.class_used;
            if (!classCounts[cls]) classCounts[cls] = { count: 0, totalTime: 0, wins: 0 };
            classCounts[cls].count++;
            classCounts[cls].totalTime += e.survival_time;
            if (e.death_cause === 'EVACUATED') classCounts[cls].wins++;

            if (e.legendary_hexes && Array.isArray(e.legendary_hexes)) {
                e.legendary_hexes.forEach((h: any) => {
                    const id = h.type || h.id;
                    if (id) upgradeCounts[id] = (upgradeCounts[id] || 0) + 1;
                });
            }

            if (e.death_cause && e.death_cause !== 'EVACUATED') {
                const cause = translateDeathCause(e.death_cause);
                deathCauses[cause] = (deathCauses[cause] || 0) + 1;
            }

            let rc = e.radar_counts;
            if (typeof rc === 'string') {
                try {
                    rc = JSON.parse(rc);
                } catch (err) {
                    rc = null;
                }
            }
            if (rc) {
                totalRadar.dps += Number(rc.dps || rc.DPS || 0);
                totalRadar.arm += Number(rc.arm || rc.ARM || 0);
                totalRadar.exp += Number(rc.exp || rc.EXP || 0);
                totalRadar.hp += Number(rc.hp || rc.HP || 0);
                totalRadar.reg += Number(rc.reg || rc.REG || 0);
                radarSamples++;
            }
        });

        const topClasses = Object.entries(classCounts)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([cls, data]) => ({
                id: cls,
                count: data.count,
                avgTime: data.totalTime / data.count,
                winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0
            }));

        const topUpgrades = Object.entries(upgradeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const topDeaths = Object.entries(deathCauses)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const totalRadarData = radarSamples > 0 ? {
            dps: totalRadar.dps,
            arm: totalRadar.arm,
            exp: totalRadar.exp,
            hp: totalRadar.hp,
            reg: totalRadar.reg,
        } : null;

        const classSkillDpm: Record<string, number[]> = {};
        const classHistoryCounts: Record<string, number[]> = {};

        validEntries.forEach(e => {
            const cls = e.class_used;
            let history = e.class_skill_dmg_history;
            if (typeof history === 'string') {
                try {
                    history = JSON.parse(history);
                } catch (err) {
                    history = null;
                }
            }

            if (Array.isArray(history)) {
                if (!classSkillDpm[cls]) {
                    classSkillDpm[cls] = new Array(61).fill(0);
                    classHistoryCounts[cls] = new Array(61).fill(0);
                }
                history.forEach((dmg, min) => {
                    if (min <= 60) {
                        classSkillDpm[cls][min] += (Number(dmg) || 0);
                        classHistoryCounts[cls][min]++;
                    }
                });
            }
        });

        const averagedDpm: Record<string, number[]> = {};
        const averagedTotal: Record<string, number> = {};
        Object.keys(classSkillDpm).forEach(cls => {
            averagedDpm[cls] = classSkillDpm[cls].map((total, min) => {
                const count = classHistoryCounts[cls][min];
                return count > 0 ? total / count : 0;
            });
            const totalSum = classSkillDpm[cls].reduce((a, b) => a + b, 0);
            const runCount = validEntries.filter(e => e.class_used.toLowerCase() === cls.toLowerCase() && e.class_skill_dmg_history).length;
            averagedTotal[cls] = runCount > 0 ? totalSum / runCount : 0;
        });

        return { totalRuns, totalTime, avgTime, topClasses, topUpgrades, topDeaths, totalRadar: totalRadarData, averagedDpm, averagedTotal };
    }, [validEntries, translateDeathCause]);

    if (!stats) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '18px', opacity: 0.5 }}>{t.metaNoData || 'NOT ENOUGH DATA (REQUIRES RUNS > 2 MIN)'}</div>;
    }

    const getHexImage = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'ecodmg') return 'EcoDMG.png';
        if (t === 'ecoxp') return 'EcoXP.png';
        if (t === 'ecohp') return 'EcoHP.png';
        if (t === 'comlife') return 'ComLife.png';
        if (t === 'comcrit') return 'ComCrit.png';
        if (t === 'comwave') return 'ComWave.png';
        if (t === 'defpuddle') return 'DefPuddle.png';
        if (t === 'defepi') return 'DefEpi.png';
        if (t === 'combshield') return 'EcoArmor.png';
        if (t === 'orbital_strike') return 'CosmicBeam.png';
        if (t === 'shield_passive') return 'AigisVortex.PNG';
        if (t === 'kineticbattery') return 'DefBattery.png';
        if (t === 'radiationcore') return 'ComRad.png';
        if (t === 'chronoplating') return 'DefChromo.png';
        return 'MalwarePrime.png';
    };

    return (
        <div className="meta-container" style={{ padding: '0 20px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px', fontFamily: 'Orbitron, sans-serif' }}>

            <div className="meta-header-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaTotalRuns || 'TOTAL RUNS') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-cyan" style={{ color: '#22d3ee' }}>{stats.totalRuns}</div>
                </div>
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaTotalTime || 'TOTAL TIME PLAYED') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-amber" style={{ color: '#f59e0b' }}>{formatTimeLong(stats.totalTime)}</div>
                </div>
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaAvgTime || 'AVG SURVIVAL TIME') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-green" style={{ color: '#10b981' }}>{formatTimeLong(stats.avgTime)}</div>
                </div>
            </div>

            <div className="meta-section">
                <div className="meta-section-title">{t.metaClassPedestal || 'TOP CLASSES'}</div>
                <div className="meta-pedestal">
                    {stats.topClasses.slice(0, 5).map((cls, idx) => {
                        const classInfo = PLAYER_CLASSES.find(c => c.id === cls.id.toLowerCase() || c.name.toLowerCase() === cls.id.toLowerCase());
                        const icon = classInfo?.iconUrl;
                        return (
                            <div key={cls.id} className={`pedestal-item rank-${idx + 1}`} style={{ '--class-color': getClassColor(cls.id) } as any}>
                                <div className="pedestal-rank">#{idx + 1}</div>
                                <div className="pedestal-icon">
                                    {icon ? <img src={icon} alt={cls.id} /> : <div className="placeholder" />}
                                </div>
                                <div className="pedestal-name" style={{ color: getClassColor(cls.id) }}>{getClassName(cls.id).toUpperCase()}</div>
                                <div className="pedestal-detail">
                                    <span>{t.metaPick || 'Missions'}:</span>
                                    <span style={{ color: '#22d3ee', fontWeight: '900' }}>{cls.count}</span>
                                </div>
                                <div className="pedestal-detail">
                                    <span>{t.metaTime || 'Avg. Time'}:</span>
                                    <span style={{ color: '#f59e0b', fontWeight: '900' }}>{formatTimeLong(cls.avgTime)}</span>
                                </div>
                                <div className="pedestal-detail">
                                    <span>{t.metaWin || 'Evac %'}:</span>
                                    <span style={{ color: '#10b981', fontWeight: '900' }}>{cls.winRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="meta-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>

                <div className="meta-card meta-upgrades">
                    <div className="meta-card-title" style={{ marginBottom: '15px' }}>{t.metaTopUpgrades || 'MOST POPULAR LEGENDARY UPGRADES'}</div>
                    <div className="upgrades-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stats.topUpgrades.map(([id, count], idx) => {
                            return (
                                <div key={id} className="upgrade-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '4px' }}>
                                    <div style={{ fontWeight: '900', color: idx < 3 ? '#f59e0b' : '#fff', width: '25px', textAlign: 'center' }}>#{idx + 1}</div>
                                    <img src={`/assets/hexes/${getHexImage(id)}`} alt={id} style={{ width: '24px', height: '28px', objectFit: 'contain' }} />
                                    <div style={{ flex: 1, fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {((getUiTranslation(language).legendaries as any)?.[id]?.name) || id}
                                    </div>
                                    <div style={{ color: '#22d3ee', fontWeight: '900' }}>{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="meta-card">
                        <div className="meta-card-title" style={{ textAlign: 'center' }}>{t.metaRadar || 'AVERAGE HARDWARE PROFILE'}</div>
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', alignItems: 'center', height: '180px' }}>
                            {stats.totalRadar && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ marginLeft: '-30px' }}>
                                        <RadarChart counts={stats.totalRadar as any} size={150} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#fff', fontWeight: '800' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>DPS:</span>
                                            <span style={{ color: '#22d3ee' }}>{stats.totalRadar.dps}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>ARM:</span>
                                            <span style={{ color: '#22d3ee' }}>{stats.totalRadar.arm}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>XP:</span>
                                            <span style={{ color: '#22d3ee' }}>{stats.totalRadar.exp}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>HP:</span>
                                            <span style={{ color: '#22d3ee' }}>{stats.totalRadar.hp}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>REG:</span>
                                            <span style={{ color: '#22d3ee' }}>{stats.totalRadar.reg}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="meta-card">
                        <div className="meta-card-title">{t.metaDeathCauses || 'MOST COMMON FATALITIES'}</div>
                        <div className="deaths-list" style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stats.topDeaths.map(([cause, count]) => (
                                <div key={cause} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '4px' }}>
                                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>{cause}</span>
                                    <span style={{ color: '#22d3ee', fontSize: '13px', fontWeight: '900' }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <div className="meta-section">
                <div className="meta-section-title">{t.metaDamageCharts || 'AVERAGE ACTIVE SKILL DAMAGE PER MINUTE (LOG SCALE)'}</div>
                <div className="meta-card-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {['Malware', 'Oblivion', 'Zenith', 'Aegis', 'Hive Mother'].map(cls => {
                        const avg = stats.averagedTotal[cls] || stats.averagedTotal[cls.toLowerCase()] || 0;
                        const classColor = getClassColor(cls);
                        return (
                            <div key={cls} className="meta-card" style={{ padding: '10px', textAlign: 'center', borderLeft: `3px solid ${classColor}` }}>
                                <div className="meta-card-title" style={{ fontSize: '9px', color: classColor }}>{cls.toUpperCase()} AVG / RUN</div>
                                <div className="meta-card-value" style={{ fontSize: '14px', color: '#fff' }}>{formatLargeNumber(Math.round(avg))}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="meta-card" style={{ padding: '20px', height: '300px' }}>
                    <DamageLineChart data={stats.averagedDpm} getClassColor={getClassColor} />
                </div>
            </div>
        </div>
    );
}

const DamageLineChart: React.FC<{ data: Record<string, number[]>, getClassColor: (id: string) => string }> = ({ data, getClassColor }) => {
    const width = 800;
    const height = 250;
    const padding = 30;

    // Find global max for scaling
    let maxDmg = 1;
    Object.values(data).forEach(history => {
        history.forEach(d => { if (d > maxDmg) maxDmg = d; });
    });

    // Use log scale: log10(val + 1)
    const logMax = Math.log10(maxDmg + 1);

    const getY = (val: number) => {
        if (val <= 0) return height - padding;
        const logVal = Math.log10(val + 1);
        const ratio = logVal / logMax;
        return height - padding - (ratio * (height - 2 * padding));
    };

    const getX = (min: number) => {
        return padding + (min / 60) * (width - 2 * padding);
    };

    return (
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
            {/* Grid */}
            {[0, 10, 20, 30, 40, 50, 60].map(min => (
                <line key={min} x1={getX(min)} y1={padding} x2={getX(min)} y2={height - padding} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = height - padding - (ratio * (height - 2 * padding));
                return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
            })}

            {/* Labels */}
            <text x={padding} y={height - 5} fill="#94a3b8" fontSize="10">0m</text>
            <text x={width / 2} y={height - 5} fill="#94a3b8" fontSize="10" textAnchor="middle">30m</text>
            <text x={width - padding} y={height - 5} fill="#94a3b8" fontSize="10" textAnchor="end">60m</text>

            <text x={5} y={height / 2} fill="#94a3b8" fontSize="10" transform={`rotate(-90, 5, ${height / 2})`} textAnchor="middle">AVG. DAMAGE (LOG)</text>

            {/* Lines */}
            {Object.entries(data).map(([cls, history]) => {
                const points = history.map((d, min) => `${getX(min)},${getY(d)}`).join(' ');
                const color = getClassColor(cls);
                return (
                    <g key={cls}>
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            style={{ filter: `drop-shadow(0 0 2px ${color})` }}
                        />
                        {/* Hover circles */}
                        {history.filter((_, i) => i % 5 === 0).map((d, i) => (
                            <circle key={i} cx={getX(i * 5)} cy={getY(d)} r="3" fill={color} />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}
