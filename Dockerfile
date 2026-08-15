# ============ Stage 1: Build ============
FROM node:20 AS builder

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# ข้ามการดาวน์โหลด electron binary (ไม่จำเป็นสำหรับ server build)
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV HUSKY=0

RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    gcc \
    g++ \
    libc6-dev \
    libusb-1.0-0-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# 3. ติดตั้ง Prisma 5.22.0
RUN npm install prisma@5.22.0 --save-dev
RUN npm install @prisma/client@5.22.0

COPY prisma ./prisma/



# ติดตั้ง dependencies ทั้งหมด (รวม devDependencies ที่จำเป็นสำหรับ build)
RUN npm install 

COPY . .

ENV NEXT_PHASE=phase-production-build
RUN npx prisma generate
RUN npm run build

# ============ Stage 2: Production ============
FROM node:20-slim AS runner

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy standalone output + static files + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy prisma schema + engine + CLI สำหรับ prisma db push (offline install)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Create upload directories so volume mounts work on first run
RUN mkdir -p /app/public/uploads /app/uploads/backups /app/uploads/doc




CMD ["node", "server.js"]