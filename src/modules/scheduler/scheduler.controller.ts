import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SchedulerService } from './scheduler.service';
import { TaskManagerService, Task } from './task-manager.service';
import { SampleTasksService } from './sample-tasks.service';
import { CreateTaskDto, UpdateCronJobDto } from './dto/scheduler.dto';
import { Public } from '../../common/decorators/auth.decorators';
import { asCronJob } from './types/cron-job.types';

@ApiTags('scheduler')
@Controller('scheduler')
@ApiBearerAuth()
export class SchedulerController {
  constructor(
    private schedulerService: SchedulerService,
    private taskManagerService: TaskManagerService,
    private sampleTasksService: SampleTasksService,
  ) {}

  /**
   * Get all cron jobs
   */
  @Get('cron-jobs')
  @Public()
  @ApiOperation({ summary: 'Get all cron jobs' })
  @ApiResponse({ status: 200, description: 'Cron jobs retrieved' })
  getCronJobs() {
    const jobs = this.schedulerService.getCronJobs();
    const jobList = [];

    for (const [name, job] of jobs.entries()) {
      const cronJob = asCronJob(job);
      if (cronJob) {
        jobList.push({
          name,
          running: cronJob.running,
          nextDates: cronJob.nextDates(3).map((d) => d.toJSDate()),
          lastDate: cronJob.lastDate(),
        });
      }
    }

    return {
      total: jobList.length,
      jobs: jobList,
    };
  }

  /**
   * Get cron job status
   */
  @Get('cron-jobs/:name')
  @Public()
  @ApiOperation({ summary: 'Get cron job status' })
  @ApiResponse({ status: 200, description: 'Cron job status retrieved' })
  getCronJobStatus(@Param('name') name: string) {
    const status = this.schedulerService.getJobStatus(name);

    if (!status.exists) {
      throw new HttpException('Cron job not found', HttpStatus.NOT_FOUND);
    }

    return status;
  }

  /**
   * Start a cron job
   */
  @Post('cron-jobs/:name/start')
  @ApiOperation({ summary: 'Start a cron job' })
  @ApiResponse({ status: 200, description: 'Cron job started' })
  startCronJob(@Param('name') name: string) {
    const success = this.schedulerService.startCronJob(name);

    if (!success) {
      throw new HttpException(
        'Failed to start cron job',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { message: `Cron job ${name} started` };
  }

  /**
   * Stop a cron job
   */
  @Post('cron-jobs/:name/stop')
  @ApiOperation({ summary: 'Stop a cron job' })
  @ApiResponse({ status: 200, description: 'Cron job stopped' })
  stopCronJob(@Param('name') name: string) {
    const success = this.schedulerService.stopCronJob(name);

    if (!success) {
      throw new HttpException(
        'Failed to stop cron job',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { message: `Cron job ${name} stopped` };
  }

  /**
   * Update cron job schedule
   */
  @Put('cron-jobs/:name')
  @ApiOperation({ summary: 'Update cron job schedule' })
  @ApiResponse({ status: 200, description: 'Cron job updated' })
  updateCronJob(@Param('name') name: string, @Body() dto: UpdateCronJobDto) {
    const success = this.schedulerService.updateCronJob(name, dto.pattern);

    if (!success) {
      throw new HttpException(
        'Failed to update cron job',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      message: `Cron job ${name} updated`,
      pattern: dto.pattern,
    };
  }

  /**
   * Get all intervals
   */
  @Get('intervals')
  @Public()
  @ApiOperation({ summary: 'Get all intervals' })
  @ApiResponse({ status: 200, description: 'Intervals retrieved' })
  getIntervals() {
    const intervals = this.schedulerService.getIntervals();

    return {
      total: intervals.length,
      intervals,
    };
  }

  /**
   * Get all timeouts
   */
  @Get('timeouts')
  @Public()
  @ApiOperation({ summary: 'Get all timeouts' })
  @ApiResponse({ status: 200, description: 'Timeouts retrieved' })
  getTimeouts() {
    const timeouts = this.schedulerService.getTimeouts();

    return {
      total: timeouts.length,
      timeouts,
    };
  }

  /**
   * Get all tasks
   */
  @Get('tasks')
  @Public()
  @ApiOperation({ summary: 'Get all managed tasks' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  getTasks(
    @Query('type') type?: 'cron' | 'interval' | 'timeout',
    @Query('status') status?: 'active' | 'paused' | 'completed',
  ) {
    let tasks = this.taskManagerService.getAllTasks();

    if (type) {
      tasks = tasks.filter((t) => t.type === type);
    }

    if (status) {
      tasks = tasks.filter((t) => t.status === status);
    }

    return {
      total: tasks.length,
      tasks: tasks.map((task) => ({
        id: task.id,
        name: task.name,
        type: task.type,
        pattern: task.pattern,
        milliseconds: task.milliseconds,
        status: task.status,
        createdAt: task.createdAt,
        lastExecutedAt: task.lastExecutedAt,
        nextExecutionAt: task.nextExecutionAt,
        executionCount: task.executionCount,
        metadata: task.metadata,
      })),
    };
  }

  /**
   * Get task statistics
   */
  @Get('tasks/statistics')
  @Public()
  @ApiOperation({ summary: 'Get task statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  getTaskStatistics() {
    return this.taskManagerService.getTaskStatistics();
  }

  /**
   * Create a new task
   */
  @Post('tasks')
  @ApiOperation({ summary: 'Create a new scheduled task' })
  @ApiResponse({ status: 201, description: 'Task created' })
  createTask(@Body() dto: CreateTaskDto) {
    let task: Task;

    // Simple callback for demo purposes
    const callback = () => {
      console.log(`Executing task: ${dto.name}`);
    };

    switch (dto.type) {
      case 'cron':
        if (!dto.pattern) {
          throw new HttpException(
            'Pattern is required for cron tasks',
            HttpStatus.BAD_REQUEST,
          );
        }
        task = this.taskManagerService.createCronTask(
          dto.name,
          dto.pattern,
          callback,
          dto.metadata,
        );
        break;

      case 'interval':
        if (!dto.milliseconds) {
          throw new HttpException(
            'Milliseconds is required for interval tasks',
            HttpStatus.BAD_REQUEST,
          );
        }
        task = this.taskManagerService.createIntervalTask(
          dto.name,
          dto.milliseconds,
          callback,
          dto.metadata,
        );
        break;

      case 'timeout':
        if (!dto.milliseconds) {
          throw new HttpException(
            'Milliseconds is required for timeout tasks',
            HttpStatus.BAD_REQUEST,
          );
        }
        task = this.taskManagerService.createTimeoutTask(
          dto.name,
          dto.milliseconds,
          callback,
          dto.metadata,
        );
        break;

      default:
        throw new HttpException('Invalid task type', HttpStatus.BAD_REQUEST);
    }

    return {
      message: 'Task created successfully',
      task: {
        id: task.id,
        name: task.name,
        type: task.type,
        status: task.status,
        nextExecutionAt: task.nextExecutionAt,
      },
    };
  }

  /**
   * Pause a task
   */
  @Post('tasks/:id/pause')
  @ApiOperation({ summary: 'Pause a task' })
  @ApiResponse({ status: 200, description: 'Task paused' })
  pauseTask(@Param('id') id: string) {
    const success = this.taskManagerService.pauseTask(id);

    if (!success) {
      throw new HttpException('Failed to pause task', HttpStatus.BAD_REQUEST);
    }

    return { message: `Task ${id} paused` };
  }

  /**
   * Resume a task
   */
  @Post('tasks/:id/resume')
  @ApiOperation({ summary: 'Resume a task' })
  @ApiResponse({ status: 200, description: 'Task resumed' })
  resumeTask(@Param('id') id: string) {
    const success = this.taskManagerService.resumeTask(id);

    if (!success) {
      throw new HttpException('Failed to resume task', HttpStatus.BAD_REQUEST);
    }

    return { message: `Task ${id} resumed` };
  }

  /**
   * Delete a task
   */
  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted' })
  deleteTask(@Param('id') id: string) {
    const success = this.taskManagerService.deleteTask(id);

    if (!success) {
      throw new HttpException('Failed to delete task', HttpStatus.NOT_FOUND);
    }

    return { message: `Task ${id} deleted` };
  }

  /**
   * Clear completed tasks
   */
  @Delete('tasks/completed/clear')
  @ApiOperation({ summary: 'Clear all completed tasks' })
  @ApiResponse({ status: 200, description: 'Completed tasks cleared' })
  clearCompletedTasks() {
    const count = this.taskManagerService.clearCompletedTasks();

    return {
      message: `${count} completed tasks cleared`,
      count,
    };
  }

  /**
   * Enable/disable sample tasks
   */
  @Post('sample-tasks/:action')
  @ApiOperation({ summary: 'Enable or disable sample tasks' })
  @ApiResponse({ status: 200, description: 'Sample tasks status changed' })
  setSampleTasksStatus(@Param('action') action: 'enable' | 'disable') {
    const enabled = action === 'enable';
    this.sampleTasksService.setEnabled(enabled);

    return {
      message: `Sample tasks ${enabled ? 'enabled' : 'disabled'}`,
      enabled,
    };
  }
}
