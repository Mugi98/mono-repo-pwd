import { NextRequest, NextResponse } from 'next/server';

export function withCors(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin');

  // For this project, we’ll just echo back whatever origin called us.
  // (If you want to lock it down later, we can add a whitelist array.)
  if (origin) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    // Helpful for caching proxies
    res.headers.set('Vary', 'Origin');
  }

  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
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
