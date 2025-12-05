// src/lib/api.ts
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });
  console.log(res, 'RES')
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore if no JSON
  }

  if (!res.ok) {
    const msg = data?.error ?? `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}
