import type { GameState, Enemy, ShapeType } from './types';
import { playSfx } from './AudioLogic';
import { getLegendaryOptions, getHexLevel, calculateLegendaryBonus, getHexMultiplier } from './LegendaryLogic';
import { trySpawnMeteorite } from './LootLogic';
import { getChassisResonance } from './EfficiencyLogic';
import { spawnFloatingNumber } from './ParticleLogic';

export function handleEnemyDeath(state: GameState, e: Enemy, onEvent?: (event: string, data?: any) => void) {
    if (e.dead) return;
    e.dead = true; e.hp = 0;

    // Soul Reward Multipliers (Kill Count)
    let soulCount = 1;
    if (e.soulRewardMult !== undefined) {
        soulCount = e.soulRewardMult;
    } else if (e.isElite) {
        soulCount = 12; // Default elite = 12 kills
    }

    state.killCount += soulCount;
    state.score += soulCount;

    // --- EcoXP Lvl 2: Dust Extraction ---
    const ecoXp = state.moduleSockets.hexagons.find(h => h?.type === 'EcoXP');
    if (ecoXp && ecoXp.level >= 2) {
        const kl = ecoXp.killsAtLevel?.[2] ?? ecoXp.killsAtAcquisition;
        const killsSinceLvl2 = state.killCount - kl;
        const prevKillsSinceLvl2 = killsSinceLvl2 - soulCount;

        const currentThresholds = Math.floor(killsSinceLvl2 / 50);
        const prevThresholds = Math.floor(prevKillsSinceLvl2 / 50);

        if (currentThresholds > prevThresholds && killsSinceLvl2 > 0) {
            const multiplier = getHexMultiplier(state, 'EcoXP');
            const dustAmount = (currentThresholds - prevThresholds) * 1 * multiplier;
            state.player.dust += dustAmount;
            playSfx('socket-place');
            spawnFloatingNumber(state, e.x, e.y, `+${dustAmount.toFixed(1)} DUST`, '#a855f7', false);
        }
    }

    // --- CLASS MODIFIER: Hive-Mother Nanite Spread ---
    if (e.isInfected) {
        const resonance = getChassisResonance(state);
        const multiplier = 1 + resonance;
        const totalInfectionRate = 30 * multiplier;

        let jumpCount = Math.floor(totalInfectionRate / 100);
        const jumpChance = (totalInfectionRate % 100) / 100;
        if (Math.random() < jumpChance) jumpCount++;

        if (jumpCount > 0) {
            // Find multiple nearest enemies
            const candidates = state.enemies
                .filter(other => !other.dead && other.id !== e.id && !other.isFriendly)
                .map(other => ({
                    enemy: other,
                    dist: Math.hypot(other.x - e.x, other.y - e.y)
                }))
                .filter(c => c.dist < 400)
                .sort((a, b) => a.dist - b.dist);

            const targets = candidates.slice(0, jumpCount);

            targets.forEach(t => {
                const other = t.enemy;
                // Spawn Nanite Projectile
                state.bullets.push({
                    id: Math.random(),
                    x: e.x,
                    y: e.y,
                    vx: (Math.random() - 0.5) * 2, // Initial Jitter
                    vy: (Math.random() - 0.5) * 2,
                    dmg: e.infectionDmg || 5, // Carry over damage (already adjusted to per-tick in ProjectileLogic)
                    pierce: 1,
                    life: 120, // 2 Seconds to find target
                    isEnemy: false,
                    hits: new Set([e.id]),
                    color: '#4ade80',
                    size: 4,
                    isNanite: true,
                    naniteTargetId: other.id
                });
            });
        }
    }

    // Meteorite Drop Check
    trySpawnMeteorite(state, e.x, e.y);

    if (e.boss) {
        // Boss gives normal XP
        const xpBase = state.player.xp_per_kill.base;
        const hexFlat = calculateLegendaryBonus(state, 'xp_per_kill');
        const hexPct = calculateLegendaryBonus(state, 'xp_pct_per_kill');
        const totalFlat = xpBase + state.player.xp_per_kill.flat + hexFlat;
        const normalMult = 1 + (state.player.xp_per_kill.mult / 100);
        const hexMult = 1 + (hexPct / 100);
        const finalXp = totalFlat * normalMult * hexMult;
        state.player.xp.current += finalXp;

        state.legendaryOptions = getLegendaryOptions(state);
        state.showLegendarySelection = true;
        state.isPaused = true;
        playSfx('rare-spawn');
        if (onEvent) onEvent('boss_kill');
    }

    if (e.isRare && e.rareReal) {
        playSfx('rare-kill');
        state.rareSpawnActive = false;
        state.snitchCaught++;
        if (onEvent) onEvent('snitch_kill');
    } else {
        // Consolidated XP Logic (Matches PlayerLogic/ProjectileLogic advanced formula)
        let xpBase = state.player.xp_per_kill.base;

        if (e.xpRewardMult !== undefined) {
            xpBase *= e.xpRewardMult;
        } else if (e.isElite) {
            xpBase *= 14; // Elite = 14x XP
        }

        if (state.currentArena === 0) xpBase *= 1.15; // +15% XP in Economic Hex

        // Legendary XP Bonuses
        const hexFlat = calculateLegendaryBonus(state, 'xp_per_kill');
        const hexPct = calculateLegendaryBonus(state, 'xp_pct_per_kill');

        const totalFlat = xpBase + state.player.xp_per_kill.flat + hexFlat;
        const normalMult = 1 + (state.player.xp_per_kill.mult / 100);
        const hexMult = 1 + (hexPct / 100);

        const finalXp = totalFlat * normalMult * hexMult;

        state.player.xp.current += finalXp;
    }

    // Necromancy: Only ComLife Lvl 4+ (10% Chance) - No Infection recycling
    let shouldSpawnZombie = false;

    // Direct check for ComLife level to ensure robustness
    let comLifeLevel = 0;
    if (state.moduleSockets && state.moduleSockets.hexagons) {
        const hex = state.moduleSockets.hexagons.find(h => h && (h.type === 'ComLife'));
        if (hex) comLifeLevel = hex.level;
    }
    // Fallback
    if (comLifeLevel === 0) {
        comLifeLevel = getHexLevel(state, 'ComLife');
    }

    if (!e.isZombie && !e.boss && !e.isRare) {
        if (comLifeLevel >= 4) {
            if (Math.random() < 0.10) { // 10% Chance
                shouldSpawnZombie = true;
            }
        } else if (state.activeEvent?.type === 'necrotic_surge') {
            shouldSpawnZombie = true; // 100% chance during surge
        }
    }

    if (shouldSpawnZombie) {
        const isEventZombie = state.activeEvent?.type === 'necrotic_surge';
        const riseDelay = isEventZombie ? 3000 : 2000; // 3s for event, 2s for normal
        const speedBoost = isEventZombie ? 1.1 : 1.0; // 10% speed boost for event zombies

        if (isEventZombie) {
            // SCHEDULE HOSTILE EVENT ZOMBIE (Necrotic Surge)
            // Instead of spawning immediately, schedule it to spawn after 3 seconds
            if (!state.activeEvent!.pendingZombieSpawns) {
                state.activeEvent!.pendingZombieSpawns = [];
            }
            state.activeEvent!.pendingZombieSpawns.push({
                x: e.x,
                y: e.y,
                shape: e.shape as ShapeType,
                spd: e.spd * speedBoost,
                maxHp: e.maxHp,
                size: e.size,
                spawnAt: state.gameTime + (riseDelay / 1000) // Spawn after 3 seconds
            });
        } else {
            // FRIENDLY ZOMBIE (ComLife Legendary)
            const crimsonRiseDelay = 5000; // 5 Seconds per request
            const now = state.gameTime * 1000;
            const zombie: Enemy = {
                id: Math.random(),
                type: e.type,
                shape: e.shape, // Preserve shape of fallen enemy
                x: e.x, y: e.y,
                size: e.size,
                hp: Math.floor(e.maxHp * 0.5), // 50% HP
                maxHp: Math.floor(e.maxHp * 0.5),
                spd: 1.92 * speedBoost,
                boss: false,
                bossType: 0,
                bossAttackPattern: 0,
                lastAttack: 0,
                dead: false,
                shellStage: 0,
                zombieTimer: now + crimsonRiseDelay,
                zombieSpd: 1.92 * speedBoost,
                palette: ['#4ade80', '#22c55e', '#166534'], // Undead Green for ComLife
                pulsePhase: 0,
                rotationPhase: 0,
                isZombie: true,
                zombieState: 'dead', // Starts as corpse (Invisible/Waiting)
                vx: 0,
                vy: 0,
                knockback: { x: 0, y: 0 },
                frozen: 0,
                isElite: false,
                isRare: false,
                eraPalette: ['#4ade80', '#22c55e', '#166534'],
                fluxState: 0
            } as any;
            state.enemies.push(zombie);
        }
    }

    // Level Up Loop
    while (state.player.xp.current >= state.player.xp.needed) {
        state.player.xp.current -= state.player.xp.needed;
        state.player.level++;
        state.player.xp.needed *= 1.10;
        if (onEvent) onEvent('level_up');
    }
}
