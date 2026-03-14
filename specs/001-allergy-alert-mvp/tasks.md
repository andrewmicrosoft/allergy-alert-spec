# Tasks: Allergy Alert MVP

**Input**: Design documents from `/specs/001-allergy-alert-mvp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and developer experience configuration

- [x] T001 Initialize Next.js 14+ project using `pnpm create next-app` with App Router, TypeScript, Tailwind CSS, and `src/` directory in the repository root
- [x] T002 [P] Install project dependencies (`@azure/msal-react`, `@azure/msal-browser`, `@azure/cosmos`, `@azure-rest/ai-inference`, `@azure/core-auth`, `zod`, `uuid`, `server-only`) and dev dependencies (`vitest`, `@testing-library/react`, `playwright`, `@types/uuid`) via pnpm
- [x] T003 [P] Enable TypeScript strict mode and configure `@/*` path alias in tsconfig.json
- [x] T004 [P] Create `.nvmrc` with Node.js LTS version and `.env.example` with all environment variable placeholders (see quickstart.md for full list)
- [x] T005 [P] Configure Prettier in `.prettierrc` and add `format`, `type-check` scripts to package.json
- [x] T006 [P] Configure ESLint in `.eslintrc.json` with `next/core-web-vitals` and `typescript-eslint` rule sets per constitution Technology Standards
- [x] T007 Configure husky and lint-staged for pre-commit hooks (ESLint, Prettier, type-check on staged files)
- [x] T008 [P] Create `.github/workflows/ci.yml` GitHub Actions workflow running `pnpm lint`, `pnpm type-check`, and `pnpm test` on every pull request per constitution Development Workflow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Define shared TypeScript interfaces (`UserDocument`, `Allergen`, `QueryDocument`) in src/types/index.ts per data-model.md
- [x] T010 [P] Create Zod validation schemas (`AllergenInputSchema`, `AllergenUpdateSchema`, `FoodQueryInputSchema`) with inferred types in src/lib/validators.ts per data-model.md
- [x] T011 [P] Implement MSAL authentication configuration (B2C authority, client ID, policies, scopes, redirect URIs) and token-extraction helper in src/lib/auth.ts per research.md section 1
- [x] T012 [P] Implement Cosmos DB singleton client with `getDatabase()`, `getUsersContainer()`, and `getQueriesContainer()` helpers in src/lib/cosmos.ts — import `server-only` per research.md section 2
- [x] T013 [P] Implement Azure AI Foundry client with `getAllergyGuidance(allergens, foodQuery)` function using `@azure-rest/ai-inference` and API key auth in src/lib/ai-foundry.ts — import `server-only`, include non-food-query handling in system prompt, set `maxDuration: 60` per research.md section 3
- [x] T014 Create `MsalAuthProvider` wrapper component initializing `PublicClientApplication` with config from src/lib/auth.ts, including `logoutRedirect()` handler for Sign Out in src/components/providers/AuthProvider.tsx
- [x] T015 [P] Configure Content-Security-Policy and security response headers in next.config.ts per research.md section 4
- [x] T016 Implement Next.js middleware protecting `/profile`, `/query`, `/history`, and `/api/*` routes — redirect unauthenticated users to login in src/middleware.ts
- [x] T017 Create root layout wrapping the app with `MsalAuthProvider`, global Tailwind styles, and a responsive navigation bar (Home, Profile, Query, History, Sign Out) in src/app/layout.tsx
- [x] T018 Create landing/home page with app description and Azure AD B2C sign-in call-to-action button in src/app/page.tsx
- [x] T019 [P] Unit tests for Zod schemas in **tests**/unit/lib/validators.test.ts — valid inputs, invalid inputs, edge cases (empty string, oversized string, invalid severity)
- [x] T020 [P] Unit tests for `getAllergyGuidance()` prompt construction in **tests**/unit/lib/ai-foundry.test.ts — mock AI Foundry SDK, verify system prompt content and allergen formatting

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Create Account and Allergy Profile (Priority: P1) 🎯 MVP

**Goal**: Users sign up via Azure AD B2C, build an allergen profile (allergy vs. intolerance), and persist it in Cosmos DB across sessions.

**Independent Test**: A user can sign up, log in, add "Peanuts" (allergy) and "Lactose" (intolerance), log out, log back in, and see both allergens persisted with correct severity labels.

### Implementation for User Story 1

- [x] T021 [P] [US1] Implement user profile CRUD helpers (`getUser`, `upsertUser`, `addAllergen`, `updateAllergen`, `removeAllergen`) operating on the `users` container in src/lib/cosmos.ts — include case-insensitive duplicate allergen detection
- [x] T022 [US1] Implement allergens Route Handler with GET (list allergens), POST (add allergen), PUT (update allergen), DELETE (remove allergen) — validate with Zod, extract userId from MSAL token, return responses per contracts/allergens-api.md in src/app/api/allergens/route.ts
- [x] T023 [P] [US1] Create `AllergenForm` component with name text input, severity radio selector (allergy/intolerance), and submit button — call POST /api/allergens on submit in src/components/features/AllergenForm.tsx
- [x] T024 [P] [US1] Create `AllergenList` component displaying allergens with severity badges, inline edit capability, and delete button — call PUT/DELETE /api/allergens on action in src/components/features/AllergenList.tsx
- [x] T025 [US1] Build profile page composing `AllergenForm` and `AllergenList`, fetch allergens on mount via GET /api/allergens, show empty state for new users in src/app/profile/page.tsx

### Tests for User Story 1

- [x] T026 [P] [US1] Unit tests for Cosmos CRUD helpers (`getUser`, `addAllergen`, `updateAllergen`, `removeAllergen`, duplicate detection) in **tests**/unit/lib/cosmos-users.test.ts — mock `@azure/cosmos` container operations
- [x] T027 [P] [US1] Integration tests for GET/POST/PUT/DELETE /api/allergens in **tests**/integration/api/allergens.test.ts — mock Cosmos client, verify Zod validation, 401 on missing auth, 409 on duplicate, 404 on missing allergen

**Checkpoint**: User Story 1 is fully functional and tested — users can sign up, manage allergens, and see them persisted across sessions

---

## Phase 4: User Story 2 — Get AI-Powered Allergen Guidance (Priority: P2)

**Goal**: Users submit a food query (restaurant name or food type) and receive personalized allergen guidance from Azure AI Foundry with a medical disclaimer.

**Independent Test**: A user with "Peanuts" and "Shellfish" saved submits "Thai food" and receives AI guidance mentioning peanut and shellfish risks, safer alternatives, and a medical disclaimer.

### Implementation for User Story 2

- [x] T028 [US2] Implement food query persistence helper (`createQuery`) in src/lib/cosmos.ts — reuse `getUser` from T021 for allergen snapshot
- [x] T029 [US2] Implement POST /api/queries handler — validate with `FoodQueryInputSchema`, check user has ≥1 allergen (return 422 if empty), call `getAllergyGuidance()`, append medical disclaimer, store `QueryDocument` in Cosmos DB, return response per contracts/queries-api.md in src/app/api/queries/route.ts
- [x] T030 [P] [US2] Create `FoodQueryForm` component with free-text input (max 500 chars), submit button, and loading spinner — call POST /api/queries on submit in src/components/features/FoodQueryForm.tsx
- [x] T031 [P] [US2] Create `GuidanceDisplay` component rendering AI guidance text and styled medical disclaimer block in src/components/features/GuidanceDisplay.tsx
- [x] T032 [US2] Build query page composing `FoodQueryForm` and `GuidanceDisplay` — show empty-profile guard redirecting to /profile when user has no allergens, display error message on AI service failure (503) in src/app/query/page.tsx

### Tests for User Story 2

- [x] T033 [P] [US2] Unit tests for `createQuery` helper and AI prompt construction in **tests**/unit/lib/cosmos-queries.test.ts — mock Cosmos container, verify allergen snapshot and disclaimer appended
- [x] T034 [P] [US2] Integration tests for POST /api/queries in **tests**/integration/api/queries-post.test.ts — mock Cosmos + AI Foundry, verify 422 on empty profile, 503 on AI failure, 200 with guidance + disclaimer

**Checkpoint**: User Stories 1 AND 2 are both independently functional and tested — users can manage allergens and get AI dining guidance

---

## Phase 5: User Story 3 — View Query History (Priority: P3)

**Goal**: Users view past food queries and AI responses in reverse chronological order, and can delete individual entries.

**Independent Test**: A user submits two food queries, navigates to history, sees both listed newest-first with dates, expands one to read the full response, and deletes the other.

### Implementation for User Story 3

- [x] T035 [US3] Implement GET /api/queries handler with pagination (`limit`, `continuationToken` query params), return queries in reverse chronological order per contracts/queries-api.md in src/app/api/queries/route.ts
- [x] T036 [US3] Implement `deleteQuery` helper in src/lib/cosmos.ts and DELETE /api/queries/[id] Route Handler with ownership verification (userId must match token) in src/app/api/queries/[id]/route.ts
- [x] T037 [P] [US3] Create `QueryHistoryItem` component displaying query text, date, expand/collapse for full guidance, and delete button with confirmation in src/components/features/QueryHistoryItem.tsx
- [x] T038 [P] [US3] Create `QueryHistoryList` component rendering a list of `QueryHistoryItem` entries with pagination controls in src/components/features/QueryHistoryList.tsx
- [x] T039 [US3] Build history page composing `QueryHistoryList`, show empty state message when no past queries exist in src/app/history/page.tsx

### Tests for User Story 3

- [x] T040 [P] [US3] Integration tests for GET /api/queries in **tests**/integration/api/queries-get.test.ts — mock Cosmos, verify pagination, reverse chronological order, empty history response
- [x] T041 [P] [US3] Integration tests for DELETE /api/queries/[id] in **tests**/integration/api/queries-delete.test.ts — mock Cosmos, verify ownership check (404 if wrong user), 200 on successful delete

**Checkpoint**: All three user stories are independently functional and tested

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements, validation, and security hardening that affect multiple user stories

- [x] T042 [P] Add responsive design refinements (mobile-friendly nav, form layouts, card components) across all pages using Tailwind breakpoints
- [x] T043 [P] Add loading skeletons for data fetching states and error boundary components for graceful failure handling across all pages
- [x] T044 Run quickstart.md validation — perform full project setup from a clean clone, verify all env vars, dev server startup, and each user story flow end-to-end
- [x] T045 Security audit — verify all `server-only` imports in src/lib/\*.ts, CSP headers enforced in next.config.ts, Zod validation on every Route Handler, MSAL token verification on all protected routes, no secrets exposed to client bundle, and run `pnpm audit` to check for vulnerable dependencies per constitution §III
- [x] T046 [P] Create project README.md at repository root — app overview, architecture diagram (Next.js + Azure AD B2C + Cosmos DB + AI Foundry), link to quickstart.md, link to specs/, environment variable summary, and contribution guidelines
- [x] T047 [P] Add JSDoc comments to all public functions in src/lib/cosmos.ts, src/lib/ai-foundry.ts, src/lib/auth.ts, and src/lib/validators.ts — document parameters, return types, and error conditions
- [x] T048 [P] Create `.env.example` documentation comments — add inline descriptions above each environment variable explaining its purpose, where to find the value in Azure Portal, and whether it is public or server-only
- [x] T049 [P] Add inline code comments to each Route Handler (src/app/api/allergens/route.ts, src/app/api/queries/route.ts, src/app/api/queries/[id]/route.ts) documenting the request/response contract, auth requirements, and error codes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - User stories proceed sequentially in priority order (P1 → P2 → P3)
  - US2 depends on US1 (needs allergen profile to exist for query guard)
  - US3 depends on US2 (needs query documents to exist for history)
- **Polish (Phase 6)**: Depends on all user stories being complete

### Within Each User Story

- Cosmos DB helpers before Route Handlers
- Route Handlers before UI components
- UI components before page composition
- Core implementation before edge case handling

### Parallel Opportunities

**Phase 1** (after T001):

```
T002 ─┐
T003 ─┤ all parallel
T004 ─┤
T005 ─┤
T006 ─┤
T008 ─┘
 └── T007 (sequential — needs project + ESLint configured)
```

**Phase 2** (after T009):

```
T010 ─┐
T011 ─┤ all parallel (different lib/ files)
T012 ─┤
T013 ─┤
T015 ─┘
 └── T014 (needs T011) ── T016 (needs T011) ── T017 (needs T014) ── T018
T019 ─┐ parallel (test files independent of impl)
T020 ─┘
```

**Phase 3**:

```
T021 (cosmos helpers) ── T022 (route handler)
                              └── T025 (profile page)
T023 ─┐ parallel (different component files)
T024 ─┘ ── T025 (profile page, uses both)
T026 ─┐ parallel (test files)
T027 ─┘
```

**Phase 4**:

```
T028 (cosmos helpers) ── T029 (route handler)
                              └── T032 (query page)
T030 ─┐ parallel (different component files)
T031 ─┘ ── T032 (query page, uses both)
T033 ─┐ parallel (test files)
T034 ─┘
```

**Phase 5**:

```
T035 (GET handler) ─┐
T036 (DELETE handler + cosmos) ─┤── T039 (history page)
T037 ─┐ parallel               │
T038 ─┘ ───────────────────────┘
T040 ─┐ parallel (test files)
T041 ─┘
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T008)
2. Complete Phase 2: Foundational (T009–T020)
3. Complete Phase 3: User Story 1 (T021–T027)
4. **STOP and VALIDATE**: Run unit + integration tests, then manual test sign-up → add allergens → log out → log in → verify persistence
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 + tests → Test independently → Deploy/Demo (**MVP!**)
3. Add User Story 2 + tests → Test independently → Deploy/Demo
4. Add User Story 3 + tests → Test independently → Deploy/Demo
5. Polish → Final security audit + `pnpm audit` → Production-ready
