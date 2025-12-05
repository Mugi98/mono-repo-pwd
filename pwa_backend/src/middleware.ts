import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { ROLE, hasRequiredRole } from '@/lib/roles';
import type { Role } from '@prisma/client';

const PROTECTED_ROUTES:{ pattern: RegExp; roles: Role[]} [] = [
    { pattern: /^\/dashboard/, roles: [ROLE.USER, ROLE.ADMIN] },
    { pattern: /^\/admin/, roles: [ROLE.ADMIN] },
];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const match = PROTECTED_ROUTES.find(({ pattern }) => pattern.test(pathname));

    if (!match) {
        return NextResponse.next();
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    const payload = await verifyToken(token);

    // No token or insufficient role → redirect to /auth
    if (!payload || !hasRequiredRole(payload.role, match.roles)) {
        const url = req.nextUrl.clone();
        url.pathname = '/auth';
        return NextResponse.redirect(url);
    }

    // Admin visiting /dashboard should be redirected to /admin
    if (pathname.startsWith('/dashboard') && payload.role === ROLE.ADMIN) {
        const url = req.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
};
