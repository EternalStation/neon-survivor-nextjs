import React from 'react';
import type { GameState } from '../../logic/core/types';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface AlertPanelProps {
    gameState: GameState;
    bossWarning: number | null;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ gameState, bossWarning }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

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
                    {t.anomalyDetected} {Math.ceil(bossWarning)}s
                </div>
            )}

            {showSnitchAlert && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 45, right: 15, textAlign: 'right',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    <div style={{ color: '#facc15', fontWeight: 900, letterSpacing: 1, fontSize: 24 }}>
                        {t.intruderAlert}
                    </div>
                    <div style={{ color: '#fef08a', fontWeight: 700, letterSpacing: 2, fontSize: 16, marginTop: 4 }}>
                        {t.searchSurroundings}
                    </div>
                </div>
            )}

            {gameState.portalState === 'warn' && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 85, right: 15, textAlign: 'right',
                    animation: 'pulse 0.5s infinite alternate'
                }}>
                    <div style={{ color: '#00FFFF', fontWeight: 900, letterSpacing: 1, fontSize: 20 }}>
                        {t.riftOpening}
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 14, marginTop: 2 }}>
                        {t.tMinus} {Math.ceil(gameState.portalTimer)}s
                    </div>
                </div>
            )}
            {gameState.portalState === 'open' && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 85, right: 15, textAlign: 'right',
                    animation: gameState.portalTimer <= 5 ? 'pulse 0.2s infinite' : 'pulse 1s infinite'
                }}>
                    <div style={{ color: gameState.portalTimer <= 5 ? '#FF0000' : '#00FF00', fontWeight: 900, letterSpacing: 1, fontSize: 20 }}>
                        {gameState.portalTimer <= 5 ? t.portalClosing : t.portalActive}
                    </div>
                    <div style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 14, marginTop: 2 }}>
                        {t.closingIn} {Math.ceil(gameState.portalTimer)}s
                    </div>
                </div>
            )}

            {gameState.portalBlockedByWorms && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 15, right: 15, textAlign: 'right',
                    animation: 'pulse 0.2s infinite'
                }}>
                    <div style={{ color: '#ef4444', fontWeight: 900, letterSpacing: 1, fontSize: 20, textShadow: '0 0 20px #ff0000' }}>
                        {t.portalsBlocked}
                    </div>
                </div>
            )}
            {gameState.portalBlockedByAbomination && (
                <div className="glitch-text" style={{
                    position: 'absolute', top: 15, right: 15, textAlign: 'right',
                    animation: 'pulse 0.2s infinite'
                }}>
                    <div style={{ color: '#ef4444', fontWeight: 900, letterSpacing: 1, fontSize: 20, textShadow: '0 0 20px #ff0000' }}>
                        {t.portalsBlockedByAbomination}
                    </div>
                </div>
            )}
        </div>
    );
};
