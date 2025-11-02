import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('smtp.host', 'smtp.gmail.com'),
          port: configService.get<number>('smtp.port', 587),
          secure: configService.get<boolean>('smtp.secure', false),
          auth: {
            user: configService.get<string>('smtp.user', ''),
            pass: configService.get<string>('smtp.pass', ''),
          },
          tls: {
            rejectUnauthorized: configService.get<boolean>(
              'smtp.tlsRejectUnauthorized',
              false,
            ),
          },
        },
        defaults: {
          from: configService.get<string>(
            'smtp.from',
            '"ACE NestJS" <noreply@example.com>',
          ),
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        // 预览邮件 (开发环境)
        preview:
          configService.get<string>('app.env') === 'development'
            ? {
                dir: 'preview-email',
                open: {
                  app: 'browser',
                  wait: false,
                },
              }
            : false,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
