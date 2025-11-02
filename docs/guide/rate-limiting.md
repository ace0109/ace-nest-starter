# 速率限制

## 概述

ACE NestJS Starter 实现了灵活的速率限制机制，防止 API 滥用和 DDoS 攻击。

## 核心特性

- **多种限制策略**: 基于 IP、用户、API Key
- **灵活配置**: 不同端点不同限制
- **分布式支持**: Redis 存储支持集群
- **自定义响应**: 限流时的响应格式

## 基础配置

### Throttler 模块

```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('rateLimit.ttl', 60),
        limit: config.get('rateLimit.limit', 10),
        storage: new ThrottlerStorageRedisService(
          config.get('redis.host'),
          config.get('redis.port'),
        ),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

## 使用方法

### 全局限制

```typescript
// 全局应用：每分钟10个请求
@Injectable()
export class ThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests';
}
```

### 自定义限制

```typescript
@Controller('api')
export class ApiController {
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Get('limited')
  limitedEndpoint() {
    return 'This endpoint is rate limited';
  }

  @SkipThrottle()
  @Get('unlimited')
  unlimitedEndpoint() {
    return 'No rate limit here';
  }
}
```

## 高级策略

### 基于用户的限制

```typescript
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number) {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.ip;

    const key = this.generateKey(context, userId);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }
}
```

### 动态限制

```typescript
@Injectable()
export class DynamicThrottlerGuard extends ThrottlerGuard {
  async getTracker(req: Request): Promise<string> {
    return req.user?.subscription === 'premium'
      ? `premium_${req.user.id}`
      : req.ip;
  }

  async getLimit(req: Request): Promise<number> {
    return req.user?.subscription === 'premium' ? 1000 : 100;
  }
}
```

## 响应头

添加速率限制信息到响应头：

```typescript
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-RateLimit-Limit', '100');
        response.setHeader('X-RateLimit-Remaining', '95');
        response.setHeader('X-RateLimit-Reset', new Date().toISOString());
      }),
    );
  }
}
```

## 最佳实践

1. 根据端点重要性设置不同限制
2. 为认证用户提供更高限额
3. 实现渐进式限制
4. 提供清晰的错误信息
5. 监控限流指标

## 下一步

- [安全最佳实践](./security.md) - 安全配置
- [性能优化](./performance.md) - 性能调优
- [监控](./monitoring.md) - 限流监控
