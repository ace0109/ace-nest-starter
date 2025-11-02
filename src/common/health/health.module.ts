import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DiskHealthIndicator } from './indicators/disk.health';

/**
 * 健康检查模块
 * 提供系统健康状态监控
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
  ],
  exports: [
    PrismaHealthIndicator,
    RedisHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
  ],
})
export class HealthModule {}
