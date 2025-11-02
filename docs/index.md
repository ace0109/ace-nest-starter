---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'ACE NestJS Starter'
  text: '生产级 NestJS 脚手架'
  tagline: 为快速 API 开发而设计的企业级 NestJS 启动模板
  image:
    src: /logo.svg
    alt: ACE NestJS Starter
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/yourusername/ace-nest-starter

features:
  - icon: 🚀
    title: 开箱即用
    details: 预配置的生产环境设置，包含日志、错误处理、验证、数据库等核心功能
  - icon: 🔒
    title: 安全优先
    details: 内置 JWT 认证、RBAC 权限控制、速率限制、Helmet 安全头、CORS 配置
  - icon: 🛠️
    title: 现代技术栈
    details: NestJS 11 + TypeScript 5.7 + Prisma ORM + Zod 验证 + Pino 日志
  - icon: 📦
    title: 模块化架构
    details: 清晰的模块划分，关注点分离，易于扩展和维护
  - icon: 🔌
    title: 丰富的集成
    details: Redis 缓存、邮件服务、文件上传、WebSocket、任务调度、OAuth 登录
  - icon: 🐳
    title: Docker 支持
    details: 包含 Dockerfile 和 docker-compose，支持容器化部署
  - icon: 📝
    title: 完整文档
    details: 详细的使用文档、API 参考、最佳实践指南
  - icon: ✅
    title: 测试覆盖
    details: 单元测试、E2E 测试配置，确保代码质量
---

## 快速开始

只需几个简单的步骤即可启动项目：

```bash
# 克隆项目
git clone https://github.com/yourusername/ace-nest-starter.git
cd ace-nest-starter

# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env

# 启动数据库
docker-compose up -d postgres

# 运行数据库迁移
pnpm prisma:migrate

# 启动开发服务器
pnpm start:dev
```

## 为什么选择 ACE NestJS Starter？

### 🎯 专注于业务逻辑

我们已经为您处理了所有基础设施配置，让您可以专注于编写业务逻辑。

### 📈 可扩展性

模块化架构确保您的应用可以随着业务增长而轻松扩展。

### 🔐 企业级安全

遵循 OWASP 安全最佳实践，内置多层安全防护。

### 🌍 生产就绪

从第一天起就为生产环境做好准备，包含监控、日志、错误追踪等功能。

## 技术栈

| 技术       | 版本   | 说明                      |
| ---------- | ------ | ------------------------- |
| NestJS     | 11.x   | 渐进式 Node.js 框架       |
| TypeScript | 5.7+   | JavaScript 的超集         |
| Prisma     | 6.18.0 | 现代 ORM                  |
| PostgreSQL | 15+    | 关系型数据库              |
| Redis      | 7+     | 缓存和会话存储            |
| Zod        | 4.x    | TypeScript 优先的模式验证 |
| Pino       | 10.x   | 超快日志库                |
| Docker     | 20+    | 容器化部署                |

## 项目结构

```
ace-nest-starter/
├── src/
│   ├── config/          # 配置模块（Zod 验证）
│   ├── modules/         # 业务模块
│   │   ├── auth/        # 认证模块
│   │   ├── users/       # 用户模块
│   │   ├── database/    # 数据库模块
│   │   └── ...          # 其他模块
│   ├── common/          # 通用功能
│   ├── app.module.ts    # 根模块
│   └── main.ts          # 应用入口
├── prisma/              # Prisma 配置和迁移
├── test/                # 测试文件
├── docs/                # 项目文档
└── docker-compose.yml   # Docker 配置
```

## 社区

- [GitHub Issues](https://github.com/yourusername/ace-nest-starter/issues) - 报告问题或提出功能请求
- [Discussions](https://github.com/yourusername/ace-nest-starter/discussions) - 提问和讨论
- [Contributing](./guide/contributing) - 了解如何贡献代码

## 许可证

本项目基于 [MIT 许可证](https://github.com/yourusername/ace-nest-starter/blob/main/LICENSE) 开源。
