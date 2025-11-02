import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma';

@Injectable()
export class SampleTasksService {
  private readonly logger = new Logger(SampleTasksService.name);
  private isEnabled = true;

  constructor(private prisma: PrismaService) {}

  /**
   * Enable/disable sample tasks
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logger.log(`Sample tasks ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Sample cron job - runs every 30 seconds
   */
  @Cron('*/30 * * * * *', {
    name: 'sample-cron-30s',
  })
  handleCron30Seconds(): void {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    this.logger.debug(`Sample cron job executed at ${timestamp}`);
  }

  /**
   * Database cleanup - runs every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'database-cleanup',
  })
  async handleDatabaseCleanup(): Promise<void> {
    if (!this.isEnabled) return;

    this.logger.log('Starting database cleanup task...');

    try {
      // Clean up deleted users (soft deletes older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.prisma.user.deleteMany({
        where: {
          deletedAt: {
            not: null,
            lt: thirtyDaysAgo,
          },
        },
      });

      this.logger.log(
        `Database cleanup completed. Removed ${result.count} old deleted users.`,
      );
    } catch (error) {
      this.logger.error('Database cleanup failed:', error);
    }
  }

  /**
   * Session cleanup - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'session-cleanup',
  })
  handleSessionCleanup(): void {
    if (!this.isEnabled) return;

    this.logger.log('Session cleanup task executed');
    // In a real application, this would clean up expired sessions from Redis or database
  }

  /**
   * Health check - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'health-check',
  })
  async handleHealthCheck(): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      // Check system memory
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

      this.logger.log(
        `Health check passed. Memory: ${heapUsedMB}MB/${heapTotalMB}MB`,
      );
    } catch (error) {
      this.logger.error('Health check failed:', error);
    }
  }

  /**
   * Sample interval task - runs every 10 seconds
   */
  @Interval('sample-interval', 10000)
  handleInterval(): void {
    if (!this.isEnabled) return;

    this.logger.debug('Sample interval task executed every 10 seconds');
  }

  /**
   * Sample timeout task - runs once after 5 seconds
   */
  @Timeout('sample-timeout', 5000)
  handleTimeout(): void {
    if (!this.isEnabled) return;

    this.logger.log('Sample timeout task executed after 5 seconds');
  }

  /**
   * Generate daily report - runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'daily-report',
  })
  async generateDailyReport(): Promise<void> {
    if (!this.isEnabled) return;

    this.logger.log('Generating daily report...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Count today's new users
      const newUsersCount = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      this.logger.log(
        `Daily report: ${newUsersCount} new users registered today`,
      );

      // In a real application, this could:
      // - Send email reports
      // - Generate PDF reports
      // - Store statistics in database
      // - Send notifications
    } catch (error) {
      this.logger.error('Failed to generate daily report:', error);
    }
  }

  /**
   * Weekly backup reminder - runs every Monday at 9 AM
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-backup-reminder',
  })
  handleWeeklyBackupReminder(): void {
    if (!this.isEnabled) return;

    this.logger.log(
      'Weekly backup reminder: Please ensure backups are up to date',
    );
    // In a real application, this could send notifications to administrators
  }

  /**
   * Cache warming - runs every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: 'cache-warming',
  })
  async warmCache(): Promise<void> {
    if (!this.isEnabled) return;

    this.logger.log('Starting cache warming task...');

    try {
      // Pre-load frequently accessed data into cache
      // Example: Load active users, popular content, etc.
      const activeUsers = await this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          status: true,
        },
        take: 100,
      });

      this.logger.log(
        `Cache warming completed. Loaded ${activeUsers.length} active users`,
      );
    } catch (error) {
      this.logger.error('Cache warming failed:', error);
    }
  }

  /**
   * Temporary files cleanup - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'temp-files-cleanup',
  })
  cleanupTempFiles(): void {
    if (!this.isEnabled) return;

    this.logger.log('Cleaning up temporary files...');
    // In a real application, this would clean up temporary upload files
    // For example: files older than 24 hours in the temp directory
  }
}
