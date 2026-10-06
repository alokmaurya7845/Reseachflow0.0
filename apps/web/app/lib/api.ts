import { NextResponse } from 'next/server';
import { z } from 'zod';

export const idSchema = z.string().regex(/^[a-z0-9]{20,32}$/i, 'Invalid ID');
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export function paginationFrom(request: Request) { const url = new URL(request.url); return paginationSchema.parse({ page: url.searchParams.get('page') ?? undefined, limit: url.searchParams.get('limit') ?? undefined }); }
export function paged<T>(items: T[], page: number, limit: number, total: number) { return { items, page, limit, total, totalPages: Math.ceil(total / limit) }; }
export function jsonError(message: string, status: number, details?: unknown) { return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status }); }
export function cleanText(value: string, max = 200_000) { return Array.from(value).filter((character) => { const code = character.charCodeAt(0); return code !== 0 && !(code >= 1 && code <= 8) && code !== 11 && code !== 12 && !(code >= 14 && code <= 31); }).join('').trim().slice(0, max); }
export function canonicalizeUrl(raw: string) { const url = new URL(raw); url.hash = ''; url.hostname = url.hostname.toLowerCase(); if ((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443')) url.port = ''; if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, ''); return url.toString(); }
export function errorFromUnknown(error: unknown) { if (error instanceof z.ZodError) return jsonError('Invalid request data.', 400, error.flatten()); return jsonError('The request could not be completed.', 500); }
