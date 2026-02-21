import React from 'react';
import type { GameState, Meteorite, LegendaryHex, Blueprint } from '../../logic/core/types';
import { MeteoriteTooltip } from '../MeteoriteTooltip';
import { LegendaryDetail } from '../LegendaryDetail';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';
import { ARENA_DATA, SECTOR_NAMES } from '../../logic/mission/MapLogic';
import { EXTRACTION_MESSAGES } from '../../logic/mission/ExtractionLogic';
import type { BestiaryEntry } from '../../data/BestiaryData';
import { BestiaryDetailView } from './BestiaryDetailView';
import { fadeOutMusic, playSfx } from '../../logic/audio/AudioLogic';
import { playTypewriterClick } from '../../logic/audio/SfxLogic';
import { RecalibrateInterface } from './RecalibrateInterface';
import { upgradeMeteoriteQuality, rerollPerkType, rerollPerkValue } from '../../logic/upgrades/RecalibrateLogic';
import { getMeteoriteImage, matchesPerk, PerkFilter } from './ModuleUtils';
import { PLAYER_CLASSES } from '../../logic/core/classes';

interface ModuleDetailPanelProps {
    gameState: GameState;
    placementAlert: boolean;
    hoveredHex: { hex: LegendaryHex, index: number, x: number, y: number } | null;
    movedItem: { item: Meteorite | any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate', index: number } | null;
    hoveredItem: { item: Meteorite | any, x: number, y: number, index?: number } | null;
    lockedItem: { item: Meteorite | any, x: number, y: number, index?: number } | null;
    hoveredBlueprint: Blueprint | null;
    onCancelHoverTimeout: () => void;
    onMouseLeaveItem: (delay?: number) => void;
    selectedBestiaryEnemy?: BestiaryEntry | null;
    onUpdate?: () => void;
    recalibrateSlot: Meteorite | null;
    setRecalibrateSlot: (item: Meteorite | null) => void;
    setMovedItem?: (item: { item: Meteorite | any, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate', index: number } | null) => void;
    lockedRecalibrateIndices: number[];
    onToggleRecalibrateLock: (idx: number) => void;
    recalibrateFilters: Record<number, PerkFilter>;
    setRecalibrateFilters: React.Dispatch<React.SetStateAction<Record<number, PerkFilter>>>;
    setLockedRecalibrateIndices: React.Dispatch<React.SetStateAction<number[]>>;
}

export const ModuleDetailPanel: React.FC<ModuleDetailPanelProps> = ({
    gameState,
    placementAlert,
    hoveredHex,
    movedItem,
    hoveredItem,
    lockedItem,
    hoveredBlueprint,
    onCancelHoverTimeout,
    onMouseLeaveItem,
    selectedBestiaryEnemy,
    onUpdate,
    recalibrateSlot,
    setRecalibrateSlot,
    setMovedItem,
    lockedRecalibrateIndices,
    onToggleRecalibrateLock,
    recalibrateFilters,
    setRecalibrateFilters,
    setLockedRecalibrateIndices
}) => {
    const terminalRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const lastCharIndexRef = React.useRef(0);
    const extractionDialogActive = ['requested', 'waiting'].includes(gameState.extractionStatus);
    const alertIdx = EXTRACTION_MESSAGES.findIndex(m => m.isAlert);
    const isAlertActive = extractionDialogActive && alertIdx !== -1 && gameState.extractionMessageIndex >= alertIdx;
    const themeColor = isAlertActive ? '#ef4444' : '#3b82f6';
    const themeColorSecondary = isAlertActive ? '#f87171' : '#60a5fa';
    const themeColorRgba = isAlertActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
    const themeColorBgRgba = isAlertActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(59, 130, 246, 0.08)';

    React.useEffect(() => {
        lastCharIndexRef.current = 0;
    }, [gameState.extractionMessageIndex]);

    React.useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [gameState.extractionMessageIndex, gameState.extractionStatus]);

    // Audio Effect / Sound per Letter
    React.useEffect(() => {
        if (!extractionDialogActive) return;

        const msg = EXTRACTION_MESSAGES[gameState.extractionMessageIndex];
        if (!msg || msg.isPause) return;

        const start = gameState.extractionMessageTimes?.[gameState.extractionMessageIndex] || 0;
        const now = gameState.extractionDialogTime || 0;
        const elapsed = Math.max(0, now - start);
        const speed = 0.03; // 30ms per character (Fast)

        const targetCharCount = Math.floor(elapsed / speed);
        const currentChars = Math.min(msg.text.length, targetCharCount);

        if (currentChars > lastCharIndexRef.current) {
            // Play sound for EACH new character
            const newChars = currentChars - lastCharIndexRef.current;
            // Limit sound spam if lagging
            if (newChars < 5) {
                for (let k = 0; k < newChars; k++) {
                    // Slight stagger or just play? Play might be too much overlap.
                    // Just play once per tick is usually enough for "typing" feel, 
                    // but user said "hear every letter". 
                    // If we type 3 letters in one frame, playing 3 sounds instantly might clip.
                    // Let's play one sound but maybe vary pitch?
                    // 'playTypewriterClick' is standard.
                    // Let's just play it once per update if chars increased. 
                    // PROMPT: "I want to hear every letter typed". 
                    // If frame rate is 60fps, 16ms. 30ms per char matches ~2 chars per frame?
                    // If multiple chars, loop?
                }
                playTypewriterClick();
            } else {
                playTypewriterClick();
            }
            lastCharIndexRef.current = currentChars;
        }
    }, [gameState.extractionDialogTime, extractionDialogActive, gameState.extractionMessageIndex]);

    const handleExitRecalibrate = () => {
        if (recalibrateSlot) {
            // Find empty slot in inventory (Storage 10+ first, then Safe Slots 0-9)
            let emptyIdx = -1;
            for (let i = 10; i < gameState.inventory.length; i++) {
                if (gameState.inventory[i] === null) { emptyIdx = i; break; }
            }
            if (emptyIdx === -1) {
                for (let i = 0; i < 10; i++) {
                    if (gameState.inventory[i] === null) { emptyIdx = i; break; }
                }
            }

            if (emptyIdx !== -1) {
                gameState.inventory[emptyIdx] = { ...recalibrateSlot, isNew: false };
                setRecalibrateSlot(null);
                onUpdate?.();
                playSfx('ui-click');
            } else {
                // Return as moved item if inventory is full
                setMovedItem?.({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                setRecalibrateSlot(null);
            }
        }
    };

    return (
        <div style={{
            flex: 1,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isAlertActive ? 'rgba(45, 0, 0, 0.98)' : 'rgba(5, 5, 15, 0.98)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: themeColor,
            borderRadius: '8px',
            boxShadow: `0 0 30px ${themeColorRgba}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* SCANNER GRID BACKGROUND */}
            <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                opacity: (recalibrateSlot || lockedItem || hoveredItem || hoveredBlueprint || selectedBestiaryEnemy) ? 0.35 : 1,
                transition: 'opacity 0.3s'
            }}>
                {/* PERSPECTIVE GRID */}
                <div style={{
                    position: 'absolute', bottom: '-20%', left: '-50%', right: '-50%', height: '80%',
                    backgroundImage: `linear-gradient(${themeColorBgRgba} 1px, transparent 1px), linear-gradient(90deg, ${themeColorBgRgba} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    transform: 'perspective(400px) rotateX(60deg)',
                    animation: 'grid-pan 15s infinite linear',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                }} />

                {/* VERTICAL SCAN LINE */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '2px',
                    background: `linear-gradient(90deg, transparent, ${themeColorSecondary}, ${themeColor}, ${themeColorSecondary}, transparent)`,
                    boxShadow: `0 0 20px ${themeColor}, 0 0 40px ${themeColorRgba}`,
                    animation: 'scan-vertical 5s infinite ease-in-out',
                    zIndex: 2
                }} />
            </div>

            {/* CONTENT LAYER */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {gameState.pendingLegendaryHex ? (
                    <LegendaryDetail hex={gameState.pendingLegendaryHex} gameState={gameState} hexIdx={-1} pending={true} placementAlert={placementAlert} />
                ) : (hoveredHex && !movedItem) ? (
                    <LegendaryDetail hex={hoveredHex.hex} gameState={gameState} hexIdx={hoveredHex.index} pending={false} />
                ) : (hoveredBlueprint && !movedItem) ? (
                    // Move the hoveredBlueprint logic here
                    (() => {
                        const isResearching = hoveredBlueprint.status === 'researching';
                        const timeLeft = isResearching && hoveredBlueprint.researchFinishTime ? Math.max(0, hoveredBlueprint.researchFinishTime - gameState.gameTime) : 0;

                        return (
                            <div style={{ padding: '30px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                {isResearching ? (
                                    <>
                                        {/* RESEARCHING MASK */}
                                        <div style={{ borderBottom: '1px solid #fbbf24', paddingBottom: '12px', marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 900, letterSpacing: '3px' }}>DECRYPTION IN PROGRESS</div>
                                            <div style={{ fontSize: '32px', fontWeight: 900, color: '#fff' }}>ENCRYPTED PROTOCOL</div>
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
                                            <div style={{
                                                width: '120px', height: '120px',
                                                border: '2px solid #fbbf24', borderRadius: '12px',
                                                background: 'rgba(251, 191, 36, 0.05)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 0 40px rgba(251, 191, 36, 0.2)',
                                                position: 'relative', overflow: 'hidden'
                                            }}>
                                                <img src="/assets/Icons/Blueprint.png" style={{
                                                    width: '60%', height: '60%',
                                                    filter: 'grayscale(1) brightness(0.5) sepia(1) hue-rotate(-10deg) saturate(3)',
                                                    opacity: 0.4
                                                }} />
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(transparent, #fbbf24, transparent)',
                                                    height: '200%', width: '100%',
                                                    opacity: 0.3,
                                                    animation: 'scanning-bar 1.5s infinite linear'
                                                }} />
                                            </div>

                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '48px', color: '#fbbf24', fontWeight: 900, fontFamily: 'monospace', textShadow: '0 0 15px #fbbf24', marginBottom: '10px' }}>
                                                    {timeLeft.toFixed(1)}s
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
                                                    PARSING SYSTEM PACKETS...
                                                </div>
                                                <div style={{ fontSize: '8px', color: '#64748b', marginTop: '8px', letterSpacing: '1px' }}>(OR CLICK TO RECYCLE FOR +5 DUST)</div>
                                            </div>

                                            <div style={{ width: '100%', maxWidth: '300px', height: '8px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                <div style={{
                                                    height: '100%', background: '#fbbf24',
                                                    width: `${Math.max(5, (1 - (timeLeft / 60)) * 100)}%`,
                                                    boxShadow: '0 0 15px #fbbf24'
                                                }} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* READY / ACTIVE VIEW */}
                                        <div style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '12px', marginBottom: '24px' }}>
                                            <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 900, letterSpacing: '3px' }}>BLUEPRINT PROTOCOL</div>
                                            <div style={{ fontSize: '32px', fontWeight: 900 }}>{hoveredBlueprint.name}</div>
                                        </div>
                                        <div style={{ flex: 1, overflowY: 'auto', fontSize: '16px', lineHeight: '1.8', color: '#cbd5e1', paddingRight: '15px' }}>
                                            <div style={{ marginBottom: '25px', opacity: 0.8, color: '#93c5fd', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ color: '#60a5fa', fontWeight: 900 }}>ID:</span>
                                                <span style={{ fontFamily: 'monospace' }}>{hoveredBlueprint.serial}</span>
                                                <span style={{ width: '1px', height: '12px', background: '#3b82f6', margin: '0 8px' }} />
                                                <span style={{ color: '#60a5fa', fontWeight: 900 }}>CLASS:</span>
                                                <span>PROTO-X</span>
                                            </div>

                                            <div style={{
                                                fontSize: '14px', lineHeight: '1.6', color: '#e2e8f0',
                                                borderLeft: '2px solid #3b82f6', paddingLeft: '15px',
                                                marginBottom: '16px'
                                            }}>
                                                {hoveredBlueprint.desc}
                                            </div>

                                            {/* ACTIVE STATUS BLOCK */}
                                            {(() => {
                                                const charges = gameState.activeBlueprintCharges[hoveredBlueprint.type];
                                                const endTime = gameState.activeBlueprintBuffs[hoveredBlueprint.type];
                                                const isActive = hoveredBlueprint.status === 'active';
                                                const isBroken = hoveredBlueprint.status === 'broken';

                                                if (isActive && charges !== undefined) {
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent)',
                                                            border: '1px solid rgba(59, 130, 246, 0.4)',
                                                            borderLeft: '3px solid #3b82f6',
                                                            borderRadius: '6px',
                                                            padding: '10px 16px',
                                                            marginBottom: '14px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px'
                                                        }}>
                                                            <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900, letterSpacing: '2px', flexShrink: 0 }}>USES REMAINING</div>
                                                            <div style={{ fontSize: '26px', fontWeight: 900, color: '#fff', textShadow: '0 0 10px rgba(59, 130, 246, 0.6)', fontFamily: 'monospace' }}>
                                                                {charges}
                                                                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '5px' }}>/ 50</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isActive && endTime !== undefined) {
                                                    const left = Math.max(0, endTime - gameState.gameTime);
                                                    const total = hoveredBlueprint.duration;
                                                    const pct = total > 0 ? Math.min(100, (left / total) * 100) : 100;
                                                    return (
                                                        <div style={{
                                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent)',
                                                            border: '1px solid rgba(59, 130, 246, 0.4)',
                                                            borderLeft: '3px solid #3b82f6',
                                                            borderRadius: '6px',
                                                            padding: '10px 16px',
                                                            marginBottom: '14px',
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                                                                <div style={{ fontSize: '9px', color: '#60a5fa', fontWeight: 900, letterSpacing: '2px' }}>TIME REMAINING</div>
                                                                <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', textShadow: '0 0 10px rgba(59, 130, 246, 0.6)', fontFamily: 'monospace' }}>
                                                                    {left.toFixed(0)}s
                                                                </div>
                                                            </div>
                                                            <div style={{ width: '100%', height: '3px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', boxShadow: '0 0 6px #3b82f6', transition: 'width 0.5s linear' }} />
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isBroken) {
                                                    return (
                                                        <div style={{
                                                            background: 'rgba(100, 116, 139, 0.1)',
                                                            border: '1px solid rgba(100, 116, 139, 0.3)',
                                                            borderLeft: '3px solid #64748b',
                                                            borderRadius: '6px',
                                                            padding: '8px 16px',
                                                            marginBottom: '14px',
                                                            fontSize: '10px', color: '#64748b', fontWeight: 900, letterSpacing: '2px'
                                                        }}>
                                                            PROTOCOL EXHAUSTED — RECYCLE FOR DUST
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })()}

                                            <div style={{
                                                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '8px',
                                                padding: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 900, marginBottom: '6px', letterSpacing: '2px' }}>ACTIVATION SEQUENCE</div>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#fff', textShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}>{hoveredBlueprint.cost.toLocaleString()}</span>
                                                        <span style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8' }}>DUST REQUIRED</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    width: '40px', height: '40px',
                                                    border: '2px solid #3b82f6', borderRadius: '50%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)'
                                                }}>
                                                    <div style={{ width: '12px', height: '12px', background: '#3b82f6', transform: 'rotate(45deg)' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()
                ) : (hoveredItem && !movedItem && (!recalibrateSlot || hoveredItem.item !== recalibrateSlot)) ? (
                    // Move the hoveredItem logic here
                    hoveredItem.item.isBlueprint ? (
                        <div style={{ padding: '30px', color: '#fff', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '12px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 900, letterSpacing: '4px' }}>ARCHIVE ANOMALY</div>
                                <div style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>ENCRYPTED DATASET</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', marginTop: '60px' }}>
                                <div style={{
                                    border: '2px solid #3b82f6', borderRadius: '12px', padding: '25px',
                                    background: 'rgba(59, 130, 246, 0.1)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <img src="/assets/Icons/Blueprint.png" style={{ width: '96px', height: '96px', filter: 'drop-shadow(0 0 20px #3b82f6)' }} />
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        background: 'linear-gradient(transparent, rgba(59, 130, 246, 0.4), transparent)',
                                        animation: 'scan-vertical 2s infinite linear'
                                    }} />
                                </div>
                                <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', animation: 'pulse-text 2s infinite' }}>
                                    RIGHT-CLICK TO BEGIN DECRYPTION
                                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px', letterSpacing: '1px', opacity: 0.8 }}>(OR RECYCLE FOR +5 DUST)</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)' }} />
                            <MeteoriteTooltip meteorite={hoveredItem.item} gameState={gameState} meteoriteIdx={hoveredItem.index} x={0} y={0} isEmbedded={true} />
                        </div>
                    )
                ) : recalibrateSlot ? (
                    <div style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', padding: '0'
                    }}>
                        <RecalibrateInterface
                            item={recalibrateSlot}
                            gameState={gameState}
                            onClose={handleExitRecalibrate}
                            onUpgradeQuality={() => { if (upgradeMeteoriteQuality(gameState, recalibrateSlot)) onUpdate?.(); }}
                            onRerollType={(indices: number[]) => {
                                if (rerollPerkType(gameState, recalibrateSlot, indices)) {
                                    // Apply Auto-Lock
                                    const newLocked = [...indices];
                                    let changed = false;
                                    recalibrateSlot.perks.forEach((p, idx) => {
                                        if (!newLocked.includes(idx)) {
                                            const lvl = idx + 1;
                                            const filter = recalibrateFilters[lvl];
                                            if (filter && filter.active && matchesPerk(p, lvl, filter)) {
                                                newLocked.push(idx);
                                                changed = true;
                                            }
                                        }
                                    });
                                    if (changed) setLockedRecalibrateIndices(newLocked);
                                    onUpdate?.();
                                }
                            }}
                            onRerollValue={(indices: number[]) => {
                                if (rerollPerkValue(gameState, recalibrateSlot, indices)) {
                                    // Apply Auto-Lock
                                    const newLocked = [...indices];
                                    let changed = false;
                                    recalibrateSlot.perks.forEach((p, idx) => {
                                        if (!newLocked.includes(idx)) {
                                            const lvl = idx + 1;
                                            const filter = recalibrateFilters[lvl];
                                            if (filter && filter.active && matchesPerk(p, lvl, filter)) {
                                                newLocked.push(idx);
                                                changed = true;
                                            }
                                        }
                                    });
                                    if (changed) setLockedRecalibrateIndices(newLocked);
                                    onUpdate?.();
                                }
                            }}
                            lockedIndices={lockedRecalibrateIndices}
                            onToggleLock={onToggleRecalibrateLock}
                            recalibrateFilters={recalibrateFilters}
                            setRecalibrateFilters={setRecalibrateFilters}
                        />
                        {/* DRAG HANDLE TO EJECT */}
                        <div
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'auto' }}
                            onMouseDown={(e) => {
                                if (e.button === 0 && setMovedItem) {
                                    e.preventDefault();
                                    // Don't clear recalibrateSlot here - let the drop handler do it
                                    setMovedItem({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                                }
                            }}
                        />
                    </div>
                ) : lockedItem ? (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <MeteoriteTooltip meteorite={lockedItem.item} gameState={gameState} meteoriteIdx={lockedItem.index} x={0} y={0} isEmbedded={true} />
                    </div>
                ) : selectedBestiaryEnemy ? (
                    <BestiaryDetailView entry={selectedBestiaryEnemy} />
                ) : extractionDialogActive ? (
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <div ref={terminalRef} style={{
                            flex: 1,
                            padding: '12px 24px',
                            paddingBottom: '30px',
                            width: '100%',
                            fontFamily: 'monospace',
                            // Check for high enemy activity message to trigger RED ALERT
                            color: isAlertActive ? '#ef4444' : '#22c55e',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            fontSize: '13px',
                            scrollBehavior: 'smooth'
                        }}>
                            <style>{`
                            .typewriter-cursor::after { content: '▋'; animation: blink 1s step-start infinite; color: currentColor; margin-left: 2px; }
                            @keyframes blink { 50% { opacity: 0; } }
                        `}</style>
                            {EXTRACTION_MESSAGES.slice(0, gameState.extractionMessageIndex + 1).map((msg, i) => {
                                const isCurrent = i === gameState.extractionMessageIndex;

                                // Dynamic Placeholder Replacement
                                let fullText = msg.text;
                                if (fullText.includes('[PLAYER_NAME]')) {
                                    const actualName = gameState.playerName || PLAYER_CLASSES.find(c => c.id === gameState.player.playerClass)?.name || "RECRUIT";
                                    fullText = fullText.replace('[PLAYER_NAME]', actualName.toUpperCase());
                                }
                                if (fullText.includes('[ARENA_NAME]')) {
                                    const sectorName = SECTOR_NAMES[gameState.extractionTargetArena] || "UNKNOWN";
                                    fullText = fullText.replace('[ARENA_NAME]', sectorName.toUpperCase());
                                }

                                // Typewriter Logic: Constant Speed Calculation
                                let displayedText = fullText;
                                if (isCurrent && !msg.isPause) {
                                    const start = gameState.extractionMessageTimes?.[i] || 0;
                                    const now = gameState.extractionDialogTime || 0;
                                    const elapsed = Math.max(0, now - start);
                                    const speed = 0.03; // 30ms per character

                                    const charCount = Math.floor(elapsed / speed);
                                    displayedText = fullText.slice(0, charCount);
                                }

                                return (
                                    <div key={i} style={{
                                        padding: '4px 0',
                                        textAlign: msg.speaker === 'you' ? 'right' : 'left',
                                        color: msg.speaker === 'you' ? '#fde68a' : '#93c5fd',
                                        maxWidth: '100%',
                                        wordBreak: 'break-word',
                                        marginLeft: msg.speaker === 'orbit' ? '5px' : '0', // Move Orbit text right by 5px
                                        paddingRight: msg.speaker === 'you' ? '10px' : '0'
                                    }}>
                                        <span style={{ fontWeight: 900, opacity: 0.9, marginRight: '16px', letterSpacing: '1px' }}>{msg.speaker?.toUpperCase()}:</span>
                                        {displayedText}
                                        {isCurrent && <span className="typewriter-cursor"></span>}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} style={{ height: '10px', flexShrink: 0 }} />
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Rotating Loading Circle */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                border: '2px solid rgba(59, 130, 246, 0.1)',
                                borderTop: `2px solid ${['active', 'arrived', 'departing'].includes(gameState.extractionStatus) ? '#ef4444' : '#3b82f6'}`,
                                borderRadius: '50%',
                                animation: 'spin-slow 3s infinite cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                            <div style={{
                                position: 'absolute', width: '80%', height: '80%',
                                border: '1px dashed rgba(96, 165, 250, 0.2)',
                                borderRadius: '50%',
                                animation: 'spin-reverse 15s infinite linear'
                            }} />

                            <div style={{ textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                {gameState.extractionStatus === 'active' ? (
                                    <>
                                        <div style={{ fontSize: '10px', color: '#ef4444', fontWeight: 900, letterSpacing: '2px', animation: 'pulse-text 1s infinite' }}>ARRIVAL IN</div>
                                        <div style={{ fontSize: '48px', color: '#fff', fontWeight: 900, lineHeight: 1, textShadow: '0 0 20px #ef4444' }}>
                                            {Math.ceil(gameState.extractionTimer)}s
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px' }}>SECURE THE LZ</div>
                                    </>
                                ) : gameState.extractionStatus === 'arrived' ? (
                                    <>
                                        <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 900, letterSpacing: '2px', animation: 'pulse-text 0.5s infinite' }}>SHIP LANDED</div>
                                        <div style={{ fontSize: '14px', color: '#fff', maxWidth: '160px' }}>
                                            GO TO <span style={{ color: '#22c55e', fontWeight: 900 }}>{gameState.extractionSectorLabel || "LANDING ZONE"}</span>
                                        </div>
                                    </>
                                ) : gameState.extractionStatus === 'departing' ? (
                                    <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 900, letterSpacing: '2px' }}>DEPARTING...</div>
                                ) : (
                                    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 900, letterSpacing: '6px', opacity: 1, animation: 'pulse-text 2s infinite ease-in-out' }}>WAITING SIGNAL</div>
                                )}
                            </div>
                        </div>

                        {gameState.extractionStatus === 'none' && (
                            <div style={{ marginTop: '30px', textAlign: 'center', opacity: gameState.player.dust >= 10000 ? 1 : 0.6 }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '1px', marginBottom: '6px' }}>REQUIRED FOR EVACUATION</div>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: gameState.player.dust >= 10000 ? '#22c55e' : '#fff', textShadow: gameState.player.dust >= 10000 ? '0 0 10px #22c55e' : 'none' }}>
                                    {Math.floor(gameState.player.dust).toLocaleString()} / 10,000 DUST
                                </div>

                                {gameState.player.dust >= 10000 && (
                                    <button
                                        onClick={() => {
                                            playSfx('ui-click');
                                            gameState.player.dust -= 10000;
                                            gameState.extractionStatus = 'requested';
                                            gameState.extractionTimer = 0;
                                            gameState.extractionMessageIndex = -1;
                                            if (onUpdate) onUpdate();
                                        }}
                                        style={{
                                            marginTop: '15px',
                                            background: '#22c55e',
                                            color: '#000',
                                            border: 'none',
                                            padding: '12px 24px',
                                            fontSize: '14px',
                                            fontWeight: 900,
                                            letterSpacing: '2px',
                                            cursor: 'pointer',
                                            clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)',
                                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                                            animation: 'pulse-text 2s infinite',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 0 30px rgba(34, 197, 94, 0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.4)';
                                        }}
                                    >
                                        INITIATE EVACUATION
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes grid-pan { from { background-position: 0 0; } to { background-position: 0 40px; } }
                @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
                @keyframes pulse-text { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                @keyframes scan-vertical {
                    0% { top: -5%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 105%; opacity: 0; }
                }
            `}</style>
        </div >
    );
};
