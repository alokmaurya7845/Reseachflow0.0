import { describe, expect, it } from 'vitest';
import { buildAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '../app/lib/ai/prompts';
import { analysisOutputSchema } from '../app/lib/ai/types';
import { MAX_AI_CONTENT_LENGTH, MIN_CONTENT_LENGTH, prepareAIContent } from '../app/lib/ai/service';

describe('Phase 4 AI processing safeguards', () => {
  it('accepts the structured analysis contract and rejects missing fields', () => { const valid = { summary: 'A faithful summary.', keyPoints: ['A point'], keyFindings: [{ finding: 'A finding', importance: 'high' as const }], keywords: ['research'], topics: ['software'], contentType: 'documentation' as const }; expect(analysisOutputSchema.safeParse(valid).success).toBe(true); expect(analysisOutputSchema.safeParse({ summary: 'missing arrays' }).success).toBe(false); });
  it('prevents unsupported claims through centralized prompt instructions', () => { expect(ANALYSIS_SYSTEM_PROMPT).toContain('Do not invent facts'); expect(ANALYSIS_SYSTEM_PROMPT).toContain('supplied source text'); expect(buildAnalysisPrompt('source text')).toContain('SOURCE TEXT'); });
  it('rejects insufficient content and intelligently bounds long content', () => { expect(() => prepareAIContent('too short')).toThrow(`At least ${MIN_CONTENT_LENGTH}`); const content = 'A'.repeat(MAX_AI_CONTENT_LENGTH + 1000); const prepared = prepareAIContent(content); expect(prepared.length).toBeLessThan(content.length); expect(prepared).toContain('Middle content omitted'); });
});
