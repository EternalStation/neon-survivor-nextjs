import type { GameState, Enemy, MapPOI, Bullet } from '../core/types';
import { recordHealing } from '../utils/DamageTracking';
import { spawnFloatingNumber, spawnParticles } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';
import { getRandomPositionInArena, findSafePoiPosition } from './MapLogic';

export const TURRET_RANGE = 800;
const TURRET_BASE_COST = 2;
const TURRET_DURATION = 30;
const TURRET_COOLDOWN = 60;
const REPAIR_SPEED = 100;

export function relocateTurretsToArena(state: GameState, arenaId: number) {


    const turrets = state.pois.filter(p => p.type === 'turret');
    turrets.forEach(turret => {
        turret.arenaId = arenaId;


        const newPos = findSafePoiPosition(state.pois, arenaId, 400, turret.id);
        turret.x = newPos.x;
        turret.y = newPos.y;



        turret.active = false;
        turret.cooldown = 0;
        turret.activeDuration = 0;
        turret.activationProgress = 0;
        turret.respawnTimer = 0;
        turret.lastShot = 0;







    });
}

export function updateTurrets(state: GameState, step: number) {
    const turrets = state.pois.filter(p => p.type === 'turret' && p.arenaId === state.currentArena);

    turrets.forEach(turret => {

        if (turret.cooldown > 0) {
            turret.cooldown -= step;
            if (turret.cooldown < 0) turret.cooldown = 0;
        }


        if (!turret.active && turret.cooldown <= 0) {
            const dToPlayer = Math.hypot(state.player.x - turret.x, state.player.y - turret.y);


            if (dToPlayer < turret.radius + 100) {
                // turret.activationProgress = 100;
                const uses = turret.turretUses || 0;
                const cost = TURRET_BASE_COST * Math.pow(2, uses);
                turret.turretCost = cost;

                if (state.interactPressed) {
                    if (state.player.dust >= cost) {

                        state.player.dust -= cost;
                        turret.active = true;
                        turret.activeDuration = 0;
                        turret.activationProgress = 0;
                        turret.turretUses = uses + 1;
                        playSfx('power-up');
                        spawnFloatingNumber(state, turret.x, turret.y, "TURRET ONLINE", '#F59E0B', true);
                        spawnParticles(state, turret.x, turret.y, '#F59E0B', 20);
                    } else {

                        if (state.gameTime - (turret.lastErrorTime || 0) > 1.0) {
                            playSfx('power-down');
                            const errorMsg = state.language === 'ru' ? "НЕДОСТАТОЧНО ПЫЛИ" : "NOT ENOUGH DUST";
                            spawnFloatingNumber(state, turret.x, turret.y - 20, errorMsg, '#ef4444', true);
                            turret.lastErrorTime = state.gameTime;
                        }
                    }
                }
            } else {
                turret.activationProgress = 0;
            }
        }


        if (turret.active) {
            turret.activeDuration += step;


            if (turret.activeDuration >= TURRET_DURATION) {
                turret.active = false;
                turret.cooldown = TURRET_COOLDOWN;
                turret.radius = 150;
                turret.activationProgress = 0;
                playSfx('power-down');
                return;
            }

            const variant = turret.turretVariant || 'fire';
            const level = turret.turretUses || 1;


            turret.radius = TURRET_RANGE * (1 + (level - 1) * 0.1);


            if (variant === 'heal') {
                const dToPlayer = Math.hypot(state.player.x - turret.x, state.player.y - turret.y);

                if (dToPlayer <= turret.radius && !state.player.healingDisabled) {

                    const healPercent = 0.05 + (level - 1) * 0.01;
                    const maxHp = calcStat(state.player.hp);
                    const healAmount = (maxHp * healPercent) * step;


                    if (level >= 3 && state.player.curHp >= maxHp) {
                        if (!state.player.shieldChunks) state.player.shieldChunks = [];
                        state.player.shieldChunks.push({
                            amount: healAmount,
                            expiry: state.gameTime + 60
                        });
                    } else {
                        const htHealActual = Math.min(maxHp, state.player.curHp + healAmount) - state.player.curHp;
                        if (htHealActual > 0) recordHealing(state.player, 'Heal Turret', htHealActual);
                        state.player.curHp = Math.min(maxHp, state.player.curHp + healAmount);
                    }


                    if (Math.random() < 0.1) {
                        spawnFloatingNumber(state, state.player.x, state.player.y - 40, `+${Math.ceil(healAmount / step)}`, '#4ade80', false);
                    }
                }


                if (level >= 6) {


                    if (turret.activeDuration < step * 2 && !turret.droneSpawned) {
                        turret.droneSpawned = true;
                        if (!state.allies) state.allies = [];
                        state.allies.push({
                            id: Math.random(),
                            type: 'heal_drone',
                            x: turret.x,
                            y: turret.y,
                            life: 30,
                            ownerId: -1,
                            healPower: 0.05 + (level - 1) * 0.01
                        });
                        spawnFloatingNumber(state, turret.x, turret.y, "DRONE DEPLOYED", '#4ade80', true);
                    }
                } else {
                    turret.droneSpawned = false;
                }

                return;
            }


            const now = state.gameTime;
            const lastShot = turret.lastShot || 0;







            const minutes = state.gameTime / 60;
            const estBaseHP = 60 * Math.pow(1.2, minutes);

            if (variant === 'fire') {
                const shotsPerSec = 7 + (level - 1);
                const fireDelay = 1 / shotsPerSec;

                if (now - lastShot >= fireDelay) {

                    const targets = state.spatialGrid.query(turret.x, turret.y, turret.radius)
                        .filter(e => !e.dead && !e.isFriendly);

                    let bestTarget: Enemy | null = null;
                    let minDist = Infinity;

                    for (const t of targets) {
                        const d = Math.hypot(t.x - turret.x, t.y - turret.y);
                        if (d < minDist) { minDist = d; bestTarget = t; }
                    }

                    if (bestTarget) {
                        const angle = Math.atan2(bestTarget.y - turret.y, bestTarget.x - turret.x);
                        turret.rotation = angle;
                        turret.lastShot = now;


                        const damagePct = 0.15 + (level - 1) * 0.15;
                        const damage = Math.ceil(estBaseHP * damagePct);


                        const applyBurn = level >= 3;

                        spawnTurretBullet(state, turret.x, turret.y, angle, damage, 'fire', false, applyBurn, level);
                        playSfx('turret-fire');


                        if (level >= 6 && (now - (turret.lastShotRear || 0) >= 0.1)) {
                            turret.lastShotRear = now;

                            const rearAngle = angle + Math.PI;

                            const cone = 45 * Math.PI / 180;
                            const flameRange = 400;
                            const flameDmg = Math.ceil(estBaseHP * 0.10 * step);


                            for (let i = 0; i < 3; i++) {
                                const spread = (Math.random() - 0.5) * cone;
                                spawnTurretBullet(state, turret.x, turret.y, rearAngle + spread, flameDmg, 'fire_flame', false, true, level);
                            }
                        }
                    }
                }
            } else if (variant === 'ice') {




                const fireRate = 4;
                const delay = 1 / fireRate;

                if (now - lastShot >= delay) {
                    const targets = state.spatialGrid.query(turret.x, turret.y, turret.radius)
                        .filter(e => !e.dead && !e.isFriendly);

                    let bestTarget = null;
                    let minDist = Infinity;
                    for (const t of targets) {
                        const d = Math.hypot(t.x - turret.x, t.y - turret.y);
                        if (d < minDist) { minDist = d; bestTarget = t; }
                    }

                    if (bestTarget) {
                        const angle = Math.atan2(bestTarget.y - turret.y, bestTarget.x - turret.x);
                        turret.rotation = angle;
                        turret.lastShot = now;

                        const dmgPct = 0.10 + (level - 1) * 0.05;
                        const damage = Math.ceil(estBaseHP * dmgPct * delay);

                        const slowPct = 0.70;


                        const coneAngle = level >= 6 ? (120 * Math.PI / 180) : (30 * Math.PI / 180);

                        for (let i = 0; i < 5; i++) {
                            const spread = (Math.random() - 0.5) * coneAngle;
                            spawnTurretBullet(state, turret.x, turret.y, angle + spread, damage, 'ice', false, false, level, slowPct);
                        }


                        if (level >= 3 && (now - (turret.lastBomb || 0) > 2.0)) {


                            const rearAngle = angle + Math.PI;

                            spawnTurretBullet(state, turret.x, turret.y, rearAngle, 0, 'ice_bomb', false, false, level, 1.0);
                            turret.lastBomb = now;
                        }
                    }
                }
            }
        }
    });
}

function spawnTurretBullet(state: GameState, x: number, y: number, angle: number, dmg: number, variant: string, isVisualOnly: boolean = false, applyBurn: boolean = false, level: number = 1, slowPercent: number = 0) {
    const isIce = variant.startsWith('ice');
    const isFlame = variant === 'fire_flame';
    const isBomb = variant === 'ice_bomb';

    let spd = 35;
    let life = 60;
    let size = 3;
    let color = '#F59E0B';

    if (isIce) {
        spd = 10 + Math.random() * 5;
        life = 60 + Math.random() * 20;
        size = 15 + Math.random() * 20;
        color = '#bae6fd';
    }

    if (isFlame) {
        spd = 10 + Math.random() * 5;
        life = 40 + Math.random() * 20;
        size = 20 + Math.random() * 15;
        color = '#f97316';
    }

    if (isBomb) {
        spd = 10;
        life = 100;
        size = 20;
        color = '#3b82f6';
    }


    if (level >= 3 && !isVisualOnly) {
        size *= 1.5;

        if (!isIce) color = '#fb923c';
    }

    const bullet: Bullet = {
        id: Math.random(),
        x,
        y,

        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        dmg,
        pierce: (isIce || isFlame) ? 999 : 1,
        life,
        isEnemy: false,
        hits: new Set(),
        size,
        color,
        isTrace: !isIce && !isFlame && !isBomb,
        isMist: (isIce && !isBomb) || isFlame,
        slowPercent: isIce ? slowPercent : undefined,
        freezeDuration: isBomb ? 3.0 : undefined,
        spawnTime: Date.now(),
        isVisualOnly,

        burnDamage: applyBurn ? (dmg * 0.05) : 0,


        isTurretFire: true,
        turretLevel: level,
        turretVariant: isIce ? 'ice' : 'fire'
    };


    if (isBomb) {
        bullet.isBomb = true;
        bullet.explodeRadius = 200;
        bullet.freezeDuration = 3.0;
    }

    state.bullets.push(bullet);
}

export function updateAllies(state: GameState, step: number) {
    if (!state.allies) return;

    for (let i = state.allies.length - 1; i >= 0; i--) {
        const ally = state.allies[i];
        ally.life -= step;

        if (ally.life <= 0) {
            state.allies.splice(i, 1);
            spawnParticles(state, ally.x, ally.y, '#4ade80', 10);
            continue;
        }

        if (ally.type === 'heal_drone') {
            const p = state.player;
            const dToPlayer = Math.hypot(p.x - ally.x, p.y - ally.y);


            const targetDist = 80;
            if (dToPlayer > targetDist) {
                const angle = Math.atan2(p.y - ally.y, p.x - ally.x);
                const spd = 5;
                ally.x += Math.cos(angle) * spd;
                ally.y += Math.sin(angle) * spd;


                ally.y += Math.sin(state.gameTime * 5) * 0.5;
            }


            if (Math.floor(state.gameTime) !== Math.floor(state.gameTime - step)) {
                if (dToPlayer < 200 && !p.healingDisabled) {
                    const maxHp = calcStat(p.hp);
                    const heal = maxHp * (ally.healPower || 0.05);
                    const droneHealActual = Math.min(maxHp, p.curHp + heal) - p.curHp;
                    if (droneHealActual > 0) recordHealing(p, 'Heal Drone', droneHealActual);
                    p.curHp = Math.min(maxHp, p.curHp + heal);
                    spawnFloatingNumber(state, p.x, p.y, `+${Math.ceil(heal)}`, '#4ade80', false);
                    spawnParticles(state, ally.x, ally.y, '#4ade80', 5);
                }
            }


            if (state.frameCount % 10 === 0) {
                spawnParticles(state, ally.x, ally.y, '#4ade80', 1, 3, 20, 'spark');
            }
        }
    }
}
