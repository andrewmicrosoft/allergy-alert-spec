<!--
  Sync Impact Report
  ───────────────────
  Version change: 1.0.0 → 1.0.1 (wording tightened, fluff removed)
  Modified:
    - I. Code Quality: removed vague intro sentence
    - II. Testing: removed vague intro sentence, tightened mocks rule
    - III. Security: removed vague intro sentence, deduped input
      validation (schema validation stays in Code Quality), replaced
      "considered" and "regularly/promptly" with actionable language
    - Governance: "reference" → "comply with", removed redundant
      authority statement
    - Technology Standards: committed to Tailwind CSS (removed hedge)
  Added sections: none
  Removed sections: none
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no updates needed
    - .specify/templates/spec-template.md ✅ no updates needed
    - .specify/templates/tasks-template.md ✅ no updates needed
  Follow-up TODOs: none
-->

# AllergyAlert Constitution

## Core Principles

### I. Code Quality

- TypeScript strict mode MUST be enabled; `any` types are prohibited.
- ESLint and Prettier MUST run on every commit via pre-commit hooks.
- Components MUST be small and single-responsibility; files
  SHOULD NOT exceed 300 lines.
- All API route handlers MUST validate inputs at the boundary
  using a schema library (e.g., Zod).
- Dead code and unused imports MUST be removed before merge.

### II. Testing

- Unit tests MUST cover all business logic and utility functions.
- Integration tests MUST cover API routes and database interactions.
- Tests MUST pass in CI before a pull request can be merged.
- Test files MUST be co-located with the code they test or placed
  in a mirrored `__tests__/` directory.
- Mocks SHOULD be limited to external services.

### III. Security

- User input MUST be sanitized server-side to prevent
  injection and XSS.
- Authentication and authorization checks MUST be enforced on
  every protected API route and server action.
- Secrets MUST be stored in environment variables, never committed
  to version control.
- Dependencies with known vulnerabilities MUST be updated
  or replaced before merge.
- HTTPS MUST be enforced in all deployed environments.
- Code reviews MUST check for OWASP Top 10 vulnerabilities.

## Technology Standards

- **Framework**: Next.js (App Router) with React and TypeScript.
- **Styling**: Tailwind CSS.
- **Package Manager**: pnpm (lockfile MUST be committed).
- **Node Version**: LTS release, specified in `.nvmrc`.
- **Formatting**: Prettier with project-level config.
- **Linting**: ESLint with `next/core-web-vitals` and
  `typescript-eslint` rule sets.

## Development Workflow

- All work MUST happen on feature branches; direct pushes to
  `main` are prohibited.
- Pull requests MUST receive at least one approval before merge.
- Commit messages MUST follow Conventional Commits format.
- CI MUST run lint, type-check, and test stages on every PR.
- Deployments to production MUST originate from the `main` branch
  after all checks pass.

## Governance

All code reviews and architectural decisions MUST comply
with these principles.

- **Amendments** require a documented proposal, team review, and
  an update to this file with a version bump.
- **Version policy**: MAJOR for principle removals or
  redefinitions, MINOR for new principles or material expansions,
  PATCH for clarifications and wording fixes.
- **Compliance** MUST be verified during every pull request review.

**Version**: 1.0.1 | **Ratified**: 2026-03-13 | **Last Amended**: 2026-03-13
