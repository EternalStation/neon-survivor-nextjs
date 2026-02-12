import type { GameState, Enemy, MapPOI, Bullet } from '../core/types';
import { spawnFloatingNumber, spawnParticles } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { calcStat } from '../utils/MathUtils';

const TURRET_RANGE = 800;
const TURRET_BASE_COST = 10;
const TURRET_FIRE_RATE = 1 / 4; // 4 shots per second (Up from 8 for better damage number visibility)
const TURRET_DURATION = 30;
const TURRET_COOLDOWN = 60;
const REPAIR_SPEED = 50; // 2 seconds (50%/sec)

export function updateTurrets(state: GameState, step: number) {
    const turrets = state.pois.filter(p => p.type === 'turret' && p.arenaId === state.currentArena);

    turrets.forEach(turret => {
        // 1. Cooldown Management
        if (turret.cooldown > 0) {
            turret.cooldown -= step;
            if (turret.cooldown < 0) turret.cooldown = 0;
        }

        // 2. Interaction (Repair/Activate)
        if (!turret.active && turret.cooldown <= 0) {
            const dToPlayer = Math.hypot(state.player.x - turret.x, state.player.y - turret.y);

            // Interaction Zone: 120px radius
            if (dToPlayer < turret.radius) {
                // Determine Cost
                const uses = turret.turretUses || 0;
                const cost = TURRET_BASE_COST * Math.pow(2, uses);
                turret.turretCost = cost; // Store for renderer

                if (state.player.dust >= cost) {
                    // Increase repair progress
                    turret.activationProgress += REPAIR_SPEED * step;

                    if (turret.activationProgress >= 100) {
                        // Dedust Cost & Activate
                        state.player.dust -= cost;
                        turret.active = true;
                        turret.activeDuration = 0;
                        turret.activationProgress = 0;
                        turret.turretUses = uses + 1;
                        playSfx('power-up');
                        spawnFloatingNumber(state, turret.x, turret.y, "TURRET ONLINE", '#F59E0B', true);
                        spawnParticles(state, turret.x, turret.y, '#F59E0B', 20);
                    }
                }
            } else {
                // Decay progress if player leaves
                if (turret.activationProgress > 0) {
                    turret.activationProgress -= REPAIR_SPEED * step * 2;
                    if (turret.activationProgress < 0) turret.activationProgress = 0;
                }
            }
        }

        // 3. Active State (Shooting)
        if (turret.active) {
            turret.activeDuration += step;

            // Check Duration Expiry
            if (turret.activeDuration >= TURRET_DURATION) {
                turret.active = false;
                turret.cooldown = TURRET_COOLDOWN;
                playSfx('power-down'); // Shutdown sound
                return;
            }

            // Fire Logic
            // Specific Variant Logic
            const variant = turret.turretVariant || 'fire';

            if (variant === 'heal') {
                // HEAL TURRET: Link to player if in range (Visual handled in renderer)
                const dToPlayer = Math.hypot(state.player.x - turret.x, state.player.y - turret.y);

                // Heal Range (Keep standard range or slightly smaller? Let's use standard)
                if (dToPlayer <= TURRET_RANGE) {
                    // Heal 5% + 2% per extra use
                    const uses = turret.turretUses || 1;
                    const healPercent = 0.05 + (uses - 1) * 0.02;
                    const maxHp = calcStat(state.player.hp);
                    const healAmount = (maxHp * healPercent) * step;
                    state.player.curHp = Math.min(maxHp, state.player.curHp + healAmount);

                    // Visual feedback occasionally?
                    if (Math.random() < 0.1) {
                        spawnFloatingNumber(state, state.player.x, state.player.y - 40, `+${Math.ceil(healAmount / step)}`, '#4ade80', false);
                    }
                }
                return; // No shooting
            }

            // SHOOTING TURRETS (Fire / Ice)
            const now = state.gameTime;
            const lastShot = turret.lastShot || 0;

            if (now - lastShot >= TURRET_FIRE_RATE) {
                // Find Target
                let bestTarget: Enemy | null = null;
                let minDist = TURRET_RANGE;

                const potentialTargets = state.spatialGrid.query(turret.x, turret.y, TURRET_RANGE);

                for (const enemy of potentialTargets) {
                    if (enemy.dead || enemy.isFriendly) continue;
                    const d = Math.hypot(turret.x - enemy.x, turret.y - enemy.y);
                    if (d < minDist) {
                        minDist = d;
                        bestTarget = enemy;
                    }
                }

                if (bestTarget) {
                    const angle = Math.atan2(bestTarget.y - turret.y, bestTarget.x - turret.x);
                    turret.rotation = angle;
                    turret.lastShot = now;

                    const minutes = state.gameTime / 60;
                    const estBaseHP = 60 * Math.pow(1.2, minutes);

                    const uses = turret.turretUses || 1;
                    const scale = Math.pow(2, uses - 1);

                    if (variant === 'ice') {
                        // ICE THROWER: Mist effect in a cone
                        // Consolidate damage into fewer ticks to prevent "0" damage strings
                        const damagePerSecondMult = 0.05 * scale;
                        const damagePerShot = Math.ceil(estBaseHP * damagePerSecondMult * TURRET_FIRE_RATE);

                        // Fire 1 "Core" damage particle and 4 visual-only particles
                        const coneAngle = 30 * Math.PI / 180;
                        for (let i = 0; i < 5; i++) {
                            const spread = (Math.random() - 0.5) * coneAngle;
                            const isCore = i === 0;
                            spawnTurretBullet(state, turret.x, turret.y, angle + spread, isCore ? damagePerShot : 0, 'ice', !isCore);
                        }
                    } else {
                        // FIRE TURRET: 15% * scale Dmg, Infinite Pierce, Dual Trace
                        const damage = Math.ceil(estBaseHP * 0.15 * scale);
                        const offset = 10;
                        spawnTurretBullet(state, turret.x + Math.cos(angle + Math.PI / 2) * offset, turret.y + Math.sin(angle + Math.PI / 2) * offset, angle, damage, 'fire');
                        spawnTurretBullet(state, turret.x + Math.cos(angle - Math.PI / 2) * offset, turret.y + Math.sin(angle - Math.PI / 2) * offset, angle, damage, 'fire');
                    }
                }
            }
        }
    });
}

function spawnTurretBullet(state: GameState, x: number, y: number, angle: number, dmg: number, variant: string, isVisualOnly: boolean = false) {
    const isIce = variant === 'ice';
    const spd = isIce ? (10 + Math.random() * 5) : 25; // Ice mist is slower, Fire is fast trace

    const bullet: Bullet = {
        id: Math.random(),
        x,
        y,

        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        dmg,
        pierce: 999999, // Both pierce
        life: isIce ? (60 + Math.random() * 20) : 60, // Mist lasts longer for range
        isEnemy: false,
        hits: new Set(),
        size: isIce ? (15 + Math.random() * 20) : 2, // Mist is much larger
        color: isIce ? '#bae6fd' : '#F59E0B',
        isTrace: !isIce,
        isMist: isIce,
        slowPercent: isIce ? 0.7 : undefined, // 70% slow
        freezeDuration: isIce ? 3.0 : undefined, // 3s Slow Duration
        spawnTime: Date.now(),
        isVisualOnly
    };
    state.bullets.push(bullet);
}
