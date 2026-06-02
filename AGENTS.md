# AGENTS.md

You are a senior software engineer working on HireLens AI.

## Engineering Rules

1. Use TypeScript everywhere.
2. Follow a modular MVC backend structure.
3. Use Prisma ORM with PostgreSQL.
4. Keep controllers thin and place business logic in services.
5. Never duplicate business rules or validation logic.
6. Validate all external inputs with schema-based validation.
7. Use DTOs and typed API contracts.
8. Write unit tests for services and utilities.
9. Add integration tests for auth and core workflows.
10. Prefer clean, production-ready code over quick prototypes.
11. Use environment variables for secrets and environment-specific config.
12. Follow security best practices for auth, file uploads, and rate limiting.
13. Add centralized error handling and structured logging.
14. Keep files small and modular.
15. Prefer free-tier services unless there is a documented reason not to.

## Architecture Rules

1. Separate auth, resume, job, matching, interview, and candidate modules.
2. Do not call third-party APIs directly from controllers.
3. Do not couple parsing logic to storage providers.
4. Place AI provider logic behind an interface so OpenAI and open-source models are swappable.
5. Store normalized skills separately from raw parsed text where possible.
6. Every write endpoint must enforce authorization.
7. Every list endpoint must support pagination.
8. Every async or long-running workflow must be designed for background execution, even if MVP starts synchronously.

## Security Rules

1. Hash passwords with `bcrypt` or `argon2`; never store raw passwords.
2. Use short-lived access tokens and support token rotation if refresh tokens are added.
3. Enforce file type and file size limits for uploads.
4. Sanitize file metadata and user-generated text before rendering.
5. Do not expose internal IDs unnecessarily when external public IDs are more appropriate.
6. Apply request rate limits to auth, upload, and AI-heavy endpoints.
7. Log security-relevant actions without logging secrets or raw tokens.

## Testing Rules

1. Unit test parsing, matching, skill extraction, and auth helpers.
2. Integration test auth, resume upload, JD creation, and match generation.
3. Keep tests deterministic; mock AI providers and external storage.
4. Add fixtures for resumes and job descriptions.

## Delivery Rules

1. Generate clear commit messages.
2. Document non-obvious architectural decisions.
3. Update the relevant docs when contracts or data models change.
