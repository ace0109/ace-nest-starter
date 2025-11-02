# ACE NestJS Starter 🚀

<div align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" />
  <h3>Production-Ready NestJS Scaffolding</h3>
  <p>一个功能完整、开箱即用的 NestJS 企业级项目脚手架</p>
  <p>
    <img src="https://img.shields.io/badge/NestJS-v11-red" alt="NestJS Version" />
    <img src="https://img.shields.io/badge/TypeScript-v5.7-blue" alt="TypeScript Version" />
    <img src="https://img.shields.io/badge/Prisma-v6.18-green" alt="Prisma Version" />
    <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" />
  </p>
</div>

## ✨ 特性

### 🎯 核心功能

- **🔐 完整的认证授权体系** - JWT 双令牌 + RBAC 权限控制 + OAuth 2.0 社交登录
- **📚 自动化 API 文档** - Swagger/OpenAPI 集成，自动生成接口文档
- **📧 邮件服务** - 基于 Nodemailer 的邮件发送功能
- **📁 文件上传** - 支持多种文件类型上传和管理
- **🔄 实时通信** - 基于 Socket.io 的 WebSocket 支持
- **⏰ 任务调度** - 支持 Cron、Interval、Timeout 任务
- **🚦 限流保护** - 基于 Redis 的分布式限流
- **❤️ 健康检查** - 完善的健康检查和监控端点

### 🛠 技术栈

- **框架**: NestJS 11.x (最新版本)
- **语言**: TypeScript 5.7+ (严格模式)
- **数据库**: PostgreSQL 16 + Prisma ORM
- **缓存**: Redis 7
- **认证**: Passport.js + JWT
- **验证**: Zod (类型安全的 schema 验证)
- **日志**: Pino (高性能日志)
- **容器**: Docker + Docker Compose
- **测试**: Jest + Supertest (E2E)
- **代码质量**: ESLint + Prettier + Husky + Commitlint

## 🚀 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 16
- Redis >= 7
- Docker & Docker Compose (可选)

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/ace-nest-starter.git
cd ace-nest-starter
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 环境配置

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等必要参数
```

#### 4. 使用 Docker 启动服务（推荐）

```bash
# 启动开发环境（PostgreSQL + Redis + pgAdmin + Mailhog）
./docker.sh dev:up

# 或者使用 docker-compose
docker-compose -f docker-compose.dev.yml up -d
```

#### 5. 数据库初始化

```bash
# 运行数据库迁移
pnpm prisma:migrate

# 生成 Prisma Client
pnpm prisma:generate
```

#### 6. 启动应用

```bash
# 开发环境
pnpm start:dev

# 生产环境
pnpm build
pnpm start:prod
```

应用将运行在 http://localhost:3000

## 📖 API 文档

启动应用后，访问以下地址查看 API 文档：

- Swagger UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

## 🔧 常用命令

### 开发

```bash
pnpm start:dev       # 开发模式（热重载）
pnpm start:debug     # 调试模式
pnpm build          # 构建生产版本
pnpm start:prod     # 运行生产版本
```

### 数据库

```bash
pnpm prisma:migrate      # 运行迁移
pnpm prisma:generate     # 生成 Prisma Client
pnpm prisma:studio       # 打开 Prisma Studio
pnpm prisma:seed        # 填充种子数据
pnpm prisma:reset       # 重置数据库
```

### 测试

```bash
pnpm test           # 运行单元测试
pnpm test:watch     # 监听模式
pnpm test:cov       # 生成覆盖率报告
pnpm test:e2e       # 运行 E2E 测试
```

### 代码质量

```bash
pnpm lint           # ESLint 检查
pnpm format         # Prettier 格式化
pnpm type-check     # TypeScript 类型检查
```

### Docker

```bash
./docker.sh dev:up       # 启动开发环境
./docker.sh dev:down     # 停止开发环境
./docker.sh build        # 构建生产镜像
./docker.sh up           # 启动生产环境
```

## 🔐 认证与授权

### JWT 认证

- 双令牌机制（Access Token + Refresh Token）
- Access Token 有效期：2小时（可配置）
- Refresh Token 有效期：30天（可配置）

### RBAC 权限控制

- 基于角色的访问控制
- 权限格式：`resource:action`（如 `user:create`）
- 支持通配符：`*:*`（超级管理员）

### OAuth 2.0 社交登录

- ✅ Google
- ✅ GitHub
- ✅ 微信

## 📦 模块说明

完整的模块化架构，包含认证、用户管理、权限控制、邮件服务、文件上传、WebSocket、任务调度、OAuth 社交登录等功能。

## 🚢 部署

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t ace-nest-starter:latest .

# 使用 Docker Compose 部署
docker-compose up -d
```

### 传统部署

```bash
# 构建应用
pnpm build

# 设置环境变量
export NODE_ENV=production
export DATABASE_URL=postgresql://...

# 运行应用
node dist/src/main.js
```

## 📄 许可证

本项目采用 MIT 许可证

---

<div align="center">
  <p>如果这个项目对你有帮助，请给一个 ⭐️ Star！</p>
  <p>Made with ❤️ by ACE Team</p>
</div>
