# 数据库迁移

## Prisma 迁移

### 创建迁移

```bash
pnpm prisma migrate dev --name add_user_table
```

### 应用迁移

```bash
pnpm prisma migrate deploy
```

### 重置数据库

```bash
pnpm prisma migrate reset
```

## 迁移文件

```
prisma/
├── schema.prisma
├── migrations/
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   └── migration_lock.toml
└── seed.ts
```

## 迁移策略

### 开发环境

使用 `migrate dev` 快速迭代。

### 生产环境

1. 在开发环境创建迁移
2. 代码审查
3. 在预发布环境测试
4. 生产环境部署

## 回滚策略

### 创建回滚迁移

```sql
-- Down Migration
DROP TABLE IF EXISTS users;
```

## 最佳实践

1. 小步迁移
2. 备份数据
3. 测试迁移
4. 记录变更
