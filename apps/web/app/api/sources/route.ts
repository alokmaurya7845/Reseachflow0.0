import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../lib/auth';
import { canonicalizeUrl, cleanText, idSchema, jsonError, paged, paginationFrom } from '../../lib/api';

const sourceSchema = z.object({ projectId: idSchema, url: z.string().url().max(2048), title: z.string().trim().max(500).nullable().optional(), domain: z.string().trim().max(255).nullable().optional(), author: z.string().trim().max(255).nullable().optional(), description: z.string().trim().max(5000).nullable().optional(), faviconUrl: z.string().url().max(2048).nullable().optional(), publishedAt: z.string().datetime().nullable().optional(), content: z.string().trim().min(1).max(200_000), itemType: z.enum(['PAGE', 'PAGE_CONTENT', 'SELECTION', 'NOTE']).default('PAGE_CONTENT'), allowDuplicate: z.boolean().default(false) });
const listSchema = z.object({ projectId: idSchema.optional() });

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401);
    const { page, limit } = paginationFrom(request); const params = listSchema.safeParse({ projectId: request.nextUrl.searchParams.get('projectId') ?? undefined }); if (!params.success) return jsonError('Invalid project ID.', 400, params.error.flatten());
    const search = request.nextUrl.searchParams.get('search')?.trim();
    if (params.data.projectId) { const project = await db.researchProject.findFirst({ where: { id: params.data.projectId, userId: user.id }, select: { id: true } }); if (!project) return jsonError('Project not found.', 404); }
    const where = { project: { userId: user.id, ...(params.data.projectId ? { id: params.data.projectId } : {}) }, ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { domain: { contains: search, mode: 'insensitive' as const } }] } : {}) };
    const [items, total] = await db.$transaction([db.source.findMany({ where, orderBy: { capturedAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { project: { select: { id: true, title: true } }, _count: { select: { items: true } } } }), db.source.count({ where })]);
    return NextResponse.json(paged(items, page, limit, total));
  } catch (error) { console.error('Source list failed', error); return jsonError('The source service is unavailable.', 503); }
}

export async function POST(request: NextRequest) {
  const parsed = sourceSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return jsonError('Invalid capture payload.', 400, parsed.error.flatten());
  const input = parsed.data; let canonicalUrl: string;
  try { canonicalUrl = canonicalizeUrl(input.url); } catch { return jsonError('Invalid source URL.', 400); }
  const content = cleanText(input.content); if (!content) return jsonError('Captured content is empty.', 400);
  try {
    const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401);
    const project = await db.researchProject.findFirst({ where: { id: input.projectId, userId: user.id }, select: { id: true } }); if (!project) return jsonError('Project not found.', 404);
    const existing = await db.source.findUnique({ where: { projectId_canonicalUrl: { projectId: input.projectId, canonicalUrl } }, select: { id: true, url: true } });
    if (existing && !input.allowDuplicate) return NextResponse.json({ error: 'This source already exists.', code: 'DUPLICATE_SOURCE', existingSourceId: existing.id }, { status: 409 });
    const saved = await db.$transaction(async (tx) => { const source = await tx.source.create({ data: { projectId: input.projectId, url: input.url, canonicalUrl: input.allowDuplicate && existing ? `${canonicalUrl}#duplicate-${Date.now()}` : canonicalUrl, title: input.title ? cleanText(input.title, 500) : null, domain: input.domain ? cleanText(input.domain, 255) : new URL(input.url).hostname, author: input.author ? cleanText(input.author, 255) : null, description: input.description ? cleanText(input.description, 5000) : null, faviconUrl: input.faviconUrl || null, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null } }); const item = await tx.researchItem.create({ data: { sourceId: source.id, type: input.itemType, content } }); await tx.usageCounter.upsert({ where: { userId_metric: { userId: user.id, metric: 'SOURCES_CAPTURED' } }, update: { count: { increment: 1 } }, create: { userId: user.id, metric: 'SOURCES_CAPTURED', count: 1 } }); return { source, item }; });
    return NextResponse.json(saved, { status: 201 });
  } catch (error) { console.error('Source capture failed', error); return jsonError('The source could not be saved.', 503); }
}
