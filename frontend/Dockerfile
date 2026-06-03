# ── Stage 1: Build React app ──────────────────────────────
FROM node:21-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

# Build args untuk URL backend (diteruskan saat docker build)
ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_BACKEND_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

# ── Stage 2: Serve dengan Nginx ───────────────────────────
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Hapus default nginx page
RUN rm -rf ./*

# Copy hasil build
COPY --from=builder /app/dist .

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
