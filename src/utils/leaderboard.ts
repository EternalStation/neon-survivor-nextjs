import type { GameState } from '../logic/core/types';
import api from '../api/client';
import { calcStat } from '../logic/utils/MathUtils';
import { calculateLegendaryBonus } from '../logic/upgrades/LegendaryLogic';
import { getArenaIndex } from '../logic/mission/MapLogic';
import { isBuffActive } from '../logic/upgrades/BlueprintLogic';

export const CURRENT_PATCH_VERSION = '1.0.3';

export interface RunSubmissionData {
    score: string;
    survivalTime: number;
    kills: number;
    bossKills: number;
    classUsed: string;
    patchVersion: string;
    damageDealt: string;
    damageTaken: string;
    damageBlocked: string;
    damageBlockedArmor: string;
    damageBlockedCollision: string;
    damageBlockedProjectile: string;
    damageBlockedShield: string;
    radarCounts: { DPS: number; ARM: number; EXP: number; HP: number; REG: number };
    meteoritesCollected: number;
    portalsUsed: number;
    arenaTimes: Record<number, number>;
    legendaryHexes: any[];
    hexLevelupOrder: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }>;
    snitchesCaught: number;
    deathCause?: string;
    finalStats?: {
        dmg: number;
        hp: number;
        xp: number;
        atkSpd: number;
        regen: number;
        armor: number;
        speed: number;
    };
    blueprints: any[];
    timezoneOffset: number;
}


export function prepareRunData(gameState: GameState): RunSubmissionData {
    const legendaryHexes = gameState.moduleSockets.hexagons
        .filter(hex => hex !== null)
        .map(hex => ({
            id: hex!.id,
            name: hex!.name,
            type: hex!.type,
            level: hex!.level,
            killsAtAcquisition: Math.ceil(hex!.killsAtAcquisition),
            timeAtAcquisition: Number((hex!.timeAtAcquisition || 0).toFixed(2)),
            killsAtLevel: Object.fromEntries(
                Object.entries(hex!.killsAtLevel || {}).map(([lvl, kills]) => [lvl, Math.ceil(kills as number)])
            ),
            timeAtLevel: Object.fromEntries(
                Object.entries(hex!.timeAtLevel || {}).map(([lvl, time]) => [lvl, Number((time as number).toFixed(2))])
            )
        }));

    const hexLevelupOrder: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }> = [];

    legendaryHexes.forEach(hex => {
        hexLevelupOrder.push({
            hexId: hex.id,
            level: 1,
            killCount: hex.killsAtAcquisition,
            gameTime: hex.timeAtAcquisition
        });

        if (hex.killsAtLevel) {
            Object.entries(hex.killsAtLevel).forEach(([level, kills]) => {
                const lvl = parseInt(level);
                if (lvl === 1) return;

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

    hexLevelupOrder.sort((a, b) => a.killCount - b.killCount);

    const score = calculateScore(gameState);

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
        score: safeIntString(score),
        survivalTime: Math.floor(gameState.gameTime),
        kills: Math.ceil(gameState.killCount),
        bossKills: Math.ceil(gameState.bossKills),
        classUsed: gameState.player.playerClass || 'unknown',
        patchVersion: CURRENT_PATCH_VERSION,
        damageDealt: safeIntString(gameState.player.damageDealt),
        damageTaken: safeIntString(gameState.player.damageTaken),
        damageBlocked: safeIntString(gameState.player.damageBlocked),
        damageBlockedArmor: safeIntString(gameState.player.damageBlockedByArmor),
        damageBlockedCollision: safeIntString(gameState.player.damageBlockedByCollisionReduc),
        damageBlockedProjectile: safeIntString(gameState.player.damageBlockedByProjectileReduc),
        damageBlockedShield: safeIntString(gameState.player.damageBlockedByShield || 0),
        radarCounts,
        meteoritesCollected: Math.ceil(gameState.meteoritesPickedUp),
        portalsUsed: Math.ceil(gameState.portalsUsed),
        arenaTimes: Object.fromEntries(
            Object.entries(gameState.timeInArena).map(([id, time]) => [id, Number(time.toFixed(2))])
        ),
        legendaryHexes,
        hexLevelupOrder,
        snitchesCaught: Math.ceil(gameState.snitchCaught || 0),
        deathCause: gameState.player.deathCause || 'Unknown',
        timezoneOffset: new Date().getTimezoneOffset(),
        blueprints: (() => {
            const grouped: Record<string, { name: string; type: string; count: number }> = {};
            const allBps = [
                ...gameState.blueprints,
                ...gameState.inventory.filter(item => item && item.isBlueprint)
            ];

            allBps.forEach(bp => {
                if (!bp) return;
                const b = bp as any;
                const key = b.serial || b.type || b.blueprintType;
                if (!key) return;
                if (grouped[key]) {
                    grouped[key].count++;
                } else {
                    grouped[key] = {
                        name: b.serial || b.name,
                        type: b.type || b.blueprintType,
                        count: 1
                    };
                }
            });
            return Object.values(grouped);
        })(),
        finalStats: (() => {
            const player = gameState.player;
            const arenaIdx = getArenaIndex(player.x, player.y);
            const surgeMult = isBuffActive(gameState, 'ARENA_SURGE') ? 2.0 : 1.0;

            let hpMult = arenaIdx === 2 ? 1 + (0.2 * surgeMult) : 1;
            let regMult = arenaIdx === 2 ? 1 + (0.2 * surgeMult) : 1;
            if (player.buffs?.puddleRegen) {
                hpMult *= 1.25;
                regMult *= 1.25;
            }

            const xpBase = 40 + (player.level * 3) + player.xp_per_kill.flat;
            const xpHexFlat = calculateLegendaryBonus(gameState, 'xp_per_kill');
            const xpNormalMult = 1 + player.xp_per_kill.mult / 100;
            const xpHexMult = 1 + calculateLegendaryBonus(gameState, 'xp_pct_per_kill') / 100;
            const finalXp = (xpBase + xpHexFlat) * xpNormalMult * xpHexMult;

            return {
                dmg: Math.round(calcStat(player.dmg)),
                hp: Math.round(calcStat(player.hp, hpMult)),
                xp: Math.round(finalXp),
                atkSpd: Math.round(calcStat(player.atk)),
                regen: Number(calcStat(player.reg, regMult).toFixed(1)),
                armor: Math.round(calcStat(player.arm)),
                speed: Number(player.speed.toFixed(1))
            };
        })()
    };
}


const BIGINT_MAX = 9_007_199_254_740_991;
const NUMERIC_MAX = '9999999999999999999999999999999999999999';

function calculateScore(gameState: GameState): number {
    const baseScore = (gameState.killCount || 0) * 100;
    const bossBonus = (gameState.bossKills || 0) * 5000;
    const timeBonus = Math.floor(gameState.gameTime || 0) * 10;
    const levelBonus = (gameState.player?.level || 1) * 500;
    const damageBonus = Math.floor((gameState.player?.damageDealt || 0) / 1000);

    const total = baseScore + bossBonus + timeBonus + levelBonus + damageBonus;

    if (isNaN(total)) {
        console.warn('[Leaderboard] Score calculation resulted in NaN, falling back to 0');
        return 0;
    }

    return Math.ceil(total);
}

function safeIntString(num: number): string {
    if (isNaN(num) || num === null) return '0';
    try {
        const rounded = Math.ceil(num);
        return rounded.toFixed(0);
    } catch {
        return '0';
    }
}

export async function submitRunToLeaderboard(gameState: GameState): Promise<{
    success: boolean;
    runId?: number;
    rank?: number;
    error?: string;
}> {
    try {
        const token = api.getToken();
        if (!token) {
            console.warn('[Leaderboard] No token found, skipping submission');
            return {
                success: false,
                error: 'Not authenticated. Please login to submit runs.'
            };
        }

        const runData = prepareRunData(gameState);
        console.log('[Leaderboard] Submitting run data:', {
            score: runData.score,
            time: runData.survivalTime,
            kills: runData.kills,
            ver: runData.patchVersion
        });

        const response = await api.submitRun(runData);

        if (!response || !response.run) {
            throw new Error('Invalid response from server');
        }

        return {
            success: true,
            runId: response.run.id,
            rank: response.run.rank
        };
    } catch (error: any) {
        console.error('[Leaderboard] Failed to submit run:', error);
        return {
            success: false,
            error: error.message || 'Failed to submit run'
        };
    }
}
