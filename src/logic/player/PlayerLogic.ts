
import type { GameState } from '../core/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/constants';
import { GAME_CONFIG } from '../core/GameConfig';
import { handlePlayerMovement } from './PlayerMovement';
import { updatePlayerStats } from './PlayerStats';
import { handlePlayerCombat, triggerKineticBatteryZap, spawnLightning } from './PlayerCombat';

export { triggerKineticBatteryZap, spawnLightning };

export function updatePlayer(
    state: GameState,
    keys: Record<string, boolean>,
    onEvent?: (type: string, data?: any) => void,
    inputVector?: { x: number, y: number },
    mouseOffset?: { x: number, y: number }
) {
    const { player } = state;
    const now = state.gameTime;

    // Shield Cleanup
    if (player.shieldChunks) {
        player.shieldChunks = player.shieldChunks.filter(c => now < c.expiry && c.amount > 0);
    }

    // Track player position history for laser prediction (last 60 frames = ~1 second at 60fps)
    if (!state.playerPosHistory) state.playerPosHistory = [];
    state.playerPosHistory.unshift({ x: player.x, y: player.y, timestamp: state.gameTime });
    if (state.playerPosHistory.length > GAME_CONFIG.PLAYER.HISTORY_LENGTH) state.playerPosHistory.pop();

    // Spawn Animation Logic
    if (state.spawnTimer > 0) {
        state.spawnTimer -= 1 / 60;
        if (state.spawnTimer > 0.3) return; // Allow movement in last 0.3s
    }

    // 1. Movement & Wall Collision
    handlePlayerMovement(state, keys, inputVector, onEvent);

    // Camera Follow
    state.camera.x = player.x - CANVAS_WIDTH / 2;
    state.camera.y = player.y - CANVAS_HEIGHT / 2;

    // 2. Stat Update & Sync (Regen, Hex Passives)
    updatePlayerStats(state);

    // 3. Combat & Aiming (Radiation Core, contact damage, death logic)
    handlePlayerCombat(state, mouseOffset, onEvent);

    // Attach trigger function for other modules (Projectile/UniqueEnemy)
    if (!(state as any).triggerKineticBatteryZap) {
        (state as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
        (window as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
    }
}
