
import type { GameState, Enemy } from '../core/types';
import { playSfx } from '../audio/AudioLogic';
import { GAME_CONFIG } from '../core/GameConfig';

export function scanForMerges(state: GameState) {
    const { enemies, spatialGrid } = state;
    for (const e of enemies) {
        if (e.dead || e.boss || e.isElite || e.isRare || e.mergeState || e.legionId || e.wormId) continue;
        if (e.mergeCooldown && state.gameTime < e.mergeCooldown) continue;
        const neighbors = spatialGrid.query(e.x, e.y, 100);
        const candidates = neighbors.filter(n =>
            n.shape === e.shape &&
            !!n.isNecroticZombie === !!e.isNecroticZombie && // Match necrotic status
            !!n.isZombie === !!e.isZombie &&               // Match friendly zombie status
            !n.dead && !n.boss && !n.isElite && !n.isRare && !n.mergeState && !n.isNeutral &&
            !n.legionId && // USER REQUEST: Legion members NEVER merge
            n.shape !== 'minion' && (!n.mergeCooldown || state.gameTime >= n.mergeCooldown)
        );
        const threshold = e.shape === 'pentagon' ? GAME_CONFIG.ENEMY.MERGE_THRESHOLD_PENTAGON : GAME_CONFIG.ENEMY.MERGE_THRESHOLD_DEFAULT;
        if (candidates.length >= threshold) {
            const cluster = candidates.slice(0, threshold);
            const mergeId = `merge_${Math.random()}`;
            cluster.forEach((c, index) => {
                c.mergeState = 'warming_up';
                c.mergeId = mergeId;
                c.mergeTimer = state.gameTime + GAME_CONFIG.ENEMY.MERGE_TIMER;
                c.mergeHost = index === 0;
                c.mergeCooldown = undefined;
            });
            playSfx('merge-start');
            return;
        }
    }
}

export function manageMerges(state: GameState) {
    const { enemies } = state;
    const mergeGroups = new Map<string, Enemy[]>();
    enemies.forEach(e => {
        if (e.mergeState === 'warming_up' && e.mergeId && !e.dead) {
            if (!mergeGroups.has(e.mergeId)) mergeGroups.set(e.mergeId, []);
            mergeGroups.get(e.mergeId)!.push(e);
        }
    });

    mergeGroups.forEach((group, mergeId) => {
        const aliveEnemies = group.filter(e => !e.dead && e.hp > 0);
        const sample = group[0];
        const threshold = (sample && sample.shape === 'pentagon') ? GAME_CONFIG.ENEMY.MERGE_THRESHOLD_PENTAGON : GAME_CONFIG.ENEMY.MERGE_THRESHOLD_DEFAULT;

        if (aliveEnemies.length < threshold) {
            const firstAlive = aliveEnemies[0];
            if (firstAlive) {
                const nearby = state.spatialGrid.query(firstAlive.x, firstAlive.y, 100);
                const recruits = nearby.filter(n =>
                    n.shape === firstAlive.shape &&
                    !!n.isNecroticZombie === !!firstAlive.isNecroticZombie &&
                    !!n.isZombie === !!firstAlive.isZombie &&
                    !n.dead && !n.boss && !n.isElite && !n.isRare && !n.mergeState
                ).slice(0, threshold - aliveEnemies.length);
                recruits.forEach((r) => {
                    r.mergeState = 'warming_up';
                    r.mergeId = mergeId;
                    r.mergeTimer = firstAlive.mergeTimer;
                    r.mergeHost = false;
                    r.mergeCooldown = undefined;
                });
                aliveEnemies.push(...recruits);
            }
            if (aliveEnemies.length < threshold) {
                group.forEach(e => {
                    e.mergeState = 'none'; e.mergeTimer = 0; e.mergeId = undefined;
                    e.mergeHost = false; e.mergeCooldown = state.gameTime + 2;
                });
                return;
            }
        }

        const first = aliveEnemies[0];
        if (state.gameTime >= (first.mergeTimer || 0)) {
            const host = aliveEnemies.find(e => e.mergeHost);
            if (!host) return;
            host.mergeState = 'none'; host.isElite = true; host.eliteState = 0;
            host.spawnedAt = state.gameTime;
            host.lastAttack = state.gameTime + Math.random() * 2.0;
            host.isFlanker = ['circle', 'triangle', 'square'].includes(host.shape) && Math.random() < 0.10; // Re-roll or ensure 10% for elites
            host.flankAngle = Math.random() * Math.PI * 2;
            host.flankDistance = 450 + Math.random() * 200; // Elites stay a bit further?
            host.size *= GAME_CONFIG.ENEMY.MERGE_SIZE_MULT;
            const mult = host.shape === 'pentagon' ? GAME_CONFIG.ENEMY.MERGE_HP_MULT_PENTAGON : GAME_CONFIG.ENEMY.MERGE_HP_MULT_DEFAULT;
            const xpMult = host.shape === 'pentagon' ? GAME_CONFIG.ENEMY.MERGE_XP_MULT_PENTAGON : GAME_CONFIG.ENEMY.MERGE_XP_MULT_DEFAULT;
            const soulMult = host.shape === 'pentagon' ? GAME_CONFIG.ENEMY.MERGE_SOUL_MULT_PENTAGON : GAME_CONFIG.ENEMY.MERGE_SOUL_MULT_DEFAULT;

            host.hp *= mult; host.maxHp *= mult; host.hp = host.maxHp;
            host.xpRewardMult = xpMult;
            host.soulRewardMult = soulMult;

            // Retain identity status if merging zombies
            if (host.isNecroticZombie) {
                host.palette = ['#0f172a', '#4f46e5', '#818cf8']; // Void Indigo
                host.eraPalette = ['#0f172a', '#4f46e5', '#818cf8'];
            } else if (host.isZombie) {
                host.palette = ['#4ade80', '#22c55e', '#166534']; // Friendly Undead Green
                host.eraPalette = ['#4ade80', '#22c55e', '#166534'];
            }

            aliveEnemies.forEach(e => {
                if (e !== host) { e.dead = true; e.hp = 0; }
            });
            playSfx('merge-complete');
        }
    });
}
