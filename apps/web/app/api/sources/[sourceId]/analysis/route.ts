import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../../../lib/auth';
import { idSchema, jsonError } from '../../../../lib/api';
import { aiErrorResponse } from '../../../../lib/ai/http';
import { runSourceAnalysis } from '../../../../lib/ai/runner';

const bodySchema = z.object({ itemId: idSchema.optional(), reAnalyze: z.boolean().default(false) });
async function owner(sourceId: string) { if (!idSchema.safeParse(sourceId).success) return { error: jsonError('Invalid source ID.', 400) }; const user = await getCurrentUser(); if (!user) return { error: jsonError('Authentication required.', 401) }; const source = await db.source.findFirst({ where: { id: sourceId, project: { userId: user.id } }, select: { id: true } }); if (!source) return { error: jsonError('Source not found.', 404) }; return { user, source }; }
export async function GET(_request: NextRequest, { params }: { params: { sourceId: string } }) { try { const result = await owner(params.sourceId); if (result.error) return result.error; const analysis = await db.aIAnalysis.findFirst({ where: { sourceId: result.source.id }, orderBy: { createdAt: 'desc' } }); return NextResponse.json({ analysis }); } catch { return jsonError('The analysis service is unavailable.', 503); } }
export async function POST(request: NextRequest, { params }: { params: { sourceId: string } }) { const parsed = bodySchema.safeParse(await request.json().catch(() => ({}))); if (!parsed.success) return jsonError('Invalid analysis request.', 400, parsed.error.flatten()); try { const result = await owner(params.sourceId); if (result.error) return result.error; const analysis = await runSourceAnalysis(result.user.id, result.source.id, parsed.data.itemId, parsed.data.reAnalyze); return NextResponse.json({ analysis, reused: analysis.status === 'COMPLETED' && !parsed.data.reAnalyze }); } catch (error) { return aiErrorResponse(error); } }
