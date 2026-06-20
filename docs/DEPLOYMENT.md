# Deployment Guide

## Backend Hosting

The backend is deployed as a Render Free Tier web service and uses Neon PostgreSQL for persistence.

### Runtime model

- Render hosts the Express API only.
- Neon provides the PostgreSQL database for both development and production.
- Prisma runtime queries use the pooled Neon `DATABASE_URL`.
- Prisma migrations use the direct Neon `DIRECT_URL`.
- Prisma generate can fall back to `DATABASE_URL` during platform builds, but `DIRECT_URL` should still be set for migration workflows.

### Render service settings

- Service type: `web`
- Runtime: `node`
- Plan: `free`
- Root directory: repository root
- Build command: `npm install --include=dev && npm run db:generate && npm run build --workspace backend`
- Start command: `npm run start --workspace backend`

### Required environment variables

- `NODE_ENV=production`
- `PORT=10000`
- `CLIENT_ORIGIN=https://your-frontend.onrender.com`
- `DATABASE_URL=postgresql://...pooler...?...sslmode=require`
- `DIRECT_URL=postgresql://...direct...?...sslmode=require`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `BCRYPT_SALT_ROUNDS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Generate separate JWT secrets with at least 32 characters:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Use the first value for `JWT_SECRET` and the second value for `JWT_REFRESH_SECRET`.

For an existing Render web service, add these values manually in Render Dashboard -> service -> Environment.
The `sync: false` entries in `render.yaml` tell Render which variables are required when creating a service from a blueprint, but they do not populate secrets into an already-created manual web service.

### Health check

- `GET /health`

Render should use this endpoint for uptime checks.

### Operational notes

- Keep `CLIENT_ORIGIN` pointed at the deployed frontend URL.
- Keep `DATABASE_URL` on the pooled Neon endpoint to support runtime traffic.
- Keep `DIRECT_URL` on the direct Neon endpoint to support migrations.
- Keep `npm install --include=dev` in the Render build command because TypeScript, Prisma CLI, and Node type definitions are build-time dependencies.
- Set every `sync: false` variable from `render.yaml` in the Render Environment tab before deploying. An unset secret will crash startup by design.
- Rotate JWT secrets before production launch.
- Set `LOG_LEVEL=info` in production.
