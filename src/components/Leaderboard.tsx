import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { RadarChart } from './RadarChart';
import { PLAYER_CLASSES } from '../logic/core/classes';
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

const formatLargeNum = (num: number | string) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return '0';

    if (value >= 1000000000000000) return (value / 1000000000000000).toFixed(1) + 'Q';
    if (value >= 1000000000000) return (value / 1000000000000).toFixed(1) + 'T';
    if (value >= 1000000000) return (value / 1000000000).toFixed(1) + 'B';
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
    return value.toLocaleString();
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Leaderboard({ onClose, currentUsername }: LeaderboardProps) {
    const [period, setPeriod] = useState<'global' | 'daily' | 'patch'>('patch');
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
        if (!window.confirm('PERMANENTLY DELETE THIS RECORD FROM NEON LINK?')) return;

        setDeletingId(runId);
        try {
            await api.deleteRun(runId);
            setEntries(prev => prev.filter(e => e.id !== runId));
            setExpandedRunId(null);
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert(`WIPE FAILED: ${err.message || 'CONNECTION INTERRUPTED'}`);
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
        } catch (err: any) {
            console.error('Clear failed:', err);
            alert(`PURGE FAILED: ${err.message || 'DATABASE LOCK DETECTED'}`);
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
        return date.toLocaleDateString(undefined, dateOptions) + ' ' + date.toLocaleTimeString(undefined, timeOptions);
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

    const hasUserRuns = useMemo(() => {
        return entries.some(e => e.username === currentUsername);
    }, [entries, currentUsername]);

    return (
        <div className="leaderboard-overlay" onClick={onClose}>
            <div className="leaderboard-container" onClick={(e) => e.stopPropagation()}>
                <div className="leaderboard-header">
                    <h2 style={{ fontFamily: 'Orbitron, sans-serif' }}>Global Leaderboard</h2>
                    <div className="header-actions">
                        {hasUserRuns && (
                            <button className="purge-btn" onClick={handleClearAll}>PURGE MY HISTORY</button>
                        )}
                        <button className="leaderboard-close" onClick={onClose}>×</button>
                    </div>
                </div>

                <div className="leaderboard-controls">
                    <div className="leaderboard-tabs" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        <button className={period === 'patch' ? 'active' : ''} onClick={() => setPeriod('patch')}>By Patch</button>
                        <button className={period === 'daily' ? 'active' : ''} onClick={() => setPeriod('daily')}>Daily</button>
                        <button className={period === 'global' ? 'active' : ''} onClick={() => setPeriod('global')}>All Time</button>
                    </div>

                    <div className="leaderboard-filters">
                        <div className="filter-group">
                            <label style={{ fontFamily: 'Orbitron, sans-serif' }}>CLASS:</label>
                            <div className="class-filter-row">
                                <button
                                    className={`class-filter-btn ${classFilter === 'All' ? 'active' : ''}`}
                                    onClick={() => setClassFilter('All')}
                                    title="ALL CLASSES"
                                >
                                    <div className="hex-icon-placeholder" style={{ fontFamily: 'Orbitron, sans-serif' }}>ALL</div>
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
                            <label style={{ fontFamily: 'Orbitron, sans-serif' }}>SEARCH:</label>
                            <input
                                type="text"
                                placeholder="PLAYER NAME..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                style={{ fontFamily: 'Orbitron, sans-serif' }}
                            />
                        </div>
                    </div>
                </div>

                {period === 'patch' && patches.length > 0 && (
                    <div className="patch-selector">
                        <label style={{ fontFamily: 'Orbitron, sans-serif' }}>Version:</label>
                        <select value={selectedPatch} onChange={(e) => setSelectedPatch(e.target.value)} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {patches.map(patch => (
                                <option key={patch} value={patch}>{patch}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="leaderboard-content">
                    {loading ? (
                        <div className="leaderboard-loading">
                            <div className="loading-glitch" data-text="LOADING RECORDS..." style={{ fontFamily: 'Orbitron, sans-serif' }}>LOADING RECORDS...</div>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="leaderboard-empty" style={{ fontFamily: 'Orbitron, sans-serif' }}>No records found matching criteria.</div>
                    ) : (
                        <table className="leaderboard-table">
                            <thead style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>Time</th>
                                    <th>Class</th>
                                    <th>CAUSED</th>
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
                                                <td style={{ color: getRankColor(index + 1), fontWeight: '900', fontFamily: 'Orbitron, sans-serif' }}>
                                                    #{index + 1}
                                                </td>
                                                <td className="player-name" style={{ fontWeight: '700' }}>
                                                    {entry.username} {isUserRun && <span className="owner-tag">(YOU)</span>}
                                                </td>
                                                <td className="time-val" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatTime(entry.survival_time)}</td>
                                                <td className="class-name" style={{ color: classColor, fontWeight: '700', fontFamily: 'Orbitron, sans-serif' }}>{getClassName(entry.class_used)}</td>
                                                <td className="cause-val" style={{ color: entry.death_cause === 'EVACUATED' ? '#10b981' : '#ef4444', fontSize: '0.9em', fontWeight: '500', fontFamily: 'Orbitron, sans-serif' }}>{entry.death_cause || 'Unknown'}</td>
                                                <td className="date" style={{ opacity: 0.7 }}>{formatDate(entry.completed_at, entry.timezone_offset)}</td>
                                                <td className="patch-val" style={{ opacity: 0.5 }}>{entry.patch_version || '1.0.0'}</td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="expanded-details">
                                                    <td colSpan={7}>
                                                        <div className="run-details-grid">
                                                            {/* STATS ANALYTICS */}
                                                            <div className="details-card stats-card">
                                                                <div className="card-header" style={{ fontFamily: 'Orbitron, sans-serif' }}>MISSION DATA</div>
                                                                <div className="stats-list" style={{ fontFamily: 'Orbitron, sans-serif' }}>
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

                                                                <div className="card-header" style={{ marginTop: 15, fontFamily: 'Orbitron, sans-serif' }}>ARENA LOG</div>
                                                                <div className="stats-list" style={{ flex: 1, fontFamily: 'Orbitron, sans-serif' }}>
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
                                                                            style={{ fontFamily: 'Orbitron, sans-serif' }}
                                                                        >
                                                                            {deletingId === entry.id ? 'WIPING...' : 'WIPE RECORD'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* LEGENDARY LINEUP */}
                                                            <div className="details-card legendary-card" style={{ gridColumn: 'span 2' }}>
                                                                <div style={{ fontSize: '12px', color: '#00ffff', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(0, 255, 255, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                                                    Final System Performance
                                                                </div>
                                                                {entry.final_stats && (
                                                                    <div className="final-stats-grid" style={{ marginBottom: '24px' }}>
                                                                        <FinalStatItem label="DMG/HIT" value={formatLargeNum(entry.final_stats.dmg)} color="#f59e0b" />
                                                                        <FinalStatItem label="MAX HP" value={formatLargeNum(entry.final_stats.hp)} color="#4ade80" />
                                                                        <FinalStatItem label="XP/KILL" value={formatLargeNum(entry.final_stats.xp || 0)} color="#22d3ee" />
                                                                        <FinalStatItem label="ATK SPEED" value={(2.64 * Math.log(entry.final_stats.atkSpd / 100) - 1.25).toFixed(2) + '/s'} color="#a855f7" />
                                                                        <FinalStatItem label="REGEN" value={entry.final_stats.regen.toFixed(1) + '/s'} color="#4ade80" />
                                                                        <FinalStatItem label="ARMOR" value={formatLargeNum(entry.final_stats.armor)} color="#3b82f6" />
                                                                        <FinalStatItem label="SPEED" value={entry.final_stats.speed.toFixed(1)} color="#22d3ee" />
                                                                    </div>
                                                                )}

                                                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                                                    Augmentation History
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
                                                                                                                            hexBase.type === 'CombShield' ? 'DefShield' :
                                                                                                                                hexBase.type === 'orbital_strike' ? 'CosmicBeam' :
                                                                                                                                    hexBase.type === 'shield_passive' ? 'AigisVortex' :
                                                                                                                                        hexBase.type === 'KineticBattery' ? 'DefBattery' :
                                                                                                                                            hexBase.type === 'RadiationCore' ? 'ComRad' :
                                                                                                                                                hexBase.type === 'ChronoPlating' ? 'EcoPlating' :
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
                                                                        <div className="empty-msg" style={{ fontFamily: 'Orbitron, sans-serif' }}>No legendary augments acquired.</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* RADAR PROFILE */}
                                                            <div className="details-card radar-card">
                                                                <div className="card-header" style={{ fontFamily: 'Orbitron, sans-serif' }}>HARDWARE PROFILE</div>
                                                                <div style={{ padding: '10px 0' }}>
                                                                    <RadarChart counts={entry.radar_counts} size={150} />
                                                                </div>
                                                            </div>

                                                            {/* BLUEPRINT LOADOUT */}
                                                            <div className="details-card blueprints-card" style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                                                                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '12px', borderBottom: '1px solid rgba(245, 158, 11, 0.1)', paddingBottom: '6px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                                                    Blueprint Configuration
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
                                                                        <div className="empty-msg" style={{ fontStyle: 'italic', opacity: 0.5, fontSize: 11, fontFamily: 'Orbitron, sans-serif' }}>No blueprints recorded.</div>
                                                                    )}
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

                .stat-label {
                    font-size: 10px;
                    font-weight: 800;
                    color: rgba(255, 255, 255, 0.4);
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    font-family: 'Orbitron', sans-serif;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 700;
                    font-family: 'Orbitron', sans-serif;
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
