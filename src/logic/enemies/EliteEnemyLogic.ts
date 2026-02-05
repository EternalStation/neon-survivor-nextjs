import type { GameState, Enemy } from '../types';
import { ARENA_CENTERS, ARENA_RADIUS } from '../MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../ParticleLogic';
import { playSfx } from '../AudioLogic';
import { calcStat, getDefenseReduction } from '../MathUtils';
// Actually, check if it is used anywhere else.
// updateEliteCircle: No.
// updateEliteTriangle: No.
// updateEliteSquare: No.
// updateEliteDiamond: No (removed).
// updateElitePentagon: No.
// Safe to remove.

import { spawnMinion } from './UniqueEnemyLogic';


export function updateEliteCircle(e: Enemy, state: GameState, player: any, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number) {
    let vx = 0, vy = 0;
    if (!e.eliteState) e.eliteState = 0;
    if (e.eliteState === 0) {
        if (dist < 600 && (!e.timer || Date.now() > e.timer)) {
            e.eliteState = 1; e.timer = Date.now() + 500;

        }
        const a = Math.atan2(dy, dx);
        vx = Math.cos(a) * currentSpd + pushX; vy = Math.sin(a) * currentSpd + pushY;
    } else if (e.eliteState === 1) {
        vx = 0; vy = 0; e.rotationPhase = (e.rotationPhase || 0) + 0.2;
        if (Date.now() > (e.timer || 0)) {
            const ta = Math.atan2(player.y - e.y, player.x - e.x);
            e.lockedTargetX = player.x + Math.cos(ta) * 200; e.lockedTargetY = player.y + Math.sin(ta) * 200;
            e.dashState = ta; e.eliteState = 2; e.timer = Date.now() + 500;
        }
    } else if (e.eliteState === 2) {
        if (e.lockedTargetX !== undefined && e.lockedTargetY !== undefined) {
            const rDx = e.lockedTargetX - e.x, rDy = e.lockedTargetY - e.y, rDist = Math.hypot(rDx, rDy);
            if (rDist > 10) {
                const a = Math.atan2(rDy, rDx); vx = Math.cos(a) * 10; vy = Math.sin(a) * 10;
                // Use Era Color (Palette[0]) instead of fixed Red
                const pColor = e.palette ? e.palette[0] : '#EF4444';
                spawnParticles(state, e.x, e.y, pColor, 1);
            } else {
                e.eliteState = 0; e.timer = Date.now() + 5000;
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
        if ((!e.timer || Date.now() > e.timer) && dist < 600) {
            e.eliteState = 1; e.timer = Date.now() + 2500; // 2.5s Berserk Duration
        }
        const a = Math.atan2(dy, dx);
        vx = Math.cos(a) * e.spd + pushX; vy = Math.sin(a) * e.spd + pushY;
    } else {
        e.rotationPhase = (e.rotationPhase || 0) + 0.5;
        const a = Math.atan2(dy, dx) + Math.sin(Date.now() / 100) * 0.5;
        const fast = currentSpd * 1.75;
        vx = Math.cos(a) * fast + pushX; vy = Math.sin(a) * fast + pushY;
        spawnParticles(state, e.x, e.y, e.eraPalette?.[0] || e.palette[0], 1);
        if (Date.now() > (e.timer || 0)) {
            e.eliteState = 0; e.timer = Date.now() + 5000;
        }
    }
    return { vx, vy };
}

export function updateEliteSquare(e: Enemy, state: GameState, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number) {
    const aS = Math.atan2(dy, dx);
    // Speed: 0.85x Base
    const vx = Math.cos(aS) * (currentSpd * 0.85) + pushX;
    const vy = Math.sin(aS) * (currentSpd * 0.85) + pushY;
    if (Math.random() < 0.1) spawnParticles(state, e.x + (Math.random() - 0.5) * e.size * 2, e.y + (Math.random() - 0.5) * e.size * 2, '#94A3B8', 1);
    return { vx, vy };
}

export function updateEliteDiamond(e: Enemy, state: GameState, player: any, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number, onEvent?: (event: string, data?: any) => void) {
    const angleToPlayerD = Math.atan2(dy, dx);
    let vx = 0, vy = 0;

    // ELITE SKILL: HYPER BEAM
    if (!e.eliteState) e.eliteState = 0;

    // Keep distance logic (Variable Kiting 600-800)
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
        // Kiting Phase
        if (veryCloseToWall && (!e.lastDodge || Date.now() - (e.lastDodge || 0) > 3000)) {
            const angleToCenter = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
            const angleAwayFromPlayer = angleToPlayerD + Math.PI;
            e.dashState = (angleToCenter + angleAwayFromPlayer) / 2;
            e.lockedTargetX = 0; // Escape flag
            e.lockedTargetY = Date.now() + 2000;
            e.lastDodge = Date.now();
        }

        if (e.lockedTargetX === 0) {
            if (Date.now() > (e.lockedTargetY || 0)) {
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

        // Charge Transition (Every 5 seconds)
        if (Date.now() - (e.lastAttack || 0) > 5000) {
            e.eliteState = 1;
            e.timer = Date.now() + 1200; // 1.2s Charge
            e.dashState = angleToPlayerD; // Lock angle
        }
    } else if (e.eliteState === 1) {
        // Charging (Waiting)
        vx = 0; vy = 0;
        if (Date.now() > (e.timer || 0)) {
            e.eliteState = 2;
            e.timer = Date.now() + 800; // Firing animation
            e.hasHitThisBurst = false; // Reset burst hit flag
            playSfx('laser');
        }
    } else if (e.eliteState === 2) {
        // Firing
        vx = 0; vy = 0;
        // Visuals can check state 2
        e.lockedTargetX = e.x + Math.cos(e.dashState || 0) * 3000;
        e.lockedTargetY = e.y + Math.sin(e.dashState || 0) * 3000;

        const laserAngle = e.dashState || 0;
        const px = player.x - e.x;
        const py = player.y - e.y;
        const pDist = Math.hypot(px, py);
        const pAngle = Math.atan2(py, px);
        const angleDiff = Math.abs(pAngle - laserAngle);

        // Massive 3000 Range
        if (angleDiff < 0.1 && pDist < 3000 && !e.hasHitThisBurst) {
            e.hasHitThisBurst = true;
            // Damage: 5% of ELITE DIAMOND MAX HP
            // This makes them scale insanely hard if they have millions of HP? 
            // "5% of Elite Diamond MAX HP". Yes.
            // Should armor reduce this? "ignores defense/shielding"
            // "ignores defense/shielding" usually implies True Damage.
            // But previous code applied Armor.
            // Requirement: "5% of Player's Max HP (ignores defense/shielding, flat percentage). no - 5% of Elite Diamond MAX HP"
            // Does the "No" apply to "ignores defense"? 
            // "no - 5% of Elite Diamond MAX HP" likely replaces "5% of Player's Max HP".
            // I will assume it DOES IGNORE defense/shielding as stated in the first part, because "no" was about the source of the 5%.
            // Wait, "ignores defense/shielding" means armor doesn't reduce it.
            // And "shielding" usually refers to normal shield? Or Legendary Shield?
            // "flat percentage" suggests pure damage.

            const rawDmg = e.maxHp * 0.04;

            // LASER REDUCTION LOGIC
            // User: Lasers are reduced by armor, but NOT by projectile reduction
            const armorObject = player.arm; // This is the PlayerStats object
            const armorValue = calcStat(armorObject);
            const reduction = getDefenseReduction(armorValue);
            const finalActualDmg = rawDmg * (1 - reduction);

            // Track Stats
            player.damageBlockedByArmor += (rawDmg - finalActualDmg);
            player.damageBlocked += (rawDmg - finalActualDmg);

            if (finalActualDmg > 0) {
                player.curHp -= finalActualDmg;
                player.damageTaken += finalActualDmg;
                const beamColor = e.palette ? e.palette[0] : '#f87171';
                spawnFloatingNumber(state, player.x, player.y, Math.ceil(finalActualDmg).toString(), beamColor, false);
            }

            if (player.curHp <= 0 && !state.gameOver) {
                state.gameOver = true;
                player.deathCause = 'Elite Diamond Laser';
                if (onEvent) onEvent('game_over');
            }
        }

        // --- ZOMBIE INSTA-KILL BY LASER ---
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

    if (e.eliteState !== 0 && Date.now() > (e.timer || 0)) {
        e.eliteState = 0;
        e.lastAttack = Date.now();
        e.lockedTargetX = undefined;
        e.lockedTargetY = undefined;
    }
    return { vx, vy };
}

export function updateElitePentagon(e: Enemy, state: GameState, dist: number, dx: number, dy: number, currentSpd: number, pushX: number, pushY: number, _onEvent?: (event: string, data?: any) => void) {
    // Movement handled by Normal/Shared logic (caller should handle calling Normal Pentagon Update if this returns null or if it's integrated)
    // Actually, Elite Pentagon logic IS the same as Normal but with Elite Spawning parameters.
    // The spawning is the ONLY difference in logic besides stats (which are handled in spawnEnemy).
    // So we can just reuse the Normal Pentagon logic for movement.
    // BUT we must handle Spawning here if we want strict separation, OR allow Normal logic to handle it if we pass "isElite".

    // As per previous plan, Spawning is handled in the `NormalEnemyLogic`'s `updateNormalPentagon` (if needed) or separate trigger.
    // Let's implement Spawning HERE for Elite, and remove it from `NormalEnemyLogic` if called as elite?
    // Or simpler: Pentagon Logic is identical except for Spawn params.
    // The Caller (EnemyLogic.ts) can just handle the movement via `updateNormalPentagon`, then call `handlePentagonSpawning(e, true)`?

    // For now, let's assume Elite Pentagon logic just handles the Extra Spawning capability (Stunning Minions).
    // The movement is identical.
    // I will return NULL here to indicate "Use Default Movement", or I can duplicate the movement.
    // I will duplicate the movement for robustness as requested, or import it.
    // Since I cannot easily import from NormalEnemyLogic (circular?), I will duplicate the small block.
    // Actually, I'll refer to updateNormalPentagon in my instruction to the orchestrator.
    // But `updateNormalPentagon` is not imported here.

    // Let's duplicate the kiting logic for Elite Pentagon to ensure it's self-contained in `EliteEnemies.ts`.

    // Capture original palette
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

    if (distToWall < 400) {
        moveAngle = Math.atan2(nearestCenter.y - e.y, nearestCenter.x - e.x);
        speedMult = 1.5;
    } else if (dist < e.distGoal - 50) {
        moveAngle = angleToPlayerP + Math.PI;
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
                spawnMinion(state, e, true, 3);
                e.lastAttack = Date.now();
                e.summonState = 0;
                if (e.originalPalette) e.palette = e.originalPalette;
            }
        } else {
            if (e.originalPalette) e.palette = e.originalPalette;
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
