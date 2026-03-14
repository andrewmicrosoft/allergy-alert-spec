import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

const mockGetUser = vi.fn();
const mockCreateQuery = vi.fn();

vi.mock('@/lib/cosmos', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  createQuery: (...args: unknown[]) => mockCreateQuery(...args),
}));

const mockGetAllergyGuidance = vi.fn();
vi.mock('@/lib/ai-foundry', () => ({
  getAllergyGuidance: (...args: unknown[]) => mockGetAllergyGuidance(...args),
}));

const mockExtractUser = vi.fn();
vi.mock('@/lib/auth-server', () => ({
  extractUserFromToken: (...args: unknown[]) => mockExtractUser(...args),
}));

vi.mock('uuid', () => ({
  v4: () => 'query-uuid-5678',
}));

import { POST } from '@/app/api/queries/route';

function makeRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/queries', {
    method: 'POST',
    headers: {
      authorization: 'Bearer test-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

const testUser = { userId: 'user-1', email: 'test@example.com' };

describe('POST /api/queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/queries', {
      method: 'POST',
      body: JSON.stringify({ queryText: 'Thai food' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 on invalid input', async () => {
    mockExtractUser.mockReturnValue(testUser);

    const res = await POST(makeRequest({ queryText: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 422 when user has no allergens', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue({
      id: 'user-1',
      allergens: [],
    });

    const res = await POST(makeRequest({ queryText: 'Thai food' }));
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('at least one allergen');
  });

  it('returns 422 when user does not exist', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue(null);

    const res = await POST(makeRequest({ queryText: 'Thai food' }));
    expect(res.status).toBe(422);
  });

  it('returns 503 when AI service fails', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue({
      id: 'user-1',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });
    mockGetAllergyGuidance.mockRejectedValue(new Error('AI service error'));

    const res = await POST(makeRequest({ queryText: 'Thai food' }));
    expect(res.status).toBe(503);
  });

  it('returns 200 with guidance and disclaimer on success', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue({
      id: 'user-1',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });
    mockGetAllergyGuidance.mockResolvedValue('Avoid pad thai. Try grilled chicken.');
    mockCreateQuery.mockImplementation((doc: unknown) => doc);

    const res = await POST(makeRequest({ queryText: 'Thai food' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.query.guidance).toBe('Avoid pad thai. Try grilled chicken.');
    expect(data.query.disclaimer).toContain('general guidance only');
    expect(data.query.queryText).toBe('Thai food');
    expect(data.query.allergens).toHaveLength(1);
  });
});
