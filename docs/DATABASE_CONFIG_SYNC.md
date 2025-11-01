# 📋 数据库配置同步清单

## 🎯 统一的数据库配置

### PostgreSQL 16 Alpine 配置
```
数据库版本: PostgreSQL 16 Alpine
容器名称: ace-postgres-dev
用户名: postgres
密码: postgres123
数据库名: ace_nest_db
端口: 5432
```

### 连接字符串
```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ace_nest_db?schema=public
```

## ✅ 已同步的配置文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `.env` | ✅ 已更新 | 实际使用的环境变量 |
| `.env.example` | ✅ 已更新 | 环境变量示例文件 |
| `docker-compose.dev.yml` | ✅ 已配置 | Docker Compose 配置 |
| `package.json` | ✅ 已添加 | 数据库启动命令 |

## 📁 配置文件位置和内容

### 1. `.env` (主配置)
```bash
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ace_nest_db?schema=public
```

### 2. `.env.example` (示例配置)
```bash
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ace_nest_db?schema=public
# Docker Compose 默认配置:
# - 镜像: postgres:16-alpine
# - 用户名: postgres
# - 密码: postgres123
# - 数据库: ace_nest_db
# - 端口: 5432
```

### 3. `docker-compose.dev.yml`
```yaml
postgres:
  image: postgres:16-alpine
  container_name: ace-postgres-dev
  environment:
    POSTGRES_DB: ace_nest_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres123
  ports:
    - "5432:5432"
```

### 4. `package.json` (数据库命令)
```json
"db:start": "docker run -d --name postgres-dev -e POSTGRES_PASSWORD=postgres123 -e POSTGRES_DB=ace_nest_db -p 5432:5432 postgres:16-alpine || docker start postgres-dev"
```

## 🔄 迁移旧数据库

如果你之前使用的是旧配置，需要执行以下步骤：

### 方法 1: 完全重置（推荐）
```bash
# 1. 停止所有服务
pnpm docker:down

# 2. 清理旧数据
pnpm docker:clean

# 3. 重新初始化
pnpm dev:setup
```

### 方法 2: 保留数据迁移
```bash
# 1. 备份旧数据
pg_dump -h localhost -U postgres -d ace_nest > backup.sql

# 2. 停止旧数据库
docker stop postgres-dev && docker rm postgres-dev

# 3. 启动新数据库
pnpm docker:up

# 4. 恢复数据
psql -h localhost -U postgres -d ace_nest_db < backup.sql
```

## 🧪 验证配置

### 1. 测试数据库连接
```bash
# 使用 Docker 命令
docker exec ace-postgres-dev pg_isready -U postgres

# 或使用 psql
PGPASSWORD=postgres123 psql -h localhost -U postgres -d ace_nest_db -c "SELECT version();"
```

### 2. 检查 Prisma 连接
```bash
# 生成 Prisma Client
pnpm prisma:generate

# 测试迁移
pnpm prisma:migrate status

# 打开 Prisma Studio
pnpm prisma:studio
```

### 3. 测试应用连接
```bash
# 重启应用
pnpm start:dev

# 查看日志，应该看到:
# ✅ Database connected successfully
```

## 🐘 为什么选择 PostgreSQL 16 Alpine？

| 特性 | PostgreSQL 16 | PostgreSQL 15 | 说明 |
|------|--------------|--------------|------|
| **性能** | +10-15% | 基准 | 查询优化器改进 |
| **并行处理** | 增强 | 标准 | 更好的并行查询 |
| **JSON 支持** | 改进 | 标准 | 更快的 JSON 处理 |
| **镜像大小** | 90MB (Alpine) | 380MB (标准) | Alpine 版本更小 |
| **安全性** | 最新补丁 | 稳定 | 包含所有安全更新 |

## 📝 注意事项

1. **密码安全性**
   - 开发环境使用 `postgres123` 没问题
   - 生产环境必须使用强密码
   - 建议使用环境变量管理敏感信息

2. **端口冲突**
   - 如果 5432 端口被占用，修改 docker-compose.yml
   - 同时更新 .env 中的连接字符串

3. **数据持久化**
   - 数据保存在 Docker volume 中
   - `docker-compose down` 不会删除数据
   - `docker-compose down -v` 会删除所有数据

## 🚀 快速命令

```bash
# 查看当前配置
grep DATABASE_URL .env

# 测试连接
docker exec ace-postgres-dev psql -U postgres -d ace_nest_db -c "\l"

# 查看所有表
docker exec ace-postgres-dev psql -U postgres -d ace_nest_db -c "\dt"

# 查看用户
docker exec ace-postgres-dev psql -U postgres -d ace_nest_db -c "SELECT * FROM users;"
```