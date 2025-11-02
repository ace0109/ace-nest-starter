import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisTestController } from './app.redis-test.controller';
import { ThrottlerTestController } from './app.throttler-test.controller';
import { SecurityTestController } from './app.security-test.controller';
import { EmailTestController } from './app.email-test.controller';
import configurations from './config/configuration';
import { validateEnv } from './config/env.validation';
import { loggerConfig } from './common/logger';
import { PrismaModule } from './common/prisma';
import { RedisModule } from './common/redis';
import { ThrottlerModule, CustomThrottlerGuard } from './common/throttler';
import { HealthModule } from './common/health';
import { SecurityModule } from './common/security';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TraceIdMiddleware } from './common/middleware';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { RolesModule } from './modules/roles';
import { PermissionsModule } from './modules/permissions';
import { EmailModule } from './modules/email';
import { UploadModule } from './modules/upload';
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    // 日志模块
    LoggerModule.forRoot(loggerConfig),
    // 数据库模块
    PrismaModule,
    // 缓存模块
    RedisModule,
    // 限流模块
    ThrottlerModule,
    // 健康检查模块
    HealthModule,
    // 安全模块
    SecurityModule,
    // 邮件模块
    EmailModule,
    // 文件上传模块
    UploadModule,
    // 业务模块
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
  ],
  controllers: [
    AppController,
    RedisTestController,
    ThrottlerTestController,
    SecurityTestController,
    EmailTestController,
  ],
  providers: [
    AppService,
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // 全局JWT认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局限流守卫
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // 全局应用 TraceID 中间件
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
