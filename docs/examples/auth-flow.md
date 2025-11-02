# 用户认证流程示例

## 注册流程

### 1. 用户注册

```typescript
POST /auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

### 2. 邮件验证

发送验证邮件到用户邮箱。

## 登录流程

### 1. 用户登录

```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 2. 获取令牌

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 900
}
```

## 认证请求

### 携带令牌

```http
GET /profile
Authorization: Bearer {accessToken}
```

## 刷新令牌

```typescript
POST /auth/refresh
{
  "refreshToken": "..."
}
```

## 完整流程图

查看文档中的流程图。
