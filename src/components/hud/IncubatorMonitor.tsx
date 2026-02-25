
import React from 'react';
import type { GameState } from '../../logic/core/types';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

interface IncubatorMonitorProps {
    gameState: GameState;
}

export const IncubatorMonitor: React.FC<IncubatorMonitorProps> = ({ gameState }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const activeMeteorite = gameState.incubator?.[0];

    if (!activeMeteorite || activeMeteorite.isRuined) return null;

    const instability = activeMeteorite.instability || 0;
    const boost = activeMeteorite.incubatorBoost || 0;

    // Status levels
    const isCritical = instability >= 40;
    const isWarning = instability >= 20;
    const statusColor = isCritical ? '#ef4444' : isWarning ? '#fbbf24' : '#00d9ff';

    return (
        <div className="incubator-monitor">
            <div className="monitor-header">
                <span className="monitor-title">{t.incubator.title}</span>
                <div className="monitor-led" style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
            </div>

            <div className="monitor-body">
                <div className="tube-section-row">
                    <div className="tube-section">
                        <div className="tube-label-mini">{t.incubator.inst}</div>
                        <div className="tube-container">
                            <div className="tube-fill-red" style={{ height: `${instability}%` }}>
                                <div className="plasma-core" />
                                <div className="plasma-bubbles" />
                            </div>
                            <div className="tube-glass" />
                        </div>
                    </div>

                    <div className="tube-section">
                        <div className="tube-label-mini">{t.incubator.fuel}</div>
                        <div className="tube-container">
                            <div className="tube-fill-blue" style={{ height: `${(gameState.incubatorFuel / gameState.incubatorFuelMax) * 100}%` }}>
                                <div className="plasma-core" />
                                <div className="plasma-bubbles" />
                            </div>
                            <div className="tube-glass" />
                        </div>
                    </div>
                </div>

                <div className="data-section">
                    <div className="stat-row">
                        <span className="stat-label">{t.incubator.fuel}:</span>
                        <span className="stat-value" style={{ color: '#0ea5e9' }}>{gameState.incubatorFuel}/{gameState.incubatorFuelMax}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">{t.incubator.instability}:</span>
                        <span className="stat-value" style={{ color: statusColor }}>{instability}%</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">{t.incubator.boost}:</span>
                        <span className="stat-value" style={{ color: '#10b981' }}>+{boost}%</span>
                    </div>
                    {gameState.incubatorFuel <= 0 ? (
                        <div className="status-badge" style={{ borderColor: '#ef4444', color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)' }}>
                            {t.incubator.offline}
                        </div>
                    ) : (
                        <div className="status-badge" style={{ borderColor: `${statusColor}44`, color: statusColor }}>
                            {isCritical ? `!!! ${t.incubator.critical} !!!` : isWarning ? t.incubator.warning : t.incubator.stable}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .incubator-monitor {
                    position: absolute;
                    bottom: 180px;
                    left: 20px;
                    width: 170px;
                    background: rgba(15, 23, 42, 0.85);
                    border: 1px solid rgba(51, 65, 85, 0.5);
                    border-left: 3px solid #00d9ff;
                    padding: 8px;
                    border-radius: 4px;
                    backdrop-filter: blur(8px);
                    pointer-events: none;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    animation: slideIn 0.5s ease-out;
                }
                @keyframes slideIn {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .monitor-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 4px;
                }
                .monitor-title {
                    font-size: 8px;
                    font-weight: 900;
                    color: #94a3b8;
                    letter-spacing: 1.5px;
                }
                .monitor-led {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                }
                .monitor-body {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                .tube-section-row {
                    display: flex;
                    gap: 8px;
                }
                .tube-section {
                    width: 12px;
                    height: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                }
                .tube-label-mini {
                    font-size: 5px;
                    font-weight: 950;
                    color: #64748b;
                }
                .tube-container {
                    width: 100%;
                    flex: 1;
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 10px;
                    position: relative;
                    overflow: hidden;
                }
                .tube-fill-red {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    background: linear-gradient(to top, #7f1d1d, #ef4444, #f87171);
                    transition: height 0.5s ease-out;
                    box-shadow: 0 0 10px #ef444466;
                    overflow: hidden;
                }
                .tube-fill-blue {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    background: linear-gradient(to top, #0c4a6e, #0ea5e9, #7dd3fc);
                    transition: height 0.5s ease-out;
                    box-shadow: 0 0 10px #0ea5e966;
                    overflow: hidden;
                }
                .plasma-core {
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(255, 255, 255, 0) 0px,
                        rgba(255, 255, 255, 0.1) 10px,
                        rgba(255, 255, 255, 0) 20px
                    );
                    animation: plasma-flow 1.5s infinite linear;
                }
                .plasma-bubbles {
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle at 50% 100%, white 0.8px, transparent 1px);
                    background-size: 6px 15px;
                    animation: bubbles-rise 2s infinite linear;
                    opacity: 0.4;
                }
                @keyframes plasma-flow {
                    from { background-position: 0 0; }
                    to { background-position: 0 40px; }
                }
                @keyframes bubbles-rise {
                    from { background-position: 0 0; }
                    to { background-position: 0 -30px; }
                }
                .tube-glass {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, 
                        rgba(255,255,255,0.1) 0%, 
                        rgba(255,255,255,0.05) 20%,
                        transparent 45%, 
                        rgba(255,255,255,0.15) 100%
                    );
                    border-radius: 10px;
                    pointer-events: none;
                }
                .data-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .stat-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .stat-label {
                    font-size: 7px;
                    font-weight: 700;
                    color: #64748b;
                }
                .stat-value {
                    font-size: 9px;
                    font-weight: 900;
                    font-family: monospace;
                }
                .status-badge {
                    margin-top: 2px;
                    font-size: 7px;
                    font-weight: 950;
                    text-align: center;
                    border: 1px solid;
                    border-radius: 2px;
                    padding: 1px 0;
                    background: rgba(0,0,0,0.2);
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
};
