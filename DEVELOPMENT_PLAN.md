# ACE NestJS Starter - 开发计划

> 基于需求讨论的开发路线图和任务分解

**Current Status**: Phase 4.1 (Redis Cache Module) completed ✅

---

## 🎯 项目目标

打造一个**开箱即用**、**生产就绪**、**最佳实践**的 NestJS 脚手架

**核心价值**:
- ⚡ 开箱即用 - 5分钟启动项目
- 🛡️ 生产就绪 - 完善的安全、性能、监控
- 📚 最佳实践 - 规范的代码结构、清晰的文档
- 🔧 易于扩展 - 模块化设计、灵活配置

---

## 📅 开发阶段 (共7个阶段，36个任务)

### ✅ 需求讨论阶段 (已完成)

**交付物**:
- [x] REQUIREMENTS.md - 功能清单
- [x] REQUIREMENTS_DETAIL.md - 详细需求规格说明
- [x] DEVELOPMENT_PLAN.md - 本文档

**技术选型确认**:
- ✅ 日志: Pino
- ✅ 邮件模板: Handlebars
- ✅ Token策略: Access + Refresh
- ✅ 权限模型: 资源级RBAC
- ✅ 提交规范: Conventional Commits
- ✅ 数据库: PostgreSQL
- ✅ ORM: Prisma 6.18.0

---

## 第一阶段：项目基础设施 (5个任务)

> **目标**: 搭建项目骨架，建立开发规范
> **预计耗时**: 3-4天

### 任务清单

#### 1.1 配置管理模块 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**实现内容**:
- [x] 安装依赖: `@nestjs/config`, `zod` (使用 Zod 替代 Joi)
- [x] 创建配置文件结构 (按模块分离)
  - `src/config/configuration.ts` (所有配置模块)
  - `src/config/env.validation.ts` (环境变量验证)
  - `src/config/index.ts` (统一导出)
- [x] 实现环境变量验证 (Zod Schema)
- [x] 分环境验证策略 (dev宽松, prod严格)
- [x] 创建 `.env.example` 模板

**已实现功能**:
- ✅ App 配置 (端口、环境、CORS)
- ✅ 数据库配置 (DATABASE_URL)
- ✅ JWT 配置 (Access + Refresh Token)
- ✅ Redis 配置 (主机、端口、密码、DB)
- ✅ SMTP 邮件配置 (可选)
- ✅ 日志配置 (日志级别)
- ✅ OAuth 配置 (Google, GitHub, 微信)
- ✅ Zod 类型安全验证
- ✅ 生产环境增强验证 (64位密钥)
- ✅ 完善的错误提示

**验证步骤**:
1. 检查配置文件是否存在:
   ```bash
   ls -la src/config/
   # 应该看到: configuration.ts, env.validation.ts, index.ts
   ```

2. 测试环境变量验证 (缺失必填字段):
   ```bash
   # 删除或重命名 .env 文件
   mv .env .env.backup

   # 启动项目
   pnpm start:dev

   # 预期: 应该显示验证错误提示，指出缺失的必填字段
   ```

3. 测试开发环境默认值:
   ```bash
   # 创建一个最小的 .env 文件
   echo "NODE_ENV=development" > .env

   # 启动项目
   pnpm start:dev

   # 预期: 应该显示警告但使用默认值继续启动
   ```

4. 测试配置加载:
   ```bash
   # 恢复 .env 文件
   mv .env.backup .env

   # 启动项目
   pnpm start:dev

   # 预期: 项目正常启动，在 http://localhost:3000
   # 访问: http://localhost:3000
   # 应该看到: Hello World!
   ```

5. 检查 Swagger 文档中的配置类型:
   ```bash
   # 启动后访问 (如果已配置 Swagger)
   # http://localhost:3000/api
   ```

**文件清单**:
- `src/config/configuration.ts` (152行)
- `src/config/env.validation.ts` (182行)
- `src/config/index.ts` (6行)
- `.env.example` (52行)

**验收标准**:
- ✅ 能正确加载不同环境配置
- ✅ 缺少必填配置时生产环境启动失败
- ✅ 开发环境缺少配置时显示警告并使用默认值

---

#### 1.2 日志模块 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**技术选型**: Pino (已确认)

**实现内容**:
- [x] 安装依赖: `nestjs-pino@4.4.1`, `pino-http@10.5.0`, `pino-pretty@13.1.2`
- [x] 配置日志格式 (开发彩色，生产JSON)
- [x] 创建请求日志配置 (`src/common/logger/logger.config.ts`)
- [x] 实现敏感信息脱敏 (headers: authorization, cookie, x-api-key)
- [x] 添加 TraceID 支持 (req.id)
- [x] 集成到 AppModule

**已实现功能**:
- ✅ 开发环境彩色输出 (pino-pretty)
- ✅ 生产环境 JSON 格式
- ✅ 自定义日志级别 (根据状态码: 5xx=error, 4xx=warn, 其他=info)
- ✅ 自定义日志消息格式
- ✅ 请求序列化 (id, method, url, query, params, headers, IP, port)
- ✅ 响应序列化 (statusCode)
- ✅ 敏感信息脱敏 (authorization, cookie, x-api-key)
- ✅ TraceID 自动注入
- ✅ 生产环境额外 redact 配置 (password 字段)
- ✅ 严格类型安全 (无 any 类型)

**验证步骤**:
1. 启动开发服务器:
   ```bash
   pnpm start:dev
   ```
   预期: 看到彩色格式的启动日志

2. 访问接口测试日志输出:
   ```bash
   curl http://localhost:3000
   ```
   预期: 控制台显示彩色的请求日志，包含:
   - traceId (自动生成的 UUID)
   - 请求方法和 URL
   - 状态码
   - 响应时间

3. 测试敏感信息脱敏:
   ```bash
   curl -H "Authorization: Bearer token123" \
        -H "Cookie: session=abc123" \
        http://localhost:3000
   ```
   预期: 日志中 authorization 和 cookie 显示为 `***`

4. 测试日志级别:
   ```bash
   # 访问不存在的路由 (404)
   curl http://localhost:3000/not-found
   ```
   预期: 日志级别为 `warn` (黄色)

5. 检查生产环境配置:
   ```bash
   NODE_ENV=production pnpm build && pnpm start:prod
   ```
   预期: JSON 格式日志输出，无彩色

**文件清单**:
- `src/common/logger/logger.config.ts` (113行)
- `src/common/logger/index.ts` (4行)
- `src/app.module.ts` (更新: 集成 LoggerModule)

**验收标准**:
- ✅ 日志包含完整请求信息
- ✅ 敏感信息已脱敏 (密码、token、cookie等)
- ✅ 每个请求有唯一 traceId
- ✅ 开发环境彩色输出，生产环境 JSON 格式
- ✅ 无 TypeScript any 类型

---

#### 1.3 数据库模块 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**技术选型**: Prisma 6.18.0 + PostgreSQL

**实现内容**:
- [x] 进行 ORM 技术调研和选型 (选择 Prisma)
- [x] 安装数据库相关依赖
- [x] 配置数据库连接
- [x] 实现迁移脚本机制
- [x] 创建 Seeder 种子数据
  - 默认角色: Admin, User, Guest
  - 默认管理员账号
  - 基础权限配置
- [x] 配置测试数据库
- [x] 添加 Prisma CLI 脚本

**已实现功能**:
- ✅ Prisma ORM 完整配置
- ✅ PostgreSQL 数据库连接
- ✅ 完整的 RBAC 数据模型 (User, Role, Permission + 关联表)
- ✅ UUID 主键 + 软删除支持
- ✅ 数据库迁移系统
- ✅ 生产级 Seed 数据 (3 角色 + 13 权限 + 2 测试用户)
- ✅ PrismaService 封装 (生命周期管理、日志记录)
- ✅ 全局模块配置
- ✅ 测试环境数据库清理工具
- ✅ Prisma CLI 脚本 (generate, migrate, seed, studio, reset)
- ✅ 类型安全 (无 any 类型)

**验证步骤**:

1. 生成 Prisma Client:
   ```bash
   pnpm prisma:generate
   ```
   预期: 看到 `✔ Generated Prisma Client`

2. 检查迁移状态:
   ```bash
   pnpm prisma migrate status
   ```
   预期: `Database schema is up to date!`

3. 使用 Prisma Studio 查看数据:
   ```bash
   pnpm prisma:studio
   ```
   预期: 浏览器打开 http://localhost:5555
   - `users` 表: 2 条记录 (admin, testuser)
   - `roles` 表: 3 条记录 (admin, user, guest)
   - `permissions` 表: 13 条记录
   - 按 Ctrl+C 关闭 Studio

4. 测试应用启动:
   ```bash
   pnpm start:dev
   ```
   预期输出:
   - `Found 0 errors` - TypeScript 编译成功
   - `✅ Database connected successfully` - 数据库连接成功
   - `Application is running!`

5. 测试 API (新终端):
   ```bash
   curl http://localhost:3000
   ```
   预期: 返回欢迎消息

6. 查看数据库日志输出:
   - 应该能看到 `prisma:info Starting a postgresql pool with 29 connections.`

**测试账号**:
- 管理员: `admin@example.com` / `admin123456`
- 普通用户: `user@example.com` / `user123456`

**文件清单**:
- `prisma/schema.prisma` (118行) - 数据库模型定义
- `prisma/seed.ts` (312行) - 种子数据脚本
- `prisma/migrations/20251101112223_init/migration.sql` (112行) - 初始迁移
- `prisma/migrations/migration_lock.toml` - 迁移锁文件
- `src/common/prisma/prisma.service.ts` (78行) - Prisma 服务
- `src/common/prisma/prisma.module.ts` (13行) - Prisma 模块
- `src/common/prisma/index.ts` (4行) - 导出
- `package.json` (更新: 添加 Prisma CLI 脚本)
- `.env.example` (更新: 添加测试数据库说明)
- `src/app.module.ts` (更新: 集成 PrismaModule)

**验收标准**:
- ✅ 数据库连接成功
- ✅ 迁移脚本可正常运行
- ✅ Seeder 可初始化基础数据
- ✅ TypeScript 编译 0 错误
- ✅ 应用正常启动

---

#### 1.4 统一异常处理 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**实现内容**:
- [x] 定义统一响应格式
  - 成功: `{ success, code, message, data, timestamp, traceId, extend? }`
  - 失败: `{ success, code, message, statusCode, timestamp, traceId, path, errors? }`
- [x] 设计业务错误码 (混合方式: HTTP + 业务码)
- [x] 创建异常类层级
  - `BusinessException` 基类
  - 具体业务异常类
- [x] 实现全局异常过滤器
  - HTTP异常处理
  - 数据库异常处理
  - 系统异常处理

**已实现功能**:
- ✅ 错误代码常量定义 (5大类: 系统/认证/用户/业务/第三方)
- ✅ BusinessException 业务异常类 (带静态工厂方法)
- ✅ 全局异常过滤器 (GlobalExceptionFilter)
- ✅ 统一响应格式拦截器 (ResponseTransformInterceptor)
- ✅ 分页响应格式支持
- ✅ Prisma 数据库错误友好提示
- ✅ 错误日志分级记录 (error/warn/info)
- ✅ 开发环境包含堆栈信息
- ✅ 测试端点验证各类异常
- ✅ 单元测试覆盖

**验证步骤**:

1. 启动应用:
   ```bash
   pnpm start:dev
   ```

2. 测试成功响应:
   ```bash
   # 标准成功响应
   curl http://localhost:3000/test/success
   ```
   预期响应格式:
   ```json
   {
     "success": true,
     "code": 200,
     "message": "Success",
     "data": {...},
     "timestamp": 1234567890,
     "traceId": "xxx"
   }
   ```

3. 测试业务异常:
   ```bash
   # 资源未找到
   curl http://localhost:3000/test/business-error

   # 验证错误
   curl http://localhost:3000/test/validation-error

   # 未授权
   curl http://localhost:3000/test/unauthorized

   # 禁止访问
   curl http://localhost:3000/test/forbidden

   # 重复资源
   curl http://localhost:3000/test/duplicate
   ```
   预期: 每个请求返回对应的错误代码和消息

4. 测试 NestJS 验证管道错误:
   ```bash
   # 传入非数字参数
   curl http://localhost:3000/test/nest-error/abc
   ```
   预期: 返回验证错误 (code: 40000)

5. 测试系统错误:
   ```bash
   curl http://localhost:3000/test/system-error
   curl http://localhost:3000/test/unhandled-error
   ```
   预期: 返回系统错误 (code: 10000)，开发环境显示堆栈

6. 运行单元测试:
   ```bash
   pnpm test src/common/exceptions/business.exception.spec.ts
   ```
   预期: 所有测试通过

**文件清单**:
- `src/common/constants/error-codes.ts` (234行) - 错误代码和消息定义
- `src/common/exceptions/business.exception.ts` (177行) - 业务异常类
- `src/common/exceptions/business.exception.spec.ts` (156行) - 单元测试
- `src/common/filters/global-exception.filter.ts` (241行) - 全局异常过滤器
- `src/common/interceptors/response-transform.interceptor.ts` (113行) - 响应转换拦截器
- `src/common/index.ts` (11行) - 导出文件
- `src/main.ts` (更新: 注册全局过滤器和拦截器)
- `src/app.controller.ts` (更新: 添加测试端点)

**验收标准**:
- ✅ 所有异常返回统一格式
- ✅ 错误信息准确清晰
- ✅ 包含 traceId 便于追踪
- ✅ TypeScript 编译 0 错误
- ✅ 单元测试全部通过

---

#### 1.5 统一响应拦截器 ⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**实现内容**:
- [x] 创建 TraceID 中间件 (UUID)
- [x] 实现响应转换拦截器
- [x] 集成 TraceID 到响应体

**已实现功能**:
- ✅ TraceID 中间件 (支持分布式追踪)
- ✅ 响应转换拦截器 (ResponseTransformInterceptor)
- ✅ 统一成功响应格式
- ✅ 分页响应支持
- ✅ TraceID 从请求头获取 (X-Trace-Id/X-Request-Id)
- ✅ TraceID 添加到响应头
- ✅ 与 Pino logger ID 集成
- ✅ getTraceId 辅助函数

**验证步骤**:

1. 启动应用:
   ```bash
   pnpm start:dev
   ```

2. 测试默认 TraceID 生成:
   ```bash
   curl -I http://localhost:3000/test/success
   ```
   预期: 响应头包含 `X-Trace-Id: <uuid>`

3. 测试自定义 TraceID:
   ```bash
   curl -H "X-Trace-Id: custom-trace-123" -s http://localhost:3000/test/success
   ```
   预期响应:
   ```json
   {
     "success": true,
     "traceId": "custom-trace-123",
     ...
   }
   ```

4. 测试分布式追踪 (X-Request-Id):
   ```bash
   curl -H "X-Request-Id: request-456" -s http://localhost:3000/test/success
   ```
   预期: traceId 使用 "request-456"

5. 测试错误响应中的 TraceID:
   ```bash
   curl -s http://localhost:3000/test/business-error
   ```
   预期: 错误响应也包含 traceId

**文件清单**:
- `src/common/middleware/trace-id.middleware.ts` (59行) - TraceID 中间件
- `src/common/middleware/index.ts` (1行) - 导出文件
- `src/app.module.ts` (更新: 配置中间件)
- `src/common/interceptors/response-transform.interceptor.ts` (更新: 使用 getTraceId)
- `src/common/filters/global-exception.filter.ts` (更新: 使用 getTraceId)

**验收标准**:
- ✅ 所有成功响应格式统一
- ✅ 响应包含 traceId
- ✅ 支持分布式追踪
- ✅ ESLint 0 错误
- ✅ TypeScript 0 错误

---

### 阶段交付物
- ✅ 配置管理系统
- ✅ 完善的日志系统
- ✅ 数据库基础设施 (Prisma + PostgreSQL)
- ✅ 统一的错误处理
- ✅ 统一的响应格式

---

## 第二阶段：认证授权体系 (4个任务)

> **目标**: 实现完整的用户认证和权限管理
> **预计耗时**: 4-5天

### 任务清单

#### 2.1 用户模块基础 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 创建 User Entity (支持软删除)
- ✅ 实现用户 CRUD 操作
- ✅ 密码加密 (bcryptjs)
- ✅ 用户注册接口
- ✅ 数据验证 DTO (创建、更新、修改密码)
- ✅ 分页查询支持

**验证步骤**:
```bash
# 1. 创建新用户
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456",
    "nickname": "Test User",
    "phone": "13800138000"
  }'

# 2. 获取用户列表（分页）
curl -X GET "http://localhost:3000/users?page=1&pageSize=10"

# 3. 获取单个用户详情
curl -X GET "http://localhost:3000/users/{userId}"

# 4. 更新用户信息
curl -X PATCH "http://localhost:3000/users/{userId}" \
  -H "Content-Type: application/json" \
  -d '{"nickname": "Updated Name", "phone": "13900139000"}'

# 5. 软删除用户
curl -X DELETE "http://localhost:3000/users/{userId}"

# 6. 恢复已删除用户
curl -X POST "http://localhost:3000/users/{userId}/restore"
```

**文件清单**:
- `src/modules/users/users.module.ts` (13行)
- `src/modules/users/users.controller.ts` (141行)
- `src/modules/users/users.service.ts` (281行)
- `src/modules/users/dto/create-user.dto.ts` (45行)
- `src/modules/users/dto/update-user.dto.ts` (36行)
- `src/modules/users/dto/change-password.dto.ts` (26行)
- `src/modules/users/dto/index.ts` (3行)
- `src/modules/users/index.ts` (4行)

---

#### 2.2 JWT 认证模块 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 安装依赖: `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`, `passport-local`
- ✅ 配置 JWT (Access + Refresh Token)
- ✅ 实现登录接口 (/auth/login)
- ✅ 实现刷新令牌接口 (/auth/refresh)
- ✅ 实现登出接口 (/auth/logout)
- ✅ 创建 JWT 守卫
- ✅ LocalStrategy 本地认证策略
- ✅ JwtStrategy 访问令牌验证策略
- ✅ RefreshJwtStrategy 刷新令牌验证策略

**验证步骤**:
```bash
# 1. 用户登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123456"}'

# 2. 刷新令牌
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'

# 3. 注册新用户
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "nickname": "Test User"
  }'
```

**文件清单**:
- `src/modules/auth/auth.module.ts` (32行)
- `src/modules/auth/auth.service.ts` (254行)
- `src/modules/auth/auth.controller.ts` (87行)
- `src/modules/auth/strategies/jwt.strategy.ts` (35行)
- `src/modules/auth/strategies/refresh-jwt.strategy.ts` (38行)
- `src/modules/auth/strategies/local.strategy.ts` (20行)
- `src/modules/auth/guards/jwt-auth.guard.ts` (5行)
- `src/modules/auth/guards/local-auth.guard.ts` (5行)
- `src/modules/auth/guards/refresh-jwt-auth.guard.ts` (5行)
- `src/modules/auth/dto/login.dto.ts` (11行)
- `src/modules/auth/dto/register.dto.ts` (35行)
- `src/modules/auth/dto/refresh-token.dto.ts` (7行)

---

#### 2.3 角色权限模块 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 创建 Role Entity (已在数据库模块完成)
- ✅ 创建 Permission Entity (已在数据库模块完成)
- ✅ 建立关系: User-Role-Permission (已在数据库模块完成)
- ✅ 初始化预设角色和权限 (已通过 Seed 完成)
- ✅ 实现角色管理 CRUD
- ✅ 实现权限管理 CRUD
- ✅ 角色分配权限功能
- ✅ 用户分配角色功能

**验证步骤**:
```bash
# 1. 获取角色列表
curl -X GET http://localhost:3000/roles \
  -H "Authorization: Bearer <token>"

# 2. 获取权限列表
curl -X GET http://localhost:3000/permissions \
  -H "Authorization: Bearer <token>"

# 3. 创建新角色
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Editor", "code": "editor", "description": "编辑员"}'

# 4. 分配权限给角色
curl -X POST http://localhost:3000/roles/{roleId}/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionIds": ["permission-uuid-1", "permission-uuid-2"]}'
```

**文件清单**:
- `src/modules/roles/roles.module.ts` (12行)
- `src/modules/roles/roles.service.ts` (312行)
- `src/modules/roles/roles.controller.ts` (116行)
- `src/modules/roles/dto/create-role.dto.ts` (29行)
- `src/modules/roles/dto/update-role.dto.ts` (10行)
- `src/modules/roles/dto/assign-permissions.dto.ts` (7行)
- `src/modules/permissions/permissions.module.ts` (12行)
- `src/modules/permissions/permissions.service.ts` (236行)
- `src/modules/permissions/permissions.controller.ts` (116行)
- `src/modules/permissions/dto/create-permission.dto.ts` (34行)
- `src/modules/permissions/dto/update-permission.dto.ts` (4行)

---

#### 2.4 权限守卫和装饰器 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 创建 `@Roles()` 装饰器
- ✅ 创建 `@Permission()` 装饰器
- ✅ 创建 `@Permissions()` 装饰器 (多个权限)
- ✅ 创建 `@Public()` 装饰器 (公开接口)
- ✅ 创建 `@Resource()` 装饰器 (资源所有权)
- ✅ 创建 `@CurrentUser()` 装饰器 (获取当前用户)
- ✅ 创建 `@CurrentUserId()` 装饰器 (获取用户ID)
- ✅ 实现 JwtAuthGuard (全局JWT认证守卫)
- ✅ 实现 RolesGuard (角色守卫)
- ✅ 实现 PermissionGuard (权限守卫)
- ✅ 实现 ResourceGuard (资源所有权守卫)

**使用示例**:
```typescript
// 公开接口 - 不需要认证
@Public()
@Get('public')
getPublic() {}

// 需要特定角色
@Roles('admin', 'editor')
@Get('admin-only')
getAdminOnly() {}

// 需要特定权限
@Permission('user:create')
@Post('users')
createUser() {}

// 获取当前用户
@Get('profile')
getProfile(@CurrentUser() user: any) {}

// 资源所有权检查
@Resource('post', { ownerField: 'authorId' })
@Delete('posts/:id')
deletePost() {}
```

**文件清单**:
- `src/common/decorators/auth.decorators.ts` (28行)
- `src/common/decorators/user.decorators.ts` (17行)
- `src/common/guards/jwt-auth.guard.ts` (27行)
- `src/common/guards/roles.guard.ts` (44行)
- `src/common/guards/permission.guard.ts` (60行)
- `src/common/guards/resource.guard.ts` (65行)

---

### 阶段交付物
- ✅ 完整的用户系统
- ✅ JWT 认证机制
- ✅ 资源级 RBAC 权限系统
- ✅ 权限装饰器和守卫

---

## 第三阶段：API 文档与数据验证 (3个任务)

> **目标**: 完善 API 文档和数据验证
> **预计耗时**: 2天

### 任务清单

#### 3.1 Swagger 文档集成 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 安装 `@nestjs/swagger` 和 `swagger-ui-express`
- ✅ 配置 Swagger (非生产环境)
- ✅ 添加 JWT Bearer 认证支持
- ✅ 为所有控制器添加 ApiTags
- ✅ 为所有 DTO 添加 ApiProperty 装饰器
- ✅ 添加请求/响应示例
- ✅ 自定义 Swagger UI 选项 (持久化授权、排序等)
- ✅ 启动信息中显示 Swagger 地址

**验证步骤**:
```bash
# 1. 启动开发服务器
pnpm start:dev

# 2. 访问 Swagger UI
# 打开浏览器访问: http://localhost:3000/api

# 3. 测试 JWT 认证
# - 点击 Authorize 按钮
# - 输入 JWT token
# - 测试需要认证的接口

# 4. 查看 API 文档
# - 查看所有端点的详细描述
# - 查看请求/响应格式
# - 查看示例数据
```

**文件清单**:
- `src/main.ts` (更新: 添加 Swagger 配置)
- 所有控制器文件 (更新: 添加 Swagger 装饰器)
- 所有 DTO 文件 (更新: 添加 ApiProperty 装饰器)

---

#### 3.2 全局数据验证管道 ⭐⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 配置全局 ValidationPipe (在 main.ts)
- ✅ 启用 whitelist (自动删除未声明属性)
- ✅ 启用 transform (自动类型转换)
- ✅ 启用 forbidNonWhitelisted (禁止非白名单属性)
- ✅ 配置 transformOptions (启用隐式转换)
- ✅ 所有 DTO 使用 class-validator 装饰器
- ✅ 自定义验证错误消息

**验证步骤**:
```bash
# 1. 测试验证失败情况
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'

# 预期: 返回 400 错误，包含验证错误详情

# 2. 测试额外字段被移除
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123", "extraField": "should-be-removed"}'

# 预期: extraField 被自动移除，不会传递给服务
```

**文件清单**:
- `src/main.ts` (更新: 配置 ValidationPipe)
- 所有 DTO 文件 (已使用 class-validator)

---

#### 3.3 CORS 跨域配置 ⭐⭐ ✅
**优先级**: P0 (必须)
**状态**: 已完成

**已实现功能**:
- ✅ 配置 CORS (在 main.ts)
- ✅ 开发环境全开放 (origin: true)
- ✅ 生产环境白名单配置 (从配置读取 corsOrigins)
- ✅ 通过环境变量配置 CORS_ORIGINS
- ✅ 启用 credentials
- ✅ 配置允许的方法和请求头

**验证步骤**:
```bash
# 1. 测试跨域请求 (开发环境)
# 从不同域发起请求，应该成功

# 2. 检查响应头
curl -I http://localhost:3000/api
# 预期: 看到 CORS 相关响应头

# 3. 测试预检请求
curl -X OPTIONS http://localhost:3000/api \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization"

# 预期: 返回 204 状态码，包含 CORS 响应头
```

**文件清单**:
- `src/main.ts` (更新: 添加 CORS 配置)
- `src/config/configuration.ts` (包含 CORS 配置)
- `.env.example` (包含 CORS_ORIGINS 示例)

### 阶段交付物
- ✅ Swagger API 文档系统
- ✅ JWT Bearer 认证集成
- ✅ 全局数据验证管道
- ✅ CORS 跨域配置
- ✅ 所有 API 端点文档化
- ✅ ESLint 0 错误
- ✅ TypeScript 编译通过

---

## 第四阶段：性能与安全 (4个任务)

> **目标**: 提升性能和安全性
> **预计耗时**: 3天

### 任务清单

#### 4.1 Redis 缓存模块 ⭐⭐⭐ ✅
**优先级**: P1 (重要)
**状态**: 已完成

**实现内容**:
- [x] 安装 Redis 相关依赖
- [x] 配置 Redis 连接
- [x] Token 黑名单实现
- [x] 验证码存储实现
- [x] 缓存装饰器

**已实现功能**:
- ✅ Redis 基础服务 (RedisService)
- ✅ Token 黑名单服务 (BlacklistService)
- ✅ 验证码服务 (CaptchaService) - 支持 email/sms/image 类型
- ✅ 缓存装饰器 (@Cacheable, @CacheEvict, @Cache 等)
- ✅ Redis 健康检查指示器
- ✅ 测试控制器验证所有功能
- ✅ 集成到全局模块

**验证步骤**:
1. 启动应用:
   ```bash
   pnpm start:dev
   ```

2. 测试基础缓存操作:
   ```bash
   # 设置缓存值
   curl -X POST http://localhost:3000/test/redis/set \
     -H "Content-Type: application/json" \
     -d '{"key": "test", "value": "hello", "ttl": 60}'

   # 获取缓存值
   curl http://localhost:3000/test/redis/get/test
   ```

3. 测试Token黑名单:
   ```bash
   # 添加token到黑名单
   curl -X POST http://localhost:3000/test/redis/blacklist/token \
     -H "Content-Type: application/json" \
     -d '{"token": "jwt-token-here", "ttl": 3600}'

   # 检查token是否在黑名单
   curl http://localhost:3000/test/redis/blacklist/token/jwt-token-here
   ```

4. 测试验证码功能:
   ```bash
   # 创建验证码
   curl -X POST http://localhost:3000/test/redis/captcha/create \
     -H "Content-Type: application/json" \
     -d '{"key": "user@example.com", "type": "email"}'

   # 验证验证码
   curl -X POST http://localhost:3000/test/redis/captcha/verify \
     -H "Content-Type: application/json" \
     -d '{"key": "user@example.com", "code": "123456", "type": "email"}'
   ```

5. 测试缓存装饰器:
   ```bash
   # 第一次调用会执行方法并缓存结果
   curl http://localhost:3000/test/redis/cache/test/123

   # 第二次调用会直接返回缓存结果
   curl http://localhost:3000/test/redis/cache/test/123

   # 清除缓存
   curl -X DELETE http://localhost:3000/test/redis/cache/test/123
   ```

**文件清单**:
- `src/common/redis/redis.module.ts` (51行)
- `src/common/redis/redis.service.ts` (199行)
- `src/common/redis/blacklist.service.ts` (135行)
- `src/common/redis/captcha.service.ts` (234行)
- `src/common/redis/redis.health.ts` (96行)
- `src/common/redis/decorators/cache.decorator.ts` (307行)
- `src/common/redis/index.ts` (6行)
- `src/app.redis-test.controller.ts` (213行) - 测试控制器
- `package.json` (更新: 添加 Redis 相关依赖)

**验收标准**:
- ✅ Redis 连接成功
- ✅ Token 黑名单功能正常
- ✅ 验证码功能正常
- ✅ 缓存装饰器功能正常
- ✅ ESLint 0 错误
- ✅ TypeScript 编译通过

---

#### 4.2 限流模块 ⭐⭐ ✅
**优先级**: P1 (重要)
**状态**: 已完成

**实现内容**:
- [x] 安装 `@nestjs/throttler`
- [x] 配置全局限流
- [x] Redis 存储限流记录
- [x] 自定义限流装饰器

**已实现功能**:
- ✅ 安装 @nestjs/throttler 和 @nest-lab/throttler-storage-redis
- ✅ 全局限流配置 (60秒内最多100次)
- ✅ Redis 存储限流记录（支持集群环境）
- ✅ 自定义限流装饰器 (@AuthThrottle, @ApiThrottle, @StrictThrottle)
- ✅ 自定义限流守卫 (基于IP或用户ID)
- ✅ 限流服务（统计、重置功能）
- ✅ 测试控制器验证所有功能
- ✅ 环境变量配置支持

**验证步骤**:
1. 测试默认限流（60秒内最多100次）:
   ```bash
   curl -X GET http://localhost:3000/test/throttler/default
   ```

2. 测试严格限流（60秒内最多3次）:
   ```bash
   # 连续发送4次请求，第4次会被限流
   for i in {1..4}; do
     curl -X POST http://localhost:3000/test/throttler/strict
     echo
   done
   ```

3. 测试认证接口限流（60秒内最多5次）:
   ```bash
   curl -X POST http://localhost:3000/test/throttler/auth
   ```

4. 测试跳过限流:
   ```bash
   curl -X GET http://localhost:3000/test/throttler/skip
   ```

**文件清单**:
- `src/common/throttler/throttler.module.ts` (62行) - 限流模块配置
- `src/common/throttler/throttler.guard.ts` (57行) - 自定义限流守卫
- `src/common/throttler/throttler.decorator.ts` (43行) - 限流装饰器
- `src/common/throttler/throttler.service.ts` (148行) - 限流服务
- `src/common/throttler/index.ts` (4行) - 导出文件
- `src/app.throttler-test.controller.ts` (208行) - 测试控制器
- `src/config/configuration.ts` (更新: 添加 throttlerConfig)
- `.env` (更新: 添加限流配置)
- `.env.example` (更新: 添加限流配置说明)

**验收标准**:
- ✅ 全局限流正常工作
- ✅ 自定义限流装饰器功能正常
- ✅ Redis 存储限流记录成功
- ✅ 限流触发后返回正确错误信息
- ✅ ESLint 0 错误
- ✅ TypeScript 编译通过

---

#### 4.3 健康检查模块 ⭐⭐ ✅
**优先级**: P1 (重要)
**状态**: 已完成

**实现内容**:
- [x] 安装 `@nestjs/terminus`
- [x] 数据库健康检查
- [x] Redis 健康检查
- [x] 磁盘和内存检查
- [x] 创建 `/health` 端点

**已实现功能**:
- ✅ 完整的健康检查控制器 (8个端点)
- ✅ 基础健康检查 `/health/ping` - 快速响应
- ✅ 完整系统检查 `/health` - 所有服务状态
- ✅ 活跃性探针 `/health/live` - Kubernetes liveness
- ✅ 就绪性探针 `/health/ready` - Kubernetes readiness
- ✅ 数据库健康指标 (连接测试、响应时间、诊断信息)
- ✅ Redis健康指标 (PING测试、内存使用、性能指标)
- ✅ 内存健康指标 (系统内存、堆内存、内存泄漏检测)
- ✅ 磁盘健康指标 (空间使用、I/O性能、权限检查)
- ✅ 系统信息端点 `/health/info` - 详细系统状态

**验证步骤**:
1. 测试基础健康检查:
   ```bash
   curl http://localhost:3000/health/ping
   # 返回: {"status":"ok","timestamp":"..."}
   ```

2. 测试完整健康检查:
   ```bash
   curl http://localhost:3000/health
   # 返回所有服务状态 (database, redis, memory, disk)
   ```

3. 测试系统信息:
   ```bash
   curl http://localhost:3000/health/info
   # 返回应用和系统详细信息
   ```

4. 测试数据库健康:
   ```bash
   curl http://localhost:3000/health/database
   ```

5. 测试Redis健康:
   ```bash
   curl http://localhost:3000/health/redis
   ```

**文件清单**:
- `src/common/health/health.module.ts` (29行) - 健康检查模块
- `src/common/health/health.controller.ts` (308行) - 健康检查控制器
- `src/common/health/indicators/prisma.health.ts` (131行) - 数据库健康指标
- `src/common/health/indicators/redis.health.ts` (178行) - Redis健康指标
- `src/common/health/indicators/memory.health.ts` (230行) - 内存健康指标
- `src/common/health/indicators/disk.health.ts` (263行) - 磁盘健康指标
- `src/common/health/index.ts` (6行) - 导出文件
- `src/common/redis/redis.service.ts` (更新: 添加 ping, getInfo, dbSize 方法)

**验收标准**:
- ✅ 所有健康检查端点正常工作
- ✅ 数据库连接检查通过 (2ms响应)
- ✅ Redis连接检查通过 (1ms响应)
- ✅ 内存使用率正常 (30.95%)
- ✅ 磁盘空间充足 (0.80%使用)
- ✅ ESLint 0 错误
- ✅ TypeScript 编译通过

---

#### 4.4 安全增强 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 集成 Helmet
- [ ] 数据脱敏工具
- [ ] CORS 严格配置
- [ ] 安全最佳实践文档

---

## 第五阶段：业务扩展功能 (6个任务)

> **目标**: 实现常用业务功能
> **预计耗时**: 5-6天

### 任务清单

#### 5.1 邮件服务模块 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 安装 `@nestjs-modules/mailer`
- [ ] 配置 SMTP
- [ ] 集成 Handlebars 模板
- [ ] 创建邮件模板 (欢迎、验证、重置密码)
- [ ] 邮件发送队列 (可选)

---

#### 5.2 文件上传模块 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 配置 Multer
- [ ] 单文件上传
- [ ] 多文件上传
- [ ] 文件类型验证
- [ ] 文件大小限制
- [ ] 文件记录到数据库

---

#### 5.3 国际化模块 ⭐
**优先级**: P2 (增强)

**实现内容**:
- [ ] 安装 `nestjs-i18n`
- [ ] 配置语言文件 (zh-CN, zh-TW, en-US)
- [ ] 错误消息国际化
- [ ] 验证消息国际化

---

#### 5.4 WebSocket 模块 ⭐
**优先级**: P2 (增强)

**实现内容**:
- [ ] 安装 `@nestjs/websockets`, `socket.io`
- [ ] 配置 WebSocket Gateway
- [ ] JWT 认证集成
- [ ] 实时通知推送

---

#### 5.5 任务调度模块 ⭐
**优先级**: P2 (增强)

**实现内容**:
- [ ] 安装 `@nestjs/schedule`
- [ ] Cron 定时任务
- [ ] Interval 间隔任务
- [ ] Timeout 延迟任务
- [ ] 动态任务管理

---

#### 5.6 社交登录模块 ⭐
**优先级**: P2 (增强)

**实现内容**:
- [ ] 设计 OAuth 策略模式
- [ ] Google OAuth 集成
- [ ] GitHub OAuth 集成
- [ ] 微信登录集成
- [ ] 账号自动关联 (邮箱匹配)
- [ ] 多平台绑定

---

## 第六阶段：开发运维配置 (3个任务)

> **目标**: 完善开发和部署环境
> **预计耗时**: 2-3天

### 任务清单

#### 6.1 Docker 配置 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 编写 docker-compose.yml
- [ ] 配置服务 (App, PostgreSQL, Redis)
- [ ] 健康检查配置
- [ ] 数据卷配置

---

#### 6.2 E2E 测试完善 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 配置测试数据库
- [ ] 认证流程测试
- [ ] CRUD 操作测试
- [ ] 权限检查测试
- [ ] 关键业务流程测试

---

#### 6.3 代码质量工具 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 安装 Husky
- [ ] 配置 Lint-staged
- [ ] 配置 Commitlint (Conventional Commits)
- [ ] Pre-commit Hook

---

## 第七阶段：文档与交付 (4个任务)

> **目标**: 完善文档，准备交付
> **预计耗时**: 2天

### 任务清单

#### 7.1 编写 README.md ⭐⭐⭐
**优先级**: P0 (必须)

**内容**:
- [ ] 项目介绍
- [ ] 功能特性
- [ ] 快速开始
- [ ] 环境变量说明
- [ ] API 文档链接
- [ ] 技术栈

---

#### 7.2 编写部署文档 ⭐⭐
**优先级**: P1 (重要)

**内容**:
- [ ] Docker 部署指南
- [ ] 传统部署指南
- [ ] 环境配置
- [ ] 数据库迁移
- [ ] Nginx 配置示例

---

#### 7.3 编写开发指南 ⭐⭐
**优先级**: P1 (重要)

**内容**:
- [ ] 项目结构说明
- [ ] 开发规范
- [ ] 如何添加新模块
- [ ] 如何扩展功能
- [ ] 测试指南

---

#### 7.4 创建 .env.example ⭐⭐⭐
**优先级**: P0 (必须)

**内容**:
- [ ] 所有环境变量示例
- [ ] 详细注释说明
- [ ] 必填项标注

---

## 📊 任务统计

| 阶段 | 任务数 | 优先级分布 | 预计耗时 |
|------|--------|-----------|---------|
| 第一阶段 | 5 | P0: 5 | 3-4天 |
| 第二阶段 | 4 | P0: 4 | 4-5天 |
| 第三阶段 | 3 | P0: 3 | 2天 |
| 第四阶段 | 4 | P1: 4 | 3天 |
| 第五阶段 | 6 | P1: 2, P2: 4 | 5-6天 |
| 第六阶段 | 3 | P0: 1, P1: 2 | 2-3天 |
| 第七阶段 | 4 | P0: 2, P1: 2 | 2天 |
| **总计** | **29** | **P0: 15, P1: 10, P2: 4** | **21-25天** |

---

## 🎯 里程碑

### Milestone 1: MVP (最小可行产品)
**完成阶段**: 第1-3阶段
**预计时间**: 9-11天
**交付内容**:
- 完整的配置、日志、数据库基础设施
- JWT 认证和 RBAC 权限系统
- Swagger API 文档
- Docker 部署

### Milestone 2: 生产就绪
**完成阶段**: 第1-4阶段 + 第6阶段
**预计时间**: 14-17天
**交付内容**:
- MVP 所有功能
- Redis 缓存、限流、健康检查
- 安全增强
- E2E 测试
- 代码质量工具

### Milestone 3: 功能完整
**完成阶段**: 所有阶段
**预计时间**: 21-25天
**交付内容**:
- 所有计划功能
- 完整文档
- 可直接使用的脚手架

---

## 📝 开发建议

### 开发顺序
1. **严格按阶段顺序开发** - 每个阶段是下一阶段的基础
2. **完成一个阶段再开始下一个** - 确保每个阶段质量
3. **优先完成 P0 任务** - 保证 MVP 尽快交付

### 质量保证
- ✅ 每个功能完成后编写测试
- ✅ 代码遵循 ESLint 规范
- ✅ 提交遵循 Conventional Commits
- ✅ 重要功能编写文档

### 技术债务
- ⚠️ 避免"先实现后优化"的陷阱
- ⚠️ 不要跳过测试
- ⚠️ 及时记录技术债务

---

## 🚀 开始开发

当前状态: ✅ 阶段 1 - 前 3 个任务已完成 (配置、日志、数据库)
下一步: 开始任务 1.4 (统一异常处理)

~~准备工作~~:
- ✅ ~~确认数据库选型 (PostgreSQL)~~
- ✅ ~~确认 ORM 选型 (Prisma)~~
- ✅ ~~初始化 Git 仓库~~
- ✅ ~~安装基础依赖~~

**已完成**: 配置管理 (1.1) → 日志模块 (1.2) → 数据库模块 (1.3)
**进行中**: 等待用户验证并继续任务 1.4
