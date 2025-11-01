import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configurations from './config/configuration';
import { validateEnv } from './config/env.validation';
import { loggerConfig } from './common/logger';
import { PrismaModule } from './common/prisma';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TraceIdMiddleware } from './common/middleware';

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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // 全局应用 TraceID 中间件
    consumer.apply(TraceIdMiddleware).forRoutes('*');
  }
}
