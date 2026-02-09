import React, { useEffect, useState } from 'react';
import { GameState, TutorialStep } from '../../logic/core/types';
import { TUTORIAL_HINTS } from '../../logic/core/TutorialLogic';

interface TutorialOverlayProps {
    gameState: GameState;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ gameState }) => {
    const { tutorial } = gameState;
    const [visible, setVisible] = useState(false);
    const [currentHint, setCurrentHint] = useState<{ text: string, subtext: string } | null>(null);

    useEffect(() => {
        if (!tutorial.isActive || tutorial.currentStep === TutorialStep.COMPLETE) {
            setVisible(false);
            return;
        }

        let hint: { text: string; subtext: string } | null | undefined = TUTORIAL_HINTS[tutorial.currentStep];
        if (tutorial.currentStep === TutorialStep.LEVEL_UP_MENU) hint = undefined;

        // Dynamic Overrides
        if (tutorial.currentStep === TutorialStep.UPGRADE_SELECTED_CHECK_STATS) {
            // Only show Stats press hint if menu is CLOSED and stats is NOT yet open
            if (!gameState.showStats && !gameState.isUpgradeMenuOpen) {
                hint = { text: "STATS", subtext: "PRESS [C] TO ACCESS STATS" };
            } else {
                hint = null; // Hide immediately when C is pressed or menu is up
            }
        }

        if (tutorial.currentStep === TutorialStep.COLLECT_METEORITE) {
            if (gameState.meteorites.length > 0) {
                hint = { text: "RESOURCE DETECTED", subtext: "COLLECT THE DROPPED METEORITE CORE" };
            } else {
                hint = null; // Wait silently until one drops
            }
        }

        if (hint) {
            setCurrentHint(hint);
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [tutorial.currentStep, tutorial.isActive, gameState.showStats, gameState.isUpgradeMenuOpen, gameState.meteorites.length]);

    if (!visible || !currentHint) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '200px', // Above the HUD bottom bar
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            width: '100%',
            animation: 'fadeInUp 0.5s ease-out'
        }}>
            {/* Holographic Container */}
            <div style={{
                background: 'rgba(0, 10, 20, 0.8)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                padding: '12px 24px',
                borderRadius: '4px',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                position: 'relative',
                maxWidth: '400px'
            }}>
                {/* Decoration Lines */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#0ff' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: '#0ff' }} />

                <div style={{
                    color: '#0ff',
                    fontSize: '12px',
                    letterSpacing: '3px',
                    fontWeight: 900,
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                }}>
                    {currentHint.text}
                </div>

                <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    letterSpacing: '1px',
                    textShadow: '0 0 5px rgba(255,255,255,0.5)'
                }}>
                    {currentHint.subtext}
                </div>

                {/* Progress Bar for Step? Optional */}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
};
