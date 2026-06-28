ARG NODE_VERSION=20

# ---- Backend Build ----
FROM node:${NODE_VERSION}-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json ./
COPY package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
COPY backend/ .
RUN npx prisma generate && npm run build

# ---- Frontend Build ----
FROM node:${NODE_VERSION}-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

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
CMD ["node", "server.js"]

# ---- Backend Runtime (LAST) ----
FROM node:${NODE_VERSION}-alpine AS backend
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set the workdir cleanly to /app
WORKDIR /app

# Copy everything into /app so paths resolve predictably
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./package.json
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/dist ./dist

ENV NODE_ENV=production
USER appuser
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

# Execute right from the root app folder
CMD ["node", "dist/server.js"]