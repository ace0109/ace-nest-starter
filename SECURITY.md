# Security Best Practices

## 🛡️ 安全最佳实践指南

本文档提供了使用 ACE NestJS Starter 时的安全最佳实践建议。

---

## 1. HTTP 安全头 (Helmet)

### 已配置的安全头

本项目已集成 Helmet，自动配置以下安全头：

- **Content-Security-Policy (CSP)** - 防止 XSS 攻击
- **X-Frame-Options** - 防止点击劫持
- **X-Content-Type-Options** - 防止 MIME 类型嗅探
- **Strict-Transport-Security (HSTS)** - 强制 HTTPS
- **X-XSS-Protection** - 启用浏览器 XSS 过滤器
- **Referrer-Policy** - 控制 Referer 信息
- **X-Permitted-Cross-Domain-Policies** - 限制跨域策略

### 环境差异

- **开发环境**: 宽松的 CSP 策略，便于调试
- **生产环境**: 严格的 CSP 策略，最大化安全性

---

## 2. 数据脱敏

### 使用 DataMaskingService

```typescript
import { DataMaskingService } from '@common/security';

// 脱敏单个字段
const maskedEmail = dataMaskingService.maskEmail('user@example.com');
// 结果: us***@example.com

// 批量脱敏对象
const maskedUser = dataMaskingService.maskObject(user);
```

### 支持的脱敏类型

- 邮箱地址
- 手机号码
- 身份证号
- 银行卡号
- 姓名
- 地址
- IP 地址
- 密码/Token/API Key

---

## 3. 认证与授权

### JWT 最佳实践

1. **使用短期 Access Token**
   - 默认 15 分钟过期
   - 减少 Token 泄露风险

2. **使用 Refresh Token**
   - 默认 7 天过期
   - 存储在 httpOnly Cookie 中

3. **Token 黑名单**
   - 登出后将 Token 加入黑名单
   - 使用 Redis 存储黑名单

### 密码安全

1. **密码强度验证**
```typescript
const strength = securityService.checkPasswordStrength(password);
if (strength.score < 5) {
  throw new BadRequestException('密码强度不足');
}
```

2. **密码加密**
   - 使用 bcrypt 加密存储
   - Salt rounds: 10

---

## 4. 输入验证与清理

### 数据验证

使用 class-validator 和 ValidationPipe：

```typescript
export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
```

### XSS 防护

```typescript
// 清理用户输入
const sanitized = securityService.sanitizeInput(userInput);

// 清理文件名
const safeFilename = securityService.sanitizeFilename(uploadedFilename);
```

---

## 5. 限流与防护

### 限流策略

- **全局限流**: 60秒内最多100次请求
- **认证接口**: 60秒内最多5次请求
- **API接口**: 60秒内最多50次请求

### 自定义限流

```typescript
@StrictThrottle() // 60秒内最多3次
@Post('sensitive-operation')
performSensitiveOperation() {}
```

---

## 6. CORS 配置

### 生产环境

在 `.env` 中配置允许的域名：
```env
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

### 开发环境

默认允许所有来源（仅用于开发）

---

## 7. 敏感信息保护

### 环境变量

1. **永远不要提交 `.env` 文件**
2. **使用强密钥** (生产环境最少64字符)
3. **定期轮换密钥**

### 日志脱敏

已配置的日志脱敏字段：
- Authorization headers
- Cookie headers
- X-API-Key headers
- Password fields

---

## 8. 数据库安全

### SQL 注入防护

使用 Prisma ORM 自动防护 SQL 注入：

```typescript
// ✅ 安全 - 参数化查询
await prisma.user.findMany({
  where: { email: userInput }
});

// ❌ 危险 - 永远不要这样做
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### 软删除

默认启用软删除，防止数据意外丢失：

```typescript
// 软删除
await usersService.remove(id);

// 恢复
await usersService.restore(id);
```

---

## 9. 文件上传安全

### 文件类型验证

```typescript
@UseInterceptors(FileInterceptor('file', {
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('不支持的文件类型'), false);
    }
  },
}))
```

### 文件大小限制

```typescript
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}))
```

---

## 10. 会话安全

### Redis 会话存储

- 使用 Redis 存储会话
- 设置合理的 TTL
- 启用 Redis 密码认证

### CSRF 防护

```typescript
// 生成 CSRF Token
const csrfToken = securityService.generateCsrfToken();

// 验证 CSRF Token
if (!securityService.verifyCsrfToken(submittedToken, storedToken)) {
  throw new ForbiddenException('Invalid CSRF token');
}
```

---

## 11. 加密存储

### 敏感数据加密

```typescript
// 加密
const encrypted = securityService.encrypt(sensitiveData, password);

// 解密
const decrypted = securityService.decrypt(encrypted, password);
```

### 使用场景

- 存储 API 密钥
- 存储第三方服务凭证
- 存储用户敏感信息

---

## 12. 监控与审计

### 健康检查

定期监控服务健康状态：
- `/health` - 完整健康检查
- `/health/database` - 数据库健康
- `/health/redis` - Redis 健康

### 日志记录

所有请求自动记录：
- 请求 ID (TraceID)
- 请求方法和路径
- 响应状态码
- 响应时间

---

## 13. 安全检查清单

### 部署前检查

- [ ] 生产环境使用强密钥 (64+ 字符)
- [ ] 禁用 Swagger 文档
- [ ] 配置 HTTPS
- [ ] 配置 CORS 白名单
- [ ] 启用所有安全头
- [ ] 配置限流规则
- [ ] 审查日志级别
- [ ] 备份数据库

### 定期安全审查

- [ ] 更新依赖包 (`pnpm update`)
- [ ] 审查安全漏洞 (`pnpm audit`)
- [ ] 轮换密钥和证书
- [ ] 审查用户权限
- [ ] 检查异常登录
- [ ] 备份和恢复测试

---

## 14. 应急响应

### 安全事件处理

1. **立即响应**
   - 隔离受影响系统
   - 保护现场证据
   - 通知安全团队

2. **调查分析**
   - 查看日志 (TraceID)
   - 分析攻击向量
   - 评估影响范围

3. **恢复措施**
   - 修复漏洞
   - 重置密钥
   - 加强监控

---

## 15. 合规性

### GDPR 合规

- 数据脱敏
- 用户数据导出
- 账号删除（软删除）
- 数据加密存储

### 安全标准

- OWASP Top 10 防护
- CWE/SANS Top 25 防护
- PCI DSS (如涉及支付)

---

## 联系方式

如发现安全漏洞，请联系：security@example.com

**请勿公开披露未修复的漏洞**