import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../lib/auth';
import { jsonError, paged, paginationFrom } from '../../lib/api';

const createSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).nullable().optional() });
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401);
    const { page, limit } = paginationFrom(request); const search = request.nextUrl.searchParams.get('search')?.trim();
    const where = { userId: user.id, ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}) };
    const [items, total] = await db.$transaction([db.researchProject.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { _count: { select: { sources: true } } } }), db.researchProject.count({ where })]);
    return NextResponse.json(paged(items, page, limit, total));
  } catch (error) { console.error('Project list failed', error); return jsonError('The project service is unavailable.', 503); }
}
export async function POST(request: NextRequest) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('Invalid project data.', 400, parsed.error.flatten());
  try { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const project = await db.researchProject.create({ data: { ...parsed.data, userId: user.id } }); return NextResponse.json(project, { status: 201 }); }
  catch (error) { console.error('Project create failed', error); return jsonError('The project could not be saved.', 503); }
}
