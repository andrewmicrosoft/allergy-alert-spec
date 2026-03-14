/**
 * Allergens API Route Handler
 *
 * Manages the authenticated user's allergen profile (embedded in UserDocument).
 *
 * Auth: Bearer token required (Azure AD B2C JWT). userId extracted from `oid` claim.
 * Validation: All mutation endpoints validate input with Zod schemas.
 *
 * Endpoints:
 *   GET    /api/allergens         → 200 { allergens[] } | 401
 *   POST   /api/allergens         → 201 { allergen }   | 400 | 401 | 409
 *   PUT    /api/allergens         → 200 { allergen }   | 400 | 401 | 404 | 409
 *   DELETE /api/allergens         → 200 { success }    | 400 | 401 | 404
 *
 * See contracts/allergens-api.md for full request/response schemas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { extractUserFromToken } from '@/lib/auth-server';
import { getUser, addAllergen, updateAllergen, removeAllergen } from '@/lib/cosmos';
import { AllergenInputSchema, AllergenUpdateSchema, AllergenDeleteSchema } from '@/lib/validators';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** GET /api/allergens — list the authenticated user's allergens */
export async function GET(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const doc = await getUser(user.userId);
  return NextResponse.json({ allergens: doc?.allergens ?? [] });
}

/** POST /api/allergens — add a new allergen */
export async function POST(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = AllergenInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await addAllergen(user.userId, user.email, parsed.data.name, parsed.data.severity);

  if (result.conflict) {
    return NextResponse.json(
      { error: `Allergen '${parsed.data.name}' already exists in your profile` },
      { status: 409 },
    );
  }

  return NextResponse.json({ allergen: result.allergen }, { status: 201 });
}

/** PUT /api/allergens — update an existing allergen */
export async function PUT(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = AllergenUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await updateAllergen(
    user.userId,
    parsed.data.id,
    parsed.data.name,
    parsed.data.severity,
  );

  if (result === null) {
    return NextResponse.json({ error: 'Allergen not found' }, { status: 404 });
  }

  if (result.conflict) {
    return NextResponse.json(
      { error: `Allergen '${parsed.data.name}' already exists in your profile` },
      { status: 409 },
    );
  }

  return NextResponse.json({ allergen: result.allergen });
}

/** DELETE /api/allergens — remove an allergen */
export async function DELETE(request: NextRequest) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = AllergenDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const removed = await removeAllergen(user.userId, parsed.data.id);
  if (!removed) {
    return NextResponse.json({ error: 'Allergen not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
