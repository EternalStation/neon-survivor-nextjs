import React, { useMemo } from 'react';
import { RadarChart } from './RadarChart';
import { RARITY_COLORS } from './modules/ModuleUtils';
import { LEGENDARY_UPGRADES } from '../logic/upgrades/LegendaryData';
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

        const minuteMedians = new Array(61).fill(0).map((_, min) => {
            const values = Object.values(averagedDpm)
                .map(hist => hist[min])
                .filter(v => v > 0)
                .sort((a, b) => a - b);
            if (values.length === 0) return 0;
            const mid = Math.floor(values.length / 2);
            return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
        });

        const classGrowth: Record<string, number> = {};
        Object.keys(averagedDpm).forEach(cls => {
            const history = averagedDpm[cls];
            const deviations: number[] = [];
            history.forEach((val, min) => {
                if (val > 0 && minuteMedians[min] > 0) {
                    deviations.push((val / minuteMedians[min]) - 1);
                }
            });
            classGrowth[cls] = deviations.length > 0 ? (deviations.reduce((a, b) => a + b, 0) / deviations.length) * 100 : 0;
        });

        return { totalRuns, totalTime, avgTime, topClasses, topUpgrades, topDeaths, totalRadar: totalRadarData, averagedDpm, averagedTotal, classGrowth };
    }, [validEntries, translateDeathCause]);

    if (!stats) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '18px', opacity: 0.5 }}>{t.metaNoData || 'NOT ENOUGH DATA (REQUIRES RUNS > 2 MIN)'}</div>;
    }

    const getHexImage = (type: string) => {
        if (!type) return '/assets/hexes/MalwarePrime.png';

        const meta = LEGENDARY_UPGRADES[type] ||
            Object.values(LEGENDARY_UPGRADES).find(v =>
                v.type.toLowerCase() === type.toLowerCase() ||
                v.id.toLowerCase() === type.toLowerCase() ||
                v.name.toLowerCase() === type.toLowerCase()
            );

        if (meta?.customIcon) return meta.customIcon;

        const map: Record<string, string> = {
            'EcoDMG': '/assets/hexes/EcoDMG.png',
            'EcoXP': '/assets/hexes/EcoXP.png',
            'EcoHP': '/assets/hexes/EcoHP.png',
            'ComLife': '/assets/hexes/ComLife.png',
            'ComCrit': '/assets/hexes/ComCrit.png',
            'ComWave': '/assets/hexes/ComWave.png',
            'DefPuddle': '/assets/hexes/DefPuddle.png',
            'DefEpi': '/assets/hexes/DefEpi.png',
            'EcoShield': '/assets/hexes/EcoShield.png',
            'DefBattery': '/assets/hexes/DefBattery.png',
            'ComRadiation': '/assets/hexes/ComRad.png',
            'DefPlatting': '/assets/hexes/DefChromo.png',
            'XenoAlchemist': '/assets/Fusions/THE XENO-ALCHEMIST.png',
            'IrradiatedMire': '/assets/Fusions/THE IRRADIATED MIRE.png',
            'NeuralSingularity': '/assets/Fusions/THE NEURAL SINGULARITY.png',
            'KineticTsunami': '/assets/Fusions/THE KINETIC TSUNAMI.png',
            'SoulShatterCore': '/assets/Fusions/THE SOUL-SHATTER CORE.png',
            'BloodForgedCapacitor': '/assets/Fusions/THE NECRO-KINETIC ENGINE.png',
            'GravityAnchor': '/assets/Fusions/THE GRAVITY ANCHOR.png',
            'TemporalMonolith': '/assets/Fusions/THE TEMPORAL MONOLITH.png',
            'NeutronStar': '/assets/Fusions/THE NEUTRON STAR.png',
            'GravitationalHarvest': '/assets/Fusions/THE GRAVITATIONAL HARVEST.png',
            'ShatteredCapacitor': '/assets/Fusions/THE SHATTERED CAPACITOR.png',
            'ChronoDevourer': '/assets/Fusions/THE CHRONO-DEVOURER.png',
            'orbital_strike': '/assets/hexes/CosmicBeam.png',
            'shield_passive': '/assets/hexes/AigisVortex.PNG',
            'blackhole': '/assets/hexes/EventHorizon.png',
            'nanite_spit': '/assets/hexes/HiveMother.png',
            'sandbox': '/assets/hexes/MalwarePrime.png'
        };

        const normalize = (s: string) => s.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
        const normalizedType = normalize(type);

        const foundKey = Object.keys(map).find(k => normalize(k) === normalizedType);
        if (foundKey) return map[foundKey];

        // Explicit fallback for common IDs and Names
        if (normalizedType === 'ecohp' || normalizedType === 'essencesyphon') return '/assets/hexes/EcoHP.png';
        if (normalizedType === 'ecodmg' || normalizedType === 'stormofsteel') return '/assets/hexes/EcoDMG.png';
        if (normalizedType === 'ecoxp' || normalizedType === 'neuralharvest') return '/assets/hexes/EcoXP.png';
        if (normalizedType === 'comcrit' || normalizedType === 'shatteredfate') return '/assets/hexes/ComCrit.png';
        if (normalizedType === 'ecoshield' || normalizedType === 'aegisprotocol') return '/assets/hexes/EcoShield.png';
        if (normalizedType === 'kinetictsunami') return '/assets/Fusions/THE KINETIC TSUNAMI.png';
        if (normalizedType === 'chronodevourer') return '/assets/Fusions/THE CHRONO-DEVOURER.png';
        if (normalizedType === 'shatteredcapacitor') return '/assets/Fusions/THE SHATTERED CAPACITOR.png';
        if (normalizedType === 'temporalmonolith') return '/assets/Fusions/THE TEMPORAL MONOLITH.png';
        if (normalizedType === 'soulshattercore') return '/assets/Fusions/THE SOUL-SHATTER CORE.png';
        if (normalizedType === 'xenoalchemist') return '/assets/Fusions/THE XENO-ALCHEMIST.png';
        if (normalizedType === 'irradiatedmire') return '/assets/Fusions/THE IRRADIATED MIRE.png';
        if (normalizedType === 'neuralsingularity') return '/assets/Fusions/THE NEURAL SINGULARITY.png';
        if (normalizedType === 'gravityanchor') return '/assets/Fusions/THE GRAVITY ANCHOR.png';
        if (normalizedType === 'neutronstar') return '/assets/Fusions/THE NEUTRON STAR.png';
        if (normalizedType === 'gravitationalharvest') return '/assets/Fusions/THE GRAVITATIONAL HARVEST.png';
        if (normalizedType === 'bloodforgedcapacitor' || normalizedType === 'necrokineticengine') return '/assets/Fusions/THE NECRO-KINETIC ENGINE.png';

        return '/assets/hexes/MalwarePrime.png';
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
                                    <img src={getHexImage(id)} alt={id} style={{ width: '24px', height: '28px', objectFit: 'contain' }} />
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
                    {[
                        { name: 'Malware', id: 'malware' },
                        { name: 'Oblivion', id: 'eventhorizon' },
                        { name: 'Zenith', id: 'stormstrike' },
                        { name: 'Aegis', id: 'aigis' },
                        { name: 'Hive Mother', id: 'hivemother' }
                    ].map(cls => {
                        const avg = stats.averagedTotal[cls.id] || 0;
                        const growth = stats.classGrowth[cls.id] || 0;
                        const classColor = getClassColor(cls.id);
                        return (
                            <div key={cls.id} className="meta-card" style={{ padding: '10px', textAlign: 'center', borderLeft: `3px solid ${classColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px' }}>
                                <div className="meta-card-title" style={{ fontSize: '9px', color: classColor, marginBottom: '8px' }}>{cls.name.toUpperCase()} PERFORMANCE</div>
                                <div className="meta-card-value" style={{ fontSize: '22px', fontWeight: '900', color: growth >= 0 ? '#10b981' : '#ef4444' }}>
                                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>
                                    {t.metaMedianDivergence || 'MEDIAN DIVERGENCE'}
                                </div>
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
                const lastIdx = history.reduce((acc, val, idx) => (val > 0 ? idx : acc), -1);
                if (lastIdx < 0) return null;
                const visible = history.slice(0, lastIdx + 1);
                const points = visible.map((d, min) => `${getX(min)},${getY(d)}`).join(' ');
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
                        {/* Hover circles - Stop at the last data point */}
                        {visible.map((d, i) => (
                            <circle key={i} cx={getX(i)} cy={getY(d)} r="2" fill={color} style={{ opacity: 0.8 }} />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}
