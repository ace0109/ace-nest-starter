# 错误处理

## 概述

ACE NestJS Starter 提供了全面的错误处理机制，包括统一的错误响应格式、自定义异常过滤器和错误日志记录。

## 错误响应格式

### 统一错误结构

```json
{
  "success": false,
  "statusCode": 400,
  "code": 40001,
  "message": "Validation failed",
  "timestamp": 1704067200000,
  "path": "/api/users",
  "traceId": "trace-123-456",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 错误代码设计

### 错误代码规范

- `1xxxx` - 系统错误
- `2xxxx` - 认证/授权错误
- `3xxxx` - 用户相关错误
- `4xxxx` - 业务逻辑错误
- `5xxxx` - 第三方服务错误

### 常用错误代码

| 代码  | 描述         | HTTP 状态码 |
| ----- | ------------ | ----------- |
| 10001 | 系统内部错误 | 500         |
| 10002 | 服务不可用   | 503         |
| 20001 | 未认证       | 401         |
| 20002 | 权限不足     | 403         |
| 20003 | 令牌过期     | 401         |
| 30001 | 用户不存在   | 404         |
| 30002 | 用户已存在   | 409         |
| 40001 | 验证失败     | 400         |
| 40002 | 资源不存在   | 404         |
| 50001 | 外部服务错误 | 502         |

## 异常过滤器

### 全局异常过滤器

```typescript
// src/common/filters/http-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, request, status);

    this.logger.error({
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
    status: number,
  ) {
    const message = this.getErrorMessage(exception);
    const code = this.getErrorCode(exception);

    return {
      success: false,
      statusCode: status,
      code,
      message,
      timestamp: Date.now(),
      path: request.url,
      traceId: request['traceId'],
      errors: this.getValidationErrors(exception),
    };
  }
}
```

### 自定义业务异常

```typescript
// src/common/exceptions/business.exception.ts
export class BusinessException extends HttpException {
  constructor(
    message: string,
    code: number,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, code }, statusCode);
  }
}

// 使用示例
throw new BusinessException('余额不足', 40003, HttpStatus.BAD_REQUEST);
```

## 验证错误处理

### DTO 验证

```typescript
// src/common/pipes/validation.pipe.ts
export class CustomValidationPipe extends ValidationPipe {
  createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      const errors = this.flattenValidationErrors(validationErrors);
      return new BadRequestException({
        message: 'Validation failed',
        code: 40001,
        errors,
      });
    };
  }

  private flattenValidationErrors(validationErrors: ValidationError[]) {
    return validationErrors.map((error) => ({
      field: error.property,
      message: Object.values(error.constraints || {}).join(', '),
    }));
  }
}
```

## 错误恢复策略

### 重试机制

```typescript
async callExternalService(data: any) {
  return this.retryWithBackoff(
    () => this.httpService.post('/api/endpoint', data),
    3, // 最大重试次数
    1000, // 初始延迟（毫秒）
  );
}

private async retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.retryWithBackoff(fn, retries - 1, delay * 2);
  }
}
```

### 熔断器模式

```typescript
@Injectable()
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime.getTime() > 60000) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ServiceUnavailableException(
          'Service is temporarily unavailable',
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = new Date();

    if (this.failures >= 5) {
      this.state = 'OPEN';
    }
  }
}
```

## 错误监控

### Sentry 集成

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.Integrations.Http({ tracing: true })],
  tracesSampleRate: 1.0,
});

// 在异常过滤器中
Sentry.captureException(exception);
```

## 最佳实践

1. **明确的错误信息**: 提供清晰的错误描述
2. **适当的状态码**: 使用正确的 HTTP 状态码
3. **错误分类**: 区分系统错误和业务错误
4. **敏感信息**: 不暴露内部实现细节
5. **错误恢复**: 实现适当的错误恢复策略
6. **错误监控**: 记录和追踪错误

## 下一步

- [验证管道](./validation.md) - 数据验证
- [日志系统](./logging.md) - 错误日志记录
- [监控](./monitoring.md) - 错误监控和告警
