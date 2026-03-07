import React from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface BottomRightPanelProps {
    onInventoryToggle: () => void;
    unseenMeteorites: number;
    fps: number;
    portalKey: string;
    portalState: string;
    dust: number;
    portalError: boolean;
    portalCost: number;
    isFull?: boolean;
    portalsUnlocked?: boolean;
    bossKills?: number;
    onTriggerPortal: () => void;
    onStatsToggle: () => void;
}

export const BottomRightPanel: React.FC<BottomRightPanelProps> = ({
    onInventoryToggle,
    unseenMeteorites,
    fps,
    portalKey,
    portalState,
    dust,
    portalError,
    portalCost,
    isFull,
    portalsUnlocked = false,
    bossKills = 0,
    onTriggerPortal,
    onStatsToggle
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language).hud;

    const isLocked = bossKills === 0 || !portalsUnlocked;
    const isPortalUnavailable = isLocked || portalState !== 'closed' || dust < portalCost;

    return (
        <div style={{
            position: 'absolute', bottom: 15, right: 15,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 12
        }}>
            {/* STATS BUTTON */}
            <div
                onClick={onStatsToggle}
                style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '2px solid rgba(0, 255, 255, 0.4)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.1)',
                    backdropFilter: 'blur(8px)',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(0, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 10px rgba(0, 255, 255, 0.1)';
                }}
            >
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00ffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px #00ffff)' }}>
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                </svg>
            </div>

            {/* PORTAL SKILL INDICATOR */}
            <div
                onClick={onTriggerPortal}
                style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    background: portalError ? 'rgba(239, 68, 68, 0.2)' : (isPortalUnavailable ? 'rgba(15, 23, 42, 0.4)' : 'rgba(88, 28, 135, 0.3)'),
                    border: '2px solid',
                    borderColor: portalError ? '#ef4444' : (isPortalUnavailable ? 'rgba(148, 163, 184, 0.2)' : 'rgba(168, 85, 247, 0.6)'),
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: portalError ? '0 0 30px rgba(239, 68, 68, 0.8), inset 0 0 20px rgba(239, 68, 68, 0.4)' : (isPortalUnavailable ? 'none' : '0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 10px rgba(168, 85, 247, 0.1)'),
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.1s',
                    animation: portalError ? 'shake 0.2s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                    opacity: isLocked ? 0.6 : 1,
                    cursor: 'pointer',
                    pointerEvents: 'auto'
                }}
            >
                {/* Portal Icon (SVG) */}
                <svg viewBox="0 0 100 100" width="30" height="30" style={{ opacity: isPortalUnavailable ? 0.4 : 1, filter: isPortalUnavailable ? 'none' : 'drop-shadow(0 0 8px #a855f7)' }}>
                    <circle cx="50" cy="50" r="35" fill="none" stroke={isLocked ? '#64748b' : '#a855f7'} strokeWidth="4" strokeDasharray="15 8" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke={isLocked ? '#475569' : '#d8b4fe'} strokeWidth="6" strokeDasharray="5 5" />
                    <circle cx="50" cy="50" r="10" fill={isLocked ? '#475569' : '#a855f7'} />
                </svg>

                {/* Lock Icon Overlay */}
                {isLocked && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.8 }}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#94a3b8">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z" />
                        </svg>
                    </div>
                )}

                {/* Keybind Label */}
                <div style={{
                    position: 'absolute',
                    bottom: -6,
                    right: -6,
                    background: '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontWeight: 900,
                    color: isPortalUnavailable ? '#64748b' : '#e9d5ff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    textTransform: 'uppercase'
                }}>
                    {portalKey}
                </div>

                {/* Status Overlay */}
                {portalState !== 'closed' && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: '#f87171',
                        fontWeight: 900,
                        textAlign: 'center'
                    }}>
                        {t.active}
                    </div>
                )}
                {(portalError || isLocked || (portalState === 'closed' && dust < portalCost)) && (
                    <div style={{
                        position: 'absolute',
                        top: 2,
                        left: 0,
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '7px',
                        color: portalError ? '#fff' : '#64748b',
                        fontWeight: 900,
                        textShadow: portalError ? '0 0 5px #000' : 'none',
                        textTransform: 'uppercase'
                    }}>
                        {portalError && portalState === 'closed' && (dust >= portalCost) ? t.blocked : (isLocked ? t.locked : `${Number(portalCost).toFixed(portalCost % 1 === 0 ? 0 : 1)} ${t.dust}`)}
                    </div>
                )}
            </div>
            {/* INVENTORY / METEORITE INDICATOR (Moved to bottom right, clickable) */}
            <div
                onClick={onInventoryToggle}
                style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    background: isFull ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                    border: isFull ? '2px solid #ef4444' : '2px solid rgba(148, 163, 184, 0.4)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isFull ? '0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 10px rgba(239, 68, 68, 0.2)' : '0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(125, 211, 252, 0.1)',
                    backdropFilter: 'blur(8px)',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)';
                    if (!isFull) e.currentTarget.style.borderColor = 'rgba(125, 211, 252, 0.6)';
                    if (!isFull) e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(125, 211, 252, 0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    if (!isFull) e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
                    if (!isFull) e.currentTarget.style.boxShadow = '0 0 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(125, 211, 252, 0.1)';
                }}
            >
                {/* Meteorite Icon (SVG) - Jagged Rock Shape */}
                <svg viewBox="0 0 100 100" width="34" height="34" style={{ filter: isFull ? 'drop-shadow(0 0 8px #ef4444)' : 'drop-shadow(0 0 8px #7dd3fc)' }}>
                    <path
                        d="M30 20 L75 15 L90 40 L80 80 L50 90 L20 75 L10 45 Z"
                        fill="none"
                        stroke={isFull ? '#ef4444' : '#7dd3fc'}
                        strokeWidth="6"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M40 35 L65 30 L80 45 L70 70 L45 75 L30 60 Z"
                        fill={isFull ? '#ef4444' : '#7dd3fc'}
                        opacity="0.6"
                    />
                    {/* Small craters/details */}
                    <circle cx="45" cy="45" r="4.5" fill={isFull ? '#ef4444' : '#7dd3fc'} opacity="0.8" />
                    <circle cx="65" cy="62" r="3.5" fill={isFull ? '#ef4444' : '#7dd3fc'} opacity="0.8" />
                    <circle cx="35" cy="65" r="2.5" fill={isFull ? '#ef4444' : '#7dd3fc'} opacity="0.8" />
                </svg>

                {/* Full Text Indicator */}
                {isFull && (
                    <div style={{
                        position: 'absolute',
                        bottom: -4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 900,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                        textShadow: '0 0 3px rgba(0,0,0,0.5)',
                        letterSpacing: '1px',
                        zIndex: 10
                    }}>
                        {t.full}
                    </div>
                )}

                {/* Unseen Badge */}
                {unseenMeteorites > 0 && !isFull && (
                    <div style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 900,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                        border: '2px solid #020617',
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.7)',
                        animation: 'pulse 1s infinite'
                    }}>
                        {unseenMeteorites}
                    </div>
                )}
            </div>

            {/* FPS Counter */}
            <span style={{
                color: fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#ef4444',
                fontFamily: 'monospace',
                fontSize: 14,
                fontWeight: 900,
                letterSpacing: '1px',
                textShadow: '0 0 5px rgba(0,0,0,0.8)',
                pointerEvents: 'none'
            }}>
                {fps}
            </span>
        </div>
    );
};
