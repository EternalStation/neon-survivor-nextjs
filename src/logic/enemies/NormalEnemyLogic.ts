import type { GameState, Enemy } from '../types';
import { ARENA_CENTERS, ARENA_RADIUS } from '../MapLogic';
import { spawnParticles } from '../ParticleLogic';
import { spawnEnemyBullet } from '../ProjectileLogic';

export function updateNormalCircle(e: Enemy, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    if (e.timer && Date.now() < e.timer) return { vx: 0, vy: 0 };


    const a = Math.atan2(dy, dx);
    const vx = Math.cos(a) * currentSpd + pushX;
    const vy = Math.sin(a) * currentSpd + pushY;
    return { vx, vy };
}

export function updateNormalTriangle(e: Enemy, dx: number, dy: number, pushX: number, pushY: number) {
    if (!e.timer) e.timer = Date.now();

    // Dash Trigger Check
    if (e.dashState !== 1 && Date.now() - (e.lastAttack || 0) > 5000) {
        e.dashState = 1;
        e.timer = Date.now() + 200; // 0.2s Dash Duration
        e.lastAttack = Date.now();
        e.dashAngle = Math.atan2(dy, dx);
    }

    // Dashing State
    if (e.dashState === 1) {
        if (Date.now() < e.timer) {
            // Dash Speed: Cover ~150px in 0.2s (approx 12 frames) -> ~12.5 px/frame
            const dashSpeed = 12.5;
            const angle = e.dashAngle || Math.atan2(dy, dx);
            const vx = Math.cos(angle) * dashSpeed + pushX;
            const vy = Math.sin(angle) * dashSpeed + pushY;
            return { vx, vy };
        } else {
            // End Dash
            e.dashState = 0;
            e.lastAttack = Date.now(); // Reset cooldown from end of dash? Or start? usually start.
            // Resetting here means 5s AFTER dash. Previous code was 5s from START.
            // I'll keep the start time tracking (managed by Trigger Check above), but simple reset here is fine.
        }
    }

    const a = Math.atan2(dy, dx);
    // Standard movement
    const vx = Math.cos(a) * e.spd + pushX;
    const vy = Math.sin(a) * e.spd + pushY;
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
        e.distGoal = 500 + Math.random() * 400; // Variable per individual (500-900)
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
        e.timer = Date.now() + 3000 + Math.random() * 2000; // Randomized Dodge (3-5s)
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

    // Standard shot (every 6s)
    if (Date.now() - (e.lastAttack || 0) > 6000) {
        const dmg = Math.floor(e.maxHp * 0.30); // 30% of max HP
        const bulletColor = e.baseColor || (e.originalPalette ? e.originalPalette[0] : e.palette[0]);
        spawnEnemyBullet(state, e.x, e.y, angleToPlayerD, dmg, bulletColor);
        e.lastAttack = Date.now();
    }

    return { vx, vy };
}

import { spawnMinion } from './UniqueEnemyLogic';
import { playSfx } from '../AudioLogic';

export function updateNormalPentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    // Capture original palette for state restoration
    if (!e.originalPalette) e.originalPalette = e.palette;

    const nearestCenter = ARENA_CENTERS.reduce((best, center) => {
        const distToCenter = Math.hypot(e.x - center.x, e.y - center.y);
        return distToCenter < Math.hypot(e.x - best.x, e.y - best.y) ? center : best;
    }, ARENA_CENTERS[0]);
    const distToWall = ARENA_RADIUS - Math.hypot(e.x - nearestCenter.x, e.y - nearestCenter.y);

    // Initialize random kiting distance
    if (!e.distGoal) {
        e.distGoal = 600 + Math.random() * 300; // Random 600-900
    }

    const angleToPlayerP = Math.atan2(dy, dx);
    let moveAngle = angleToPlayerP;
    let speedMult = 1.0;

    // Normal Kiting logic (uses generic dist/target)
    if (distToWall < 400) {
        moveAngle = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
        speedMult = 1.5;
    } else if (dist < e.distGoal - 50) {
        moveAngle = angleToPlayerP + Math.PI; // Directly away
        speedMult = 1.5;
    } else if (dist > e.distGoal + 50) {
        moveAngle = angleToPlayerP + (Math.sin(state.gameTime) * 0.2);
    } else {
        const strafeDir = (e.id % 2 === 0) ? 1 : -1;
        moveAngle = angleToPlayerP + (Math.PI / 2) * strafeDir;
        speedMult = 0.8;
    }

    let vx = Math.cos(moveAngle) * currentSpd * speedMult + pushX;
    let vy = Math.sin(moveAngle) * currentSpd * speedMult + pushY;

    // Check for Living Minions
    const myMinions = state.enemies.filter(m => m.parentId === e.id && !m.dead && m.shape === 'minion');
    const orbitingMinions = myMinions.filter(m => m.minionState === 0);

    // --- PROXIMITY-BASED HIVE LOGIC ---
    const distToPlayer = Math.hypot(state.player.x - e.x, state.player.y - e.y);
    const hasMinions = myMinions.length > 0;

    // 1. Proximity Aggro Check
    if (distToPlayer <= 350 && orbitingMinions.length > 0) {
        orbitingMinions.forEach(m => m.minionState = 1);
        playSfx('stun-disrupt');
        e.angryUntil = Date.now() + 2000; // Stay red for 2 seconds
    }

    // 2. Visual Feedback
    const isAngry = !!(e.angryUntil && Date.now() < e.angryUntil);
    const isWarning = !!(distToPlayer <= 500 && hasMinions && !isAngry);

    if (isAngry) {
        // Full Red (Aggro State)
        e.palette = ['#EF4444', '#B91C1C', '#7F1D1D'];
        e.eraPalette = undefined; // OVERRIDE ERA PALETTE
        vx += (Math.random() - 0.5) * 8; // Extra violent shake
        vy += (Math.random() - 0.5) * 8;
    } else if (isWarning) {
        // High-Visibility Warning (Blink Red)
        const isBlink = Math.floor(Date.now() / 150) % 2 === 0;
        e.palette = isBlink ? ['#EF4444', '#F87171', '#7F1D1D'] : (e.originalPalette || e.palette);
        if (isBlink) e.eraPalette = undefined; // OVERRIDE ERA PALETTE DURING BLINK

        vx += (Math.random() - 0.5) * 6; // Increased shake
        vy += (Math.random() - 0.5) * 6;
    }

    // --- AGE-BASED DESTRUCTION SEQUENCE (Age > 60s) ---
    const age = state.gameTime - (e.spawnedAt || 0);
    if (age > 60) {
        if (orbitingMinions.length > 0) {
            // RELEASE ONE BY ONE
            if (!e.lastAttack) e.lastAttack = Date.now();
            if (Date.now() - e.lastAttack > 2000) {
                const victim = orbitingMinions[0];
                victim.minionState = 1;
                playSfx('stun-disrupt');
                e.lastAttack = Date.now();
            }
            // Pulsate White/Red while dying (Only if NOT in aggro red state)
            if (!isAngry) {
                const isBlink = Math.floor(Date.now() / 100) % 2 === 0;
                e.palette = isBlink ? ['#FFFFFF', '#EF4444', '#7F1D1D'] : (e.originalPalette || e.palette);
                if (isBlink) e.eraPalette = undefined; // OVERRIDE ERA PALETTE
            }
        } else {
            // DIE
            e.dead = true; e.hp = 0;
            spawnParticles(state, e.x, e.y, '#EF4444', 30);
            playSfx('rare-kill');
        }
        return { vx, vy };
    }

    // Normal State / Spawning Logic (Only if age <= 60 and not in aggro)
    if (!isAngry && !isWarning) {
        // Normal State / Spawning Logic
        if (e.summonState === 1) {
            // Charging Blink (Green)
            const isBlink = Math.floor(Date.now() / 150) % 2 === 0;
            e.palette = isBlink ? ['#4ade80', '#22c55e', '#166534'] : (e.originalPalette || e.palette);
            if (isBlink) e.eraPalette = undefined; // OVERRIDE ERA PALETTE

            if (Date.now() > (e.timer || 0)) {
                spawnMinion(state, e, false, 3);
                e.lastAttack = Date.now();
                e.summonState = 0;
                if (e.originalPalette) e.palette = e.originalPalette;
            }
        } else {
            if (e.originalPalette) {
                e.palette = e.originalPalette;
            }
            const spawnInterval = 20000;
            if (!e.lastAttack) e.lastAttack = Date.now();
            if (Date.now() - e.lastAttack > spawnInterval && myMinions.length < 9) {
                e.summonState = 1;
                e.timer = Date.now() + 3000;
                playSfx('warning');
            }
        }
    }

    return { vx, vy };
}

export function updateUniquePentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    // Unique Pentagons use the same basic Hive logic as Normal ones
    // But they have "Rare" visuals like trails and higher speed

    // Standard Hive Update (Movement + Spawning + Guarding)
    const result = updateNormalPentagon(e, state, dist, dx, dy, currentSpd * 1.2, pushX, pushY); // 20% faster

    // Rare Visuals: Trails (After-images)
    if (state.frameCount % 5 === 0) {
        if (!e.trails) e.trails = [];
        e.trails.push({ x: e.x, y: e.y, alpha: 0.5, rotation: e.rotationPhase || 0 });
        if (e.trails.length > 5) e.trails.shift();
    }

    // Rare Visuals: Long Paint Trail (like Snitch)
    if (!e.longTrail) e.longTrail = [];
    if (state.frameCount % 3 === 0) {
        e.longTrail.push({ x: e.x, y: e.y });
        if (e.longTrail.length > 30) e.longTrail.shift();
    }

    return result;
}
