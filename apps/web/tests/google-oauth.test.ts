import { describe, expect, it } from 'vitest';
import { googleConfig, safeReturnPath } from '../app/lib/google-oauth';
describe('Google OAuth safeguards', () => {
  it('allows only local application-relative return paths', () => { expect(safeReturnPath('/')).toBe('/'); expect(safeReturnPath('/research-chat')).toBe('/research-chat'); expect(safeReturnPath('https://evil.example')).toBe('/'); expect(safeReturnPath('//evil.example')).toBe('/'); expect(safeReturnPath('/\\evil')).toBe('/'); });
  it('fails closed when Google credentials are missing', () => { const previous = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, callback: process.env.GOOGLE_CALLBACK_URL }; delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET; delete process.env.GOOGLE_CALLBACK_URL; expect(googleConfig()).toBeNull(); if (previous.id !== undefined) process.env.GOOGLE_CLIENT_ID = previous.id; if (previous.secret !== undefined) process.env.GOOGLE_CLIENT_SECRET = previous.secret; if (previous.callback !== undefined) process.env.GOOGLE_CALLBACK_URL = previous.callback; });
});
