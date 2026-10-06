import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { compare, hash } from 'bcryptjs';
import { db } from '@researchflow/database';

const COOKIE_NAME = 'researchflow_session';
const SESSION_DAYS = 30;
const publicUserSelect = { id: true, email: true, name: true, avatarUrl: true, plan: true, billingInterval: true, createdAt: true, updatedAt: true } as const;

type SessionPayload = { userId: string };
function secretKey() { const value = process.env.AUTH_SECRET; if (!value || value.length < 32) throw new Error('AUTH_SECRET must be configured with at least 32 characters.'); return new TextEncoder().encode(value); }

export async function hashPassword(password: string) { return hash(password, 12); }
export async function verifyPassword(password: string, passwordHash: string) { return compare(password, passwordHash); }
export async function createSession(userId: string) { const token = await new SignJWT({ userId } satisfies SessionPayload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${SESSION_DAYS}d`).sign(secretKey()); cookies().set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_DAYS * 24 * 60 * 60 }); }
export function clearSession() { cookies().set(COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0) }); }
async function sessionUserId() { const token = cookies().get(COOKIE_NAME)?.value; if (!token) return null; try { const result = await jwtVerify<SessionPayload>(token, secretKey()); return result.payload.userId ?? null; } catch { return null; } }
export async function getCurrentUser() { const userId = await sessionUserId(); if (!userId) return null; return db.user.findUnique({ where: { id: userId }, select: publicUserSelect }); }
export async function requireUser() { return getCurrentUser(); }
export { publicUserSelect, COOKIE_NAME };
