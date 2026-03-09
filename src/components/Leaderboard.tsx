import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/Client';
import { RadarChart } from './RadarChart';
import { PLAYER_CLASSES } from '../logic/core/Classes';
import { formatLargeNumber } from '../utils/Format';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation, UI_TRANSLATIONS } from '../lib/UiTranslations';
import { LeaderboardStatistics } from './LeaderboardStatistics';
import { DamageRow } from './stats/DamageRow';
import { getDamageMapping } from '../utils/DamageMapping';
import { normalizeDeathCause } from '../utils/DeathCauseUtils';
import './Leaderboard.css';

interface LegendaryHex {
    id: string;
    type: string;
    name: string;
}

interface RadarCounts {
    dps: number;
    arm: number;
    exp: number;
    hp: number;
    reg: number;
    [key: string]: number;
}

interface Blueprint {
    name?: string;
    type?: string;
    count?: number;
}

interface LeaderboardEntry {
    id: number;
    username: string;
    score: string | number;
    survival_time: number;
    kills: number;
    boss_kills: number;
    class_used: string;
    completed_at: string;
    legendary_hexes?: LegendaryHex[];
    arena_times?: Record<number, number>;
    damage_dealt?: number;
    damage_taken?: number;
    damage_blocked?: number;
    damage_blocked_armor?: number;
    damage_blocked_collision?: number;
    damage_blocked_projectile?: number;
    damage_blocked_shield?: number;
    radar_counts?: RadarCounts;
    portals_used?: number;
    hex_levelup_order?: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }>;
    snitches_caught?: number;
    death_cause?: string;
    patch_version?: string;
    timezone_offset?: number;
    final_stats?: {
        dmg: number;
        hp: number;
        xp: number;
        atkSpd: number;
        regen: number;
        armor: number;
        speed: number;
    };
    blueprints?: Blueprint[];
    damage_breakdown?: Record<string, number>;
    class_skill_dmg_history?: number[] | string;
}

interface LeaderboardProps {
    onClose: () => void;
    currentUsername?: string;
}

interface FinalStatItemProps {
    label: string;
    value: string | number;
    color?: string;
}

const FinalStatItem = ({ label, value, color = '#fff' }: FinalStatItemProps) => (
    <div className="final-stat-item">
        <span className="stat-label">{label}</span>
        <span className="stat-value" style={{ '--stat-color': color } as React.CSSProperties}>{value}</span>
    </div>
);

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Leaderboard({ onClose, currentUsername }: LeaderboardProps) {
    const { language } = useLanguage();
    const t = getUiTranslation(language).leaderboard;
    const [mode, setMode] = useState<'rankings' | 'meta'>('rankings');
    const [period, setPeriod] = useState<'global' | 'daily' | 'patch'>('patch');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [patches, setPatches] = useState<string[]>([]);
    const [selectedPatch, setSelectedPatch] = useState<string>('');
    const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
    const [activeExpandedTab, setActiveExpandedTab] = useState<'stats' | 'damage'>('stats');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [classFilter, setClassFilter] = useState<string>('All');
    const [searchFilter, setSearchFilter] = useState<string>('');

    useEffect(() => {
        loadLeaderboard();
    }, [period, selectedPatch]);

    useEffect(() => {
        loadPatches();
    }, []);

    const loadPatches = async () => {
        try {
            const data = await api.getPatches();
            let patchVersions = (data.patches || []).map((p: { patch_version: string }) => p.patch_version);
            if (patchVersions.length === 0) {
                patchVersions = ['1.0.1'];
            }
            setPatches(patchVersions);
            setSelectedPatch(patchVersions[0]);
        } catch (err) {
            console.error('Failed to load patches:', err);
            setPatches(['1.0.1']);
            setSelectedPatch('1.0.1');
        }
    };

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            let data;
            if (period === 'patch' && selectedPatch) {
                data = await api.getPatchLeaderboard(selectedPatch, 100);
            } else if (period === 'daily') {
                data = await api.getDailyLeaderboard(100);
            } else if (period === 'global') {
                data = await api.getGlobalLeaderboard(100);
            }
            setEntries(data?.leaderboard || []);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRun = async (runId: number) => {
        if (!window.confirm(t.confirmDelete)) return;

        setDeletingId(runId);
        try {
            await api.deleteRun(runId);
            setEntries(prev => prev.filter(e => e.id !== runId));
            setExpandedRunId(null);
        } catch (err: unknown) {
            console.error('Delete failed:', err);
            const error = err as Error;
            alert(`${t.wipeFailed} ${error.message || t.connectionInterrupted}`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm(t.confirmPurge)) return;

        setLoading(true);
        try {
            await api.clearMyRuns();
            loadLeaderboard();
        } catch (err: unknown) {
            console.error('Clear failed:', err);
            const error = err as Error;
            alert(`${t.purgeFailed} ${error.message || t.databaseLock}`);
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = useMemo(() => {
        const filtered = entries.filter(entry => {
            const matchesClass = classFilter === 'All' || entry.class_used === classFilter.toLowerCase();
            const matchesSearch = entry.username.toLowerCase().includes(searchFilter.toLowerCase());
            return matchesClass && matchesSearch;
        });

        return [...filtered].sort((a, b) => {
            const aEvac = a.death_cause === 'EVACUATED';
            const bEvac = b.death_cause === 'EVACUATED';

            if (aEvac && !bEvac) return -1;
            if (!aEvac && bEvac) return 1;

            if (aEvac && bEvac) {
                return a.survival_time - b.survival_time;
            } else {
                return b.survival_time - a.survival_time;
            }
        });
    }, [entries, classFilter, searchFilter]);

    const formatDate = (dateStr: string, timezoneOffset?: number) => {
        const date = new Date(dateStr);

        if (timezoneOffset !== undefined) {
            const viewerOffset = new Date().getTimezoneOffset();
            const offsetDiff = viewerOffset - timezoneOffset;
            date.setMinutes(date.getMinutes() + offsetDiff);
        }

        const dateOptions: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : undefined, dateOptions) + ' ' + date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : undefined, timeOptions);
    };

    const getClassColor = (id: string) => {
        const cls = PLAYER_CLASSES.find(c => c.id === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase());
        return cls?.themeColor || '#00ffff';
    };

    const getClassName = (classId: string) => {
        const cls = PLAYER_CLASSES.find(c => c.id === classId.toLowerCase() || c.name.toLowerCase() === classId.toLowerCase());
        if (!cls) return classId;

        if (language === 'ru') {
            const ruClasses = UI_TRANSLATIONS.ru.classSelection.classes;
            const classKey = cls.id as keyof typeof ruClasses;
            if (ruClasses[classKey]) return ruClasses[classKey].name;
        }
        return cls.name;
    };

    const translateDeathCause = (cause: string) => {
        const normalized = normalizeDeathCause(cause);
        if (language === 'en') return normalized;
        if (!normalized) return 'Неизвестно';

        if (normalized === 'EVACUATED') return 'ЭВАКУИРОВАН';
        if (normalized === 'Hive Swarm') return 'Рой Улья';
        if (normalized === 'Abomination') return 'Абоминация';
        if (normalized === 'Abomination Burn') return 'Испепеление Абоминации';
        if (normalized === 'Enemy Projectile') return 'Вражеский Снаряд';
        if (normalized === 'Wall Impact') return 'Удар об Стену';
        if (normalized === 'Zombie Horde') return 'Орда Зомби';
        if (normalized === 'Pentagon Minion') return 'Миньон Пентагона';
        if (normalized === 'Unknown') return 'Неизвестно';

        let result = normalized;
        const ruBosses = UI_TRANSLATIONS.ru.bosses.names;

        const translateShape = (shape: string) => {
            const lowShape = shape.toLowerCase();
            return ruBosses[lowShape as keyof typeof ruBosses] || shape;
        };

        if (result.startsWith('Boss ')) {
            const match = result.match(/Boss (\w+)(?: \(Lvl (\d+)\))?/);
            if (match) {
                const shape = match[1];
                const lvl = match[2];
                result = `Босс ${translateShape(shape)}${lvl ? ` (Ур ${lvl})` : ''}`;
            }
        } else if (result.startsWith('Killed by Boss Thorns ')) {
            const match = result.match(/\((\w+)\)/);
            if (match) {
                const shape = match[1];
                result = `Убит Шипами Босса (${translateShape(shape)})`;
            }
        } else if (result.startsWith('Collision with Elite ')) {
            const match = result.match(/Elite (\w+)/);
            if (match) {
                const shape = match[1];
                result = `Столкновение с Элитным ${translateShape(shape)}`;
            }
        } else if (result.startsWith('Collision with ')) {
            const match = result.match(/with (\w+)/);
            if (match) {
                const shape = match[1];
                result = `Столкновения с ${translateShape(shape)}`;
            }
        } else if (result === 'Abomination') {
            result = 'Адский Разлом';
        } else if (result === 'Abomination Burn') {
            result = 'Адское Испепеление';
        } else if (result === 'Enemy Projectile') {
            result = 'Вражеский Снаряд';
        } else if (result === 'Wall Impact') {
            result = 'Удар об Стену';
        } else if (result.includes('Diamond Boss: Orbital Satellites')) {
            result = 'Уничтожен Алмазным Боссом: Орбитальные Спутники';
        } else if (result.includes('Pentagon Boss: Parasitic Link')) {
            result = 'Истощен Пятиугольным Боссом: Паразитическая Связь';
        }

        return result;
    };

    const hasUserRuns = useMemo(() => {
        return entries.some(e => e.username === currentUsername);
    }, [entries, currentUsername]);

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-container" onClick={(e) => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2>{t.title}</h2>
                    <div className="header-actions">
                        {hasUserRuns && (
                            <button className="purge-btn" onClick={handleClearAll}>{t.purgeHistory}</button>
                        )}
                        <button className="leaderboard-close" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="lb-nav-row">
                    <div className="leaderboard-mode-tabs lb-mode-tabs-inline">
                        <button
                            className={`mode-tab ${mode === 'rankings' ? 'active' : ''}`}
                            onClick={() => setMode('rankings')}
                        >
                            {t.rankings || 'RANKINGS'}
                        </button>
                        <button
                            className={`mode-tab ${mode === 'meta' ? 'active' : ''}`}
                            onClick={() => setMode('meta')}
                        >
                            {t.metaTitle || 'GLOBAL STATISTICS (META)'}
                        </button>
                    </div>

                    <div className="leaderboard-tabs lb-period-tabs-inline">
                        <button className={period === 'patch' ? 'active' : ''} onClick={() => setPeriod('patch')}>{t.byPatch}</button>
                        <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>{t.daily}</button>
                        <button className={period === 'global' ? 'active' : ''} onClick={() => setPeriod('global')}>{t.allTime}</button>
                    </div>
                </div>

                {mode === 'rankings' ? (
                    <>
                        <div className="leaderboard-controls">
                            <div className="leaderboard-filters">
                                <div className="filter-group">
                                    <label>{t.classLabel}</label>
                                    <div className="class-filter-row">
                                        <button
                                            className={`class-filter-btn ${classFilter === 'All' ? 'active' : ''}`}
                                            onClick={() => setClassFilter('All')}
                                            title={t.allClasses}
                                        >
                                            <div className="hex-icon-placeholder">{t.allClasses}</div>
                                        </button>
                                        {PLAYER_CLASSES.map(cls => (
                                            <button
                                                key={cls.id}
                                                className={`class-filter-btn ${classFilter === cls.id ? 'active' : ''}`}
                                                onClick={() => setClassFilter(cls.id)}
                                                title={getClassName(cls.id).toUpperCase()}
                                                style={{ '--class-color': cls.themeColor } as React.CSSProperties}
                                            >
                                                <img src={cls.iconUrl} alt={cls.name} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {period === 'patch' && patches.length > 0 && (
                                    <div className="filter-group">
                                        <label>{t.versionLabel}</label>
                                        <select value={selectedPatch} onChange={(e) => setSelectedPatch(e.target.value)}>
                                            {patches.map(patch => (
                                                <option key={patch} value={patch}>{patch}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="filter-group">
                                <label>{t.searchLabel}</label>
                                <input
                                    type="text"
                                    placeholder={t.playerNamePlaceholder}
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="leaderboard-content">
                            {loading ? (
                                <div className="leaderboard-loading">
                                    <div className="loading-glitch" data-text={t.loading}>{t.loading}</div>
                                </div>
                            ) : filteredEntries.length === 0 ? (
                                <div className="leaderboard-empty">{t.noRecords}</div>
                            ) : (
                                <table className="leaderboard-table">
                                    <thead>
                                        <tr>
                                            <th>{t.rank}</th>
                                            <th>{t.player}</th>
                                            <th>{t.time}</th>
                                            <th>{t.class}</th>
                                            <th>{t.caused}</th>
                                            <th>{t.date}</th>
                                            <th>{t.patch}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.map((entry, index) => {
                                            const isExpanded = expandedRunId === entry.id;
                                            const isUserRun = entry.username === currentUsername;
                                            const classColor = getClassColor(entry.class_used);
                                            const rankKey = index < 3 ? (index + 1).toString() : 'default';
                                            const causeClass = entry.death_cause === 'EVACUATED' ? 'cause-evacuated' : 'cause-killed';

                                            return (
                                                <React.Fragment key={entry.id}>
                                                    <tr
                                                        className={`lb-row-clickable ${index < 3 ? 'top-rank' : ''} ${isExpanded ? 'expanded-row-parent' : ''} ${isUserRun ? 'user-run-row' : ''}`}
                                                        onClick={() => {
                                                            setExpandedRunId(isExpanded ? null : entry.id);
                                                            setActiveExpandedTab('stats');
                                                        }}
                                                    >
                                                        <td className={`rank-cell rank-cell-${rankKey}`}>
                                                            #{index + 1}
                                                        </td>
                                                        <td className="player-name">
                                                            {entry.username} {isUserRun && <span className="owner-tag">{t.youTag}</span>}
                                                        </td>
                                                        <td className="time-cell">{formatTime(entry.survival_time)}</td>
                                                        <td className="class-cell" style={{ '--class-color': classColor } as React.CSSProperties}>{getClassName(entry.class_used)}</td>
                                                        <td className={`cause-cell ${causeClass}`}>{translateDeathCause(entry.death_cause || '')}</td>
                                                        <td className="date">{formatDate(entry.completed_at, entry.timezone_offset)}</td>
                                                        <td className="patch-cell">{entry.patch_version || '1.0.0'}</td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="expanded-details">
                                                            <td colSpan={7}>
                                                                <div className="expanded-tabs-row">
                                                                    <button
                                                                        className={`exp-tab stats ${activeExpandedTab === 'stats' ? 'active' : ''}`}
                                                                        onClick={(e) => { e.stopPropagation(); setActiveExpandedTab('stats'); }}
                                                                    >
                                                                        MISSION STATS
                                                                    </button>
                                                                    <button
                                                                        className={`exp-tab damage ${activeExpandedTab === 'damage' ? 'active' : ''}`}
                                                                        onClick={(e) => { e.stopPropagation(); setActiveExpandedTab('damage'); }}
                                                                    >
                                                                        DAMAGE ANALYSIS
                                                                    </button>
                                                                </div>

                                                                {activeExpandedTab === 'stats' ? (
                                                                    <div className="run-details-grid">
                                                                        <div className="details-card stats-card">
                                                                            <div className="card-header">{t.missionData}</div>
                                                                            <div className="stats-list">
                                                                                <div className="stat-row"><span>{t.dmgDealt}</span><span className="val-amber">{formatLargeNumber(entry.damage_dealt || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.dmgTaken}</span><span className="val-red">{formatLargeNumber(entry.damage_taken || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.dmgBlocked}</span><span className="val-blue">{formatLargeNumber(entry.damage_blocked || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.armor}</span><span>{formatLargeNumber(entry.damage_blocked_armor || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.shield}</span><span>{formatLargeNumber(entry.damage_blocked_shield || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.collision}</span><span>{formatLargeNumber(entry.damage_blocked_collision || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.projectile}</span><span>{formatLargeNumber(entry.damage_blocked_projectile || 0)}</span></div>
                                                                                <div className="stat-row stat-row-mt"><span>{t.kills}</span><span className="val-amber">{entry.kills.toLocaleString()}</span></div>
                                                                                <div className="stat-row"><span>{t.snitches}</span><span className="val-cyan">{entry.snitches_caught || 0}</span></div>
                                                                                <div className="stat-row"><span>{t.portals}</span><span className="val-purple">{entry.portals_used || 0}</span></div>
                                                                            </div>

                                                                            <div className="card-header card-header-mt">{t.arenaLog}</div>
                                                                            <div className="stats-list stats-list-flex">
                                                                                <div className="stat-row"><span>{t.eco}</span><span>{formatTime(entry.arena_times?.[0] || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.com}</span><span>{formatTime(entry.arena_times?.[1] || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.def}</span><span>{formatTime(entry.arena_times?.[2] || 0)}</span></div>
                                                                            </div>

                                                                            {isUserRun && (
                                                                                <div className="card-footer">
                                                                                    <button
                                                                                        className="delete-run-btn"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteRun(entry.id);
                                                                                        }}
                                                                                        disabled={deletingId === entry.id}
                                                                                    >
                                                                                        {deletingId === entry.id ? t.wiping : t.wipeRecord}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="details-card legendary-card">
                                                                            <div className="section-header section-header-cyan">
                                                                                {t.finalPerformance}
                                                                            </div>
                                                                            {entry.final_stats && (
                                                                                <div className="final-stats-grid">
                                                                                    <FinalStatItem label={t.dmgHit} value={formatLargeNumber(entry.final_stats.dmg)} color="#f59e0b" />
                                                                                    <FinalStatItem label={t.maxHp} value={formatLargeNumber(entry.final_stats.hp)} color="#4ade80" />
                                                                                    <FinalStatItem label={t.xpKill} value={formatLargeNumber(entry.final_stats.xp || 0)} color="#22d3ee" />
                                                                                    <FinalStatItem label={t.atkSpeed} value={(2.64 * Math.log(entry.final_stats.atkSpd / 100) - 1.25).toFixed(2) + '/s'} color="#a855f7" />
                                                                                    <FinalStatItem label={t.regen} value={formatLargeNumber(entry.final_stats.regen) + '/s'} color="#4ade80" />
                                                                                    <FinalStatItem label={t.armor} value={formatLargeNumber(entry.final_stats.armor)} color="#3b82f6" />
                                                                                    <FinalStatItem label={t.speed} value={entry.final_stats.speed.toFixed(1)} color="#22d3ee" />
                                                                                </div>
                                                                            )}

                                                                            <div className="section-header section-header-blue">
                                                                                {t.augmentationHistory}
                                                                            </div>
                                                                            <div className="legendary-grid">
                                                                                {entry.hex_levelup_order && entry.hex_levelup_order.length > 0 ? (
                                                                                    entry.hex_levelup_order.map((step, i) => {
                                                                                        const hexBase = entry.legendary_hexes?.find(h => h.id === step.hexId);
                                                                                        if (!hexBase) return null;

                                                                                        return (
                                                                                            <div key={i} className="hex-step-item">
                                                                                                <div className="hex-icon-wrapper-small">
                                                                                                    <img
                                                                                                        src={`/assets/hexes/${hexBase.type === 'EcoDMG' ? 'EcoDMG' :
                                                                                                            hexBase.type === 'EcoXP' ? 'EcoXP' :
                                                                                                                hexBase.type === 'EcoHP' ? 'EcoHP' :
                                                                                                                    hexBase.type === 'ComLife' ? 'ComLife' :
                                                                                                                        hexBase.type === 'ComCrit' ? 'ComCrit' :
                                                                                                                            hexBase.type === 'ComWave' ? 'ComWave' :
                                                                                                                                hexBase.type === 'DefPuddle' ? 'DefPuddle' :
                                                                                                                                    hexBase.type === 'DefEpi' ? 'DefEpi' :
                                                                                                                                        hexBase.type === 'CombShield' ? 'EcoArmor' :
                                                                                                                                            hexBase.type === 'orbital_strike' ? 'CosmicBeam' :
                                                                                                                                                hexBase.type === 'shield_passive' ? 'AigisVortex' :
                                                                                                                                                    hexBase.type === 'KineticBattery' ? 'DefBattery' :
                                                                                                                                                        hexBase.type === 'RadiationCore' ? 'ComRad' :
                                                                                                                                                            hexBase.type === 'ChronoPlating' ? 'DefChromo' :
                                                                                                                                                                'MalwarePrime'
                                                                                                            }${hexBase.type === 'shield_passive' ? '.PNG' : '.png'}`}
                                                                                                        alt={hexBase.name}
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="hex-step-level">LVL {step.level}</div>
                                                                                                <div className="hex-step-kills">{step.gameTime ? formatTime(step.gameTime) : ''}</div>
                                                                                            </div>
                                                                                        );
                                                                                    })
                                                                                ) : (
                                                                                    <div className="empty-msg">{t.noAugments}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="details-card radar-card">
                                                                            <div className="card-header">{t.hardwareProfile}</div>
                                                                            <div className="radar-chart-wrapper">
                                                                                <RadarChart counts={entry.radar_counts} size={150} />
                                                                            </div>
                                                                        </div>

                                                                        <div className="details-card blueprints-card">
                                                                            <div className="section-header section-header-amber">
                                                                                {t.blueprintConfig}
                                                                            </div>
                                                                            <div className="blueprints-list">
                                                                                {entry.blueprints && entry.blueprints.length > 0 ? (
                                                                                    entry.blueprints.map((bp: Blueprint, i: number) => (
                                                                                        <div key={i} className="blueprint-item">
                                                                                            <div className="blueprint-dot"></div>
                                                                                            <span className="blueprint-name">{bp.name || bp.type} x{bp.count || 1}</span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="empty-msg empty-blueprints">{t.noBlueprints}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="damage-analysis-view">
                                                                        <div className="damage-analysis-inner">
                                                                            <div className="damage-attribution-header">
                                                                                <span>DAMAGE ATTRIBUTION</span>
                                                                                <span className="damage-total">TOTAL: {formatLargeNumber(entry.damage_dealt || 0)}</span>
                                                                            </div>
                                                                            <div className="damage-sources-list">
                                                                                {(() => {
                                                                                    const { groupMap, sourceColors, sourceGradients } = getDamageMapping(entry.class_used);
                                                                                    const breakdown = entry.damage_breakdown || {};
                                                                                    const totalDamage = entry.damage_dealt || 0;
                                                                                    const processedSources = new Set<string>();
                                                                                    const rows: React.ReactNode[] = [];
                                                                                    const tu = getUiTranslation(language);

                                                                                    Object.entries(groupMap).forEach(([parent, cfg]) => {
                                                                                        let groupTotal = 0;
                                                                                        cfg.children.forEach(c => groupTotal += (breakdown[c] || 0));

                                                                                        if (groupTotal > 0) {
                                                                                            const activeChildren = cfg.children.filter(c => (breakdown[c] || 0) > 0);
                                                                                            const showChildren = activeChildren.length > 1;

                                                                                            rows.push(
                                                                                                <div key={parent + "_group"}>
                                                                                                    <DamageRow
                                                                                                        label={parent === 'Projectile' ? (tu.statsMenu.labels.damageSources.projectile || 'Projectile') : parent}
                                                                                                        amount={groupTotal}
                                                                                                        total={totalDamage}
                                                                                                        color={cfg.color}
                                                                                                        gradient={cfg.gradient}
                                                                                                        icon={parent === 'Projectile' ? undefined : cfg.icon}
                                                                                                    />
                                                                                                    {showChildren && (
                                                                                                        <div className="damage-child-group">
                                                                                                            {activeChildren.map(c => (
                                                                                                                <div key={c} className="damage-child-row">
                                                                                                                    <span className="damage-child-label">- {cfg.childLabels[c] || c}</span>
                                                                                                                    <span className="damage-child-val">{formatLargeNumber(breakdown[c])}</span>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                            cfg.children.forEach(c => processedSources.add(c));
                                                                                        }
                                                                                    });

                                                                                    Object.entries(breakdown).forEach(([source, amount]) => {
                                                                                        if (processedSources.has(source) || amount <= 0) return;

                                                                                        rows.push(
                                                                                            <DamageRow
                                                                                                key={source}
                                                                                                label={tu.statsMenu.labels.damageSources[source as keyof typeof tu.statsMenu.labels.damageSources] || source}
                                                                                                amount={amount}
                                                                                                total={totalDamage}
                                                                                                color={sourceColors[source] || '#64748b'}
                                                                                                gradient={sourceGradients[source]}
                                                                                                icon={undefined}
                                                                                            />
                                                                                        );
                                                                                    });

                                                                                    return rows.length > 0 ? rows : <div className="no-damage-msg">NO DETAILED DAMAGE DATA AVAILABLE FOR THIS RUN</div>;
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="leaderboard-content meta-content">
                        {loading ? (
                            <div className="leaderboard-loading">
                                <div className="loading-glitch" data-text={t.loading}>{t.loading}</div>
                            </div>
                        ) : (
                            <LeaderboardStatistics
                                entries={filteredEntries}
                                language={language}
                                t={t}
                                getClassColor={getClassColor}
                                getClassName={getClassName}
                                translateDeathCause={translateDeathCause}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
