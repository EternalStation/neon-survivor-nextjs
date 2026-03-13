export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/Auth';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request);

        if (!token) {
            return NextResponse.json({ valid: false }, { status: 401 });
        }

        const user = verifyToken(token);

        if (!user) {
            return NextResponse.json({ valid: false }, { status: 403 });
        }

        return NextResponse.json({ valid: true, user });
    } catch (error) {
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
