# 项目架构

## 总体架构

ACE NestJS Starter 采用模块化、分层的架构设计，遵循 SOLID 原则和领域驱动设计（DDD）的最佳实践。

```
┌─────────────────────────────────────────────────┐
│                   客户端请求                      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              NestJS 应用层                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Guards  │  │  Pipes   │  │ Filters  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              业务逻辑层                          │
│  ┌──────────────────────────────────────┐      │
│  │         Controllers                   │      │
│  └──────────────────────────────────────┘      │
│  ┌──────────────────────────────────────┐      │
│  │          Services                     │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                数据访问层                        │
│  ┌──────────────────────────────────────┐      │
│  │      Prisma ORM / Repositories        │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│               数据存储层                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│  │ PostgreSQL │  │   Redis    │  │   S3     │  │
│  └────────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────┘
```

## 目录结构

```bash
ace-nest-starter/
├── src/                           # 源代码目录
│   ├── config/                    # 配置模块
│   │   ├── configuration.ts      # 配置定义
│   │   ├── env.validation.ts     # 环境变量验证（Zod）
│   │   └── index.ts               # 配置导出
│   │
│   ├── common/                    # 通用功能
│   │   ├── decorators/            # 自定义装饰器
│   │   ├── filters/               # 异常过滤器
│   │   ├── guards/                # 守卫
│   │   ├── interceptors/          # 拦截器
│   │   ├── pipes/                 # 管道
│   │   ├── dto/                   # 通用 DTO
│   │   └── utils/                 # 工具函数
│   │
│   ├── modules/                   # 业务模块
│   │   ├── auth/                  # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/              # 认证 DTO
│   │   │   ├── guards/           # 认证守卫
│   │   │   └── strategies/       # Passport 策略
│   │   │
│   │   ├── users/                 # 用户模块
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/              # 用户 DTO
│   │   │
│   │   ├── database/              # 数据库模块
│   │   │   ├── database.module.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── cache/                 # 缓存模块
│   │   │   ├── cache.module.ts
│   │   │   └── redis.service.ts
│   │   │
│   │   ├── email/                 # 邮件模块
│   │   ├── upload/                # 文件上传模块
│   │   ├── websocket/             # WebSocket 模块
│   │   ├── scheduler/             # 任务调度模块
│   │   └── oauth/                 # OAuth 模块
│   │
│   ├── app.module.ts              # 根模块
│   ├── app.controller.ts          # 根控制器
│   ├── app.service.ts             # 根服务
│   └── main.ts                    # 应用入口
│
├── prisma/                        # Prisma 相关
│   ├── schema.prisma              # 数据模型定义
│   ├── migrations/                # 数据库迁移
│   └── seed.ts                    # 种子数据
│
├── test/                          # 测试文件
│   ├── unit/                      # 单元测试
│   ├── e2e/                       # 端到端测试
│   └── fixtures/                  # 测试数据
│
├── docs/                          # 项目文档
├── scripts/                       # 脚本文件
├── docker/                        # Docker 相关
│
├── .env.example                   # 环境变量示例
├── .eslintrc.js                   # ESLint 配置
├── .prettierrc                    # Prettier 配置
├── nest-cli.json                  # Nest CLI 配置
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 项目依赖
└── docker-compose.yml             # Docker Compose 配置
```

## 核心模块说明

### 配置模块 (Config Module)

使用 Zod 进行类型安全的配置管理：

```typescript
// src/config/configuration.ts
export const configuration = {
  app: registerAs('app', () => ({
    port: env.APP_PORT,
    env: env.NODE_ENV,
    corsOrigins: env.APP_CORS_ORIGINS,
  })),
  database: registerAs('database', () => ({
    url: env.DATABASE_URL,
  })),
  jwt: registerAs('jwt', () => ({
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  })),
  // ... 更多配置
};
```

### 数据库模块 (Database Module)

使用 Prisma ORM 进行数据库操作：

```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

### 认证模块 (Auth Module)

JWT 双令牌认证系统：

- **Access Token**: 短期令牌（15分钟）
- **Refresh Token**: 长期令牌（7天）
- **策略**: Local + JWT 策略
- **守卫**: JwtAuthGuard, RolesGuard

### 通用功能 (Common)

#### 异常过滤器

- `AllExceptionsFilter`: 全局异常处理
- `HttpExceptionFilter`: HTTP 异常处理
- `ValidationExceptionFilter`: 验证异常处理

#### 拦截器

- `LoggingInterceptor`: 请求日志
- `TransformInterceptor`: 响应转换
- `TimeoutInterceptor`: 请求超时

#### 管道

- `ZodValidationPipe`: Zod 模式验证
- `ParseIntPipe`: 整数解析
- `ParseUUIDPipe`: UUID 解析

## 设计模式

### 1. 依赖注入 (Dependency Injection)

NestJS 的核心特性，实现松耦合：

```typescript
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}
}
```

### 2. 装饰器模式 (Decorator Pattern)

自定义装饰器简化代码：

```typescript
@Public() // 跳过认证
@Roles('admin') // 角色检查
@ApiOperation({ summary: '获取用户列表' })
@Get()
async findAll() {
  // ...
}
```

### 3. 策略模式 (Strategy Pattern)

Passport 策略实现多种认证方式：

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JWT 认证策略
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  // Google OAuth 策略
}
```

### 4. 仓储模式 (Repository Pattern)

通过服务层封装数据访问：

```typescript
@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
```

### 5. 单例模式 (Singleton Pattern)

服务默认为单例：

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

## 数据流

典型的请求处理流程：

1. **请求到达** → 中间件处理（日志、CORS、压缩等）
2. **路由匹配** → 找到对应的控制器方法
3. **守卫验证** → 认证守卫、角色守卫
4. **拦截器（前）** → 日志记录、性能监控
5. **管道验证** → DTO 验证、数据转换
6. **控制器处理** → 调用服务层方法
7. **服务层逻辑** → 业务逻辑处理
8. **数据访问** → Prisma ORM 操作数据库
9. **拦截器（后）** → 响应转换、日志记录
10. **异常过滤器** → 错误处理（如果有异常）
11. **响应返回** → 返回给客户端

## 模块间通信

### 同步通信

通过依赖注入直接调用：

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async createOrder(userId: string) {
    const user = await this.usersService.findById(userId);
    // ... 创建订单
    await this.emailService.sendOrderConfirmation(user.email);
  }
}
```

### 异步通信

使用事件发射器：

```typescript
@Injectable()
export class OrdersService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createOrder() {
    // ... 创建订单
    this.eventEmitter.emit('order.created', order);
  }
}

@Injectable()
export class NotificationService {
  @OnEvent('order.created')
  handleOrderCreated(order: Order) {
    // 发送通知
  }
}
```

## 最佳实践

### 1. 关注点分离

- **Controllers**: 处理 HTTP 请求，调用服务
- **Services**: 包含业务逻辑
- **Repositories**: 数据访问逻辑
- **DTOs**: 数据传输对象
- **Entities**: 数据实体

### 2. 模块边界

每个模块应该：

- 高内聚、低耦合
- 有明确的职责
- 通过公共接口通信
- 可独立测试

### 3. 错误处理

- 使用自定义异常类
- 统一错误响应格式
- 适当的 HTTP 状态码
- 详细的错误信息（开发环境）

### 4. 配置管理

- 环境变量验证
- 类型安全的配置
- 敏感信息不提交代码
- 环境特定的配置

### 5. 安全最佳实践

- 输入验证
- SQL 注入防护（Prisma 自动处理）
- XSS 防护
- CSRF 保护
- 速率限制
- 安全头（Helmet）

## 扩展指南

### 添加新模块

1. 创建模块文件夹：`src/modules/your-module/`
2. 创建模块文件：`your-module.module.ts`
3. 创建服务：`your-module.service.ts`
4. 创建控制器：`your-module.controller.ts`
5. 创建 DTO：`dto/create-your-module.dto.ts`
6. 在 `app.module.ts` 中导入

### 添加新的配置

1. 在 `.env.example` 添加新变量
2. 在 `env.validation.ts` 添加 Zod 验证
3. 在 `configuration.ts` 添加配置定义
4. 在服务中注入使用

### 添加新的数据模型

1. 在 `prisma/schema.prisma` 定义模型
2. 运行 `pnpm prisma:generate` 生成客户端
3. 创建迁移：`pnpm prisma:migrate`
4. 在服务中使用新模型
