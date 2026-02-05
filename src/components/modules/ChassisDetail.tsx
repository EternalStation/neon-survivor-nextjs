import React from 'react';
import type { GameState, PlayerClass } from '../../logic/types';
import { calculateMeteoriteEfficiency } from '../../logic/EfficiencyLogic';
import './ChassisDetail.css';

interface ChassisDetailProps {
    gameState: GameState;
    playerClass: PlayerClass;
    onClose: () => void;
}

export const ChassisDetail: React.FC<ChassisDetailProps> = ({ gameState, playerClass, onClose }) => {
    // Resinance Calculation for Center Slot
    // The center slot (index -1 logic in HexGrid) connects to the FIRST 6 diamonds (inner ring)
    const connectedDiamondIdxs = [0, 1, 2, 3, 4, 5];

    const individualBoosts = connectedDiamondIdxs.map(dIdx => {
        const item = gameState.moduleSockets.diamonds[dIdx];
        if (!item) return 0;
        return calculateMeteoriteEfficiency(gameState, dIdx).totalBoost;
    });

    const totalResonance = individualBoosts.reduce((acc, b) => acc + b, 0);
    const multiplier = 1 + totalResonance;

    return (
        <div className="chassis-detail-overlay" onClick={onClose}>
            <div className="chassis-detail-modal" onClick={e => e.stopPropagation()} style={{ '--accent-color': playerClass.icon } as any}>

                {/* Close Button */}
                <button className="chassis-close-btn" onClick={onClose}>×</button>

                {/* Header Section */}
                <div className="chassis-header">
                    <div className="chassis-icon-container" style={playerClass.iconUrl ? { background: 'none', border: 'none', boxShadow: 'none' } : {}}>
                        {playerClass.iconUrl ? (
                            <img src={playerClass.iconUrl} alt="chassis-icon" className="chassis-header-icon" style={{ width: '100%', height: '100%' }} />
                        ) : (
                            <div className="chassis-icon-placeholder" style={{ background: playerClass.icon }} />
                        )}
                    </div>
                    <div className="chassis-title-group">
                        <span className="chassis-subtitle">{playerClass.title}</span>
                        <h1 className="chassis-name">{playerClass.name.toUpperCase()}</h1>
                    </div>

                </div>

                <div className="chassis-content">
                    {/* Left Column: Lore & Characteristics */}
                    <div className="chassis-column-left">
                        <section className="chassis-section lore-section">
                            <h2 className="section-header">NEURAL DATA LOG</h2>
                            <p className="lore-text">{playerClass.lore}</p>
                        </section>

                        <section className="chassis-section">
                            <h2 className="section-header">TACTICAL CHARACTERISTICS</h2>
                            <ul className="characteristics-list">
                                {playerClass.characteristics.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </section>

                        <section className="chassis-section resonance-section">
                            <h2 className="section-header">RESONANCE SYNERGY</h2>
                            <div className="resonance-grid">
                                {connectedDiamondIdxs.map((dIdx, i) => {
                                    const item = gameState.moduleSockets.diamonds[dIdx];
                                    const boost = individualBoosts[i];
                                    return (
                                        <div key={i} className={`resonance-slot ${item ? 'active' : 'empty'}`}>
                                            {item ? (
                                                <>
                                                    <img
                                                        src={`/assets/meteorites/M${item.visualIndex}${item.quality}.png`}
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
                            <div className="resonance-footer">
                                <span className="label">TOTAL OCTAVE RESONANCE:</span>
                                <span className="value">+{Math.round(totalResonance * 100)}%</span>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Skills & Metrics */}
                    <div className="chassis-column-right">
                        <section className="chassis-section capability-section">
                            <h2 className="section-header">PRIMARY AUGMENTATION</h2>
                            <h3 className="capability-name">{playerClass.capabilityName.toUpperCase()}</h3>
                            <p className="capability-desc">{playerClass.capabilityDesc}</p>
                        </section>

                        <section className="chassis-section metrics-section">
                            <h2 className="section-header">PERFORMANCE METRICS</h2>
                            <div className="metrics-list">
                                {playerClass.capabilityMetrics
                                    .map((m, i) => {
                                        // Static metrics explicitly marked or non-percentage stay as is
                                        const isStatic = m.isStatic || !m.isPercentage;

                                        // Only multiply non-static percentage-based metrics
                                        const finalValue = (m.isPercentage && !m.isStatic)
                                            ? m.value * multiplier
                                            : m.value;

                                        return (
                                            <div key={i} className="metric-item">
                                                <div className="metric-row">
                                                    <div className="metric-base-group">
                                                        <span className="metric-base-val">{m.value}{m.unit}</span>
                                                        <span className="metric-label">{m.label}</span>
                                                    </div>
                                                    {!isStatic ? (
                                                        <div className="metric-calculation">
                                                            <span className="multiplier-sym">×</span>
                                                            <span className="res-mult">{multiplier.toFixed(2)}</span>
                                                            <div className="metric-divider">|</div>
                                                            <span className="final-val">{finalValue.toFixed(0)}{m.unit}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="metric-calculation">
                                                            <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </section>

                        <section className="chassis-section metrics-section">
                            <h2 className="section-header">BASE MODIFIERS</h2>
                            <div className="metrics-list">
                                {playerClass.stats.dmgMult && (
                                    <div className="metric-item">
                                        <div className="metric-row">
                                            <div className="metric-base-group">
                                                <span className={`final-val ${playerClass.stats.dmgMult > 0 ? 'positive' : 'negative'}`}>
                                                    {playerClass.stats.dmgMult > 0 ? '+' : ''}{Math.round(playerClass.stats.dmgMult * 100)}%
                                                </span>
                                                <span className="metric-label">DAMAGE</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">ATTACK SPEED</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">XP GAIN</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">REGEN</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">MAX HP</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">ARMOR</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">MOVEMENT SPEED</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
                                                <span className="metric-label">PIERCE</span>
                                            </div>
                                            <div className="metric-calculation">
                                                <span className="final-val" style={{ color: '#94a3b8' }}>STATIC</span>
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
