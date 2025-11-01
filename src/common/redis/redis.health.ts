import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from './redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key = 'redis'): Promise<HealthIndicatorResult> {
    const healthCheckKey = 'health:check';
    const healthCheckValue = Date.now().toString();

    try {
      // Try to set and get a value
      await this.redisService.set(healthCheckKey, healthCheckValue, 10);
      const storedValue = await this.redisService.get<string>(healthCheckKey);

      if (storedValue !== healthCheckValue) {
        throw new Error('Redis read/write test failed');
      }

      // Clean up
      await this.redisService.del(healthCheckKey);

      return this.getStatus(key, true, {
        message: 'Redis is healthy',
      });
    } catch (error) {
      this.logger.error('Redis health check failed:', error);

      throw new HealthCheckError(
        'Redis health check failed',

        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check Redis memory usage
   */
  checkMemory(key = 'redis:memory'): HealthIndicatorResult {
    // This would require direct access to Redis client for INFO command
    // For now, return a simple healthy status

    return this.getStatus(key, true, {
      message: 'Redis memory check not implemented yet',
    });
  }

  /**
   * Check Redis connection latency
   */
  async checkLatency(
    key = 'redis:latency',
    maxLatency = 100,
  ): Promise<HealthIndicatorResult> {
    try {
      const start = Date.now();
      await this.redisService.set('latency:test', 'test', 1);
      await this.redisService.get('latency:test');
      await this.redisService.del('latency:test');
      const latency = Date.now() - start;

      if (latency > maxLatency) {
        throw new Error(`Redis latency too high: ${latency}ms`);
      }

      return this.getStatus(key, true, {
        latency: `${latency}ms`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Redis latency check failed',

        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
