
import type { GameState } from '../core/types';
import { isInMap, ARENA_CENTERS, PORTALS, getHexWallLine, ARENA_RADIUS } from '../mission/MapLogic';
import { GAME_CONFIG } from '../core/GameConfig';
import { calcStat, getDefenseReduction } from '../utils/MathUtils';
import { playSfx } from '../audio/AudioLogic';
import { getHexLevel } from '../upgrades/LegendaryLogic';
import { spawnFloatingNumber } from '../effects/ParticleLogic';
import { isBuffActive } from '../upgrades/BlueprintLogic';

export function handlePlayerMovement(
    state: GameState,
    keys: Record<string, boolean>,
    inputVector?: { x: number, y: number },
    onEvent?: (type: string, data?: any) => void
) {
    const { player } = state;

    // Movement
    let vx = 0, vy = 0;

    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    const isStunned = (player.stunnedUntil && state.gameTime < player.stunnedUntil) && !(chronoLvl >= 1); // Chrono Lvl 1: Cannot be Stunned

    // Movement Cancel Logic for Channeling (Epicenter)
    if (player.immobilized && !isStunned) {
        let tryingToMove = false;
        if (keys['keyw'] || keys['arrowup']) tryingToMove = true;
        if (keys['keys'] || keys['arrowdown']) tryingToMove = true;
        if (keys['keya'] || keys['arrowleft']) tryingToMove = true;
        if (keys['keyd'] || keys['arrowright']) tryingToMove = true;
        if (inputVector && (Math.abs(inputVector.x) > 0.1 || Math.abs(inputVector.y) > 0.1)) tryingToMove = true;

        if (tryingToMove) {
            player.immobilized = false;
            // Find and remove the epicenter area effect
            const epiIdx = state.areaEffects.findIndex(ae => ae.type === 'epicenter');
            if (epiIdx !== -1) {
                state.areaEffects.splice(epiIdx, 1);
            }
            // Clear shield if any
            if (player.buffs) player.buffs.epicenterShield = 0;

            // Skill icon inactive
            const skill = player.activeSkills.find(s => s.type === 'DefEpi');
            if (skill) skill.inUse = false;
        }
    }

    const isInverted = player.invertedControlsUntil && state.gameTime < player.invertedControlsUntil;

    if (!isStunned && !player.immobilized) {
        if (keys['keyw'] || keys['arrowup']) vy--;
        if (keys['keys'] || keys['arrowdown']) vy++;
        if (keys['keya'] || keys['arrowleft']) vx--;
        if (keys['keyd'] || keys['arrowright']) vx++;

        // Add Joystick Input
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
        // Normalize
        const mag = Math.hypot(vx, vy);
        const dx = (vx / mag) * player.speed;
        const dy = (vy / mag) * player.speed;

        player.lastAngle = Math.atan2(dy, dx);
        const nextX = player.x + dx;
        const nextY = player.y + dy;

        // Hitbox radius
        const hitboxR = GAME_CONFIG.PLAYER.HITBOX_RADIUS;

        const checkMove = (tx: number, ty: number) => {
            // Check if point is inside map OR inside an active portal
            const valid = isInMap(tx, ty) || isInActivePortal(tx, ty, state);
            if (!valid) return false;

            // Check hitbox points
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
            // Mirror Reflection Logic
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

            player.knockback.x = Math.cos(reflectDir) * GAME_CONFIG.PLAYER.WALL_BOUNCE_SPEED;
            player.knockback.y = Math.sin(reflectDir) * GAME_CONFIG.PLAYER.WALL_BOUNCE_SPEED;
            player.wallsHit++;

            const maxHp = calcStat(player.hp);
            const rawWallDmg = maxHp * GAME_CONFIG.PLAYER.WALL_DAMAGE_PERCENT;
            const armor = calcStat(player.arm);
            const drCap = chronoLvl >= 1 ? 0.97 : 0.95; // Chrono Lvl 1: 97% DR Cap
            const armRedMult = 1 - getDefenseReduction(armor, drCap);
            let wallDmgAfterArmor = rawWallDmg * armRedMult;

            player.damageBlockedByArmor += (rawWallDmg - wallDmgAfterArmor);
            player.damageBlocked += (rawWallDmg - wallDmgAfterArmor);

            let wallDmg = wallDmgAfterArmor;

            // Kinetic Battery: Trigger Zap on Wall Hit (Calling from state potentially or re-importing)
            const kinLvl = getHexLevel(state, 'KineticBattery');
            if (kinLvl >= 1) {
                // We'll call the trigger function if it's available on state or via import
                const trigger = (state as any).triggerKineticBatteryZap;
                if (trigger) trigger(state, player, kinLvl);
            }

            // Check Shield Chunks
            let absorbed = 0;
            if (player.shieldChunks && player.shieldChunks.length > 0) {
                let rem = wallDmg;
                for (const chunk of player.shieldChunks) {
                    if (chunk.amount >= rem) {
                        chunk.amount -= rem;
                        absorbed += rem;
                        rem = 0; break;
                    } else {
                        absorbed += chunk.amount;
                        rem -= chunk.amount;
                        chunk.amount = 0;
                    }
                }
                player.shieldChunks = player.shieldChunks.filter(c => c.amount > 0);
                player.damageBlockedByShield += absorbed;
                player.damageBlocked += absorbed;
            }

            let finalWallDmg = wallDmg - absorbed;

            if (wallDmg > 0) {
                if (finalWallDmg > 0) {
                    player.curHp -= finalWallDmg;
                    player.damageTaken += finalWallDmg;
                }
                spawnFloatingNumber(state, player.x, player.y, Math.round(wallDmg).toString(), '#ef4444', false);
            }

            if (onEvent) onEvent('player_hit', { dmg: wallDmg });

            if (player.curHp <= 0) {
                // Blueprint: Temporal Guard (Lethal Hit Block)
                if (isBuffActive(state, 'TEMPORAL_GUARD')) {
                    player.curHp = calcStat(player.hp);

                    // Teleport to random safe location
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
                    state.activeBlueprintBuffs.TEMPORAL_GUARD = 0; // Consume
                    player.temporalGuardActive = false;

                    const now = state.gameTime;
                    player.invincibleUntil = now + 1.5;
                    player.phaseShiftUntil = now + 1.5;

                    spawnFloatingNumber(state, player.x, player.y, "TEMPORAL GUARD ACTIVATED", '#60a5fa', true);
                    playSfx('rare-spawn');
                } else {
                    state.gameOver = true;
                    player.deathCause = 'Died from Wall Impact';
                    if (onEvent) onEvent('game_over');
                }
            }
        }
    }

    // Apply & Decay Knockback Momentum
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
