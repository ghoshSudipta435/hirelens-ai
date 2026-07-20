ARG NODE_VERSION=20.18.0

# ---- Backend Build ----
FROM node:${NODE_VERSION}-alpine AS backend-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY backend/ ./backend/
RUN npm ci

# Generate Prisma client and build backend
RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build --workspace=backend
RUN npm prune --omit=dev

# ---- Frontend Build ----
FROM node:${NODE_VERSION}-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
COPY tsconfig.base.json ./
COPY frontend ./frontend

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm ci
RUN npm run build --workspace=frontend

# ---- Frontend Runtime ----
FROM node:${NODE_VERSION}-alpine AS frontend
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=frontend-build /app/frontend/.next/standalone ./
COPY --from=frontend-build /app/frontend/.next/static ./.next/static
COPY --from=frontend-build /app/frontend/public ./public
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000 || exit 1
CMD ["node", "server.js"]

# ---- Backend Runtime ----
FROM node:${NODE_VERSION}-alpine AS backend
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/package.json ./backend/package.json
COPY --from=backend-build /app/backend/prisma ./backend/prisma
COPY --from=backend-build /app/package.json ./
ENV NODE_ENV=production
USER appuser
EXPOSE 4000
WORKDIR /app/backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health || exit 1
CMD ["sh", "-c", "npx prisma migrate resolve --applied 20260531_add_auth_audit_events --schema=prisma/schema.prisma || true && npx prisma migrate deploy --schema=prisma/schema.prisma && exec node dist/server.js"]