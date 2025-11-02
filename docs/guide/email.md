# 邮件服务

## 概述

ACE NestJS Starter 提供了完整的邮件服务解决方案，支持模板邮件、附件发送和邮件队列。

## 核心特性

- **多种发送方式**: SMTP、SendGrid、AWS SES
- **模板引擎**: Handlebars 模板支持
- **邮件队列**: 异步发送，失败重试
- **邮件追踪**: 发送状态追踪

## SMTP 配置

```typescript
// src/mail/mail.module.ts
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('smtp.host'),
          port: configService.get('smtp.port'),
          secure: configService.get('smtp.secure'),
          auth: {
            user: configService.get('smtp.user'),
            pass: configService.get('smtp.pass'),
          },
        },
        defaults: {
          from: configService.get('smtp.from'),
        },
        template: {
          dir: path.join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
})
export class MailModule {}
```

## 发送邮件

### 基础发送

```typescript
@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcomeEmail(user: User) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to ACE App',
      template: 'welcome',
      context: {
        name: user.username,
        confirmUrl: `https://app.com/confirm?token=${token}`,
      },
    });
  }
}
```

### 邮件模板

```handlebars
<!-- templates/welcome.hbs -->

<html>
  <head>
    <style>
      /* 邮件样式 */
    </style>
  </head>
  <body>
    <h1>Welcome {{name}}!</h1>
    <p>Thank you for joining us.</p>
    <a href='{{confirmUrl}}'>Confirm your email</a>
  </body>
</html>
```

## 邮件队列

使用 Bull 队列处理邮件发送：

```typescript
@Processor('mail')
export class MailProcessor {
  @Process('send')
  async handleSendMail(job: Job) {
    const { to, subject, template, context } = job.data;
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }
}
```

## 最佳实践

1. 使用队列异步发送
2. 实现重试机制
3. 记录发送日志
4. 防止邮件轰炸
5. 使用模板管理

## 下一步

- [任务调度](./scheduling.md) - 定时发送邮件
- [消息队列](./websocket.md) - 实时通知
- [监控](./monitoring.md) - 邮件发送监控
