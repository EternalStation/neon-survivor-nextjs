const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function migrate() {
    console.log('Starting migration: ALTER game_runs score -> NUMERIC');
    try {
        // Check current type first (optional, but good for logs)
        const cols = await sql`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'game_runs' AND column_name = 'score'
        `;
        console.log('Current score type:', cols[0]?.data_type);

        // Perform migration
        // USING score::numeric ensures data is converted correctly
        await sql`ALTER TABLE game_runs ALTER COLUMN score TYPE NUMERIC USING score::numeric`;

        console.log('Migration successful: score is now NUMERIC.');

        // Verify
        const newCols = await sql`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'game_runs' AND column_name = 'score'
        `;
        console.log('New score type:', newCols[0]?.data_type);

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
