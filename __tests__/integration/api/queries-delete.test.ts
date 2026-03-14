import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const mockDeleteQuery = vi.fn();
vi.mock('@/lib/cosmos', () => ({
  deleteQuery: (...args: unknown[]) => mockDeleteQuery(...args),
}));

const mockExtractUser = vi.fn();
vi.mock('@/lib/auth-server', () => ({
  extractUserFromToken: (...args: unknown[]) => mockExtractUser(...args),
}));

import { DELETE } from '@/app/api/queries/[id]/route';

const testUser = { userId: 'user-1', email: 'test@example.com' };

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/queries/550e8400-e29b-41d4-a716-446655440000', {
    method: 'DELETE',
    headers: { authorization: 'Bearer test-token' },
  });
}

describe('DELETE /api/queries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/queries/q1', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'q1' }) });
    expect(res.status).toBe(401);
  });

  it('deletes query successfully', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockDeleteQuery.mockResolvedValue(true);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDeleteQuery).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 'user-1');
  });

  it('returns 404 when query not found or wrong user', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockDeleteQuery.mockResolvedValue(false);

    const res = await DELETE(makeRequest(), {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    expect(res.status).toBe(404);
  });
});
