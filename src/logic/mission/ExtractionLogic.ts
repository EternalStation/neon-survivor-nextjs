
import type { GameState } from '../core/types';
import { ARENA_DATA, ARENA_CENTERS, ARENA_RADIUS, getRandomPositionInArena, getLocalizedArenaDetails } from './MapLogic';
import { playSfx } from '../audio/AudioLogic';
import { playTypewriterClick } from '../audio/SfxLogic';
import { getStoredLanguage } from '../../lib/LanguageContext';
import { getExtractionMessages, ExtractionMessage } from '../../lib/orbitTranslations';





export function updateExtraction(state: GameState, step: number) {
    if (state.extractionStatus === 'none') return;



    const isDialogue = state.extractionStatus === 'requested' || state.extractionStatus === 'waiting';
    if (state.isPaused && !isDialogue) return;

    if (state.extractionStatus === 'requested') {

        if ((state.extractionDialogTime || 0) === 0) {
            // fadeOutMusic(0.5); // Removed to keep music playing
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


            if (msg.triggerPortals) {
                state.portalState = 'open';
                state.portalTimer = 999999;
                state.portalOneTimeUse = true;
                playSfx('warning');
            }


            if (state.extractionTargetArena === 0) {
                const allArenas = [0, 1, 2];
                const current = state.currentArena ?? 0;
                const otherArenas = allArenas.filter(a => a !== current);
                state.extractionTargetArena = otherArenas[Math.floor(Math.random() * otherArenas.length)];


                const sectors = ["UPPER SECTOR", "LOWER SECTOR", "LEFT SECTOR", "RIGHT SECTOR"];
                state.extractionSectorLabel = sectors[Math.floor(Math.random() * sectors.length)];
            }


            state.extractionTimer = msg.pause;
        }
    } else if (state.extractionStatus === 'waiting') {
        state.extractionDialogTime = (state.extractionDialogTime || 0) + step;
        state.extractionTimer -= step;
        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'active';
            state.extractionTimer = 65;
            state.extractionEndTime = Date.now() + 65000;
            state.extractionStartTime = state.gameTime;
            state.extractionPowerMult = 1.0;
        }
    } else if (state.extractionStatus === 'active') {

        if (state.extractionEndTime) {
            state.extractionTimer = Math.max(0, (state.extractionEndTime - Date.now()) / 1000);
        } else {

            state.extractionTimer -= step;
        }


        state.extractionPowerMult += (step / 30);


        if (state.extractionTimer <= 2 && !state.extractionShipPos) {
            const targetArena = state.extractionTargetArena;
            const targetCenter = ARENA_CENTERS[targetArena];

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

            playSfx('warning');
        }

        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'arrived';
            state.extractionTimer = 0;
            playSfx('rare-spawn');
        }
    } else if (state.extractionStatus === 'arrived') {

        state.extractionPowerMult += (step / 30);


        if (state.extractionShipPos && state.currentArena === state.extractionTargetArena) {
            const dist = Math.hypot(state.player.x - state.extractionShipPos.x, state.player.y - state.extractionShipPos.y);
            if (dist < 300) {
                state.extractionStatus = 'departing';
                state.extractionTimer = 5.0;
                playSfx('ship-departure');
            }
        }
    } else if (state.extractionStatus === 'departing') {
        state.extractionTimer -= step;

        if (state.extractionShipPos) {
            state.extractionShipPos.y -= 100 * step;

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
