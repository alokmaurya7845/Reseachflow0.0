import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { idSchema, jsonError } from '../../../../lib/api';
import { aiErrorResponse } from '../../../../lib/ai/http';
import { projectGraph } from '../../../../lib/intelligence/service';
export async function GET(_request: Request, { params }: { params: { projectId: string } }) { if (!idSchema.safeParse(params.projectId).success) return jsonError('Invalid project ID.', 400); const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); try { return NextResponse.json(await projectGraph(user.id, params.projectId)); } catch (error) { return aiErrorResponse(error); } }
