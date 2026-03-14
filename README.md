# Allergy Alert

AI-powered dining guidance for people with food allergies. Users sign in, build an allergy profile, and receive personalized food safety recommendations from Azure AI Foundry.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js App     │────▶│  Azure Cosmos DB │
│  (React +   │     │  (Route Handlers)│     │  (users, queries)│
│   MSAL)     │     └───────┬──────────┘     └──────────────────┘
└─────────────┘             │
       │                    ▼
       │            ┌──────────────────┐
       │            │ Azure AI Foundry │
       │            │ (allergen        │
       │            │  guidance)       │
       │            └──────────────────┘
       ▼
┌─────────────┐
│ Azure AD    │
│ B2C (auth)  │
└─────────────┘
```

**Tech Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS · Azure AD B2C · Azure Cosmos DB · Azure AI Foundry

## Getting Started

### Prerequisites

- Node.js 22 LTS
- pnpm 10+
- Azure subscription with:
  - Azure AD B2C tenant with `B2C_1_signup_signin` user flow
  - Azure Cosmos DB account (database: `allergy-alert`, containers: `users`, `queries`)
  - Azure AI Foundry endpoint with deployed model

### Setup

```bash
pnpm install
cp .env.example .env.local
# Fill in all environment variables in .env.local (see .env.example for details)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable                               | Public | Description                |
| -------------------------------------- | ------ | -------------------------- |
| `NEXT_PUBLIC_AZURE_AD_B2C_TENANT_NAME` | Yes    | B2C tenant name            |
| `NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID`   | Yes    | App registration client ID |
| `AZURE_COSMOS_ENDPOINT`                | No     | Cosmos DB account URI      |
| `AZURE_COSMOS_KEY`                     | No     | Cosmos DB primary key      |
| `AZURE_AI_FOUNDRY_ENDPOINT`            | No     | AI Foundry endpoint URL    |
| `AZURE_AI_FOUNDRY_API_KEY`             | No     | AI Foundry API key         |

### Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `pnpm dev`        | Start development server     |
| `pnpm build`      | Production build             |
| `pnpm test`       | Run unit & integration tests |
| `pnpm type-check` | TypeScript type checking     |
| `pnpm lint`       | ESLint                       |
| `pnpm format`     | Format with Prettier         |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── allergens/route.ts    # CRUD allergen profile
│   │   └── queries/
│   │       ├── route.ts          # POST query, GET history
│   │       └── [id]/route.ts     # DELETE single query
│   ├── profile/page.tsx          # Allergy profile management
│   ├── query/page.tsx            # AI food guidance
│   ├── history/page.tsx          # Query history
│   ├── layout.tsx                # Root layout with auth + nav
│   └── page.tsx                  # Landing page
├── components/
│   ├── features/                 # Feature-specific components
│   ├── providers/                # Auth provider
│   └── ui/                       # Shared UI (Navbar, Skeleton, ErrorBoundary)
├── lib/
│   ├── auth.ts                   # MSAL client config
│   ├── auth-server.ts            # Server-side JWT extraction
│   ├── cosmos.ts                 # Cosmos DB client + CRUD helpers
│   ├── ai-foundry.ts             # Azure AI Foundry client
│   └── validators.ts             # Zod validation schemas
├── types/index.ts                # Shared TypeScript interfaces
└── middleware.ts                 # Route protection
```

## Specs & Design

See [specs/001-allergy-alert-mvp/](specs/001-allergy-alert-mvp/) for:

- [spec.md](specs/001-allergy-alert-mvp/spec.md) — Feature specification
- [plan.md](specs/001-allergy-alert-mvp/plan.md) — Implementation plan
- [data-model.md](specs/001-allergy-alert-mvp/data-model.md) — Cosmos DB data model
- [contracts/](specs/001-allergy-alert-mvp/contracts/) — API contracts
- [quickstart.md](specs/001-allergy-alert-mvp/quickstart.md) — Azure setup guide
