import type { GameState } from '../logic/types';
import api from '../api/client';

// Current game version - update this when you release new patches
export const CURRENT_PATCH_VERSION = '1.0.0';

export interface RunSubmissionData {
    score: number;
    survivalTime: number;
    kills: number;
    bossKills: number;
    classUsed: string;
    patchVersion: string;
    damageDealt: number;
    damageTaken: number;
    damageBlocked: number;
    damageBlockedArmor: number;
    damageBlockedCollision: number;
    damageBlockedProjectile: number;
    damageBlockedShield: number;
    radarCounts: { DPS: number; ARM: number; EXP: number; HP: number; REG: number };
    meteoritesCollected: number;
    portalsUsed: number;
    arenaTimes: Record<number, number>;
    legendaryHexes: any[];
    hexLevelupOrder: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }>;
    snitchesCaught: number;
    deathCause?: string;
}

/**
 * Prepares game state data for submission to the leaderboard
 */
export function prepareRunData(gameState: GameState): RunSubmissionData {
    // Extract legendary hexes with their levels and acquisition info
    const legendaryHexes = gameState.moduleSockets.hexagons
        .filter(hex => hex !== null)
        .map(hex => ({
            id: hex!.id,
            name: hex!.name,
            type: hex!.type,
            level: hex!.level,
            killsAtAcquisition: hex!.killsAtAcquisition,
            timeAtAcquisition: hex!.timeAtAcquisition,
            killsAtLevel: hex!.killsAtLevel || {},
            timeAtLevel: hex!.timeAtLevel || {}
        }));

    // Create level-up order array from killsAtLevel data
    const hexLevelupOrder: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }> = [];

    legendaryHexes.forEach(hex => {
        // Add initial acquisition
        hexLevelupOrder.push({
            hexId: hex.id,
            level: 1,
            killCount: hex.killsAtAcquisition,
            gameTime: hex.timeAtAcquisition
        });

        // Add each level up
        if (hex.killsAtLevel) {
            Object.entries(hex.killsAtLevel).forEach(([level, kills]) => {
                const lvl = parseInt(level);
                if (lvl === 1) return; // Skip Level 1 to avoid duplication with acquisition

                const time = hex.timeAtLevel?.[lvl];
                hexLevelupOrder.push({
                    hexId: hex.id,
                    level: lvl,
                    killCount: kills as number,
                    gameTime: time
                });
            });
        }
    });

    // Sort by kill count to get chronological order
    hexLevelupOrder.sort((a, b) => a.killCount - b.killCount);

    // Calculate final score (you can adjust this formula)
    const score = calculateScore(gameState);

    // Calculate radar counts
    const radarCounts = { DPS: 0, ARM: 0, EXP: 0, HP: 0, REG: 0 };
    gameState.player.upgradesCollected.forEach(u => {
        const id = u.type.id;
        if (id.startsWith('dmg') || id === 'atk_s') radarCounts.DPS++;
        else if (id.startsWith('arm')) radarCounts.ARM++;
        else if (id.startsWith('xp')) radarCounts.EXP++;
        else if (id.startsWith('hp')) radarCounts.HP++;
        else if (id.startsWith('reg')) radarCounts.REG++;
    });

    return {
        score,
        survivalTime: Math.floor(gameState.gameTime),
        kills: gameState.killCount,
        bossKills: gameState.bossKills,
        classUsed: gameState.player.playerClass || 'unknown',
        patchVersion: CURRENT_PATCH_VERSION,
        damageDealt: Math.floor(gameState.player.damageDealt),
        damageTaken: Math.floor(gameState.player.damageTaken),
        damageBlocked: Math.floor(gameState.player.damageBlocked),
        damageBlockedArmor: Math.floor(gameState.player.damageBlockedByArmor),
        damageBlockedCollision: Math.floor(gameState.player.damageBlockedByCollisionReduc),
        damageBlockedProjectile: Math.floor(gameState.player.damageBlockedByProjectileReduc),
        damageBlockedShield: Math.floor(gameState.player.damageBlockedByShield || 0),
        radarCounts,
        meteoritesCollected: gameState.meteoritesPickedUp,
        portalsUsed: gameState.portalsUsed,
        arenaTimes: gameState.timeInArena,
        legendaryHexes,
        hexLevelupOrder,
        snitchesCaught: gameState.snitchCaught || 0,
        deathCause: gameState.player.deathCause || 'Unknown'
    };
}

/**
 * Calculate final score based on game performance
 * You can adjust this formula to weight different factors
 */
function calculateScore(gameState: GameState): number {
    const baseScore = gameState.killCount * 100;
    const bossBonus = gameState.bossKills * 5000;
    const timeBonus = Math.floor(gameState.gameTime) * 10;
    const levelBonus = gameState.player.level * 500;
    const damageBonus = Math.floor(gameState.player.damageDealt / 1000);

    return baseScore + bossBonus + timeBonus + levelBonus + damageBonus;
}

/**
 * Submit a run to the leaderboard
 * Returns the run ID and rank if successful
 */
export async function submitRunToLeaderboard(gameState: GameState): Promise<{
    success: boolean;
    runId?: number;
    rank?: number;
    error?: string;
}> {
    try {
        // Check if user is authenticated
        const token = api.getToken();
        if (!token) {
            return {
                success: false,
                error: 'Not authenticated. Please login to submit runs.'
            };
        }

        // Prepare run data
        const runData = prepareRunData(gameState);

        // Submit to API
        const response = await api.submitRun(runData);

        return {
            success: true,
            runId: response.run.id,
            rank: response.run.rank
        };
    } catch (error: any) {
        console.error('Failed to submit run:', error);
        return {
            success: false,
            error: error.message || 'Failed to submit run'
        };
    }
}
