import 'server-only';

/**
 * Extract user claims (oid, email) from a JWT Bearer token.
 * Decodes the JWT payload (base64) — the middleware already verifies token presence.
 * Returns null if the token is missing or malformed.
 */
export function extractUserFromToken(
  authHeader: string | null,
): { userId: string; email: string } | null {
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));

    const userId = payload.oid as string | undefined;
    if (!userId) return null;

    const email =
      (payload.emails as string[] | undefined)?.[0] ?? (payload.email as string | undefined) ?? '';

    return { userId, email };
  } catch {
    return null;
  }
}
