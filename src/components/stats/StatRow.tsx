import React from 'react';
import type { PlayerStats } from '../../logic/core/types';
import { formatLargeNumber } from '../../utils/format';

interface StatRowProps {
    label: string;
    stat: PlayerStats;
    t: any;
    isPercent?: boolean;
    extraInfo?: string;
    legendaryBonusFlat?: number;
    legendaryBonusPct?: number;
    arenaMult?: number;
    isDisabled?: boolean;
}

export const StatRow: React.FC<StatRowProps> = ({
    label, stat, t, isPercent, extraInfo,
    legendaryBonusFlat = 0, legendaryBonusPct = 0,
    arenaMult = 1, isDisabled = false
}) => {
    const baseSum = stat.base + stat.flat + legendaryBonusFlat;
    const upgradeMult = 1 + (stat.mult || 0) / 100;
    const hexScaling = 1 + legendaryBonusPct / 100;
    const classScaling = 1 + (stat.classMult || 0) / 100;

    let total = baseSum * upgradeMult * hexScaling * classScaling * arenaMult;
    if (isDisabled) total = 0;

    const formatNum = (val: number) => {
        return formatLargeNumber(val);
    };

    const displayTotal = isPercent ? `${formatNum(total)}%` : formatNum(total);

    const isBuffed = arenaMult > 1;
    const totalColor = isDisabled ? '#ef4444' : (isBuffed ? '#3b82f6' : '#4ade80');

    const isAtkSpeed = label === t.statsMenu.labels.attackSpeed;

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>{label}</span>
                {extraInfo && <span style={{ color: '#64748b', fontSize: 12 }}>{extraInfo}</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>

                {legendaryBonusFlat > 0 ? (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        ({formatLargeNumber(Math.round((stat.base + stat.flat) * 10) / 10)} <span style={{ color: '#fbbf24' }}>+{formatLargeNumber(Math.round(legendaryBonusFlat * 10) / 10)}</span>)
                    </span>
                ) : (
                    <span style={{ color: '#64748b', fontSize: 12 }}>
                        {formatLargeNumber(Math.round(baseSum * 10) / 10)}
                    </span>
                )}

                {!isAtkSpeed && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{formatLargeNumber(Math.round(upgradeMult * 100))}%</span>
                    </>
                )}

                {legendaryBonusPct > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#f97316', fontSize: 12 }}>{formatLargeNumber(Math.round(hexScaling * 100))}%</span>
                    </>
                )}

                {(stat.hexMult2 ?? 0) > 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: label === 'Regeneration' ? '#3b82f6' : '#fbbf24', fontSize: 12 }}>{formatLargeNumber(Math.round((1 + (stat.hexMult2 ?? 0) / 100) * 100))}%</span>
                    </>
                )}

                {(stat.classMult ?? 0) !== 0 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#d946ef', fontSize: 12 }}>{formatLargeNumber(Math.round(classScaling * 100))}%</span>
                    </>
                )}

                {arenaMult !== 1 && (
                    <>
                        <span style={{ color: '#64748b', fontSize: 12 }}> x </span>
                        <span style={{ color: '#3b82f6', fontSize: 12 }}>{formatLargeNumber(Math.round(arenaMult * 100))}%</span>
                    </>
                )}

                <span style={{ color: '#64748b', fontSize: 12 }}> = </span>
                <span style={{ color: totalColor, fontSize: 18, fontWeight: 600, minWidth: 30, textAlign: 'right' }}>
                    {displayTotal}
                </span>
            </div>
        </div>
    );
};
