# 环境变量参考

## 开发环境变量

```bash
# .env.development
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dev:dev@localhost:5432/ace_dev
JWT_ACCESS_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-refresh
REDIS_HOST=localhost
LOG_LEVEL=debug
```

## 生产环境变量

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db.example.com:5432/ace_prod
JWT_ACCESS_SECRET=very-long-secure-secret-key-minimum-64-characters
JWT_REFRESH_SECRET=another-very-long-secure-secret-key-minimum-64
REDIS_HOST=redis.example.com
REDIS_PASSWORD=redis-password
LOG_LEVEL=info
```

## 测试环境变量

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/ace_test
JWT_ACCESS_SECRET=test-secret
JWT_REFRESH_SECRET=test-refresh
```

## 安全注意事项

1. 不要提交 .env 文件
2. 使用强密钥
3. 定期轮换密钥
4. 使用密钥管理服务
