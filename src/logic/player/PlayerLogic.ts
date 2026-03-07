
import type { GameState } from '../core/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../core/constants';
import { GAME_CONFIG } from '../core/GameConfig';
import { handlePlayerMovement } from './PlayerMovement';
import { updatePlayerStats } from './PlayerStats';
import { handlePlayerCombat, triggerKineticBatteryZap, triggerZombieZap, spawnLightning } from './PlayerCombat';

export { triggerKineticBatteryZap, triggerZombieZap, spawnLightning };

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


    if (player.shieldChunks) {
        player.shieldChunks = player.shieldChunks.filter((c: any) => now < c.expiry && c.amount > 0);
    }

    const hpAtStart = player.curHp;


    if (!state.playerPosHistory) state.playerPosHistory = [];
    state.playerPosHistory.unshift({ x: player.x, y: player.y, timestamp: state.gameTime });
    if (state.playerPosHistory.length > GAME_CONFIG.PLAYER.HISTORY_LENGTH) state.playerPosHistory.pop();


    if (player.spawnTimer === undefined) player.spawnTimer = 0;

    if (player.spawnTimer > 0) {
        player.spawnTimer -= 1 / 60;
        if (player.spawnTimer > 0.3) return;
    }


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


    updatePlayerStats(state, player);


    handlePlayerMovement(state, keys, inputVector, onEvent, player, triggerDeath, triggerWallIncompetence);




    handlePlayerCombat(state, mouseOffset, onEvent, player, triggerDamageTaken, triggerDeath);


    const isMonolithActive = ((player as any).temporalMonolithBuff ?? 0) > now;
    if (player.curHp < hpAtStart) {
        const hasMonolith = state.moduleSockets.hexagons.some(h => h?.type === 'TemporalMonolith');
        if (hasMonolith) {
            (player as any).temporalMonolithBuff = now + 1;
        }
    }

    if (isMonolithActive) {

        const bonus = (1 / 60) * 0.2;


        if (player.activeSkills) {
            player.activeSkills.forEach((s: import('../core/types').ActiveSkill) => {
                s.lastUsed -= bonus;
            });
        }


        if (player.lastBlackholeUse) player.lastBlackholeUse -= bonus;
        if (player.lastHiveMotherSkill) player.lastHiveMotherSkill -= bonus;
        if (player.lastVortexActivation) player.lastVortexActivation -= bonus;
        if (player.orbitalVortexCooldownEnd) player.orbitalVortexCooldownEnd -= bonus;
        if (player.sandboxCooldownStart) player.sandboxCooldownStart -= bonus;
        if (player.lastStormStrike) player.lastStormStrike -= bonus;
        if (player.stormCircleCooldownEnd) player.stormCircleCooldownEnd -= bonus;
        if (player.stormCircleChargeTime !== undefined) player.stormCircleChargeTime += bonus;


        if (player.lastKineticShockwave) player.lastKineticShockwave -= bonus;
        if (player.lastDash) player.lastDash -= bonus;
        if (player.lastDeathMark) player.lastDeathMark -= bonus;
    }


    if (!(state as any).triggerKineticBatteryZap) {
        (state as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
        (window as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
        (state as any).triggerZombieZap = triggerZombieZap;
        (window as any).triggerZombieZap = triggerZombieZap;
    }
}
