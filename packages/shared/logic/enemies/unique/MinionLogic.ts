import type { GameState, Enemy } from '../../core/Types';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

export function spawnMinion(state: GameState, parent: Enemy, isElite: boolean, count: number) {
    const existingMinions = state.enemies.filter(m => m.parentId === parent.id && !m.dead && m.shape === 'minion');
    const startIdx = existingMinions.length;

    for (let i = 0; i < count; i++) {
        const offsetAngle = (Math.PI * 2 / count) * i;
        const dist = 60;
        const mx = parent.x + Math.cos(offsetAngle) * dist;
        const my = parent.y + Math.sin(offsetAngle) * dist;

        const minion: Enemy = {
            id: Math.random(),
            type: isElite ? 'elite_minion' : 'minion',
            shape: isElite ? 'elite_minion' : 'minion',
            x: mx, y: my,
            size: isElite ? 18 : 15,
            hp: Math.ceil(isElite ? parent.maxHp * 0.25 : parent.maxHp * 0.15),
            maxHp: Math.ceil(isElite ? parent.maxHp * 0.25 : parent.maxHp * 0.15),
            spd: parent.spd * (isElite ? 1.6 : 1.4),
            boss: false,
            bossType: 0,
            bossAttackPattern: 0,
            lastAttack: 0,
            dead: false,
            shellStage: 0,
            palette: (parent.originalPalette || parent.palette),
            pulsePhase: 0,
            rotationPhase: 0,
            parentId: parent.id,
            minionState: 0,
            minionIndex: startIdx + i,
            spawnedAt: state.gameTime,
            stunOnHit: isElite,
            vx: 0, vy: 0,
            knockback: { x: 0, y: 0 },
            isRare: false,
            isElite: isElite
        } as any;

        state.enemies.push(minion);
        spawnParticles(state, mx, my, '#FFFFFF', 5);
    }
}

export function updateMinion(e: Enemy, state: GameState, _player: any, dx: number, dy: number, vx: number, vy: number) {
    const m = state.enemies.find(p => p.id === e.parentId);
    if (!m || m.dead) e.minionState = 1;

    if (e.minionState === 0 && m) {
        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        let nearestDist = Infinity;
        players.forEach(p => {
            const d = Math.hypot(p.x - m.x, p.y - m.y);
            if (d < nearestDist) nearestDist = d;
        });

        if (nearestDist < 350) {
            e.minionState = 1;
            playSfx('shoot');
        }
    }

    if (e.minionState === 0 && m) {
        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        let nearestPlayer: any = players[0];
        let minD = Infinity;
        players.forEach(p => {
            const d = Math.hypot(p.x - m.x, p.y - m.y);
            if (d < minD) { minD = d; nearestPlayer = p; }
        });

        const aM = Math.atan2(nearestPlayer.y - m.y, nearestPlayer.x - m.x);

        const idx = e.minionIndex || 0;
        const row = Math.floor((idx + 1) / 2);
        const side = (idx === 0) ? 0 : (idx % 2 === 1 ? -1 : 1);
        const lX = 180 - (row * 28), lY = side * (row * 32), cA = Math.cos(aM), sA = Math.sin(aM);
        const tx = m.x + (lX * cA - lY * sA), ty = m.y + (lX * sA + lY * cA);
        vx = (tx - e.x) * 0.15; vy = (ty - e.y) * 0.15;
        e.rotationPhase = Math.atan2(nearestPlayer.y - e.y, nearestPlayer.x - e.x);
    } else {
        const lT = state.gameTime - (e.spawnedAt || 0), tA = Math.atan2(dy, dx), cMA = Math.atan2(vy || dy, vx || dx);
        let diff = tA - cMA; while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
        const bA = cMA + diff * 0.08, sA = bA + Math.sin(lT * 8) * 0.4;
        vx = Math.cos(sA) * 6.0; vy = Math.sin(sA) * 6.0; e.rotationPhase = sA;
    }
    return { vx, vy };
}
