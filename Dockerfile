# Base image
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml* bun.lock* package-lock.json* ./

# Install dependencies
FROM base AS deps
RUN \
  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f bun.lock ]; then npm install -g bun && bun install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Development stage
FROM deps AS dev
COPY . .
EXPOSE 5173
# Vite dev server binding to all network interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Builder stage
FROM deps AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./
EXPOSE 4173
# You can change this to run the generated node server if applicable, e.g. "node .output/server/index.mjs"
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
