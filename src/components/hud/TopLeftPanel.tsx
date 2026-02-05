
import React from 'react';
import type { GameState } from '../../logic/types';
import { getArenaIndex } from '../../logic/MapLogic';

interface TopLeftPanelProps {
    gameState: GameState;
}

const PulseLabel = ({ title, buff, color, duration }: { title: string, buff: string, color: string, duration: string }) => (
    <div style={{
        marginTop: 6, display: 'flex', alignItems: 'center', gap: 8,
        padding: '5px 12px', background: `${color}1A`,
        border: `1px solid ${color}80`,
        borderRadius: 6,
        animation: `hud-breath ${duration} infinite ease-in-out`,
        boxShadow: `0 0 15px ${color}22`,
        width: 'fit-content',
        pointerEvents: 'none',
        backdropFilter: 'blur(2px)',
        transformOrigin: 'left center'
    }}>
        <div style={{
            width: 10, height: 10, background: color, borderRadius: '50%',
            boxShadow: `0 0 10px ${color}`
        }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{
                color, fontSize: 10, fontWeight: 950, letterSpacing: 1,
                textTransform: 'uppercase', textShadow: `0 0 8px ${color}66`
            }}>{title}:</span>
            <span style={{
                color: '#fff', fontSize: 10, fontWeight: 800
            }}>{buff}</span>
        </div>
    </div>
);

export const TopLeftPanel: React.FC<TopLeftPanelProps> = ({ gameState }) => {
    const { player, score, gameTime } = gameState;

    return (
        <div style={{ position: 'absolute', top: 15, left: 15, pointerEvents: 'none', zIndex: 10 }}>
            <div className="kills" style={{ color: '#22d3ee', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)', fontSize: 24, fontWeight: 800 }}>
                {score.toString().padStart(4, '0')}
            </div>
            <div className="stat-row" style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>
                LVL {player.level}
            </div>
            <div className="stat-row" style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>
                {Math.floor(gameTime / 60)}:{Math.floor(gameTime % 60).toString().padStart(2, '0')}
            </div>

            <style>{`
                @keyframes hud-breath {
                    0% { transform: scale(1); opacity: 0.85; filter: brightness(1); }
                    50% { transform: scale(1.02); opacity: 1; filter: brightness(1.5); }
                    100% { transform: scale(1); opacity: 0.85; filter: brightness(1); }
                }
            `}</style>
            {(() => {
                const arenaIdx = getArenaIndex(player.x, player.y);

                if (arenaIdx === 0) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <PulseLabel title="Econ Hex" buff="+15% XP Gain" color="#22d3ee" duration="2.5s" />
                            <PulseLabel title="Econ Hex" buff="+15% Meteorite Chance" color="#22d3ee" duration="2.5s" />
                        </div>
                    );
                } else if (arenaIdx === 1) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <PulseLabel title="Combat Hex" buff="+15% Spawn Rate" color="#ef4444" duration="2.0s" />
                            <PulseLabel title="Combat Hex" buff="+15% Collision Dmg" color="#ef4444" duration="2.0s" />
                        </div>
                    );
                } else if (arenaIdx === 2) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <PulseLabel title="Defence Hex" buff="+20% Max HP" color="#3b82f6" duration="3.0s" />
                            <PulseLabel title="Defence Hex" buff="+20% HP Regen" color="#3b82f6" duration="3.0s" />
                        </div>
                    );
                }
                return null;
            })()}

            {/* STUN INDICATOR */}
            {player.stunnedUntil && Date.now() < player.stunnedUntil && (
                <div style={{
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: 4,
                    animation: 'pulse 0.2s infinite',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)'
                }}>
                    <div style={{
                        width: 8, height: 8, background: '#EF4444',
                        borderRadius: '50%', boxShadow: '0 0 8px #EF4444'
                    }} />
                    <span style={{ color: '#EF4444', fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>
                        ENGINE DISABLED ({Math.ceil((player.stunnedUntil - Date.now()) / 1000)}s)
                    </span>
                </div>
            )}
        </div>
    );
};
