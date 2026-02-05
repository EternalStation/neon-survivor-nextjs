
import React, { useState, useEffect } from 'react';
import { getKeybinds, saveKeybinds, getKeyDisplay } from '../logic/Keybinds';
import type { Keybinds } from '../logic/Keybinds';

interface KeybindSettingsProps {
    onBack: () => void;
}

export const KeybindSettings: React.FC<KeybindSettingsProps> = ({ onBack }) => {
    const [keybinds, setKeybinds] = useState<Keybinds>(getKeybinds());
    const [listening, setListening] = useState<keyof Keybinds | null>(null);
    const [conflict, setConflict] = useState<keyof Keybinds | null>(null);

    const RESERVED_KEYS: Record<string, string> = {
        'Move Up': 'W / ↑',
        'Move Down': 'S / ↓',
        'Move Left': 'A / ←',
        'Move Right': 'D / →',
    };

    const FORBIDDEN_LITERALS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (listening) {
                e.preventDefault();
                const key = e.key.toLowerCase();

                // Prevent unbindable keys
                if (key === 'escape') {
                    setListening(null);
                    return;
                }

                // Check for duplicates in current keybinds
                const isDuplicate = Object.entries(keybinds).some(([k, v]) => k !== listening && v === key);
                // Check for duplicates in reserved movement keys
                const isReserved = FORBIDDEN_LITERALS.includes(key);

                if (isDuplicate || isReserved) {
                    setConflict(listening);
                    setTimeout(() => setConflict(null), 1000);
                    return; // REJECT INPUT
                }

                const newKeybinds = { ...keybinds, [listening]: key };
                setKeybinds(newKeybinds);
                saveKeybinds(newKeybinds);
                setListening(null);
                setConflict(null);
            }
        };

        if (listening) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [listening, keybinds]);

    const menuItems: { label: string; key: keyof Keybinds }[] = [
        { label: 'Stats Menu', key: 'stats' },
        { label: 'Matrix Module', key: 'matrix' },
        { label: 'Activate Portal', key: 'portal' },
    ];

    const skillItems: { label: string; key: keyof Keybinds }[] = [
        { label: 'Skill 1', key: 'skill1' },
        { label: 'Skill 2', key: 'skill2' },
        { label: 'Skill 3', key: 'skill3' },
        { label: 'Skill 4', key: 'skill4' },
        { label: 'Skill 5', key: 'skill5' },
        { label: 'Skill 6', key: 'skill6' },
    ];

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 15 }}>
            <h3 style={{ color: '#fff', fontSize: 18, borderBottom: '1px solid #334155', paddingBottom: 10, marginBottom: 10 }}>CONTROLS</h3>

            <div style={{ display: 'flex', gap: 30, paddingRight: 5 }}>
                {/* COLUMN 1: MOVEMENT & SYSTEM */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h4 style={{ color: '#22d3ee', fontSize: 11, margin: '0 0 5px 0', letterSpacing: 1.5, opacity: 0.8 }}>MOVEMENT</h4>
                        {Object.entries(RESERVED_KEYS).map(([label, display]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700, letterSpacing: '0.2px' }}>{label}</span>
                                <div style={{
                                    padding: '6px 10px',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    border: '1px solid rgba(51, 65, 85, 0.2)',
                                    color: '#64748b',
                                    borderRadius: 4,
                                    minWidth: 80,
                                    textAlign: 'center',
                                    fontSize: 12,
                                    fontWeight: 900,
                                    opacity: 0.6
                                }}>
                                    {display}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ height: 1, background: 'rgba(51, 65, 85, 0.2)', margin: '5px 0' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <h4 style={{ color: '#6366f1', fontSize: 11, margin: '0 0 5px 0', letterSpacing: 1.5, opacity: 0.8 }}>SYSTEM</h4>
                        {menuItems.map(item => (
                            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, letterSpacing: '0.2px' }}>{item.label}</span>
                                <button
                                    onClick={() => setListening(item.key)}
                                    className={listening === item.key ? (conflict === item.key ? 'conflict-shake' : 'listening-pulse') : ''}
                                    style={{
                                        padding: '6px 10px',
                                        background: conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#1e293b'),
                                        border: `1px solid ${conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#334155')}`,
                                        color: '#fff',
                                        borderRadius: 4,
                                        cursor: 'pointer',
                                        minWidth: 80,
                                        textAlign: 'center',
                                        fontSize: 12,
                                        fontWeight: 900,
                                        transition: 'all 0.2s',
                                        boxShadow: conflict === item.key ? '0 0 15px #ef4444' : 'none',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {conflict === item.key ? '!' : (listening === item.key ? '...' : getKeyDisplay(keybinds[item.key]))}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ width: 1, background: 'rgba(51, 65, 85, 0.3)', alignSelf: 'stretch' }} />

                {/* COLUMN 2: SKILLS 1-3 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h4 style={{ color: '#ef4444', fontSize: 11, margin: '0 0 5px 0', letterSpacing: 1.5, opacity: 0.8 }}>SKILLS</h4>
                    {skillItems.slice(0, 3).map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, letterSpacing: '0.2px' }}>{item.label}</span>
                            <button
                                onClick={() => setListening(item.key)}
                                className={listening === item.key ? (conflict === item.key ? 'conflict-shake' : 'listening-pulse') : ''}
                                style={{
                                    padding: '6px 10px',
                                    background: conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#1e293b'),
                                    border: `1px solid ${conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#334155')}`,
                                    color: '#fff',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    minWidth: 80,
                                    textAlign: 'center',
                                    fontSize: 12,
                                    fontWeight: 900,
                                    transition: 'all 0.2s',
                                    boxShadow: conflict === item.key ? '0 0 15px #ef4444' : 'none',
                                    letterSpacing: '1px'
                                }}
                            >
                                {conflict === item.key ? '!' : (listening === item.key ? '...' : getKeyDisplay(keybinds[item.key]))}
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ width: 1, background: 'rgba(51, 65, 85, 0.3)', alignSelf: 'stretch' }} />

                {/* COLUMN 3: SKILLS 4-6 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h4 style={{ color: '#ef4444', fontSize: 11, margin: '0 0 5px 0', letterSpacing: 1.5, opacity: 0.8 }}>&nbsp;</h4>
                    {skillItems.slice(3).map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, letterSpacing: '0.2px' }}>{item.label}</span>
                            <button
                                onClick={() => setListening(item.key)}
                                className={listening === item.key ? (conflict === item.key ? 'conflict-shake' : 'listening-pulse') : ''}
                                style={{
                                    padding: '6px 10px',
                                    background: conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#1e293b'),
                                    border: `1px solid ${conflict === item.key ? '#ef4444' : (listening === item.key ? '#3b82f6' : '#334155')}`,
                                    color: '#fff',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    minWidth: 80,
                                    textAlign: 'center',
                                    fontSize: 12,
                                    fontWeight: 900,
                                    transition: 'all 0.2s',
                                    boxShadow: conflict === item.key ? '0 0 15px #ef4444' : 'none',
                                    letterSpacing: '1px'
                                }}
                            >
                                {conflict === item.key ? '!' : (listening === item.key ? '...' : getKeyDisplay(keybinds[item.key]))}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ height: 10 }}>
                {conflict && <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 900, textAlign: 'center', margin: 0, letterSpacing: 1 }}>⚠ KEY ALREADY ASSIGNED</p>}
            </div>

            <button
                onClick={onBack}
                style={{
                    marginTop: 0,
                    padding: '10px',
                    background: 'transparent',
                    border: '1px solid #94a3b8',
                    color: '#94a3b8',
                    borderRadius: 6,
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: 900,
                    fontSize: 12
                }}
            >
                BACK
            </button>
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
