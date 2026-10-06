import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { db } from '@researchflow/database';
import { cleanText } from '../api';
import { getCurrentUser } from '../auth';
import { analyzeResearchContent } from './service';
import { ANALYSIS_PROMPT_VERSION } from './prompts';
import { assertAIUsageAllowed, recordAIUsage } from './usage';
import { AIServiceError } from './types';

export async function runSourceAnalysis(userId: string, sourceId: string, requestedItemId?: string, force = false) {
  const source = await db.source.findFirst({ where: { id: sourceId, project: { userId } }, select: { id: true } });
  if (!source) throw new AIServiceError('PROVIDER_UNAVAILABLE', 'Source not found.');
  const item = requestedItemId ? await db.researchItem.findFirst({ where: { id: requestedItemId, sourceId }, select: { id: true, content: true } }) : await db.researchItem.findFirst({ where: { sourceId }, orderBy: { createdAt: 'desc' }, select: { id: true, content: true } });
  if (!item) throw new AIServiceError('EMPTY_CONTENT', 'There is no captured research content to analyze.');
  const inputHash = createHash('sha256').update(cleanText(item.content, 200_000)).digest('hex');
  const existing = await db.aIAnalysis.findUnique({ where: { researchItemId_inputHash: { researchItemId: item.id, inputHash } } });
  if (existing?.status === 'COMPLETED' && !force) return existing;
  if (existing?.status === 'PROCESSING' && !force) return existing;
  await assertAIUsageAllowed(userId);
  const analysis = await db.aIAnalysis.upsert({ where: { researchItemId_inputHash: { researchItemId: item.id, inputHash } }, update: { sourceId, status: 'PENDING', errorMessage: null, summary: null, keyPoints: Prisma.JsonNull, keyFindings: Prisma.JsonNull, keywords: Prisma.JsonNull, topics: Prisma.JsonNull, contentType: null, promptVersion: ANALYSIS_PROMPT_VERSION, startedAt: null, completedAt: null }, create: { sourceId, researchItemId: item.id, inputHash, provider: process.env.AI_PROVIDER || 'openai-compatible', model: process.env.AI_MODEL || 'gpt-5-mini', promptVersion: ANALYSIS_PROMPT_VERSION, status: 'PENDING' } });
  const processing = await db.aIAnalysis.update({ where: { id: analysis.id }, data: { status: 'PROCESSING', startedAt: new Date(), attemptCount: { increment: 1 }, errorMessage: null } });
  try { const result = await analyzeResearchContent(item.content); const completed = await db.aIAnalysis.update({ where: { id: processing.id }, data: { provider: result.provider, model: result.model, summary: result.output.summary, keyPoints: result.output.keyPoints, keyFindings: result.output.keyFindings, keywords: result.output.keywords, topics: result.output.topics, contentType: result.output.contentType, status: 'COMPLETED', completedAt: new Date(), errorMessage: null } }); await recordAIUsage(userId); return completed; } catch (error) { const safeError = error instanceof AIServiceError ? error : new AIServiceError('PROVIDER_UNAVAILABLE', 'AI processing could not be completed.', true); await db.aIAnalysis.update({ where: { id: processing.id }, data: { status: 'FAILED', errorMessage: safeError.message, completedAt: new Date() } }); throw safeError; }
}

export async function currentUserForSource(sourceId: string) { const user = await getCurrentUser(); if (!user) throw new AIServiceError('PROVIDER_UNAVAILABLE', 'Authentication required.'); const source = await db.source.findFirst({ where: { id: sourceId, project: { userId: user.id } }, select: { id: true } }); if (!source) throw new AIServiceError('PROVIDER_UNAVAILABLE', 'Source not found.'); return user; }
