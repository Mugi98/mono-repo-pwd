import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!; // must match register/login

interface TokenPayload extends JwtPayload {
  sub?: string;
  role?: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true,
        role: true, 
        createdAt: true, 
        lastLogin: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 200 });

  } catch (err) {
    console.error('ME_ROUTE_ERROR', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
