# API 文档

## Swagger 文档

ACE NestJS Starter 使用 Swagger (OpenAPI 3.0) 自动生成交互式 API 文档。

### 访问 Swagger UI

启动应用后，访问以下地址查看 API 文档：

- **开发环境**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **生产环境**: `https://your-domain.com/api-docs` (建议在生产环境禁用或添加认证保护)

### Swagger UI 功能

- 📋 **API 列表**: 查看所有可用的 API 端点
- 🔍 **API 详情**: 查看请求/响应格式、参数说明
- 🧪 **在线测试**: 直接在浏览器中测试 API
- 🔐 **认证测试**: 使用 Bearer Token 测试需要认证的 API
- 📥 **导出规范**: 下载 OpenAPI 规范文件

## API 端点概览

### 认证相关 `/api/auth`

| 方法 | 端点             | 描述             | 认证 |
| ---- | ---------------- | ---------------- | ---- |
| POST | `/auth/register` | 用户注册         | ❌   |
| POST | `/auth/login`    | 用户登录         | ❌   |
| POST | `/auth/refresh`  | 刷新令牌         | ✅   |
| POST | `/auth/logout`   | 用户登出         | ✅   |
| GET  | `/auth/profile`  | 获取当前用户信息 | ✅   |

### 用户管理 `/api/users`

| 方法   | 端点                  | 描述         | 认证 | 权限       |
| ------ | --------------------- | ------------ | ---- | ---------- |
| GET    | `/users`              | 获取用户列表 | ✅   | Admin      |
| GET    | `/users/:id`          | 获取用户详情 | ✅   | Admin/Self |
| PUT    | `/users/:id`          | 更新用户信息 | ✅   | Admin/Self |
| DELETE | `/users/:id`          | 删除用户     | ✅   | Admin      |
| PATCH  | `/users/:id/password` | 修改密码     | ✅   | Self       |

### 健康检查 `/api/health`

| 方法 | 端点               | 描述           | 认证 |
| ---- | ------------------ | -------------- | ---- |
| GET  | `/health`          | 应用健康状态   | ❌   |
| GET  | `/health/database` | 数据库连接状态 | ❌   |
| GET  | `/health/redis`    | Redis 连接状态 | ❌   |

## 在代码中使用 Swagger 装饰器

### 控制器装饰器

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users') // API 分组
@ApiBearerAuth() // 需要 Bearer Token
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({
    status: 200,
    description: '成功返回用户列表',
    type: [UserDto],
  })
  @ApiResponse({
    status: 401,
    description: '未授权',
  })
  @Get()
  async findAll() {
    // ...
  }
}
```

### DTO 装饰器

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: '用户邮箱',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '用户密码',
    minimum: 8,
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: '用户昵称',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  nickname?: string;
}
```

### 高级用法

#### 文件上传

```typescript
@ApiOperation({ summary: '上传头像' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@UseInterceptors(FileInterceptor('file'))
@Post('avatar')
async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

#### 分页响应

```typescript
@ApiOperation({ summary: '获取用户列表（分页）' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiResponse({
  schema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserDto' },
      },
      meta: {
        type: 'object',
        properties: {
          total: { type: 'number' },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
  },
})
@Get()
async findAll(@Query() query: PaginationDto) {
  // ...
}
```

## OpenAPI 规范导出

### 获取 OpenAPI JSON

访问：`http://localhost:3000/api-docs-json`

### 导出为文件

```bash
# 导出 OpenAPI 规范
curl http://localhost:3000/api-docs-json > openapi.json

# 使用 OpenAPI Generator 生成客户端代码
npx @openapitools/openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-axios \
  -o ./generated-client
```

## 配置 Swagger

在 `main.ts` 中配置 Swagger：

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('ACE NestJS Starter API')
    .setDescription('生产级 NestJS API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', '认证相关')
    .addTag('users', '用户管理')
    .addTag('health', '健康检查')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 保持认证状态
      tagsSorter: 'alpha', // 标签排序
      operationsSorter: 'alpha', // 操作排序
    },
  });

  await app.listen(3000);
}
```

## 环境控制

在生产环境中控制 Swagger 访问：

```typescript
// 只在开发环境启用 Swagger
if (process.env.NODE_ENV !== 'production') {
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}

// 或者在生产环境添加认证
if (process.env.NODE_ENV === 'production') {
  app.use(
    '/api-docs',
    basicAuth({
      users: { admin: process.env.SWAGGER_PASSWORD },
      challenge: true,
    }),
  );
}
```

## 测试 API

### 使用 Swagger UI

1. 打开 Swagger UI
2. 点击 "Authorize" 按钮
3. 输入 Bearer Token
4. 选择要测试的 API
5. 点击 "Try it out"
6. 填写参数
7. 点击 "Execute"

### 使用 cURL

```bash
# 登录获取 token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 使用 token 访问受保护的 API
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 使用 Postman

1. 导入 OpenAPI 规范文件
2. 设置环境变量（base_url, token）
3. 配置认证（Bearer Token）
4. 发送请求

## API 版本控制

### URL 版本控制

```typescript
// v1 版本
@Controller('api/v1/users')
export class UsersV1Controller {}

// v2 版本
@Controller('api/v2/users')
export class UsersV2Controller {}
```

### Header 版本控制

```typescript
@Controller({
  path: 'users',
  version: '1', // 需要在 main.ts 启用版本控制
})
export class UsersController {}
```

在 `main.ts` 启用：

```typescript
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
});
```

## 最佳实践

### 1. 完整的文档注释

为每个 API 提供：

- 清晰的描述
- 请求示例
- 响应示例
- 错误码说明

### 2. 使用 DTO 验证

- 定义清晰的 DTO
- 使用 class-validator 装饰器
- 提供示例值

### 3. 错误响应文档化

```typescript
@ApiResponse({ status: 400, description: '请求参数错误' })
@ApiResponse({ status: 401, description: '未授权' })
@ApiResponse({ status: 404, description: '资源不存在' })
@ApiResponse({ status: 500, description: '服务器错误' })
```

### 4. 分组和标签

- 使用 `@ApiTags()` 合理分组
- 保持命名一致性
- 按功能模块组织

### 5. 安全考虑

- 生产环境考虑禁用或保护 Swagger
- 不要在文档中暴露敏感信息
- 使用环境变量控制访问
