
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function findTarashevich() {
    console.log('Searching for player Tarashevich and their runs...');
    try {
        const player = await sql`SELECT id, username FROM players WHERE username ILIKE 'Tarashevich' OR username ILIKE '%Tarashevich%'`;
        console.log('Player found:', player);

        if (player.length > 0) {
            const playerId = player[0].id;
            const runs = await sql`
                SELECT id, score, survival_time, completed_at, death_cause, patch_version 
                FROM game_runs 
                WHERE player_id = ${playerId} 
                ORDER BY completed_at DESC
            `;
            console.log(`Runs for player ${player[0].username}:`);
            console.table(runs);
        } else {
            console.log('Player Tareshevich not found.');
        }

        // Also check if there are any runs with ~2400 seconds (40 min) regardless of player
        console.log('\nChecking for any runs around 2400s (40 min) survival time...');
        const longRuns = await sql`
            SELECT gr.id, p.username, gr.score, gr.survival_time, gr.completed_at, gr.death_cause
            FROM game_runs gr
            JOIN players p ON gr.player_id = p.id
            WHERE gr.survival_time >= 2000
            ORDER BY gr.survival_time DESC
        `;
        console.table(longRuns);

    } catch (error) {
        console.error('Error:', error);
    }
}

findTarashevich();
