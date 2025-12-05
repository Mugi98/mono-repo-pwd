import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCors, handleOptions } from '@/lib/cors';

type RouteContext = { params: Promise<{ id: string }> };

function forbidden(req: NextRequest, message = 'Forbidden') {
  const res = NextResponse.json({ error: message }, { status: 403 });
  return withCors(req, res);
}

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;
  const payload = await verifyToken(token);
  return payload && payload.role === 'ADMIN' ? payload : null;
}

// CORS preflight handler
export function OPTIONS(req: NextRequest, _ctx: RouteContext) {
  return handleOptions(req);
}

// GET /api/admin/users/[id] – View details
export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return forbidden(req);

    const { id } = await ctx.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      const res = NextResponse.json({ error: 'Not found' }, { status: 404 });
      return withCors(req, res);
    }

    const res = NextResponse.json({ user });
    return withCors(req, res);
  } catch (e) {
    console.error('ADMIN_USER_GET_ERROR', e);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
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
