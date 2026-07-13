# Top 100 Interview Questions & Answers — HireLens AI Perspective

## 1. Architecture & Design

**Q1: Describe the overall architecture of HireLens AI.**
**A:** HireLens AI follows a modular MVC (Model-View-Controller) pattern with a monorepo structure containing a TypeScript Express backend and a Next.js App Router frontend. The backend is organized into feature modules (auth, jobs, resumes, matching, applications, interviews, etc.), each with its own routes, controllers, services, schemas, and types. Business logic lives in services, controllers stay thin. The backend uses Prisma ORM with PostgreSQL (Neon serverless) and abstracts third-party integrations (AI, storage, email, caching, queues) behind interface-based providers, making them swappable.

**Q2: Why did you choose a monorepo structure?**
**A:** A monorepo allows sharing TypeScript types, Zod schemas, and validation logic between frontend and backend. It simplifies dependency management, ensures consistent tooling (TypeScript, Prettier), and makes CI/CD pipelines more efficient. The project uses npm workspaces to manage the frontend and backend as distinct packages within a single repository.

**Q3: Explain the MVC pattern used in the backend.**
**A:** Each module separates concerns into three layers:
- **Routes** (`*.routes.ts`) — Define HTTP endpoints, attach middleware (auth, validation, CSRF, rate limit)
- **Controllers** (`*.controller.ts`) — Thin handlers that parse request data, call the service, and format the HTTP response
- **Services** (`*.service.ts`) — Contain all business logic, enforce authorization rules, and interact with the database via Prisma
This keeps controllers testable by keeping them stateless and focused on request/response handling.

**Q4: What is the provider abstraction pattern and why is it important?**
**A:** The provider abstraction wraps third-party services behind TypeScript interfaces. For example, `AIProvider` defines `extractSkillsFromText()`, `generateMatchScore()`, and `generateInterviewQuestions()`. Concrete implementations include Gemini, OpenAI, Ollama, and LlamaCpp. The `ProviderRegistry` auto-selects the active provider based on environment variables. This pattern prevents vendor lock-in, makes testing trivial (mock the interface), and allows swapping AI providers without changing business logic.

**Q5: How do you handle dependency injection in this project?**
**A:** The project uses manual dependency injection via a `ProviderRegistry` class located in `backend/src/config/providers.ts`. The registry instantiates all providers (AI, storage, parser, email, cache, queue) at startup and injects them into services via constructor injection. There is no DI framework — each service receives its dependencies explicitly, which keeps the code simple and fully type-safe.

**Q6: What is the data flow for a resume upload and match?**
**A:** (1) Student uploads a file via POST `/api/v1/uploads` → Multer validates MIME/size → Cloudinary stores it → metadata saved to `UploadedFile` table. (2) Student creates a resume via POST `/api/v1/resumes` → links upload, auto-increments version, queues AI enrichment in BullMQ. (3) Worker processes enrichment: downloads file from Cloudinary → pdf-parse extracts text → Gemini extracts skills/experience → `parsedData` JSON stored on `Resume`. (4) Student previews match via POST `/api/v1/matches/preview` → AI compares resume parsed data against job extracted skills → returns score, matched/missing skills, strengths.

**Q7: How is background job processing set up?**
**A:** BullMQ with Redis handles three queues: `resume-parse`, `match-score`, and `interview-generate`. The `QueueManager` in `backend/src/providers/queue/index.ts` provides a factory for creating queues and workers with configurable retry/delay/priority. When Redis is unavailable, the system falls back gracefully (the `ProviderRegistry` skips queue setup, and the app processes synchronously). Workers are registered in `backend/src/workers/index.ts`.

**Q8: Explain the caching strategy.**
**A:** The cache layer (`backend/src/providers/cache/index.ts`) uses a hybrid approach: Redis as the primary cache with an in-memory `Map` fallback. Domain-specific helpers (`jobCache`, `matchCache`, `aiCache`, `userCache`) provide typed get/set/delete operations with configurable TTLs. Cache keys for AI results include content hashes to ensure invalidation when source data changes.

**Q9: What design patterns are used throughout the project?**
**A:** Strategy pattern (providers), Factory pattern (provider registry, queue manager), Repository pattern (Prisma service layer), MVC (module structure), Dependency Injection (constructor injection), Adapter pattern (provider interfaces), Observer pattern (audit logging), Singleton (Prisma client, logger).

**Q10: How is the system designed for scalability?**
**A:** PostgreSQL (Neon serverless with connection pooling via PgBouncer-compatible adapter), BullMQ queues for async processing, stateless Express API (horizontally scalable), Cloudinary for file storage (offloads binary data from the DB), Redis caching to reduce DB load, pagination on every list endpoint, and audit table partitioning by month for efficient maintenance.

---

## 2. Backend — Node.js & Express & TypeScript

**Q11: Why Express 5 and what changes did it require?**
**A:** Express 5 brought async error handling (rejected promises automatically forwarded to the error handler), removed deprecated APIs, and improved routing. The migration required updating middleware signatures, removing explicit `try/catch` wrappers in async route handlers, and adjusting the error handler to handle both sync and async errors seamlessly.

**Q12: How is error handling centralized?**
**A:** A custom `ApiError` class (extends `Error`) with `statusCode`, `code`, `message`, and optional `details`. The `errorHandler` middleware catches all errors: `ApiError` instances map to their status codes, `ZodError` instances become 400s with formatted field errors, and unknown errors become 500s. In production, generic messages are returned to avoid leaking internals; Sentry captures the full error.

**Q13: How do you validate request data?**
**A:** The `validateRequest` middleware accepts a Zod schema for `body`, `params`, and/or `query`. It runs before the controller, so invalid requests are rejected early with consistent error formatting. All external inputs (registration, job creation, application submission, etc.) are validated this way.

**Q14: What logging framework do you use and why?**
**A:** Pino — it is the fastest JSON logger for Node.js, has low overhead, supports child loggers for request-scoped logging, and integrates well with production log aggregation systems. Sensitive fields (passwords, tokens, cookies) are redacted automatically via Pino's redact configuration.

**Q15: How do you handle file uploads?**
**A:** Multer middleware configured in `uploads.middleware.ts` handles multipart form data. The `assertAllowedUpload()` function validates file extension, MIME type, and enforces a 10MB size limit. After validation, the buffer is uploaded to Cloudinary via `CloudinaryStorage.uploadFile()`. Only the metadata (URL, public ID, size, type) is stored in the database.

**Q16: What is the purpose of the pagination utility?**
**A:** `parsePagination()` normalizes page/limit/skip from query parameters with defaults (page=1, limit=20, max limit=100). `buildPaginatedResponse()` wraps data in a consistent shape: `{ data, meta: { page, limit, total, totalPages } }`. Every list endpoint in the system uses this utility.

**Q17: How do you handle soft deletes?**
**A:** Key models (Resume, JobPosting, Application, UploadedFile) have a nullable `deletedAt` timestamp field. All queries include `WHERE deletedAt IS NULL` implicitly through Prisma query filters or explicit `where` clauses. This preserves data for auditing and recovery while maintaining the appearance of deletion to users.

**Q18: Explain the audit logging system.**
**A:** Three audit models (`AuthAuditEvent`, `UploadAuditEvent`, `ResumeAuditEvent`) track security-relevant actions with event type, user ID, email, IP address, user agent, success/failure reason, and a JSON metadata field. Events are recorded by dedicated `AuditService` classes. The `AuditPartitionService` manages monthly partitioning and cleanup of records older than 24 months.

**Q19: How is the CSRF protection implemented?**
**A:** Double-submit cookie pattern. A GET `/api/v1/csrf-token` endpoint sets an HTTP-only cookie with a random CSRF token. Mutating requests must include an `x-csrf-token` header matching the cookie value. The `csrfProtection` middleware compares both values and rejects mismatches with 403.

**Q20: How does the health check endpoint work?**
**A:** GET `/api/v1/health` tests the database connection by running `SELECT 1` via Prisma, returns `{ status: "ok", timestamp, uptime, db: "connected"|"error" }` with HTTP 200 or 503.

**Q21: What TypeScript features are used extensively?**
**A:** Strict mode, interfaces for contracts, discriminated unions for API responses, generics for pagination and provider types, `unknown` over `any` for error handling, branded types for entity IDs, `satisfies` for type narrowing, and utility types (`Pick`, `Omit`, `Partial`) for DTOs.

**Q22: How is the Express Request type augmented?**
**A:** `types/express.d.ts` augments the Express `Request` interface to add `auth?: { userId: string; role: UserRole }` (set by auth middleware), `cookies` (from cookie-parser), and `file` (from Multer), providing full type safety without casts.

---

## 3. Frontend — Next.js & React

**Q23: Why Next.js App Router over Pages Router?**
**A:** App Router provides server components by default (smaller client bundles), nested layouts with persistent state, streaming server-side rendering, and improved data fetching with `async` components. It aligns with React 19's direction and offers better performance characteristics for a dashboard-heavy application.

**Q24: How is state managed on the frontend?**
**A:** Two complementary tools: **TanStack React Query** for server state (data fetching, caching, invalidation via API calls), and **Zustand** for client-only state (auth tokens, toasts/notifications). React Query handles loading/error states automatically and provides optimistic updates for a smooth UX.

**Q25: How are forms handled?**
**A:** React Hook Form with Zod resolver for validation. Forms use a single `<Form>` wrapper component that integrates RHF's `useForm` with Zod schemas. Validation runs on the client (for instant feedback) and matches the server-side Zod schemas for consistency.

**Q26: How are API calls structured on the frontend?**
**A:** An Axios-based HTTP client (`lib/api/http-client.ts`) with interceptors for:
- Attaching the JWT access token from Zustand store
- Handling 401 responses by attempting a token refresh
- Transforming error responses into a consistent format
Individual services (`auth.service.ts`, `job.service.ts`, etc.) wrap this client with typed methods.

**Q27: How is authentication flow handled on the frontend?**
**A:** The `AuthStore` (Zustand) holds `user`, `accessToken`, and `isAuthenticated`. On login/register, the backend returns tokens in HTTP-only cookies (refresh) and the response body (access). The store persists the access token in memory. On page load, a `useEffect` calls GET `/auth/profile` to restore the session. Route guards redirect unauthenticated users to `/login`.

**Q28: How is role-based access handled on the frontend?**
**A:** The `user` object in Zustand store contains the `role` (STUDENT | RECRUITER). Components conditionally render based on role. Route-level protection checks `isAuthenticated` and role before rendering. The backend also enforces role checks, so frontend guards are a UX optimization, not a security boundary.

**Q29: What is the component organization strategy?**
**A:** Components are grouped by scope:
- `components/ui/` — Reusable primitives (Button, Input, Modal, Badge, Table)
- `components/layout/` — Navigation, sidebar, headers
- `components/forms/` — Form-specific components
- `components/auth/` — Auth guard, login form
- `components/feedback/` — Toasts, loading states
Feature-specific components live in `features/` mirrors of backend modules.

**Q30: How is styling implemented?**
**A:** Tailwind CSS v4. Utility classes with a custom design system for colors, spacing, and typography. No CSS-in-JS. Tailwind's JIT compiler ensures zero unused CSS in production builds.

**Q31: How do you handle loading states?**
**A:** React Query's `isLoading` and `isFetching` states drive skeleton components (`ui/Skeleton.tsx`). Each page uses `<Suspense>` boundaries for streaming SSR. Mutations show toast notifications via the Zustand `toastStore` during pending/error/success states.

**Q32: How are errors displayed to the user?**
**A:** A centralized toast notification system (`stores/toast.store.ts`) with success, error, and info variants. API errors from the Axios interceptor trigger error toasts. Form validation errors appear inline below fields. Unexpected errors show a fallback error boundary.

---

## 4. Database — PostgreSQL & Prisma

**Q33: What is the database schema design philosophy?**
**A:** Normalized relational design with PostgreSQL 16. Core entities (User, Resume, JobPosting, Application) form the foundation. Related data (StudentProfile, RecruiterProfile) lives in separate tables with 1:1 FK relationships. Arrays and JSON are used judiciously (e.g., `String[]` for extracted skills, JSON for `parsedData` on resumes) where the data is consumed as a whole and never queried individually.

**Q34: Why Prisma ORM and what features are leveraged?**
**A:** Prisma provides type-safe database access, auto-generated TypeScript types from the schema, migrations as code, a powerful query engine with relation loading, and a declarative schema language. Features used: composite indexes, unique constraints, cascading deletes, enums, JSON fields, and soft delete patterns via nullable timestamps.

**Q35: How are database indexes designed?**
**A:** Indexes follow query patterns:
- `Resume` — `[ownerId, status]` for listing user's resumes, `[ownerId, deletedAt]` for soft-delete filter
- `JobPosting` — `[recruiterId, status]` for recruiter's jobs, `[status, createdAt]` for job feed, `[employmentType, locationMode]` for filters
- All foreign keys indexed automatically by Prisma

**Q36: How are migrations managed?**
**A:** Prisma Migrate generates timestamped migration files. Each migration is reviewed during code review. The `prisma migrate deploy` command runs in CI/CD pipelines. Schema changes are backward-compatible (no breaking column drops without deprecation period).

**Q37: How is connection pooling handled?**
**A:** Neon's serverless PostgreSQL uses PgBouncer-compatible pooling. Prisma's `@prisma/adapter-neon` with WebSocket connections handles the pooling transparently. The Prisma client is a singleton with connection limits configured via `DATABASE_URL` connection string parameters.

**Q38: How is JSON data (resume parsedData) queried?**
**A:** The `parsedData` JSON field on `Resume` stores the full parsed output (rawText, skills[], experience[], education[], summary). It is read as a whole when displaying the resume. Individual JSON fields are not indexed because skills are also normalized into the `extractedSkills` array for matching queries. This avoids complex JSON path queries.

**Q39: How are unique constraints enforced?**
**A:** `email` on User is unique. `[resumeId, jobPostingId]` on Application prevents duplicate applications. `cloudinaryPublicId` on UploadedFile prevents duplicate storage references. These are database-level constraints enforced by Prisma.

**Q40: How is the audit table partitioned?**
**A:** Audit tables (`AuthAuditEvent`, `UploadAuditEvent`, `ResumeAuditEvent`) are partitioned by month using PostgreSQL declarative partitioning. The `AuditPartitionService` manages partition creation, cleanup (24-month retention), and vacuuming. This prevents the audit tables from becoming a performance bottleneck.

**Q41: What is the Neon adapter and why is it used?**
**A:** The `@prisma/adapter-neon` provides a WebSocket-based connection to Neon's serverless PostgreSQL. Unlike traditional TCP connections, WebSocket connections work in serverless environments (Vercel, Render) and support Neon's auto-scaling and connection pooling features. It uses Neon's `ws` transport internally.

---

## 5. Authentication & Security

**Q42: How is the JWT authentication implemented?**
**A:** Short-lived access tokens (15 min, signed with HMAC-SHA256) carry `userId` and `role` in the payload. Refresh tokens (7 days, with a random `tokenId`) are stored as SHA-256 hashes in the `RefreshToken` table. Token rotation: each refresh revokes the old token and issues a new pair. The `authenticateAccessToken` middleware verifies the Bearer token on every protected route.

**Q43: How are passwords hashed?**
**A:** bcrypt with 12 salt rounds via the `PasswordService`. The `hashPassword()` method is used during registration, `comparePassword()` during login. No plain-text passwords are ever logged or transmitted after initial receipt.

**Q44: How is rate limiting configured?**
**A:** `express-rate-limit` with per-endpoint limits:
- Auth: 5 requests per 15 minutes (register, login)
- Token refresh: 20 per 15 minutes
- Matching preview: 10 per minute
- Interview generation: 10 per minute
- Uploads: 20 per hour
Keyed by IP address for unauthenticated endpoints and by userId for authenticated ones.

**Q45: How are security headers configured?**
**A:** Helmet middleware sets security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `X-XSS-Protection`. CORS is configured to allow only the frontend origin. `X-Powered-By` header is disabled.

**Q46: How is prompt injection prevented in AI calls?**
**A:** The `PromptBuilder` (`backend/src/providers/ai/prompt-builder.ts`) wraps user-generated content in XML-style isolation tags (`<user_content>...</user_content>`) within the system instruction. The system prompt explicitly instructs the AI to treat content within those tags as data, not instructions. This provides defense-in-depth against injection attempts.

**Q47: How are file uploads secured?**
**A:** Three-layer validation: (1) Multer rejects oversized requests at the HTTP level, (2) `assertAllowedUpload()` checks extension against an allowlist, MIME type consistency, and enforces 10MB max, (3) Cloudinary stores files with randomized public IDs to prevent enumeration. File content is not scanned beyond MIME validation (free-tier constraint).

**Q48: How is Sentry configured to avoid leaking secrets?**
**A:** The Sentry error handler (`middleware/sentry.ts`) runs `beforeSend` to redact request bodies (passwords, tokens), authorization headers, and cookie values. Only non-sensitive metadata (URL, method, error message, stack trace) reaches Sentry. This runs only in production.

**Q49: How is the refresh token rotation security implemented?**
**A:** On each `POST /auth/refresh`, the `TokenService`:
1. Verifies the incoming refresh token's signature and expiry
2. Hashes it and looks up the `RefreshToken` record
3. If found and not revoked, revokes it (sets `revokedAt`)
4. Issues a new access + refresh token pair
If a revoked token is reused (compromised scenario), all refresh tokens for that user are revoked, forcing re-login.

**Q50: How are role-based permissions enforced?**
**A:** The `authorizeRoles(...roles)` middleware checks `req.auth.role` after authentication. It returns 403 if the user's role is not in the allowed list. Additionally, ownership checks in services ensure users can only access their own data (e.g., a student can only see their own resumes).

---

## 6. AI & Machine Learning Integration

**Q51: How is the AI provider abstraction designed?**
**A:** The `AIProvider` interface defines three methods:
```ts
interface AIProvider {
  extractSkillsFromText(text: string): Promise<string[]>
  generateMatchScore(input: MatchScoreInput): Promise<MatchScoreOutput>
  generateInterviewQuestions(input: InterviewInput): Promise<InterviewOutput>
}
```
Each provider (Gemini, OpenAI, Ollama, LlamaCpp) implements this interface. The `ProviderRegistry` selects the active provider based on `AI_PROVIDER` env var. This makes the system fully provider-agnostic.

**Q52: Why is Gemini the primary AI provider?**
**A:** Gemini 2.5 Flash offers excellent performance for text extraction, matching, and question generation tasks at zero cost (free tier). It handles large context windows well (important for lengthy resumes and job descriptions). OpenAI's GPT-4o-mini serves as a cost-effective fallback.

**Q53: How does AI skill extraction work?**
**A:** When a job description or resume is created, the system sends the text to the AI provider with a structured prompt requesting skill extraction. The AI returns a JSON array of skills following a Zod schema (`SkillExtractionSchema`). For resumes, the AI also extracts experience, education, and a summary. The result is validated against the schema before storage.

**Q54: How does the match scoring algorithm work?**
**A:** The AI receives the resume's parsed data and the job's description + extracted skills. The prompt instructs the AI to analyze alignment across skills, experience, education, and overall fit. The output is a 0-100 score, matched skills, missing skills, and key strengths. If the AI fails, `computeFallbackMatch()` uses simple keyword overlap (Jaccard similarity on skill sets) as a degradation strategy.

**Q55: How are interview questions generated?**
**A:** The `InterviewService.generateQuestions()` takes a `MatchResult` (which includes matched and missing skills). It sends the match data to the AI with instructions to generate questions targeting the candidate's skill gaps and probing their claimed strengths. Output is an array of questions with difficulty (EASY/MEDIUM/HARD) and category, validated via Zod schema.

**Q56: How is AI output reliability ensured?**
**A:** Every AI call uses:
1. Structured prompts with explicit output format instructions
2. Zod schemas to validate the AI's response matches expected types
3. Retry logic with exponential backoff (`retry.ts`) for transient failures
4. Fallback mechanisms (keyword matching, cached results) when AI is unavailable

**Q57: How are local AI providers (Ollama, LlamaCpp) configured?**
**A:** The `OLLAMA_BASE_URL` or `LLAMACPP_BASE_URL` environment variables point to locally running instances. The `OllamaProvider` and `LlamaCppProvider` send HTTP requests to these endpoints with the same prompt structure. This enables development without API keys and supports air-gapped deployments.

**Q58: How is the AI provider tested?**
**A:** Unit tests use mocked `AIProvider` interfaces. Integration tests use a test-specific provider that returns deterministic data. This ensures tests are fast, deterministic, and don't incur API costs. The actual provider integration is tested manually during development and via end-to-end smoke tests.

---

## 7. DevOps & Deployment

**Q59: How is the application containerized?**
**A:** A multi-stage Docker build: Stage 1 installs all dependencies and builds both frontend and backend. Stage 2 uses a minimal Node.js image with only production dependencies and the built artifacts. The `Dockerfile` handles both the Next.js standalone output and the compiled Express backend. `docker-compose.yml` orchestrates PostgreSQL, backend, and frontend services for local development.

**Q60: Where is the application deployed?**
**A:** Render (PaaS) using the `render.yaml` configuration. The Docker image is built and deployed via Render's integrated container registry. Neon provides the managed PostgreSQL database with branching for preview environments.

**Q61: How is the database connection string managed across environments?**
**A:** The `DATABASE_URL` environment variable is set per environment (local `.env`, Render dashboard, Neon branches). The Prisma client reads it at runtime via the Zod-validated `env.ts` config. Migration commands are parameterized to use the correct environment's database URL.

**Q62: What is the CI/CD pipeline?**
**A:** Not fully implemented yet (Phase 2), but the design intends: GitHub Actions on PR → lint & typecheck → unit tests → integration tests → build Docker image → deploy to Render preview. Migrations run as a pre-deploy step. The `Dockerfile` and `render.yaml` are pre-configured for this flow.

**Q63: How is environment variable validation handled?**
**A:** The `config/env.ts` file defines Zod schemas for every environment variable with defaults, types, and optional/required flags. On startup, `env.ts` parses `process.env` against these schemas. Invalid configurations cause immediate startup failure with clear error messages, preventing runtime surprises.

**Q64: How is the application monitored?**
**A:** Sentry for error tracking (production only). Pino structured JSON logs for application observability. The health check endpoint provides basic uptime/DB connectivity monitoring. Neon provides database monitoring (connections, query performance, storage). Additional monitoring (Render dashboard for CPU/memory, Redis metrics) is planned.

**Q65: How is the build process structured?**
**A:** The `Dockerfile` runs `npm ci` for clean installs, `npm run build` which triggers both frontend (`next build` producing `.next/standalone`) and backend (`tsc` compiling to `dist/`). Production dependencies are pruned after build. The frontend handles its own static serving; the backend serves the API.

---

## 8. Testing

**Q66: What is the testing strategy?**
**A:** Three-tier: (1) **Unit tests** for services and utilities — 10 service unit tests covering auth, matching, interviews, etc. (2) **Integration tests** for API routes with supertest — 9 test files covering all major endpoints. (3) **E2E tests** with Playwright for critical user flows (registration, resume upload, job browsing, application submission).

**Q67: How are external dependencies mocked in tests?**
**A:** The ProviderRegistry pattern makes mocking natural — tests inject mock implementations of AIProvider, StorageProvider, etc. Vitest's `vi.mock()` is used for module-level mocks. Services accept dependencies via constructor injection, so tests pass mock instances directly. No network calls are made during unit or integration tests.

**Q68: What are the test coverage thresholds?**
**A:** Configured in Vitest: 80% for lines, functions, and statements; 75% for branches. Coverage is checked in CI. New features must maintain or improve these thresholds.

**Q69: How are fixtures managed?**
**A:** `tests/fixtures/` contains reusable test data: resume texts, job descriptions, mock AI responses, and user profiles. Fixtures are typed and shared across unit and integration tests. Prisma-based tests use an isolated test database with migrations run before each test run.

**Q70: How are integration tests structured?**
**A:** Each route test file (e.g., `auth.routes.test.ts`) uses Vitest + supertest. Tests follow Arrange-Act-Assert: seed data via Prisma → send HTTP request via supertest → assert response status/body/headers. Tests are independent (each creates its own data) and run against a dedicated test database.

**Q71: How are E2E tests configured?**
**A:** Playwright tests in `frontend/e2e/` cover critical paths: registration (student + recruiter), login, resume upload, job browsing, application flow, and role-based access control. The `playwright.config.ts` sets up the frontend dev server and a mock backend. Auth state is managed via Playwright's storage state for authenticated flows.

**Q72: How do you test AI-dependent features?**
**A:** The `AIProvider` interface is mocked to return deterministic data. For example, the matching service test injects a mock provider that always returns `{ score: 85, matchedSkills: [...], ... }`. This ensures tests are fast, deterministic, and free from API costs or rate limits.

---

## 9. Module-Specific Questions

**Q73: How does the Auth module handle registration with role-based profiles?**
**A:** The `AuthService.register()` method: (1) validates input via Zod, (2) checks for existing email, (3) hashes password, (4) creates User with role, (5) creates either StudentProfile or RecruiterProfile based on role, (6) generates JWT token pair, (7) logs audit event. Everything runs in a Prisma transaction to ensure consistency.

**Q74: How does the Matching module handle AI failures?**
**A:** The `MatchingService.previewMatch()` wraps the AI call in a try-catch. On failure, `computeFallbackMatch()` calculates a Jaccard similarity coefficient between resume skills and job skills. The response includes a `scoreVersion` field indicating whether the result came from AI or fallback, allowing the frontend to display an appropriate indicator.

**Q75: How does the Interview module cache generated questions?**
**A:** Before calling the AI, `InterviewService.generateQuestions()` checks if a `QuestionSet` already exists for the `MatchResult`. If found, it returns the cached set. This prevents regenerating questions on page refresh or accidental re-submission. The cache key is the `matchResultId`.

**Q76: How does the Application module prevent duplicate applications?**
**A:** The `ApplicationService.createApplication()` checks for an existing application with the same `resumeId` + `jobPostingId`. A database unique constraint on `[resumeId, jobPostingId]` enforces this at the storage level. The service returns a 409 Conflict if a duplicate is detected.

**Q77: How does the Resume module handle versioning?**
**A:** When a resume is created, `ResumeService.createResume()` queries for the latest version for that owner and increments it. Each new upload of the same resume file creates a new version record. Only one resume can be ACTIVE at a time — activating a resume sets all others for that user to DRAFT.

**Q78: How does the Jobs module extract skills asynchronously?**
**A:** `JobService.createJob()` creates the job posting first, then calls `extractAndUpdateSkills()` which either: (1) enqueues a BullMQ job (`match-score` queue) for async processing, or (2) calls the AI provider synchronously if the queue is unavailable. The extracted skills are stored in the `extractedSkills` string array on the JobPosting.

**Q79: How does the Uploads module handle file cleanup?**
**A:** `UploadService.deleteUpload()` performs a soft delete in the database AND calls `CloudinaryStorage.deleteFile()` to remove the actual file from Cloudinary. This ensures storage costs are minimized even though the upload record is preserved for audit purposes.

**Q80: How does the Profile module differentiate between student and recruiter updates?**
**A:** `ProfileService.updateCurrentProfile()` checks `req.auth.role`. For STUDENT users, it updates `StudentProfile` fields (headline, university, degree, URLs, bio). For RECRUITER users, it updates `RecruiterProfile` fields (company name, website, designation, bio). The schema validation (`ProfileSchemas`) also branches based on role.

---

## 10. System Design & Problem-Solving

**Q81: How would you handle a sudden spike in resume uploads?**
**A:** The system already has multiple resilience layers: (1) Multer enforces request size limits at the HTTP level, (2) BullMQ queues decouple upload acceptance from AI processing — uploads are accepted quickly, enrichment happens asynchronously, (3) Cloudinary handles file storage scaling transparently, (4) Rate limiting (20 uploads/hour/user) prevents abuse. For extreme spikes, horizontal scaling of the Express API (stateless) and adding more Redis-backed workers would be the path.

**Q82: How would you implement real-time notifications?**
**A:** The architecture supports adding WebSocket notifications via a `ws` server or Server-Sent Events. BullMQ's `worker.on('completed')` event would emit notifications. The frontend would subscribe via a React hook that connects to a `/ws/notifications` endpoint. This is a planned enhancement for Phase 3.

**Q83: How would you add a new AI provider?**
**A:** (1) Create a new file in `backend/src/providers/ai/` implementing the `AIProvider` interface, (2) Add environment variables to `config/env.ts`, (3) Register the provider in the `ProviderRegistry`, (4) Add it to the provider selection logic factory. No changes to any service or controller are needed — the abstraction ensures complete isolation.

**Q84: How would you implement a job recommendation system?**
**A:** Leverage the existing `MatchingService` — compute match scores between a student's active resume and all active job postings. Results could be pre-computed via a BullMQ job that runs periodically or on resume update. Store top-N matches in a `RecommendedMatch` table or cache. The frontend would display these on the student dashboard. The AI matching system is already designed to support this.

**Q85: How does the system handle data consistency across services?**
**A:** Prisma transactions ensure atomicity within a single request (e.g., creating a user + profile in one transaction). For cross-service consistency (e.g., resume upload → parsing), the system uses the queue-based async pattern: the upload is committed immediately, and the parsing job is enqueued. If the job fails, it retries with exponential backoff. The `reparse` endpoints provide a manual recovery mechanism.

**Q86: How would you migrate from Cloudinary to another storage provider?**
**A:** Create a new implementation of the `StorageProvider` interface (e.g., `S3Storage`), register it in the `ProviderRegistry`, and flip the `STORAGE_PROVIDER` env var. The migration would require a data migration script to move existing files, but the application code itself would change in zero places beyond the new provider file and the registry.

**Q87: How do you handle database migration rollbacks?**
**A:** Prisma Migrate generates both up and down migrations (though Prisma doesn't auto-generate down migrations). The team follows a forward-only migration policy — schema changes are additive (new columns, nullable additions) where possible. If a rollback is needed, a new migration is created to reverse the change. Database backups from Neon provide an additional safety net.

**Q88: How would you add caching to a currently uncached endpoint?**
**A:** (1) Use one of the existing domain cache helpers (`jobCache`, `matchCache`, etc.) or create a new one in `cache/keys.ts`, (2) Add `cacheGet`/`cacheSet` calls in the service method, (3) Set an appropriate TTL, (4) Add cache invalidation on mutation endpoints that affect the cached data. The hybrid Redis/memory cache is already wired into the ProviderRegistry.

---

## 11. Project-Specific & Behavioral

**Q89: What problem does HireLens AI solve?**
**A:** HireLens AI bridges the gap between students and recruiters by automating two pain points: (1) Resume screening — students get AI-powered match scores showing how well their resume fits a job before applying, (2) Interview preparation — recruiters get AI-generated interview questions tailored to the specific candidate-job match, focusing on skill gaps and key strengths.

**Q90: What are the two user roles and their workflows?**
**A:** **Student**: Upload resume → Browse jobs → Preview AI match score → Apply → View interview questions. **Recruiter**: Create job posting (AI auto-extracts skills) → View applications → Update status (shortlist/reject) → Generate interview questions from candidate-match.

**Q91: What phase of development is the project in?**
**A:** Phase 2 — core functionality is built and tested. Auth, resume management, job postings, matching, applications, interview generation, file uploads, profile management, and audit logging are all implemented. Remaining work includes real-time notifications, advanced analytics dashboard, team collaboration for recruiters, and production-hardening (more E2E tests, performance optimization).

**Q92: What was the most challenging technical decision?**
**A:** The AI provider abstraction was the most architecturally significant decision. It required defining a generic interface that could accommodate vastly different provider capabilities (Gemini's structured output support vs. Ollama's raw text responses) while keeping the service layer clean. The Zod schema validation layer for AI outputs was the key insight — it normalizes provider differences at the boundary.

**Q93: How did you ensure the project follows security best practices?**
**A:** Every security measure maps to a documented rule in AGENTS.md. The codebase received a dedicated security review (`docs/SECURITY_REVIEW_AUTH.md`). Specific practices: bcrypt for passwords, short-lived JWTs with rotation, double-submit CSRF, rate limiting on all sensitive endpoints, Helmet headers, file validation, prompt injection protection, audit logging, and Sentry PII redaction.

**Q94: What would you improve if starting over?**
**A:** (1) Add a shared package (`packages/shared/`) in the monorepo for truly shared types and schemas instead of relying on duplication, (2) Introduce a lightweight DI container (e.g., `tsyringe`) instead of manual provider wiring as the number of services grows, (3) Add OpenAPI/Swagger documentation generation from the start rather than maintaining a separate `API_SPEC.md`.

**Q95: How is the project organized for maintainability?**
**A:** Strict modularity — each backend module is self-contained with routes, controller, service, schemas, and types. The AGENTS.md file codifies engineering rules that every contributor follows. A consistent file naming convention (`*.routes.ts`, `*.controller.ts`, etc.) makes navigation predictable. Tests mirror the module structure.

**Q96: How do you ensure code quality?**
**A:** TypeScript strict mode, consistent linting with Prettier, AGENTS.md rules enforced in code review, comprehensive test suite with coverage thresholds, modular architecture that prevents cross-module coupling, and the provider abstraction pattern that ensures third-party integrations don't leak into business logic.

**Q97: How would you add a new feature module?**
**A:** Follow the established pattern: (1) Add Prisma model (if new data needed), (2) Create `{feature}.routes.ts`, `{feature}.controller.ts`, `{feature}.service.ts`, `{feature}.schemas.ts`, `{feature}.types.ts` in a new directory under `modules/`, (3) Register routes in `routes/index.ts`, (4) Add Zod schemas, (5) Add unit + integration tests. The pattern is documented and consistent across all 8 existing modules.

**Q98: What is the role of the AGENTS.md file?**
**A:** AGENTS.md serves as the engineering charter — it codifies architecture rules (MVC, thin controllers, provider interfaces), security rules (bcrypt, JWT rotation, file validation), testing rules (deterministic tests, fixtures, coverage thresholds), and delivery rules (commit messages, documentation updates). Every contributor (human or AI) uses it as the source of truth for how to write code in this project.

**Q99: How do you handle API versioning?**
**A:** All routes are mounted under `/api/v1`. If breaking changes are needed, a new version (`/api/v2`) would be mounted alongside v1 with a deprecation notice for v1. The `routes/index.ts` file aggregates all versioned route groups.

**Q100: What monitoring and observability exists?**
**A:** Three layers: (1) **Application monitoring** via Sentry (error tracking with PII redaction), (2) **Structured logging** via Pino (JSON logs with request IDs for correlation), (3) **Health checks** (GET `/health` for DB connectivity). Planned enhancements for Phase 3: Prometheus metrics (request duration, queue depths, cache hit rates), Grafana dashboards, and distributed tracing.
