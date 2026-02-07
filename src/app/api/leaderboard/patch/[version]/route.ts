import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ version: string }> }
) {
    try {
        const { version } = await context.params;
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const results = await sql`
            SELECT 
                gr.id, gr.score, gr.survival_time, gr.kills, gr.boss_kills,
                gr.class_used, gr.completed_at, p.username, gr.legendary_hexes,
                gr.arena_times, gr.damage_dealt, gr.damage_taken, gr.damage_blocked,
                gr.radar_counts, gr.portals_used, gr.hex_levelup_order,
                gr.snitches_caught, gr.death_cause, gr.patch_version, gr.final_stats
            FROM game_runs gr
            JOIN players p ON gr.player_id = p.id
            WHERE gr.patch_version = ${version}
            ORDER BY gr.survival_time DESC
            LIMIT ${limit}
        `;

        return NextResponse.json({
            leaderboard: results,
            count: results.length,
            version
        });
    } catch (error) {
        console.error('Patch leaderboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch patch leaderboard' },
            { status: 500 }
        );
    }
}
