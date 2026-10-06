# ResearchFlow

ResearchFlow is an AI-powered Chrome Extension + Web Research Platform developed in seven controlled phases. This repository implements **Phase 7 — Final Product Polish, Reports, Export, Monetization & Production Readiness**.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Engine + Docker Compose (for local PostgreSQL)
- Chrome/Chromium (for extension loading)

## Setup

```bash
cp .env.example .env
# Set AUTH_SECRET in .env to a random value of at least 32 characters.
# Configure AI_API_KEY/AI_BASE_URL/AI_MODEL for server-side analysis.
# The Phase 5 Compose service includes pgvector.
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:deploy
```

The migrations create the Phase 1 baseline, apply Phase 3 ownership/authentication, and apply the additive Phase 4 `AIAnalysis` foundation. For an existing database created with `prisma db push`, inspect it and use `prisma migrate resolve` to mark the baseline before deploying the later migrations; never reset a database containing user data.

## Run the web app

```bash
pnpm dev
```

Open <http://localhost:3000>. Health check: <http://localhost:3000/api/health>.

## Build the extension

```bash
pnpm --filter @researchflow/extension build
```

In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `apps/extension/dist`.

The Phase 2 extension reads metadata and readable plain text, previews the capture, supports page/selection/context-menu capture, and saves through the backend API. It never connects directly to PostgreSQL.

Sign in or register at `/login` or `/register` before using the extension. Project/source/item APIs are owner-scoped by the server session.

Open a saved source detail page and choose **Analyze with AI**. AI calls run only on the server. The provider key is never bundled into the extension or browser JavaScript. After analysis, trigger source intelligence to build reusable embeddings for semantic search and similarity.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm --filter @researchflow/web build
pnpm --filter @researchflow/extension build
pnpm db:generate
```

## API foundation

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/projects?page=1&limit=20&search=...`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `DELETE /api/projects/:projectId`
- `GET /api/sources?projectId=...&page=1&limit=20&search=...`
- `POST /api/sources`
- `GET /api/sources/:sourceId`
- `PATCH /api/sources/:sourceId`
- `DELETE /api/sources/:sourceId`
- `GET/POST /api/sources/:sourceId/items`
- `GET/DELETE /api/sources/:sourceId/items/:itemId`
- `GET /api/sources/:sourceId/analysis`
- `POST /api/sources/:sourceId/analysis`
- `POST /api/sources/:sourceId/analysis/retry`
- `POST /api/sources/:sourceId/intelligence`
- `GET /api/search/semantic?q=...&projectId=...`
- `GET /api/sources/:sourceId/similar`
- `GET /api/findings/:findingId/similar`
- `GET /api/relationships`
- `GET/POST /api/contradictions`
- `GET /api/projects/:projectId/graph`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions`
- `GET/PATCH/DELETE /api/chat/sessions/:sessionId`
- `GET/POST /api/chat/sessions/:sessionId/messages`
- `GET/POST /api/reports`
- `GET/PATCH/DELETE /api/reports/:reportId`
- `GET /api/reports/:reportId/export/markdown`
- `GET /api/reports/:reportId/export/pdf`
- `GET/PATCH /api/account`

Payloads and AI output are validated server-side, duplicate canonical URLs are protected per project, and successful source/item capture uses a Prisma transaction. AI content is cleaned, bounded, schema-validated, source-linked, and retryable. Phase 5 adds pgvector embeddings, tenant-scoped semantic/hybrid search, similarity relationships, potential contradiction analysis, and a traceable graph. Phase 6 adds persistent, project-scoped/all-research grounded chat with clickable citations and evidence panels. Phase 7 adds grounded editable reports, Markdown/PDF export, plan/usage architecture, settings, pricing, and deployment documentation. Pagination is bounded to 100 records per request. Payment processing is not integrated.

See [docs/architecture.md](docs/architecture.md), [docs/phase-2.md](docs/phase-2.md), [docs/phase-3.md](docs/phase-3.md), [docs/phase-4.md](docs/phase-4.md), [docs/phase-5.md](docs/phase-5.md), [docs/phase-6.md](docs/phase-6.md), [docs/phase-7.md](docs/phase-7.md), [docs/google-oauth.md](docs/google-oauth.md), [docs/security.md](docs/security.md), [docs/deployment.md](docs/deployment.md), [docs/pricing.md](docs/pricing.md), and [docs/roadmap.md](docs/roadmap.md) for decisions and phase boundaries.
