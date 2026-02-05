import React from 'react';
import { type PlayerClass } from '../logic/types';
import { PLAYER_CLASSES } from '../logic/classes';

interface ClassSelectionProps {
    onSelect: (selectedClass: PlayerClass) => void;
}

export const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelect }) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // Keyboard Navigation
    React.useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            if (key === 'a' || code === 'keya' || code === 'arrowleft' || key === 'arrowleft') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : PLAYER_CLASSES.length - 1));
            }
            if (key === 'd' || code === 'keyd' || code === 'arrowright' || key === 'arrowright') {
                setSelectedIndex(prev => (prev < PLAYER_CLASSES.length - 1 ? prev + 1 : 0));
            }
            if (key === ' ' || code === 'space' || key === 'enter' || code === 'enter') {
                onSelect(PLAYER_CLASSES[selectedIndex]);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [selectedIndex, onSelect]);

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
            {/* Background Decorative Elements */}
            <div style={{
                position: 'absolute',
                width: '150%',
                height: '150%',
                background: 'repeating-linear-gradient(45deg, rgba(59, 130, 246, 0.05) 0px, rgba(59, 130, 246, 0.05) 2px, transparent 2px, transparent 100px)',
                animation: 'bg-scroll 60s linear infinite',
                pointerEvents: 'none'
            }}></div>

            <h1 style={{
                fontSize: '3rem',
                marginBottom: '2rem',
                letterSpacing: '0.5rem',
                textShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                fontWeight: 900
            }}>SELECT CLASS</h1>

            <div style={{
                display: 'flex',
                gap: '20px',
                width: '90%',
                maxWidth: '1200px',
                justifyContent: 'center'
            }}>
                {PLAYER_CLASSES.map((cls, i) => (
                    <div
                        key={cls.id}
                        className={`class-card class-card-${cls.id} ${i === selectedIndex ? 'selected' : ''}`}
                        onClick={() => onSelect(cls)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        style={{
                            flex: 1,
                            background: i === selectedIndex ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.8)',
                            border: i === selectedIndex ? `2px solid ${cls.icon}` : '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '12px',
                            padding: '30px 20px 15px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            transform: i === selectedIndex ? 'translateY(-10px) scale(1.02)' : 'none',
                            boxShadow: i === selectedIndex ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${cls.icon}33` : 'none'
                        }}
                    >
                        <div className="class-glow" style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: `radial-gradient(circle, ${cls.icon}22 0%, transparent 70%)`,
                            opacity: i === selectedIndex ? 1 : 0,
                            transition: 'opacity 0.3s'
                        }}></div>

                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: cls.iconUrl ? '0' : '15px',
                            background: cls.iconUrl ? 'none' : 'rgba(2, 6, 23, 0.9)',
                            border: cls.iconUrl ? 'none' : `3px solid ${cls.icon}`,
                            boxShadow: cls.iconUrl ? 'none' : `0 0 30px ${cls.icon}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '25px',
                            overflow: 'visible',
                            zIndex: 1
                        }}>
                            {cls.iconUrl ? (
                                <img src={cls.iconUrl} alt="class-icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 0 15px ${cls.icon})` }} />
                            ) : (
                                <div style={{ color: cls.icon, fontSize: '2rem', filter: `drop-shadow(0 0 10px ${cls.icon})` }}>⬡</div>
                            )}
                        </div>

                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            marginBottom: '20px',
                            color: '#fff',
                            zIndex: 1
                        }}>{cls.name.toUpperCase()}</h2>

                        <div style={{
                            width: '100%',
                            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                            paddingTop: '20px',
                            paddingBottom: '0px', // Removed extra padding
                            zIndex: 1,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: cls.themeColor || cls.icon, fontWeight: 900, marginBottom: '5px', letterSpacing: '1px' }}>CORE CAPABILITY</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '8px', color: '#f8fafc' }}>{cls.capabilityName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '24px' }}>{cls.capabilityDesc}</div>

                            {/* Stat Badge Container - Pushed to bottom and centered */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                marginTop: 'auto',
                                justifyContent: 'center',
                                paddingBottom: '0px' // Removed extra padding
                            }}>
                                {cls.stats.hpMult && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.hpMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.hpMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.hpMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>HP</span>
                                        <span>{cls.stats.hpMult > 0 ? '+' : ''}{Math.round(cls.stats.hpMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.spdMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.spdMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.spdMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.spdMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>SPD</span>
                                        <span>{cls.stats.spdMult > 0 ? '+' : ''}{Math.round(cls.stats.spdMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.dmgMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.dmgMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.dmgMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.dmgMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>DMG</span>
                                        <span>{cls.stats.dmgMult > 0 ? '+' : ''}{Math.round(cls.stats.dmgMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.atkMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.atkMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.atkMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.atkMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>ATK</span>
                                        <span>{cls.stats.atkMult > 0 ? '+' : ''}{Math.round(cls.stats.atkMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.armMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.armMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.armMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.armMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>ARM</span>
                                        <span>{cls.stats.armMult > 0 ? '+' : ''}{Math.round(cls.stats.armMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.xpMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.xpMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.xpMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.xpMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>XP</span>
                                        <span>{cls.stats.xpMult > 0 ? '+' : ''}{Math.round(cls.stats.xpMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.stats.regMult && cls.id !== 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: cls.stats.regMult > 0 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: cls.stats.regMult > 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: cls.stats.regMult > 0 ? '#38bdf8' : '#ef4444',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>REG</span>
                                        <span>{cls.stats.regMult > 0 ? '+' : ''}{Math.round(cls.stats.regMult * 100)}%</span>
                                    </div>
                                )}
                                {cls.id === 'malware' && (
                                    <div className="stat-pill" style={{
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        color: '#38bdf8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ opacity: 0.6 }}>PIERCE</span>
                                        <span>+1</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <style>{`
                            .class-card-${cls.id}:hover {
                                transform: translateY(-10px) scale(1.02);
                                border-color: ${cls.icon} !important;
                                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${cls.icon}33 !important;
                                background: rgba(30, 41, 59, 0.9) !important;
                            }
                            .class-card-${cls.id}:hover .class-glow {
                                opacity: 1 !important;
                            }
                        `}</style>
                    </div>
                ))}
            </div>

            <style>{`
                @keyframes bg-scroll {
                    from { transform: rotate(45deg) translateY(0); }
                    to { transform: rotate(45deg) translateY(-1000px); }
                }
            `}</style>
        </div >
    );
};
