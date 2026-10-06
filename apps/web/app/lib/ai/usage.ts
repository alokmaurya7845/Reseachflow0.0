import { db } from '@researchflow/database';
import { AIServiceError } from './types';
const FREE_AI_LIMIT = Number(process.env.AI_FREE_ANALYSIS_LIMIT || 10);
export async function assertAIUsageAllowed(userId: string) { const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } }); if (!user) throw new AIServiceError('PROVIDER_UNAVAILABLE', 'User account is unavailable.'); if (user.plan === 'FREE') { const counter = await db.usageCounter.findUnique({ where: { userId_metric: { userId, metric: 'AI_ANALYSES' } }, select: { count: true } }); if ((counter?.count ?? 0) >= FREE_AI_LIMIT) throw new AIServiceError('RATE_LIMIT', 'Your free AI analysis limit has been reached.', false); } }
export async function recordAIUsage(userId: string) { await db.usageCounter.upsert({ where: { userId_metric: { userId, metric: 'AI_ANALYSES' } }, update: { count: { increment: 1 } }, create: { userId, metric: 'AI_ANALYSES', count: 1 } }); }
export { FREE_AI_LIMIT };
