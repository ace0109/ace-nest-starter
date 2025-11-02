# 配置参考

## 环境变量完整列表

### 应用配置

| 变量         | 说明     | 默认值      | 必需 |
| ------------ | -------- | ----------- | ---- |
| NODE_ENV     | 运行环境 | development | 否   |
| PORT         | 端口     | 3000        | 否   |
| CORS_ORIGINS | CORS源   | \*          | 否   |

### 数据库配置

| 变量         | 说明      | 默认值 | 必需 |
| ------------ | --------- | ------ | ---- |
| DATABASE_URL | 数据库URL | -      | 是   |

### JWT 配置

| 变量               | 说明     | 默认值 | 必需 |
| ------------------ | -------- | ------ | ---- |
| JWT_ACCESS_SECRET  | 访问密钥 | -      | 是   |
| JWT_REFRESH_SECRET | 刷新密钥 | -      | 是   |
| JWT_ACCESS_TTL     | 访问过期 | 15m    | 否   |
| JWT_REFRESH_TTL    | 刷新过期 | 7d     | 否   |

### Redis 配置

| 变量           | 说明 | 默认值    | 必需 |
| -------------- | ---- | --------- | ---- |
| REDIS_HOST     | 主机 | localhost | 否   |
| REDIS_PORT     | 端口 | 6379      | 否   |
| REDIS_PASSWORD | 密码 | -         | 否   |

## 配置文件结构

```
src/config/
├── configuration.ts    # 配置定义
├── env.validation.ts   # 验证模式
└── index.ts           # 导出
```
