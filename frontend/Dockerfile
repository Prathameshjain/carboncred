# =========================================
# CarbonCred - Frontend Dockerfile
# =========================================
# Multi-stage: Node build → Nginx serve

# ── Stage 1: Build React App ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (for layer caching)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
