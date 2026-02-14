
const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_8LsAfcdYH2pV@ep-noisy-silence-agmvt64g-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function checkHighScores() {
    try {
        const highTimeRuns = await sql`
            SELECT id, score, survival_time, completed_at 
            FROM game_runs 
            WHERE survival_time > 1000 
            ORDER BY survival_time DESC 
            LIMIT 10
        `;
        console.log('Runs survival_time > 1000:');
        console.table(highTimeRuns);
    } catch (error) {
        console.error('Error:', error);
    }
}

checkHighScores();
