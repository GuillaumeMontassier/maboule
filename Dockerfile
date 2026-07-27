# À placer à la RACINE du monorepo (pas dans server/)
# Suppose un package.json racine avec "workspaces": ["client", "server"]

# --- Stage 1 : build ---
FROM node:22-alpine AS builder
WORKDIR /app

# Copier les manifests d'abord (meilleur cache Docker)
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm ci

# Copier tout le code source
COPY . .

# Ne builder que le workspace server
RUN npm run build --workspace=server

# --- Stage 2 : production ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --omit=dev --workspace=server

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/drizzle ./server/drizzle

EXPOSE 3000
CMD ["node", "server/dist/index.js"]