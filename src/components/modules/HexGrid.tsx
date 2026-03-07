import React, { useState } from 'react';
import type { GameState, LegendaryHex, PlayerClass } from '../../logic/core/types';
import { calculateMeteoriteEfficiency, getSector } from '../../logic/upgrades/EfficiencyLogic';
import { getHexPoints, getMeteoriteImage, getLegendaryInfo, findClosestVertices, RARITY_COLORS, getMeteoriteColor } from './ModuleUtils';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';
import { BestiaryView } from './BestiaryView';
import { useEffect, useRef } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

import type { BestiaryEntry } from '../../data/BestiaryData';
import { FusionMenu } from './FusionMenu';
import { playSfx } from '../../logic/audio/AudioLogic';
import * as MergeLogic from '../../logic/upgrades/LegendaryMergeLogic';
import { LEGENDARY_UPGRADES } from '../../logic/upgrades/LegendaryLogic';

export const FUSIONS = [
    { id: 'XenoAlchemist', result: 'XenoAlchemist', bases: ['EcoXP', 'DefPuddle'], perform: MergeLogic.performXenoAlchemistMerge },
    { id: 'IrradiatedMire', result: 'IrradiatedMire', bases: ['DefPuddle', 'RadiationCore'], perform: MergeLogic.performIrradiatedMireMerge },
    { id: 'NeuralSingularity', result: 'NeuralSingularity', bases: ['EcoXP', 'ComWave'], perform: MergeLogic.performNeuralSingularityMerge },
    { id: 'KineticTsunami', result: 'KineticTsunami', bases: ['EcoDMG', 'ComWave'], perform: MergeLogic.performKineticTsunamiMerge },
    { id: 'SoulShatterCore', result: 'SoulShatterCore', bases: ['ComCrit', 'EcoDMG'], perform: MergeLogic.performSoulShatterCoreMerge },
    { id: 'BloodForgedCapacitor', result: 'BloodForgedCapacitor', bases: ['ComLife', 'KineticBattery'], perform: MergeLogic.performBloodForgedCapacitorMerge },
    { id: 'GravityAnchor', result: 'GravityAnchor', bases: ['CombShield', 'DefEpi'], perform: MergeLogic.performGravityAnchorMerge },
    { id: 'TemporalMonolith', result: 'TemporalMonolith', bases: ['CombShield', 'ChronoPlating'], perform: MergeLogic.performTemporalMonolithMerge },
    { id: 'NeutronStar', result: 'NeutronStar', bases: ['EcoHP', 'RadiationCore'], perform: MergeLogic.performNeutronStarMerge },
    { id: 'GravitationalHarvest', result: 'GravitationalHarvest', bases: ['EcoHP', 'DefEpi'], perform: MergeLogic.performGravitationalHarvestMerge },
    { id: 'ShatteredCapacitor', result: 'ShatteredCapacitor', bases: ['ComCrit', 'KineticBattery'], perform: MergeLogic.performShatteredCapacitorMerge },
    { id: 'ChronoDevourer', result: 'ChronoDevourer', bases: ['ComLife', 'ChronoPlating'], perform: MergeLogic.performChronoDevourerMerge },
    { id: 'VitalMire', result: 'VitalMire', bases: ['EcoHP', 'DefPuddle'], perform: MergeLogic.performVitalMireMerge }
];

interface HexGridProps {
    gameState: GameState;
    movedItem: { item: any, source: string, index: number } | null;
    onSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => void;
    onInventoryUpdate: (index: number, item: any) => void;
    setMovedItem: (item: { item: any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null) => void;
    setHoveredItem: (item: { item: any, x: number, y: number, index?: number } | null) => void;
    setLockedItem: (item: { item: any, x: number, y: number, index?: number } | null) => void;
    handleMouseEnterItem: (item: any, x: number, y: number, index?: number) => void;
    handleMouseLeaveItem: (delay?: number) => void;

    setHoveredHex: (hex: { hex: LegendaryHex, index: number, x: number, y: number } | null) => void;
    onShowClassDetail: (playerClass: PlayerClass) => void;
    onAttemptRemove: (index: number, item: any, replaceWith?: any) => void;
    onAttemptPlace: (index: number, item: any, source: string, sourceIndex: number) => void;
    selectedBestiaryEnemy?: BestiaryEntry | null;
    onSelectBestiaryEnemy?: (enemy: BestiaryEntry | null) => void;
    onUpdate?: () => void;
}

import { EfficiencyLabel } from './EfficiencyLabel';

export const HexGrid: React.FC<HexGridProps> = ({
    gameState,
    movedItem,
    onSocketUpdate,
    onInventoryUpdate,
    setMovedItem,
    setHoveredItem,
    setLockedItem,
    handleMouseEnterItem,
    handleMouseLeaveItem,
    setHoveredHex,
    onShowClassDetail,
    onAttemptRemove,
    onAttemptPlace,
    selectedBestiaryEnemy,
    onSelectBestiaryEnemy,
    onUpdate
}) => {
    const [view, setView] = useState<'matrix' | 'bestiary' | 'fusions'>('matrix');
    const [fusionFocus, setFusionFocus] = useState<string | undefined>();
    const [levitatingDiamonds, setLevitatingDiamonds] = useState<Record<number, boolean>>({});
    const [time, setTime] = useState(0);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = (t: number) => {
            setTime(t * 0.001); // seconds
            frameRef.current = requestAnimationFrame(animate);
        };
        const handle = requestAnimationFrame(animate);
        frameRef.current = handle;
        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, []);

    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const { moduleSockets } = gameState;
    const centerX = 432; // Centered in 45% of 1920 (864px wide)
    const centerY = 540; // True Vertical Centering
    const innerRadius = 170;
    const outerRadius = 260;
    const edgeRadius = 350;

    const INACTIVE_STROKE = "rgba(74, 85, 104, 0.2)";

    const level4Hexes = new Set<string>();
    moduleSockets.hexagons.forEach((hex: any) => {
        if (hex && hex.level >= 4) {
            level4Hexes.add(hex.type);
        }
    });

    const activeConnections = {
        diamonds: new Set<number>(),
        hexagons: new Set<number>(),
        sectors: new Set<string>()
    };

    const isRecentlyBoosted = (i: number) => {
        const lp = gameState.lastPlacement;
        if (!lp || (Date.now() - lp.timestamp) > 1000) return false;
        if (lp.type === 'diamond' && lp.index === i) return false;

        const eff = meteoriteEfficiencies[i];
        if (!eff) return false;

        return Object.values(eff.perkResults).some((pr: any) => {
            if (!pr.connections) return false;
            if (lp.type === 'diamond') return pr.connections.diamonds.includes(lp.index);
            if (lp.type === 'hex') return pr.connections.hexagons.includes(lp.index);
            return false;
        });
    };

    // Pre-calculate all efficiencies and connections
    const meteoriteEfficiencies = Array.from({ length: 12 }).map((_, i) => {
        if (!moduleSockets.diamonds[i]) return null;
        const result = calculateMeteoriteEfficiency(gameState, i);
        Object.values(result.perkResults).forEach((pr: any) => {
            if (pr.connections) {
                pr.connections.diamonds.forEach((d: number) => activeConnections.diamonds.add(d));
                pr.connections.hexagons.forEach((h: number) => activeConnections.hexagons.add(h));
                pr.connections.sectors.forEach((s: string) => activeConnections.sectors.add(s));
            }
        });
        return result;
    });

    const hexPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i;
        const pos = { x: centerX + outerRadius * Math.cos(angle), y: centerY + outerRadius * Math.sin(angle) };
        const vertices = Array.from({ length: 6 }).map((_, vIdx) => {
            const vAngle = (Math.PI / 3) * vIdx - Math.PI / 2;
            return { x: pos.x + 60 * Math.cos(vAngle), y: pos.y + 60 * Math.sin(vAngle) };
        });
        return { ...pos, vertices };
    });

    const innerDiamondPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const pos = { x: centerX + innerRadius * Math.cos(angle), y: centerY + innerRadius * Math.sin(angle) };
        const vertices = [
            { x: 40, y: 0 },
            { x: 0, y: 40 },
            { x: -40, y: 0 },
            { x: 0, y: -40 }
        ].map(v => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: pos.x + (v.x * cos - v.y * sin),
                y: pos.y + (v.x * sin + v.y * cos)
            };
        });
        return { ...pos, vertices, angle };
    });

    const edgeDiamondPositions = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        const pos = { x: centerX + edgeRadius * Math.cos(angle), y: centerY + edgeRadius * Math.sin(angle) };
        const vertices = [
            { x: 40, y: 0 },
            { x: 0, y: 40 },
            { x: -40, y: 0 },
            { x: 0, y: -40 }
        ].map(v => {
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            return {
                x: pos.x + (v.x * cos - v.y * sin),
                y: pos.y + (v.x * sin + v.y * cos)
            };
        });
        return { ...pos, vertices, angle };
    });

    const centerSideMidpoints = Array.from({ length: 6 }).map((_, i) => {
        const angle = (Math.PI / 3) * i + Math.PI / 6;
        return { x: centerX + 69.28 * Math.cos(angle), y: centerY + 69.28 * Math.sin(angle) };
    });
    const allDiamondPositions = [...innerDiamondPositions, ...edgeDiamondPositions];

    // If bestiary view is active, render it instead
    if (view === 'bestiary') {
        return (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <BestiaryView
                    gameState={gameState}
                    selectedEnemy={selectedBestiaryEnemy}
                    onSelectEnemy={onSelectBestiaryEnemy}
                />
                <div
                    onClick={() => setView('matrix')}
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 50,
                        background: 'rgba(5, 5, 15, 0.9)',
                        border: '1px solid #22d3ee',
                        color: '#22d3ee',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.2)',
                        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                        transition: 'all 0.2s ease-out'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(34, 211, 238, 0.4)';
                        e.currentTarget.style.background = 'rgba(34, 211, 238, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(34, 211, 238, 0.2)';
                        e.currentTarget.style.background = 'rgba(5, 5, 15, 0.9)';
                    }}
                >
                    {t.matrix.backToMatrix}
                </div>
            </div>
        );
    }

    // If fusions view is active, render it
    if (view === 'fusions') {
        return (
            <FusionMenu
                gameState={gameState}
                onClose={() => { setView('matrix'); setFusionFocus(undefined); }}
                initialHighlightType={fusionFocus}
                onUpdate={onUpdate}
            />
        );
    }

    const isSocketActive = (item: any) => {
        if (!item) return false;
        if (item.status && item.status !== 'active' && item.status !== 'ready') return false;
        if (item.isRuined) return false;
        return true;
    };

    const getMetColor = (met: any) => {
        if (!met) return "#4A5568";
        // Map rarity safely (case-insensitive for UI robustness)
        const rawRarity = met.rarity || 'Common';
        const rKey = Object.keys(RARITY_COLORS).find(k => k.toLowerCase() === rawRarity.toLowerCase());
        return (rKey && RARITY_COLORS[rKey]) || "#4A5568";
    };

    const getHexColors = (hex: any) => {
        if (!hex) return ["#4A5568"];
        const colors: string[] = [];
        const cats = hex.categories || [hex.category];
        cats.forEach((cat: string) => {
            if (cat === 'Economic') colors.push('#fbbf24');
            else if (cat === 'Combat') colors.push('#ef4444');
            else if (cat === 'Defensive') colors.push('#3b82f6');
        });
        if (colors.length === 0) colors.push('#4A5568');
        return colors;
    };

    const makeVineBundle = (x1: number, y1: number, x2: number, y2: number, seed: number = 0, colors: string[] = ["#EF4444"]) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / dist || 0;
        const ny = dx / dist || 0;

        const strands = [];

        // Stable, smooth snake-like strands
        for (let i = 0; i < 4; i++) {
            // Use deterministic wave patterns instead of random
            const phase = i * 1.5 + seed;
            const freq = 1.2 + i * 0.4;
            const amp = 12 + i * 4;

            // Time-based oscillation for "breathing" / "snake" movement
            const wiggle1 = Math.sin(time * freq + phase) * amp;
            const wiggle2 = Math.cos(time * freq * 0.8 + phase * 1.2) * amp;

            // Control points with smooth wiggle
            const cp1x = x1 + dx * 0.3 + nx * wiggle1;
            const cp1y = y1 + dy * 0.3 + ny * wiggle1;
            const cp2x = x1 + dx * 0.7 + nx * wiggle2;
            const cp2y = y1 + dy * 0.7 + ny * wiggle2;

            // Slightly offset start/end for fiber look
            const startOff = Math.sin(phase) * 3;
            const endOff = Math.cos(phase * 1.5) * 3;

            strands.push({
                d: `M ${x1 + nx * startOff} ${y1 + ny * startOff} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2 + nx * endOff} ${y2 + ny * endOff}`,
                opacity: 0.2 + (i % 3) * 0.15,
                width: 1.2 + (i % 2) * 1.2,
                color: colors[i % colors.length]
            });
        }

        return strands;
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* BOTTOM RIGHT CONTROLS */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                display: 'flex',
                gap: '16px',
                zIndex: 10
            }}>
                {/* FUSIONS BUTTON */}
                <button
                    onClick={() => {
                        setView('fusions');
                        playSfx('ui-click');
                    }}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(45deg, #1e293b, #0f172a)',
                        border: '2px solid #38bdf8',
                        borderRadius: '6px',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 950,
                        letterSpacing: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textTransform: 'uppercase',
                        boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
                        fontFamily: 'Orbitron, sans-serif'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(56, 189, 248, 0.6)';
                        e.currentTarget.style.background = 'linear-gradient(45deg, #0f172a, #1e293b)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.4)';
                        e.currentTarget.style.background = 'linear-gradient(45deg, #1e293b, #0f172a)';
                    }}
                >
                    FUSIONS
                </button>

                {/* BESTIARY BUTTON */}
                <button
                    onClick={() => setView('bestiary')}
                    style={{
                        padding: '12px 24px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '2px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 900,
                        letterSpacing: '1px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.boxShadow = '0 0 30px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
                    }}
                >
                    {t.matrix.viewBestiary}
                </button>
            </div>
            <svg width="100%" height="100%" viewBox="0 0 864 1080">
                <text x={centerX} y={centerY - 485} textAnchor="middle" fill="#22d3ee" fontSize="38" fontWeight="900" style={{ letterSpacing: '10px', opacity: 0.9 }}>{t.matrix.title}</text>
                <text x={centerX} y={centerY - 455} textAnchor="middle" fill="#94a3b8" fontSize="11" style={{ letterSpacing: '1.5px', opacity: 0.6 }}>{t.matrix.synergyText}</text>
                <line x1={centerX - 300} y1={centerY - 445} x2={centerX + 300} y2={centerY - 445} stroke="#22d3ee" strokeWidth="1" opacity="0.2" />

                {/* SECTORS BACKGROUND (Integrated Pods) */}
                <g className="sectors-bg" style={{ pointerEvents: 'none' }}>
                    {[
                        { name: t.matrix.sector02, code: 'SEC-02', color: '#c084fc', indices: [0, 1] }, // Combat - Purple
                        { name: t.matrix.sector03, code: 'SEC-03', color: '#a855f7', indices: [2, 3] }, // Defensive - Deep Purple
                        { name: t.matrix.sector01, code: 'SEC-01', color: '#e9d5ff', indices: [4, 5] }  // Economic - Light Purple
                    ].map((sector, sIdx) => {
                        const idx0 = sector.indices[0];
                        const idx1 = sector.indices[1];

                        const i0 = innerDiamondPositions[idx0];
                        const i1 = innerDiamondPositions[idx1];
                        const o0 = edgeDiamondPositions[idx0];
                        const o1 = edgeDiamondPositions[idx1];

                        // Sector area points
                        const points = `${o0.x},${o0.y} ${o1.x},${o1.y} ${i1.x},${i1.y} ${i0.x},${i0.y}`;

                        // Text positioning (Placed just on the outer edge)
                        const midOutX = (o0.x + o1.x) / 2;
                        const midOutY = (o0.y + o1.y) / 2;
                        const vOutX = midOutX - centerX;
                        const vOutY = midOutY - centerY;
                        const lenOut = Math.sqrt(vOutX * vOutX + vOutY * vOutY);
                        const textR = 400;
                        const textX = centerX + (vOutX / lenOut) * textR;
                        const textY = centerY + (vOutY / lenOut) * textR;

                        const edgeAngle = Math.atan2(o1.y - o0.y, o1.x - o0.x) * (180 / Math.PI);
                        const rotation = (sector.code === 'SEC-02') ? edgeAngle + 180 : edgeAngle;
                        const targetSector: 'Economic' | 'Combat' | 'Defensive' = sector.code === 'SEC-01' ? 'Economic' : (sector.code === 'SEC-02' ? 'Combat' : 'Defensive');

                        const lp = gameState.lastPlacement;
                        const isRecentlyPlacedInSector = lp && lp.type === 'diamond' && getSector(lp.index) === targetSector && (Date.now() - lp.timestamp) < 1000;

                        return (
                            <g key={sIdx}>
                                {/* Encompassing Area Pod (Solid Low Opacity) */}
                                <polygon
                                    points={points}
                                    fill={sector.color}
                                    opacity="0.08"
                                    stroke={sector.color}
                                    strokeWidth="90"
                                    strokeLinejoin="round"
                                />

                                {/* Premium Tactical Typography (Just Outside Edge) */}
                                <g transform={`rotate(${rotation}, ${textX}, ${textY})`}>
                                    {/* Small Code Label */}
                                    <text x={textX - 70} y={textY - 14} fill={sector.color} fontSize="8" fontWeight="900" style={{ letterSpacing: '1px', opacity: 0.6 }}>
                                        {sector.code}
                                    </text>

                                    <text
                                        x={textX}
                                        y={textY}
                                        textAnchor="middle"
                                        fill={sector.color}
                                        fontSize="14"
                                        fontWeight="900"
                                        style={{
                                            opacity: 0.9,
                                            letterSpacing: '4px',
                                            textShadow: `0 0 15px ${sector.color}`,
                                            filter: 'brightness(1.2)'
                                        }}
                                    >
                                        {sector.name}
                                    </text>

                                    {/* The "Line Underneath" */}
                                    <line
                                        x1={textX - 60} y1={textY + 12} x2={textX + 60} y2={textY + 12}
                                        stroke={sector.color} strokeWidth="1.5" opacity="0.5"
                                    />
                                </g>
                            </g>
                        );
                    })}
                </g>

                {/* 2. MS LINES (Met-Met) */}
                {/* 2.1 Inner-Inner Adjacent (6) */}
                {innerDiamondPositions.map((pos, i) => {
                    const nextIdx = (i + 1) % 6;
                    const nextPos = innerDiamondPositions[nextIdx];
                    const met1 = moduleSockets.diamonds[i];
                    const met2 = moduleSockets.diamonds[nextIdx];
                    const active = isSocketActive(met1) && isSocketActive(met2);
                    if (!active) return null;

                    const eff1 = meteoriteEfficiencies[i];
                    const eff2 = meteoriteEfficiencies[nextIdx];
                    const isPowered = (eff1?.totalBoost || 0) > 0 && (eff2?.totalBoost || 0) > 0;

                    const colors = isPowered ? [getMetColor(met1), getMetColor(met2)] : ["#4A5568"];

                    return (
                        <g key={`ms-ii-adj-group-${i}`}>
                            {makeVineBundle(pos.x, pos.y, nextPos.x, nextPos.y, i * 10, colors).map((strand, sIdx) => (
                                <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity}
                                    className={isPowered ? "synergy-trail" : ""}
                                    style={{ color: strand.color }} />
                            ))}
                        </g>
                    );
                })}
                {/* 2.3 Inner-Outer Radial (6) */}
                {edgeDiamondPositions.map((ePos, i) => {
                    const iPos = innerDiamondPositions[i];
                    const metOuter = moduleSockets.diamonds[i + 6];
                    const metInner = moduleSockets.diamonds[i];
                    const active = isSocketActive(metOuter) && isSocketActive(metInner);
                    if (!active) return null;

                    const effOuter = meteoriteEfficiencies[i + 6];
                    const effInner = meteoriteEfficiencies[i];
                    const isPowered = (effOuter?.totalBoost || 0) > 0 && (effInner?.totalBoost || 0) > 0;

                    const colors = isPowered ? [getMetColor(metOuter), getMetColor(metInner)] : ["#4A5568"];

                    return (
                        <g key={`ms-io-rad-group-${i}`}>
                            {makeVineBundle(ePos.x, ePos.y, iPos.x, iPos.y, i * 20 + 50, colors).map((strand, sIdx) => (
                                <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity}
                                    className={isPowered ? "synergy-trail" : ""}
                                    style={{ color: strand.color }} />
                            ))}
                        </g>
                    );
                })}

                {/* 3. XMS LINES (Hex-Met) */}
                {/* 3.1 Center-Inner Perpendicular (6) */}
                {innerDiamondPositions.map((pos, i) => {
                    const centerClass = gameState.moduleSockets.center;
                    const met = moduleSockets.diamonds[i];
                    const active = isSocketActive(centerClass) && isSocketActive(met);
                    if (!active || !centerClass) return null;

                    const pMet = meteoriteEfficiencies[i];
                    const isPowered = (pMet?.totalBoost || 0) > 0;

                    const colors = isPowered ? [centerClass.themeColor || "#6366F1", getMetColor(met)] : ["#4A5568"];

                    return (
                        <g key={`xms-ci-perp-group-${i}`}>
                            {makeVineBundle(centerSideMidpoints[i].x, centerSideMidpoints[i].y, pos.x, pos.y, i * 5 + 100, colors).map((strand, sIdx) => (
                                <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity}
                                    className={isPowered ? "synergy-trail" : ""}
                                    style={{ color: strand.color }} />
                            ))}
                        </g>
                    );
                })}
                {/* 3.2 OuterHex-InnerMet (12) */}
                {hexPositions.map((hPos, i) => {
                    const dIdx1 = i;
                    const dIdx2 = (i + 5) % 6;
                    const hex = moduleSockets.hexagons[i];
                    const met1 = moduleSockets.diamonds[dIdx1];
                    const met2 = moduleSockets.diamonds[dIdx2];
                    const active1 = isSocketActive(hex) && isSocketActive(met1);
                    const active2 = isSocketActive(hex) && isSocketActive(met2);
                    const pair1 = findClosestVertices(hPos.vertices, [innerDiamondPositions[dIdx1]]);
                    const pair2 = findClosestVertices(hPos.vertices, [innerDiamondPositions[dIdx2]]);

                    const eff1 = meteoriteEfficiencies[dIdx1];
                    const eff2 = meteoriteEfficiencies[dIdx2];
                    const isPowered1 = (eff1?.totalBoost || 0) > 0;
                    const isPowered2 = (eff2?.totalBoost || 0) > 0;

                    const colors1 = isPowered1 ? [...getHexColors(hex), getMetColor(met1)] : ["#4A5568"];
                    const colors2 = isPowered2 ? [...getHexColors(hex), getMetColor(met2)] : ["#4A5568"];

                    const elems = [];
                    if (active1) {
                        elems.push(
                            <g key={`xms-hi-group-${i}-1`}>
                                {makeVineBundle(pair1.v1.x, pair1.v1.y, pair1.v2.x, pair1.v2.y, i * 3, colors1).map((strand, sIdx) => (
                                    <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity * 0.7}
                                        className={isPowered1 ? "synergy-trail" : ""}
                                        style={{ color: strand.color }} />
                                ))}
                            </g>
                        );
                    }
                    if (active2) {
                        elems.push(
                            <g key={`xms-hi-group-${i}-2`}>
                                {makeVineBundle(pair2.v1.x, pair2.v1.y, pair2.v2.x, pair2.v2.y, i * 7 + 10, colors2).map((strand, sIdx) => (
                                    <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity * 0.7}
                                        className={isPowered2 ? "synergy-trail" : ""}
                                        style={{ color: strand.color }} />
                                ))}
                            </g>
                        );
                    }
                    return elems.length > 0 ? elems : null;
                })}
                {/* 3.3 OuterHex-EdgeMet (12) */}
                {hexPositions.map((hPos, i) => {
                    const eIdx1 = i;
                    const eIdx2 = (i + 5) % 6;
                    const hex = moduleSockets.hexagons[i];
                    const met1 = moduleSockets.diamonds[eIdx1 + 6];
                    const met2 = moduleSockets.diamonds[eIdx2 + 6];
                    const active1 = isSocketActive(hex) && isSocketActive(met1);
                    const active2 = isSocketActive(hex) && isSocketActive(met2);
                    const pair1 = findClosestVertices(hPos.vertices, [edgeDiamondPositions[eIdx1]]);
                    const pair2 = findClosestVertices(hPos.vertices, [edgeDiamondPositions[eIdx2]]);

                    const eff1 = meteoriteEfficiencies[eIdx1 + 6];
                    const eff2 = meteoriteEfficiencies[eIdx2 + 6];
                    const isPowered1 = (eff1?.totalBoost || 0) > 0;
                    const isPowered2 = (eff2?.totalBoost || 0) > 0;

                    const colors1 = isPowered1 ? [...getHexColors(hex), getMetColor(met1)] : ["#4A5568"];
                    const colors2 = isPowered2 ? [...getHexColors(hex), getMetColor(met2)] : ["#4A5568"];

                    const elems = [];
                    if (active1) {
                        elems.push(
                            <g key={`xms-he-group-${i}-1`}>
                                {makeVineBundle(pair1.v1.x, pair1.v1.y, pair1.v2.x, pair1.v2.y, i * 4 + 20, colors1).map((strand, sIdx) => (
                                    <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity * 0.8}
                                        className={isPowered1 ? "synergy-trail" : ""}
                                        style={{ color: strand.color }} />
                                ))}
                            </g>
                        );
                    }
                    if (active2) {
                        elems.push(
                            <g key={`xms-he-group-${i}-2`}>
                                {makeVineBundle(pair2.v1.x, pair2.v1.y, pair2.v2.x, pair2.v2.y, i * 9 + 30, colors2).map((strand, sIdx) => (
                                    <path key={sIdx} d={strand.d} fill="none" stroke={strand.color} strokeWidth={strand.width} opacity={strand.opacity * 0.8}
                                        className={isPowered2 ? "synergy-trail" : ""}
                                        style={{ color: strand.color }} />
                                ))}
                            </g>
                        );
                    }
                    return elems.length > 0 ? elems : null;
                })}

                <defs>
                    <radialGradient id="hp-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#7f1d1d" />
                    </radialGradient>
                    <radialGradient id="socket-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(2, 6, 23, 0.95)" />
                        <stop offset="70%" stopColor="rgba(15, 23, 42, 0.6)" />
                        <stop offset="100%" stopColor="rgba(30, 41, 59, 0.2)" />
                    </radialGradient>
                    <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgb(15, 23, 42)" />
                        <stop offset="100%" stopColor="rgb(2, 6, 23)" />
                    </radialGradient>

                    {/* FUSION GRADIENTS */}
                    <linearGradient id="grad-eco-com" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#fbbf24" />
                        <stop offset="80%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="grad-eco-def" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#fbbf24" />
                        <stop offset="80%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="grad-com-def" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#ef4444" />
                        <stop offset="80%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="grad-com-eco" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#ef4444" />
                        <stop offset="80%" stopColor="#fbbf24" />
                    </linearGradient>
                    <linearGradient id="grad-def-com" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#3b82f6" />
                        <stop offset="80%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="grad-def-eco" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="20%" stopColor="#3b82f6" />
                        <stop offset="80%" stopColor="#fbbf24" />
                    </linearGradient>

                    <filter id="rugged-rim">
                        <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                    </filter>
                </defs>

                <g
                    className="center-class-icon"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        const centerClass = gameState.moduleSockets.center;
                        if (centerClass) {
                            onShowClassDetail(centerClass);
                        }
                    }}
                >
                    {/* Attention Pulse for First-Time Players */}
                    {!gameState.chassisDetailViewed && gameState.tutorial.isActive && gameState.tutorial.currentStep === 18 && (
                        <polygon
                            points={getHexPoints(centerX, centerY, 90)}
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2"
                            className="pulse-attention"
                            pointerEvents="none"
                        />
                    )}

                    {/* Invisible click target for the central hex area */}
                    <polygon
                        points={getHexPoints(centerX, centerY, 80)}
                        fill="transparent"
                        pointerEvents="all"
                    />

                    {!gameState.moduleSockets.center?.iconUrl && (
                        <polygon
                            points={getHexPoints(centerX, centerY, 80)}
                            fill="url(#core-grad)"
                            stroke={gameState.moduleSockets.center ? gameState.moduleSockets.center.icon : "#22d3ee"}
                            strokeWidth="4"
                            className={gameState.moduleSockets.center ? "glow-hex" : "glow-cyan"}
                            style={{ '--hex-color': gameState.moduleSockets.center?.icon } as any}
                            pointerEvents="none"
                        />
                    )}
                    {gameState.moduleSockets.center && (
                        <>
                            {gameState.moduleSockets.center.iconUrl ? (
                                <image
                                    href={gameState.moduleSockets.center.iconUrl}
                                    x={centerX - 80}
                                    y={centerY - 80}
                                    width="160"
                                    height="160"
                                    pointerEvents="none"
                                    style={{ filter: `drop-shadow(0 0 20px ${gameState.moduleSockets.center.icon})` }}
                                />
                            ) : (
                                <>
                                    <text
                                        x={centerX}
                                        y={centerY - 5}
                                        textAnchor="middle"
                                        fill={gameState.moduleSockets.center.icon}
                                        fontSize="24"
                                        fontWeight="900"
                                        style={{ filter: `drop-shadow(0 0 10px ${gameState.moduleSockets.center.icon})`, letterSpacing: '2px' }}
                                        pointerEvents="none"
                                    >
                                        {gameState.moduleSockets.center.name.toUpperCase()}
                                    </text>
                                    <text
                                        x={centerX}
                                        y={centerY + 25}
                                        textAnchor="middle"
                                        fill="#94a3b8"
                                        fontSize="10"
                                        fontWeight="700"
                                        style={{ letterSpacing: '1px' }}
                                        pointerEvents="none"
                                    >
                                        CHASSIS
                                    </text>
                                </>
                            )}
                        </>
                    )}
                </g>

                {hexPositions.map((pos, i) => {
                    const hex = gameState.moduleSockets.hexagons[i];
                    const info = hex ? getLegendaryInfo(hex.category, hex.type) : null;
                    const isHexFusable = hex && hex.level === 4 && FUSIONS.some(f => f.bases.includes(hex.type) && level4Hexes.has(f.bases[0]) && level4Hexes.has(f.bases[1]) && !(gameState.player.consumedLegendaries?.includes(f.bases[0]) || gameState.player.consumedLegendaries?.includes(f.bases[1])));
                    return (
                        <g key={`hex-socket-${i}`}
                            onClick={() => {
                                if (gameState.pendingLegendaryHex && !hex) {
                                    onSocketUpdate('hex', i, { ...gameState.pendingLegendaryHex });
                                } else if (gameState.pendingFusionHex) {
                                    if (gameState.pendingFusionHex.validHexIndices.includes(i)) {
                                        onSocketUpdate('hex', i, { ...gameState.pendingFusionHex.hex });
                                        playSfx('power-up');
                                    }
                                } else if (hex && hex.level === 4) {
                                    setFusionFocus(hex.type);
                                    setView('fusions');
                                    playSfx('ui-click');
                                }
                            }}
                            onMouseMove={(e) => {
                                if (hex && !movedItem && !gameState.pendingFusionHex) {
                                    setHoveredHex({ hex, index: i, x: e.clientX, y: e.clientY });
                                }
                            }}
                            onMouseLeave={() => setHoveredHex(null)}
                            onDragOver={(e) => e.preventDefault()}
                            style={{
                                cursor: (gameState.pendingLegendaryHex && !hex) || (gameState.pendingFusionHex && gameState.pendingFusionHex.validHexIndices.includes(i)) ? 'copy' : (!gameState.pendingFusionHex && !gameState.pendingLegendaryHex && isHexFusable ? 'pointer' : 'default'),
                                opacity: gameState.pendingFusionHex && !gameState.pendingFusionHex.validHexIndices.includes(i) ? 0.3 : 1
                            }}
                        >
                            {(() => {
                                let stroke: string = hex ? info?.color || "rgba(250, 204, 21, 0.5)" : "rgba(250, 204, 21, 0.5)";
                                let glowColor: string = info?.color || '#fbbf24';
                                if (hex && hex.level >= 5) {
                                    const fusion = FUSIONS.find(f => f.result === hex.type);
                                    if (fusion) {
                                        const cat1 = LEGENDARY_UPGRADES[fusion.bases[0]]?.category;
                                        const cat2 = LEGENDARY_UPGRADES[fusion.bases[1]]?.category;
                                        if (cat1 && cat2) {
                                            const c1 = cat1.substring(0, 3).toLowerCase();
                                            const c2 = cat2.substring(0, 3).toLowerCase();
                                            stroke = `url(#grad-${c1}-${c2})`;

                                            // Make glow match the first base component for fusions instead of default purple
                                            const catColors: Record<string, string> = {
                                                Economic: '#fbbf24',
                                                Combat: '#ef4444',
                                                Defensive: '#3b82f6'
                                            };
                                            glowColor = catColors[cat1] || glowColor;
                                        }
                                    }
                                }
                                return (
                                    <>
                                        <polygon
                                            points={getHexPoints(pos.x, pos.y, 60)}
                                            fill="url(#core-grad)"
                                            stroke={stroke}
                                            strokeWidth={hex ? "4" : "2"}
                                            className={hex ? "glow-hex" : "glow-yellow"}
                                            style={{ '--hex-color': glowColor, '--glow-color': glowColor } as any}
                                        />
                                        {hex && (
                                            <g>
                                                {hex.customIcon ? (
                                                    <image
                                                        href={hex.customIcon}
                                                        x={pos.x - 60}
                                                        y={pos.y - 60}
                                                        width="120"
                                                        height="120"
                                                        style={{ imageRendering: 'pixelated', filter: `drop-shadow(0 0 15px ${glowColor}88)` }}
                                                        pointerEvents="none"
                                                    />
                                                ) : (
                                                    <text x={pos.x} y={pos.y - 5} textAnchor="middle" fill={info?.color} fontSize="28" style={{ filter: `drop-shadow(0 0 8px ${info?.color})`, fontWeight: 900 }} pointerEvents="none">
                                                        {info?.icon}
                                                    </text>
                                                )}
                                                <rect x={pos.x - 28} y={pos.y + 40} width="56" height="18" rx="6" fill="rgba(15, 23, 42, 0.95)" stroke={hex.level >= 5 ? stroke : info?.color} strokeWidth="2" pointerEvents="none" />
                                                <text x={pos.x} y={pos.y + 53} textAnchor="middle" fill={hex.level >= 4 ? "#FCD34D" : info?.color} fontSize={hex.level >= 4 ? "10" : "12"} fontWeight="900" pointerEvents="none" style={{ letterSpacing: '1px' }}>
                                                    {hex.level >= 5 ? "MAX" : `LVL ${hex.level}`}
                                                </text>
                                                {gameState.upgradingHexIndex === i && gameState.upgradingHexTimer > 0 && (
                                                    <g>
                                                        <polygon
                                                            points={getHexPoints(pos.x, pos.y, 52.5)}
                                                            fill="none"
                                                            stroke="#fbbf24"
                                                            strokeWidth="3"
                                                            className="pulse-upgrade-ring"
                                                            style={{ pointerEvents: 'none' }}
                                                        />
                                                        <text
                                                            x={pos.x}
                                                            y={pos.y - 80}
                                                            textAnchor="middle"
                                                            fill="#fbbf24"
                                                            fontSize="24"
                                                            fontWeight="900"
                                                            className="float-up-fade"
                                                            style={{ textShadow: '0 0 10px #fbbf24' }}
                                                        >
                                                            UPGRADED!
                                                        </text>
                                                    </g>
                                                )}
                                            </g>
                                        )}
                                    </>
                                );
                            })()}
                            {gameState.pendingLegendaryHex && !hex && (
                                <polygon
                                    points={getHexPoints(pos.x, pos.y, 68)}
                                    fill="rgba(251, 191, 36, 0.05)"
                                    stroke="#fbbf24"
                                    strokeWidth="2"
                                    style={{ pointerEvents: 'none', transformBox: 'fill-box', transformOrigin: 'center' }}
                                    className="pulse-legendary-glow"
                                />
                            )}
                            {!gameState.pendingFusionHex && !gameState.pendingLegendaryHex && isHexFusable && (
                                <polygon
                                    points={getHexPoints(pos.x, pos.y, 68)}
                                    fill="rgba(56, 189, 248, 0.05)"
                                    stroke="#38bdf8"
                                    strokeWidth="2"
                                    style={{ pointerEvents: 'none', transformBox: 'fill-box', transformOrigin: 'center' }}
                                    className="pulse-cyan-glow"
                                />
                            )}
                            {gameState.pendingFusionHex && gameState.pendingFusionHex.validHexIndices.includes(i) && (
                                <g>
                                    <polygon
                                        points={getHexPoints(pos.x, pos.y, 68)}
                                        fill="rgba(56, 189, 248, 0.2)"
                                        stroke="#38bdf8"
                                        strokeWidth="4"
                                        style={{ pointerEvents: 'none', transformBox: 'fill-box', transformOrigin: 'center' }}
                                        className="pulse-attention"
                                    />
                                    <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="900" pointerEvents="none" className="pulse-attention" style={{ textShadow: '0 0 10px #38bdf8', letterSpacing: '2px' }}>
                                        SELECT
                                    </text>
                                </g>
                            )}
                        </g >
                    );
                })}

                {/* 1. LAYER: METEORITE SOCKETS (Background) */}
                {allDiamondPositions.map((pos, i) => {
                    const meteorite = moduleSockets.diamonds[i];
                    const socketColor = meteorite ? getMeteoriteColor(meteorite.discoveredIn) : '#64748b'; // slate-500
                    const socketOpacity = meteorite ? 1 : 0.4;

                    return (
                        <g key={`diamond-socket-${i}`}
                            style={{ pointerEvents: (gameState.pendingLegendaryHex || gameState.pendingFusionHex) ? 'none' : 'auto' }}
                            onMouseDown={(e) => {
                                if (gameState.pendingLegendaryHex || gameState.pendingFusionHex) return; // Disable during placement
                                if (!movedItem && moduleSockets.diamonds[i]) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (gameState.player.autoUnsocket) {
                                        setMovedItem({ item: moduleSockets.diamonds[i], source: 'diamond', index: i });
                                        setHoveredItem(null);
                                        setLockedItem(null);
                                    } else {
                                        onAttemptRemove(i, moduleSockets.diamonds[i]);
                                    }
                                    return;
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Only Click-Lock tooltip if not dragging
                                if (!movedItem && moduleSockets.diamonds[i]) {
                                    setLockedItem({ item: moduleSockets.diamonds[i], x: e.clientX, y: e.clientY, index: i });
                                }
                            }}
                            onMouseUp={(_e) => {
                                _e.stopPropagation();
                                if (movedItem) {
                                    // Cancel if dropped back on the exact same slot
                                    if (movedItem.source === 'diamond' && movedItem.index === i) {
                                        setMovedItem(null);
                                        return;
                                    }

                                    const itemAtTarget = moduleSockets.diamonds[i];
                                    // FIX: If target is filled, force removal check (5-dust fee) instead of free swap
                                    if (itemAtTarget) {
                                        onAttemptRemove(i, itemAtTarget, movedItem);
                                        // We don't drop the new item yet; user must pay to clear the slot first
                                        setMovedItem(null);
                                        return;
                                    }

                                    // Handle Drop on Empty Socket
                                    // BLOCK BLUEPRINTS from meteorite sockets
                                    if (movedItem.item.isBlueprint) return;

                                    if (movedItem.item.isCorrupted) {
                                        // Intercept for corruption warning
                                        onAttemptPlace(i, movedItem.item, movedItem.source, movedItem.index);
                                        setMovedItem(null);
                                        return;
                                    }

                                    if (movedItem.source === 'inventory') {
                                        onSocketUpdate('diamond', i, movedItem.item);
                                        onInventoryUpdate(movedItem.index, null);
                                    } else if (movedItem.source === 'diamond') {
                                        // Move from socket to socket (both were empty or source index is reset)
                                        onSocketUpdate('diamond', i, movedItem.item);
                                        onSocketUpdate('diamond', movedItem.index, null);
                                    } else if (movedItem.source === 'recalibrate' || movedItem.source === 'incubator') {
                                        // Move from lab modules to socket
                                        onSocketUpdate('diamond', i, movedItem.item);
                                        // The onSocketUpdate in ModuleMenu will clear recalibrateSlot or incubator slot
                                    }
                                    setMovedItem(null);
                                    setHoveredItem(null);
                                    setLockedItem(null);
                                }
                            }}
                        >
                            {((movedItem && !movedItem.item.isBlueprint) || (gameState.tutorial.isActive && gameState.tutorial.currentStep === 12)) && !moduleSockets.diamonds[i] && (
                                <circle
                                    cx={pos.x} cy={pos.y} r="50"
                                    fill="none"
                                    stroke="#22d3ee"
                                    strokeWidth="3"
                                    strokeDasharray="8 6"
                                    className="pulse-cyan-glow"
                                    pointerEvents="none"
                                />
                            )}
                            <circle
                                cx={pos.x} cy={pos.y} r="40"
                                fill="none"
                                stroke={socketColor}
                                strokeWidth="2"
                                strokeOpacity={socketOpacity}
                                filter="url(#rugged-rim)"
                                style={{ filter: `drop-shadow(0 0 10px ${socketColor})` }}
                            />
                            <circle
                                cx={pos.x} cy={pos.y} r="35"
                                fill="url(#socket-grad)"
                                stroke={socketColor}
                                strokeWidth="1"
                                strokeOpacity={meteorite ? 0.6 : 0.25}
                                filter="url(#rugged-rim)"
                            />
                            <circle cx={pos.x} cy={pos.y} r="25" fill="rgba(0,0,0,0.3)" />
                        </g>
                    )
                })}

                {/* 2. LAYER: METEORITE VISUALS (Foreground Layer - Priority) */}
                {allDiamondPositions.map((pos, i) => {
                    const meteorite = moduleSockets.diamonds[i];
                    if (!meteorite) return null;

                    const rarityColor = RARITY_COLORS[meteorite.rarity];
                    const isBoosted = isRecentlyBoosted(i);
                    const isLevitating = levitatingDiamonds[i];

                    return (
                        <g key={`meteorite-foreground-${i}`}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            style={{ cursor: movedItem ? 'copy' : 'help', pointerEvents: gameState.pendingFusionHex ? 'none' : 'auto' }}
                            onMouseDown={(e) => {
                                if (gameState.pendingLegendaryHex || gameState.pendingFusionHex) return;
                                if (!movedItem && meteorite) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (gameState.player.autoUnsocket) {
                                        setMovedItem({ item: moduleSockets.diamonds[i], source: 'diamond', index: i });
                                        setHoveredItem(null);
                                        setLockedItem(null);
                                    } else {
                                        onAttemptRemove(i, meteorite);
                                    }
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!movedItem && meteorite) {
                                    setLockedItem({ item: meteorite, x: e.clientX, y: e.clientY, index: i });
                                }
                            }}
                            onMouseUp={(e) => {
                                e.stopPropagation();
                                if (movedItem) {
                                    // Cancel if dropped back on the exact same slot
                                    if (movedItem.source === 'diamond' && movedItem.index === i) {
                                        setMovedItem(null);
                                        return;
                                    }

                                    const itemAtTarget = meteorite;
                                    if (itemAtTarget) {
                                        onAttemptRemove(i, itemAtTarget, movedItem);
                                        setMovedItem(null);
                                    }
                                }
                            }}
                        >
                            {/* Visual wrapper for "turned off" state */}
                            <g style={{
                                filter: (meteoriteEfficiencies[i] && meteoriteEfficiencies[i]!.totalBoost === 0) ? 'grayscale(1) opacity(0.5)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}>
                                {/* Rarity Glow Ring */}
                                <circle
                                    r="32"
                                    fill="none"
                                    stroke={rarityColor}
                                    strokeWidth="2"
                                    style={{ opacity: 0.6, filter: `drop-shadow(0 0 5px ${rarityColor})` }}
                                    pointerEvents="none"
                                />

                                {/* The Meteorite Group (Animate this) */}
                                <g
                                    className={`meteorite-visual-group ${isBoosted ? "is-boosted" : ""} ${isLevitating ? "is-levitating" : ""}`}
                                    style={{ '--glow-color': rarityColor, pointerEvents: 'none' } as any}
                                >
                                    <g className="meteorite-inner-bob">
                                        <image
                                            href={getMeteoriteImage(meteorite)}
                                            x={-35}
                                            y={-35}
                                            width="70"
                                            height="70"
                                            style={{ pointerEvents: 'auto' }}
                                            onMouseMove={(e) => {
                                                if (!movedItem) {
                                                    handleMouseEnterItem(meteorite, e.clientX, e.clientY, i);
                                                    if (meteorite.isNew) {
                                                        meteorite.isNew = false;
                                                        onSocketUpdate('diamond', i, meteorite);
                                                    }
                                                }
                                            }}
                                            onMouseLeave={() => handleMouseLeaveItem(100)}
                                        />

                                        {/* NEW Label - SVG Style */}
                                        {meteorite.isNew && (
                                            <g transform="translate(0, -35)">
                                                <rect x="-12" y="-6" width="24" height="12" rx="4" fill="#ef4444" className="pulse-red" style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }} />
                                                <text x="0" y="3" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" style={{ pointerEvents: 'none' }}>NEW</text>
                                            </g>
                                        )}

                                        {/* Status badge row: C → I → H → M */}
                                        <g pointerEvents="none">
                                            {(meteorite.isCorrupted || (meteorite.incubatorBoost && meteorite.incubatorBoost > 0) || meteorite.blueprintBoosted || isBuffActive(gameState, 'MATRIX_OVERDRIVE')) && (
                                                <foreignObject x={-35} y={-47} width={70} height={16}>
                                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', justifyContent: 'center' }}>
                                                        {meteorite.isCorrupted && (
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e293b', border: '1px solid #991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 5px rgba(153,27,27,0.7)', flexShrink: 0 }}>
                                                                <span style={{ fontSize: '7px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>C</span>
                                                            </div>
                                                        )}
                                                        {meteorite.incubatorBoost && meteorite.incubatorBoost > 0 && (
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e293b', border: '1px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 5px rgba(14,165,233,0.6)', flexShrink: 0 }}>
                                                                <span style={{ fontSize: '7px', fontWeight: 900, color: '#00d9ff', lineHeight: 1 }}>I</span>
                                                            </div>
                                                        )}
                                                        {meteorite.blueprintBoosted && (
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e293b', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 5px rgba(96,165,250,0.6)', flexShrink: 0 }}>
                                                                <span style={{ fontSize: '7px', fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>H</span>
                                                            </div>
                                                        )}
                                                        {isBuffActive(gameState, 'MATRIX_OVERDRIVE') && (
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1e293b', border: '1px solid #ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 5px rgba(234,88,12,0.6)', flexShrink: 0 }}>
                                                                <span style={{ fontSize: '7px', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>M</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </foreignObject>
                                            )}
                                        </g>
                                    </g>
                                </g>
                            </g>

                            {/* Efficiency Label - Priority on top */}
                            <EfficiencyLabel
                                value={meteoriteEfficiencies[i]?.totalBoost || 0}
                                x={0}
                                y={35}
                                color={(meteoriteEfficiencies[i]?.totalBoost || 0) > 0 ? rarityColor : '#64748b'}
                                onLevitateChange={(lev) => {
                                    setLevitatingDiamonds(prev => ({ ...prev, [i]: lev }));
                                }}
                            />
                        </g>
                    )
                })}
            </svg>
        </div >
    );
};
