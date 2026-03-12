
import type { GameState, Player } from '../core/Types';
import { calcStat, getDefenseReduction } from './MathUtils';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from '../upgrades/LegendaryLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { recordIncomingDamage } from './DamageTracking';

export interface DamageOptions {
    sourceType?: 'collision' | 'projectile' | 'other';
    incomingDamageSource?: string;
    bypassArmor?: boolean;
    bypassShield?: boolean;
    onEvent?: (event: string, data?: unknown) => void;
    triggerDeath?: () => void;
    deathCause?: string;
    killerHp?: number;
    killerMaxHp?: number;
    floatingNumberColor?: string;
}

export function applyDamageToPlayer(
    state: GameState,
    player: Player,
    rawDmg: number,
    options: DamageOptions = {}
) {
    if (rawDmg <= 0) return 0;

    let dmg = rawDmg;
    let blockedByArmor = 0;
    let blockedByReduc = 0;
    let blockedByShield = 0;

    const useArmor = !options.bypassArmor;
    const useShield = !options.bypassShield;


    if (useArmor) {
        const armorValue = calcStat(player.arm);
        const armorReduction = getDefenseReduction(armorValue);
        const dmgAfterArmor = rawDmg * (1 - armorReduction);
        blockedByArmor = rawDmg - dmgAfterArmor;
        dmg = dmgAfterArmor;
    }


    if (options.sourceType === 'collision') {
        const colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill', false, player);
        const colRedReduction = Math.min(0.80, colRedRaw / 100);
        const dmgAfterCol = dmg * (1 - colRedReduction);
        blockedByReduc = dmg - dmgAfterCol;
        dmg = dmgAfterCol;
    } else if (options.sourceType === 'projectile') {
        const projRedRaw = calculateLegendaryBonus(state, 'proj_red_per_kill', false, player);
        const projRedReduction = Math.min(0.80, projRedRaw / 100);
        const dmgAfterProj = dmg * (1 - projRedReduction);
        blockedByReduc = dmg - dmgAfterProj;
        dmg = dmgAfterProj;
    }


    if (useShield && player.shieldChunks && player.shieldChunks.length > 0) {
        player.shieldChunks.sort((a, b) => a.expiry - b.expiry);
        let remaining = dmg;
        for (const chunk of player.shieldChunks) {
            if (chunk.amount >= remaining) {
                chunk.amount -= remaining;
                blockedByShield += remaining;
                remaining = 0;
                break;
            } else {
                blockedByShield += chunk.amount;
                remaining -= chunk.amount;
                chunk.amount = 0;
            }
        }
        player.shieldChunks = player.shieldChunks.filter(c => c.amount > 0);
        dmg = remaining;
    }


    player.damageBlockedByArmor = (player.damageBlockedByArmor || 0) + blockedByArmor;
    player.damageBlockedByShield = (player.damageBlockedByShield || 0) + blockedByShield;

    if (options.sourceType === 'collision') {
        player.damageBlockedByCollisionReduc = (player.damageBlockedByCollisionReduc || 0) + blockedByReduc;
    } else if (options.sourceType === 'projectile') {
        player.damageBlockedByProjectileReduc = (player.damageBlockedByProjectileReduc || 0) + blockedByReduc;
    }


    player.damageBlocked = (player.damageBlockedByArmor || 0) +
        (player.damageBlockedByShield || 0) +
        (player.damageBlockedByCollisionReduc || 0) +
        (player.damageBlockedByProjectileReduc || 0);

    const finalDmg = Math.max(0, dmg);

    if (finalDmg > 0) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'DefPlatting' || h?.type === 'TemporalMonolith' || h?.type === 'ChronoDevourer');
        if (chronoHex) {
            const mult = getHexMultiplier(state, chronoHex.type);
            const delayed = finalDmg * 0.10 * mult;
            player.timeLoopPool = (player.timeLoopPool || 0) + delayed;
            player.curHp -= (finalDmg - delayed);
        } else {
            player.curHp -= finalDmg;
        }

        const monolithHex = state.moduleSockets.hexagons.find(h => h?.type === 'TemporalMonolith');
        if (monolithHex) {
            (player as any).temporalMonolithBuff = state.gameTime + 1.0;
        }
        player.damageTaken = (player.damageTaken || 0) + finalDmg;
        player.lastHitDamage = finalDmg;

        const incomingSrc = options.incomingDamageSource
            || (options.sourceType === 'collision' ? 'Collision'
            : options.sourceType === 'projectile' ? 'Projectile'
            : 'Special Attack');
        recordIncomingDamage(player, incomingSrc, finalDmg);
        if (options.killerHp !== undefined) player.killerHp = options.killerHp;
        if (options.killerMaxHp !== undefined) player.killerMaxHp = options.killerMaxHp;

        if (options.onEvent) {
            options.onEvent('player_hit', { dmg: finalDmg, playerId: player.id });
        }

        if (player.curHp <= 0 && !state.gameOver) {
            state.gameOver = true;
            player.deathCause = options.deathCause || 'Terminated in Action';
            if (options.onEvent) options.onEvent('game_over');
            if (options.triggerDeath) options.triggerDeath();
        }
    }


    const floatColor = options.floatingNumberColor || '#ef4444';
    const floatValue = Math.round(rawDmg - blockedByArmor - blockedByReduc);
    if (floatValue > 0) {
        spawnFloatingNumber(state, player.x, player.y, floatValue.toString(), floatColor, false);
    }

    return finalDmg;
}

export function applyHealToPlayer(
    state: GameState,
    player: Player,
    healAmount: number,
    source: string = 'heal',
    optionalShieldDuration?: number
) {
    if (healAmount <= 0 || player.healingDisabled || player.curHp <= 0) return;

    const maxHp = calcStat(player.hp);
    const lifeLevel = getHexLevel(state, 'ComLife');

    const hasCrimsonOverheal = (lifeLevel >= 2);
    const forceOverheal = optionalShieldDuration !== undefined;

    if (player.curHp >= maxHp) {
        if (hasCrimsonOverheal || forceOverheal) {
            const duration = forceOverheal ? optionalShieldDuration! : 3;
            if (!player.shieldChunks) player.shieldChunks = [];
            player.shieldChunks.push({
                amount: healAmount,
                expiry: state.gameTime + duration,
                source: hasCrimsonOverheal ? 'lifesteal' : (source === 'turret' ? 'skill' : 'skill') // Default to skill if not lifesteal
            });
        }
        return;
    }

    const potentialHp = player.curHp + healAmount;
    if (potentialHp > maxHp) {
        const excess = potentialHp - maxHp;
        player.curHp = maxHp;

        if (hasCrimsonOverheal || forceOverheal) {
            const duration = forceOverheal ? optionalShieldDuration! : 3;
            if (!player.shieldChunks) player.shieldChunks = [];
            player.shieldChunks.push({
                amount: excess,
                expiry: state.gameTime + duration,
                source: hasCrimsonOverheal ? 'lifesteal' : 'skill'
            });
        }
    } else {
        player.curHp = potentialHp;
    }
}
