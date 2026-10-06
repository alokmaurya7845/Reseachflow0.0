import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../../lib/auth';
import { jsonError } from '../../../lib/api';
import { chatScope } from '../../../lib/ai/research-chat';
const createSchema = z.object({ projectId: z.string().optional().nullable(), title: z.string().trim().min(1).max(120).optional() });
export async function GET(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const projectId = request.nextUrl.searchParams.get('projectId') ?? undefined; if (projectId && !(await db.researchProject.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } }))) return jsonError('Project not found.', 404); const sessions = await db.chatSession.findMany({ where: { userId: user.id, projectId }, orderBy: { updatedAt: 'desc' }, take: 50, include: { _count: { select: { messages: true } } } }); return NextResponse.json({ sessions }); }
export async function POST(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const parsed = createSchema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return jsonError('Invalid chat session data.', 400, parsed.error.flatten()); try { const projectId = await chatScope(user.id, parsed.data.projectId); const session = await db.chatSession.create({ data: { userId: user.id, projectId, title: parsed.data.title ?? 'New research chat' } }); return NextResponse.json({ session }, { status: 201 }); } catch { return jsonError('Chat session could not be created.', 503); } }
