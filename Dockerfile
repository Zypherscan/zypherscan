# Build Stage
FROM node:20-slim as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build frontend
RUN pnpm run build

# Production Stage
FROM node:20-slim

WORKDIR /app

# Install pnpm and production dependencies
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY server.js ./

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start server
CMD ["pnpm", "start"]

