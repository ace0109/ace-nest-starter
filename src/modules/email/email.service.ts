import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

/**
 * 邮件发送结果
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 邮件服务
 * 提供各种邮件发送功能
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    // 检查邮件服务是否启用
    const smtpUser = this.configService.get<string>('smtp.user', '');
    const smtpPass = this.configService.get<string>('smtp.pass', '');
    this.isEnabled = !!(smtpUser && smtpPass);

    if (!this.isEnabled) {
      this.logger.warn(
        'Email service is disabled. Please configure SMTP settings.',
      );
    }
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(to: string, username: string): Promise<EmailResult> {
    if (!this.isEnabled) {
      this.logger.warn(`Welcome email to ${to} skipped - service disabled`);
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const result = (await this.mailerService.sendMail({
        to,
        subject: 'Welcome to ACE NestJS!',
        template: 'welcome',
        context: {
          username,
          appName: 'ACE NestJS',
          appUrl: this.configService.get<string>(
            'app.url',
            'http://localhost:3000',
          ),
          year: new Date().getFullYear(),
        },
      })) as { messageId: string };

      this.logger.log(`Welcome email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送邮箱验证邮件
   */
  async sendVerificationEmail(
    to: string,
    username: string,
    verificationCode: string,
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      this.logger.warn(
        `Verification email to ${to} skipped - service disabled`,
      );
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const appUrl = this.configService.get<string>(
        'app.url',
        'http://localhost:3000',
      );
      const verificationUrl = `${appUrl}/auth/verify-email?code=${verificationCode}`;

      const result = (await this.mailerService.sendMail({
        to,
        subject: 'Verify Your Email - ACE NestJS',
        template: 'email-verification',
        context: {
          username,
          verificationCode,
          verificationUrl,
          appName: 'ACE NestJS',
          expiresIn: '24 hours',
          year: new Date().getFullYear(),
        },
      })) as { messageId: string };

      this.logger.log(`Verification email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordResetEmail(
    to: string,
    username: string,
    resetToken: string,
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      this.logger.warn(
        `Password reset email to ${to} skipped - service disabled`,
      );
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const appUrl = this.configService.get<string>(
        'app.url',
        'http://localhost:3000',
      );
      const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;

      const result = (await this.mailerService.sendMail({
        to,
        subject: 'Reset Your Password - ACE NestJS',
        template: 'password-reset',
        context: {
          username,
          resetUrl,
          appName: 'ACE NestJS',
          expiresIn: '1 hour',
          year: new Date().getFullYear(),
        },
      })) as { messageId: string };

      this.logger.log(`Password reset email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送密码修改通知邮件
   */
  async sendPasswordChangedEmail(
    to: string,
    username: string,
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      this.logger.warn(
        `Password changed email to ${to} skipped - service disabled`,
      );
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const result = (await this.mailerService.sendMail({
        to,
        subject: 'Password Changed - ACE NestJS',
        template: 'password-changed',
        context: {
          username,
          appName: 'ACE NestJS',
          supportEmail: this.configService.get<string>(
            'smtp.supportEmail',
            'support@example.com',
          ),
          changedAt: new Date().toLocaleString(),
          year: new Date().getFullYear(),
        },
      })) as { messageId: string };

      this.logger.log(`Password changed notification sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send password changed email to ${to}`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送登录提醒邮件
   */
  async sendLoginAlertEmail(
    to: string,
    username: string,
    loginInfo: {
      ip: string;
      device?: string;
      browser?: string;
      location?: string;
    },
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      this.logger.warn(`Login alert email to ${to} skipped - service disabled`);
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const result = (await this.mailerService.sendMail({
        to,
        subject: 'New Login Detected - ACE NestJS',
        template: 'login-alert',
        context: {
          username,
          ...loginInfo,
          loginTime: new Date().toLocaleString(),
          appName: 'ACE NestJS',
          supportEmail: this.configService.get<string>(
            'smtp.supportEmail',
            'support@example.com',
          ),
          year: new Date().getFullYear(),
        },
      })) as { messageId: string };

      this.logger.log(`Login alert email sent to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send login alert email to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送通用邮件
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    content: string,
    isHtml = true,
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      const toStr = Array.isArray(to) ? to.join(', ') : to;
      this.logger.warn(`Email to ${toStr} skipped - service disabled`);
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const toAddresses = Array.isArray(to) ? to : [to];
      const toStr = toAddresses.join(', ');

      const result = (await this.mailerService.sendMail({
        to: toStr,
        subject,
        ...(isHtml ? { html: content } : { text: content }),
      })) as { messageId: string };

      this.logger.log(`Email sent to ${toStr}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 发送带模板的通用邮件
   */
  async sendTemplateEmail(
    to: string | string[],
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<EmailResult> {
    if (!this.isEnabled) {
      const toStr = Array.isArray(to) ? to.join(', ') : to;
      this.logger.warn(`Template email to ${toStr} skipped - service disabled`);
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const toAddresses = Array.isArray(to) ? to : [to];
      const toStr = toAddresses.join(', ');

      // 添加通用上下文
      const fullContext = {
        ...context,
        appName: 'ACE NestJS',
        year: new Date().getFullYear(),
      };

      const result = (await this.mailerService.sendMail({
        to: toStr,
        subject,
        template,
        context: fullContext,
      })) as { messageId: string };

      this.logger.log(`Template email sent to ${toStr}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send template email`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 批量发送邮件（带限流）
   */
  async sendBulkEmails(
    recipients: Array<{
      to: string;
      subject: string;
      template: string;
      context: Record<string, unknown>;
    }>,
    batchSize = 10,
    delayMs = 1000,
  ): Promise<Array<{ to: string; result: EmailResult }>> {
    if (!this.isEnabled) {
      this.logger.warn('Bulk email skipped - service disabled');
      return recipients.map((r) => ({
        to: r.to,
        result: { success: false, error: 'Email service is disabled' },
      }));
    }

    const results: Array<{ to: string; result: EmailResult }> = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (recipient) => ({
          to: recipient.to,
          result: await this.sendTemplateEmail(
            recipient.to,
            recipient.subject,
            recipient.template,
            recipient.context,
          ),
        })),
      );

      results.push(...batchResults);

      // 延迟发送，避免触发限流
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    const successCount = results.filter((r) => r.result.success).length;
    const failureCount = results.filter((r) => !r.result.success).length;

    this.logger.log(
      `Bulk email completed: ${successCount} success, ${failureCount} failure`,
    );

    return results;
  }

  /**
   * 测试邮件配置
   */
  async testEmailConfiguration(testEmail?: string): Promise<EmailResult> {
    const to =
      testEmail || this.configService.get<string>('smtp.testEmail', '');

    if (!to) {
      return {
        success: false,
        error: 'No test email address provided',
      };
    }

    if (!this.isEnabled) {
      return {
        success: false,
        error: 'Email service is disabled - check SMTP configuration',
      };
    }

    try {
      const result = (await this.mailerService.sendMail({
        to,
        subject: 'Test Email - ACE NestJS',
        html: `
          <h2>Test Email</h2>
          <p>This is a test email from ACE NestJS.</p>
          <p>If you received this email, your email configuration is working correctly!</p>
          <hr>
          <p><small>Sent at: ${new Date().toISOString()}</small></p>
        `,
      })) as { messageId: string };

      this.logger.log(`Test email sent successfully to ${to}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send test email to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
