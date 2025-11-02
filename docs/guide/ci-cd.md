# CI/CD 设置

## 概述

使用 GitHub Actions 实现持续集成和部署。

## GitHub Actions

### CI 工作流

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## 部署策略

- 蓝绿部署
- 滚动更新
- 金丝雀发布

## 最佳实践

1. 自动化测试
2. 代码质量检查
3. 安全扫描
4. 自动回滚
