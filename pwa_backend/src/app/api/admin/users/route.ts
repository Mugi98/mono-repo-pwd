import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { withCors } from '@/lib/cors';
import type { Prisma } from '@prisma/client';

function unauthorized(req: NextRequest, status = 401, message = 'Unauthorized') {
  const res = NextResponse.json({ error: message }, { status });
  return withCors(req, res);
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'ADMIN') {
      return unauthorized(req, 403, 'Forbidden – admin only');
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('pageSize') || '5')),
    );

    const search = url.searchParams.get('search')?.trim() || '';
    const firstNameFilter = url.searchParams.get('firstName')?.trim() || '';
    const lastNameFilter = url.searchParams.get('lastName')?.trim() || '';
    const emailFilter = url.searchParams.get('email')?.trim() || '';
    const createdAtFilter = url.searchParams.get('createdAt')?.trim() || '';

    const sortKey = (url.searchParams.get('sortKey') ||
      'createdAt') as 'firstName' | 'lastName' | 'email' | 'createdAt';
    const sortDir = (url.searchParams.get('sortDir') ||
      'desc') as 'asc' | 'desc';

    const and: Prisma.UserWhereInput[] = [];

    if (search) {
      const or: Prisma.UserWhereInput[] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];

      const parsed = new Date(search);
      if (!Number.isNaN(parsed.getTime())) {
        const start = new Date(parsed);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsed);
        end.setHours(23, 59, 59, 999);
        or.push({ createdAt: { gte: start, lte: end } });
      }

      and.push({ OR: or });
    }

    if (firstNameFilter) {
      and.push({
        firstName: { contains: firstNameFilter, mode: 'insensitive' },
      });
    }
    if (lastNameFilter) {
      and.push({
        lastName: { contains: lastNameFilter, mode: 'insensitive' },
      });
    }
    if (emailFilter) {
      and.push({
        email: { contains: emailFilter, mode: 'insensitive' },
      });
    }
    if (createdAtFilter) {
      const parsed = new Date(createdAtFilter);
      if (!Number.isNaN(parsed.getTime())) {
        const start = new Date(parsed);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsed);
        end.setHours(23, 59, 59, 999);
        and.push({ createdAt: { gte: start, lte: end } });
      }
    }

    const where: Prisma.UserWhereInput = {
      role: { not: 'ADMIN' }, // uncomment if you don't want to show admins
      AND: and.length ? and : undefined,
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortKey]: sortDir,
    };

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [rows, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          isActive: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    const res = NextResponse.json({ rows, total, page, pageSize });
    return withCors(req, res);
  } catch (error) {
    console.error(error);
    const res = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
    return withCors(req, res);
  }
}
