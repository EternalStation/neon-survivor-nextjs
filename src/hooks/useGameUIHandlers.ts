import { useCallback } from 'react';
import { GameState, UpgradeChoice, LegendaryHex, PlayerClass } from '../logic/core/types';
import { createInitialGameState } from '../logic/core/GameState';
import { applyUpgrade, spawnUpgrades } from '../logic/upgrades/UpgradeLogic';
import { syncLegendaryHex, applyLegendarySelection } from '../logic/upgrades/LegendaryLogic';
import { playSfx } from '../logic/audio/AudioLogic';
import { calcStat } from '../logic/utils/MathUtils';

interface UseGameUIHandlersProps {
    gameState: React.MutableRefObject<GameState>;
    setGameOver: (over: boolean) => void;
    setUpgradeChoices: (choices: UpgradeChoice[] | null) => void;
    setBossWarning: (warning: number | null) => void;
    setShowSettings: (show: boolean) => void;
    setShowStats: (show: boolean) => void;
    setShowModuleMenu: (show: boolean | ((prev: boolean) => boolean)) => void;
    setShowLegendarySelection: (show: boolean) => void;
    setUiState: (fn: (prev: number) => number) => void;
    setPortalError: (error: boolean) => void;
}

export function useGameUIHandlers({
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
}: UseGameUIHandlersProps) {

    const triggerPortal = useCallback(() => {
        const cost = Math.floor(1 + gameState.current.gameTime / 60);

        // --- PROGRESSION GATE: First Boss & Neural Gate Blueprint Required ---
        if (gameState.current.bossKills === 0 || !gameState.current.portalsUnlocked) {
            setPortalError(true);
            setUiState(p => p + 1);
            setTimeout(() => {
                setPortalError(false);
                setUiState(p => p + 1);
            }, 1000);
            return false;
        }

        // Block portal use during evacuation (One way trip only)
        if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(gameState.current.extractionStatus) || gameState.current.portalOneTimeUse) {
            setPortalError(true);
            setUiState(p => p + 1);
            setTimeout(() => {
                setPortalError(false);
                setUiState(p => p + 1);
            }, 1000);
            return false;
        }

        // --- VOID BURROWER DIMENSIONAL SUPPRESSION ---
        const hasWorm = gameState.current.enemies.some(e => e.shape === 'worm' && !e.dead);
        if (hasWorm) {
            gameState.current.portalBlockedByWorms = true;
            setPortalError(true);
            playSfx('stun-disrupt'); // Distorted electronic sound
            setUiState(p => p + 1);
            setTimeout(() => {
                setPortalError(false);
                gameState.current.portalBlockedByWorms = false;
                setUiState(p => p + 1);
            }, 2000);
            return false;
        }

        if (gameState.current.portalState === 'closed') {
            if (gameState.current.player.dust >= cost) {
                gameState.current.player.dust -= cost;
                gameState.current.portalState = 'warn';
                gameState.current.portalTimer = 10;
                playSfx('warning');
                setPortalError(false);
                setUiState(p => p + 1);
                return true;
            } else {
                setPortalError(true);
                setUiState(p => p + 1);
                setTimeout(() => {
                    setPortalError(false);
                    setUiState(p => p + 1);
                }, 1000);
            }
        }
        return false;
    }, [gameState, setPortalError, setUiState]);

    const restartGame = useCallback((selectedClass?: PlayerClass, startingArenaId: number = 0, username?: string, tutorialEnabled: boolean = true, gameMode: 'single' | 'multiplayer' = 'single', multiplayerConfig: any = null) => {
        const classToUse = selectedClass || gameState.current.moduleSockets.center || undefined;
        gameState.current = createInitialGameState(classToUse, startingArenaId, tutorialEnabled, gameMode, multiplayerConfig);
        if (username) gameState.current.playerName = username;

        setGameOver(false);
        setUpgradeChoices(null);
        setBossWarning(null);
        setShowSettings(false);
        setShowModuleMenu(false);
        gameState.current.showStats = false;
        gameState.current.showSettings = false;
        gameState.current.showModuleMenu = false;
    }, [gameState, setGameOver, setUpgradeChoices, setBossWarning, setShowSettings, setShowModuleMenu]);

    const handleUpgradeSelect = useCallback((choice: UpgradeChoice) => {
        applyUpgrade(gameState.current, choice);
        setUpgradeChoices(null);
    }, [gameState, setUpgradeChoices]);

    const handleUpgradeReroll = useCallback(() => {
        if (gameState.current.player.rerolls > 0) {
            gameState.current.player.rerolls--;
            // Pass true to bypass standard tier logic if we just want a fresh roll
            // Wait, spawnUpgrades second arg is isAnomaly. false is usually correct.
            const choices = spawnUpgrades(gameState.current, false);
            setUpgradeChoices(choices);
            playSfx('reroll');
        }
    }, [gameState, setUpgradeChoices]);

    const handleLegendarySelect = useCallback((selection: LegendaryHex) => {
        const state = gameState.current;
        const existingIdx = state.moduleSockets.hexagons.findIndex(h => h && h.type === selection.type);

        if (existingIdx !== -1) {
            const existing = state.moduleSockets.hexagons[existingIdx]!;
            existing.level = Math.min(5, existing.level + 1);

            if (!existing.killsAtLevel) existing.killsAtLevel = {};
            existing.killsAtLevel[existing.level] = state.killCount;

            if (!existing.timeAtLevel) existing.timeAtLevel = {};
            existing.timeAtLevel[existing.level] = state.gameTime;

            syncLegendaryHex(state, existing);
            state.upgradingHexIndex = existingIdx;
            state.upgradingHexTimer = 3.0;

            state.showModuleMenu = true;
            state.isPaused = true;
            state.showLegendarySelection = false;

            setShowLegendarySelection(false);
            setShowModuleMenu(true);
            playSfx('merge-complete');
        } else {
            applyLegendarySelection(state, selection);
            setShowLegendarySelection(false);
            if (state.showModuleMenu) setShowModuleMenu(true);
        }
    }, [gameState, setShowLegendarySelection, setShowModuleMenu]);

    const handleModuleSocketUpdate = useCallback((type: 'hex' | 'diamond', index: number, item: any) => {
        if (type === 'hex') {
            gameState.current.moduleSockets.hexagons[index] = item;
            gameState.current.pendingLegendaryHex = null;
        } else {
            gameState.current.moduleSockets.diamonds[index] = item;
        }
        if (item) {
            playSfx('socket-place');
            gameState.current.lastPlacement = {
                type,
                index,
                timestamp: Date.now()
            };
        }
        setUiState(prev => prev + 1);
    }, [gameState, setUiState]);

    const updateInventorySlot = useCallback((index: number, item: any) => {
        gameState.current.inventory[index] = item;
        setUiState(prev => prev + 1);
    }, [gameState, setUiState]);

    const toggleModuleMenu = useCallback(() => {
        setShowModuleMenu(prev => {
            const isExtractionActive = ['requested', 'waiting'].includes(gameState.current.extractionStatus);
            if (prev && isExtractionActive) return prev;

            const next = !prev;
            gameState.current.showModuleMenu = next;

            if (next) {
                setShowSettings(false);
                setShowStats(false);
                gameState.current.showSettings = false;
                gameState.current.showStats = false;
            }
            return next;
        });
    }, [gameState, setShowSettings, setShowStats, setShowModuleMenu]);

    const recycleMeteorite = useCallback((source: 'inventory' | 'diamond', index: number, amount: number) => {
        if (source === 'inventory') {
            gameState.current.inventory[index] = null;
        } else {
            gameState.current.moduleSockets.diamonds[index] = null;
        }
        gameState.current.player.dust += amount;
        playSfx('recycle');
        setUiState(p => p + 1);
    }, [gameState, setUiState]);

    const spendDust = useCallback((amount: number) => {
        if (gameState.current.player.dust >= amount) {
            gameState.current.player.dust -= amount;
            setUiState(p => p + 1);
            return true;
        }
        return false;
    }, [gameState, setUiState]);

    const onViewChassisDetail = useCallback(() => {
        gameState.current.chassisDetailViewed = true;
        setUiState(p => p + 1);
    }, [gameState, setUiState]);

    const skipTime = useCallback((min: number) => {
        const state = gameState.current;
        state.gameTime = min * 60;

        // Aligned Boss Schedule Logic
        const schedule = [2, 4, 6, 8, 10]; // 5 bosses per tier, every 2 minutes
        const current10MinCycle = Math.floor(min / 10);
        const currentMinuteInCycle = min % 10;

        let nextMinuteInCycle = -1;
        for (const m of schedule) {
            if (m > currentMinuteInCycle + 0.01) {
                nextMinuteInCycle = m;
                break;
            }
        }

        if (nextMinuteInCycle !== -1) {
            state.nextBossSpawnTime = (current10MinCycle * 10 + nextMinuteInCycle) * 60;
        } else {
            state.nextBossSpawnTime = ((current10MinCycle + 1) * 10 + schedule[0]) * 60;
        }

        const p = state.player;
        p.hp.base *= 30;
        p.dmg.base *= 30;
        p.atk.base *= 30;
        p.curHp = calcStat(p.hp);
        p.level = Math.max(p.level, min * 3);

        setUiState(p => p + 1);
        playSfx('power-up');
    }, [gameState, setUiState]);

    return {
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
        skipTime
    };
}
