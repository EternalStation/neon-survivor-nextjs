import type { GameState, Enemy } from '../core/Types';
import { ARENA_CENTERS, isInMap, getHexDistToWall } from '../mission/MapLogic';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { getHexLevel } from '../upgrades/LegendaryLogic';
import { triggerZombieZap } from '../player/PlayerCombat';
import { recordDamage } from '../utils/DamageTracking';

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

export function updateMinion(e: Enemy, state: GameState, player: any, dx: number, dy: number, vx: number, vy: number) {
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
        let tx = nearestPlayer.x + Math.cos(a) * d;
        let ty = nearestPlayer.y + Math.sin(a) * d;
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
                let tx = player.x + Math.cos(a) * d;
                let ty = player.y + Math.sin(a) * d;
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

        const shouldBlink = (dToP < 320 && e.charge > 0 && (!e.lastBlink || timeS - e.lastBlink > 0.8));
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


export function updateZombie(e: Enemy, state: GameState, step: number, onEvent?: (event: string, data?: any) => void) {
    const now = state.gameTime * 1000;
    const player = state.player;

    if (e.zombieHearts === undefined) e.zombieHearts = 3;


    if (e.zombieState === 'dead') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'rising';
            e.zombieTimer = now + 1500;

        }
        return;
    }

    if (e.zombieState === 'rising') {
        if (now >= (e.zombieTimer || 0)) {
            e.zombieState = 'active';
            e.zombieHearts = 3;
            e.invincibleUntil = now + 500;
        }
        return;
    }


    const takeZombieDamage = (amount: number = 1) => {
        if (e.invincibleUntil && now < e.invincibleUntil) return;

        e.zombieHearts = (e.zombieHearts || 3) - amount;
        e.invincibleUntil = now + 1000;

        spawnParticles(state, e.x, e.y, '#ef4444', 10);

        playSfx('impact');

        if (e.zombieHearts <= 0) {
            if (e.zombieTargetId) {
                const t = state.enemies.find(o => o.id === e.zombieTargetId);
                if (t) t.beingConsumedBy = undefined;
            }
            e.dead = true;
            e.hp = 0;
            spawnParticles(state, e.x, e.y, '#4ade80', 15);
            playSfx('rare-kill');
        }
    };


    if (e.zombieState === 'clinging') {
        const target = state.enemies.find(t => t.id === e.zombieTargetId);


        if (!target || target.dead) {
            if (target) target.beingConsumedBy = undefined;
            e.zombieState = 'active';
            e.zombieTargetId = undefined;
            e.timer = undefined;
            return;
        }


        e.x = target.x;
        e.y = target.y;
        e.vx = 0;
        e.vy = 0;


        if (!target.boss) {
            target.frozen = 1.0;
            target.vx = 0;
            target.vy = 0;
        }


        if (target.boss || target.legionId) {
            if ((state.frameCount % 60) === 0) {
                const dmg = target.boss ? target.maxHp * 0.05 : target.maxHp * 0.1;
                let appliedDmg = dmg;

                if (target.legionId) {
                    const lead = state.legionLeads?.[target.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                        const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                        lead.legionShield = (lead.legionShield || 0) - shieldHit;
                        appliedDmg -= shieldHit;
                        spawnParticles(state, target.x, target.y, '#60a5fa', 2);
                    }
                }

                if (appliedDmg > 0) {
                    target.hp -= appliedDmg;
                    player.damageDealt += appliedDmg;
                    recordDamage(state, 'Crimson Feast (LVL 4)', appliedDmg);
                    if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);
                }

                spawnFloatingNumber(state, target.x, target.y, Math.round(dmg).toString(), '#4ade80', true);
                spawnParticles(state, target.x, target.y, '#4ade80', 5);

                takeZombieDamage(1);
            }
        }

        const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);
        for (const other of nearby) {
            if (other.id !== e.id && other.id !== target.id && !other.dead && !other.isFriendly && !other.isZombie) {
                const d = Math.hypot(other.x - e.x, other.y - e.y);
                if (d < e.size + other.size) {
                    takeZombieDamage(1);
                    if (e.dead) return;
                }
            }
        }

        if (now >= (e.timer || 0)) {
            if (target.boss) {
                const consumedDmg = target.maxHp * 0.20;
                target.hp -= consumedDmg;
                player.damageDealt += consumedDmg;
                recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);

                if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);

                takeZombieDamage(3);

                playSfx('zombie-consume');
                spawnParticles(state, target.x, target.y, '#ef4444', 30);

                const bloodLvl = getHexLevel(state, 'ComLife');
                const devLvl = getHexLevel(state, 'ChronoDevourer');
                if (bloodLvl >= 5 || devLvl >= 5) {
                    spawnFloatingNumber(state, target.x, target.y, "Successfully consumed it", '#4ade80', true, undefined, 10);
                    if (Math.random() < 0.10) {
                        triggerZombieZap(state, state.player, e);
                    }
                }

                if (devLvl >= 5) {
                    const reduction = 0.03;
                    if (player.activeSkills) {
                        player.activeSkills.forEach(s => { if (s && s.lastUsed !== undefined) s.lastUsed -= reduction; });
                    }
                    if (player.lastBlackholeUse !== undefined) player.lastBlackholeUse -= reduction;
                    if (player.lastHiveMotherSkill !== undefined) player.lastHiveMotherSkill -= reduction;
                    if (player.lastVortexActivation !== undefined) player.lastVortexActivation -= reduction;
                    if (player.sandboxCooldownStart !== undefined) player.sandboxCooldownStart -= reduction;
                    if (player.lastStormStrike !== undefined) player.lastStormStrike -= reduction;
                    if (player.stormCircleCooldownEnd !== undefined) player.stormCircleCooldownEnd -= reduction;
                    if (player.orbitalVortexCooldownEnd !== undefined) player.orbitalVortexCooldownEnd -= reduction;
                    if (player.lastKineticShockwave !== undefined) player.lastKineticShockwave -= reduction;
                    if (player.dashCooldown !== undefined) player.dashCooldown -= reduction;
                    if (player.lastDeathMark !== undefined) player.lastDeathMark -= reduction;
                }
            } else if (target.isElite) {
                const consumedDmg = target.maxHp;
                target.hp = 0;
                player.damageDealt += consumedDmg;
                recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);
                handleEnemyDeath(state, target, onEvent);

                playSfx('zombie-consume');
                spawnParticles(state, target.x, target.y, '#ef4444', 25);

                const bloodLvl = getHexLevel(state, 'ComLife');
                const devLvl = getHexLevel(state, 'ChronoDevourer');
                if (bloodLvl >= 5 || devLvl >= 5) {
                    spawnFloatingNumber(state, target.x, target.y, "Successfully consumed it", '#4ade80', true, undefined, 10);
                    if (Math.random() < 0.10) {
                        triggerZombieZap(state, state.player, e);
                    }
                }

                if (devLvl >= 5) {
                    const reduction = 0.03;
                    if (player.activeSkills) {
                        player.activeSkills.forEach(s => { if (s && s.lastUsed !== undefined) s.lastUsed -= reduction; });
                    }
                    if (player.lastBlackholeUse !== undefined) player.lastBlackholeUse -= reduction;
                    if (player.lastHiveMotherSkill !== undefined) player.lastHiveMotherSkill -= reduction;
                    if (player.lastVortexActivation !== undefined) player.lastVortexActivation -= reduction;
                    if (player.sandboxCooldownStart !== undefined) player.sandboxCooldownStart -= reduction;
                    if (player.lastStormStrike !== undefined) player.lastStormStrike -= reduction;
                    if (player.stormCircleCooldownEnd !== undefined) player.stormCircleCooldownEnd -= reduction;
                    if (player.orbitalVortexCooldownEnd !== undefined) player.orbitalVortexCooldownEnd -= reduction;
                    if (player.lastKineticShockwave !== undefined) player.lastKineticShockwave -= reduction;
                    if (player.dashCooldown !== undefined) player.dashCooldown -= reduction;
                    if (player.lastDeathMark !== undefined) player.lastDeathMark -= reduction;
                }

                takeZombieDamage(3);
            } else {

                let canKill = true;
                if (target.legionId) {
                    const lead = state.legionLeads?.[target.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {

                        lead.legionShield = Math.max(0, (lead.legionShield || 0) - (target.maxHp * 0.5));
                        canKill = false;
                    }
                }

                if (canKill) {
                    const consumedDmg = target.maxHp;
                    target.hp = 0;
                    player.damageDealt += consumedDmg;
                    recordDamage(state, 'Crimson Feast (LVL 4)', consumedDmg);
                    handleEnemyDeath(state, target, onEvent);
                    playSfx('zombie-consume');
                    spawnParticles(state, target.x, target.y, '#ef4444', 20);

                    const bloodLvl = getHexLevel(state, 'ComLife');
                    const devLvl = getHexLevel(state, 'ChronoDevourer');
                    if (bloodLvl >= 5 || devLvl >= 5) {
                        spawnFloatingNumber(state, target.x, target.y, "Successfully consumed it", '#4ade80', true, undefined, 10);
                        if (Math.random() < 0.10) {
                            triggerZombieZap(state, state.player, e);
                        }
                    }

                    if (devLvl >= 5) {
                        const reduction = 0.03;
                        if (player.activeSkills) {
                            player.activeSkills.forEach(s => { if (s && s.lastUsed !== undefined) s.lastUsed -= reduction; });
                        }
                        if (player.lastBlackholeUse !== undefined) player.lastBlackholeUse -= reduction;
                        if (player.lastHiveMotherSkill !== undefined) player.lastHiveMotherSkill -= reduction;
                        if (player.lastVortexActivation !== undefined) player.lastVortexActivation -= reduction;
                        if (player.sandboxCooldownStart !== undefined) player.sandboxCooldownStart -= reduction;
                        if (player.lastStormStrike !== undefined) player.lastStormStrike -= reduction;
                        if (player.stormCircleCooldownEnd !== undefined) player.stormCircleCooldownEnd -= reduction;
                        if (player.orbitalVortexCooldownEnd !== undefined) player.orbitalVortexCooldownEnd -= reduction;
                        if (player.lastKineticShockwave !== undefined) player.lastKineticShockwave -= reduction;
                        if (player.dashCooldown !== undefined) player.dashCooldown -= reduction;
                        if (player.lastDeathMark !== undefined) player.lastDeathMark -= reduction;
                    }
                }

                takeZombieDamage(1);

                if (!e.dead) {
                    e.zombieState = 'active';
                    e.zombieTargetId = undefined;
                    target.beingConsumedBy = undefined;
                    e.timer = undefined;
                    e.invincibleUntil = now + 1000;
                }
            }
        }
        return;
    }




    let nearest: Enemy | null = null;
    let minDist = Infinity;

    state.enemies.forEach(other => {
        if (other.dead || other.isZombie || other.isFriendly || (other.beingConsumedBy !== undefined && other.beingConsumedBy !== e.id)) return;
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

        let spd = 10.0;

        const players = (state.players && Object.keys(state.players).length > 0) ? Object.values(state.players) : [state.player];
        let nearAnyPlayer = false;
        players.forEach(p => {
            if (state.enemies.some(o => !o.dead && !o.isZombie && Math.hypot(o.x - p.x, o.y - p.y) < 300)) {
                nearAnyPlayer = true;
            }
        });

        if (nearAnyPlayer) {
            spd *= 2.0;
        }

        e.vx = (e.vx || 0) * 0.8 + Math.cos(angle) * spd * 0.2 * 60;
        e.vy = (e.vy || 0) * 0.8 + Math.sin(angle) * spd * 0.2 * 60;
        e.x += (e.vx || 0) * step;
        e.y += (e.vy || 0) * step;


        const nearby = state.spatialGrid.query(e.x, e.y, e.size + 50);

        for (const other of nearby) {
            if (other.dead || other.id === e.id || other.isZombie || other.isFriendly) continue;

            const d = Math.hypot(other.x - e.x, other.y - e.y);
            if (d < e.size + other.size) {






                if (other.id === target.id) {

                    e.zombieState = 'clinging';
                    e.zombieTargetId = target.id;
                    target.beingConsumedBy = e.id;


                    const eatDuration = (target.boss || target.isElite) ? 5000 : 3000;
                    e.timer = now + eatDuration;

                    const devLvl = getHexLevel(state, 'ChronoDevourer');
                    if (devLvl >= 5 && Math.random() < 0.10) {
                        e.timer = now;
                    }


                    return;
                } else {

                    takeZombieDamage(1);


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

export function updatePrismGlitcher(e: Enemy, state: GameState, step: number) {
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
        let tx = nearestPlayer.x + Math.cos(angle) * dist;
        let ty = nearestPlayer.y + Math.sin(angle) * dist;

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
        console.log(`[GLITCHER] Spawned 3 Glitch Clouds: 1 on player, 2 nearby`);
        playSfx('smoke-puff');
    }


    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    let vx = 0, vy = 0;


    const idealDist = 400;
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
