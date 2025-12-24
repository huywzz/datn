# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để tận dụng cache
COPY package*.json ./

RUN npm ci

# Copy source
COPY . .

# Build NestJS (ts -> dist)
RUN npm run build


# ---------- Production stage ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Chỉ cài dependency cần cho runtime
RUN npm ci --omit=dev

# Copy dist từ build stage
COPY --from=builder /app/dist ./dist

# Nếu có các file cần runtime (views, public, prisma, etc.)
# COPY --from=builder /app/prisma ./prisma

EXPOSE 300

CMD ["node", "dist/src/main.js"]