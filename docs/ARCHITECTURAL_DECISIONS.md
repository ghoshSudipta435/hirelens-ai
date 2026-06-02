# Architectural Decisions

This document records the project skeleton decisions made before Phase 2 implementation.

## 1. Monorepo with npm Workspaces

Decision:
Use a single repository with npm workspaces for `frontend` and `backend`.

Reasoning:
- The product and API will evolve together during MVP.
- Shared setup, linting, formatting, and local commands reduce onboarding friction.
- One lockfile and one dependency installation are simpler for a small team than separate repositories.

Tradeoff:
- Workspace tooling is slightly more complex than a single app repository.

Why accepted:
- That complexity is still lower than coordinating two repositories during early product iteration.

## 2. Next.js for the Frontend

Decision:
Use Next.js App Router for the frontend.

Reasoning:
- “React + App Router” maps directly to Next.js.
- Next.js provides file-based routing, built-in TypeScript support, Tailwind integration, and production-grade defaults.
- It leaves room for future server-rendered dashboards and authenticated routing without re-platforming.

Tradeoff:
- More framework opinion than a plain React SPA.

Why accepted:
- The routing and project-structure benefits outweigh the extra framework surface for this product.

## 3. Separate Express API Instead of Full-Stack Next

Decision:
Keep the backend as an independent Express service.

Reasoning:
- The V2 documents require modular MVC, Prisma, middleware, providers, request validation, and explicit service boundaries.
- Resume parsing, AI providers, storage providers, and ranking workflows are backend concerns that benefit from a dedicated service.
- It keeps deployment options open for Render or any Node host without coupling to the frontend server runtime.

Tradeoff:
- Two running applications locally instead of one.

Why accepted:
- Clear separation between UI and domain/API layers is more valuable for this platform than a merged full-stack framework.

## 4. TypeScript Everywhere

Decision:
Use TypeScript in both apps and centralize baseline compiler rules in `tsconfig.base.json`.

Reasoning:
- The project rules explicitly require TypeScript everywhere.
- Shared strictness reduces contract drift and catches integration issues early.
- A root base config keeps compiler behavior aligned across packages while allowing package-specific overrides.

Tradeoff:
- Slightly more config upfront.

Why accepted:
- The product depends on typed contracts between client, API, and database layers.

## 5. Keep Business Logic Out of the Skeleton

Decision:
Only create infrastructure bootstrapping, folder layout, config, and placeholders.

Reasoning:
- The user asked for a production-ready skeleton, not feature implementation.
- Premature logic would create accidental contracts before Phase 2 design decisions are finalized.

Tradeoff:
- Some directories are intentionally empty or contain placeholders.

Why accepted:
- It keeps the repository ready without locking implementation details too early.

## 6. Modular Backend Structure

Decision:
Structure the backend around modules and cross-cutting layers:
- `modules`
- `controllers`
- `routes`
- `middleware`
- `providers`
- `repositories`
- `validators`

Reasoning:
- This matches the V2 architecture and AGENTS rules.
- It keeps controllers thin and moves reusable domain logic into services during Phase 2.
- External integrations such as Cloudinary, PDF parsing, and AI providers can evolve independently.

Tradeoff:
- More directories than a minimal Express app.

Why accepted:
- The domain is already broad enough to justify modular boundaries from the start.

## 7. Prisma as the Data Boundary

Decision:
Keep Prisma schema and generated client inside the backend workspace.

Reasoning:
- The API owns persistence concerns.
- Prisma migrations and generated types should be versioned with the service that uses them.
- The V2 schema already exists and is part of backend implementation readiness.

Tradeoff:
- Frontend cannot directly consume generated Prisma types.

Why accepted:
- That separation is healthy. Frontend should depend on API contracts, not database models.

## 8. Zod for Request Validation

Decision:
Adopt Zod as the validation standard at the backend boundary.

Reasoning:
- The V2 API and AGENTS rules require schema-based validation.
- Zod provides runtime validation plus TypeScript inference.
- It fits well with DTO-style request contracts and centralized error formatting.

Tradeoff:
- Validation schemas need to be maintained alongside DTO definitions.

Why accepted:
- The type-safety and input-hardening benefits are worth the cost.

## 9. JWT in the Skeleton, Not Yet in Logic

Decision:
Include JWT dependencies, env vars, middleware folders, and auth module scaffolding now, but not the auth implementation itself.

Reasoning:
- Auth is a first-class requirement in the PRD and API spec.
- The skeleton should already reflect the final security boundary layout.

Tradeoff:
- Some auth-related structure is currently placeholder-only.

Why accepted:
- It avoids later reshaping of the repo once auth work begins.

## 10. Root Prettier, Package-Local ESLint

Decision:
Use one root Prettier config and keep ESLint configs inside each application.

Reasoning:
- Formatting should be identical across the repo.
- Linting requirements differ between Next.js frontend code and Express backend code.
- Package-local ESLint keeps framework-specific rules close to the relevant app.

Tradeoff:
- Two lint config files instead of one.

Why accepted:
- That split is simpler than forcing both ecosystems into one lint config too early.

## 11. Minimal Runnable Entry Points

Decision:
Add minimal startup files for frontend and backend.

Reasoning:
- A production-ready skeleton should install, lint, type-check, and start.
- These files validate the toolchain without implementing domain features.

Tradeoff:
- The repository contains a small amount of infrastructure code before Phase 2.

Why accepted:
- It reduces risk when feature work begins because the platform shell is already stable.
