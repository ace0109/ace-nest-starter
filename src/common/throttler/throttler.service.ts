import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * 限流服务
 * 提供高级限流功能
 */
@Injectable()
export class ThrottlerService {
  private readonly logger = new Logger(ThrottlerService.name);
  private redisClient: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    const throttlerConfig = this.configService.get<{
      useRedis?: boolean;
    }>('throttler');
    const redisConfig = this.configService.get<{
      host?: string;
      port?: number;
      password?: string;
      db?: number;
    }>('redis');

    if (throttlerConfig?.useRedis) {
      this.redisClient = new Redis({
        host: redisConfig?.host || 'localhost',
        port: redisConfig?.port || 6379,
        password: redisConfig?.password,
        db: redisConfig?.db || 0,
      });

      this.logger.log('Throttler service using Redis storage');
    } else {
      this.logger.log('Throttler service using memory storage');
    }
  }

  /**
   * 检查是否超过限流
   */
  async isThrottled(key: string, limit: number, ttl: number): Promise<boolean> {
    if (!this.redisClient) {
      // 使用内存存储时，返回 false（由 ThrottlerModule 处理）
      return false;
    }

    const current = await this.redisClient.incr(key);

    if (current === 1) {
      await this.redisClient.expire(key, ttl);
    }

    return current > limit;
  }

  /**
   * 获取剩余请求次数
   */
  async getRemainingRequests(key: string, limit: number): Promise<number> {
    if (!this.redisClient) {
      return limit;
    }

    const current = await this.redisClient.get(key);
    const used = current ? parseInt(current, 10) : 0;

    return Math.max(0, limit - used);
  }

  /**
   * 获取重置时间（秒）
   */
  async getResetTime(key: string): Promise<number> {
    if (!this.redisClient) {
      return 0;
    }

    const ttl = await this.redisClient.ttl(key);
    return ttl > 0 ? ttl : 0;
  }

  /**
   * 重置限流计数
   */
  async resetThrottle(key: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    await this.redisClient.del(key);
    this.logger.debug(`Reset throttle for key: ${key}`);
  }

  /**
   * 批量重置限流
   */
  async resetThrottleByPattern(pattern: string): Promise<number> {
    if (!this.redisClient) {
      return 0;
    }

    const keys = await this.redisClient.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    const result = await this.redisClient.del(...keys);
    this.logger.debug(
      `Reset ${result} throttle keys matching pattern: ${pattern}`,
    );

    return result;
  }

  /**
   * 获取限流统计信息
   */
  async getThrottleStats(
    key: string,
    limit: number,
  ): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetIn: number;
    isThrottled: boolean;
  }> {
    if (!this.redisClient) {
      return {
        current: 0,
        limit,
        remaining: limit,
        resetIn: 0,
        isThrottled: false,
      };
    }

    const current = await this.redisClient.get(key);
    const used = current ? parseInt(current, 10) : 0;
    const remaining = Math.max(0, limit - used);
    const resetIn = await this.getResetTime(key);

    return {
      current: used,
      limit,
      remaining,
      resetIn,
      isThrottled: used >= limit,
    };
  }
}
