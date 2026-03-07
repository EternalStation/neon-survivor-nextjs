
import type { GameState } from '../core/types';
import { isInMap, ARENA_CENTERS, PORTALS, getHexWallLine, ARENA_RADIUS } from '../mission/MapLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { playSfx } from '../audio/AudioLogic';
import { getHexLevel } from '../upgrades/LegendaryLogic';
import { getCdMod } from '../utils/CooldownUtils';
import { spawnFloatingNumber, spawnParticles } from '../effects/ParticleLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';
import { recordDamage } from '../utils/DamageTracking';
import { applyDamageToPlayer } from '../utils/CombatUtils';
import { getKeybinds } from '../utils/Keybinds';

export function triggerDash(state: GameState, keys: Record<string, boolean>, inputVector?: { x: number, y: number }, overridePlayer?: any) {
    const player = overridePlayer || state.player;

    const isStunned = player.stunnedUntil && state.gameTime < player.stunnedUntil;
    if (isStunned) return;

    const dashCd = player.dashCooldown ?? 0;
    if (dashCd > 0) return;

    let vx = 0, vy = 0;

    const binds = getKeybinds();
    const useDefault = binds.useDefaultMovement ?? true;

    if (useDefault) {
        if (keys['keyw'] || keys['arrowup']) vy--;
        if (keys['keys'] || keys['arrowdown']) vy++;
        if (keys['keya'] || keys['arrowleft']) vx--;
        if (keys['keyd'] || keys['arrowright']) vx++;
    } else {
        if (keys[(binds.moveUp || '').toLowerCase()]) vy--;
        if (keys[(binds.moveDown || '').toLowerCase()]) vy++;
        if (keys[(binds.moveLeft || '').toLowerCase()]) vx--;
        if (keys[(binds.moveRight || '').toLowerCase()]) vx++;
    }

    if (inputVector) {
        vx += inputVector.x;
        vy += inputVector.y;
    }

    if (vx === 0 && vy === 0) {
        const angle = player.lastAngle || 0;
        vx = Math.cos(angle);
        vy = Math.sin(angle);
    }

    const mag = Math.hypot(vx, vy);
    const nx = vx / mag;
    const ny = vy / mag;

    const duration = GAME_CONFIG.DASH.DURATION;
    const framesPerSecond = 60;
    const totalFrames = duration * framesPerSecond;
    const speedPerFrame = GAME_CONFIG.DASH.DISTANCE / totalFrames;

    player.dashVx = nx * speedPerFrame;
    player.dashVy = ny * speedPerFrame;
    player.dashUntil = state.gameTime + duration;
    const dashCD = GAME_CONFIG.DASH.COOLDOWN * getCdMod(state, player);
    player.dashCooldown = dashCD;
    player.dashCooldownMax = dashCD;

    spawnParticles(state, player.x, player.y, '#22d3ee', 8, 3, 30, 'spark');
    playSfx('dash');
}

export function handlePlayerMovement(
    state: GameState,
    keys: Record<string, boolean>,
    inputVector?: { x: number, y: number },
    onEvent?: (type: string, data?: any) => void,
    overridePlayer?: any,
    triggerDeath?: () => void,
    triggerWallIncompetence?: () => void
) {
    const player = overridePlayer || state.player;

    if (player.dashCooldown && player.dashCooldown > 0) {
        player.dashCooldown -= 1 / 60;
        if (player.dashCooldown < 0) player.dashCooldown = 0;
    }

    const isDashing = player.dashUntil && state.gameTime < player.dashUntil;
    if (isDashing && player.dashVx !== undefined && player.dashVy !== undefined) {
        const nx = player.x + player.dashVx;
        const ny = player.y + player.dashVy;
        const hitboxR = GAME_CONFIG.PLAYER.HITBOX_RADIUS;
        let dashPosValid = isInMap(nx, ny) || isInActivePortal(nx, ny, state);
        if (dashPosValid) {
            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                if (!isInMap(nx + Math.cos(ang) * hitboxR, ny + Math.sin(ang) * hitboxR) &&
                    !isInActivePortal(nx + Math.cos(ang) * hitboxR, ny + Math.sin(ang) * hitboxR, state)) {
                    dashPosValid = false;
                    break;
                }
            }
        }
        if (dashPosValid) {
            player.x = nx;
            player.y = ny;
        } else {
            player.dashUntil = 0;
        }
        spawnParticles(state, player.x, player.y, '#0ea5e9', 2, 2, 15, 'spark');
        return;
    }

    let vx = 0, vy = 0;

    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    const isStunned = (player.stunnedUntil && state.gameTime < player.stunnedUntil);

    const isInverted = player.invertedControlsUntil && state.gameTime < player.invertedControlsUntil;

    if (!isStunned) {
        const binds = getKeybinds();
        const useDefault = binds.useDefaultMovement ?? true;

        if (useDefault) {
            if (keys['keyw'] || keys['arrowup']) vy--;
            if (keys['keys'] || keys['arrowdown']) vy++;
            if (keys['keya'] || keys['arrowleft']) vx--;
            if (keys['keyd'] || keys['arrowright']) vx++;
        } else {
            if (keys[(binds.moveUp || '').toLowerCase()]) vy--;
            if (keys[(binds.moveDown || '').toLowerCase()]) vy++;
            if (keys[(binds.moveLeft || '').toLowerCase()]) vx--;
            if (keys[(binds.moveRight || '').toLowerCase()]) vx++;
        }

        if (inputVector) {
            vx += inputVector.x;
            vy += inputVector.y;
        }

        if (isInverted) {
            vx = -vx;
            vy = -vy;
        }
    }

    if (vx !== 0 || vy !== 0) {
        const mag = Math.hypot(vx, vy);
        const spd = player.speed * (state.gameSpeedMult ?? 1);
        const dx = (vx / mag) * spd;
        const dy = (vy / mag) * spd;

        player.lastAngle = Math.atan2(dy, dx);
        const nextX = player.x + dx;
        const nextY = player.y + dy;


        const hitboxR = GAME_CONFIG.PLAYER.HITBOX_RADIUS;

        const checkMove = (tx: number, ty: number) => {
            const valid = isInMap(tx, ty) || isInActivePortal(tx, ty, state);
            if (!valid) return false;

            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                const hx = tx + Math.cos(ang) * hitboxR;
                const hy = ty + Math.sin(ang) * hitboxR;

                if (!isInMap(hx, hy) && !isInActivePortal(hx, hy, state)) return false;
            }
            return true;
        };

        if (checkMove(nextX, nextY)) {
            player.x = nextX;
            player.y = nextY;
        } else {
            if (player.lastWallHitTime && state.gameTime - player.lastWallHitTime < 0.5) return;
            player.lastWallHitTime = state.gameTime;

            let bestC = ARENA_CENTERS[0];
            let dMin = Infinity;
            ARENA_CENTERS.forEach((c) => {
                const d = Math.hypot(player.x - c.x, player.y - c.y);
                if (d < dMin) {
                    dMin = d;
                    bestC = c;
                }
            });

            const lx = player.x - bestC.x;
            const ly = player.y - bestC.y;
            let normAngle = Math.atan2(ly, lx);
            if (normAngle < 0) normAngle += Math.PI * 2;

            const sector = Math.floor(normAngle / (Math.PI / 3));
            const collisionNormalAngle = (sector * 60 + 30) * Math.PI / 180;
            const nx = Math.cos(collisionNormalAngle);
            const ny = Math.sin(collisionNormalAngle);

            const dot = dx * nx + dy * ny;
            const rx = dx - 2 * dot * nx;
            const ry = dy - 2 * dot * ny;
            const reflectDir = Math.atan2(ry, rx);

            const wallBounceSpd = GAME_CONFIG.PLAYER.WALL_BOUNCE_SPEED * (state.gameSpeedMult ?? 1);
            player.knockback.x = Math.cos(reflectDir) * wallBounceSpd;
            player.knockback.y = Math.sin(reflectDir) * wallBounceSpd;
            player.wallsHit++;
            triggerWallIncompetence?.();

            const impactRange = 360;
            const maxHp = calcStat(player.hp);
            let wallDmgMult = GAME_CONFIG.PLAYER.WALL_DAMAGE_PERCENT;
            const isEscalated = !!(player.tripleWallDamageUntil && state.gameTime < player.tripleWallDamageUntil);

            if (isEscalated) {
                wallDmgMult *= 3.0;
            }

            const rawWallDmg = maxHp * wallDmgMult;
            const finalImpactDmg = rawWallDmg;

            const startA = collisionNormalAngle + Math.PI / 2;
            const endA = collisionNormalAngle + Math.PI * 1.5;

            spawnParticles(state, player.x, player.y, isEscalated ? '#ef4444' : '#22d3ee', 12, 5, 40, 'shockwave', startA, endA);
            spawnParticles(state, player.x, player.y, isEscalated ? '#ef4444' : '#22d3ee', 1, impactRange, 25, 'shockwave_circle', startA, endA);

            state.enemies.forEach(enemy => {
                if (enemy.dead) return;
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distSq = dx * dx + dy * dy;
                const actualRange = impactRange + enemy.size;
                if (distSq < actualRange * actualRange) {
                    enemy.hp -= finalImpactDmg;
                    state.player.damageDealt += finalImpactDmg;
                    recordDamage(state, 'Wall Shockwave', finalImpactDmg, enemy);
                    spawnFloatingNumber(state, enemy.x, enemy.y, Math.floor(finalImpactDmg).toString(), isEscalated ? '#ef4444' : '#fff');
                    spawnParticles(state, enemy.x, enemy.y, isEscalated ? '#ef4444' : '#eee', 4, 2, 20, 'spark');
                }
            });

            applyDamageToPlayer(state, player, rawWallDmg, {
                sourceType: 'collision',
                onEvent,
                triggerDeath,
                deathCause: 'Wall Impact'
            });

            const kinLvl = getHexLevel(state, 'KineticBattery');
            if (kinLvl >= 1) {
                const trigger = (state as any).triggerKineticBatteryZap;
                if (trigger) trigger(state, player, kinLvl);
            }

            if (player.curHp <= 0) {
                if (isBuffActive(state, 'TEMPORAL_GUARD')) {
                    player.curHp = calcStat(player.hp);

                    let foundSafe = false;
                    let safeX = player.x;
                    let safeY = player.y;
                    let attempts = 0;
                    while (!foundSafe && attempts < 20) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 2500 + Math.random() * 1500;
                        const cx = player.x + Math.cos(angle) * dist;
                        const cy = player.y + Math.sin(angle) * dist;
                        if (isInMap(cx, cy)) {
                            safeX = cx;
                            safeY = cy;
                            foundSafe = true;
                        }
                        attempts++;
                    }
                    if (!foundSafe) {
                        const center = ARENA_CENTERS.find(c => c.id === state.currentArena) || ARENA_CENTERS[0];
                        safeX = center.x;
                        safeY = center.y;
                    }

                    player.x = safeX;
                    player.y = safeY;
                    state.activeBlueprintBuffs.TEMPORAL_GUARD = 0;
                    player.temporalGuardActive = false;

                    const now = state.gameTime;
                    player.invincibleUntil = now + 1.5;
                    player.phaseShiftUntil = now + 1.5;

                    spawnFloatingNumber(state, player.x, player.y, "TEMPORAL GUARD ACTIVATED", '#60a5fa', true);
                    playSfx('rare-spawn');
                } else {
                    state.gameOver = true;
                    player.deathCause = 'Wall Impact';
                    if (onEvent) onEvent('game_over');
                    triggerDeath?.();
                }
            }
        }
    }

    if (Math.abs(player.knockback.x) > 0.1 || Math.abs(player.knockback.y) > 0.1) {
        const nx = player.x + player.knockback.x;
        const ny = player.y + player.knockback.y;
        if (isInMap(nx, ny)) {
            player.x = nx;
            player.y = ny;
        }
        player.knockback.x *= GAME_CONFIG.PLAYER.KNOCKBACK_DECAY;
        player.knockback.y *= GAME_CONFIG.PLAYER.KNOCKBACK_DECAY;
    } else {
        player.knockback.x = 0;
        player.knockback.y = 0;
    }
}

export function isInActivePortal(x: number, y: number, state: GameState): boolean {
    if (state.portalState !== 'open') return false;

    const activePortals = PORTALS.filter(p => p.from === state.currentArena);
    const center = ARENA_CENTERS.find(c => c.id === state.currentArena) || ARENA_CENTERS[0];

    for (const p of activePortals) {
        const wall = getHexWallLine(center.x, center.y, ARENA_RADIUS, p.wall);

        const A = x - wall.x1;
        const B = y - wall.y1;
        const C = wall.x2 - wall.x1;
        const D = wall.y2 - wall.y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = wall.x1;
            yy = wall.y1;
        }
        else if (param > 1) {
            xx = wall.x2;
            yy = wall.y2;
        }
        else {
            xx = wall.x1 + param * C;
            yy = wall.y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) return true;
    }

    return false;
}

