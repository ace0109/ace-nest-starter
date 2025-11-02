# 📚 Redis Commander 使用指南

## 🎯 什么是 Redis Commander？

Redis Commander 是一个基于 Web 的 Redis 数据库管理工具，提供了直观的用户界面来查看和管理 Redis 数据。

### 对比 Redis CLI vs Redis Commander：

| 功能         | Redis CLI    | Redis Commander |
| ------------ | ------------ | --------------- |
| **使用方式** | 命令行       | Web 界面        |
| **数据展示** | 文本输出     | 可视化树形结构  |
| **操作难度** | 需要记住命令 | 点击操作        |
| **批量操作** | 需要脚本     | 界面选择        |
| **数据导出** | 手动复制     | 一键导出        |
| **适合人群** | 开发者       | 所有人          |

## 🚀 访问 Redis Commander

1. **访问地址**: http://localhost:8081
2. **无需登录**（开发环境）
3. **自动连接到本地 Redis**

## 📊 界面功能介绍

### 1. 左侧树形结构

```
📁 local (Redis 连接)
  ├── 📁 user:1:*        (用户数据)
  │   ├── 📄 user:1:name
  │   ├── 📄 user:1:email
  │   └── 📊 user:1:profile
  ├── 📁 config:*        (配置数据)
  ├── 📁 cache:*         (缓存数据)
  └── 📁 blacklist:*     (黑名单)
```

### 2. 数据类型图标

- 📄 **String** - 字符串
- 📊 **Hash** - 哈希表
- 📋 **List** - 列表
- 🔗 **Set** - 集合
- 📈 **ZSet** - 有序集合

### 3. 主要操作

#### 查看数据

- 点击任意 key 查看值
- 支持 JSON 格式化显示
- 显示 TTL（剩余时间）
- 显示数据类型和大小

#### 编辑数据

- 双击值进行编辑
- 支持添加新 key
- 修改过期时间
- 删除 key

#### 搜索功能

- 支持模糊搜索（如 `user:*`）
- 按类型筛选
- 按数据库筛选

## 💡 实用场景

### 1. 调试缓存

```bash
# 查看所有缓存 keys
cache:*

# 检查特定缓存是否存在
cache:products:page:1
```

### 2. 监控 Token 黑名单

```bash
# 查看所有被拉黑的 token
blacklist:token:*

# 检查特定 token 是否被拉黑
blacklist:token:jwt_xxx
```

### 3. 查看用户 Session

```bash
# 所有活跃 session
session:*

# 特定用户的 session
session:user:1:*
```

### 4. 验证码管理

```bash
# 查看所有验证码
captcha:*

# 检查验证码剩余时间
captcha:email:user@example.com
```

## 🛠️ 高级功能

### 导入/导出

- **导出**: 选择 keys → Export → 下载 JSON
- **导入**: Import → 选择文件 → 导入

### 批量操作

- 选择多个 keys（Ctrl/Cmd + 点击）
- 批量删除
- 批量设置 TTL

### 命令行模式

- 底部有 CLI 输入框
- 可直接执行 Redis 命令
- 查看命令历史

## 📝 开发技巧

### 1. 命名规范

使用冒号分隔命名空间，便于在 Redis Commander 中折叠查看：

```
user:1:profile      ✅ 好的命名
user_1_profile      ❌ 不便于分组
```

### 2. 添加测试数据

```bash
# 使用我们的测试脚本
docker exec ace-redis-dev redis-cli <<EOF
SET "test:string" "Hello World"
HSET "test:hash" "field1" "value1" "field2" "value2"
LPUSH "test:list" "item1" "item2" "item3"
SADD "test:set" "member1" "member2"
ZADD "test:zset" 100 "player1" 90 "player2"
EOF
```

### 3. 清理数据

```bash
# 清理特定模式的 keys
docker exec ace-redis-dev redis-cli --scan --pattern "test:*" | \
  xargs docker exec ace-redis-dev redis-cli DEL

# 或在 Redis Commander 中
# 搜索 test:* → 全选 → Delete
```

## ⚠️ 注意事项

### 开发环境

- ✅ 适合查看和调试数据
- ✅ 快速修改测试数据
- ✅ 学习 Redis 数据结构

### 生产环境

- ⚠️ 需要设置访问密码
- ⚠️ 限制可执行的命令
- ⚠️ 只读模式更安全
- ⚠️ 考虑使用 RedisInsight（官方工具）

## 🔧 配置选项

在 `docker-compose.dev.yml` 中可以配置：

```yaml
redis-commander:
  environment:
    - REDIS_HOSTS=local:redis:6379
    - HTTP_USER=admin # 添加用户名
    - HTTP_PASSWORD=secret123 # 添加密码
    - REDIS_PASSWORD=redis_pass # Redis 密码
    - READ_ONLY=false # 只读模式
```

## 🆚 其他 Redis GUI 工具对比

| 工具                              | 优点               | 缺点           | 适用场景 |
| --------------------------------- | ------------------ | -------------- | -------- |
| **Redis Commander**               | 轻量、Docker友好   | 功能相对简单   | 开发环境 |
| **RedisInsight**                  | 官方工具、功能强大 | 较重、需要安装 | 生产环境 |
| **Another Redis Desktop Manager** | 跨平台、功能丰富   | 需要安装客户端 | 日常开发 |
| **Medis**                         | Mac原生、界面美观  | 仅Mac、收费    | Mac用户  |

## 📚 快速命令

```bash
# 访问 Redis Commander
open http://localhost:8081  # Mac
xdg-open http://localhost:8081  # Linux
start http://localhost:8081  # Windows

# 查看 Redis Commander 日志
docker logs ace-redis-commander

# 重启 Redis Commander
docker restart ace-redis-commander
```
