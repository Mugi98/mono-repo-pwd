import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { withCors, handleOptions } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET!; // must match register/login

interface TokenPayload extends JwtPayload {
  sub?: string;
  role?: string;
}

// CORS preflight
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return withCors(req, res);
    }

    const token = authHeader.split(' ')[1];

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      console.error('ME_ROUTE_JWT_ERROR', err);
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return withCors(req, res);
    }

    if (!decoded.sub) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return withCors(req, res);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return withCors(req, res);
    }

    // Update lastLogin (don't need the return value)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const res = NextResponse.json({ user }, { status: 200 });
    return withCors(req, res);
  } catch (err) {
    console.error('ME_ROUTE_ERROR', err);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return withCors(req, res);
  }
}
