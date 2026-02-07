import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const patches = await sql`
            SELECT DISTINCT patch_version 
            FROM game_runs 
            WHERE patch_version IS NOT NULL 
            ORDER BY patch_version DESC
        `;

        return NextResponse.json({ patches });
    } catch (error) {
        console.error('Fetch patches error:', error);
        return NextResponse.json(
            { patches: [{ patch_version: '1.0.1' }] },
            { status: 200 } // Return default instead of failing
        );
    }
}
