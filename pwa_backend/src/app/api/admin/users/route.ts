import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleOptions } from '@/lib/cors';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// CORS preflight
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      const res = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
      return withCors(req, res);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        password: true,
      },
    });

    if (!user) {
      const res = NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
      return withCors(req, res);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const res = NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
      return withCors(req, res);
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      },
      { status: 200 }
    );
    return withCors(req, res);
  } catch (err) {
    console.error('LOGIN_ERROR', err);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return withCors(req, res);
  }
}
