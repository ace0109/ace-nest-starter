# 配置系统

## 概述

ACE NestJS Starter 使用基于 Zod 的类型安全配置系统，提供环境变量验证和自动类型推断。

## 核心特性

- **类型安全**: 使用 Zod 进行运行时验证和 TypeScript 类型推断
- **环境感知**: 开发环境宽松验证，生产环境严格验证
- **集中管理**: 所有配置统一在 `src/config/` 目录管理
- **模块化**: 使用 `registerAs` 创建独立的配置命名空间

## 配置结构

```
src/config/
├── configuration.ts    # 配置模块定义
├── env.validation.ts   # Zod 验证模式
└── index.ts           # 统一导出
```

## 配置模块

### 应用配置 (app)

```typescript
// 访问方式
const port = this.configService.get('app.port');
const env = this.configService.get('app.env');
```

**环境变量**:

- `NODE_ENV`: 运行环境 (development/production/test)
- `PORT`: 应用端口 (默认: 3000)
- `CORS_ORIGINS`: CORS 允许的源，逗号分隔

### 数据库配置 (database)

```typescript
const dbUrl = this.configService.get('database.url');
```

**环境变量**:

- `DATABASE_URL`: PostgreSQL 连接字符串 (必需)
  - 格式: `postgresql://user:password@host:port/database`

### JWT 配置 (jwt)

```typescript
const accessSecret = this.configService.get('jwt.accessSecret');
const refreshTtl = this.configService.get('jwt.refreshTtl');
```

**环境变量**:

- `JWT_ACCESS_SECRET`: 访问令牌密钥 (生产环境需64字符)
- `JWT_REFRESH_SECRET`: 刷新令牌密钥 (生产环境需64字符)
- `JWT_ACCESS_TTL`: 访问令牌过期时间 (默认: 15m)
- `JWT_REFRESH_TTL`: 刷新令牌过期时间 (默认: 7d)

### Redis 配置 (redis)

```typescript
const redisHost = this.configService.get('redis.host');
const redisPort = this.configService.get('redis.port');
```

**环境变量**:

- `REDIS_HOST`: Redis 主机 (默认: localhost)
- `REDIS_PORT`: Redis 端口 (默认: 6379)
- `REDIS_PASSWORD`: Redis 密码 (可选)
- `REDIS_DB`: Redis 数据库索引 (默认: 0)
- `REDIS_TTL`: 默认过期时间秒数 (默认: 86400)

### SMTP 配置 (smtp)

```typescript
const smtpHost = this.configService.get('smtp.host');
const smtpUser = this.configService.get('smtp.user');
```

**环境变量**:

- `SMTP_HOST`: SMTP 服务器地址
- `SMTP_PORT`: SMTP 端口 (默认: 587)
- `SMTP_SECURE`: 是否使用 TLS (默认: false)
- `SMTP_USER`: SMTP 用户名
- `SMTP_PASS`: SMTP 密码
- `SMTP_FROM`: 发件人地址

### 日志配置 (log)

```typescript
const logLevel = this.configService.get('log.level');
```

**环境变量**:

- `LOG_LEVEL`: 日志级别 (trace/debug/info/warn/error/fatal)
  - 开发环境默认: debug
  - 生产环境默认: info

## 环境验证策略

### 开发环境

宽松验证模式，缺少配置时显示警告但使用默认值：

```typescript
function validateEnvLoose(config: Record<string, unknown>) {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.warn('配置验证警告:', result.error.issues);
    // 返回带默认值的配置
    return mergeWithDefaults(config);
  }

  return result.data;
}
```

### 生产环境

严格验证模式，缺少必需配置时启动失败：

```typescript
function validateEnvStrict(config: Record<string, unknown>) {
  const result = productionEnvSchema.parse(config);
  // 验证失败会抛出错误，阻止应用启动
  return result;
}
```

## 添加新配置

### 1. 定义环境变量模式

在 `src/config/env.validation.ts` 中添加：

```typescript
export const envSchema = z.object({
  // 现有配置...

  // 新配置
  MY_CONFIG: z.string().optional().default('default_value'),
  MY_NUMBER: z.coerce.number().optional().default(100),
});
```

### 2. 创建配置模块

在 `src/config/configuration.ts` 中添加：

```typescript
export default {
  // 现有模块...

  myFeature: registerAs('myFeature', () => ({
    config: process.env.MY_CONFIG,
    number: parseInt(process.env.MY_NUMBER || '100', 10),
  })),
};
```

### 3. 使用配置

```typescript
@Injectable()
export class MyService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  getMyConfig() {
    return this.configService.get('myFeature.config');
  }
}
```

## 配置文件示例

`.env.development`:

```bash
# 应用
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 数据库
DATABASE_URL=postgresql://dev:devpass@localhost:5432/ace_dev

# JWT (开发环境使用简单密钥)
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 日志
LOG_LEVEL=debug
```

`.env.production`:

```bash
# 应用
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://yourdomain.com

# 数据库
DATABASE_URL=postgresql://prod_user:strong_password@db.example.com:5432/ace_prod

# JWT (生产环境使用强密钥)
JWT_ACCESS_SECRET=your-super-secure-64-character-access-secret-key-here-minimum-length
JWT_REFRESH_SECRET=your-super-secure-64-character-refresh-secret-key-here-minimum-length

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# 日志
LOG_LEVEL=info
```

## 最佳实践

1. **不要提交 `.env` 文件**: 使用 `.env.example` 作为模板
2. **使用强密钥**: 生产环境 JWT 密钥至少 64 字符
3. **环境隔离**: 为不同环境使用不同的配置文件
4. **类型安全**: 始终通过 ConfigService 访问配置
5. **验证优先**: 先定义 Zod 模式，再使用配置
6. **默认值**: 为可选配置提供合理的默认值

## 故障排除

### 应用启动失败

检查生产环境必需的环境变量：

- DATABASE_URL
- JWT_ACCESS_SECRET (64+ 字符)
- JWT_REFRESH_SECRET (64+ 字符)
- SMTP 配置（如果启用邮件功能）

### 配置未生效

1. 检查环境变量是否正确设置
2. 确认 `.env` 文件位于项目根目录
3. 重启应用使配置生效

### 类型错误

确保通过 ConfigService 访问配置：

```typescript
// ❌ 错误
const port = process.env.PORT;

// ✅ 正确
const port = this.configService.get('app.port');
```
