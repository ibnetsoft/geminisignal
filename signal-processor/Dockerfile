# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S signal-processor -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create necessary directories
RUN mkdir -p logs config && \
    chown -R signal-processor:nodejs logs config

# Switch to non-root user
USER signal-processor

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('./dist/index.js').default.getHealthStatus()" || exit 1

# Expose port (if needed for health checks)
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Start application
CMD ["node", "dist/index.js"]