# API 错误处理

## 错误响应格式

### 验证错误

```json
{
  "statusCode": 400,
  "code": 40001,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 错误代码

- 1xxxx: 系统错误
- 2xxxx: 认证错误
- 3xxxx: 用户错误
- 4xxxx: 业务错误
- 5xxxx: 外部服务错误

## 最佳实践

1. 明确的错误信息
2. 适当的HTTP状态码
3. 详细的错误上下文
4. 国际化支持
