import { NextRequest, NextResponse } from 'next/server';
import { db } from '@researchflow/database';
import { getCurrentUser } from '../../../lib/auth';
import { idSchema, jsonError } from '../../../lib/api';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError('Authentication required.', 401);

  const rawProjectId = request.nextUrl.searchParams.get('projectId');
  const projectId = rawProjectId || null;
  if (projectId && !idSchema.safeParse(projectId).success) return jsonError('Invalid project ID.', 400);
  if (projectId && !(await db.researchProject.findFirst({ where: { id: projectId, userId: user.id }, select: { id: true } }))) {
    return jsonError('Project not found.', 404);
  }

  try {
    const [counts] = await db.$queryRawUnsafe<Array<{
      sources: number;
      researchItems: number;
      embeddingTotal: number;
      pending: number;
      processing: number;
      completed: number;
      completedWithVector: number;
      completedWithoutVector: number;
      failed: number;
    }>>(`
      WITH scoped_projects AS (
        SELECT "id" FROM "ResearchProject"
        WHERE "userId" = $1 AND ($2::text IS NULL OR "id" = $2)
      ), source_totals AS (
        SELECT COUNT(DISTINCT s."id")::int AS "sources",
               COUNT(DISTINCT i."id")::int AS "researchItems"
        FROM scoped_projects p
        LEFT JOIN "Source" s ON s."projectId" = p."id"
        LEFT JOIN "ResearchItem" i ON i."sourceId" = s."id"
      ), embedding_totals AS (
        SELECT COUNT(*)::int AS "embeddingTotal",
               COUNT(*) FILTER (WHERE e."status" = 'PENDING')::int AS "pending",
               COUNT(*) FILTER (WHERE e."status" = 'PROCESSING')::int AS "processing",
               COUNT(*) FILTER (WHERE e."status" = 'COMPLETED')::int AS "completed",
               COUNT(*) FILTER (WHERE e."status" = 'COMPLETED' AND e."vector" IS NOT NULL)::int AS "completedWithVector",
               COUNT(*) FILTER (WHERE e."status" = 'COMPLETED' AND e."vector" IS NULL)::int AS "completedWithoutVector",
               COUNT(*) FILTER (WHERE e."status" = 'FAILED')::int AS "failed"
        FROM "Embedding" e
        JOIN scoped_projects p ON p."id" = e."projectId"
        WHERE e."userId" = $1
      )
      SELECT source_totals.*, embedding_totals.*
      FROM source_totals CROSS JOIN embedding_totals
    `, user.id, projectId);

    return NextResponse.json({ scope: projectId ? 'PROJECT' : 'ALL', ...(counts ?? { sources: 0, researchItems: 0, embeddingTotal: 0, pending: 0, processing: 0, completed: 0, completedWithVector: 0, completedWithoutVector: 0, failed: 0 }) });
  } catch {
    return jsonError('Research indexing status is unavailable.', 503);
  }
}
