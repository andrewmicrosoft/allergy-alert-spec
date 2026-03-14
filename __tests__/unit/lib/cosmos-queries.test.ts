import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockCreate = vi.fn();
const mockRead = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@azure/cosmos', () => {
  return {
    CosmosClient: function () {
      return {
        database: () => ({
          container: (name: string) => {
            if (name === 'queries') {
              return {
                items: { create: mockCreate },
              };
            }
            return {
              item: () => ({ read: mockRead }),
              items: { upsert: mockUpsert },
            };
          },
        }),
      };
    },
  };
});

vi.mock('uuid', () => ({
  v4: () => 'query-uuid-1234',
}));

let createQuery: typeof import('@/lib/cosmos').createQuery;

beforeAll(async () => {
  process.env.AZURE_COSMOS_ENDPOINT = 'https://test.documents.azure.com';
  process.env.AZURE_COSMOS_KEY = 'test-key';

  const mod = await import('@/lib/cosmos');
  createQuery = mod.createQuery;
});

import type { QueryDocument } from '@/types';

describe('createQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a query document in the queries container', async () => {
    const queryDoc: QueryDocument = {
      id: 'query-uuid-1234',
      userId: 'user-1',
      queryText: 'Thai food',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      guidance: 'Avoid pad thai due to peanuts.',
      disclaimer: 'This is general guidance only.',
      createdAt: '2026-01-01T12:00:00.000Z',
    };

    mockCreate.mockResolvedValue({ resource: queryDoc });

    const result = await createQuery(queryDoc);
    expect(result).toEqual(queryDoc);
    expect(mockCreate).toHaveBeenCalledWith(queryDoc);
  });

  it('preserves allergen snapshot at query time', async () => {
    const queryDoc: QueryDocument = {
      id: 'q2',
      userId: 'user-1',
      queryText: 'Sushi',
      allergens: [
        { id: 'a1', name: 'Shellfish', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'a2', name: 'Soy', severity: 'intolerance', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      guidance: 'Be cautious with shellfish.',
      disclaimer: 'Medical disclaimer text.',
      createdAt: '2026-01-01T13:00:00.000Z',
    };

    mockCreate.mockResolvedValue({ resource: queryDoc });

    const result = await createQuery(queryDoc);
    expect(result.allergens).toHaveLength(2);
    expect(result.allergens[0].name).toBe('Shellfish');
  });
});
