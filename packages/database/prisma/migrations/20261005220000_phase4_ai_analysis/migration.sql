-- Phase 4: source-linked structured AI analysis and server-side AI usage tracking.
ALTER TYPE "UsageMetric" ADD VALUE IF NOT EXISTS 'AI_ANALYSES';
CREATE TYPE "AIAnalysisStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE "AIAnalysis" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "researchItemId" TEXT NOT NULL,
  "inputHash" TEXT NOT NULL,
  "summary" TEXT,
  "keyPoints" JSONB,
  "keyFindings" JSONB,
  "keywords" JSONB,
  "topics" JSONB,
  "contentType" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptVersion" TEXT NOT NULL,
  "status" "AIAnalysisStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AIAnalysis_researchItemId_inputHash_key" ON "AIAnalysis"("researchItemId", "inputHash");
CREATE INDEX "AIAnalysis_sourceId_createdAt_idx" ON "AIAnalysis"("sourceId", "createdAt");
CREATE INDEX "AIAnalysis_status_updatedAt_idx" ON "AIAnalysis"("status", "updatedAt");
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
