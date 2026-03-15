import type { GameState, Enemy } from '../../core/Types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { handleEnemyDeath } from '../../mission/DeathLogic';
import { getHexLevel } from '../../upgrades/LegendaryLogic';
import { triggerZombieZap } from '../../player/PlayerCombat';
import { recordDamage } from '../../utils/DamageTracking';

function reduceCooldowns(player: any) {
    const reduction = 0.03;
    if (player.activeSkills) {
        player.activeSkills.forEach((s: any) => { if (s && s.lastUsed !== undefined) s.lastUsed -= reduction; });
    }
    if (player.lastBlackholeUse !== undefined) player.lastBlackholeUse -= reduction;
    if (player.lastHiveMotherSkill !== undefined) player.lastHiveMotherSkill -= reduction;
    if (player.lastVortexActivation !== undefined) player.lastVortexActivation -= reduction;
    if (player.sandboxCooldownStart !== undefined) player.sandboxCooldownStart -= reduction;
    if (player.lastStormStrike !== undefined) player.lastStormStrike -= reduction;
    if (player.stormCircleCooldownEnd !== undefined) player.stormCircleCooldownEnd -= reduction;
    if (player.orbitalVortexCooldownEnd !== undefined) player.orbitalVortexCooldownEnd -= reduction;
    if (player.lastKineticShockwave !== undefined) player.lastKineticShockwave -= reduction;
    if (player.dashCooldown !== undefined) player.dashCooldown -= reduction;
    if (player.lastDeathMark !== undefined) player.lastDeathMark -= reduction;
}

function maybeRewardConsumption(state: GameState, e: Enemy, target: Enemy) {
    const bloodLvl = getHexLevel(state, 'ComLife');
    const devLvl = getHexLevel(state, 'ChronoDevourer');
    if (bloodLvl >= 5 || devLvl >= 5) {
        spawnFloatingNumber(state, target.x, target.y, 'Successfully consumed it', '#4ade80', true, undefined, 10);
        if (Math.random() < 0.10) triggerZombieZap(state, state.player, e);
    }
    if (devLvl >= 5) reduceCooldowns(state.player);
}

export function updateZombie(e: Enemy, state: GameState, step: number, onEvent?: (event: string, data?: any) => void) {
    const now = state.gameTime * 1000;
    const player = state.player;

    if (e.zombieHearts === undefined) e.zombieHearts = 3;

    if (e.zombieState === 'dead') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'rising';
            e.zombieTimer = now + 1500;
        }
        return;
    }

    if (e.zombieState === 'rising') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'active';
            e.zombieHearts = 3;
            e.invincibleUntil = now + 500;
        }
        return;
    }

    const takeZombieDamage = (amount: number = 1) => {
        if (e.invincibleUntil && now < e.invincibleUntil) return;

        e.zombieHearts = (e.zombieHearts || 3) - amount;
        e.invincibleUntil = now + 1000;
        spawnParticles(state, e.x, e.y, '#ef4444', 10);
        playSfx('impact');

        if (e.zombieHearts <= 0) {
            if (e.zombieTargetId) {
                const t = state.enemies.find(o => o.id === e.zombieTargetId);
                if (t) t.beingConsumedBy = undefined;
            }
            e.dead = true;
            e.hp = 0;
            spawnParticles(state, e.x, e.y, '#4ade80', 15);
            playSfx('rare-kill');
        }
    };

    if (e.zombieState === 'clinging') {
        const target = state.enemies.find(t => t.id === e.zombieTargetId);
        if (!target || target.dead) {
            if (target) target.beingConsumedBy = undefined;
            e.zombieState = 'active';
            e.zombieTargetId = undefined;
            e.timer = undefined;
            return;
        }

        e.x = target.x;
        e.y = target.y;
        e.vx = 0;
        e.vy = 0;

        if (!target.boss) {
            target.frozen = 1.0;
            target.vx = 0;
            target.vy = 0;
        }

        if ((target.boss || target.legionId) && state.frameCount % 60 === 0) {
            const dmg = target.boss ? target.maxHp * 0.05 : target.maxHp * 0.1;
            let appliedDmg = dmg;

            if (target.legionId) {
                const lead = state.legionLeads?.[target.legionId];
                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                    appliedDmg -= shieldHit;
                    spawnParticles(state, target.x, target.y, '#60a5fa', 2);
                }
            }

            if (appliedDmg > 0) {
                target.hp -= appliedDmg;
                player.damageDealt += appliedDmg;
                recordDamage(state, 'Crimson Feast (LVL 4)', appliedDmg);
                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
            }

            spawnFloatingNumber(state, target.x, target.y, Math.round(dmg).toString(), '#4ade80', true);
            spawnParticles(state, target.x, target.y, '#4ade80', 5);
            takeZombieDamage(1);
        }

        const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);
        for (const other of nearby) {
            if (other.id !== e.id && other.id !== target.id && !other.dead && !other.isFriendly && !other.isZombie) {
                const d = Math.hypot(other.x - e.x, other.y - e.y);
                if (d < e.size + other.size) {
                    takeZombieDamage(1);
                    if (e.dead) return;
                }
            }
        }

        if (now >= (e.timer || 0)) {
            if (target.boss) {
                const consumedDmg = target.maxHp * 0.20;
                target.hp -= consumedDmg;
                player.damageDealt += consumedDmg;
                recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);
                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
                takeZombieDamage(3);
                playSfx('zombie-consume');
                spawnParticles(state, target.x, target.y, '#ef4444', 30);
                maybeRewardConsumption(state, e, target);
            } else if (target.isElite) {
                const consumedDmg = target.maxHp;
                target.hp = 0;
                player.damageDealt += consumedDmg;
                recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);
                handleEnemyDeath(state, target, onEvent);
                playSfx('zombie-consume');
                spawnParticles(state, target.x, target.y, '#ef4444', 25);
                maybeRewardConsumption(state, e, target);
                takeZombieDamage(3);
            } else {
                let canKill = true;
                if (target.legionId) {
                    const lead = state.legionLeads?.[target.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                        lead.legionShield = Math.max(0, (lead.legionShield || 0) - (target.maxHp * 0.5));
                        canKill = false;
                    }
                }

                if (canKill) {
                    const consumedDmg = target.maxHp;
                    target.hp = 0;
                    player.damageDealt += consumedDmg;
                    recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);
                    handleEnemyDeath(state, target, onEvent);
                    playSfx('zombie-consume');
                    spawnParticles(state, target.x, target.y, '#ef4444', 20);
                    maybeRewardConsumption(state, e, target);
                }

                takeZombieDamage(1);
                if (!e.dead) {
                    e.zombieState = 'active';
                    e.zombieTargetId = undefined;
                    target.beingConsumedBy = undefined;
                    e.timer = undefined;
                    e.invincibleUntil = now + 1000;
                }
            }
        }
        return;
    }

    let nearest: Enemy | null = null;
    let minDist = Infinity;

    state.enemies.forEach(other => {
        if (other.dead || other.isZombie || other.isFriendly || (other.beingConsumedBy !== undefined && other.beingConsumedBy !== e.id)) return;
        const d = Math.hypot(other.x - e.x, other.y - e.y);
        if (d < minDist) {
            minDist = d;
            nearest = other;
        }
    });

    if (!nearest) return;

    const target: Enemy = nearest;
    const dx = target.x - e.x;
    const dy = target.y - e.y;
    const angle = Math.atan2(dy, dx);

    let spd = 10.0;
    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    let nearAnyPlayer = false;
    players.forEach(p => {
        if (state.enemies.some(o => !o.dead && !o.isZombie && Math.hypot(o.x - p.x, o.y - p.y) < 300)) {
            nearAnyPlayer = true;
        }
    });
    if (nearAnyPlayer) spd *= 2.0;

    e.vx = (e.vx || 0) * 0.8 + Math.cos(angle) * spd * 0.2 * 60;
    e.vy = (e.vy || 0) * 0.8 + Math.sin(angle) * spd * 0.2 * 60;
    e.x += (e.vx || 0) * step;
    e.y += (e.vy || 0) * step;

    const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);
    for (const other of nearby) {
        if (other.dead || other.id === e.id || other.isZombie || other.isFriendly) continue;

        const d = Math.hypot(other.x - e.x, other.y - e.y);
        if (d < e.size + other.size) {
            if (other.id === target.id) {
                e.zombieState = 'clinging';
                e.zombieTargetId = target.id;
                target.beingConsumedBy = e.id;
                e.timer = now + ((target.boss || target.isElite) ? 5000 : 3000);
                const devLvl = getHexLevel(state, 'ChronoDevourer');
                if (devLvl >= 5 && Math.random() < 0.10) e.timer = now;
                return;
            }

            takeZombieDamage(1);
            const pushAngle = Math.atan2(e.y - other.y, e.x - other.x);
            e.x += Math.cos(pushAngle) * 30;
            e.y += Math.sin(pushAngle) * 30;
            e.vx = 0;
            e.vy = 0;
            if (e.dead) return;
        }
    }
}
