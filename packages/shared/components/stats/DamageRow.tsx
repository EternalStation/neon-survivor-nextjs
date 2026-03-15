import React from 'react';
import { formatLargeNumber } from '../../utils/Format';

interface DamageRowProps {
    label: string;
    amount: number;
    total: number;
    color?: string;
    gradient?: [string, string];
    icon?: string;
    subLabel?: string;
}

export function DamageRow({ label, amount, total, color = '#4ade80', gradient, icon, subLabel }: DamageRowProps) {
    const percent = total > 0 ? (amount / total) * 100 : 0;

    const barBackground = gradient
        ? `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`
        : color;

    const glowColor = gradient ? gradient[0] : color;

    return (
        <div style={{ marginBottom: subLabel ? 12 : 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {icon && (
                        <div style={{ width: 18, height: 18, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {icon.startsWith('/') ? (
                                <img src={icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: 14 }}>{icon}</span>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
                        {subLabel && <span style={{ color: glowColor, fontSize: 9, fontWeight: 700, opacity: 0.8, letterSpacing: '0.5px' }}>{subLabel}</span>}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontSize: 11, fontWeight: 900, fontFamily: 'monospace' }}>{formatLargeNumber(amount)}</div>
                    <div style={{ color: '#64748b', fontSize: 9, fontWeight: 700 }}>{percent.toFixed(1)}%</div>
                </div>
            </div>
            <div style={{ height: 4, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{
                    height: '100%',
                    width: `${Math.min(100, percent)}%`,
                    background: barBackground,
                    boxShadow: `0 0 10px ${glowColor}44`,
                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                }} />
            </div>
        </div>
    );
}
