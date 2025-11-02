import { Injectable, Logger } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const fsPromises = {
  statfs: promisify(
    fs.statfs || (() => Promise.reject(new Error('statfs not available'))),
  ),
  access: promisify(fs.access),
  writeFile: promisify(fs.writeFile),
  unlink: promisify(fs.unlink),
};

const execAsync = promisify(exec);

/**
 * 磁盘健康指标
 */
@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DiskHealthIndicator.name);

  /**
   * 检查磁盘空间健康状态
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 获取当前工作目录的磁盘信息
      const diskPath = process.cwd();
      const diskInfo = await this.getDiskInfo(diskPath);

      if (!diskInfo) {
        return this.getStatus(key, false, {
          message: 'Unable to get disk information',
        });
      }

      const usagePercent = (diskInfo.used / diskInfo.total) * 100;

      // 如果磁盘使用率超过 90%，认为不健康
      if (usagePercent > 90) {
        const result = this.getStatus(key, false, {
          message: 'Disk space is running low',
          disk: {
            path: diskPath,
            total: this.formatBytes(diskInfo.total),
            free: this.formatBytes(diskInfo.free),
            used: this.formatBytes(diskInfo.used),
            usage: `${usagePercent.toFixed(2)}%`,
          },
        });
        throw new HealthCheckError('Disk space is low', result);
      }

      // 如果可用空间少于 100MB，认为不健康
      if (diskInfo.free < 100 * 1024 * 1024) {
        const result = this.getStatus(key, false, {
          message: 'Disk free space is critically low',
          disk: {
            path: diskPath,
            total: this.formatBytes(diskInfo.total),
            free: this.formatBytes(diskInfo.free),
            used: this.formatBytes(diskInfo.used),
            usage: `${usagePercent.toFixed(2)}%`,
          },
        });
        throw new HealthCheckError('Disk free space critical', result);
      }

      return this.getStatus(key, true, {
        message: 'Disk space is healthy',
        disk: {
          path: diskPath,
          total: this.formatBytes(diskInfo.total),
          free: this.formatBytes(diskInfo.free),
          used: this.formatBytes(diskInfo.used),
          usage: `${usagePercent.toFixed(2)}%`,
        },
      });
    } catch (error) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      this.logger.error('Disk health check failed', error);

      const result = this.getStatus(key, false, {
        message: 'Unable to check disk space',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HealthCheckError('Disk check failed', result);
    }
  }

  /**
   * 检查磁盘 I/O 性能
   */
  async checkDiskIO(key: string): Promise<HealthIndicatorResult> {
    const testFile = path.join(
      process.cwd(),
      `.health-check-${Date.now()}.tmp`,
    );
    const testData = Buffer.alloc(1024 * 1024); // 1MB 测试数据

    try {
      // 测试写入性能
      const writeStart = Date.now();
      await fsPromises.writeFile(testFile, testData);
      const writeTime = Date.now() - writeStart;

      // 测试读取性能
      const readStart = Date.now();
      await fsPromises.access(testFile, fs.constants.R_OK);
      const readTime = Date.now() - readStart;

      // 清理测试文件
      await fsPromises.unlink(testFile);

      // 如果写入时间超过 1000ms，认为磁盘 I/O 缓慢
      const isHealthy = writeTime < 1000;

      return this.getStatus(key, isHealthy, {
        message: isHealthy ? 'Disk I/O is healthy' : 'Disk I/O is slow',
        performance: {
          writeTime: `${writeTime}ms`,
          readTime: `${readTime}ms`,
          testFileSize: this.formatBytes(testData.length),
        },
      });
    } catch (error) {
      // 尝试清理测试文件
      try {
        await fsPromises.unlink(testFile);
      } catch {
        // 忽略清理错误
      }

      this.logger.error('Disk I/O check failed', error);

      return this.getStatus(key, false, {
        message: 'Unable to check disk I/O',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 获取详细的磁盘诊断信息
   */
  async diagnose(): Promise<Record<string, any>> {
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
    };

    try {
      const diskPath = process.cwd();
      const diskInfo = await this.getDiskInfo(diskPath);

      if (diskInfo) {
        diagnostics.disk = {
          path: diskPath,
          total: this.formatBytes(diskInfo.total),
          free: this.formatBytes(diskInfo.free),
          used: this.formatBytes(diskInfo.used),
          usage: `${((diskInfo.used / diskInfo.total) * 100).toFixed(2)}%`,
        };
      }

      // 检查重要目录的写权限
      const importantDirs = [
        process.cwd(),
        path.join(process.cwd(), 'logs'),
        path.join(process.cwd(), 'uploads'),
        '/tmp',
      ];

      diagnostics.permissions = {};
      for (const dir of importantDirs) {
        try {
          await fsPromises.access(dir, fs.constants.W_OK);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          diagnostics.permissions[dir] = 'writable';
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          diagnostics.permissions[dir] = 'not writable';
        }
      }

      diagnostics.status = 'healthy';
    } catch (error) {
      diagnostics.status = 'unhealthy';
      diagnostics.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Disk diagnosis failed', error);
    }

    return diagnostics;
  }

  /**
   * 获取磁盘信息
   */
  private async getDiskInfo(diskPath: string): Promise<{
    total: number;
    free: number;
    used: number;
  } | null> {
    try {
      // 尝试使用 fs.statfs (Node.js 18.15+)
      if (typeof fs.statfs === 'function') {
        const stats = await fsPromises.statfs(diskPath);
        const total = stats.blocks * stats.bsize;
        const free = stats.bfree * stats.bsize;
        const used = total - free;

        return { total, free, used };
      }

      // 备用方案：使用 child_process 执行 df 命令（仅限 Unix 系统）
      if (process.platform !== 'win32') {
        const { stdout } = await execAsync(`df -k "${diskPath}"`);
        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          if (parts.length >= 4) {
            const total = parseInt(parts[1], 10) * 1024;
            const used = parseInt(parts[2], 10) * 1024;
            const free = parseInt(parts[3], 10) * 1024;

            return { total, free, used };
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to get disk info', error);
      return null;
    }
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
}
