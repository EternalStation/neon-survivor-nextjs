
import React, { useEffect, useState } from 'react';
import type { GameState, UpgradeChoice } from '../../logic/core/Types';
import { playUpgradeSfx } from '../../logic/audio/AudioLogic';
import { getKeybinds } from '../../logic/utils/Keybinds';
import { UpgradeCard } from '../UpgradeCard';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/UiTranslations';

interface UpgradeMenuProps {
    upgradeChoices: UpgradeChoice[];
    onUpgradeSelect: (c: UpgradeChoice) => void;
    onUpgradeReroll?: () => void;
    gameState: GameState;
}

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ upgradeChoices, onUpgradeSelect, onUpgradeReroll, gameState }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [canSelect, setCanSelect] = useState(false);
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;


    useEffect(() => {
        setSelectedIndex(0);
        setCanSelect(false);
        const delay = upgradeChoices[0]?.isSpecial ? 500 : 200;
        const timer = setTimeout(() => setCanSelect(true), delay);
        return () => clearTimeout(timer);
    }, [upgradeChoices]);


    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const code = e.code.toLowerCase();
            const binds = getKeybinds();

            const leftBind = (binds.moveLeft || 'keya').toLowerCase();
            const rightBind = (binds.moveRight || 'keyd').toLowerCase();

            if (code === leftBind || code === 'arrowleft' || (binds.useDefaultMovement && code === 'keya')) {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : upgradeChoices.length - 1));
            }
            if (code === rightBind || code === 'arrowright' || (binds.useDefaultMovement && code === 'keyd')) {
                setSelectedIndex(prev => (prev < upgradeChoices.length - 1 ? prev + 1 : 0));
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [upgradeChoices]);


    useEffect(() => {
        if (!canSelect) return;
        const handleSelect = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const code = e.code.toLowerCase();
            const sk = (getKeybinds().selectUpgrade || 'Space').toLowerCase();
            if (code === sk || code === 'enter') {
                const choice = upgradeChoices[selectedIndex];
                playUpgradeSfx(choice.rarity?.id || 'common');
                onUpgradeSelect(choice);
            }
        };
        window.addEventListener('keydown', handleSelect);
        return () => window.removeEventListener('keydown', handleSelect);
    }, [upgradeChoices, selectedIndex, onUpgradeSelect, canSelect]);

    return (
        <div className="upgrade-menu-overlay" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
            <div className="fog-layer" />
            <div className="fog-pulse" />
            <div className="honeycomb-layer">
                <div className="honeycomb-cluster" style={{ top: '10%', left: '10%' }} />
                <div className="honeycomb-cluster" style={{ bottom: '20%', right: '15%' }} />
            </div>

            <h2 style={{
                position: 'absolute',
                top: '20px',
                color: '#FFFFFF',
                fontSize: 32,
                fontFamily: 'Orbitron, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: 8,
                textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
                zIndex: 20,
                textAlign: 'center',
                width: '100%',
            }}>
                {upgradeChoices[0].isSpecial ? t.voidTechDetected : t.selectSystemUpgrade}
            </h2>

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                perspective: '1000px',
                gap: '60px',
                marginTop: '-40px'
            }}>

                {upgradeChoices.map((c, i) => (
                    <div key={i} className={`upgrade-card-container ${!canSelect ? 'locked' : ''}`}>
                        {!canSelect && (
                            <div className="scan-overlay">
                                <div className="scan-noise" />
                                <div className="scan-line" />
                                <span className="decrypt-text">DECRYPTING...</span>
                            </div>
                        )}
                        <UpgradeCard
                            choice={c}
                            index={i}
                            isSelected={i === selectedIndex}
                            onSelect={(choice) => {
                                if (!canSelect) return;
                                playUpgradeSfx(choice.rarity?.id || 'common');
                                onUpgradeSelect(choice);
                            }}
                            onHover={setSelectedIndex}
                            isSelecting={false}
                            gameState={gameState}
                        />
                    </div>
                ))}
            </div>

            {gameState.player.rerolls > 0 && onUpgradeReroll && !upgradeChoices[0].isSpecial && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '50px',
                    zIndex: 20,
                    width: '100%'
                }}>
                    <button
                        onClick={() => canSelect && onUpgradeReroll()}
                        disabled={!canSelect}
                        style={{
                            padding: '8px 20px',
                            background: 'linear-gradient(45deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 1))',
                            border: '1px solid rgba(56, 189, 248, 0.5)',
                            borderBottom: `2px solid #38bdf8`,
                            boxShadow: canSelect ? '0 4px 15px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1)' : 'none',
                            color: '#38bdf8',
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: 14,
                            fontWeight: 'bold',
                            cursor: canSelect ? 'pointer' : 'not-allowed',
                            textTransform: 'uppercase',
                            letterSpacing: 3,
                            borderRadius: '6px',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            opacity: canSelect ? 1 : 0.7,
                            transform: canSelect ? 'scale(1)' : 'scale(0.92)'
                        }}
                        onMouseOver={(e) => {
                            if (!canSelect) return;
                            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(30, 41, 59, 1), rgba(56, 189, 248, 0.2))';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = '#38bdf8';
                        }}
                        onMouseOut={(e) => {
                            if (!canSelect) return;
                            e.currentTarget.style.background = 'linear-gradient(45deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 1))';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(56, 189, 248, 0.2), inset 0 0 10px rgba(56, 189, 248, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                        }}
                        onMouseDown={(e) => {
                            if (!canSelect) return;
                            e.currentTarget.style.transform = 'translateY(2px)';
                        }}
                        onMouseUp={(e) => {
                            if (!canSelect) return;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                    >
                        {t.rerollUpgrades} ({gameState.player.rerolls})
                    </button>
                </div>
            )}

            {gameState.rareRewardActive && (
                <div className="glitch-text" style={{
                    color: '#c084fc',
                    fontSize: 24,
                    fontFamily: 'Orbitron, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    textShadow: '0 0 10px #c084fc',
                    zIndex: 20,
                    textAlign: 'center',
                    width: '100%',
                    marginBottom: 20,
                    animation: 'pulse 1s infinite'
                }}>
                    {t.anomalyTerminated}
                </div>
            )}
        </div>
    );
};
