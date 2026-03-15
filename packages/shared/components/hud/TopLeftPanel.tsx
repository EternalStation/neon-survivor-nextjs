
import React from 'react';
import type { GameState, BlueprintType, Meteorite } from '../../logic/core/Types';
import { getArenaIndex } from '../../logic/mission/MapLogic';
import { getCurrentMinuteEnemyHp } from '../../logic/enemies/EnemySpawnLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/UiTranslations';
import './TopLeftPanel.css';

interface TopLeftPanelProps {
    gameState: GameState;
    onSkipTime?: (min: number) => void;
}

interface BuffItem {
    id: string;
    title: string;
    buff: string;
    color: string;
    remaining: number;
    priority: 1 | 1.5 | 2 | 3 | 4;
}

interface PulseLabelProps {
    title: string;
    buff: string;
    color: string;
}

const PulseLabel = ({ title, buff, color }: PulseLabelProps) => {
    const [delay] = React.useState(() => -(Date.now() % 3000));

    return (
        <div
            className="pulse-label"
            style={{ '--pulse-color': color, '--anim-delay': `${delay}ms` } as React.CSSProperties}
        >
            <div className="pulse-dot" />
            <div className="pulse-content">
                <span className="pulse-title">{title}:</span>
                <span className="pulse-buff">{buff}</span>
            </div>
        </div>
    );
};

export const TopLeftPanel: React.FC<TopLeftPanelProps> = ({ gameState, onSkipTime }) => {
    const { player, score, gameTime } = gameState;
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

    return (
        <div className="tlp-root">
            <div className="tlp-header">
                <div className="tlp-kills kills">
                    {(gameState.rawKillCount || gameState.killCount || 0).toString().padStart(4, '0')}
                </div>
                <div className="tlp-enemy-hp">
                    {t.enemyHp} {getCurrentMinuteEnemyHp(gameTime, gameState.extractionPowerMult || 1.0).toLocaleString()}
                </div>
            </div>
            <div className="stat-row tlp-stat-row">
                {t.lvl} {player.level}
            </div>
            <div className="stat-row tlp-time-row">
                <span className="tlp-time">{Math.floor(gameTime / 60)}:{Math.floor(gameTime % 60).toString().padStart(2, '0')}</span>

                {gameState.nextBossSpawnTime && (
                    <>
                        <span className="tlp-separator">|</span>
                        <div className="tlp-boss-timer">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="#ef4444" className="tlp-boss-icon">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2.5 9c-.83 0-1.5-.67-1.5-1.5S8.67 8 9.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                                <path d="M9 19h6v2H9z"></path>
                            </svg>
                            <span className="tlp-boss-countdown">
                                {(() => {
                                    const timeLeft = Math.max(0, Math.ceil(gameState.nextBossSpawnTime - gameTime));
                                    const m = Math.floor(timeLeft / 60);
                                    const s = Math.floor(timeLeft % 60).toString().padStart(2, '0');
                                    return `${m}:${s}`;
                                })()}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {(() => {
                const arenaIdx = getArenaIndex(player.x, player.y);
                const surgeMult = gameState.activeBlueprintBuffs['ARENA_SURGE'] ? 2.0 : 1.0;

                const buffs: BuffItem[] = [];

                if (['requested', 'waiting', 'active', 'arriving', 'arrived'].includes(gameState.extractionStatus)) {
                    const pct = Math.round((gameState.extractionPowerMult || 1.0) * 100 - 100);
                    buffs.push({
                        id: 'extraction_rage',
                        title: t.evacuationRage,
                        buff: `${t.hostiles}: +${pct}% HP/QTY`,
                        color: '#f87171',
                        remaining: 100000,
                        priority: 3
                    });
                }

                if (arenaIdx === 0 && (gameState.arenaLevels[0] || 0) >= 1) {
                    buffs.push({ id: 'eco1', title: t.ecoArena, buff: `+${30 * surgeMult}% ${t.ecoBuff1}`, color: '#22d3ee', remaining: 99999, priority: 2 });
                    buffs.push({ id: 'eco2', title: t.ecoArena, buff: t.ecoBuff2, color: '#22d3ee', remaining: 99999, priority: 2 });
                } else if (arenaIdx === 1 && (gameState.arenaLevels[1] || 0) >= 1) {
                    buffs.push({ id: 'com1', title: t.comArena, buff: `+${30 * surgeMult}% ${t.comBuff}`, color: '#ef4444', remaining: 99999, priority: 2 });
                } else if (arenaIdx === 2 && (gameState.arenaLevels[2] || 0) >= 1) {
                    buffs.push({ id: 'def1', title: t.defArena, buff: `+${30 * surgeMult}% ${t.defBuff}`, color: '#3b82f6', remaining: 99999, priority: 2 });
                }

                const addBp = (type: BlueprintType, serial: string, text: string, color: string) => {
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

                addBp('METEOR_SHOWER', 'ORB-01', t.meteorShowerSuffix, '#f59e0b');
                addBp('STASIS_FIELD', 'STA-X2', t.stasisFieldSuffix, '#8b5cf6');
                addBp('ARENA_SURGE', 'SURG-0', t.arenaSurgeSuffix, '#22d3ee');
                addBp('PERK_RESONANCE', 'HARM-V', t.perkResonanceSuffix, '#a855f7');
                addBp('NEURAL_OVERCLOCK', 'NEU-77', t.neuralOverclockSuffix, '#ec4899');
                addBp('TEMPORAL_GUARD', 'GUAR-D', t.temporalGuardSuffix, '#10b981');
                addBp('MATRIX_OVERDRIVE', 'MATR-X', t.matrixOverdriveSuffix, '#f97316');

                if (gameState.activeBlueprintCharges['QUANTUM_SCRAPPER'] !== undefined) {
                    buffs.push({
                        id: 'QUANTUM_SCRAPPER',
                        title: `SCRP-Q (${gameState.activeBlueprintCharges['QUANTUM_SCRAPPER']} Uses)`,
                        buff: t.quantumScrapperBuff,
                        color: '#facc15',
                        remaining: 88888,
                        priority: 1
                    });
                }

                gameState.pois.forEach(poi => {
                    if (poi.type === 'overclock' && poi.active) {
                        const timeLeft = Math.max(0, Math.ceil(30 - poi.activeDuration));
                        buffs.push({
                            id: 'overclock_' + poi.id,
                            title: `${t.overclockTitle} (${timeLeft}s)`,
                            buff: t.overclockBuff,
                            color: '#22d3ee',
                            remaining: timeLeft,
                            priority: 1.5
                        });
                    }
                });

                if (player.tripleWallDamageUntil && gameTime < player.tripleWallDamageUntil) {
                    const wallTimeLeft = Math.max(0, Math.ceil(player.tripleWallDamageUntil - gameTime));
                    const wm = Math.floor(wallTimeLeft / 60);
                    const ws = Math.floor(wallTimeLeft % 60).toString().padStart(2, '0');
                    buffs.push({
                        id: 'wall_penalty',
                        title: `${t.penalty}: ${t.wallImpact} (${wm}:${ws})`,
                        buff: t.wallDamageTaken,
                        color: '#ef4444',
                        remaining: wallTimeLeft,
                        priority: 4
                    });
                }

                buffs.sort((a, b) => {
                    if (a.priority !== b.priority) return b.priority - a.priority;
                    return b.remaining - a.remaining;
                });

                return (
                    <div className="tlp-buff-list">
                        {buffs.map((b, i) => (
                            <PulseLabel key={b.id + i} title={b.title} buff={b.buff} color={b.color} />
                        ))}
                    </div>
                );
            })()}

            {gameState.inventory.map((item: Meteorite | null, i: number) => {
                if (item && item.isBlueprint && item.status === 'researching' && item.researchFinishTime) {
                    const timeLeftRaw = item.researchFinishTime - gameState.gameTime;
                    if (timeLeftRaw <= 0) return null;
                    const timeLeft = Math.max(0, timeLeftRaw).toFixed(1);
                    return (
                        <div key={`research-${i}`} className="tlp-research">
                            <div className="tlp-research-spinner" />
                            <div className="tlp-research-content">
                                <span className="tlp-research-label">{t.decryption}</span>
                                <span className="tlp-research-timer">{timeLeft}s</span>
                            </div>
                        </div>
                    );
                }
                return null;
            })}

            {player.stunnedUntil && gameState.gameTime < player.stunnedUntil && (
                <div className="tlp-stunned">
                    <div className="tlp-stunned-dot" />
                    <span className="tlp-stunned-label">
                        {t.engineDisabled} ({Math.ceil(player.stunnedUntil - gameState.gameTime)}s)
                    </span>
                </div>
            )}
        </div>
    );
};
