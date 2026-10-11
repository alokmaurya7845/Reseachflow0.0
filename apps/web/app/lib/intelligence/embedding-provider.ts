import { AIServiceError } from '../ai/types';

export type EmbeddingProvider = { readonly name: string; readonly model: string; readonly dimensions: number; generateEmbedding(text: string): Promise<number[]> };

const MODEL = 'gemini-embedding-001';
const DIMENSIONS = 1536;

function config() {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) throw new AIServiceError('NOT_CONFIGURED', 'Embedding processing requires GEMINI_API_KEY to be configured on the server.');
  return { key };
}

export function embeddingProvider(): EmbeddingProvider {
  const { key } = config();
  return {
    name: 'gemini',
    model: MODEL,
    dimensions: DIMENSIONS,
    async generateEmbedding(text) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: `models/${MODEL}`, content: { parts: [{ text }] }, embedContentConfig: { outputDimensionality: DIMENSIONS } }),
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) {
        if (response.status === 400 || response.status === 401 || response.status === 403) throw new AIServiceError('NOT_CONFIGURED', 'Gemini rejected the embedding request. Check GEMINI_API_KEY and its API access.');
        if (response.status === 429) throw new AIServiceError('RATE_LIMIT', 'The embedding provider rate limit was reached.', true);
        throw new AIServiceError('PROVIDER_UNAVAILABLE', 'The embedding provider returned an error.', response.status >= 500);
      }
      const payload = await response.json() as { embedding?: { values?: unknown } };
      const vector = payload.embedding?.values;
      if (!Array.isArray(vector) || vector.length === 0) {
        throw new AIServiceError('INVALID_RESPONSE', 'Gemini returned no embedding values.');
      }
      if (vector.length !== DIMENSIONS) {
        throw new AIServiceError('INVALID_RESPONSE', `Gemini returned ${vector.length} embedding dimensions; expected ${DIMENSIONS}.`);
      }
      if (vector.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
        throw new AIServiceError('INVALID_RESPONSE', 'Gemini returned embedding values that are not all finite numbers.');
      }
      return vector as number[];
    },
  };
}
