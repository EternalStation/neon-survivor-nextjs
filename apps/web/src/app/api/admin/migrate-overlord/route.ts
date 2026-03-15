export const dynamic = 'force-dynamic';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const sql = neon(process.env.DATABASE_URL!);

        // 1. Update exact matches
        console.log('Migrating exact Abomination matches...');
        await sql`UPDATE game_runs SET death_cause = 'Overlord' WHERE death_cause = 'Abomination'`;
        await sql`UPDATE game_runs SET death_cause = 'Overlord Burn' WHERE death_cause = 'Abomination Burn'`;

        // 2. Update partial matches (if any like "Abomination (Lvl X)")
        console.log('Migrating partial Abomination matches...');
        await sql`UPDATE game_runs SET death_cause = REPLACE(death_cause, 'Abomination', 'Overlord') WHERE death_cause LIKE '%Abomination%'`;

        return NextResponse.json({ success: true, message: 'Leaderboard migration completed: Abomination -> Overlord' });
    } catch (error: any) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
