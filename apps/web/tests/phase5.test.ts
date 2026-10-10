import { describe, expect, it, afterEach, vi } from 'vitest';
import { embeddingProvider } from '../app/lib/intelligence/embedding-provider';
import { FINDING_THRESHOLD, MAX_COMPARISONS, SOURCE_THRESHOLD } from '../app/lib/intelligence/service';

describe('Phase 5 intelligence safeguards', () => {
  const original = { geminiKey: process.env.GEMINI_API_KEY };
  afterEach(() => { process.env.GEMINI_API_KEY = original.geminiKey; });
  it('requires GEMINI_API_KEY for server-side embedding configuration', () => { delete process.env.GEMINI_API_KEY; expect(() => embeddingProvider()).toThrow('GEMINI_API_KEY'); });
  it('uses the Gemini model and the pgvector-compatible dimension', () => { process.env.GEMINI_API_KEY = 'test-only'; const provider = embeddingProvider(); expect(provider.name).toBe('gemini'); expect(provider.model).toBe('gemini-embedding-001'); expect(provider.dimensions).toBe(1536); });
  it('sends the current Gemini embedContent request and accepts exactly 1536 values', async () => {
    process.env.GEMINI_API_KEY = 'test-only';
    const values = Array.from({ length: 1536 }, (_, index) => index / 1536);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ embedding: { values } }), { status: 200 }));
    try {
      const vector = await embeddingProvider().generateEmbedding('sample text');
      expect(vector).toHaveLength(1536);
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent');
      expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-only');
      expect(JSON.parse(String(init?.body))).toEqual({ model: 'models/gemini-embedding-001', content: { parts: [{ text: 'sample text' }] }, embedContentConfig: { outputDimensionality: 1536 } });
    } finally { fetchMock.mockRestore(); }
  });
  it('rejects a wrong-sized Gemini vector', async () => {
    process.env.GEMINI_API_KEY = 'test-only';
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ embedding: { values: [1, 2] } }), { status: 200 }));
    try { await expect(embeddingProvider().generateEmbedding('sample text')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' }); }
    finally { fetchMock.mockRestore(); }
  });
  it('maps Gemini authentication, rate limit, and provider failures safely', async () => {
    process.env.GEMINI_API_KEY = 'test-only';
    for (const [status, code] of [[403, 'NOT_CONFIGURED'], [429, 'RATE_LIMIT'], [503, 'PROVIDER_UNAVAILABLE']] as const) {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status }));
      try { await expect(embeddingProvider().generateEmbedding('sample text')).rejects.toMatchObject({ code }); }
      finally { fetchMock.mockRestore(); }
    }
  });
  it('keeps similarity thresholds and comparison budgets bounded', () => { expect(SOURCE_THRESHOLD).toBeGreaterThan(0); expect(SOURCE_THRESHOLD).toBeLessThan(1); expect(FINDING_THRESHOLD).toBeGreaterThan(0); expect(FINDING_THRESHOLD).toBeLessThan(1); expect(MAX_COMPARISONS).toBeGreaterThan(0); expect(MAX_COMPARISONS).toBeLessThanOrEqual(100); });
});
