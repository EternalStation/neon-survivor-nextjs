
import type { GameState, Enemy } from './types';
import { getPlayerThemeColor } from './helpers';
import { isInMap, ARENA_CENTERS, PORTALS, getHexWallLine, ARENA_RADIUS } from './MapLogic';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { GAME_CONFIG } from './GameConfig';
import { calcStat } from './MathUtils';
import { playSfx } from './AudioLogic';
import { calculateLegendaryBonus } from './LegendaryLogic';
import { handleEnemyDeath } from './DeathLogic';
import { spawnFloatingNumber } from './ParticleLogic';
import { getDefenseReduction } from './MathUtils';



export function updatePlayer(state: GameState, keys: Record<string, boolean>, onEvent?: (type: string, data?: any) => void, inputVector?: { x: number, y: number }, mouseOffset?: { x: number, y: number }) {
    const { player } = state;

    // Track player position history for laser prediction (last 60 frames = ~1 second at 60fps)
    if (!state.playerPosHistory) state.playerPosHistory = [];
    state.playerPosHistory.unshift({ x: player.x, y: player.y, timestamp: Date.now() });
    if (state.playerPosHistory.length > GAME_CONFIG.PLAYER.HISTORY_LENGTH) state.playerPosHistory.pop();

    // Spawn Animation Logic
    if (state.spawnTimer > 0) {
        state.spawnTimer -= 1 / 60;
        return;
    }

    // Movement
    let vx = 0, vy = 0;

    const isStunned = player.stunnedUntil && Date.now() < player.stunnedUntil;

    // Movement Cancel Logic for Channeling (Epicenter)
    if (player.immobilized && !isStunned) {
        let tryingToMove = false;
        if (keys['w'] || keys['keyw'] || keys['arrowup']) tryingToMove = true;
        if (keys['s'] || keys['keys'] || keys['arrowdown']) tryingToMove = true;
        if (keys['a'] || keys['keya'] || keys['arrowleft']) tryingToMove = true;
        if (keys['d'] || keys['keyd'] || keys['arrowright']) tryingToMove = true;
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

    if (!isStunned && !player.immobilized) {
        if (keys['w'] || keys['keyw'] || keys['arrowup']) vy--;
        if (keys['s'] || keys['keys'] || keys['arrowdown']) vy++;
        if (keys['a'] || keys['keya'] || keys['arrowleft']) vx--;
        if (keys['d'] || keys['keyd'] || keys['arrowright']) vx++;

        // Add Joystick Input
        if (inputVector) {
            vx += inputVector.x;
            vy += inputVector.y;
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
            const armRedMult = 1 - getDefenseReduction(armor);
            let wallDmgAfterArmor = rawWallDmg * armRedMult;

            player.damageBlockedByArmor += (rawWallDmg - wallDmgAfterArmor);
            player.damageBlocked += (rawWallDmg - wallDmgAfterArmor);

            let wallDmg = wallDmgAfterArmor;

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

            // --- CLASS CAPABILITIES (Legacy removed) ---

            if (wallDmg > 0) {
                if (finalWallDmg > 0) {
                    player.curHp -= finalWallDmg;
                    player.damageTaken += finalWallDmg;
                }
                spawnFloatingNumber(state, player.x, player.y, Math.round(wallDmg).toString(), '#ef4444', false);
            }

            if (onEvent) onEvent('player_hit', { dmg: wallDmg });

            if (player.curHp <= 0) {
                state.gameOver = true;
                player.deathCause = 'Wall Impact';
                if (onEvent) onEvent('game_over');
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

    // Camera Follow
    state.camera.x = player.x - CANVAS_WIDTH / 2;
    state.camera.y = player.y - CANVAS_HEIGHT / 2;

    // --- STAT UPDATE & SYNC ---
    // Calculate and assign Hex bonuses to player stats for this frame
    player.hp.hexFlat = calculateLegendaryBonus(state, 'hp_per_kill');
    player.hp.hexMult = calculateLegendaryBonus(state, 'hp_pct_per_kill');
    player.reg.hexFlat = calculateLegendaryBonus(state, 'reg_per_kill');
    player.reg.hexMult = calculateLegendaryBonus(state, 'reg_pct_per_kill');
    player.arm.hexFlat = calculateLegendaryBonus(state, 'arm_per_kill'); // Assuming arm hex exists? If not, 0 is fine.
    player.arm.hexMult = calculateLegendaryBonus(state, 'arm_pct_per_kill');
    player.dmg.hexFlat = calculateLegendaryBonus(state, 'dmg_per_kill');
    player.dmg.hexMult = calculateLegendaryBonus(state, 'dmg_pct_per_kill');
    player.atk.hexFlat = calculateLegendaryBonus(state, 'ats_per_kill');
    player.atk.hexMult = calculateLegendaryBonus(state, 'ats_pct_per_kill');

    // Regen
    let maxHp = calcStat(player.hp);
    let regenAmount = calcStat(player.reg) / 60;

    if (state.currentArena === 2) {
        maxHp *= 1.2; // +20% Max HP in Defence Hex
        regenAmount *= 1.2; // +20% Regen in Defence Hex
    }

    if (player.buffs?.puddleRegen) {
        maxHp *= 1.25; // +25% Max HP in Puddle (Lvl 3)
        regenAmount *= 1.25; // +25% Regen in Puddle (Lvl 3)
    }

    // Overclocker System Surge Buff decaying is handled in useGame loop usually, 
    // but we check for it in stat calcs if we modify them there.
    // Actually we'll modify PlayerLogic to apply surge bonuses here.
    if (player.buffs?.systemSurge && Date.now() < player.buffs.systemSurge.end) {
        const surge = player.buffs.systemSurge;
        player.atk.hexMult = (player.atk.hexMult || 0) + surge.atk;
        // Speed is multiplied directly in some places, but we can't easily mult it here without compounding.
        // We'll handle speed by adding to a temporary mult if we had one.
        // For now let's just use the current logic.
    }

    player.curHp = Math.min(maxHp, player.curHp + regenAmount);

    // Aiming Logic
    if (player.playerClass === 'malware' && mouseOffset) {
        // --- CLASS MODIFIER: Malware-Prime Mouse Aim (Screen Relative) ---
        player.targetAngle = Math.atan2(mouseOffset.y, mouseOffset.x);
        player.targetX = player.x + mouseOffset.x;
        player.targetY = player.y + mouseOffset.y;
    } else {
        // Auto-Aim Logic (skip barrels - they're neutral)
        let nearest: Enemy | null = null;
        let minDist = 800;
        state.enemies.forEach((e: Enemy) => {
            if (e.dead || e.isNeutral || e.isZombie) return; // Skip dead, neutral, and zombies
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });

        if (nearest !== null) {
            const actualNearest: Enemy = nearest;
            player.targetAngle = Math.atan2(actualNearest.y - player.y, actualNearest.x - player.x);
            player.targetX = actualNearest.x;
            player.targetY = actualNearest.y;
        } else {
            player.targetAngle = player.lastAngle;
        }
    }

    // --- ENEMY CONTACT DAMAGE & COLLISION ---
    state.enemies.forEach(e => {
        if (e.dead || e.hp <= 0 || e.isZombie || (e.legionId && !e.legionReady)) return;

        const dToE = Math.hypot(e.x - player.x, e.y - player.y);
        const contactDist = e.size + 18;

        if (dToE < contactDist) {
            // Check collision cooldown (prevent damage every frame)
            const now = Date.now();
            // Apply Contact Damage to Player
            // Default: 15% of enemy max HP, or custom if set. Neutral objects (barrels) deal 0 dmg.
            let rawDmg = 0;
            if (!e.isNeutral && !e.isAssembling) {
                // Check Soul Link Status
                const isLinked = e.soulLinkHostId !== undefined || (e.soulLinkTargets && e.soulLinkTargets.length > 0);

                if (isLinked) {
                    // LINKED COLLISION LOGIC
                    const linkColor = getPlayerThemeColor(state);
                    rawDmg = e.hp * 0.30;

                    let linkedTargets: Enemy[] = [];
                    if (e.soulLinkHostId) {
                        const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
                        if (host) {
                            linkedTargets.push(host);
                            if (host.soulLinkTargets) {
                                const peers = state.enemies.filter(p => host.soulLinkTargets!.includes(p.id) && !p.dead && p.id !== e.id);
                                linkedTargets.push(...peers);
                            }
                        }
                    } else if (e.soulLinkTargets && e.soulLinkTargets.length > 0) {
                        // Host logic handled if restricted correctly (mainly for minions)
                    }

                    if (linkedTargets.length > 0) {
                        // Distinct linked targets (remove dupes)
                        linkedTargets = Array.from(new Set(linkedTargets));

                        const dmgToDistribute = e.maxHp;
                        const splitDmg = dmgToDistribute / linkedTargets.length;

                        linkedTargets.forEach(target => {
                            target.hp -= splitDmg;
                            state.player.damageDealt += splitDmg;
                            spawnFloatingNumber(state, target.x, target.y, Math.round(splitDmg).toString(), linkColor, false);
                        });
                    }

                    // 3. Instant Death for the collider
                    if (!e.boss) {
                        e.hp = 0;
                    }

                } else if (e.shape === 'minion' && e.parentId !== undefined) {
                    const mother = state.enemies.find(m => m.id === e.parentId);
                    const ratio = e.stunOnHit ? GAME_CONFIG.ENEMY.MINION_STUN_DAMAGE_RATIO : GAME_CONFIG.ENEMY.MINION_DAMAGE_RATIO;
                    rawDmg = (mother ? mother.hp : e.hp) * ratio;
                } else if (e.customCollisionDmg !== undefined) {
                    // Scale custom damage by current health percentage if it was originally based on maxHp
                    rawDmg = (e.hp / e.maxHp) * e.customCollisionDmg;
                } else {
                    rawDmg = e.hp * GAME_CONFIG.ENEMY.CONTACT_DAMAGE_PERCENT;
                }
            }

            if (state.currentArena === 1 && !e.isNeutral) {
                rawDmg *= 1.15; // +15% Collision Damage in Combat Hex
            }

            const armorValue = calcStat(player.arm);
            const armRedMult = 1 - getDefenseReduction(armorValue);

            const colRedRaw = calculateLegendaryBonus(state, 'col_red_per_kill');
            const colRed = Math.min(80, colRedRaw); // Cap at 80% reduction
            const colRedMult = 1 - (colRed / 100);

            // Apply Armor Reduction then % Perk Reduction
            const dmgAfterArmor = rawDmg * armRedMult;
            const blockedByArmor = rawDmg - dmgAfterArmor;

            let reducedDmg = dmgAfterArmor * colRedMult;
            const blockedByCol = dmgAfterArmor - reducedDmg;

            player.damageBlockedByArmor += blockedByArmor;
            player.damageBlockedByCollisionReduc += blockedByCol;
            player.damageBlocked += (blockedByArmor + blockedByCol);

            // EPICENTER SHIELD: Invulnerability (Lvl 3)
            if (player.buffs?.epicenterShield && player.buffs.epicenterShield > 0) {
                player.damageBlocked += reducedDmg;
                player.damageBlockedByCollisionReduc += reducedDmg;
                reducedDmg = 0;
            }

            const finalDmg = Math.max(0, reducedDmg); // Allow 0 for shield

            if (finalDmg > 0) {
                // Check Shield Chunks
                let absorbed = 0;
                if (player.shieldChunks && player.shieldChunks.length > 0) {
                    let rem = finalDmg;
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
                const actualDmg = finalDmg - absorbed;

                // --- CLASS CAPABILITIES (Legacy removed) ---

                if (finalDmg > 0) {
                    if (actualDmg > 0) {
                        player.curHp -= actualDmg;
                        player.damageTaken += actualDmg;
                    }
                    spawnFloatingNumber(state, player.x, player.y, Math.round(finalDmg).toString(), '#ef4444', false);
                }
            }

            // Stun Logic
            if (e.stunOnHit) {
                const currentStunEnd = Math.max(Date.now(), player.stunnedUntil || 0);
                player.stunnedUntil = currentStunEnd + 1000; // Stack 1 second
                playSfx('stun-disrupt'); // "Engine Disabled" sound
            }


            if (onEvent) onEvent('player_hit', { dmg: finalDmg });

            // Set collision cooldown for this specific enemy
            e.lastCollisionDamage = now;


            // Contact Death for ALL Enemies (only if not on cooldown)
            // USER: Legion enemies are invincible until shield is destroyed
            let canDie = true;
            if (e.legionId) {
                const lead = state.legionLeads?.[e.legionId];
                if (lead && (lead.legionShield || 0) > 0) {
                    canDie = false;
                    // Apply contact damage to shield instead
                    const contactShieldDmg = 20; // Fixed small chunk for touching
                    lead.legionShield = Math.max(0, (lead.legionShield || 0) - contactShieldDmg);
                    spawnFloatingNumber(state, e.x, e.y, Math.round(contactShieldDmg).toString(), '#60a5fa', false);
                }
            }

            if (canDie && (!e.lastCollisionDamage || now - e.lastCollisionDamage <= 10)) {
                handleEnemyDeath(state, e, onEvent);
            }

            // Check Game Over
            if (player.curHp <= 0 && !state.gameOver) {
                state.gameOver = true;

                // Determine Death Cause
                if (e.legionId) player.deathCause = 'Legion Swarm';
                else if (e.isZombie) player.deathCause = 'Zombie Horde';
                else if (e.shape === 'minion') player.deathCause = 'Pentagon Minion';
                else if (e.boss) {
                    const tier = e.bossTier || 1;
                    const shape = e.shape.charAt(0).toUpperCase() + e.shape.slice(1);
                    player.deathCause = `Boss ${shape} (Lvl ${tier})`;
                }
                else if (e.isElite) {
                    const shape = e.shape.charAt(0).toUpperCase() + e.shape.slice(1);
                    player.deathCause = `Collision with Elite ${shape}`;
                }
                else {
                    const shape = e.shape.charAt(0).toUpperCase() + e.shape.slice(1);
                    player.deathCause = `Collision with ${shape}`;
                }

                if (onEvent) onEvent('game_over');
            }
        }
    });
}

// Helper to check if point is inside an active portal trigger zone (ignoring wall collision)
function isInActivePortal(x: number, y: number, state: GameState): boolean {
    if (state.portalState !== 'open') return false;

    // Find active portals in current arena
    const activePortals = PORTALS.filter(p => p.from === state.currentArena);
    const center = ARENA_CENTERS.find(c => c.id === state.currentArena) || ARENA_CENTERS[0];

    // Check distance to any portal line segment
    for (const p of activePortals) {
        const wall = getHexWallLine(center.x, center.y, ARENA_RADIUS, p.wall);

        // Distance from point to line segment
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
