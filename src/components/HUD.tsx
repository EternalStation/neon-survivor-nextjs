
import React from 'react';
import type { GameState, UpgradeChoice } from '../logic/core/Types';
import { calcStat } from '../logic/utils/MathUtils';
import { getArenaIndex, SECTOR_NAMES } from '../logic/mission/MapLogic';
import { Minimap } from './Minimap';

import { TopLeftPanel } from './hud/TopLeftPanel';
import { BottomRightPanel } from './hud/BottomRightPanel';
import { AlertPanel } from './hud/AlertPanel';
import { PlayerStatus } from './hud/PlayerStatus';
import { BossStatus } from './hud/BossStatus';
import { UpgradeMenu } from './hud/UpgradeMenu';
import { TutorialOverlay } from './hud/TutorialOverlay';
import { IncubatorMonitor } from './hud/IncubatorMonitor';
import { SpotlightOverlay } from './common/SpotlightOverlay';
import { AssistantOverlay } from './hud/AssistantOverlay';
import { getKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';
import { TutorialStep } from '../logic/core/Types';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';


interface HUDProps {
    gameState: GameState;
    upgradeChoices: UpgradeChoice[] | null;
    onUpgradeSelect: (c: UpgradeChoice) => void;
    onUpgradeReroll?: () => void;
    gameOver: boolean;
    onRestart: () => void;
    bossWarning: number | null;
    fps: number;
    onInventoryToggle: () => void;
    portalError: boolean;
    portalCost: number;
    showSkillDetail: boolean;
    setShowSkillDetail: (v: boolean) => void;
    isTutorialLayerOnly?: boolean;
    showStats: boolean;
    showUpgradeMenu: boolean;
    onSkipTime?: (min: number) => void;
    onTriggerPortal: () => void;
    onStatsToggle: () => void;
}

export const HUD: React.FC<HUDProps> = ({
    gameState, upgradeChoices, onUpgradeSelect, onUpgradeReroll, gameOver, onRestart, bossWarning,
    fps, onInventoryToggle, portalError, portalCost, showSkillDetail, setShowSkillDetail,
    isTutorialLayerOnly, showStats, showUpgradeMenu, onSkipTime, onTriggerPortal, onStatsToggle
}) => {
    const { player, activeEvent } = gameState;
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

    // Dynamic Max HP calculation for HUD
    const curseMult = gameState.assistant.history.curseIntensity || 1.0;
    let maxHp = calcStat(player.hp, gameState.hpRegenBuffMult, curseMult);
    const arenaIdx = getArenaIndex(player.x, player.y);
    if (arenaIdx === 2 && (gameState.arenaLevels[2] || 0) >= 1) {
        maxHp *= 1.2; // +20% Max HP in Defence Hex
    }

    if (isTutorialLayerOnly) {
        if (gameOver && gameState.extractionStatus !== 'complete') return null;
        return <TutorialOverlay gameState={gameState} />;
    }


    if (gameOver && gameState.extractionStatus !== 'complete') return null;

    // Calculate time remaining for active event
    // timeRemaining removed (was used for event timer)

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            width: '100%',
            height: '100%',
            maxWidth: '1800px',
            transform: 'translateX(-50%)',
            pointerEvents: 'none'
        }}>
            {/* Event Indicator (Title Only) */}
            {activeEvent && (
                <div style={{
                    position: 'absolute',
                    top: 200,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 200
                }}>
                    <div style={{
                        fontSize: 34,
                        fontWeight: 'bold',
                        color: '#ef4444',
                        textShadow: '0 0 25px rgba(239, 68, 68, 0.9), 0 0 50px rgba(185, 28, 28, 0.5)',
                        letterSpacing: 4,
                        marginBottom: 4,
                        animation: activeEvent.type === 'necrotic_surge' ? 'glitchText 0.5s ease-in-out infinite' : 'none'
                    }}>

                        {activeEvent.type === 'necrotic_surge' && t.ghostHorde}
                        {activeEvent.type === 'legion_formation' && (
                            <div style={{ animation: 'glitchText 0.2s ease-in-out infinite' }}>
                                <div style={{ fontSize: 32, color: '#ff0000', fontWeight: 900, textShadow: '0 0 15px #ff0000, 0 0 30px #ff0000' }}>
                                    {t.legionIncoming}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <TopLeftPanel gameState={gameState} onSkipTime={onSkipTime} />
            <BottomRightPanel
                onInventoryToggle={onInventoryToggle}
                unseenMeteorites={gameState.inventory.filter(i => i?.isNew).length}
                fps={fps}
                portalKey={getKeyDisplay(getKeybinds().portal)}
                portalState={gameState.portalState}
                dust={gameState.player.dust}
                portalError={portalError}
                portalCost={portalCost}
                isFull={!gameState.inventory.slice(20).some(slot => slot === null)}
                portalsUnlocked={gameState.portalsUnlocked}
                bossKills={gameState.bossKills}
                onTriggerPortal={onTriggerPortal}
                onStatsToggle={onStatsToggle}
            />
            <AlertPanel gameState={gameState} bossWarning={bossWarning} />

            {/* XP Bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 9, background: '#000', zIndex: 100 }}>
                <div style={{
                    width: `${(player.xp.current / player.xp.needed) * 100}%`,
                    height: '100%',
                    background: '#4ade80',
                    boxShadow: '0 0 15px #4ade80',
                    transition: 'width 0.2s'
                }} />
                <div style={{
                    position: 'absolute', width: '100%', textAlign: 'center', top: 0,
                    color: '#fff', fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: 2, lineHeight: '9px', textShadow: '0 0 4px #000',
                    pointerEvents: 'none'
                }}>
                    {t.xp}: {Math.round(player.xp.current).toLocaleString()} / {Math.round(player.xp.needed).toLocaleString()}
                </div>
            </div>

            {/* SECTOR DISPLAY - Directly below XP Bar */}
            <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                zIndex: 90, transition: 'top 0.5s ease-in-out', pointerEvents: 'none'
            }}>
                <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '2px 40px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                }}>
                    <span style={{
                        color: '#94a3b8', fontFamily: 'monospace', fontSize: 11,
                        fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase'
                    }}>
                        {([t.ecoArena, t.comArena, t.defArena][getArenaIndex(player.x, player.y)] || SECTOR_NAMES[getArenaIndex(player.x, player.y)])}
                    </span>
                </div>
            </div>

            <BossStatus
                gameState={gameState}
                showSkillDetail={showSkillDetail}
                setShowSkillDetail={setShowSkillDetail}
            />

            <PlayerStatus gameState={gameState} maxHp={maxHp} />

            <Minimap gameState={gameState} />
            <IncubatorMonitor gameState={gameState} />

            {/* EXTRACTION COORDINATES PERSISTENCE */}
            {['waiting', 'active', 'arriving', 'arrived'].includes(gameState.extractionStatus) && (
                <div style={{
                    position: 'absolute',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 95,
                    pointerEvents: 'none',
                    animation: 'pulse-slow 2s infinite ease-in-out'
                }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.6)',
                        padding: '10px 30px',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div style={{
                            color: gameState.extractionShipPos ? '#10b981' : '#ef4444',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '2px'
                        }}>
                            {t.extractionPointIdentified}
                        </div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '1px', textShadow: '0 0 10px #ef4444' }}>
                            {([t.ecoArena, t.comArena, t.defArena][gameState.extractionTargetArena] || SECTOR_NAMES[gameState.extractionTargetArena] || t.unknown)}
                        </div>
                        <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                            {gameState.extractionShipPos ?
                                `${t.coord}: [${Math.round(gameState.extractionShipPos.x)} : ${Math.round(gameState.extractionShipPos.y)}]` :
                                t.exactCoordPending}
                        </div>
                    </div>
                    <style>{`
                        @keyframes pulse-slow {
                            0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
                            50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
                        }
                    `}</style>
                </div>
            )}

            {upgradeChoices && (
                <UpgradeMenu
                    upgradeChoices={upgradeChoices}
                    onUpgradeSelect={onUpgradeSelect}
                    onUpgradeReroll={onUpgradeReroll}
                    gameState={gameState}
                />
            )}


            {/* CSS Animations */}
            <style>{`
                @keyframes redPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 0.8; }
                }
                @keyframes glitchEffect {
                    0%, 100% { opacity: 1; }
                    25% { opacity: 0.8; transform: translate(-2px, 2px); }
                    50% { opacity: 0.9; transform: translate(2px, -2px); }
                    75% { opacity: 0.85; transform: translate(-1px, 1px); }
                }
                @keyframes glitchText {
                    0%, 100% { transform: translate(0, 0); }
                    25% { transform: translate(-2px, 1px); }
                    50% { transform: translate(2px, -1px); }
                    75% { transform: translate(-1px, 2px); }
                }
            `}</style>
        </div>
    );
};
