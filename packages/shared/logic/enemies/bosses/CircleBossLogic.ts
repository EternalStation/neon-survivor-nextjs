import type { Enemy, GameState } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';
import { checkBossStageTransition } from './BossStageUtils';

export function updateCircleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    checkBossStageTransition(e, state);
    const distToPlayer = Math.hypot(dx, dy);
    const stage = e.stage || 1;

    if (isLevel4) {
        if (!e.soulSuckUsed && distToPlayer < 700) {
            e.soulSuckUsed = true;
            e.soulSuckActive = true;
            e.soulSuckTimer = 300;
            playSfx('warning');
        }

        if (e.soulSuckActive) {
            const totalTime = 300;
            e.soulSuckTimer = (e.soulSuckTimer || 0) - 1;
            const progress = Math.min(1.0, (totalTime - e.soulSuckTimer) / totalTime);

            if (e.soulSuckTimer <= 0) {
                e.soulSuckActive = false;
            }

            e.takenDamageMultiplier = 0;

            if (state.frameCount % 3 === 0) {
                const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                const spd = 15;
                const px = state.player.x + (Math.random() - 0.5) * 40;
                const py = state.player.y + (Math.random() - 0.5) * 40;
                spawnParticles(state, px, py, '#eab308', 4, spd, angleToBoss, 'void');
            }

            state.player.soulDrainMult = 1.0 - (0.5 * progress);
            e.soulSuckCoreSize = 5 + (25 * progress);

            return { vx: 0, vy: 0 };
        } else if (e.soulSuckUsed) {
            state.player.soulDrainMult = 0.5;
            e.takenDamageMultiplier = 1.0;
        }
    }

    if (isLevel3) {
        if (!e.cycloneTimer) e.cycloneTimer = 0;
        e.cycloneTimer++;

        if (e.cycloneState === 1) {
            const duration = 120 + (stage - 1) * 40;
            if (e.cycloneTimer > duration) {
                e.cycloneState = 0;
                e.cycloneTimer = 0;
            } else {
                const pullStrength = 0.86;
                const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                state.player.knockback.x += Math.cos(angleToBoss) * pullStrength;
                state.player.knockback.y += Math.sin(angleToBoss) * pullStrength;
                e.rotationPhase = (e.rotationPhase || 0) + 0.5;
                if (state.frameCount % 5 === 0) spawnParticles(state, e.x, e.y, '#d1d5db', 3);
                return { vx: 0, vy: 0 };
            }
        } else {
            const interval = 600 - (stage - 1) * 150;
            if (e.cycloneTimer > interval) {
                const pDist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                const isDashReady = !e.dashState || (e.dashState === 0 && (e.dashTimer || 0) > 90);
                if (pDist > 400 && isDashReady) {
                    e.cycloneState = 1;
                    e.cycloneTimer = 0;
                    playSfx('warning');
                } else {
                    e.cycloneTimer = 600;
                }
            }
        }
    }

    if (isLevel2) {
        if (!e.dashTimer) e.dashTimer = 0;
        e.dashTimer++;
        const CD = 390 - (stage - 1) * 90;

        if (e.dashState !== 1 && e.dashState !== 2) {
            const isCycloneSafe = !isLevel3 || (e.cycloneState !== 1 && (e.cycloneTimer || 0) > 120);
            if (distToPlayer < 700 && e.dashTimer > CD && isCycloneSafe) {
                e.dashState = 1;
                e.dashTimer = 0;
                e.dashLockX = state.player.x;
                e.dashLockY = state.player.y;
            }
            const angle = Math.atan2(dy, dx);
            return { vx: Math.cos(angle) * currentSpd + pushX, vy: Math.sin(angle) * currentSpd + pushY };
        } else if (e.dashState === 1) {
            if (e.dashTimer > 30) {
                e.dashState = 2;
                e.dashTimer = 0;
                e.dashAngle = Math.atan2((e.dashLockY || 0) - e.y, (e.dashLockX || 0) - e.x);
            }
            return { vx: 0, vy: 0 };
        } else if (e.dashState === 2) {
            if (e.dashTimer > 30) {
                e.dashState = 0;
                e.dashTimer = 0;
            }
            return { vx: Math.cos(e.dashAngle || 0) * (currentSpd * 5), vy: Math.sin(e.dashAngle || 0) * (currentSpd * 5) };
        }
    }

    const angle = Math.atan2(dy, dx);
    return { vx: Math.cos(angle) * currentSpd + pushX, vy: Math.sin(angle) * currentSpd + pushY };
}
