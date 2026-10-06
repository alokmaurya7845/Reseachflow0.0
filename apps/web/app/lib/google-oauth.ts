import { randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';

export const GOOGLE_STATE_COOKIE = 'researchflow_google_state';
export const GOOGLE_RETURN_COOKIE = 'researchflow_google_return';
const stateCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };
export function googleConfig() { const clientId = process.env.GOOGLE_CLIENT_ID?.trim(); const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim(); const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim(); if (!clientId || !clientSecret || !callbackUrl) return null; try { const url = new URL(callbackUrl); if (url.protocol !== 'http:' && url.protocol !== 'https:') return null; return { clientId, clientSecret, callbackUrl }; } catch { return null; } }
export function googleClient(config: NonNullable<ReturnType<typeof googleConfig>>) { return new OAuth2Client(config.clientId, config.clientSecret, config.callbackUrl); }
export function safeReturnPath(value: string | null | undefined) { if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'; return value; }
export function startGoogleState(returnPath: string) { const state = randomBytes(32).toString('base64url'); const jar = cookies(); jar.set(GOOGLE_STATE_COOKIE, state, stateCookieOptions); jar.set(GOOGLE_RETURN_COOKIE, safeReturnPath(returnPath), stateCookieOptions); return state; }
export function consumeGoogleState(received: string | null) { const expected = cookies().get(GOOGLE_STATE_COOKIE)?.value; cookies().set(GOOGLE_STATE_COOKIE, '', { ...stateCookieOptions, maxAge: 0 }); if (!received || !expected) return false; const left = Buffer.from(received); const right = Buffer.from(expected); return left.length === right.length && timingSafeEqual(left, right); }
export function consumeGoogleReturnPath() { const value = cookies().get(GOOGLE_RETURN_COOKIE)?.value; cookies().set(GOOGLE_RETURN_COOKIE, '', { ...stateCookieOptions, maxAge: 0 }); return safeReturnPath(value); }
