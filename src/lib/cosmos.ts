import 'server-only';

import { CosmosClient, Container, Database } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';
import type { Allergen, UserDocument, QueryDocument } from '@/types';

const endpoint = process.env.AZURE_COSMOS_ENDPOINT ?? '';
const key = process.env.AZURE_COSMOS_KEY ?? '';
const databaseName = process.env.AZURE_COSMOS_DATABASE ?? 'allergy-alert';

/** Singleton Cosmos DB client — instantiated once per cold start */
let client: CosmosClient | null = null;

function getClient(): CosmosClient {
  if (!client) {
    if (!endpoint || !key) {
      throw new Error('AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY must be set');
    }
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

/** Get the Cosmos DB database reference */
export function getDatabase(): Database {
  return getClient().database(databaseName);
}

/** Get the `users` container (partition key: /id) */
export function getUsersContainer(): Container {
  return getDatabase().container('users');
}

/** Get the `queries` container (partition key: /userId) */
export function getQueriesContainer(): Container {
  return getDatabase().container('queries');
}

// ─── User Profile CRUD ────────────────────────────────────────────────

/**
 * Retrieve a user document by Azure AD B2C oid.
 * Returns null if the user does not exist yet.
 */
export async function getUser(userId: string): Promise<UserDocument | null> {
  const { resource } = await getUsersContainer().item(userId, userId).read<UserDocument>();
  return resource ?? null;
}

/**
 * Create or update a user document (upsert pattern for first sign-in).
 */
export async function upsertUser(user: UserDocument): Promise<UserDocument> {
  const { resource } = await getUsersContainer().items.upsert<UserDocument>(user);
  return resource!;
}

/**
 * Add a new allergen to a user's profile.
 * Rejects duplicate allergen names (case-insensitive).
 * Creates the user document if it doesn't exist.
 */
export async function addAllergen(
  userId: string,
  email: string,
  name: string,
  severity: Allergen['severity'],
): Promise<{ allergen: Allergen; conflict: false } | { conflict: true }> {
  let user = await getUser(userId);
  if (!user) {
    user = {
      id: userId,
      email,
      allergens: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const duplicate = user.allergens.some((a) => a.name.toLowerCase() === name.toLowerCase());
  if (duplicate) return { conflict: true };

  const allergen: Allergen = {
    id: uuidv4(),
    name,
    severity,
    addedAt: new Date().toISOString(),
  };

  user.allergens.push(allergen);
  user.updatedAt = new Date().toISOString();
  await upsertUser(user);

  return { allergen, conflict: false };
}

/**
 * Update an existing allergen's name and/or severity.
 * Returns null if the allergen is not found.
 * Returns { conflict: true } if renaming would create a duplicate.
 */
export async function updateAllergen(
  userId: string,
  allergenId: string,
  name: string,
  severity: Allergen['severity'],
): Promise<{ allergen: Allergen; conflict: false } | { conflict: true } | null> {
  const user = await getUser(userId);
  if (!user) return null;

  const index = user.allergens.findIndex((a) => a.id === allergenId);
  if (index === -1) return null;

  // Check for duplicate name (case-insensitive), excluding the allergen being updated
  const duplicate = user.allergens.some(
    (a) => a.id !== allergenId && a.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) return { conflict: true };

  user.allergens[index] = { ...user.allergens[index], name, severity };
  user.updatedAt = new Date().toISOString();
  await upsertUser(user);

  return { allergen: user.allergens[index], conflict: false };
}

/**
 * Remove an allergen from a user's profile.
 * Returns false if the allergen is not found.
 */
export async function removeAllergen(userId: string, allergenId: string): Promise<boolean> {
  const user = await getUser(userId);
  if (!user) return false;

  const index = user.allergens.findIndex((a) => a.id === allergenId);
  if (index === -1) return false;

  user.allergens.splice(index, 1);
  user.updatedAt = new Date().toISOString();
  await upsertUser(user);

  return true;
}

// ─── Query Persistence ────────────────────────────────────────────────

/**
 * Create a new query document in the queries container.
 */
export async function createQuery(query: QueryDocument): Promise<QueryDocument> {
  const { resource } = await getQueriesContainer().items.create<QueryDocument>(query);
  return resource!;
}

/**
 * List a user's queries in reverse chronological order with pagination.
 */
export async function listQueries(
  userId: string,
  limit: number = 20,
  continuationToken?: string,
): Promise<{ queries: QueryDocument[]; continuationToken: string | null }> {
  const querySpec = {
    query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
    parameters: [{ name: '@userId', value: userId }],
  };

  const { resources, continuationToken: nextToken } = await getQueriesContainer()
    .items.query<QueryDocument>(querySpec, {
      maxItemCount: limit,
      continuationToken,
      partitionKey: userId,
    })
    .fetchNext();

  return { queries: resources, continuationToken: nextToken ?? null };
}

/**
 * Delete a query document. Returns false if not found or ownership mismatch.
 */
export async function deleteQuery(queryId: string, userId: string): Promise<boolean> {
  try {
    await getQueriesContainer().item(queryId, userId).delete();
    return true;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 404) {
      return false;
    }
    throw err;
  }
}
