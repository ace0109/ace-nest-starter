import { Injectable, Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { asCronJob } from './types/cron-job.types';

export interface Task {
  id: string;
  name: string;
  type: 'cron' | 'interval' | 'timeout';
  pattern?: string; // For cron jobs
  milliseconds?: number; // For intervals and timeouts
  callback: () => void | Promise<void>;
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  executionCount: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TaskManagerService {
  private readonly logger = new Logger(TaskManagerService.name);
  private tasks = new Map<string, Task>();

  constructor(private schedulerService: SchedulerService) {}

  /**
   * Create a cron task
   */
  createCronTask(
    name: string,
    pattern: string,
    callback: () => void | Promise<void>,
    metadata?: Record<string, unknown>,
  ): Task {
    const taskId = `cron_${name}_${Date.now()}`;

    const wrappedCallback = () => {
      void (async () => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.lastExecutedAt = new Date();
          task.executionCount++;
          this.logger.log(
            `Executing cron task: ${name} (${task.executionCount} executions)`,
          );

          try {
            await callback();
          } catch (error) {
            this.logger.error(`Error in cron task ${name}:`, error);
          }

          // Update next execution time
          const cronJob = asCronJob(this.schedulerService.getCronJob(taskId));
          if (cronJob) {
            const nextDates = cronJob.nextDates(1);
            if (nextDates.length > 0) {
              task.nextExecutionAt = nextDates[0].toJSDate();
            }
          }
        }
      })();
    };

    this.schedulerService.addCronJob(taskId, pattern, wrappedCallback);

    const task: Task = {
      id: taskId,
      name,
      type: 'cron',
      pattern,
      callback: wrappedCallback,
      status: 'active',
      createdAt: new Date(),
      executionCount: 0,
      metadata,
    };

    // Set initial next execution time
    const cronJob = asCronJob(this.schedulerService.getCronJob(taskId));
    if (cronJob) {
      const nextDates = cronJob.nextDates(1);
      if (nextDates.length > 0) {
        task.nextExecutionAt = nextDates[0].toJSDate();
      }
    }

    this.tasks.set(taskId, task);
    this.logger.log(`Created cron task: ${name} with pattern: ${pattern}`);

    return task;
  }

  /**
   * Create an interval task
   */
  createIntervalTask(
    name: string,
    milliseconds: number,
    callback: () => void | Promise<void>,
    metadata?: Record<string, unknown>,
  ): Task {
    const taskId = `interval_${name}_${Date.now()}`;

    const wrappedCallback = () => {
      void (async () => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.lastExecutedAt = new Date();
          task.executionCount++;
          task.nextExecutionAt = new Date(Date.now() + milliseconds);
          this.logger.log(
            `Executing interval task: ${name} (${task.executionCount} executions)`,
          );

          try {
            await callback();
          } catch (error) {
            this.logger.error(`Error in interval task ${name}:`, error);
          }
        }
      })();
    };

    this.schedulerService.addInterval(taskId, milliseconds, wrappedCallback);

    const task: Task = {
      id: taskId,
      name,
      type: 'interval',
      milliseconds,
      callback: wrappedCallback,
      status: 'active',
      createdAt: new Date(),
      nextExecutionAt: new Date(Date.now() + milliseconds),
      executionCount: 0,
      metadata,
    };

    this.tasks.set(taskId, task);
    this.logger.log(
      `Created interval task: ${name} with ${milliseconds}ms interval`,
    );

    return task;
  }

  /**
   * Create a timeout task
   */
  createTimeoutTask(
    name: string,
    milliseconds: number,
    callback: () => void | Promise<void>,
    metadata?: Record<string, unknown>,
  ): Task {
    const taskId = `timeout_${name}_${Date.now()}`;

    const wrappedCallback = () => {
      void (async () => {
        const task = this.tasks.get(taskId);
        if (task) {
          task.lastExecutedAt = new Date();
          task.executionCount++;
          task.status = 'completed';
          this.logger.log(`Executing timeout task: ${name}`);

          try {
            await callback();
          } catch (error) {
            this.logger.error(`Error in timeout task ${name}:`, error);
          }
        }
      })();
    };

    this.schedulerService.addTimeout(taskId, milliseconds, wrappedCallback);

    const task: Task = {
      id: taskId,
      name,
      type: 'timeout',
      milliseconds,
      callback: wrappedCallback,
      status: 'active',
      createdAt: new Date(),
      nextExecutionAt: new Date(Date.now() + milliseconds),
      executionCount: 0,
      metadata,
    };

    this.tasks.set(taskId, task);
    this.logger.log(
      `Created timeout task: ${name} with ${milliseconds}ms delay`,
    );

    return task;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get tasks by name
   */
  getTasksByName(name: string): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.name === name);
  }

  /**
   * Get tasks by type
   */
  getTasksByType(type: 'cron' | 'interval' | 'timeout'): Task[] {
    return Array.from(this.tasks.values()).filter((task) => task.type === type);
  }

  /**
   * Pause a task
   */
  pauseTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status === 'completed') {
      return false;
    }

    let success = false;

    switch (task.type) {
      case 'cron':
        success = this.schedulerService.stopCronJob(taskId);
        break;
      case 'interval':
        success = this.schedulerService.deleteInterval(taskId);
        break;
      case 'timeout':
        success = this.schedulerService.deleteTimeout(taskId);
        break;
    }

    if (success) {
      task.status = 'paused';
      this.logger.log(`Task ${task.name} paused`);
    }

    return success;
  }

  /**
   * Resume a task
   */
  resumeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') {
      return false;
    }

    let success = false;

    switch (task.type) {
      case 'cron':
        if (task.pattern) {
          // Wrap the callback to handle promise properly
          const wrappedCronCallback = () => {
            void Promise.resolve(task.callback()).catch((error) => {
              this.logger.error(
                `Error in resumed cron task ${task.name}:`,
                error,
              );
            });
          };
          this.schedulerService.addCronJob(
            taskId,
            task.pattern,
            wrappedCronCallback,
          );
          success = true;
        }
        break;
      case 'interval':
        if (task.milliseconds) {
          // Wrap the callback to handle promise properly
          const wrappedIntervalCallback = () => {
            void Promise.resolve(task.callback()).catch((error) => {
              this.logger.error(
                `Error in resumed interval task ${task.name}:`,
                error,
              );
            });
          };
          this.schedulerService.addInterval(
            taskId,
            task.milliseconds,
            wrappedIntervalCallback,
          );
          success = true;
        }
        break;
      case 'timeout':
        // Timeouts can't be resumed once paused
        success = false;
        break;
    }

    if (success) {
      task.status = 'active';
      this.logger.log(`Task ${task.name} resumed`);
    }

    return success;
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    let success = false;

    switch (task.type) {
      case 'cron':
        success = this.schedulerService.deleteCronJob(taskId);
        break;
      case 'interval':
        success = this.schedulerService.deleteInterval(taskId);
        break;
      case 'timeout':
        success = this.schedulerService.deleteTimeout(taskId);
        break;
    }

    if (success || task.status === 'completed') {
      this.tasks.delete(taskId);
      this.logger.log(`Task ${task.name} deleted`);
      return true;
    }

    return false;
  }

  /**
   * Update task metadata
   */
  updateTaskMetadata(
    taskId: string,
    metadata: Record<string, unknown>,
  ): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.metadata = { ...task.metadata, ...metadata };
      return true;
    }
    return false;
  }

  /**
   * Get task statistics
   */
  getTaskStatistics(): {
    total: number;
    active: number;
    paused: number;
    completed: number;
    byType: {
      cron: number;
      interval: number;
      timeout: number;
    };
  } {
    const tasks = this.getAllTasks();

    return {
      total: tasks.length,
      active: tasks.filter((t) => t.status === 'active').length,
      paused: tasks.filter((t) => t.status === 'paused').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      byType: {
        cron: tasks.filter((t) => t.type === 'cron').length,
        interval: tasks.filter((t) => t.type === 'interval').length,
        timeout: tasks.filter((t) => t.type === 'timeout').length,
      },
    };
  }

  /**
   * Clear completed tasks
   */
  clearCompletedTasks(): number {
    const completedTasks = Array.from(this.tasks.values()).filter(
      (task) => task.status === 'completed',
    );

    completedTasks.forEach((task) => {
      this.tasks.delete(task.id);
    });

    this.logger.log(`Cleared ${completedTasks.length} completed tasks`);
    return completedTasks.length;
  }
}
