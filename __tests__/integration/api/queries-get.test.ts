import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const mockListQueries = vi.fn();
const mockGetUser = vi.fn();
const mockCreateQuery = vi.fn();

vi.mock('@/lib/cosmos', () => ({
  listQueries: (...args: unknown[]) => mockListQueries(...args),
  getUser: (...args: unknown[]) => mockGetUser(...args),
  createQuery: (...args: unknown[]) => mockCreateQuery(...args),
}));

vi.mock('@/lib/ai-foundry', () => ({
  getAllergyGuidance: vi.fn(),
}));

const mockExtractUser = vi.fn();
vi.mock('@/lib/auth-server', () => ({
  extractUserFromToken: (...args: unknown[]) => mockExtractUser(...args),
}));

import { GET } from '@/app/api/queries/route';

const testUser = { userId: 'user-1', email: 'test@example.com' };

describe('GET /api/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/queries');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns queries in reverse chronological order', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockListQueries.mockResolvedValue({
      queries: [
        { id: 'q2', queryText: 'Sushi', createdAt: '2026-01-02T00:00:00.000Z' },
        { id: 'q1', queryText: 'Thai', createdAt: '2026-01-01T00:00:00.000Z' },
      ],
      continuationToken: null,
    });

    const req = new NextRequest('http://localhost:3000/api/queries', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.queries).toHaveLength(2);
    expect(data.queries[0].id).toBe('q2');
    expect(data.continuationToken).toBeNull();
  });

  it('passes pagination parameters from query string', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockListQueries.mockResolvedValue({ queries: [], continuationToken: null });

    const req = new NextRequest('http://localhost:3000/api/queries?limit=5&continuationToken=abc', {
      headers: { authorization: 'Bearer test-token' },
    });
    await GET(req);
    expect(mockListQueries).toHaveBeenCalledWith('user-1', 5, 'abc');
  });

  it('clamps limit to maximum of 100', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockListQueries.mockResolvedValue({ queries: [], continuationToken: null });

    const req = new NextRequest('http://localhost:3000/api/queries?limit=500', {
      headers: { authorization: 'Bearer test-token' },
    });
    await GET(req);
    expect(mockListQueries).toHaveBeenCalledWith('user-1', 100, undefined);
  });

  it('returns empty array for user with no history', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockListQueries.mockResolvedValue({ queries: [], continuationToken: null });

    const req = new NextRequest('http://localhost:3000/api/queries', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(data.queries).toEqual([]);
  });

  it('returns continuation token for pagination', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockListQueries.mockResolvedValue({
      queries: [{ id: 'q1' }],
      continuationToken: 'next-page-token',
    });

    const req = new NextRequest('http://localhost:3000/api/queries', {
      headers: { authorization: 'Bearer test-token' },
    });
    const res = await GET(req);
    const data = await res.json();
    expect(data.continuationToken).toBe('next-page-token');
  });
});
