import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'ACE NestJS Starter',
  description: 'Production-ready NestJS scaffolding for rapid API development',
  lang: 'zh-CN',
  base: '/ace-nest-starter/', // GitHub Pages base path

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:site_name', content: 'ACE NestJS Starter' }],
    ['meta', { name: 'og:title', content: 'ACE NestJS Starter - Production-Ready NestJS Template' }],
    ['meta', { name: 'og:description', content: 'A production-ready, opinionated NestJS scaffolding project designed for rapid backend API development' }],
  ],

  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: true, // Temporarily ignore dead links during development

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ACE NestJS Starter',

    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: 'API 文档', link: '/api/' },
      { text: '示例', link: '/examples/' },
      { text: '开发历程', link: '/journey/' },
      {
        text: '参考',
        items: [
          { text: '配置参考', link: '/reference/configuration' },
          { text: '环境变量', link: '/reference/environment' },
          { text: '错误代码', link: '/reference/error-codes' },
          { text: '更新日志', link: '/reference/changelog' },
        ],
      },
      {
        text: 'v1.0.0',
        items: [
          { text: '更新日志', link: '/reference/changelog' },
          { text: '贡献指南', link: '/guide/contributing' },
        ],
      },
    ],

    sidebar: {
      '/journey/': [
        {
          text: 'AI 协作开发历程',
          items: [
            { text: '项目概述', link: '/journey/' },
            { text: '需求与规划', link: '/journey/requirements' },
            { text: '技术选型', link: '/journey/tech-selection' },
            { text: '开发实录', link: '/journey/development-log' },
            { text: 'AI 协作总结', link: '/journey/ai-collaboration' },
            {
              text: '原始文档',
              collapsed: true,
              items: [
                { text: '需求文档', link: '/journey/documents/REQUIREMENTS' },
                { text: '详细需求', link: '/journey/documents/REQUIREMENTS_DETAIL' },
                { text: '开发计划', link: '/journey/documents/DEVELOPMENT_PLAN' },
                { text: '技术研究', link: '/journey/documents/TECH_RESEARCH_SUMMARY' },
                { text: 'ORM 对比', link: '/journey/documents/TYPEORM_VS_PRISMA_COMPARISON' },
                { text: 'Claude 指导', link: '/journey/documents/CLAUDE' },
              ],
            },
          ],
        },
      ],
      '/guide/': [
        {
          text: '开始',
          collapsed: false,
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '项目架构', link: '/guide/architecture' },
            { text: '配置系统', link: '/guide/configuration' },
            { text: '环境设置', link: '/guide/environment' },
          ],
        },
        {
          text: '核心功能',
          collapsed: false,
          items: [
            { text: '数据库 (Prisma)', link: '/guide/database' },
            { text: '认证 (JWT)', link: '/guide/authentication' },
            { text: '权限控制 (RBAC)', link: '/guide/authorization' },
            { text: '日志系统 (Pino)', link: '/guide/logging' },
            { text: '错误处理', link: '/guide/error-handling' },
            { text: '验证管道', link: '/guide/validation' },
          ],
        },
        {
          text: '高级功能',
          collapsed: false,
          items: [
            { text: '缓存 (Redis)', link: '/guide/caching' },
            { text: '邮件服务', link: '/guide/email' },
            { text: '文件上传', link: '/guide/file-upload' },
            { text: 'WebSocket', link: '/guide/websocket' },
            { text: '任务调度', link: '/guide/scheduling' },
            { text: 'OAuth 社交登录', link: '/guide/oauth' },
            { text: '速率限制', link: '/guide/rate-limiting' },
            { text: '健康检查', link: '/guide/health-check' },
          ],
        },
        {
          text: '部署',
          collapsed: false,
          items: [
            { text: 'Docker 部署', link: '/guide/docker' },
            { text: '生产环境配置', link: '/guide/production' },
            { text: 'CI/CD 设置', link: '/guide/ci-cd' },
            { text: 'GitHub Pages 部署', link: '/guide/github-pages' },
            { text: '监控与日志', link: '/guide/monitoring' },
          ],
        },
        {
          text: '开发工具',
          collapsed: false,
          items: [
            { text: 'Redis Commander', link: '/guide/redis-commander' },
          ],
        },
        {
          text: '最佳实践',
          collapsed: false,
          items: [
            { text: '代码规范', link: '/guide/code-style' },
            { text: '测试策略', link: '/guide/testing' },
            { text: '安全最佳实践', link: '/guide/security' },
            { text: '性能优化', link: '/guide/performance' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: 'Swagger 文档', link: '/api/' },
            { text: 'REST API 约定', link: '/api/conventions' },
            { text: '响应格式', link: '/api/response-format' },
            { text: '错误处理', link: '/api/error-handling' },
            { text: '认证方式', link: '/api/authentication' },
          ],
        },
      ],
      '/examples/': [
        {
          text: '示例教程',
          items: [
            { text: '创建第一个 API', link: '/examples/' },
            { text: 'CRUD 操作', link: '/examples/crud' },
            { text: '用户认证流程', link: '/examples/auth-flow' },
            { text: '文件上传处理', link: '/examples/file-upload' },
            { text: 'WebSocket 聊天室', link: '/examples/websocket-chat' },
            { text: '集成第三方服务', link: '/examples/third-party' },
          ],
        },
      ],
      '/reference/': [
        {
          text: '参考文档',
          items: [
            { text: '配置参考', link: '/reference/configuration' },
            { text: '环境变量', link: '/reference/environment' },
            { text: '错误代码', link: '/reference/error-codes' },
            { text: 'CLI 命令', link: '/reference/cli' },
            { text: '数据库迁移', link: '/reference/migrations' },
            { text: '更新日志', link: '/reference/changelog' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ace0109/ace-nest-starter' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 ACE NestJS Starter',
    },

    editLink: {
      pattern: 'https://github.com/ace0109/ace-nest-starter/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
  },
});