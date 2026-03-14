import { z } from 'zod/v4';

/** Schema for adding a new allergen */
export const AllergenInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Allergen name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  severity: z.enum(['allergy', 'intolerance']),
});

/** Schema for updating an existing allergen */
export const AllergenUpdateSchema = z.object({
  id: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'Allergen name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  severity: z.enum(['allergy', 'intolerance']),
});

/** Schema for deleting an allergen */
export const AllergenDeleteSchema = z.object({
  id: z.uuid(),
});

/** Schema for submitting a food query */
export const FoodQueryInputSchema = z.object({
  queryText: z
    .string()
    .trim()
    .min(1, 'Query text is required')
    .max(500, 'Query must be 500 characters or fewer'),
});

export type AllergenInput = z.infer<typeof AllergenInputSchema>;
export type AllergenUpdate = z.infer<typeof AllergenUpdateSchema>;
export type AllergenDelete = z.infer<typeof AllergenDeleteSchema>;
export type FoodQueryInput = z.infer<typeof FoodQueryInputSchema>;
