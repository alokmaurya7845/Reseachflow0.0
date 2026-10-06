import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth';
import { idSchema, jsonError } from '../../../../lib/api';
import { aiErrorResponse } from '../../../../lib/ai/http';
import { similarFindings } from '../../../../lib/intelligence/service';
export async function GET(_request: Request, { params }: { params: { findingId: string } }) { if (!idSchema.safeParse(params.findingId.split(':')[0]).success) return jsonError('Invalid finding ID.', 400); const user = await getCurrentUser(); if (!user) return jsonError('Authentication required.', 401); try { return NextResponse.json({ items: await similarFindings(user.id, params.findingId) }); } catch (error) { return aiErrorResponse(error); } }
