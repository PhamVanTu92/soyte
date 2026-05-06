# ─────────────────────────────────────────────
# Stage 1: Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

COPY package.json ./

# Install production dependencies only
# Bao gồm cả tedious (MSSQL) và pg/pg-hstore (PostgreSQL)
RUN pnpm install --prod --no-frozen-lockfile

# ─────────────────────────────────────────────
# Stage 2: Runtime image
# ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Runtime tools: netcat (for TCP wait in entrypoint)
RUN apk add --no-cache netcat-openbsd

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Copy Docker helper scripts
COPY docker/setup-db.js ./docker/setup-db.js
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

# Create uploads directories (will be overridden by volume mount)
RUN mkdir -p uploads/documents uploads/images

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
