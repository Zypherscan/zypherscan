# Multi-stage Dockerfile for ZypherScan
# Stage 1: Build Rust scanner
FROM rust:latest as rust-builder

# Install dependencies for Rust build
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy Rust project files
COPY zypherscan-decrypt/Cargo.toml ./
COPY zypherscan-decrypt/src ./src

# Build Rust binary in release mode
RUN cargo build --release

# Stage 2: Build frontend
FROM node:20-slim as frontend-builder

WORKDIR /build

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

# Stage 3: Production image
FROM debian:bookworm-slim

WORKDIR /app

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /build/dist ./dist

# Copy server files
COPY zypherscan-decrypt/server.js ./zypherscan-decrypt/
COPY zypherscan-decrypt/scanner_client.js ./zypherscan-decrypt/

# Copy Rust binary from rust-builder
COPY --from=rust-builder /build/target/release/zypherscan-decrypt ./zypherscan-decrypt/target/release/

# Create necessary directories
RUN mkdir -p zypherscan-decrypt/target/release

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["pnpm", "start"]
