
import type { GameState } from './types';
import { ARENA_DATA, ARENA_CENTERS, ARENA_RADIUS, getRandomPositionInArena } from './MapLogic';
import { playSfx, switchBGM, fadeOutMusic } from './AudioLogic';
import { playTypewriterClick } from './SfxLogic';


export const EXTRACTION_MESSAGES = [
    { speaker: 'you', text: "[SIGNAL NOISE] ORBITAL, THIS IS HEX-01-[PLAYER_NAME].", pause: 5.0, rand: 2.0 },
    { speaker: 'you', text: "SENDING SOS. REQUESTING EXTRACTION.", pause: 4.0, rand: 2.0 },
    { speaker: 'comm', text: "RECEIVED. WE HAVE YOUR SIGNAL.", pause: 2.2, rand: 2.0 },
    { speaker: 'comm', text: "Biometric handshake... 0x4F 0x6E 0x65...", pause: 3.0, rand: 2.0 },
    { speaker: 'you', text: "CONFIRMING.", pause: 2.0, rand: 2.0 },
    { speaker: 'comm', text: "[ ENCRYPTED BUFFER ]", pause: 2.9, rand: 2.0, isPause: true },
    { speaker: 'comm', text: "Signature locked. We're sending a ship.", pause: 2.2, rand: 2.0 },
    { speaker: 'comm', text: "Transport is jumping the rift now.", pause: 3.0, rand: 2.0 },
    { speaker: 'you', text: "UNDERSTOOD.", pause: 3.0, rand: 2.0 },
    { speaker: 'comm', text: "PORTALS ARE OPEN FOR YOU, HEX-01-[PLAYER_NAME].", pause: 3.5, rand: 2.0, triggerPortals: true },
    { speaker: 'comm', text: "But they will only allow one transition, be carefull!", pause: 4, rand: 2.0 },
    { speaker: 'comm', text: "Extraction point follows:", pause: 2.2, rand: 2.0 },
    { speaker: 'comm', text: "TARGET SECTOR: [ARENA_NAME]", pause: 2.2, rand: 2.0 },
    { speaker: 'comm', text: "EXACT COORDINATES: PENDING SIGNAL...", pause: 3.0, rand: 2.0 },
    { speaker: 'comm', text: "ETA 65 SECONDS.", pause: 3.0, rand: 2.0 },
    { speaker: 'comm', text: "DETECTED HIGH ENEMY ACTIVITY", pause: 2.2, rand: 2.0, isAlert: true },
    { speaker: 'comm', text: "YOU HAVE NO MORE TIME LEFT, EVACUATE NOW!", pause: 2.2, rand: 2.0, isAlert: true },
    { speaker: 'comm', text: "Reach the ship.", pause: 2.2, rand: 2.0, isAlert: true },
    { speaker: 'comm', text: "GOOD LUCK, HEX-01-[PLAYER_NAME]! TRANSMISSION ENDS.", pause: 5, rand: 2.0, isAlert: true }
];

export function updateExtraction(state: GameState, step: number) {
    if (state.extractionStatus === 'none') return;

    if (state.extractionStatus === 'requested') {
        state.extractionDialogTime = (state.extractionDialogTime || 0) + step;
        state.extractionTimer -= step;
        if (state.extractionTimer <= 0) {
            state.extractionMessageIndex++;

            if (state.extractionMessageIndex >= EXTRACTION_MESSAGES.length) {
                // Done with text, now wait 5 seconds before closing terminal and starting rage
                state.extractionStatus = 'waiting';
                state.extractionTimer = 5.0;
                return;
            }

            if (!state.extractionMessageTimes) state.extractionMessageTimes = [];
            state.extractionMessageTimes[state.extractionMessageIndex] = state.extractionDialogTime || 0;

            const msg = EXTRACTION_MESSAGES[state.extractionMessageIndex];
            if (!msg.isPause) {
                playTypewriterClick();
            }

            // External trigger: Open Portals
            if (msg.triggerPortals) {
                state.portalState = 'open';
                state.portalTimer = 999999; // Effectively infinite
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

            // Set next timer with randomness
            state.extractionTimer = msg.pause + Math.random() * (msg.rand || 0);
        }
    } else if (state.extractionStatus === 'waiting') {
        state.extractionDialogTime = (state.extractionDialogTime || 0) + step;
        state.extractionTimer -= step;
        if (state.extractionTimer <= 0) {
            state.extractionStatus = 'active';
            state.extractionTimer = 65; // 65 seconds arrival
            state.extractionStartTime = state.gameTime;
            state.extractionPowerMult = 1.0;

            switchBGM('evacuation', 1.0);
        }
    } else if (state.extractionStatus === 'active') {
        state.extractionTimer -= step;

        // Power Scaling: +100% every 30s (approx 3.33% per second)
        state.extractionPowerMult += (step / 30);

        // Dynamic Ship Positioning (10 seconds before arrival)
        if (state.extractionTimer <= 10 && !state.extractionShipPos) {
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
            state.gameOver = true;
        }
    }
}
