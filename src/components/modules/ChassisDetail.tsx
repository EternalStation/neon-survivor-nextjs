import React from 'react';
import type { GameState, PlayerClass } from '../../logic/core/Types';
import { calculateMeteoriteEfficiency } from '../../logic/upgrades/EfficiencyLogic';
import { getMeteoriteImage } from './ModuleUtils';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';
import './ChassisDetail.css';

interface ChassisDetailProps {
    gameState: GameState;
    playerClass: PlayerClass;
    onClose: () => void;
}

export const ChassisDetail: React.FC<ChassisDetailProps> = ({ gameState, playerClass, onClose }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const tChassis = t.chassisDetail;
    const tClass = (t.classSelection.classes as any)[playerClass.id] || playerClass;

    // Resinance Calculation for Center Slot
    // The center slot (index -1 logic in HexGrid) connects to the FIRST 6 diamonds (inner ring)
    const connectedDiamondIdxs = [0, 1, 2, 3, 4, 5];

    const individualBoosts = connectedDiamondIdxs.map(dIdx => {
        const item = gameState.moduleSockets.diamonds[dIdx];
        if (!item) return 0;
        return calculateMeteoriteEfficiency(gameState, dIdx).totalBoost;
    });

    const chassisBonus = gameState.chassisResonanceBonus || 0;
    const totalResonance = individualBoosts.reduce((acc, b) => acc + b, 0) + chassisBonus;

    return (
        <div className="chassis-detail-overlay" onClick={onClose}>
            <div className="chassis-detail-modal" onClick={e => e.stopPropagation()} style={{ '--accent-color': playerClass.icon } as any}>

                {/* Close Button */}
                <button className="chassis-close-btn" onClick={onClose}>×</button>

                {/* Header Section */}
                <div className="chassis-header">
                    <div className="chassis-icon-container center-class-icon" style={playerClass.iconUrl ? { background: 'none', border: 'none', boxShadow: 'none' } : {}}>
                        {playerClass.iconUrl ? (
                            <img src={playerClass.iconUrl} alt="chassis-icon" className="chassis-header-icon" style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div className="chassis-icon-placeholder" style={{ background: playerClass.icon }} />
                        )}
                    </div>
                    <div className="chassis-title-group">
                        <span className="chassis-subtitle">{tClass.title || playerClass.title}</span>
                        <h1 className="chassis-name">{(tClass.name || playerClass.name).toUpperCase()}</h1>
                    </div>

                </div>

                <div className="chassis-content">
                    <div className="chassis-column-left">
                        <section className="chassis-section capability-section">
                            <h3 className="capability-name" style={{ color: playerClass.themeColor }}>{(tClass.capabilityName || playerClass.capabilityName).toUpperCase()}</h3>
                            <p className="capability-desc">{tClass.capabilityDesc || playerClass.capabilityDesc}</p>
                        </section>

                        <section className="chassis-section">
                            <h2 className="section-header">{tChassis.tacticalCharacteristics}</h2>
                            <ul className="characteristics-list">
                                {(tClass.characteristics || playerClass.characteristics).map((c: string, i: number) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="chassis-section resonance-section">
                            <h2 className="section-header">{tChassis.resonanceSynergy}</h2>
                            <div className="resonance-grid">
                                {connectedDiamondIdxs.map((dIdx, i) => {
                                    const item = gameState.moduleSockets.diamonds[dIdx];
                                    const boost = individualBoosts[i];
                                    return (
                                        <div key={i} className={`resonance-slot ${item ? 'active' : 'empty'}`}>
                                            {item ? (
                                                <>
                                                    <img
                                                        src={getMeteoriteImage(item)}
                                                        alt="met"
                                                        className="resonance-icon"
                                                    />
                                                    <span className="resonance-value">+{Math.round(boost * 100)}%</span>
                                                </>
                                            ) : (
                                                <div className="resonance-placeholder" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {chassisBonus > 0 && (
                                <div className="resonance-footer" style={{ color: '#a855f7', borderTop: 'none', paddingTop: 0 }}>
                                    <span className="label">[DEBUG] Resonance Bonus</span>
                                    <span className="value">+{Math.round(chassisBonus * 100)}%</span>
                                </div>
                            )}
                            <div className="resonance-footer">
                                <span className="label">{tChassis.totalOctaveResonance}</span>
                                <span className="value">+{Math.round(totalResonance * 100)}%</span>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Skills & Metrics */}
                    <div className="chassis-column-right">


                        <section className="chassis-section metrics-section">
                            <h2 className="section-header">{tChassis.performanceMetrics}</h2>
                            <div className="metrics-list">
                                {playerClass.capabilityMetrics.map((m, i) => {
                                    const metricLabel = tClass.metrics?.[i]?.label || m.label;
                                    return (
                                        <div key={i} className="metric-item">
                                            <div className="metric-row">
                                                <div className="metric-base-group">
                                                    <span className="metric-base-val">{m.value}{m.unit}</span>
                                                    <span className="metric-label">{metricLabel}</span>
                                                </div>
                                                <div className="metric-calculation">
                                                    {m.isStatic && (
                                                        <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                                    )}
                                                    {m.isResonant && (
                                                        <span className="final-val" style={{ color: playerClass.icon, textShadow: `0 0 10px ${playerClass.icon}33` }}>
                                                            +{Math.round(totalResonance * 100)}% | <span style={{ color: '#ffffff', textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}>{Number((m.value * (1 + totalResonance)).toFixed(2))}{m.unit}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="chassis-section metrics-section">
                            <h2 className="section-header">{tChassis.baseModifiers}</h2>
                            <div className="metrics-list">
                                {playerClass.stats.dmgMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.dmgMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.dmgMult > 0 ? '+' : ''}{Math.round(playerClass.stats.dmgMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.damage}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.atkMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.atkMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.atkMult > 0 ? '+' : ''}{Math.round(playerClass.stats.atkMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.attackSpeed}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.xpMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.xpMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.xpMult > 0 ? '+' : ''}{Math.round(playerClass.stats.xpMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.expGain}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.regMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.regMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.regMult > 0 ? '+' : ''}{Math.round(playerClass.stats.regMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.hpRegen}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.hpMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.hpMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.hpMult > 0 ? '+' : ''}{Math.round(playerClass.stats.hpMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.maxHp}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.armMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.armMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.armMult > 0 ? '+' : ''}{Math.round(playerClass.stats.armMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.armor}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.spdMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.spdMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.spdMult > 0 ? '+' : ''}{Math.round(playerClass.stats.spdMult * 100)}%
                                                </span>
                                                <span className="metric-label">{tChassis.stats.moveSpeed}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {playerClass.stats.pierce && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className="final-val positive">
                                                    +{playerClass.stats.pierce}
                                                </span>
                                                <span className="metric-label">{tChassis.stats.pierce}</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>{tChassis.static}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>


            </div>
        </div>
    );
};
