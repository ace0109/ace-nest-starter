# ACE NestJS Starter 文档

这是 ACE NestJS Starter 项目的文档站点，使用 VitePress 构建。

## 快速开始

### 开发

```bash
# 启动文档开发服务器
pnpm docs:dev

# 访问 http://localhost:5173
```

### 构建

```bash
# 构建静态文档
pnpm docs:build

# 预览构建结果
pnpm docs:preview
```

## 目录结构

```
docs/
├── .vitepress/
│   └── config.mjs       # VitePress 配置文件
├── public/
│   └── logo.svg         # 站点 Logo
├── guide/               # 指南文档
│   ├── getting-started.md
│   └── architecture.md
├── api/                 # API 文档
│   └── index.md
├── examples/            # 示例教程
├── reference/           # 参考文档
└── index.md            # 首页

```

## 文档编写指南

### Markdown 增强功能

VitePress 支持的 Markdown 增强功能：

- **代码高亮**: 支持多种语言的语法高亮
- **代码组**: 展示多个文件的代码
- **容器**: 提示、警告、危险等容器
- **表格**: GitHub 风格的表格
- **Emoji**: 支持 emoji 表情
- **目录**: 自动生成目录
- **行高亮**: 在代码块中高亮特定行

### 容器示例

```markdown
::: info
这是一个信息提示
:::

::: tip 提示
这是一个提示
:::

::: warning 警告
这是一个警告
:::

::: danger 危险
这是一个危险警告
:::

::: details 点击查看详情
这是折叠的内容
:::
```

### 代码块示例

````markdown
```ts {1,3-4}
// 这行会高亮
const app = await NestFactory.create(AppModule);
// 这两行也会高亮
app.enableCors();
await app.listen(3000);
```
````

## 部署

### 部署到 GitHub Pages

1. 在 `.github/workflows/` 创建 `deploy-docs.yml`:

```yaml
name: Deploy Docs

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm
      - run: pnpm install
      - run: pnpm docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

### 部署到 Vercel

1. 在 Vercel 中导入项目
2. 设置构建命令：
   - Build Command: `pnpm docs:build`
   - Output Directory: `docs/.vitepress/dist`

### 部署到 Netlify

1. 在项目根目录创建 `netlify.toml`:

```toml
[build]
  command = "pnpm docs:build"
  publish = "docs/.vitepress/dist"
```

## 配置说明

主要配置文件：`docs/.vitepress/config.mjs`

### 站点配置

- `title`: 站点标题
- `description`: 站点描述
- `base`: 基础路径（用于子路径部署）
- `lang`: 语言设置

### 主题配置

- `nav`: 顶部导航栏
- `sidebar`: 侧边栏菜单
- `socialLinks`: 社交链接
- `footer`: 页脚信息
- `search`: 搜索配置

## 贡献文档

欢迎贡献文档！请遵循以下步骤：

1. Fork 项目
2. 创建文档分支：`git checkout -b docs/your-feature`
3. 编写或更新文档
4. 提交更改：`git commit -m "docs: 添加 XXX 文档"`
5. 推送分支：`git push origin docs/your-feature`
6. 创建 Pull Request

## 注意事项

- 保持文档简洁明了
- 使用中文编写，专业术语可保留英文
- 代码示例要可运行
- 及时更新文档以匹配代码变化
- 添加必要的图表和示例

## 相关链接

- [VitePress 官方文档](https://vitepress.dev/)
- [Markdown 语法参考](https://www.markdownguide.org/)
- [项目主页](https://github.com/yourusername/ace-nest-starter)
