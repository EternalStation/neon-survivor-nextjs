
import React, { useState, useEffect } from 'react';
import type { GameState } from '../../logic/core/types';
import { CANVAS_WIDTH } from '../../logic/core/constants';
import { getHexMultiplier, getHexLevel } from '../../logic/upgrades/LegendaryLogic';
import { PLAYER_CLASSES } from '../../logic/core/classes';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';
import { calcStat } from '../../logic/utils/MathUtils';
import { formatLargeNumber } from '../../utils/format';
import { getCdMod, getRemainingCD, getCDProgress, isOnCooldown } from '../../logic/utils/CooldownUtils';
import { GAME_CONFIG } from '../../logic/core/GameConfig';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';
import { getKeybinds, getKeyDisplay } from '../../logic/utils/Keybinds';


interface PlayerStatusProps {
    gameState: GameState;
    maxHp: number;
}

export const PlayerStatus: React.FC<PlayerStatusProps> = ({ gameState, maxHp }) => {
    const { player } = gameState;
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;
    const [keybinds, setKeybinds] = useState(getKeybinds());

    useEffect(() => {
        const h = () => setKeybinds(getKeybinds());
        window.addEventListener('keybindsChanged', h);
        return () => window.removeEventListener('keybindsChanged', h);
    }, []);

    const [prevHp, setPrevHp] = useState(player.curHp);

    const currentHpPercent = (player.curHp / maxHp) * 100;
    const prevHpPercent = (prevHp / maxHp) * 100;
    const isHealing = currentHpPercent > prevHpPercent;

    useEffect(() => {
        setPrevHp(player.curHp);
    }, [player.curHp]);

    return (
        <div style={{
            position: 'absolute', bottom: 50, left: '50%', transform: 'translateX(-50%)',
            width: Math.min(CANVAS_WIDTH * 0.8, 300), display: 'flex', flexDirection: 'column', gap: 6, zIndex: 100,
            alignItems: 'center'
        }}>

            <div style={{ display: 'flex', gap: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' }}>
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
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: isReady ? 'rgba(34, 211, 238, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                position: 'relative'
                            }}>
                                <div className="dash-icon-container" style={{
                                    display: 'flex',
                                    color: isReady ? '#22d3ee' : '#475569',
                                    fontSize: 14,
                                    fontWeight: 900,
                                    filter: isReady ? 'drop-shadow(0 0 5px #22d3ee)' : 'none'
                                }}>
                                    <span style={{ animation: isReady ? 'dash-pulse 0.6s infinite linear' : 'none' }}>»</span>
                                    <span style={{ animation: isReady ? 'dash-pulse 0.6s infinite linear 0.1s' : 'none' }}>»</span>
                                    <span style={{ animation: isReady ? 'dash-pulse 0.6s infinite linear 0.2s' : 'none' }}>»</span>
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
                            <style>{`
                                @keyframes dash-pulse {
                                    0% { opacity: 0.3; transform: translateX(-2px); }
                                    50% { opacity: 1; transform: translateX(0px); }
                                    100% { opacity: 0.3; transform: translateX(2px); }
                                }
                            `}</style>
                            <div style={{
                                position: 'absolute', top: -4, right: -4,
                                background: '#0f172a', border: '1px solid #475569',
                                color: '#94a3b8', fontSize: 8, fontWeight: 900,
                                padding: '1px 3px', borderRadius: 3,
                                boxShadow: '0 0 4px #000', zIndex: 10,
                                whiteSpace: 'nowrap'
                            }}>
                                {getKeyDisplay(keybinds.dash)}
                            </div>
                        </div>
                    );
                })()}

                {(() => {
                    const pClass = PLAYER_CLASSES.find(c => c.id === player.playerClass);
                    if (!pClass) return null;

                    const cdMod = getCdMod(gameState, player);
                    const now = gameState.gameTime;

                    let cdPct = 0;
                    let remainingDisplay = '';
                    let isReady = false;
                    let show = false;
                    let isStormCooldown = false;
                    let stormChargePct = 0;

                    if (player.playerClass === 'stormstrike') {
                        show = true;
                        const maxCharge = GAME_CONFIG.SKILLS.STORM_CIRCLE_MAX_CHARGE;
                        const cooldownEnd = player.stormCircleCooldownEnd ?? 0;
                        const ct = player.stormCircleChargeTime ?? 0;
                        const onCooldown = now < cooldownEnd;
                        isStormCooldown = onCooldown;

                        if (onCooldown) {
                            const remaining = cooldownEnd - now;
                            cdPct = remaining / GAME_CONFIG.SKILLS.STORM_CIRCLE_RECHARGE_DELAY;
                            remainingDisplay = remaining.toFixed(1);
                            isReady = false;
                        } else {
                            stormChargePct = Math.sqrt(ct / maxCharge);
                            cdPct = 1 - stormChargePct;
                            isReady = ct >= maxCharge;
                        }
                    } else if (player.playerClass === 'eventhorizon') {
                        show = true;
                        if (player.voidMarkerActive) {
                            cdPct = 0;
                            isReady = true;
                        } else {
                            const remaining = getRemainingCD(player.lastBlackholeUse ?? -999999, GAME_CONFIG.SKILLS.BLACKHOLE_COOLDOWN, cdMod, now);
                            cdPct = getCDProgress(player.lastBlackholeUse ?? -999999, GAME_CONFIG.SKILLS.BLACKHOLE_COOLDOWN, cdMod, now);
                            isReady = remaining <= 0;
                            if (!isReady) remainingDisplay = remaining.toFixed(1);
                        }
                    } else if (player.playerClass === 'hivemother') {
                        show = true;
                        const remaining = getRemainingCD(player.lastHiveMotherSkill ?? -999999, 14, cdMod, now);
                        cdPct = getCDProgress(player.lastHiveMotherSkill ?? -999999, 14, cdMod, now);
                        isReady = remaining <= 0;
                        if (!isReady) remainingDisplay = remaining.toFixed(1);
                    } else if (player.playerClass === 'aigis') {
                        show = true;
                        const lastUsed = player.lastVortexActivation ?? -999999;
                        const cooldownEnd = player.orbitalVortexCooldownEnd ?? 0;
                        const isDelaying = now < cooldownEnd;

                        if (isDelaying) {
                            const remainingDelay = cooldownEnd - now;
                            cdPct = remainingDelay / (GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RECHARGE_DELAY || 3);
                            isReady = false;
                            isStormCooldown = true;
                            remainingDisplay = remainingDelay.toFixed(1);
                        } else {
                            const remaining = getRemainingCD(lastUsed, GAME_CONFIG.SKILLS.ORBITAL_VORTEX_COOLDOWN, cdMod, now);
                            cdPct = getCDProgress(lastUsed, GAME_CONFIG.SKILLS.ORBITAL_VORTEX_COOLDOWN, cdMod, now);
                            isReady = remaining <= 0;
                            if (!isReady) remainingDisplay = remaining.toFixed(1);
                        }
                    } else if (player.playerClass === 'malware') {
                        show = true;
                        const remaining = getRemainingCD(player.sandboxCooldownStart ?? -999999, GAME_CONFIG.SKILLS.SANDBOX_COOLDOWN, cdMod, now);
                        cdPct = getCDProgress(player.sandboxCooldownStart ?? -999999, GAME_CONFIG.SKILLS.SANDBOX_COOLDOWN, cdMod, now);
                        isReady = remaining <= 0;
                        if (!isReady) remainingDisplay = remaining.toFixed(1);
                    }

                    if (!show) return null;

                    const themeColor = pClass.themeColor || '#fff';
                    const iconUrl = pClass.iconUrl || '';
                    const markerFlying = player.playerClass === 'eventhorizon' && !!player.voidMarkerActive;

                    return (
                        <div style={{ position: 'relative', width: 42, height: 48 }}>
                            <div style={{
                                width: '100%', height: '100%',
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {iconUrl && <img src={iconUrl} alt="Class Skill" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isReady ? 1 : 0.4 }} />}

                                {(player.playerClass === 'stormstrike' || player.playerClass === 'aigis') ? (
                                    <>
                                        {isStormCooldown && cdPct > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, width: '100%',
                                                height: `${cdPct * 100}%`,
                                                backgroundColor: 'rgba(120, 120, 120, 0.85)',
                                                transition: 'height 0.1s linear'
                                            }} />
                                        )}
                                        {!isStormCooldown && cdPct > 0 && (
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, width: '100%',
                                                height: `${cdPct * 100}%`,
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                transition: 'height 0.1s linear'
                                            }} />
                                        )}
                                        {!isStormCooldown && stormChargePct > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, width: '100%',
                                                height: `${stormChargePct * 100}%`,
                                                backgroundColor: 'rgba(234, 179, 8, 0.4)',
                                                transition: 'height 0.1s linear'
                                            }} />
                                        )}
                                    </>
                                ) : (
                                    cdPct > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                                            height: `${cdPct * 100}%`,
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            transition: 'height 0.1s linear'
                                        }} />
                                    )
                                )}

                                {cdPct > 0 && remainingDisplay && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 0 2px #000'
                                    }}>
                                        {remainingDisplay}
                                    </div>
                                )}
                            </div>

                            {(player.playerClass === 'eventhorizon' || player.playerClass === 'stormstrike' || player.playerClass === 'hivemother' || player.playerClass === 'aigis' || player.playerClass === 'malware') && (
                                <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    background: '#0f172a', border: '1px solid #475569',
                                    color: '#94a3b8', fontSize: 8, fontWeight: 900,
                                    padding: '1px 3px', borderRadius: 3,
                                    boxShadow: '0 0 4px #000', zIndex: 10,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {getKeyDisplay(keybinds.classAbility)}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {player.activeSkills && player.activeSkills.map((skill, idx) => (
                    <div key={idx} style={{ position: 'relative', width: 42, height: 48 }}>
                        <div style={{
                            width: '100%', height: '100%',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {(() => {
                                const skillCdMod = getCdMod(gameState, player);
                                const skillNow = gameState.gameTime;
                                const skillProgress = getCDProgress(skill.lastUsed, skill.baseCD, skillCdMod, skillNow);
                                const skillRemaining = getRemainingCD(skill.lastUsed, skill.baseCD, skillCdMod, skillNow);
                                const onCd = skillProgress > 0;
                                return (<>
                                    {skill.icon ? (
                                        <img src={skill.icon} alt={skill.type} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: onCd ? 0.3 : 1 }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 10 }}>
                                            {t.skill}
                                        </div>
                                    )}
                                    {onCd && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                                            height: `${skillProgress * 100}%`,
                                            background: 'rgba(0, 0, 0, 0.7)',
                                            transition: 'height 0.1s linear'
                                        }} />
                                    )}
                                    {onCd && (
                                        <div style={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 0 2px #000'
                                        }}>
                                            {Math.ceil(skillRemaining)}
                                        </div>
                                    )}
                                </>);
                            })()}
                        </div>

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

                {(() => {
                    const kinLvl = getHexLevel(gameState, 'KineticBattery');
                    if (kinLvl <= 0) return null;

                    const cdMod = getCdMod(gameState, player);
                    const kinNow = gameState.gameTime;
                    const boltProgress = getCDProgress(player.lastKineticShockwave ?? -999999, GAME_CONFIG.SKILLS.KINETIC_ZAP_COOLDOWN, cdMod, kinNow);
                    const boltCD = getRemainingCD(player.lastKineticShockwave ?? -999999, GAME_CONFIG.SKILLS.KINETIC_ZAP_COOLDOWN, cdMod, kinNow);
                    const boltPct = boltProgress;

                    const shieldTimeLeft = Math.max(0, (player.kineticShieldTimer || 0) - gameState.gameTime);
                    const shieldPct = shieldTimeLeft / 60;

                    return (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ position: 'relative', width: 42, height: 48 }}>
                                <div style={{
                                    width: '100%', height: '100%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <img src="/assets/hexes/DefBattery.png" alt="Kinetic Bolt" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />

                                    {boltCD > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, width: '100%',
                                            height: `${boltPct * 100}%`,
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                        }} />
                                    )}

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

                            {kinLvl >= 2 && (
                                <div style={{ position: 'relative', width: 42, height: 48 }}>
                                    <div style={{
                                        width: '100%', height: '100%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <img src="/assets/hexes/DefBattery.png" alt="Kinetic Shield" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2 }} />

                                        {shieldTimeLeft > 0 && (
                                            <div style={{
                                                position: 'absolute', bottom: 0, left: 0, width: '100%',
                                                height: `${shieldPct * 100}%`,
                                                backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                            }} />
                                        )}

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
                            )}
                        </div>
                    );
                })()}

                {(() => {
                    const critLvl = getHexLevel(gameState, 'ComCrit');
                    const shatterLvl = getHexLevel(gameState, 'SoulShatterCore');
                    const shatteredCapLvl = getHexLevel(gameState, 'ShatteredCapacitor');
                    if (critLvl < 3 && shatterLvl <= 0 && shatteredCapLvl <= 0) return null;

                    const cdMod = getCdMod(gameState, player);
                    const markNow = gameState.gameTime;
                    const markCD = getRemainingCD(player.lastDeathMark ?? -999999, GAME_CONFIG.SKILLS.DEATH_MARK_COOLDOWN, cdMod, markNow);
                    const markProgress = getCDProgress(player.lastDeathMark ?? -999999, GAME_CONFIG.SKILLS.DEATH_MARK_COOLDOWN, cdMod, markNow);

                    return (
                        <div style={{ position: 'relative', width: 42, height: 48 }}>
                            <div style={{
                                width: '100%', height: '100%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <img src="/assets/hexes/ComCrit.png" alt="Death Mark" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }} />

                                {markCD > 0 && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                                        height: `${markProgress * 100}%`,
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)'
                                    }} />
                                )}

                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16, filter: 'drop-shadow(0 0 5px #8800FF)' }}>
                                    💀
                                </div>

                                {markCD > 0 && (
                                    <div style={{ position: 'absolute', bottom: 2, width: '100%', textAlign: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>
                                        {markCD.toFixed(1)}s
                                    </div>
                                )}
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
                    {formatLargeNumber(Math.ceil(player.curHp))} / {formatLargeNumber(Math.ceil(maxHp))}
                </div>
            </div>

            {(() => {
                const totalShield = (player.shieldChunks || []).reduce((sum, c) => sum + c.amount, 0);
                if (totalShield <= 0) return null;

                const lifeLvl = getHexLevel(gameState, 'ComLife');
                const kinLvl = getHexLevel(gameState, 'KineticBattery');

                let lifeCapacity = 0;
                if (lifeLvl >= 2) {
                    lifeCapacity = maxHp * 0.5 * getHexMultiplier(gameState, 'ComLife');
                }

                let kinCapacity = 0;
                if (kinLvl >= 2) {
                    kinCapacity = calcStat(player.arm);
                }

                const dynamicMaxShield = Math.max(lifeCapacity + kinCapacity, totalShield);
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

