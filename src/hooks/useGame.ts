import { useRef, useEffect, useState } from 'react';
import { createInitialGameState } from '../logic/core/GameState';
import { resetEnemyAggro } from '../logic/enemies/EnemyLogic';
import { updateExtraction } from '../logic/mission/ExtractionLogic';
import { playSfx, updateBGMPhase, duckMusic, restoreMusic, pauseMusic, resumeMusic, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, fadeOutMusic } from '../logic/audio/AudioLogic';
import { syncAllLegendaries } from '../logic/upgrades/LegendaryLogic';
import { renderGame } from '../logic/rendering/GameRenderer';
import { useGameInput } from './useGameInput';
import { useGameLogic } from './useGameLogic';
import { useGameUIHandlers } from './useGameUIHandlers';
import type { GameState, UpgradeChoice, PlayerClass } from '../logic/core/types';

export function useGameLoop(gameStarted: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameState = useRef<GameState>(createInitialGameState());
    const requestRef = useRef<number>(0);

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
    const upgradeChoicesRef = useRef<UpgradeChoice[] | null>(null);

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

    // Sync refs with state
    showStatsRef.current = showStats;
    showSettingsRef.current = showSettings;
    showModuleMenuRef.current = showModuleMenu;
    showBossSkillDetailRef.current = showBossSkillDetail;
    upgradeChoicesRef.current = upgradeChoices;

    // Sync GameState flags
    gameState.current.showModuleMenu = showModuleMenu;
    gameState.current.showStats = showStats;
    gameState.current.showSettings = showSettings;
    gameState.current.showBossSkillDetail = showBossSkillDetail;
    gameState.current.isPaused = showStats || showSettings || showModuleMenu || !!upgradeChoices || showLegendarySelection || showBossSkillDetail;

    // Connect UI Handlers
    const {
        restartGame,
        handleUpgradeSelect,
        handleLegendarySelect,
        handleModuleSocketUpdate,
        updateInventorySlot,
        toggleModuleMenu,
        recycleMeteorite,
        spendDust,
        onViewChassisDetail,
        triggerPortal
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
        setPortalError
    });

    // Input Hook
    const { keys, inputVector, mousePos, handleJoystickInput } = useGameInput({
        gameState,
        setShowSettings,
        setShowStats,
        setShowModuleMenu,
        setGameOver,
        triggerPortal,
        refreshUI: () => setUiState(p => p + 1)
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
        bossWarning
    });

    useEffect(() => {
        const qualities = ['Broken', 'Damaged', 'New'];
        for (let i = 1; i <= 9; i++) {
            qualities.forEach(q => {
                const key = `M${i}${q}`;
                const img = new Image();
                img.src = `/assets/meteorites/${key}.png`;
                meteoriteImagesRef.current[key] = img;
            });
        }
        const zombieImg = new Image();
        zombieImg.src = '/assets/Enemies/Zombie.png';
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

            const isMenuOpen = showStatsRef.current || showSettingsRef.current || showModuleMenuRef.current || upgradeChoicesRef.current !== null || state.showLegendarySelection || showBossSkillDetailRef.current;

            if (!isMenuOpen && state.isPaused) {
                state.unpauseDelay = 0.2;
                resetEnemyAggro(state);
            }
            if (isMenuOpen && !state.isPaused) {
                Object.keys(keys.current).forEach(k => keys.current[k] = false);
            }
            state.isPaused = isMenuOpen;

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
                if (state.unpauseDelay && state.unpauseDelay > 0) {
                    state.unpauseDelay -= safeDt;
                    accRef.current = 0;
                } else {
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
                }
            } else if (state.isPaused && !state.gameOver) {
                updateExtraction(state, safeDt);
            }

            if (accRef.current > FIXED_STEP * 20) accRef.current = 0;

            if (['requested', 'waiting'].includes(state.extractionStatus)) {
                updateExtraction(state, safeDt);
                setUiState(p => p + 1);
            }

            updateBGMPhase(state.gameTime);

            if (!state.isPaused) {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    try {
                        renderGame(ctx, state, meteoriteImagesRef.current, windowScaleFactor.current);
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
        portalCost: 0,
        onViewChassisDetail,
        showBossSkillDetail,
        setShowBossSkillDetail
    };
}
