# ACE NestJS Starter - 详细需求规格说明书

> 基于需求讨论结果，本文档是最终确定的技术选型和实现细节

**项目定位**: 通用后端 API 脚手架
**目标用户**: Node.js/NestJS 开发者
**核心价值**: 开箱即用、生产就绪、最佳实践

---

## 📋 技术选型总览

| 模块 | 技术方案 | 版本要求 |
|------|---------|---------|
| 框架 | NestJS | 11.x |
| 语言 | TypeScript | 5.7+ |
| 数据库 | PostgreSQL / MySQL | 待选型 |
| ORM | TypeORM / Prisma | 待选型 |
| 缓存 | Redis | 7.x |
| 日志 | Pino | Latest |
| 邮件模板 | Handlebars | Latest |
| WebSocket | Socket.io | Latest |

---

## 第一阶段：项目基础设施

### 1.1 配置管理模块

**核心库**: `@nestjs/config`

#### 配置文件组织
```
src/config/
├── configuration.ts          # 主配置入口
├── modules/
│   ├── database.config.ts   # 数据库配置
│   ├── redis.config.ts      # Redis配置
│   ├── jwt.config.ts        # JWT配置
│   ├── email.config.ts      # 邮件配置
│   ├── upload.config.ts     # 文件上传配置
│   └── app.config.ts        # 应用配置
└── validation.schema.ts     # 环境变量验证Schema
```

#### 环境配置文件
- `.env` - 本地开发配置
- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.test` - 测试环境
- `.env.example` - 配置模板

#### 验证策略
- **开发环境**: 宽松验证，缺失配置使用默认值，输出警告
- **生产环境**: 严格验证，缺失必填配置时启动失败

#### 配置示例
```typescript
// database.config.ts
export default registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: process.env.DB_SYNC === 'true', // 生产环境必须false
  logging: process.env.DB_LOGGING === 'true',
}));
```

#### 验证Schema (使用 Zod)
```typescript
import { z } from 'zod';

// Zod Schema 定义 - TypeScript-first，Schema 即类型
export const envSchema = z.object({
  // 应用配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // 数据库配置
  DATABASE_URL: z.string().url().min(1),

  // JWT 配置
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('2h'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Redis 配置
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
});

// 自动推断类型 - 无需手动定义 interface
export type Env = z.infer<typeof envSchema>;

// 验证函数
export function validateEnv(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`,
      );
      throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

// 分环境验证 - 生产环境更严格
export function createEnvSchema(env: string) {
  const baseSchema = envSchema;

  if (env === 'production') {
    // 生产环境额外验证
    return baseSchema.refine(
      (data) => data.JWT_ACCESS_SECRET.length >= 64,
      { message: 'Production JWT secret must be at least 64 characters' }
    );
  }

  return baseSchema;
}
```

**Zod vs Joi 对比**:
- ✅ **类型安全**: Zod 自动推断类型，Schema 即类型定义
- ✅ **性能更好**: Zod 性能优于 Joi，包体积更小 (57KB vs 146KB)
- ✅ **TypeScript-first**: 与 Prisma 完美配合，都是现代化 TS 工具
- ✅ **开发体验**: IDE 智能提示完美，无需手动同步类型
- ✅ **现代化**: T3 Stack、Cal.com 等知名项目使用

---

### 1.2 日志模块

**核心库**: `nestjs-pino`

#### 日志级别
- `fatal` - 致命错误
- `error` - 错误
- `warn` - 警告
- `info` - 信息
- `debug` - 调试
- `trace` - 追踪

#### 输出格式
- **开发环境**: 彩色文本格式 (pino-pretty)
- **生产环境**: JSON 结构化格式

#### 存储策略
```typescript
// 1. 控制台输出 (所有环境)
// 2. 文件存储
logs/
├── app-YYYY-MM-DD.log        # 所有日志
├── error-YYYY-MM-DD.log      # 错误日志
└── combined-YYYY-MM-DD.log   # 合并日志

// 3. 数据库存储 (可选)
// 关键操作日志存入 operation_logs 表
```

#### 请求日志内容
```typescript
{
  traceId: string,           // 请求追踪ID (UUID)
  method: string,            // HTTP方法
  url: string,               // 请求URL
  statusCode: number,        // 响应状态码
  responseTime: number,      // 响应时间(ms)
  ip: string,                // 客户端IP
  userAgent: string,         // User-Agent
  userId?: number,           // 用户ID (已登录时)
  query: object,             // Query参数
  body: object,              // Body参数 (敏感信息脱敏)
  headers: object,           // 请求头
}
```

#### 日志配置
```typescript
// logger.config.ts
export const loggerConfig = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      }
    } : undefined,
    customProps: (req) => ({
      traceId: req.id,
    }),
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  },
};
```

---

### 1.3 数据库模块

#### ORM 选型 (待开发前确认)
**候选方案**:
- **TypeORM**: 成熟稳定，装饰器风格，社区大
- **Prisma**: 类型安全强，开发体验好，性能优

#### 数据库选型 (待开发前确认)
**候选方案**:
- **PostgreSQL**: 功能强大，推荐
- **MySQL**: 普及度高
- **支持多种**: 通过配置切换

#### 迁移管理
```bash
# 生成迁移文件
npm run migration:generate -- -n CreateUserTable

# 执行迁移
npm run migration:run

# 回滚迁移
npm run migration:revert
```

#### Seeder 种子数据
```typescript
// 需要初始化的数据
1. 默认角色: Admin, User, Guest
2. 默认管理员账号
3. 基础权限配置
4. 系统配置项
```

#### 数据库配置示例
```typescript
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'password',
  database: 'ace_nest_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false, // 生产环境禁用
  logging: ['error', 'warn'],
  maxQueryExecutionTime: 1000, // 慢查询阈值(ms)
}
```

---

### 1.4 统一异常处理

#### 响应格式设计
```typescript
// 成功响应
{
  success: true,
  code: 200,
  message: '操作成功',
  data: any,
  timestamp: number,
  traceId: string,
  extend?: any,  // 可选扩展字段
}

// 错误响应
{
  success: false,
  code: 40001,           // 业务错误码
  message: '用户名已存在',
  statusCode: 400,       // HTTP状态码
  timestamp: number,
  traceId: string,
  path: string,          // 请求路径
  errors?: object[],     // 验证错误详情
  extend?: any,
}
```

#### 错误码设计
```typescript
// 混合方式: HTTP状态码 + 业务错误码
{
  // 系统级错误 1xxxx
  10001: '系统错误',
  10002: '服务不可用',

  // 认证授权错误 2xxxx
  20001: '未登录',
  20002: 'Token过期',
  20003: '无权限',

  // 用户相关错误 3xxxx
  30001: '用户不存在',
  30002: '用户名已存在',
  30003: '密码错误',

  // 业务错误 4xxxx
  40001: '参数错误',
  40002: '资源不存在',

  // 第三方服务错误 5xxxx
  50001: '邮件发送失败',
  50002: '文件上传失败',
}
```

#### 异常类层级
```typescript
// 自定义异常基类
export class BusinessException extends HttpException {
  constructor(errorCode: ErrorCode) {
    super(
      {
        success: false,
        code: errorCode.code,
        message: errorCode.message,
      },
      errorCode.statusCode,
    );
  }
}

// 具体业务异常
export class UserNotFoundException extends BusinessException {
  constructor() {
    super(ErrorCodeEnum.USER_NOT_FOUND);
  }
}
```

#### 全局异常过滤器
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 10001;

    // 处理不同类型的异常
    if (exception instanceof HttpException) {
      // HTTP异常
    } else if (exception instanceof QueryFailedError) {
      // 数据库异常
    } else {
      // 系统异常
    }

    // 统一响应格式
    response.status(status).json({
      success: false,
      code,
      message,
      statusCode: status,
      timestamp: Date.now(),
      path: request.url,
      traceId: request.id,
    });
  }
}
```

---

### 1.5 统一响应拦截器

#### Trace ID 生成
使用 `uuid` 生成请求追踪ID，在中间件中注入到 `request.id`

#### 响应拦截器
```typescript
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map(data => ({
        success: true,
        code: 200,
        message: '操作成功',
        data,
        timestamp: Date.now(),
        traceId: request.id,
      })),
    );
  }
}
```

---

## 第二阶段：认证授权体系

### 2.1 用户模块基础

#### User Entity
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) // 查询时默认不返回
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date; // 软删除
}
```

---

### 2.2 JWT 认证模块

#### Token 策略
- **Access Token**: 短期访问令牌 (可配置，默认 2 小时)
- **Refresh Token**: 长期刷新令牌 (可配置，默认 30 天)

#### Token 配置
```typescript
// jwt.config.ts
{
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
}
```

#### 认证流程
```typescript
// 1. 登录
POST /auth/login
Body: { username, password }
Response: { accessToken, refreshToken, user }

// 2. 刷新令牌
POST /auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }

// 3. 登出
POST /auth/logout
Headers: Authorization: Bearer {accessToken}
Body: { refreshToken }
// 将两个token加入Redis黑名单
```

#### Token 黑名单
```typescript
// Redis 存储
Key: `token:blacklist:${token}`
Value: userId
TTL: token剩余有效期
```

---

### 2.3 角色权限模块 (RBAC)

#### 数据模型
```typescript
// 用户 (User)
{
  id, username, email, password, roles
}

// 角色 (Role)
{
  id, name, description, permissions
}

// 权限 (Permission)
{
  id,
  resource: string,  // 资源名称: user, post, comment
  action: string,    // 操作: create, read, update, delete
  description: string
}

// 示例权限
user:create   - 创建用户
user:read     - 查看用户
user:update   - 更新用户
user:delete   - 删除用户
post:*        - 文章所有权限
```

#### 关系设计
```
User (N) -> (N) Role (N) -> (N) Permission
```

#### 预设角色
```typescript
// Admin - 超级管理员
permissions: ['*:*']  // 所有权限

// User - 普通用户
permissions: [
  'post:create',
  'post:read',
  'post:update:own',  // 只能更新自己的
  'comment:*',
]

// Guest - 游客
permissions: [
  'post:read',
  'comment:read',
]
```

---

### 2.4 权限守卫和装饰器

#### 装饰器
```typescript
// @Roles() - 角色检查
@Roles('admin', 'moderator')
@Get('users')
getUsers() {}

// @Permission() - 权限检查
@Permission('user:create')
@Post('users')
createUser() {}

// @Resource() - 资源级权限 (检查资源所有权)
@Resource('post')
@Put('posts/:id')
updatePost(@Param('id') id: number) {}
```

#### 权限守卫
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requiredPermissions = this.reflector.get('permissions', context.getHandler());

    // 检查用户是否拥有所需权限
    return this.checkPermissions(user.permissions, requiredPermissions);
  }
}
```

---

## 第三阶段：API 文档与数据验证

### 3.1 Swagger 文档集成

#### 文档配置
```typescript
const config = new DocumentBuilder()
  .setTitle('ACE NestJS Starter API')
  .setDescription('开箱即用的 NestJS 脚手架 API 文档')
  .setVersion('1.0')
  .addBearerAuth() // JWT认证
  .addTag('auth', '认证授权')
  .addTag('users', '用户管理')
  .addTag('roles', '角色管理')
  .build();
```

#### 文档内容
- ✅ DTO 模型自动生成
- ✅ 请求/响应示例数据
- ✅ 错误码说明文档
- ✅ Try it out 在线调试
- ✅ JWT Token 认证集成

#### 装饰器使用
```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '参数错误',
    schema: {
      example: {
        success: false,
        code: 40001,
        message: '用户名已存在',
      }
    }
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {}
}
```

---

### 3.2 全局数据验证管道

#### ValidationPipe 配置
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // 自动删除非白名单属性
    forbidNonWhitelisted: true, // 存在非白名单属性时抛错
    transform: true,        // 自动类型转换
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

#### DTO 验证示例
```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含大小写字母和数字',
  })
  password: string;
}
```

---

### 3.3 CORS 跨域配置

#### 配置策略
```typescript
// 开发环境 - 全开放
app.enableCors({
  origin: '*',
  credentials: true,
});

// 生产环境 - 白名单
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['https://example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600,
});
```

---

## 第四阶段：性能与安全

### 4.1 Redis 缓存模块

#### 使用场景
- ✅ Token 黑名单
- ✅ 限流记录
- ✅ 验证码存储 (邮件/短信验证码)
- 接口缓存 (可选)

#### 配置
```typescript
CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  ttl: 300, // 默认5分钟
});
```

#### 验证码存储
```typescript
// 存储验证码
Key: `captcha:email:${email}`
Value: code
TTL: 5 minutes

// 存储短信验证码
Key: `captcha:sms:${phone}`
Value: code
TTL: 5 minutes
```

---

### 4.2 限流模块

#### 全局限流配置
```typescript
ThrottlerModule.forRoot({
  ttl: 60,      // 时间窗口(秒)
  limit: 100,   // 请求次数限制
  storage: new ThrottlerStorageRedisService(redisClient),
});
```

#### 自定义装饰器
```typescript
// 跳过限流
@SkipThrottle()
@Get('health')
healthCheck() {}

// 自定义限流
@Throttle(5, 60) // 60秒内最多5次
@Post('auth/login')
login() {}
```

---

### 4.3 健康检查模块

#### 健康检查端点
```typescript
@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    // 数据库健康检查
    () => this.db.pingCheck('database'),

    // Redis健康检查
    () => this.redis.pingCheck('redis'),

    // 磁盘空间检查
    () => this.disk.checkStorage('storage', {
      path: '/',
      thresholdPercent: 0.9
    }),

    // 内存检查
    () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
  ]);
}
```

---

### 4.4 安全增强

#### 推荐安全措施
```typescript
// 1. Helmet - 安全HTTP头
app.use(helmet());

// 2. CORS白名单 (生产环境)
// 见 3.3 节

// 3. 数据脱敏
// 日志中的敏感信息
{
  password: '***',
  phone: '138****1234',
  email: 'j***@example.com',
}

// 4. 输入验证
// 通过 class-validator 防止 SQL注入、XSS
```

---

## 第五阶段：业务扩展功能

### 5.1 邮件服务模块

#### 模板引擎: Handlebars

#### 邮件模板
```
templates/
├── email/
│   ├── welcome.hbs          # 欢迎邮件
│   ├── verify-email.hbs     # 邮箱验证
│   ├── reset-password.hbs   # 重置密码
│   └── notification.hbs     # 通知邮件
```

#### 配置
```typescript
{
  transport: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  defaults: {
    from: '"ACE Nest" <noreply@example.com>',
  },
  template: {
    dir: process.cwd() + '/templates/email',
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
}
```

#### 使用示例
```typescript
await this.emailService.send({
  to: user.email,
  subject: '欢迎注册',
  template: 'welcome',
  context: {
    username: user.username,
    verifyUrl: 'https://example.com/verify?token=xxx',
  },
});
```

---

### 5.2 文件上传模块

#### 支持功能
- ✅ 单文件上传
- ✅ 多文件上传
- 文件类型验证
- 文件大小限制

#### 本地存储
```typescript
// 存储路径
uploads/
├── images/
├── documents/
└── avatars/

// Multer 配置
{
  dest: './uploads',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isValid = allowedTypes.test(file.mimetype);
    cb(null, isValid);
  },
}
```

#### 文件记录
```typescript
@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  originalName: string;

  @Column()
  filename: string;

  @Column()
  path: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

### 5.3 国际化模块

#### 支持语言
- ✅ zh-CN (中文简体)
- ✅ zh-TW (中文繁体)
- ✅ en-US (英语)

#### 语言文件
```
i18n/
├── zh-CN/
│   ├── common.json
│   ├── errors.json
│   └── validation.json
├── zh-TW/
│   └── ...
└── en-US/
    └── ...
```

#### 配置
```typescript
I18nModule.forRoot({
  fallbackLanguage: 'zh-CN',
  loaderOptions: {
    path: path.join(__dirname, '/i18n/'),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    AcceptLanguageResolver,
    new HeaderResolver(['x-lang']),
  ],
});
```

#### 使用示例
```typescript
// 在代码中
this.i18n.t('errors.USER_NOT_FOUND', { lang: 'en-US' });

// 在验证器中
@IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
username: string;
```

---

### 5.4 WebSocket 模块

#### 使用场景
- ✅ 实时通知推送

#### Socket.io 配置
```typescript
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // JWT认证
  @UseGuards(WsJwtGuard)
  handleConnection(client: Socket) {
    const user = client.handshake.auth.user;
    client.join(`user_${user.id}`);
  }
}
```

#### 事件示例
```typescript
// 服务端推送通知
this.server
  .to(`user_${userId}`)
  .emit('notification', {
    type: 'system',
    title: '系统通知',
    content: '您有新消息',
    timestamp: Date.now(),
  });
```

---

### 5.5 任务调度模块

#### 支持类型
- ✅ Cron 定时任务 (表达式调度)
- ✅ Interval 间隔任务 (固定间隔)
- ✅ Timeout 延迟任务 (延迟执行)
- ✅ 动态任务 (运行时添加/删除)

#### 示例
```typescript
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  // Cron 定时任务 - 每天凌晨1点执行
  @Cron('0 1 * * *')
  handleDailyCron() {
    this.logger.log('执行每日数据清理任务');
  }

  // Interval 间隔任务 - 每5分钟执行
  @Interval(5 * 60 * 1000)
  handleInterval() {
    this.logger.log('检查系统状态');
  }

  // Timeout 延迟任务 - 10秒后执行一次
  @Timeout(10000)
  handleTimeout() {
    this.logger.log('应用启动10秒后执行');
  }

  // 动态任务
  async addDynamicJob(name: string, cronExpression: string) {
    const job = new CronJob(cronExpression, () => {
      this.logger.log(`执行动态任务: ${name}`);
    });
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }
}
```

---

### 5.6 社交登录模块

#### 支持平台
- ✅ Google OAuth
- ✅ GitHub OAuth
- ✅ 微信登录

#### 实现方式: 策略模式

```typescript
// OAuth 策略接口
interface IOAuthStrategy {
  getAuthUrl(): string;
  getUserInfo(code: string): Promise<OAuthUser>;
}

// Google 策略
class GoogleOAuthStrategy implements IOAuthStrategy {
  getAuthUrl() {
    return 'https://accounts.google.com/o/oauth2/v2/auth?...';
  }

  async getUserInfo(code: string) {
    // 获取用户信息
  }
}

// GitHub 策略
class GitHubOAuthStrategy implements IOAuthStrategy {
  // ...
}

// 微信策略
class WechatOAuthStrategy implements IOAuthStrategy {
  // ...
}
```

#### 账号关联逻辑
- ✅ 自动创建用户 (首次登录)
- ✅ 邮箱匹配 (相同邮箱自动关联)
- 一个用户可绑定多个社交账号

#### 数据模型
```typescript
@Entity('oauth_accounts')
export class OAuthAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string; // google, github, wechat

  @Column()
  providerId: string; // 第三方用户ID

  @Column({ nullable: true })
  email: string;

  @ManyToOne(() => User, user => user.oauthAccounts)
  user: User;

  @Column('json')
  profile: object; // 原始用户信息

  @CreateDateColumn()
  createdAt: Date;
}
```

#### OAuth 流程
```typescript
// 1. 获取授权URL
GET /auth/oauth/:provider
Response: { authUrl: 'https://...' }

// 2. 回调处理
GET /auth/oauth/:provider/callback?code=xxx
// 自动创建/关联用户
Response: { accessToken, refreshToken, user }
```

---

## 第六阶段：开发运维配置

### 6.1 Docker 配置

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./uploads:/app/uploads

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ace_nest_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

### 6.2 E2E 测试完善

#### 测试覆盖范围
- ✅ 认证流程 (注册/登录/刷新令牌/登出)
- ✅ CRUD 操作 (用户/角色/权限)
- ✅ 权限检查 (角色权限验证)
- ✅ 关键业务流程

#### 测试示例
```typescript
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    // 初始化测试应用
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
      });
  });

  it('/auth/login (POST)', () => {
    // 登录测试
  });

  it('/auth/profile (GET) - with token', () => {
    // 获取个人信息
  });
});
```

---

### 6.3 代码质量工具

#### Git Hooks: Husky + Lint-staged

#### Pre-commit Hook
```json
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

#### Lint-staged 配置
```json
// package.json
{
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### Commitlint 规范: Conventional Commits
```
<type>(<scope>): <subject>

type:
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(auth): 添加 JWT 刷新令牌功能
fix(user): 修复用户注册邮箱验证问题
docs(readme): 更新安装说明
```

---

## 第七阶段：文档与交付

### 7.1 README.md
- 项目介绍
- 功能特性
- 快速开始 (安装、配置、运行)
- 环境变量说明
- API 文档地址
- 技术栈

### 7.2 部署文档
- Docker 部署
- 传统部署
- 环境配置
- 数据库迁移
- Nginx 配置

### 7.3 开发指南
- 项目结构说明
- 开发规范
- 如何添加新模块
- 如何扩展功能
- 测试指南

### 7.4 .env.example
```bash
# 应用配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=ace_nest_db
DB_SYNC=false
DB_LOGGING=false

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT配置
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# CORS配置
CORS_ORIGINS=http://localhost:3001,https://example.com

# 日志配置
LOG_LEVEL=info

# OAuth配置
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/oauth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/oauth/github/callback

WECHAT_APP_ID=
WECHAT_APP_SECRET=
```

---

## 📊 开发优先级总结

### P0 - 必须完成 (MVP)
1. 配置管理
2. 日志模块
3. 数据库模块
4. 异常处理 + 响应拦截器
5. JWT 认证
6. 基础 RBAC
7. Swagger 文档
8. 数据验证
9. Docker 配置

### P1 - 重要功能
1. Redis 缓存
2. 限流
3. 健康检查
4. 邮件服务
5. 文件上传
6. E2E 测试
7. 代码质量工具

### P2 - 增强功能
1. 国际化
2. WebSocket
3. 任务调度
4. 社交登录

---

**文档版本**: v1.0
**创建时间**: 2025-11-01
**需求确认**: ✅ 已完成
**开始开发**: 待启动
