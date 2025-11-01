import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configurations from './config/configuration';
import { validateEnv } from './config/env.validation';
import { loggerConfig } from './common/logger';
import { PrismaModule } from './common/prisma';

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
  providers: [AppService],
})
export class AppModule {}
