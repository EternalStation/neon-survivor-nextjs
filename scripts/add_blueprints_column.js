const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

async function main() {
    console.log('Connecting to database and adding blueprints column...');
    try {
        await sql`
      ALTER TABLE game_runs
      ADD COLUMN IF NOT EXISTS blueprints JSONB DEFAULT '[]'::jsonb;
    `;
        console.log('Column "blueprints" added successfully to "game_runs" table.');
    } catch (error) {
        console.error('Error executing SQL:', error);
    }
}

main();
