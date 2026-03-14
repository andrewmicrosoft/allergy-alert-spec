/** Shared TypeScript interfaces for Allergy Alert MVP — mirrors data-model.md */

/** Severity classification for allergens */
export type AllergenSeverity = 'allergy' | 'intolerance';

/** A food item a user cannot or should not eat */
export interface Allergen {
  /** Unique ID within the allergens array (UUID v4) */
  id: string;
  /** Display name of the allergen (e.g., "Peanuts", "Lactose") */
  name: string;
  /** Severity classification */
  severity: AllergenSeverity;
  /** ISO 8601 timestamp when added */
  addedAt: string;
}

/** User profile document stored in the `users` Cosmos DB container */
export interface UserDocument {
  /** Azure AD B2C object ID (oid claim) — also the partition key */
  id: string;
  /** User's email from Azure AD B2C claims */
  email: string;
  /** Embedded allergen list */
  allergens: Allergen[];
  /** ISO 8601 timestamp of account creation */
  createdAt: string;
  /** ISO 8601 timestamp of last profile update */
  updatedAt: string;
}

/** Query + guidance document stored in the `queries` Cosmos DB container */
export interface QueryDocument {
  /** Unique query ID (UUID v4) */
  id: string;
  /** Azure AD B2C oid of the querying user — partition key */
  userId: string;
  /** The user's free-text food query */
  queryText: string;
  /** Snapshot of the user's allergens at query time */
  allergens: Allergen[];
  /** AI-generated guidance response */
  guidance: string;
  /** Medical disclaimer appended to every response */
  disclaimer: string;
  /** ISO 8601 timestamp of query submission */
  createdAt: string;
}

/** Standard medical disclaimer appended to every AI response */
export const MEDICAL_DISCLAIMER =
  'This information is for general guidance only and is not a substitute for professional medical advice. Always inform your server about your allergies and consult your healthcare provider for personalized dietary guidance.';
