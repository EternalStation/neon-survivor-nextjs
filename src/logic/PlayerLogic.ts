
import type { GameState, Enemy } from './types';
import { getPlayerThemeColor } from './helpers';
import { isInMap, ARENA_CENTERS, PORTALS, getHexWallLine, ARENA_RADIUS } from './MapLogic';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { GAME_CONFIG } from './GameConfig';
import { calcStat } from './MathUtils';
import { playSfx, fadeOutMusic } from './AudioLogic';
import { calculateLegendaryBonus, getHexLevel, getHexMultiplier } from './LegendaryLogic';
import { handleEnemyDeath } from './DeathLogic';
import { spawnFloatingNumber } from './ParticleLogic';
import { getDefenseReduction } from './MathUtils';
import { isBuffActive } from './BlueprintLogic';



export function updatePlayer(state: GameState, keys: Record<string, boolean>, onEvent?: (type: string, data?: any) => void, inputVector?: { x: number, y: number }, mouseOffset?: { x: number, y: number }) {
    const { player } = state;

    // Track player position history for laser prediction (last 60 frames = ~1 second at 60fps)
    if (!state.playerPosHistory) state.playerPosHistory = [];
    state.playerPosHistory.unshift({ x: player.x, y: player.y, timestamp: state.gameTime });
    if (state.playerPosHistory.length > GAME_CONFIG.PLAYER.HISTORY_LENGTH) state.playerPosHistory.pop();

    // Spawn Animation Logic
    if (state.spawnTimer > 0) {
        state.spawnTimer -= 1 / 60;
        if (state.spawnTimer > 0.3) return; // Allow movement in last 0.3s
    }

    // Movement
    let vx = 0, vy = 0;

    const chronoLvl = getHexLevel(state, 'ChronoPlating');
    const isStunned = (player.stunnedUntil && state.gameTime < player.stunnedUntil) && !(chronoLvl >= 1); // Chrono Lvl 1: Cannot be Stunned

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
            const drCap = chronoLvl >= 1 ? 0.97 : 0.95; // Chrono Lvl 1: 97% DR Cap
            const armRedMult = 1 - getDefenseReduction(armor, drCap);
            let wallDmgAfterArmor = rawWallDmg * armRedMult;

            player.damageBlockedByArmor += (rawWallDmg - wallDmgAfterArmor);
            player.damageBlocked += (rawWallDmg - wallDmgAfterArmor);

            let wallDmg = wallDmgAfterArmor;

            // Kinetic Battery: Trigger Zap on Wall Hit
            const kinLvl = getHexLevel(state, 'KineticBattery');
            if (kinLvl >= 1) triggerKineticBatteryZap(state, player, kinLvl);

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
                // Blueprint: Temporal Guard (Lethal Hit Block)
                if (isBuffActive(state, 'TEMPORAL_GUARD')) {
                    player.curHp = calcStat(player.hp);

                    // Teleport to random safe location (min 2500u offset)
                    let foundSafe = false;
                    let safeX = player.x;
                    let safeY = player.y;
                    let attempts = 0;
                    while (!foundSafe && attempts < 20) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 2500 + Math.random() * 1500; // 2500-4000
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
                        // Fallback to center if map is too tight or bad luck
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
                    player.deathCause = 'Wall Impact';
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

    // Camera Follow
    state.camera.x = player.x - CANVAS_WIDTH / 2;
    state.camera.y = player.y - CANVAS_HEIGHT / 2;

    // --- STAT UPDATE & SYNC ---
    // Calculate and assign Hex bonuses to player stats for this frame
    player.hp.hexFlat = calculateLegendaryBonus(state, 'hp_per_kill');
    player.hp.hexMult = calculateLegendaryBonus(state, 'hp_pct_per_kill');
    player.hp.hexMult2 = 0;

    player.reg.hexFlat = calculateLegendaryBonus(state, 'reg_per_kill');
    player.reg.hexMult = calculateLegendaryBonus(state, 'reg_pct_per_kill');
    player.reg.hexMult2 = 0;

    player.arm.hexFlat = calculateLegendaryBonus(state, 'arm_per_kill') + (player.chronoArmorBonus || 0);
    player.arm.hexMult = calculateLegendaryBonus(state, 'arm_pct_per_kill');
    player.arm.hexMult2 = calculateLegendaryBonus(state, 'arm_pct_missing_hp');

    player.dmg.hexFlat = calculateLegendaryBonus(state, 'dmg_per_kill');
    player.dmg.hexMult = calculateLegendaryBonus(state, 'dmg_pct_per_kill') + calculateLegendaryBonus(state, 'dmg_pct_per_hp');
    player.dmg.hexMult2 = 0;

    player.atk.hexFlat = calculateLegendaryBonus(state, 'ats_per_kill');
    player.atk.hexMult = calculateLegendaryBonus(state, 'ats_pct_per_kill');
    player.atk.hexMult2 = 0;

    // Arena Buffs (Multiplier based)
    let arenaBuff = 1.0;
    if (state.currentArena === 2) {
        const surgeMult = isBuffActive(state, 'ARENA_SURGE') ? 2.0 : 1.0;
        const stasisDebuff = isBuffActive(state, 'STASIS_FIELD') ? 0.8 : 1.0; // Enemy speed handled in EnemyLogic, but maybe relevant here? No.
        arenaBuff = 1 + (0.2 * surgeMult);
    }
    state.arenaBuffMult = arenaBuff;

    // Regen
    let maxHp = calcStat(player.hp, state.arenaBuffMult);
    let regenAmount = (calcStat(player.reg, state.arenaBuffMult) / 60);

    if (player.buffs?.puddleRegen) {
        maxHp *= 1.25; // +25% Max HP in Puddle (Lvl 3)
        regenAmount *= 1.25; // +25% Regen in Puddle (Lvl 3)
    }

    // Overclocker System Surge Buff decaying is handled in useGame loop usually, 
    // but we check for it in stat calcs if we modify them there.
    // Actually we'll modify PlayerLogic to apply surge bonuses here.
    if (player.buffs?.systemSurge && state.gameTime < player.buffs.systemSurge.end) {
        const surge = player.buffs.systemSurge;
        player.atk.hexMult = (player.atk.hexMult || 0) + surge.atk;
    }

    // --- BOSS ARTIFACTS (Arena Drops) ---
    // --- LEGENDARY HEX LOGIC (New System) ---

    // KINETIC BATTERY (Defense - Arena 2)
    const kinLvl = getHexLevel(state, 'KineticBattery');
    if (kinLvl >= 1) {
        // Lvl 2: Gain Shield (500% Armor) refreshing every minute
        if (kinLvl >= 2) {
            if (!player.kineticShieldTimer || state.gameTime > player.kineticShieldTimer) {
                const totalArmor = calcStat(player.arm);
                const shieldAmount = totalArmor * 5;
                if (!player.shieldChunks) player.shieldChunks = [];
                player.shieldChunks.push({ amount: shieldAmount, expiry: state.gameTime + 60 });
                player.kineticShieldTimer = state.gameTime + 60;
                spawnFloatingNumber(state, player.x, player.y, "SHIELD RECHARGE", '#3b82f6', true);
            }
        }
        // Lvl 4: 0.5% of armour goes to hp/sec
        if (kinLvl >= 4) {
            const totalArmor = calcStat(player.arm);
            const bonusRegen = totalArmor * 0.005;

            // Note: We use hexMult2 to show this in the UI
            const baseRegenSum = player.reg.base + player.reg.flat + (player.reg.hexFlat || 0);
            if (baseRegenSum > 0) {
                player.reg.hexMult2 = (bonusRegen / baseRegenSum) * 100;
            } else {
                player.reg.hexFlat = (player.reg.hexFlat || 0) + bonusRegen;
            }
        }
    }

    // CHRONO PLATING (Economic - Arena 0)


    // Lvl 3: Double Armor every 5 minutes (Handled here)
    if (chronoLvl >= 3) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
        const startTime = chronoHex?.timeAtLevel?.[3] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const index = Math.floor(elapsed / 300);

        // Initialize if undefined
        if (player.lastChronoDoubleIndex === undefined) {
            player.lastChronoDoubleIndex = 0;
        }

        if (index > player.lastChronoDoubleIndex) {
            player.lastChronoDoubleIndex = index;
            const currentTotal = calcStat(player.arm);
            player.chronoArmorBonus = (player.chronoArmorBonus || 0) + currentTotal;
            spawnFloatingNumber(state, player.x, player.y, "ARMOR DOUBLED!", '#60a5fa', true);
            playSfx('level');
        }
    }

    // Lvl 4: Cooldown Reduction
    if (chronoLvl >= 4) {
        const chronoHex = state.moduleSockets.hexagons.find(h => h?.type === 'ChronoPlating');
        const startTime = chronoHex?.timeAtLevel?.[4] ?? state.gameTime;
        const elapsed = state.gameTime - startTime;
        const minutes = Math.floor(elapsed / 60);
        const m = getHexMultiplier(state, 'ChronoPlating');
        player.cooldownReduction = minutes * 0.0025 * m;
    } else {
        player.cooldownReduction = 0;
    }

    // --- Kinetic Battery Skill Sync ---
    const kinSkill = player.activeSkills.find(s => s.type === 'KineticBattery');
    if (kinSkill) {
        // We have two cooldowns: Bolt (5s) and Shield (60s)
        // Let's use the bolt cooldown for the main progress if it's counting down, 
        // otherwise show the shield maybe?
        // User said: "as those both are same skill we can use same png... shield icon will mean shield and a lightin icon will mean bolt"
        // I will handle this in HUD/PlayerStatus. For now, just sync the numbers.
        const boltElapsed = state.gameTime - (player.lastKineticShockwave || 0);
        const boltCD = Math.max(0, 5.0 - boltElapsed);
        kinSkill.cooldown = boltCD;
        kinSkill.cooldownMax = 5.0;
    }



    // RADIATION CORE (Combat - Arena 1)
    const radLvl = getHexLevel(state, 'RadiationCore');
    if (radLvl >= 1) {
        // Run Logic every 10 frames (0.16s)
        if (state.frameCount % 10 === 0) {
            const m = getHexMultiplier(state, 'RadiationCore');
            const range = 500;
            // Lvl 1: 5-25% Max HP/sec
            // Lvl 3: +1% Dmg per 1% Missing HP
            let dmgAmp = 1.0 * m;
            if (radLvl >= 3) {
                const missing = 1 - (player.curHp / maxHp);
                if (missing > 0) dmgAmp += missing; // +100% at 0 HP
            }

            const maxDmgPct = 0.10 * dmgAmp;
            const minDmgPct = 0.05 * dmgAmp;
            const playerMaxHp = calcStat(player.hp);
            const enemiesInAura: Enemy[] = [];

            state.enemies.forEach(e => {
                if (e.dead || e.isNeutral) return;

                const d = Math.hypot(e.x - player.x, e.y - player.y);
                let tickDmg = 0;

                // Level 4: Global Decay (1% ENEMY Max HP/sec map-wide - Consistent with Lvl 1 Aura)
                if (radLvl >= 4) {
                    const globalDmgPerSec = e.maxHp * 0.01 * dmgAmp;
                    const globalDmgPerTick = globalDmgPerSec / 6;
                    tickDmg += globalDmgPerTick;
                }

                if (d < range) {
                    enemiesInAura.push(e);
                    const distFactor = 1 - (d / range);
                    const auraPct = minDmgPct + (distFactor * (maxDmgPct - minDmgPct));

                    // Level 1: Aura damage is based on PLAYER Max HP
                    const auraDmgPerSec = playerMaxHp * auraPct;
                    const auraDmgPerTick = auraDmgPerSec / 6;

                    tickDmg += auraDmgPerTick;
                }

                if (tickDmg > 0) {
                    // Respect Legion Shields
                    let finalTickDmg = tickDmg;
                    if (e.legionId) {
                        const lead = state.legionLeads?.[e.legionId];
                        if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                            const shieldAbsorp = Math.min(finalTickDmg, lead.legionShield || 0);
                            lead.legionShield = (lead.legionShield || 0) - shieldAbsorp;
                            finalTickDmg -= shieldAbsorp;
                            if (shieldAbsorp > 0 && d < 1000 && Math.random() < 0.1) {
                                spawnFloatingNumber(state, e.x, e.y, Math.round(shieldAbsorp).toString(), '#60a5fa', false);
                            }
                        }
                    }

                    if (finalTickDmg > 0) {
                        e.hp -= finalTickDmg;
                        player.damageDealt += finalTickDmg;

                        // Unified Floating Damage Numbers (Aura + Global Decay)
                        // Stagger visibility: show total per-second dmg every 0.5s or if it's the proximity aura
                        const isAuraSource = d < range;
                        const shouldShowText = isAuraSource ? (Math.random() < 0.3) : (Math.floor(state.gameTime * 2) > Math.floor((state.gameTime - 1 / 60) * 2));

                        if (shouldShowText) {
                            // Map-wide decay shows up as a lighter green or with a "Decay" tint if outside aura
                            const color = isAuraSource ? '#22c55e' : '#4ade80';
                            spawnFloatingNumber(state, e.x, e.y, Math.round(tickDmg * 6).toString(), color, false);
                        }

                        if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, onEvent);
                    }
                }
            });

            // Lvl 2: Heal 0.2% Player Max HP/sec per enemy in aura
            if (radLvl >= 2 && enemiesInAura.length > 0) {
                const healPerEnemy = playerMaxHp * (0.002 * m) / 6; // 0.2% per sec
                const totalHeal = healPerEnemy * enemiesInAura.length;
                player.curHp = Math.min(maxHp, player.curHp + totalHeal);
            }
        }

        // Spawn Boiling Bubbles (World-space particles)
        // Amount reduced by 50% (every 10 frames instead of every frame)
        if (state.frameCount % 10 === 0) {
            const range = 500;
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * range;
            const bx = player.x + Math.cos(angle) * dist;
            const by = player.y + Math.sin(angle) * dist;

            state.particles.push({
                x: bx,
                y: by,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                life: 60,
                maxLife: 60,
                color: '#bef264',
                size: 6 + Math.random() * 8,
                type: 'bubble',
                alpha: 0.5
            });
        }
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
            const now = state.gameTime;
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
                    // NEW COLLISION FORMULA: Power Scaling
                    // Damage scales with Enemy HP but diminishingly (Square Root-ish)
                    // Min 0 (60 HP) -> ~12 Dmg
                    // Min 30 (50k HP) -> ~660 Dmg
                    // Boss (500k HP) -> ~2600 Dmg
                    rawDmg = Math.pow(e.maxHp, GAME_CONFIG.ENEMY.COLLISION_POWER_SCALING);
                }
            }

            if (state.currentArena === 1 && !e.isNeutral) {
                rawDmg *= 1.15; // +15% Collision Damage in Combat Hex
            }

            const armorValue = calcStat(player.arm);
            const drCap = 0.95;
            const armRedMult = 1 - getDefenseReduction(armorValue, drCap);

            // Kinetic Battery Lvl 1: Retaliation Shockwave
            if (kinLvl >= 1 && dToE < contactDist) {
                triggerKineticBatteryZap(state, player, kinLvl);
            }

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

            // Invincibility (Temporal Guard, etc.)
            if (player.invincibleUntil && state.gameTime < player.invincibleUntil) {
                player.damageBlocked += reducedDmg;
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
                const currentStunEnd = Math.max(state.gameTime, player.stunnedUntil || 0);
                player.stunnedUntil = currentStunEnd + 1.0; // Stack 1 second
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
                // Blueprint: Temporal Guard (Lethal Hit Block)
                if (isBuffActive(state, 'TEMPORAL_GUARD')) {
                    player.curHp = calcStat(player.hp);

                    // Teleport to random safe location (min 2500u offset)
                    let foundSafe = false;
                    let safeX = player.x;
                    let safeY = player.y;
                    let attempts = 0;
                    while (!foundSafe && attempts < 20) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 2500 + Math.random() * 1500; // 2500-4000
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
                        // Fallback to center
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
                    fadeOutMusic(7.0);
                }
            }
        }
    });

    // --- PROCESS PENDING ZAPS (Kinetic Battery) ---
    if (state.pendingZaps && state.pendingZaps.length > 0) {
        for (let i = state.pendingZaps.length - 1; i >= 0; i--) {
            const zap = state.pendingZaps[i];
            if (state.gameTime >= zap.nextZapTime) {
                const targetId = zap.targetIds[zap.currentIndex];
                const target = state.enemies.find(e => e.id === targetId);

                if (target && !target.dead) {
                    // Apply Damage
                    target.hp -= zap.dmg;
                    spawnFloatingNumber(state, target.x, target.y, Math.round(zap.dmg).toString(), '#3b82f6', true);
                    if (target.hp <= 0) handleEnemyDeath(state, target, onEvent);

                    // Visual: Straight Lightning with 10-frame life
                    spawnLightning(state, zap.sourcePos.x, zap.sourcePos.y, target.x, target.y, '#60a5fa', false, true, 10);

                    if (!zap.history) zap.history = [];
                    zap.history.push({ x1: zap.sourcePos.x, y1: zap.sourcePos.y, x2: target.x, y2: target.y });

                    // Impact visuals
                    state.particles.push({
                        x: target.x, y: target.y, vx: 0, vy: 0, life: 10,
                        color: '#60a5fa', size: 20, type: 'shockwave', alpha: 0.8
                    });

                    // Prepare for next target
                    zap.currentIndex++;
                    zap.nextZapTime = state.gameTime + 0.016; // ~1 frame at 60fps
                    zap.sourcePos = { x: target.x, y: target.y }; // Jump from this enemy center

                    if (zap.currentIndex >= zap.targetIds.length) {
                        state.pendingZaps.splice(i, 1);
                    }
                } else {
                    // Target lost or dead, skip to next in chain immediately
                    zap.currentIndex++;
                    if (zap.currentIndex >= zap.targetIds.length) {
                        state.pendingZaps.splice(i, 1);
                    } else {
                        zap.nextZapTime = state.gameTime;
                    }
                }
            }
        }
    }

    // Attach trigger function for other modules (Projectile/UniqueEnemy)
    if (!(state as any).triggerKineticBatteryZap) {
        (state as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
        (window as any).triggerKineticBatteryZap = triggerKineticBatteryZap;
    }
}

export function triggerKineticBatteryZap(state: GameState, source: { x: number, y: number }, kinLvl: number) {
    const now = state.gameTime;
    if (state.player.lastKineticShockwave && now < state.player.lastKineticShockwave + 5.0) return;

    state.player.lastKineticShockwave = now;
    const totalArmor = calcStat(state.player.arm);
    const shockDmg = totalArmor * 5;

    // Find first target
    let first: Enemy | null = null;
    let minD = Infinity;
    state.enemies.forEach(target => {
        if (target.dead || target.isNeutral) return;
        const d = Math.hypot(target.x - source.x, target.y - source.y);
        if (d < minD) { minD = d; first = target; }
    });

    if (first) {
        if (!state.pendingZaps) state.pendingZaps = [];
        const targetIds: number[] = [(first as Enemy).id];
        let currentInChain: Enemy = first;
        for (let i = 0; i < 9; i++) {
            let best: Enemy | null = null;
            let bestD = Infinity;
            state.enemies.forEach((cand: Enemy) => {
                if (cand.dead || cand.isNeutral || targetIds.includes(cand.id)) return;
                const d = Math.hypot(cand.x - currentInChain.x, cand.y - currentInChain.y);
                if (d < bestD) { bestD = d; best = cand; }
            });
            if (best) {
                targetIds.push((best as Enemy).id);
                currentInChain = best;
            } else break;
        }

        state.pendingZaps.push({
            targetIds,
            dmg: shockDmg,
            nextZapTime: now,
            currentIndex: 0,
            sourcePos: { x: source.x, y: source.y },
            history: []
        });
        playSfx('wall-shock');
    }
}

function spawnLightning(state: GameState, x1: number, y1: number, x2: number, y2: number, color: string, isBranch: boolean = false, isStraight: boolean = false, lifeOverride?: number) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    // Fewer segments for straight lines, more for branches
    const segments = isStraight ? Math.max(1, Math.floor(dist / 80)) : Math.max(2, Math.floor(dist / 40));

    let lastX = x1;
    let lastY = y1;

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        let targetX = x1 + (x2 - x1) * t;
        let targetY = y1 + (y2 - y1) * t;

        if (i < segments && !isStraight) {
            const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
            const jitterAmount = (Math.random() - 0.5) * (isBranch ? 30 : 60);
            targetX += Math.cos(angle) * jitterAmount;
            targetY += Math.sin(angle) * jitterAmount;
        }

        // Spawn visual segments
        const segDist = Math.hypot(targetX - lastX, targetY - lastY);
        const dots = Math.floor(segDist / 2);
        for (let j = 0; j < dots; j++) {
            const tt = j / dots;
            const px = lastX + (targetX - lastX) * tt;
            const py = lastY + (targetY - lastY) * tt;

            state.particles.push({
                x: px, y: py, vx: 0, vy: 0,
                life: lifeOverride || 6, color: '#fff',
                size: 0.2, type: 'spark', alpha: 1.0
            });

            state.particles.push({
                x: px, y: py, vx: 0, vy: 0,
                life: lifeOverride ? lifeOverride + 2 : 8, color: color,
                size: isBranch ? 0.8 : 1.5, type: 'spark', alpha: 0.4
            });
        }

        // Decorative tiny branches (only on main straight lines)
        if (isStraight && !isBranch) {
            const branchCount = Math.floor(Math.random() * 5) + 2; // 2-6 branches per segment
            for (let b = 0; b < branchCount; b++) {
                if (Math.random() < 0.9) {
                    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 4.0;
                    const len = 15 + Math.random() * 45;
                    spawnLightning(state, targetX, targetY, targetX + Math.cos(angle) * len, targetY + Math.sin(angle) * len, color, true, false, 6);
                }
            }
        }

        lastX = targetX;
        lastY = targetY;
    }
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
