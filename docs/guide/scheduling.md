# 任务调度

## 概述

ACE NestJS Starter 集成了任务调度功能，支持定时任务、周期任务和基于 Cron 表达式的复杂调度。

## 核心特性

- **Cron 任务**: 基于 Cron 表达式的调度
- **间隔任务**: 固定间隔执行
- **超时任务**: 延迟执行
- **动态任务**: 运行时添加/删除任务
- **分布式锁**: 防止重复执行

## 基础配置

### 调度模块

```typescript
// src/app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
})
export class AppModule {}
```

## 定时任务

### Cron 任务

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaskService {
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTask() {
    console.log('Daily task executed');
    await this.cleanupOldData();
  }

  @Cron('0 */30 * * * *') // 每30分钟
  async handlePeriodicTask() {
    await this.syncData();
  }
}
```

### 间隔任务

```typescript
import { Interval } from '@nestjs/schedule';

@Injectable()
export class MonitorService {
  @Interval(10000) // 每10秒
  async checkHealth() {
    await this.performHealthCheck();
  }
}
```

## 动态任务管理

```typescript
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class DynamicTaskService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  addCronJob(name: string, seconds: string) {
    const job = new CronJob(`${seconds} * * * * *`, () => {
      console.log(`Job ${name} executing`);
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  deleteCron(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    console.log(`Job ${name} deleted`);
  }

  getCrons() {
    const jobs = this.schedulerRegistry.getCronJobs();
    return Array.from(jobs.keys());
  }
}
```

## 分布式任务

使用 Redis 锁防止多实例重复执行：

```typescript
@Injectable()
export class DistributedTaskService {
  constructor(private redisService: RedisService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleDistributedTask() {
    const lockKey = 'task:hourly:lock';
    const lockAcquired = await this.redisService.setNX(lockKey, '1', 3600);

    if (!lockAcquired) {
      console.log('Task already running on another instance');
      return;
    }

    try {
      await this.executeTask();
    } finally {
      await this.redisService.del(lockKey);
    }
  }
}
```

## 任务队列集成

使用 Bull 队列处理异步任务：

```typescript
@Processor('scheduled')
export class ScheduledProcessor {
  @Process('daily-report')
  async handleDailyReport(job: Job) {
    await this.generateReport(job.data);
  }
}

// 调度任务添加到队列
@Cron(CronExpression.EVERY_DAY_AT_1AM)
async scheduleDailyReport() {
  await this.queue.add('daily-report', {
    date: new Date(),
  });
}
```

## 最佳实践

1. 避免长时间运行的任务
2. 实现幂等性
3. 添加错误处理
4. 记录执行日志
5. 监控任务状态

## 下一步

- [消息队列](./websocket.md) - 异步任务处理
- [监控](./monitoring.md) - 任务监控
- [性能优化](./performance.md) - 任务性能优化
