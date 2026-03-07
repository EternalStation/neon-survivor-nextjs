
import React, { useState, useEffect } from 'react';
import { getKeybinds, saveKeybinds, getKeyDisplay } from '../logic/utils/Keybinds';
import type { Keybinds } from '../logic/utils/Keybinds';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

interface KeybindSettingsProps {
    onBack: () => void;
}

export const KeybindSettings: React.FC<KeybindSettingsProps> = ({ onBack }) => {
    const [keybinds, setKeybinds] = useState<Keybinds>(getKeybinds());
    const [listening, setListening] = useState<keyof Keybinds | null>(null);
    const [conflict, setConflict] = useState<keyof Keybinds | null>(null);
    const { language } = useLanguage();
    const t = getUiTranslation(language).settings.keybinds;

    const RESERVED_KEYS: Record<string, string> = {
        'Move Up': 'W / ↑',
        'Move Down': 'S / ↓',
        'Move Left': 'A / ←',
        'Move Right': 'D / →',
    };

    const FORBIDDEN_CODES = ['keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (listening) {
                e.preventDefault();
                processInput(e.code);
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (listening) {
                e.preventDefault();
                let code = '';
                if (e.button === 0) code = 'Mouse0';
                else if (e.button === 1) code = 'Mouse1';
                else if (e.button === 2) code = 'Mouse2';
                else code = `Mouse${e.button}`;
                processInput(code);
            }
        };

        const processInput = (code: string) => {
            const lowerCode = code.toLowerCase();

            // Prevent unbindable keys
            if (lowerCode === 'escape') {
                setListening(null);
                return;
            }

            // Check for duplicates in current keybinds
            const isDuplicate = Object.entries(keybinds).some(([k, v]) => k !== listening && v === code);
            // Check for duplicates in reserved movement keys
            const isReserved = FORBIDDEN_CODES.includes(lowerCode);

            if (isDuplicate || isReserved) {
                setConflict(listening);
                setTimeout(() => setConflict(null), 1000);
                return; // REJECT INPUT
            }

            const newKeybinds = { ...keybinds, [listening as string]: code };
            setKeybinds(newKeybinds);
            saveKeybinds(newKeybinds);
            setListening(null);
            setConflict(null);
        };

        if (listening) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('mousedown', handleMouseDown);
            // prevent context menu to allow binding right click
            window.addEventListener('contextmenu', e => listening && e.preventDefault());
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('contextmenu', e => listening && e.preventDefault());
        };
    }, [listening, keybinds]);

    const menuItems: { label: string; key: keyof Keybinds }[] = [
        { label: t.statsMenu, key: 'stats' },
        { label: t.activatePortal, key: 'portal' },
        { label: t.interact, key: 'interact' },
        { label: t.dash, key: 'dash' },
        { label: t.selectUpgrade, key: 'selectUpgrade' },
    ];

    const skillItems: { label: string; key: keyof Keybinds }[] = [
        { label: t.skill1, key: 'classAbility' },
        { label: t.skill2, key: 'skill1' },
        { label: t.skill3, key: 'skill2' },
        { label: t.skill4, key: 'skill3' },
        { label: t.skill5, key: 'skill4' },
        { label: t.skill6, key: 'skill5' },
        { label: (t as any).skill7 || 'Skill 6', key: 'skill6' },
    ];

    const renderBindItem = (item: { label: string; key: keyof Keybinds }) => (
        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>{item.label}</span>
            <button
                onClick={() => setListening(item.key)}
                className={listening === item.key ? (conflict === item.key ? 'conflict-shake' : 'listening-pulse') : ''}
                style={{
                    padding: '3px 6px',
                    background: conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#1e293b'),
                    border: `1px solid ${conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#334155')}`,
                    color: '#fff',
                    borderRadius: 4,
                    cursor: 'pointer',
                    minWidth: 65,
                    textAlign: 'center',
                    fontSize: 10,
                    fontWeight: 900,
                    transition: 'all 0.2s',
                    boxShadow: conflict === item.key ? '0 0 15px #ef4444' : 'none',
                    letterSpacing: '1px'
                }}
            >
                {conflict === item.key ? '!' : (listening === item.key ? '...' : getKeyDisplay(keybinds[item.key]))}
            </button>
        </div>
    );

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3 style={{ color: '#fff', fontSize: 13, borderBottom: '1px solid #334155', paddingBottom: 4, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 4 }}>{t.title}</h3>

            <div style={{ display: 'flex', gap: 20, paddingRight: 5 }}>
                {/* COLUMN 1: MOVEMENT */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h4 style={{ color: '#22d3ee', fontSize: 9, margin: '0 0 2px 0', letterSpacing: 1.5, opacity: 0.8 }}>{t.movement}</h4>
                        {Object.entries(RESERVED_KEYS).map(([label, display]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.2px' }}>{label}</span>
                                <div style={{
                                    padding: '3px 6px',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(51, 65, 85, 0.2)',
                                    color: '#64748b',
                                    borderRadius: 4,
                                    minWidth: 65,
                                    textAlign: 'center',
                                    fontSize: 10,
                                    fontWeight: 900,
                                    opacity: 0.6
                                }}>
                                    {display}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ width: 1, background: 'rgba(51, 65, 85, 0.2)', alignSelf: 'stretch' }} />

                {/* COLUMN 2: SKILLS 1-4 */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h4 style={{ color: '#ef4444', fontSize: 9, margin: '0 0 2px 0', letterSpacing: 1.5, opacity: 0.8 }}>{t.skills}</h4>
                        {skillItems.slice(0, 4).map(item => renderBindItem(item))}
                    </div>
                </div>

                <div style={{ width: 1, background: 'rgba(51, 65, 85, 0.2)', alignSelf: 'stretch' }} />

                {/* COLUMN 3: SKILLS 5-7 */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <h4 style={{ color: '#ef4444', fontSize: 9, margin: '0 0 2px 0', letterSpacing: 1.5, opacity: 0.8 }}>&nbsp;</h4>
                        {skillItems.slice(4).map(item => renderBindItem(item))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                <h4 style={{ color: '#6366f1', fontSize: 9, margin: '0 0 2px 0', letterSpacing: 1.5, opacity: 0.8 }}>{t.system}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 20px' }}>
                    {menuItems.map(item => (
                        <div key={item.key}>{renderBindItem(item)}</div>
                    ))}
                </div>
            </div>

            <div style={{ height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {conflict && <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 900, margin: 0, letterSpacing: 1 }}>{t.keyAssigned}</p>}
            </div>
            <style>{`
                .listening-pulse {
                    animation: pulse-blue 1s infinite;
                }
                .conflict-shake {
                    animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
                    transform: translate3d(0, 0, 0);
                    backface-visibility: hidden;
                    perspective: 1000px;
                }
                @keyframes pulse-blue {
                    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
};
