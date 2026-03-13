import React, { useState } from 'react';

interface EfficiencyLabelProps {
    value: number;
    x: number;
    y: number;
    color: string;
    onLevitateChange?: (isLevitating: boolean) => void;
}

export const EfficiencyLabel: React.FC<EfficiencyLabelProps> = ({ value, x, y, color, onLevitateChange }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (onLevitateChange) onLevitateChange(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (onLevitateChange) onLevitateChange(false);
    };

    if (value === 0 && !isHovered) return null;

    const displayValue = Math.round(value * 100);
    const label = displayValue > 0 ? `+${displayValue}%` : displayValue < 0 ? `${displayValue}%` : "0%";

    return (
        <g
            transform={`translate(${x}, ${y})`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'help', pointerEvents: 'auto' }}
        >
            <rect
                x="-30" y="-10" width="60" height="20" rx="4"
                fill="rgba(15, 23, 42, 0.9)"
                stroke={color}
                strokeWidth="1.5"
                style={{ filter: isHovered ? `drop-shadow(0 0 10px ${color})` : 'none' }}
            />
            <text
                x="0" y="4"
                textAnchor="middle"
                fill={color}
                fontSize="10"
                fontWeight="900"
                style={{ letterSpacing: '0.5px' }}
            >
                {label}
            </text>

            {isHovered && (
                <g transform="translate(0, 30)">
                    <rect
                        x="-70" y="0" width="140" height="40" rx="6"
                        fill="rgba(2, 6, 23, 0.95)"
                        stroke={color}
                        strokeWidth="1"
                    />
                    <text x="0" y="15" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="700">EFFICIENCY PROTOCOL</text>
                    <text x="0" y="30" textAnchor="middle" fill={color} fontSize="9" fontWeight="900">
                        {value > 0 ? "OUTPUT BOOSTED" : value < 0 ? "OUTPUT DIMINISHED" : "NOMINAL OUTPUT"}
                    </text>
                </g>
            )}
        </g>
    );
};
