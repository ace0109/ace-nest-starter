# 部署文档 📦

本文档详细介绍如何将 ACE NestJS Starter 部署到生产环境。

## 目录

- [环境准备](#环境准备)
- [Docker 部署](#docker-部署推荐)
- [传统部署](#传统部署)
- [云平台部署](#云平台部署)
- [Nginx 配置](#nginx-配置)
- [SSL 证书](#ssl-证书配置)
- [性能优化](#性能优化)
- [监控与日志](#监控与日志)
- [故障排查](#故障排查)

## 环境准备

### 系统要求

- Linux (Ubuntu 20.04+ / CentOS 8+ 推荐)
- 内存: 最少 2GB，推荐 4GB+
- CPU: 2 核心+
- 存储: 20GB+

### 软件依赖

- Node.js 20.0.0+
- PostgreSQL 16+
- Redis 7+
- Nginx (反向代理)
- Docker & Docker Compose (容器化部署)

## Docker 部署（推荐）

### 1. 准备工作

```bash
# 克隆项目
git clone https://github.com/your-username/ace-nest-starter.git
cd ace-nest-starter

# 创建环境配置文件
cp .env.example .env.production

# 编辑生产环境配置
nano .env.production
```

### 2. 配置环境变量

```env
# .env.production 必要配置

NODE_ENV=production
PORT=3000

# 数据库（使用 Docker 内部网络）
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/ace_nest_db?schema=public

# Redis（使用 Docker 内部网络）
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT（使用强密钥，至少 64 字符）
JWT_ACCESS_SECRET=your_very_long_and_secure_access_secret_key_at_least_64_characters
JWT_REFRESH_SECRET=your_very_long_and_secure_refresh_secret_key_at_least_64_characters

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ACE Starter <noreply@yourdomain.com>

# CORS（添加你的前端域名）
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. 构建和启动

```bash
# 构建生产镜像
docker build -t ace-nest-starter:latest .

# 使用 docker-compose 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 健康检查
curl http://localhost:3000/health
```

### 4. 数据库迁移

```bash
# 首次部署运行迁移
docker-compose exec app npx prisma migrate deploy

# （可选）填充初始数据
docker-compose exec app npx prisma db seed
```

## 传统部署

### 1. 安装依赖

```bash
# 在服务器上安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2
```

### 2. 配置数据库

```bash
# 安装 PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE ace_nest_db;
CREATE USER ace_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ace_nest_db TO ace_user;
\q
```

### 3. 配置 Redis

```bash
# 安装 Redis
sudo apt install redis-server

# 配置密码
sudo nano /etc/redis/redis.conf
# 添加: requirepass your_redis_password

# 重启 Redis
sudo systemctl restart redis
```

### 4. 部署应用

```bash
# 克隆代码
git clone https://github.com/your-username/ace-nest-starter.git
cd ace-nest-starter

# 安装依赖
pnpm install

# 构建应用
pnpm build

# 运行迁移
pnpm prisma:migrate:deploy

# 使用 PM2 启动
pm2 start ecosystem.config.js
```

### 5. PM2 配置文件

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'ace-nest-starter',
      script: './dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
  ],
};
```

## Nginx 配置

### 1. 安装 Nginx

```bash
sudo apt install nginx
```

### 2. 配置反向代理

创建 `/etc/nginx/sites-available/ace-nest-starter`:

```nginx
upstream nestjs_app {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 日志
    access_log /var/log/nginx/ace-nest-access.log;
    error_log /var/log/nginx/ace-nest-error.log;

    # 文件上传大小限制
    client_max_body_size 10M;

    # API 路由
    location / {
        proxy_pass http://nestjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /socket.io/ {
        proxy_pass http://nestjs_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件
    location /uploads {
        alias /var/www/ace-nest-starter/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查端点
    location /health {
        proxy_pass http://nestjs_app;
        access_log off;
    }
}
```

### 3. 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/ace-nest-starter /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

## SSL 证书配置

### 使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo systemctl enable certbot.timer
```

## 云平台部署

### AWS EC2

1. **创建 EC2 实例**
   - 选择 Ubuntu 20.04 LTS
   - 实例类型：t3.medium（推荐）
   - 安全组：开放端口 22, 80, 443

2. **部署步骤**

   ```bash
   # 连接到实例
   ssh -i your-key.pem ubuntu@your-instance-ip

   # 按照传统部署步骤进行
   ```

### Google Cloud Platform

1. **创建 Compute Engine 实例**
   - 机器类型：e2-medium
   - 启动磁盘：Ubuntu 20.04 LTS
   - 防火墙：允许 HTTP 和 HTTPS

2. **使用 Cloud SQL**
   - 创建 PostgreSQL 实例
   - 配置私有 IP
   - 更新 DATABASE_URL

### Heroku

1. **创建 Heroku 应用**

   ```bash
   heroku create ace-nest-starter
   heroku addons:create heroku-postgresql:hobby-dev
   heroku addons:create heroku-redis:hobby-dev
   ```

2. **配置环境变量**

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_ACCESS_SECRET=your_secret
   # ... 其他配置
   ```

3. **部署**
   ```bash
   git push heroku main
   heroku run npx prisma migrate deploy
   ```

## 性能优化

### 1. 应用层优化

```javascript
// main.ts 生产环境优化
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // 减少日志输出
  });

  // 启用压缩
  app.use(compression());

  // 启用 CORS 缓存
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(','),
    credentials: true,
    maxAge: 86400, // 24小时
  });

  await app.listen(3000, '0.0.0.0'); // 监听所有网络接口
}
```

### 2. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

### 3. Redis 缓存策略

```typescript
// 缓存热点数据
@Cacheable({ ttl: 300 }) // 5分钟缓存
async getPopularPosts() {
  return this.prisma.post.findMany({
    where: { views: { gt: 1000 } },
    take: 10,
  });
}
```

## 监控与日志

### 1. PM2 监控

```bash
# 安装 PM2 监控
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# 查看监控
pm2 monit
```

### 2. 日志管理

```bash
# 配置日志轮转
sudo nano /etc/logrotate.d/ace-nest-starter

# 添加配置
/var/log/ace-nest-starter/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. 健康检查监控

使用 UptimeRobot 或 Pingdom 监控：

- 监控端点：`https://yourdomain.com/health`
- 检查间隔：5分钟
- 告警方式：邮件、短信

## 故障排查

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 查看连接数
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# 增加连接池大小
DATABASE_URL="postgresql://...?connection_limit=10"
```

#### 2. Redis 连接问题

```bash
# 测试 Redis 连接
redis-cli -h localhost -p 6379 -a your_password ping

# 查看 Redis 日志
tail -f /var/log/redis/redis-server.log
```

#### 3. 内存不足

```bash
# 查看内存使用
free -h

# 查看进程内存
pm2 monit

# 调整 Node.js 内存限制
NODE_OPTIONS="--max_old_space_size=2048" pm2 start app
```

#### 4. 端口被占用

```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 结束进程
sudo kill -9 <PID>
```

## 安全建议

1. **使用强密码**
   - 数据库密码至少 16 字符
   - JWT Secret 至少 64 字符
   - 定期更换密码

2. **限制访问**
   - 使用防火墙限制端口访问
   - 配置 IP 白名单
   - 使用 VPN 访问管理端口

3. **定期更新**

   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade

   # 更新依赖
   pnpm update
   ```

4. **备份策略**

   ```bash
   # 数据库备份
   pg_dump -U postgres ace_nest_db > backup_$(date +%Y%m%d).sql

   # 自动备份脚本
   0 2 * * * /usr/bin/pg_dump -U postgres ace_nest_db > /backup/db_$(date +\%Y\%m\%d).sql
   ```

## 部署检查清单

- [ ] 环境变量配置完整
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] JWT Secret 已更换
- [ ] CORS 配置正确
- [ ] SSL 证书已安装
- [ ] Nginx 配置正确
- [ ] 日志轮转配置
- [ ] 监控告警设置
- [ ] 备份策略实施
- [ ] 安全组/防火墙配置
- [ ] 健康检查通过

## 总结

选择合适的部署方式：

- **小型项目**：单机传统部署 + PM2
- **中型项目**：Docker Compose 部署
- **大型项目**：Kubernetes 集群部署
- **快速原型**：Heroku 等 PaaS 平台

需要帮助？查看 [项目文档](README.md) 或提交 [Issue](https://github.com/your-username/ace-nest-starter/issues)。
