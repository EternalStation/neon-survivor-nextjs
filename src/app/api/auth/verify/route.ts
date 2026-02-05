import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';

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
