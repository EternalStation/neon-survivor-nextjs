import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is not set');
    return secret;
}

export interface JWTPayload {
    id: number;
    username: string;
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '30d' });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, getJwtSecret()) as JWTPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
}

export function authenticateRequest(request: NextRequest): JWTPayload | null {
    const token = getTokenFromRequest(request);
    if (!token) return null;

    return verifyToken(token);
}
