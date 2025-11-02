# 健康检查

## 概述

ACE NestJS Starter 提供了全面的健康检查机制，监控应用及其依赖服务的状态。

## 核心特性

- **多种检查器**: 数据库、Redis、磁盘、内存
- **自定义检查**: 扩展健康检查
- **详细指标**: 响应时间、资源使用
- **Kubernetes 就绪**: 支持 K8s 探针

## 基础配置

### Terminus 模块

```typescript
// src/health/health.module.ts
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

## 健康检查端点

### 基础健康检查

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @HealthCheck()
  liveness() {
    return this.health.check([() => this.db.isHealthy('database')]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
```

## 自定义健康指标

```typescript
@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const isHealthy = await this.checkService();

    const result = this.getStatus(key, isHealthy, {
      responseTime: 23,
      connections: 5,
    });

    if (isHealthy) {
      return result;
    }

    throw new HealthCheckError('Custom check failed', result);
  }

  private async checkService(): Promise<boolean> {
    // 自定义检查逻辑
    return true;
  }
}
```

## 响应格式

### 成功响应

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "disk": {
      "status": "up",
      "used": 45789696,
      "free": 54210304
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### 失败响应

```json
{
  "status": "error",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {
    "redis": {
      "status": "down",
      "message": "Connection refused"
    }
  }
}
```

## Kubernetes 集成

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      livenessProbe:
        httpGet:
          path: /health/live
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

## 监控集成

### Prometheus 指标

```typescript
@Get('metrics')
async getMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: Date.now(),
  };
}
```

## 最佳实践

1. 分离 liveness 和 readiness
2. 设置合理的超时
3. 避免复杂检查
4. 记录失败原因
5. 实现优雅关闭

## 下一步

- [监控](./monitoring.md) - 应用监控
- [Docker 部署](./docker.md) - 容器健康检查
- [性能优化](./performance.md) - 性能监控
