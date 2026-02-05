import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password required' },
                { status: 400 }
            );
        }

        // Find player
        const result = await sql`
      SELECT id, username, password_hash, created_at
      FROM players
      WHERE username = ${username}
    `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const player = result[0];

        // Verify password
        const validPassword = await bcrypt.compare(
            password,
            player.password_hash as string
        );

        if (!validPassword) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Update last login
        await sql`
      UPDATE players
      SET last_login = NOW()
      WHERE id = ${player.id}
    `;

        // Generate JWT
        const token = signToken({
            id: player.id as number,
            username: player.username as string,
        });

        return NextResponse.json({
            message: 'Login successful',
            token,
            player: {
                id: player.id,
                username: player.username,
                createdAt: player.created_at,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
