-- Phase 7: grounded reports, future subscription provider state, and period usage records.
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE "ReportFormat" AS ENUM ('MARKDOWN', 'PDF');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'TRIALING');
CREATE TYPE "UsageFeature" AS ENUM ('SOURCES', 'AI_ANALYSES', 'AI_CHAT_MESSAGES', 'REPORTS', 'EXPORTS');

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "plan" "AccountPlan" NOT NULL DEFAULT 'FREE', "billingInterval" "BillingInterval" NOT NULL DEFAULT 'NONE', "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE', "providerCustomerId" TEXT, "providerSubscriptionId" TEXT, "currentPeriodStart" TIMESTAMP(3), "currentPeriodEnd" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "UsageRecord" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "feature" "UsageFeature" NOT NULL, "count" INTEGER NOT NULL DEFAULT 1, "periodStart" TIMESTAMP(3) NOT NULL, "periodEnd" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UsageRecord_userId_feature_periodStart_key" ON "UsageRecord"("userId", "feature", "periodStart");
CREATE INDEX "UsageRecord_userId_feature_periodEnd_idx" ON "UsageRecord"("userId", "feature", "periodEnd");
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ResearchReport" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL, "status" "ReportStatus" NOT NULL DEFAULT 'PENDING', "content" TEXT, "format" "ReportFormat" NOT NULL DEFAULT 'MARKDOWN', "provider" TEXT, "model" TEXT, "errorMessage" TEXT, "generatedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ResearchReport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResearchReport_userId_projectId_updatedAt_idx" ON "ResearchReport"("userId", "projectId", "updatedAt");
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResearchReport" ADD CONSTRAINT "ResearchReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
