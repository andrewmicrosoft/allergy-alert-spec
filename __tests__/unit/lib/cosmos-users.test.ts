import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';

vi.mock('server-only', () => ({}));

// Mock Cosmos DB container operations
const mockRead = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@azure/cosmos', () => {
  return {
    CosmosClient: function () {
      return {
        database: () => ({
          container: (name: string) => {
            if (name === 'users') {
              return {
                item: () => ({ read: mockRead }),
                items: { upsert: mockUpsert },
              };
            }
            return {
              item: () => ({ read: mockRead }),
              items: { upsert: mockUpsert, create: vi.fn() },
            };
          },
        }),
      };
    },
  };
});

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

let getUser: typeof import('@/lib/cosmos').getUser;
let addAllergen: typeof import('@/lib/cosmos').addAllergen;
let updateAllergen: typeof import('@/lib/cosmos').updateAllergen;
let removeAllergen: typeof import('@/lib/cosmos').removeAllergen;

beforeAll(async () => {
  process.env.AZURE_COSMOS_ENDPOINT = 'https://test.documents.azure.com';
  process.env.AZURE_COSMOS_KEY = 'test-key';

  const mod = await import('@/lib/cosmos');
  getUser = mod.getUser;
  addAllergen = mod.addAllergen;
  updateAllergen = mod.updateAllergen;
  removeAllergen = mod.removeAllergen;
});

import type { UserDocument } from '@/types';

describe('getUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user document when found', async () => {
    const user: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: user });

    const result = await getUser('user-1');
    expect(result).toEqual(user);
  });

  it('returns null when user not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await getUser('nonexistent');
    expect(result).toBeNull();
  });
});

describe('addAllergen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds allergen to existing user', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });
    mockUpsert.mockResolvedValue({ resource: existingUser });

    const result = await addAllergen('user-1', 'test@example.com', 'Peanuts', 'allergy');
    expect(result.conflict).toBe(false);
    if (!result.conflict) {
      expect(result.allergen.name).toBe('Peanuts');
      expect(result.allergen.severity).toBe('allergy');
      expect(result.allergen.id).toBe('test-uuid-1234');
    }
  });

  it('creates user document if not exists', async () => {
    mockRead.mockResolvedValue({ resource: undefined });
    mockUpsert.mockResolvedValue({ resource: {} });

    const result = await addAllergen('new-user', 'new@example.com', 'Gluten', 'intolerance');
    expect(result.conflict).toBe(false);
    expect(mockUpsert).toHaveBeenCalled();
  });

  it('rejects duplicate allergen (case-insensitive)', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });

    const result = await addAllergen('user-1', 'test@example.com', 'peanuts', 'allergy');
    expect(result.conflict).toBe(true);
  });

  it('allows different allergen names', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });
    mockUpsert.mockResolvedValue({ resource: existingUser });

    const result = await addAllergen('user-1', 'test@example.com', 'Shellfish', 'allergy');
    expect(result.conflict).toBe(false);
  });
});

describe('updateAllergen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates allergen name and severity', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });
    mockUpsert.mockResolvedValue({ resource: existingUser });

    const result = await updateAllergen('user-1', 'a1', 'Tree Nuts', 'intolerance');
    expect(result).not.toBeNull();
    expect(result!.conflict).toBe(false);
    if (!result!.conflict) {
      expect(result!.allergen.name).toBe('Tree Nuts');
      expect(result!.allergen.severity).toBe('intolerance');
    }
  });

  it('returns null when user not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await updateAllergen('nonexistent', 'a1', 'Peanuts', 'allergy');
    expect(result).toBeNull();
  });

  it('returns null when allergen not found', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });

    const result = await updateAllergen('user-1', 'nonexistent', 'Peanuts', 'allergy');
    expect(result).toBeNull();
  });

  it('rejects duplicate name when renaming', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'a2', name: 'Shellfish', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });

    const result = await updateAllergen('user-1', 'a1', 'shellfish', 'allergy');
    expect(result).not.toBeNull();
    expect(result!.conflict).toBe(true);
  });
});

describe('removeAllergen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes allergen and returns true', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [
        { id: 'a1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });
    mockUpsert.mockResolvedValue({ resource: existingUser });

    const result = await removeAllergen('user-1', 'a1');
    expect(result).toBe(true);
  });

  it('returns false when user not found', async () => {
    mockRead.mockResolvedValue({ resource: undefined });

    const result = await removeAllergen('nonexistent', 'a1');
    expect(result).toBe(false);
  });

  it('returns false when allergen not found', async () => {
    const existingUser: UserDocument = {
      id: 'user-1',
      email: 'test@example.com',
      allergens: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockRead.mockResolvedValue({ resource: existingUser });

    const result = await removeAllergen('user-1', 'nonexistent');
    expect(result).toBe(false);
  });
});
