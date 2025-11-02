# 生产环境配置

## 概述

生产环境部署的最佳实践和配置指南。

## 环境配置

### 必需的环境变量

- DATABASE_URL
- JWT_ACCESS_SECRET (64+ 字符)
- JWT_REFRESH_SECRET (64+ 字符)
- Redis 配置
- SMTP 配置

## 性能优化

- 启用集群模式
- 配置负载均衡
- 启用 Gzip 压缩
- 静态资源 CDN

## 安全加固

- HTTPS 强制
- 安全头配置
- 速率限制
- DDoS 防护

## 监控告警

- 日志聚合
- 性能监控
- 错误追踪
- 可用性监控
