import React, { useState, useEffect } from 'react';
import { 
    setMusicVolume, 
    setSfxVolume, 
    getMusicVolume, 
    getSfxVolume, 
    BPM_FOLDERS, 
    INITIAL_TRACKS, 
    getPlaybackInfo,
    setBpmFolder,
    playTrackByIndex,
    toggleBGM,
    skipTrack,
    toggleLikeCurrent,
    toggleLikedOnly
} from '../logic/audio/AudioLogic';
import { KeybindSettings } from './KeybindSettings';
import { useLanguage, Language } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/UiTranslations';

interface SettingsMenuProps {
    onClose: () => void;
    onRestart?: () => void;
    onQuit?: () => void;
    onFeedback?: () => void;
    mode?: 'game' | 'menu';
    gameSpeedMult?: number;
    onGameSpeedChange?: (mult: number) => void;
}

export const SettingsMenu = ({ onClose, onRestart, onQuit, onFeedback, mode = 'game', gameSpeedMult = 1.2 }: SettingsMenuProps) => {
    const [musVol, setMusVol] = useState(getMusicVolume());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());
    const [activeTab, setActiveTab] = useState<'audio' | 'controls' | 'language'>('audio');
    const { language, setLanguage } = useLanguage();
    const t = getUiTranslation(language).settings;

    const [playback, setPlayback] = useState(getPlaybackInfo());
    const [selectedBpm, setSelectedBpm] = useState(playback.folder || '120BPM');

    useEffect(() => {
        const interval = setInterval(() => {
            setPlayback(getPlaybackInfo());
        }, 100);
        return () => clearInterval(interval);
    }, []);

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


    const handleBpmSelect = (bpm: string) => {
        setSelectedBpm(bpm);
        setBpmFolder(bpm);
    };

    const handleTrackSelect = (index: number) => {
        playTrackByIndex(index);
    };

    const LANGS: { code: Language; label: string; flag: string; native: string }[] = [
        { code: 'en', label: 'ENGLISH', flag: '🇬🇧', native: 'English' },
        { code: 'ru', label: 'RUSSIAN', flag: '🇷🇺', native: 'Русский' },
    ];

    return (
        <div className="settings-overlay">
            <div className="settings-container" style={{ maxWidth: activeTab === 'audio' ? '860px' : '700px' }}>
                <h2 className="settings-header">
                    {mode === 'game' ? t.systemPaused : t.systemSettings}
                </h2>

                <div className="settings-tab-container">
                    <button className={`settings-tab ${activeTab === 'audio' ? 'active' : ''}`} onClick={() => setActiveTab('audio')}>
                        <span style={{ fontSize: '18px' }}>🎧</span>
                        <span>PLAYLIST</span>
                    </button>
                    <button className={`settings-tab ${activeTab === 'controls' ? 'active' : ''}`} onClick={() => setActiveTab('controls')}>
                        <span style={{ fontSize: '18px' }}>🎮</span>
                        <span>{t.controls}</span>
                    </button>
                    <button className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`} onClick={() => setActiveTab('language')}>
                        <span style={{ fontSize: '18px' }}>🌐</span>
                        <span>{t.language}</span>
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'audio' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 280px 240px 140px', gap: 12, height: 280 }}>
                            <div className="audio-panel">
                                <div className="panel-header">BPM LINKS</div>
                                <div className="scroll-list">
                                    {BPM_FOLDERS.map(bpm => (
                                        <button 
                                            key={bpm} 
                                            className={`list-item ${selectedBpm === bpm ? 'active' : ''}`}
                                            onClick={() => handleBpmSelect(bpm)}
                                        >
                                            <div className="item-dot" />
                                            {bpm}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="audio-panel">
                                <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>SECTOR TRACKS</span>
                                    <button 
                                        onClick={() => toggleLikedOnly(!playback.isLikedOnly)}
                                        className={`liked-only-toggle ${playback.isLikedOnly ? 'active' : ''}`}
                                    >
                                        <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                        </svg>
                                        LIKED ONLY
                                    </button>
                                </div>
                                <div className="scroll-list">
                                    {(INITIAL_TRACKS[selectedBpm] || []).map((track, idx) => {
                                        const title = track.split('/').pop()?.replace('.mp3', '') || 'Unknown';
                                        const isPlaying = playback.url === track;
                                        return (
                                            <button 
                                                key={track} 
                                                className={`list-item ${isPlaying ? 'active' : ''}`}
                                                onClick={() => handleTrackSelect(idx)}
                                            >
                                                {isPlaying && <div className="playing-indicator" />}
                                                <span className="track-name">{title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="spaceship-player">
                                <div className="hull">
                                    <div className="cockpit">
                                        <div className="waveform-display">
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="wave-bar" 
                                                    style={{ 
                                                        height: playback.isPaused ? '4px' : `${Math.random() * 30 + 5}px`,
                                                        animationDelay: `${i * 0.05}s`
                                                    }} 
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="track-info" style={{ position: 'relative' }}>
                                        <button 
                                            className={`like-btn-top ${playback.isLiked ? 'active' : ''}`} 
                                            onClick={toggleLikeCurrent}
                                            style={{
                                                position: 'absolute',
                                                top: -2,
                                                right: 0,
                                                background: 'none',
                                                border: 'none',
                                                outline: 'none',
                                                color: playback.isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                padding: 0,
                                                zIndex: 10
                                            }}
                                        >
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                            </svg>
                                        </button>
                                        <div className="title">{playback.title}</div>
                                        <div className="progress-container">
                                            <div className="progress-bar" style={{ width: `${(playback.elapsed / playback.duration) * 100}%` }} />
                                        </div>
                                        <div className="time-info">
                                            {Math.floor(playback.elapsed / 60)}:{(playback.elapsed % 60).toFixed(0).padStart(2, '0')} / {Math.floor(playback.duration / 60)}:{(playback.duration % 60).toFixed(0).padStart(2, '0')}
                                        </div>
                                    </div>

                                    <div className="player-controls">
                                        <button className="ctrl-btn" onClick={() => skipTrack(-1)}>
                                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M6 18V6h2v12H6zm3.5-6L19 6v12l-9.5-6z"/></svg>
                                        </button>
                                        <button className="ctrl-btn play" onClick={toggleBGM}>
                                            {playback.isPaused ? (
                                                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                            ) : (
                                                <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                            )}
                                        </button>
                                        <button className="ctrl-btn" onClick={() => skipTrack(1)}>
                                            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M6 18l9.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="volume-vertical">
                                <div className="slider-box">
                                    <div className="label">MUSIC</div>
                                    <div className="slider-wrapper">
                                        <input 
                                            type="range" min="0" max="1" step="0.01" 
                                            value={musVol} onChange={handleMusChange}
                                            className="vertical-range"
                                        />
                                    </div>
                                    <div className="value">{Math.round(musVol * 100)}%</div>
                                </div>
                                <div className="slider-box">
                                    <div className="label">SFX</div>
                                    <div className="slider-wrapper">
                                        <input 
                                            type="range" min="0" max="1" step="0.01" 
                                            value={sfxVol} onChange={handleSfxChange}
                                            className="vertical-range"
                                        />
                                    </div>
                                    <div className="value">{Math.round(sfxVol * 100)}%</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'controls' && (
                        <div className="settings-control-group">
                            <KeybindSettings onBack={() => setActiveTab('audio')} />
                        </div>
                    )}

                    {activeTab === 'language' && (
                        <div className="settings-control-group">
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {LANGS.map(({ code, flag, label, native }) => {
                                    const isSelected = language === code;
                                    return (
                                        <button key={code} onClick={() => setLanguage(code)} className={`lang-btn ${isSelected ? 'active' : ''}`}>
                                            <span style={{ fontSize: 36 }}>{flag}</span>
                                            <div className="lang-info">
                                                <div className="name">{label}</div>
                                                <div className="native">{native}</div>
                                            </div>
                                            {isSelected && <div className="active-dot" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="settings-actions">
                    <button className="btn-settings-primary" onClick={onClose}>
                        {mode === 'game' ? t.resumeMission : t.backToMenu}
                    </button>
                    {mode === 'game' && (
                        <div style={{ display: 'flex', gap: 15 }}>
                            <button className="btn-settings-secondary" onClick={onRestart}>{t.initiateRestart}</button>
                            <button className="btn-settings-muted" onClick={onQuit}>{t.abortToMenu}</button>
                        </div>
                    )}
                </div>

                {onFeedback && (
                    <button onClick={onFeedback} className="feedback-launcher">
                        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" /><path d="M9 7.13v-1a3 3 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><path d="m19 17-3-2" /><path d="m5 17 3-2" /><path d="m19 7-3 2" /><path d="m5 7 3 2" /><path d="m19 12-3 2" /><path d="m5 12 3 2" />
                        </svg>
                    </button>
                )}
            </div>

            <style>{`
                .audio-panel {
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(6, 182, 212, 0.2);
                    display: flex;
                    flex-direction: column;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .panel-header {
                    padding: 10px;
                    background: rgba(6, 182, 212, 0.1);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    color: #06b6d4;
                    border-bottom: 1px solid rgba(6, 182, 212, 0.2);
                }
                .scroll-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .list-item {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid transparent;
                    padding: 8px 12px;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: 'Orbitron', monospace;
                    font-size: 12px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .list-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                }
                .list-item.active {
                    background: rgba(6, 182, 212, 0.15);
                    border-color: #06b6d4;
                    color: #06b6d4;
                    text-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
                }
                .liked-only-toggle {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 8px;
                    font-weight: 900;
                    padding: 4px 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 1px;
                }
                .liked-only-toggle:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }
                .liked-only-toggle.active {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
                }
                .item-dot {
                    width: 6px;
                    height: 6px;
                    background: currentColor;
                    border-radius: 50%;
                }
                .playing-indicator {
                    width: 12px;
                    height: 12px;
                    background: #06b6d4;
                    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M8 5v14l11-7z'/%3E%3C/svg%3E") no-repeat center;
                    animation: pulse 1s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .spaceship-player {
                    background: rgba(15, 23, 42, 0.6);
                    border: 2px solid #334155;
                    border-radius: 12px;
                    padding: 12px;
                    position: relative;
                    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.5);
                }
                .hull {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    height: 100%;
                }
                .cockpit {
                    background: #020617;
                    border: 2px solid rgba(6, 182, 212, 0.3);
                    height: 50px;
                    border-radius: 30px 30px 10px 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    position: relative;
                }
                .waveform-display {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    width: 80%;
                    height: 40px;
                }
                .wave-bar {
                    flex: 1;
                    background: #06b6d4;
                    border-radius: 2px;
                    transition: height 0.1s ease;
                    box-shadow: 0 0 10px #06b6d4;
                }
                .track-info {
                    text-align: center;
                }
                .track-info .label {
                    font-size: 9px;
                    letter-spacing: 3px;
                    color: rgba(255, 255, 255, 0.3);
                    margin-bottom: 4px;
                }
                .track-info .title {
                    font-size: 15px;
                    font-weight: 900;
                    color: #fff;
                    margin-bottom: 5px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .progress-container {
                    background: rgba(255, 255, 255, 0.05);
                    height: 4px;
                    border-radius: 2px;
                    margin-bottom: 4px;
                    overflow: hidden;
                }
                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #06b6d4, #7c3aed);
                    box-shadow: 0 0 10px #06b6d4;
                }
                .time-info {
                    font-size: 10px;
                    font-family: monospace;
                    color: rgba(255, 255, 255, 0.4);
                }
                .player-controls {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-top: auto;
                }
                .ctrl-btn {
                    background: rgba(15, 23, 42, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    outline: none;
                    transition: all 0.2s;
                }
                .ctrl-btn:hover {
                    background: #fff;
                    color: #000;
                    transform: scale(1.1);
                }
                .ctrl-btn.play {
                    width: 68px;
                    height: 68px;
                    background: #06b6d4;
                    border-color: #fff;
                }
                .ctrl-btn.like.active {
                    color: #ef4444;
                    text-shadow: 0 0 10px #ef4444;
                }
                .volume-vertical {
                    display: flex;
                    gap: 20px;
                }
                .slider-box {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: rgba(15, 23, 42, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 15px 0;
                    border-radius: 8px;
                }
                .slider-box .label {
                    font-size: 9px;
                    font-weight: 900;
                    color: rgba(255, 255, 255, 0.4);
                    letter-spacing: 2px;
                    margin-bottom: 20px;
                }
                .slider-wrapper {
                    flex: 1;
                    position: relative;
                    width: 40px;
                }
                .vertical-range {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-90deg);
                    width: 160px;
                    height: 6px;
                    appearance: none;
                    background: rgba(0, 0, 0, 0.4);
                    border-radius: 3px;
                    outline: none;
                }
                .vertical-range::-webkit-slider-thumb {
                    appearance: none;
                    width: 18px;
                    height: 18px;
                    background: #fff;
                    border: 2px solid #06b6d4;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 0 10px #06b6d4;
                }
                .slider-box .value {
                    margin-top: 20px;
                    font-weight: 900;
                    color: #06b6d4;
                    font-size: 14px;
                }
                .lang-btn {
                    flex: 1;
                    min-width: 140px;
                    padding: 20px 16px;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.25s;
                    position: relative;
                }
                .lang-btn.active {
                    background: rgba(6, 182, 212, 0.15);
                    border-color: #06b6d4;
                }
                .lang-info {
                    text-align: center;
                }
                .lang-info .name {
                    font-size: 13px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.6);
                    letter-spacing: 2px;
                }
                .lang-btn.active .name {
                    color: #06b6d4;
                }
                .active-dot {
                    width: 8px;
                    height: 8px;
                    background: #06b6d4;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #06b6d4;
                }
                .feedback-launcher {
                    position: absolute;
                    bottom: 40px;
                    right: 40px;
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border: 1px solid #ef4444;
                    width: 64px;
                    height: 64px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .feedback-launcher:hover {
                    transform: scale(1.1) translateY(-5px);
                    background: rgba(239, 68, 68, 0.3);
                    box-shadow: 0 5px 20px rgba(239, 68, 68, 0.4);
                }
            `}</style>
        </div>
    );
};
