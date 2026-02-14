const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function testOverflow() {
    console.log('Testing score overflow...');
    try {
        // 1. Get a valid player ID
        const players = await sql`SELECT id FROM players LIMIT 1`;
        if (players.length === 0) {
            console.error('No players found to test with.');
            return;
        }
        const playerId = players[0].id;
        console.log('Using player ID:', playerId);

        // 2. Insert a run with a massive score (3 billion > 2.14 billion)
        const massiveScore = 3000000000;

        const result = await sql`
            INSERT INTO game_runs (
                player_id, score, survival_time, kills, boss_kills, class_used,
                patch_version, damage_dealt, damage_taken, damage_blocked,
                damage_blocked_armor, damage_blocked_collision, damage_blocked_projectile,
                damage_blocked_shield, radar_counts, meteorites_collected, portals_used,
                arena_times, legendary_hexes, hex_levelup_order, snitches_caught, death_cause, final_stats, blueprints
            ) VALUES (
                ${playerId}, ${massiveScore}, 100, 10, 0,
                'TEST_CLASS', '1.0.0', 0, 0,
                0, 0, 0, 0, 0,
                '{}', 0, 0, '{}', '[]', '[]', 0, 'TEST_OVERFLOW', '{}', '[]'
            )
            RETURNING id, score;
        `;

        const run = result[0];
        console.log('Insert successful!');
        console.log('Run ID:', run.id);
        console.log('Score returned:', run.score);
        console.log('Score type:', typeof run.score);

        if (run.score == massiveScore) {
            console.log('PASS: Score matches input.');
        } else {
            console.log('FAIL: Score mismatch.');
        }

        // Cleanup
        await sql`DELETE FROM game_runs WHERE id = ${run.id}`;
        console.log('Cleanup successful.');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testOverflow();
