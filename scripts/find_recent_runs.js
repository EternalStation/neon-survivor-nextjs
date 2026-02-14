
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function findRecentRuns() {
    console.log('Searching for all recent runs in the last 2 hours...');
    try {
        const recentRuns = await sql`
            SELECT gr.id, p.username, gr.score, gr.survival_time, gr.completed_at, gr.death_cause, gr.patch_version
            FROM game_runs gr
            LEFT JOIN players p ON gr.player_id = p.id
            WHERE gr.completed_at > NOW() - INTERVAL '4 hours'
            ORDER BY gr.completed_at DESC
        `;
        console.table(recentRuns);

        console.log('\nSearching for any player with "tarashevich" or "tareshevich" in name...');
        const players = await sql`SELECT id, username FROM players WHERE username ILIKE '%tarashevich%' OR username ILIKE '%tareshevich%'`;
        console.log('Matching players:', players);

        if (players.length > 0) {
            for (const p of players) {
                const runs = await sql`
                    SELECT id, score, survival_time, completed_at, death_cause, patch_version 
                    FROM game_runs 
                    WHERE player_id = ${p.id} 
                    ORDER BY completed_at DESC 
                    LIMIT 5
                `;
                console.log(`Latest 5 runs for ${p.username}:`);
                console.table(runs);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

findRecentRuns();
