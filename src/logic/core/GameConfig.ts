
// Game Balance Configuration

export const GAME_CONFIG = {
    // --- PLAYER ---
    PLAYER: {
        HITBOX_RADIUS: 64,
        WALL_BOUNCE_SPEED: 37.5,
        WALL_DAMAGE_PERCENT: 0.10, // 10% max HP
        ARMOR_CONSTANT: 171, // Precisely tuned: ~35% reduction at 100 armor, caps at 95%
        HISTORY_LENGTH: 60,
        KNOCKBACK_DECAY: 0.85,
        SPAWN_DURATION: 2.1, // 30% faster than 3.0s
    },

    // --- ENEMIES ---
    ENEMY: {
        BASE_SPAWN_RATE: 1.5,
        SPAWN_RATE_PER_MINUTE: 0.1,
        BOSS_SPAWN_INTERVAL: 120, // Seconds

        // Rare / Special
        SNITCH_HP: 1,
        SNITCH_SPEED_MULT: 0.7, // Relative to Player Speed (0.7x)

        // Merge Logic
        MERGE_TIMER: 3, // Seconds
        MERGE_THRESHOLD_PENTAGON: 5,
        MERGE_THRESHOLD_DEFAULT: 10,
        MERGE_HP_MULT_PENTAGON: 6,
        MERGE_HP_MULT_DEFAULT: 12,
        MERGE_XP_MULT_PENTAGON: 7,
        MERGE_XP_MULT_DEFAULT: 14,
        MERGE_SIZE_MULT: 1.55,
        MERGE_SOUL_MULT_PENTAGON: 5,
        MERGE_SOUL_MULT_DEFAULT: 10,

        // Contact Damage
        MINION_DAMAGE_RATIO: 0.15,
        MINION_STUN_DAMAGE_RATIO: 0.03,

        // New Scaled Collision Logic (Power Scaling)
        // Damage = HP ^ COLLISION_POWER_SCALING
        COLLISION_POWER_SCALING: 0.6,
    },

    // --- SKILLS & LEGENDARIES ---
    SKILLS: {
        // ComWave (Sonic Wave)
        WAVE_SHOTS_REQUIRED: 15,
        WAVE_RANGE: {
            LVL1: 1500,
            LVL3: 1500
        },
        WAVE_DAMAGE_MULT: {
            LVL1: 2.0,
            LVL3: 3.5
        },
        WAVE_SPEED: 45,
        WAVE_COOLDOWN: 30, // Seconds
        WAVE_COOLDOWN_LVL4: 20, // Seconds


        PUDDLE_COOLDOWN: 25,
        EPI_COOLDOWN: 30,
        MONOLITH_COOLDOWN: 30,
        CHRONO_DEVOURER_COOLDOWN: 15,
        KINETIC_ZAP_COOLDOWN: 5.0,
        BLACKHOLE_COOLDOWN: 10,
        COSMIC_COOLDOWN: 8,
        STORM_CIRCLE_MAX_CHARGE: 10,
        STORM_CIRCLE_RECHARGE_DELAY: 3,
        ORBITAL_VORTEX_COOLDOWN: 20,
        ORBITAL_VORTEX_DURATION: 2,
        ORBITAL_VORTEX_RADIUS: 800,
        ORBITAL_VORTEX_SPEED_MULT: 4.0,

        SANDBOX_COOLDOWN: 15,
        SANDBOX_DURATION: 3,
        SANDBOX_RADIUS: 220,

        // ComCrit (Critical Hit)
        CRIT_BASE_CHANCE: 0.15,
        CRIT_BASE_MULT: 2.0,
        DEATH_MARK_DURATION: 3, // Seconds
        DEATH_MARK_COOLDOWN: 10,
        DEATH_MARK_MULT: 3.0,
        EXECUTE_THRESHOLD: 0.5,
        EXECUTE_CHANCE: 0.07,
        BOSS_EXECUTE_THRESHOLD: 0.4,
        BOSS_EXECUTE_CHANCE: 0.03,

        // ComLife (Lifesteal)
        LIFESTEAL_PERCENT: 0.03,
        MAX_HP_DMG_PERCENT: 0.02, // Lvl 3
        OVERHEAL_SHIELD_MULT: 2.0,

        // Square Thorns (Elite)
        REFLECT_DAMAGE_PERCENT: 0.002, // 0.2% Max HP
    },

    // --- DASH ---
    DASH: {
        DISTANCE: 240,
        DURATION: 0.18,
        COOLDOWN: 4.0,
    },

    // --- PROJECTILES ---
    PROJECTILE: {
        PLAYER_BULLET_SPEED: 20,
        PLAYER_BULLET_LIFE: 140,
        PLAYER_BULLET_SIZE: 4,

        ENEMY_BULLET_SPEED: 10,
        ENEMY_BULLET_LIFE: 300,
        ENEMY_BULLET_SIZE: 6,
    }
};
