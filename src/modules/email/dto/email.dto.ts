import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: '收件人邮箱', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: '邮件主题' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: '邮件内容' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: '是否为HTML格式', default: true })
  @IsOptional()
  isHtml?: boolean;
}

export class SendTemplateEmailDto {
  @ApiProperty({ description: '收件人邮箱', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: '邮件主题' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  template: string;

  @ApiProperty({
    description: '模板上下文数据',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  context?: Record<string, unknown>;
}

export class TestEmailDto {
  @ApiPropertyOptional({ description: '测试邮箱地址' })
  @IsEmail()
  @IsOptional()
  testEmail?: string;
}
