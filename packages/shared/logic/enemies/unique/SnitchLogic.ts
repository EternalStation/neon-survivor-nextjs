import type { GameState, Enemy } from '../../core/Types';
import { ARENA_CENTERS, isInMap, getHexDistToWall } from '../../mission/MapLogic';
import { spawnParticles } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

function spawnDecoys(state: GameState, e: Enemy, x?: number, y?: number) {
    const px = x ?? e.x;
    const py = y ?? e.y;
    for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 40;
        const dx = px + Math.cos(angle) * dist;
        const dy = py + Math.sin(angle) * dist;

        const decoy: Enemy = {
            id: Math.random(),
            type: 'snitch',
            shape: 'snitch',
            x: dx, y: dy,
            size: 15,
            hp: 1, maxHp: 1,
            spd: e.spd * 0.8,
            dead: false,
            palette: ['#FACC15', '#EAB308', '#CA8A04'],
            isRare: true,
            rareReal: false,
            spawnedAt: state.gameTime,
            vx: 0, vy: 0,
            knockback: { x: 0, y: 0 },
            boss: false,
            timer: state.gameTime + 2.5
        } as any;
        state.enemies.push(decoy);
        spawnParticles(state, dx, dy, ['#FFFFFF', '#FACC15'], 5);
    }
}

export function updateSnitch(e: Enemy, state: GameState, player: any, timeS: number) {
    let vx = 0, vy = 0;
    const timeInP = state.gameTime - (e.spawnedAt || 0);

    if (e.rareReal === false) {
        if (timeS > (e.timer || 0)) e.dead = true;
        const ang = Math.atan2(e.y - player.y, e.x - player.x);
        return { vx: Math.cos(ang) * e.spd, vy: Math.sin(ang) * e.spd };
    }

    if (timeInP > 30) {
        e.dead = true; state.rareSpawnActive = false;
        playSfx('rare-despawn'); return { vx: 0, vy: 0 };
    }

    if (e.charge === undefined) e.charge = 3;
    if (e.lastLaunchTime === undefined) e.lastLaunchTime = timeS;
    if (e.glitchPhase === undefined) e.glitchPhase = 0;

    if (e.charge < 3 && timeS - e.lastLaunchTime > 3.0) {
        e.charge++;
        e.lastLaunchTime = timeS;
    }

    const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
    let nearestPlayer: any = players[0];
    let minD = Infinity;
    players.forEach(p => {
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < minD) { minD = d; nearestPlayer = p; }
    });
    const dToP = minD;

    const skillDetected = state.areaEffects.some(ae =>
        (ae.type === 'blackhole' || ae.type === 'storm_zone' || ae.type === 'epicenter' || ae.type === 'puddle') &&
        Math.hypot(ae.x - e.x, ae.y - e.y) < ae.radius + 150
    );

    if (skillDetected && e.charge > 0 && (!e.lastBlink || timeS - e.lastBlink > 0.5)) {
        e.forceTeleport = true;
    }

    const { dist: wallDist } = getHexDistToWall(e.x, e.y);
    if (wallDist < 180) {
        const a = Math.random() * Math.PI * 2;
        const d = 500 + Math.random() * 200;
        const tx = nearestPlayer.x + Math.cos(a) * d;
        const ty = nearestPlayer.y + Math.sin(a) * d;
        if (isInMap(tx, ty) && getHexDistToWall(tx, ty).dist > 250) {
            const ox = e.x, oy = e.y;
            e.x = tx; e.y = ty;
            spawnParticles(state, ox, oy, ['#FACC15', '#FFFFFF'], 15);
            spawnParticles(state, e.x, e.y, ['#FACC15', '#FFFFFF'], 15);
            playSfx('smoke-puff');
        }
    }

    if (e.rarePhase === 0) {
        e.spd = player.speed * 1.1;
        if (e.spiralAngle === undefined) e.spiralAngle = Math.atan2(e.y - player.y, e.x - player.x);
        e.spiralAngle += 0.01 + Math.sin(timeS * 5) * 0.005;

        let tx = player.x + Math.cos(e.spiralAngle) * 1100;
        let ty = player.y + Math.sin(e.spiralAngle) * 1100;

        if (!isInMap(tx, ty) || getHexDistToWall(tx, ty).dist < 200) {
            for (let dist = 1000; dist >= 400; dist -= 100) {
                tx = player.x + Math.cos(e.spiralAngle) * dist;
                ty = player.y + Math.sin(e.spiralAngle) * dist;
                if (isInMap(tx, ty) && getHexDistToWall(tx, ty).dist > 200) break;
            }
        }

        const tdx = tx - e.x, tdy = ty - e.y, tdist = Math.hypot(tdx, tdy);
        if (tdist > 1) { vx = (tdx / tdist) * e.spd; vy = (tdy / tdist) * e.spd; }
        if (dToP < 550 || skillDetected) {
            e.rarePhase = 1;
            e.rareTimer = timeS;
            e.palette = ['#f97316', '#ea580c', '#c2410c'];
            playSfx('smoke-puff');
            spawnDecoys(state, e);
        }
    } else {
        e.spd = player.speed * 0.95;
        if (e.lockedTargetX === undefined || e.lockedTargetY === undefined || Math.hypot(e.x - e.lockedTargetX, e.y - e.lockedTargetY) < 50) {
            let foundValid = false;
            for (let i = 0; i < 25; i++) {
                const a = Math.random() * Math.PI * 2;
                const d = 600 + Math.random() * 400;
                const tx = player.x + Math.cos(a) * d;
                const ty = player.y + Math.sin(a) * d;
                if (isInMap(tx, ty) && getHexDistToWall(tx, ty).dist > 250) {
                    e.lockedTargetX = tx; e.lockedTargetY = ty;
                    foundValid = true; break;
                }
            }
            if (!foundValid) {
                const c = ARENA_CENTERS[0];
                e.lockedTargetX = c.x; e.lockedTargetY = c.y;
            }
        }

        const tdx = (e.lockedTargetX || 0) - e.x, tdy = (e.lockedTargetY || 0) - e.y, tdist = Math.hypot(tdx, tdy);
        if (tdist > 1) { vx = (tdx / tdist) * e.spd; vy = (tdy / tdist) * e.spd; }

        const shouldBlink = dToP < 320 && e.charge > 0 && (!e.lastBlink || timeS - e.lastBlink > 0.8);
        if (shouldBlink || e.forceTeleport) {
            const target = state.enemies.find(o => !o.dead && !o.boss && !o.legionId && o.shape !== 'snitch' && Math.hypot(o.x - player.x, o.y - player.y) > 700);
            if (target) {
                const ox = e.x, oy = e.y;
                e.x = target.x; e.y = target.y;
                target.x = ox; target.y = oy;
                spawnParticles(state, ox, oy, ['#F0F0F0', '#FACC15'], 20);
                spawnParticles(state, e.x, e.y, ['#F0F0F0', '#FACC15'], 20);
                playSfx('smoke-puff');
                e.charge--;
                e.lastBlink = timeS;
                e.lastLaunchTime = timeS;
                e.panicCooldown = timeS + 1.2;
                e.lockedTargetX = undefined;
                if (Math.random() < 0.4) spawnDecoys(state, e, ox, oy);
            } else {
                const escapeAngle = Math.atan2(e.y - nearestPlayer.y, e.x - nearestPlayer.x) + (Math.random() - 0.5);
                const tx = e.x + Math.cos(escapeAngle) * 450;
                const ty = e.y + Math.sin(escapeAngle) * 450;
                if (isInMap(tx, ty)) {
                    const ox = e.x, oy = e.y;
                    e.x = tx; e.y = ty;
                    e.charge--;
                    e.lastBlink = timeS;
                    e.lastLaunchTime = timeS;
                    spawnParticles(state, ox, oy, ['#FACC15', '#fb923c'], 15);
                    playSfx('smoke-puff');
                    if (Math.random() < 0.3) spawnDecoys(state, e, ox, oy);
                }
            }
            e.forceTeleport = undefined;
        }
    }

    if (dToP < 220) {
        const ang = Math.atan2(e.y - nearestPlayer.y, e.x - nearestPlayer.x);
        vx = Math.cos(ang) * e.spd * 2.8; vy = Math.sin(ang) * e.spd * 2.8;
        e.lockedTargetX = undefined;
    }

    if (e.panicCooldown && timeS < e.panicCooldown) { vx *= 1.4; vy *= 1.4; }

    if (Math.random() < 0.1) {
        e.jitterX = (Math.random() - 0.5) * 12;
        e.jitterY = (Math.random() - 0.5) * 12;
    } else {
        e.jitterX = 0; e.jitterY = 0;
    }

    const others = state.spatialGrid.query(e.x, e.y, 100);
    for (const other of others) {
        if (other.id !== e.id && !other.dead && other.isElite && other.shape === 'square') {
            const dist = Math.hypot(other.x - e.x, other.y - e.y);
            if (dist < e.size + other.size) {
                e.palette = ['#4ade80', e.palette[1], e.palette[2]];
            }
        }
    }

    return { vx, vy };
}
