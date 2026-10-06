import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../lib/auth';
import { jsonError } from '../../lib/api';
const schema = z.object({ projectId: z.string().optional(), type: z.enum(['SIMILAR','SUPPORTS','CONTRADICTS','PARTIALLY_CONTRADICTS','RELATED','DERIVED_FROM','MENTIONS_TOPIC']).optional() });
export async function GET(request: NextRequest) { const parsed = schema.safeParse({ projectId: request.nextUrl.searchParams.get('projectId') ?? undefined, type: request.nextUrl.searchParams.get('type') ?? undefined }); if (!parsed.success) return jsonError('Invalid relationship filters.', 400); const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); if (parsed.data.projectId && !(await db.researchProject.findFirst({ where: { id: parsed.data.projectId, userId: user.id }, select: { id: true } }))) return jsonError('Project not found.', 404); const items = await db.researchRelationship.findMany({ where: { userId: user.id, projectId: parsed.data.projectId, type: parsed.data.type }, orderBy: { confidence: 'desc' }, take: 200 }); return NextResponse.json({ items }); }
