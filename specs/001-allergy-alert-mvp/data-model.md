# Data Model: Allergy Alert MVP

**Date**: 2026-03-13 | **Storage**: Azure Cosmos DB (NoSQL) | **Database**: `allergy-alert`

## Containers

### 1. `users` Container

**Partition Key**: `/id`

Stores user profiles with embedded allergen lists. A user document is created on first sign-in (upsert pattern using Azure AD B2C `oid`).

```typescript
interface UserDocument {
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

interface Allergen {
  /** Unique ID within the allergens array (UUID v4) */
  id: string;
  /** Display name of the allergen (e.g., "Peanuts", "Lactose") */
  name: string;
  /** Severity classification */
  severity: 'allergy' | 'intolerance';
  /** ISO 8601 timestamp when added */
  addedAt: string;
}
```

**Validation rules**:

- `name`: required, 1–100 characters, trimmed, case-insensitive uniqueness within a user's list
- `severity`: required, must be `"allergy"` or `"intolerance"`
- Duplicate allergen names (case-insensitive) are rejected with a user-facing message

**Access patterns**:
| Operation | Query | RU Estimate |
|-----------|-------|-------------|
| Get user profile | Point read by `id` | ~1 RU |
| Upsert user (first login) | Upsert by `id` | ~5 RU |
| Update allergens | Replace document by `id` | ~5 RU |

### 2. `queries` Container

**Partition Key**: `/userId`

Stores food queries and their AI-generated guidance responses. Each document represents one query–response pair.

```typescript
interface QueryDocument {
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
```

**Validation rules**:

- `queryText`: required, 1–500 characters, trimmed
- `guidance`: populated by AI response, never user-edited
- `disclaimer`: constant text appended by the system

**Access patterns**:
| Operation | Query | RU Estimate |
|-----------|-------|-------------|
| Create query + response | Insert by `userId` partition | ~5 RU |
| List user's history | Query by `userId`, ORDER BY `createdAt` DESC | ~5–10 RU |
| Delete single query | Delete by `id` + `userId` partition | ~5 RU |

## Entity Relationship Diagram

```
┌──────────────────────────┐
│         User             │
│  (users container)       │
├──────────────────────────┤
│  id (B2C oid)  [PK]     │
│  email                   │
│  allergens[]  ◄──────────┼──── embedded
│  createdAt               │
│  updatedAt               │
└──────────┬───────────────┘
           │ 1:N
           │ userId
┌──────────▼───────────────┐
│     QueryDocument        │
│  (queries container)     │
├──────────────────────────┤
│  id (UUID)               │
│  userId (B2C oid)  [PK]  │
│  queryText               │
│  allergens[]  (snapshot) │
│  guidance                │
│  disclaimer              │
│  createdAt               │
└──────────────────────────┘
```

## Design Decisions

1. **Allergens embedded in User** — allergens are always read/written with the user document, and the array is bounded (typically < 50 items). Embedding avoids cross-partition joins.

2. **Allergen snapshot in QueryDocument** — the `allergens` array is copied into each query document so that historical guidance can be understood in the context of the allergens that were active at query time, even if the profile changes later.

3. **Two containers** — users and queries are separated because queries grow unboundedly and have different access patterns (paginated history listing, individual deletion). Co-locating would bloat user documents.

4. **No TTL** — query history is retained indefinitely. Users can manually delete entries (FR-013). TTL can be considered post-MVP if storage costs become a concern.

## Zod Schemas (API Boundary Validation)

```typescript
// src/lib/validators.ts
import { z } from 'zod';

export const AllergenInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  severity: z.enum(['allergy', 'intolerance']),
});

export const AllergenUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  severity: z.enum(['allergy', 'intolerance']),
});

export const FoodQueryInputSchema = z.object({
  queryText: z.string().trim().min(1).max(500),
});

export type AllergenInput = z.infer<typeof AllergenInputSchema>;
export type AllergenUpdate = z.infer<typeof AllergenUpdateSchema>;
export type FoodQueryInput = z.infer<typeof FoodQueryInputSchema>;
```
