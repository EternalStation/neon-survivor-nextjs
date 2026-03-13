import React from 'react';
import type { Player } from '../../logic/core/Types';
import { formatLargeNumber } from '../../utils/Format';

interface VitalsAnalysisProps {
    player: Player;
    t: any;
}

const INCOMING_SOURCE_COLORS: Record<string, string> = {
    'Collision': '#f97316',
    'Projectile': '#ef4444',
    'Wall Impact': '#a78bfa',
    'Special Attack': '#fb923c',
};

const HEALING_SOURCE_COLORS: Record<string, string> = {
    'Regeneration': '#4ade80',
    'Lifesteal': '#f43f5e',
    'Radiation Aura': '#bef264',
    'Vital Spark': '#fbbf24',
    'Heal Turret': '#22d3ee',
    'Heal Drone': '#34d399',
    'Upgrade Heal': '#a855f7',
};

function SourceBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
    const pct = total > 0 ? (amount / total) * 100 : 0;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 4, borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>{label}</span>
                <span style={{ color, fontSize: 12, fontWeight: 700 }}>{formatLargeNumber(Math.round(amount))} ({pct.toFixed(1)}%)</span>
            </div>
            <div style={{ height: 3, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
        </div>
    );
}

export const VitalsAnalysis: React.FC<VitalsAnalysisProps> = ({ player, t }) => {
    const avgHp = (player.avgHpSampleCount || 0) > 0
        ? (player.avgHpAccumulator || 0) / (player.avgHpSampleCount || 1)
        : 100;

    const avgHpColor = avgHp >= 70 ? '#4ade80' : avgHp >= 40 ? '#fbbf24' : '#ef4444';

    const incomingBreakdown = player.incomingDamageBreakdown || {};
    const totalIncoming = Object.values(incomingBreakdown).reduce((s, v) => s + v, 0);
    const incomingSources = Object.entries(incomingBreakdown)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

    const healingBreakdown = player.healingBreakdown || {};
    const totalHealing = Object.values(healingBreakdown).reduce((s, v) => s + v, 0);
    const healingSources = Object.entries(healingBreakdown)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div style={{ paddingLeft: 10, paddingRight: 15, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid #334155',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 900, letterSpacing: '2px', marginBottom: 4 }}>
                        {t.statsMenu.vitals?.avgHp || 'AVG HP %'}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>
                        {t.statsMenu.vitals?.avgHpDesc || 'Running average over session'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: avgHpColor, fontSize: 28, fontWeight: 900, lineHeight: 1, filter: `drop-shadow(0 0 8px ${avgHpColor})` }}>
                        {avgHp.toFixed(1)}%
                    </div>
                    <div style={{ height: 4, width: 80, background: '#1e293b', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, avgHp)}%`, background: avgHpColor, borderRadius: 2 }} />
                    </div>
                </div>
            </div>

            <div>
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '3px', padding: '0 0 6px 0', borderBottom: '1px solid #334155', marginBottom: 8 }}>
                    {t.statsMenu.vitals?.incomingDmg || 'INCOMING DAMAGE'}
                    {totalIncoming > 0 && (
                        <span style={{ color: '#ef4444', marginLeft: 8 }}>{formatLargeNumber(Math.round(totalIncoming))}</span>
                    )}
                </div>
                {incomingSources.length === 0 ? (
                    <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>
                        {t.statsMenu.vitals?.noData || 'NO DATA YET'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {incomingSources.map(([source, amount]) => (
                            <SourceBar
                                key={source}
                                label={source}
                                amount={amount}
                                total={totalIncoming}
                                color={INCOMING_SOURCE_COLORS[source] || '#94a3b8'}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div>
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '3px', padding: '0 0 6px 0', borderBottom: '1px solid #334155', marginBottom: 8 }}>
                    {t.statsMenu.vitals?.healingSources || 'HEALING SOURCES'}
                    {totalHealing > 0 && (
                        <span style={{ color: '#4ade80', marginLeft: 8 }}>{formatLargeNumber(Math.round(totalHealing))}</span>
                    )}
                </div>
                {healingSources.length === 0 ? (
                    <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>
                        {t.statsMenu.vitals?.noData || 'NO DATA YET'}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {healingSources.map(([source, amount]) => (
                            <SourceBar
                                key={source}
                                label={source}
                                amount={amount}
                                total={totalHealing}
                                color={HEALING_SOURCE_COLORS[source] || '#4ade80'}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
