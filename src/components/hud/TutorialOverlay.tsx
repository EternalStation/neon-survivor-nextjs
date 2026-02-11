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
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!tutorial.isActive || tutorial.currentStep === TutorialStep.COMPLETE) {
            setVisible(false);
            return;
        }

        let hint: { text: string; subtext: string } | null | undefined = TUTORIAL_HINTS[tutorial.currentStep];

        // Dynamic Overrides for specific steps
        if (tutorial.currentStep === TutorialStep.UPGRADE_SELECTED_CHECK_STATS) {
            if (gameState.showStats) {
                hint = { text: "ORBIT", subtext: "Here you can see the effect of all upgrades on your system." };
            } else {
                hint = { text: "ORBIT", subtext: "Check your system [C]." };
            }

        }







        if (hint) {
            if (currentHint?.subtext !== hint.subtext) {
                setCurrentHint(hint);
                setDisplayedText(""); // Reset for typewriter
                setVisible(true);
            }
        } else {
            setVisible(false);
        }
    }, [tutorial.currentStep, tutorial.isActive, gameState.showStats, gameState.isUpgradeMenuOpen, gameState.meteorites.length, tutorial.stepTimer, gameState.gameTime]);


    // Typewriter Effect
    useEffect(() => {
        if (!currentHint || !visible) return;

        if (displayedText.length < currentHint.subtext.length) {
            setIsTyping(true);
            const timeout = setTimeout(() => {
                setDisplayedText(currentHint.subtext.slice(0, displayedText.length + 1));
            }, 30); // Speed of typing
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
        }
    }, [displayedText, currentHint, visible]);

    const [rarityFilledCount, setRarityFilledCount] = useState(0);

    // Rarity Socket Animation
    useEffect(() => {
        if (tutorial.currentStep !== TutorialStep.LEVEL_UP_MENU || isTyping || !visible) {
            setRarityFilledCount(0);
            return;
        }

        const interval = setInterval(() => {
            setRarityFilledCount(prev => (prev < 9 ? prev + 1 : prev));
        }, 500);

        return () => clearInterval(interval);
    }, [tutorial.currentStep, isTyping, visible]);

    const isOnLeft = gameState.showStats;
    const isAtBottom = gameState.isUpgradeMenuOpen || tutorial.currentStep === TutorialStep.LEVEL_UP_MENU;
    const isMatrixTutorial = gameState.showModuleMenu && tutorial.currentStep >= 10 && tutorial.currentStep <= 20;

    // Space Key Advancement for Matrix Tour
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                const currentStep = gameState.tutorial.currentStep;
                // Steps 10-19 advance to next
                if (gameState.showModuleMenu && currentStep >= 10 && currentStep <= 19 && !isTyping) {
                    e.preventDefault();
                    e.stopPropagation();
                    gameState.tutorial.currentStep += 1;
                    gameState.tutorial.stepTimer = 0;
                    setDisplayedText("");
                }
                // Step 20 (Filters) -> Complete
                else if (gameState.showModuleMenu && currentStep === 20 && !isTyping) {
                    e.preventDefault();
                    e.stopPropagation();
                    gameState.tutorial.currentStep = 99; // COMPLETE
                    gameState.tutorial.isActive = false;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState.tutorial.currentStep, gameState.showModuleMenu, isTyping, gameState.tutorial]);

    if (!visible) return null;

    return (
        <div style={{
            position: 'absolute',
            top: isMatrixTutorial ? 'auto' : (isAtBottom ? 'auto' : '40px'),
            bottom: isMatrixTutorial ? '120px' : (isAtBottom ? '35px' : 'auto'),


            left: isMatrixTutorial ? 'auto' : (isOnLeft ? '40px' : (isAtBottom ? '50%' : 'auto')),
            right: isMatrixTutorial ? '40px' : (isOnLeft ? 'auto' : (isAtBottom ? 'auto' : '40px')),
            transform: isMatrixTutorial ? 'none' : (isAtBottom && !isOnLeft ? 'translateX(-50%)' : 'none'),
            pointerEvents: 'auto', // Enable pointer events for buttons
            zIndex: 3000, // Above menus
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMatrixTutorial ? 'flex-end' : ((isOnLeft || isAtBottom) ? 'flex-start' : 'flex-end'),
            width: isMatrixTutorial ? '50vw' : 'fit-content',
            maxWidth: isMatrixTutorial ? '50vw' : (isOnLeft ? '400px' : '800px'),
            minWidth: isMatrixTutorial ? '50vw' : '350px',


            animation: isAtBottom ? 'slideInBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : (isOnLeft ? 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)')
        }}>

            {/* Chat Window Container */}
            <div style={{

                background: 'rgba(0, 15, 30, 0.6)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                padding: '12px 16px',

                position: 'relative',
                width: '100%',


                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                direction: 'ltr',
                flexDirection: isOnLeft ? 'row' : 'row-reverse',
                gap: '12px',
                borderRadius: isOnLeft ? '0 8px 8px 8px' : '8px 0 8px 8px'
            }}>

                <div style={{ flex: 1, textAlign: 'left' }}>
                    {/* Header */}
                    <div style={{
                        color: '#0ff',
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        gap: '12px'
                    }}>
                        {/* Smaller AI Avatar in Header */}
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(0, 255, 255, 0.1)',
                            border: '1px solid #0ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 0 6px rgba(0, 255, 255, 0.3)',
                            animation: isTyping ? 'pulse-avatar 1s infinite' : 'none'
                        }}>
                            <div style={{ width: '4px', height: '4px', background: '#0ff', borderRadius: '50%' }} />
                        </div>
                        ORBIT SPEAKING
                    </div>

                    {/* Chat Text */}
                    <div style={{
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: 300,
                        letterSpacing: '0.5px',
                        lineHeight: '1.2',
                        textShadow: '0 0 8px rgba(255,255,255,0.2)',
                        fontFamily: 'monospace',
                        minHeight: '10px',

                        whiteSpace: 'pre-wrap', // Allow wrapping
                        display: 'block'

                    }}>
                        <span style={{ verticalAlign: 'middle' }}>
                            {displayedText}
                            {isTyping && <span style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '20px',
                                background: '#0ff',
                                marginLeft: '4px',
                                verticalAlign: 'middle',
                                animation: 'blink 1s step-end infinite'
                            }} />}
                        </span>

                        {/* Special UI for Rarity Step - Inline-block next to text */}
                        {!isTyping && tutorial.currentStep === TutorialStep.LEVEL_UP_MENU && (
                            <div style={{
                                display: 'inline-flex',
                                gap: '4px',
                                background: 'rgba(0,0,0,0.3)',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '1px solid rgba(220, 20, 60, 0.3)',
                                marginLeft: '12px',
                                verticalAlign: 'middle'
                            }}>
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} style={{
                                        width: '12px',
                                        height: '12px',
                                        border: '1px solid #DC143C',
                                        transform: 'rotate(45deg)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.3s ease'
                                    }}>
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            background: i < rarityFilledCount ? '#DC143C' : 'transparent',
                                            boxShadow: i < rarityFilledCount ? '0 0 6px #DC143C' : 'none',
                                            transition: 'background-color 0.3s ease'
                                        }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>



                    {/* PRESS SPACE PROMPT for Matrix Tour */}
                    {!isTyping && gameState.showModuleMenu && tutorial.currentStep >= 10 && tutorial.currentStep <= 20 && (
                        <div
                            onClick={(e) => {
                                // Manual click to advance
                                const currentStep = gameState.tutorial.currentStep;
                                if (currentStep >= 10 && currentStep <= 19) {
                                    e.stopPropagation();
                                    gameState.tutorial.currentStep += 1;
                                    gameState.tutorial.stepTimer = 0;
                                    setDisplayedText("");
                                } else if (currentStep === 20) {
                                    e.stopPropagation();
                                    gameState.tutorial.currentStep = 99;
                                    gameState.tutorial.isActive = false;
                                }
                            }}
                            style={{
                                marginTop: '12px',
                                fontSize: '12px',
                                fontWeight: 900,
                                color: '#22d3ee',
                                letterSpacing: '2px',
                                animation: 'pulse 1.5s infinite',
                                cursor: 'pointer',
                                textAlign: 'right',
                                width: '100%',
                                alignSelf: 'flex-end',
                                paddingRight: '14px'
                            }}>
                            PRESS [SPACE] TO CONTINUE ►
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInBottom {
                    from { opacity: 0; transform: translateY(40px) ${isAtBottom && !isOnLeft ? 'translateX(-50%)' : ''}; }
                    to { opacity: 1; transform: translateY(0) ${isAtBottom && !isOnLeft ? 'translateX(-50%)' : ''}; }
                }
                @keyframes pulse-avatar {
                    0% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
                    50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(0, 255, 255, 0.6); }
                    100% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 255, 255, 0.3); }
                }
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>

        </div>
    );
};
