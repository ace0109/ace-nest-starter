import { z } from 'zod';

/**
 * 环境变量验证 Schema
 * 使用 Zod 进行类型安全的环境变量验证
 * Schema 即类型定义，无需手动维护 interface
 */
export const envSchema = z.object({
  // ==================== 应用配置 ====================
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // ==================== 数据库配置 ====================
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
  PRISMA_LOG_LEVELS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val.split(',').map((level) => level.trim()).filter((level) => level)
        : undefined,
    ),

  // ==================== JWT 配置 ====================
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('2h'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ==================== Redis 配置 ====================
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // ==================== SMTP 邮件配置 ====================
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // ==================== CORS 配置 ====================
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : ['http://localhost:3001'])),

  // ==================== 日志配置 ====================
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),

  // ==================== OAuth 配置 ====================
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // 微信 OAuth
  WECHAT_APP_ID: z.string().optional(),
  WECHAT_APP_SECRET: z.string().optional(),

  // ==================== 文件上传配置 ====================
  UPLOAD_PATH: z.string().default('./uploads'),
  UPLOAD_MAX_FILE_SIZE: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  UPLOAD_ALLOWED_MIME_TYPES: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val.split(',')
        : [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv',
          ],
    ),
  UPLOAD_ALLOWED_EXTENSIONS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val.split(',')
        : [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp',
            '.pdf',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.txt',
            '.csv',
          ],
    ),
});

/**
 * 自动推断的环境变量类型
 * 无需手动定义 interface，与 Schema 永远保持同步
 */
export type Env = z.infer<typeof envSchema>;

/**
 * 生产环境增强验证 Schema
 * 生产环境要求更严格的安全配置
 */
const productionEnvSchema = envSchema.refine(
  (data) => {
    // 生产环境 JWT 密钥必须至少 64 位
    return (
      data.JWT_ACCESS_SECRET.length >= 64 &&
      data.JWT_REFRESH_SECRET.length >= 64
    );
  },
  {
    message:
      'Production environment requires JWT secrets to be at least 64 characters',
  },
);

/**
 * 环境变量验证函数
 * 根据环境选择不同的验证策略
 *
 * @param config - 环境变量对象
 * @returns 验证后的类型安全的环境变量
 * @throws Error 如果验证失败
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const env = config.NODE_ENV || 'development';

  try {
    // 生产环境使用增强验证
    if (env === 'production') {
      return productionEnvSchema.parse(config);
    }

    // 开发和测试环境使用基础验证
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // 格式化验证错误信息
      const messages = error.issues.map((err) => {
        const path = err.path.join('.');
        return `  - ${path}: ${err.message}`;
      });

      throw new Error(
        `❌ Environment validation failed:\n\n${messages.join('\n')}\n\n` +
          `Please check your .env file and ensure all required variables are set correctly.\n`,
      );
    }

    throw error;
  }
}

/**
 * 开发环境辅助函数 - 生成 .env.example
 * 可用于自动生成环境变量模板文件
 */
export function generateEnvExample(): string {
  return `# 应用配置
NODE_ENV=development
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://postgres:password@localhost:5432/ace_nest?schema=public

# JWT 配置
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_ACCESS_EXPIRES_IN=2h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMTP 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com

# CORS 配置
CORS_ORIGINS=http://localhost:3001,https://example.com

# 日志配置
LOG_LEVEL=info

# Google OAuth (可选)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/oauth/google/callback

# GitHub OAuth (可选)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/auth/oauth/github/callback

# 微信 OAuth (可选)
WECHAT_APP_ID=
WECHAT_APP_SECRET=
`;
}
