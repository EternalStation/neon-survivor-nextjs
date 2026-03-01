
import React, { useState, useEffect } from 'react';
import type { GameState } from '../../logic/core/types';
import { CANVAS_WIDTH } from '../../logic/core/constants';
import { getHexMultiplier, getHexLevel } from '../../logic/upgrades/LegendaryLogic';
import { PLAYER_CLASSES } from '../../logic/core/classes';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';
import { calcStat } from '../../logic/utils/MathUtils';
import { formatLargeNumber } from '../../utils/format';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';


interface PlayerStatusProps {
    gameState: GameState;
    maxHp: number;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ gameState, maxHp }) => {
    const { player } = gameState;
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

    // Track previous HP for damage animation
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
                            {t.channeling}
                        </div>
                    </div>
                );
            })()}

            <div style={{ display: 'flex', gap: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
                {/* DASH INDICATOR */}
                {(() => {
                    const dashCd = player.dashCooldown ?? 0;
                    const dashCdMax = player.dashCooldownMax || 4.0;
                    const isDashing = player.dashUntil && player.dashUntil > gameState.gameTime;
                    const isReady = dashCd <= 0;
                    const cdPct = isReady ? 0 : dashCd / dashCdMax;

                    return (
                        <div style={{ position: 'relative', width: 42, height: 48 }}>
                            <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: isDashing ? '#0ea5e9' : isReady ? '#22d3ee' : '#475569',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: isReady ? '0 0 12px #22d3ee' : 'none',
                                transition: 'all 0.2s'
                            }}>
                                <div style={{
                                    width: 'calc(100% - 4px)', height: 'calc(100% - 4px)',
                                    backgroundColor: '#0f172a',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: 16, filter: isReady ? 'drop-shadow(0 0 5px #22d3ee)' : 'none' }}>
                                        ⚡
                                    </div>
                                    {cdPct > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                                            height: `${cdPct * 100}%`,
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            transition: 'height 0.1s linear'
                                        }} />
                                    )}
                                    {cdPct > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            color: '#fff', fontSize: 11, fontWeight: 900, textShadow: '0 0 2px #000', zIndex: 1
                                        }}>
                                            {Math.ceil(dashCd)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{
                                position: 'absolute', top: -4, right: -4,
                                background: '#0f172a', border: '1px solid #475569',
                                color: '#94a3b8', fontSize: 8, fontWeight: 900,
                                padding: '1px 3px', borderRadius: 3,
                                boxShadow: '0 0 4px #000', zIndex: 10,
                                whiteSpace: 'nowrap'
                            }}>
                                SPC
                            </div>
                        </div>
                    );
                })()}
                {/* CLASS CAPABILITY (Skill 0) - Automatic */}
                {(() => {
                    const pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
                    if (!pClass) return null;

                    const cdMod = isBuffActive(gameState, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0;

                    let cdPct = 0; // 0 = Ready, 1 = Max Cooldown
                    let remainingDisplay = '';
                    let isReady = false;
                    let show = false;

                    const nowMs = Date.now();
                    const nowSec = gameState.gameTime;

                    // Logic for specific classes
                    if (player.playerClass === 'stormstrike') {
                        show = true;
                        const maxCd = 8000 * cdMod; // Apply reduction
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
                        if (player.voidMarkerActive) {
                            cdPct = 0;
                            isReady = true;
                        } else {
                            const nextReady = player.blackholeCooldown || 0;
                            if (nowSec >= nextReady) {
                                cdPct = 0;
                                isReady = true;
                            } else {
                                const remaining = nextReady - nowSec;
                                const maxCd = 10 * cdMod;
                                cdPct = Math.min(1, remaining / maxCd);
                                remainingDisplay = remaining.toFixed(1);
                            }
                        }
                    }

                    if (!show) return null;

                    const themeColor = pClass.themeColor || '#fff';
                    const iconUrl = pClass.iconUrl || '';

                    const markerFlying = player.playerClass === 'eventhorizon' && !!player.voidMarkerActive;

                    return (
                        <div style={{ position: 'relative', width: 42, height: 48 }}>
                            {/* Hexagon Border Container */}
                            <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: markerFlying ? '#a855f7' : isReady ? themeColor : '#475569',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: markerFlying ? '0 0 15px #a855f7' : isReady ? `0 0 15px ${themeColor}` : 'none',
                                transition: 'background-color 0.1s'
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

                            {player.playerClass === 'eventhorizon' && (
                                <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    background: '#0f172a', border: '1px solid #475569',
                                    color: '#94a3b8', fontSize: 8, fontWeight: 900,
                                    padding: '1px 3px', borderRadius: 3,
                                    boxShadow: '0 0 4px #000', zIndex: 10,
                                    whiteSpace: 'nowrap'
                                }}>
                                    E
                                </div>
                            )}

                            {/* CD Reduced Icon */}
                            {cdMod < 1.0 && (
                                <div style={{
                                    position: 'absolute', top: -5, left: -5,
                                    width: 14, height: 14,
                                    background: '#22d3ee',
                                    borderRadius: '50%',
                                    border: '1px solid #fff',
                                    boxShadow: '0 0 5px #22d3ee',
                                    zIndex: 20,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }} title={t.neuralOverclockActive}>
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ACTIVE SKILLS - Manual */}
                {player.activeSkills && player.activeSkills.map((skill, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 42, height: 48 }}>
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
                                        {t.skill}
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

                        {/* CD Reduced Icon */}
                        {isBuffActive(gameState, 'NEURAL_OVERCLOCK') && (
                            <div style={{
                                position: 'absolute', top: -4, left: -4,
                                width: 14, height: 14,
                                background: '#22d3ee',
                                borderRadius: '50%',
                                border: '1px solid #fff',
                                boxShadow: '0 0 5px #22d3ee',
                                zIndex: 20,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }} title={t.neuralOverclockActive}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}

                {(() => {
                    const kinLvl = getHexLevel(gameState, 'KineticBattery');
                    if (kinLvl <= 0) return null;

                    const cdMod = (isBuffActive(gameState, 'NEURAL_OVERCLOCK') ? 0.7 : 1.0) * (1 - (player.cooldownReduction || 0));
                    const boltCDMax = 5.0 * cdMod;
                    const boltElapsed = gameState.gameTime - (player.lastKineticShockwave || 0);
                    const boltCD = Math.max(0, boltCDMax - boltElapsed);
                    const boltPct = (boltCD / boltCDMax);

                    const shieldTimeLeft = Math.max(0, (player.kineticShieldTimer || 0) - gameState.gameTime);
                    const shieldPct = shieldTimeLeft / 60;

                    return (
                        <div style={{ display: 'flex', gap: 8 }}>
                            {/* BOLT TIMER */}
                            <div style={{ position: 'relative', width: 38, height: 44 }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    backgroundColor: boltCD <= 0 ? '#3b82f6' : '#475569',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: boltCD <= 0 ? '0 0 10px #3b82f6' : 'none'
                                }}>
                                    <div style={{
                                        width: 'calc(100% - 3px)', height: 'calc(100% - 3px)',
                                        backgroundColor: '#0f172a',
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        position: 'relative'
                                    }}>
                                        <img src="/assets/hexes/DefBattery.png" alt="Kinetic Bolt" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />

                                        {/* Cooldown Overlay */}
                                        {boltCD > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, width: '100%',
                                                height: `${boltPct * 100}%`,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                            }} />
                                        )}

                                        {/* Lightning Icon Overlay */}
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16, filter: 'drop-shadow(0 0 5px #3b82f6)' }}>
                                            ⚡
                                        </div>

                                        {boltCD > 0 && (
                                            <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>
                                                {boltCD.toFixed(1)}s
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SHIELD TIMER (Lvl 2+) */}
                            {kinLvl >= 2 && (
                                <div style={{ position: 'relative', width: 38, height: 44 }}>
                                    <div style={{
                                        width: '100%', height: '100%',
                                        backgroundColor: shieldTimeLeft <= 0 ? '#60a5fa' : '#475569',
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: shieldTimeLeft <= 0 ? '0 0 10px #60a5fa' : 'none'
                                    }}>
                                        <div style={{
                                            width: 'calc(100% - 3px)', height: 'calc(100% - 3px)',
                                            backgroundColor: '#0f172a',
                                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                            position: 'relative'
                                        }}>
                                            <img src="/assets/hexes/DefBattery.png" alt="Kinetic Shield" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />

                                            {/* Cooldown Overlay */}
                                            {shieldTimeLeft > 0 && (
                                                <div style={{
                                                    position: 'absolute', bottom: 0, left: 0, width: '100%',
                                                    height: `${shieldPct * 100}%`,
                                                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                                }} />
                                            )}

                                            {/* Shield Icon Overlay */}
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16, filter: 'drop-shadow(0 0 5px #60a5fa)' }}>
                                                🛡️
                                            </div>

                                            {shieldTimeLeft > 0 && (
                                                <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>
                                                    {Math.ceil(shieldTimeLeft)}s
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                    {formatLargeNumber(Math.ceil(player.curHp))} / {formatLargeNumber(Math.ceil(maxHp))}
                </div>
            </div>

            {/* Shield Bar (Blue) */}
            {(() => {
                const totalShield = (player.shieldChunks || []).reduce((sum, c) => sum + c.amount, 0);
                if (totalShield <= 0) return null;

                const lifeLvl = getHexLevel(gameState, 'ComLife');
                const kinLvl = getHexLevel(gameState, 'KineticBattery');

                let lifeCapacity = 0;
                if (lifeLvl >= 2) {
                    lifeCapacity = maxHp * getHexMultiplier(gameState, 'ComLife');
                }

                let kinCapacity = 0;
                if (kinLvl >= 2) {
                    kinCapacity = calcStat(player.arm) * 5;
                }

                const dynamicMaxShield = Math.max(lifeCapacity + kinCapacity, totalShield); // Include overheal shields
                const shieldPct = (totalShield / dynamicMaxShield) * 100;
                return (
                    <div style={{
                        width: '100%', height: 10, background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 2, overflow: 'hidden',
                        position: 'relative', marginTop: -4
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
                            {formatLargeNumber(Math.ceil(totalShield))} / {formatLargeNumber(Math.ceil(dynamicMaxShield))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
