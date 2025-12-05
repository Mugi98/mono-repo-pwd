import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:3001')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

export function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin');

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,DELETE,OPTIONS'
  );
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  return res;
}

export function handleOptions(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return withCors(req, res);
}
