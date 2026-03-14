/**
 * Queries API Route Handler
 *
 * Submits food queries for AI guidance and retrieves query history.
 *
 * Auth: Bearer token required (Azure AD B2C JWT). userId extracted from `oid` claim.
 * Validation: POST validates with FoodQueryInputSchema (Zod).
 *
 * Endpoints:
 *   POST /api/queries  → 200 { query } | 400 | 401 | 422 | 503
 *   GET  /api/queries  → 200 { queries[], continuationToken } | 401
 *
 * POST workflow: validate → check allergen profile → call AI Foundry → persist → respond
 * GET supports pagination via `limit` and `continuationToken` query params.
 *
 * See contracts/queries-api.md for full request/response schemas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractUserFromToken } from '@/lib/auth-server';
import { getUser, createQuery, listQueries } from '@/lib/cosmos';
import { getAllergyGuidance } from '@/lib/ai-foundry';
import { FoodQueryInputSchema } from '@/lib/validators';
import { MEDICAL_DISCLAIMER } from '@/types';
import type { QueryDocument } from '@/types';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** POST /api/queries — submit a food query, get AI guidance */
export async function POST(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = FoodQueryInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Check that the user has at least one allergen
  const userDoc = await getUser(user.userId);
  if (!userDoc || userDoc.allergens.length === 0) {
    return NextResponse.json(
      { error: 'Please add at least one allergen to your profile before submitting a food query.' },
      { status: 422 },
    );
  }

  // Call AI Foundry for guidance
  let guidance: string;
  try {
    guidance = await getAllergyGuidance(userDoc.allergens, parsed.data.queryText);
  } catch {
    return NextResponse.json(
      { error: 'The AI guidance service is temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }

  // Persist the query document
  const queryDoc: QueryDocument = {
    id: uuidv4(),
    userId: user.userId,
    queryText: parsed.data.queryText,
    allergens: userDoc.allergens,
    guidance,
    disclaimer: MEDICAL_DISCLAIMER,
    createdAt: new Date().toISOString(),
  };

  const saved = await createQuery(queryDoc);
  return NextResponse.json({ query: saved });
}

/** GET /api/queries — list user's query history with pagination */
export async function GET(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 1), 100);
  const continuationToken = searchParams.get('continuationToken') ?? undefined;

  const result = await listQueries(user.userId, limit, continuationToken);
  return NextResponse.json(result);
}
