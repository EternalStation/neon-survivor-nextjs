import { useRef, useEffect, useState } from 'react';
import { createInitialGameState } from '../logic/core/GameState';
import { resetEnemyAggro } from '../logic/enemies/EnemyLogic';
import { updateExtraction } from '../logic/mission/ExtractionLogic';
import { playSfx, updateBGMPhase, duckMusic, restoreMusic, pauseMusic, resumeMusic, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, fadeOutMusic } from '../logic/audio/AudioLogic';
import { syncAllLegendaries } from '../logic/upgrades/LegendaryLogic';
import { renderGame } from '../logic/rendering/GameRenderer';
import { useGameInput } from './useGameInput';
import { useGameLogic } from './useGameLogic';
import { useOrbit } from './useOrbit';
import { useGameUIHandlers } from './useGameUIHandlers';
import { updateTutorial } from '../logic/core/TutorialLogic';
import type { GameState, UpgradeChoice, PlayerClass } from '../logic/core/types';
import { useMultiplayerGame } from './useMultiplayerGame';
import { useLanguage } from '../lib/LanguageContext';

export function useGameLoop(gameStarted: boolean) {
    const { language } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameState = useRef<GameState>(createInitialGameState());
    const requestRef = useRef<number>(0);
    const keys = useRef<Record<string, boolean>>({});

    const lastTimeRef = useRef<number>(0);
    const accRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const workerRef = useRef<Worker | null>(null);
    const isTabHidden = useRef<boolean>(false);

    // Pause state refs
    const showStatsRef = useRef(false);
    const showSettingsRef = useRef(false);
    const showModuleMenuRef = useRef(false);
    const showBossSkillDetailRef = useRef(false);
    const showFeedbackModalRef = useRef(false);
    const showAdminConsoleRef = useRef(false);
    const upgradeChoicesRef = useRef<UpgradeChoice[] | null>(null);
    const wasModuleMenuOpenRef = useRef(false); // Track if module menu was just open
    const wasPausedRef = useRef(false); // Track internal pause state for transition detection

    const meteoriteImagesRef = useRef<Record<string, HTMLImageElement>>({});

    // UI State
    const [uiState, setUiState] = useState<number>(0);
    const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[] | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [bossWarning, setBossWarning] = useState<number | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showModuleMenu, setShowModuleMenu] = useState(false);
    const [portalError, setPortalError] = useState(false);
    const [showLegendarySelection, setShowLegendarySelection] = useState(false);
    const [showBossSkillDetail, setShowBossSkillDetail] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showAdminConsole, setShowAdminConsole] = useState(false);
    const [showCheatPanel, setShowCheatPanel] = useState(false);
    const [gameSpeedMult, setGameSpeedMultState] = useState<number>(() => {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('gameSpeedMult') : null;
        return saved ? parseFloat(saved) : 1.0;
    });

    // Orbit Assistant Hook
    const {
        updateOrbit,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerClassStreak,
        triggerWallIncompetence,
        triggerZeroPercentSnark,
        triggerIncubatorDestroyed
    } = useOrbit(gameState, () => setUiState(p => p + 1), keys);

    // Sync refs with state
    showStatsRef.current = showStats;
    showSettingsRef.current = showSettings;
    showModuleMenuRef.current = showModuleMenu;
    showBossSkillDetailRef.current = showBossSkillDetail;
    showFeedbackModalRef.current = showFeedbackModal;
    showAdminConsoleRef.current = showAdminConsole;
    upgradeChoicesRef.current = upgradeChoices;

    // Update washer ref while menu is open
    if (showModuleMenu) {
        wasModuleMenuOpenRef.current = true;
    }

    // Sync GameState flags
    gameState.current.showModuleMenu = showModuleMenu;
    gameState.current.showStats = showStats;
    gameState.current.showSettings = showSettings;
    gameState.current.showBossSkillDetail = showBossSkillDetail;
    gameState.current.showFeedbackModal = showFeedbackModal;
    gameState.current.showAdminConsole = showAdminConsole;
    gameState.current.showCheatPanel = showCheatPanel;
    gameState.current.isUpgradeMenuOpen = !!upgradeChoices;
    gameState.current.isPaused = showStats || showSettings || showModuleMenu || !!upgradeChoices || showLegendarySelection || showBossSkillDetail || showFeedbackModal || showAdminConsole || showCheatPanel;

    // Connect UI Handlers
    const {
        restartGame,
        handleUpgradeSelect,
        handleUpgradeReroll,
        handleLegendarySelect,
        handleModuleSocketUpdate,
        updateInventorySlot,
        toggleModuleMenu,
        recycleMeteorite,
        spendDust,
        onViewChassisDetail,
        triggerPortal,
        updateIncubatorSlot,
        skipTime
    } = useGameUIHandlers({
        gameState,
        setGameOver,
        setUpgradeChoices,
        setBossWarning,
        setShowSettings,
        setShowStats,
        setShowModuleMenu,
        setShowLegendarySelection,
        setUiState,
        setPortalError,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerWallIncompetence,
        triggerZeroPercentSnark
    });

    // Input Hook
    const { inputVector, mousePos, handleJoystickInput } = useGameInput({
        gameState,
        keys,
        setShowSettings,
        setShowStats,
        setShowModuleMenu,
        setShowAdminConsole,
        setShowCheatPanel,
        setGameOver,
        triggerPortal,
        refreshUI: () => setUiState(p => p + 1),
        skipTime
    });

    // Logic Hook
    const windowScaleFactor = useRef(1);
    const { updateLogic } = useGameLogic({
        gameState,
        keys,
        inputVector,
        mousePos,
        canvasRef,
        windowScaleFactor,
        setUpgradeChoices,
        setShowLegendarySelection,
        setGameOver,
        setBossWarning,
        bossWarning,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerWallIncompetence,
        triggerIncubatorDestroyed,
        onViewChassisDetail: () => {
            gameState.current.chassisDetailViewed = true;
            setUiState(p => p + 1);
        }
    });

    // Multiplayer Hook
    const { sendInputToHost } = useMultiplayerGame(gameState, gameStarted);



    useEffect(() => {
        const qualities = ['Broken', 'Damaged', 'New'];
        for (let i = 0; i <= 5; i++) {
            qualities.forEach(q => {
                const key = `M${i}${q}`;
                const img = new Image();
                img.src = `/assets/meteorites/${key}.png`;
                meteoriteImagesRef.current[key] = img;
            });
        }
        const zombieImg = new Image();
        zombieImg.src = `/assets/Enemies/Zombie.png`;
        (meteoriteImagesRef.current as any).zombie = zombieImg;
        const fearImg = new Image();
        fearImg.src = '/assets/Icons/FearSkill.png';
        (meteoriteImagesRef.current as any).fear = fearImg;
        const dmImg = new Image();
        dmImg.src = '/assets/Icons/DeathMark.png';
        (meteoriteImagesRef.current as any).deathMark = dmImg;
        ['ComCrit', 'ComWave', 'DefPuddle', 'DefEpi', 'DefShield', 'HiveMother', 'MalwarePrime', 'EventHorizon', 'CosmicBeam', 'AigisVortex', 'EcoDMG', 'EcoXP', 'EcoHP', 'ComLife', 'DefBattery', 'ComRad', 'EcoPlating'].forEach(hex => {
            const img = new Image();
            const ext = (hex === 'AigisVortex') ? 'PNG' : 'png';
            img.src = `/assets/hexes/${hex}.${ext}`;
            (meteoriteImagesRef.current as any)[hex] = img;
        });
        const bpImg = new Image();
        bpImg.src = '/assets/Icons/Blueprint.png';
        (meteoriteImagesRef.current as any).blueprint = bpImg;
        const shipImg = new Image();
        shipImg.src = '/assets/Enteties/Ship.png';
        (meteoriteImagesRef.current as any).ship = shipImg;
        const fluxImg = new Image();
        fluxImg.src = '/assets/Icons/Void Flux.png';
        (meteoriteImagesRef.current as any).void_flux = fluxImg;
        const dustImg = new Image();
        dustImg.src = '/assets/Icons/MeteoriteDust.png';
        (meteoriteImagesRef.current as any).dust_pile = dustImg;

        workerRef.current = new Worker(new URL('../logic/core/gameWorker.ts', import.meta.url), { type: 'module' });
        workerRef.current.postMessage({ type: 'start', interval: 1000 / 60 });

        const handleVisibility = () => {
            isTabHidden.current = document.visibilityState === 'hidden';
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            workerRef.current?.terminate();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (showModuleMenu) setUiState(p => p + 1);
    }, [showModuleMenu]);

    useEffect(() => {
        gameState.current.language = language;
    }, [language]);

    useEffect(() => {
        let cancelled = false;
        lastTimeRef.current = performance.now();
        const loop = () => {
            if (cancelled) return;
            const now = performance.now();
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;
            const safeDt = Math.min(dt, 0.25);

            if (isTabHidden.current) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const state = gameState.current;
            if (!gameStarted) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const isMenuOpen = showStatsRef.current || showSettingsRef.current || showModuleMenuRef.current || upgradeChoicesRef.current !== null || state.showLegendarySelection || showBossSkillDetailRef.current || showFeedbackModalRef.current || showAdminConsoleRef.current || state.showCheatPanel;

            if (!isMenuOpen && wasPausedRef.current) {
                // Determine unpause mode based on what was open
                if (wasModuleMenuOpenRef.current) {
                    console.log("Unpausing from Module Menu - STARTING SLOW MO (0.8s)");
                    // Slow Motion Unpause for Module Matrix
                    state.unpauseDelay = 0.8; // 0.8s duration
                    state.unpauseMode = 'slow_motion';
                    wasModuleMenuOpenRef.current = false; // Reset
                } else {
                    // Standard Unpause
                    console.log("Unpausing from Standard Menu");
                    state.unpauseDelay = 0; // Instant unpause
                    state.unpauseMode = 'normal';
                }
                resetEnemyAggro(state);
            }
            if (isMenuOpen && !wasPausedRef.current) {
                // Pause Just Started
                Object.keys(keys.current).forEach(k => keys.current[k] = false);
            }

            wasPausedRef.current = !!isMenuOpen; // Update tracker
            state.isPaused = !!isMenuOpen;

            if (showSettingsRef.current) pauseMusic();
            else if (showStatsRef.current || showModuleMenuRef.current) {
                resumeMusic();
                duckMusic();
            } else {
                resumeMusic();
                restoreMusic();
            }

            if (state.isPaused || state.gameOver) accRef.current = 0;
            else accRef.current += safeDt;

            const FIXED_STEP = 1 / 60;

            if (!state.isPaused && !state.gameOver) {
                // Update Flash Decay
                if (state.flashIntensity && state.flashIntensity > 0) {
                    state.flashIntensity -= safeDt * 2; // Fade out over 0.5s approx
                    if (state.flashIntensity < 0) state.flashIntensity = 0;
                }

                if (state.unpauseDelay && state.unpauseDelay > 0) {
                    // Logic for Unpause Transition
                    if (state.unpauseMode === 'slow_motion') {
                        // Slow Motion Ramp
                        const totalDuration = 0.8;
                        const progress = 1 - (state.unpauseDelay / totalDuration); // 0 -> 1

                        // Check for completion to trigger flash
                        state.unpauseDelay -= safeDt;
                        if (state.unpauseDelay <= 0) {
                            state.unpauseDelay = 0;
                            state.flashIntensity = 0.8;
                            accRef.current = 0;
                            console.log("Slow Mo Complete - FLASH TRIGGERED");
                        }

                        // Apply Time Dilation
                        // We want real-time to pass normally, but game logic updates fewer times.
                        // Lerp speed: 0.05 -> 1.0
                        const currentSpeedObj = 0.05 + (0.95 * progress);

                        // Accumulate time scaled by speed
                        // But wait, accRef accumulates REAL time (safeDt). 
                        // To simulate slow motion, we consume accRef slower? 
                        // Or we multiply the dt passed to updateLogic?
                        // If physics relies on fixed step 1/60, we must call updateLogic fewer times per second.

                        // Implementation: We effectively scale the accumulation.
                        // But accRef is already added above (accRef += safeDt).
                        // Let's subtract the 'ignored' time from accRef so it doesn't build up a huge buffer to catch up later.

                        // Actually, simpler: 
                        // If we are in slow motion, we just limit the number of steps or reduce accRef directly?
                        // Better: Scale the `safeDt` added to `accRef`. But that was lines above.
                        // Let's retrospectively adjust accRef here.

                        // Undo full addition
                        accRef.current -= safeDt;

                        // Add scaled addition
                        accRef.current += safeDt * currentSpeedObj;

                    } else {
                        // Normal Static Delay (Frozen)
                        state.unpauseDelay -= safeDt;
                        accRef.current = 0; // Prevent accumulation during hard freeze
                    }

                    // If we still have enough for a step after scaling (or if in slow mo), run it
                    // The standard loop below handles the actual updateLogic calls.
                    // For 'normal' mode, accRef is 0 so no updates happen.
                    // For 'slow_motion', accRef grows slowly, so fewer updates happen.
                }

                let steps = 0;
                while (accRef.current >= FIXED_STEP && steps < 20 && !state.isPaused && !state.gameOver) {
                    accRef.current -= FIXED_STEP;
                    steps++;
                    updateLogic(state, FIXED_STEP);
                    if (state.player.curHp <= 0 || state.gameOver) {
                        if (state.player.curHp < 0) state.player.curHp = 0;
                        state.gameOver = true;
                        setGameOver(true);
                        import('../logic/audio/AudioLogic').then(mod => mod.stopAllLoops());
                    }
                }
            } else if (state.isPaused && !state.gameOver) {
                updateTutorial(state, safeDt);
                updateExtraction(state, safeDt);
            }

            if (accRef.current > FIXED_STEP * 20) accRef.current = 0;

            if (!state.isPaused && (['requested', 'waiting'].includes(state.extractionStatus) || state.portalBlockedByWorms)) {
                updateExtraction(state, safeDt);
                setUiState(p => p + 1);
            }

            if (gameStarted && !state.multiplayer.isHost && state.multiplayer.active) {
                sendInputToHost(keys.current, inputVector.current, mousePos.current);
            }

            updateBGMPhase(state.gameTime);
            updateOrbit(safeDt);

            if (!state.isPaused) {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    try {
                        renderGame(ctx, state, meteoriteImagesRef.current, windowScaleFactor.current, language);
                    } catch (e) {
                        console.error("Render Error:", e);
                    }
                    try { ctx.restore(); } catch (e) { }
                }
            }

            if (state.upgradingHexTimer > 0) {
                state.upgradingHexTimer -= safeDt;
                if (state.upgradingHexTimer <= 0) {
                    state.upgradingHexTimer = 0;
                    state.upgradingHexIndex = null;
                }
            }

            if (state.showLegendarySelection && !showLegendarySelection) setShowLegendarySelection(true);
            if (state.showAdminConsole && !showAdminConsole) setShowAdminConsole(true);
            if (state.showFeedbackModal && !showFeedbackModal) setShowFeedbackModal(true);

            frameCountRef.current++;
            if (!state.isPaused && frameCountRef.current % 4 === 0) {
                syncAllLegendaries(state);
                setUiState(prev => prev + 1);
            }

            framesRef.current++;
            if (now - lastFpsUpdateRef.current >= 1000) {
                setFps(Math.round(framesRef.current * 1000 / (now - lastFpsUpdateRef.current)));
                framesRef.current = 0;
                lastFpsUpdateRef.current = now;
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        if (workerRef.current) {
            workerRef.current.onmessage = (e) => {
                if (e.data.type === 'tick' && isTabHidden.current && gameStarted) {
                    const state = gameState.current;
                    if (!state.isPaused && !state.gameOver) {
                        updateLogic(state, 1 / 60);
                    }
                }
            };
        }

        requestRef.current = requestAnimationFrame(loop);
        return () => {
            cancelled = true;
            cancelAnimationFrame(requestRef.current!);
        };
    }, [gameStarted, showLegendarySelection, showBossSkillDetail, updateLogic]);

    const [fps, setFps] = useState(60);
    const framesRef = useRef(0);
    const lastFpsUpdateRef = useRef(0);

    return {
        canvasRef,
        gameState: gameState.current,
        upgradeChoices,
        handleUpgradeSelect,
        handleUpgradeReroll,
        gameOver,
        restartGame,
        bossWarning,
        showStats,
        setShowStats,
        showSettings,
        setShowSettings,
        showModuleMenu,
        setShowModuleMenu,
        showLegendarySelection,
        handleLegendarySelect,
        handleModuleSocketUpdate,
        updateInventorySlot,
        updateIncubatorSlot,
        toggleModuleMenu,
        uiState,
        inputVector,
        handleJoystickInput,
        setWindowScaleFactor: (scale: number) => {
            windowScaleFactor.current = scale;
        },
        recycleMeteorite,
        spendDust,
        triggerPortal,
        fps,
        portalError,
        portalCost: Math.floor(1 + gameState.current.gameTime / 60),
        onViewChassisDetail,
        showBossSkillDetail,
        setShowBossSkillDetail,
        showFeedbackModal,
        setShowFeedbackModal,
        showAdminConsole,
        setShowAdminConsole,
        showCheatPanel,
        setShowCheatPanel,
        gameSpeedMult,
        setGameSpeedMult: (mult: number) => {
            const clamped = Math.max(0.1, Math.min(5.0, mult));
            if (typeof localStorage !== 'undefined') localStorage.setItem('gameSpeedMult', String(clamped));
            gameState.current.gameSpeedMult = clamped;
            setGameSpeedMultState(clamped);
        },
        skipTime,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerClassStreak,
        triggerWallIncompetence,
        triggerZeroPercentSnark
    };
}
