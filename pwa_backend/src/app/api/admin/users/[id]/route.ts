import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCors, handleOptions } from '@/lib/cors';

type RouteContext = { params: Promise<{ id: string }> };

function forbidden(req: NextRequest, message = 'Forbidden') {
  const res = NextResponse.json({ error: message }, { status: 403 });
  return withCors(req, res);
}

// CORS preflight handler
export function OPTIONS(req: NextRequest, _ctx: RouteContext) {
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

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

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


// PATCH /api/admin/users/[id] – Update basic info / status
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden(req);

    const { id } = await ctx.params;
    const body = await req.json();
    console.log('ADMIN_USER_PATCH_BODY', body);

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: body?.firstName ?? undefined,
        lastName: body?.lastName ?? undefined,
        email: body?.email ?? undefined,
        isActive:
          typeof body?.isActive === 'boolean' ? body?.isActive : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        isActive: true,
        role: true,
      },
    });

    const res = NextResponse.json({ user });
    return withCors(req, res);
  } catch (e) {
    console.error('ADMIN_USER_PATCH_ERROR', e);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return withCors(req, res);
  }
}

// DELETE /api/admin/users/[id] – Delete
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden(req);

    const { id } = await ctx.params;

    await prisma.user.delete({
      where: { id },
    });

    const res = NextResponse.json({ ok: true });
    return withCors(req, res);
  } catch (e) {
    console.error('ADMIN_USER_DELETE_ERROR', e);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    return withCors(req, res);
  }
}
