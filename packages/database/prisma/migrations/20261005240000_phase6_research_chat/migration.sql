-- Phase 6: tenant-scoped grounded research chat and clickable evidence citations.
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT');

CREATE TABLE "ChatSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT,
  "title" TEXT NOT NULL DEFAULT 'New research chat',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatSession_userId_updatedAt_idx" ON "ChatSession"("userId", "updatedAt");
CREATE INDEX "ChatSession_userId_projectId_updatedAt_idx" ON "ChatSession"("userId", "projectId", "updatedAt");
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "role" "ChatRole" NOT NULL,
  "content" TEXT NOT NULL,
  "provider" TEXT,
  "model" TEXT,
  "promptVersion" TEXT,
  "inputTokens" INTEGER,
  "outputTokens" INTEGER,
  "estimatedCost" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ChatMessage_userId_sessionId_createdAt_idx" ON "ChatMessage"("userId", "sessionId", "createdAt");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChatCitation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "researchItemId" TEXT,
  "findingId" TEXT,
  "relevanceScore" DOUBLE PRECISION NOT NULL,
  "citationOrder" INTEGER NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatCitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChatCitation_messageId_citationOrder_key" ON "ChatCitation"("messageId", "citationOrder");
CREATE INDEX "ChatCitation_userId_sourceId_idx" ON "ChatCitation"("userId", "sourceId");
ALTER TABLE "ChatCitation" ADD CONSTRAINT "ChatCitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatCitation" ADD CONSTRAINT "ChatCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatCitation" ADD CONSTRAINT "ChatCitation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatCitation" ADD CONSTRAINT "ChatCitation_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
