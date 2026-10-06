import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { idSchema, jsonError } from '../../../../lib/api';
import { aiErrorResponse } from '../../../../lib/ai/http';
import { embedSource } from '../../../../lib/intelligence/service';
export async function POST(_request: Request, { params }: { params: { sourceId: string } }) { if (!idSchema.safeParse(params.sourceId).success) return jsonError('Invalid source ID.', 400); const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); try { const embeddings = await embedSource(user.id, params.sourceId); return NextResponse.json({ status: 'COMPLETED', count: embeddings.length, embeddings }); } catch (error) { return aiErrorResponse(error); } }
