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
- [ ] Set `DATABASE_URL` to the pooled Neon URL
- [ ] Set `DIRECT_URL` to the direct Neon URL
- [ ] Set `JWT_SECRET` to a generated secret of at least 32 characters
- [ ] Set `JWT_REFRESH_SECRET` to a different generated secret of at least 32 characters
- [ ] Set `JWT_EXPIRES_IN=15m`
- [ ] Set `JWT_REFRESH_EXPIRES_IN=7d`
- [ ] Set Cloudinary credentials
- [ ] Confirm no required environment variable is blank in Render
- [ ] Verify `GET /health`

## Verification

- [ ] Run backend lint
- [ ] Run backend typecheck
- [ ] Run backend tests
- [ ] Smoke test auth and upload endpoints
