-- Phase 3: additive backend/data foundation. Existing source URLs are preserved.
CREATE TYPE "AccountPlan" AS ENUM ('FREE', 'PRO');
CREATE TYPE "BillingInterval" AS ENUM ('NONE', 'MONTHLY', 'YEARLY');
CREATE TYPE "UsageMetric" AS ENUM ('SOURCES_CAPTURED', 'AI_SUMMARIES', 'AI_CHAT_MESSAGES', 'REPORTS_GENERATED');

ALTER TABLE "User"
  ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "plan" "AccountPlan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "billingInterval" "BillingInterval" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;

ALTER TABLE "Source"
  ADD COLUMN "canonicalUrl" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "description" TEXT,
  ADD COLUMN "faviconUrl" TEXT;
UPDATE "Source" SET "canonicalUrl" = "url" WHERE "canonicalUrl" = '';

-- Keep all pre-existing rows. Duplicate legacy URLs receive a deterministic suffix;
-- new writes are protected by the project/canonical URL unique index.
WITH ranked AS (
  SELECT "id", "projectId", "canonicalUrl", ROW_NUMBER() OVER (PARTITION BY "projectId", "canonicalUrl" ORDER BY "createdAt", "id") AS row_number
  FROM "Source"
)
UPDATE "Source" AS source
SET "canonicalUrl" = source."canonicalUrl" || '#legacy-duplicate-' || ranked.row_number
FROM ranked
WHERE ranked."id" = source."id" AND ranked.row_number > 1;

CREATE UNIQUE INDEX "Source_projectId_canonicalUrl_key" ON "Source"("projectId", "canonicalUrl");
CREATE INDEX "ResearchProject_userId_updatedAt_idx" ON "ResearchProject"("userId", "updatedAt");
CREATE INDEX "ResearchProject_userId_title_idx" ON "ResearchProject"("userId", "title");
CREATE INDEX "Source_projectId_capturedAt_idx" ON "Source"("projectId", "capturedAt");
CREATE INDEX "Source_projectId_title_idx" ON "Source"("projectId", "title");
CREATE INDEX "ResearchItem_sourceId_createdAt_idx" ON "ResearchItem"("sourceId", "createdAt");

CREATE TABLE "UsageCounter" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "metric" "UsageMetric" NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UsageCounter_userId_metric_key" ON "UsageCounter"("userId", "metric");
CREATE INDEX "UsageCounter_userId_idx" ON "UsageCounter"("userId");
ALTER TABLE "UsageCounter" ADD CONSTRAINT "UsageCounter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
