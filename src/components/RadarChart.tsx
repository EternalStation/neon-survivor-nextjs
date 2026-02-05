import React from 'react';
import type { Player } from '../logic/types';

interface RadarCounts {
    DPS: number;
    ARM: number;
    EXP: number;
    HP: number;
    REG: number;
}

interface RadarChartProps {
    player?: Player;
    counts?: RadarCounts;
    size?: number;
    showLabels?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({ player, counts: propCounts, size = 150, showLabels = true }) => {
    // Logic: Visualize Build Focus based on upgrade counts
    const counts = propCounts || {
        DPS: 0,
        ARM: 0,
        EXP: 0,
        HP: 0,
        REG: 0
    };

    if (player && !propCounts) {
        player.upgradesCollected.forEach(u => {
            const id = u.type.id;
            if (id.startsWith('dmg') || id === 'atk_s') counts.DPS++;
            else if (id.startsWith('arm')) counts.ARM++;
            else if (id.startsWith('xp')) counts.EXP++;
            else if (id.startsWith('hp')) counts.HP++;
            else if (id.startsWith('reg')) counts.REG++;
        });
    }

    const maxCount = Math.max(counts.DPS, counts.ARM, counts.EXP, counts.HP, counts.REG, 1); // Avoid div by 0

    const getPct = (val: number) => (val / maxCount) * 100;

    const pts = [
        { label: 'DPS', val: getPct(counts.DPS), a: -90 }, // Top
        { label: 'ARM', val: getPct(counts.ARM), a: -18 }, // Top Right
        { label: 'EXP', val: getPct(counts.EXP), a: 54 },  // Bottom Right
        { label: 'HP', val: getPct(counts.HP), a: 126 },   // Bottom Left
        { label: 'REG', val: getPct(counts.REG), a: 198 }  // Top Left
    ];

    const radius = size * 0.30; // slightly smaller than half to fit labels
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
