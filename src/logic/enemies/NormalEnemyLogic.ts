import type { GameState, Enemy } from '../core/Types';
import { ARENA_CENTERS, ARENA_RADIUS } from '../mission/MapLogic';
import { spawnParticles } from '../effects/ParticleLogic';
import { spawnEnemyBullet } from '../combat/ProjectileSpawning';

export function updateNormalCircle(e: Enemy, state: GameState, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    if (e.timer && state.gameTime < e.timer) return { vx: 0, vy: 0 };

    const a = Math.atan2(dy, dx);
    const vx = Math.cos(a) * currentSpd + pushX;
    const vy = Math.sin(a) * currentSpd + pushY;
    return { vx, vy };
}

export function updateNormalTriangle(e: Enemy, state: GameState, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    if (!e.timer) e.timer = state.gameTime;

    if (e.dashState !== 1 && state.gameTime - (e.lastAttack || 0) > 5.0 && currentSpd > 0) {
        e.dashState = 1;
        e.timer = state.gameTime + 0.2;
        e.lastAttack = state.gameTime;
        e.dashAngle = Math.atan2(dy, dx);
    }

    if (e.dashState === 1) {
        if (state.gameTime < e.timer) {

            const dashSpeed = 12.5 * (state.gameSpeedMult ?? 1) * (currentSpd > 0 ? 1 : 0);
            const angle = e.dashAngle || Math.atan2(dy, dx);
            const vx = Math.cos(angle) * dashSpeed + pushX;
            const vy = Math.sin(angle) * dashSpeed + pushY;
            return { vx, vy };
        } else {
            e.dashState = 0;
            e.lastAttack = state.gameTime;
        }
    }

    const a = Math.atan2(dy, dx);
    const vx = Math.cos(a) * currentSpd + pushX;
    const vy = Math.sin(a) * currentSpd + pushY;
    return { vx, vy };
}

export function updateNormalSquare(currentSpd: number, dx: number, dy: number, pushX: number, pushY: number) {
    const aS = Math.atan2(dy, dx);
    const vx = Math.cos(aS) * currentSpd + pushX;
    const vy = Math.sin(aS) * currentSpd + pushY;
    return { vx, vy };
}

export function updateNormalDiamond(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    if (!e.distGoal) {
        e.distGoal = 500 + Math.random() * 400;
    }

    const angleToPlayerD = Math.atan2(dy, dx);
    const distGoal = e.distGoal;

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(e.x - center.x, e.y - center.y);
        return distToCenter < Math.hypot(e.x - best.x, e.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToWall = ARENA_RADIUS - Math.hypot(e.x - nearestCenter.x, e.y - nearestCenter.y);

    if (!e.timer || Date.now() > e.timer) {
        e.dodgeDir = Math.random() > 0.5 ? 1 : -1;
        e.timer = Date.now() + 3000 + Math.random() * 2000;
    }

    const strafeAngle = angleToPlayerD + (e.dodgeDir || 1) * Math.PI / 2;
    const distFactor = (dist - distGoal) / 100;

    let vx, vy;

    if (distToWall < 500 || (e.dodgeCooldown && Date.now() < e.dodgeCooldown)) {
        if (!e.dodgeCooldown || Date.now() > e.dodgeCooldown) {
            const angleToCenter = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
            e.dashState = (angleToCenter + angleToPlayerD + Math.PI) / 2;
            e.dodgeCooldown = Date.now() + 2000;
        }
        vx = Math.cos(e.dashState || 0) * currentSpd * 2;
        vy = Math.sin(e.dashState || 0) * currentSpd * 2;
    } else {
        vx = Math.cos(strafeAngle) * currentSpd + Math.cos(angleToPlayerD) * distFactor * currentSpd + pushX;
        vy = Math.sin(strafeAngle) * currentSpd + Math.sin(angleToPlayerD) * distFactor * currentSpd + pushY;
    }


    if (!e.nextAttackCD) e.nextAttackCD = 7 + Math.random() * 3;
    if (state.gameTime - (e.lastAttack || 0) > e.nextAttackCD) {
        const dmg = Math.floor(e.maxHp * 0.20);
        const bulletColor = e.baseColor || (e.originalPalette ? e.originalPalette[0] : e.palette[0]);
        spawnEnemyBullet(state, e.x, e.y, angleToPlayerD, dmg, bulletColor);
        e.lastAttack = state.gameTime;
        e.nextAttackCD = 7 + Math.random() * 3;
    }

    return { vx, vy };
}

import { spawnMinion } from './UniqueEnemyLogic';
import { playSfx } from '../audio/AudioLogic';

export function updateNormalPentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    if (!e.originalPalette) e.originalPalette = e.palette;

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(e.x - center.x, e.y - center.y);
        return distToCenter < Math.hypot(e.x - best.x, e.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToWall = ARENA_RADIUS - Math.hypot(e.x - nearestCenter.x, e.y - nearestCenter.y);

    if (!e.distGoal) {
        e.distGoal = 600 + Math.random() * 300;
    }

    const angleToPlayerP = Math.atan2(dy, dx);
    let moveAngle = angleToPlayerP;
    let speedMult = 1.0;

    if (distToWall < 400) {
        moveAngle = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
        speedMult = 1.5;
    } else if (dist < e.distGoal - 50) {
        moveAngle = angleToPlayerP + Math.PI;
        speedMult = 0.85;
    } else if (dist > e.distGoal + 50) {
        moveAngle = angleToPlayerP + (Math.sin(state.gameTime) * 0.2);
    } else {
        const strafeDir = (e.id % 2 === 0) ? 1 : -1;
        moveAngle = angleToPlayerP + (Math.PI / 2) * strafeDir;
        speedMult = 0.8;
    }

    const targetVx = Math.cos(moveAngle) * currentSpd * speedMult + pushX;
    const targetVy = Math.sin(moveAngle) * currentSpd * speedMult + pushY;

    const smoothing = 0.12;
    let vx = (e.vx || 0) * (1 - smoothing) + targetVx * smoothing;
    let vy = (e.vy || 0) * (1 - smoothing) + targetVy * smoothing;

    if (e.minionCount === undefined || state.frameCount % 10 === 0) {
        const myMinions = state.enemies.filter(m => m.parentId === e.id && !m.dead && (m.shape === 'minion' || m.shape === 'elite_minion'));
        e.minionCount = myMinions.length;
        e.orbitingMinionIds = myMinions.filter(m => m.minionState === 0).map(m => m.id);
    }

    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    let distToNearest = Infinity;
    players.forEach(p => {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < distToNearest) distToNearest = d;
    });

    const hasMinions = (e.minionCount || 0) > 0;

    if (distToNearest <= 350 && (e.orbitingMinionIds?.length || 0) > 0) {
        state.enemies.forEach(m => {
            if (e.orbitingMinionIds?.includes(m.id)) m.minionState = 1;
        });
        playSfx('stun-disrupt');
        e.angryUntil = state.gameTime + 2.0;
        e.orbitingMinionIds = [];
    }

    const isAngry = !!(e.angryUntil && state.gameTime < e.angryUntil);
    const isWarning = !!(distToNearest <= 500 && hasMinions && !isAngry);

    if (isAngry) {
        e.palette = ['#EF4444', '#B91C1C', '#7F1D1D'];
        e.eraPalette = undefined;
        vx += (Math.random() - 0.5) * 8;
        vy += (Math.random() - 0.5) * 8;
    } else if (isWarning) {
        e.palette = ['#EF4444', '#F87171', '#7F1D1D'];
        e.eraPalette = undefined;
        vx += (Math.random() - 0.5) * 6;
        vy += (Math.random() - 0.5) * 6;
    }

    const age = state.gameTime - (e.spawnedAt || 0);
    if (age > 60) {
        if ((e.minionCount || 0) > 0) {
            if (e.lastAttack === undefined) e.lastAttack = state.gameTime;
            if (state.gameTime - (e.lastAttack || 0) > 1.0) {
                const victim = state.enemies.find(m => m.parentId === e.id && m.minionState === 0 && !m.dead);
                if (victim) {
                    victim.minionState = 1;
                    playSfx('stun-disrupt');
                }
                e.lastAttack = state.gameTime;
                e.minionCount = (e.minionCount || 1) - 1;
            }
            if (!isAngry) {
                e.palette = ['#FFFFFF', '#EF4444', '#7F1D1D'];
                e.eraPalette = undefined;
            }
        } else {
            e.dead = true; e.hp = 0;
            spawnParticles(state, e.x, e.y, '#EF4444', 30);
            playSfx('rare-kill');
        }
        return { vx, vy };
    }

    if (e.lastAttack === undefined) e.lastAttack = state.gameTime;

    if (e.summonState === 1) {
        if (state.gameTime > (e.timer || 0)) {
            spawnMinion(state, e, false, 3);
            e.lastAttack = state.gameTime;
            e.summonState = 0;
            if (e.originalPalette) e.palette = e.originalPalette;
        }
    } else {
        const spawnInterval = 15.0;
        if (state.gameTime - (e.lastAttack || 0) > spawnInterval && (e.minionCount || 0) < 9) {
            e.summonState = 1;
            e.timer = state.gameTime + 3.0;
            playSfx('warning');
        }
    }

    if (!isAngry && !isWarning && e.summonState !== 1) {
        if (e.originalPalette) e.palette = e.originalPalette;
    }

    return { vx, vy };
}

export function updateUniquePentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {

    const result = updateNormalPentagon(e, state, dist, dx, dy, currentSpd * 1.2, pushX, pushY);
    return result;
}
