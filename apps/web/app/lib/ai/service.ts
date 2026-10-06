import { cleanText } from '../api';
import { buildAnalysisPrompt } from './prompts';
import { openAIProvider } from './providers/openai';
import { AIServiceError, type AnalysisOutput } from './types';

const MIN_CONTENT_LENGTH = 120;
const MAX_AI_CONTENT_LENGTH = 30_000;
export function prepareAIContent(raw: string) { const cleaned = cleanText(raw, 200_000); if (cleaned.length < MIN_CONTENT_LENGTH) throw new AIServiceError('EMPTY_CONTENT', `At least ${MIN_CONTENT_LENGTH} readable characters are required for AI analysis.`); if (cleaned.length <= MAX_AI_CONTENT_LENGTH) return cleaned; const head = cleaned.slice(0, 24_000); const tail = cleaned.slice(-6_000); return `${head}\n\n[Middle content omitted to control processing size.]\n\n${tail}`; }
export async function analyzeResearchContent(raw: string): Promise<{ output: AnalysisOutput; provider: string; model: string }> { const content = prepareAIContent(raw); const provider = openAIProvider(); return { output: await provider.analyze(buildAnalysisPrompt(content)), provider: provider.name, model: provider.model }; }
export { MAX_AI_CONTENT_LENGTH, MIN_CONTENT_LENGTH };
