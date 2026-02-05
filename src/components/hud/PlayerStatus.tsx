
import React, { useState, useEffect } from 'react';
import type { GameState } from '../../logic/types';
import { CANVAS_WIDTH } from '../../logic/constants';
import { getHexMultiplier, getHexLevel } from '../../logic/LegendaryLogic';
import { PLAYER_CLASSES } from '../../logic/classes';

interface PlayerStatusProps {
    gameState: GameState;
    maxHp: number;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ gameState, maxHp }) => {
    const { player } = gameState;
    const [prevHp, setPrevHp] = useState(player.curHp);

    // HP Bar Animation Control
    const currentHpPercent = (player.curHp / maxHp) * 100;
    const prevHpPercent = (prevHp / maxHp) * 100;
    const isHealing = currentHpPercent > prevHpPercent;

    useEffect(() => {
        setPrevHp(player.curHp);
    }, [player.curHp]);

    return (
        <div style={{
            position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
            width: Math.min(CANVAS_WIDTH * 0.8, 300), display: 'flex', flexDirection: 'column', gap: 6, zIndex: 100,
            alignItems: 'center'
        }}>
            {/* CHANNELING BAR (Epicenter) */}
            {(() => {
                const epi = gameState?.areaEffects?.find(ae => ae.type === 'epicenter');
                if (!epi || epi.duration === undefined) return null;
                const pct = Math.max(0, Math.min(100, (epi.duration / 10) * 100));
                return (
                    <div style={{
                        width: '100%', height: 8, background: 'rgba(0,0,0,0.5)',
                        border: '1px solid #22d3ee', borderRadius: 4, marginBottom: 4,
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${pct}%`, height: '100%',
                            background: 'linear-gradient(90deg, #0ea5e9, #22d3ee)',
                            transition: 'width 0.1s linear'
                        }} />
                        <div style={{
                            position: 'absolute', top: 0, width: '100%', textAlign: 'center',
                            fontSize: 6, fontWeight: 900, color: '#fff', letterSpacing: 1,
                            textShadow: '0 0 2px #000', lineHeight: '8px'
                        }}>
                            CHANNELING
                        </div>
                    </div>
                );
            })()}

            <div style={{ display: 'flex', gap: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
                {/* CLASS CAPABILITY (Skill 0) - Automatic */}
                {(() => {
                    const pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
                    if (!pClass) return null;

                    let cdPct = 0; // 0 = Ready, 1 = Max Cooldown
                    let remainingDisplay = '';
                    let isReady = false;
                    let show = false;

                    const nowMs = Date.now();
                    const nowSec = gameState.gameTime;

                    // Logic for specific classes
                    if (player.playerClass === 'stormstrike') {
                        show = true;
                        const maxCd = 8000;
                        const last = player.lastCosmicStrikeTime || 0;
                        const diff = nowMs - last;
                        if (diff >= maxCd) {
                            cdPct = 0; // Ready
                            isReady = true;
                        } else {
                            const remaining = maxCd - diff;
                            cdPct = remaining / maxCd;
                            remainingDisplay = (remaining / 1000).toFixed(1);
                        }
                    } else if (player.playerClass === 'eventhorizon') {
                        show = true;
                        // blackholeCooldown is a timestamp in SECONDS
                        const nextReady = player.blackholeCooldown || 0;
                        if (nowSec >= nextReady) {
                            cdPct = 0;
                            isReady = true;
                        } else {
                            const remaining = nextReady - nowSec;
                            const maxCd = 10; // 10s static
                            cdPct = Math.min(1, remaining / maxCd);
                            remainingDisplay = remaining.toFixed(1);
                        }
                    }

                    if (!show) return null;

                    const themeColor = pClass.themeColor || '#fff';
                    const iconUrl = pClass.iconUrl || '';

                    return (
                        <div style={{ position: 'relative', width: 48, height: 48 }}>
                            {/* Hexagon Border Container */}
                            <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: isReady ? themeColor : '#475569',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: isReady ? `0 0 15px ${themeColor}` : 'none',
                                transition: 'background-color 0.2s'
                            }}>
                                {/* Inner Content */}
                                <div style={{
                                    width: 'calc(100% - 4px)', height: 'calc(100% - 4px)',
                                    backgroundColor: '#0f172a',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    position: 'relative'
                                }}>
                                    {/* Icon */}
                                    {iconUrl && <img src={iconUrl} alt="Class Skill" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isReady ? 1 : 0.6 }} />}

                                    {/* Cooldown Overlay */}
                                    {cdPct > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                                            height: `${cdPct * 100}%`,
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            transition: 'height 0.1s linear'
                                        }} />
                                    )}

                                    {/* Cooldown Text */}
                                    {cdPct > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 0 2px #000'
                                        }}>
                                            {remainingDisplay}
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    );
                })()}

                {/* ACTIVE SKILLS - Manual */}
                {player.activeSkills && player.activeSkills.map((skill, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 48, height: 48 }}>
                        {/* Hexagon Border Container */}
                        <div style={{
                            width: '100%', height: '100%',
                            backgroundColor: skill.inUse ? '#22d3ee' : '#475569',
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: skill.inUse ? '0 0 10px #22d3ee' : 'none',
                            transition: 'all 0.2s'
                        }}>
                            {/* Inner Content */}
                            <div style={{
                                width: 'calc(100% - 4px)', height: 'calc(100% - 4px)',
                                backgroundColor: '#0f172a',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                position: 'relative'
                            }}>
                                {/* Icon (Placeholder or Actual) */}
                                {skill.icon ? (
                                    <img src={skill.icon} alt={skill.type} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: skill.cooldown > 0 ? 0.5 : 1 }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 10 }}>
                                        SKILL
                                    </div>
                                )}

                                {/* Cooldown Overlay */}
                                {skill.cooldown > 0 && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                                        height: `${(skill.cooldown / skill.cooldownMax) * 100}%`,
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        transition: 'height 0.1s linear'
                                    }} />
                                )}
                                {skill.cooldown > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 0 2px #000'
                                    }}>
                                        {Math.ceil(skill.cooldown)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Keybind Badge */}
                        <div style={{
                            position: 'absolute', top: -4, right: -4,
                            background: '#0f172a', border: '1px solid #475569',
                            color: '#fff', fontSize: 10, fontWeight: 900,
                            width: 16, height: 16, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 4px #000', zIndex: 10
                        }}>
                            {skill.keyBind}
                        </div>
                    </div>
                ))}

                {/* PASSIVE SKILLS (Example: Sonic Wave Counter) */}
                {(() => {
                    const waveLevel = getHexLevel(gameState, 'ComWave');
                    if (waveLevel <= 0) return null;

                    const shots = player.shotsFired || 0;
                    const required = 15;
                    const progress = (shots % required);
                    const remaining = required - progress;

                    return (
                        <div style={{ position: 'relative', width: 48, height: 48 }}>
                            <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: 'rgba(56, 189, 248, 0.5)',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    width: 'calc(100% - 4px)', height: 'calc(100% - 4px)',
                                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    position: 'relative'
                                }}>
                                    <img src="/assets/hexes/ComWave.png" alt="Sonic Wave" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                                    {/* Progress Overlay */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                                        height: `${(progress / required) * 100}%`,
                                        background: 'rgba(56, 189, 248, 0.3)',
                                        transition: 'height 0.1s'
                                    }} />

                                    <div style={{
                                        position: 'absolute', bottom: 2, right: 14,
                                        color: '#38BDF8', fontSize: 10, fontWeight: 900,
                                        textShadow: '0 0 4px #000'
                                    }}>
                                        {remaining}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div style={{
                width: '100%', height: 16, background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid #334155', borderRadius: 4, overflow: 'hidden', position: 'relative'
            }}>
                <div style={{
                    width: `${(player.curHp / maxHp) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #ef4444, #f87171)',
                    transition: isHealing ? 'width 0.3s' : 'width 0s'
                }} />
                <div style={{
                    position: 'absolute', width: '100%', textAlign: 'center', top: 0,
                    fontSize: 9, fontWeight: 900, lineHeight: '16px', color: '#fff'
                }}>
                    {Math.ceil(player.curHp)} / {Math.ceil(maxHp)}
                </div>
            </div>

            {/* Shield Bar (Blue) */}
            {(() => {
                const totalShield = (player.shieldChunks || []).reduce((sum, c) => sum + c.amount, 0);
                if (totalShield <= 0) return null;
                const effMult = getHexMultiplier(gameState, 'ComLife');
                const dynamicMaxShield = maxHp * effMult;
                const shieldPct = (totalShield / dynamicMaxShield) * 100;
                return (
                    <div style={{
                        width: '100%', height: 10, background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 2, overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: `${Math.min(100, shieldPct)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
                            transition: 'width 0.3s ease-out'
                        }} />
                        <div style={{
                            position: 'absolute', width: '100%', textAlign: 'center', top: 0,
                            fontSize: 7, fontWeight: 900, lineHeight: '10px', color: '#fff',
                            textShadow: '0 0 2px #000'
                        }}>
                            {Math.ceil(totalShield)} / {Math.ceil(dynamicMaxShield)}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
