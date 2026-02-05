
import React from 'react';
import type { GameState, UpgradeChoice } from '../logic/types';
import { calcStat } from '../logic/MathUtils';
import { getArenaIndex, SECTOR_NAMES } from '../logic/MapLogic';
import { Minimap } from './Minimap';

import { TopLeftPanel } from './hud/TopLeftPanel';
import { BottomRightPanel } from './hud/BottomRightPanel';
import { AlertPanel } from './hud/AlertPanel';
import { PlayerStatus } from './hud/PlayerStatus';
import { BossStatus } from './hud/BossStatus';
import { UpgradeMenu } from './hud/UpgradeMenu';
import { getKeybinds, getKeyDisplay } from '../logic/Keybinds';


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
}

export const HUD: React.FC<HUDProps> = ({
    gameState, upgradeChoices, onUpgradeSelect, gameOver, bossWarning,
    fps, onInventoryToggle, portalError, portalCost, showSkillDetail, setShowSkillDetail
}) => {
    const { player, activeEvent } = gameState;

    // Dynamic Max HP calculation for HUD
    let maxHp = calcStat(player.hp);
    if (getArenaIndex(player.x, player.y) === 2) {
        maxHp *= 1.2; // +20% Max HP in Defence Hex
    }

    if (gameOver) return null;

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

                        {activeEvent.type === 'necrotic_surge' && 'NECROTIC SURGE'}
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
