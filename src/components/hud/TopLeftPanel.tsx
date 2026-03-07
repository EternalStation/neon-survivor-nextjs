
import React from 'react';
import type { GameState } from '../../logic/core/Types';
import { getArenaIndex } from '../../logic/mission/MapLogic';
import { getCurrentMinuteEnemyHp } from '../../logic/enemies/EnemySpawnLogic';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface TopLeftPanelProps {
    gameState: GameState;
    onSkipTime?: (min: number) => void;
}

const PulseLabel = ({ title, buff, color }: { title: string, buff: string, color: string }) => {
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
                    color, fontSize: 9, fontWeight: 950, letterSpacing: 1,
                    textTransform: 'uppercase', textShadow: `0 0 8px ${color}66`
                }}>{title}:</span>
                <span style={{
                    color: '#fff', fontSize: 9.5, fontWeight: 800
                }}>{buff}</span>
            </div>
        </div>
    );
};

export const TopLeftPanel: React.FC<TopLeftPanelProps> = ({ gameState, onSkipTime }) => {
    const { player, score, gameTime } = gameState;
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

    return (
        <div style={{ position: 'absolute', top: 15, left: 15, pointerEvents: 'auto', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <div className="kills" style={{ color: '#22d3ee', textShadow: '0 0 10px rgba(34, 211, 238, 0.5)', fontSize: 24, fontWeight: 800 }}>
                    {(gameState.rawKillCount || gameState.killCount || 0).toString().padStart(4, '0')}
                </div>
                <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 900, textShadow: '0 0 8px rgba(239, 68, 68, 0.3)', opacity: 0.9, background: 'rgba(239, 68, 68, 0.05)', padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5 }}>
                    {t.enemyHp} {getCurrentMinuteEnemyHp(gameTime, gameState.extractionPowerMult || 1.0).toLocaleString()}
                </div>
            </div>
            <div className="stat-row" style={{ fontSize: 15, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>
                {t.lvl} {player.level}
            </div>
            <div className="stat-row" style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start', fontSize: 15, fontWeight: 800, color: '#64748b', letterSpacing: 1 }}>
                <span style={{ minWidth: 55 }}>{Math.floor(gameTime / 60)}:{Math.floor(gameTime % 60).toString().padStart(2, '0')}</span>

                {gameState.nextBossSpawnTime && (
                    <>
                        <span style={{ color: '#64748b', opacity: 0.5 }}>|</span>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)',
                            flexShrink: 0
                        }}>
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.8))', flexShrink: 0 }}>
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-2.5 9c-.83 0-1.5-.67-1.5-1.5S8.67 8 9.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm5 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
                                <path d="M9 19h6v2H9z"></path>
                            </svg>
                            <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 900, textShadow: '0 0 8px rgba(239, 68, 68, 0.5)', whiteSpace: 'nowrap' }}>
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
            {(() => {
                const arenaIdx = getArenaIndex(player.x, player.y);
                const surgeMult = gameState.activeBlueprintBuffs['ARENA_SURGE'] ? 2.0 : 1.0;

                type BuffItem = { id: string, title: string, buff: string, color: string, remaining: number, priority: number };
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

                const addBp = (type: import('../../logic/core/Types').BlueprintType, serial: string, text: string, color: string) => {
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {buffs.map((b, i) => (
                            <PulseLabel key={b.id + i} title={b.title} buff={b.buff} color={b.color} />
                        ))}
                    </div>
                );
            })()}

            {gameState.inventory.map((item, i) => {
                if (item && item.isBlueprint && item.status === 'researching' && (item as any).researchFinishTime) {
                    const timeLeftRaw = (item as any).researchFinishTime - gameState.gameTime;
                    if (timeLeftRaw <= 0) return null;
                    const timeLeft = Math.max(0, timeLeftRaw).toFixed(1);
                    return (
                        <div key={`research-${i}`} style={{
                            marginTop: 6, display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 12px', background: 'rgba(251, 191, 36, 0.1)',
                            border: '1px solid rgba(251, 191, 36, 0.5)',
                            borderRadius: 6,
                            boxShadow: '0 0 10px rgba(251, 191, 36, 0.15)',
                            width: 'fit-content',
                            pointerEvents: 'none',
                            backdropFilter: 'blur(2px)',
                            transform: 'scale(0.9)',
                            transformOrigin: 'left center'
                        }}>
                            <div style={{
                                width: 10, height: 10, border: '2px solid #fbbf24', borderRadius: '50%',
                                borderTopColor: 'transparent',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{
                                    color: '#fbbf24', fontSize: 10, fontWeight: 950, letterSpacing: 1,
                                    textTransform: 'uppercase', textShadow: '0 0 8px rgba(251, 191, 36, 0.5)'
                                }}>{t.decryption}</span>
                                <span style={{
                                    color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: 'monospace'
                                }}>{timeLeft}s</span>
                            </div>
                        </div>
                    );
                }
                return null;
            })}

            {player.stunnedUntil && gameState.gameTime < player.stunnedUntil && (
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
                        {t.engineDisabled} ({Math.ceil(player.stunnedUntil - gameState.gameTime)}s)
                    </span>
                </div>
            )}
        </div>
    );
};
