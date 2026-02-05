import React, { useState } from 'react';
import { setMusicVolume, setSfxVolume, getMusicVolume, getSfxVolume } from '../logic/AudioLogic';

export const AudioWidget: React.FC = () => {
    const [musVol, setMusVol] = useState(getMusicVolume());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());

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
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
            borderRadius: 8,
            padding: '15px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minWidth: 200,
            zIndex: 2000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ color: '#22d3ee', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, marginBottom: 5 }}>
                AUDIO
            </div>

            {/* Music Volume */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 10, fontWeight: 700 }}>
                    <span>MUSIC</span>
                    <span>{Math.round(musVol * 100)}%</span>
                </div>
                <input
                    type="range" min="0" max="1" step="0.05"
                    value={musVol} onChange={handleMusChange}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#22d3ee' }}
                />
            </div>

            {/* SFX Volume */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 10, fontWeight: 700 }}>
                    <span>SFX</span>
                    <span>{Math.round(sfxVol * 100)}%</span>
                </div>
                <input
                    type="range" min="0" max="1" step="0.05"
                    value={sfxVol} onChange={handleSfxChange}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#f472b6' }}
                />
            </div>
        </div>
    );
};
