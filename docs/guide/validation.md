# 验证管道

## 概述

ACE NestJS Starter 使用 class-validator 和 class-transformer 提供强大的数据验证功能。

## 核心特性

- **自动验证**: 自动验证请求数据
- **类型转换**: 自动转换数据类型
- **自定义验证**: 支持自定义验证规则
- **错误格式化**: 统一的验证错误响应

## 基础使用

### DTO 定义

```typescript
import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  bio?: string;
}
```

### 全局验证管道

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

## 高级功能

- 条件验证
- 嵌套对象验证
- 数组验证
- 自定义验证装饰器

## 最佳实践

1. 使用 DTO 分离关注点
2. 提供清晰的错误信息
3. 验证所有用户输入
4. 使用白名单模式

## 下一步

- [错误处理](./error-handling.md) - 错误处理策略
- [API 文档](../api/) - Swagger 集成
- [测试策略](./testing.md) - 测试验证逻辑
