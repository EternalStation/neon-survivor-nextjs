
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function inspectSchema() {
    console.log('Inspecting game_runs table schema...');
    try {
        const columns = await sql`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'game_runs'
            ORDER BY ordinal_position;
        `;
        console.table(columns);

        const rowCount = await sql`SELECT COUNT(*) FROM game_runs`;
        console.log('Total runs:', rowCount[0].count);

        const latestRuns = await sql`SELECT id, score, survival_time, completed_at FROM game_runs ORDER BY completed_at DESC LIMIT 5`;
        console.log('Latest 5 runs:');
        console.table(latestRuns);

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectSchema();
