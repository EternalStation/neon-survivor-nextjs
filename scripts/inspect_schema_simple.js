const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function inspectSchema() {
    console.log('Inspecting game_runs table schema...');
    try {
        const columns = await sql`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'game_runs'
            ORDER BY ordinal_position;
        `;
        
        columns.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectSchema();
