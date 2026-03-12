import React, { useMemo } from 'react';
import { RadarChart } from './RadarChart';
import { RARITY_COLORS } from './modules/ModuleUtils';
import { LEGENDARY_UPGRADES } from '../logic/upgrades/LegendaryData';
import { PLAYER_CLASSES } from '../logic/core/Classes';
import { getUiTranslation } from '../lib/UiTranslations';
import { formatLargeNumber } from '../utils/Format';
import type { Language } from '../lib/LanguageContext';
import './LeaderboardStatistics.css';

type HexItem = { type: string; id?: string } | { type?: string; id: string };

interface RadarCounts {
    dps: number;
    arm: number;
    exp: number;
    hp: number;
    reg: number;
    [key: string]: number;
}

type RadarCountKey = 'dps' | 'DPS' | 'arm' | 'ARM' | 'exp' | 'EXP' | 'hp' | 'HP' | 'reg' | 'REG';
type RadarCountsRaw = Partial<Record<RadarCountKey, number>>;

interface PedestalCSSProperties extends React.CSSProperties {
    '--class-color': string;
}

interface CardCSSProperties extends React.CSSProperties {
    '--card-color': string;
}

interface LineCSSProperties extends React.CSSProperties {
    '--line-color': string;
}

interface LegendaryNameEntry {
    name: string;
}

interface LeaderboardEntry {
    survival_time: number;
    class_used: string;
    death_cause?: string;
    legendary_hexes?: HexItem[];
    radar_counts?: string | RadarCountsRaw | null;
    class_skill_dmg_history?: number[] | string | null;
}

type LeaderboardT = ReturnType<typeof getUiTranslation>['leaderboard'];

interface LeaderboardStatisticsProps {
    entries: LeaderboardEntry[];
    language: Language;
    t: LeaderboardT;
    getClassColor: (id: string) => string;
    getClassName: (id: string) => string;
    translateDeathCause: (cause: string) => string;
}

const formatTimeLong = (seconds: number): string => {
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

        const classCounts: Record<string, { count: number; totalTime: number; wins: number }> = {};
        const upgradeCounts: Record<string, number> = {};
        const deathCauses: Record<string, number> = {};
        let totalRadar: RadarCounts = { dps: 0, arm: 0, exp: 0, hp: 0, reg: 0 };
        let radarSamples = 0;

        validEntries.forEach(e => {
            const cls = e.class_used;
            if (!classCounts[cls]) classCounts[cls] = { count: 0, totalTime: 0, wins: 0 };
            classCounts[cls].count++;
            classCounts[cls].totalTime += e.survival_time;
            if (e.death_cause === 'EVACUATED') classCounts[cls].wins++;

            if (e.legendary_hexes && Array.isArray(e.legendary_hexes)) {
                e.legendary_hexes.forEach((h: HexItem) => {
                    const hexKey = ('type' in h && h.type) ? h.type : ('id' in h && h.id) ? h.id : undefined;
                    if (hexKey) upgradeCounts[hexKey] = (upgradeCounts[hexKey] || 0) + 1;
                });
            }

            if (e.death_cause && e.death_cause !== 'EVACUATED') {
                const cause = translateDeathCause(e.death_cause);
                deathCauses[cause] = (deathCauses[cause] || 0) + 1;
            }

            let rc: RadarCountsRaw | null = null;
            if (typeof e.radar_counts === 'string') {
                try {
                    const parsed: unknown = JSON.parse(e.radar_counts);
                    rc = (parsed !== null && typeof parsed === 'object') ? parsed as RadarCountsRaw : null;
                } catch {
                    rc = null;
                }
            } else if (e.radar_counts) {
                rc = e.radar_counts;
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

        const totalRadarData: RadarCounts | null = radarSamples > 0 ? totalRadar : null;

        const classSkillDpm: Record<string, number[]> = {};
        const classHistoryCounts: Record<string, number[]> = {};

        validEntries.forEach(e => {
            const cls = e.class_used;
            let history: number[] | null = null;
            if (typeof e.class_skill_dmg_history === 'string') {
                try {
                    history = JSON.parse(e.class_skill_dmg_history) as number[];
                } catch {
                    history = null;
                }
            } else if (Array.isArray(e.class_skill_dmg_history)) {
                history = e.class_skill_dmg_history;
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
        return <div className="meta-no-data">{t.metaNoData || 'NOT ENOUGH DATA (REQUIRES RUNS > 2 MIN)'}</div>;
    }

    const { perks: _perks, ...legendaryNamesRaw } = getUiTranslation(language).legendaries;
    const legendaryNames = legendaryNamesRaw as Record<string, LegendaryNameEntry>;

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
            'XenoAlchemist': '/assets/Fusions/TheXenoAlchemist.png',
            'IrradiatedMire': '/assets/Fusions/TheIrradiatedMire.png',
            'NeuralSingularity': '/assets/Fusions/TheNeuralSingularity.png',
            'KineticTsunami': '/assets/Fusions/TheKineticTsunami.png',
            'SoulShatterCore': '/assets/Fusions/TheSoulShatterCore.png',
            'BloodForgedCapacitor': '/assets/Fusions/TheNecroKineticEngine.png',
            'GravityAnchor': '/assets/Fusions/TheGravityAnchor.png',
            'TemporalMonolith': '/assets/Fusions/TheTemporalMonolith.png',
            'NeutronStar': '/assets/Fusions/TheNeutronStar.png',
            'GravitationalHarvest': '/assets/Fusions/TheGravitationalHarvest.png',
            'ShatteredCapacitor': '/assets/Fusions/TheShatteredCapacitor.png',
            'ChronoDevourer': '/assets/Fusions/TheChronoDevourer.png',
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

        
        if (normalizedType === 'ecohp' || normalizedType === 'essencesyphon') return '/assets/hexes/EcoHP.png';
        if (normalizedType === 'ecodmg' || normalizedType === 'stormofsteel') return '/assets/hexes/EcoDMG.png';
        if (normalizedType === 'ecoxp' || normalizedType === 'neuralharvest') return '/assets/hexes/EcoXP.png';
        if (normalizedType === 'comcrit' || normalizedType === 'shatteredfate') return '/assets/hexes/ComCrit.png';
        if (normalizedType === 'ecoshield' || normalizedType === 'aegisprotocol') return '/assets/hexes/EcoShield.png';
        if (normalizedType === 'kinetictsunami') return '/assets/Fusions/TheKineticTsunami.png';
        if (normalizedType === 'chronodevourer') return '/assets/Fusions/TheChronoDevourer.png';
        if (normalizedType === 'shatteredcapacitor') return '/assets/Fusions/TheShatteredCapacitor.png';
        if (normalizedType === 'temporalmonolith') return '/assets/Fusions/TheTemporalMonolith.png';
        if (normalizedType === 'soulshattercore') return '/assets/Fusions/TheSoulShatterCore.png';
        if (normalizedType === 'xenoalchemist') return '/assets/Fusions/TheXenoAlchemist.png';
        if (normalizedType === 'irradiatedmire') return '/assets/Fusions/TheIrradiatedMire.png';
        if (normalizedType === 'neuralsingularity') return '/assets/Fusions/TheNeuralSingularity.png';
        if (normalizedType === 'gravityanchor') return '/assets/Fusions/TheGravityAnchor.png';
        if (normalizedType === 'neutronstar') return '/assets/Fusions/TheNeutronStar.png';
        if (normalizedType === 'gravitationalharvest') return '/assets/Fusions/TheGravitationalHarvest.png';
        if (normalizedType === 'bloodforgedcapacitor' || normalizedType === 'necrokineticengine') return '/assets/Fusions/TheNecroKineticEngine.png';

        return '/assets/hexes/MalwarePrime.png';
    };

    return (
        <div className="meta-container">

            <div className="meta-header-stats">
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaTotalRuns || 'TOTAL RUNS') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-cyan">{stats.totalRuns}</div>
                </div>
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaTotalTime || 'TOTAL TIME PLAYED') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-amber">{formatTimeLong(stats.totalTime)}</div>
                </div>
                <div className="meta-card">
                    <div className="meta-card-title">{(t.metaAvgTime || 'AVG SURVIVAL TIME') + ' (+2M MIN)'}</div>
                    <div className="meta-card-value val-green">{formatTimeLong(stats.avgTime)}</div>
                </div>
            </div>

            <div className="meta-section">
                <div className="meta-section-title">{t.metaClassPedestal || 'TOP CLASSES'}</div>
                <div className="meta-pedestal">
                    {stats.topClasses.slice(0, 5).map((cls, idx) => {
                        const classInfo = PLAYER_CLASSES.find(c => c.id === cls.id.toLowerCase() || c.name.toLowerCase() === cls.id.toLowerCase());
                        const icon = classInfo?.iconUrl;
                        return (
                            <div key={cls.id} className={`pedestal-item rank-${idx + 1}`} style={{ '--class-color': getClassColor(cls.id) } as PedestalCSSProperties}>
                                <div className="pedestal-rank">#{idx + 1}</div>
                                <div className="pedestal-icon">
                                    {icon ? <img src={icon} alt={cls.id} /> : <div className="placeholder" />}
                                </div>
                                <div className="pedestal-name">{getClassName(cls.id).toUpperCase()}</div>
                                <div className="pedestal-detail">
                                    <span>{t.metaPick || 'Missions'}:</span>
                                    <span className="pedestal-count">{cls.count}</span>
                                </div>
                                <div className="pedestal-detail">
                                    <span>{t.metaTime || 'Avg. Time'}:</span>
                                    <span className="pedestal-time">{formatTimeLong(cls.avgTime)}</span>
                                </div>
                                <div className="pedestal-detail">
                                    <span>{t.metaWin || 'Evac %'}:</span>
                                    <span className="pedestal-win">{cls.winRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="meta-grid">

                <div className="meta-card meta-upgrades">
                    <div className="meta-card-title meta-card-title-mb">{t.metaTopUpgrades || 'MOST POPULAR LEGENDARY UPGRADES'}</div>
                    <div className="upgrades-list">
                        {stats.topUpgrades.map(([id, count], idx) => {
                            return (
                                <div key={id} className="upgrade-meta-row">
                                    <div className={`upgrade-rank${idx < 3 ? ' upgrade-rank-top' : ''}`}>#{idx + 1}</div>
                                    <img src={getHexImage(id)} alt={id} className="upgrade-icon" />
                                    <div className="upgrade-name">
                                        {legendaryNames[id]?.name || ((getUiTranslation(language).legendaries as any)?.[id]?.name) || id}
                                    </div>
                                    <div className="upgrade-count">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="meta-right-column">
                    <div className="meta-card">
                        <div className="meta-card-title meta-card-title-centered">{t.metaRadar || 'AVERAGE HARDWARE PROFILE'}</div>
                        <div className="radar-wrapper">
                            {stats.totalRadar && (
                                <div className="radar-inner">
                                    <div className="radar-chart-offset">
                                        <RadarChart counts={stats.totalRadar} size={150} />
                                    </div>
                                    <div className="radar-stats">
                                        <div className="radar-stat-row">
                                            <span className="radar-stat-label">DPS:</span>
                                            <span className="radar-stat-value">{stats.totalRadar.dps}</span>
                                        </div>
                                        <div className="radar-stat-row">
                                            <span className="radar-stat-label">ARM:</span>
                                            <span className="radar-stat-value">{stats.totalRadar.arm}</span>
                                        </div>
                                        <div className="radar-stat-row">
                                            <span className="radar-stat-label">XP:</span>
                                            <span className="radar-stat-value">{stats.totalRadar.exp}</span>
                                        </div>
                                        <div className="radar-stat-row">
                                            <span className="radar-stat-label">HP:</span>
                                            <span className="radar-stat-value">{stats.totalRadar.hp}</span>
                                        </div>
                                        <div className="radar-stat-row">
                                            <span className="radar-stat-label">REG:</span>
                                            <span className="radar-stat-value">{stats.totalRadar.reg}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="meta-card">
                        <div className="meta-card-title">{t.metaDeathCauses || 'MOST COMMON FATALITIES'}</div>
                        <div className="deaths-list">
                            {stats.topDeaths.map(([cause, count]) => (
                                <div key={cause} className="death-row">
                                    <span className="death-cause">{cause}</span>
                                    <span className="death-count">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            <div className="meta-section">
                <div className="meta-section-title">{t.metaDamageCharts || 'AVERAGE ACTIVE SKILL DAMAGE PER MINUTE (LOG SCALE)'}</div>
                <div className="meta-class-cards">
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
                            <div key={cls.id} className="meta-card meta-class-card" style={{ '--card-color': classColor } as CardCSSProperties}>
                                <div className="meta-card-title meta-class-title">{cls.name.toUpperCase()} PERFORMANCE</div>
                                <div className="meta-card-value meta-class-value" style={{ color: growth >= 0 ? '#10b981' : '#ef4444' }}>
                                    {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                </div>
                                <div className="meta-card-subtitle">
                                    {t.metaMedianDivergence || 'MEDIAN DIVERGENCE'}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="meta-card meta-damage-chart">
                    <DamageLineChart data={stats.averagedDpm} getClassColor={getClassColor} />
                </div>
            </div>
        </div>
    );
}

interface DamageLineChartProps {
    data: Record<string, number[]>;
    getClassColor: (id: string) => string;
}

const DamageLineChart: React.FC<DamageLineChartProps> = ({ data, getClassColor }) => {
    const width = 800;
    const height = 250;
    const padding = 30;

    let maxDmg = 1;
    Object.values(data).forEach(history => {
        history.forEach(d => { if (d > maxDmg) maxDmg = d; });
    });

    const logMax = Math.log10(maxDmg + 1);

    const getY = (val: number): number => {
        if (val <= 0) return height - padding;
        const logVal = Math.log10(val + 1);
        const ratio = logVal / logMax;
        return height - padding - (ratio * (height - 2 * padding));
    };

    const getX = (min: number): number => {
        return padding + (min / 60) * (width - 2 * padding);
    };

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="damage-chart-svg">
            {[0, 10, 20, 30, 40, 50, 60].map(min => (
                <line key={min} x1={getX(min)} y1={padding} x2={getX(min)} y2={height - padding} className="chart-grid-line" />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const y = height - padding - (ratio * (height - 2 * padding));
                return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} className="chart-grid-line" />;
            })}

            <text x={padding} y={height - 5} className="chart-axis-label">0m</text>
            <text x={width / 2} y={height - 5} className="chart-axis-label chart-axis-label-center">30m</text>
            <text x={width - padding} y={height - 5} className="chart-axis-label chart-axis-label-end">60m</text>

            <text x={5} y={height / 2} className="chart-axis-label chart-axis-label-center" transform={`rotate(-90, 5, ${height / 2})`}>AVG. DAMAGE (LOG)</text>

            {Object.entries(data).map(([cls, history]) => {
                const lastIdx = history.reduce((acc, val, idx) => (val > 0 ? idx : acc), -1);
                if (lastIdx < 0) return null;
                const visible = history.slice(0, lastIdx + 1);
                const points = visible.map((d, min) => `${getX(min)},${getY(d)}`).join(' ');
                const color = getClassColor(cls);
                return (
                    <g key={cls} style={{ '--line-color': color } as LineCSSProperties}>
                        <polyline
                            points={points}
                            className="chart-line"
                        />
                        {visible.map((d, i) => (
                            <circle key={i} cx={getX(i)} cy={getY(d)} r="2" fill={color} style={{ opacity: 0.8 }} />
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}
