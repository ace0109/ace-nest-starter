# 环境设置

## 概述

本指南帮助你配置开发、测试和生产环境，确保应用在各种环境下正常运行。

## 环境类型

### 开发环境 (development)

本地开发环境，特点：

- 宽松的验证规则
- 详细的日志输出
- 热重载支持
- 本地服务依赖

### 测试环境 (test)

自动化测试环境，特点：

- 独立的测试数据库
- Mock 外部服务
- 固定的种子数据
- 快速执行

### 生产环境 (production)

线上运行环境，特点：

- 严格的验证规则
- 优化的性能配置
- 安全的密钥管理
- 完整的监控

## 环境配置文件

### 文件结构

```
项目根目录/
├── .env                 # 本地开发配置（不提交）
├── .env.example         # 配置模板（提交）
├── .env.development     # 开发环境配置（可选）
├── .env.test           # 测试环境配置（可选）
└── .env.production     # 生产环境配置（不提交）
```

### 加载优先级

1. 系统环境变量（最高优先级）
2. `.env.{NODE_ENV}` 文件
3. `.env` 文件
4. 代码中的默认值（最低优先级）

## 快速开始

### 1. 复制配置模板

```bash
cp .env.example .env
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动基础服务

使用 Docker Compose 启动 PostgreSQL 和 Redis：

```bash
pnpm docker:up
```

这将启动：

- PostgreSQL（端口 5432）
- Redis（端口 6379）
- Adminer（端口 8080，数据库管理界面）
- Redis Commander（端口 8081，Redis 管理界面）

### 4. 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# （可选）填充种子数据
pnpm prisma:seed
```

### 5. 启动应用

```bash
# 开发模式（热重载）
pnpm start:dev

# 调试模式
pnpm start:debug

# 生产模式
pnpm build
pnpm start:prod
```

## 环境变量详解

### 核心配置

```bash
# 运行环境
NODE_ENV=development  # development | production | test

# 应用端口
PORT=3000

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 数据库配置

```bash
# PostgreSQL 连接字符串
DATABASE_URL=postgresql://user:password@localhost:5432/database

# 连接格式说明：
# postgresql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[参数]

# 本地开发示例
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ace_dev

# 生产环境示例（使用 SSL）
DATABASE_URL=postgresql://user:pass@db.example.com:5432/ace_prod?sslmode=require
```

### JWT 认证配置

```bash
# JWT 密钥（生产环境需要 64+ 字符）
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# 令牌过期时间
JWT_ACCESS_TTL=15m   # 访问令牌：15分钟
JWT_REFRESH_TTL=7d    # 刷新令牌：7天

# 时间格式：
# s = 秒, m = 分钟, h = 小时, d = 天
# 例如：30s, 15m, 2h, 7d
```

### Redis 缓存配置

```bash
# Redis 连接
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=        # 可选，本地开发通常不需要
REDIS_DB=0            # 数据库索引 (0-15)
REDIS_TTL=86400       # 默认过期时间（秒）
```

### 邮件服务配置

```bash
# SMTP 配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false      # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Gmail 配置示例：
# 1. 开启两步验证
# 2. 生成应用专用密码
# 3. 使用应用密码作为 SMTP_PASS
```

### 日志配置

```bash
# 日志级别
LOG_LEVEL=debug  # trace | debug | info | warn | error | fatal

# 开发环境推荐：debug
# 生产环境推荐：info
```

### OAuth 社交登录配置

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# 微信 OAuth
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_CALLBACK_URL=http://localhost:3000/auth/wechat/callback
```

## Docker 开发环境

### 使用 Docker Compose

项目提供了完整的 Docker Compose 配置：

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ace_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - '8080:8080'

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - '8081:8081'
    environment:
      REDIS_HOSTS: local:redis:6379
```

### Docker 命令

```bash
# 启动所有服务
pnpm docker:up

# 停止所有服务
pnpm docker:down

# 查看服务状态
pnpm docker:ps

# 查看日志
pnpm docker:logs

# 重置数据（慎用）
pnpm docker:clean
```

## 生产环境部署

### 环境变量管理

**推荐方式**：

1. **环境变量服务**: 使用 AWS Secrets Manager、Azure Key Vault 等
2. **CI/CD 集成**: 在 GitHub Actions、GitLab CI 中配置
3. **容器编排**: Kubernetes Secrets、Docker Swarm Configs
4. **进程管理器**: PM2 ecosystem 配置

**安全要求**：

- JWT 密钥至少 64 字符
- 使用强密码
- 启用 SSL/TLS
- 定期轮换密钥

### 使用 PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ace-nest-api',
      script: 'dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // 其他环境变量
      },
    },
  ],
};
```

启动命令：

```bash
pm2 start ecosystem.config.js --env production
```

### 使用 Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

构建和运行：

```bash
# 构建镜像
docker build -t ace-nest-api .

# 运行容器
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name ace-api \
  ace-nest-api
```

## 常见问题

### 1. 数据库连接失败

**问题**：`Connection refused` 或 `ECONNREFUSED`

**解决方案**：

```bash
# 检查 PostgreSQL 是否运行
pnpm docker:ps

# 如果未运行，启动服务
pnpm docker:up

# 验证连接字符串
echo $DATABASE_URL
```

### 2. Redis 连接失败

**问题**：`Redis connection failed`

**解决方案**：

```bash
# 检查 Redis 是否运行
redis-cli ping

# 或使用 Docker
docker exec -it ace_redis redis-cli ping
```

### 3. JWT 密钥错误

**问题**：`JWT secret must be at least 64 characters in production`

**解决方案**：

```bash
# 生成安全的密钥
openssl rand -base64 64
```

### 4. 端口被占用

**问题**：`Port 3000 is already in use`

**解决方案**：

```bash
# 查找占用端口的进程
lsof -i :3000

# 或更改应用端口
PORT=3001 pnpm start:dev
```

### 5. 环境变量未加载

**问题**：配置值为 `undefined`

**解决方案**：

```bash
# 确认 .env 文件存在
ls -la .env

# 检查 NODE_ENV
echo $NODE_ENV

# 验证配置加载
pnpm start:dev | grep "Configuration loaded"
```

## 调试技巧

### 查看当前配置

在应用启动时添加配置日志：

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 开发环境打印配置
  if (configService.get('app.env') === 'development') {
    console.log('Current Configuration:', {
      app: configService.get('app'),
      database: '***', // 不打印敏感信息
      jwt: '***',
      redis: configService.get('redis'),
    });
  }
}
```

### 验证环境变量

```bash
# 打印所有环境变量
env | grep -E '^(NODE_ENV|PORT|DATABASE_URL|JWT|REDIS|SMTP|LOG)'

# 验证特定变量
echo "NODE_ENV=$NODE_ENV"
echo "DATABASE_URL=$DATABASE_URL"
```

### 使用调试模式

```bash
# 启用调试日志
LOG_LEVEL=trace pnpm start:dev

# 使用 Node.js 调试器
pnpm start:debug

# 在 VSCode 中调试
# 1. 设置断点
# 2. F5 启动调试
# 3. 使用调试控制台
```

## 下一步

- [数据库配置](./database.md) - 了解 Prisma ORM 配置
- [认证系统](./authentication.md) - 配置 JWT 认证
- [生产部署](./production.md) - 生产环境最佳实践
