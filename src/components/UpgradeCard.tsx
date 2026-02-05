import React, { useEffect, useState } from 'react';
import type { UpgradeChoice } from '../logic/types';
import { BASE_UPGRADE_VALUES } from '../logic/constants';
import { getIcon } from './UpgradeIcons';
import '../styles/UpgradeMenu.css';

interface UpgradeCardProps {
    choice: UpgradeChoice;
    index: number;
    isSelected: boolean;
    onSelect: (choice: UpgradeChoice) => void;
    onHover: (index: number) => void;
    isSelecting: boolean; // Kept for prop compatibility but unused for delay
}

// Updated Rarity Map per User Request
const RARITY_COLORS: Record<string, string> = {
    scrap: '#7FFF00',
    anomalous: '#00C0C0',
    quantum: '#00FFFF',
    astral: '#7B68EE',
    radiant: '#FFD700',
    abyss: '#8B0000',
    eternal: '#B8860B',
    divine: '#FFFFFF',
    singularity: '#E942FF',
};

const RARITY_ORDER = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];

export const UpgradeCard: React.FC<UpgradeCardProps> = ({ choice: c, index, isSelected, onSelect, onHover }) => {
    // Fallback to 'quantum' (common equivalent) if ID is missing or unknown
    let rId = c.rarity?.id || 'quantum';
    // Remove legacy mapping or map old IDs if necessary for safety?
    // Let's assume strict new IDs.
    if (!RARITY_COLORS[rId]) rId = 'quantum';

    let baseColor = RARITY_COLORS[rId] || '#00FFFF';

    const rawName = c.type?.name || 'UNKNOWN';
    const displayName = rawName.replace('Multiplier', 'MULTP');
    const label = c.rarity?.label || 'QUANTUM'; // Default to uppercase in case

    // Calculate filled sockets
    const rarityIndex = RARITY_ORDER.indexOf(rId);
    const filledSockets = rarityIndex === -1 ? 1 : Math.min(rarityIndex + 1, 9);
    const UNIFORM_SOCKET_COLOR = '#DC143C'; // "Ruby Red" (Crimson)

    // Value Formatter
    let valStr = '';
    if (!c.isSpecial && c.type && c.rarity) {
        const id = c.type.id || '';
        const baseVal = BASE_UPGRADE_VALUES[id] || 0;
        const mult = c.rarity.mult || 1;
        const val = Math.round(baseVal * mult);
        valStr = id.endsWith('_m') ? `+${val}%` : `+${val}`;
    }

    const handleClick = () => {
        onSelect(c);
    };

    // Sparks Effect (Only on selection, no delay but visual burst)
    const [sparks, setSparks] = useState<{ id: number, tx: string, ty: string }[]>([]);

    useEffect(() => {
        if (isSelected) {
            const newSparks = Array.from({ length: 8 }).map((_, i) => ({
                id: i,
                tx: `${(Math.random() - 0.5) * 150}px`,
                ty: `${(Math.random() - 0.5) * 150}px`
            }));
            setSparks(newSparks);

            const timer = setTimeout(() => setSparks([]), 1000);
            return () => clearTimeout(timer);
        }
    }, [isSelected]);

    return (
        <div
            className={`upgrade-card card-${rId} ${isSelected ? 'active' : 'idle'}`}
            onMouseEnter={() => onHover(index)}
            onClick={handleClick}
            style={{
                ['--card-glow' as any]: baseColor,
                borderColor: baseColor
            }}
        >
            {/* Background Effect Layer */}
            <div className="card-bg-effect" />

            {/* Sparks */}
            {sparks.map(s => (
                <div key={s.id} className="spark" style={{
                    top: '50%', left: '50%', position: 'absolute',
                    width: 4, height: 4, background: baseColor, borderRadius: '50%',
                    transform: `translate(${s.tx}, ${s.ty})`, transition: 'transform 0.5s ease-out, opacity 0.5s', opacity: 0,
                    zIndex: 30
                }} />
            ))}

            <div className="card-content-stack">
                {/* 1. Icon (Center Top) */}
                <div className="icon-badge-center" style={{
                    borderColor: 'transparent',
                    boxShadow: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: baseColor
                }}>
                    <div style={{ transform: 'scale(1.5)' }}>
                        {c.type ? getIcon(c.type.icon, baseColor) : null}
                    </div>
                </div>

                {/* 2. Title (Center) */}
                <div className="card-title-center">
                    {displayName}
                </div>

                {/* 3. Value (Center Below Title) */}
                <div className="card-value-center" style={{ color: baseColor, textShadow: `0 0 10px ${baseColor}` }}>
                    {valStr}
                </div>

                {/* Spacer - removed in favor of absolute positioning */}
                {/* <div style={{ flex: 1 }} /> */}

                {/* Footer Group (Rarity + Sockets) - Pushed to bottom */}
                <div className="card-footer-group" style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    {/* 4. Rarity Name */}
                    <div className="rarity-label-bottom" style={{ color: baseColor }}>
                        {label}
                    </div>

                    {/* 5. Crystal Bar */}
                    <div className="card-crystal-bar">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="gem-socket-diamond" style={{
                                borderColor: i < filledSockets ? UNIFORM_SOCKET_COLOR : '#333'
                            }}>
                                {i < filledSockets && (
                                    <div className="gem-filled-diamond" style={{
                                        backgroundColor: UNIFORM_SOCKET_COLOR,
                                        boxShadow: `0 0 5px ${UNIFORM_SOCKET_COLOR}`
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
