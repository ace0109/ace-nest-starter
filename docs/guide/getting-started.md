# 快速开始

## 系统要求

在开始之前，请确保您的系统满足以下要求：

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0 (推荐使用 pnpm)
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0 (可选，用于缓存)
- **Docker**: >= 20.0 (可选，用于容器化部署)

## 安装步骤

### 1. 克隆项目

```bash
# 使用 Git 克隆
git clone https://github.com/yourusername/ace-nest-starter.git my-project
cd my-project

# 或者使用 degit (不包含 git 历史)
npx degit yourusername/ace-nest-starter my-project
cd my-project
```

### 2. 安装依赖

本项目强制使用 pnpm 作为包管理器：

```bash
# 如果没有安装 pnpm
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 3. 环境配置

复制环境变量示例文件并根据需要修改：

```bash
cp .env.example .env
```

关键环境变量说明：

```env
# 应用配置
NODE_ENV=development          # 环境：development | production | test
APP_PORT=3000                  # 应用端口
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 数据库配置 (必需)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ace_nest_dev

# JWT 配置 (必需)
JWT_ACCESS_SECRET=your-access-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# Redis 配置 (可选)
REDIS_HOST=localhost
REDIS_PORT=6379
```

::: warning 安全提示
在生产环境中，JWT 密钥必须至少 64 个字符，并且应该使用强随机生成器生成。

```bash
# 生成安全的 JWT 密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

:::

### 4. 数据库设置

#### 使用 Docker (推荐)

```bash
# 启动 PostgreSQL 和 Redis
docker-compose up -d

# 验证服务是否运行
docker ps
```

#### 使用本地数据库

如果您已经有本地 PostgreSQL 实例，更新 `.env` 中的 `DATABASE_URL`。

### 5. 初始化数据库

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 运行数据库迁移
pnpm prisma:migrate

# (可选) 添加种子数据
pnpm prisma:seed
```

### 6. 启动应用

```bash
# 开发模式 (带热重载)
pnpm start:dev

# 生产构建
pnpm build
pnpm start:prod

# 调试模式
pnpm start:debug
```

应用启动后，可以访问：

- 🌐 API 服务: [http://localhost:3000](http://localhost:3000)
- 📚 Swagger 文档: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- 🏥 健康检查: [http://localhost:3000/health](http://localhost:3000/health)

## 项目脚本

常用的 npm 脚本：

| 命令                   | 说明                     |
| ---------------------- | ------------------------ |
| `pnpm start:dev`       | 启动开发服务器 (热重载)  |
| `pnpm start:prod`      | 启动生产服务器           |
| `pnpm build`           | 构建生产版本             |
| `pnpm lint`            | 运行 ESLint 检查         |
| `pnpm format`          | 使用 Prettier 格式化代码 |
| `pnpm test`            | 运行单元测试             |
| `pnpm test:e2e`        | 运行端到端测试           |
| `pnpm prisma:generate` | 生成 Prisma Client       |
| `pnpm prisma:migrate`  | 运行数据库迁移           |
| `pnpm prisma:studio`   | 打开 Prisma Studio       |

## 验证安装

运行以下命令验证安装是否成功：

```bash
# 检查应用健康状态
curl http://localhost:3000/health

# 应该返回
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 10.5,
  "environment": "development",
  "database": {
    "status": "connected"
  },
  "redis": {
    "status": "connected"
  }
}
```

## 下一步

恭喜！您已经成功设置了 ACE NestJS Starter。接下来您可以：

- 📖 阅读[项目架构](./architecture)了解项目结构
- 🔧 查看[配置系统](./configuration)了解配置管理
- 🔒 学习[认证系统](./authentication)实现用户认证
- 🚀 查看[部署指南](./docker)了解如何部署到生产环境

## 常见问题

### pnpm install 失败

如果遇到依赖安装问题：

```bash
# 清理缓存
pnpm store prune

# 删除 node_modules 和锁文件
rm -rf node_modules pnpm-lock.yaml

# 重新安装
pnpm install
```

### 数据库连接失败

检查以下几点：

1. PostgreSQL 服务是否运行
2. DATABASE_URL 是否正确
3. 防火墙是否允许连接

```bash
# 测试数据库连接
psql $DATABASE_URL -c "SELECT 1"
```

### 端口被占用

如果 3000 端口被占用：

```bash
# 查找占用端口的进程
lsof -i :3000

# 或者修改 .env 中的 APP_PORT
APP_PORT=3001
```

## 获取帮助

如果您遇到问题：

1. 查看[故障排除指南](./troubleshooting)
2. 搜索 [GitHub Issues](https://github.com/yourusername/ace-nest-starter/issues)
3. 在 [Discussions](https://github.com/yourusername/ace-nest-starter/discussions) 提问
4. 提交新的 [Issue](https://github.com/yourusername/ace-nest-starter/issues/new)
