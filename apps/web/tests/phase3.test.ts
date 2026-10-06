import { describe, expect, it } from 'vitest';
import { canonicalizeUrl, cleanText, idSchema, paged, paginationFrom } from '../app/lib/api';
import { hashPassword, verifyPassword } from '../app/lib/auth';

describe('Phase 3 API foundations', () => {
  it('canonicalizes equivalent URLs while preserving meaningful paths', () => {
    expect(canonicalizeUrl('HTTPS://Example.COM:443/research/article///#section')).toBe('https://example.com/research/article');
    expect(canonicalizeUrl('https://example.com')).toBe('https://example.com/');
  });
  it('cleans control characters and bounds content', () => { expect(cleanText('safe\u0000 text\u0001')).toBe('safe text'); expect(cleanText('abcdef', 3)).toBe('abc'); });
  it('validates IDs and returns consistent pagination metadata', () => { expect(idSchema.safeParse('clxxxxxxxxxxxxxxxxxxxxxxxx').success).toBe(true); expect(idSchema.safeParse('not-an-id').success).toBe(false); expect(paged([{ id: 1 }], 2, 1, 3)).toEqual({ items: [{ id: 1 }], page: 2, limit: 1, total: 3, totalPages: 3 }); });
  it('parses bounded pagination parameters', () => { const result = paginationFrom(new Request('http://localhost/api/projects?page=2&limit=50')); expect(result).toEqual({ page: 2, limit: 50 }); expect(() => paginationFrom(new Request('http://localhost/api/projects?limit=1000'))).toThrow(); });
  it('hashes passwords and verifies only the original password', async () => { const passwordHash = await hashPassword('correct horse battery staple'); expect(passwordHash).not.toContain('correct horse'); expect(await verifyPassword('correct horse battery staple', passwordHash)).toBe(true); expect(await verifyPassword('wrong password', passwordHash)).toBe(false); });
});
