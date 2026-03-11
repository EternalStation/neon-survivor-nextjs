import React from 'react';
import { type PlayerClass } from '../logic/core/types';

interface ClassCardProps {
    cls: PlayerClass;
    isSelected: boolean;
    language: string;
    t: any;
    onSelect: (cls: PlayerClass) => void;
    onMouseEnter: () => void;
}

const ClassCardComponent: React.FC<ClassCardProps> = ({ cls, isSelected, language, t, onSelect, onMouseEnter }) => {
    return (
        <div
            className={`class-card class-card-${cls.id} ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(cls)}
            onMouseEnter={onMouseEnter}
            style={{
                flex: 1,
                background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.8)',
                border: isSelected ? `2px solid ${cls.icon}` : '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                padding: '30px 20px 15px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                transform: isSelected ? 'translateY(-10px) scale(1.02)' : 'none',
                boxShadow: isSelected ? `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${cls.icon}33` : 'none',
                willChange: 'transform, box-shadow, background'
            }}
        >
            <div className="class-glow" style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: `radial-gradient(circle, ${cls.icon}22 0%, transparent 70%)`,
                opacity: isSelected ? 1 : 0,
                transition: 'opacity 0.3s',
                pointerEvents: 'none'
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
                    <img src={cls.iconUrl} alt="class-icon" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: isSelected ? `drop-shadow(0 0 15px ${cls.icon})` : 'none' }} />
                ) : (
                    <div style={{ color: cls.icon, fontSize: '2rem', filter: isSelected ? `drop-shadow(0 0 10px ${cls.icon})` : 'none' }}>⬡</div>
                )}
            </div>

            <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                marginBottom: '20px',
                color: '#fff',
                zIndex: 1,
                textAlign: 'center'
            }}>{((t.classes as any)[cls.id]?.name || cls.name).toUpperCase()}</h2>

            <div style={{
                width: '100%',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                paddingTop: '20px',
                paddingBottom: '0px',
                zIndex: 1,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '8px', color: cls.themeColor || cls.icon }}>{(t.classes as any)[cls.id]?.capabilityName || cls.capabilityName}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4', marginBottom: '24px' }}>{(t.classes as any)[cls.id]?.capabilityDesc || cls.capabilityDesc}</div>

                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: 'auto',
                    justifyContent: 'center',
                    paddingBottom: '0px'
                }}>
                    {cls.stats.hpMult && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'ХП' : 'HP'}</span>
                            <span>{cls.stats.hpMult > 0 ? '+' : ''}{Math.round(cls.stats.hpMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.spdMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'СКОР' : 'SPD'}</span>
                            <span>{cls.stats.spdMult > 0 ? '+' : ''}{Math.round(cls.stats.spdMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.dmgMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'УРОН' : 'DMG'}</span>
                            <span>{cls.stats.dmgMult > 0 ? '+' : ''}{Math.round(cls.stats.dmgMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.atkMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'АТК' : 'ATK'}</span>
                            <span>{cls.stats.atkMult > 0 ? '+' : ''}{Math.round(cls.stats.atkMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.armMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'БРН' : 'ARM'}</span>
                            <span>{cls.stats.armMult > 0 ? '+' : ''}{Math.round(cls.stats.armMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.xpMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'ОПЫТ' : 'XP'}</span>
                            <span>{cls.stats.xpMult > 0 ? '+' : ''}{Math.round(cls.stats.xpMult * 100)}%</span>
                        </div>
                    )}
                    {cls.stats.regMult && cls.id !== 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{language === 'ru' ? 'РЕГ' : 'REG'}</span>
                            <span>{cls.stats.regMult > 0 ? '+' : ''}{Math.round(cls.stats.regMult * 100)}%</span>
                        </div>
                    )}
                    {cls.id === 'malware' && (
                        <div className="stat-pill" style={{
                            background: `${cls.themeColor || cls.icon}11`,
                            border: `1px solid ${cls.themeColor || cls.icon}33`,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            color: cls.themeColor || cls.icon,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ opacity: 0.6 }}>{t.pierce}</span>
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
    );
};

export const ClassCard = React.memo(ClassCardComponent);
