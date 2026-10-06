import { describe, expect, it, afterEach } from 'vitest';
import { embeddingProvider } from '../app/lib/intelligence/embedding-provider';
import { FINDING_THRESHOLD, MAX_COMPARISONS, SOURCE_THRESHOLD } from '../app/lib/intelligence/service';

describe('Phase 5 intelligence safeguards', () => {
  const original = { provider: process.env.EMBEDDING_PROVIDER, key: process.env.EMBEDDING_API_KEY, aiKey: process.env.AI_API_KEY, dimensions: process.env.EMBEDDING_DIMENSIONS };
  afterEach(() => { process.env.EMBEDDING_PROVIDER = original.provider; process.env.EMBEDDING_API_KEY = original.key; process.env.AI_API_KEY = original.aiKey; process.env.EMBEDDING_DIMENSIONS = original.dimensions; });
  it('requires a real server-side embedding configuration', () => { delete process.env.EMBEDDING_API_KEY; delete process.env.AI_API_KEY; delete process.env.OPENAI_API_KEY; expect(() => embeddingProvider()).toThrow('Embedding processing is not configured'); });
  it('rejects a vector dimension that does not match the pgvector schema', () => { process.env.EMBEDDING_PROVIDER = 'openai-compatible'; process.env.EMBEDDING_API_KEY = 'test-only'; process.env.EMBEDDING_DIMENSIONS = '768'; expect(() => embeddingProvider()).toThrow('must be 1536'); });
  it('keeps similarity thresholds and comparison budgets bounded', () => { expect(SOURCE_THRESHOLD).toBeGreaterThan(0); expect(SOURCE_THRESHOLD).toBeLessThan(1); expect(FINDING_THRESHOLD).toBeGreaterThan(0); expect(FINDING_THRESHOLD).toBeLessThan(1); expect(MAX_COMPARISONS).toBeGreaterThan(0); expect(MAX_COMPARISONS).toBeLessThanOrEqual(100); });
});
