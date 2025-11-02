# CLI 命令参考

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm start:dev

# 调试模式
pnpm start:debug

# 构建项目
pnpm build

# 生产模式
pnpm start:prod
```

## 数据库命令

```bash
# 生成 Prisma Client
pnpm prisma:generate

# 创建迁移
pnpm prisma:migrate

# 推送模式更改
pnpm prisma:push

# 打开 Prisma Studio
pnpm prisma:studio

# 运行种子数据
pnpm prisma:seed

# 重置数据库
pnpm prisma:reset
```

## 测试命令

```bash
# 单元测试
pnpm test

# 监听模式
pnpm test:watch

# 测试覆盖率
pnpm test:cov

# E2E 测试
pnpm test:e2e

# 调试测试
pnpm test:debug
```

## 代码质量

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm type-check
```

## Docker 命令

```bash
# 启动服务
pnpm docker:up

# 停止服务
pnpm docker:down

# 查看日志
pnpm docker:logs

# 清理数据
pnpm docker:clean
```

## 文档命令

```bash
# 开发文档
pnpm docs:dev

# 构建文档
pnpm docs:build

# 预览文档
pnpm docs:preview
```
