# 缓存 (Redis)

## 概述

ACE NestJS Starter 集成 Redis 提供高性能缓存解决方案，支持数据缓存、会话存储和分布式锁。

## 核心特性

- **多级缓存**: 内存缓存 + Redis 缓存
- **缓存策略**: TTL、LRU、主动失效
- **分布式缓存**: 支持集群部署
- **缓存预热**: 应用启动时预加载

## Redis 配置

### 连接配置

```typescript
// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get('redis.url'),
        options: {
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
      }),
    }),
  ],
})
export class RedisModule {}
```

## 缓存操作

### 基础操作

```typescript
@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

### 缓存装饰器

```typescript
@Cacheable({ ttl: 3600 })
async getUserById(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
}

@CacheEvict({ keys: ['user:*'] })
async updateUser(id: string, data: UpdateUserDto) {
  return this.prisma.user.update({ where: { id }, data });
}
```

## 高级功能

- 分布式锁
- 发布/订阅
- 事务支持
- Pipeline 批量操作

## 性能优化

1. 使用连接池
2. 批量操作
3. 合理设置 TTL
4. 避免大 key

## 下一步

- [性能优化](./performance.md) - 缓存策略
- [会话管理](./authentication.md) - Redis 会话存储
- [监控](./monitoring.md) - Redis 监控
