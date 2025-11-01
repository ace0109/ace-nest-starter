# ACE NestJS Starter - 需求文档

## 项目概述
打造一个基于 NestJS 的开箱即用、生产级的通用后端 API 脚手架。

**使用场景**: 通用后端 API 开发
**技术栈**: NestJS 11 + TypeScript 5.7 + pnpm

---

## 功能模块清单

### 1. 核心基础模块

#### 1.1 配置管理
- [ ] @nestjs/config 集成
- [ ] 环境变量验证 (class-validator)
- [ ] 多环境配置支持 (.env, .env.development, .env.production)
- [ ] 配置类型安全

#### 1.2 数据库
- [ ] 数据库方案选择 (待讨论: TypeORM vs Prisma)
- [ ] 数据库连接池配置
- [ ] 迁移脚本
- [ ] 种子数据 (Seeder)
- [ ] 事务支持

#### 1.3 日志模块
- [ ] 日志框架选择 (待讨论: Winston vs Pino)
- [ ] 分级日志 (error, warn, info, debug)
- [ ] 请求日志中间件
- [ ] 日志文件分割
- [ ] 生产环境日志配置

---

### 2. 认证授权模块

#### 2.1 JWT 授权
- [ ] Passport-JWT 集成
- [ ] Access Token + Refresh Token 机制
- [ ] Token 过期刷新
- [ ] 登录/登出接口
- [ ] Token 黑名单 (Redis)

#### 2.2 角色权限管理 (RBAC)
- [ ] 用户-角色-权限模型设计
- [ ] 角色装饰器 (@Roles)
- [ ] 权限守卫 (Guard)
- [ ] 预设角色: Admin, User, Guest
- [ ] 动态权限配置

#### 2.3 社交登录
- [ ] OAuth 2.0 通用框架
- [ ] Google OAuth 集成
- [ ] GitHub OAuth 集成
- [ ] 微信登录集成
- [ ] 社交账号绑定/解绑
- [ ] 多平台账号统一

---

### 3. API 功能模块

#### 3.1 Swagger API 文档
- [ ] @nestjs/swagger 集成
- [ ] API 自动文档生成
- [ ] DTO 模型展示
- [ ] JWT 认证集成
- [ ] 多版本 API 文档

#### 3.2 数据验证
- [ ] class-validator 全局验证管道
- [ ] class-transformer 数据转换
- [ ] 自定义验证装饰器
- [ ] 统一错误响应格式

#### 3.3 CORS 跨域配置
- [ ] 开发环境全开放
- [ ] 生产环境白名单配置
- [ ] 预检请求处理
- [ ] 自定义 CORS 选项

---

### 4. 性能与安全模块

#### 4.1 缓存 (Redis)
- [ ] @nestjs/cache-manager 集成
- [ ] Redis 连接配置
- [ ] 缓存装饰器
- [ ] 缓存失效策略
- [ ] 分布式缓存支持

#### 4.2 限流
- [ ] @nestjs/throttler 集成
- [ ] IP 限流
- [ ] 用户限流
- [ ] 自定义限流策略
- [ ] Redis 存储限流记录

#### 4.3 健康检查
- [ ] @nestjs/terminus 集成
- [ ] 数据库健康检查
- [ ] Redis 健康检查
- [ ] 磁盘空间检查
- [ ] 自定义健康检查指标

---

### 5. 业务扩展模块

#### 5.1 邮件服务
- [ ] NodeMailer 集成
- [ ] SMTP 配置
- [ ] 邮件模板引擎 (待讨论: Handlebars vs EJS)
- [ ] 验证码邮件
- [ ] 异步发送队列 (可选)

#### 5.2 文件上传
- [ ] Multer 集成
- [ ] 本地存储支持 ✅ (优先)
- [ ] 文件类型验证
- [ ] 文件大小限制
- [ ] 第三方存储 (待后续讨论: S3/MinIO/OSS)

#### 5.3 国际化 (i18n)
- [ ] nestjs-i18n 集成
- [ ] 多语言文件管理
- [ ] 请求头语言检测
- [ ] 错误消息国际化
- [ ] 默认支持: zh-CN, en-US

#### 5.4 WebSocket (Socket.io)
- [ ] @nestjs/websockets 集成
- [ ] Socket.io 适配器
- [ ] JWT 认证集成
- [ ] 房间管理
- [ ] 广播/私聊消息

#### 5.5 任务调度
- [ ] @nestjs/schedule 集成
- [ ] Cron 定时任务
- [ ] Interval 间隔任务
- [ ] Timeout 延时任务
- [ ] 任务日志记录

---

### 6. 开发运维模块

#### 6.1 Docker 支持
- [ ] Dockerfile (生产环境)
- [ ] Dockerfile.dev (开发环境)
- [ ] docker-compose.yml (完整开发环境)
- [ ] 多阶段构建优化
- [ ] .dockerignore 配置

#### 6.2 E2E 测试配置
- [ ] Jest E2E 测试框架
- [ ] Supertest HTTP 测试
- [ ] 测试数据库配置
- [ ] 测试覆盖率
- [ ] CI 集成

#### 6.3 代码质量
- [ ] ESLint 规则优化
- [ ] Prettier 格式化
- [ ] Husky Git Hooks
- [ ] Lint-staged 预提交检查
- [ ] Commitlint 提交规范

---

## 技术选型待讨论

### 高优先级
1. **数据库 ORM**: TypeORM vs Prisma
2. **日志框架**: Winston vs Pino
3. **邮件模板**: Handlebars vs EJS
4. **队列系统**: 是否需要 Bull/BullMQ

### 低优先级
1. **文件存储扩展**: AWS S3 / 阿里云 OSS / MinIO
2. **监控方案**: Prometheus + Grafana
3. **错误追踪**: Sentry
4. **API 版本控制**: URI vs Header

---

## 非功能性需求

### 性能
- [ ] 响应时间 < 200ms (P95)
- [ ] 支持 1000+ 并发请求
- [ ] 数据库查询优化
- [ ] Redis 缓存命中率 > 80%

### 安全
- [ ] Helmet 安全头
- [ ] CSRF 保护
- [ ] SQL 注入防护
- [ ] XSS 防护
- [ ] 敏感信息脱敏

### 可维护性
- [ ] 清晰的项目结构
- [ ] 完善的代码注释
- [ ] API 文档自动生成
- [ ] 单元测试覆盖率 > 70%
- [ ] 部署文档

---

## 项目结构规划

```
src/
├── common/              # 公共模块
│   ├── decorators/     # 自定义装饰器
│   ├── filters/        # 异常过滤器
│   ├── guards/         # 守卫
│   ├── interceptors/   # 拦截器
│   ├── pipes/          # 管道
│   └── utils/          # 工具函数
├── config/             # 配置模块
├── modules/            # 业务模块
│   ├── auth/          # 认证授权
│   ├── user/          # 用户管理
│   ├── role/          # 角色管理
│   ├── permission/    # 权限管理
│   ├── file/          # 文件上传
│   ├── email/         # 邮件服务
│   ├── websocket/     # WebSocket
│   └── health/        # 健康检查
├── shared/            # 共享模块
│   ├── database/      # 数据库
│   ├── redis/         # 缓存
│   └── logger/        # 日志
└── main.ts            # 入口文件
```

---

## 交付物

- [x] 完整的源代码
- [ ] README.md (安装、配置、使用说明)
- [ ] API 文档 (Swagger)
- [ ] 环境配置示例 (.env.example)
- [ ] Docker 部署文档
- [ ] 开发指南 (CONTRIBUTING.md)
- [ ] 变更日志 (CHANGELOG.md)

---

**文档版本**: v0.1
**创建时间**: 2025-11-01
**最后更新**: 2025-11-01
