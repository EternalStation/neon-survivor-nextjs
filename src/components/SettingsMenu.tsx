import React, { useState } from 'react';
import { setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolume } from '../logic/audio/AudioLogic';
import { KeybindSettings } from './KeybindSettings';

interface SettingsMenuProps {
    onClose: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
    onFeedback?: () => void;
    mode?: 'game' | 'menu';
}

export const SettingsMenu = ({ onClose, onRestart, onQuit, onFeedback, mode = 'game' }: SettingsMenuProps) => {
    const [musVol, setMusVol] = useState(getMusicVolume());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());
    const [activeTab, setActiveTab] = useState<'general' | 'controls'>('general');

    const handleMusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setMusVol(v);
        setMusicVolume(v);
    };

    const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setSfxVol(v);
        setSfxVolume(v);
    };

    return (
        <div className="settings-overlay">
            <div className="settings-container">
                <h2 className="settings-header">
                    {mode === 'game' ? 'SYSTEM PAUSED' : 'SYSTEM SETTINGS'}
                </h2>

                {/* Tabs */}
                <div className="settings-tab-container">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <span style={{ fontSize: '18px' }}>🔊</span>
                        <span>AUDIO</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'controls' ? 'active' : ''}`}
                        onClick={() => setActiveTab('controls')}
                    >
                        <span style={{ fontSize: '18px' }}>🎮</span>
                        <span>CONTROLS</span>
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'general' && (
                        <div className="settings-control-group">
                            {/* Music Volume */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="settings-slider-label">
                                    <span>MUSIC AMPLITUDE</span>
                                    <span className="settings-slider-val">{Math.round(musVol * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={musVol} onChange={handleMusChange}
                                    className="settings-input-range"
                                />
                            </div>

                            {/* SFX Volume */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="settings-slider-label">
                                    <span>SFX AMPLITUDE</span>
                                    <span className="settings-slider-val">{Math.round(sfxVol * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={sfxVol} onChange={handleSfxChange}
                                    className="settings-input-range"
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'controls' && (
                        <div className="settings-control-group">
                            <KeybindSettings onBack={() => setActiveTab('general')} />
                        </div>
                    )}
                </div>

                <div className="settings-actions">
                    <button className="btn-settings-primary" onClick={onClose}>
                        {mode === 'game' ? 'RESUME MISSION' : 'BACK TO MENU'}
                    </button>

                    {mode === 'game' && (
                        <div style={{ display: 'flex', gap: 15 }}>
                            <button className="btn-settings-secondary" onClick={onRestart}>
                                INITIATE RESTART
                            </button>
                            <button className="btn-settings-muted" onClick={onQuit}>
                                ABORT TO MENU
                            </button>
                        </div>
                    )}
                </div>

                {onFeedback && (
                    <button
                        onClick={onFeedback}
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            right: '40px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            width: '64px',
                            height: '64px',
                            zIndex: 6000,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                            e.currentTarget.style.border = '1px solid #ef4444';
                            e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 5px 20px rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.4)';
                            e.currentTarget.style.transform = 'scale(1) translateY(0)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.1)';
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px #ef4444)' }}>
                            <path d="m8 2 1.88 1.88" />
                            <path d="M14.12 3.88 16 2" />
                            <path d="M9 7.13v-1a3 3 0 1 1 6 0v1" />
                            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                            <path d="m19 17-3-2" />
                            <path d="m5 17 3-2" />
                            <path d="m19 7-3 2" />
                            <path d="m5 7 3 2" />
                            <path d="m19 12-3 2" />
                            <path d="m5 12 3 2" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};
