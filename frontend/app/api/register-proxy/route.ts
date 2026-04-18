import { NextResponse } from 'next/server';

function apiBase(): string {
  const raw =
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

/**
 * Agent-only self-serve registration.
 * - `AGENT_REGISTRATION_SECRET` — server-only; must match the backend (never `NEXT_PUBLIC_*`).
 * - `API_BASE_URL` — server-only override (e.g. `http://backend:3000` inside Docker compose).
 * - `NEXT_PUBLIC_API_BASE_URL` — fallback; same value the browser client uses.
 */
export async function POST(req: Request) {
  const secret = process.env.AGENT_REGISTRATION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Agent registration is not configured on this server.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid body' }, { status: 400 });
  }

  const { email, password } = body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { message: 'email and password are required' },
      { status: 400 },
    );
  }

  const res = await fetch(`${apiBase()}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-registration-secret': secret,
    },
    body: JSON.stringify({
      email,
      password,
      role: 'agent',
    }),
  });

  const data: unknown = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
