import React, { useState } from 'react';
import { setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolume } from '../logic/AudioLogic';
import { KeybindSettings } from './KeybindSettings';

interface SettingsMenuProps {
    onClose: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
    mode?: 'game' | 'menu';
}

export const SettingsMenu = ({ onClose, onRestart, onQuit, mode = 'game' }: SettingsMenuProps) => {
    const [musVol, setMusVol] = useState(getMusicVolume());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());
    const [activeTab, setActiveTab] = useState<'general' | 'controls'>(mode === 'game' ? 'controls' : 'general');

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
                    {activeTab === 'general' && (
                        <>
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
                        </>
                    )}
                    {activeTab === 'controls' && (
                        <button className="btn-settings-primary" onClick={() => setActiveTab('general')}>
                            BACK TO SETTINGS
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
