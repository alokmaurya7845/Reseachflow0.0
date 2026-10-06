import { z } from 'zod';

export const findingSchema = z.object({ finding: z.string().trim().min(1).max(1000), importance: z.enum(['high', 'medium', 'low']) });
export const analysisOutputSchema = z.object({ summary: z.string().trim().min(1).max(5000), keyPoints: z.array(z.string().trim().min(1).max(1000)).min(1).max(10), keyFindings: z.array(findingSchema).max(10), keywords: z.array(z.string().trim().min(1).max(100)).max(20), topics: z.array(z.string().trim().min(1).max(100)).max(10), contentType: z.enum(['research_article', 'news', 'blog', 'documentation', 'tutorial', 'academic', 'product', 'opinion', 'other']) });
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type AIProvider = { readonly name: string; readonly model: string; analyze(prompt: string): Promise<AnalysisOutput> };
export type AIServiceErrorCode = 'NOT_CONFIGURED' | 'INVALID_RESPONSE' | 'EMPTY_CONTENT' | 'CONTENT_TOO_LARGE' | 'TIMEOUT' | 'RATE_LIMIT' | 'PROVIDER_UNAVAILABLE';
export class AIServiceError extends Error { constructor(public readonly code: AIServiceErrorCode, message: string, public readonly retryable = false) { super(message); this.name = 'AIServiceError'; } }
