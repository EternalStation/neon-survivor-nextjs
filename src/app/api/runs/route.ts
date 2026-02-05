import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// POST /api/runs - Submit a new game run
export async function POST(request: NextRequest) {
    try {
        const user = authenticateRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            score,
            survivalTime,
            kills,
            bossKills,
            classUsed,
            patchVersion,
            damageDealt,
            damageTaken,
            damageBlocked,
            damageBlockedArmor,
            damageBlockedCollision,
            damageBlockedProjectile,
            damageBlockedShield,
            radarCounts,
            meteoritesCollected,
            portalsUsed,
            arenaTimes,
            legendaryHexes,
            hexLevelupOrder,
            snitchesCaught,
            deathCause,
        } = body;

        // Validation
        if (
            score === undefined ||
            !survivalTime ||
            kills === undefined ||
            !classUsed ||
            !patchVersion
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Insert run
        const result = await sql`
      INSERT INTO game_runs (
        player_id, score, survival_time, kills, boss_kills, class_used,
        patch_version, damage_dealt, damage_taken, damage_blocked,
        damage_blocked_armor, damage_blocked_collision, damage_blocked_projectile,
        damage_blocked_shield, radar_counts, meteorites_collected, portals_used,
        arena_times, legendary_hexes, hex_levelup_order, snitches_caught, death_cause
      ) VALUES (
        ${user.id}, ${score}, ${survivalTime}, ${kills}, ${bossKills || 0},
        ${classUsed}, ${patchVersion}, ${damageDealt || 0}, ${damageTaken || 0},
        ${damageBlocked || 0}, ${damageBlockedArmor || 0}, ${damageBlockedCollision || 0},
        ${damageBlockedProjectile || 0}, ${damageBlockedShield || 0},
        ${JSON.stringify(radarCounts || {})}, ${meteoritesCollected || 0},
        ${portalsUsed || 0}, ${JSON.stringify(arenaTimes || { 0: 0, 1: 0, 2: 0 })},
        ${JSON.stringify(legendaryHexes || [])}, ${JSON.stringify(hexLevelupOrder || [])},
        ${snitchesCaught || 0}, ${deathCause || 'Unknown'}
      )
      RETURNING id, score, completed_at, survival_time
    `;

        const run = result[0];

        // Calculate rank
        const rankResult = await sql`
      SELECT COUNT(*) + 1 as rank
      FROM game_runs
      WHERE survival_time > ${run.survival_time}
    `;

        return NextResponse.json(
            {
                message: 'Run submitted successfully',
                run: {
                    id: run.id,
                    score: run.score,
                    completedAt: run.completed_at,
                    rank: rankResult[0].rank,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Submit run error:', error);
        return NextResponse.json(
            { error: 'Failed to submit run' },
            { status: 500 }
        );
    }
}
