import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { createSession, hashPassword, publicUserSelect } from '../../../lib/auth';
import { jsonError } from '../../../lib/api';

const schema = z.object({ email: z.string().trim().email().max(320), name: z.string().trim().min(1).max(120).optional(), password: z.string().min(12).max(128) });
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError('Invalid registration data.', 400, parsed.error.flatten());
  try {
    const email = parsed.data.email.toLowerCase();
    const exists = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return jsonError('An account with this email already exists.', 409);
    const user = await db.user.create({ data: { email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) }, select: publicUserSelect });
    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) { console.error('Registration failed', error); return jsonError('Registration is currently unavailable.', 503); }
}
