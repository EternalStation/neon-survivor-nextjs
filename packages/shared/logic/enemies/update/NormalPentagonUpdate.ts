import { playSfx } from '../../audio/AudioLogic';
import { spawnParticles } from '../../effects/ParticleLogic';
import { ARENA_CENTERS, ARENA_RADIUS } from '../../mission/MapLogic';
import { spawnMinion } from '../unique/MinionLogic';
import { EnemyUpdateContext } from './EnemyUpdateContext';

export function updateNormalPentagon({ enemy, state, dist, dx, dy, currentSpd, pushX, pushY }: EnemyUpdateContext) {
    if (!enemy.originalPalette) enemy.originalPalette = enemy.palette;

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(enemy.x - center.x, enemy.y - center.y);
        return distToCenter < Math.hypot(enemy.x - best.x, enemy.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToWall = ARENA_RADIUS - Math.hypot(enemy.x - nearestCenter.x, enemy.y - nearestCenter.y);

    if (!enemy.distGoal) {
        enemy.distGoal = 600 + Math.random() * 300;
    }

    const angleToPlayer = Math.atan2(dy, dx);
    let moveAngle = angleToPlayer;
    let speedMult = 1.0;

    if (distToWall < 400) {
        moveAngle = Math.atan2(nearestCenter.y - enemy.y, nearestCenter.x - enemy.x);
        speedMult = 1.5;
    } else if (dist < enemy.distGoal - 50) {
        moveAngle = angleToPlayer + Math.PI;
        speedMult = 0.85;
    } else if (dist > enemy.distGoal + 50) {
        moveAngle = angleToPlayer + (Math.sin(state.gameTime) * 0.2);
    } else {
        const strafeDir = (enemy.id % 2 === 0) ? 1 : -1;
        moveAngle = angleToPlayer + (Math.PI / 2) * strafeDir;
        speedMult = 0.8;
    }

    const targetVx = Math.cos(moveAngle) * currentSpd * speedMult + pushX;
    const targetVy = Math.sin(moveAngle) * currentSpd * speedMult + pushY;
    const smoothing = 0.12;
    let vx = (enemy.vx || 0) * (1 - smoothing) + targetVx * smoothing;
    let vy = (enemy.vy || 0) * (1 - smoothing) + targetVy * smoothing;

    if (enemy.minionCount === undefined || state.frameCount % 10 === 0) {
        const myMinions = state.enemies.filter(m => m.parentId === enemy.id && !m.dead && (m.shape === 'minion' || m.shape === 'elite_minion'));
        enemy.minionCount = myMinions.length;
        enemy.orbitingMinionIds = myMinions.filter(m => m.minionState === 0).map(m => m.id);
    }

    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    let distToNearest = Infinity;
    players.forEach(player => {
        const playerDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (playerDist < distToNearest) distToNearest = playerDist;
    });

    const hasMinions = (enemy.minionCount || 0) > 0;

    if (distToNearest <= 350 && (enemy.orbitingMinionIds?.length || 0) > 0) {
        state.enemies.forEach(minion => {
            if (enemy.orbitingMinionIds?.includes(minion.id)) minion.minionState = 1;
        });
        playSfx('stun-disrupt');
        enemy.angryUntil = state.gameTime + 2.0;
        enemy.orbitingMinionIds = [];
    }

    const isAngry = !!(enemy.angryUntil && state.gameTime < enemy.angryUntil);
    const isWarning = !!(distToNearest <= 500 && hasMinions && !isAngry);

    if (isAngry) {
        enemy.palette = ['#EF4444', '#B91C1C', '#7F1D1D'];
        enemy.eraPalette = undefined;
        vx += (Math.random() - 0.5) * 8;
        vy += (Math.random() - 0.5) * 8;
    } else if (isWarning) {
        enemy.palette = ['#EF4444', '#F87171', '#7F1D1D'];
        enemy.eraPalette = undefined;
        vx += (Math.random() - 0.5) * 6;
        vy += (Math.random() - 0.5) * 6;
    }

    const age = state.gameTime - (enemy.spawnedAt || 0);
    if (age > 60) {
        if ((enemy.minionCount || 0) > 0) {
            if (enemy.lastAttack === undefined) enemy.lastAttack = state.gameTime;
            if (state.gameTime - (enemy.lastAttack || 0) > 1.0) {
                const victim = state.enemies.find(m => m.parentId === enemy.id && m.minionState === 0 && !m.dead);
                if (victim) {
                    victim.minionState = 1;
                    playSfx('stun-disrupt');
                }
                enemy.lastAttack = state.gameTime;
                enemy.minionCount = (enemy.minionCount || 1) - 1;
            }
            if (!isAngry) {
                enemy.palette = ['#FFFFFF', '#EF4444', '#7F1D1D'];
                enemy.eraPalette = undefined;
            }
        } else {
            enemy.dead = true;
            enemy.hp = 0;
            spawnParticles(state, enemy.x, enemy.y, '#EF4444', 30);
            playSfx('rare-kill');
        }
        return { vx, vy };
    }

    if (enemy.lastAttack === undefined) enemy.lastAttack = state.gameTime;

    if (enemy.summonState === 1) {
        if (state.gameTime > (enemy.timer || 0)) {
            spawnMinion(state, enemy, false, 3);
            enemy.lastAttack = state.gameTime;
            enemy.summonState = 0;
            if (enemy.originalPalette) enemy.palette = enemy.originalPalette;
        }
    } else {
        const spawnInterval = 15.0;
        if (state.gameTime - (enemy.lastAttack || 0) > spawnInterval && (enemy.minionCount || 0) < 9) {
            enemy.summonState = 1;
            enemy.timer = state.gameTime + 3.0;
            playSfx('warning');
        }
    }

    if (!isAngry && !isWarning && enemy.summonState !== 1 && enemy.originalPalette) {
        enemy.palette = enemy.originalPalette;
    }

    return { vx, vy };
}

export function updateUniquePentagon(context: EnemyUpdateContext) {
    return updateNormalPentagon({ ...context, currentSpd: context.currentSpd * 1.2 });
}
