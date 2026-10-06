export type AIAnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type AIKeyFinding = { finding: string; importance: 'high' | 'medium' | 'low' };
export type AIAnalysisView = { id: string; sourceId: string; researchItemId: string; summary: string | null; keyPoints: string[]; keyFindings: AIKeyFinding[]; keywords: string[]; topics: string[]; contentType: string | null; provider: string; model: string; promptVersion: string; status: AIAnalysisStatus; errorMessage: string | null; attemptCount: number; createdAt: string; updatedAt: string; completedAt: string | null };
