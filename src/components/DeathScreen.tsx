import React, { useEffect, useState } from 'react';
import { RadarChart } from './RadarChart';
import type { GameState, UpgradeChoice } from '../logic/core/types';
import { calcStat, getDefenseReduction } from '../logic/utils/MathUtils';
import { calculateLegendaryBonus } from '../logic/upgrades/LegendaryLogic';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { submitRunToLeaderboard } from '../utils/leaderboard';

interface DeathScreenProps {
    stats: {
        time: number;
        kills: number;
        bosses: number;
        level: number;
    };
    gameState: GameState;
    onRestart: () => void;
    onQuit: () => void;
    onShowLeaderboard: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ stats, gameState, onRestart, onQuit, onShowLeaderboard }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'modules'>('overview');
    const [rank, setRank] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(true);
    const [displayStats, setDisplayStats] = useState({
        kills: 0,
        level: 0,
        bosses: 0,
        dust: 0,
        snitch: 0,
        portals: 0,
    });

    useEffect(() => {
        // Auto-submit run when player dies
        if (gameState.runSubmitted) {
            setIsSubmitting(false); // Already submitted, stop loading
            return;
        }

        gameState.runSubmitted = true; // Mark as submitted immediately

        submitRunToLeaderboard(gameState).then(result => {
            if (result.success && result.rank) {
                setRank(result.rank);
            }
            setIsSubmitting(false);
        });
    }, []);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const code = e.code.toLowerCase();
            if (code === 'keya' || code === 'arrowleft') setActiveTab('overview');
            if (code === 'keyd' || code === 'arrowright') setActiveTab('modules');
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    useEffect(() => {
        const duration = 1200;
        const startTime = Date.now();

        // Capture initial values to avoid glitches if props change during animation
        const initialKills = stats.kills;
        const initialLevel = stats.level;
        const initialBosses = stats.bosses;
        const initialDust = gameState.player.dust;
        const initialSnitch = gameState.snitchCaught || 0;
        const initialPortals = gameState.portalsUsed || 0;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            const ease = 1 - Math.pow(1 - progress, 5);

            setDisplayStats({
                kills: Math.floor(initialKills * ease),
                level: Math.floor(initialLevel * ease),
                bosses: Math.floor(initialBosses * ease),
                dust: Math.floor(initialDust * ease),
                snitch: Math.floor(initialSnitch * ease),
                portals: Math.floor(initialPortals * ease),
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
    }, []); // Only run once on mount to prevent "glitching" if parents re-render/pass new object refs

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatDmg = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
        return Math.floor(val).toString();
    };

    const armor = calcStat(gameState.player.arm);
    const armRed = (getDefenseReduction(armor) * 100).toFixed(1);

    const colRedRaw = calculateLegendaryBonus(gameState, 'col_red_per_kill');
    const colRed = Math.min(80, colRedRaw).toFixed(1);

    const projRedRaw = calculateLegendaryBonus(gameState, 'proj_red_per_kill');
    const projRed = Math.min(80, projRedRaw).toFixed(1);

    const regen = calcStat(gameState.player.reg).toFixed(1);
    const maxHp = Math.round(calcStat(gameState.player.hp));

    const xpBase = gameState.player.xp_per_kill.base;
    const finalXpPerKill = Math.round(calcStat({
        ...gameState.player.xp_per_kill,
        base: xpBase
    }));

    const upgrades = [...gameState.player.upgradesCollected].sort((a, b) => {
        const tierMap: Record<string, number> = {
            'scrap': 0, 'anomalous': 1, 'quantum': 2, 'astral': 3, 'radiant': 4,
            'abyss': 5, 'eternal': 6, 'divine': 7, 'singularity': 8, 'boss': 9
        };
        const tierA = tierMap[a.rarity.id] || 0;
        const tierB = tierMap[b.rarity.id] || 0;
        return tierA !== tierB ? tierA - tierB : a.type.name.localeCompare(b.type.name);
    });

    const grouped: { choice: UpgradeChoice, count: number }[] = [];
    upgrades.forEach(u => {
        const key = `${u.rarity.id}-${u.type.id}`;
        const existing = grouped.find(g => `${g.choice.rarity.id}-${g.choice.type.id}` === key);
        if (existing) existing.count++;
        else grouped.push({ choice: u, count: 1 });
    });

    if (gameState.extractionStatus === 'complete') {
        return (
            <div style={{
                height: '100%', width: '100%', background: '#050505',
                position: 'absolute', top: 0, left: 0, zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: 72, fontWeight: 900, letterSpacing: 8,
                    background: 'linear-gradient(to bottom, #fff 0%, #10b981 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: 20, animation: 'pulse-glow 2s infinite ease-in-out'
                }}>
                    MISSION COMPLETED
                </div>

                {!isSubmitting && rank && (
                    <div style={{ marginBottom: 40 }}>
                        <div style={{ color: '#94a3b8', fontSize: 14, letterSpacing: 2, fontWeight: 800, marginBottom: 5 }}>GLOBAL RANK</div>
                        <div style={{ color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#10b981', fontSize: 48, fontWeight: 900, lineHeight: 1 }}>#{rank}</div>
                    </div>
                )}

                <button
                    onClick={onQuit}
                    style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '2px solid #10b981',
                        color: '#10b981',
                        padding: '15px 40px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: '20px',
                        fontWeight: 900,
                        letterSpacing: '4px',
                        textShadow: '0 0 10px #10b981',
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    MAIN MENU
                </button>

                <style>{`
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.3)); }
                        50% { opacity: 1; filter: drop-shadow(0 0 30px rgba(16, 185, 129, 0.6)); }
                    }
                `}</style>
            </div>
        );
    }

    const FinalStatItem = ({ label, value, color = '#fff' }: { label: string, value: string | number, color?: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: 'Orbitron, sans-serif' }}>{label}</span>
            <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif', color }}>{value}</span>
        </div>
    );

    const StatItem = ({ label, value, color = '#fff', subValue = '' }: { label: string, value: string | number, color?: string, subValue?: string }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Orbitron, sans-serif' }}>{label}</span>
            <div style={{ textAlign: 'right' }}>
                <span style={{ color, fontSize: 15, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>{value}</span>
                {subValue && <div style={{ fontSize: 8, color: '#64748b' }}>{subValue}</div>}
            </div>
        </div>
    );

    return (
        <div className="death-screen" style={{
            height: '100%',
            width: '100%',
            background: '#050505',
            position: 'absolute',
            top: 0,
            left: 0,
            overflowY: 'auto',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 0 250px'
        }}>
            {/* Action Buttons */}
            <div style={{ position: 'fixed', top: 20, right: 30, display: 'flex', alignItems: 'center', gap: 15, zIndex: 12000 }}>
                {isSubmitting ? (
                    <div style={{ color: '#22d3ee', fontSize: 10, letterSpacing: 1, fontWeight: 800 }}>UPLOADING RECORD...</div>
                ) : rank ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ color: '#94a3b8', fontSize: 9, letterSpacing: 1, fontWeight: 800 }}>GLOBAL RANK</div>
                        <div style={{ color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#22d3ee', fontSize: 20, fontWeight: 900, lineHeight: 1 }}>#{rank}</div>
                    </div>
                ) : null}

                <button className="btn-restart" onClick={onShowLeaderboard} style={{
                    minWidth: 100, height: 32, fontSize: 12, letterSpacing: 1,
                    fontWeight: 800, textTransform: 'uppercase', padding: '0 10px',
                    background: 'rgba(34, 211, 238, 0.1)', border: '1px solid #22d3ee', color: '#22d3ee'
                }}>RANKINGS</button>

                <button className="btn-restart" onClick={onRestart} style={{
                    minWidth: 100, height: 32, fontSize: 12, letterSpacing: 1,
                    fontWeight: 800, textTransform: 'uppercase', padding: '0 10px'
                }}>RETRIAL</button>
                <button className="btn-restart" onClick={onQuit} style={{
                    minWidth: 100, height: 32, fontSize: 12, letterSpacing: 1,
                    fontWeight: 800, textTransform: 'uppercase', padding: '0 10px',
                    background: 'transparent', border: '1px solid #334155', color: '#94a3b8', boxShadow: 'none'
                }}>MAIN MENU</button>
            </div>

            {/* Header Section - Shrinked title */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                <div className="death-title" style={{
                    fontSize: 54,
                    marginBottom: 10,
                    background: 'linear-gradient(to bottom, #fff 0%, #334155 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontWeight: 900, letterSpacing: 4, textAlign: 'center'
                }}>SESSION TERMINATED</div>

                <div className="death-tabs" style={{ marginBottom: 5, display: 'flex', justifyContent: 'center' }}>
                    <button className={`death-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')} style={{ padding: '6px 20px', fontSize: 14 }}>Overview</button>
                    <button className={`death-tab ${activeTab === 'modules' ? 'active' : ''}`} onClick={() => setActiveTab('modules')} style={{ padding: '6px 20px', fontSize: 14 }}>Hardware Profile</button>
                </div>
            </div>

            {/* Content Logic - Compacted height */}
            <div style={{ width: '1000px', display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                        {/* MISSION LOG */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '15px 20px', borderRadius: 12, border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: 12, color: '#22d3ee', letterSpacing: 3, marginBottom: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Orbitron, sans-serif' }}>
                                <div style={{ width: 4, height: 16, background: '#22d3ee' }} /> MISSION LOG
                            </div>
                            <StatItem label="Time Active" value={formatTime(stats.time)} color="#fff" />
                            <StatItem label="LEVEL" value={displayStats.level} color="#22d3ee" />
                            <StatItem label="Kill Count" value={displayStats.kills} color="#ef4444" subValue={`${displayStats.bosses} Bosses`} />
                            <StatItem label="Snitches" value={displayStats.snitch} color="#f59e0b" />
                            <StatItem label="Portals" value={displayStats.portals} color="#a855f7" />
                            <StatItem label="Meteorites" value={gameState.meteoritesPickedUp || 0} color="#10b981" />
                            <StatItem label="Fatal Event" value={gameState.player.deathCause || 'Unknown'} color="#ef4444" />

                            <div style={{ marginTop: 20, fontSize: 11, color: '#475569', letterSpacing: 1, borderTop: '1px solid #1e293b', paddingTop: 10, fontFamily: 'Orbitron, sans-serif' }}>
                                SECTOR ALLOCATION
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ECONOMIC</span><span style={{ color: '#94a3b8', fontFamily: 'Orbitron, sans-serif' }}>{formatTime(gameState.timeInArena?.[0] || 0)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>COMBAT</span><span style={{ color: '#94a3b8', fontFamily: 'Orbitron, sans-serif' }}>{formatTime(gameState.timeInArena?.[1] || 0)}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DEFENSE</span><span style={{ color: '#94a3b8', fontFamily: 'Orbitron, sans-serif' }}>{formatTime(gameState.timeInArena?.[2] || 0)}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* FINAL SYSTEM PERFORMANCE */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '15px 20px', borderRadius: 12, border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: 12, color: '#00ffff', letterSpacing: 1.5, marginBottom: 12, fontWeight: 900, borderBottom: '1px solid rgba(0, 255, 255, 0.1)', paddingBottom: 6, textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                                FINAL SYSTEM PERFORMANCE
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', background: 'rgba(10, 15, 30, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 255, 0.1)' }}>
                                <FinalStatItem label="DMG/HIT" value={formatDmg(calcStat(gameState.player.dmg))} color="#f59e0b" />
                                <FinalStatItem label="MAX HP" value={formatDmg(maxHp)} color="#4ade80" />
                                <FinalStatItem label="XP/KILL" value={finalXpPerKill} color="#22d3ee" />
                                <FinalStatItem label="ATK SPEED" value={(2.64 * Math.log(calcStat(gameState.player.atk) / 100) - 1.25).toFixed(2) + '/s'} color="#a855f7" />
                                <FinalStatItem label="REGEN" value={regen + '/s'} color="#4ade80" />
                                <FinalStatItem label="ARMOR" value={Math.round(calcStat(gameState.player.arm))} color="#3b82f6" />
                                <FinalStatItem label="ARM REDUC" value={armRed + '%'} color="#3b82f6" />
                                <FinalStatItem label="SPEED" value={gameState.player.speed.toFixed(1)} color="#22d3ee" />
                                <FinalStatItem label="COL REDUC" value={colRed + '%'} color="#3b82f6" />
                                <FinalStatItem label="PROJ REDUC" value={projRed + '%'} color="#3b82f6" />
                            </div>
                        </div>

                        {/* COMBAT ANALYTICS */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '20px 25px', borderRadius: 12, border: '1px solid #1e293b', gridColumn: 'span 2' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, color: '#3b82f6', letterSpacing: 3, marginBottom: 15, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Orbitron, sans-serif' }}>
                                        <div style={{ width: 4, height: 16, background: '#3b82f6' }} /> COMBAT ANALYTICS
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
                                        <StatItem label="DMG Dealt" value={formatDmg(gameState.player.damageDealt)} color="#f59e0b" />
                                        <StatItem label="DMG Blocked" value={formatDmg(gameState.player.damageBlocked)} color="#3b82f6" />
                                        <StatItem label="DMG Received" value={formatDmg(gameState.player.damageTaken)} color="#ef4444" />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '2px 0' }}>
                                            <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ARMOR</span><span style={{ color: '#94a3b8' }}>{formatDmg(gameState.player.damageBlockedByArmor || 0)}</span></div>
                                            <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>SHIELD</span><span style={{ color: '#94a3b8' }}>{formatDmg(gameState.player.damageBlockedByShield || 0)}</span></div>
                                            <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>COLLISION</span><span style={{ color: '#94a3b8' }}>{formatDmg(gameState.player.damageBlockedByCollisionReduc || 0)}</span></div>
                                            <div style={{ fontSize: 9, display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>PROJECTILE</span><span style={{ color: '#94a3b8' }}>{formatDmg(gameState.player.damageBlockedByProjectileReduc || 0)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginLeft: 40, marginTop: 15, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <RadarChart player={gameState.player} size={110} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'modules' && (
                    <div style={{ width: '100%', background: 'rgba(15, 23, 42, 0.6)', borderRadius: 12, border: '1px solid #1e293b', padding: 20 }}>
                        <div style={{ fontSize: 14, color: '#22d3ee', letterSpacing: 4, marginBottom: 15, borderBottom: '1px solid #1e293b', paddingBottom: 10, fontWeight: 800, fontFamily: 'Orbitron, sans-serif' }}>
                            HARDWARE MODIFICATIONS ({gameState.player.upgradesCollected.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                            {grouped.map((g, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'rgba(30, 41, 59, 0.3)', padding: '10px', borderRadius: 8,
                                    borderLeft: `4px solid ${g.choice.rarity.color}`
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{ color: g.choice.rarity.color, fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }}>{g.choice.rarity.label}</span>
                                        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{g.choice.type.name}</span>
                                    </div>
                                    <span style={{ color: '#475569', fontSize: 11, fontWeight: 900 }}>x{g.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
