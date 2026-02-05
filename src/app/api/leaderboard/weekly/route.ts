import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/leaderboard/weekly
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const results = await sql`
      SELECT 
        gr.id, gr.score, gr.survival_time, gr.kills, gr.boss_kills,
        gr.class_used, gr.completed_at, p.username, gr.legendary_hexes,
        gr.arena_times, gr.damage_dealt, gr.damage_taken, gr.damage_blocked,
        gr.radar_counts, gr.portals_used, gr.hex_levelup_order,
        gr.snitches_caught, gr.death_cause, gr.patch_version
      FROM game_runs gr
      JOIN players p ON gr.player_id = p.id
      WHERE gr.completed_at >= DATE_TRUNC('week', CURRENT_DATE)
      ORDER BY gr.survival_time DESC
      LIMIT ${limit}
    `;

        return NextResponse.json({
            leaderboard: results,
            count: results.length,
            period: 'weekly',
        });
    } catch (error) {
        console.error('Weekly leaderboard error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch weekly leaderboard' },
            { status: 500 }
        );
    }
}
