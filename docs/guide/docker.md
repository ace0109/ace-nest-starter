# Docker 部署

## 概述

使用 Docker 容器化部署 ACE NestJS Starter 应用。

## Dockerfile

### 多阶段构建

```dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 生产阶段
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

RUN npm install -g pnpm

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Docker Compose

完整的应用栈配置。

## 最佳实践

1. 使用多阶段构建
2. 最小化镜像大小
3. 安全扫描
4. 健康检查配置
