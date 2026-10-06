# ResearchFlow Deployment Guide

## Runtime architecture

- Next.js web application: server-rendered pages and authenticated APIs
- PostgreSQL 16 with pgvector: relational, vector, and usage storage
- Chrome Extension: separately built MV3 client
- Server-side AI/embedding providers: credentials never exposed to clients
- Optional Google OAuth/OIDC identity provider: credentials remain server-side

## Required services

1. PostgreSQL with the pgvector extension
2. Node.js 22 or compatible LTS runtime
3. pnpm
4. A server-side AI provider compatible with the configured chat-completions contract
5. A server-side embedding provider compatible with the configured embeddings contract

## Environment

Copy the template and provide deployment-specific values:

```bash
cp .env.example .env
```

Never commit `.env`. Generate `AUTH_SECRET` with a cryptographically secure random value of at least 32 characters.

For Google Sign-In deployments, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`. The callback URL must exactly match the Authorized redirect URI in Google Cloud Console. See [Google OAuth setup](google-oauth.md).

## Database

For local development:

```bash
docker compose up -d postgres
pnpm db:generate
pnpm db:deploy
```

The Compose database uses a pgvector-enabled PostgreSQL image. In managed PostgreSQL, enable `vector` before applying the Phase 5 migration.

## Build and verify

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @researchflow/web build
pnpm --filter @researchflow/extension build
```

## Run production web

```bash
pnpm --filter @researchflow/web start
```

Bind the web process to the platform-provided port and expose only the public application URL. Put TLS termination, secure headers, and rate limiting at the deployment edge or reverse proxy.

## Migration policy

Migrations are additive and must be applied in order:

1. Phase 1 baseline
2. Phase 3 backend foundation
3. Phase 4 AI analysis
4. Phase 5 research intelligence
5. Phase 6 research chat
6. Phase 7 reports/plans

Do not edit an applied migration. Create a new migration for future schema changes.

## Operational safeguards

- Use a secret manager for `AUTH_SECRET`, AI keys, and database credentials.
- Restrict database network access to the web runtime.
- Set provider timeouts and monitor rate-limit responses.
- Back up PostgreSQL and validate restore procedures.
- Monitor report failures and usage-limit denials.
- Do not log prompts, full captured pages, API keys, or private report contents.
- Rotate credentials through deployment configuration, not source files.

## Current sandbox limitation

The implementation sandbox does not contain Docker or a live PostgreSQL server. Prisma generation/schema validation, builds, and unit tests can run there, but migration deployment and live vector/report integration require the documented database service.
