
import React, { useEffect, useState } from 'react';
import type { GameState, UpgradeChoice } from '../../logic/types';
import { playUpgradeSfx } from '../../logic/AudioLogic';
import { UpgradeCard } from '../UpgradeCard';

interface UpgradeMenuProps {
    upgradeChoices: UpgradeChoice[];
    onUpgradeSelect: (c: UpgradeChoice) => void;
    gameState: GameState;
}

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ upgradeChoices, onUpgradeSelect, gameState }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Initial Reset
    useEffect(() => {
        setSelectedIndex(0);
    }, [upgradeChoices]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (key === 'a' || code === 'keya' || code === 'arrowleft' || key === 'arrowleft') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : upgradeChoices.length - 1));
            }
            if (key === 'd' || code === 'keyd' || code === 'arrowright' || key === 'arrowright') {
                setSelectedIndex(prev => (prev < upgradeChoices.length - 1 ? prev + 1 : 0));
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [upgradeChoices]);

    // Selection Confirmation
    useEffect(() => {
        const handleSelect = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();
            if (key === ' ' || code === 'space' || key === 'enter' || code === 'enter') {
                const choice = upgradeChoices[selectedIndex];
                playUpgradeSfx(choice.rarity?.id || 'common');
                onUpgradeSelect(choice);
            }
        };
        window.addEventListener('keydown', handleSelect);
        return () => window.removeEventListener('keydown', handleSelect);
    }, [upgradeChoices, selectedIndex, onUpgradeSelect]);

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
                top: '10%',
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
                {upgradeChoices[0].isSpecial ? "VOID TECHNOLOGY DETECTED" : "SELECT AUGMENTATION"}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 20, perspective: '1000px', gap: '60px', marginTop: -40 }}>
                {upgradeChoices.map((c, i) => (
                    <div key={i} className="upgrade-card-container">
                        <UpgradeCard
                            choice={c}
                            index={i}
                            isSelected={i === selectedIndex}
                            onSelect={(choice) => {
                                playUpgradeSfx(choice.rarity?.id || 'common');
                                onUpgradeSelect(choice);
                            }}
                            onHover={setSelectedIndex}
                            isSelecting={false}
                        />
                    </div>
                ))}
            </div>

            {gameState.rareRewardActive && (
                <div className="glitch-text" style={{
                    color: '#FACC15',
                    fontSize: 24,
                    fontFamily: 'Orbitron, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    textShadow: '0 0 10px #FACC15',
                    zIndex: 20,
                    textAlign: 'center',
                    width: '100%',
                    marginBottom: 20,
                    animation: 'pulse 1s infinite'
                }}>
                    ANOMALY TERMINATED: RARITY CHANCE INCREASED
                </div>
            )}
        </div>
    );
};
