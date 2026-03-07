
import type { GameState, Player } from '../core/types';
import { calcStat, getDefenseReduction } from './MathUtils';
import { calculateLegendaryBonus } from '../upgrades/LegendaryLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';

export interface DamageOptions {
    sourceType?: 'collision' | 'projectile' | 'other';
    bypassArmor?: boolean;
    bypassShield?: boolean;
    onEvent?: (event: string, data?: any) => void;
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
        player.curHp -= finalDmg;
        player.damageTaken = (player.damageTaken || 0) + finalDmg;
        player.lastHitDamage = finalDmg;
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
