import { describe, expect, it } from 'vitest';
import {
  AllergenInputSchema,
  AllergenUpdateSchema,
  AllergenDeleteSchema,
  FoodQueryInputSchema,
} from '@/lib/validators';

describe('AllergenInputSchema', () => {
  it('accepts valid input with allergy severity', () => {
    const result = AllergenInputSchema.safeParse({
      name: 'Peanuts',
      severity: 'allergy',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Peanuts');
      expect(result.data.severity).toBe('allergy');
    }
  });

  it('accepts valid input with intolerance severity', () => {
    const result = AllergenInputSchema.safeParse({
      name: 'Lactose',
      severity: 'intolerance',
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace from name', () => {
    const result = AllergenInputSchema.safeParse({
      name: '  Peanuts  ',
      severity: 'allergy',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Peanuts');
    }
  });

  it('rejects empty name', () => {
    const result = AllergenInputSchema.safeParse({
      name: '',
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const result = AllergenInputSchema.safeParse({
      name: '   ',
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const result = AllergenInputSchema.safeParse({
      name: 'a'.repeat(101),
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });

  it('accepts name at exactly 100 characters', () => {
    const result = AllergenInputSchema.safeParse({
      name: 'a'.repeat(100),
      severity: 'allergy',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity', () => {
    const result = AllergenInputSchema.safeParse({
      name: 'Peanuts',
      severity: 'mild',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing severity', () => {
    const result = AllergenInputSchema.safeParse({ name: 'Peanuts' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = AllergenInputSchema.safeParse({ severity: 'allergy' });
    expect(result.success).toBe(false);
  });
});

describe('AllergenUpdateSchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('accepts valid update input', () => {
    const result = AllergenUpdateSchema.safeParse({
      id: validUUID,
      name: 'Tree Nuts',
      severity: 'allergy',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = AllergenUpdateSchema.safeParse({
      id: 'not-a-uuid',
      name: 'Tree Nuts',
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = AllergenUpdateSchema.safeParse({
      name: 'Tree Nuts',
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = AllergenUpdateSchema.safeParse({
      id: validUUID,
      name: '',
      severity: 'allergy',
    });
    expect(result.success).toBe(false);
  });
});

describe('AllergenDeleteSchema', () => {
  it('accepts valid UUID', () => {
    const result = AllergenDeleteSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = AllergenDeleteSchema.safeParse({ id: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = AllergenDeleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('FoodQueryInputSchema', () => {
  it('accepts valid query text', () => {
    const result = FoodQueryInputSchema.safeParse({
      queryText: 'What can I eat at Olive Garden?',
    });
    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = FoodQueryInputSchema.safeParse({
      queryText: '  Italian food  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.queryText).toBe('Italian food');
    }
  });

  it('rejects empty query', () => {
    const result = FoodQueryInputSchema.safeParse({ queryText: '' });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only query', () => {
    const result = FoodQueryInputSchema.safeParse({ queryText: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects query exceeding 500 characters', () => {
    const result = FoodQueryInputSchema.safeParse({
      queryText: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts query at exactly 500 characters', () => {
    const result = FoodQueryInputSchema.safeParse({
      queryText: 'a'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing queryText', () => {
    const result = FoodQueryInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
