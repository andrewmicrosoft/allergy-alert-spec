import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';

// Mock server-only (it throws at import in non-server context)
vi.mock('server-only', () => ({}));

// Mock the AI inference client — vi.mock is hoisted so the factory runs first.
// We use a shared ref that tests can control.
const mockPost = vi.fn();
vi.mock('@azure-rest/ai-inference', () => ({
  default: vi.fn(() => ({
    path: () => ({ post: mockPost }),
  })),
}));

vi.mock('@azure/core-auth', () => ({
  AzureKeyCredential: vi.fn(),
}));

let getAllergyGuidance: typeof import('@/lib/ai-foundry').getAllergyGuidance;

beforeAll(async () => {
  // Set env vars before dynamically importing the module
  process.env.AZURE_AI_FOUNDRY_ENDPOINT = 'https://test.openai.azure.com';
  process.env.AZURE_AI_FOUNDRY_API_KEY = 'test-api-key';
  process.env.AZURE_AI_FOUNDRY_MODEL_NAME = 'gpt-4';

  const mod = await import('@/lib/ai-foundry');
  getAllergyGuidance = mod.getAllergyGuidance;
});

import type { Allergen } from '@/types';

describe('getAllergyGuidance', () => {
  const sampleAllergens: Allergen[] = [
    { id: '1', name: 'Peanuts', severity: 'allergy', addedAt: '2026-01-01T00:00:00.000Z' },
    { id: '2', name: 'Lactose', severity: 'intolerance', addedAt: '2026-01-01T00:00:00.000Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns AI-generated guidance on success', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: {
        choices: [{ message: { content: 'Avoid peanut dishes. Try the grilled fish.' } }],
      },
    });

    const result = await getAllergyGuidance(sampleAllergens, 'Italian restaurant');
    expect(result).toBe('Avoid peanut dishes. Try the grilled fish.');
  });

  it('formats allergen list in user message', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: {
        choices: [{ message: { content: 'Guidance here' } }],
      },
    });

    await getAllergyGuidance(sampleAllergens, 'Sushi place');

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Peanuts (allergy)'),
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Lactose (intolerance)'),
            }),
          ]),
        }),
      }),
    );
  });

  it('includes the food query in user message', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: {
        choices: [{ message: { content: 'Guidance' } }],
      },
    });

    await getAllergyGuidance(sampleAllergens, 'Thai food');

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Thai food'),
            }),
          ]),
        }),
      }),
    );
  });

  it('includes system prompt with safety instructions', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: {
        choices: [{ message: { content: 'Guidance' } }],
      },
    });

    await getAllergyGuidance(sampleAllergens, 'Pizza');

    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('allergen safety advisor'),
            }),
          ]),
        }),
      }),
    );
  });

  it('throws on non-200 response status', async () => {
    mockPost.mockResolvedValue({
      status: '500',
      body: {},
    });

    await expect(getAllergyGuidance(sampleAllergens, 'Burger place')).rejects.toThrow(
      'AI Foundry returned status 500',
    );
  });

  it('throws on empty response content', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: { choices: [{ message: { content: '' } }] },
    });

    await expect(getAllergyGuidance(sampleAllergens, 'Steak house')).rejects.toThrow(
      'AI Foundry returned empty response',
    );
  });

  it('throws on missing choices', async () => {
    mockPost.mockResolvedValue({
      status: '200',
      body: { choices: [] },
    });

    await expect(getAllergyGuidance(sampleAllergens, 'Mexican food')).rejects.toThrow(
      'AI Foundry returned empty response',
    );
  });
});
