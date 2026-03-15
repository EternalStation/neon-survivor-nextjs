import type { Enemy, GameState } from '../../core/Types';
import { spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

export function checkBossStageTransition(e: Enemy, state: GameState) {
    if (!e.stage) e.stage = 1;
    const hpPct = e.hp / e.maxHp;
    let transitioned = false;

    if (e.stage === 1 && hpPct < 0.66) {
        e.stage = 2;
        transitioned = true;
    } else if (e.stage === 2 && hpPct < 0.33) {
        e.stage = 3;
        transitioned = true;
    }

    if (transitioned) {
        e.invincibleUntil = state.gameTime + 1.0;
        spawnFloatingNumber(state, e.x, e.y, `STAGE ${e.stage}`, '#ef4444', true, undefined, 36, e.id);
        playSfx('rare-spawn');
    }
}
