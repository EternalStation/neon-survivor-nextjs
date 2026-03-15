import type { GameState, Enemy } from '../../core/Types';
import { isInMap } from '../../mission/MapLogic';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

export function updateGlitcher(e: Enemy, state: GameState, _step: number) {
    const player = state.player;
    const now = state.gameTime;

    e.hp = e.maxHp;

    const lifespan = 20;
    const age = now - (e.spawnedAt || now);

    if (age < 4) {
        return { vx: 0, vy: 0 };
    }

    if (age >= lifespan) {
        const colors = ['#ff00ff', '#00ffff', '#ffffff'];
        for (let i = 0; i < 30; i++) {
            spawnParticles(state, e.x, e.y, colors, 5);
        }
        playSfx('smoke-puff');
        e.dead = true;
        e.hp = 0;
        console.log('[GLITCHER] Disappeared after 20 seconds');
        return { vx: 0, vy: 0 };
    }

    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    let nearestDist = Infinity;
    let nearestPlayer: any = players[0];
    players.forEach(p => {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < nearestDist) { nearestDist = d; nearestPlayer = p; }
    });

    const distToPlayer = nearestDist;
    const blinkCooldown = 6;
    if (distToPlayer < 300 && (!e.lastBlink || now - e.lastBlink > blinkCooldown) && !e.glitchDecoy) {
        const oldX = e.x, oldY = e.y;
        const angle = Math.random() * Math.PI * 2;
        const dist = 400 + Math.random() * 200;
        const tx = nearestPlayer.x + Math.cos(angle) * dist;
        const ty = nearestPlayer.y + Math.sin(angle) * dist;

        if (isInMap(tx, ty)) {
            e.x = tx; e.y = ty;
            e.lastBlink = now;
            const colors = ['#ff00ff', '#00ffff', '#ffffff'];
            spawnParticles(state, oldX, oldY, colors, 20);
            spawnParticles(state, e.x, e.y, colors, 20);
            playSfx('smoke-puff');
        }
    }

    const cloudInterval = 5;
    if (distToPlayer < 700 && (!e.lastLeak || now - e.lastLeak > cloudInterval)) {
        state.areaEffects.push({
            id: Math.random(),
            type: 'glitch_cloud',
            x: player.x,
            y: player.y,
            radius: 120,
            duration: 8,
            creationTime: now,
            level: 1
        });
        spawnParticles(state, player.x, player.y, ['#ff00ff', '#00ffff'], 8);

        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 200;
            const cloudX = player.x + Math.cos(angle) * distance;
            const cloudY = player.y + Math.sin(angle) * distance;

            state.areaEffects.push({
                id: Math.random(),
                type: 'glitch_cloud',
                x: cloudX,
                y: cloudY,
                radius: 120,
                duration: 8,
                creationTime: now,
                level: 1
            });

            spawnParticles(state, cloudX, cloudY, ['#ff00ff', '#00ffff'], 8);
        }

        e.lastLeak = now;
        console.log('[GLITCHER] Spawned 3 Glitch Clouds: 1 on player, 2 nearby');
        playSfx('smoke-puff');
    }

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    let vx = 0, vy = 0;

    if (dist > 1 && !isNaN(dist)) {
        if (dist < 300) {
            vx = -(dx / dist) * e.spd;
            vy = -(dy / dist) * e.spd;
        } else if (dist > 500) {
            vx = (dx / dist) * e.spd;
            vy = (dy / dist) * e.spd;
        } else {
            const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
            vx = Math.cos(perpAngle) * e.spd;
            vy = Math.sin(perpAngle) * e.spd;
        }
    }

    if (isNaN(vx)) vx = 0;
    if (isNaN(vy)) vy = 0;

    return { vx, vy };
}
