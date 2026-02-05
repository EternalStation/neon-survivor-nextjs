import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// DELETE /api/runs/[id] - Delete a specific run
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    console.log('DELETE request for run ID:', id);
    try {
        const user = authenticateRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const runId = parseInt(id);
        if (isNaN(runId)) {
            return NextResponse.json(
                { error: 'Invalid run ID' },
                { status: 400 }
            );
        }

        // Verify owner before deletion
        const run = await sql`
            SELECT player_id FROM game_runs WHERE id = ${runId}
        `;

        if (run.length === 0) {
            return NextResponse.json(
                { error: 'Record not found' },
                { status: 404 }
            );
        }

        console.log('Found run for player:', run[0].player_id, 'CurrentUser:', user.id);
        if (run[0].player_id !== user.id) {
            return NextResponse.json(
                { error: 'Access denied: You do not own this record' },
                { status: 403 }
            );
        }

        // Delete the run
        await sql`
            DELETE FROM game_runs WHERE id = ${runId}
        `;

        return NextResponse.json({
            message: 'Record successfully wiped from Neon Link'
        });
    } catch (error) {
        console.error('Delete run error:', error);
        return NextResponse.json(
            { error: 'Failed to wipe record' },
            { status: 500 }
        );
    }
}
