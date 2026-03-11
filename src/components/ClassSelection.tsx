import React from 'react';
import { type PlayerClass } from '../logic/core/types';
import { PLAYER_CLASSES } from '../logic/core/classes';
import { AssistantOverlay } from './hud/AssistantOverlay';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

import { ClassCard } from './ClassCard';

interface ClassSelectionProps {
    onSelect: (selectedClass: PlayerClass, tutorialEnabled: boolean) => void;
    onBack?: () => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelect, onBack }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [tutorialEnabled, setTutorialEnabled] = React.useState(false);
    const [orbitMessage, setOrbitMessage] = React.useState<string | null>(null);
    const fireAtRef = React.useRef<number>(Date.now() + 60000);
    const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

    const { language } = useLanguage();
    const t = getUiTranslation(language).classSelection;

    const READING_VARIANTS = [
        t.reading1,
        t.reading2,
        t.reading3,
        t.reading4,
        t.reading5
    ];

    React.useEffect(() => {
        timerRef.current = setInterval(() => {
            if (Date.now() >= fireAtRef.current && orbitMessage === null) {
                const msg = READING_VARIANTS[Math.floor(Math.random() * READING_VARIANTS.length)];
                setOrbitMessage(msg);
                clearInterval(timerRef.current!);
            }
        }, 500);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    React.useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (code === 'tab') {
                e.preventDefault();
            }

            if (code === 'keya' || code === 'arrowleft') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : PLAYER_CLASSES.length - 1));
            }
            if (code === 'keyd' || code === 'arrowright') {
                setSelectedIndex(prev => (prev < PLAYER_CLASSES.length - 1 ? prev + 1 : 0));
            }
            if (code === 'space' || code === 'enter') {
                onSelect(PLAYER_CLASSES[selectedIndex], tutorialEnabled);
            }
            if (code === 'escape' && onBack) {
                onBack();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [selectedIndex, onSelect, tutorialEnabled, onBack]);

    const handleClassSelect = React.useCallback((cls: PlayerClass) => {
        onSelect(cls, tutorialEnabled);
    }, [onSelect, tutorialEnabled]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            fontFamily: 'Orbitron, sans-serif',
            color: '#fff',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'repeating-linear-gradient(45deg, rgba(59, 130, 246, 0.03) 0px, rgba(59, 130, 246, 0.03) 2px, transparent 2px, transparent 100px)',
                backgroundSize: '200px 200px',
                animation: 'bg-scroll 30s linear infinite',
                pointerEvents: 'none'
            }}></div>

            <AssistantOverlay
                message={orbitMessage || ''}
                emotion="Dissapointed"
                isVisible={!!orbitMessage}
                onComplete={() => {
                    setTimeout(() => setOrbitMessage(null), 7000);
                }}
            />

            <h1 style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                letterSpacing: '0.5rem',
                textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                fontWeight: 900
            }}>{t.selectClass}</h1>

            <div
                className="tutorial-toggle"
                onClick={() => setTutorialEnabled(!tutorialEnabled)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    border: `1px solid ${tutorialEnabled ? '#3b82f6' : 'rgba(148, 163, 184, 0.3)'}`,
                    marginBottom: '2rem',
                    width: 'fit-content',
                    transition: 'all 0.3s',
                    zIndex: 10
                }}
            >
                <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: tutorialEnabled ? '#3b82f6' : 'transparent',
                    transition: 'all 0.2s'
                }}>
                    {tutorialEnabled && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </div>
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 900,
                    letterSpacing: '2px',
                    color: tutorialEnabled ? '#fff' : '#94a3b8',
                    textShadow: tutorialEnabled ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                }}>
                    {t.enableTutorialHints}
                </span>
            </div>

            <div style={{
                display: 'flex',
                gap: '20px',
                width: '90%',
                maxWidth: '1200px',
                justifyContent: 'center'
            }}>
                {PLAYER_CLASSES.map((cls, i) => (
                    <ClassCard
                        key={cls.id}
                        cls={cls}
                        isSelected={i === selectedIndex}
                        language={language}
                        t={t}
                        onSelect={handleClassSelect}
                        onMouseEnter={() => setSelectedIndex(i)}
                    />
                ))}
            </div>

            <style>{`
                @keyframes bg-scroll {
                    from { background-position: 0 0; }
                    to { background-position: 0 1000px; }
                }
            `}</style>
        </div >
    );
};
