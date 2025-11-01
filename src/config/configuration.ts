import { registerAs } from '@nestjs/config';

/**
 * 应用配置
 * 基础应用设置
 */
export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3001',
  ],
}));

/**
 * 数据库配置
 * Prisma 使用 DATABASE_URL
 */
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

/**
 * JWT 配置
 * Access Token 和 Refresh Token 配置
 */
export const jwtConfig = registerAs('jwt', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
}));

/**
 * Redis 配置
 * 缓存和会话存储
 */
export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
}));

/**
 * SMTP 邮件配置
 * NodeMailer 配置
 */
export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || 'noreply@example.com',
}));

/**
 * 日志配置
 * Pino 日志级别
 */
export const logConfig = registerAs('log', () => ({
  level: process.env.LOG_LEVEL || 'info',
}));

/**
 * OAuth 配置
 * 社交登录配置
 */
export const oauthConfig = registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
}));

/**
 * 导出所有配置
 */
export default [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  smtpConfig,
  logConfig,
  oauthConfig,
];
