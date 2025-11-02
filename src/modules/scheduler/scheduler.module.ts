import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { TaskManagerService } from './task-manager.service';
import { SchedulerController } from './scheduler.controller';
import { SampleTasksService } from './sample-tasks.service';

@Module({
  imports: [NestScheduleModule.forRoot()],
  controllers: [SchedulerController],
  providers: [SchedulerService, TaskManagerService, SampleTasksService],
  exports: [SchedulerService, TaskManagerService],
})
export class SchedulerModule {}
