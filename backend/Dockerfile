FROM node:21-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Create uploads directories
RUN mkdir -p uploads/ktp uploads/properties uploads/units uploads/avatars uploads/complaints

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "server.js"]
