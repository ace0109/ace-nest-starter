# 日志系统 (Pino)

## 概述

ACE NestJS Starter 集成了高性能的 Pino 日志库，提供结构化日志、请求追踪和日志管理功能。

## 核心特性

- **高性能**: 极低的性能开销
- **结构化日志**: JSON 格式便于分析
- **请求追踪**: 自动生成 traceId
- **日志级别**: 支持多级别日志
- **日志轮转**: 自动归档和清理

## 配置

### 基础配置

```typescript
// src/app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('log.level'),
          transport:
            config.get('app.env') === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'SYS:standard',
                  },
                }
              : undefined,
        },
      }),
    }),
  ],
})
export class AppModule {}
```

### 日志级别

- `trace` - 最详细的调试信息
- `debug` - 调试信息
- `info` - 一般信息（默认）
- `warn` - 警告信息
- `error` - 错误信息
- `fatal` - 致命错误

## 使用方法

### 基础日志

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: Logger) {}

  async createUser(data: CreateUserDto) {
    this.logger.log('Creating user', { email: data.email });

    try {
      const user = await this.prisma.user.create({ data });
      this.logger.log('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack);
      throw error;
    }
  }
}
```

### 请求日志

自动记录所有 HTTP 请求：

- 请求方法和 URL
- 响应状态码
- 响应时间
- 用户信息
- TraceId

### 自定义日志格式

```typescript
// 添加自定义属性
this.logger.log({
  msg: 'Order processed',
  orderId: order.id,
  amount: order.amount,
  customerId: customer.id,
  metadata: { ... }
});
```

## 日志管理

### 日志轮转

使用 `pino-roll` 实现日志文件轮转：

```typescript
transport: {
  targets: [
    {
      target: 'pino-roll',
      options: {
        frequency: 'daily',
        size: '10M',
        dateFormat: 'YYYY-MM-DD',
      },
    },
  ],
}
```

### 日志聚合

集成 ELK Stack 或其他日志分析平台。

## 最佳实践

1. 使用适当的日志级别
2. 包含上下文信息
3. 避免敏感信息
4. 使用结构化日志
5. 定期清理日志

## 下一步

- [错误处理](./error-handling.md) - 错误处理策略
- [监控](./monitoring.md) - 应用监控
- [性能优化](./performance.md) - 日志性能优化
