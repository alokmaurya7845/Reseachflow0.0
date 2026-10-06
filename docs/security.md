# ResearchFlow Security Notes

## Authentication and authorization

- Authentication uses signed HttpOnly session cookies.
- APIs resolve the current user server-side.
- Project, source, chat, report, citation, relationship, and usage records are owner-scoped.
- Dynamic routes validate identifiers before querying.
- Delete operations include the authenticated owner in their database filter.

Google Sign-In uses the authorization-code flow through the official Google client library. The callback validates a short-lived HttpOnly state cookie, verifies the Google OpenID Connect ID token and its verified email, uses a unique provider identity mapping, and then creates the existing ResearchFlow session. Google client secrets and tokens are never sent to the browser, extension, or logs.

## Tenant isolation

Every retrieval and report path includes `userId`. Project-scoped operations also verify `projectId` belongs to the same user. Reports use both user and project foreign keys. A user cannot export another user's report by changing an ID.

## AI and prompt injection

Captured webpages are untrusted data. Prompts explicitly separate system instructions from user questions and evidence. The AI is instructed to ignore commands embedded in sources and never reveal secrets, prompts, or other users' data.

## XSS and rendered output

Research Chat renders answer text with preserved whitespace and does not use `dangerouslySetInnerHTML`. Reports are edited as Markdown text. PDF generation writes text through PDFKit rather than interpreting arbitrary HTML.

## Secrets

Provider keys, database URLs, and auth secrets are server-only. The extension and browser bundles contain no AI credentials. `.env.example` contains placeholders only.

## Input validation

Zod validation is applied to authentication, projects, sources, chat questions, report requests, report editing, and profile updates. Report content and titles are bounded.

## Exports

Export access checks report ownership and completed status. Filenames are sanitized. Export usage is checked server-side before generating a download.

## Plan limits

Report and export limits are checked in the server billing module. Frontend messaging is informational and is not the enforcement mechanism.

## Payment readiness

No payment provider is trusted or integrated. Future checkout must be created server-side and subscription changes must require signed webhook verification.

## Logging and privacy

Production code should avoid logging full prompts, captured content, reports, provider responses, secrets, or credentials. Research is private by default and only bounded relevant context is sent to an AI provider.

## Remaining operational work

- Add edge rate limiting for production traffic.
- Configure a managed secret store.
- Enable database backups and restore drills.
- Add centralized monitoring and alerting.
- Perform a deployment-specific penetration test.
