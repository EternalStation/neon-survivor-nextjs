
import React from 'react';
import type { GameState, UpgradeChoice } from '../logic/core/types';
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
import { SpotlightOverlay } from './common/SpotlightOverlay';
import { getKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';
import { TutorialStep } from '../logic/core/types';


interface HUDProps {
    gameState: GameState;
    upgradeChoices: UpgradeChoice[] | null;
    onUpgradeSelect: (c: UpgradeChoice) => void;
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
}

export const HUD: React.FC<HUDProps> = ({
    gameState, upgradeChoices, onUpgradeSelect, gameOver, onRestart, bossWarning,
    fps, onInventoryToggle, portalError, portalCost, showSkillDetail, setShowSkillDetail,
    isTutorialLayerOnly, showStats, showUpgradeMenu
}) => {
    const { player, activeEvent } = gameState;

    // Dynamic Max HP calculation for HUD
    let maxHp = calcStat(player.hp);
    const arenaIdx = getArenaIndex(player.x, player.y);
    if (arenaIdx === 2) {
        maxHp *= 1.2; // +20% Max HP in Defence Hex
    }

    if (isTutorialLayerOnly) {
        return (
            <>
                <TutorialOverlay gameState={gameState} />
                {(() => {
                    const { tutorial } = gameState;
                    if (!tutorial.isActive) return null;

                    if (tutorial.currentStep === TutorialStep.LEVEL_UP_MENU) {
                        if (tutorial.stepTimer > 5.0) return null;

                        return (
                            <SpotlightOverlay
                                selector=".active-tutorial-target .rarity-sockets"
                                text="RARITY"
                                subtext="SOCKETS BELOW REPRESENT RARITY LEVEL"
                            />
                        );
                    }

                    if (tutorial.currentStep === TutorialStep.UPGRADE_SELECTED_CHECK_STATS) {
                        if (!showStats) return null;

                        if (tutorial.stepTimer < 10) {
                            return (
                                <SpotlightOverlay
                                    selector=".radar-chart-wrapper"
                                    text="SYNERGY DIAGRAM"
                                    subtext="THIS GRAPH VISUALIZES YOUR CHASSIS FOCUS AND SYNERGY STRENGTHS."
                                    preferredPosition="left"
                                    nextLabel="[ NEXT ]"
                                    onNext={() => {
                                        // Jump to 10s mark to show next hint
                                        gameState.tutorial.stepTimer = 10;
                                    }}
                                />
                            );
                        } else {
                            return (
                                <SpotlightOverlay
                                    selector=".stats-calculations"
                                    text="SYSTEM CALCULATIONS"
                                    subtext="VIEW DETAILED FORMULAS SHOWING HOW AUGMENTATIONS IMPACT CORE STATS."
                                    preferredPosition="left"
                                    nextLabel="[ OKAY ]"
                                    onNext={() => {
                                        // Advance tutorial step to next phase
                                        gameState.tutorial.currentStep = TutorialStep.COLLECT_METEORITE;
                                        gameState.tutorial.stepTimer = 0;
                                    }}
                                />
                            );
                        }
                    }

                    return null;
                })()}
            </>
        );
    }

    if (gameOver && gameState.extractionStatus !== 'complete') return null;

    // Calculate time remaining for active event
    // timeRemaining removed (was used for event timer)

    return (
        <>
            {/* Event Indicator (Title Only) */}
            {activeEvent && (
                <div style={{
                    position: 'absolute',
                    top: 140,
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

                        {activeEvent.type === 'necrotic_surge' && 'GHOST HORDE'}
                        {activeEvent.type === 'legion_formation' && (
                            <div style={{ animation: 'glitchText 0.2s ease-in-out infinite' }}>
                                <div style={{ fontSize: 32, color: '#ff0000', fontWeight: 900, textShadow: '0 0 15px #ff0000, 0 0 30px #ff0000' }}>
                                    LEGION INCOMING
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <TopLeftPanel gameState={gameState} />
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
                    XP: {Math.round(player.xp.current).toLocaleString()} / {Math.round(player.xp.needed).toLocaleString()}
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
                        Sector 0{getArenaIndex(player.x, player.y) + 1}: {SECTOR_NAMES[getArenaIndex(player.x, player.y)]}
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

            {/* EXTRACTION COORDINATES PERSISTENCE */}
            {['waiting', 'active', 'arriving', 'arrived'].includes(gameState.extractionStatus) && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
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
                            EXTRACTION POINT IDENTIFIED
                        </div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '1px', textShadow: '0 0 10px #ef4444' }}>
                            {SECTOR_NAMES[gameState.extractionTargetArena] || 'UNKNOWN'}
                        </div>
                        <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                            {gameState.extractionShipPos ?
                                `COORD: [${Math.round(gameState.extractionShipPos.x)} : ${Math.round(gameState.extractionShipPos.y)}]` :
                                'Exact coordinates: pending...'}
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
        </>
    );
};
