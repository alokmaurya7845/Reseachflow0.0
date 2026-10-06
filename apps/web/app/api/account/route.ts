import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../lib/auth';
import { currentPlan, PLAN_LIMITS } from '../../lib/billing/plan';
const schema = z.object({ name: z.string().trim().max(120).nullable() });
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); const plan = await currentPlan(user.id); const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0); const usage = await db.usageRecord.findMany({ where: { userId: user.id, periodStart: start }, select: { feature: true, count: true } }); return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, plan, limits: PLAN_LIMITS[plan], usage }); }
export async function PATCH(request: NextRequest) { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 }); const parsed = schema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return NextResponse.json({ error: 'Invalid profile data.' }, { status: 400 }); return NextResponse.json({ user: await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name }, select: { id: true, email: true, name: true } }) }); }
