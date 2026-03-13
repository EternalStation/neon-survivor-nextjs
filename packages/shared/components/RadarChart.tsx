import React from 'react';
import type { Player } from '../logic/core/Types';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/UiTranslations';

interface RadarCounts {
    dps: number;
    arm: number;
    exp: number;
    hp: number;
    reg: number;
    [key: string]: number; // allow string index
}

interface RadarChartProps {
    player?: Player;
    counts?: RadarCounts;
    size?: number;
    showLabels?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({ player, counts: propCounts, size = 150, showLabels = true }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);

    // Logic: Visualize Build Focus based on upgrade counts
    const counts = {
        dps: propCounts?.dps ?? propCounts?.DPS ?? 0,
        arm: propCounts?.arm ?? propCounts?.ARM ?? 0,
        exp: propCounts?.exp ?? propCounts?.EXP ?? 0,
        hp: propCounts?.hp ?? propCounts?.HP ?? 0,
        reg: propCounts?.reg ?? propCounts?.REG ?? 0
    };

    if (player && !propCounts) {
        player.upgradesCollected.forEach((u: any) => {
            const id = u.type.id;
            if (id.startsWith('dmg') || id === 'atk_s') counts.dps++;
            else if (id.startsWith('arm')) counts.arm++;
            else if (id.startsWith('xp')) counts.exp++;
            else if (id.startsWith('hp')) counts.hp++;
            else if (id.startsWith('reg')) counts.reg++;
        });
    }

    const maxCount = Math.max(counts.dps, counts.arm, counts.exp, counts.hp, counts.reg, 1); // Avoid div by 0

    const getPct = (val: number) => {
        const pct = (val / maxCount) * 100;
        return isNaN(pct) ? 0 : pct;
    };

    const pts = [
        { label: 'DPS', val: getPct(counts.dps), a: -90 }, // Top
        { label: 'ARM', val: getPct(counts.arm), a: -18 }, // Top Right
        { label: 'XP', val: getPct(counts.exp), a: 54 },  // Bottom Right
        { label: 'HP', val: getPct(counts.hp), a: 126 },   // Bottom Left
        { label: 'REG', val: getPct(counts.reg), a: 198 }  // Top Left
    ];

    const radius = size * 0.28; // slightly smaller than half to fit labels
    const center = size / 2;

    const points = pts.map(p => {
        const r = (p.val / 100) * radius;
        const rad = p.a * (Math.PI / 180);
        return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)} `;
    }).join(' ');

    const bgPoints = pts.map(p => {
        const rad = p.a * (Math.PI / 180);
        return `${center + radius * Math.cos(rad)},${center + radius * Math.sin(rad)} `;
    }).join(' ');

    // Web levels (25%, 50%, 75%)
    const webs = [0.25, 0.5, 0.75].map(scale =>
        pts.map(p => {
            const rad = p.a * (Math.PI / 180);
            const r = radius * scale;
            return `${center + r * Math.cos(rad)},${center + r * Math.sin(rad)} `;
        }).join(' ')
    );

    return (
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Pentagon */}
                <polygon points={bgPoints} fill="rgba(30, 41, 59, 0.3)" stroke="#334155" strokeWidth="1" />

                {/* Inner Webs */}
                {webs.map((w, i) => (
                    <polygon key={i} points={w} fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
                ))}

                {/* Data Polygon */}
                <polygon points={points} fill="rgba(34, 211, 238, 0.2)" stroke="#22d3ee" strokeWidth="2" />

                {/* Dots */}
                {pts.map((p, i) => {
                    const r = (p.val / 100) * radius;
                    const rad = p.a * (Math.PI / 180);
                    const x = center + r * Math.cos(rad);
                    const y = center + r * Math.sin(rad);
                    return <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#22d3ee" strokeWidth="1" />
                })}

                {/* Labels */}
                {showLabels && pts.map((p, i) => {
                    const r = radius + 15;
                    const rad = p.a * (Math.PI / 180);
                    const x = center + r * Math.cos(rad);
                    const y = center + r * Math.sin(rad);
                    return (
                        <text key={i} x={x} y={y} fill="#94a3b8" fontSize="10" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
                            {p.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};
