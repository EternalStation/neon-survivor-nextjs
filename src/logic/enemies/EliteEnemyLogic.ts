import type { GameState, Enemy } from '../core/types';
import { ARENA_CENTERS, ARENA_RADIUS } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { applyDamageToPlayer } from '../utils/CombatUtils';
import { spawnMinion } from './UniqueEnemyLogic';


export function updateEliteCircle(e: Enemy, state: GameState, player: any, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    let vx = 0, vy = 0;
    if (!e.eliteState) e.eliteState = 0;
    if (e.eliteState === 0) {
        if (dist < 600 && (!e.timer || state.gameTime > e.timer)) {
            e.eliteState = 1; e.timer = state.gameTime + 0.5;
        }
        const a = Math.atan2(dy, dx);
        vx = Math.cos(a) * currentSpd + pushX; vy = Math.sin(a) * currentSpd + pushY;
    } else if (e.eliteState === 1) {
        vx = 0; vy = 0; e.rotationPhase = (e.rotationPhase || 0) + 0.2;
        if (state.gameTime > (e.timer || 0)) {

            const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
            let nearestP: any = players[0];
            let minD = Infinity;
            players.forEach(p => {
                const d = Math.hypot(p.x - e.x, p.y - e.y);
                if (d < minD) { minD = d; nearestP = p; }
            });

            const ta = Math.atan2(nearestP.y - e.y, nearestP.x - e.x);
            e.lockedTargetX = nearestP.x + Math.cos(ta) * 200; e.lockedTargetY = nearestP.y + Math.sin(ta) * 200;
            e.dashState = ta; e.eliteState = 2; e.timer = state.gameTime + 0.5;
        }
    } else if (e.eliteState === 2) {
        if (e.lockedTargetX !== undefined && e.lockedTargetY !== undefined) {
            const rDx = e.lockedTargetX - e.x, rDy = e.lockedTargetY - e.y, rDist = Math.hypot(rDx, rDy);
            if (rDist > 10) {
                const a = Math.atan2(rDy, rDx); vx = Math.cos(a) * 10; vy = Math.sin(a) * 10;

                const pColor = e.palette ? e.palette[0] : '#EF4444';
                spawnParticles(state, e.x, e.y, pColor, 1);
            } else {
                e.eliteState = 0; e.timer = state.gameTime + 5.0 + Math.random() * 2.0;
                e.lockedTargetX = undefined; e.lockedTargetY = undefined;
            }
        }
    }
    return { vx, vy };
}

export function updateEliteTriangle(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    let vx = 0, vy = 0;
    if (!e.eliteState) e.eliteState = 0;

    if (e.eliteState === 0) {
        const a = Math.atan2(dy, dx);
        vx = Math.cos(a) * currentSpd + pushX; vy = Math.sin(a) * currentSpd + pushY;

        if ((!e.timer || state.gameTime > e.timer) && dist < 600) {
            e.eliteState = 1; e.timer = state.gameTime + 0.5;
            playSfx('warning');
        }
    } else if (e.eliteState === 1) {
        vx = 0; vy = 0;
        e.rotationPhase = (e.rotationPhase || 0) + 0.1;

        if (state.gameTime > (e.timer || 0)) {
            const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
            let nearestP: any = players[0];
            let minD = Infinity;
            players.forEach(p => {
                const d = Math.hypot(p.x - e.x, p.y - e.y);
                if (d < minD) { minD = d; nearestP = p; }
            });

            const ta = Math.atan2(nearestP.y - e.y, nearestP.x - e.x);
            e.lockedTargetX = nearestP.x + Math.cos(ta) * 200;
            e.lockedTargetY = nearestP.y + Math.sin(ta) * 200;
            e.eliteState = 2;
            e.timer = state.gameTime + 1.5;
        }
    } else {
        if (e.lockedTargetX !== undefined && e.lockedTargetY !== undefined) {
            const rDx = e.lockedTargetX - e.x, rDy = e.lockedTargetY - e.y, rDist = Math.hypot(rDx, rDy);

            if (rDist > 10 && state.gameTime < (e.timer || 0)) {
                e.rotationPhase = (e.rotationPhase || 0) + 0.5;
                const a = Math.atan2(rDy, rDx) + Math.sin(state.gameTime * 20) * 0.4;
                vx = Math.cos(a) * 10 + pushX; vy = Math.sin(a) * 10 + pushY;
            } else {
                e.eliteState = 0;
                e.timer = state.gameTime + 4.0 + Math.random() * 2.0;
                e.lockedTargetX = undefined; e.lockedTargetY = undefined;
            }
        }
    }
    return { vx, vy };
}

export function updateEliteSquare(e: Enemy, state: GameState, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number) {
    const aS = Math.atan2(dy, dx);

    const vx = Math.cos(aS) * (currentSpd * 0.85) + pushX;
    const vy = Math.sin(aS) * (currentSpd * 0.85) + pushY;
    if (Math.random() < 0.1) spawnParticles(state, e.x + (Math.random() - 0.5) * e.size * 2, e.y + (Math.random() - 0.5) * e.size * 2, '#94A3B8', 1);
    return { vx, vy };
}

export function updateEliteDiamond(e: Enemy, state: GameState, player: any, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number, onEvent?: (event: string, data?: any) => void) {
    const angleToPlayerD = Math.atan2(dy, dx);
    let vx = 0, vy = 0;


    if (!e.eliteState) e.eliteState = 0;


    if (!e.distGoal) {
        e.distGoal = 600 + Math.random() * 200;
    }

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(e.x - center.x, e.y - center.y);
        return distToCenter < Math.hypot(e.x - best.x, e.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToCenter = Math.hypot(e.x - nearestCenter.x, e.y - nearestCenter.y);
    const distToWall = ARENA_RADIUS - distToCenter;
    const veryCloseToWall = distToWall < 500;

    let distGoal = e.distGoal;
    const distFactor = (dist - distGoal) / 100;

    if (e.eliteState === 0) {

        if (veryCloseToWall && (!e.lastDodge || state.gameTime - (e.lastDodge || 0) > 3.0)) {
            const angleToCenter = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
            const angleAwayFromPlayer = angleToPlayerD + Math.PI;
            e.dashState = (angleToCenter + angleAwayFromPlayer) / 2;
            e.lockedTargetX = 0;
            e.lockedTargetY = state.gameTime + 2.0;
            e.lastDodge = state.gameTime;
        }

        if (e.lockedTargetX === 0) {
            if (state.gameTime > (e.lockedTargetY || 0)) {
                e.lockedTargetX = undefined;
                e.lockedTargetY = undefined;
            } else {
                vx = Math.cos(e.dashState || 0) * currentSpd * 2;
                vy = Math.sin(e.dashState || 0) * currentSpd * 2;
            }
        }

        if (e.lockedTargetX !== 0) {
            vx = Math.cos(angleToPlayerD) * distFactor * currentSpd + pushX;
            vy = Math.sin(angleToPlayerD) * distFactor * currentSpd + pushY;
        }


        const currentCD = (e as any).nextAttackCD || 5.0;
        if (state.gameTime - (e.lastAttack || 0) > currentCD) {
            e.eliteState = 1;
            e.timer = state.gameTime + 1.4;
            e.dashState = angleToPlayerD;
        }
    } else if (e.eliteState === 1) {

        vx = 0; vy = 0;



        const remaining = (e.timer || 0) - state.gameTime;
        if (remaining > 0.8) {

            e.dashState = angleToPlayerD;
        } else {

        }

        if (state.gameTime > (e.timer || 0)) {
            e.eliteState = 2;
            e.timer = state.gameTime + 0.8;
            e.hasHitThisBurst = false;
            playSfx('laser');
        }
    } else if (e.eliteState === 2) {

        vx = 0; vy = 0;

        e.lockedTargetX = e.x + Math.cos(e.dashState || 0) * 3000;
        e.lockedTargetY = e.y + Math.sin(e.dashState || 0) * 3000;

        const laserAngle = e.dashState || 0;


        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        players.forEach(p => {
            const px = p.x - e.x;
            const py = p.y - e.y;
            const pDist = Math.hypot(px, py);
            const pAngle = Math.atan2(py, px);
            const angleDiff = Math.abs(pAngle - laserAngle);

            if (angleDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
                e.hasHitThisBurst = true;
                const rawDmg = e.maxHp * 0.04;

                applyDamageToPlayer(state, p, rawDmg, {
                    sourceType: 'projectile',
                    onEvent,
                    deathCause: 'Incinerated by Elite Diamond Laser',
                    killerHp: e.hp,
                    killerMaxHp: e.maxHp,
                    floatingNumberColor: e.palette ? e.palette[0] : '#f87171'
                });

                const triggerZap = (state as any).triggerKineticBatteryZap || (window as any).triggerKineticBatteryZap;
                if (triggerZap) triggerZap(state, p, 1);
            }
        });


        state.enemies.forEach(z => {
            if (z.isZombie && z.zombieState === 'active' && !z.dead) {
                const zdx = z.x - e.x, zdy = z.y - e.y;
                const zDist = Math.hypot(zdx, zdy);
                const zAngle = Math.atan2(zdy, zdx);
                const zAngleDiff = Math.abs(zAngle - laserAngle);
                if (zAngleDiff < 0.1 && zDist < 3000) {
                    z.dead = true; z.hp = 0;
                    spawnParticles(state, z.x, z.y, '#4ade80', 15);
                    playSfx('smoke-puff');
                }
            }
        });
    }

    if (e.eliteState !== 0 && state.gameTime > (e.timer || 0)) {
        e.eliteState = 0;
        e.lastAttack = state.gameTime;
        (e as any).nextAttackCD = 5.0 + Math.random() * 2.0;
        e.lockedTargetX = undefined;
        e.lockedTargetY = undefined;
    }
    return { vx, vy };
}

export function updateElitePentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number, _onEvent?: (event: string, data?: any) => void) {


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

            if (!e.lastAttack) e.lastAttack = state.gameTime;
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

            spawnMinion(state, e, true, 3);
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
