# API 认证方式

## JWT Bearer Token

### 请求头

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## API Key

### 请求头

```http
X-API-Key: your-api-key-here
```

## OAuth 2.0

支持第三方OAuth认证：

- Google
- GitHub
- 微信

## 刷新令牌

```json
POST /auth/refresh
{
  "refreshToken": "..."
}
```

## 最佳实践

1. 使用HTTPS
2. 令牌过期时间
3. 刷新机制
4. 撤销策略
