# ACE NestJS Starter - 开发计划

> 基于需求讨论的开发路线图和任务分解

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

#### 1.4 统一异常处理 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 定义统一响应格式
  - 成功: `{ success, code, message, data, timestamp, traceId, extend? }`
  - 失败: `{ success, code, message, statusCode, timestamp, traceId, path, errors? }`
- [ ] 设计业务错误码 (混合方式: HTTP + 业务码)
- [ ] 创建异常类层级
  - `BusinessException` 基类
  - 具体业务异常类
- [ ] 实现全局异常过滤器
  - HTTP异常处理
  - 数据库异常处理
  - 系统异常处理

**验收标准**:
- 所有异常返回统一格式
- 错误信息准确清晰
- 包含 traceId 便于追踪

---

#### 1.5 统一响应拦截器 ⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 创建 TraceID 中间件 (UUID)
- [ ] 实现响应转换拦截器
- [ ] 集成 TraceID 到响应体

**验收标准**:
- 所有成功响应格式统一
- 响应包含 traceId
- 支持可选扩展字段

---

### 阶段交付物
- ✅ 配置管理系统
- ✅ 完善的日志系统
- ✅ 数据库基础设施 (Prisma + PostgreSQL)
- ⏳ 统一的错误处理
- ⏳ 统一的响应格式

---

## 第二阶段：认证授权体系 (4个任务)

> **目标**: 实现完整的用户认证和权限管理
> **预计耗时**: 4-5天

### 任务清单

#### 2.1 用户模块基础 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 创建 User Entity (软删除)
- [ ] 实现用户 CRUD
- [ ] 密码加密 (bcrypt)
- [ ] 用户注册接口
- [ ] 邮箱验证 (可选)

---

#### 2.2 JWT 认证模块 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 安装依赖: `@nestjs/passport`, `@nestjs/jwt`, `passport-jwt`
- [ ] 配置 JWT (Access + Refresh Token)
- [ ] 实现登录接口
- [ ] 实现刷新令牌接口
- [ ] 实现登出接口 (Token黑名单)
- [ ] 创建 JWT 守卫

---

#### 2.3 角色权限模块 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 创建 Role Entity
- [ ] 创建 Permission Entity
- [ ] 建立关系: User-Role-Permission
- [ ] 初始化预设角色和权限
- [ ] 实现角色管理 CRUD
- [ ] 实现权限管理 CRUD

---

#### 2.4 权限守卫和装饰器 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 创建 `@Roles()` 装饰器
- [ ] 创建 `@Permission()` 装饰器
- [ ] 创建 `@Resource()` 装饰器 (资源所有权)
- [ ] 实现 RolesGuard
- [ ] 实现 PermissionGuard
- [ ] 实现 ResourceGuard

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

#### 3.1 Swagger 文档集成 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 安装 `@nestjs/swagger`
- [ ] 配置 Swagger
- [ ] 添加 JWT 认证支持
- [ ] 为所有 DTO 添加装饰器
- [ ] 添加请求/响应示例
- [ ] 整理错误码文档

---

#### 3.2 全局数据验证管道 ⭐⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 配置全局 ValidationPipe
- [ ] 创建常用验证 DTO
- [ ] 自定义验证装饰器
- [ ] 验证错误国际化 (可选)

---

#### 3.3 CORS 跨域配置 ⭐⭐
**优先级**: P0 (必须)

**实现内容**:
- [ ] 开发环境全开放
- [ ] 生产环境白名单配置
- [ ] 通过环境变量配置

---

## 第四阶段：性能与安全 (4个任务)

> **目标**: 提升性能和安全性
> **预计耗时**: 3天

### 任务清单

#### 4.1 Redis 缓存模块 ⭐⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 安装 Redis 相关依赖
- [ ] 配置 Redis 连接
- [ ] Token 黑名单实现
- [ ] 验证码存储实现
- [ ] 缓存装饰器 (可选)

---

#### 4.2 限流模块 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 安装 `@nestjs/throttler`
- [ ] 配置全局限流
- [ ] Redis 存储限流记录
- [ ] 自定义限流装饰器

---

#### 4.3 健康检查模块 ⭐⭐
**优先级**: P1 (重要)

**实现内容**:
- [ ] 安装 `@nestjs/terminus`
- [ ] 数据库健康检查
- [ ] Redis 健康检查
- [ ] 磁盘和内存检查
- [ ] 创建 `/health` 端点

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
