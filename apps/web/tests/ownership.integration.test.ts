import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { db } from '@researchflow/database';

const integration = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;
integration('Phase 3 PostgreSQL ownership contract', () => {
  let userA: { id: string }; let userB: { id: string }; let projectA: { id: string }; let sourceA: { id: string };
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  beforeAll(async () => { userA = await db.user.create({ data: { email: `phase3-a-${suffix}@example.test`, passwordHash: 'integration-test-only' }, select: { id: true } }); userB = await db.user.create({ data: { email: `phase3-b-${suffix}@example.test`, passwordHash: 'integration-test-only' }, select: { id: true } }); projectA = await db.researchProject.create({ data: { userId: userA.id, title: 'User A project' }, select: { id: true } }); sourceA = await db.source.create({ data: { projectId: projectA.id, url: 'https://example.test/article', canonicalUrl: 'https://example.test/article' }, select: { id: true } }); });
  afterAll(async () => { if (userA && userB) await db.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } }); await db.$disconnect(); });
  it('lists only the authenticated owner’s projects', async () => { expect(await db.researchProject.findMany({ where: { userId: userA.id } })).toHaveLength(1); expect(await db.researchProject.findMany({ where: { userId: userB.id } })).toHaveLength(0); });
  it('does not expose another user’s source through an ownership predicate', async () => { expect(await db.source.findFirst({ where: { id: sourceA.id, project: { userId: userB.id } } })).toBeNull(); });
  it('enforces same-project canonical URL uniqueness', async () => { await expect(db.source.create({ data: { projectId: projectA.id, url: 'https://example.test/article#other', canonicalUrl: 'https://example.test/article' } })).rejects.toMatchObject({ code: 'P2002' }); });
});
