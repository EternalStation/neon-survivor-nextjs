
import React from 'react';
import type { GameState } from '../../logic/core/types';
import { getArenaIndex } from '../../logic/mission/MapLogic';

interface TopLeftPanelProps {
    gameState: GameState;
}

const PulseLabel = ({ title, buff, color }: { title: string, buff: string, color: string }) => {
    // Generate a static delay based on mount time relative to a 3s cycle to sync all instances
    const [delay] = React.useState(() => -(Date.now() % 3000));

    return (
        <div style={{
            marginTop: 6, display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 12px', background: `${color}1A`,
            border: `1px solid ${color}80`,
            borderRadius: 6,
            animation: `hud-breath 3s infinite ease-in-out`,
            animationDelay: `${delay}ms`,
            boxShadow: `0 0 15px ${color}22`,
            width: 'fit-content',
            pointerEvents: 'none',
            backdropFilter: 'blur(2px)',
            transformOrigin: 'left center',
            transform: 'scale(0.9)'
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
};

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
                    0% { transform: scale(0.9); opacity: 0.85; filter: brightness(1); }
                    50% { transform: scale(0.92); opacity: 1; filter: brightness(1.5); }
                    100% { transform: scale(0.9); opacity: 0.85; filter: brightness(1); }
                }
                @keyframes spin {
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {/* Note: PulseLabel uses transform: scale(0.9) in style. 
                The keyframe override above needs to respect that base scale.
                Actually, the inline style transform is applied to the element.
                The animation modifying transform will OVERRIDE propertty.
                So defining scale(0.9) in keyframe is correct. 
                Wait, keyframes override inline styles if the property is animated.
                So simply putting 'scale(0.9)' in inline style might be ignored if animation is running.
                I have updated the keyframe above to oscillate around 0.9.
            */}

            {/* BUFFERED RENDERING LOGIC */}
            {(() => {
                const arenaIdx = getArenaIndex(player.x, player.y);
                const surgeMult = gameState.activeBlueprintBuffs['ARENA_SURGE'] ? 2.0 : 1.0;

                type BuffItem = { id: string, title: string, buff: string, color: string, remaining: number, priority: number };
                const buffs: BuffItem[] = [];

                // 0. EXTRACTION BUFF (Priority 3 - ABSOLUTE TOP)
                if (['requested', 'waiting', 'active', 'arriving', 'arrived'].includes(gameState.extractionStatus)) {
                    const pct = Math.round((gameState.extractionPowerMult || 1.0) * 100 - 100);
                    buffs.push({
                        id: 'extraction_rage',
                        title: 'EVACUATION RAGE',
                        buff: `HOSTILES: +${pct}% HP/QTY`,
                        color: '#f87171',
                        remaining: 100000,
                        priority: 3
                    });
                }

                // 1. ARENA BUFFS (Priority 2 - TOP)
                // Duration is effectively infinite for sorting purposes relative to decaying buffs
                if (arenaIdx === 0 && (gameState.arenaLevels[0] || 0) >= 1) {
                    buffs.push({ id: 'eco1', title: 'Econ Sector', buff: `+${30 * surgeMult}% XP & Soul Yield`, color: '#22d3ee', remaining: 99999, priority: 2 });
                    buffs.push({ id: 'eco2', title: 'Econ Sector', buff: `+${30 * surgeMult}% Meteorite rate`, color: '#22d3ee', remaining: 99999, priority: 2 });
                } else if (arenaIdx === 1 && (gameState.arenaLevels[1] || 0) >= 1) {
                    buffs.push({ id: 'com1', title: 'Combat Sector', buff: `+${30 * surgeMult}% DMG & Atk Spd`, color: '#ef4444', remaining: 99999, priority: 2 });
                } else if (arenaIdx === 2 && (gameState.arenaLevels[2] || 0) >= 1) {
                    buffs.push({ id: 'def1', title: 'Defence Sector', buff: `+${30 * surgeMult}% Max HP & Regen`, color: '#3b82f6', remaining: 99999, priority: 2 });
                }

                // 2. BLUEPRINT BUFFS (Priority 1 - Sorted by Duration)
                const addBp = (type: import('../../logic/core/types').BlueprintType, serial: string, text: string, color: string) => {
                    const endTime = gameState.activeBlueprintBuffs[type];
                    if (endTime) {
                        const timeLeft = Math.max(0, Math.floor(endTime - gameTime));
                        buffs.push({
                            id: type,
                            title: `${serial} (${timeLeft}s)`,
                            buff: text,
                            color,
                            remaining: timeLeft,
                            priority: 1
                        });
                    }
                };

                addBp('METEOR_SHOWER', 'ORB-01', 'Meteorite drop increased by 50%', '#f59e0b');
                addBp('STASIS_FIELD', 'STA-X2', '-20% Enemy Speed', '#8b5cf6');
                addBp('ARENA_SURGE', 'SURG-0', 'Arena modifiers increased by 100%', '#22d3ee');
                addBp('PERK_RESONANCE', 'HARM-V', '+2% for each perk on found meteorites', '#a855f7');
                addBp('NEURAL_OVERCLOCK', 'NEU-77', 'Cooldown reduced by 30%', '#ec4899');
                addBp('TEMPORAL_GUARD', 'GUAR-D', 'Block lethal hit', '#10b981');
                addBp('MATRIX_OVERDRIVE', 'MATR-X', 'Socketed meteorites efficiency +15%', '#f97316');

                // QUANTUM SCRAPPER (Charge Based) - Treat as high priority/duration within blueprints
                if (gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] !== undefined) {
                    buffs.push({
                        id: 'QUANTUM_SCRAPPER',
                        title: `SCRP-Q (${gameState.activeBlueprintCharges['QUANTUM_SCRAPPER']} Uses)`,
                        buff: '25% chance to double dust on recycle',
                        color: '#facc15',
                        remaining: 88888, // Sorts above time-based blueprints
                        priority: 1
                    });
                }

                // SORTING LOGIC
                // 1. Priority Descending (Arena > Blueprints)
                // 2. Remaining Time Descending
                buffs.sort((a, b) => {
                    if (a.priority !== b.priority) return b.priority - a.priority;
                    return b.remaining - a.remaining;
                });

                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {buffs.map((b, i) => (
                            <PulseLabel key={b.id + i} title={b.title} buff={b.buff} color={b.color} />
                        ))}
                    </div>
                );
            })()}

            {/* RESEARCH PROGRESS INDICATORS */}
            {gameState.blueprints.map((bp, i) => {
                if (bp && bp.status === 'researching' && bp.researchFinishTime) {
                    const timeLeft = Math.max(0, ((bp.researchFinishTime - Date.now()) / 1000)).toFixed(1);
                    return (
                        <div key={`research-${i}`} style={{
                            marginTop: 6, display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 12px', background: 'rgba(251, 191, 36, 0.1)', // Amber background
                            border: '1px solid rgba(251, 191, 36, 0.5)',
                            borderRadius: 6,
                            boxShadow: '0 0 10px rgba(251, 191, 36, 0.15)',
                            width: 'fit-content',
                            pointerEvents: 'none',
                            backdropFilter: 'blur(2px)',
                            transform: 'scale(0.9)',
                            transformOrigin: 'left center'
                        }}>
                            {/* Animated Scanner Icon or Dot */}
                            <div style={{
                                width: 10, height: 10, border: '2px solid #fbbf24', borderRadius: '50%',
                                borderTopColor: 'transparent',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{
                                    color: '#fbbf24', fontSize: 10, fontWeight: 950, letterSpacing: 1,
                                    textTransform: 'uppercase', textShadow: '0 0 8px rgba(251, 191, 36, 0.5)'
                                }}>DECRYPTION RUNNING:</span>
                                <span style={{
                                    color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' // Monospace for timer stability
                                }}>{timeLeft}s</span>
                            </div>
                        </div>
                    );
                }
                return null;
            })}

            {/* STUN INDICATOR (Keep Separate/Bottom) */}
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
