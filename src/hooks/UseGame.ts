import { useRef, useEffect, useState } from 'react';
import { createInitialGameState } from '../logic/core/GameState';
import { resetEnemyAggro } from '../logic/enemies/EnemyLogic';
import { updateExtraction } from '../logic/mission/ExtractionLogic';
import { playSfx, duckMusic, restoreMusic, pauseMusic, resumeMusic, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience } from '../logic/audio/AudioLogic';
import { syncAllLegendaries } from '../logic/upgrades/LegendaryLogic';
import { renderGame } from '../logic/rendering/GameRenderer';
import { useGameInput } from './UseGameInput';
import { useGameLogic } from './UseGameLogic';
import { useOrbit } from './UseOrbit';
import { useGameUIHandlers } from './UseGameUIHandlers';
import { updateTutorial } from '../logic/core/TutorialLogic';
import type { GameState, UpgradeChoice, PlayerClass } from '../logic/core/Types';
import { useMultiplayerGame } from './UseMultiplayerGame';
import { useLanguage } from '../lib/LanguageContext';
import { getKeybinds } from '../logic/utils/Keybinds';

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

    const showStatsRef = useRef(false);
    const showSettingsRef = useRef(false);
    const showModuleMenuRef = useRef(false);
    const showBossSkillDetailRef = useRef(false);
    const showFeedbackModalRef = useRef(false);
    const showAdminConsoleRef = useRef(false);
    const upgradeChoicesRef = useRef<UpgradeChoice[] | null>(null);
    const wasModuleMenuOpenRef = useRef(false);
    const wasPausedRef = useRef(false);

    const meteoriteImagesRef = useRef<Record<string, HTMLImageElement>>({});

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
        return saved ? parseFloat(saved) : 1.2;
    });

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

    showStatsRef.current = showStats;
    showSettingsRef.current = showSettings;
    showModuleMenuRef.current = showModuleMenu;
    showBossSkillDetailRef.current = showBossSkillDetail;
    showFeedbackModalRef.current = showFeedbackModal;
    showAdminConsoleRef.current = showAdminConsole;
    upgradeChoicesRef.current = upgradeChoices;

    if (showModuleMenu) {
        wasModuleMenuOpenRef.current = true;
    }

    gameState.current.showModuleMenu = showModuleMenu;
    gameState.current.showStats = showStats;
    gameState.current.showSettings = showSettings;
    gameState.current.showBossSkillDetail = showBossSkillDetail;
    gameState.current.showFeedbackModal = showFeedbackModal;
    gameState.current.showAdminConsole = showAdminConsole;
    gameState.current.showCheatPanel = showCheatPanel;
    gameState.current.isUpgradeMenuOpen = !!upgradeChoices;
    gameState.current.isPaused = showStats || showSettings || showModuleMenu || !!upgradeChoices || showLegendarySelection || showBossSkillDetail || showFeedbackModal || showAdminConsole || showCheatPanel;

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

    const windowScaleFactor = useRef(1);
    const { inputVector, mousePos, handleJoystickInput } = useGameInput({
        gameState,
        keys,
        setShowSettings,
        setShowStats,
        setShowModuleMenu,
        setShowBossSkillDetail,
        setShowAdminConsole,
        setShowCheatPanel,
        setGameOver,
        triggerPortal,
        refreshUI: () => setUiState(p => p + 1),
        skipTime,
        windowScaleFactor
    });

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

    const { sendInputToHost } = useMultiplayerGame(gameState, gameStarted);

    useEffect(() => {
        if (!gameStarted) return;

        const qualities = ['Broken', 'Damaged', 'New'];
        for (let i = 0; i <= 5; i++) {
            qualities.forEach(q => {
                const key = `M${i}${q}`;
                if (!(meteoriteImagesRef.current as any)[key]) {
                    const img = new Image();
                    img.src = `/assets/meteorites/${key}.png`;
                    meteoriteImagesRef.current[key] = img;
                }
            });
        }
        const assets = [
            { key: 'zombie', src: '/assets/Enemies/Zombie.png' },
            { key: 'fear', src: '/assets/Icons/FearSkill.png' },
            { key: 'deathMark', src: '/assets/Icons/DeathMark.png' },
            { key: 'blueprint', src: '/assets/Icons/Blueprint.png' },
            { key: 'ship', src: '/assets/Enteties/Ship.png' },
            { key: 'void_flux', src: '/assets/Icons/Void Flux.png' },
            { key: 'dust_pile', src: '/assets/Icons/MeteoriteDust.png' }
        ];

      const hexes = ['ComCrit', 'ComWave', 'DefPuddle', 'DefEpi', 'DefShield', 'HiveMother', 'MalwarePrime', 'EventHorizon', 'CosmicBeam', 'AigisVortex', 'EcoDMG', 'EcoXP', 'EcoHP', 'ComLife', 'DefBattery', 'ComRad', 'EcoPlating'];

        assets.forEach(a => {
            if (!(meteoriteImagesRef.current as any)[a.key]) {
                const img = new Image();
                img.src = a.src;
                (meteoriteImagesRef.current as any)[a.key] = img;
            }
        });

        hexes.forEach(hex => {
            if (!(meteoriteImagesRef.current as any)[hex]) {
                const img = new Image();
                const ext = (hex === 'AigisVortex') ? 'PNG' : 'png';
                img.src = `/assets/hexes/${hex}.${ext}`;
                (meteoriteImagesRef.current as any)[hex] = img;
            }
        });

        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../logic/core/GameWorkerLogic.ts', import.meta.url), { type: 'module' });
            workerRef.current.postMessage({ type: 'start', interval: 1000 / 60 });
        }

        const handleVisibility = () => {
            isTabHidden.current = document.visibilityState === 'hidden';
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [gameStarted]);

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        if (showModuleMenu) setUiState(p => p + 1);
    }, [showModuleMenu]);

    useEffect(() => {
        gameState.current.language = language;
    }, [language]);

    useEffect(() => {
        const handleKeybindsChanged = () => {
            gameState.current.keybinds = getKeybinds();
        };
        window.addEventListener('keybindsChanged', handleKeybindsChanged);
        return () => window.removeEventListener('keybindsChanged', handleKeybindsChanged);
    }, []);

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
                if (wasModuleMenuOpenRef.current) {
                    state.unpauseDelay = 0.8;
                    state.unpauseMode = 'slow_motion';
                    wasModuleMenuOpenRef.current = false;
                } else {
                    state.unpauseDelay = 0;
                    state.unpauseMode = 'normal';
                }
                resetEnemyAggro(state);
            }
            if (isMenuOpen && !wasPausedRef.current) {
                Object.keys(keys.current).forEach(k => keys.current[k] = false);
            }

            wasPausedRef.current = !!isMenuOpen;
            state.isPaused = !!isMenuOpen;

            if (showSettingsRef.current || showStatsRef.current || showModuleMenuRef.current) {
                resumeMusic();
                duckMusic();
            } else {
                resumeMusic();
                restoreMusic();
            }

            if (state.isPaused || state.gameOver) accRef.current = 0;
            else accRef.current += safeDt;

            const FIXED_STEP = 1 / 60;

            let steps = 0;
            if (!state.isPaused && !state.gameOver) {
                if (state.flashIntensity && state.flashIntensity > 0) {
                    state.flashIntensity -= safeDt * 2;
                    if (state.flashIntensity < 0) state.flashIntensity = 0;
                }

                if (state.unpauseDelay && state.unpauseDelay > 0) {
                    if (state.unpauseMode === 'slow_motion') {
                        const totalDuration = 0.8;
                        const progress = 1 - (state.unpauseDelay / totalDuration);

                        state.unpauseDelay -= safeDt;
                        if (state.unpauseDelay <= 0) {
                            state.unpauseDelay = 0;
                            state.flashIntensity = 0.8;
                            accRef.current = 0;
                        }

                        const currentSpeedObj = 0.05 + (0.95 * progress);
                        accRef.current -= safeDt;
                        accRef.current += safeDt * currentSpeedObj;

                    } else {
                        state.unpauseDelay -= safeDt;
                        accRef.current = 0;
                    }
                }

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

                if (state.extractionStatus !== 'none') {
                    setUiState(p => p + 1);
                }
            }

            if (accRef.current > FIXED_STEP * 20) accRef.current = 0;

            if (!state.isPaused && (['requested', 'waiting'].includes(state.extractionStatus) || state.portalBlockedByWorms)) {
                updateExtraction(state, safeDt);
                setUiState(p => p + 1);
            }

            if (gameStarted && !state.multiplayer.isHost && state.multiplayer.active) {
                sendInputToHost(keys.current, inputVector.current, mousePos.current);
            }

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
            if (steps > 0) {
                state.interactPressed = false;
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
