# GitHub Pages 文档部署配置指南

## ✅ 已完成的配置

1. **GitHub Actions Workflow** - 已创建 `.github/workflows/deploy-docs.yml`
2. **VitePress 配置** - 已更新 base URL 为 `/ace-nest-starter/`
3. **远程仓库** - 已更新为 `https://github.com/ace0109/ace-nest-starter.git`
4. **代码推送** - 所有代码已推送到新仓库

## 📝 需要在 GitHub 上手动配置

### 1. 启用 GitHub Pages

1. 访问你的仓库: https://github.com/ace0109/ace-nest-starter
2. 点击 **Settings** (设置) 标签
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分，选择:
   - Source: **GitHub Actions**
   - 不需要选择分支，因为我们使用 Actions 部署

### 2. 确认 Actions 权限

1. 在仓库的 **Settings** > **Actions** > **General**
2. 向下滚动到 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 勾选 **Allow GitHub Actions to create and approve pull requests**
5. 点击 **Save**

## 🚀 触发部署

文档会在以下情况自动部署：

1. **自动触发**: 当 `main` 分支的 `docs/` 目录有任何更改时
2. **手动触发**:
   - 访问 https://github.com/ace0109/ace-nest-starter/actions
   - 找到 "Deploy VitePress site to Pages" workflow
   - 点击 "Run workflow" 手动触发

## 📍 访问文档站点

配置完成后，你的文档将发布在：

**https://ace0109.github.io/ace-nest-starter/**

首次部署可能需要几分钟时间。

## 🔧 本地测试文档

```bash
# 开发模式 (热重载)
pnpm docs:dev

# 构建文档
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

## 📂 项目结构

```
.github/
└── workflows/
    └── deploy-docs.yml     # GitHub Actions 部署配置

docs/
├── .vitepress/
│   ├── config.mjs         # VitePress 配置文件
│   └── dist/              # 构建输出 (已忽略)
├── api/                   # API 文档
├── guide/                 # 使用指南
├── examples/              # 示例代码
├── reference/             # 参考文档
├── public/               # 静态资源
│   └── logo.svg          # 项目 Logo
└── index.md              # 文档首页
```

## ⚙️ Workflow 配置说明

GitHub Actions workflow 的主要功能：

1. **触发条件**:
   - `docs/**` 目录有变更
   - `package.json` 或 `pnpm-lock.yaml` 有变更
   - 手动触发 (workflow_dispatch)

2. **构建步骤**:
   - 使用 pnpm 9 和 Node.js 20
   - 安装依赖
   - 构建 VitePress 文档
   - 上传构建产物

3. **部署步骤**:
   - 自动部署到 GitHub Pages
   - 使用官方 deploy-pages action

## 🔍 常见问题

### Q: 部署失败怎么办？

1. 检查 Actions 日志: https://github.com/ace0109/ace-nest-starter/actions
2. 确认 Pages 设置正确 (Source 选择 GitHub Actions)
3. 确认 workflow 有正确的权限

### Q: 如何更新文档？

1. 修改 `docs/` 目录下的任何文件
2. 提交并推送到 `main` 分支
3. GitHub Actions 会自动构建和部署

### Q: 如何添加新页面？

1. 在 `docs/` 相应目录创建 `.md` 文件
2. 在 `docs/.vitepress/config.mjs` 更新导航或侧边栏配置
3. 提交更改，自动部署

## 📚 相关链接

- [VitePress 官方文档](https://vitepress.dev/zh/)
- [GitHub Pages 文档](https://docs.github.com/cn/pages)
- [GitHub Actions 文档](https://docs.github.com/cn/actions)
