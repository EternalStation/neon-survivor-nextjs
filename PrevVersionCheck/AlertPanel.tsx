
import React from 'react';
import type { GameState } from '../../logic/types';

interface AlertPanelProps {
    gameState: GameState;
    bossWarning: number | null;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ gameState, bossWarning }) => {
    // Snitch Alert Logic: Show only if Snitch exists AND is in Phase 0 (Passive/Hidden)
    const activeSnitch = gameState.enemies.find(e => e.isRare);
    const showSnitchAlert = activeSnitch && activeSnitch.rarePhase === 0;

    return (
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
            {bossWarning !== null && (
                <div id="boss-warning" className="glitch-text" style={{
                    position: 'absolute', top: 15, right: 15, textAlign: 'right',
                    color: '#ef4444', fontWeight: 900, letterSpacing: 1, fontSize: 24
                }}>
                    ANOMALY DETECTED: {Math.ceil(bossWarning)}s
                </div>
            )}

            {showSnitchAlert && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 45, right: 15, textAlign: 'right',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    <div style={{ color: '#facc15', fontWeight: 900, letterSpacing: 1, fontSize: 24 }}>
                        INTRUDER ALERT
                    </div>
                    <div style={{ color: '#fef08a', fontWeight: 700, letterSpacing: 2, fontSize: 16, marginTop: 4 }}>
                        SEARCH SURROUNDINGS
                    </div>
                </div>
            )}

            {gameState.portalState === 'warn' && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 85, right: 15, textAlign: 'right',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    <div style={{ color: '#00FFFF', fontWeight: 900, letterSpacing: 1, fontSize: 20 }}>
                        DIMENSIONAL RIFT OPENING
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 14, marginTop: 2 }}>
                        T-MINUS {Math.ceil(gameState.portalTimer)}s
                    </div>
                </div>
            )}
            {gameState.portalState === 'open' && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 85, right: 15, textAlign: 'right',
                    animation: gameState.portalTimer <= 5 ? 'pulse 0.2s infinite' : 'pulse 1s infinite'
                }}>
                    <div style={{ color: gameState.portalTimer <= 5 ? '#FF0000' : '#00FF00', fontWeight: 900, letterSpacing: 1, fontSize: 20 }}>
                        {gameState.portalTimer <= 5 ? "PORTAL CLOSING" : "PORTAL ACTIVE"}
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 14, marginTop: 2 }}>
                        CLOSING IN {Math.ceil(gameState.portalTimer)}s
                    </div>
                </div>
            )}
        </div>
    );
};
