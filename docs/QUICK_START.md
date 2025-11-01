# 开发环境快速启动

## 🚀 一键启动

```bash
# 方式 1: 使用 Docker Compose (推荐)
pnpm docker:up        # 启动 PostgreSQL + Redis + Redis Commander
pnpm start:dev        # 启动应用

# 方式 2: 开发模式一键启动
pnpm dev:start        # 自动启动所有服务 + 应用

# 方式 3: 单独启动服务
pnpm db:start         # 只启动 PostgreSQL
pnpm redis:start      # 只启动 Redis
```

## 🛑 停止服务

```bash
# 暂停（保留数据）
pnpm docker:stop      # 停止所有Docker服务
pnpm dev:stop         # 停止开发环境

# 完全停止（删除容器）
pnpm docker:down      # 停止并删除容器

# 清理所有（包括数据）
pnpm docker:clean     # ⚠️ 删除所有数据
```

## 📋 常用命令列表

| 命令 | 说明 |
|------|------|
| **开发流程** ||
| `pnpm dev:setup` | 初始化完整环境（首次使用） |
| `pnpm dev:start` | 启动开发环境 |
| `pnpm dev:stop` | 停止开发环境 |
| `pnpm dev:clean` | 清理环境（重置） |
| **Docker 服务** ||
| `pnpm docker:up` | 启动所有服务 |
| `pnpm docker:down` | 停止并删除容器 |
| `pnpm docker:stop` | 暂停服务 |
| `pnpm docker:logs` | 查看服务日志 |
| `pnpm docker:clean` | 清理所有数据 |
| **单独服务** ||
| `pnpm db:start` | 启动 PostgreSQL |
| `pnpm db:stop` | 停止 PostgreSQL |
| `pnpm redis:start` | 启动 Redis |
| `pnpm redis:stop` | 停止 Redis |
| `pnpm redis:cli` | 进入 Redis CLI |
| **数据库工具** ||
| `pnpm prisma:studio` | 数据库 Web UI |
| `pnpm prisma:migrate` | 运行迁移 |
| `pnpm prisma:seed` | 初始化数据 |
| `pnpm prisma:reset` | 重置数据库 |

## 🌐 服务访问地址

- **应用**: http://localhost:3000
- **API 文档**: http://localhost:3000/api
- **Redis Commander**: http://localhost:8081
- **Prisma Studio**: http://localhost:5555 (需运行 `pnpm prisma:studio`)

## 🔧 环境测试

```bash
# 运行环境测试脚本
./scripts/test-env.sh

# 测试 Redis 连接
docker exec ace-redis-dev redis-cli ping

# 测试 PostgreSQL 连接
docker exec ace-postgres-dev pg_isready -U postgres
```

## 📝 注意事项

1. 确保 Docker 已启动
2. 确保端口未被占用（3000, 5432, 6379, 8081）
3. 首次使用运行 `pnpm dev:setup`
4. 生产环境不要使用这些开发配置