# Deployment Checklist

## Neon

- [ ] Create or select the production Neon branch
- [ ] Copy pooled connection string to `DATABASE_URL`
- [ ] Copy direct connection string to `DIRECT_URL`
- [ ] Verify both URLs include `sslmode=require`
- [ ] Run `npm run db:generate`
- [ ] Run `npm run db:deploy`

## Render

- [ ] Create the backend web service
- [ ] Set root directory to the repo root
- [ ] Set build command to `npm install --include=dev && npm run db:generate && npm run build --workspace backend`
- [ ] Set start command to `npm run start --workspace backend`
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=10000`
- [ ] Set `CLIENT_ORIGIN` to the deployed frontend URL
- [ ] Set JWT secrets
- [ ] Set Cloudinary credentials
- [ ] Verify `GET /health`

## Verification

- [ ] Run backend lint
- [ ] Run backend typecheck
- [ ] Run backend tests
- [ ] Smoke test auth and upload endpoints
