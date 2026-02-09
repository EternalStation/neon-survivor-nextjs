import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const LEADERBOARD_FIELDS = `
  gr.id,
  gr.score,
  gr.survival_time,
  gr.kills,
  gr.boss_kills,
  gr.class_used,
  gr.completed_at,
  p.username,
  gr.legendary_hexes,
  gr.arena_times,
  gr.damage_dealt,
  gr.damage_taken,
  gr.damage_blocked,
  gr.damage_blocked_armor,
  gr.damage_blocked_collision,
  gr.damage_blocked_projectile,
  gr.damage_blocked_shield,
  gr.radar_counts,
  gr.portals_used,
  gr.hex_levelup_order,
  gr.snitches_caught,
  gr.death_cause,
  gr.patch_version,
  gr.final_stats
`;


// GET /api/leaderboard/global
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);


    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await sql`
      SELECT 
        gr.id,
        gr.score,
        gr.survival_time,
        gr.kills,
        gr.boss_kills,
        gr.class_used,
        gr.completed_at,
        p.username,
        gr.legendary_hexes,
        gr.arena_times,
        gr.damage_dealt,
        gr.damage_taken,
        gr.damage_blocked,
        gr.damage_blocked_armor,
        gr.damage_blocked_collision,
        gr.damage_blocked_projectile,
        gr.damage_blocked_shield,
        gr.radar_counts,
        gr.portals_used,
        gr.hex_levelup_order,
        gr.snitches_caught,
        gr.death_cause,
        gr.patch_version,
        gr.final_stats,
        gr.blueprints
      FROM game_runs gr

      JOIN players p ON gr.player_id = p.id
      ORDER BY gr.survival_time DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      leaderboard: results,
      count: results.length,
      offset,
    });
  } catch (error) {
    console.error('Global leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
