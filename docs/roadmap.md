# ResearchFlow Roadmap

## Phase 1 — Foundation

Monorepo structure, extension shell, dashboard shell, Prisma schema, shared contracts, validated API foundations, environment configuration, documentation, and local PostgreSQL setup.

## Phase 2 — Chrome Extension Capture

Implement real page and selection capture, content extraction at the browser boundary, capture state, and authenticated submission to the API. Preserve source metadata and sanitize content.

## Phase 3 — Backend & Database

Harden authentication, persistence workflows, migrations, source/item CRUD, ownership checks, pagination, and production database operations.

## Phase 4 — AI Processing — Implemented

Server-side OpenAI-compatible structured analysis for summaries, key points, findings, keywords, topics, and content classification. Provider keys remain server-side; content is cleaned/bounded; validated results persist with auditable status, prompt version, input hash, retry, and source traceability.

## Phase 5 — Research Intelligence — Implemented

Additive pgvector embeddings, semantic/hybrid retrieval, similar-source and similar-finding detection, bounded potential contradiction analysis, tenant-scoped relationships, and a traceable project graph foundation.

## Phase 6 — AI Research Chat — Implemented

Add persistent tenant-scoped conversations, project/all-research RAG retrieval over Phase 5 embeddings, structured grounded answers, clickable source citations, evidence panels, bounded follow-up context, usage tracking, and prompt-injection defenses. Streaming is deferred because the existing provider abstraction is non-streaming.

## Phase 7 — Dashboard, Reports & Finalization — Implemented

Complete dashboard workflows, grounded research reports, PDF/Markdown export, plan/usage foundation, settings, pricing, security review, deployment documentation, and final project packaging.

Phases 1–7 are implemented in the current repository. This is the final planned implementation phase.
