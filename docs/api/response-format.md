# 响应格式

## 统一响应结构

### 成功响应

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": 1234567890,
  "traceId": "abc-123"
}
```

### 错误响应

```json
{
  "success": false,
  "code": 40001,
  "message": "Validation failed",
  "errors": [],
  "timestamp": 1234567890,
  "traceId": "abc-123"
}
```

## 分页响应

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  }
}
```

## 最佳实践

1. 保持一致性
2. 提供有用的错误信息
3. 包含元数据
4. 支持过滤和排序
