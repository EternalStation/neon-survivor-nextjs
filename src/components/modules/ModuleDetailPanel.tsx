import React from 'react';
import type { GameState, Meteorite, LegendaryHex, Blueprint, BlueprintType } from '../../logic/core/Types';
import { MeteoriteTooltip } from '../MeteoriteTooltip';
import { LegendaryDetail } from '../LegendaryDetail';
import { isBuffActive, activateBlueprint, scrapBlueprint } from '../../logic/upgrades/BlueprintLogic';
import { ARENA_DATA, SECTOR_NAMES, getLocalizedArenaDetails } from '../../logic/mission/MapLogic';
import { getExtractionMessages, ExtractionMessage } from '../../lib/orbitTranslations';
import type { BestiaryEntry } from '../../data/BestiaryData';
import { BestiaryDetailView } from './BestiaryDetailView';
import { fadeOutMusic, playSfx } from '../../logic/audio/AudioLogic';
import { playTypewriterClick } from '../../logic/audio/SfxLogic';
import { RecalibrateInterface } from './RecalibrateInterface';
import { upgradeMeteoriteQuality, rerollPerkType, rerollPerkValue } from '../../logic/upgrades/RecalibrateLogic';
import { getMeteoriteImage, matchesPerk, PerkFilter, getBlueprintImage } from './ModuleUtils';
import { PLAYER_CLASSES } from '../../logic/core/Classes';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';
import styles from './ModuleDetailPanel.module.css';

interface ThemeCSSVariables extends React.CSSProperties {
    '--theme-color': string;
    '--theme-secondary': string;
    '--theme-rgba': string;
    '--theme-bg-rgba': string;
}

type BlueprintStatus = 'locked' | 'ready' | 'active' | 'broken' | 'researching';

type InventoryItem = Meteorite | Blueprint;

interface ModuleDetailPanelProps {
    gameState: GameState;
    placementAlert: boolean;
    hoveredHex: { hex: LegendaryHex, index: number, x: number, y: number } | null;
    movedItem: { item: InventoryItem, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null;
    hoveredItem: { item: InventoryItem, x: number, y: number, index?: number } | null;
    lockedItem: { item: InventoryItem, x: number, y: number, index?: number } | null;
    hoveredBlueprint: Blueprint | null;
    onCancelHoverTimeout: () => void;
    onMouseLeaveItem: (delay?: number) => void;
    selectedBestiaryEnemy?: BestiaryEntry | null;
    onUpdate?: () => void;
    recalibrateSlot: Meteorite | null;
    setRecalibrateSlot: (item: Meteorite | null) => void;
    setMovedItem?: (item: { item: InventoryItem, source: 'inventory' | 'diamond' | 'hex' | 'recalibrate' | 'incubator', index: number } | null) => void;
    lockedRecalibrateIndices: number[];
    onToggleRecalibrateLock: (idx: number) => void;
    recalibrateFilters: Record<number, PerkFilter>;
    setRecalibrateFilters: React.Dispatch<React.SetStateAction<Record<number, PerkFilter>>>;
    setLockedRecalibrateIndices: React.Dispatch<React.SetStateAction<number[]>>;
    onAttemptRemove?: (index: number, item: InventoryItem, replaceWith?: InventoryItem | null) => void;
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
    setLockedRecalibrateIndices,
    onAttemptRemove
}) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const terminalRef = React.useRef<HTMLDivElement>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const lastCharIndexRef = React.useRef(0);
    const extractionDialogActive = ['requested', 'waiting'].includes(gameState.extractionStatus);
    const playerName = gameState.playerName || PLAYER_CLASSES.find(c => c.id === gameState.player.playerClass)?.name || "PILOT";
    const arenaName = gameState.extractionTargetArena !== undefined ? getLocalizedArenaDetails(gameState.extractionTargetArena, language).name : "UNKNOWN";
    const extractionMessages: ExtractionMessage[] = getExtractionMessages(language, playerName, arenaName);

    const alertIdx = extractionMessages.findIndex((m: ExtractionMessage) => m.isAlert);
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

    React.useEffect(() => {
        if (!extractionDialogActive) return;

        const msg = extractionMessages[gameState.extractionMessageIndex];
        if (!msg || msg.isPause) return;

        const start = gameState.extractionMessageTimes?.[gameState.extractionMessageIndex] || 0;
        const now = gameState.extractionDialogTime || 0;
        const elapsed = Math.max(0, now - start);
        const speed = 0.03;

        const targetCharCount = Math.floor(elapsed / speed);
        const currentChars = Math.min(msg.text.length, targetCharCount);

        if (currentChars > lastCharIndexRef.current) {
            playTypewriterClick();
            lastCharIndexRef.current = currentChars;
        }
    }, [gameState.extractionDialogTime, extractionDialogActive, gameState.extractionMessageIndex]);

    const handleExitRecalibrate = () => {
        if (recalibrateSlot) {
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
                setMovedItem?.({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                setRecalibrateSlot(null);
            }
        }
    };

    const renderBlueprintPanel = (bp: Blueprint, gs: GameState, onUpd?: () => void) => {
        const status: BlueprintStatus | undefined = bp.status;
        const cost = bp.cost ?? 0;
        const canDeploy = gs.player.dust >= cost;
        const alreadyActive = isBuffActive(gs, bp.type);

        const findBpIdx = () => (gs.inventory as (Meteorite | Blueprint | null)[]).findIndex(
            (i) => i !== null && (i as Blueprint).isBlueprint && (i as Blueprint).id === bp.id
        );

        const handleDeploy = () => {
            const idx = findBpIdx();
            if (idx === -1) return;
            if (activateBlueprint(gs, idx)) {
                playSfx('upgrade-confirm');
                onUpd?.();
            }
        };

        const handleScrap = () => {
            const idx = findBpIdx();
            if (idx === -1) return;
            scrapBlueprint(gs, idx);
            playSfx('recycle');
            onUpd?.();
        };

        const timeLeft = status === 'researching' && bp.researchFinishTime
            ? Math.max(0, bp.researchFinishTime - gs.gameTime) : 0;
        const endTime = gs.activeBlueprintBuffs?.[bp.type as BlueprintType];
        const charges = gs.activeBlueprintCharges?.[bp.type as BlueprintType];
        const activeTimeLeft = endTime ? Math.max(0, endTime - gs.gameTime) : 0;

        return (
            <div className={styles.bpPanel}>
                <div className={styles.bpHeader}>
                    <div className={styles.bpHeaderLabel}>ARCHIVE ANOMALY</div>
                    <div className={styles.bpTitle}>{bp.name || 'ENCRYPTED DATASET'}</div>
                    {bp.serial && <div className={styles.bpSerial}>ID: {bp.serial}</div>}
                </div>

                {bp.desc && status !== 'locked' && (
                    <div className={styles.bpDesc}>{bp.desc}</div>
                )}

                <div className={styles.bpBody}>
                    {status === 'locked' && (
                        <div className={styles.lockedState}>
                            <div className={styles.hexOuter}>
                                <div className={styles.hexInner}>
                                    <img src={getBlueprintImage(bp.status)} className={styles.hexImg} />
                                    <div className={styles.hexScanBar} />
                                </div>
                            </div>
                            <div className={styles.lockedLabel}>RIGHT-CLICK TO BEGIN DECRYPTION</div>
                        </div>
                    )}

                    {status === 'researching' && (
                        <div className={styles.researchingState}>
                            <div className={styles.researchingLabel}>DECRYPTION IN PROGRESS</div>
                            <div className={styles.researchTimer}>{timeLeft.toFixed(1)}s</div>
                            <div className={styles.researchTrack}>
                                <div className={styles.researchFill} style={{ width: `${Math.max(5, (1 - (timeLeft / (bp.researchDuration || 60))) * 100)}%` }} />
                            </div>
                        </div>
                    )}

                    {status === 'ready' && (
                        <div className={styles.readyState}>
                            <div className={styles.costRow}>
                                <div>
                                    <div className={styles.costRowLabel}>ACTIVATION COST</div>
                                    <div className={styles.costRowAmounts}>
                                        <img src="/assets/Icons/MeteoriteDust.png" className={styles.dustIcon} />
                                        <span className={canDeploy ? styles.costAmountReady : styles.costAmountInsufficient}>{cost.toLocaleString()}</span>
                                        <span className={styles.dustLabel}>DUST</span>
                                    </div>
                                    {!canDeploy && <div className={styles.insufficientMsg}>INSUFFICIENT DUST ({Math.floor(gs.player.dust).toLocaleString()} available)</div>}
                                </div>
                            </div>

                            {alreadyActive ? (
                                <div className={styles.alreadyActive}>ALREADY ACTIVE</div>
                            ) : (
                                <button
                                    onClick={handleDeploy}
                                    disabled={!canDeploy}
                                    className={`${styles.deployBtn} ${canDeploy ? styles.deployBtnEnabled : styles.deployBtnDisabled}`}
                                >
                                    ⚡ DEPLOY PROTOCOL
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'active' && (
                        <div className={styles.activeBlock}>
                            {charges !== undefined ? (
                                <div>
                                    <div className={styles.activeLabel}>USES REMAINING</div>
                                    <div className={styles.activeValue}>
                                        {charges}<span className={styles.activeValueSub}>/ 50</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className={styles.activeLabel}>TIME REMAINING</div>
                                    <div className={styles.activeValue}>{activeTimeLeft.toFixed(0)}s</div>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressFill} style={{ width: `${bp.duration > 0 ? Math.min(100, (activeTimeLeft / bp.duration) * 100) : 100}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'broken' && (
                        <div className={styles.brokenBlock}>PROTOCOL EXHAUSTED</div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div
            className={`${styles.root} ${isAlertActive ? styles.rootAlert : styles.rootNormal}`}
            style={{
                '--theme-color': themeColor,
                '--theme-secondary': themeColorSecondary,
                '--theme-rgba': themeColorRgba,
                '--theme-bg-rgba': themeColorBgRgba,
            } as ThemeCSSVariables}
        >
            <div className={`${styles.scannerBg} ${(recalibrateSlot || lockedItem || hoveredItem || hoveredBlueprint || selectedBestiaryEnemy) ? styles.scannerBgDimmed : ''}`}>
                <div className={styles.perspectiveGrid} />
                <div className={styles.scanLine} />
            </div>

            <div className={styles.contentLayer}>
                {gameState.pendingLegendaryHex ? (
                    <LegendaryDetail hex={gameState.pendingLegendaryHex} gameState={gameState} hexIdx={-1} pending={true} placementAlert={placementAlert} />
                ) : (hoveredHex && !movedItem) ? (
                    <LegendaryDetail hex={hoveredHex.hex} gameState={gameState} hexIdx={hoveredHex.index} pending={false} />
                ) : (hoveredBlueprint && !movedItem) ? (
                    (() => {
                        const isResearching = hoveredBlueprint.status === 'researching';
                        const timeLeft = isResearching && hoveredBlueprint.researchFinishTime ? Math.max(0, hoveredBlueprint.researchFinishTime - gameState.gameTime) : 0;

                        return (
                            <div className={styles.bpHoverPanel}>
                                {isResearching ? (
                                    <>
                                        <div className={styles.bpHoverResearchHeader}>
                                            <div className={styles.bpHoverResearchLabel}>DECRYPTION IN PROGRESS</div>
                                            <div className={styles.bpHoverResearchTitle}>ENCRYPTED PROTOCOL</div>
                                        </div>
                                        <div className={styles.bpHoverResearchCenter}>
                                            <div className={styles.bpHoverHexOuter}>
                                                <div className={styles.bpHoverHexInner}>
                                                    <img src={getBlueprintImage(hoveredBlueprint.status)} className={styles.bpHoverHexImg} />
                                                    <div className={styles.bpHoverScanBar} />
                                                </div>
                                            </div>

                                            <div className={styles.bpHoverTimerWrap}>
                                                <div className={styles.bpHoverTimer}>{timeLeft.toFixed(1)}s</div>
                                                <div className={styles.bpHoverTimerSub}>PARSING SYSTEM PACKETS...</div>
                                            </div>

                                            <div className={styles.bpHoverProgressTrack}>
                                                <div className={styles.bpHoverProgressFill} style={{ width: `${Math.max(5, (1 - (timeLeft / (hoveredBlueprint.researchDuration || 60))) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.bpHoverReadyHeader}>
                                            <div className={styles.bpHoverReadyLabel}>BLUEPRINT PROTOCOL</div>
                                            <div className={styles.bpHoverReadyTitle}>{hoveredBlueprint.name}</div>
                                        </div>
                                        <div className={styles.bpHoverBody}>
                                            <div className={styles.bpHoverMeta}>
                                                <span className={styles.bpHoverMetaKey}>ID:</span>
                                                <span className={styles.bpHoverMetaSerial}>{hoveredBlueprint.serial}</span>
                                                <span className={styles.bpHoverMetaDivider} />
                                                <span className={styles.bpHoverMetaKey}>CLASS:</span>
                                                <span>PROTO-X</span>
                                            </div>

                                            <div className={styles.bpHoverDescBlock}>{hoveredBlueprint.desc}</div>

                                            {(() => {
                                                const charges = gameState.activeBlueprintCharges[hoveredBlueprint.type];
                                                const endTime = gameState.activeBlueprintBuffs[hoveredBlueprint.type];
                                                const isActive = hoveredBlueprint.status === 'active';
                                                const isBroken = hoveredBlueprint.status === 'broken';

                                                if (isActive && charges !== undefined) {
                                                    return (
                                                        <div className={styles.statusChargesBlock}>
                                                            <div className={styles.statusChargesLabel}>USES REMAINING</div>
                                                            <div className={styles.statusChargesValue}>
                                                                {charges}<span className={styles.statusChargesValueSub}>/ 50</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isActive && endTime !== undefined) {
                                                    const left = Math.max(0, endTime - gameState.gameTime);
                                                    const total = hoveredBlueprint.duration;
                                                    const pct = total > 0 ? Math.min(100, (left / total) * 100) : 100;
                                                    return (
                                                        <div className={styles.statusTimerBlock}>
                                                            <div className={styles.statusTimerRow}>
                                                                <div className={styles.statusTimerLabel}>TIME REMAINING</div>
                                                                <div className={styles.statusTimerValue}>{left.toFixed(0)}s</div>
                                                            </div>
                                                            <div className={styles.statusTimerTrack}>
                                                                <div className={styles.statusTimerFill} style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                if (isBroken) {
                                                    return <div className={styles.statusBrokenBlock}>PROTOCOL EXHAUSTED — RECYCLE FOR DUST</div>;
                                                }

                                                return null;
                                            })()}

                                            <div className={styles.bpCostBlock}>
                                                <div>
                                                    <div className={styles.bpCostLabel}>{t.activation.title}</div>
                                                    <div className={styles.bpCostAmountRow}>
                                                        <span className={styles.bpCostAmountValue}>{hoveredBlueprint.cost.toLocaleString()}</span>
                                                        <span className={styles.bpCostAmountLabel}>{t.activation.dustRequired}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.bpCostIcon}>
                                                    <div className={styles.bpCostIconDiamond} />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })()
                ) : (hoveredItem && !movedItem && (!recalibrateSlot || hoveredItem.item !== recalibrateSlot)) ? (
                    (hoveredItem.item as Blueprint).isBlueprint ? (
                        renderBlueprintPanel(hoveredItem.item as Blueprint, gameState, onUpdate)
                    ) : (
                        <div className={styles.itemTooltipWrap}>
                            <div className={styles.itemTooltipBg} />
                            <MeteoriteTooltip meteorite={hoveredItem.item as Meteorite} gameState={gameState} meteoriteIdx={hoveredItem.index} x={0} y={0} isEmbedded={true} />
                        </div>
                    )
                ) : recalibrateSlot ? (
                    <div className={styles.recalibrateWrap}>
                        <RecalibrateInterface
                            item={recalibrateSlot}
                            gameState={gameState}
                            onClose={handleExitRecalibrate}
                            onUpgradeQuality={() => { if (upgradeMeteoriteQuality(gameState, recalibrateSlot)) onUpdate?.(); }}
                            onRerollType={(indices: number[]) => {
                                if (rerollPerkType(gameState, recalibrateSlot, indices)) {
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
                        <div
                            className={styles.recalibrateDragHandle}
                            onMouseDown={(e) => {
                                if (e.button === 0 && setMovedItem) {
                                    e.preventDefault();
                                    setMovedItem({ item: recalibrateSlot, source: 'recalibrate', index: -1 });
                                }
                            }}
                        />
                    </div>
                ) : lockedItem ? (
                    (lockedItem.item as Blueprint).isBlueprint ? (
                        renderBlueprintPanel(lockedItem.item as Blueprint, gameState, onUpdate)
                    ) : (
                        <div className={styles.lockedTooltipWrap}>
                            <MeteoriteTooltip meteorite={lockedItem.item as Meteorite} gameState={gameState} meteoriteIdx={lockedItem.index} x={0} y={0} isEmbedded={true} />
                        </div>
                    )
                ) : selectedBestiaryEnemy ? (
                    <BestiaryDetailView entry={selectedBestiaryEnemy} />
                ) : extractionDialogActive ? (
                    <div className={styles.terminalWrap}>
                        <div ref={terminalRef} className={`${styles.terminal} ${isAlertActive ? styles.terminalAlert : styles.terminalDefault}`}>
                            {extractionMessages.slice(0, gameState.extractionMessageIndex + 1).map((msg: ExtractionMessage, i: number) => {
                                const isCurrent = i === gameState.extractionMessageIndex;
                                const fullText = msg.text;
                                let displayedText = fullText;
                                if (isCurrent && !msg.isPause) {
                                    const start = gameState.extractionMessageTimes?.[i] || 0;
                                    const now = gameState.extractionDialogTime || 0;
                                    const elapsed = Math.max(0, now - start);
                                    const speed = 0.03;
                                    const charCount = Math.floor(elapsed / speed);
                                    displayedText = fullText.slice(0, charCount);
                                }

                                return (
                                    <div key={i} className={`${styles.terminalLine} ${msg.speaker === 'you' ? styles.terminalLineYou : styles.terminalLineOrbit}`}>
                                        <span className={styles.terminalSpeaker}>{msg.speaker?.toUpperCase()}:</span>
                                        {displayedText}
                                        {isCurrent && <span className={styles.typewriterCursor}></span>}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className={styles.terminalEnd} />
                        </div>
                    </div>
                ) : (
                    <div className={styles.idleState}>
                        <div className={styles.spinnerOuter}>
                            <div className={`${styles.spinnerRing} ${['active', 'arrived', 'departing'].includes(gameState.extractionStatus) ? styles.spinnerRingAlert : styles.spinnerRingDefault}`} />
                            <div className={styles.spinnerInnerRing} />

                            <div className={styles.spinnerContent}>
                                {gameState.extractionStatus === 'active' ? (
                                    <>
                                        <div className={styles.extractionArrivalIn}>{t.matrix.arrivalIn}</div>
                                        <div className={styles.extractionTimer}>{Math.ceil(gameState.extractionTimer)}s</div>
                                        <div className={styles.extractionSecureLZ}>{t.matrix.secureLZ}</div>
                                    </>
                                ) : gameState.extractionStatus === 'arrived' ? (
                                    <>
                                        <div className={styles.extractionArrived}>{t.matrix.shipLanded}</div>
                                        <div className={styles.extractionArrivedMsg}>
                                            {t.matrix.goTo} <span className={styles.extractionArrivedLZ}>{gameState.extractionSectorLabel || t.matrix.landingZone}</span>
                                        </div>
                                    </>
                                ) : gameState.extractionStatus === 'departing' ? (
                                    <div className={styles.extractionDeparting}>{t.matrix.departing}</div>
                                ) : (
                                    <div className={styles.extractionWaiting}>{t.matrix.waitingSignalShort}</div>
                                )}
                            </div>
                        </div>

                        {gameState.extractionStatus === 'none' && (
                            <div className={`${styles.extractionNoneArea} ${gameState.player.dust >= 10000 ? '' : styles.extractionNoneAreaDimmed}`}>
                                <div className={styles.extractionNoneLabel}>{t.activation.waitingSignal}</div>
                                <div className={gameState.player.dust >= 10000 ? styles.extractionNoneDustReady : styles.extractionNoneDustWaiting}>
                                    {t.matrix.evacuationGoal.replace('{amount}', Math.floor(gameState.player.dust).toLocaleString())}
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
                                        className={styles.extractionNoneBtn}
                                    >
                                        {t.matrix.initiateEvacuation}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.frameOverlay} />
        </div>
    );
};
