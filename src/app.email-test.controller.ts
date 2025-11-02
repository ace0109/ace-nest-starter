import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/auth.decorators';
import {
  EmailService,
  SendEmailDto,
  SendTemplateEmailDto,
  TestEmailDto,
} from './modules/email';

/**
 * 邮件服务测试控制器
 */
@ApiTags('test-email')
@Controller('test/email')
@Public()
export class EmailTestController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * 发送测试邮件
   */
  @Post('test')
  @ApiOperation({ summary: '发送测试邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendTestEmail(@Body() dto: TestEmailDto) {
    return this.emailService.testEmailConfiguration(dto.testEmail);
  }

  /**
   * 发送欢迎邮件
   */
  @Post('welcome')
  @ApiOperation({ summary: '发送欢迎邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendWelcomeEmail(@Body() dto: { to: string; username: string }) {
    return this.emailService.sendWelcomeEmail(dto.to, dto.username);
  }

  /**
   * 发送验证邮件
   */
  @Post('verification')
  @ApiOperation({ summary: '发送验证邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendVerificationEmail(
    @Body() dto: { to: string; username: string; code?: string },
  ) {
    const code =
      dto.code || Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.emailService.sendVerificationEmail(dto.to, dto.username, code);
  }

  /**
   * 发送密码重置邮件
   */
  @Post('password-reset')
  @ApiOperation({ summary: '发送密码重置邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendPasswordResetEmail(
    @Body() dto: { to: string; username: string; token?: string },
  ) {
    const token = dto.token || Math.random().toString(36).substring(2, 15);
    return this.emailService.sendPasswordResetEmail(
      dto.to,
      dto.username,
      token,
    );
  }

  /**
   * 发送密码修改通知
   */
  @Post('password-changed')
  @ApiOperation({ summary: '发送密码修改通知' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendPasswordChangedEmail(
    @Body() dto: { to: string; username: string },
  ) {
    return this.emailService.sendPasswordChangedEmail(dto.to, dto.username);
  }

  /**
   * 发送登录提醒
   */
  @Post('login-alert')
  @ApiOperation({ summary: '发送登录提醒' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendLoginAlertEmail(
    @Body()
    dto: {
      to: string;
      username: string;
      ip?: string;
      device?: string;
      browser?: string;
      location?: string;
    },
  ) {
    const loginInfo = {
      ip: dto.ip || '192.168.1.1',
      device: dto.device || 'Windows PC',
      browser: dto.browser || 'Chrome 120.0',
      location: dto.location || 'Beijing, China',
    };
    return this.emailService.sendLoginAlertEmail(
      dto.to,
      dto.username,
      loginInfo,
    );
  }

  /**
   * 发送普通邮件
   */
  @Post('send')
  @ApiOperation({ summary: '发送普通邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.emailService.sendEmail(
      dto.to,
      dto.subject,
      dto.content,
      dto.isHtml,
    );
  }

  /**
   * 发送模板邮件
   */
  @Post('send-template')
  @ApiOperation({ summary: '发送模板邮件' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendTemplateEmail(@Body() dto: SendTemplateEmailDto) {
    return this.emailService.sendTemplateEmail(
      dto.to,
      dto.subject,
      dto.template,
      dto.context || {},
    );
  }

  /**
   * 批量发送测试
   */
  @Post('bulk')
  @ApiOperation({ summary: '批量发送邮件测试' })
  @ApiResponse({
    status: 200,
    description: '发送结果',
  })
  async sendBulkEmails(
    @Body()
    dto: {
      recipients: Array<{
        to: string;
        username: string;
      }>;
      template: string;
      batchSize?: number;
    },
  ) {
    const recipients = dto.recipients.map((r) => ({
      to: r.to,
      subject: `Test Email for ${r.username}`,
      template: dto.template || 'welcome',
      context: { username: r.username },
    }));

    return this.emailService.sendBulkEmails(
      recipients,
      dto.batchSize || 5,
      1000,
    );
  }

  /**
   * 检查邮件服务状态
   */
  @Get('status')
  @ApiOperation({ summary: '检查邮件服务状态' })
  @ApiResponse({
    status: 200,
    description: '服务状态',
  })
  checkEmailServiceStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message:
        'Email service is configured. Use test endpoint to verify connectivity.',
    };
  }
}
