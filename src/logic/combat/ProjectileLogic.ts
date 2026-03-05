import { isInMap, getHexDistToWall } from '../mission/MapLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { getChassisResonance } from '../upgrades/EfficiencyLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { getCdMod, isOnCooldown } from '../utils/CooldownUtils';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import type { GameState, Enemy, Bullet } from '../core/types';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { getHexMultiplier, getHexLevel, calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { getPlayerThemeColor } from '../utils/helpers';
import { getDefenseReduction } from '../utils/MathUtils';
import { triggerKineticBolt, triggerStaticBolt } from '../player/PlayerCombat';
import { updateSinglePlayerBullet } from './ProjectilePlayerLogic';
import { updateSingleEnemyBullet } from './ProjectileEnemyLogic';

/**
 * Main update loop for all projectils in the game.
 * Modularized to maintain file size limits and logical separation.
 */
export function updateProjectiles(
    state: GameState,
    onEvent?: (event: string, data?: any) => void,
    triggerDeath?: () => void
) {
    const { bullets, enemyBullets } = state;
    const now = state.gameTime;

    // --- PLAYER BULLETS ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        const owner = b.ownerId ? (state.players[b.ownerId] || state.player) : state.player;
        updateSinglePlayerBullet(state, b, owner, bullets, i, onEvent);
    }

    // --- ENEMY BULLETS ---
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        updateSingleEnemyBullet(state, eb, enemyBullets, i, onEvent, triggerDeath);
    }

    // --- SHIELD CLEANUP ---
    // Remove expired or empty shield chunks for all players
    Object.values(state.players).forEach(p => {
        if (p.shieldChunks) {
            p.shieldChunks = p.shieldChunks.filter(c => now < c.expiry && c.amount > 0);
        }
    });

    // Cleanup global player object if it's the only one (single player fallback)
    if (state.player.shieldChunks) {
        state.player.shieldChunks = state.player.shieldChunks.filter(c => now < c.expiry && c.amount > 0);
    }
}
