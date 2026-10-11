import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { dbMock, getCurrentUserMock } = vi.hoisted(() => ({
  dbMock: {
    researchProject: { findFirst: vi.fn() },
    $queryRawUnsafe: vi.fn(),
  },
  getCurrentUserMock: vi.fn(),
}));

vi.mock('@researchflow/database', () => ({ db: dbMock }));
vi.mock('../app/lib/auth', () => ({ getCurrentUser: getCurrentUserMock }));

import { GET } from '../app/api/intelligence/status/route';

const user = { id: 'user-1' };
const projectId = 'clxxxxxxxxxxxxxxxxxxxxxxxx';
const totals = {
  sources: 2,
  researchItems: 3,
  embeddingTotal: 4,
  pending: 0,
  processing: 1,
  completed: 2,
  completedWithVector: 2,
  completedWithoutVector: 0,
  failed: 1,
};

afterEach(() => vi.clearAllMocks());

describe('GET /api/intelligence/status', () => {
  it('requires authentication before querying source or embedding aggregates', async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await GET(new NextRequest('http://localhost/api/intelligence/status'));

    expect(response.status).toBe(401);
    expect(dbMock.researchProject.findFirst).not.toHaveBeenCalled();
    expect(dbMock.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('returns aggregate counts only and scopes them to an owned project', async () => {
    getCurrentUserMock.mockResolvedValue(user);
    dbMock.researchProject.findFirst.mockResolvedValue({ id: projectId });
    dbMock.$queryRawUnsafe.mockResolvedValue([totals]);

    const response = await GET(new NextRequest(`http://localhost/api/intelligence/status?projectId=${projectId}`));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(dbMock.researchProject.findFirst).toHaveBeenCalledWith({
      where: { id: projectId, userId: user.id },
      select: { id: true },
    });
    expect(dbMock.$queryRawUnsafe.mock.calls[0].slice(1)).toEqual([user.id, projectId]);
    expect(body).toEqual({ scope: 'PROJECT', ...totals });
    expect(Object.keys(body).sort()).toEqual(['completed', 'completedWithVector', 'completedWithoutVector', 'embeddingTotal', 'failed', 'pending', 'processing', 'researchItems', 'scope', 'sources'].sort());
  });

  it('does not reveal whether a project exists for another owner', async () => {
    getCurrentUserMock.mockResolvedValue(user);
    dbMock.researchProject.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest(`http://localhost/api/intelligence/status?projectId=${projectId}`));

    expect(response.status).toBe(404);
    expect(dbMock.$queryRawUnsafe).not.toHaveBeenCalled();
  });
});
