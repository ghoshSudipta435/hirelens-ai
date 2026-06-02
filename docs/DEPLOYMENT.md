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
- Build command: `npm install && npm run db:generate && npm run build --workspace backend`
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

### Health check

- `GET /health`

Render should use this endpoint for uptime checks.

### Operational notes

- Keep `CLIENT_ORIGIN` pointed at the deployed frontend URL.
- Keep `DATABASE_URL` on the pooled Neon endpoint to support runtime traffic.
- Keep `DIRECT_URL` on the direct Neon endpoint to support migrations.
- Rotate JWT secrets before production launch.
- Set `LOG_LEVEL=info` in production.
