import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from '../../redis';

/**
 * Redis 健康指标
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(RedisHealthIndicator.name);

  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * 检查 Redis 连接健康状态
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // 执行 PING 命令
      const pingResult = await this.redisService.ping();
      const responseTime = Date.now() - startTime;

      if (pingResult !== 'PONG') {
        const result = this.getStatus(key, false, {
          message: 'Redis ping failed',
          response: pingResult,
        });
        throw new HealthCheckError('Redis ping failed', result);
      }

      // 如果响应时间超过 1 秒，认为 Redis 响应缓慢
      if (responseTime > 1000) {
        const result = this.getStatus(key, false, {
          message: 'Redis response is slow',
          responseTime: `${responseTime}ms`,
        });
        throw new HealthCheckError('Redis is slow', result);
      }

      // 返回健康状态
      return this.getStatus(key, true, {
        message: 'Redis is healthy',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      this.logger.error('Redis health check failed', error);

      const result = this.getStatus(key, false, {
        message: 'Redis is not available',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HealthCheckError('Redis check failed', result);
    }
  }

  /**
   * 检查 Redis 内存使用情况
   */
  checkMemoryUsage(key: string): HealthIndicatorResult {
    try {
      const info = this.redisService.getInfo();

      // 解析内存信息
      const usedMemory = this.parseInfoValue(info, 'used_memory');
      const usedMemoryHuman = this.parseInfoValue(info, 'used_memory_human');
      const usedMemoryPeak = this.parseInfoValue(info, 'used_memory_peak');
      const usedMemoryPeakHuman = this.parseInfoValue(
        info,
        'used_memory_peak_human',
      );

      // 如果内存使用超过 1GB，发出警告
      const usedMemoryBytes = parseInt(usedMemory || '0', 10);
      const isHealthy = usedMemoryBytes < 1024 * 1024 * 1024; // 1GB

      return this.getStatus(key, isHealthy, {
        message: isHealthy
          ? 'Redis memory usage is normal'
          : 'Redis memory usage is high',
        memory: {
          used: usedMemoryHuman,
          usedBytes: usedMemoryBytes,
          peak: usedMemoryPeakHuman,
          peakBytes: parseInt(usedMemoryPeak || '0', 10),
        },
      });
    } catch (error) {
      this.logger.error('Failed to check Redis memory', error);

      return this.getStatus(key, false, {
        message: 'Unable to check Redis memory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 执行详细的 Redis 诊断
   */
  async diagnose(): Promise<Record<string, any>> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    try {
      // 测试基本连接
      const startTime = Date.now();
      const pingResult = await this.redisService.ping();
      diagnostics.connectionTime = `${Date.now() - startTime}ms`;
      diagnostics.connectionStatus =
        pingResult === 'PONG' ? 'connected' : 'failed';

      // 获取 Redis 信息
      const info = this.redisService.getInfo();

      // 解析服务器信息
      diagnostics.server = {
        version: this.parseInfoValue(info, 'redis_version'),
        mode: this.parseInfoValue(info, 'redis_mode'),
        os: this.parseInfoValue(info, 'os'),
        uptime: this.parseInfoValue(info, 'uptime_in_seconds'),
      };

      // 解析客户端信息
      diagnostics.clients = {
        connected: this.parseInfoValue(info, 'connected_clients'),
        blocked: this.parseInfoValue(info, 'blocked_clients'),
      };

      // 解析内存信息
      diagnostics.memory = {
        used: this.parseInfoValue(info, 'used_memory_human'),
        peak: this.parseInfoValue(info, 'used_memory_peak_human'),
        rss: this.parseInfoValue(info, 'used_memory_rss_human'),
      };

      // 解析统计信息
      diagnostics.stats = {
        totalConnections: this.parseInfoValue(
          info,
          'total_connections_received',
        ),
        totalCommands: this.parseInfoValue(info, 'total_commands_processed'),
        instantaneousOps: this.parseInfoValue(
          info,
          'instantaneous_ops_per_sec',
        ),
        keyspaceHits: this.parseInfoValue(info, 'keyspace_hits'),
        keyspaceMisses: this.parseInfoValue(info, 'keyspace_misses'),
      };

      // 获取数据库键数量
      const dbSize = this.redisService.dbSize();
      diagnostics.keys = dbSize;

      diagnostics.status = 'healthy';
    } catch (error) {
      diagnostics.status = 'unhealthy';
      diagnostics.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Redis diagnosis failed', error);
    }

    return diagnostics;
  }

  /**
   * 解析 Redis INFO 命令的值
   */
  private parseInfoValue(info: string, key: string): string | null {
    const regex = new RegExp(`^${key}:(.+)$`, 'm');
    const match = info.match(regex);
    return match ? match[1].trim() : null;
  }
}
