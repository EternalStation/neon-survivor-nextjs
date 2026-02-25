import { useCallback, useEffect, useRef } from 'react';
import { GameState } from '../logic/core/types';
import { playSfx } from '../logic/audio/AudioLogic';
import { AssistantEmotion } from '../components/hud/AssistantOverlay';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getDustValue } from '../components/modules/ModuleUtils';
import { getStoredLanguage } from '../lib/LanguageContext';
import { spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import {
    getIntroVariants,
    getRerollSnarks,
    getBrokeSnarks,
    getIncubatorSnarks,
    getIncubatorRerollLostSnarks,
    getGenericDeathSnarks,
    getProjectileDeathLine,
    getFastDeathLine,
    getAnomalyDeathLine,
    getClassStreak3Variants,
    getClassStreak4Variants,
    getWallWarnVariants,
    getWallEscalationLines,
    getZeroPercentWarningVariants,
    getZeroPercent5Variants,
    getFluxGrantLine,
} from '../lib/orbitTranslations';
import { getUiTranslation } from '../lib/uiTranslations';

export interface AssistantMessage {
    text: string;
    emotion: AssistantEmotion;
}

export const useOrbit = (gameState: React.MutableRefObject<GameState>, refreshUI: () => void) => {
    const hasIntroed = useRef(false);
    const lastGameStateRef = useRef<GameState | null>(null);

    // Simplified intro logic: we handle this in updateOrbit now to support restarts
    useEffect(() => {
        // Just reset the flag on mount
        hasIntroed.current = false;
        lastGameStateRef.current = null;
    }, []);

    const pushOrbitMessage = useCallback((msg: string | AssistantMessage, priority: boolean = false) => {
        const state = gameState.current.assistant;
        const msgObj = typeof msg === 'string' ? { text: msg, emotion: 'Normal' as AssistantEmotion } : msg;

        if (priority) {
            state.message = msgObj.text;
            state.emotion = msgObj.emotion;
            state.timer = 6.0; // 6 seconds display (Updated from 5.0)
            playSfx('orbit-talk');
            refreshUI();
        } else {
            state.queue.push(JSON.stringify(msgObj));
        }
    }, [gameState, refreshUI]);

    const updateOrbit = useCallback((dt: number) => {
        const state = gameState.current.assistant;

        // Detect Game Restart
        if (lastGameStateRef.current !== gameState.current) {
            hasIntroed.current = false;
            lastGameStateRef.current = gameState.current;
        }

        // --- INTRO TRIGGER (30% chance at start of each game) ---
        if (!hasIntroed.current && gameState.current.frameCount >= 120) { // ~2 seconds in
            hasIntroed.current = true;

            // Roll for 30% chance
            if (Math.random() < 0.3) {
                // Check if class streak will override the intro
                let hasClassStreakOverride = false;
                try {
                    const historyRaw = localStorage.getItem('orbit_class_history');
                    if (historyRaw) {
                        const history = JSON.parse(historyRaw);
                        if (history.streak >= 3) {
                            hasClassStreakOverride = true;
                        }
                    }
                } catch (e) { }

                if (!hasClassStreakOverride) {
                    const lang = getStoredLanguage();
                    const variants = getIntroVariants(lang);
                    const msgObj = variants[Math.floor(Math.random() * variants.length)];
                    pushOrbitMessage(msgObj, false);
                }
            }
        }

        if (state.message) {
            state.timer -= dt;
            if (state.timer <= 0) {
                state.message = null;
                refreshUI();
            }
        } else if (state.queue.length > 0) {
            const raw = state.queue.shift();
            if (raw) {
                try {
                    const msgObj = JSON.parse(raw) as AssistantMessage;
                    state.message = msgObj.text;
                    state.emotion = msgObj.emotion;
                    state.timer = 6.0; // 6 seconds display (Updated from 5.0)
                    playSfx('orbit-talk');
                    refreshUI();
                } catch (e) {
                    state.message = raw;
                    state.emotion = 'Normal';
                    state.timer = 6.0;
                    refreshUI();
                }
            }
        }

        // Feature Reroll Trigger (Version 2.5+)
        const history = gameState.current.assistant.history;
        if ((history as any).pendingRerollSnark) {
            const now = gameState.current.gameTime;
            const lastSnark = (history as any).lastRerollVersionTime || -9999;
            // 15 second cooldown
            if (now - lastSnark > 15) {
                const lang = getStoredLanguage();
                const variants = getRerollSnarks(lang);
                const msgObj = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage(msgObj, true);
                (history as any).lastRerollVersionTime = now;
            }
            (history as any).pendingRerollSnark = false;
        }

        // Feature Broke Rolling Trigger (7+ auto rolls with locked perk ending in no flux)
        if ((history as any).pendingBrokeSnark) {
            const now = gameState.current.gameTime;
            const lastSnark = (history as any).lastBrokeVersionTime || -9999;
            // 4 minute cooldown (240 seconds)
            if (now - lastSnark > 240) {
                // Delay the grant by 5 seconds so player doesn't miss it during the menu panic
                (history as any).pendingBrokeIsotopeTime = Date.now() + 5000;

                const lang = getStoredLanguage();
                const variants = getBrokeSnarks(lang);
                const msgObj = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage(msgObj, true);
                (history as any).lastBrokeVersionTime = now;
            }
            (history as any).pendingBrokeSnark = false;
        }

        // Handle Delayed Isotope Grant
        if ((history as any).pendingBrokeIsotopeTime && Date.now() >= (history as any).pendingBrokeIsotopeTime) {
            gameState.current.player.isotopes += 100;
            // Bright noticeable animation
            const px = gameState.current.player.x;
            const py = gameState.current.player.y;
            const lang = getStoredLanguage();
            const fluxLine = getFluxGrantLine(lang);
            spawnFloatingNumber(gameState.current, px, py - 30, fluxLine, "#00d9ff", true);
            playSfx('upgrade-confirm');

            (history as any).pendingBrokeIsotopeTime = 0;
            refreshUI();
        }

        if ((history as any).pendingMassRecycleTime && Date.now() >= (history as any).pendingMassRecycleTime) {
            let totalDust = 0;
            const newInventory = [...gameState.current.inventory];
            for (let idx = 0; idx < newInventory.length; idx++) {
                const item = newInventory[idx];
                if (item && !(item as any).isBlueprint) {
                    totalDust += getDustValue(item.rarity);
                    newInventory[idx] = null;
                }
            }
            gameState.current.inventory = newInventory;
            if (totalDust > 0) {
                gameState.current.player.dust += totalDust;
                playSfx('recycle');
            }
            (history as any).pendingMassRecycleTime = 0;
            refreshUI();
        }

    }, [gameState, refreshUI]);

    // Triggers
    const triggerOneTrickPony = useCallback((upgradeId: string) => {
        const history = gameState.current.assistant.history;
        history.upgradePicks[upgradeId] = (history.upgradePicks[upgradeId] || 0) + 1;

        const count = history.upgradePicks[upgradeId];
        const now = gameState.current.gameTime;

        if (count >= 5 && (!history.lastOneTrickWarningTime || now - history.lastOneTrickWarningTime > 300)) {
            // Snark and curse removed requested by user
            history.lastOneTrickWarningTime = now;
        }
    }, [gameState, pushOrbitMessage]);

    const triggerDamageTaken = useCallback((dmg: number) => {
        const history = gameState.current.assistant.history;
        history.totalDamageTaken += dmg;
    }, [gameState]);

    const triggerIncubatorDestroyed = useCallback((met?: any) => {
        const history = gameState.current.assistant.history;
        const now = gameState.current.gameTime;
        const lastSnark = (history as any).lastIncubatorDestroyTime || -9999;
        // Cooldown of 30 seconds to avoid spam if multiple slots ruin at once
        if (now - lastSnark < 30) return;

        const lang = getStoredLanguage();
        let variants;

        // Check if it's a high version meteorite (V1.7+)
        if (met && met.version >= 1.7) {
            variants = getIncubatorRerollLostSnarks(lang);
        } else {
            variants = getIncubatorSnarks(lang);
        }

        const msgObj = variants[Math.floor(Math.random() * variants.length)];
        pushOrbitMessage(msgObj, true);
        (history as any).lastIncubatorDestroyTime = now;
    }, [gameState, pushOrbitMessage]);

    const triggerDeath = useCallback(() => {
        const history = gameState.current.assistant.history;
        const gameTime = gameState.current.gameTime;
        const deathCause = gameState.current.player.deathCause || "";
        history.deaths++;

        const lang = getStoredLanguage();
        const genericSnarks = getGenericDeathSnarks(lang);

        let contextSnarks: AssistantMessage[] = [];

        // Context-sensitive snarks
        if (deathCause.toLowerCase().includes('projectile') || deathCause.toLowerCase().includes('thorns') || deathCause.toLowerCase().includes('bullet')) {
            contextSnarks.push(getProjectileDeathLine(lang));
        }

        if (gameTime < 120) {
            contextSnarks.push(getFastDeathLine(lang));
        }

        if (deathCause.toLowerCase().includes('anomaly') || deathCause.toLowerCase().includes('hell') || deathCause.toLowerCase().includes('abomination')) {
            contextSnarks.push(getAnomalyDeathLine(lang));
        }

        // Use context-specific if available, otherwise pick from generic pool
        const pool = contextSnarks.length > 0 ? contextSnarks : genericSnarks;
        const msgObj = pool[Math.floor(Math.random() * pool.length)];

        // Use priority to show message immediately on death screen
        pushOrbitMessage(msgObj, true);
    }, [gameState, pushOrbitMessage]);

    const triggerClassStreak = useCallback((streak: number, classId: string) => {
        const history = gameState.current.assistant.history;
        const lang = getStoredLanguage();
        const t = getUiTranslation(lang);
        const className = (t.classSelection.classes as any)[classId]?.name || classId;

        if (streak === 3) {
            const variants = getClassStreak3Variants(lang);
            const choice = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: choice[0].replace(/{class}/g, className).toUpperCase(), emotion: 'Normal' });
            pushOrbitMessage({ text: choice[1], emotion: 'Thinks' });
        } else if (streak >= 4) {
            const variants = getClassStreak4Variants(lang);
            const choice = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: choice[0].replace(/{class}/g, className).toUpperCase(), emotion: 'Thinks' });
            pushOrbitMessage({ text: choice[1], emotion: 'Dissapointed' });
        }
    }, [pushOrbitMessage, gameState]);

    const triggerWallIncompetence = useCallback(() => {
        const player = gameState.current.player;
        const now = gameState.current.gameTime;
        const history = gameState.current.assistant.history;

        if (!player.wallHitTimestamps) player.wallHitTimestamps = [];
        player.wallHitTimestamps.push(now);

        // Keep only last 10 seconds
        player.wallHitTimestamps = player.wallHitTimestamps.filter(t => now - t < 10);

        if (player.wallHitTimestamps.length >= 5) {
            // Check for escalation
            const lastWarning = history.lastWallWarningTime || 0;
            // The user said "if in next 30 second player again hits 5 times"
            const isEscalation = lastWarning > 0 && (now - lastWarning < 30);
            const lang = getStoredLanguage();

            if (isEscalation) {
                const [line1, line2] = getWallEscalationLines(lang);
                pushOrbitMessage({ text: line1, emotion: 'Point' }, true);
                pushOrbitMessage({ text: line2, emotion: 'Smile' });

                // Set the buff for 10 minutes (600 seconds) after a 5 second delay
                setTimeout(() => {
                    const p = gameState.current.player;
                    const currentTime = gameState.current.gameTime;
                    p.tripleWallDamageUntil = currentTime + 600;
                    refreshUI();
                }, 5000);

                // reset timestamps and warning time so it doesn't loop instantly
                player.wallHitTimestamps = [];
                history.lastWallWarningTime = 0; // Reset so next hit 5 times starts over
            } else {
                const wallWarnVariants = getWallWarnVariants(lang);
                const msg = wallWarnVariants[Math.floor(Math.random() * wallWarnVariants.length)];
                pushOrbitMessage({ text: msg, emotion: 'Dissapointed' }, true);
                player.wallHitTimestamps = []; // reset to avoid rapid trigger within same combo
                history.lastWallWarningTime = now;
            }
            refreshUI();
        }
    }, [pushOrbitMessage, gameState, refreshUI]);

    const triggerZeroPercentSnark = useCallback(() => {
        const { moduleSockets } = gameState.current;
        const history = gameState.current.assistant.history;

        // Check slotted meteorites (diamonds in the matrix)
        let zeroPercentCount = 0;
        moduleSockets.diamonds.forEach((m, idx) => {
            if (!m) return;
            // Calculate real efficiency in the slot
            const eff = calculateMeteoriteEfficiency(gameState.current, idx);
            // If the total boost is effectively zero (rounds to +0%)
            if (eff.totalBoost < 0.0005) {
                zeroPercentCount++;
            }
        });

        if (zeroPercentCount >= 5 && gameState.current.gameTime < 600) {
            const lastSnark = (history as any).lastZeroPercent5Time || -9999;
            const now = gameState.current.gameTime;

            // Only trigger if we haven't triggered in the current 10-minute window (practically once)
            if (now - lastSnark > 600) {
                const lang = getStoredLanguage();
                const variants = getZeroPercent5Variants(lang);
                const ch = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage({ text: ch[0], emotion: ch[1] as AssistantEmotion }, true);
                pushOrbitMessage({ text: ch[2], emotion: ch[3] as AssistantEmotion }, false);

                (history as any).lastZeroPercent5Time = now;
                // Wait exactly 11.5 seconds of real time (game is paused when menu is open so gametime doesn't advance)
                (history as any).pendingMassRecycleTime = Date.now() + 11500;
                refreshUI();
            }
        } else if (zeroPercentCount >= 3) {
            // Prevent spamming too frequently, but allow immediate first trigger (-9999)
            const lastSnark = (history as any).lastZeroPercentTime || -9999;
            const now = gameState.current.gameTime;
            if (now - lastSnark < 60) return;

            const lang = getStoredLanguage();
            const variants = getZeroPercentWarningVariants(lang);
            const msg = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: msg, emotion: 'Point' }, true);
            (history as any).lastZeroPercentTime = now;
            refreshUI();
        }
    }, [gameState, pushOrbitMessage, refreshUI]);

    return {
        updateOrbit,
        pushOrbitMessage,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerClassStreak,
        triggerWallIncompetence,
        triggerZeroPercentSnark,
        triggerIncubatorDestroyed
    };
};
