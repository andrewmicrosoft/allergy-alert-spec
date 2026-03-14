import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

// Mock Cosmos CRUD helpers
const mockGetUser = vi.fn();
const mockAddAllergen = vi.fn();
const mockUpdateAllergen = vi.fn();
const mockRemoveAllergen = vi.fn();

vi.mock('@/lib/cosmos', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
  addAllergen: (...args: unknown[]) => mockAddAllergen(...args),
  updateAllergen: (...args: unknown[]) => mockUpdateAllergen(...args),
  removeAllergen: (...args: unknown[]) => mockRemoveAllergen(...args),
}));

// Mock auth-server with a controllable return
const mockExtractUser = vi.fn();
vi.mock('@/lib/auth-server', () => ({
  extractUserFromToken: (...args: unknown[]) => mockExtractUser(...args),
}));

import { GET, POST, PUT, DELETE } from '@/app/api/allergens/route';

function makeRequest(method: string, body?: object): NextRequest {
  const headers: Record<string, string> = { authorization: 'Bearer test-token' };
  let requestBody: string | undefined;
  if (body) {
    requestBody = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new NextRequest('http://localhost:3000/api/allergens', {
    method,
    headers,
    body: requestBody,
  });
}

const testUser = { userId: 'user-1', email: 'test@example.com' };

describe('GET /api/allergens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when token is missing', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/allergens');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns allergens for authenticated user', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue({
      id: 'user-1',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
    });

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allergens).toHaveLength(1);
    expect(data.allergens[0].name).toBe('Peanuts');
  });

  it('returns empty array for new user', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockGetUser.mockResolvedValue(null);

    const res = await GET(makeRequest('GET'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allergens).toEqual([]);
  });
});

describe('POST /api/allergens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/allergens', {
      method: 'POST',
      body: JSON.stringify({ name: 'Peanuts', severity: 'allergy' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates allergen with valid input', async () => {
    mockExtractUser.mockReturnValue(testUser);
    const allergen = {
      id: 'a1',
      name: 'Peanuts',
      severity: 'allergy',
      addedAt: '2026-01-01T00:00:00.000Z',
    };
    mockAddAllergen.mockResolvedValue({ allergen, conflict: false });

    const res = await POST(makeRequest('POST', { name: 'Peanuts', severity: 'allergy' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.allergen.name).toBe('Peanuts');
  });

  it('returns 400 on invalid input', async () => {
    mockExtractUser.mockReturnValue(testUser);

    const res = await POST(makeRequest('POST', { name: '', severity: 'allergy' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid severity', async () => {
    mockExtractUser.mockReturnValue(testUser);

    const res = await POST(makeRequest('POST', { name: 'Peanuts', severity: 'mild' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 on duplicate allergen', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockAddAllergen.mockResolvedValue({ conflict: true });

    const res = await POST(makeRequest('POST', { name: 'Peanuts', severity: 'allergy' }));
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/allergens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/allergens', {
      method: 'PUT',
      body: JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'X',
        severity: 'allergy',
      }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('updates allergen with valid input', async () => {
    mockExtractUser.mockReturnValue(testUser);
    const allergen = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Tree Nuts',
      severity: 'intolerance',
      addedAt: '2026-01-01T00:00:00.000Z',
    };
    mockUpdateAllergen.mockResolvedValue({ allergen, conflict: false });

    const res = await PUT(
      makeRequest('PUT', {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Tree Nuts',
        severity: 'intolerance',
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allergen.name).toBe('Tree Nuts');
  });

  it('returns 404 when allergen not found', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockUpdateAllergen.mockResolvedValue(null);

    const res = await PUT(
      makeRequest('PUT', {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'X',
        severity: 'allergy',
      }),
    );
    expect(res.status).toBe(404);
  });

  it('returns 409 on duplicate name', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockUpdateAllergen.mockResolvedValue({ conflict: true });

    const res = await PUT(
      makeRequest('PUT', {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Existing',
        severity: 'allergy',
      }),
    );
    expect(res.status).toBe(409);
  });

  it('returns 400 on invalid UUID', async () => {
    mockExtractUser.mockReturnValue(testUser);

    const res = await PUT(makeRequest('PUT', { id: 'not-a-uuid', name: 'X', severity: 'allergy' }));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/allergens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockExtractUser.mockReturnValue(null);
    const req = new NextRequest('http://localhost:3000/api/allergens', {
      method: 'DELETE',
      body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('deletes allergen successfully', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockRemoveAllergen.mockResolvedValue(true);

    const res = await DELETE(makeRequest('DELETE', { id: '550e8400-e29b-41d4-a716-446655440000' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('returns 404 when allergen not found', async () => {
    mockExtractUser.mockReturnValue(testUser);
    mockRemoveAllergen.mockResolvedValue(false);

    const res = await DELETE(makeRequest('DELETE', { id: '550e8400-e29b-41d4-a716-446655440000' }));
    expect(res.status).toBe(404);
  });
});
