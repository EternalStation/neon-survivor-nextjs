import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkSchema() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error('DATABASE_URL not found');
        return;
    }
    const sql = neon(databaseUrl);
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'game_runs'
        `;
        console.log('Columns in game_runs:');
        console.table(columns);
    } catch (err) {
        console.error('Error checking schema:', err);
    }
}

checkSchema();
