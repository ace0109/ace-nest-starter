import { Module } from '@nestjs/common';
import {
  ThrottlerModule as NestThrottlerModule,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { ThrottlerService } from './throttler.service';

/**
 * 限流模块
 * 提供全局和自定义限流功能
 */
@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => {
        const throttlerConfig = configService.get<{
          useRedis?: boolean;
          global?: { ttl: number; limit: number };
        }>('throttler');
        const redisConfig = configService.get<{
          host?: string;
          port?: number;
          password?: string;
          db?: number;
        }>('redis');

        // 根据配置决定使用 Redis 还是内存存储
        const options: ThrottlerModuleOptions = {
          throttlers: [
            {
              ttl: throttlerConfig?.global?.ttl || 60,
              limit: throttlerConfig?.global?.limit || 100,
            },
          ],
        };

        if (throttlerConfig?.useRedis) {
          const redisClient = new Redis({
            host: redisConfig?.host || 'localhost',
            port: redisConfig?.port || 6379,
            password: redisConfig?.password,
            db: redisConfig?.db || 0,
          });

          // ThrottlerStorageRedisService 兼容性处理
          // 由于类型不完全兼容，这里需要强制转换
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const redisStorage = new ThrottlerStorageRedisService(
            redisClient,
          ) as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          options.storage = redisStorage;
        }

        return options;
      },
    }),
  ],
  providers: [ThrottlerService],
  exports: [NestThrottlerModule, ThrottlerService],
})
export class ThrottlerModule {}
