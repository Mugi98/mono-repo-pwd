import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCors, handleOptions } from '@/lib/cors';
import type { Prisma } from '@prisma/client/edge';


// CORS preflight handler
export function OPTIONS(req: NextRequest) {
  return handleOptions(req);
}

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  const payload = await verifyToken(token);
  return payload && payload.role === 'ADMIN' ? payload : null;
}

// GET /api/admin/users?page=1&pageSize=10&sortKey=createdAt&sortDir=desc&search=
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      const res = NextResponse.json({ error: 'Forbidden – admin only' }, { status: 403 });
      return withCors(req, res);
    }

    const url = new URL(req.url);

    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('pageSize') || '10')),
    );

    const search = url.searchParams.get('search')?.trim() || '';

    const sortKey = url.searchParams.get('sortKey') || 'createdAt';
    const sortDir = url.searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';

    let where: Prisma.UserWhereInput | undefined;

    if (search) {
      where = {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        ],
      };
    }


    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortKey]: sortDir },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const res = NextResponse.json({ rows, total, page });
    return withCors(req, res);
  } catch (e) {
    console.error('ADMIN_USERS_LIST_ERROR', e);
    const res = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return withCors(req, res);
  }
}