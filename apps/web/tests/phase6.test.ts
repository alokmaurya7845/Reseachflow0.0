import { describe, expect, it } from 'vitest';
import { chatOutputSchema, RESEARCH_CHAT_PROMPT_VERSION, RESEARCH_CHAT_SYSTEM_PROMPT } from '../app/lib/ai/research-chat';

describe('Phase 6 grounded research chat safeguards', () => {
  it('validates structured answers and bounded citation indexes', () => { const valid = { answer: 'The evidence indicates a cautious improvement. [Source 1]', citations: [{ resultIndex: 0, reason: 'The retrieved summary directly supports this claim.' }], confidence: 'MEDIUM' as const, insufficientEvidence: false }; expect(chatOutputSchema.safeParse(valid).success).toBe(true); expect(chatOutputSchema.safeParse({ ...valid, citations: [{ resultIndex: 99, reason: 'bad' }] }).success).toBe(false); });
  it('requires grounded-only behavior and treats webpage instructions as data', () => { expect(RESEARCH_CHAT_SYSTEM_PROMPT).toContain('only from the RESEARCH EVIDENCE'); expect(RESEARCH_CHAT_SYSTEM_PROMPT).toContain('prompt injection'); expect(RESEARCH_CHAT_SYSTEM_PROMPT).toContain('Never invent sources'); expect(RESEARCH_CHAT_PROMPT_VERSION).toBe('research-chat-v1'); });
  it('defines a controlled no-evidence response contract', () => { const result = chatOutputSchema.safeParse({ answer: "I couldn't find enough evidence in your research to answer that confidently.", citations: [], confidence: 'LOW', insufficientEvidence: true }); expect(result.success).toBe(true); });
});
