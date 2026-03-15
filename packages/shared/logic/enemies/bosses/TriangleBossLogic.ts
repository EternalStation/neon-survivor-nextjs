import type { Enemy, GameState } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { checkBossStageTransition } from './BossStageUtils';

export function updateTriangleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    checkBossStageTransition(e, state);
    const stage = e.stage || 1;
    let isBerserk = false;

    if (isLevel4) {
        state.player.healingDisabled = true;
        if (state.players) Object.values(state.players).forEach(p => p.healingDisabled = true);
        if (state.frameCount % 10 === 0) spawnParticles(state, e.x, e.y, '#7f1d1d', 5, 8, 30, 'void');
    }

    if (isLevel2) {
        if (!e.berserkTimer) e.berserkTimer = 0;
        e.berserkTimer++;

        const CD = 300 - (stage - 1) * 75;
        const DURATION = 180;

        if (!e.berserkState) {
            if (e.berserkTimer > CD) {
                e.berserkState = true;
                e.berserkTimer = 0;
            }
        } else if (e.berserkTimer > DURATION) {
            e.berserkState = false;
            e.berserkTimer = 0;
        }
        isBerserk = e.berserkState || false;
    }

    if (isLevel3) e.deflectState = isBerserk;

    const modifier = isBerserk ? 1.8 : 1.0;
    const finalSpd = currentSpd * modifier;
    const angle = Math.atan2(dy, dx);
    const wobble = isBerserk ? Math.sin(state.gameTime * 20) * 0.5 : 0;
    e.rotationPhase = (e.rotationPhase || 0) + (isBerserk ? 0.3 : 0.05);

    return { vx: Math.cos(angle + wobble) * finalSpd + pushX, vy: Math.sin(angle + wobble) * finalSpd + pushY };
}
