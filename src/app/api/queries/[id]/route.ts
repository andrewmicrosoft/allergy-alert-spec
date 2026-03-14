/**
 * Single Query Route Handler
 *
 * Deletes a specific query history entry. Ownership verification ensures
 * users can only delete their own queries (userId partition key match).
 *
 * Auth: Bearer token required. Validation: ID param validated as UUID.
 *
 * Endpoints:
 *   DELETE /api/queries/[id]  → 200 { success } | 400 | 401 | 404
 *
 * See contracts/queries-api.md for full request/response schemas.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod/v4';
import { extractUserFromToken } from '@/lib/auth-server';
import { deleteQuery } from '@/lib/cosmos';

const ParamsSchema = z.object({ id: z.uuid() });

/** DELETE /api/queries/[id] — delete a specific query history entry */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = extractUserFromToken(request.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query ID' }, { status: 400 });
  }

  const deleted = await deleteQuery(parsed.data.id, user.userId);
  if (!deleted) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
