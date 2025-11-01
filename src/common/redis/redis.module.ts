import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-yet';
import { RedisService } from './redis.service';
import { BlacklistService } from './blacklist.service';
import { CaptchaService } from './captcha.service';
import { RedisHealthIndicator } from './redis.health';
import type { RedisClientOptions } from 'redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        interface RedisConfig {
          host: string;
          port: number;
          password?: string;
          db: number;
          ttl?: number;
        }

        const redisConfig = configService.get<RedisConfig>('redis', {
          host: 'localhost',
          port: 6379,
          db: 0,
        });

        return {
          store: redisStore,
          socket: {
            host: redisConfig.host,
            port: redisConfig.port,
          },
          password: redisConfig.password,
          database: redisConfig.db,
          ttl: redisConfig.ttl ?? 300, // Default 5 minutes
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    RedisService,
    BlacklistService,
    CaptchaService,
    RedisHealthIndicator,
  ],
  exports: [
    RedisService,
    BlacklistService,
    CaptchaService,
    RedisHealthIndicator,
    CacheModule,
  ],
})
export class RedisModule {}
