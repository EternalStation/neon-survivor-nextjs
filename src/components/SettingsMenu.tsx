import React, { useState } from 'react';
import { setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolume } from '../logic/audio/AudioLogic';
import { KeybindSettings } from './KeybindSettings';
import { useLanguage, Language } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';

interface SettingsMenuProps {
    onClose: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
    onFeedback?: () => void;
    mode?: 'game' | 'menu';
    gameSpeedMult?: number;
    onGameSpeedChange?: (mult: number) => void;
}

export const SettingsMenu = ({ onClose, onRestart, onQuit, onFeedback, mode = 'game', gameSpeedMult = 1.2, onGameSpeedChange }: SettingsMenuProps) => {
    const [musVol, setMusVol] = useState(getMusicVolume());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());
    const [speedPct, setSpeedPct] = useState(Math.round((gameSpeedMult ?? 1.2) * 100));
    const [activeTab, setActiveTab] = useState<'general' | 'controls' | 'language'>('general');
    const { language, setLanguage } = useLanguage();
    const t = getUiTranslation(language).settings;

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

    const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const pct = parseInt(e.target.value);
        setSpeedPct(pct);
        onGameSpeedChange?.(pct / 100);
    };

    const LANGS: { code: Language; label: string; flag: string; native: string }[] = [
        { code: 'en', label: 'ENGLISH', flag: '🇬🇧', native: 'English' },
        { code: 'ru', label: 'RUSSIAN', flag: '🇷🇺', native: 'Русский' },
    ];

    return (
        <div className="settings-overlay">
            <div className="settings-container">
                <h2 className="settings-header">
                    {mode === 'game' ? t.systemPaused : t.systemSettings}
                </h2>

                {/* Tabs */}
                <div className="settings-tab-container">
                    <button
                        className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <span style={{ fontSize: '18px' }}>🔊</span>
                        <span>{t.audio}</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'controls' ? 'active' : ''}`}
                        onClick={() => setActiveTab('controls')}
                    >
                        <span style={{ fontSize: '18px' }}>🎮</span>
                        <span>{t.controls}</span>
                    </button>
                    <button
                        className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`}
                        onClick={() => setActiveTab('language')}
                    >
                        <span style={{ fontSize: '18px' }}>🌐</span>
                        <span>{t.language}</span>
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'general' && (
                        <div className="settings-control-group">
                            {/* Music Volume */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="settings-slider-label">
                                    <span>{t.musicAmplitude}</span>
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
                                    <span>{t.sfxAmplitude}</span>
                                    <span className="settings-slider-val">{Math.round(sfxVol * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="0" max="1" step="0.01"
                                    value={sfxVol} onChange={handleSfxChange}
                                    className="settings-input-range"
                                />
                            </div>

                            {/* Game Speed */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="settings-slider-label">
                                    <span>{t.gameSpeed}</span>
                                    <span className="settings-slider-val" style={{ color: speedPct !== 100 ? '#f59e0b' : undefined }}>
                                        {speedPct}%
                                    </span>
                                </div>
                                <input
                                    type="range" min="10" max="500" step="5"
                                    value={speedPct} onChange={handleSpeedChange}
                                    className="settings-input-range"
                                />
                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, fontFamily: "'Orbitron', monospace" }}>
                                    {t.gameSpeedNote}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'controls' && (
                        <div className="settings-control-group">
                            <KeybindSettings onBack={() => setActiveTab('general')} />
                        </div>
                    )}

                    {activeTab === 'language' && (
                        <div className="settings-control-group">
                            <div style={{ marginBottom: 8 }}>
                                <div className="settings-slider-label" style={{ marginBottom: 16 }}>
                                    <span>{t.displayLanguage}</span>
                                    <span className="settings-slider-val" style={{ fontSize: 10 }}>
                                        {t.orbitAssistantLanguage}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    {LANGS.map(({ code, label, flag, native }) => {
                                        const isSelected = language === code;
                                        return (
                                            <button
                                                key={code}
                                                onClick={() => setLanguage(code)}
                                                style={{
                                                    flex: 1,
                                                    minWidth: 140,
                                                    padding: '20px 16px',
                                                    background: isSelected
                                                        ? 'rgba(6, 182, 212, 0.15)'
                                                        : 'rgba(15, 23, 42, 0.5)',
                                                    border: isSelected
                                                        ? '2px solid #06b6d4'
                                                        : '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 4,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                                                    boxShadow: isSelected
                                                        ? 'inset 0 0 20px rgba(6,182,212,0.2), 0 0 20px rgba(6,182,212,0.15)'
                                                        : 'none',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                }}
                                                onMouseEnter={e => {
                                                    if (!isSelected) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.3)';
                                                    }
                                                }}
                                                onMouseLeave={e => {
                                                    if (!isSelected) {
                                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(15,23,42,0.5)';
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                                                    }
                                                }}
                                            >
                                                {/* Active glow line */}
                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: 2,
                                                        background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                                                    }} />
                                                )}

                                                <span style={{ fontSize: 36 }}>{flag}</span>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontFamily: "'Orbitron', monospace",
                                                        fontSize: 13,
                                                        fontWeight: 700,
                                                        letterSpacing: 3,
                                                        color: isSelected ? '#06b6d4' : 'rgba(255,255,255,0.6)',
                                                        textTransform: 'uppercase',
                                                        marginBottom: 4,
                                                        transition: 'color 0.2s',
                                                    }}>
                                                        {label}
                                                    </div>
                                                    <div style={{
                                                        fontSize: 11,
                                                        color: isSelected ? 'rgba(6,182,212,0.7)' : 'rgba(255,255,255,0.3)',
                                                        transition: 'color 0.2s',
                                                    }}>
                                                        {native}
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        background: '#06b6d4',
                                                        boxShadow: '0 0 10px #06b6d4',
                                                    }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{
                                    marginTop: 20,
                                    padding: '12px 16px',
                                    background: 'rgba(6,182,212,0.05)',
                                    border: '1px solid rgba(6,182,212,0.15)',
                                    borderRadius: 4,
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: 1,
                                    lineHeight: 1.6,
                                    fontFamily: "'Orbitron', monospace",
                                }}>
                                    {t.languageNote.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i === 0 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-actions" style={{ marginTop: '30px' }}>
                    <button className="btn-settings-primary" onClick={onClose}>
                        {mode === 'game' ? t.resumeMission : t.backToMenu}
                    </button>

                    {mode === 'game' && (
                        <div style={{ display: 'flex', gap: 15 }}>
                            <button className="btn-settings-secondary" onClick={onRestart}>
                                {t.initiateRestart}
                            </button>
                            <button className="btn-settings-muted" onClick={onQuit}>
                                {t.abortToMenu}
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
