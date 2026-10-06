-- Phase 5: pgvector-backed embeddings and tenant-scoped research intelligence.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TYPE "EmbeddingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "IntelligenceEntityType" AS ENUM ('SOURCE', 'RESEARCH_ITEM', 'SUMMARY', 'FINDING', 'CONTENT_CHUNK');
CREATE TYPE "RelationshipType" AS ENUM ('SIMILAR', 'SUPPORTS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'RELATED', 'DERIVED_FROM', 'MENTIONS_TOPIC');
CREATE TYPE "ContradictionClassification" AS ENUM ('SUPPORTS', 'CONTRADICTS', 'PARTIALLY_CONTRADICTS', 'UNRELATED', 'INSUFFICIENT_INFORMATION');

CREATE TABLE "Embedding" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "researchItemId" TEXT,
  "analysisId" TEXT,
  "entityType" "IntelligenceEntityType" NOT NULL,
  "entityKey" TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "contentPreview" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "dimensions" INTEGER NOT NULL,
  "status" "EmbeddingStatus" NOT NULL DEFAULT 'PENDING',
  "errorMessage" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "vector" vector(1536),
  CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Embedding_entityType_entityKey_contentHash_key" ON "Embedding"("entityType", "entityKey", "contentHash");
CREATE INDEX "Embedding_userId_projectId_status_idx" ON "Embedding"("userId", "projectId", "status");
CREATE INDEX "Embedding_sourceId_entityType_idx" ON "Embedding"("sourceId", "entityType");
CREATE INDEX "Embedding_vector_hnsw_idx" ON "Embedding" USING hnsw ("vector" vector_cosine_ops) WHERE "vector" IS NOT NULL;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_researchItemId_fkey" FOREIGN KEY ("researchItemId") REFERENCES "ResearchItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "AIAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ResearchRelationship" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "targetSourceId" TEXT,
  "sourceEntity" "IntelligenceEntityType" NOT NULL,
  "sourceEntityKey" TEXT NOT NULL,
  "targetEntity" "IntelligenceEntityType" NOT NULL,
  "targetEntityKey" TEXT NOT NULL,
  "type" "RelationshipType" NOT NULL,
  "confidence" DOUBLE PRECISION,
  "explanation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchRelationship_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ResearchRelationship_entities_type_key" ON "ResearchRelationship"("sourceEntity", "sourceEntityKey", "targetEntity", "targetEntityKey", "type");
CREATE INDEX "ResearchRelationship_userId_projectId_type_idx" ON "ResearchRelationship"("userId", "projectId", "type");
ALTER TABLE "ResearchRelationship" ADD CONSTRAINT "ResearchRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchRelationship" ADD CONSTRAINT "ResearchRelationship_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchRelationship" ADD CONSTRAINT "ResearchRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Contradiction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "leftEntityKey" TEXT NOT NULL,
  "rightEntityKey" TEXT NOT NULL,
  "classification" "ContradictionClassification" NOT NULL,
  "confidence" DOUBLE PRECISION,
  "explanation" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contradiction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Contradiction_leftEntityKey_rightEntityKey_key" ON "Contradiction"("leftEntityKey", "rightEntityKey");
CREATE INDEX "Contradiction_userId_projectId_classification_idx" ON "Contradiction"("userId", "projectId", "classification");
ALTER TABLE "Contradiction" ADD CONSTRAINT "Contradiction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contradiction" ADD CONSTRAINT "Contradiction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contradiction" ADD CONSTRAINT "Contradiction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
