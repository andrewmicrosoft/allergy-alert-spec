# Research: Allergy Alert MVP

**Date**: 2026-03-13 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## 1. Azure AD B2C + Next.js Integration

**Decision**: Use `@azure/msal-react` and `@azure/msal-browser` with Next.js App Router for Azure AD B2C authentication.

**Rationale**: MSAL.js is Microsoft's official library for Azure AD B2C integration in SPAs and supports React natively via `@azure/msal-react`. Next.js middleware can intercept routes to enforce authentication before page rendering.

**Alternatives considered**:

- NextAuth.js with Azure AD B2C provider — adds a third-party abstraction layer; MSAL gives direct control and is officially supported by Microsoft.
- Custom OAuth2 implementation — unnecessary complexity when MSAL handles all flows (sign-up, sign-in, password reset, token refresh).

**Key decisions**:

- MSAL is initialized in a client-side `AuthProvider` wrapper component at the root layout level.
- Next.js middleware (`middleware.ts`) checks for a valid session token on protected routes (`/profile`, `/query`, `/history`, `/api/*`) and redirects unauthenticated users to login.
- Azure AD B2C user flows: `B2C_1_signup_signin` (combined sign-up/sign-in) and `B2C_1_password_reset`.
- The Azure AD B2C `oid` (object ID) claim is used as the primary user identifier in Cosmos DB.

**Environment variables**:

- `NEXT_PUBLIC_AZURE_AD_B2C_TENANT_NAME` — B2C tenant name
- `NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID` — Application (client) ID
- `NEXT_PUBLIC_AZURE_AD_B2C_POLICY_NAME` — Sign-up/sign-in policy name
- `AZURE_AD_B2C_CLIENT_SECRET` — Server-side only, for confidential client flows if needed

## 2. Azure Cosmos DB with Next.js

**Decision**: Use `@azure/cosmos` SDK with a singleton client instance in `src/lib/cosmos.ts`.

**Rationale**: Official Microsoft SDK, supports both partition key routing and query-level operations, works natively in Node.js server-side contexts.

**Alternatives considered**:

- Prisma with Cosmos DB connector — Prisma's Cosmos support is limited and doesn't leverage partition keys effectively.
- Direct REST API calls — adds unnecessary boilerplate when the SDK handles serialization, retries, and connection pooling.

**Key decisions**:

- **Database**: `allergy-alert`
- **Containers**:
  - `users` — partition key: `/id` (Azure AD B2C `oid`). Stores user profile with embedded allergens array.
  - `queries` — partition key: `/userId`. Stores food queries and their AI responses.
- Allergens are embedded in the user document (not a separate container) because they are always read/written together with the user profile, and the list is small (typically < 50 items).
- Queries are in a separate container because they grow unboundedly and are queried independently (history view, deletion).
- Cosmos DB client is instantiated once per cold start via module-level singleton pattern, avoiding reconnection overhead.

**Environment variables**:

- `AZURE_COSMOS_ENDPOINT` — Cosmos DB account endpoint
- `AZURE_COSMOS_KEY` — Primary key (server-side only)
- `AZURE_COSMOS_DATABASE` — Database name (default: `allergy-alert`)

## 3. Azure AI Foundry Integration

**Decision**: Use `@azure-rest/ai-inference` SDK with API key authentication, called exclusively from Next.js Route Handlers.

**Rationale**: The `@azure-rest/ai-inference` package is the official lightweight REST client for Azure AI model inference. API key authentication is simpler than token-based auth for MVP and the user will provide the key.

**Alternatives considered**:

- `@azure/ai-inference` (heavier SDK) — more features but unnecessary for chat completions only.
- Direct `fetch()` to Azure OpenAI REST API — loses type safety and requires manual header management.
- `openai` npm package with Azure config — works but Azure-specific SDK is more appropriate and avoids confusion.

**Key decisions**:

- AI Foundry client is initialized in `src/lib/ai-foundry.ts` as a server-only module.
- System prompt instructs the AI to act as an allergen safety advisor, always appending a medical disclaimer.
- The function accepts the user's allergen list (with severity labels) and the food query text, constructs the chat completion request, and returns the guidance text.
- API key is stored in `AZURE_AI_FOUNDRY_API_KEY` env var and never exposed to the client.
- `max_tokens` set to 1000 for detailed guidance; adjustable via env var.
- Route Handler sets `maxDuration: 60` to prevent timeouts on slow AI responses.

**Environment variables**:

- `AZURE_AI_FOUNDRY_ENDPOINT` — Model endpoint URL
- `AZURE_AI_FOUNDRY_API_KEY` — API key (server-side only)
- `AZURE_AI_FOUNDRY_MODEL_NAME` — Deployment/model name (e.g., `gpt-4`)

## 4. Next.js Security Features

**Decision**: Utilize all built-in Next.js security capabilities.

**Rationale**: Next.js App Router provides several security mechanisms out of the box that align with the constitution's OWASP Top 10 requirements.

**Key decisions**:

- **Server Components by default** — sensitive logic (Cosmos DB, AI Foundry) never reaches the client bundle.
- **Route Handlers for API** — all backend logic runs server-side; no API keys or secrets leak to the browser.
- **`middleware.ts`** — enforces authentication on all protected routes before they render.
- **Content-Security-Policy headers** — configured in `next.config.ts` via `headers()` to prevent XSS.
- **CSRF protection** — Next.js Server Actions include CSRF tokens by default; Route Handlers validated via MSAL token verification.
- **Input validation** — Zod schemas validate all request bodies in Route Handlers at the API boundary.
- **`server-only` package** — imported in `src/lib/cosmos.ts` and `src/lib/ai-foundry.ts` to prevent accidental client-side imports.
- **Environment variable separation** — only `NEXT_PUBLIC_*` vars are exposed to the client; all secrets use unprefixed names.

## 5. Tailwind CSS Setup

**Decision**: Tailwind CSS v3+ with default configuration, extended as needed.

**Rationale**: Specified by user; widely adopted, utility-first approach enables rapid UI development without context-switching to separate CSS files.

**Key decisions**:

- Tailwind configured in `tailwind.config.ts` with content paths pointing to `src/**/*.{ts,tsx}`.
- `globals.css` contains `@tailwind base`, `@tailwind components`, `@tailwind utilities` directives.
- No additional UI component library at MVP — Tailwind utilities are sufficient for ~6 views.
- Dark mode: not required for MVP; can be added later via Tailwind's `dark:` variant.

## 6. Testing Strategy

**Decision**: Vitest for unit tests, Playwright for E2E tests.

**Rationale**: Vitest is fast, TypeScript-native, and compatible with the Next.js/React ecosystem. Playwright provides reliable cross-browser E2E testing.

**Key decisions**:

- Unit tests cover: Zod schemas, Cosmos DB query builders, AI prompt construction, utility functions.
- Integration tests cover: Route Handlers with mocked Cosmos DB and AI Foundry clients.
- E2E tests cover: full user flows (sign up → add allergens → query → view history).
- External services (Cosmos DB, AI Foundry, Azure AD B2C) are mocked in unit/integration tests.
- Test files mirrored in `__tests__/` directory structure.
