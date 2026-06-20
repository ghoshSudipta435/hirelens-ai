ARG NODE_VERSION=20

# ---- Backend Build ----
FROM node:${NODE_VERSION}-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
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

# ---- Backend Runtime ----
FROM node:${NODE_VERSION}-alpine AS backend
WORKDIR /app
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./
EXPOSE 4000
CMD ["node", "dist/server.js"]

# ---- Frontend Runtime ----
FROM node:${NODE_VERSION}-alpine AS frontend
WORKDIR /app
COPY --from=frontend-build /app/frontend/.next ./.next
COPY --from=frontend-build /app/frontend/node_modules ./node_modules
COPY --from=frontend-build /app/frontend/package.json ./package.json
COPY --from=frontend-build /app/frontend/public ./public
EXPOSE 3000
CMD ["npm", "start"]
