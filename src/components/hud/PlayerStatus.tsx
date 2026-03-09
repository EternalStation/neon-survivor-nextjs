
import React, { useState, useEffect } from 'react';
import type { GameState } from '../../logic/core/Types';
import { CANVAS_WIDTH } from '../../logic/core/Constants';
import { getHexMultiplier, getHexLevel } from '../../logic/upgrades/LegendaryLogic';
import { PLAYER_CLASSES } from '../../logic/core/Classes';
import { calcStat } from '../../logic/utils/MathUtils';
import { formatLargeNumber } from '../../utils/Format';
import { getCdMod, getRemainingCD, getCDProgress } from '../../logic/utils/CooldownUtils';
import { GAME_CONFIG } from '../../logic/core/GameConfig';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/UiTranslations';
import { getKeybinds, getKeyDisplay } from '../../logic/utils/Keybinds';
import styles from './PlayerStatus.module.css';

interface PlayerStatusProps {
    gameState: GameState;
    maxHp: number;
}

interface ContainerCSSVars extends React.CSSProperties {
    '--container-width': string;
}

interface CdCSSVars extends React.CSSProperties {
    '--cd-height': string;
}

interface ChargeCSSVars extends React.CSSProperties {
    '--charge-height': string;
}

interface HpBarCSSVars extends React.CSSProperties {
    '--hp-width': string;
}

interface ShieldBarCSSVars extends React.CSSProperties {
    '--shield-width': string;
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

    const containerWidth = Math.min(CANVAS_WIDTH * 0.8, 300);

    return (
        <div
            className={styles.container}
            style={{ '--container-width': `${containerWidth}px` } as ContainerCSSVars}
        >
            <div className={styles.skillsRow}>
                {(() => {
                    const dashCd = player.dashCooldown ?? 0;
                    const dashCdMax = player.dashCooldownMax || 4.0;
                    const isReady = dashCd <= 0;
                    const cdPct = isReady ? 0 : dashCd / dashCdMax;

                    return (
                        <div className={styles.hexSlot}>
                            <div className={`${styles.hexBody} ${isReady ? styles.hexBodyReady : ''}`}>
                                <div className={`${styles.dashIcons} ${isReady ? styles.dashIconsReady : ''}`}>
                                    <span className={isReady ? styles.dashIconReady : ''}>»</span>
                                    <span className={isReady ? styles.dashIconReady : ''}>»</span>
                                    <span className={isReady ? styles.dashIconReady : ''}>»</span>
                                </div>

                                {cdPct > 0 && (
                                    <div
                                        className={styles.cdOverlayBottom}
                                        style={{ '--cd-height': `${cdPct * 100}%` } as CdCSSVars}
                                    />
                                )}
                                {cdPct > 0 && (
                                    <div className={styles.cdTimer}>
                                        {Math.ceil(dashCd)}
                                    </div>
                                )}
                            </div>
                            <div className={styles.keyBadge}>
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

                    const iconUrl = pClass.iconUrl || '';

                    return (
                        <div className={styles.hexSlot}>
                            <div className={styles.hexBody}>
                                {iconUrl && (
                                    <img
                                        src={iconUrl}
                                        alt="Class Skill"
                                        className={`${styles.skillImg} ${isReady ? styles.skillImgReady : styles.skillImgDimmed}`}
                                    />
                                )}

                                {(player.playerClass === 'stormstrike' || player.playerClass === 'aigis') ? (
                                    <>
                                        {isStormCooldown && cdPct > 0 && (
                                            <div
                                                className={styles.cdOverlayBottomGray}
                                                style={{ '--cd-height': `${cdPct * 100}%` } as CdCSSVars}
                                            />
                                        )}
                                        {!isStormCooldown && cdPct > 0 && (
                                            <div
                                                className={styles.cdOverlayTop}
                                                style={{ '--cd-height': `${cdPct * 100}%` } as CdCSSVars}
                                            />
                                        )}
                                        {!isStormCooldown && stormChargePct > 0 && (
                                            <div
                                                className={styles.cdOverlayCharge}
                                                style={{ '--charge-height': `${stormChargePct * 100}%` } as ChargeCSSVars}
                                            />
                                        )}
                                    </>
                                ) : (
                                    cdPct > 0 && (
                                        <div
                                            className={styles.cdOverlayBottom}
                                            style={{ '--cd-height': `${cdPct * 100}%` } as CdCSSVars}
                                        />
                                    )
                                )}

                                {cdPct > 0 && remainingDisplay && (
                                    <div className={styles.cdTimerSkill}>
                                        {remainingDisplay}
                                    </div>
                                )}
                            </div>

                            {(player.playerClass === 'eventhorizon' || player.playerClass === 'stormstrike' || player.playerClass === 'hivemother' || player.playerClass === 'aigis' || player.playerClass === 'malware') && (
                                <div className={styles.keyBadge}>
                                    {getKeyDisplay(keybinds.classAbility)}
                                </div>
                            )}
                        </div>
                    );
                })()}

                {player.activeSkills && player.activeSkills.map((skill, idx) => (
                    <div key={idx} className={styles.hexSlot}>
                        <div className={styles.hexBody}>
                            {(() => {
                                const skillCdMod = getCdMod(gameState, player);
                                const skillNow = gameState.gameTime;
                                const skillProgress = getCDProgress(skill.lastUsed, skill.baseCD, skillCdMod, skillNow);
                                const skillRemaining = getRemainingCD(skill.lastUsed, skill.baseCD, skillCdMod, skillNow);
                                const onCd = skillProgress > 0;
                                return (
                                    <>
                                        {skill.icon ? (
                                            <img
                                                src={skill.icon}
                                                alt={skill.type}
                                                className={`${styles.skillImg} ${onCd ? styles.skillImgDimmed : styles.skillImgReady}`}
                                            />
                                        ) : (
                                            <div className={styles.skillEmpty}>
                                                {t.skill}
                                            </div>
                                        )}
                                        {onCd && (
                                            <div
                                                className={styles.cdOverlayBottom}
                                                style={{ '--cd-height': `${skillProgress * 100}%` } as CdCSSVars}
                                            />
                                        )}
                                        {onCd && (
                                            <div className={styles.cdTimerSkill}>
                                                {Math.ceil(skillRemaining)}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <div className={styles.skillBadge}>
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
                    const shieldTimeLeft = Math.max(0, (player.kineticShieldTimer || 0) - gameState.gameTime);
                    const shieldPct = shieldTimeLeft / 60;

                    return (
                        <div className={styles.kineticRow}>
                            <div className={styles.hexSlot}>
                                <div className={styles.hexBody}>
                                    <img
                                        src="/assets/hexes/DefBattery.png"
                                        alt="Kinetic Bolt"
                                        className={`${styles.skillImg} ${styles.skillImgDimmed}`}
                                    />
                                    {boltCD > 0 && (
                                        <div
                                            className={styles.cdOverlayBottom}
                                            style={{ '--cd-height': `${boltProgress * 100}%` } as CdCSSVars}
                                        />
                                    )}
                                    <div className={`${styles.iconCentered} ${styles.iconBlue}`}>
                                        ⚡
                                    </div>
                                    {boltCD > 0 && (
                                        <div className={styles.cdTimerSmall}>
                                            {boltCD.toFixed(1)}s
                                        </div>
                                    )}
                                </div>
                            </div>

                            {kinLvl >= 2 && (
                                <div className={styles.hexSlot}>
                                    <div className={styles.hexBody}>
                                        <img
                                            src="/assets/hexes/DefBattery.png"
                                            alt="Kinetic Shield"
                                            className={`${styles.skillImg} ${styles.skillImgFaint}`}
                                        />
                                        {shieldTimeLeft > 0 && (
                                            <div
                                                className={styles.cdOverlayBottom}
                                                style={{ '--cd-height': `${shieldPct * 100}%` } as CdCSSVars}
                                            />
                                        )}
                                        <div className={`${styles.iconCentered} ${styles.iconLightBlue}`}>
                                            🛡️
                                        </div>
                                        {shieldTimeLeft > 0 && (
                                            <div className={styles.cdTimerSmall}>
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
                        <div className={styles.hexSlot}>
                            <div className={styles.hexBody}>
                                <img
                                    src="/assets/hexes/ComCrit.png"
                                    alt="Death Mark"
                                    className={`${styles.skillImg} ${styles.skillImgDimmedMore}`}
                                />
                                {markCD > 0 && (
                                    <div
                                        className={styles.cdOverlayBottom}
                                        style={{ '--cd-height': `${markProgress * 100}%` } as CdCSSVars}
                                    />
                                )}
                                <div className={`${styles.iconCentered} ${styles.iconPurple}`}>
                                    💀
                                </div>
                                {markCD > 0 && (
                                    <div className={styles.cdTimerSmall}>
                                        {markCD.toFixed(1)}s
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className={styles.hpBar}>
                <div
                    className={`${styles.hpFill} ${isHealing ? styles.hpFillHealing : ''}`}
                    style={{ '--hp-width': `${(player.curHp / maxHp) * 100}%` } as HpBarCSSVars}
                />
                <div className={styles.hpText}>
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
                    <div className={styles.shieldBar}>
                        <div
                            className={styles.shieldFill}
                            style={{ '--shield-width': `${Math.min(100, shieldPct)}%` } as ShieldBarCSSVars}
                        />
                        <div className={styles.shieldText}>
                            {formatLargeNumber(Math.ceil(totalShield))} / {formatLargeNumber(Math.ceil(dynamicMaxShield))}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
