
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
    mouseOffset?: { x: number, y: number },
    overridePlayer?: any,
    triggerDamageTaken?: (dmg: number) => void,
    triggerDeath?: () => void,
    triggerWallIncompetence?: () => void
) {
    const player = overridePlayer || state.player;
    const now = state.gameTime;

    // Shield Cleanup
    if (player.shieldChunks) {
        player.shieldChunks = player.shieldChunks.filter((c: any) => now < c.expiry && c.amount > 0);
    }

    const hpAtStart = player.curHp;

    // Track player position history for laser prediction (last 60 frames = ~1 second at 60fps)
    if (!state.playerPosHistory) state.playerPosHistory = [];
    state.playerPosHistory.unshift({ x: player.x, y: player.y, timestamp: state.gameTime });
    if (state.playerPosHistory.length > GAME_CONFIG.PLAYER.HISTORY_LENGTH) state.playerPosHistory.pop();

    // Spawn Animation Logic
    if (player.spawnTimer === undefined) player.spawnTimer = 0; // Fix: Default to 0 (visible) if undefined

    if (player.spawnTimer > 0) {
        player.spawnTimer -= 1 / 60;
        if (player.spawnTimer > 0.3) return; // Allow movement in last 0.3s
    }

    // 0. Active Duration Logic (for inUse visual state)
    if (player.activeSkills) {
        player.activeSkills.forEach((skill: import('../core/types').ActiveSkill) => {
            if (skill.duration && skill.duration > 0) {
                skill.duration -= 1 / 60;
                if (skill.duration <= 0) {
                    skill.duration = 0;
                    skill.inUse = false;
                }
            }
        });
    }

    // 1. Movement & Wall Collision
    handlePlayerMovement(state, keys, inputVector, onEvent, player, triggerDeath, triggerWallIncompetence);

    // Camera is updated centrally in useGameLogic.ts

    // 2. Stat Update & Sync (Regen, Hex Passives)
    updatePlayerStats(state, player);

    // 3. Combat & Aiming (Radiation Core, contact damage, death logic)
    handlePlayerCombat(state, mouseOffset, onEvent, player, triggerDamageTaken, triggerDeath);

    // Temporal Monolith Buff
    if (player.curHp < hpAtStart) {
        const hasMonolith = state.moduleSockets.hexagons.some(h => h?.type === 'TemporalMonolith');
        if (hasMonolith) {
            (player as any).temporalMonolithBuff = now + 1;
        }
    }

    // Attach trigger function for other modules (Projectile/UniqueEnemy)
    if (!(state as any).triggerKineticBatteryZap) {
        (state as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
        (window as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
    }
}
