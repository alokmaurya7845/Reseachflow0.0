import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../../lib/auth';
import { jsonError } from '../../../lib/api';
import { aiErrorResponse } from '../../../lib/ai/http';
import { semanticSearch } from '../../../lib/intelligence/service';
const querySchema = z.object({ q: z.string().trim().min(3).max(500), projectId: z.string().optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });
async function runSearch(userId: string, value: unknown) { const parsed = querySchema.safeParse(value); if (!parsed.success) return jsonError('Search query must contain at least 3 characters.', 400, parsed.error.flatten()); if (parsed.data.projectId && !(await db.researchProject.findFirst({ where: { id: parsed.data.projectId, userId }, select: { id: true } }))) return jsonError('Project not found.', 404); return NextResponse.json({ query: parsed.data.q, items: await semanticSearch(userId, parsed.data.q, parsed.data.projectId, parsed.data.limit) }); }
export async function GET(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); try { return await runSearch(user.id, Object.fromEntries(request.nextUrl.searchParams)); } catch (error) { return aiErrorResponse(error); } }
export async function POST(request: NextRequest) { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); try { return await runSearch(user.id, await request.json().catch(() => ({}))); } catch (error) { return aiErrorResponse(error); } }
