# Quickstart: Allergy Alert MVP

## Prerequisites

- **Node.js** LTS (see `.nvmrc` for exact version)
- **pnpm** (`npm install -g pnpm`)
- **Azure AD B2C tenant** with a registered application and `B2C_1_signup_signin` user flow
- **Azure Cosmos DB** account with database `allergy-alert` and containers `users` (partition key `/id`) and `queries` (partition key `/userId`)
- **Azure AI Foundry** deployed model with API key and endpoint URL

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd allergyAlert2
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
# Azure AD B2C (public — exposed to browser)
NEXT_PUBLIC_AZURE_AD_B2C_TENANT_NAME=your-tenant
NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AD_B2C_POLICY_NAME=B2C_1_signup_signin

# Azure Cosmos DB (server-side only)
AZURE_COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
AZURE_COSMOS_KEY=your-primary-key
AZURE_COSMOS_DATABASE=allergy-alert

# Azure AI Foundry (server-side only)
AZURE_AI_FOUNDRY_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_AI_FOUNDRY_API_KEY=your-api-key
AZURE_AI_FOUNDRY_MODEL_NAME=gpt-4
```

### 3. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Run tests

```bash
# Unit tests
pnpm test

# E2E tests (requires running dev server)
pnpm test:e2e
```

### 5. Lint and format

```bash
pnpm lint
pnpm format
```

## Key Commands

| Command           | Description                           |
| ----------------- | ------------------------------------- |
| `pnpm dev`        | Start Next.js dev server on port 3000 |
| `pnpm build`      | Production build                      |
| `pnpm start`      | Start production server               |
| `pnpm test`       | Run Vitest unit tests                 |
| `pnpm test:e2e`   | Run Playwright E2E tests              |
| `pnpm lint`       | Run ESLint                            |
| `pnpm format`     | Run Prettier                          |
| `pnpm type-check` | Run TypeScript compiler check         |

## Azure Resource Setup

### Azure AD B2C

1. Create a B2C tenant in Azure Portal
2. Register a new application (SPA type)
3. Set redirect URIs: `http://localhost:3000` (dev), `https://your-domain.com` (prod)
4. Create a `B2C_1_signup_signin` user flow (email sign-up/sign-in)
5. Create a `B2C_1_password_reset` user flow
6. Copy Tenant Name, Client ID, and Policy Name to `.env.local`

### Azure Cosmos DB

1. Create a Cosmos DB account (NoSQL API)
2. Create database `allergy-alert`
3. Create container `users` with partition key `/id`
4. Create container `queries` with partition key `/userId`
5. Copy Endpoint and Primary Key to `.env.local`

### Azure AI Foundry

1. Create an Azure AI Foundry resource (or Azure OpenAI resource)
2. Deploy a model (e.g., `gpt-4`)
3. Copy Endpoint URL, API Key, and Model/Deployment Name to `.env.local`
