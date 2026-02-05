import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Validation
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password required' },
                { status: 400 }
            );
        }

        if (username.length < 3 || username.length > 50) {
            return NextResponse.json(
                { error: 'Username must be 3-50 characters' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Check if username exists
        const existing = await sql`
      SELECT id FROM players WHERE username = ${username}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Username already taken' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create player
        const result = await sql`
      INSERT INTO players (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username, created_at
    `;

        const player = result[0];

        // Generate JWT
        const token = signToken({
            id: player.id as number,
            username: player.username as string,
        });

        return NextResponse.json(
            {
                message: 'Player registered successfully',
                token,
                player: {
                    id: player.id,
                    username: player.username,
                    createdAt: player.created_at,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Registration failed' },
            { status: 500 }
        );
    }
}
