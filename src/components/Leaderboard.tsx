import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/Client';
import { RadarChart } from './RadarChart';
import { PLAYER_CLASSES } from '../logic/core/Classes';
import { formatLargeNumber } from '../utils/Format';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation, UI_TRANSLATIONS } from '../lib/uiTranslations';
import { LeaderboardStatistics } from './LeaderboardStatistics';
import { DamageRow } from './stats/DamageRow';
import { getDamageMapping } from '../utils/DamageMapping';
import { normalizeDeathCause } from '../utils/DeathCauseUtils';
import './Leaderboard.css';

interface LeaderboardEntry {
    id: number;
    username: string;
    score: string | number;
    survival_time: number;
    kills: number;
    boss_kills: number;
    class_used: string;
    completed_at: string;
    legendary_hexes?: any[];
    arena_times?: Record<number, number>;
    damage_dealt?: number;
    damage_taken?: number;
    damage_blocked?: number;
    damage_blocked_armor?: number;
    damage_blocked_collision?: number;
    damage_blocked_projectile?: number;
    damage_blocked_shield?: number;
    radar_counts?: any;
    portals_used?: number;
    hex_levelup_order?: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }>;
    snitches_caught?: number;
    death_cause?: string;
    patch_version?: string;
    timezone_offset?: number; // Player's timezone offset in minutes
    final_stats?: {
        dmg: number;
        hp: number;
        xp: number;
        atkSpd: number;
        regen: number;
        armor: number;
        speed: number;
    };
    blueprints?: any[];
    damage_breakdown?: Record<string, number>;
    class_skill_dmg_history?: number[] | string;
}

interface LeaderboardProps {
    onClose: () => void;
    currentUsername?: string;
}

const FinalStatItem = ({ label, value, color = '#fff' }: { label: string, value: string | number, color?: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span className="stat-label">{label}</span>
        <span className="stat-value" style={{ color }}>{value}</span>
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

    // Filters
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
            let patchVersions = (data.patches || []).map((p: any) => p.patch_version);
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
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert(`${t.wipeFailed} ${err.message || t.connectionInterrupted}`);
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
        } catch (err: any) {
            console.error('Clear failed:', err);
            alert(`${t.purgeFailed} ${err.message || t.databaseLock}`);
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
                // Both evacuated: fastest time first (asc)
                return a.survival_time - b.survival_time;
            } else {
                // Both died: longest survival first (desc)
                return b.survival_time - a.survival_time;
            }
        });
    }, [entries, classFilter, searchFilter]);

    const formatDate = (dateStr: string, timezoneOffset?: number) => {
        const date = new Date(dateStr);

        // If we have the player's timezone offset, adjust to show their local time
        if (timezoneOffset !== undefined) {
            // getTimezoneOffset() returns offset in minutes (e.g., -60 for UTC+1)
            // We need to adjust the UTC time to the player's local time
            const viewerOffset = new Date().getTimezoneOffset();
            const offsetDiff = viewerOffset - timezoneOffset;
            date.setMinutes(date.getMinutes() + offsetDiff);
        }

        // Format: "Feb 9, 2026 3:30 AM" (in player's local timezone)
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

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return 'rgba(255, 255, 255, 0.7)';
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

        // Exact matches
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

        // Try to translate shapes/boss names within the cause string
        const translateShape = (shape: string) => {
            const lowShape = shape.toLowerCase();
            return ruBosses[lowShape as keyof typeof ruBosses] || shape;
        };

        // Patterns
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
                    <h2 style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.title}</h2>
                    <div className="header-actions">
                        {hasUserRuns && (
                            <button className="purge-btn" onClick={handleClearAll}>{t.purgeHistory}</button>
                        )}
                        <button className="leaderboard-close" onClick={onClose}>×</button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', marginTop: '15px', borderBottom: '1px solid rgba(0, 255, 255, 0.2)' }}>
                    <div className="leaderboard-mode-tabs" style={{ padding: 0, margin: 0, borderBottom: 'none' }}>
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

                    <div className="leaderboard-tabs" style={{ fontFamily: 'Orbitron, sans-serif', padding: '0 0 10px 0' }}>
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
                                    <label style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.classLabel}</label>
                                    <div className="class-filter-row">
                                        <button
                                            className={`class-filter-btn ${classFilter === 'All' ? 'active' : ''}`}
                                            onClick={() => setClassFilter('All')}
                                            title={t.allClasses}
                                        >
                                            <div className="hex-icon-placeholder" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.allClasses}</div>
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
                                        <label style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.versionLabel}</label>
                                        <select value={selectedPatch} onChange={(e) => setSelectedPatch(e.target.value)} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                            {patches.map(patch => (
                                                <option key={patch} value={patch}>{patch}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="filter-group">
                                <label style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.searchLabel}</label>
                                <input
                                    type="text"
                                    placeholder={t.playerNamePlaceholder}
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                                />
                            </div>
                        </div>

                        <div className="leaderboard-content">
                            {loading ? (
                                <div className="leaderboard-loading">
                                    <div className="loading-glitch" data-text={t.loading} style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.loading}</div>
                                </div>
                            ) : filteredEntries.length === 0 ? (
                                <div className="leaderboard-empty" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.noRecords}</div>
                            ) : (
                                <table className="leaderboard-table">
                                    <thead style={{ fontFamily: 'Orbitron, sans-serif' }}>
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

                                            return (
                                                <React.Fragment key={entry.id}>
                                                    <tr
                                                        className={`${index < 3 ? 'top-rank' : ''} ${isExpanded ? 'expanded-row-parent' : ''} ${isUserRun ? 'user-run-row' : ''}`}
                                                        onClick={() => {
                                                            setExpandedRunId(isExpanded ? null : entry.id);
                                                            setActiveExpandedTab('stats');
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td style={{ color: getRankColor(index + 1), fontWeight: '900', fontFamily: 'Orbitron, sans-serif' }}>
                                                            #{index + 1}
                                                        </td>
                                                        <td className="player-name" style={{ fontWeight: '700' }}>
                                                            {entry.username} {isUserRun && <span className="owner-tag">{t.youTag}</span>}
                                                        </td>
                                                        <td className="time-val" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatTime(entry.survival_time)}</td>
                                                        <td className="class-name" style={{ color: classColor, fontWeight: '700', fontFamily: 'Orbitron, sans-serif' }}>{getClassName(entry.class_used)}</td>
                                                        <td className="cause-val" style={{ color: entry.death_cause === 'EVACUATED' ? '#10b981' : '#ef4444', fontSize: '0.9em', fontWeight: '500', fontFamily: 'Orbitron, sans-serif' }}>{translateDeathCause(entry.death_cause || '')}</td>
                                                        <td className="date" style={{ opacity: 0.7 }}>{formatDate(entry.completed_at, entry.timezone_offset)}</td>
                                                        <td className="patch-val" style={{ opacity: 0.5 }}>{entry.patch_version || '1.0.0'}</td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className="expanded-details">
                                                            <td colSpan={7}>
                                                                <div className="expanded-tabs-row" style={{ display: 'flex', gap: 10, marginBottom: 20, padding: '0 20px', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>
                                                                    <button
                                                                        className={`exp-tab ${activeExpandedTab === 'stats' ? 'active' : ''}`}
                                                                        onClick={(e) => { e.stopPropagation(); setActiveExpandedTab('stats'); }}
                                                                        style={{
                                                                            background: 'none', border: 'none',
                                                                            color: activeExpandedTab === 'stats' ? '#00ffff' : 'rgba(255,255,255,0.4)',
                                                                            fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 800,
                                                                            padding: '10px 20px', cursor: 'pointer', borderBottom: activeExpandedTab === 'stats' ? '2px solid #00ffff' : 'none'
                                                                        }}
                                                                    >
                                                                        MISSION STATS
                                                                    </button>
                                                                    <button
                                                                        className={`exp-tab ${activeExpandedTab === 'damage' ? 'active' : ''}`}
                                                                        onClick={(e) => { e.stopPropagation(); setActiveExpandedTab('damage'); }}
                                                                        style={{
                                                                            background: 'none', border: 'none',
                                                                            color: activeExpandedTab === 'damage' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                                                                            fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 800,
                                                                            padding: '10px 20px', cursor: 'pointer', borderBottom: activeExpandedTab === 'damage' ? '2px solid #f59e0b' : 'none'
                                                                        }}
                                                                    >
                                                                        DAMAGE ANALYSIS
                                                                    </button>
                                                                </div>

                                                                {activeExpandedTab === 'stats' ? (
                                                                    <div className="run-details-grid">
                                                                        {/* STATS ANALYTICS */}
                                                                        <div className="details-card stats-card">
                                                                            <div className="card-header" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.missionData}</div>
                                                                            <div className="stats-list" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                                                                <div className="stat-row"><span>{t.dmgDealt}</span><span className="val-amber">{formatLargeNumber(entry.damage_dealt || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.dmgTaken}</span><span className="val-red">{formatLargeNumber(entry.damage_taken || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.dmgBlocked}</span><span className="val-blue">{formatLargeNumber(entry.damage_blocked || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.armor}</span><span>{formatLargeNumber(entry.damage_blocked_armor || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.shield}</span><span>{formatLargeNumber(entry.damage_blocked_shield || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.collision}</span><span>{formatLargeNumber(entry.damage_blocked_collision || 0)}</span></div>
                                                                                <div className="stat-sub-row"><span>{t.projectile}</span><span>{formatLargeNumber(entry.damage_blocked_projectile || 0)}</span></div>
                                                                                <div className="stat-row" style={{ marginTop: 10 }}><span>{t.kills}</span><span className="val-amber">{entry.kills.toLocaleString()}</span></div>
                                                                                <div className="stat-row"><span>{t.snitches}</span><span className="val-cyan">{entry.snitches_caught || 0}</span></div>
                                                                                <div className="stat-row"><span>{t.portals}</span><span className="val-purple">{entry.portals_used || 0}</span></div>
                                                                            </div>

                                                                            <div className="card-header" style={{ marginTop: 15, fontFamily: 'Orbitron, sans-serif' }}>{t.arenaLog}</div>
                                                                            <div className="stats-list" style={{ flex: 1, fontFamily: 'Orbitron, sans-serif' }}>
                                                                                <div className="stat-row"><span>{t.eco}</span><span>{formatTime(entry.arena_times?.[0] || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.com}</span><span>{formatTime(entry.arena_times?.[1] || 0)}</span></div>
                                                                                <div className="stat-row"><span>{t.def}</span><span>{formatTime(entry.arena_times?.[2] || 0)}</span></div>
                                                                            </div>

                                                                            {isUserRun && (
                                                                                <div className="card-footer" style={{ marginTop: 20 }}>
                                                                                    <button
                                                                                        className="delete-run-btn"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleDeleteRun(entry.id);
                                                                                        }}
                                                                                        disabled={deletingId === entry.id}
                                                                                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                                                                                    >
                                                                                        {deletingId === entry.id ? t.wiping : t.wipeRecord}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* LEGENDARY LINEUP */}
                                                                        <div className="details-card legendary-card" style={{ gridColumn: 'span 2' }}>
                                                                            <div style={{ fontSize: '12px', color: '#00ffff', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(0, 255, 255, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                                                                {t.finalPerformance}
                                                                            </div>
                                                                            {entry.final_stats && (
                                                                                <div className="final-stats-grid" style={{ marginBottom: '24px' }}>
                                                                                    <FinalStatItem label={t.dmgHit} value={formatLargeNumber(entry.final_stats.dmg)} color="#f59e0b" />
                                                                                    <FinalStatItem label={t.maxHp} value={formatLargeNumber(entry.final_stats.hp)} color="#4ade80" />
                                                                                    <FinalStatItem label={t.xpKill} value={formatLargeNumber(entry.final_stats.xp || 0)} color="#22d3ee" />
                                                                                    <FinalStatItem label={t.atkSpeed} value={(2.64 * Math.log(entry.final_stats.atkSpd / 100) - 1.25).toFixed(2) + '/s'} color="#a855f7" />
                                                                                    <FinalStatItem label={t.regen} value={formatLargeNumber(entry.final_stats.regen) + '/s'} color="#4ade80" />
                                                                                    <FinalStatItem label={t.armor} value={formatLargeNumber(entry.final_stats.armor)} color="#3b82f6" />
                                                                                    <FinalStatItem label={t.speed} value={entry.final_stats.speed.toFixed(1)} color="#22d3ee" />
                                                                                </div>
                                                                            )}

                                                                            <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
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
                                                                                    <div className="empty-msg" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.noAugments}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* RADAR PROFILE */}
                                                                        <div className="details-card radar-card">
                                                                            <div className="card-header" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.hardwareProfile}</div>
                                                                            <div style={{ padding: '10px 0' }}>
                                                                                <RadarChart counts={entry.radar_counts} size={150} />
                                                                            </div>
                                                                        </div>

                                                                        {/* BLUEPRINT LOADOUT */}
                                                                        <div className="details-card blueprints-card" style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                                                                            <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(245, 158, 11, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                                                                {t.blueprintConfig}
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0' }}>
                                                                                {entry.blueprints && entry.blueprints.length > 0 ? (
                                                                                    entry.blueprints.map((bp: any, i: number) => (
                                                                                        <div key={i} style={{
                                                                                            display: 'flex', alignItems: 'center', gap: 6,
                                                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                                                                            padding: '6px 10px', borderRadius: 6
                                                                                        }}>
                                                                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div>
                                                                                            <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700, fontFamily: 'Orbitron, sans-serif' }}>{bp.name || bp.type} x{bp.count || 1}</span>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="empty-msg" style={{ fontStyle: 'italic', opacity: 0.5, fontSize: 11, fontFamily: 'Orbitron, sans-serif' }}>{t.noBlueprints}</div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="damage-analysis-view" style={{ padding: '0 20px 20px' }}>
                                                                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 12, padding: 25, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                                            <div style={{ fontSize: 14, color: '#f59e0b', letterSpacing: 4, marginBottom: 20, fontWeight: 800, fontFamily: 'Orbitron, sans-serif', display: 'flex', justifyContent: 'space-between' }}>
                                                                                <span>DAMAGE ATTRIBUTION</span>
                                                                                <span style={{ opacity: 0.6 }}>TOTAL: {formatLargeNumber(entry.damage_dealt || 0)}</span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                                {(() => {
                                                                                    const { groupMap, sourceColors, sourceGradients } = getDamageMapping(entry.class_used);
                                                                                    const breakdown = entry.damage_breakdown || {};
                                                                                    const totalDamage = entry.damage_dealt || 0;
                                                                                    const processedSources = new Set<string>();
                                                                                    const rows: React.ReactNode[] = [];
                                                                                    const tu = getUiTranslation(language);

                                                                                    // Grouped rows
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
                                                                                                        <div style={{ paddingLeft: 24, borderLeft: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                                                                            {activeChildren.map(c => (
                                                                                                                <div key={c} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                                                                                                                    <span style={{ color: '#94a3b8' }}>- {cfg.childLabels[c] || c}</span>
                                                                                                                    <span style={{ color: '#fff', fontWeight: 800 }}>{formatLargeNumber(breakdown[c])}</span>
                                                                                                                </div>
                                                                                                            ))}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                            cfg.children.forEach(c => processedSources.add(c));
                                                                                        }
                                                                                    });

                                                                                    // Remaining sources
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

                                                                                    return rows.length > 0 ? rows : <div style={{ textAlign: 'center', opacity: 0.5, fontSize: 12, padding: 40 }}>NO DETAILED DAMAGE DATA AVAILABLE FOR THIS RUN</div>;
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
                    <div className="leaderboard-content" style={{ padding: '0' }}>
                        {loading ? (
                            <div className="leaderboard-loading">
                                <div className="loading-glitch" data-text={t.loading} style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.loading}</div>
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
