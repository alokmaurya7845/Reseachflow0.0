import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { createSession, publicUserSelect, verifyPassword } from '../../../lib/auth';
import { jsonError } from '../../../lib/api';

const schema = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Invalid login data.', 400, parsed.error.flatten());
  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { ...publicUserSelect, passwordHash: true } });
    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return jsonError('Invalid email or password.', 401);
    await createSession(user.id);
    const safeUser = await db.user.findUnique({ where: { id: user.id }, select: publicUserSelect });
    return NextResponse.json({ user: safeUser });
  } catch (error) { console.error('Login failed', error); return jsonError('Login is currently unavailable.', 503); }
}
