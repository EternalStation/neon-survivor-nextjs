import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// DELETE /api/runs/me/all - Clear all runs for the current user
export async function DELETE(request: NextRequest) {
    console.log('DELETE request for ALL runs of current user');
    try {
        const user = authenticateRequest(request);
        if (!user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Delete all runs for this user
        await sql`
            DELETE FROM game_runs WHERE player_id = ${user.id}
        `;

        return NextResponse.json({
            message: `Successfully purged your history from Neon Link`
        });
    } catch (error) {
        console.error('Purge history error:', error);
        return NextResponse.json(
            { error: 'Failed to purge history' },
            { status: 500 }
        );
    }
}
