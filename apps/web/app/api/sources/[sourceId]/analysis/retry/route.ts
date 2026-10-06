import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../../../../lib/auth';
import { idSchema, jsonError } from '../../../../../lib/api';
import { aiErrorResponse } from '../../../../../lib/ai/http';
import { runSourceAnalysis } from '../../../../../lib/ai/runner';
const schema = z.object({ itemId: idSchema.optional() });
export async function POST(request: NextRequest, { params }: { params: { sourceId: string } }) { if (!idSchema.safeParse(params.sourceId).success) return jsonError('Invalid source ID.', 400); const body = schema.safeParse(await request.json().catch(() => ({}))); if (!body.success) return jsonError('Invalid retry request.', 400, body.error.flatten()); try { const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); const source = await db.source.findFirst({ where: { id: params.sourceId, project: { userId: user.id } }, select: { id: true } }); if (!source) return jsonError('Source not found.', 404); const analysis = await runSourceAnalysis(user.id, source.id, body.data.itemId, true); return NextResponse.json({ analysis, retried: true }); } catch (error) { return aiErrorResponse(error); } }
