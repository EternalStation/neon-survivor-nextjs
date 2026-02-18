const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function testOverflow() {
    console.log('Testing numeric score overflow with String input...');

    // 1. Quintillion+ score (exceeds standard 32-bit int, fits in BigInt but we want to test STRING)
    // 9 Quintillion is max BigInt (9e18). Let's go bigger.
    // 100 Quintillion = 1e20.
    const massiveScoreStr = "123456789012345678901234567890"; // 30 digits -> 123 Octillion? No, 1e29.

    console.log(`Inserting score: ${massiveScoreStr}`);

    try {
        const result = await sql`
            INSERT INTO game_runs (
                player_id, score, survival_time, kills, boss_kills, class_used, patch_version,
                damage_dealt, damage_taken, damage_blocked, damage_blocked_armor, damage_blocked_collision,
                damage_blocked_projectile, damage_blocked_shield, radar_counts, meteorites_collected,
                portals_used, arena_times, legendary_hexes, hex_levelup_order, snitches_caught, 
                death_cause, final_stats, blueprints
            ) VALUES (
                1, ${massiveScoreStr}, 60, 100, 1, 'tester', '1.0.2',
                0, 0, 0, 0, 0, 0, 0, '{}', 0, 0, '{}', '[]', '[]', 0, 'TEST_OVERFLOW', '{}', '[]'
            )
            RETURNING id, score
        `;

        const run = result[0];
        console.log('Inserted run ID:', run.id);
        console.log('Returned score (raw):', run.score);
        console.log('Returned score type:', typeof run.score);

        if (run.score === massiveScoreStr) {
            console.log('PASS: Score matches input string exactly.');
        } else {
            console.log(`FAIL: Score mismatch. Expected ${massiveScoreStr}, got ${run.score}`);
        }

        // Cleanup
        await sql`DELETE FROM game_runs WHERE id = ${run.id}`;
        console.log('Test run cleaned up.');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testOverflow();
