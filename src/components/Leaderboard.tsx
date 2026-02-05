import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { RadarChart } from './RadarChart';
import { PLAYER_CLASSES } from '../logic/classes';
import './Leaderboard.css';

interface LeaderboardEntry {
    id: number;
    username: string;
    score: number;
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
}

interface LeaderboardProps {
    onClose: () => void;
    currentUsername?: string;
}

export default function Leaderboard({ onClose, currentUsername }: LeaderboardProps) {
    const [period, setPeriod] = useState<'global' | 'daily' | 'weekly' | 'patch'>('global');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [patches, setPatches] = useState<string[]>([]);
    const [selectedPatch, setSelectedPatch] = useState<string>('');
    const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
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
            const patchVersions = data.patches.map((p: any) => p.patch_version);
            setPatches(patchVersions);
            if (patchVersions.length > 0) {
                setSelectedPatch(patchVersions[0]);
            }
        } catch (err) {
            console.error('Failed to load patches:', err);
        }
    };

    const loadLeaderboard = async () => {
        setLoading(true);
        try {
            let data;
            if (period === 'global') {
                data = await api.getGlobalLeaderboard(100);
            } else if (period === 'daily') {
                data = await api.getDailyLeaderboard(100);
            } else if (period === 'weekly') {
                data = await api.getWeeklyLeaderboard(100);
            } else if (period === 'patch' && selectedPatch) {
                data = await api.getPatchLeaderboard(selectedPatch, 100);
            }
            setEntries(data?.leaderboard || []);
        } catch (err) {
            console.error('Failed to load leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRun = async (runId: number) => {
        if (!window.confirm('PERMANENTLY DELETE THIS RECORD FROM NEON LINK?')) return;

        setDeletingId(runId);
        try {
            await api.deleteRun(runId);
            setEntries(prev => prev.filter(e => e.id !== runId));
            setExpandedRunId(null);
        } catch (err) {
            console.error('Delete failed:', err);
            alert('WIPE FAILED: CONNECTION INTERRUPTED');
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('WIPE YOUR ENTIRE RUN HISTORY FROM THE LEADERBOARD?')) return;

        setLoading(true);
        try {
            await api.clearMyRuns();
            loadLeaderboard();
        } catch (err) {
            console.error('Clear failed:', err);
            alert('PURGE FAILED: DATABASE LOCK DETECTED');
        } finally {
            setLoading(false);
        }
    };

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const matchesClass = classFilter === 'All' || entry.class_used === classFilter.toLowerCase();
            const matchesSearch = entry.username.toLowerCase().includes(searchFilter.toLowerCase());
            return matchesClass && matchesSearch;
        });
    }, [entries, classFilter, searchFilter]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return 'rgba(255, 255, 255, 0.7)';
    };

    const getClassColor = (classId: string) => {
        const cls = PLAYER_CLASSES.find(c => c.id === classId.toLowerCase() || c.name.toLowerCase() === classId.toLowerCase());
        return cls?.themeColor || '#8a2be2';
    };

    const getClassName = (classId: string) => {
        const cls = PLAYER_CLASSES.find(c => c.id === classId.toLowerCase() || c.name.toLowerCase() === classId.toLowerCase());
        return cls?.name || classId;
    };

    const formatLargeNum = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString();
    };

    const hasUserRuns = useMemo(() => {
        return entries.some(e => e.username === currentUsername);
    }, [entries, currentUsername]);

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-container" onClick={(e) => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2>Global Leaderboard</h2>
                    <div className="header-actions">
                        {hasUserRuns && (
                            <button className="purge-btn" onClick={handleClearAll}>PURGE MY HISTORY</button>
                        )}
                        <button className="leaderboard-close" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="leaderboard-controls">
                    <div className="leaderboard-tabs">
                        <button className={period === 'global' ? 'active' : ''} onClick={() => setPeriod('global')}>All Time</button>
                        <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>Daily</button>
                        <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
                        <button className={period === 'patch' ? 'active' : ''} onClick={() => setPeriod('patch')}>By Patch</button>
                    </div>

                    <div className="leaderboard-filters">
                        <div className="filter-group">
                            <label>CLASS:</label>
                            <div className="class-filter-row">
                                <button
                                    className={`class-filter-btn ${classFilter === 'All' ? 'active' : ''}`}
                                    onClick={() => setClassFilter('All')}
                                    title="ALL CLASSES"
                                >
                                    <div className="hex-icon-placeholder">ALL</div>
                                </button>
                                {PLAYER_CLASSES.map(cls => (
                                    <button
                                        key={cls.id}
                                        className={`class-filter-btn ${classFilter === cls.id ? 'active' : ''}`}
                                        onClick={() => setClassFilter(cls.id)}
                                        title={cls.name.toUpperCase()}
                                        style={{ '--class-color': cls.themeColor } as React.CSSProperties}
                                    >
                                        <img src={cls.iconUrl} alt={cls.name} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="filter-group">
                            <label>SEARCH:</label>
                            <input
                                type="text"
                                placeholder="PLAYER NAME..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {period === 'patch' && patches.length > 0 && (
                    <div className="patch-selector">
                        <label>Patch Version:</label>
                        <select value={selectedPatch} onChange={(e) => setSelectedPatch(e.target.value)}>
                            {patches.map(patch => (
                                <option key={patch} value={patch}>{patch}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="leaderboard-content">
                    {loading ? (
                        <div className="leaderboard-loading">
                            <div className="loading-glitch" data-text="LOADING RECORDS...">LOADING RECORDS...</div>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="leaderboard-empty">No records found matching criteria.</div>
                    ) : (
                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>Time</th>
                                    <th>Class</th>
                                    <th>Cause</th>
                                    <th>Date</th>
                                    <th>Patch</th>
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
                                                onClick={() => setExpandedRunId(isExpanded ? null : entry.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td style={{ color: getRankColor(index + 1), fontWeight: 'bold' }}>
                                                    #{index + 1}
                                                </td>
                                                <td className="player-name">
                                                    {entry.username} {isUserRun && <span className="owner-tag">(YOU)</span>}
                                                </td>
                                                <td className="time-val">{formatTime(entry.survival_time)}</td>
                                                <td className="class-name" style={{ color: classColor }}>{getClassName(entry.class_used)}</td>
                                                <td className="cause-val" style={{ color: '#ef4444', fontSize: '0.9em' }}>{entry.death_cause || 'Unknown'}</td>
                                                <td className="date">{formatDate(entry.completed_at)}</td>
                                                <td className="patch-val" style={{ opacity: 0.5 }}>{entry.patch_version || '1.0.0'}</td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="expanded-details">
                                                    <td colSpan={7}>
                                                        <div className="run-details-grid">
                                                            {/* STATS ANALYTICS */}
                                                            <div className="details-card stats-card">
                                                                <div className="card-header">MISSION DATA</div>
                                                                <div className="stats-list">
                                                                    <div className="stat-row"><span>DMG DEALT</span><span className="val-amber">{formatLargeNum(entry.damage_dealt || 0)}</span></div>
                                                                    <div className="stat-row"><span>DMG TAKEN</span><span className="val-red">{formatLargeNum(entry.damage_taken || 0)}</span></div>
                                                                    <div className="stat-row"><span>DMG BLOCKED</span><span className="val-blue">{formatLargeNum(entry.damage_blocked || 0)}</span></div>
                                                                    <div className="stat-sub-row"><span>ARMOR</span><span>{formatLargeNum(entry.damage_blocked_armor || 0)}</span></div>
                                                                    <div className="stat-sub-row"><span>SHIELD</span><span>{formatLargeNum(entry.damage_blocked_shield || 0)}</span></div>
                                                                    <div className="stat-sub-row"><span>COLLISION</span><span>{formatLargeNum(entry.damage_blocked_collision || 0)}</span></div>
                                                                    <div className="stat-sub-row"><span>PROJECTILE</span><span>{formatLargeNum(entry.damage_blocked_projectile || 0)}</span></div>
                                                                    <div className="stat-row" style={{ marginTop: 10 }}><span>KILLS</span><span className="val-amber">{entry.kills.toLocaleString()}</span></div>
                                                                    <div className="stat-row"><span>SNITCHES</span><span className="val-cyan">{entry.snitches_caught || 0}</span></div>
                                                                    <div className="stat-row"><span>PORTALS</span><span className="val-purple">{entry.portals_used || 0}</span></div>
                                                                </div>

                                                                <div className="card-header" style={{ marginTop: 15 }}>ARENA LOG</div>
                                                                <div className="stats-list" style={{ flex: 1 }}>
                                                                    <div className="stat-row"><span>ECO</span><span>{formatTime(entry.arena_times?.[0] || 0)}</span></div>
                                                                    <div className="stat-row"><span>COM</span><span>{formatTime(entry.arena_times?.[1] || 0)}</span></div>
                                                                    <div className="stat-row"><span>DEF</span><span>{formatTime(entry.arena_times?.[2] || 0)}</span></div>
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
                                                                        >
                                                                            {deletingId === entry.id ? 'WIPING...' : 'WIPE RECORD'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* LEGENDARY LINEUP */}
                                                            <div className="details-card legendary-card" style={{ gridColumn: 'span 2' }}>
                                                                <div className="card-header">AUGMENTATION HISTORY</div>
                                                                <div className="legendary-timeline-horizontal">
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
                                                                                                                            hexBase.type === 'CombShield' ? 'DefShield' :
                                                                                                                                hexBase.type === 'orbital_strike' ? 'CosmicBeam' :
                                                                                                                                    hexBase.type === 'shield_passive' ? 'AigisVortex' :
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
                                                                        <div className="empty-msg">No legendary augments acquired.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* RADAR PROFILE */}
                                                            <div className="details-card radar-card">
                                                                <div className="card-header">HARDWARE PROFILE</div>
                                                                <div style={{ padding: '10px 0' }}>
                                                                    <RadarChart counts={entry.radar_counts} size={150} />
                                                                </div>
                                                            </div>
                                                        </div>
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
            </div>
            <style>{`
                .loading-glitch {
                    font-size: 24px;
                    font-weight: 900;
                    color: #00ffff;
                    position: relative;
                    animation: glitch-pulse 1s infinite;
                }
                @keyframes glitch-pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.98); }
                    100% { opacity: 1; transform: scale(1); }
                }

                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .purge-btn {
                    background: rgba(255, 68, 68, 0.1);
                    border: 1px solid rgba(255, 68, 68, 0.4);
                    color: #ff4444;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .purge-btn:hover {
                    background: #ff4444;
                    color: #000;
                }

                .user-run-row {
                    background: rgba(0, 255, 255, 0.03) !important;
                }

                .owner-tag {
                    font-size: 10px;
                    color: #00ffff;
                    margin-left: 8px;
                    opacity: 0.8;
                }

                .delete-run-btn {
                    width: 100%;
                    background: rgba(255, 68, 68, 0.15);
                    border: 1px solid rgba(255, 68, 68, 0.5);
                    color: #ff4444;
                    padding: 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .delete-run-btn:hover:not(:disabled) {
                    background: #ff4444;
                    color: #000;
                    box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
                }

                .delete-run-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
