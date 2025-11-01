# 🚀 开发环境快速启动指南

## 📦 环境要求

- Docker & Docker Compose
- Node.js 18+
- pnpm

## 🎯 快速启动命令

### 一键启动完整开发环境

```bash
# 初次使用：启动所有服务 + 运行迁移 + 初始化数据
pnpm dev:setup

# 日常开发：启动所有服务 + 应用
pnpm dev:start

# 停止服务（保留数据）
pnpm dev:stop

# 清理所有（删除数据）
pnpm dev:clean
```

## 📋 所有可用命令

### Docker Compose 命令（推荐）

| 命令 | 说明 | 用途 |
|------|------|------|
| `pnpm docker:up` | 启动所有服务（后台） | 启动 PostgreSQL + Redis + Redis Commander |
| `pnpm docker:down` | 停止并删除容器 | 完全停止服务 |
| `pnpm docker:stop` | 停止服务（保留容器） | 临时停止，数据保留 |
| `pnpm docker:logs` | 查看服务日志 | 调试问题 |
| `pnpm docker:clean` | 删除所有（包括数据） | 完全重置环境 |

### 单独服务命令

| 命令 | 说明 |
|------|------|
| `pnpm db:start` | 只启动 PostgreSQL |
| `pnpm db:stop` | 停止 PostgreSQL |
| `pnpm redis:start` | 只启动 Redis |
| `pnpm redis:stop` | 停止 Redis |
| `pnpm redis:cli` | 进入 Redis CLI |

### 开发流程命令

| 命令 | 说明 | 包含操作 |
|------|------|----------|
| `pnpm dev:setup` | 初始化环境 | docker:up → migrate → seed |
| `pnpm dev:start` | 开始开发 | docker:up → start:dev |
| `pnpm dev:stop` | 暂停开发 | docker:stop |
| `pnpm dev:clean` | 重置环境 | docker:clean |

## 🔧 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 应用 | http://localhost:3000 | NestJS 应用 |
| Swagger | http://localhost:3000/api | API 文档 |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |
| Redis Commander | http://localhost:8081 | Redis Web UI |
| Prisma Studio | http://localhost:5555 | 数据库 Web UI |

## 🔑 默认连接信息

### PostgreSQL
```
Host: localhost
Port: 5432
Database: ace_nest_db
Username: postgres
Password: postgres123
```

### Redis
```
Host: localhost
Port: 6379
Password: (无密码)
```

## 📝 常见使用场景

### 场景 1：第一次开始开发

```bash
# 1. 克隆项目
git clone <repository>
cd ace-nest-starter

# 2. 安装依赖
pnpm install

# 3. 复制环境变量
cp .env.example .env

# 4. 初始化完整环境
pnpm dev:setup

# 5. 启动应用
pnpm start:dev
```

### 场景 2：日常开发

```bash
# 早上开始工作
pnpm dev:start

# 晚上结束工作
pnpm dev:stop
```

### 场景 3：重置数据库

```bash
# 方法 1：使用 Prisma
pnpm prisma:reset

# 方法 2：完全重置
pnpm dev:clean
pnpm dev:setup
```

### 场景 4：调试 Redis

```bash
# 进入 Redis CLI
pnpm redis:cli

# 或通过 Web UI
# 访问 http://localhost:8081
```

### 场景 5：查看数据库

```bash
# 使用 Prisma Studio
pnpm prisma:studio

# 访问 http://localhost:5555
```

## 🐛 故障排除

### 问题：端口被占用

```bash
# 检查端口占用
lsof -i :3000  # 应用端口
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# 解决方案
# 1. 停止占用的服务
# 2. 或修改 docker-compose.dev.yml 中的端口映射
```

### 问题：Docker 服务启动失败

```bash
# 清理并重新启动
pnpm dev:clean
docker system prune -f
pnpm dev:setup
```

### 问题：数据库迁移失败

```bash
# 重置数据库
pnpm prisma:reset

# 或手动处理
pnpm docker:down
pnpm docker:up
pnpm prisma:migrate
```

## 🎨 VS Code 推荐插件

- Docker
- Prisma
- Redis
- PostgreSQL
- REST Client

## 📚 相关文档

- [Docker Compose 配置](./docker-compose.dev.yml)
- [环境变量示例](./.env.example)
- [Prisma Schema](./prisma/schema.prisma)
- [开发计划](./DEVELOPMENT_PLAN.md)