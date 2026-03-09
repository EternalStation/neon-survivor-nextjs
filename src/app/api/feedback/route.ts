export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Initialize table if it doesn't exist
const initializeTable = async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS feedbacks (
            id SERIAL PRIMARY KEY,
            player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
            username VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL, -- 'bug' | 'suggestion'
            message TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending', -- 'Pending' | 'Reviewed' | 'Fixed' | 'Implemented' | 'Considered'
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
};

// GET /api/feedback?username=xyz (optional filter, returns all if admin/no filter for now)
export async function GET(request: NextRequest) {
    try {
        await initializeTable();

        const { searchParams } = new URL(request.url);
        const usernameParam = searchParams.get('username');

        let result;
        if (usernameParam) {
            result = await sql`
                SELECT * FROM feedbacks
                WHERE username = ${usernameParam}
                ORDER BY created_at DESC
            `;
        } else {
            result = await sql`
                SELECT * FROM feedbacks
                ORDER BY created_at DESC
            `;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to fetch feedbacks:', error);
        return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
    }
}

// POST /api/feedback
export async function POST(request: NextRequest) {
    try {
        await initializeTable();

        const authHeader = request.headers.get('authorization');
        let playerId = null;
        let username = 'Anonymous';

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            if (decoded) {
                playerId = decoded.id;
                username = decoded.username;
            }
        } else {
            // Optional: require auth
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, message } = body;

        if (!type || !message) {
            return NextResponse.json({ error: 'Type and message required' }, { status: 400 });
        }

        if (message.length > 500) {
            return NextResponse.json({ error: 'Message must be under 500 characters' }, { status: 400 });
        }

        // Check daily limit (max 10 per day)
        if (playerId) {
            const todayCountResult = await sql`
                SELECT COUNT(*) as count 
                FROM feedbacks 
                WHERE player_id = ${playerId} 
                AND created_at >= NOW() - INTERVAL '1 day'
            `;
            const count = parseInt(todayCountResult[0].count, 10);
            if (count >= 10) {
                return NextResponse.json({ error: 'Daily limit of 10 feedback submissions reached.' }, { status: 429 });
            }
        }

        const result = await sql`
            INSERT INTO feedbacks (player_id, username, type, message)
            VALUES (${playerId}, ${username}, ${type}, ${message})
            RETURNING *
        `;

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Failed to submit feedback:', error);
        return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }
}

// PUT /api/feedback
export async function PUT(request: NextRequest) {
    try {
        // Admin verification is missing for simplicity unless needed
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Feedback ID and status required' }, { status: 400 });
        }

        const result = await sql`
            UPDATE feedbacks
            SET status = ${status}
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
        }

        return NextResponse.json(result[0]);

    } catch (error) {
        console.error('Failed to update feedback:', error);
        return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }
}
