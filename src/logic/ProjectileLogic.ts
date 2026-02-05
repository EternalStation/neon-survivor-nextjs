import { PLAYER_CLASSES } from './classes';
import { isInMap, getHexDistToWall } from './MapLogic';
import { GAME_CONFIG } from './GameConfig';
import { PALETTES } from './constants';
import { getChassisResonance } from './EfficiencyLogic';
import { playSfx } from './AudioLogic';
import { calcStat } from './MathUtils';
import type { GameState, Enemy } from './types';
import { spawnParticles, spawnFloatingNumber } from './ParticleLogic';
import { getHexMultiplier, getHexLevel, calculateLegendaryBonus } from './LegendaryLogic';
import { handleEnemyDeath } from './DeathLogic';
import { getPlayerThemeColor } from './helpers';
import { getDefenseReduction } from './MathUtils';




// Helper: Trigger Shockwave
function triggerShockwave(state: GameState, angle: number, level: number) {
    // Lvl 1: 75% dmg, 450 range (was 2500, then 500)
    // Lvl 3: 125% dmg, 600 range (was 3750, then 750)
    // Lvl 4: Backwards wave too

    const range = level >= 3 ? GAME_CONFIG.SKILLS.WAVE_RANGE.LVL3 : GAME_CONFIG.SKILLS.WAVE_RANGE.LVL1;
    const damageMult = level >= 3 ? GAME_CONFIG.SKILLS.WAVE_DAMAGE_MULT.LVL3 : GAME_CONFIG.SKILLS.WAVE_DAMAGE_MULT.LVL1;
    const coneHalfAngle = 0.7; // ~80 degrees total

    const playerDmg = calcStat(state.player.dmg);
    const waveDmg = playerDmg * damageMult;

    const castWave = (waveAngle: number) => {
        // Visuals: Echolocation Wave (Single clean arc)
        // We use a special 'shockwave' particle type that the renderer draws as a bent line
        const speed = GAME_CONFIG.SKILLS.WAVE_SPEED; // Even Faster (was 18) to ensure it disappears quickly at destination

        state.particles.push({
            x: state.player.x,
            y: state.player.y,
            vx: Math.cos(waveAngle) * speed,
            vy: Math.sin(waveAngle) * speed,
            life: range / speed, // Live just long enough to reach max range (approx 18-24 frames)
            color: '#38BDF8', // Epic Light Blue
            size: 300, // Larger radius for "flatter" look
            type: 'shockwave',
            alpha: 1.0,
            decay: 0.05
        });

        // Add "Epic" Debris / Energy particles
        for (let k = 0; k < 12; k++) {
            const debrisAngle = waveAngle + (Math.random() - 0.5) * coneHalfAngle;
            const debrisSpeed = speed * (0.9 + Math.random() * 0.2);
            state.particles.push({
                x: state.player.x,
                y: state.player.y,
                vx: Math.cos(debrisAngle) * debrisSpeed,
                vy: Math.sin(debrisAngle) * debrisSpeed,
                life: (range / speed) * (0.8 + Math.random() * 0.2), // Die with wave
                color: Math.random() > 0.5 ? '#BAE6FD' : '#60A5FA', // Mix of blues
                size: 2 + Math.random() * 4,
                type: 'spark',
                alpha: 1.0,
                decay: 0.1 // Faster decay
            });
        }

        playSfx('sonic-wave');

        // Damage Logic (Instant Hitscan for gameplay feel, visualization catches up)
        state.enemies.forEach(e => {
            if (e.dead || e.isFriendly || e.isZombie) return;
            const dx = e.x - state.player.x;
            const dy = e.y - state.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist < range) {
                const angleToEnemy = Math.atan2(dy, dx);
                const diff = Math.abs(angleToEnemy - waveAngle);
                // Normalized diff
                const normDiff = Math.min(diff, Math.abs(diff - Math.PI * 2));

                if (normDiff < coneHalfAngle) {
                    // Hit!
                    e.hp -= waveDmg;
                    state.player.damageDealt += waveDmg;
                    spawnFloatingNumber(state, e.x, e.y, Math.round(waveDmg).toString(), '#38BDF8', false);
                    // Flash hit effect
                    spawnParticles(state, e.x, e.y, '#EF4444', 3);

                    // Lvl 2: Fear
                    if (level >= 2) {
                        e.fearedUntil = state.gameTime + 1.5; // 1.5s
                    }
                }
            }
        });
    };

    castWave(angle);

    if (level >= 4) {
        castWave(angle + Math.PI);
    }
}

export function spawnBullet(state: GameState, x: number, y: number, angle: number, dmg: number, pierce: number, offsetAngle: number = 0) {
    if (state.player.immobilized) return;
    const spd = GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

    // --- ComCrit Logic ---
    const critLevel = getHexLevel(state, 'ComCrit');
    let isCrit = false;
    let finalDmg = dmg;
    let mult = 1.0;

    if (critLevel > 0) {
        let chance = GAME_CONFIG.SKILLS.CRIT_BASE_CHANCE;
        mult = GAME_CONFIG.SKILLS.CRIT_BASE_MULT;
        if (state.moduleSockets.hexagons.some(h => h?.type === 'ComCrit' && h.level >= 4)) {
            chance = GAME_CONFIG.SKILLS.CRIT_LVL4_CHANCE;
            mult = GAME_CONFIG.SKILLS.CRIT_LVL4_MULT;
        }

        if (Math.random() < chance) {
            isCrit = true;
            finalDmg *= mult;
        } else {
            mult = 1.0;
        }
    }

    let isHyperPulse = false;
    let bulletSize = 4;
    let pClass = PLAYER_CLASSES.find(c => c.id === state.player.playerClass);
    let bulletColor: string | undefined = pClass?.themeColor;
    let bulletPierce = pierce;
    // Malware pierce logic is now handled in player.pierce initialization in GameState.ts

    // --- CLASS MODIFIERS: Cosmic Beam (formerly Storm-Strike) ---
    if (state.player.playerClass === 'stormstrike') {
        const now = Date.now();
        // Initialize if undefined
        if (!state.player.lastCosmicStrikeTime) {
            state.player.lastCosmicStrikeTime = 0; // Ready immediately? Or start on cooldown? Usually ready.
        }

        const cooldown = 8000; // 8 Seconds Static
        if (now - state.player.lastCosmicStrikeTime >= cooldown) {
            // Orbital Strike Trigger
            playSfx('lock-on'); // Targeting sound
            state.player.lastCosmicStrikeTime = now;

            // Determine Impact Point
            let tx = state.player.targetX;
            let ty = state.player.targetY;

            // Range-limited Targeting Logic (1000px)
            const maxRange = 1000;
            const liveEnemies = state.enemies.filter(e => {
                if (e.dead || e.isFriendly) return false;
                const d = Math.hypot(e.x - x, e.y - y);
                return d <= maxRange;
            });

            if (liveEnemies.length > 0) {
                const randomEnemy = liveEnemies[Math.floor(Math.random() * liveEnemies.length)];
                tx = randomEnemy.x;
                ty = randomEnemy.y;
            } else {
                // Fallback if no enemies within range: Project out from cursor/aim up to maxRange
                const angleToUse = (tx !== undefined && ty !== undefined)
                    ? Math.atan2(ty - state.player.y, tx - state.player.x)
                    : (angle + offsetAngle);

                tx = x + Math.cos(angleToUse) * maxRange;
                ty = y + Math.sin(angleToUse) * maxRange;
            }

            // Apply Resonance to Radius
            const resonance = getChassisResonance(state);
            const baseRadius = 100;
            // 100% + Resonance% (e.g. 50% resonance -> 1.5 multiplier)
            const radius = baseRadius * (1 + resonance);

            state.areaEffects.push({
                id: Date.now() + Math.random(),
                type: 'orbital_strike',
                x: tx,
                y: ty,
                radius: radius,
                duration: 0.3, // 0.3s delay (Reverted to ensure hits)
                creationTime: Date.now(),
                level: 1,
                casterId: state.player.playerClass === 'stormstrike' ? 1 : 0
            });

            // Visual Marker immediately
            // spawnParticles(state, tx, ty, '#38bdf8', 1, 150, 0, 'shockwave'); // Removed as per request

            return; // STOP! Do not spawn a bullet.
        }
    }

    // --- CLASS MODIFIERS: Stinger -> Stinger id is gone, replaced by others. 
    // Wait, I should use the new IDs.
    const classStats = PLAYER_CLASSES.find(c => c.id === state.player.playerClass);
    const resonance = getChassisResonance(state);

    const bulletId = Math.random();
    const b: any = {
        id: bulletId,
        x, y,
        vx: Math.cos(angle + offsetAngle) * spd,
        vy: Math.sin(angle + offsetAngle) * spd,
        dmg: finalDmg,
        pierce: bulletPierce,
        // Dynamic Life: Base 140 * Class Mult * (1 + Resonance)
        life: 140 * (classStats?.stats.projLifeMult || 1) * (1 + resonance),
        bounceDmgMult: (classStats?.stats.bounceDmgMult || 0) * (1 + resonance),
        bounceSpeedBonus: (classStats?.stats.bounceSpeedBonus || 0) * (1 + resonance),
        isEnemy: false,
        hits: new Set(),
        size: bulletSize,
        isCrit,
        critMult: mult,
        isHyperPulse,
        color: bulletColor,
        spawnTime: Date.now()
    };

    // --- CLASS MODIFIERS: Aigis-Vortex Initial State ---
    if (state.player.playerClass === 'aigis') {
        b.vortexState = 'orbiting';
        b.orbitAngle = angle + offsetAngle;
        b.orbitDist = 125;
        b.life = 999999; // Orbit indefinitely until hit

        state.bullets.push(b);

        // Multi-Ring Logic
        const resonance = getChassisResonance(state);

        // Ring II: 10% Base + Resonance
        const chance2 = 0.10 * (1 + resonance);
        if (Math.random() < chance2) {
            const b2 = { ...b, id: Math.random(), orbitDist: 175 };
            state.bullets.push(b2);
        }

        // Ring III: 5% Base + Resonance
        const chance3 = 0.05 * (1 + resonance);
        if (Math.random() < chance3) {
            const b3 = { ...b, id: Math.random(), orbitDist: 225 };
            state.bullets.push(b3);
        }

        return; // Already pushed, return to avoid double push of 'b' or duplicate logic
    }

    state.bullets.push(b);

    // --- ComWave Logic ---
    const waveLevel = getHexLevel(state, 'ComWave');
    if (waveLevel > 0) {
        state.player.shotsFired = (state.player.shotsFired || 0) + 1;
        if (state.player.shotsFired % GAME_CONFIG.SKILLS.WAVE_SHOTS_REQUIRED === 0) {
            triggerShockwave(state, angle + offsetAngle, waveLevel);
        }
    }
}

export function spawnEnemyBullet(state: GameState, x: number, y: number, angle: number, dmg: number, _color: string = '#FF0000') {
    const spd = 6;

    // Always use the bright color from the current 15-minute era palette
    const minutes = state.gameTime / 60;
    const eraIndex = Math.floor(minutes / 15);
    const eraPalette = PALETTES[eraIndex % PALETTES.length];
    const brightColor = eraPalette.colors[0];

    state.enemyBullets.push({
        id: Math.random(),
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        dmg,
        pierce: 0,
        life: 300,
        isEnemy: true,
        hits: new Set(),
        color: brightColor, // Ignore passed color, use bright era color
        size: 6
    });
}

export function updateProjectiles(state: GameState, onEvent?: (event: string, data?: any) => void) {
    const { bullets, enemyBullets, player } = state;
    const now = Date.now();

    // --- PLAYER BULLETS ---
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;

        // Collision with Map Boundary (Walls)
        if (!isInMap(b.x, b.y)) {
            // --- CLASS MODIFIER: Malware-Prime Glitch Bounce ---
            if (player.playerClass === 'malware') {
                b.bounceCount = (b.bounceCount || 0) + 1;

                // User Request: +20% Damage per bounce (Multiplicative) - Scaled with Resonance
                // b.bounceDmgMult is already (0.2 * resonance_factor)
                const dmgMult = 1 + (b.bounceDmgMult || 0.2);
                b.dmg *= dmgMult;

                // Color Shifting: Initial Purple -> First Hit Orange -> Subsequent Hits Red
                if (b.bounceCount === 1) {
                    b.color = '#fb923c'; // Vibrant Orange
                } else {
                    // Slowly shift green channel out to reach pure Red
                    const redProgress = Math.min(1, (b.bounceCount - 1) / 6);
                    const green = Math.floor(146 * (1 - redProgress));
                    b.color = `rgb(255, ${green}, 0)`;
                }

                // Accurate Hexagonal Reflection
                const { dist, normal } = getHexDistToWall(b.x, b.y);
                const dot = b.vx * normal.x + b.vy * normal.y;

                // Only bounce if moving OUTWARD (dot < 0 with inward normal)
                if (dot < 0) {
                    // Mirror Reflection + Speed Increase (Multiplicative)
                    // b.bounceSpeedBonus is e.g. 0.2 (scaled).
                    const speedMult = 1 + (b.bounceSpeedBonus || 0.2);
                    b.vx = (b.vx - 2 * dot * normal.x) * speedMult;
                    b.vy = (b.vy - 2 * dot * normal.y) * speedMult;

                    // Nudge back into bounds
                    b.x += normal.x * (Math.abs(dist) + 5);
                    b.y += normal.y * (Math.abs(dist) + 5);

                    spawnParticles(state, b.x, b.y, b.color, 12);
                }
                continue;
            }

            spawnParticles(state, b.x, b.y, b.color || '#22d3ee', 4);
            bullets.splice(i, 1);
            continue;
        }

        // --- Malware Trail Management ---
        if (player.playerClass === 'malware' && (b.bounceCount || 0) > 0) {
            if (!b.trails) b.trails = [];
            b.trails.unshift({ x: b.x, y: b.y });
            // Minimum trail starts after first bounce (bounceCount = 1)
            const maxTrail = (b.bounceCount || 0) * 5;
            if (b.trails.length > maxTrail) b.trails.pop();
        }

        // --- CLASS MODIFIER: Hive-Mother Nanite Swarm Homing ---
        if (b.isNanite && b.naniteTargetId) {
            const target = state.enemies.find(e => e.id === b.naniteTargetId && !e.dead);
            if (target) {
                // Steer towards target
                const angleToTarget = Math.atan2(target.y - b.y, target.x - b.x);
                // Smooth turn? Or just swarm behavior?
                // Let's do simple easing for "liquid" feel
                const speed = 12; // Fast

                // Lerp angle? No, just velocity steering is easier for swarm look
                const tx = Math.cos(angleToTarget) * speed;
                const ty = Math.sin(angleToTarget) * speed;

                // Add 'Jaggy' Jitter for swarm aesthetic
                const jitter = 4.0;
                b.vx += (tx - b.vx) * 0.15 + (Math.random() - 0.5) * jitter;
                b.vy += (ty - b.vy) * 0.15 + (Math.random() - 0.5) * jitter;
            } else {
                // Target died? Find new one? Or just drift
                b.life = 0; // Fizzle out
            }
        }

        // --- CLASS MODIFIER: Aigis-Vortex Orbtial Movement ---
        if (b.vortexState === 'orbiting') {
            b.orbitAngle = (b.orbitAngle || 0) + 0.05;
            const dist = b.orbitDist || 125;
            b.x = player.x + Math.cos(b.orbitAngle) * dist;
            b.y = player.y + Math.sin(b.orbitAngle) * dist;
            // Update velocity so it "looks" like it's moving for hit detection (approx)
            b.vx = 0; b.vy = 0;
        }

        let bulletRemoved = false;

        // Collision with Enemies
        const nearbyEnemies = state.spatialGrid.query(b.x, b.y, 100); // 100px search radius (covers max enemy size)

        for (let j = 0; j < nearbyEnemies.length; j++) {
            const e = nearbyEnemies[j];

            // Ignore friendly zombies or dead/immune stuff
            // Friendly zombies shouldn't be hit by player bullets? Usually yes.
            // "on your side".
            if (e.dead || e.hp <= 0 || b.hits.has(e.id) || e.isFriendly || e.isZombie || (e.legionId && !e.legionReady)) continue;

            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            const hitRadius = e.size + 10;

            // --- SQUARE BOSS BUBBLE REFLECTION (Lvl 3) ---
            // If boss has shields active, reflect bullets at the bubble radius
            if (e.shape === 'square' && e.boss && e.orbitalShields && e.orbitalShields > 0) {
                const bubbleRadius = 110; // Protective bubble radius
                if (dist < bubbleRadius) {
                    // Bullet is inside or touching the bubble - REFLECT IT
                    // Calculate reflection angle (bounce off like a wall)
                    const angleToBullet = Math.atan2(b.y - e.y, b.x - e.x);
                    const reflectAngle = angleToBullet + Math.PI + (Math.random() - 0.5) * 0.4;

                    b.vx = Math.cos(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                    b.vy = Math.sin(reflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

                    // Visual feedback - removed particles to avoid fountain effect
                    playSfx('impact');

                    // Bullet bounces - skip ALL further checks for this enemy
                    continue;
                }
            }

            if (dist < hitRadius) {
                // --- ComCrit Lvl 3: Death Mark Amplification ---
                const critLevel = getHexLevel(state, 'ComCrit');
                let damageAmount = b.dmg;

                // Apply Taken Damage Multiplier (e.g. Puddle)
                if (e.takenDamageMultiplier) {
                    damageAmount *= e.takenDamageMultiplier;
                }

                // Check if Marked (Shattered Fate Lvl 3)
                if (critLevel >= 3 && e.deathMarkExpiry && state.gameTime < e.deathMarkExpiry) {
                    const markMult = GAME_CONFIG.SKILLS.DEATH_MARK_MULT;
                    const bulletMult = b.critMult || 1.0;
                    const finalMult = Math.max(bulletMult, markMult);

                    // Priority: Apply the highest multiplier (ensure at least 300% for marked)
                    damageAmount = (b.dmg / bulletMult) * finalMult;

                    spawnParticles(state, e.x, e.y, '#FF0000', 3);
                    e.critGlitchUntil = now + 100; // Set glitch timer (100ms)
                }

                // --- TRIANGLE BOSS DEFLECTION (Lvl 3) ---
                if (e.shape === 'triangle' && e.deflectState) {
                    // 50% Chance to deflect
                    if (Math.random() < 0.5) {
                        // Deflect!
                        // Calculate normal vector from boss center to bullet
                        const angleToBullet = Math.atan2(b.y - e.y, b.x - e.x);
                        // Deflect angle: Random wide angle (160 deg -> ~2.8 rad spread)
                        // User request: "160 degrees angle" - implied separate from incoming?
                        // Interpretation: Bounce off at a wild angle generally away from boss
                        const deflectAngle = angleToBullet + (Math.random() - 0.5) * 2.5;

                        b.vx = Math.cos(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;
                        b.vy = Math.sin(deflectAngle) * GAME_CONFIG.PROJECTILE.PLAYER_BULLET_SPEED;

                        // Extend life so it can fly away
                        b.life = 120;
                        // It can now kill other enemies, but not damage player (already handled by it being 'isEnemy: false')
                        // It also shouldn't hit this boss again immediately.
                        b.hits.add(e.id);

                        // Visuals
                        spawnParticles(state, b.x, b.y, '#FFFFFF', 5);
                        playSfx('impact'); // Fallback since 'ricochet' might not exist

                        continue; // Skip damage processing for this frame
                    }
                }

                // --- ComLife Lvl 3: +2% Max HP Dmg (Non-Boss) ---
                const lifeLevel = getHexLevel(state, 'ComLife');
                if (lifeLevel >= 3 && !e.boss) {
                    damageAmount += e.maxHp * 0.02;
                }

                // --- SPECIAL: Nanite Swarm Infection (Hive-Mother) ---
                if (b.isNanite) {
                    // Nanites apply infection without impact damage
                    damageAmount = 0;
                    const wasInfected = e.isInfected;
                    e.isInfected = true;
                    e.infectedUntil = 999999999; // Keep as fallback/legacy check
                    // Inherit per-tick damage directly from nanite projectile (no recursion)
                    e.infectionDmg = Math.max(e.infectionDmg || 0, b.dmg);

                    // Visuals - only on initial infection, not refresh
                    if (!wasInfected) {
                        const themeColor = getPlayerThemeColor(state);
                        spawnParticles(state, e.x, e.y, themeColor, 5);
                    }
                }

                // --- LEGION SHIELD LOGIC ---
                if (e.legionId) {
                    const lead = state.legionLeads?.[e.legionId];
                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                        const shieldDmg = Math.min(damageAmount, lead.legionShield || 0);
                        lead.legionShield = (lead.legionShield || 0) - shieldDmg;
                        damageAmount -= shieldDmg;

                        // Visual feedback for shield hit
                        spawnParticles(state, e.x, e.y, '#60a5fa', 5); // Blue spark for shield
                        spawnFloatingNumber(state, e.x, e.y, Math.round(shieldDmg).toString(), '#60a5fa', false);

                        if (damageAmount <= 0) {
                            // Bullet absorbed by shield
                            b.hits.add(e.id);
                            if (!b.isHyperPulse) b.pierce--;
                            // Skip regular damage but stay in loop for bullet removal check
                        }
                    }
                }

                // 0.5 Thorns Logic (Reflect Damage)
                if (e.thorns && e.thorns > 0 && damageAmount > 0) {
                    const reflected = damageAmount * e.thorns;
                    state.player.curHp -= reflected;
                    const displayDmg = Math.round(reflected);
                    if (displayDmg > 0) {
                        spawnFloatingNumber(state, state.player.x, state.player.y, `-${displayDmg}`, '#FF0000', true);
                    }
                    spawnParticles(state, state.player.x, state.player.y, '#FF0000', 3);
                    // Play 'hurt' sound?
                }

                // 1. Apply Damage (with Soul Link Logic)
                if (damageAmount > 0) {

                    // SOUL LINK LOGIC (Pentagon Boss)
                    let linkedTargets: Enemy[] = [];
                    if (e.soulLinkHostId) {
                        const host = state.enemies.find(h => h.id === e.soulLinkHostId && !h.dead);
                        if (host) {
                            linkedTargets.push(host);
                            // Find other minions linked to this host? 
                            // Optimized: The Host has `soulLinkTargets`.
                            if (host.soulLinkTargets) {
                                const peers = state.enemies.filter(p => host.soulLinkTargets!.includes(p.id) && !p.dead);
                                linkedTargets.push(...peers);
                            }
                        }
                    } else if (e.soulLinkTargets && e.soulLinkTargets.length > 0) {
                        // Takes hit as host
                        linkedTargets.push(e);
                        const minions = state.enemies.filter(m => e.soulLinkTargets!.includes(m.id) && !m.dead);
                        linkedTargets.push(...minions);
                    }

                    if (linkedTargets.length > 1) {
                        // Remove duplicates (Host is in targets, etc)
                        linkedTargets = Array.from(new Set(linkedTargets));

                        // Determine Link Color
                        // User Request: Prevent Green Color (Era 0). Use Bullet Color to maintain theme.
                        const linkColor = b.color || '#22d3ee'; // Default to Cyan if no bullet color

                        const splitDmg = damageAmount / linkedTargets.length;

                        linkedTargets.forEach(target => {
                            target.hp -= splitDmg;
                            player.damageDealt += splitDmg; // Total damage dealt remains same, just split
                            spawnFloatingNumber(state, target.x, target.y, Math.round(splitDmg).toString(), linkColor, false);
                            spawnParticles(state, target.x, target.y, linkColor, 2);

                            // Handle Death for linked targets
                            if (target.hp <= 0 && !target.dead) {
                                handleEnemyDeath(state, target, onEvent);
                            }
                        });

                        b.hits.add(e.id); // Register hit on primary target for bullet logic
                    } else {
                        // Standard Single Target
                        e.hp -= damageAmount;
                        player.damageDealt += damageAmount;
                        b.hits.add(e.id);
                    }

                    // Hyper-Pulse infinite pierce
                    if (!b.isHyperPulse) {
                        b.pierce--;
                    }
                }

                // --- CLASS MODIFIER: Event-Horizon Gravimetric Pull ---
                if (player.playerClass === 'eventhorizon') {
                    const now = state.gameTime;
                    const cooldownDuration = 10; // 10 seconds
                    const blackholeDuration = 3; // 3 seconds

                    // Check if blackhole is off cooldown
                    if (!player.blackholeCooldown || now >= player.blackholeCooldown) {
                        // Create persistent blackhole area effect
                        state.areaEffects.push({
                            id: Date.now(),
                            type: 'blackhole',
                            x: b.x,
                            y: b.y,
                            radius: 400, // Reduced from 450px
                            duration: blackholeDuration,
                            creationTime: now,
                            level: 1
                        });

                        playSfx('impact'); // Heavier feedback

                        // Set cooldown
                        player.blackholeCooldown = now + cooldownDuration;
                    }
                }

                // --- CLASS MODIFIER: Hive-Mother Nanite Swarm ---
                if (player.playerClass === 'hivemother' && !b.isNanite) {
                    const resonance = getChassisResonance(state);
                    const multiplier = 1 + resonance;
                    const swarmDmgPerSecPct = 5 * multiplier;

                    e.isInfected = true;
                    e.infectedUntil = 999999999; // Keep as fallback/legacy check
                    const basePower = calcStat(player.dmg);
                    e.infectionDmg = basePower * (swarmDmgPerSecPct / 100); // 5%/sec * resonance, 1 tick per second
                }

                // Determine if crit for visual
                const isCritVisible = !!b.isCrit || (critLevel >= 3 && damageAmount > b.dmg * 2);
                const themeColor = getPlayerThemeColor(state);
                // Only show damage number if damage was actually dealt
                if (damageAmount > 0) {
                    spawnFloatingNumber(state, e.x, e.y, Math.round(damageAmount).toString(), isCritVisible ? '#ef4444' : themeColor, isCritVisible);
                }

                // --- ComCrit Lvl 3: Apply Death Mark ---
                // "Death marks enemy you hit every 10second"
                if (critLevel >= 3) {
                    if (!player.lastDeathMark || state.gameTime - player.lastDeathMark > 10) {
                        e.deathMarkExpiry = state.gameTime + 3; // 3 seconds
                        player.lastDeathMark = state.gameTime;
                        // Visual for Mark?
                        spawnParticles(state, e.x, e.y, '#8800FF', 8); // Reduced count
                        playSfx('rare-spawn'); // Sound cue
                    }
                }

                // --- ComLife Lvl 1: Lifesteal ---
                if (lifeLevel >= 1 && (b.id !== -1)) { // Ensure it's a projectile (Shockwave shouldn't trigger this? Bullet ID check is weak but ok)
                    // "Lifesteal from dmg dealth of projectiles"
                    const heal = damageAmount * 0.03;

                    const maxHp = calcStat(player.hp);
                    const missing = maxHp - player.curHp;

                    if (heal <= missing) {
                        player.curHp += heal;
                    } else {
                        player.curHp = maxHp;
                        // Lvl 2: Overheal Shield Chunks (Dynamic Max HP Cap)
                        if (lifeLevel >= 2) {
                            const overflow = heal - missing;
                            let shieldGain = overflow * 2.0; // Double stolen health

                            if (!player.shieldChunks) player.shieldChunks = [];

                            const currentTotalShield = player.shieldChunks.reduce((s, c) => s + c.amount, 0);

                            const effMult = getHexMultiplier(state, 'ComLife');
                            const dynamicMaxShield = maxHp * effMult;

                            if (currentTotalShield < dynamicMaxShield) {
                                // Cap to dynamicMaxShield
                                shieldGain = Math.min(shieldGain, dynamicMaxShield - currentTotalShield);
                                player.shieldChunks.push({ amount: shieldGain, expiry: now + 3000 });
                            }
                        }
                    }
                }

                // Crit Visuals
                if (b.isCrit) {
                    e.critGlitchUntil = now + 100; // Set glitch timer (100ms)
                    state.critShake = Math.min(state.critShake + 8, 20); // Add heavy shake

                } else {
                    if (onEvent) onEvent('hit');
                }

                // ELITE SKILL: SQUARE THORNS (Blade Mail)
                if (e.isElite && e.shape === 'square' && damageAmount > 0) {
                    // Returns 3% of player's damage for every hit
                    let reflectDmg = damageAmount * 0.03;

                    if (reflectDmg > 0) {
                        // Thorns are reduced by armor
                        const armorValue = calcStat(player.arm);
                        const reduction = getDefenseReduction(armorValue);
                        reflectDmg *= (1 - reduction);

                        // Cap damage to never kill player (leave at least 1 HP)
                        const safeDmg = Math.min(reflectDmg, player.curHp - 1);

                        if (safeDmg > 0) {
                            // Check Shield First
                            if (player.shieldChunks && player.shieldChunks.length > 0) {
                                // Apply to chunks
                                let rem = safeDmg;
                                let absorbed = 0;
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
                                player.shieldChunks = player.shieldChunks.filter((c: any) => c.amount > 0);
                                const finalThornDmg = safeDmg - absorbed;

                                if (finalThornDmg > 0) {
                                    player.curHp -= finalThornDmg;
                                    player.damageTaken += finalThornDmg;
                                }
                            } else {
                                player.curHp -= safeDmg;
                                player.damageTaken += safeDmg;
                            }

                            if (onEvent) onEvent('player_hit', { dmg: safeDmg }); // Trigger red flash
                            spawnParticles(state, player.x, player.y, '#FF0000', 3); // Visual feedback

                            const displayDmg = Math.round(safeDmg);
                            if (displayDmg > 0) {
                                spawnFloatingNumber(state, player.x, player.y, displayDmg.toString(), '#ef4444', false);
                            }

                            // Explicit Death Check for Thorns
                            if (player.curHp <= 0) {
                                player.curHp = 0;
                                state.gameOver = true;
                                player.deathCause = 'Elite Square Thorns';
                                if (onEvent) onEvent('game_over');
                            }
                        }
                    }
                }

                // --- ComCrit Lvl 2: Execute ---
                if (critLevel >= 2 && !e.boss && e.hp < e.maxHp * GAME_CONFIG.SKILLS.EXECUTE_THRESHOLD) {
                    if (Math.random() < GAME_CONFIG.SKILLS.EXECUTE_CHANCE) {
                        const remainingHp = Math.round(e.hp);
                        e.hp = 0; // Execute
                        e.isExecuted = true; // Mark for no particles in handleEnemyDeath

                        // "Death Color" (Greyish) - Combined into one line for clarity.
                        // Shifted 10px to the right to clear the enemy model.
                        spawnFloatingNumber(state, e.x + 10, e.y - 10, `EXEC ${remainingHp}`, '#64748b', false);

                        playSfx('rare-kill');
                    }
                }

                // 2. Handle Rare Transitions (These may shift phase)
                if (e.isRare) {
                    if (e.rarePhase === 0) {
                        // PHASE 1 is now PROJECTILE IMMUNE (User Request)
                        // Can only be triggered by proximity (Player coming close)
                        b.hits.add(e.id); // Register hit so it doesn't try again next frame
                        // No phase change here
                    } else if (e.rarePhase === 1) {
                        // Stage 2 -> 3 (Orange -> Red)
                        e.rarePhase = 2;
                        e.rareTimer = state.gameTime;
                        e.palette = ['#EF4444', '#DC2626', '#B91C1C']; // Red Shift

                        // Phase 3 Stats
                        e.spd = state.player.speed * 1.4; // 1.4x Player Speed
                        e.invincibleUntil = Date.now() + 2000; // 2s Immunity

                        // Refresh Skills
                        e.shieldCd = 0; // Reset Barrels
                        e.panicCooldown = 0; // Reset Smoke (reusing panicCooldown for smoke CD)
                        e.lastDodge = 0; // Reset internal logic

                        // Smoke Screen Visual
                        spawnParticles(state, e.x, e.y, ['#FFFFFF', '#808080'], 150, 400, 100);
                        playSfx('smoke-puff');

                        e.hp = 1000; e.maxHp = 1000; // Ensure survival
                        e.knockback = { x: 0, y: 0 };
                        b.life = 0; // Consume bullet

                        // Don't die yet
                        if (onEvent) onEvent('hit');
                        return; // Skip death check
                    } else if (e.rarePhase === 2) {
                        // Phase 3: Check Immunity
                        if (e.invincibleUntil && Date.now() < e.invincibleUntil) {
                            spawnParticles(state, e.x, e.y, '#FFFFFF', 5); // Immune feedback
                            b.life = 0;
                            return;
                        }
                        // Vulnerable -> Death
                        e.hp = 0;
                    }
                }

                // 3. Common Death Check
                if (e.hp <= 0 && !e.dead) {
                    handleEnemyDeath(state, e, onEvent);
                }

                // 4. Bullet Removal
                if (b.pierce < 0 || b.life <= 0) {
                    bullets.splice(i, 1);
                    bulletRemoved = true;
                    break;
                }
            }
        }

        if (!bulletRemoved && b.life <= 0) {
            bullets.splice(i, 1);
        }
    }

    // --- ENEMY BULLETS ---
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i];
        eb.x += eb.vx;
        eb.y += eb.vy;
        eb.life--;

        if (!isInMap(eb.x, eb.y)) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // --- Collision with Zombies (They block bullets) ---
        let hitZombie = false;
        const nearbyZombies = state.spatialGrid.query(eb.x, eb.y, 50);
        for (const z of nearbyZombies) {
            if (z.isZombie && z.zombieState === 'active' && !z.dead) {
                const zDist = Math.hypot(z.x - eb.x, z.y - eb.y);
                if (zDist < z.size + 10) {
                    if (z.zombieHearts !== undefined) {
                        z.zombieHearts--;
                        spawnParticles(state, z.x, z.y, '#4ade80', 5);
                        playSfx('impact');
                        if (z.zombieHearts <= 0) {
                            z.dead = true;
                            z.hp = 0;
                            spawnParticles(state, z.x, z.y, '#4ade80', 15);
                        }
                    }
                    hitZombie = true;
                    break;
                }
            }
        }

        if (hitZombie) {
            enemyBullets.splice(i, 1);
            continue;
        }

        const distP = Math.hypot(player.x - eb.x, player.y - eb.y);
        if (distP < player.size + 10) {
            const armorValue = calcStat(player.arm);
            const armRedMult = 1 - getDefenseReduction(armorValue);

            const projRedRaw = calculateLegendaryBonus(state, 'proj_red_per_kill');
            const projRed = Math.min(80, projRedRaw); // Cap at 80% reduction
            const projRedMult = 1 - (projRed / 100);

            const rawDmg = eb.dmg;
            const dmgAfterArmor = rawDmg * armRedMult;
            const blockedByArmor = rawDmg - dmgAfterArmor;

            const finalProjDmg = dmgAfterArmor * projRedMult;
            const blockedByProj = dmgAfterArmor - finalProjDmg;

            player.damageBlockedByArmor += blockedByArmor;
            player.damageBlockedByProjectileReduc += blockedByProj;
            player.damageBlocked += (blockedByArmor + blockedByProj);

            const dmg = finalProjDmg;

            // Check Shield Chunks
            let absorbedDmg = 0;
            if (player.shieldChunks && player.shieldChunks.length > 0) {
                let remainingToAbsorb = dmg;
                for (let k = 0; k < player.shieldChunks.length; k++) {
                    const chunk = player.shieldChunks[k];
                    if (chunk.amount >= remainingToAbsorb) {
                        chunk.amount -= remainingToAbsorb;
                        absorbedDmg += remainingToAbsorb;
                        remainingToAbsorb = 0;
                        break;
                    } else {
                        absorbedDmg += chunk.amount;
                        remainingToAbsorb -= chunk.amount;
                        chunk.amount = 0;
                    }
                }
                player.shieldChunks = player.shieldChunks.filter(c => c.amount > 0);
            }

            const finalDmg = Math.max(0, dmg - absorbedDmg);
            player.damageBlockedByShield += absorbedDmg;
            player.damageBlocked += absorbedDmg;
            // User: "dmg blocked not working should show how much was blocked by armorm, Colision dmg reduction and projcetile reducitom"
            // I'll keep the breakdown separate as requested.

            if (dmg > 0) {
                if (finalDmg > 0) {
                    player.curHp -= finalDmg;
                    player.damageTaken += finalDmg;
                    if (onEvent) onEvent('player_hit', { dmg: finalDmg });

                    if (player.curHp <= 0 && !state.gameOver) {
                        state.gameOver = true;
                        player.deathCause = 'Enemy Projectile';
                        if (onEvent) onEvent('game_over');
                    }
                }
                spawnFloatingNumber(state, player.x, player.y, Math.round(dmg).toString(), '#ef4444', false);
            }

            enemyBullets.splice(i, 1);
            continue;
        }

        if (eb.life <= 0) {
            enemyBullets.splice(i, 1);
        }
    }

    // Shield Cleanup
    if (player.shieldChunks) {
        player.shieldChunks = player.shieldChunks.filter(c => now < c.expiry && c.amount > 0);
    }
}
