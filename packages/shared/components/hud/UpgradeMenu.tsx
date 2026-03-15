
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

            <h2 className="upgrade-menu-title">
                {upgradeChoices[0].isSpecial ? t.voidTechDetected : t.selectSystemUpgrade}
            </h2>

            <div className="upgrade-cards-row">

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
                <div className="reroll-wrapper">
                    <button
                        className="reroll-button"
                        onClick={() => canSelect && onUpgradeReroll()}
                        disabled={!canSelect}
                    >
                        {t.rerollUpgrades} ({gameState.player.rerolls})
                    </button>
                </div>
            )}

            {gameState.rareRewardActive && (
                <div className="glitch-reward-text">
                    {t.anomalyTerminated}
                </div>
            )}
        </div>
    );
};
