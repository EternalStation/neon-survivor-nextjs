import React from 'react';
import type { GameState, Meteorite, LegendaryHex, Blueprint } from '../../logic/core/types';
import { MeteoriteTooltip } from '../MeteoriteTooltip';
import { LegendaryDetail } from '../LegendaryDetail';
import { isBuffActive } from '../../logic/upgrades/BlueprintLogic';
import { ARENA_DATA } from '../../logic/mission/MapLogic';
import { EXTRACTION_MESSAGES } from '../../logic/mission/ExtractionLogic';
import type { BestiaryEntry } from '../../data/BestiaryData';
import { BestiaryDetailView } from './BestiaryDetailView';
import { fadeOutMusic, playSfx } from '../../logic/audio/AudioLogic';
import { playTypewriterClick } from '../../logic/audio/SfxLogic';
import { RecalibrateInterface } from './RecalibrateInterface';
import { upgradeMeteoriteQuality, rerollPerkType, rerollPerkValue } from '../../logic/upgrades/RecalibrateLogic';
import { getMeteoriteImage } from './ModuleUtils';

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
    setMovedItem
}) => {
    const terminalRef = React.useRef<HTMLDivElement>(null);
    const extractionDialogActive = ['requested', 'waiting'].includes(gameState.extractionStatus);

    React.useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [gameState.extractionMessageIndex, gameState.extractionStatus]);

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
            background: 'rgba(5, 5, 15, 0.98)',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#3b82f6',
            borderRadius: '8px',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.2)',
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
                    background: 'linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(400px) rotateX(60deg)',
                    animation: 'grid-pan 15s infinite linear',
                    maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
                }} />

                {/* VERTICAL SCAN LINE */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, #60a5fa, #3b82f6, #60a5fa, transparent)',
                    boxShadow: '0 0 20px #3b82f6, 0 0 40px rgba(59, 130, 246, 0.5)',
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
                            onRerollType={(indices: number[]) => { if (rerollPerkType(gameState, recalibrateSlot, indices)) onUpdate?.(); }}
                            onRerollValue={(indices: number[]) => { if (rerollPerkValue(gameState, recalibrateSlot, indices)) onUpdate?.(); }}
                        />
                        {/* DRAG HANDLE TO EJECT */}
                        <div
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'auto' }}
                            onMouseDown={(e) => {
                                if (e.button === 0 && setMovedItem) {
                                    e.preventDefault();
                                    setMovedItem({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                                    setRecalibrateSlot(null);
                                }
                            }}
                        />
                    </div>
                ) : lockedItem ? (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <MeteoriteTooltip meteorite={lockedItem.item} gameState={gameState} meteoriteIdx={lockedItem.index} x={0} y={0} isEmbedded={true} />
                    </div>
                ) : (hoveredItem && hoveredItem.item.isBlueprint) ? (
                    <div style={{ padding: '30px', color: '#fff', flex: 1 }}>
                        <div style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '12px', marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 900, letterSpacing: '4px' }}>ARCHIVE ANOMALY</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>ENCRYPTED DATASET</div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', marginTop: '60px' }}>
                            <div style={{
                                border: '2px solid #3b82f6', borderRadius: '12px', padding: '25px',
                                background: 'rgba(59, 130, 246, 0.1)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)'
                            }}>
                                <img src="/assets/Icons/Blueprint.png" style={{ width: '96px', height: '96px', filter: 'drop-shadow(0 0 20px #3b82f6)' }} />
                            </div>
                            <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: 900, fontSize: '14px', letterSpacing: '2px', animation: 'pulse-text 2s infinite' }}>RIGHT-CLICK TO BEGIN DECRYPTION</div>
                        </div>
                    </div>
                ) : hoveredItem ? (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <MeteoriteTooltip meteorite={hoveredItem.item} gameState={gameState} meteoriteIdx={hoveredItem.index} x={0} y={0} isEmbedded={true} />
                    </div>
                ) : hoveredBlueprint ? (
                    <div style={{ padding: '30px', color: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ borderBottom: '1px solid #3b82f6', paddingBottom: '12px', marginBottom: '24px' }}>
                            <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 900, letterSpacing: '3px' }}>BLUEPRINT PROTOCOL</div>
                            <div style={{ fontSize: '32px', fontWeight: 900 }}>{hoveredBlueprint.name}</div>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', fontSize: '16px', lineHeight: '1.8', color: '#cbd5e1', paddingRight: '15px' }}>
                            <div style={{ marginBottom: '25px', fontStyle: 'italic', opacity: 0.7, color: '#93c5fd', fontSize: '13px' }}>{hoveredBlueprint.serial}</div>
                            {hoveredBlueprint.desc}
                            <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 900, marginBottom: '10px', letterSpacing: '1px' }}>ACTIVATION COST</div>
                                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff' }}>{hoveredBlueprint.cost.toLocaleString()} DUST</div>
                            </div>
                        </div>
                    </div>
                ) : selectedBestiaryEnemy ? (
                    <BestiaryDetailView entry={selectedBestiaryEnemy} />
                ) : extractionDialogActive ? (
                    <div ref={terminalRef} style={{ flex: 1, padding: '32px', fontFamily: 'monospace', color: '#22c55e', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px' }}>
                        <div style={{ borderBottom: '1px solid rgba(34, 197, 94, 0.3)', paddingBottom: '12px', marginBottom: '12px', fontSize: '12px', opacity: 0.7, letterSpacing: '3px' }}>SIGNAL INTERCEPT :: ENCRYPTED COMMS</div>
                        {EXTRACTION_MESSAGES.slice(0, gameState.extractionMessageIndex + 1).map((msg, i) => (
                            <div key={i} style={{ padding: '8px 0', borderLeft: msg.speaker === 'you' ? 'none' : '3px solid #3b82f6', borderRight: msg.speaker === 'you' ? '3px solid #f59e0b' : 'none', paddingLeft: msg.speaker === 'you' ? 0 : '20px', paddingRight: msg.speaker === 'you' ? '20px' : 0, textAlign: msg.speaker === 'you' ? 'right' : 'left', alignSelf: msg.speaker === 'you' ? 'flex-end' : 'flex-start', color: msg.speaker === 'you' ? '#fde68a' : '#93c5fd' }}>
                                <span style={{ fontWeight: 900, opacity: 0.9, marginRight: '12px' }}>{msg.speaker?.toUpperCase()}:</span>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* Rotating Loading Circle */}
                            <div style={{
                                position: 'absolute', width: '100%', height: '100%',
                                border: '2px solid rgba(59, 130, 246, 0.1)',
                                borderTop: '2px solid #3b82f6',
                                borderRadius: '50%',
                                animation: 'spin-slow 3s infinite cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                            <div style={{
                                position: 'absolute', width: '80%', height: '80%',
                                border: '1px dashed rgba(96, 165, 250, 0.2)',
                                borderRadius: '50%',
                                animation: 'spin-reverse 15s infinite linear'
                            }} />

                            <div style={{ textAlign: 'center', zIndex: 1 }}>
                                <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 900, letterSpacing: '6px', opacity: 1, animation: 'pulse-text 2s infinite ease-in-out' }}>WAITING SIGNAL</div>
                            </div>
                        </div>
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
        </div>
    );
};
