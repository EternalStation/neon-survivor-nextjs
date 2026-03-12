import React, { useState, useEffect, useRef } from 'react';
import { 
    getPlaybackInfo, 
    setBpmFolder, 
    playTrackByIndex, 
    toggleBGM, 
    skipTrack, 
    toggleLikedOnly, 
    toggleLikeCurrent,
    getMusicVolume,
    setMusicVolume,
    getSfxVolume,
    setSfxVolume
} from '../logic/audio/AudioLogic';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/UiTranslations';

export const MusicPlayer: React.FC = () => {
    const { language } = useLanguage();
    const t = getUiTranslation(language).settings;
    const [info, setInfo] = useState(getPlaybackInfo());
    const listRef = useRef<HTMLDivElement>(null);

    const [musVol, setMusLocalVol] = useState(getMusicVolume());
    const [sfxVol, setSfxLocalVol] = useState(getSfxVolume());

    useEffect(() => {
        const timer = setInterval(() => {
            setInfo(getPlaybackInfo());
            setMusLocalVol(getMusicVolume());
            setSfxLocalVol(getSfxVolume());
        }, 100);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (listRef.current) {
            const activeItem = listRef.current.querySelector('.list-item.active');
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }, [info.currentIndex, info.folder]);

    const handleMusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setMusLocalVol(v);
        setMusicVolume(v);
    };

    const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setSfxLocalVol(v);
        setSfxVolume(v);
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "00:00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const progress = info.duration > 0 ? (info.elapsed / info.duration) * 100 : 0;

    return (
        <div className="music-player-v2 font-display text-white selection:bg-cyan-500/30">
            <div className="flex w-full h-full p-2 gap-2 overflow-hidden items-stretch">
                {/* Left Pane: Folders */}
                <aside className="w-[180px] bg-black/40 border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-cyan-400">folder</span>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/80 uppercase">BGM_ARCHIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
                        {info.bpmFolders.map(folder => (
                            <div
                                key={folder}
                                onClick={() => setBpmFolder(folder)}
                                className={`list-item flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${info.folder === folder ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'border-transparent hover:bg-white/5 text-slate-400'}`}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {info.folder === folder ? 'folder_open' : 'folder'}
                                </span>
                                <span className="text-xs font-orbitron font-bold tracking-widest">{folder}</span>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Center Pane: Active Interface */}
                <main className="flex-1 bg-black/60 border border-white/5 rounded-xl flex flex-col p-6 items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 flex gap-6">
                        <div className="flex flex-col items-center gap-2 h-40">
                            <div className="relative w-1 flex-1 bg-white/5 rounded-full">
                                <div className="absolute bottom-0 w-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ height: `${musVol * 100}%` }} />
                                <input type="range" min="0" max="1" step="0.01" value={musVol} onChange={handleMusChange} className="vertical-slider" />
                            </div>
                            <span className="text-[9px] font-bold text-cyan-400/50 vertical-text tracking-widest">MUS</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 h-40">
                            <div className="relative w-1 flex-1 bg-white/5 rounded-full">
                                <div className="absolute bottom-0 w-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ height: `${sfxVol * 100}%` }} />
                                <input type="range" min="0" max="1" step="0.01" value={sfxVol} onChange={handleSfxChange} className="vertical-slider" />
                            </div>
                            <span className="text-[9px] font-bold text-purple-400/50 vertical-text tracking-widest">SFX</span>
                        </div>
                    </div>

                    <div className="text-center mt-2 mb-8">
                        <h1 className="text-3xl font-orbitron font-black tracking-[0.3em] text-white/90">VOID_SYNCHRONIZER</h1>
                        <p className="text-[10px] text-cyan-400 tracking-[0.5em] mt-2 opacity-50 uppercase">Operational Protocol: {info.folder}</p>
                    </div>

                    <div className="flex-1 w-full flex flex-col items-center justify-center max-w-lg">
                        <div className="flex items-end gap-1 h-32 mb-10">
                            {[...Array(24)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-gradient-to-t from-cyan-500/20 to-cyan-400 rounded-t-sm transition-all duration-100"
                                    style={{ 
                                        height: !info.isPaused ? `${20 + (Math.sin(Date.now() / 200 + i) * 40 + 40)}%` : '4px',
                                        opacity: !info.isPaused ? 0.3 + Math.random() * 0.7 : 0.2
                                    }}
                                />
                            ))}
                        </div>

                        <div className="w-full text-center space-y-4">
                            <div className="truncate px-4">
                                <h2 className="text-2xl font-orbitron font-bold tracking-widest text-white truncate uppercase">{info.title || 'ARCHIVE_EMPTY'}</h2>
                                <p className="text-[10px] text-slate-500 tracking-[0.2em] mt-1 font-bold uppercase">SYNTH_WAVE_CORE_V1</p>
                            </div>

                            <div className="space-y-2 pt-4">
                                <div className="flex justify-between items-end px-1">
                                    <span className="text-[10px] font-orbitron text-cyan-400/60 tabular-nums">{formatTime(info.elapsed)}</span>
                                    <span className="text-[10px] font-orbitron text-slate-600 tabular-nums">{formatTime(info.duration)}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative group cursor-pointer">
                                    <div className="absolute inset-y-0 left-0 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all" style={{ width: `${progress}%` }} />
                                    <div className="absolute top-0 h-full w-2 bg-white blur-[2px] transition-all" style={{ left: `calc(${progress}% - 4px)` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 flex items-center justify-center gap-12 border-t border-white/5 w-full">
                        <button className="text-slate-500 hover:text-cyan-400 transition-colors" onClick={() => skipTrack(-1)}>
                            <span className="material-symbols-outlined text-4xl">skip_previous</span>
                        </button>
                        <button className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all shadow-xl" onClick={toggleBGM}>
                            <span className="material-symbols-outlined text-6xl text-white group-hover:text-cyan-400 transition-colors bg-clip-text fill-current">
                                {info.isPaused ? 'play_arrow' : 'pause'}
                            </span>
                        </button>
                        <button className="text-slate-500 hover:text-cyan-400 transition-colors" onClick={() => skipTrack(1)}>
                            <span className="material-symbols-outlined text-4xl">skip_next</span>
                        </button>
                    </div>
                </main>

                {/* Right Pane: Tracks */}
                <aside className="w-[300px] bg-black/40 border border-white/5 rounded-xl flex flex-col overflow-hidden shrink-0">
                    <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-cyan-400">queue_music</span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400/80 uppercase">TRACK_LOGS</span>
                        </div>
                        <button 
                            className={`p-1.5 rounded-md border transition-all flex items-center gap-1 ${info.isLikedOnly ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-white/10 text-slate-500'}`}
                            onClick={(e) => { e.stopPropagation(); toggleLikedOnly(!info.isLikedOnly); }}
                        >
                            <span className="material-symbols-outlined text-xs">{info.isLikedOnly ? 'star' : 'star_outline'}</span>
                            <span className="text-[8px] font-bold uppercase">{t.playLikedOnly}</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll" ref={listRef}>
                        {info.playlist.map((track, idx) => (
                            <div
                                key={idx}
                                className={`list-item group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${info.currentIndex === idx ? 'bg-cyan-500/10 border-cyan-500/30' : 'border-transparent hover:bg-white/5'}`}
                                onClick={() => playTrackByIndex(idx)}
                            >
                                <span className={`text-[10px] font-orbitron tabular-nums min-w-[20px] ${info.currentIndex === idx ? 'text-cyan-400' : 'text-slate-600'}`}>
                                    {(idx + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="flex-1 truncate">
                                    <p className={`text-[11px] font-bold truncate uppercase ${info.currentIndex === idx ? 'text-white' : 'text-slate-400'}`}>
                                        {track.title}
                                    </p>
                                    <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5 tracking-tighter">DATASET_REF: 0x{idx.toString(16).padStart(2, '0')}</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); idx === info.currentIndex ? toggleLikeCurrent() : null; }} // Simplified like mechanism
                                    className={`material-symbols-outlined text-lg transition-all ${track.isLiked ? 'text-rose-500 opacity-100 scale-110' : 'text-white/10 group-hover:text-white/20'}`}
                                >
                                    {track.isLiked ? 'favorite' : 'favorite'}
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            <style jsx>{`
                .music-player-v2 {
                    width: 100%;
                    height: 100%;
                }
                .custom-scroll::-webkit-scrollbar { width: 3px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.3); border-radius: 10px; }
                .vertical-slider {
                    -webkit-appearance: none;
                    width: 120px;
                    height: 2px;
                    background: transparent;
                    transform: rotate(-90deg) translate(-75px, 0);
                    cursor: pointer;
                    position: absolute;
                    left: -60px;
                    top: 60px;
                }
                .vertical-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 2px; background: white; border: 2px solid #22d3ee; box-shadow: 0 0 10px #22d3ee; }
                .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                .list-item.active { scroll-margin: 20px; }
            `}</style>
        </div>
    );
};
