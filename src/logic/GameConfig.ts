
// Game Balance Configuration

export const GAME_CONFIG = {
    // --- PLAYER ---
    PLAYER: {
        BASE_SPEED: 5.5, // Derived from PlayerLogic (implicit) but good to explicit if needed
        HITBOX_RADIUS: 64,
        WALL_BOUNCE_SPEED: 37.5,
        WALL_DAMAGE_PERCENT: 0.10, // 10% max HP
        ARMOR_CONSTANT: 171, // Precisely tuned: ~35% reduction at 100 armor, caps at 95%
        HISTORY_LENGTH: 60,
        KNOCKBACK_DECAY: 0.85,
    },

    // --- ENEMIES ---
    ENEMY: {
        BASE_SPAWN_RATE: 1.5,
        SPAWN_RATE_PER_MINUTE: 0.1,
        BOSS_SPAWN_INTERVAL: 120, // Seconds

        // Rare / Special
        SNITCH_HP: 1,
        SNITCH_SPEED_MULT: 0.8, // Relative to Player Speed (0.8x)

        // Merge Logic
        MERGE_TIMER: 3, // Seconds
        MERGE_THRESHOLD_PENTAGON: 5,
        MERGE_THRESHOLD_DEFAULT: 10,
        MERGE_HP_MULT_PENTAGON: 6,
        MERGE_HP_MULT_DEFAULT: 12,
        MERGE_XP_MULT_PENTAGON: 7,
        MERGE_XP_MULT_DEFAULT: 14,
        MERGE_SIZE_MULT: 1.2,
        MERGE_SOUL_MULT_PENTAGON: 6,
        MERGE_SOUL_MULT_DEFAULT: 12,

        // Contact Damage
        CONTACT_DAMAGE_PERCENT: 0.15, // 15% Max HP
        MINION_DAMAGE_RATIO: 0.15,
        MINION_STUN_DAMAGE_RATIO: 0.03,
    },

    // --- SKILLS & LEGENDARIES ---
    SKILLS: {
        // ComWave (Sonic Wave)
        WAVE_SHOTS_REQUIRED: 15,
        WAVE_RANGE: {
            LVL1: 450,
            LVL3: 600
        },
        WAVE_DAMAGE_MULT: {
            LVL1: 0.75,
            LVL3: 1.25
        },
        WAVE_SPEED: 25,

        // ComCrit (Critical Hit)
        CRIT_BASE_CHANCE: 0.15,
        CRIT_BASE_MULT: 2.0,
        CRIT_LVL4_CHANCE: 0.25,
        CRIT_LVL4_MULT: 3.5,
        DEATH_MARK_DURATION: 3, // Seconds
        DEATH_MARK_COOLDOWN: 10,
        DEATH_MARK_MULT: 3.0,
        EXECUTE_THRESHOLD: 0.5, // 50% HP
        EXECUTE_CHANCE: 0.10,

        // ComLife (Lifesteal)
        LIFESTEAL_PERCENT: 0.03,
        MAX_HP_DMG_PERCENT: 0.02, // Lvl 3
        OVERHEAL_SHIELD_MULT: 2.0,

        // Square Thorns (Elite)
        REFLECT_DAMAGE_PERCENT: 0.002, // 0.2% Max HP
    },

    // --- PROJECTILES ---
    PROJECTILE: {
        PLAYER_BULLET_SPEED: 12,
        PLAYER_BULLET_LIFE: 140,
        PLAYER_BULLET_SIZE: 4,

        ENEMY_BULLET_SPEED: 6,
        ENEMY_BULLET_LIFE: 300,
        ENEMY_BULLET_SIZE: 6,
    }
};
