FROM node:20-slim AS base

# Install dependencies for better-sqlite3 and playwright
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV DB_DIR=/app/data

COPY --from=base /app/package.json /app/package-lock.json ./
RUN npm ci --production

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.js ./
COPY --from=base /app/bin ./bin
COPY --from=base /app/src ./src

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]
