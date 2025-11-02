# REST API 约定

## 概述

RESTful API 设计规范和约定。

## URL 结构

- 使用名词复数: /users, /posts
- 嵌套资源: /users/{id}/posts
- 查询参数: ?page=1&limit=10

## HTTP 方法

- GET: 查询资源
- POST: 创建资源
- PUT: 完整更新
- PATCH: 部分更新
- DELETE: 删除资源

## 状态码

- 200: 成功
- 201: 创建成功
- 400: 请求错误
- 401: 未认证
- 403: 无权限
- 404: 未找到
- 500: 服务器错误

## 版本控制

- URL 版本: /api/v1/users
- Header 版本: API-Version: 1

## 分页

```json
{
  "data": [],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```
