# Implementation Plan: Allergy Alert MVP

**Branch**: `001-allergy-alert-mvp` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-allergy-alert-mvp/spec.md`

## Summary

Build "Allergy Alert", a web application where users log in via Azure AD B2C, manage a personal allergen profile (allergy vs. intolerance), and submit free-text food queries that are sent to an Azure AI Foundry agent for personalized dining guidance. The app is built with Next.js (App Router) + React + TypeScript, styled with Tailwind CSS, backed by Azure Cosmos DB, and uses Next.js Route Handlers as the server-side API layer.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js LTS (specified in `.nvmrc`)  
**Primary Dependencies**: Next.js 14+ (App Router), React 18+, Tailwind CSS, @azure/msal-react, @azure/msal-browser, @azure/cosmos, @azure-rest/ai-inference (Azure AI Foundry SDK), Zod (input validation)  
**Storage**: Azure Cosmos DB (NoSQL — JSON documents)  
**Testing**: Vitest (unit) + Playwright (E2E/integration); Jest acceptable alternative  
**Target Platform**: Web (modern browsers with JS enabled), deployed to Azure  
**Project Type**: Web application (full-stack via Next.js)  
**Performance Goals**: 90% of AI responses displayed within 10 seconds; first-visit onboarding < 5 minutes  
**Constraints**: 500 concurrent users without degradation; HTTPS enforced; all Next.js security features utilized  
**Scale/Scope**: ~6 pages/views, 4 key entities, 1 external AI integration, 1 identity provider

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Gate                              | Constitution Rule                                    | Status | Notes                                                      |
| --------------------------------- | ---------------------------------------------------- | ------ | ---------------------------------------------------------- |
| TypeScript strict mode            | Code Quality: `any` prohibited, strict mode required | PASS   | Plan specifies TypeScript strict mode in tsconfig          |
| ESLint + Prettier pre-commit      | Code Quality: must run on every commit               | PASS   | Will configure lint-staged + husky                         |
| Schema validation at API boundary | Code Quality: Zod at API routes                      | PASS   | Zod listed as dependency; all Route Handlers will validate |
| Input sanitization server-side    | Security: prevent injection/XSS                      | PASS   | Next.js server components + Zod + server-side sanitization |
| Auth on every protected route     | Security: enforced on every API route/server action  | PASS   | MSAL.js + middleware guards all protected routes           |
| Secrets in env vars               | Security: never committed                            | PASS   | `.env.local` for secrets, `.env.example` committed         |
| HTTPS enforced                    | Security: all deployed environments                  | PASS   | Azure deployment enforces HTTPS                            |
| OWASP Top 10 review               | Security: code reviews must check                    | PASS   | Will include in PR checklist                               |
| Next.js App Router                | Technology: Next.js App Router required              | PASS   | Explicitly chosen                                          |
| Tailwind CSS                      | Technology: required for styling                     | PASS   | Explicitly chosen by user                                  |
| pnpm + lockfile                   | Technology: pnpm, lockfile committed                 | PASS   | Will use pnpm                                              |
| Node LTS in .nvmrc                | Technology: LTS specified                            | PASS   | Will create .nvmrc                                         |
| Conventional Commits              | Workflow: required format                            | PASS   | Will enforce                                               |
| Feature branches only             | Workflow: no direct pushes to main                   | PASS   | Working on `001-allergy-alert-mvp` branch                  |
| Unit + integration tests          | Testing: business logic + API routes covered         | PASS   | Vitest (unit) + Playwright (integration)                   |
| Tests co-located                  | Testing: co-located or mirrored `__tests__/`         | PASS   | Will use `__tests__/` mirrored pattern                     |

**Pre-research gate result**: ALL PASS — no violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-allergy-alert-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API route contracts)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (providers, nav)
│   ├── page.tsx                # Landing / home page
│   ├── profile/
│   │   └── page.tsx            # Allergen profile management
│   ├── query/
│   │   └── page.tsx            # Food query submission + results
│   ├── history/
│   │   └── page.tsx            # Query history view
│   └── api/                    # Next.js Route Handlers (backend)
│       ├── allergens/
│       │   └── route.ts        # GET, POST, PUT, DELETE allergens
│       ├── queries/
│       │   └── route.ts        # POST food query → AI, GET history
│       └── queries/[id]/
│           └── route.ts        # DELETE individual history entry
├── components/                 # Shared React components
│   ├── ui/                     # Generic UI primitives
│   └── features/               # Feature-specific components
├── lib/                        # Server-side utilities
│   ├── cosmos.ts               # Cosmos DB client & helpers
│   ├── ai-foundry.ts           # Azure AI Foundry client
│   ├── auth.ts                 # MSAL config & token helpers
│   └── validators.ts           # Zod schemas
├── hooks/                      # Custom React hooks
├── types/                      # Shared TypeScript types
└── styles/
    └── globals.css             # Tailwind directives

__tests__/
├── unit/
│   ├── lib/
│   └── components/
├── integration/
│   └── api/
└── e2e/

public/                         # Static assets
```

**Structure Decision**: Single Next.js project using App Router. Next.js Route Handlers under `src/app/api/` serve as the backend — no separate backend project needed. All server-side logic (Cosmos DB, AI Foundry, auth validation) lives in `src/lib/` and is called only from Route Handlers and Server Components.

## Complexity Tracking

No constitution violations detected. No justifications required.

## Post-Design Constitution Re-Check

_Re-evaluated after Phase 1 design artifacts were produced._

| Gate                              | Constitution Rule                   | Status | Evidence                                                                                                              |
| --------------------------------- | ----------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| TypeScript strict mode            | `any` prohibited, strict mode       | PASS   | All type interfaces defined in data-model.md; Zod schemas enforce types at boundaries                                 |
| ESLint + Prettier pre-commit      | Must run on every commit            | PASS   | quickstart.md includes `pnpm lint` and `pnpm format` commands; husky + lint-staged planned                            |
| Schema validation at API boundary | Zod at API routes                   | PASS   | Zod schemas defined in data-model.md; all Route Handlers validate via `AllergenInputSchema`, `FoodQueryInputSchema`   |
| Input sanitization server-side    | Prevent injection/XSS               | PASS   | All AI Foundry and Cosmos calls are server-side only (`server-only` package); Zod trims and constrains input          |
| Auth on every protected route     | Enforced on every API route         | PASS   | Contracts specify 401 on all endpoints; middleware.ts enforces auth                                                   |
| Secrets in env vars               | Never committed                     | PASS   | quickstart.md separates `.env.local` (secrets) from `.env.example` (template); only `NEXT_PUBLIC_*` exposed to client |
| HTTPS enforced                    | All deployed environments           | PASS   | Azure deployment enforces; noted in research.md                                                                       |
| OWASP Top 10 review               | Code reviews must check             | PASS   | CSP headers, server-only modules, token verification all documented in research.md                                    |
| Next.js App Router                | Required                            | PASS   | Project structure uses `src/app/` with Route Handlers                                                                 |
| Tailwind CSS                      | Required for styling                | PASS   | Listed in dependencies; `globals.css` with Tailwind directives in structure                                           |
| pnpm + lockfile                   | pnpm, lockfile committed            | PASS   | quickstart.md uses `pnpm` exclusively                                                                                 |
| Node LTS in .nvmrc                | LTS specified                       | PASS   | `.nvmrc` in project structure                                                                                         |
| Conventional Commits              | Required format                     | PASS   | Noted in plan                                                                                                         |
| Feature branches only             | No direct pushes to main            | PASS   | Working on `001-allergy-alert-mvp` branch                                                                             |
| Unit + integration tests          | Business logic + API routes covered | PASS   | Vitest (unit) + Playwright (E2E) in quickstart.md                                                                     |
| Tests co-located                  | Co-located or mirrored `__tests__/` | PASS   | `__tests__/` mirrored structure in project layout                                                                     |

**Post-design gate result**: ALL PASS — no violations. Ready for task generation.
