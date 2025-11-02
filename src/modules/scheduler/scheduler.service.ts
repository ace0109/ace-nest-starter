import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  CronJobInterface,
  createCronJob,
  asCronJob,
} from './types/cron-job.types';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  /**
   * Get all cron jobs
   */
  getCronJobs(): Map<string, any> {
    const jobs = this.schedulerRegistry.getCronJobs();
    return jobs;
  }

  /**
   * Get a specific cron job
   */
  getCronJob(name: string): CronJobInterface | undefined {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      return asCronJob(job);
    } catch {
      this.logger.warn(`Cron job ${name} not found`);
      return undefined;
    }
  }

  /**
   * Add a new cron job
   */
  addCronJob(name: string, cronTime: string, callback: () => void): void {
    const job = createCronJob(cronTime, callback, undefined, true);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.schedulerRegistry.addCronJob(name, job as any);
    this.logger.log(`Cron job ${name} added with pattern: ${cronTime}`);
  }

  /**
   * Delete a cron job
   */
  deleteCronJob(name: string): boolean {
    try {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.log(`Cron job ${name} deleted`);
      return true;
    } catch {
      this.logger.warn(`Failed to delete cron job ${name}`);
      return false;
    }
  }

  /**
   * Start a cron job
   */
  startCronJob(name: string): boolean {
    const job = this.getCronJob(name);
    if (job) {
      job.start();
      this.logger.log(`Cron job ${name} started`);
      return true;
    }
    return false;
  }

  /**
   * Stop a cron job
   */
  stopCronJob(name: string): boolean {
    const job = this.getCronJob(name);
    if (job) {
      job.stop();
      this.logger.log(`Cron job ${name} stopped`);
      return true;
    }
    return false;
  }

  /**
   * Get all intervals
   */
  getIntervals(): string[] {
    return this.schedulerRegistry.getIntervals();
  }

  /**
   * Get a specific interval
   */
  getInterval(name: string): NodeJS.Timeout | undefined {
    try {
      return this.schedulerRegistry.getInterval(name) as NodeJS.Timeout;
    } catch {
      this.logger.warn(`Interval ${name} not found`);
      return undefined;
    }
  }

  /**
   * Add an interval
   */
  addInterval(name: string, milliseconds: number, callback: () => void): void {
    const interval = setInterval(callback, milliseconds);
    this.schedulerRegistry.addInterval(name, interval);
    this.logger.log(`Interval ${name} added with ${milliseconds}ms delay`);
  }

  /**
   * Delete an interval
   */
  deleteInterval(name: string): boolean {
    try {
      this.schedulerRegistry.deleteInterval(name);
      this.logger.log(`Interval ${name} deleted`);
      return true;
    } catch {
      this.logger.warn(`Failed to delete interval ${name}`);
      return false;
    }
  }

  /**
   * Get all timeouts
   */
  getTimeouts(): string[] {
    return this.schedulerRegistry.getTimeouts();
  }

  /**
   * Get a specific timeout
   */
  getTimeout(name: string): NodeJS.Timeout | undefined {
    try {
      return this.schedulerRegistry.getTimeout(name) as NodeJS.Timeout;
    } catch {
      this.logger.warn(`Timeout ${name} not found`);
      return undefined;
    }
  }

  /**
   * Add a timeout
   */
  addTimeout(name: string, milliseconds: number, callback: () => void): void {
    const timeout = setTimeout(() => {
      callback();
      // Auto-remove timeout after execution
      try {
        this.schedulerRegistry.deleteTimeout(name);
      } catch {
        // Already deleted
      }
    }, milliseconds);
    this.schedulerRegistry.addTimeout(name, timeout);
    this.logger.log(`Timeout ${name} added with ${milliseconds}ms delay`);
  }

  /**
   * Delete a timeout
   */
  deleteTimeout(name: string): boolean {
    try {
      this.schedulerRegistry.deleteTimeout(name);
      this.logger.log(`Timeout ${name} deleted`);
      return true;
    } catch {
      this.logger.warn(`Failed to delete timeout ${name}`);
      return false;
    }
  }

  /**
   * Get job status
   */
  getJobStatus(name: string): {
    exists: boolean;
    running?: boolean;
    nextDates?: Date[];
    lastDate?: Date | null;
  } {
    const job = this.getCronJob(name);
    if (!job) {
      return { exists: false };
    }

    return {
      exists: true,
      running: job.running,
      nextDates: job.nextDates(5).map((d) => d.toJSDate()),
      lastDate: job.lastDate(),
    };
  }

  /**
   * Update cron job schedule
   */
  updateCronJob(name: string, newCronTime: string): boolean {
    const job = this.getCronJob(name);
    if (job) {
      job.stop();
      const newJob = createCronJob(newCronTime, () => {}, undefined, false);
      job.setTime(newJob.cronTime);
      job.start();
      this.logger.log(
        `Cron job ${name} updated with new pattern: ${newCronTime}`,
      );
      return true;
    }
    return false;
  }
}
