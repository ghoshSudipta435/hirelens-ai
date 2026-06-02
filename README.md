# HireLens AI

HireLens AI is an AI-assisted resume screening and interview preparation platform with:

- `frontend`: Next.js App Router client built with React and TypeScript
- `backend`: Express API built with Node.js, TypeScript, Prisma, JWT, and Zod

This repository is scaffolded for Phase 2 implementation. Domain modules exist as structure only; feature logic is intentionally not implemented yet.

## Repository Layout

```text
hirelens-ai/
├── frontend/      # Next.js App Router app
├── backend/       # Express + Prisma API
├── docs/          # Product and engineering documents
├── AGENTS.md      # Engineering rules
└── package.json   # npm workspace root
```

## Documents

- [PRD V2](docs/PRD.md)
- [API Specification V2](docs/API_SPEC.md)
- [Architecture V2](docs/ARCHITECTURE.md)
- [Database Design V2](docs/DATABASE_SCHEMA.md)
- [Roadmap V2](docs/ROADMAP.md)
- [Architectural Decisions](docs/ARCHITECTURAL_DECISIONS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)

## Prerequisites

- Node.js `20.9.0` or newer
- npm `10` or newer
- A Neon PostgreSQL project for development and production

Node `20.9.0` is the minimum because the current Next.js App Router installation guidance requires at least that version.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env
```

3. Update `backend/.env` with your Neon connection strings and JWT secrets.

   - `DATABASE_URL` should be the pooled Neon connection string used by the app runtime.
   - `DIRECT_URL` should be the direct Neon connection string used by Prisma CLI migrations.
   - Both must use the PostgreSQL protocol and include `sslmode=require`.
   - For production, mirror those values in Render environment variables instead of checking them into the repo.
   - Add your Cloudinary credentials to support file uploads:
     - `CLOUDINARY_CLOUD_NAME`
     - `CLOUDINARY_API_KEY`
     - `CLOUDINARY_API_SECRET`

4. Generate the Prisma client:

```bash
npm run db:generate
```

5. Create and apply the initial database migration when Phase 2 starts:

```bash
npm run db:migrate
```

For production or deployment workflows, apply already-generated migrations with:

```bash
npm run db:deploy
```

6. Verify the scaffold locally:

```bash
npm run lint
npm run typecheck
npm run build
```

## Local Development Commands

Run both apps:

```bash
npm run dev
```

Run frontend only:

```bash
npm run dev:frontend
```

Run backend only:

```bash
npm run dev:backend
```

Build everything:

```bash
npm run build
```

Lint everything:

```bash
npm run lint
```

Run tests:

```bash
npm run test
```

Type-check everything:

```bash
npm run typecheck
```

Format everything:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

Open Prisma Studio:

```bash
npm run db:studio
```

## Neon Database Setup

1. Create a Neon project and pick the branch you want to use for development.
2. Copy the pooled connection string into `backend/.env` as `DATABASE_URL`.
3. Copy the direct connection string into `backend/.env` as `DIRECT_URL`.
4. Ensure both strings use `postgresql://` or `postgres://` and include `sslmode=require`.
5. Run `npm run db:generate` to refresh the Prisma client.
6. Run `npm run db:migrate` in development to create and apply migrations against Neon.
7. Run `npm run db:deploy` in production or deployment workflows to apply committed migrations.

## Frontend Commands

```bash
npm run dev --workspace frontend
npm run build --workspace frontend
npm run start --workspace frontend
npm run lint --workspace frontend
npm run typecheck --workspace frontend
```

## Backend Commands

```bash
npm run dev --workspace backend
npm run build --workspace backend
npm run start --workspace backend
npm run lint --workspace backend
npm run test --workspace backend
npm run typecheck --workspace backend
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:deploy --workspace backend
npm run prisma:studio --workspace backend
```

## Render Deployment

The backend is designed to run on Render Free Tier with Neon PostgreSQL.

1. Create a Neon branch for production.
2. Create a Render web service from the repository root.
3. Use the build command `npm install --include=dev && npm run db:generate && npm run build --workspace backend`.
4. Use the start command `npm run start --workspace backend`.
5. Set `CLIENT_ORIGIN` to the deployed frontend URL.
6. Set `DATABASE_URL` to the pooled Neon connection string.
7. Set `DIRECT_URL` to the direct Neon connection string. Prisma generate can fall back to `DATABASE_URL` during build, but migration workflows still need `DIRECT_URL`.
8. Set JWT, bcrypt, and Cloudinary environment variables.
9. Deploy migrations with `npm run db:deploy` when schema changes are committed.
10. Verify the service with `GET /health`.

## Environment Templates

### Frontend

See [frontend/.env.local.example](frontend/.env.local.example).

### Backend

See [backend/.env.example](backend/.env.example).

File uploads use Cloudinary Free Tier. The backend accepts validated multipart uploads, persists file metadata in PostgreSQL, and stores the asset in Cloudinary. Keep the Cloudinary values present in `backend/.env` before testing `/api/v1/uploads`.

## Architectural Summary

The repository uses npm workspaces instead of separate repositories so the frontend and backend can evolve together while sharing a single installation, a single root toolchain, and one source of documentation. That keeps Phase 2 velocity high and avoids drift between API contracts and UI integration.

The frontend uses Next.js instead of plain React because App Router is a Next.js feature, not a standalone React router. This gives the project a stable file-based routing model, built-in TypeScript support, and an easy path to server rendering if recruiter dashboards need better SEO or faster initial loads later.

The backend is a separate Express service rather than Next.js route handlers because the V2 architecture explicitly calls for a modular MVC API with Prisma, middleware boundaries, provider abstractions, and future async job support. Keeping the API separate avoids coupling product growth to the frontend runtime model.

Database access is isolated through Prisma from day one so data contracts, migrations, and generated client types stay explicit. Validation uses Zod at the request boundary because V2 requires schema-based validation and typed DTOs before business logic is added.

JWT authentication is included in the scaffold at the dependency and folder level, but not implemented yet. That keeps the infrastructure aligned with the V2 API and security rules without prematurely locking the auth flows.

The backend uses separate TypeScript configs for development and production builds. This avoids a common scaling problem where test files end up coupled to the production build graph and eventually break `tsc` output settings.

Prisma CLI operations use `prisma.config.ts` to read `DIRECT_URL`, while the runtime Prisma client uses the pooled Neon `DATABASE_URL` through the Neon adapter. That keeps migrations and application traffic on the correct connection path.

The backend exposes `GET /health` at the repository root for Render-style uptime checks and also keeps the API-scoped health route available under `/api/v1/health`.

For a deeper rationale, see [docs/ARCHITECTURAL_DECISIONS.md](docs/ARCHITECTURAL_DECISIONS.md).
