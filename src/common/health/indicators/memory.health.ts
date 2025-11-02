import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import * as os from 'os';

/**
 * 内存健康指标
 */
@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(MemoryHealthIndicator.name);

  /**
   * 检查内存使用健康状态
   */
  isHealthy(key: string): HealthIndicatorResult {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // 计算系统内存使用率
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // 计算堆内存使用率
      const heapUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // 如果内存使用率超过 90%，认为不健康
      if (memoryUsagePercent > 90) {
        const result = this.getStatus(key, false, {
          message: 'System memory usage is too high',
          system: {
            total: this.formatBytes(totalMemory),
            free: this.formatBytes(freeMemory),
            used: this.formatBytes(usedMemory),
            usage: `${memoryUsagePercent.toFixed(2)}%`,
          },
        });
        throw new HealthCheckError('Memory usage is too high', result);
      }

      // 如果堆内存使用率超过 90%，认为不健康
      if (heapUsagePercent > 90) {
        const result = this.getStatus(key, false, {
          message: 'Heap memory usage is too high',
          heap: {
            total: this.formatBytes(memoryUsage.heapTotal),
            used: this.formatBytes(memoryUsage.heapUsed),
            usage: `${heapUsagePercent.toFixed(2)}%`,
          },
        });
        throw new HealthCheckError('Heap usage is too high', result);
      }

      // 返回健康状态
      return this.getStatus(key, true, {
        message: 'Memory usage is healthy',
        system: {
          total: this.formatBytes(totalMemory),
          free: this.formatBytes(freeMemory),
          used: this.formatBytes(usedMemory),
          usage: `${memoryUsagePercent.toFixed(2)}%`,
        },
        process: {
          rss: this.formatBytes(memoryUsage.rss),
          heapTotal: this.formatBytes(memoryUsage.heapTotal),
          heapUsed: this.formatBytes(memoryUsage.heapUsed),
          heapUsage: `${heapUsagePercent.toFixed(2)}%`,
          external: this.formatBytes(memoryUsage.external),
        },
      });
    } catch (error) {
      this.logger.error('Memory health check failed', error);

      const result = this.getStatus(key, false, {
        message: 'Unable to check memory',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HealthCheckError('Memory check failed', result);
    }
  }

  /**
   * 检查内存泄漏风险
   */
  checkMemoryLeak(key: string): HealthIndicatorResult {
    try {
      // 强制垃圾回收（如果启用了 --expose-gc）
      if (global.gc) {
        global.gc();
      }

      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed;

      // 存储历史内存使用记录
      if (!this.memoryHistory) {
        this.memoryHistory = [];
      }

      this.memoryHistory.push({
        timestamp: Date.now(),
        heapUsed,
      });

      // 只保留最近 10 次记录
      if (this.memoryHistory.length > 10) {
        this.memoryHistory.shift();
      }

      // 如果有足够的历史数据，检查内存增长趋势
      if (this.memoryHistory.length >= 5) {
        const firstRecord = this.memoryHistory[0];
        const lastRecord = this.memoryHistory[this.memoryHistory.length - 1];
        const timeDiff = lastRecord.timestamp - firstRecord.timestamp;
        const memoryDiff = lastRecord.heapUsed - firstRecord.heapUsed;

        // 计算内存增长率（每分钟）
        const growthRatePerMinute = (memoryDiff / timeDiff) * 60000;

        // 如果每分钟增长超过 10MB，可能存在内存泄漏
        const isHealthy = growthRatePerMinute < 10 * 1024 * 1024;

        return this.getStatus(key, isHealthy, {
          message: isHealthy
            ? 'No memory leak detected'
            : 'Possible memory leak detected',
          analysis: {
            samples: this.memoryHistory.length,
            timeSpan: `${(timeDiff / 1000).toFixed(2)}s`,
            memoryGrowth: this.formatBytes(memoryDiff),
            growthRate: `${this.formatBytes(growthRatePerMinute)}/min`,
          },
        });
      }

      return this.getStatus(key, true, {
        message: 'Insufficient data for memory leak analysis',
        samples: this.memoryHistory.length,
      });
    } catch (error) {
      this.logger.error('Memory leak check failed', error);

      return this.getStatus(key, false, {
        message: 'Unable to check for memory leaks',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 获取详细的内存诊断信息
   */
  diagnose(): Record<string, any> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();

      // 系统内存信息
      diagnostics.system = {
        total: this.formatBytes(totalMemory),
        free: this.formatBytes(freeMemory),
        used: this.formatBytes(totalMemory - freeMemory),
        usage: `${((1 - freeMemory / totalMemory) * 100).toFixed(2)}%`,
        platform: os.platform(),
        arch: os.arch(),
      };

      // 进程内存信息
      diagnostics.process = {
        pid: process.pid,
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        heapUsage: `${((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)}%`,
        external: this.formatBytes(memoryUsage.external),
        arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers || 0),
      };

      // V8 引擎信息
      if (process.versions.v8) {
        diagnostics.v8 = {
          version: process.versions.v8,
        };
      }

      diagnostics.status = 'healthy';
    } catch (error) {
      diagnostics.status = 'unhealthy';
      diagnostics.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Memory diagnosis failed', error);
    }

    return diagnostics;
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 内存历史记录
   */
  private memoryHistory: Array<{
    timestamp: number;
    heapUsed: number;
  }> = [];
}
