
import type { GameState } from '../core/types';
import { ARENA_DATA, ARENA_CENTERS, ARENA_RADIUS, getRandomPositionInArena, getLocalizedArenaDetails } from './MapLogic';
import { playSfx, switchBGM, fadeOutMusic } from '../audio/AudioLogic';
import { playTypewriterClick } from '../audio/SfxLogic';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { getExtractionMessages, ExtractionMessage } from '../../lib/orbitTranslations';





export function updateExtraction(state: GameState, step: number) {
    if (state.extractionStatus === 'none') return;

    // Pause evacuation logic while in menus (Module Matrix, Settings, etc)
    // EXCEPT for the dialogue phases, which progress while the terminal is open.
    const isDialogue = state.extractionStatus === 'requested' || state.extractionStatus === 'waiting';
    if (state.isPaused && !isDialogue) return;

    if (state.extractionStatus === 'requested') {
        // First frame initialization of extraction dialog
        if ((state.extractionDialogTime || 0) === 0) {
            fadeOutMusic(0.5); // Fade out music to only hear typing
        }

        state.extractionDialogTime = (state.extractionDialogTime || 0) + step;
        state.extractionTimer -= step;

        const lang = getStoredLanguage();
        const playerName = state.playerName || "PILOT";
        const arenaName = state.extractionTargetArena !== undefined ? getLocalizedArenaDetails(state.extractionTargetArena, lang).name : "UNKNOWN";
        const messages = getExtractionMessages(lang, playerName, arenaName);

        if (state.extractionTimer <= 0) {
            state.extractionMessageIndex++;

            if (state.extractionMessageIndex >= messages.length) {
                // Done with text, now wait 5 seconds before closing terminal and starting rage
                state.extractionStatus = 'waiting';
                state.extractionTimer = 5.0;
                return;
            }

            if (!state.extractionMessageTimes) state.extractionMessageTimes = [];
            state.extractionMessageTimes[state.extractionMessageIndex] = state.extractionDialogTime || 0;

            const msg = messages[state.extractionMessageIndex];
            if (!msg.isPause) {
                playTypewriterClick();
            }

            // External trigger: Open Portals
            if (msg.triggerPortals) {
                state.portalState = 'open';
                state.portalTimer = 999999; // Endless duration
                state.portalOneTimeUse = true; // Mark as one-time use for extraction
                playSfx('warning');
            }

            // Pick target arena early so it appears in text
            if (state.extractionTargetArena === 0) {
                const allArenas = [0, 1, 2];
                const current = state.currentArena ?? 0;
                const otherArenas = allArenas.filter(a => a !== current);
                state.extractionTargetArena = otherArenas[Math.floor(Math.random() * otherArenas.length)];

                // Pre-determine sector label (Upper/Lower/Left/Right) but do not reveal until final 10s
                const sectors = ["UPPER SECTOR", "LOWER SECTOR", "LEFT SECTOR", "RIGHT SECTOR"];
                state.extractionSectorLabel = sectors[Math.floor(Math.random() * sectors.length)];
            }

            // Set next timer (randomness removed)
            state.extractionTimer = msg.pause;
        }
    } else if (state.extractionStatus === 'waiting') {
        state.extractionDialogTime = (state.extractionDialogTime || 0) + step;
        state.extractionTimer -= step;
        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'active';
            state.extractionTimer = 65; // Initial UI value
            state.extractionEndTime = Date.now() + 65000; // Real-time target (65s)
            state.extractionStartTime = state.gameTime;
            state.extractionPowerMult = 1.0;

            switchBGM('evacuation', 1.0);
        }
    } else if (state.extractionStatus === 'active') {
        // Real-time countdown (Menu safe)
        if (state.extractionEndTime) {
            state.extractionTimer = Math.max(0, (state.extractionEndTime - Date.now()) / 1000);
        } else {
            // Fallback if endTime missing
            state.extractionTimer -= step;
        }

        // Power Scaling: +100% every 30s (approx 3.33% per second)
        state.extractionPowerMult += (step / 30);

        // Dynamic Ship Positioning (2 seconds before arrival)
        if (state.extractionTimer <= 2 && !state.extractionShipPos) {
            const targetArena = state.extractionTargetArena;
            const targetCenter = ARENA_CENTERS[targetArena];
            // Follow the pre-determined sector label
            const shipOffset = ARENA_RADIUS * 0.75;
            if (state.extractionSectorLabel === "UPPER SECTOR") {
                state.extractionShipPos = { x: targetCenter.x, y: targetCenter.y - shipOffset };
            } else if (state.extractionSectorLabel === "LOWER SECTOR") {
                state.extractionShipPos = { x: targetCenter.x, y: targetCenter.y + shipOffset };
            } else if (state.extractionSectorLabel === "LEFT SECTOR") {
                state.extractionShipPos = { x: targetCenter.x - shipOffset, y: targetCenter.y };
            } else if (state.extractionSectorLabel === "RIGHT SECTOR") {
                state.extractionShipPos = { x: targetCenter.x + shipOffset, y: targetCenter.y };
            }

            playSfx('warning'); // Sound alert for "FINAL LZ COORDINATES RECEIVED"
        }

        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'arrived';
            state.extractionTimer = 0;
            playSfx('rare-spawn');
        }
    } else if (state.extractionStatus === 'arrived') {
        // Continue scaling just in case player is slow
        state.extractionPowerMult += (step / 30);

        // Check for proximity to ship
        if (state.extractionShipPos && state.currentArena === state.extractionTargetArena) {
            const dist = Math.hypot(state.player.x - state.extractionShipPos.x, state.player.y - state.extractionShipPos.y);
            if (dist < 300) {
                state.extractionStatus = 'departing';
                state.extractionTimer = 5.0; // 5s departure cutscene
                fadeOutMusic(0.5);
                playSfx('ship-departure');
            }
        }
    } else if (state.extractionStatus === 'departing') {
        state.extractionTimer -= step;
        // Ship moving up animation
        if (state.extractionShipPos) {
            state.extractionShipPos.y -= 100 * step;
            // Move player with ship
            state.player.x = state.extractionShipPos.x;
            state.player.y = state.extractionShipPos.y;
        }

        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'complete';
            state.player.deathCause = 'EVACUATED';
            state.gameOver = true;
        }
    }
}
