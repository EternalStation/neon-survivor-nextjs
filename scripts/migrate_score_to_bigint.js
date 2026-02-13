const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function migrate() {
    console.log('Migrating game_runs.score to BIGINT...');
    try {
        await sql`ALTER TABLE game_runs ALTER COLUMN score TYPE bigint`;
        console.log('Migration successful: score column is now BIGINT.');

        // Verify
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'game_runs' AND column_name = 'score';
        `;
        console.log('Verification:', columns);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
