import type { GameState, Enemy } from '../types';
import { ARENA_CENTERS, isInMap } from '../MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../ParticleLogic';
import { playSfx } from '../AudioLogic';
import { handleEnemyDeath } from '../DeathLogic';

export function spawnMinion(state: GameState, parent: Enemy, isElite: boolean, count: number) {
    for (let i = 0; i < count; i++) {
        const offsetAngle = (Math.PI * 2 / count) * i;
        const dist = 60;
        const mx = parent.x + Math.cos(offsetAngle) * dist;
        const my = parent.y + Math.sin(offsetAngle) * dist;

        const minion: Enemy = {
            id: Math.random(),
            type: 'minion', // Type identifier
            shape: 'minion', // Logic identifier
            x: mx, y: my,
            size: 15,
            hp: Math.ceil(isElite ? parent.maxHp * 0.15 : parent.maxHp * 0.15),
            maxHp: Math.ceil(isElite ? parent.maxHp * 0.15 : parent.maxHp * 0.15),
            spd: parent.spd * 1.4,
            boss: false,
            bossType: 0,
            bossAttackPattern: 0,
            lastAttack: 0,
            dead: false,
            shellStage: 0,
            palette: (parent.originalPalette || parent.palette), // Always inherit parent colors (Era/Stable)
            pulsePhase: 0,
            rotationPhase: 0,
            parentId: parent.id,
            minionState: 0, // 0 = Orbiting/Spawning, 1 = Chasing
            spawnedAt: state.gameTime,
            stunOnHit: isElite, // Still keep the Stun mechanic if it's an Elite spawn
            vx: 0, vy: 0,
            knockback: { x: 0, y: 0 },
            isRare: false,
            isElite: false
        } as any;

        state.enemies.push(minion);
        spawnParticles(state, mx, my, '#FFFFFF', 5);
    }
}

export function updateMinion(e: Enemy, state: GameState, player: any, dx: number, dy: number, vx: number, vy: number) {
    const m = state.enemies.find(p => p.id === e.parentId);
    if (!m || m.dead) e.minionState = 1;

    // Launch Trigger: Player gets too close to Mother (Guard Mode)
    if (e.minionState === 0 && m) {
        const distToMother = Math.hypot(player.x - m.x, player.y - m.y);
        if (distToMother < 350) { // Removed m.isElite auto-launch to ensure guarding behavior
            e.minionState = 1;
            playSfx('shoot');
        }
    }

    if (e.minionState === 0 && m) {
        const aM = Math.atan2(player.y - m.y, player.x - m.x);
        const group = state.enemies.filter(n => n.parentId === m.id && n.minionState === 0 && !n.dead);
        const idx = group.indexOf(e), row = Math.floor((idx + 1) / 2), side = (idx === 0) ? 0 : (idx % 2 === 1 ? -1 : 1);
        const lX = 180 - (row * 28), lY = side * (row * 32), cA = Math.cos(aM), sA = Math.sin(aM);
        const tx = m.x + (lX * cA - lY * sA), ty = m.y + (lX * sA + lY * cA);
        vx = (tx - e.x) * 0.15; vy = (ty - e.y) * 0.15;
        e.rotationPhase = Math.atan2(player.y - e.y, player.x - e.x);
    } else {
        const lT = state.gameTime - (e.spawnedAt || 0), tA = Math.atan2(dy, dx), cMA = Math.atan2(vy || dy, vx || dx);
        let diff = tA - cMA; while (diff < -Math.PI) diff += Math.PI * 2; while (diff > Math.PI) diff -= Math.PI * 2;
        const bA = cMA + diff * 0.08, sA = bA + Math.sin(lT * 8) * 0.4;
        vx = Math.cos(sA) * 6.0; vy = Math.sin(sA) * 6.0; e.rotationPhase = sA;
    }
    return { vx, vy };
}

export function updateSnitch(e: Enemy, state: GameState, player: any, timeS: number) {
    let vx = 0, vy = 0;
    const timeInP = state.gameTime - (e.rareTimer || e.spawnedAt || 0);
    if (timeInP > 30) {
        e.dead = true; state.rareSpawnActive = false;
        playSfx('rare-despawn'); return { vx: 0, vy: 0 };
    }
    const dToP = Math.hypot(player.x - e.x, player.y - e.y);
    if (e.rarePhase === 0) {
        const tSpd = player.speed * 0.8; e.spd = tSpd;
        if (e.spiralAngle === undefined) e.spiralAngle = Math.atan2(e.y - player.y, e.x - player.x);
        e.spiralAngle += 0.005;
        let tx = player.x + Math.cos(e.spiralAngle) * 1100, ty = player.y + Math.sin(e.spiralAngle) * 1100;
        if (!isInMap(tx, ty)) { tx -= (tx - player.x) * 0.2; ty -= (ty - player.y) * 0.2; }
        const tdx = tx - e.x, tdy = ty - e.y, tdist = Math.hypot(tdx, tdy);
        if (tdist > 1) { vx = (tdx / tdist) * e.spd; vy = (tdy / tdist) * e.spd; }
        if (dToP < 500) { e.rarePhase = 1; e.rareTimer = timeS; e.palette = ['#f97316', '#ea580c', '#c2410c']; playSfx('smoke-puff'); }
    } else {
        if (e.lockedTargetX === undefined || e.lockedTargetY === undefined || (Math.abs(e.x - e.lockedTargetX) < 50 && Math.abs(e.y - e.lockedTargetY) < 50)) {
            const a = Math.random() * Math.PI * 2, d = 500 + Math.random() * 300;
            let tx = player.x + Math.cos(a) * d, ty = player.y + Math.sin(a) * d;
            if (!isInMap(tx, ty)) { tx = ARENA_CENTERS[0].x; ty = ARENA_CENTERS[0].y; }
            e.lockedTargetX = tx; e.lockedTargetY = ty;
        }
        const tdx = (e.lockedTargetX || 0) - e.x, tdy = (e.lockedTargetY || 0) - e.y, tdist = Math.hypot(tdx, tdy);
        if (tdist > 1) { vx = (tdx / tdist) * e.spd; vy = (tdy / tdist) * e.spd; }
        if (dToP < 350 && (!e.tacticalTimer || timeS > e.tacticalTimer)) {
            const target = state.enemies.find(o => !o.dead && !o.boss && o.shape !== 'snitch' && Math.hypot(o.x - player.x, o.y - player.y) > dToP + 200);
            if (target) {
                const ox = e.x, oy = e.y; e.x = target.x; e.y = target.y; target.x = ox; target.y = oy;
                spawnParticles(state, ox, oy, ['#F0F0F0', '#808080'], 20);
                spawnParticles(state, e.x, e.y, ['#F0F0F0', '#808080'], 20);
                playSfx('smoke-puff'); e.tacticalTimer = timeS + 4.0; e.panicCooldown = timeS + 1.0;
            }
        }
    }
    if (dToP < 250) {
        const ang = Math.atan2(e.y - player.y, e.x - player.x);
        vx = Math.cos(ang) * e.spd * 2; vy = Math.sin(ang) * e.spd * 2;
        e.lockedTargetX = undefined;
    }
    if (e.panicCooldown && timeS < e.panicCooldown) { vx *= 2; vy *= 2; }

    // Snitch moves are handled by return
    // Check for collision with Elite Squares to turn Green
    const others = state.spatialGrid.query(e.x, e.y, e.size + 100);
    for (const other of others) {
        if (other.id !== e.id && !other.dead && other.isElite && other.shape === 'square') {
            const dist = Math.hypot(other.x - e.x, other.y - e.y);
            if (dist < e.size + other.size) {
                // Change center color to green
                e.palette = ['#4ade80', e.palette[1], e.palette[2]];
            }
        }
    }

    return { vx, vy };
}

export function updateZombie(e: Enemy, state: GameState, step: number, onEvent?: (event: string, data?: any) => void) {
    const now = state.gameTime * 1000;
    const player = state.player;

    if (e.zombieHearts === undefined) e.zombieHearts = 3;

    // --- RISING STATE ---
    if (e.zombieState === 'dead') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'rising';
            e.zombieTimer = now + 1500;
            playSfx('zombie-rise');
        }
        return;
    }

    if (e.zombieState === 'rising') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'active';
            e.zombieHearts = 3; // Reset hearts on rise
            e.invincibleUntil = now + 500; // Brief invulnerability
        }
        return;
    }

    // --- HELPER: DAMAGE LOGIC ---
    const takeZombieDamage = (amount: number = 1) => {
        if (e.invincibleUntil && now < e.invincibleUntil) return;

        e.zombieHearts = (e.zombieHearts || 3) - amount;
        e.invincibleUntil = now + 1000; // 1s Invulnerability after hit

        spawnParticles(state, e.x, e.y, '#ef4444', 10);
        // spawnFloatingNumber(state, e.x, e.y, `-${amount} HEART`, '#ef4444', true); // Removed per user request
        playSfx('impact');

        if (e.zombieHearts <= 0) {
            e.dead = true;
            e.hp = 0;
            spawnParticles(state, e.x, e.y, '#4ade80', 15);
            playSfx('rare-kill');
        }
    };

    // --- CLINGING (EATING) STATE ---
    if (e.zombieState === 'clinging') {
        const target = state.enemies.find(t => t.id === e.zombieTargetId);

        // 1. Target Lost Check
        if (!target || target.dead) {
            e.zombieState = 'active';
            e.zombieTargetId = undefined;
            e.timer = undefined;
            return;
        }

        // 2. Stick to Target
        e.x = target.x;
        e.y = target.y;
        e.vx = 0;
        e.vy = 0;

        // 3. Disable Target (Unless Boss)
        if (!target.boss) {
            target.frozen = 1.0; // Freeze for this frame + buffer
            target.vx = 0;
            target.vy = 0;
        }

        // 4. Boss Damage Over Time (2% per second)
        if (target.boss) {
            if ((state.frameCount % 60) === 0) { // Approx every second
                const dmg = target.maxHp * 0.02;
                target.hp -= dmg;
                spawnFloatingNumber(state, target.x, target.y, Math.round(dmg).toString(), '#4ade80', true);
                spawnParticles(state, target.x, target.y, '#4ade80', 5);

                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
            }
        }

        // 5. Check Interruption (Collision with OTHER enemies)
        // Zombie is at target.x/y. Check if any *other* enemy is touching it.
        // We exclude the target we are eating.
        // And we exclude Friendly/Other Zombies to prevent friendly fire chaos unless desired? 
        // Prompt: "other enemy touched him". Usually implies hostiles.
        const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);
        for (const other of nearby) {
            if (other.id !== e.id && other.id !== target.id && !other.dead && !other.isFriendly && !other.isZombie) {
                const d = Math.hypot(other.x - e.x, other.y - e.y);
                if (d < e.size + other.size) {
                    takeZombieDamage(1);
                    if (e.dead) return; // Stop if died
                }
            }
        }

        // 6. Completion Logic
        if (now >= (e.timer || 0)) {
            if (target.boss) {
                // Boss: Finish eating (5s passed). Zombie dies (spent).
                takeZombieDamage(3);
            } else if (target.isElite) {
                // Elite: Consume (5s passed). Kill Target. Zombie Dies (Cost 3).
                target.hp = 0;
                handleEnemyDeath(state, target, onEvent);
                takeZombieDamage(3);
            } else {
                // Normal: Eat (3s passed). Kill Target. Zombie Loses 1 Heart.
                target.hp = 0;
                handleEnemyDeath(state, target, onEvent);
                playSfx('rare-kill'); // Crunch sound
                spawnParticles(state, target.x, target.y, '#ef4444', 20); // Blood/Parts

                takeZombieDamage(1);

                if (!e.dead) {
                    // Reset to hunt again if still alive
                    e.zombieState = 'active';
                    e.zombieTargetId = undefined;
                    e.timer = undefined;
                    e.invincibleUntil = now + 1000; // Brief I-frame after meal
                }
            }
        }
        return;
    }

    // --- ACTIVE STATE (HUNTING) ---

    // 1. Find NEAREST enemy
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    state.enemies.forEach(other => {
        if (other.dead || other.isZombie || other.isFriendly) return; // Target Bosses too!
        const d = Math.hypot(other.x - e.x, other.y - e.y);
        if (d < minDist) {
            minDist = d;
            nearest = other;
        }
    });

    if (nearest) {
        const target: Enemy = nearest;
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const angle = Math.atan2(dy, dx);

        let spd = 1.92 * 1.5; // Base Speed
        // Frenzy if near player (Legacy logic kept for flavor)
        if (state.enemies.some(o => !o.dead && !o.isZombie && Math.hypot(o.x - player.x, o.y - player.y) < 300)) {
            spd *= 2.0;
        }

        e.vx = (e.vx || 0) * 0.8 + Math.cos(angle) * spd * 0.2 * 60;
        e.vy = (e.vy || 0) * 0.8 + Math.sin(angle) * spd * 0.2 * 60;
        e.x += (e.vx || 0) * step;
        e.y += (e.vy || 0) * step;

        // Collision Checks
        const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);

        for (const other of nearby) {
            if (other.dead || other.id === e.id || other.isZombie || other.isFriendly) continue;

            const d = Math.hypot(other.x - e.x, other.y - e.y);
            if (d < e.size + other.size) {
                // Is this our intended target? Or just "Nearest"?
                // Actually, if we collide with ANY enemy, we should probably try to eat it (if active).
                // Prioritize the one we were chasing, but if we bump into another, free meal?
                // But prompt says: "if during running to an closeset enemy he somehow receives colides ith other enemy he looses his 1 life"
                // This implies he ONLY wants to eat the "closest" one (Target), and others are obstacles.

                if (other.id === target.id) {
                    // START EATING
                    e.zombieState = 'clinging';
                    e.zombieTargetId = target.id;

                    // Set Timer based on type
                    const eatDuration = (target.boss || target.isElite) ? 5000 : 3000;
                    e.timer = now + eatDuration;

                    playSfx('zombie-rise'); // Grunt/Attack sound
                    return; // Stop processing active state
                } else {
                    // Collision with OBSTACLE
                    takeZombieDamage(1);

                    // Bounce off
                    const pushAngle = Math.atan2(e.y - other.y, e.x - other.x);
                    e.x += Math.cos(pushAngle) * 30;
                    e.y += Math.sin(pushAngle) * 30;
                    e.vx = 0; e.vy = 0;

                    if (e.dead) return;
                }
            }
        }
    }
}
