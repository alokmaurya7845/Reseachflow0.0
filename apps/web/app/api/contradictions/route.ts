import { NextRequest, NextResponse } from 'next/server';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../lib/auth';
import { jsonError } from '../../lib/api';
import { aiErrorResponse } from '../../lib/ai/http';
import { detectContradictions } from '../../lib/intelligence/contradiction';
export async function GET(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const projectId = request.nextUrl.searchParams.get('projectId') ?? undefined; if (projectId && !(await db.researchProject.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } }))) return jsonError('Project not found.', 404); return NextResponse.json({ items: await db.contradiction.findMany({ where: { userId: user.id, projectId }, orderBy: { confidence: 'desc' }, take: 100 }) }); }
export async function POST(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const projectId = new URL(request.url).searchParams.get('projectId') ?? undefined; if (projectId && !(await db.researchProject.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } }))) return jsonError('Project not found.', 404); try { return NextResponse.json(await detectContradictions(user.id, projectId)); } catch (error) { return aiErrorResponse(error); } }
